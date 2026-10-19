/**
 * KIM & THƯ 💕 CHUYỆN TÌNH CHÚNG MÌNH
 * Ứng dụng dòng thời gian kỷ niệm và đồng hồ tình yêu.
 */

// ==========================================
// DỮ LIỆU MẶC ĐỊNH & KHỞI TẠO
// ==========================================
const DEFAULT_CONFIG = {
  partnerOne: "Kim",
  partnerTwo: "Thư",
  startDate: "2025-04-02T19:00:00",
  quote: "Iu béeeee:3",
  apiUrl: "https://script.google.com/macros/s/AKfycbxDI9aaD94CTOU8rYk-NRc8Hb3Uajv24LgnPdrTrLXGZGsR7sykPBBUwC7ttesFfxl3PA/exec",
  passcode: "kimthu"
};


const DEFAULT_MEMORIES = [
  {
    id: "mem-3",
    title: "Ngắm Bầu Trời Sao Dưới Chiếc Chăn Ấm",
    date: "2025-11-20",
    location: "Đồi thông lộng gió",
    image: "assets/images/memory3.jpg",
    story: "Hai đứa ngồi cạnh nhau dưới chiếc chăn len to sưởi ấm, chiếc đèn bão vàng lung linh. Khi thấy vệt sao băng vụt qua, anh chẳng cần ước điều gì nữa — bởi vì điều ước đẹp nhất vũ trụ đã ngồi ngay bên cạnh anh rồi."
  },
  {
    id: "mem-2",
    title: "Dạo Biển Dưới Hoàng Hôn Rực Rỡ",
    date: "2025-07-15",
    location: "Bờ biển êm đềm",
    image: "assets/images/memory2.jpg",
    story: "Bầu trời chuyển sang dải màu hồng cam đẹp như tranh vẽ. Đi chân trần trên bãi cát mịn, lắng nghe tiếng sóng vỗ rì rào và nắm lấy bàn tay nhỏ bé của em. Bình yên đến lạ thường."
  },
  {
    id: "mem-1",
    title: "Ngày Đầu Tiên Đi Cafe Cùng Nhau",
    date: "2025-04-02",
    location: "Góc quán cafe quen",
    image: "assets/images/memory1.jpg",
    story: "Anh vẫn nhớ hôm ấy hai đứa ngại ngùng thế nào lúc mới gặp. Thế mà tiếng cười cứ tự nhiên vang lên, ba tiếng đồng hồ trôi qua cứ ngỡ mới năm phút. Khoảnh khắc ấy anh biết em chính là cô gái đặc biệt nhất đời anh."
  }
];

const DEFAULT_PERIOD = {
  startDate: "2026-09-15",
  cycleLength: 28,
  durationDays: 5
};

const DEFAULT_CHAT_MESSAGES = [
  {
    id: "msg-1",
    sender: "Kim",
    text: "Chào bé Thư yêu của anh! 💕 Mỗi ngày bên em đều là một ngày ngọt ngào.",
    image: "",
    timestamp: "2025-04-02T19:05:00"
  },
  {
    id: "msg-2",
    sender: "Thư",
    text: "Iu anh nhìu nhìu :3 ❤️ Chúng mình cùng lưu giữ thật nhiều kỷ niệm đẹp nha!",
    image: "",
    timestamp: "2025-04-02T19:06:00"
  }
];

// ==========================================
// BỘ QUẢN LÝ ỨNG DỤNG (JOURNEY APP)
// ==========================================
class JourneyApp {
  constructor() {
    this.config = this.loadData("journey_config_v3", DEFAULT_CONFIG);
    if (!this.config.apiUrl || this.config.apiUrl.trim() === "") {
      this.config.apiUrl = DEFAULT_CONFIG.apiUrl;
      this.saveData("journey_config_v3", this.config);
    }
    this.memories = this.loadData("journey_memories_v3", DEFAULT_MEMORIES);
    this.deletedMemoryIds = this.loadData("journey_deleted_mem_ids", []);
    this.period = this.loadData("journey_period_v1", DEFAULT_PERIOD);
    this.chatMessages = this.loadData("journey_chat_messages_v1", DEFAULT_CHAT_MESSAGES);
    this.currentSender = this.loadData("journey_chat_sender_v1", "Kim");
    this.chatPendingImage = null;
    this.showAllMemories = false;
    this.audioContext = null;
    this.isPlayingMelody = false;
    this.melodyTimer = null;
    this.isAuthenticated = false;
    this.toastTimer = null;

    this.initDOM();
    this.initAuth();
    this.initEvents();
    this.initPeriodTracker();
    this.initChat();
    this.initPhotoUpload();
    this.startLiveCounter();
    this.renderProfile();
    this.renderPeriodTracker();
    this.renderTimeline();
    this.initPetalsCanvas();
    this.syncFromBackend();
    this.checkPeriodAlert();

    // Tự động kiểm tra tin nhắn mới từ backend mỗi 6 giây
    setInterval(() => this.syncFromBackend(), 6000);
  }

  loadData(key, fallback) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
      console.warn("Lỗi tải dữ liệu:", e);
      return fallback;
    }
  }

  saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Lỗi lưu dữ liệu:", e);
    }
  }

  // ==========================================
  // KHỞI TẠO DOM ELEMENTS
  // ==========================================
  initDOM() {
    // Nav & Profile & Dropdown Menu
    this.navCoupleNames = document.getElementById("nav-couple-names");
    this.partnerOneName = document.getElementById("partner-one-name");
    this.partnerTwoName = document.getElementById("partner-two-name");
    this.heroQuote = document.getElementById("hero-custom-quote");
    this.navDropdownWrap = document.getElementById("nav-dropdown-wrap");
    this.navMenuToggleBtn = document.getElementById("nav-menu-toggle-btn");
    this.navDropdownMenu = document.getElementById("nav-dropdown-menu");

    // Live Counter
    this.countDays = document.getElementById("count-days");
    this.countHours = document.getElementById("count-hours");
    this.countMinutes = document.getElementById("count-minutes");
    this.countSeconds = document.getElementById("count-seconds");

    // Timeline & Modals
    this.timelineContainer = document.getElementById("timeline-list-container");
    this.openAddMemoryBtn = document.getElementById("open-add-memory-modal-btn");
    this.heroAddMemoryBtn = document.getElementById("hero-add-memory-btn");
    this.memoryModal = document.getElementById("memory-modal");
    this.memoryForm = document.getElementById("memory-form");
    this.closeMemoryBtn = document.getElementById("close-memory-modal-btn");
    this.cancelMemoryBtn = document.getElementById("cancel-memory-btn");

    // Period Tracker (Thanh công cụ & Modal & Alert)
    this.periodNavBtn = document.getElementById("period-nav-btn");
    this.periodNavLabel = document.getElementById("period-nav-label");
    this.periodPhaseText = document.getElementById("period-phase-text");
    this.periodStatusMessage = document.getElementById("period-status-message");
    this.periodModal = document.getElementById("period-modal");
    this.periodForm = document.getElementById("period-form");
    this.closePeriodBtn = document.getElementById("close-period-modal-btn");
    this.cancelPeriodBtn = document.getElementById("cancel-period-btn");
    this.periodStartDateInput = document.getElementById("period-start-date-input");
    this.periodCycleLengthInput = document.getElementById("period-cycle-length-input");
    this.setPeriodTodayBtn = document.getElementById("set-period-today-btn");

    // Period Alert Modal (Thông báo khi gần trước 3 ngày)
    this.periodAlertModal = document.getElementById("period-alert-modal");
    this.periodAlertTitle = document.getElementById("period-alert-title");
    this.periodAlertCountdownPill = document.getElementById("period-alert-countdown-pill");
    this.periodAlertMessage = document.getElementById("period-alert-message");
    this.closePeriodAlertBtn = document.getElementById("close-period-alert-btn");
    this.dismissPeriodAlertBtn = document.getElementById("dismiss-period-alert-btn");
    this.openCareFromAlertBtn = document.getElementById("open-care-from-alert-btn");

    this.settingsModal = document.getElementById("settings-modal");
    this.settingsForm = document.getElementById("settings-form");
    this.openSettingsBtn = document.getElementById("edit-profile-btn");
    this.closeSettingsBtn = document.getElementById("close-settings-modal-btn");
    this.resetDataBtn = document.getElementById("reset-default-data-btn");

    // Lightbox
    this.lightboxModal = document.getElementById("photo-lightbox");
    this.lightboxImg = document.getElementById("lightbox-img");
    this.lightboxTitle = document.getElementById("lightbox-title");
    this.lightboxDate = document.getElementById("lightbox-date");
    this.lightboxStory = document.getElementById("lightbox-story");
    this.closeLightboxBtn = document.getElementById("close-lightbox-btn");

    // Audio & Hearts
    this.musicToggleBtn = document.getElementById("music-toggle-btn");
    this.musicStatus = document.getElementById("music-status");
    this.sendLoveBtn = document.getElementById("send-love-btn");

    // Photo Upload, Camera & GPS Elements
    this.memoryFileInput = document.getElementById("memory-file-input");
    this.memoryCameraInput = document.getElementById("memory-camera-input");
    this.btnCameraTrigger = document.getElementById("btn-camera-trigger");
    this.btnGalleryTrigger = document.getElementById("btn-gallery-trigger");
    this.photoActionButtonsGrid = document.getElementById("photo-action-buttons-grid");
    this.inappCameraWrapper = document.getElementById("inapp-camera-wrapper");
    this.inappCameraVideo = document.getElementById("inapp-camera-video");
    this.btnCaptureInapp = document.getElementById("btn-capture-inapp");
    this.btnCloseInapp = document.getElementById("btn-close-inapp");
    this.memoryImageInput = document.getElementById("memory-image-input");
    this.uploadPreviewWrapper = document.getElementById("upload-preview-wrapper");
    this.uploadPreviewImg = document.getElementById("upload-preview-img");
    this.removePreviewBtn = document.getElementById("remove-preview-btn");
    this.btnRefreshGps = document.getElementById("btn-refresh-gps");
    this.gpsStatusText = document.getElementById("gps-status-text");
    this.memoryDateInput = document.getElementById("memory-date-input");
    this.memoryLocationInput = document.getElementById("memory-location-input");
    this.cameraStream = null;

    // Auth & Access Control
    this.authUnlockNavBtn = document.getElementById("auth-unlock-nav-btn");
    this.authLockNavBtn = document.getElementById("auth-lock-nav-btn");
    this.authModal = document.getElementById("auth-modal");
    this.authForm = document.getElementById("auth-form");
    this.authPasscodeInput = document.getElementById("auth-passcode-input");
    this.authErrorMsg = document.getElementById("auth-error-msg");
    this.closeAuthModalBtn = document.getElementById("close-auth-modal-btn");
    this.cancelAuthBtn = document.getElementById("cancel-auth-btn");
    this.copySecretLinkBtn = document.getElementById("copy-secret-link-btn");
    this.cfgPasscodeInput = document.getElementById("cfg-passcode");
  }

  // ==========================================
  // XÁC THỰC QUYỀN TRUY CẬP (KIM & THƯ VS KHÁCH)
  // ==========================================
  initAuth() {
    // 1. Kiểm tra URL query param: ?key=... hoặc ?code=... hoặc ?pass=... và ?api=...
    const urlParams = new URLSearchParams(window.location.search);
    const secretKey = urlParams.get("key") || urlParams.get("code") || urlParams.get("pass");
    const apiUrlParam = urlParams.get("api");

    if (apiUrlParam) {
      try {
        const decodedUrl = decodeURIComponent(apiUrlParam);
        if (decodedUrl.startsWith("http")) {
          this.config.apiUrl = decodedUrl;
          this.saveData("journey_config_v3", this.config);
          console.log("Đã tự động kết nối Backend API từ link:", decodedUrl);
        }
      } catch (e) {}
    }

    if (secretKey && this.isPasscodeValid(secretKey)) {
      this.isAuthenticated = true;
      this.saveData("journey_auth_token", "unlocked");
      window.history.replaceState({}, document.title, window.location.pathname);
      this.showToast("Chào mừng Kim & Thư 💕 Đã mở khóa toàn bộ quyền!");
      this.spawnHeartConfetti();
    } else {
      // 2. Kiểm tra token đã lưu trên trình duyệt của máy này trước đó
      const token = this.loadData("journey_auth_token", null);
      this.isAuthenticated = (token === "unlocked");
    }

    if (this.authUnlockNavBtn) {
      this.authUnlockNavBtn.addEventListener("click", () => {
        if (this.navDropdownWrap) this.navDropdownWrap.classList.remove("open");
        this.openAuthModal();
      });
    }

    if (this.authLockNavBtn) {
      this.authLockNavBtn.addEventListener("click", () => {
        if (this.navDropdownWrap) this.navDropdownWrap.classList.remove("open");
        this.isAuthenticated = false;
        this.saveData("journey_auth_token", "locked");
        this.applyAuthMode();
        this.showToast("Đã chuyển sang Chế độ Khách (Chỉ xem) 🔒");
      });
    }

    if (this.closeAuthModalBtn) {
      this.closeAuthModalBtn.addEventListener("click", () => this.closeAuthModal());
    }
    if (this.cancelAuthBtn) {
      this.cancelAuthBtn.addEventListener("click", () => this.closeAuthModal());
    }

    if (this.authForm) {
      this.authForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const inputPass = this.authPasscodeInput ? this.authPasscodeInput.value : "";
        if (this.isPasscodeValid(inputPass)) {
          this.isAuthenticated = true;
          this.saveData("journey_auth_token", "unlocked");
          if (this.authErrorMsg) this.authErrorMsg.style.display = "none";
          this.closeAuthModal();
          this.applyAuthMode();
          this.showToast("Mở khóa thành công! Chào mừng Kim & Thư 💕");
          this.spawnHeartBurst(window.innerWidth / 2, window.innerHeight / 2);
          this.syncFromBackend();
        } else {
          if (this.authErrorMsg) this.authErrorMsg.style.display = "block";
          if (this.authPasscodeInput) this.authPasscodeInput.focus();
        }
      });
    }

    if (this.copySecretLinkBtn) {
      this.copySecretLinkBtn.addEventListener("click", () => {
        const pass = (this.cfgPasscodeInput && this.cfgPasscodeInput.value.trim()) || this.config.passcode || "kimthu";
        let secretLink = `${window.location.origin}${window.location.pathname}?key=${encodeURIComponent(pass)}`;
        if (this.config.apiUrl) {
          secretLink += `&api=${encodeURIComponent(this.config.apiUrl)}`;
        }
        navigator.clipboard.writeText(secretLink).then(() => {
          this.showToast("Đã sao chép link tự mở khóa & đồng bộ Google Drive! Gửi link này cho Thư nhé 💕");
        }).catch(() => {
          prompt("Sao chép link này gửi cho Thư nha:", secretLink);
        });
      });
    }

    this.applyAuthMode();
  }

  isPasscodeValid(pass) {
    if (!pass) return false;
    const clean = String(pass).trim().toLowerCase();
    const currentPass = String(this.config.passcode || "kimthu").trim().toLowerCase();
    return clean === currentPass || clean === "kimthu" || clean === "0204" || clean === "1909";
  }

  openAuthModal() {
    if (!this.authModal) return;
    if (this.authErrorMsg) this.authErrorMsg.style.display = "none";
    if (this.authPasscodeInput) this.authPasscodeInput.value = "";
    this.authModal.showModal();
    if (this.authPasscodeInput) this.authPasscodeInput.focus();
  }

  closeAuthModal() {
    if (this.authModal && this.authModal.open) this.authModal.close();
  }

  applyAuthMode() {
    if (this.isAuthenticated) {
      document.body.classList.remove("is-guest");
      if (this.authUnlockNavBtn) this.authUnlockNavBtn.style.display = "none";
      if (this.authLockNavBtn) this.authLockNavBtn.style.display = "flex";
      if (this.floatingChatBtn) this.floatingChatBtn.style.display = "flex";
      this.checkPeriodAlert();
    } else {
      document.body.classList.add("is-guest");
      if (this.authUnlockNavBtn) this.authUnlockNavBtn.style.display = "flex";
      if (this.authLockNavBtn) this.authLockNavBtn.style.display = "none";
      if (this.floatingChatBtn) this.floatingChatBtn.style.display = "none";

      if (this.chatDrawer && this.chatDrawer.classList.contains("open")) {
        this.toggleChatDrawer(false);
      }
      if (this.periodAlertModal && this.periodAlertModal.open) this.periodAlertModal.close();
      if (this.periodModal && this.periodModal.open) this.periodModal.close();
      if (this.settingsModal && this.settingsModal.open) this.settingsModal.close();
      if (this.memoryModal && this.memoryModal.open) this.memoryModal.close();
    }
  }

  showToast(message, duration = 3000) {
    let toast = document.getElementById("journey-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "journey-toast";
      toast.className = "journey-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, duration);
  }


  // ==========================================
  // XỬ LÝ CHỤP & CHỌN ẢNH, TỰ ĐỘNG NGÀY GIỜ & GOOGLE MAPS GPS
  // ==========================================
  initPhotoUpload() {
    // 1. Mở camera chụp ảnh
    if (this.btnCameraTrigger) {
      this.btnCameraTrigger.addEventListener("click", () => {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
          // Trên điện thoại, mở trực tiếp camera native của máy
          if (this.memoryCameraInput) this.memoryCameraInput.click();
        } else {
          // Trên máy tính bàn / laptop, khởi động camera in-app từ webcam
          this.startInAppCamera();
        }
      });
    }

    // 2. Mở thư viện chọn ảnh
    if (this.btnGalleryTrigger) {
      this.btnGalleryTrigger.addEventListener("click", () => {
        if (this.memoryFileInput) this.memoryFileInput.click();
      });
    }

    // 3. Xử lý ảnh từ input camera (điện thoại)
    if (this.memoryCameraInput) {
      this.memoryCameraInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        this.processUploadedFile(file);
      });
    }

    // 4. Xử lý ảnh từ input thư viện
    if (this.memoryFileInput) {
      this.memoryFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        this.processUploadedFile(file);
      });
    }

    // 5. Nút chụp ảnh từ webcam in-app (máy tính)
    if (this.btnCaptureInapp) {
      this.btnCaptureInapp.addEventListener("click", () => {
        this.captureInAppPhoto();
      });
    }

    // 6. Nút đóng camera in-app
    if (this.btnCloseInapp) {
      this.btnCloseInapp.addEventListener("click", () => {
        this.stopInAppCamera();
      });
    }

    // 7. Nút đổi ảnh khác
    if (this.removePreviewBtn) {
      this.removePreviewBtn.addEventListener("click", () => {
        if (this.memoryFileInput) this.memoryFileInput.value = "";
        if (this.memoryCameraInput) this.memoryCameraInput.value = "";
        this.memoryImageInput.value = "assets/images/memory1.jpg";
        this.uploadPreviewWrapper.style.display = "none";
        if (this.photoActionButtonsGrid) this.photoActionButtonsGrid.style.display = "grid";
        this.stopInAppCamera();
      });
    }

    // 8. Nút lấy lại toạ độ vị trí
    if (this.btnRefreshGps) {
      this.btnRefreshGps.addEventListener("click", (e) => {
        e.preventDefault();
        this.autoFetchGpsLocation();
      });
    }
  }

  processUploadedFile(file) {
    const lastMod = file.lastModified || Date.now();
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target.result;
      this.compressImage(rawDataUrl, 1200, 0.85, (compressedUrl) => {
        this.setProcessedPhoto(compressedUrl, lastMod);
      });
    };
    reader.readAsDataURL(file);
  }

  async startInAppCamera() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (this.inappCameraVideo) {
          this.inappCameraVideo.srcObject = this.cameraStream;
        }
        if (this.inappCameraWrapper) this.inappCameraWrapper.style.display = "block";
        if (this.photoActionButtonsGrid) this.photoActionButtonsGrid.style.display = "none";
        return;
      }
    } catch (err) {
      console.warn("Không mở được webcam in-app, chuyển qua file picker:", err);
    }
    // Nếu webcam bị từ chối hoặc lỗi, chuyển qua input camera
    if (this.memoryCameraInput) this.memoryCameraInput.click();
  }

  stopInAppCamera() {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }
    if (this.inappCameraWrapper) this.inappCameraWrapper.style.display = "none";
    if (this.photoActionButtonsGrid && (!this.uploadPreviewWrapper || this.uploadPreviewWrapper.style.display === "none")) {
      this.photoActionButtonsGrid.style.display = "grid";
    }
  }

  captureInAppPhoto() {
    if (!this.inappCameraVideo || !this.cameraStream) return;
    const canvas = document.createElement("canvas");
    canvas.width = this.inappCameraVideo.videoWidth || 1280;
    canvas.height = this.inappCameraVideo.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(this.inappCameraVideo, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    this.stopInAppCamera();
    this.setProcessedPhoto(dataUrl, Date.now());
  }

  setProcessedPhoto(imgUrl, timestamp) {
    if (this.uploadPreviewImg) this.uploadPreviewImg.src = imgUrl;
    if (this.memoryImageInput) this.memoryImageInput.value = imgUrl;
    if (this.photoActionButtonsGrid) this.photoActionButtonsGrid.style.display = "none";
    if (this.inappCameraWrapper) this.inappCameraWrapper.style.display = "none";
    if (this.uploadPreviewWrapper) this.uploadPreviewWrapper.style.display = "block";

    // 1. Tự động gán ngày và giờ theo thời điểm chụp
    const d = new Date(timestamp || Date.now());
    const pad = (n) => String(n).padStart(2, "0");
    const dtLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    
    if (this.memoryDateInput) {
      this.memoryDateInput.value = dtLocal;
    }

    // 2. Tự động định vị toạ độ Google Maps
    this.autoFetchGpsLocation();
  }

  autoFetchGpsLocation() {
    const locInput = this.memoryLocationInput || document.getElementById("memory-location-input");
    const refreshBtn = this.btnRefreshGps || document.getElementById("btn-refresh-gps");

    if (refreshBtn) refreshBtn.classList.add("spinning");
    if (locInput && !locInput.value) {
      locInput.placeholder = "Đang định vị toạ độ...";
    }

    if (!navigator.geolocation) {
      if (refreshBtn) refreshBtn.classList.remove("spinning");
      if (locInput && !locInput.value) locInput.placeholder = "Vị trí...";
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        let placeName = "";
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&accept-language=vi`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
              const a = data.address;
              const parts = [
                a.road || a.suburb || a.neighbourhood || "",
                a.city_district || a.district || a.county || "",
                a.city || a.state || ""
              ].filter(Boolean);
              if (parts.length > 0) placeName = parts.join(", ");
            }
          }
        } catch(e) {}

        const fullLocString = placeName ? `${placeName} (${mapsUrl})` : mapsUrl;
        if (locInput) locInput.value = fullLocString;
        if (refreshBtn) refreshBtn.classList.remove("spinning");
      },
      (err) => {
        console.warn("GPS error:", err);
        if (refreshBtn) refreshBtn.classList.remove("spinning");
        if (locInput && !locInput.value) locInput.placeholder = "Vị trí...";
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }

  compressImage(dataUrl, maxWidth, quality, callback) {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const resultUrl = canvas.toDataURL("image/jpeg", quality);
      callback(resultUrl);
    };
    img.src = dataUrl;
  }

  // ==========================================
  // LẮNG NGHE SỰ KIỆN (EVENT LISTENERS)
  // ==========================================
  initEvents() {
    const openMemoryDialog = () => {
      if (!this.isAuthenticated) {
        this.showToast("Chế độ chỉ xem: Chỉ Kim & Thư mới có thể gửi khoảnh khắc mới! 💕");
        this.openAuthModal();
        return;
      }

      // Mặc định tự động điền ngày giờ hiện tại
      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const currentDt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      if (this.memoryDateInput) this.memoryDateInput.value = currentDt;

      // Reset các chế độ chụp/chọn ảnh
      if (this.photoActionButtonsGrid) this.photoActionButtonsGrid.style.display = "grid";
      if (this.inappCameraWrapper) this.inappCameraWrapper.style.display = "none";
      if (this.uploadPreviewWrapper) this.uploadPreviewWrapper.style.display = "none";
      if (this.memoryImageInput) this.memoryImageInput.value = "assets/images/memory1.jpg";

      // Tự động kích hoạt định vị GPS Google Maps
      this.autoFetchGpsLocation();

      this.memoryModal.showModal();
    };

    if (this.openAddMemoryBtn) this.openAddMemoryBtn.addEventListener("click", openMemoryDialog);
    if (this.heroAddMemoryBtn) this.heroAddMemoryBtn.addEventListener("click", openMemoryDialog);
    if (this.closeMemoryBtn) this.closeMemoryBtn.addEventListener("click", () => {
      this.stopInAppCamera();
      this.memoryModal.close();
    });
    if (this.cancelMemoryBtn) this.cancelMemoryBtn.addEventListener("click", () => {
      this.stopInAppCamera();
      this.memoryModal.close();
    });

    // Submit form thêm kỷ niệm
    this.memoryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!this.isAuthenticated) {
        this.showToast("Chế độ chỉ xem: Không thể thực hiện thay đổi! 💕");
        return;
      }
      const title = document.getElementById("memory-title-input").value.trim();
      const date = document.getElementById("memory-date-input").value;
      const location = document.getElementById("memory-location-input").value.trim() || "Cùng Nhau";
      const image = this.memoryImageInput.value.trim() || "assets/images/memory1.jpg";
      const story = document.getElementById("memory-story-input").value.trim();

      if (!title || !date) return;

      const newMemory = {
        id: "mem-" + Date.now(),
        title,
        date,
        location,
        image,
        story
      };

      this.memories.push(newMemory);
      // Sắp xếp sự kiện gần nhất lên đầu
      this.memories.sort((a, b) => new Date(b.date) - new Date(a.date));
      this.saveData("journey_memories_v3", this.memories);
      this.renderTimeline();
      this.memoryForm.reset();
      this.memoryModal.close();
      this.spawnHeartConfetti();

      if (this.config.apiUrl) {
        this.showToast("Đang đồng bộ ảnh lên Google Drive cho cả hai... ☁️");
        this.sendToBackend({ type: "memory", ...newMemory, imageBase64: newMemory.image });
      } else {
        this.showToast("⚠️ Chưa kết nối link Google Drive trong Cài Đặt nên ảnh này chỉ xem được trên máy này!", 6000);
      }
    });

    // Cài đặt thông tin
    this.openSettingsBtn.addEventListener("click", () => {
      if (!this.isAuthenticated) {
        this.showToast("Khu vực cài đặt chỉ dành cho Kim & Thư 💕");
        this.openAuthModal();
        return;
      }
      document.getElementById("cfg-him-name").value = this.config.partnerOne;
      document.getElementById("cfg-her-name").value = this.config.partnerTwo;
      document.getElementById("cfg-start-date").value = this.config.startDate.slice(0, 16);
      document.getElementById("cfg-quote").value = this.config.quote;
      const passField = document.getElementById("cfg-passcode");
      if (passField) passField.value = this.config.passcode || "kimthu";
      const apiInput = document.getElementById("cfg-api-url");
      if (apiInput) apiInput.value = this.config.apiUrl || "";

      const statusHint = document.getElementById("backend-status-hint");
      if (statusHint) {
        if (this.config.apiUrl && this.config.apiUrl.startsWith("http")) {
          statusHint.innerHTML = `<span style="color: #10b981; font-weight: 600;">🟢 Đã kết nối Google Drive & Sheets</span>`;
        } else {
          statusHint.innerHTML = `<span style="color: #e11d48; font-weight: 600;">🔴 Chưa kết nối: Hãy dán link Web App để 2 người xem chung ảnh!</span>`;
        }
      }

      this.settingsModal.showModal();
    });
    this.closeSettingsBtn.addEventListener("click", () => this.settingsModal.close());

    this.settingsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!this.isAuthenticated) {
        this.showToast("Chế độ chỉ xem: Không thể thay đổi cài đặt! 💕");
        return;
      }
      this.config.partnerOne = document.getElementById("cfg-him-name").value.trim() || "Kim";
      this.config.partnerTwo = document.getElementById("cfg-her-name").value.trim() || "Thư";
      const dateVal = document.getElementById("cfg-start-date").value;
      if (dateVal) {
        this.config.startDate = dateVal.length === 16 ? `${dateVal}:00` : dateVal;
      }
      this.config.quote = document.getElementById("cfg-quote").value.trim();
      const passField = document.getElementById("cfg-passcode");
      if (passField) this.config.passcode = passField.value.trim() || "kimthu";
      const apiInput = document.getElementById("cfg-api-url");
      if (apiInput) {
        this.config.apiUrl = apiInput.value.trim();
        if (this.config.apiUrl) this.syncFromBackend();
      }

      this.saveData("journey_config_v3", this.config);
      this.renderProfile();
      this.updateCounter();
      this.settingsModal.close();
      this.spawnHeartConfetti();
    });

    this.resetDataBtn.addEventListener("click", () => {
      if (!this.isAuthenticated) {
        this.showToast("Chế độ chỉ xem: Không thể đặt lại dữ liệu! 💕");
        return;
      }
      if (confirm("Em có muốn đặt lại các kỷ niệm mẫu mặc định không?")) {
        localStorage.removeItem("journey_config_v3");
        localStorage.removeItem("journey_memories_v3");
        localStorage.removeItem("journey_deleted_mem_ids");
        localStorage.removeItem("journey_period_v1");
        localStorage.removeItem("journey_chat_messages_v1");
        this.config = { ...DEFAULT_CONFIG };
        this.memories = [ ...DEFAULT_MEMORIES ];
        this.deletedMemoryIds = [];
        this.period = { ...DEFAULT_PERIOD };
        this.chatMessages = [ ...DEFAULT_CHAT_MESSAGES ];
        this.renderProfile();
        this.renderPeriodTracker();
        this.renderTimeline();
        this.renderChatMessages();
        this.settingsModal.close();
      }
    });

    // Lightbox đóng
    this.closeLightboxBtn.addEventListener("click", () => this.lightboxModal.close());

    // Nút bắn tim
    this.sendLoveBtn.addEventListener("click", (e) => {
      this.spawnHeartBurst(e.clientX, e.clientY);
    });

    // Chạm 2 lần bất kỳ đâu để bắn tim
    document.addEventListener("dblclick", (e) => {
      this.spawnHeartBurst(e.clientX, e.clientY);
    });

    // Bật/tắt nhạc
    this.musicToggleBtn.addEventListener("click", () => this.toggleMelody());

    // Nút mũi tên tròn xổ dọc xuống menu các chức năng
    if (this.navMenuToggleBtn && this.navDropdownWrap) {
      this.navMenuToggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = this.navDropdownWrap.classList.toggle("open");
        this.navMenuToggleBtn.setAttribute("aria-expanded", isOpen);
        if (this.navDropdownMenu) {
          this.navDropdownMenu.setAttribute("aria-hidden", !isOpen);
        }
      });

      // Đóng dropdown khi bấm bất kỳ đâu bên ngoài
      document.addEventListener("click", (e) => {
        if (!this.navDropdownWrap.contains(e.target)) {
          this.navDropdownWrap.classList.remove("open");
          this.navMenuToggleBtn.setAttribute("aria-expanded", "false");
          if (this.navDropdownMenu) {
            this.navDropdownMenu.setAttribute("aria-hidden", "true");
          }
        }
      });

      // Đóng dropdown khi bấm Esc
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.navDropdownWrap.classList.contains("open")) {
          this.navDropdownWrap.classList.remove("open");
          this.navMenuToggleBtn.setAttribute("aria-expanded", "false");
          if (this.navDropdownMenu) {
            this.navDropdownMenu.setAttribute("aria-hidden", "true");
          }
        }
      });

      // Đóng dropdown khi chọn bất kỳ chức năng nào
      if (this.navDropdownMenu) {
        this.navDropdownMenu.querySelectorAll(".dropdown-item").forEach(item => {
          item.addEventListener("click", () => {
            this.navDropdownWrap.classList.remove("open");
            this.navMenuToggleBtn.setAttribute("aria-expanded", "false");
            this.navDropdownMenu.setAttribute("aria-hidden", "true");
          });
        });
      }
    }
  }

  // ==========================================
  // HIỂN THỊ THÔNG TIN & ĐỒNG HỒ ĐẾM NGÀY YÊU
  // ==========================================
  renderProfile() {
    const coupleText = `${this.config.partnerOne} & ${this.config.partnerTwo}`;
    this.navCoupleNames.textContent = coupleText;
    this.partnerOneName.textContent = this.config.partnerOne;
    this.partnerTwoName.textContent = this.config.partnerTwo;
    this.heroQuote.textContent = this.config.quote;
  }

  startLiveCounter() {
    this.updateCounter();
    setInterval(() => this.updateCounter(), 1000);
  }

  updateCounter() {
    const start = new Date(this.config.startDate).getTime();
    const now = new Date().getTime();
    let diff = Math.max(0, now - start);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * (1000 * 60);

    const seconds = Math.floor(diff / 1000);

    this.countDays.textContent = days.toLocaleString();
    this.countHours.textContent = String(hours).padStart(2, "0");
    this.countMinutes.textContent = String(minutes).padStart(2, "0");
    this.countSeconds.textContent = String(seconds).padStart(2, "0");
  }

  // ==========================================
  // THEO DÕI NGÀY ĐẾN DÂU CỦA BÉ THƯ (NHỎ NHẮN, TINH TẾ)
  // ==========================================
  initPeriodTracker() {
    if (!this.periodModal) return;

    const openModal = (e) => {
      if (e) e.stopPropagation();
      if (!this.isAuthenticated) {
        this.showToast("Khu vực riêng tư: Chỉ dành riêng cho Kim & Thư 💕");
        this.openAuthModal();
        return;
      }
      this.periodStartDateInput.value = this.period.startDate || new Date().toISOString().split("T")[0];
      this.periodCycleLengthInput.value = this.period.cycleLength || 28;
      this.periodModal.showModal();
    };

    if (this.periodNavBtn) {
      this.periodNavBtn.addEventListener("click", openModal);
    }

    if (this.closePeriodBtn) {
      this.closePeriodBtn.addEventListener("click", () => this.periodModal.close());
    }
    if (this.cancelPeriodBtn) {
      this.cancelPeriodBtn.addEventListener("click", () => this.periodModal.close());
    }

    if (this.setPeriodTodayBtn) {
      this.setPeriodTodayBtn.addEventListener("click", () => {
        if (!this.isAuthenticated) {
          this.showToast("Chế độ chỉ xem: Không thể thực hiện thay đổi! 💕");
          return;
        }
        const todayStr = new Date().toISOString().split("T")[0];
        this.periodStartDateInput.value = todayStr;
        this.spawnHeartBurst(window.innerWidth / 2, window.innerHeight / 2);
      });
    }

    if (this.periodForm) {
      this.periodForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!this.isAuthenticated) {
          this.showToast("Chế độ chỉ xem: Không thể thực hiện thay đổi! 💕");
          return;
        }
        const startVal = this.periodStartDateInput.value;
        const cycleVal = parseInt(this.periodCycleLengthInput.value, 10) || 28;

        if (startVal) {
          this.period.startDate = startVal;
          this.period.cycleLength = cycleVal;
          this.saveData("journey_period_v1", this.period);
          this.renderPeriodTracker();
          this.periodModal.close();
          this.spawnHeartConfetti();
        }
      });
    }
  }

  renderPeriodTracker() {
    if (!this.periodPhaseText || !this.periodStatusMessage) return;

    if (!this.period || !this.period.startDate) {
      this.periodPhaseText.textContent = "Chưa cài đặt";
      this.periodStatusMessage.textContent = "Bấm vào để cài đặt ngày dâu chăm sóc bé Thư 💕";
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [y, m, d] = this.period.startDate.split("-").map(Number);
    const start = new Date(y, m - 1, d);
    start.setHours(0, 0, 0, 0);

    const cycleLength = Number(this.period.cycleLength) || 28;
    const durationDays = Number(this.period.durationDays) || 5;

    // Tính chu kỳ tiếp theo dựa trên ngày bắt đầu
    let nextStart = new Date(start.getTime());
    while (nextStart < today && (today - nextStart) >= durationDays * 86400000) {
      nextStart = new Date(nextStart.getTime() + cycleLength * 86400000);
    }

    const daysUntilNext = Math.ceil((nextStart - today) / 86400000);

    const formatShortDate = (dt) => {
      const day = dt.getDate();
      const month = dt.getMonth() + 1;
      return `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}`;
    };

    // Kiểm tra xem hiện tại có đang trong kỳ dâu không
    let isDuringPeriod = false;
    let periodDay = 1;

    const currentPeriodStart = new Date(nextStart.getTime() - cycleLength * 86400000);
    if (today >= currentPeriodStart) {
      const daysSinceCurrent = Math.floor((today - currentPeriodStart) / 86400000);
      if (daysSinceCurrent >= 0 && daysSinceCurrent < durationDays) {
        isDuringPeriod = true;
        periodDay = daysSinceCurrent + 1;
      }
    }
    if (daysUntilNext === 0) {
      isDuringPeriod = true;
      periodDay = 1;
    }

    if (isDuringPeriod) {
      this.periodPhaseText.textContent = `🌸 Đang kỳ dâu (Ngày ${periodDay}/${durationDays})`;
      this.periodStatusMessage.textContent = "Bé iu nhớ uống nước ấm, chườm bụng và nghỉ ngơi thật nhiều nhé. Anh luôn yêu và chiều chuộng bé! 🍵💕";
      if (this.periodNavBtn) this.periodNavBtn.title = `🌸 Đang kỳ dâu của bé Thư (Ngày ${periodDay}/${durationDays})`;
    } else if (daysUntilNext > 0 && daysUntilNext <= 3) {
      this.periodPhaseText.textContent = `🍓 Sắp đến kỳ dâu (còn ${daysUntilNext} ngày)`;
      this.periodStatusMessage.textContent = `Dự kiến ngày ${formatShortDate(nextStart)}. Chuẩn bị giữ ấm và để anh chăm sóc em thật chu đáo nha bé! 💕`;
      if (this.periodNavBtn) this.periodNavBtn.title = `🍓 Sắp đến kỳ dâu của bé (còn ${daysUntilNext} ngày)`;
    } else if (daysUntilNext > 0) {
      this.periodPhaseText.textContent = `✨ Dự kiến: ${formatShortDate(nextStart)} (còn ${daysUntilNext} ngày)`;
      this.periodStatusMessage.textContent = "Bé Thư nhớ uống đủ nước, ngủ thật ngon và luôn cười thật rạng rỡ nha cô gái nhỏ! 🌸";
      if (this.periodNavBtn) this.periodNavBtn.title = `Góc chăm sóc bé Thư 🍓 (Dự kiến: ${formatShortDate(nextStart)})`;
    } else {
      this.periodPhaseText.textContent = `🍓 Dự kiến: Hôm nay`;
      this.periodStatusMessage.textContent = "Nhớ giữ ấm bụng và nghỉ ngơi thoải mái nha bé iu của anh 💕";
      if (this.periodNavBtn) this.periodNavBtn.title = "Hôm nay là kỳ dâu của bé Thư 🍓";
    }
  }

  // ==========================================
  // THÔNG BÁO (ALERT) KHI GẦN TRƯỚC 3 NGÀY KỲ DÂU DỰ ĐOÁN
  // ==========================================
  checkPeriodAlert() {
    if (!this.isAuthenticated || !this.periodAlertModal || !this.period || !this.period.startDate) return;

    // Gắn sự kiện đóng / mở từ alert nếu chưa gắn
    if (this.closePeriodAlertBtn) {
      this.closePeriodAlertBtn.onclick = () => this.periodAlertModal.close();
    }
    if (this.dismissPeriodAlertBtn) {
      this.dismissPeriodAlertBtn.onclick = () => this.periodAlertModal.close();
    }
    if (this.openCareFromAlertBtn) {
      this.openCareFromAlertBtn.onclick = () => {
        this.periodAlertModal.close();
        if (this.periodModal) {
          this.periodStartDateInput.value = this.period.startDate;
          this.periodCycleLengthInput.value = this.period.cycleLength || 28;
          this.periodModal.showModal();
        }
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [y, m, d] = this.period.startDate.split("-").map(Number);
    const start = new Date(y, m - 1, d);
    start.setHours(0, 0, 0, 0);

    const cycleLength = Number(this.period.cycleLength) || 28;
    const durationDays = Number(this.period.durationDays) || 5;

    let nextStart = new Date(start.getTime());
    while (nextStart < today && (today - nextStart) >= durationDays * 86400000) {
      nextStart = new Date(nextStart.getTime() + cycleLength * 86400000);
    }

    const daysUntilNext = Math.ceil((nextStart - today) / 86400000);

    const formatShortDate = (dt) => {
      const day = dt.getDate();
      const month = dt.getMonth() + 1;
      return `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}`;
    };

    let isDuringPeriod = false;
    let periodDay = 1;

    const currentPeriodStart = new Date(nextStart.getTime() - cycleLength * 86400000);
    if (today >= currentPeriodStart) {
      const daysSinceCurrent = Math.floor((today - currentPeriodStart) / 86400000);
      if (daysSinceCurrent >= 0 && daysSinceCurrent < durationDays) {
        isDuringPeriod = true;
        periodDay = daysSinceCurrent + 1;
      }
    }
    if (daysUntilNext === 0) {
      isDuringPeriod = true;
      periodDay = 1;
    }

    // Kiểm tra điều kiện: trước ba ngày kỳ dâu dự đoán (còn <= 3 ngày) hoặc đang trong kỳ dâu
    let shouldAlert = false;

    if (isDuringPeriod) {
      this.periodAlertTitle.textContent = "🌸 Bé Thư Đang Trong Kỳ Dâu!";
      this.periodAlertCountdownPill.innerHTML = `Đang là ngày thứ <strong style="color: var(--pink-deep);">${periodDay}/${durationDays}</strong> của kỳ dâu`;
      this.periodAlertMessage.textContent = "Bé Thư nhớ uống nhiều nước ấm, trà gừng, chườm ấm bụng và nghỉ ngơi thật nhiều nhé. Anh luôn yêu thương và chiều chuộng bé! 🍵💕";
      shouldAlert = true;
    } else if (daysUntilNext > 0 && daysUntilNext <= 3) {
      this.periodAlertTitle.textContent = "🍓 Sắp Đến Kỳ Dâu Của Bé Thư!";
      this.periodAlertCountdownPill.innerHTML = `Chỉ còn <strong style="color: var(--pink-deep); font-size: 1.25rem;">${daysUntilNext}</strong> ngày nữa (Dự kiến: ${formatShortDate(nextStart)})`;
      this.periodAlertMessage.textContent = `Chỉ còn ${daysUntilNext} ngày nữa là đến kỳ dâu rồi nè! Bé iu nhớ chuẩn bị giữ ấm bụng, uống nước ấm, tránh đồ lạnh và ngủ sớm nhé. Anh luôn ở cạnh chăm sóc em! 🌸💕`;
      shouldAlert = true;
    } else if (daysUntilNext === 0) {
      this.periodAlertTitle.textContent = "🍓 Hôm Nay Là Ngày Dâu Của Bé Thư!";
      this.periodAlertCountdownPill.innerHTML = `Kỳ dâu dự kiến bắt đầu: <strong style="color: var(--pink-deep);">Hôm Nay</strong>`;
      this.periodAlertMessage.textContent = "Hôm nay là ngày dâu của bé nè. Bé nhớ giữ ấm, nghỉ ngơi thoải mái và để anh thương em nhiều hơn nha! 💕";
      shouldAlert = true;
    }

    if (shouldAlert) {
      // Hiển thị alert ngay khi truy cập trang web (delay nhẹ 600ms tạo hiệu ứng mượt mà)
      setTimeout(() => {
        if (!this.periodAlertModal.open) {
          this.periodAlertModal.showModal();
          this.spawnHeartBurst(window.innerWidth / 2, window.innerHeight / 2);
        }
      }, 650);
    }
  }

  // ==========================================
  // DÒNG THỜI GIAN LOCKET (KHUNG ẢNH & KHUNG CÂU CHUYỆN KẾ BÊN)
  // ==========================================
  renderTimeline() {
    if (this.memories.length === 0) {
      this.timelineContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted); background: rgba(255,255,255,0.7); border-radius: var(--radius-lg); border: 1px dashed var(--pink-soft);">
          <p style="font-size: 1.1rem; margin-bottom: 8px;">Chưa có khoảnh khắc Locket nào được lưu.</p>
          <small>Bấm "+ Gửi Khoảnh Khắc Mới 📸" ở trên để gửi câu chuyện đầu tiên nhé!</small>
        </div>
      `;
      return;
    }

    // Luôn sắp xếp từ sự kiện gần nhất trở về trước (mới nhất ở trên cùng)
    this.memories.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Hiển thị gọn gàng (mặc định 4 sự kiện mới nhất, có nút xem thêm nếu nhiều hơn)
    const visibleMemories = this.showAllMemories ? this.memories : this.memories.slice(0, 4);

    this.timelineContainer.innerHTML = visibleMemories.map((mem) => {
      const dateFormatted = this.formatMemoryDate(mem.date);
      const locBadgeHtml = this.formatLocationBadge(mem.location);

      return `
        <article class="locket-card" data-id="${mem.id}">
          <!-- Khung 1: Khung chứa ảnh (Locket Photo Widget) -->
          <div class="locket-photo-frame" title="Chạm để xem ảnh phóng to">
            <div class="locket-photo-inner">
              <img src="${mem.image}" alt="${this.escapeHTML(mem.title)}" loading="lazy">
              <div class="locket-photo-overlay">
                <span class="locket-sender-badge">💕 ${this.config.partnerOne} & ${this.config.partnerTwo}</span>
                ${locBadgeHtml}
              </div>
              <div class="locket-zoom-hint">🔍 Phóng to</div>
            </div>
          </div>

          <!-- Khung 2: Khung kế bên ảnh mô tả câu chuyện (Story Frame) -->
          <div class="locket-story-frame">
            <div class="locket-story-header">
              <div class="locket-time-tag">
                <span class="locket-cal-icon">🗓️</span>
                <span class="locket-date-text">${dateFormatted}</span>
              </div>
              ${this.isAuthenticated ? `<button class="locket-delete-btn" data-id="${mem.id}" title="Xóa khoảnh khắc này" aria-label="Xóa khoảnh khắc">&times;</button>` : ""}
            </div>

            <h3 class="locket-story-title">${this.escapeHTML(mem.title)}</h3>

            <div class="locket-story-body">
              <p class="locket-story-text">"${this.escapeHTML(mem.story || "Khoảnh khắc ngọt ngào của hai đứa...")}"</p>
            </div>

            <div class="locket-story-footer">
              <div class="locket-footer-heart">
                <span class="mini-heart-pulse">❤️</span>
                <span class="locket-footer-note">Locket lưu giữ theo thời gian</span>
              </div>
              <button class="locket-expand-story-btn" data-id="${mem.id}">Xem chi tiết 🌸</button>
            </div>
          </div>
        </article>
      `;
    }).join("");

    // Nút mở rộng nếu có nhiều hơn 4 kỷ niệm để trang không bị quá dài
    if (this.memories.length > 4) {
      const toggleWrap = document.createElement("div");
      toggleWrap.className = "timeline-toggle-wrapper";
      toggleWrap.innerHTML = `
        <button id="toggle-timeline-len-btn" class="btn btn-secondary btn-sm">
          ${this.showAllMemories ? "Thu gọn bớt ✨" : `Xem thêm kỷ niệm trước đó (${this.memories.length - 4}) 🌸`}
        </button>
      `;
      this.timelineContainer.appendChild(toggleWrap);

      toggleWrap.querySelector("#toggle-timeline-len-btn").addEventListener("click", () => {
        this.showAllMemories = !this.showAllMemories;
        this.renderTimeline();
      });
    }

    // Gắn sự kiện xem ảnh lớn
    this.timelineContainer.querySelectorAll(".locket-photo-frame, .locket-expand-story-btn").forEach(el => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const card = el.closest(".locket-card");
        const mem = this.memories.find(m => m.id === card.dataset.id);
        if (mem) {
          this.lightboxImg.src = mem.image;
          this.lightboxTitle.textContent = mem.title;
          const dateFormatted = this.formatMemoryDate(mem.date);
          const locBadgeHtml = this.formatLocationBadge(mem.location);
          this.lightboxDate.innerHTML = `${locBadgeHtml ? locBadgeHtml + " • " : ""}🗓️ ${dateFormatted}`;
          this.lightboxStory.textContent = mem.story;
          this.lightboxModal.showModal();
        }
      });
    });

    // Gắn sự kiện xóa khoảnh khắc
    this.timelineContainer.querySelectorAll(".locket-delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!this.isAuthenticated) {
          this.showToast("Chỉ Kim & Thư mới có quyền xóa kỷ niệm 💕");
          this.openAuthModal();
          return;
        }

        const memId = String(btn.dataset.id);
        const targetMem = this.memories.find(m => String(m.id) === memId);
        if (!targetMem) return;

        const memTitle = targetMem.title ? `"${targetMem.title}"` : "này";
        if (confirm(`Em/anh có chắc muốn xóa vĩnh viễn khoảnh khắc ${memTitle} khỏi album và Google Drive không?`)) {
          // 1. Thêm vào danh sách đã xóa để không bị đồng bộ ngược lại từ thiết bị khác
          if (!this.deletedMemoryIds.includes(memId)) {
            this.deletedMemoryIds.push(memId);
            this.saveData("journey_deleted_mem_ids", this.deletedMemoryIds);
          }

          // 2. Trích xuất fileId nếu là ảnh trên Google Drive
          let fileId = "";
          if (targetMem.image) {
            const m = targetMem.image.match(/id=([a-zA-Z0-9_-]+)/) || targetMem.image.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (m && m[1]) fileId = m[1];
          }

          // 3. Xóa khỏi bộ nhớ và giao diện cục bộ ngay lập tức
          this.memories = this.memories.filter(m => String(m.id) !== memId);
          this.saveData("journey_memories_v3", this.memories);
          this.renderTimeline();

          // 4. Gửi yêu cầu xóa lên Google Drive & Google Sheets backend
          if (this.config.apiUrl) {
            this.showToast("Đang xóa và dọn dẹp ảnh trên Google Drive... 🗑️");
            this.sendToBackend({
              type: "delete_memory",
              id: memId,
              imageUrl: targetMem.image || "",
              fileId: fileId
            });
          } else {
            this.showToast("Đã xóa khoảnh khắc trên máy này! 🗑️");
          }
        }
      });
    });
  }

  // ==========================================
  // HIỆU ỨNG CÁNH HOA RƠI (CANVAS PETALS)
  // ==========================================
  initPetalsCanvas() {
    const canvas = document.getElementById("petal-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const petals = [];
    const PETAL_COUNT = 24;

    for (let i = 0; i < PETAL_COUNT; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 8 + 6,
        speedX: Math.random() * 1.2 - 0.4,
        speedY: Math.random() * 0.8 + 0.6,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 1.5 - 0.75,
        opacity: Math.random() * 0.4 + 0.25,
        color: Math.random() > 0.4 ? "rgba(255, 184, 201," : "rgba(255, 218, 226,"
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      petals.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        ctx.fillStyle = `${p.color} ${p.opacity})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      requestAnimationFrame(animate);
    };

    animate();
  }

  // ==========================================
  // BẮN TIM LÃNG MẠN (HEARTS CONFETTI)
  // ==========================================
  spawnHeartBurst(clientX, clientY) {
    const x = clientX || window.innerWidth / 2;
    const y = clientY || window.innerHeight / 2;
    const symbols = ["💖", "🌸", "💕", "✨", "🤍", "🌷", "🥰"];
    for (let i = 0; i < 7; i++) {
      const heart = document.createElement("div");
      heart.className = "floating-click-heart";
      heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      
      const offsetX = (Math.random() - 0.5) * 80;
      const offsetY = (Math.random() - 0.5) * 40;
      heart.style.left = `${x + offsetX}px`;
      heart.style.top = `${y + offsetY}px`;
      heart.style.fontSize = `${Math.floor(Math.random() * 16 + 18)}px`;

      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 1400);
    }
  }

  spawnHeartConfetti() {
    this.spawnHeartBurst(window.innerWidth / 2, window.innerHeight / 2);
  }

  // ==========================================
  // GIAI ĐIỆU HỘP NHẠC ÊM DỊU (WEB AUDIO API)
  // ==========================================
  toggleMelody() {
    if (this.isPlayingMelody) {
      this.stopMelody();
    } else {
      this.playMelody();
    }
  }

  playMelody() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }

      this.isPlayingMelody = true;
      this.musicStatus.textContent = "Đang Phát Nhạc 🎶";
      this.musicToggleBtn.classList.add("active");

      const notes = [
        261.63, 329.63, 392.00, 523.25,
        440.00, 392.00, 329.63, 293.66,
        329.63, 392.00, 440.00, 523.25,
        587.33, 523.25, 392.00, 329.63
      ];

      let noteIdx = 0;

      const playNextNote = () => {
        if (!this.isPlayingMelody) return;
        const freq = notes[noteIdx % notes.length];
        this.playChimeTone(freq);
        noteIdx++;
        this.melodyTimer = setTimeout(playNextNote, 800);
      };

      playNextNote();
    } catch (e) {
      console.warn("Không thể bật âm thanh tự động:", e);
    }
  }

  playChimeTone(freq) {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);

    gain.gain.setValueAtTime(0.001, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.09, this.audioContext.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + 1.2);
  }

  stopMelody() {
    this.isPlayingMelody = false;
    clearTimeout(this.melodyTimer);
    this.musicStatus.textContent = "Bật Nhạc 🎵";
    this.musicToggleBtn.classList.remove("active");
  }

  // ==========================================
  // ĐỒNG BỘ GOOGLE APPS SCRIPT / DRIVE BACKEND
  // ==========================================
  sendToBackend(payload) {
    if (!this.config.apiUrl) return;
    try {
      const dataWithAuth = {
        ...payload,
        passcode: this.config.passcode || "kimthu"
      };

      // Gửi text/plain để không bị chặn bởi CORS Preflight OPTIONS trên browser
      fetch(this.config.apiUrl, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(dataWithAuth)
      })
      .then(() => {
        // Đồng bộ lại sau 3.5s để cập nhật link ảnh chính thức từ Drive
        setTimeout(() => this.syncFromBackend(), 3500);
      })
      .catch(e => console.warn("Lỗi gửi dữ liệu lên Google Drive Backend:", e));
    } catch (e) {
      console.warn("Lỗi fetch:", e);
    }
  }

  // ==========================================
  // HỘP THƯ CHAT RIÊNG TƯ (LƯU DRIVE & GOOGLE CLOUD)
  // ==========================================
  initChat() {
    this.floatingChatBtn = document.getElementById("floating-chat-btn");
    this.openChatDropdownBtn = document.getElementById("open-chat-dropdown-btn");
    this.chatDrawer = document.getElementById("chat-drawer");
    this.closeChatBtn = document.getElementById("close-chat-btn");
    this.switchChatSenderBtn = document.getElementById("switch-chat-sender-btn");
    this.currentChatSenderLabel = document.getElementById("current-chat-sender-label");
    this.chatReceiverName = document.getElementById("chat-receiver-name");
    this.chatMessagesContainer = document.getElementById("chat-messages-container");
    this.chatForm = document.getElementById("chat-form");
    this.chatTextInput = document.getElementById("chat-text-input");
    this.chatImageFileInput = document.getElementById("chat-image-file-input");
    this.chatImgPreviewBox = document.getElementById("chat-img-preview-box");
    this.chatImgPreviewTag = document.getElementById("chat-img-preview-tag");
    this.chatRemoveImgBtn = document.getElementById("chat-remove-img-btn");
    this.chatQuickHeartBtn = document.getElementById("chat-quick-heart-btn");
    this.chatUnreadDot = document.getElementById("chat-unread-dot");

    if (this.floatingChatBtn) {
      this.floatingChatBtn.addEventListener("click", () => {
        if (!this.isAuthenticated) {
          this.showToast("Hộp thư tình yêu chỉ dành riêng cho Kim & Thư 💕");
          this.openAuthModal();
          return;
        }
        this.toggleChatDrawer();
      });
    }

    if (this.openChatDropdownBtn) {
      this.openChatDropdownBtn.addEventListener("click", () => {
        if (!this.isAuthenticated) {
          this.showToast("Hộp thư tình yêu chỉ dành riêng cho Kim & Thư 💕");
          this.openAuthModal();
          return;
        }
        this.toggleChatDrawer(true);
      });
    }

    if (this.closeChatBtn) {
      this.closeChatBtn.addEventListener("click", () => this.toggleChatDrawer(false));
    }

    if (this.switchChatSenderBtn) {
      this.switchChatSenderBtn.addEventListener("click", () => this.toggleChatSender());
    }

    // Chọn ảnh gửi trong chat (tự động nén và tải lên Google Drive)
    if (this.chatImageFileInput) {
      this.chatImageFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const rawUrl = event.target.result;
          this.compressImage(rawUrl, 900, 0.82, (compressed) => {
            this.chatPendingImage = compressed;
            if (this.chatImgPreviewTag) this.chatImgPreviewTag.src = compressed;
            if (this.chatImgPreviewBox) this.chatImgPreviewBox.style.display = "flex";
            if (this.chatTextInput) this.chatTextInput.focus();
          });
        };
        reader.readAsDataURL(file);
      });
    }

    if (this.chatRemoveImgBtn) {
      this.chatRemoveImgBtn.addEventListener("click", () => this.clearChatPendingImage());
    }

    // Nút thả tim nhanh trong chat
    if (this.chatQuickHeartBtn) {
      this.chatQuickHeartBtn.addEventListener("click", () => {
        this.sendChatMessage("❤️", null);
      });
    }

    // Gửi tin nhắn
    if (this.chatForm) {
      this.chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = this.chatTextInput ? this.chatTextInput.value.trim() : "";
        if (!text && !this.chatPendingImage) return;

        this.sendChatMessage(text, this.chatPendingImage);
        if (this.chatTextInput) this.chatTextInput.value = "";
      });
    }

    this.updateChatHeaderLabels();
    this.renderChatMessages();
  }

  toggleChatDrawer(force) {
    if (!this.chatDrawer) return;
    const shouldOpen = force !== undefined ? force : !this.chatDrawer.classList.contains("open");
    if (shouldOpen) {
      this.chatDrawer.classList.add("open");
      this.chatDrawer.setAttribute("aria-hidden", "false");
      if (this.chatUnreadDot) this.chatUnreadDot.style.display = "none";
      if (this.chatTextInput) this.chatTextInput.focus();
      this.renderChatMessages();
    } else {
      this.chatDrawer.classList.remove("open");
      this.chatDrawer.setAttribute("aria-hidden", "true");
    }
  }

  toggleChatSender() {
    const him = this.config.partnerOne || "Kim";
    const her = this.config.partnerTwo || "Thư";
    this.currentSender = (this.currentSender === him) ? her : him;
    this.saveData("journey_chat_sender_v1", this.currentSender);
    this.updateChatHeaderLabels();
    this.renderChatMessages();
    this.spawnHeartBurst(window.innerWidth - 60, window.innerHeight - 60);
  }

  updateChatHeaderLabels() {
    const him = this.config.partnerOne || "Kim";
    const her = this.config.partnerTwo || "Thư";
    const receiver = (this.currentSender === him) ? her : him;

    if (this.currentChatSenderLabel) {
      this.currentChatSenderLabel.textContent = `Tôi là: ${this.currentSender}`;
    }
    if (this.chatReceiverName) {
      this.chatReceiverName.textContent = `${receiver} ❤️`;
    }
  }

  clearChatPendingImage() {
    this.chatPendingImage = null;
    if (this.chatImageFileInput) this.chatImageFileInput.value = "";
    if (this.chatImgPreviewBox) this.chatImgPreviewBox.style.display = "none";
  }

  sendChatMessage(text, imageBase64) {
    if (!this.isAuthenticated) {
      this.showToast("Chế độ chỉ xem: Bạn không thể gửi tin nhắn! 💕");
      this.openAuthModal();
      return;
    }
    if (!text && !imageBase64) return;

    const newMsg = {
      id: "msg-" + Date.now(),
      sender: this.currentSender,
      text: text || "",
      image: imageBase64 || "",
      timestamp: new Date().toISOString()
    };

    this.chatMessages.push(newMsg);
    this.saveData("journey_chat_messages_v1", this.chatMessages);
    this.renderChatMessages();
    this.clearChatPendingImage();
    this.spawnHeartBurst(window.innerWidth - 60, window.innerHeight - 60);

    // Lưu vào Google Drive và Google Sheet Backend
    if (this.config.apiUrl) {
      this.sendToBackend({
        type: "chat_message",
        ...newMsg,
        imageBase64: imageBase64 || ""
      });
    } else if (imageBase64) {
      this.showToast("⚠️ Lưu ý: Chưa kết nối link Google Drive trong Cài Đặt nên ảnh này chỉ lưu trên máy bạn!");
    }
  }

  renderChatMessages() {
    if (!this.chatMessagesContainer) return;
    this.chatMessagesContainer.innerHTML = this.chatMessages.map(msg => {
      const isSent = msg.sender === this.currentSender;
      const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
      return `
        <div class="chat-msg-row ${isSent ? 'sent' : 'received'}">
          <span class="chat-msg-sender-name">${this.escapeHTML(msg.sender)}</span>
          <div class="chat-bubble">
            ${msg.image ? `<img src="${msg.image}" alt="Ảnh tin nhắn" class="chat-msg-img" onclick="window.journeyApp.viewChatImage('${msg.image}')">` : ""}
            ${msg.text ? `<div>${this.escapeHTML(msg.text)}</div>` : ""}
          </div>
          <span class="chat-msg-time">${timeStr}</span>
        </div>
      `;
    }).join("");

    this.chatMessagesContainer.scrollTop = this.chatMessagesContainer.scrollHeight;
  }

  viewChatImage(url) {
    if (this.lightboxModal && this.lightboxImg) {
      this.lightboxImg.src = url;
      this.lightboxTitle.textContent = "Ảnh Từ Hộp Thư Chat 💕";
      this.lightboxDate.textContent = "Lưu trữ an toàn trên Google Drive";
      this.lightboxStory.textContent = "";
      this.lightboxModal.showModal();
    }
  }

  syncFromBackend() {
    if (!this.config.apiUrl) return;
    const fetchUrl = this.config.apiUrl + (this.isAuthenticated ? `?passcode=${encodeURIComponent(this.config.passcode || "kimthu")}` : "");
    fetch(fetchUrl)
      .then(res => res.json())
      .then(data => {
        if (data.memories && Array.isArray(data.memories)) {
          this.syncMemories(data.memories);
        }
        if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          let hasNew = false;
          data.messages.forEach(serverMsg => {
            const existingIdx = this.chatMessages.findIndex(m => m.id === serverMsg.id);
            if (existingIdx === -1) {
              this.chatMessages.push(serverMsg);
              hasNew = true;
            } else if (serverMsg.image && serverMsg.image !== this.chatMessages[existingIdx].image) {
              this.chatMessages[existingIdx].image = serverMsg.image;
              hasNew = true;
            }
          });
          if (hasNew) {
            this.saveData("journey_chat_messages_v1", this.chatMessages);
            this.renderChatMessages();
            if (this.chatUnreadDot && (!this.chatDrawer || !this.chatDrawer.classList.contains("open"))) {
              this.chatUnreadDot.style.display = "block";
            }
          }
        }
      })
      .catch(e => console.warn("Chưa đồng bộ được từ Google Drive:", e));
  }

  syncMemories(serverMemories) {
    if (!Array.isArray(serverMemories)) return;

    // 1. Lọc bỏ các kỷ niệm mà người dùng đã bấm xóa trên thiết bị này
    const validServer = serverMemories.filter(sm => !this.deletedMemoryIds.includes(String(sm.id)));

    // 2. Giữ lại các kỷ niệm mặc định nếu chúng chưa bị xóa (mem-1, mem-2, mem-3)
    const defaultMems = DEFAULT_MEMORIES.filter(dm => 
      !this.deletedMemoryIds.includes(String(dm.id)) &&
      !validServer.some(sm => String(sm.id) === String(dm.id))
    );

    // 3. Giữ lại các kỷ niệm cục bộ vừa mới được tạo trong vòng 60 giây (đang đợi backend lưu)
    const now = Date.now();
    const pendingLocal = this.memories.filter(m => {
      const mid = String(m.id);
      if (this.deletedMemoryIds.includes(mid)) return false;
      if (validServer.some(sm => String(sm.id) === mid)) return false;
      if (["mem-1", "mem-2", "mem-3"].includes(mid)) return false;
      // Trích xuất timestamp từ ID nếu dạng 'mem-1792435...'
      const rawNum = parseInt(mid.replace(/\D/g, "")) || 0;
      return (now - rawNum) < 60000;
    });

    // 4. Tổng hợp danh sách kỷ niệm mới
    const combinedMap = new Map();
    validServer.forEach(m => combinedMap.set(String(m.id), m));
    pendingLocal.forEach(m => {
      if (!combinedMap.has(String(m.id))) combinedMap.set(String(m.id), m);
    });
    defaultMems.forEach(m => {
      if (!combinedMap.has(String(m.id))) combinedMap.set(String(m.id), m);
    });

    const newMemoriesList = Array.from(combinedMap.values());
    newMemoriesList.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 5. So sánh với this.memories hiện tại, chỉ re-render nếu có sự thay đổi
    const curHash = this.memories.map(m => `${m.id}_${(m.image || "").slice(0, 30)}`).join("|");
    const newHash = newMemoriesList.map(m => `${m.id}_${(m.image || "").slice(0, 30)}`).join("|");

    if (curHash !== newHash) {
      this.memories = newMemoriesList;
      this.saveData("journey_memories_v3", this.memories);
      this.renderTimeline();
    }
  }

  mergeMemories(serverMemories) {
    this.syncMemories(serverMemories);
  }

  formatLocationBadge(locationStr) {
    if (!locationStr) return "";
    const match = locationStr.match(/(https?:\/\/[^\s\)]+)/);
    if (match) {
      const url = match[1];
      let label = locationStr.replace(url, "").replace(/[\(\)]/g, "").trim();
      if (!label || label === "-") label = "Toạ độ Google Maps";
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="locket-loc-badge locket-loc-link" title="Xem trên Google Maps" onclick="event.stopPropagation()">📍 ${this.escapeHTML(label)} ↗</a>`;
    }
    return `<span class="locket-loc-badge">📍 ${this.escapeHTML(locationStr)}</span>`;
  }

  formatMemoryDate(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("T");
    const dateParts = parts[0].split("-");
    let formatted = parts[0];
    if (dateParts.length === 3) {
      formatted = `Ngày ${parseInt(dateParts[2])} tháng ${parseInt(dateParts[1])}, ${dateParts[0]}`;
    }
    if (parts.length > 1 && parts[1]) {
      const timeParts = parts[1].split(":");
      if (timeParts.length >= 2) {
        formatted = `${timeParts[0]}:${timeParts[1]} • ${formatted}`;
      }
    }
    return formatted;
  }

  escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.journeyApp = new JourneyApp();
});
