/**
 * GOOGLE APPS SCRIPT BACKEND CHO KIM & THƯ 💕
 *
 * Triển khai: xem README.md (mục "Triển khai backend").
 * Thư mục Google Drive: https://drive.google.com/drive/folders/1dcyUgareKuDTIyj9xmhKKY6Uq0uC6Zuj
 *
 * Nguyên tắc:
 *  - Mọi ghi (doPost) đều là UPSERT theo id → client có thể gửi lại an toàn (outbox/retry).
 *  - Xóa là "xóa mềm" (tombstone) để thiết bị khác biết và không đồng bộ ngược lại.
 *  - Mọi ghi chạy trong LockService để các request song song không làm lệch dòng.
 *  - doGet hỗ trợ ?since=<ms> chỉ trả phần thay đổi.
 */

var FOLDER_ID = "1dcyUgareKuDTIyj9xmhKKY6Uq0uC6Zuj";
var LOCK_WAIT_MS = 20000;
var MAX_IMAGE_BYTES = 8 * 1024 * 1024;
var ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Mật mã KHÔNG nằm trong mã nguồn. Đặt tại: Project Settings → Script properties
// → thêm thuộc tính APP_PASSCODE (tối thiểu 12 ký tự, ngẫu nhiên). Thiếu thuộc tính = từ chối tất cả.
var PASSCODE_PROPERTY = "APP_PASSCODE";
var MIN_PASSCODE_LENGTH = 12;

// Cột của từng sheet. Cột mới luôn thêm vào CUỐI để sheet cũ vẫn đọc được.
var SHEET_DEFS = {
  memories: { name: "Memories", header: ["ID", "Title", "Date", "Location", "ImageUrl", "Story", "CreatedAt", "UpdatedAt", "Deleted", "PlaceId"] },
  places:   { name: "Places",   header: ["ID", "Name", "MapUrl", "TiktokUrl", "Lat", "Lng", "Notes", "Visited", "CreatedAt", "UpdatedAt", "Deleted"] },
  messages: { name: "Messages", header: ["ID", "Sender", "Text", "ImageUrl", "Timestamp", "CreatedAt"] },
  notes:    { name: "Notes",    header: ["ID", "Sender", "Text", "OpenAt", "CreatedAt", "UpdatedAt", "Deleted"] },
  period:   { name: "Period",   header: ["ID", "StartDate", "CycleLength", "DurationDays", "HistoryJson", "UpdatedAt"] },
  tasks:    { name: "Tasks",    header: ["ID", "Title", "Category", "TargetDate", "Notes", "Completed", "CreatedAt"] }
};

// ---------------------------------------------------------------------------
// Xác thực
// ---------------------------------------------------------------------------
function normalizePasscode_(value) {
  return String(value === null || value === undefined ? "" : value).trim().toLowerCase();
}

/** So sánh thời gian cố định. Fail-closed khi chưa cấu hình hoặc mật mã quá ngắn. */
function isPasscodeAuthorized_(candidate) {
  var secret = normalizePasscode_(PropertiesService.getScriptProperties().getProperty(PASSCODE_PROPERTY));
  if (secret.length < MIN_PASSCODE_LENGTH) return false;
  var given = normalizePasscode_(candidate);
  var diff = given.length ^ secret.length;
  for (var i = 0; i < secret.length; i++) {
    diff |= (given.charCodeAt(i) || 0) ^ secret.charCodeAt(i);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Tiện ích chung
// ---------------------------------------------------------------------------
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function toMillis_(value) {
  if (value instanceof Date) return value.getTime();
  var n = Number(value);
  if (n > 0) return n;
  var parsed = Date.parse(value);
  return isNaN(parsed) ? 0 : parsed;
}

function isTrue_(value) {
  return value === true || String(value).toUpperCase() === "TRUE";
}

function getSheet_(ss, def) {
  var sheet = ss.getSheetByName(def.name) || ss.insertSheet(def.name);
  if (sheet.getLastRow() === 0) sheet.appendRow(def.header);
  return sheet;
}

/** Trả về số dòng (1-based) của id, hoặc 0 nếu chưa có. Chỉ đọc cột ID. */
function findRow_(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var target = String(id).trim();
  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === target) return i + 2;
  }
  return 0;
}

function writeRow_(sheet, row, values) {
  if (row) {
    sheet.getRange(row, 1, 1, values.length).setValues([values]);
  } else {
    sheet.appendRow(values);
  }
}

function readRow_(sheet, row, width) {
  return row ? sheet.getRange(row, 1, 1, width).getValues()[0] : null;
}

function requireId_(data) {
  if (data.id === undefined || data.id === null || String(data.id).trim() === "") {
    throw new Error("Thiếu id");
  }
  return String(data.id).trim();
}

// ---------------------------------------------------------------------------
// Google Drive
// ---------------------------------------------------------------------------
function getAppFolder_() {
  try {
    return DriveApp.getFolderById(FOLDER_ID);
  } catch (e) {
    return DriveApp.getRootFolder();
  }
}

/** Lưu ảnh base64 vào Drive. Trả về URL hoặc "" nếu không hợp lệ / lỗi. */
function saveImage_(dataUrl, prefix) {
  if (!dataUrl || String(dataUrl).indexOf("data:image/") !== 0) return "";
  try {
    var contentType = dataUrl.substring(dataUrl.indexOf(":") + 1, dataUrl.indexOf(";"));
    if (ALLOWED_IMAGE_TYPES.indexOf(contentType) === -1) return "";
    var decoded = Utilities.base64Decode(dataUrl.split(",")[1]);
    if (decoded.length > MAX_IMAGE_BYTES) return "";
    var filename = prefix + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss") + ".jpg";
    var file = getAppFolder_().createFile(Utilities.newBlob(decoded, contentType, filename));
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      Logger.log("Sharing warning: " + shareErr.toString());
    }
    return "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1200";
  } catch (driveErr) {
    Logger.log("Drive Error: " + driveErr.toString());
    return "";
  }
}

/** Chỉ chuyển vào thùng rác các file nằm TRONG thư mục FOLDER_ID của ứng dụng. */
function trashFileInAppFolder_(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    var parents = file.getParents();
    while (parents.hasNext()) {
      if (parents.next().getId() === FOLDER_ID) {
        file.setTrashed(true);
        return true;
      }
    }
    Logger.log("Từ chối xóa file ngoài thư mục ứng dụng: " + fileId);
  } catch (eTrash) {
    Logger.log("Lỗi xóa file Drive " + fileId + ": " + eTrash.toString());
  }
  return false;
}

function trashImageByUrl_(imageUrl) {
  var url = String(imageUrl || "");
  if (!url || url.indexOf("data:") === 0) return "";
  var match = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return (match && match[1] && trashFileInAppFolder_(match[1])) ? match[1] : "";
}

/** HÀM CẤP QUYỀN: chạy thủ công trong editor để kiểm tra quyền Drive. */
function capQuyenTruyCapDrive() {
  var folder = DriveApp.getFolderById(FOLDER_ID);
  Logger.log("Kết nối Drive thành công! Thư mục: " + folder.getName());
}

// ---------------------------------------------------------------------------
// Handlers ghi (tất cả là upsert theo id)
// ---------------------------------------------------------------------------
function handleMemory_(ss, data) {
  var id = requireId_(data);
  var sheet = getSheet_(ss, SHEET_DEFS.memories);
  var row = findRow_(sheet, id);
  var old = readRow_(sheet, row, 10);
  if (old && isTrue_(old[8])) return { status: "success", deleted: true, id: id };

  var imageUrl = old && old[4] ? String(old[4]) : "";
  if (!imageUrl) imageUrl = saveImage_(data.imageBase64, "kyniem_");
  if (!imageUrl && String(data.image || "").indexOf("https://") === 0) imageUrl = data.image;

  var now = Date.now();
  writeRow_(sheet, row, [
    id, data.title || "", data.date || "", data.location || "", imageUrl, data.story || "",
    old ? old[6] : new Date(), now, false, data.placeId || (old ? old[9] : "")
  ]);
  return { status: "success", id: id, imageUrl: imageUrl };
}

function handleDeleteMemory_(ss, data) {
  var id = requireId_(data);
  var sheet = getSheet_(ss, SHEET_DEFS.memories);
  var row = findRow_(sheet, id);
  var old = readRow_(sheet, row, 10);
  var deletedFileId = old ? trashImageByUrl_(old[4]) : "";
  var created = old ? old[6] : new Date();
  writeRow_(sheet, row, [id, "", "", "", "", "", created, Date.now(), true, ""]);
  return { status: "success", id: id, deletedId: id, deletedFileId: deletedFileId };
}

function handleChat_(ss, data) {
  var id = requireId_(data);
  var sheet = getSheet_(ss, SHEET_DEFS.messages);
  var row = findRow_(sheet, id);
  var old = readRow_(sheet, row, 6);
  var imageUrl = old && old[3] ? String(old[3]) : saveImage_(data.imageBase64, "chat_");
  if (!imageUrl && String(data.image || "").indexOf("https://") === 0) imageUrl = data.image;
  writeRow_(sheet, row, [
    id, data.sender || "", data.text || "", imageUrl,
    data.timestamp || new Date().toISOString(), old ? old[5] : new Date()
  ]);
  return { status: "success", id: id, imageUrl: imageUrl };
}

function handlePlace_(ss, data) {
  var id = requireId_(data);
  var sheet = getSheet_(ss, SHEET_DEFS.places);
  var row = findRow_(sheet, id);
  var old = readRow_(sheet, row, 11);
  if (old && isTrue_(old[10])) return { status: "success", deleted: true, id: id };
  writeRow_(sheet, row, [
    id, data.name || "", data.mapUrl || "", data.tiktokUrl || "",
    data.lat !== undefined && data.lat !== null ? data.lat : "",
    data.lng !== undefined && data.lng !== null ? data.lng : "",
    data.notes || "", data.visited === true,
    old ? old[8] : (data.createdAt || new Date().toISOString()), Date.now(), false
  ]);
  return { status: "success", id: id };
}

function handleDeletePlace_(ss, data) {
  var id = requireId_(data);
  var sheet = getSheet_(ss, SHEET_DEFS.places);
  var row = findRow_(sheet, id);
  var old = readRow_(sheet, row, 11);
  writeRow_(sheet, row, [id, "", "", "", "", "", "", false, old ? old[8] : new Date().toISOString(), Date.now(), true]);
  return { status: "success", id: id, deletedId: id };
}

/** Tương thích client cũ: chỉ đổi cờ Visited của một địa điểm đã có. */
function handleTogglePlace_(ss, data) {
  var id = requireId_(data);
  var sheet = getSheet_(ss, SHEET_DEFS.places);
  var row = findRow_(sheet, id);
  if (row) {
    sheet.getRange(row, 8).setValue(data.visited === true);
    sheet.getRange(row, 10).setValue(Date.now());
  }
  return { status: "success", id: id };
}

function handleNote_(ss, data) {
  var id = requireId_(data);
  var sheet = getSheet_(ss, SHEET_DEFS.notes);
  var row = findRow_(sheet, id);
  var old = readRow_(sheet, row, 7);
  if (old && isTrue_(old[6])) return { status: "success", deleted: true, id: id };
  writeRow_(sheet, row, [
    id, data.sender || "", data.text || "", data.openAt || "",
    old ? old[4] : new Date().toISOString(), Date.now(), data.deleted === true
  ]);
  return { status: "success", id: id };
}

/** Dữ liệu kỳ dâu: last-writer-wins theo updatedAt do client gửi. */
function handlePeriod_(ss, data) {
  var sheet = getSheet_(ss, SHEET_DEFS.period);
  var row = findRow_(sheet, "period");
  var old = readRow_(sheet, row, 6);
  var incoming = Number(data.updatedAt) || 0;
  if (old && Number(old[5]) > incoming) return { status: "success", ignored: true, id: "period" };
  writeRow_(sheet, row, [
    "period", data.startDate || "", Number(data.cycleLength) || 28, Number(data.durationDays) || 5,
    JSON.stringify(data.history || []), incoming || Date.now()
  ]);
  return { status: "success", id: "period" };
}

/** Tương thích client cũ (bảng Tasks): upsert theo id, không còn phình dòng. */
function handleTask_(ss, data) {
  var id = requireId_(data);
  var sheet = getSheet_(ss, SHEET_DEFS.tasks);
  var row = findRow_(sheet, id);
  writeRow_(sheet, row, [id, data.title, data.category, data.targetDate, data.notes, data.completed, new Date()]);
  return { status: "success", id: id };
}

var POST_HANDLERS = {
  memory: handleMemory_,
  delete_memory: handleDeleteMemory_,
  chat_message: handleChat_,
  place: handlePlace_,
  delete_place: handleDeletePlace_,
  toggle_place: handleTogglePlace_,
  note: handleNote_,
  period: handlePeriod_,
  task: handleTask_
};

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (!isPasscodeAuthorized_(data.passcode)) {
      return json_({ status: "error", code: "unauthorized", message: "Chế độ khách: chỉ có quyền xem." });
    }
    var handler = POST_HANDLERS[data.type];
    if (!handler) return json_({ status: "ignored", message: "Loại yêu cầu không được hỗ trợ: " + data.type });

    var lock = LockService.getScriptLock();
    if (!lock.tryLock(LOCK_WAIT_MS)) {
      return json_({ status: "error", code: "busy", retryable: true, message: "Máy chủ đang bận, thử lại sau." });
    }
    try {
      return json_(handler(SpreadsheetApp.getActiveSpreadsheet(), data));
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ status: "error", message: err.toString() });
  }
}

// ---------------------------------------------------------------------------
// Đọc (doGet)
// ---------------------------------------------------------------------------
function readRows_(ss, def, width) {
  var sheet = ss.getSheetByName(def.name);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues();
}

function formatMemoryDate_(dateVal) {
  var d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  var hours = Utilities.formatDate(d, "GMT+7", "HH:mm");
  var datePart = Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd");
  return hours !== "00:00" ? datePart + "T" + hours : datePart;
}

function collectMemories_(ss, since, out) {
  readRows_(ss, SHEET_DEFS.memories, 10).forEach(function (r) {
    var updatedAt = toMillis_(r[7]);
    if (updatedAt <= since) return;
    if (isTrue_(r[8])) {
      out.deleted.memories.push(String(r[0]));
      return;
    }
    out.memories.push({
      id: String(r[0]), title: r[1], date: formatMemoryDate_(r[2]), location: r[3],
      image: r[4], story: r[5], placeId: r[9] ? String(r[9]) : "", updatedAt: updatedAt
    });
  });
}

function collectPlaces_(ss, since, out) {
  readRows_(ss, SHEET_DEFS.places, 11).forEach(function (r) {
    var updatedAt = toMillis_(r[9]);
    if (updatedAt <= since) return;
    if (isTrue_(r[10])) {
      out.deleted.places.push(String(r[0]));
      return;
    }
    out.places.push({
      id: String(r[0]), name: r[1] || "", mapUrl: r[2] || "", tiktokUrl: r[3] || "",
      lat: r[4] !== "" ? parseFloat(r[4]) : null, lng: r[5] !== "" ? parseFloat(r[5]) : null,
      notes: r[6] || "", visited: isTrue_(r[7]), createdAt: r[8] ? String(r[8]) : "", updatedAt: updatedAt
    });
  });
}

function collectMessages_(ss, since, out) {
  readRows_(ss, SHEET_DEFS.messages, 6).forEach(function (r) {
    if (toMillis_(r[5]) <= since) return;
    out.messages.push({ id: String(r[0]), sender: r[1], text: r[2], image: r[3], timestamp: r[4] });
  });
}

/** Ghi chú hẹn giờ: server giữ kín nội dung cho tới khi đến giờ mở. */
function collectNotes_(ss, since, out) {
  var now = Date.now();
  readRows_(ss, SHEET_DEFS.notes, 7).forEach(function (r) {
    var updatedAt = toMillis_(r[5]);
    var openAt = toMillis_(r[3]);
    var unlocked = openAt > 0 && openAt <= now;
    var justUnlocked = unlocked && openAt > since;
    if (updatedAt <= since && !justUnlocked) return;
    if (isTrue_(r[6])) {
      out.deleted.notes.push(String(r[0]));
      return;
    }
    out.notes.push({
      id: String(r[0]), sender: r[1], text: unlocked ? r[2] : "", openAt: r[3] ? String(r[3]) : "",
      locked: !unlocked, createdAt: r[4] ? String(r[4]) : "", updatedAt: updatedAt
    });
  });
}

function readPeriod_(ss) {
  var rows = readRows_(ss, SHEET_DEFS.period, 6);
  if (rows.length === 0) return null;
  var r = rows[0];
  var history = [];
  try { history = JSON.parse(r[4] || "[]"); } catch (e) { history = []; }
  return {
    startDate: r[1] instanceof Date ? Utilities.formatDate(r[1], "GMT+7", "yyyy-MM-dd") : String(r[1]),
    cycleLength: Number(r[2]) || 28, durationDays: Number(r[3]) || 5, history: history, updatedAt: toMillis_(r[5])
  };
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var params = (e && e.parameter) || {};
  var isAuth = isPasscodeAuthorized_(params.passcode);
  var since = Math.max(0, Number(params.since) || 0);
  var out = {
    serverTime: Date.now(), isAuth: isAuth, since: since,
    memories: [], places: [], messages: [], notes: [], period: null, tasks: [],
    deleted: { memories: [], places: [], notes: [] }
  };
  collectMemories_(ss, since, out);
  collectPlaces_(ss, since, out);
  if (isAuth) {
    collectMessages_(ss, since, out);
    collectNotes_(ss, since, out);
    out.period = readPeriod_(ss);
  }
  return json_(out);
}
