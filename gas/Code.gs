/**
 * 無料相談フォームの受け口（屋号のGoogleアカウントで動かす）
 * - 送信内容を、このスクリプトを作ったスプレッドシートの「申し込み」シートに追記
 * - 屋号アカウントのGmailに通知メールを送る
 */
var SHEET_NAME = '申し込み';
var HEADERS = ['受付日時', '会社名', 'ご担当者名', '連絡先', '希望日時', '相談の方法', '一番時間を取られている作業'];

function doPost(e) {
  var p = (e && e.parameter) || {};

  // 迷惑送信よけ：人には見えない欄に入力があれば、保存せずに成功扱いで返す
  if (p.website) return json_({ ok: true });

  var company = clean_(p.company, 100);
  var name = clean_(p.name, 100);
  var contact = clean_(p.contact, 200);
  if (!company || !name || !contact) return json_({ ok: false, error: 'required' });

  var row = [new Date(), company, name, contact, clean_(p.dates, 500), clean_(p.method, 50), clean_(p.task, 2000)];

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
    sh.appendRow(row);
  } finally {
    lock.releaseLock();
  }

  var body = HEADERS.slice(1).map(function (h, i) { return '■' + h + '\n' + (row[i + 1] || '（未入力）'); }).join('\n\n')
    + '\n\n一覧：' + SpreadsheetApp.getActiveSpreadsheet().getUrl();
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), '【無料相談】' + company + ' ' + name + '様', body);

  return json_({ ok: true });
}

// 先頭が = + - @ だとスプレッドシートが数式として扱うので、文字として保存する
function clean_(v, max) {
  v = String(v || '').trim().slice(0, max);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// 設定の確認用：エディタでこの関数を実行すると、テスト行とテストメールが届く
function test() {
  doPost({ parameter: { company: 'テスト工務店', name: 'テスト太郎', contact: 'test@example.com', dates: '', method: 'オンライン', task: 'テスト送信' } });
}
