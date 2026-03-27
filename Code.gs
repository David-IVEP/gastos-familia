// ═══════════════════════════════════════════════════════════════
// GASTOS FAMILIA — Google Apps Script Backend
// ═══════════════════════════════════════════════════════════════
//
// INSTRUCCIONES DE INSTALACIÓN:
// 1. Abre tu Google Sheet
// 2. Extensiones → Apps Script
// 3. Borra el código existente y pega este archivo completo
// 4. Guarda (Ctrl+S)
// 5. Despliega → Nueva implementación
//    - Tipo: Aplicación web
//    - Ejecutar como: Yo (tu cuenta)
//    - Quién tiene acceso: Cualquier usuario
// 6. Copia la URL que aparece y pégala en la app (⚙ → URL Web App)
// 7. La primera vez, Google pedirá autorización → acepta
//
// ESTRUCTURA DE HOJAS (se crean automáticamente):
//   gastos    | id | amount | desc | cat | person | month | year | ts
//   ingresos  | id | amount | desc | cat | person | month | year | ts
//   activos   | id | amount | desc | month | year | ts
//   pasivos   | id | amount | desc | month | year | ts
// ═══════════════════════════════════════════════════════════════

const COLLECTIONS = ['gastos', 'ingresos', 'activos', 'pasivos'];

// Cabeceras por colección
const HEADERS = {
  gastos:   ['id', 'amount', 'desc', 'cat', 'person', 'month', 'year', 'ts'],
  ingresos: ['id', 'amount', 'desc', 'cat', 'person', 'month', 'year', 'ts'],
  activos:  ['id', 'amount', 'desc', 'month', 'year', 'ts'],
  pasivos:  ['id', 'amount', 'desc', 'month', 'year', 'ts'],
};

// ───────────────────────────────────────────────────────────────
// CORS — necesario para que la app pueda conectar
// ───────────────────────────────────────────────────────────────
function setCorsHeaders(output) {
  return output
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ───────────────────────────────────────────────────────────────
// GET — leer datos o hacer ping
// ───────────────────────────────────────────────────────────────
function doGet(e) {
  const action = (e.parameter && e.parameter.action) || 'getAll';

  if (action === 'ping') {
    return setCorsHeaders(
      ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'pong' }))
        .setMimeType(ContentService.MimeType.JSON)
    );
  }

  if (action === 'getAll') {
    try {
      const data = {};
      COLLECTIONS.forEach(col => {
        data[col] = readCollection(col);
      });
      return setCorsHeaders(
        ContentService.createTextOutput(JSON.stringify({ status: 'ok', data }))
          .setMimeType(ContentService.MimeType.JSON)
      );
    } catch (err) {
      return setCorsHeaders(
        ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
          .setMimeType(ContentService.MimeType.JSON)
      );
    }
  }

  return setCorsHeaders(
    ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Acción desconocida' }))
      .setMimeType(ContentService.MimeType.JSON)
  );
}

// ───────────────────────────────────────────────────────────────
// POST — añadir o eliminar entradas
// ───────────────────────────────────────────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { action, collection, entry, id } = body;

    if (!COLLECTIONS.includes(collection)) {
      throw new Error('Colección no válida: ' + collection);
    }

    if (action === 'add') {
      addEntry(collection, entry);
      return setCorsHeaders(
        ContentService.createTextOutput(JSON.stringify({ status: 'ok', action: 'added', id: entry.id }))
          .setMimeType(ContentService.MimeType.JSON)
      );
    }

    if (action === 'delete') {
      deleteEntry(collection, id);
      return setCorsHeaders(
        ContentService.createTextOutput(JSON.stringify({ status: 'ok', action: 'deleted', id }))
          .setMimeType(ContentService.MimeType.JSON)
      );
    }

    throw new Error('Acción no válida: ' + action);

  } catch (err) {
    return setCorsHeaders(
      ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
        .setMimeType(ContentService.MimeType.JSON)
    );
  }
}

// ───────────────────────────────────────────────────────────────
// HELPERS DE HOJA
// ───────────────────────────────────────────────────────────────
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);

  // Crear hoja si no existe
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const headers = HEADERS[name] || ['id', 'amount', 'desc', 'ts'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    // Formato de cabecera
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#3D6147')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
  }

  return sheet;
}

function readCollection(name) {
  const sheet = getSheet(name);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // solo cabecera o vacío

  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  }).filter(obj => obj.id); // filtrar filas vacías
}

function addEntry(name, entry) {
  const sheet = getSheet(name);
  const headers = HEADERS[name] || Object.keys(entry);
  const row = headers.map(h => entry[h] !== undefined ? entry[h] : '');
  sheet.appendRow(row);
}

function deleteEntry(name, id) {
  const sheet = getSheet(name);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const idCol = data[0].indexOf('id');
  if (idCol === -1) return;

  // Buscar la fila con ese id (de abajo arriba para no saltar índices)
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1); // +1 porque getDataRange es base-0 pero deleteRow es base-1
      break;
    }
  }
}

// ───────────────────────────────────────────────────────────────
// WEBHOOK PARA MAKE.COM / N8N
// Endpoint especial para recibir gastos desde el bot de WhatsApp
// ───────────────────────────────────────────────────────────────
// El bot envía un POST con este formato:
// {
//   "action": "webhook",
//   "collection": "gastos",
//   "entry": {
//     "id": "...",
//     "amount": 87.5,
//     "desc": "Mercadona",
//     "cat": "alimentacion",
//     "person": "silvia",
//     "month": 2,
//     "year": 2026,
//     "ts": 1234567890
//   }
// }
// La función doPost ya maneja este caso con action="add"
// ───────────────────────────────────────────────────────────────
