/**
 * ==============================================================================
 * SISTEMA DE AUTENTICACIÓN Y EXTRACCIÓN DE CÓDIGOS OTP (GMAIL + GOOGLE SHEETS)
 * Proyecto: codigos.cybershop.lat (CYBERSHOP CYBERPUNK EDITION)
 * ==============================================================================
 */

// ENLACE DIRECTO A TU HOJA DE CÁLCULO
const SPREADSHEET_URL_O_ID = "https://docs.google.com/spreadsheets/d/1i_1VrGC0yqnTdcim2oQivb9zPRUaQmttLq7bY8z7MOQ/edit";

// NOMBRE EXACTO DE TU PESTAÑA:
const NOMBRE_PESTANA = "BASE";

// Configuración de columnas (basada en tu hoja real)
const COLS = {
  APP: 0,          // Columna A (Servicio: Netflix, HBO Max, etc.)
  TOTAL: 4,        // Columna E (Días restantes / -1 = vencido)
  PIN_CUENTA: 5,   // Columna F (PIN de cuenta opcional)
  CORREO: 6,       // Columna G (Correo asignado)
  CLAVE: 7,        // Columna H (Clave de streaming)
  CELULAR: 8,      // Columna I (Celular del cliente - Llave única)
  USR: 9,          // Columna J (Interno - NO se muestra al cliente)
  PANTALLA: 10,    // Columna K (Nombre de pantalla/perfil: Sam, Milly, etc.)
  PIN_CLIENTE: 11, // Columna L (PIN del cliente: 8888, etc.)
  FECHA_VENCE: 12  // Columna M (Fecha de vencimiento)
};

// ÚNICAS APPS PERMITIDAS PARA CÓDIGOS (Netflix, Disney, HBO Max, Amazon)
const APPS_PERMITIDAS = ['netflix', 'disney', 'hbo', 'max', 'amazon', 'prime'];

/**
 * Endpoint principal GET para la web
 */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action || 'login';
    const celular = cleanString(params.celular);
    const pin = cleanString(params.pin);

    if (!celular || !pin) {
      return jsonResponse({
        success: false,
        message: 'Por favor ingresa tu número de celular y tu PIN.'
      });
    }

    if (action === 'login' || action === 'getCodes') {
      const data = authenticateAndFetch(celular, pin);
      return jsonResponse(data);
    }

    return jsonResponse({ success: false, message: 'Acción no válida.' });

  } catch (err) {
    return jsonResponse({
      success: false,
      message: 'Error en el servidor: ' + err.toString()
    });
  }
}

/**
 * Endpoint POST por compatibilidad
 */
function doPost(e) {
  try {
    let params = {};
    if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (ex) {
        params = e.parameter || {};
      }
    } else {
      params = e ? e.parameter : {};
    }

    const celular = cleanString(params.celular);
    const pin = cleanString(params.pin);

    if (!celular || !pin) {
      return jsonResponse({
        success: false,
        message: 'Por favor ingresa tu celular y tu PIN.'
      });
    }

    const data = authenticateAndFetch(celular, pin);
    return jsonResponse(data);

  } catch (err) {
    return jsonResponse({
      success: false,
      message: 'Error interno: ' + err.toString()
    });
  }
}

/**
 * Obtiene la pestaña "BASE"
 */
function getSheet() {
  const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL_O_ID);
  return ss.getSheetByName(NOMBRE_PESTANA) || ss.getSheetByName('Pantallas') || ss.getSheets()[0];
}

/**
 * Autentica al usuario en el Sheet y busca los códigos de sus servicios en Gmail
 * - Privacidad: NO devuelve nombres personales ("Amor") ni códigos de control ("USR1147").
 * - Filtro: SOLO incluye Netflix, Disney+, HBO Max y Amazon Prime.
 * - PIN: Muestra el PIN_CLIENTE de 4 dígitos.
 */
function authenticateAndFetch(celularInput, pinInput) {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();

  const userRows = [];
  const validPins = [];

  const cleanInputPhone = cleanPhone(celularInput);
  const cleanInputPin = cleanPin(pinInput);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowCelular = cleanPhone(row[COLS.CELULAR]);

    if (rowCelular && isPhoneMatch(rowCelular, cleanInputPhone)) {
      const appName = String(row[COLS.APP]).trim();
      const slug = getAppSlug(appName);

      // Filtrar: Solo agregar si es una de las 4 apps de streaming con códigos
      if (APPS_PERMITIDAS.includes(slug)) {
        userRows.push(row);
      }

      // Recolectar todos los PINs asignados a este celular
      const cellPin = cleanPin(row[COLS.PIN_CLIENTE]);
      if (cellPin && !validPins.includes(cellPin)) {
        validPins.push(cellPin);
      }
    }
  }

  // Validaciones
  if (userRows.length === 0 && validPins.length === 0) {
    return {
      success: false,
      message: 'El número de celular no se encuentra registrado en el sistema.'
    };
  }

  // Validación multi-pin: debe coincidir con cualquiera de sus PINes registrados
  if (validPins.length > 0 && !validPins.includes(cleanInputPin)) {
    return {
      success: false,
      message: 'El PIN ingresado es incorrecto. Por favor verifica tus 4 dígitos.'
    };
  }

  // Extraer las aplicaciones asignadas (únicamente Netflix, Disney, HBO, Amazon)
  const servicesList = [];

  for (let i = 0; i < userRows.length; i++) {
    const row = userRows[i];
    const appName = String(row[COLS.APP]).trim();
    const slug = getAppSlug(appName);
    const emailAssigned = String(row[COLS.CORREO]).trim();
    const totalDays = Number(row[COLS.TOTAL]);
    const pantalla = String(row[COLS.PANTALLA] || '').trim();
    const pinCliente = cleanPin(row[COLS.PIN_CLIENTE]) || cleanInputPin;
    const fechaVence = formatDate(row[COLS.FECHA_VENCE]);
    
    const isExpired = !isNaN(totalDays) && totalDays < 0;

    let otpData = null;
    if (!isExpired && emailAssigned) {
      otpData = findLatestOtp(slug, emailAssigned);
    }

    servicesList.push({
      app: formatAppName(slug, appName),
      slug: slug,
      email: emailAssigned,
      pantalla: pantalla || 'Principal',
      pin_cliente: pinCliente,
      activo: !isExpired,
      dias_restantes: isNaN(totalDays) ? 0 : totalDays,
      fecha_vence: fechaVence,
      codigo: otpData
    });
  }

  return {
    success: true,
    usuario: {
      celular: celularInput
      // NOTA: Se eliminó intencionalmente el nombre personal y código USR por privacidad
    },
    servicios: servicesList
  };
}

/**
 * Coincidencia inteligente de teléfonos (soporta con o sin prefijo 57)
 */
function isPhoneMatch(p1, p2) {
  if (p1 === p2) return true;
  const last10_1 = p1.slice(-10);
  const last10_2 = p2.slice(-10);
  return (last10_1.length >= 10 && last10_1 === last10_2);
}

/**
 * Busca en Gmail con reglas estrictas de seguridad:
 * - Netflix: ÚNICAMENTE "Netflix: Inicio de..." (asunto: "Tu código de inicio de sesión").
 *            TOTALMENTE EXCLUIDO: Código de verificación de cuenta y código de viaje.
 * - Disney: Unifica "Disney: Passcode" y "Disney: Tu código..." (inglés y español).
 * - Amazon: "Codigo Amazon".
 * - HBO: "HBO: Codigo".
 */
function findLatestOtp(slug, targetEmail) {
  try {
    let labelQuery = '';

    switch (slug) {
      case 'netflix':
        // Seguridad estricta: SOLO inicio de sesión. NO verificación de cuenta, NO viaje.
        labelQuery = '(label:"Netflix: Inicio de..." OR subject:"Tu código de inicio de sesión") -subject:"código de verificación" -label:"Netflix: Codigo Verificac..." -label:"Netflix: Viaje"';
        break;

      case 'disney':
        // Unifica inglés (Passcode) y español (Tu código)
        labelQuery = '(label:"Disney: Passcode" OR label:"Disney: Tu código..." OR subject:"passcode" OR subject:"tu código")';
        break;

      case 'hbo':
      case 'max':
        labelQuery = '(label:"HBO: Codigo" OR from:hbomax.com OR from:max.com)';
        break;

      case 'amazon':
      case 'prime':
        labelQuery = '(label:"Codigo Amazon" OR from:amazon.com OR from:primevideo.com)';
        break;

      default:
        return null;
    }

    // Buscar correos dirigidos a esa cuenta en las últimas 24 horas
    const searchQuery = `${labelQuery} (to:${targetEmail} OR "${targetEmail}") newer_than:1d`;
    const threads = GmailApp.search(searchQuery, 0, 5);

    if (!threads || threads.length === 0) {
      return null;
    }

    return parseThreadsForOtp(threads, targetEmail, slug);

  } catch (e) {
    Logger.log('Error buscando OTP para ' + slug + ': ' + e.toString());
    return null;
  }
}

/**
 * Parsea los mensajes para extraer el código numérico y tiempo
 */
function parseThreadsForOtp(threads, targetEmail, slug) {
  const now = new Date().getTime();

  for (let i = 0; i < threads.length; i++) {
    const messages = threads[i].getMessages();
    const msg = messages[messages.length - 1];
    const subject = msg.getSubject() || '';
    const body = msg.getPlainBody() || '';
    const date = msg.getDate();
    const diffMinutes = Math.round((now - date.getTime()) / (1000 * 60));

    // Si tiene más de 6 horas, no se considera vigente
    if (diffMinutes > 360) continue;

    // Regla de seguridad extra para Netflix
    if (slug === 'netflix') {
      const lowerSub = subject.toLowerCase();
      if (lowerSub.includes('verificac') || lowerSub.includes('contraseña') || lowerSub.includes('viaje')) {
        continue; // Omitir inmediatamente por seguridad
      }
    }

    let code = null;
    let tipo = 'Código de acceso';

    if (slug === 'netflix') {
      tipo = 'Inicio de Sesión';
      const codeMatch = body.match(/\b\d{4}\b/);
      if (codeMatch) code = codeMatch[0];
    } else if (slug === 'disney') {
      tipo = 'Código Passcode Disney+';
      const codeMatch = body.match(/\b\d{6}\b/);
      if (codeMatch) code = codeMatch[0];
    } else if (slug === 'hbo' || slug === 'max') {
      tipo = 'Código de Ingreso Max';
      const codeMatch = body.match(/\b\d{6}\b/) || body.match(/\b\d{4}\b/);
      if (codeMatch) code = codeMatch[0];
    } else if (slug === 'amazon' || slug === 'prime') {
      tipo = 'Código OTP Amazon';
      const codeMatch = body.match(/\b\d{6}\b/);
      if (codeMatch) code = codeMatch[0];
    }

    if (code) {
      return {
        codigo: code,
        tipo: tipo,
        fecha: date.toISOString(),
        minutos_atras: diffMinutes,
        reciente: diffMinutes <= 15
      };
    }
  }

  return null;
}

function getAppSlug(name) {
  const n = String(name).toLowerCase();
  if (n.includes('netflix')) return 'netflix';
  if (n.includes('disney')) return 'disney';
  if (n.includes('hbo') || n.includes('max')) return 'max';
  if (n.includes('amazon') || n.includes('prime')) return 'amazon';
  return n.replace(/[^a-z0-9]/g, '');
}

function formatAppName(slug, original) {
  switch (slug) {
    case 'netflix': return 'Netflix';
    case 'disney': return 'Disney+';
    case 'max':
    case 'hbo': return 'Max';
    case 'amazon':
    case 'prime': return 'Prime Video';
    default: return original;
  }
}

function cleanString(val) {
  return val ? String(val).trim() : '';
}

function cleanPhone(val) {
  if (!val) return '';
  return String(val).replace(/[^0-9]/g, '').trim();
}

function cleanPin(val) {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d+$/.test(str) && str.length < 4) {
    return str.padStart(4, '0');
  }
  return str;
}

function formatDate(d) {
  if (!d) return '';
  if (d instanceof Date) {
    return Utilities.formatDate(d, Session.getScriptTimeZone(), 'dd-MMM-yyyy');
  }
  return String(d).trim();
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
