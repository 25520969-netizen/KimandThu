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
 * HÀM CẤP QUYỀN GOOGLE DRIVE:
 * Bạn hãy chọn hàm "capQuyenTruyCapDrive" trên thanh công cụ và bấm "Chạy" (Run) một lần.
 * Google sẽ hiện bảng yêu cầu cấp quyền truy cập Drive -> bấm Xem lại quyền -> Nâng cao -> Đi tới ... (không an toàn) -> Cho phép.
 */
function capQuyenTruyCapDrive() {
  var folder = DriveApp.getFolderById(FOLDER_ID);
  Logger.log("Kết nối Drive thành công! Thư mục: " + folder.getName());
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
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          imageUrl = "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1200";
        } catch (driveErr) {
          Logger.log("Drive Error: " + driveErr.toString());
          // Nếu Drive chưa được cấp quyền, lưu lại ảnh để dữ liệu không bị mất
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
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
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
      var formattedDate = dateVal;
      try {
        formattedDate = Utilities.formatDate(new Date(dateVal), "GMT+7", "yyyy-MM-dd");
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
  
  return ContentService.createTextOutput(JSON.stringify({
    tasks: tasks, 
    memories: memories, 
    messages: messages,
    isAuth: isAuth
  })).setMimeType(ContentService.MimeType.JSON);
}
