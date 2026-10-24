/**
 * GOOGLE APPS SCRIPT BACKEND CHO KIM & THƯ 💕
 * 
 * Thư mục Google Drive: 
 * https://drive.google.com/drive/folders/1dcyUgareKuDTIyj9xmhKKY6Uq0uC6Zuj
 */

var FOLDER_ID = "1dcyUgareKuDTIyj9xmhKKY6Uq0uC6Zuj";

// Danh sách mật mã hợp lệ của Kim & Thư
var ALLOWED_PASSCODES = ["kimthu", "0204", "1909"];

/**
 * HÀM CẤP QUYỀN VÀ KIỂM TRA GOOGLE DRIVE:
 * Bạn có thể chọn hàm này và bấm "Chạy" (Run) để kiểm tra tạo file trong thư mục.
 */
function capQuyenTruyCapDrive() {
  try {
    var folder = DriveApp.getFolderById(FOLDER_ID);
    Logger.log("1. Kết nối Drive thành công! Thư mục: " + folder.getName());
    var blob = Utilities.newBlob("Test connection", "text/plain", "test.txt");
    var file = folder.createFile(blob);
    Logger.log("2. Tạo file thành công! ID: " + file.getId());
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      Logger.log("3. Cấp quyền xem công khai thành công!");
    } catch(errShare) {
      Logger.log("3. Lưu ý chia sẻ (tài khoản tổ chức): " + errShare.toString());
    }
    file.setTrashed(true);
    Logger.log("Hoàn tất kiểm tra Drive!");
  } catch(e) {
    Logger.log("Lỗi: " + e.toString());
  }
}

/**
 * HÀM HỖ TRỢ XÓA FILE DRIVE BẰNG ID HOẶC LINK:
 * Dùng để kiểm tra hoặc xóa thủ công file nếu cần
 */
function xoaFileDrive(fileIdOrUrl) {
  try {
    var raw = fileIdOrUrl || "";
    var match = raw.match(/id=([a-zA-Z0-9_-]+)/) || raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
    var fileId = (match && match[1]) ? match[1] : raw;
    var file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    Logger.log("Đã chuyển file vào thùng rác thành công: " + file.getName() + " (" + fileId + ")");
  } catch(e) {
    Logger.log("Lỗi xóa file: " + e.toString());
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // BẢO VỆ TUYỆT ĐỐI: Chỉ Kim & Thư có mật mã mới được thực thi thay đổi
    var reqPass = data.passcode ? String(data.passcode).toLowerCase().trim() : "";
    if (ALLOWED_PASSCODES.indexOf(reqPass) === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Chế độ khách: Bạn chỉ có quyền xem timeline & timer, không thể thực hiện thay đổi."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. LƯU MONG ƯỚC (TASK)
    if (data.type === "task") {
      var sheet = ss.getSheetByName("Tasks") || ss.insertSheet("Tasks");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["ID", "Title", "Category", "TargetDate", "Notes", "Completed", "CreatedAt"]);
      }
      sheet.appendRow([data.id, data.title, data.category, data.targetDate, data.notes, data.completed, new Date()]);
      return ContentService.createTextOutput(JSON.stringify({status: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. CẬP NHẬT TRẠNG THÁI MONG ƯỚC
    if (data.type === "toggle_task") {
      var sheet = ss.getSheetByName("Tasks");
      if (sheet) {
        var values = sheet.getDataRange().getValues();
        for (var i = 1; i < values.length; i++) {
          if (values[i][0] == data.id) {
            sheet.getRange(i + 1, 6).setValue(data.completed);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 3. LƯU KỶ NIỆM VÀ ẢNH VÀO GOOGLE DRIVE
    if (data.type === "memory") {
      var sheet = ss.getSheetByName("Memories") || ss.insertSheet("Memories");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["ID", "Title", "Date", "Location", "ImageUrl", "Story", "CreatedAt"]);
      }
      
      var imageUrl = data.image || "";
      
      // Nếu có ảnh chụp từ điện thoại gửi lên dạng Base64
      if (data.imageBase64 && data.imageBase64.indexOf("data:image") === 0) {
        try {
          var folder;
          try {
            folder = DriveApp.getFolderById(FOLDER_ID);
          } catch(eFolder) {
            folder = DriveApp.getRootFolder();
          }
          var contentType = data.imageBase64.substring(data.imageBase64.indexOf(":") + 1, data.imageBase64.indexOf(";"));
          var base64Data = data.imageBase64.split(",")[1];
          var decoded = Utilities.base64Decode(base64Data);
          var filename = "kyniem_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss") + ".jpg";
          var blob = Utilities.newBlob(decoded, contentType, filename);
          
          var file = folder.createFile(blob);
          try {
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch(shareErr) {
            Logger.log("Sharing warning: " + shareErr.toString());
          }
          imageUrl = "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1200";
        } catch (driveErr) {
          Logger.log("Drive Error: " + driveErr.toString());
          imageUrl = data.image || "";
        }
      }
      
      sheet.appendRow([data.id, data.title, data.date, data.location, imageUrl, data.story, new Date()]);
      return ContentService.createTextOutput(JSON.stringify({status: "success", imageUrl: imageUrl}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4. LƯU TIN NHẮN CHAT VÀ ẢNH VÀO GOOGLE DRIVE
    if (data.type === "chat_message") {
      var sheet = ss.getSheetByName("Messages") || ss.insertSheet("Messages");
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["ID", "Sender", "Text", "ImageUrl", "Timestamp", "CreatedAt"]);
      }
      
      var imageUrl = data.image || "";
      if (data.imageBase64 && data.imageBase64.indexOf("data:image") === 0) {
        try {
          var folder;
          try {
            folder = DriveApp.getFolderById(FOLDER_ID);
          } catch(eFolder) {
            folder = DriveApp.getRootFolder();
          }
          var contentType = data.imageBase64.substring(data.imageBase64.indexOf(":") + 1, data.imageBase64.indexOf(";"));
          var base64Data = data.imageBase64.split(",")[1];
          var decoded = Utilities.base64Decode(base64Data);
          var filename = "chat_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss") + ".jpg";
          var blob = Utilities.newBlob(decoded, contentType, filename);
          
          var file = folder.createFile(blob);
          try {
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          } catch(shareErr) {
            Logger.log("Sharing warning: " + shareErr.toString());
          }
          imageUrl = "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1200";
        } catch (driveErr) {
          Logger.log("Drive Error: " + driveErr.toString());
          imageUrl = data.image || "";
        }
      }
      
      sheet.appendRow([data.id, data.sender, data.text || "", imageUrl, data.timestamp || new Date().toISOString(), new Date()]);
      return ContentService.createTextOutput(JSON.stringify({status: "success", imageUrl: imageUrl}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 5. XÓA KỶ NIỆM VÀ XÓA ẢNH TRÊN GOOGLE DRIVE
    if (data.type === "delete_memory") {
      var sheet = ss.getSheetByName("Memories");
      var deletedFileId = "";
      
      if (sheet && sheet.getLastRow() > 1) {
        var values = sheet.getDataRange().getValues();
        // Lặp ngược từ dưới lên để xóa an toàn không bị lệch dòng
        for (var i = values.length - 1; i >= 1; i--) {
          if (String(values[i][0]).trim() === String(data.id).trim()) {
            var imgUrl = values[i][4] || data.imageUrl || "";
            // Tìm file ID trên Google Drive từ link ảnh
            if (imgUrl && imgUrl.indexOf("data:") === -1) {
              var match = imgUrl.match(/id=([a-zA-Z0-9_-]+)/) || imgUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
              if (match && match[1]) {
                deletedFileId = match[1];
                try {
                  DriveApp.getFileById(deletedFileId).setTrashed(true);
                  Logger.log("Đã chuyển ảnh kỷ niệm vào thùng rác Drive: " + deletedFileId);
                } catch(eTrash) {
                  Logger.log("Lỗi xóa file Drive: " + eTrash.toString());
                }
              }
            }
            sheet.deleteRow(i + 1);
          }
        }
      }

      // Nếu chưa xóa được file qua dòng trong sheet nhưng client có gửi fileId hoặc link Drive
      if (!deletedFileId && (data.fileId || data.imageUrl)) {
        var rawTarget = data.fileId || data.imageUrl || "";
        if (rawTarget.indexOf("data:") === -1) {
          var matchClient = rawTarget.match(/id=([a-zA-Z0-9_-]+)/) || rawTarget.match(/\/d\/([a-zA-Z0-9_-]+)/);
          var fId = (matchClient && matchClient[1]) ? matchClient[1] : (data.fileId || "");
          if (fId && fId.length > 15) {
            try {
              DriveApp.getFileById(fId).setTrashed(true);
              deletedFileId = fId;
              Logger.log("Đã xóa file Drive trực tiếp từ dữ liệu gửi: " + fId);
            } catch(eTrashClient) {
              Logger.log("Lỗi xóa file Drive từ client: " + eTrashClient.toString());
            }
          }
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success", 
        deletedId: data.id, 
        deletedFileId: deletedFileId
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 6. LƯU ĐỊA ĐIỂM MUỐN ĐI (PLACES WISHLIST)
    if (data.type === "place") {
      var placeSheet = ss.getSheetByName("Places") || ss.insertSheet("Places");
      if (placeSheet.getLastRow() === 0) {
        placeSheet.appendRow(["ID", "Name", "MapUrl", "TiktokUrl", "Lat", "Lng", "Notes", "Visited", "CreatedAt"]);
      }
      
      var isUpdated = false;
      if (placeSheet.getLastRow() > 1) {
        var pData = placeSheet.getDataRange().getValues();
        for (var pIdx = 1; pIdx < pData.length; pIdx++) {
          if (String(pData[pIdx][0]).trim() === String(data.id).trim()) {
            placeSheet.getRange(pIdx + 1, 2).setValue(data.name || "");
            placeSheet.getRange(pIdx + 1, 3).setValue(data.mapUrl || "");
            placeSheet.getRange(pIdx + 1, 4).setValue(data.tiktokUrl || "");
            placeSheet.getRange(pIdx + 1, 5).setValue(data.lat !== undefined ? data.lat : "");
            placeSheet.getRange(pIdx + 1, 6).setValue(data.lng !== undefined ? data.lng : "");
            placeSheet.getRange(pIdx + 1, 7).setValue(data.notes || "");
            if (data.visited !== undefined) {
              placeSheet.getRange(pIdx + 1, 8).setValue(data.visited === true);
            }
            isUpdated = true;
            break;
          }
        }
      }

      if (!isUpdated) {
        placeSheet.appendRow([
          data.id,
          data.name || "",
          data.mapUrl || "",
          data.tiktokUrl || "",
          data.lat !== undefined ? data.lat : "",
          data.lng !== undefined ? data.lng : "",
          data.notes || "",
          data.visited === true,
          data.createdAt || new Date().toISOString()
        ]);
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 7. CẬP NHẬT TRẠNG THÁI ĐÃ ĐI / CHƯA ĐI
    if (data.type === "toggle_place") {
      var placeSheet = ss.getSheetByName("Places");
      if (placeSheet && placeSheet.getLastRow() > 1) {
        var values = placeSheet.getDataRange().getValues();
        for (var i = 1; i < values.length; i++) {
          if (String(values[i][0]).trim() === String(data.id).trim()) {
            placeSheet.getRange(i + 1, 8).setValue(data.visited === true);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success"}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 8. XÓA ĐỊA ĐIỂM MUỐN ĐI
    if (data.type === "delete_place") {
      var placeSheet = ss.getSheetByName("Places");
      if (placeSheet && placeSheet.getLastRow() > 1) {
        var values = placeSheet.getDataRange().getValues();
        for (var i = values.length - 1; i >= 1; i--) {
          if (String(values[i][0]).trim() === String(data.id).trim()) {
            placeSheet.deleteRow(i + 1);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({status: "success", deletedId: data.id}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Phản hồi mặc định nếu kiểu dữ liệu không khớp
    return ContentService.createTextOutput(JSON.stringify({
      status: "ignored", 
      message: "Yêu cầu không thuộc loại nào đã xử lý: " + data.type
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var taskSheet = ss.getSheetByName("Tasks");
  var memorySheet = ss.getSheetByName("Memories");
  var msgSheet = ss.getSheetByName("Messages");
  var placeSheet = ss.getSheetByName("Places");
  
  // Xác thực quyền riêng tư: Nếu có mật mã thì mới trả về tin nhắn riêng tư
  var reqPass = (e && e.parameter && e.parameter.passcode) ? String(e.parameter.passcode).toLowerCase().trim() : "";
  var isAuth = ALLOWED_PASSCODES.indexOf(reqPass) !== -1;

  var tasks = [];
  if (taskSheet && taskSheet.getLastRow() > 1) {
    var taskData = taskSheet.getDataRange().getValues();
    for (var i = 1; i < taskData.length; i++) {
      tasks.push({
        id: taskData[i][0],
        title: taskData[i][1],
        category: taskData[i][2],
        targetDate: taskData[i][3],
        notes: taskData[i][4],
        completed: taskData[i][5] === true || taskData[i][5] === "TRUE"
      });
    }
  }
  
  var memories = [];
  if (memorySheet && memorySheet.getLastRow() > 1) {
    var memData = memorySheet.getDataRange().getValues();
    for (var j = 1; j < memData.length; j++) {
      var dateVal = memData[j][2];
      var formattedDate = String(dateVal);
      try {
        var d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          var hours = Utilities.formatDate(d, "GMT+7", "HH:mm");
          var datePart = Utilities.formatDate(d, "GMT+7", "yyyy-MM-dd");
          if (hours && hours !== "00:00") {
            formattedDate = datePart + "T" + hours;
          } else {
            formattedDate = datePart;
          }
        }
      } catch(e) {}
      
      memories.push({
        id: memData[j][0],
        title: memData[j][1],
        date: formattedDate,
        location: memData[j][3],
        image: memData[j][4],
        story: memData[j][5]
      });
    }

    // Sắp xếp sự kiện gần nhất lên đầu
    memories.sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });
  }

  // Tin nhắn chỉ trả về khi là Kim hoặc Thư đã xác thực
  var messages = [];
  if (isAuth && msgSheet && msgSheet.getLastRow() > 1) {
    var msgData = msgSheet.getDataRange().getValues();
    for (var k = 1; k < msgData.length; k++) {
      messages.push({
        id: msgData[k][0],
        sender: msgData[k][1],
        text: msgData[k][2],
        image: msgData[k][3],
        timestamp: msgData[k][4]
      });
    }
  }
  
  // Danh sách địa điểm muốn đi
  var places = [];
  if (placeSheet && placeSheet.getLastRow() > 1) {
    var placeData = placeSheet.getDataRange().getValues();
    for (var p = 1; p < placeData.length; p++) {
      places.push({
        id: String(placeData[p][0]),
        name: placeData[p][1] || "",
        mapUrl: placeData[p][2] || "",
        tiktokUrl: placeData[p][3] || "",
        lat: placeData[p][4] !== "" ? parseFloat(placeData[p][4]) : null,
        lng: placeData[p][5] !== "" ? parseFloat(placeData[p][5]) : null,
        notes: placeData[p][6] || "",
        visited: placeData[p][7] === true || placeData[p][7] === "TRUE",
        createdAt: placeData[p][8] ? String(placeData[p][8]) : ""
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    tasks: tasks, 
    memories: memories, 
    messages: messages,
    places: places,
    isAuth: isAuth
  })).setMimeType(ContentService.MimeType.JSON);
}
