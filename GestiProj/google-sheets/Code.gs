/**
 * ============================================================================
 *  GestiProj — Pont Google Sheets (Google Apps Script)
 * ============================================================================
 *  Ce script transforme une Google Sheet en "base de données" pour l'application
 *  locale index.html. Il expose une application web avec 3 actions :
 *    - ping : vérifie la connexion
 *    - list : renvoie le contenu de l'onglet au format CSV (JSONP)
 *    - save : remplace le contenu de l'onglet par le CSV envoyé par l'application
 *
 *  PROCEDURE DE DEPLOIEMENT (5 minutes) : voir README.md à la racine du ZIP.
 * ============================================================================
 */

/* 1) Remplacez ce jeton par une phrase secrète de votre choix.
      Il devra être recopié TEL QUEL dans l'application (case « Jeton secret »). */
var TOKEN = 'CHANGEZ-MOI-12345';

/* 2) Nom de l'onglet utilisé. Créé automatiquement s'il n'existe pas. */
var SHEET_NAME = 'Projets';

/* En-têtes attendus (identiques à l'export CSV de l'application). */
var HEADERS = ['ID','Nom','Priorité','Responsable','Début','Durée','Fin',
               'Étapes','Progression','Statut','Description'];

/* --------------------------------------------------------------------------- */
/* Feuille de calcul                                                           */
/* --------------------------------------------------------------------------- */
function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Ouvrez ce script depuis une Google Sheet (Extensions > Apps Script).');
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#e6f4ea');
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sh.autoResizeColumns(1, HEADERS.length);
  return sh;
}

/* --------------------------------------------------------------------------- */
/* GET — utilisé par l'application en JSONP (contourne les limites CORS)       */
/* --------------------------------------------------------------------------- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var cb = p.callback || 'callback';
  var result;

  try {
    if (p.token !== TOKEN) throw new Error('Jeton invalide. Vérifiez TOKEN dans Code.gs et dans l\'application.');

    if (p.action === 'ping') {
      var sh = getSheet();
      result = { ok:true, sheet: SpreadsheetApp.getActiveSpreadsheet().getName(),
                 count: Math.max(0, sh.getLastRow() - 1) };
    } else if (p.action === 'list') {
      result = { ok:true, csv: sheetToCSV() };
    } else {
      throw new Error('Action inconnue. Utilisez action=ping ou action=list.');
    }
  } catch (err) {
    result = { ok:false, error: err.message };
  }

  // Réponse JavaScript exécutable par la balise <script> (JSONP).
  return ContentService
    .createTextOutput(cb + '(' + JSON.stringify(result) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/* --------------------------------------------------------------------------- */
/* POST — reçoit {action:'save', token:'...', csv:'...'} en text/plain          */
/* --------------------------------------------------------------------------- */
function doPost(e) {
  var result;
  try {
    var body = (e && e.postData && e.postData.contents) || '{}';
    var data = JSON.parse(body);
    if (data.token !== TOKEN) throw new Error('Jeton invalide.');
    if (data.action !== 'save') throw new Error('Action inconnue.');
    if (!data.csv) throw new Error('CSV vide.');

    var rows = parseCSV(String(data.csv), ';');
    if (!rows.length) throw new Error('Aucune ligne dans le CSV.');

    var sh = getSheet();
    sh.clearContents();
    var width = Math.max(HEADERS.length, Math.max.apply(null, rows.map(function(r){ return r.length; })));
    var padded = rows.map(function(r){
      var copy = r.slice(0, width);
      while (copy.length < width) copy.push('');
      return copy;
    });
    sh.getRange(1, 1, padded.length, width).setValues(padded);
    sh.getRange(1, 1, 1, width).setFontWeight('bold').setBackground('#e6f4ea');
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, width);

    result = { ok:true, rows: rows.length - 1, updatedAt: new Date().toISOString() };
  } catch (err) {
    result = { ok:false, error: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/* --------------------------------------------------------------------------- */
/* Conversion feuille -> CSV (séparateur ; , guillemets échappés)             */
/* --------------------------------------------------------------------------- */
function sheetToCSV() {
  var sh = getSheet();
  var lastRow = Math.max(1, sh.getLastRow());
  var lastCol = Math.max(HEADERS.length, sh.getLastColumn());
  var values = sh.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  return values.map(function(row){
    return row.map(function(v){
      v = String(v == null ? '' : v);
      return /[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(';');
  }).join('\r\n');
}

/* Parseur CSV simple mais correct (gère les guillemets et les points-virgules
   présents à l'intérieur des cellules, notamment dans la colonne Étapes). */
function parseCSV(text, sep) {
  var rows = [], row = [], cell = '', inQ = false;
  text = String(text).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i+1] === '"') { cell += '"'; i++; } else inQ = false; }
      else cell += c;
    } else if (c === '"') inQ = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(function(r){ return r.some(function(v){ return String(v).trim() !== ''; }); });
}

/* --------------------------------------------------------------------------- */
/* Facultatif : menu dans la feuille pour tester le script                     */
/* --------------------------------------------------------------------------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('GestiProj')
    .addItem('Vérifier la configuration', 'menuCheck')
    .addToUi();
}
function menuCheck() {
  var sh = getSheet();
  SpreadsheetApp.getUi().alert('GestiProj est prêt.\nOnglet : ' + SHEET_NAME +
    '\nLignes de données : ' + Math.max(0, sh.getLastRow() - 1) +
    '\nJeton : ' + TOKEN);
}
