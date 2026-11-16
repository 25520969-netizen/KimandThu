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
  passcode: ""
};

// Chỉ chấp nhận link backend dạng Google Apps Script Web App (SEC-04)
const APPS_SCRIPT_URL_PATTERN = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/;
const AUTH_REQUEST_TIMEOUT_MS = 10000;
const MEMORY_IMAGE_URL_OPTIONS = { allowRelative: true, allowDataImage: true };
const DEFAULT_PERIOD_DAYS = 5;
const MS_PER_DAY = 86400000;
const MS_PER_HOUR = 3600000;
const MS_PER_MINUTE = 60000;
const MS_PER_SECOND = 1000;
const DEFAULT_CYCLE_DAYS = 28;
const BE_RING_SIZE_PX = 200;
const BE_CARE_TEXT = {
  during: "Uống nhiều nước ấm, chườm ấm bụng và nghỉ ngơi thật nhiều nhé.",
  soon: "Kỳ sắp tới rồi, nhớ mang theo đồ cần thiết và giữ ấm bụng nhé.",
  before: "Uống đủ nước, ngủ đủ giấc và cười thật nhiều nhé."
};
const LAST_SYNC_KEY = "journey_last_sync_at";
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const STORY_MAX_HEIGHT_PX = 240;
const HIGHLIGHT_MS = 360;
const HEART_BURST_MS = 800;
const HEART_BURST_COUNT = 8;
const SYNC_TOAST_GAP_MS = 60000;
const PLACES_SKELETON_ROWS = 4;
const TIMELINE_SKELETON_CARDS = 3;
const EMPTY_ART_PX = 64;
const FLIP_MS = 220;
const HAPTIC_TICK_MS = 10;
const HAPTIC_SETTING_KEY = "journey_chat_vibrate_v1";
const PETALS_SETTING_KEY = "kimthu_petals";
const CELEBRATED_KEY = "journey_celebrated_v1";
const CELEBRATE_MS = 1200;
const CELEBRATE_BANNER_MS = 4000;
const ROLL_UP_FROM_DAYS = 30;
const TOAST_DEFAULT_MS = 4000;
const TOAST_ACTION_MS = 5000;
const DIALOG_PRIORITY = { periodAlert: 2, other: 3 };
const VIEW_NAMES = ["moments", "places", "be"];
const SYNC_CURSOR_KEY = "journey_sync_cursor_v2";
const SYNC_CURSOR_OVERLAP_MS = 5000;
const POST_TIMEOUT_MS = 60000;
const GET_TIMEOUT_MS = 20000;
const GEO_MIN_GAP_MS = 1100;
const ROUTE_CACHE_KEY = "journey_route_cache_v1";
const TIMELINE_VIEW_KEY = "journey_timeline_view";
const PERIOD_ALERT_SEEN_KEY = "journey_period_alert_seen_v1";
// Dữ liệu của chat và ghi chú hẹn giờ (đã gỡ): xóa khỏi máy khi khởi động
const RETIRED_STORAGE_KEYS = ["journey_chat_messages_v1", "journey_notes_v1", "journey_chat_sender_v1", "journey_chat_sender_chosen_v1"];
const DEFAULT_MEMORY_IDS = ["mem-1", "mem-2", "mem-3"];
const DEFAULT_PLACE_IDS = ["place-1", "place-2", "place-3"];


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

const DEFAULT_PLACES = [
  {
    id: "place-1",
    name: "Ga Tàu Thuỷ Bạch Đằng (Waterbus)",
    mapUrl: "https://www.google.com/maps?q=10.773347,106.706346",
    tiktokUrl: "https://www.tiktok.com",
    lat: 10.773347,
    lng: 106.706346,
    notes: "Ngắm hoàng hôn trên sông Sài Gòn và đón gió mát cùng bé Thư 🌅",
    visited: false,
    createdAt: "2026-10-21T12:00:00"
  },
  {
    id: "place-2",
    name: "Hồ Con Rùa (Công trường Quốc Tế)",
    mapUrl: "https://www.google.com/maps?q=10.782639,106.695833",
    tiktokUrl: "https://www.tiktok.com",
    lat: 10.782639,
    lng: 106.695833,
    notes: "Ăn bánh tráng nướng, uống trà dâu và hóng gió đêm 🍓",
    visited: true,
    createdAt: "2026-10-20T10:00:00"
  },
  {
    id: "place-3",
    name: "Bảo Tàng Mỹ Thuật TP.HCM",
    mapUrl: "https://www.google.com/maps?q=10.769919,106.699389",
    tiktokUrl: "https://www.tiktok.com",
    lat: 10.769919,
    lng: 106.699389,
    notes: "Chụp ảnh phong cách vintage cho bé Thư 📸",
    visited: false,
    createdAt: "2026-10-19T15:00:00"
  }
];

// ==========================================
// BỘ QUẢN LÝ ỨNG DỤNG (JOURNEY APP)
// ==========================================
class JourneyApp {
  constructor() {
    this.config = this.loadData("journey_config_v3", DEFAULT_CONFIG);
    this.purgeRetiredLocalData();
    if (!this.config.apiUrl || this.config.apiUrl.trim() === "") {
      this.config.apiUrl = DEFAULT_CONFIG.apiUrl;
      this.saveData("journey_config_v3", this.config);
    }
    this.memories = this.loadData("journey_memories_v3", DEFAULT_MEMORIES);
    this.deletedMemoryIds = this.loadData("journey_deleted_mem_ids", []);
    this.places = this.loadData("journey_places_v2", DEFAULT_PLACES);
    this.deletedPlaceIds = this.loadData("journey_deleted_place_ids", []);
    this.placesFilter = "unvisited";
    this.dialogQueue = new DialogQueue({ setTimeout: (fn, ms) => window.setTimeout(fn, ms) });
    this.undo = new UndoQueue({ setTimeout: (fn, ms) => window.setTimeout(fn, ms), clearTimeout: (id) => window.clearTimeout(id) });
    this.pendingDeleteIds = { memory: new Set(), place: new Set() };
    window.addEventListener("pagehide", () => this.undo.flushAll());
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") this.undo.flushAll(); });
    this.lastUserPosition = this.loadData("journey_last_user_pos", null);
    this.placeDistances = new Map();
    this.placeRoutes = new Map();
    this.period = this.normalizePeriod(this.loadData("journey_period_v1", DEFAULT_PERIOD));
    this.timelineView = this.loadData(TIMELINE_VIEW_KEY, "feed") === "grid" ? "grid" : "feed";
    this.pendingMemoryPlaceId = "";
    this.audioContext = null;
    this.isPlayingMelody = false;
    this.melodyTimer = null;
    this.isAuthenticated = false;
    this.toastTimer = null;
    this.syncCursor = Number(this.loadData(SYNC_CURSOR_KEY, 0)) || 0;
    this.syncEngine = null;
    this.isSyncing = false;
    this.pollTimer = null;
    this.lastActivityAt = Date.now();
    this.geocodeQueue = createSpacedQueue(GEO_MIN_GAP_MS);
    this.routeQueue = createSpacedQueue(GEO_MIN_GAP_MS);
    this.routeCache = this.loadData(ROUTE_CACHE_KEY, {});

    this.initDOM();
    this.initAuth();
    this.initEvents();
    this.initPeriodTracker();
    this.initPhotoUpload();
    this.initPlaces();
    this.initTimelineViewToggle();
    this.startLiveCounter();
    this.renderProfile();
    this.renderPeriodTracker();
    this.renderTimeline();
    this.renderPlaces();
    this.hasInitialRender = true;
    this.initPetalsCanvas();
    this.bindOfflineBanner();
    this.checkPeriodAlert();
    this.syncReady = this.initSync();
  }

  // Xóa dữ liệu chat / ghi chú hẹn giờ đã lưu trên máy (tính năng đã bị gỡ)
  purgeRetiredLocalData() {
    try {
      RETIRED_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      console.warn("Không xóa được dữ liệu cũ:", e);
    }
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
      return true;
    } catch (e) {
      console.error("Lỗi lưu dữ liệu:", e);
      this.showToast("Bộ nhớ trên máy đã đầy nên chưa lưu được. Hãy xóa bớt ảnh cũ nhé!", 6000);
      return false;
    }
  }

  // Ảnh base64 chưa đồng bộ nằm trong hàng đợi IndexedDB, không lưu vào localStorage (BUG-11)
  persistMemories() {
    const slim = this.memories.map((m) => (String(m.image || "").startsWith("data:") ? { ...m, image: "" } : m));
    this.saveData("journey_memories_v3", slim);
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
    this.heroTitle = document.getElementById("hero-title");
    this.avatarOne = document.getElementById("avatar-one");
    this.avatarTwo = document.getElementById("avatar-two");
    this.heroHeartBtn = document.getElementById("hero-heart-btn");

    // Live Counter
    this.countDays = document.getElementById("count-days");
    this.countHours = document.getElementById("count-hours");
    this.countMinutes = document.getElementById("count-minutes");
    this.countSeconds = document.getElementById("count-seconds");

    // Timeline & Modals
    this.timelineContainer = document.getElementById("timeline-list-container");
    this.memoryModal = document.getElementById("memory-modal");
    this.memoryForm = document.getElementById("memory-form");
    this.closeMemoryBtn = document.getElementById("close-memory-modal-btn");

    // Period Tracker (Thanh công cụ & Modal & Alert)
    this.periodChipText = document.getElementById("period-chip-text");
    this.periodChip = document.getElementById("period-chip");
    this.milestoneLine = document.getElementById("milestone-line");
    this.milestoneFill = document.getElementById("milestone-fill");
    this.milestoneBar = document.getElementById("milestone-bar");
    this.heroDays = document.getElementById("hero-days");
    this.onThisDayCard = document.getElementById("on-this-day-card");
    this.periodModal = document.getElementById("period-modal");
    this.periodForm = document.getElementById("period-form");
    this.closePeriodBtn = document.getElementById("close-period-modal-btn");
    this.periodStartDateInput = document.getElementById("period-start-date-input");
    this.periodDurationInput = document.getElementById("period-duration-input");

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

    // Lightbox
    this.lightboxModal = document.getElementById("photo-lightbox");
    this.lightboxImg = document.getElementById("lightbox-img");
    this.memoryDetailModal = document.getElementById("memory-detail-modal");
    this.closeLightboxBtn = document.getElementById("close-lightbox-btn");

    // Audio & Hearts
    this.musicToggleBtn = document.getElementById("music-toggle-btn");

    // Photo Upload, Camera & GPS Elements
    this.memoryFileInput = document.getElementById("memory-file-input");
    this.btnGalleryTrigger = document.getElementById("btn-gallery-trigger");
    this.memoryImageInput = document.getElementById("memory-image-input");
    this.uploadPreviewWrapper = document.getElementById("upload-preview-wrapper");
    this.uploadPreviewImg = document.getElementById("upload-preview-img");
    this.removePreviewBtn = document.getElementById("remove-preview-btn");
    this.btnRefreshGps = document.getElementById("btn-refresh-gps");
    this.memoryDateInput = document.getElementById("memory-date-input");
    this.memoryLocationInput = document.getElementById("memory-location-input");

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

    // Places Wishlist
    this.placesListContainer = document.getElementById("places-list-container");
    this.reloadPlacesGpsBtn = document.getElementById("reload-places-gps-btn");
    this.placeModal = document.getElementById("place-modal");
    this.placeForm = document.getElementById("place-form");
    this.closePlaceModalBtn = document.getElementById("close-place-modal-btn");
    this.placeNameInput = document.getElementById("place-name-input");
    this.placeMapInput = document.getElementById("place-map-input");
    this.placeTiktokInput = document.getElementById("place-tiktok-input");
    this.placeNotesInput = document.getElementById("place-notes-input");
    this.btnPlaceUseCurrentGps = document.getElementById("btn-place-use-current-gps");
    this.countPlacesUnvisited = document.getElementById("count-places-unvisited");
    this.countPlacesVisited = document.getElementById("count-places-visited");

    // Nút Tiện ích GPS & Thêm nơi đang đứng
    this.checkVisitedGpsBtn = document.getElementById("check-visited-gps-btn");
    this.addCurrentLocationBtn = document.getElementById("add-current-location-btn");

    // Modal: Kết quả quét vị trí
    this.checkResultModal = document.getElementById("check-location-result-modal");
    this.closeCheckResultBtn = document.getElementById("close-check-result-btn");
    this.checkResultCloseActionBtn = document.getElementById("check-result-close-action-btn");
    this.checkResultPrimaryBtn = document.getElementById("check-result-primary-btn");
    this.checkResultPrimaryText = document.getElementById("check-result-primary-text");
    this.checkResultTitle = document.getElementById("check-result-title");
    this.checkResultDesc = document.getElementById("check-result-desc");

    // Modal: Thêm vị trí đang đứng vào Đã Đến
    this.addCurrentLocModal = document.getElementById("add-current-location-modal");
    this.closeAddCurrentLocBtn = document.getElementById("close-current-loc-modal-btn");
    this.addCurrentLocForm = document.getElementById("add-current-loc-form");
    this.currentLocCoordsDisplay = document.getElementById("current-loc-coords-display");
    this.currentLocNameInput = document.getElementById("current-loc-name-input");
    this.currentLocNotesInput = document.getElementById("current-loc-notes-input");
    this.currentLocTiktokInput = document.getElementById("current-loc-tiktok-input");
    this.currentLocHint = document.getElementById("current-loc-hint");
    this.tempCurrentLocData = null;

    // SPA Views & Navigation
    this.viewMoments = document.getElementById("view-moments");
    this.viewPlaces = document.getElementById("view-places");
    this.viewBe = document.getElementById("view-be");
    this.navLogoBtn = document.getElementById("nav-logo-btn");
    this.currentView = "moments";
  }

  // ==========================================
  // XÁC THỰC QUYỀN TRUY CẬP (KIM & THƯ VS KHÁCH)
  // ==========================================
  initAuth() {
    // 1. Kiểm tra URL query param: ?key=... hoặc ?code=... hoặc ?pass=... và ?api=...
    const urlParams = new URLSearchParams(window.location.search);
    const secretKey = urlParams.get("key") || urlParams.get("code") || urlParams.get("pass");
    const apiUrlParam = urlParams.get("api");

    this.applyApiUrlParam(apiUrlParam);

    // 2. Trạng thái đã mở khóa trước đó trên máy này (server sẽ xác nhận lại ở lần đồng bộ đầu tiên)
    const token = this.loadData("journey_auth_token", null);
    this.isAuthenticated = (token === "unlocked");

    // 1b. Link tự mở khóa: gỡ mật mã khỏi thanh địa chỉ ngay, rồi xác thực với server
    if (secretKey) {
      window.history.replaceState({}, document.title, window.location.pathname);
      this.unlockFromMagicLink(secretKey);
    }

    if (this.authUnlockNavBtn) {
      this.authUnlockNavBtn.addEventListener("click", () => {
        this.openAuthModal();
      });
    }

    if (this.authLockNavBtn) {
      this.authLockNavBtn.addEventListener("click", async () => {
        const confirmed = await confirmSheet({
          title: "Chuyển sang chế độ khách?",
          body: "Trên máy này sẽ chỉ xem được khoảnh khắc và địa điểm cho đến khi mở khóa lại.",
          confirmLabel: "Chuyển",
          cancelLabel: "Ở lại",
          danger: true
        });
        if (!confirmed) return;
        this.isAuthenticated = false;
        this.saveData("journey_auth_token", "locked");
        this.applyAuthMode();
        if (this.settingsModal && this.settingsModal.open) this.settingsModal.close();
        this.showToast("Đã chuyển sang chế độ khách.");
      });
    }

    if (this.closeAuthModalBtn) {
      this.closeAuthModalBtn.addEventListener("click", () => this.closeAuthModal());
    }
    if (this.cancelAuthBtn) {
      this.cancelAuthBtn.addEventListener("click", () => this.closeAuthModal());
    }

    const toggleBtn = document.getElementById("auth-toggle-password-btn");
    if (toggleBtn && this.authPasscodeInput) {
      toggleBtn.addEventListener("click", () => {
        const show = this.authPasscodeInput.type === "password";
        this.authPasscodeInput.type = show ? "text" : "password";
        toggleBtn.setAttribute("aria-label", show ? "Ẩn mật mã" : "Hiện mật mã");
        toggleBtn.innerHTML = icon(show ? "eye-off" : "eye");
      });
    }

    if (this.authForm) {
      this.authForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const inputPass = this.authPasscodeInput ? this.authPasscodeInput.value : "";
        const result = await this.tryUnlock(inputPass);
        if (result === "ok") {
          if (this.authErrorMsg) this.authErrorMsg.hidden = true;
          this.closeAuthModal();
          this.applyAuthMode();
          this.showToast("Đã mở khóa. Chào mừng Kim & Thư.");
          this.syncFromBackend();

          if (typeof this.pendingAuthSuccessCallback === "function") {
            const cb = this.pendingAuthSuccessCallback;
            this.pendingAuthSuccessCallback = null;
            setTimeout(() => cb(), 150);
          }
        } else {
          if (this.authErrorMsg) {
            this.authErrorMsg.querySelector("span").textContent = result === "offline"
              ? "Chưa kết nối được máy chủ để kiểm tra mật mã. Kiểm tra mạng rồi thử lại nhé."
              : "Mật mã chưa đúng. Thử lại nhé.";
            this.authErrorMsg.hidden = false;
          }
          if (this.authPasscodeInput) {
            this.authPasscodeInput.focus();
            this.authPasscodeInput.select();
          }
        }
      });
    }

    if (this.copySecretLinkBtn) {
      this.copySecretLinkBtn.addEventListener("click", () => {
        const pass = this.config.passcode;
        if (!pass) {
          this.showToast("Hãy mở khóa trước khi sao chép link tự mở khóa nhé");
          return;
        }
        let secretLink = `${window.location.origin}${window.location.pathname}?key=${encodeURIComponent(pass)}`;
        if (this.config.apiUrl) {
          secretLink += `&api=${encodeURIComponent(this.config.apiUrl)}`;
        }
        navigator.clipboard.writeText(secretLink).then(() => {
          this.showToast("Đã sao chép link tự mở khóa & đồng bộ Google Drive! Gửi link này cho Thư nhé");
        }).catch(() => {
          prompt("Sao chép link này gửi cho Thư nha:", secretLink);
        });
      });
    }

    this.applyAuthMode();
  }

  // Link ?api=: ch\u1ec9 nh\u1eadn \u0111\u00fang d\u1ea1ng Apps Script Web App v\u00e0 ph\u1ea3i \u0111\u01b0\u1ee3c ng\u01b0\u1eddi d\u00f9ng x\u00e1c nh\u1eadn (SEC-04)
  applyApiUrlParam(rawParam) {
    if (!rawParam) return;
    let candidate = "";
    try {
      candidate = decodeURIComponent(rawParam).trim();
    } catch (e) {
      console.warn("Tham s\u1ed1 api trong link kh\u00f4ng h\u1ee3p l\u1ec7:", e);
      return;
    }
    if (!APPS_SCRIPT_URL_PATTERN.test(candidate)) {
      console.warn("B\u1ecf qua tham s\u1ed1 api: kh\u00f4ng ph\u1ea3i link Google Apps Script Web App.");
      return;
    }
    if (candidate === this.config.apiUrl) return;
    const accepted = confirm(`Link n\u00e0y mu\u1ed1n \u0111\u1ed5i n\u01a1i l\u01b0u d\u1eef li\u1ec7u sang:\n${candidate}\n\nCh\u1ec9 \u0111\u1ed3ng \u00fd n\u1ebfu ch\u00ednh Kim ho\u1eb7c Th\u01b0 g\u1eedi link n\u00e0y. \u0110\u1ed5i nh\u00e9?`);
    if (!accepted) return;
    this.config.apiUrl = candidate;
    this.saveData("journey_config_v3", this.config);
  }

  // H\u1ecfi m\u00e1y ch\u1ee7 xem m\u1eadt m\u00e3 c\u00f3 \u0111\u00fang kh\u00f4ng. N\u00e9m l\u1ed7i n\u1ebfu kh\u00f4ng li\u00ean l\u1ea1c \u0111\u01b0\u1ee3c m\u00e1y ch\u1ee7.
  async verifyPasscode(pass) {
    const candidate = String(pass || "").trim();
    if (!candidate) return false;
    if (!this.config.apiUrl) throw new Error("Ch\u01b0a c\u1ea5u h\u00ecnh link backend");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`${this.config.apiUrl}?passcode=${encodeURIComponent(candidate)}`, { signal: controller.signal });
      const data = await res.json();
      return data.isAuth === true;
    } finally {
      clearTimeout(timer);
    }
  }

  // @returns {"ok" | "wrong" | "offline"}
  async tryUnlock(pass) {
    try {
      if (!(await this.verifyPasscode(pass))) return "wrong";
    } catch (e) {
      console.warn("Kh\u00f4ng x\u00e1c th\u1ef1c \u0111\u01b0\u1ee3c m\u1eadt m\u00e3 v\u1edbi m\u00e1y ch\u1ee7:", e);
      return "offline";
    }
    this.config.passcode = String(pass).trim();
    this.saveData("journey_config_v3", this.config);
    this.isAuthenticated = true;
    this.saveData("journey_auth_token", "unlocked");
    this.resetSyncCursor(); // lần kéo kế tiếp lấy đầy đủ cả tin nhắn riêng tư
    return "ok";
  }

  async unlockFromMagicLink(secretKey) {
    const result = await this.tryUnlock(secretKey);
    if (result === "ok") {
      this.applyAuthMode();
      this.showToast("Ch\u00e0o m\u1eebng Kim & Th\u01b0 \ud83d\udc95 \u0110\u00e3 m\u1edf kh\u00f3a to\u00e0n b\u1ed9 quy\u1ec1n!");
      this.syncFromBackend();
      return;
    }
    this.showToast(result === "offline"
      ? "Ch\u01b0a k\u1ebft n\u1ed1i \u0111\u01b0\u1ee3c m\u00e1y ch\u1ee7 \u0111\u1ec3 m\u1edf kh\u00f3a. Th\u1eed l\u1ea1i sau nh\u00e9 \ud83d\udc95"
      : "Link m\u1edf kh\u00f3a kh\u00f4ng \u0111\u00fang ho\u1eb7c \u0111\u00e3 h\u1ebft h\u1ea1n \ud83d\udc95");
  }

  // M\u00e1y ch\u1ee7 b\u00e1o m\u1eadt m\u00e3 kh\u00f4ng c\u00f2n h\u1ee3p l\u1ec7 (\u0111\u00e3 \u0111\u1ed5i) \u2192 quay v\u1ec1 ch\u1ebf \u0111\u1ed9 kh\u00e1ch
  lockForRejectedPasscode() {
    this.isAuthenticated = false;
    this.config.passcode = "";
    this.saveData("journey_config_v3", this.config);
    this.saveData("journey_auth_token", "locked");
    this.applyAuthMode();
    this.showToast("M\u1eadt m\u00e3 \u0111\u00e3 thay \u0111\u1ed5i. H\u00e3y nh\u1eadp l\u1ea1i m\u1eadt m\u00e3 m\u1edbi \u0111\u1ec3 m\u1edf kh\u00f3a \ud83d\udd10", 5000);
  }

  openAuthModal(callback = null, customMessage = null) {
    if (!this.authModal) return;
    this.pendingAuthSuccessCallback = (typeof callback === "function") ? callback : null;
    const descEl = document.getElementById("auth-modal-desc");
    if (descEl) {
      descEl.textContent = customMessage || "Nhập mật mã để nhắn tin, gửi ảnh và dùng góc chăm sóc bé.";
    }
    if (this.authErrorMsg) this.authErrorMsg.hidden = true;
    if (this.authPasscodeInput) {
      this.authPasscodeInput.value = "";
      this.authPasscodeInput.type = "password";
    }
    this.authModal.showModal();
    if (this.authPasscodeInput) {
      setTimeout(() => this.authPasscodeInput.focus(), 100);
    }
  }

  closeAuthModal() {
    this.pendingAuthSuccessCallback = null;
    if (this.authModal && this.authModal.open) this.authModal.close();
  }

  applyAuthMode() {
    if (this.isAuthenticated) {
      document.body.classList.remove("is-guest");
      this.checkPeriodAlert();
    } else {
      document.body.classList.add("is-guest");

      if (this.periodAlertModal && this.periodAlertModal.open) this.periodAlertModal.close();
      if (this.periodModal && this.periodModal.open) this.periodModal.close();
      if (this.settingsModal && this.settingsModal.open) this.settingsModal.close();
      if (this.memoryModal && this.memoryModal.open) this.memoryModal.close();
      if (this.placeModal && this.placeModal.open) this.placeModal.close();
    }

    // Nút xóa được chọn lúc render nên phải vẽ lại khi trạng thái khóa/mở thay đổi (BUG-09)
    if (this.hasInitialRender) {
      this.renderTimeline();
      this.renderPlaces();
    }
  }

  autoGrow(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, STORY_MAX_HEIGHT_PX) + "px";
  }

  /** The memory form's values as one string, to detect unsaved changes. */
  memoryFormSnapshot() {
    const ids = ["memory-title-input", "memory-date-input", "memory-location-input", "memory-story-input", "memory-image-input"];
    return ids.map((id) => document.getElementById(id).value).join("\u0001");
  }

  /** @returns {Promise<boolean>} true when the sheet may close (nothing changed, or the user chose "Bỏ"). */
  async confirmDiscardMemory() {
    if (this.memoryFormSnapshot() === this.memorySnapshot) return true;
    return confirmSheet({
      title: "Bỏ khoảnh khắc đang viết?",
      confirmLabel: "Bỏ",
      cancelLabel: "Viết tiếp",
      danger: true
    });
  }

  /**
   * Opens the add / edit moment sheet.
   * @param {{prefill?: {title: string, location: string, placeId: string}, edit?: object}} [opts]
   */
  openMemoryDialog(opts = {}) {
    if (!this.isAuthenticated) {
      this.openAuthModal(() => this.openMemoryDialog(opts), "Nhập mật mã để gửi khoảnh khắc mới.");
      return;
    }
    const edit = opts.edit || null;
    const prefill = opts.prefill || null;
    this.editingMemoryId = edit ? String(edit.id) : "";
    this.pendingMemoryPlaceId = prefill ? prefill.placeId : "";
    this.memoryForm.reset();
    ["memory-title-error", "memory-photo-error"].forEach((id) => { document.getElementById(id).hidden = true; });
    document.getElementById("memory-modal-title").textContent = edit ? "Sửa khoảnh khắc" : "Khoảnh khắc mới";
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    this.memoryDateInput.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    this.clearMemoryPhoto();
    this.removePreviewBtn.hidden = false;
    const note = document.getElementById("memory-photo-note");
    note.hidden = true;
    document.getElementById("photo-drop").hidden = false;
    if (edit) this.fillMemoryFormForEdit(edit, note);
    if (prefill) {
      document.getElementById("memory-title-input").value = prefill.title;
      this.memoryLocationInput.value = prefill.location;
    }
    this.autoGrow(document.getElementById("memory-story-input"));
    const save = document.getElementById("save-memory-btn");
    save.setAttribute("aria-busy", "false");
    save.textContent = "Lưu khoảnh khắc";
    this.memorySnapshot = this.memoryFormSnapshot();
    this.memoryModal.showModal();
  }

  fillMemoryFormForEdit(mem, note) {
    document.getElementById("memory-title-input").value = mem.title || "";
    this.memoryDateInput.value = String(mem.date || "").slice(0, 16);
    this.memoryLocationInput.value = mem.location || "";
    document.getElementById("memory-story-input").value = mem.story || "";
    const image = safeUrl(mem.image, MEMORY_IMAGE_URL_OPTIONS);
    if (!image) return;
    this.uploadPreviewImg.src = image;
    document.getElementById("photo-drop").hidden = true;
    this.uploadPreviewWrapper.hidden = false;
    this.removePreviewBtn.hidden = true;
    note.hidden = false;
  }

  /** Validates and saves the add / edit form (edit keeps the photo, id and place link). */
  submitMemoryForm() {
    if (!this.isAuthenticated) {
      this.showToast("Chế độ chỉ xem: Không thể thực hiện thay đổi!");
      return;
    }
    const titleInput = document.getElementById("memory-title-input");
    const title = titleInput.value.trim();
    const date = this.memoryDateInput.value;
    if (!title) {
      document.getElementById("memory-title-error").hidden = false;
      titleInput.focus();
      return;
    }
    if (!date) return;
    const save = document.getElementById("save-memory-btn");
    save.setAttribute("aria-busy", "true");
    save.textContent = "Đang lưu…";
    const location = this.memoryLocationInput.value.trim() || "Cùng Nhau";
    const story = document.getElementById("memory-story-input").value.trim();
    const editing = this.editingMemoryId !== "";
    const saved = editing
      ? this.saveEditedMemory(this.editingMemoryId, { title, date, location, story })
      : this.saveNewMemory({ title, date, location, story, image: this.memoryImageInput.value.trim() });
    if (!saved) return;
    this.memoryModal.close();
    this.afterMemorySaved(saved.id, editing);
  }

  saveNewMemory(fields) {
    const newMemory = Object.assign({ id: "mem-" + Date.now(), placeId: this.pendingMemoryPlaceId || "", syncState: "pending" }, fields);
    this.memories.push(newMemory);
    this.memories.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.persistMemories();
    this.queueMemory(newMemory);
    return newMemory;
  }

  saveEditedMemory(id, fields) {
    const mem = this.memories.find((m) => String(m.id) === String(id));
    if (!mem) return null;
    Object.assign(mem, fields, { syncState: "pending" });
    this.memories.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.persistMemories();
    this.queueMemory(mem);
    return mem;
  }

  afterMemorySaved(id, editing) {
    this.renderTimeline();
    const block = this.timelineContainer.querySelector(`[data-id="${CSS.escape(String(id))}"]`);
    if (block) {
      block.scrollIntoView({ block: "center", behavior: "instant" });
      block.classList.add("is-highlighted");
      setTimeout(() => block.classList.remove("is-highlighted"), HIGHLIGHT_MS);
    }
    if (!editing) this.celebrate({ reason: "save", origin: block || undefined });
    this.showToast(editing ? "Đã lưu thay đổi" : "Đã lưu khoảnh khắc");
    if (!this.config.apiUrl) {
      this.showToast("Chưa có link đồng bộ trong Cài đặt nên khoảnh khắc chỉ lưu trên máy này.", 6000);
    }
  }

  /** The editable settings values, as one string, so "Lưu" can stay disabled until something changes. */
  settingsSnapshot() {
    return ["cfg-him-name", "cfg-her-name", "cfg-start-date", "cfg-quote", "cfg-api-url"]
      .map((id) => { const el = document.getElementById(id); return el ? el.value : ""; }).join("\u0001");
  }

  syncSettingsSaveState() {
    const button = document.getElementById("save-settings-btn");
    if (button) button.disabled = this.settingsSnapshot() === this.settingsBaseline;
  }

  /** Theme, petals and music apply at once (no "Lưu"); this wires the two switches and "Đồng bộ ngay". */
  bindSettingsControls() {
    const petals = document.getElementById("cfg-petals");
    const music = document.getElementById("cfg-music");
    const syncNow = document.getElementById("sync-now-btn");
    if (petals) {
      petals.addEventListener("click", () => {
        const on = petals.getAttribute("aria-checked") !== "true";
        petals.setAttribute("aria-checked", String(on));
        this.saveData(PETALS_SETTING_KEY, on ? "on" : "off");
        if (this.petals) this.petals.update();
      });
    }
    if (music) music.addEventListener("click", () => this.toggleMelody());
    if (syncNow) {
      syncNow.addEventListener("click", async () => {
        await this.syncFromBackend();
        this.renderSyncStatus();
      });
    }
  }

  syncSettingSwitches() {
    const petals = document.getElementById("cfg-petals");
    if (petals) petals.setAttribute("aria-checked", String(this.loadData(PETALS_SETTING_KEY, "on") !== "off"));
    this.syncMusicSwitch();
  }

  syncMusicSwitch() {
    const music = document.getElementById("cfg-music");
    if (music) music.setAttribute("aria-checked", String(!!this.isPlayingMelody));
  }

  /** "Đã đồng bộ lúc 15:39" or "3 mục chưa đồng bộ". */
  renderSyncStatus() {
    const el = document.getElementById("sync-status-text");
    if (!el) return;
    const pending = this.syncEngine ? this.syncEngine.keys().length : 0;
    if (pending > 0) {
      el.textContent = `${pending} mục chưa đồng bộ`;
      return;
    }
    const last = this.loadData(LAST_SYNC_KEY, 0);
    if (!last) {
      el.textContent = this.config.apiUrl ? "Chưa đồng bộ lần nào" : "Chưa kết nối";
      return;
    }
    const when = new Date(last);
    const sameDay = formatLocalDate(when) === formatLocalDate(new Date());
    el.textContent = `Đã đồng bộ lúc ${sameDay ? formatTime24(when) : formatDateVi(when)}`;
  }

  showToast(message, duration = null, action = null) {
    if (duration === null) duration = action ? TOAST_ACTION_MS : TOAST_DEFAULT_MS;
    let toast = document.getElementById("journey-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "journey-toast";
      toast.className = "journey-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.toggle("has-action", !!action);
    if (action) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "toast-action";
      button.textContent = action.label;
      button.addEventListener("click", () => {
        toast.classList.remove("show");
        action.onClick();
      });
      toast.appendChild(button);
    }
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
    // 1. Mở thư viện chọn ảnh
    if (this.btnGalleryTrigger) {
      this.btnGalleryTrigger.addEventListener("click", () => {
        if (this.memoryFileInput) this.memoryFileInput.click();
      });
    }

    // 2. Xử lý ảnh đã chọn
    if (this.memoryFileInput) {
      this.memoryFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        this.processUploadedFile(file);
      });
    }

    // 3. Nút đổi ảnh khác
    if (this.removePreviewBtn) {
      this.removePreviewBtn.addEventListener("click", () => this.clearMemoryPhoto());
    }

    // 4. Nút lấy lại toạ độ vị trí
    if (this.btnRefreshGps) {
      this.btnRefreshGps.addEventListener("click", (e) => {
        e.preventDefault();
        this.autoFetchGpsLocation(true);
      });
    }
  }

  /** Reads a chosen photo (max 10 MB), compresses it and shows the preview. */
  processUploadedFile(file) {
    const error = document.getElementById("memory-photo-error");
    if (error) error.hidden = true;
    if (file.size > MAX_PHOTO_BYTES) {
      if (error) {
        error.textContent = "Ảnh lớn quá (tối đa 10 MB). Chọn ảnh khác nhé.";
        error.hidden = false;
      }
      if (this.memoryFileInput) this.memoryFileInput.value = "";
      return;
    }
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

  clearMemoryPhoto() {
    if (this.memoryFileInput) this.memoryFileInput.value = "";
    if (this.memoryImageInput) this.memoryImageInput.value = "";
    if (this.uploadPreviewWrapper) this.uploadPreviewWrapper.hidden = true;
    const drop = document.getElementById("photo-drop");
    if (drop) drop.hidden = false;
  }

  setProcessedPhoto(imgUrl, timestamp) {
    if (this.uploadPreviewImg) this.uploadPreviewImg.src = imgUrl;
    if (this.memoryImageInput) this.memoryImageInput.value = imgUrl;
    const drop = document.getElementById("photo-drop");
    if (drop) drop.hidden = true;
    if (this.uploadPreviewWrapper) this.uploadPreviewWrapper.hidden = false;

    // Tự động gán ngày và giờ theo thời điểm chụp
    const d = new Date(timestamp || Date.now());
    const pad = (n) => String(n).padStart(2, "0");
    const dtLocal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (this.memoryDateInput) this.memoryDateInput.value = dtLocal;
  }

  autoFetchGpsLocation(isUserInitiated = false) {
    const locInput = this.memoryLocationInput || document.getElementById("memory-location-input");
    const refreshBtn = this.btnRefreshGps || document.getElementById("btn-refresh-gps");

    if (refreshBtn) refreshBtn.setAttribute("aria-busy", "true");
    if (locInput && !locInput.value) {
      locInput.placeholder = "Đang định vị toạ độ...";
    }

    if (!navigator.geolocation) {
      if (refreshBtn) refreshBtn.setAttribute("aria-busy", "false");
      if (locInput && !locInput.value) locInput.placeholder = "Trình duyệt không hỗ trợ GPS";
      if (isUserInitiated) this.showToast("Trình duyệt không hỗ trợ định vị GPS", 3000);
      return;
    }

    const onPositionSuccess = (pos) => {
      if (!pos || !pos.coords) return;
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

      // Gán toạ độ Google Maps ngay tức thì vào ô nhập vị trí
      if (locInput) locInput.value = mapsUrl;
      if (refreshBtn) refreshBtn.setAttribute("aria-busy", "false");
      if (isUserInitiated) this.showToast("Đã định vị toạ độ thành công!", 2500);

      // Tra cứu địa chỉ đường phố/phường xã ở chế độ nền (không làm trễ toạ độ)
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 4000) : null;

      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&accept-language=vi`, {
        signal: controller ? controller.signal : undefined
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (timer) clearTimeout(timer);
          if (data && data.address) {
            const a = data.address;
            const parts = [
              a.road || a.suburb || a.neighbourhood || "",
              a.city_district || a.district || a.county || "",
              a.city || a.state || ""
            ].filter(Boolean);
            if (parts.length > 0 && locInput && (locInput.value === mapsUrl || locInput.value.includes(mapsUrl))) {
              locInput.value = `${parts.join(", ")} (${mapsUrl})`;
            }
          }
        })
        .catch(() => {
          if (timer) clearTimeout(timer);
        });
    };

    const onPositionFail = (err) => {
      console.warn("GPS error:", err);
      if (refreshBtn) refreshBtn.setAttribute("aria-busy", "false");

      // Mã 1: PERMISSION_DENIED (Người dùng hoặc Chrome iPhone chưa cấp quyền)
      if (err && err.code === 1) {
        if (locInput && !locInput.value) {
          locInput.placeholder = "Cần mở quyền Vị trí cho Chrome...";
        }
        this.showToast("Bé mở Cài đặt iPhone > Chrome > Cho phép Vị trí nhé", 5000);
      } else {
        if (locInput && !locInput.value) {
          locInput.placeholder = "Chưa nhận được GPS (chạm nút xoay để thử lại)";
        }
        if (isUserInitiated) {
          this.showToast("Chưa bắt được GPS. Bé kiểm tra lại cài đặt vị trí máy nhé!", 3500);
        }
      }
    };

    // BƯỚC 1: Thử GPS độ chính xác cao trong 6 giây
    navigator.geolocation.getCurrentPosition(
      onPositionSuccess,
      (err) => {
        // Nếu bị chặn quyền (PERMISSION_DENIED), thông báo hướng dẫn mở quyền ngay
        if (err && err.code === 1) {
          onPositionFail(err);
          return;
        }

        // BƯỚC 2: Tự động fallback sang định vị mạng/wifi (cực nhanh và ổn định trên iPhone khi ở trong nhà)
        navigator.geolocation.getCurrentPosition(
          onPositionSuccess,
          onPositionFail,
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
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
    // Esc / cử chỉ quay lại đóng <dialog> mà không qua nút nào → xóa trạng thái sửa
    this.memoryModal.addEventListener("close", () => {
      this.pendingMemoryPlaceId = "";
      this.editingMemoryId = "";
    });
    this.memoryModal.beforeClose = () => this.confirmDiscardMemory();
    if (this.closeMemoryBtn) this.closeMemoryBtn.addEventListener("click", () => window.appShell.requestClose(this.memoryModal));
    const storyInput = document.getElementById("memory-story-input");
    storyInput.addEventListener("input", () => this.autoGrow(storyInput));

    // Submit form thêm / sửa kỷ niệm
    this.memoryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.submitMemoryForm();
    });

    this.heroHeartBtn.addEventListener("click", () => this.beatHeart());

    // Cài đặt thông tin
    this.openSettingsBtn.addEventListener("click", () => {
      if (!this.isAuthenticated) {
        this.openAuthModal(() => {
          this.openSettingsBtn.click();
        }, "Khu vực cài đặt chỉ dành cho Kim & Thư.");
        return;
      }
      document.getElementById("cfg-him-name").value = this.config.partnerOne;
      document.getElementById("cfg-her-name").value = this.config.partnerTwo;
      document.getElementById("cfg-start-date").value = this.config.startDate.slice(0, 16);
      document.getElementById("cfg-quote").value = this.config.quote;
      const apiInput = document.getElementById("cfg-api-url");
      if (apiInput) apiInput.value = this.config.apiUrl || "";
      this.settingsBaseline = this.settingsSnapshot();
      this.syncSettingsSaveState();
      this.syncSettingSwitches();
      this.renderSyncStatus();
      this.settingsModal.showModal();
    });
    this.closeSettingsBtn.addEventListener("click", () => this.settingsModal.close());
    this.settingsForm.addEventListener("input", () => this.syncSettingsSaveState());
    this.bindSettingsControls();

    this.settingsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!this.isAuthenticated) {
        this.showToast("Chế độ chỉ xem: Không thể thay đổi cài đặt!");
        return;
      }
      this.config.partnerOne = document.getElementById("cfg-him-name").value.trim() || "Kim";
      this.config.partnerTwo = document.getElementById("cfg-her-name").value.trim() || "Thư";
      const dateVal = document.getElementById("cfg-start-date").value;
      if (dateVal) {
        this.config.startDate = dateVal.length === 16 ? `${dateVal}:00` : dateVal;
      }
      this.config.quote = document.getElementById("cfg-quote").value.trim();
      const apiInput = document.getElementById("cfg-api-url");
      if (apiInput) {
        this.config.apiUrl = apiInput.value.trim();
        if (this.config.apiUrl) this.syncFromBackend();
      }

      this.saveData("journey_config_v3", this.config);
      this.renderProfile();
      this.lastCounterDays = null;
      this.updateCounter();
      this.settingsModal.close();
      this.showToast("Đã lưu cài đặt");
    });

    // Lightbox đóng
    this.closeLightboxBtn.addEventListener("click", () => this.lightboxModal.close());
    this.lightboxModal.addEventListener("click", (e) => { if (e.target === this.lightboxModal) this.lightboxModal.close(); });
    this.bindMemoryDetail();

    // Bật/tắt nhạc
    this.musicToggleBtn.addEventListener("click", () => this.toggleMelody());
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
    this.heroTitle.textContent = `${this.config.partnerOne} & ${this.config.partnerTwo}`;
    this.avatarOne.textContent = this.avatarInitial(this.config.partnerOne);
    this.avatarTwo.textContent = this.avatarInitial(this.config.partnerTwo);
  }

  /** First character of the trimmed name in upper case ("?" when the name is empty). */
  avatarInitial(name) {
    const first = Array.from(String(name || "").trim())[0];
    return first ? first.toUpperCase() : "?";
  }

  /** The heart between the avatars: a short beat, a tick and a small burst from the button. */
  beatHeart() {
    const button = this.heroHeartBtn;
    if (!button) return;
    button.classList.remove("is-beating");
    void button.offsetWidth;
    button.classList.add("is-beating");
    this.hapticTick();
    const rect = button.getBoundingClientRect();
    if (this.petals) this.petals.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, HEART_BURST_MS, HEART_BURST_COUNT);
  }

  startLiveCounter() {
    this.updateCounter();
    setInterval(() => this.updateCounter(), 1000);
  }

  /**
   * Calendar days together (changes at local midnight, so it always agrees with the milestone line) and the
   * clock time elapsed since the start time of day.
   * @returns {{days: number, hours: number, minutes: number, seconds: number}}
   */
  counterParts(startDate, now) {
    const start = new Date(startDate).getTime();
    const elapsed = Math.max(0, now.getTime() - start);
    const rest = elapsed % MS_PER_DAY;
    const days = daysTogether(startDate, now);
    return {
      days: days === null ? 0 : Math.max(0, days),
      hours: Math.floor(rest / MS_PER_HOUR),
      minutes: Math.floor((rest % MS_PER_HOUR) / MS_PER_MINUTE),
      seconds: Math.floor((rest % MS_PER_MINUTE) / MS_PER_SECOND)
    };
  }

  updateCounter() {
    const parts = this.counterParts(this.config.startDate, new Date());
    if (this.lastCounterDays !== parts.days) {
      this.lastCounterDays = parts.days;
      this.countDays.textContent = Number(parts.days).toLocaleString("vi-VN");
      if (this.heroDays) this.heroDays.setAttribute("aria-label", `${parts.days} ngày bên nhau`);
    }
    this.countHours.textContent = String(parts.hours).padStart(2, "0");
    this.countMinutes.textContent = String(parts.minutes).padStart(2, "0");
    this.countSeconds.textContent = String(parts.seconds).padStart(2, "0");
    this.renderMilestone(parts.days);
  }

  // Đếm ngược tới mốc 100 ngày / kỷ niệm năm; chỉ tính lại khi sang ngày mới
  renderMilestone(days) {
    if (!this.milestoneLine || this.lastMilestoneDay === days) return;
    this.lastMilestoneDay = days;
    const milestone = nextMilestone(this.config.startDate, new Date());
    this.milestoneLine.textContent = milestoneText(milestone);
    this.maybeCelebrateMilestone(milestone);
    const percent = Math.round(milestoneProgress(milestone, days) * 100);
    if (this.milestoneFill) this.milestoneFill.style.width = `${percent}%`;
    if (this.milestoneBar) this.milestoneBar.setAttribute("aria-valuenow", String(percent));
  }

  // ==========================================
  // THEO DÕI NGÀY ĐẾN DÂU CỦA BÉ THƯ (NHỎ NHẮN, TINH TẾ)
  // ==========================================
  initPeriodTracker() {
    if (!this.periodModal) return;

    if (this.viewBe) {
      this.viewBe.addEventListener("click", (e) => {
        if (e.target.closest && e.target.closest("#be-log-btn")) this.openPeriodLogForm();
        const more = e.target.closest ? e.target.closest(".be-history__more") : null;
        if (more) this.openPeriodHistoryMenu(more, more.closest("li").dataset.start);
      });
    }
    if (this.closePeriodBtn) {
      this.closePeriodBtn.addEventListener("click", () => this.periodModal.close());
    }

    if (this.periodForm) {
      this.periodForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!this.isAuthenticated) {
          this.showToast("Chế độ chỉ xem: Không thể thực hiện thay đổi!");
          return;
        }
        const startVal = this.periodStartDateInput.value;
        const durationVal = parseInt(this.periodDurationInput.value, 10);
        if (!startVal) return;
        if (this.editingPeriodStart) {
          this.commitPeriodChange(replacePeriodStart(this.period.history, this.editingPeriodStart, startVal));
          this.editingPeriodStart = "";
          this.renderPeriodTracker();
          this.periodModal.close();
          this.showToast("Đã lưu");
          return;
        }
        this.recordPeriodStart(startVal, this.period.cycleLength || DEFAULT_CYCLE_DAYS, Number.isFinite(durationVal) ? durationVal : undefined);
        this.renderPeriodTracker();
        this.periodModal.close();
        this.showToast("Đã lưu. Anh sẽ nhắc trước kỳ tới nhé.");
      });
    }
  }

  /** Opens the "Ghi nhận kỳ mới" sheet with today as the default start date. */
  openPeriodLogForm() {
    if (!this.isAuthenticated) {
      this.showToast("Khu vực riêng tư: Chỉ dành riêng cho Kim & Thư");
      this.openAuthModal();
      return;
    }
    this.editingPeriodStart = "";
    document.getElementById("period-modal-title").textContent = "Ghi nhận kỳ mới";
    this.periodStartDateInput.value = formatLocalDate(new Date());
    this.periodDurationInput.value = "";
    this.periodDurationInput.placeholder = String(Number(this.period.durationDays) || DEFAULT_PERIOD_DAYS);
    this.periodModal.showModal();
  }

  normalizePeriod(period) {
    const base = { ...DEFAULT_PERIOD, ...period };
    const seed = Array.isArray(base.history) && base.history.length > 0 ? base.history : [base.startDate];
    const history = normalizeHistory(seed);
    return {
      ...base,
      history: history,
      startDate: history.length > 0 ? history[history.length - 1] : base.startDate,
      predictionLog: Array.isArray(base.predictionLog) ? base.predictionLog : []
    };
  }

  // Ghi một ngày bắt đầu mới, đối chiếu với dự đoán trước đó để biết dự đoán có trúng không
  recordPeriodStart(startVal, cycleVal, durationVal) {
    const history = this.period.history;
    if (!history.includes(startVal)) {
      const outcome = evaluatePrediction(history, cycleVal, startVal);
      this.period.predictionLog = appendPredictionLog(this.period.predictionLog, outcome);
    }
    this.period.cycleLength = cycleVal;
    if (Number.isFinite(durationVal)) this.period.durationDays = durationVal;
    this.commitPeriodChange(addPeriodStart(history, startVal));
  }

  /**
   * The only way the period record changes: stores the history, sets startDate to the latest start and bumps
   * updatedAt so the partner's phone accepts the change, then saves and queues it.
   */
  commitPeriodChange(history) {
    this.period.history = normalizeHistory(history);
    this.period.startDate = this.period.history.length > 0 ? this.period.history[this.period.history.length - 1] : "";
    this.period.updatedAt = Math.max(Date.now(), (Number(this.period.updatedAt) || 0) + 1);
    this.saveData("journey_period_v1", this.period);
    this.queuePeriod();
  }

  formatPeriodWindow(nextStart, windowDays) {
    const pad = (n) => String(n).padStart(2, "0");
    const fmt = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
    if (windowDays <= 0) return fmt(nextStart);
    const shift = (days) => new Date(nextStart.getFullYear(), nextStart.getMonth(), nextStart.getDate() + days);
    return `${fmt(shift(-windowDays))} – ${fmt(shift(windowDays))}`;
  }

  // Dự đoán từ trung bình các chu kỳ đã ghi, trả về khoảng ngày thay vì một ngày cố định
  computePeriodStatus(durationDays) {
    const prediction = predictCycle(this.period.history, this.period.cycleLength);
    const cycle = computeCycle(this.period.startDate, prediction.cycleLength, durationDays, new Date());
    if (!cycle) return null;
    const n = cycle.nextStart;
    const shift = (days) => new Date(n.getFullYear(), n.getMonth(), n.getDate() + days);
    return {
      ...cycle, windowText: this.formatPeriodWindow(cycle.nextStart, prediction.windowDays),
      windowStart: shift(-prediction.windowDays), windowEnd: shift(prediction.windowDays), cycleLength: prediction.cycleLength
    };
  }

  /** Period chip on the hero: "Ngày 5/5 của kỳ" during a period, "Còn 4 ngày đến kỳ" before; hidden without data. */
  renderPeriodChip() {
    if (!this.periodChip || !this.periodChipText) return;
    const cycle = this.period && this.period.startDate
      ? this.computePeriodStatus(Number(this.period.durationDays) || DEFAULT_PERIOD_DAYS)
      : null;
    this.periodChip.hidden = !cycle;
    if (!cycle) return;
    const duration = Number(this.period.durationDays) || DEFAULT_PERIOD_DAYS;
    this.periodChipText.textContent = cycle.isDuring
      ? `Ngày ${cycle.periodDay}/${duration} của kỳ`
      : `Còn ${cycle.daysUntilNext} ngày đến kỳ`;
  }

  queuePeriod() {
    return this.sendToBackend({
      type: "period", startDate: this.period.startDate, cycleLength: this.period.cycleLength,
      durationDays: this.period.durationDays || 5, history: this.period.history || [], updatedAt: this.period.updatedAt
    });
  }

  renderPeriodTracker() {
    this.renderPeriodChip();
    this.renderBePage();
  }

  /** Bé page: cycle ring, phase line, window, care note and history. */
  renderBePage() {
    const ringBox = document.getElementById("cycle-ring");
    if (!ringBox) return;
    const duration = Number(this.period.durationDays) || DEFAULT_PERIOD_DAYS;
    const cycle = this.period && this.period.startDate ? this.computePeriodStatus(duration) : null;
    const phase = document.getElementById("be-phase");
    const windowEl = document.getElementById("be-window");
    const careEl = document.getElementById("be-care");
    const careText = document.getElementById("be-care-text");
    const model = cycleRingModel({ cycle: cycle, cycleLength: cycle ? cycle.cycleLength : DEFAULT_CYCLE_DAYS, durationDays: duration, today: new Date() });
    if (!cycle) {
      ringBox.innerHTML = "";
      phase.textContent = "Chưa có dữ liệu kỳ nào.";
      windowEl.textContent = "Ghi nhận ngày bắt đầu để nhận lời nhắc trước kỳ tới.";
      careEl.hidden = true;
    } else {
      ringBox.innerHTML = cycleRingSvg(model, { size: BE_RING_SIZE_PX });
      phase.textContent = model.phaseLine;
      windowEl.textContent = `Kỳ tới dự kiến: ${cycle.windowText}`;
      careEl.hidden = false;
      careText.textContent = BE_CARE_TEXT[model.phase];
    }
    this.renderBeHistory();
  }

  renderBeHistory() {
    const list = document.getElementById("be-history");
    if (!list) return;
    list.innerHTML = historyRows(this.period.history).map((row) => {
      const detail = row.cycleDays === null ? "kỳ gần nhất" : `chu kỳ ${row.cycleDays} ngày`;
      const more = this.isAuthenticated
        ? `<button type="button" class="icon-btn be-history__more" aria-label="Thêm thao tác">${icon("more")}</button>` : "";
      return `<li data-start="${this.escapeHTML(row.start)}"><span>${this.escapeHTML(formatDateVi(row.start))} · ${detail}</span>${more}</li>`;
    }).join("");
  }

  /** ⋯ on a history row: edit its start date or delete it (delete hidden for the only entry). */
  openPeriodHistoryMenu(anchor, start) {
    const items = [{ label: "Sửa", icon: "edit", onSelect: () => this.openPeriodEditForm(start) }];
    if (this.period.history.length > 1) {
      items.push({ label: "Xóa", icon: "trash", danger: true, onSelect: () => this.deletePeriodStart(start) });
    }
    actionMenu.open({ anchor: anchor, items: items });
  }

  openPeriodEditForm(start) {
    this.editingPeriodStart = start;
    document.getElementById("period-modal-title").textContent = "Sửa ngày bắt đầu";
    this.periodStartDateInput.value = start;
    this.periodDurationInput.value = "";
    this.periodModal.showModal();
  }

  async deletePeriodStart(start) {
    const confirmed = await confirmSheet({
      title: "Xóa lần ghi này?",
      body: "Dự đoán kỳ tới sẽ được tính lại.",
      confirmLabel: "Xóa",
      cancelLabel: "Giữ lại",
      danger: true,
      icon: "trash"
    });
    if (!confirmed) return;
    this.commitPeriodChange(removePeriodStart(this.period.history, start));
    this.renderPeriodTracker();
    this.showToast("Đã xóa");
  }

  // ==========================================
  // THÔNG BÁO (ALERT) KHI GẦN TRƯỚC 3 NGÀY KỲ DÂU DỰ ĐOÁN
  // ==========================================
  checkPeriodAlert() {
    if (!this.isAuthenticated || !this.periodAlertModal || !this.period || !this.period.startDate) return;

    if (this.closePeriodAlertBtn) this.closePeriodAlertBtn.onclick = () => this.periodAlertModal.close();
    if (this.dismissPeriodAlertBtn) this.dismissPeriodAlertBtn.onclick = () => this.periodAlertModal.close();
    if (this.openCareFromAlertBtn) {
      this.openCareFromAlertBtn.onclick = () => {
        this.periodAlertModal.close();
        this.switchView("be");
      };
    }

    const durationDays = Number(this.period.durationDays) || DEFAULT_PERIOD_DAYS;
    const cycle = this.computePeriodStatus(durationDays);
    if (!cycle) return;
    const { isDuring: isDuringPeriod, periodDay, daysUntilNext } = cycle;

    // Kiểm tra điều kiện: trước ba ngày kỳ dự đoán (còn <= 3 ngày) hoặc đang trong kỳ
    let shouldAlert = false;
    if (isDuringPeriod) {
      this.periodAlertTitle.textContent = "Bé Thư đang trong kỳ";
      this.periodAlertCountdownPill.textContent = `Ngày ${periodDay}/${durationDays}`;
      this.periodAlertMessage.textContent = BE_CARE_TEXT.during;
      shouldAlert = true;
    } else if (daysUntilNext > 0 && daysUntilNext <= 3) {
      this.periodAlertTitle.textContent = "Sắp đến kỳ của bé Thư";
      this.periodAlertCountdownPill.textContent = `Còn ${daysUntilNext} ngày`;
      this.periodAlertMessage.textContent = BE_CARE_TEXT.soon;
      shouldAlert = true;
    }

    const todayKey = formatLocalDate(new Date());
    if (shouldAlert && this.loadData(PERIOD_ALERT_SEEN_KEY, "") !== todayKey) {
      this.saveData(PERIOD_ALERT_SEEN_KEY, todayKey);
      this.dialogQueue.request("period-alert", DIALOG_PRIORITY.periodAlert, () => {
        if (!this.isAuthenticated || this.periodAlertModal.open) return null;
        this.periodAlertModal.showModal();
        return this.periodAlertModal;
      });
    }
  }

  // ==========================================
  // DÒNG THỜI GIAN LOCKET (KHUNG ẢNH & KHUNG CÂU CHUYỆN KẾ BÊN)
  // ==========================================
  renderTimeline() {
    const container = this.timelineContainer;
    container.classList.toggle("is-grid", this.timelineView === "grid");
    this.renderOnThisDay();
    if (this.memories.length === 0) {
      this.renderTimelineEmpty(container);
      return;
    }

    // Luôn sắp xếp từ sự kiện gần nhất trở về trước (mới nhất ở trên cùng)
    this.memories.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (this.shouldShowTimelineSkeleton()) {
      container.innerHTML = memorySkeletonHtml().repeat(TIMELINE_SKELETON_CARDS);
      return;
    }

    let lastMonthKey = "";
    const isGrid = this.timelineView === "grid";
    container.innerHTML = this.memories.map((mem) => {
      const monthKey = String(mem.date || "").slice(0, 7);
      const label = monthKey && monthKey !== lastMonthKey ? monthLabelHtml(monthKey) : "";
      lastMonthKey = monthKey;
      const body = isGrid ? gridTileHtml(mem) : memoryBlockHtml(mem, { couple: this.isAuthenticated });
      return label + body;
    }).join("");

    this.attachImageFallbacks(container);
    if (window.appShell) window.appShell.observeMonthLabels(container);
  }

  renderTimelineEmpty(container) {
    const addButton = this.isAuthenticated
      ? '<button type="button" class="btn btn--primary" id="empty-add-memory-btn">Thêm khoảnh khắc</button>'
      : "";
    container.innerHTML = `<div class="empty"><span class="empty__art">${icon("heart", { size: EMPTY_ART_PX })}</span><p class="t-headline">Chưa có khoảnh khắc nào.</p>` +
      `<p class="muted">Lưu lại kỷ niệm đầu tiên của hai đứa nhé.</p>${addButton}</div>`;
    const button = document.getElementById("empty-add-memory-btn");
    if (button) button.addEventListener("click", () => this.openMemoryDialog());
  }

  /** Two skeleton rows only while the sample memories are shown and the first backend sync is still pending. */
  shouldShowTimelineSkeleton() {
    if (!this.config.apiUrl || this.firstSyncDone === true) return false;
    return this.memories.every((mem) => DEFAULT_MEMORY_IDS.includes(mem.id));
  }

  /** One delegated click handler for the feed, the grid, "Ngày này năm xưa" and the photo retry button. */
  bindTimelineEvents() {
    const open = (event) => {
      const target = event.target.closest ? event.target.closest(".memory__open, .tile, .otd-row") : null;
      if (!target) return;
      const holder = target.closest("[data-id]");
      const mem = this.memories.find((m) => String(m.id) === String(holder ? holder.dataset.id : target.dataset.id));
      if (mem) this.openMemoryDetail(mem);
    };
    this.timelineContainer.addEventListener("click", (event) => {
      const retry = event.target.closest ? event.target.closest(".memory__retry") : null;
      if (retry) {
        this.retryMemoryPhoto(retry.dataset.id);
        return;
      }
      open(event);
    });
    if (this.onThisDayCard) this.onThisDayCard.addEventListener("click", open);
  }

  /** Puts the photo back on a text card after a failed load and tries the image once more. */
  retryMemoryPhoto(id) {
    const mem = this.memories.find((m) => String(m.id) === String(id));
    const article = this.timelineContainer.querySelector(`.memory[data-id="${CSS.escape(String(id))}"]`);
    if (!mem || !article) return;
    article.outerHTML = memoryBlockHtml(mem, { couple: this.isAuthenticated });
    this.attachImageFallbacks(this.timelineContainer);
  }

  /**
   * Delete with a 5 s undo window. The memory leaves the list and local storage at once; nothing reaches the
   * backend until the window ends (or the app is closed or hidden, which commits immediately).
   */
  async deleteMemory(memId) {
    if (!this.isAuthenticated) {
      this.showToast("Chỉ Kim & Thư mới có quyền xóa kỷ niệm");
      this.openAuthModal();
      return;
    }
    const id = String(memId);
    const kept = this.memories.find((m) => String(m.id) === id);
    if (!kept) return;
    const confirmed = await confirmSheet({
      title: "Xóa khoảnh khắc này?",
      body: "Ảnh và nội dung sẽ bị xóa trên cả hai điện thoại.",
      confirmLabel: "Xóa",
      cancelLabel: "Giữ lại",
      danger: true,
      icon: "trash"
    });
    if (!confirmed) return;
    this.pendingDeleteIds.memory.add(id);
    this.memories = this.memories.filter((m) => String(m.id) !== id);
    this.persistMemories();
    this.renderTimeline();
    this.undo.schedule("memory:" + id, () => this.commitMemoryDelete(id));
    this.showToast("Đã xóa", TOAST_ACTION_MS, { label: "Hoàn tác", onClick: () => this.undoMemoryDelete(id, kept) });
  }

  commitMemoryDelete(id) {
    this.pendingDeleteIds.memory.delete(id);
    const before = this.memories.length;
    this.memories = this.memories.filter((m) => String(m.id) !== id);
    if (this.memories.length !== before) {
      this.persistMemories();
      this.renderTimeline();
    }
    if (!this.deletedMemoryIds.includes(id)) {
      this.deletedMemoryIds.push(id);
      this.saveData("journey_deleted_mem_ids", this.deletedMemoryIds);
    }
    this.sendToBackend({ type: "delete_memory", id: id });
  }

  undoMemoryDelete(id, kept) {
    if (!this.undo.cancel("memory:" + id)) return;
    this.pendingDeleteIds.memory.delete(id);
    if (!this.memories.some((m) => String(m.id) === id)) this.memories.push(kept);
    this.memories.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.persistMemories();
    this.renderTimeline();
  }

  /** Photo zoom only: no caption, the detail sheet carries the text. */
  openMemoryLightbox(mem) {
    this.lightboxImg.src = safeUrl(mem.image, MEMORY_IMAGE_URL_OPTIONS);
    this.lightboxImg.alt = mem.title || "Ảnh phóng to";
    this.lightboxModal.showModal();
  }

  /** Fills and opens the memory detail sheet (photo, text, and the couple's actions). */
  openMemoryDetail(mem) {
    if (!this.memoryDetailModal || !mem) return;
    this.detailMemoryId = String(mem.id);
    this.renderDetailPhoto(mem);
    document.getElementById("memory-detail-title").textContent = mem.title || "";
    const place = locationLabel(mem.location);
    const when = [formatDateVi(String(mem.date || "").slice(0, 10)), String(mem.date || "").split("T")[1] ? formatTime24(new Date(mem.date)) : "", place].filter(Boolean);
    const link = this.formatLocationBadge(mem.location);
    const meta = document.getElementById("memory-detail-meta");
    meta.innerHTML = this.escapeHTML(when.join(" · ")) + (link ? " " + link : "");
    this.renderMemoryStory(document.getElementById("memory-detail-story"), mem.story || "");
    this.memoryDetailModal.showModal();
  }

  /** Puts the photo in the detail sheet; a photo that fails to load becomes the heart box with a retry button. */
  renderDetailPhoto(mem) {
    const photo = document.getElementById("memory-detail-photo");
    photo.innerHTML = detailPhotoHtml(mem);
    const img = photo.querySelector("img");
    if (!img) return;
    img.addEventListener("error", () => { photo.innerHTML = detailPhotoFailedHtml(); }, { once: true });
  }

  /** The first line renders in the handwriting face when it is wrapped in quotes. */
  renderMemoryStory(el, story) {
    const lines = String(story).split("\n");
    const quoted = /^["“].*["”]$/.test(lines[0].trim());
    const first = quoted ? `<span class="hand">${this.escapeHTML(lines[0])}</span>` : this.escapeHTML(lines[0]);
    el.innerHTML = [first].concat(lines.slice(1).map((l) => this.escapeHTML(l))).join("<br>");
    el.hidden = story.trim() === "";
  }

  bindMemoryDetail() {
    if (!this.memoryDetailModal) return;
    const current = () => this.memories.find((m) => String(m.id) === this.detailMemoryId);
    this.memoryDetailModal.addEventListener("click", (e) => {
      const mem = current();
      if (!mem || !e.target.closest) return;
      if (e.target.closest(".detail__retry")) {
        this.renderDetailPhoto(mem);
        return;
      }
      if (e.target.closest(".detail__photo")) this.openMemoryLightbox(mem);
    });
    document.getElementById("memory-detail-edit-btn").addEventListener("click", () => {
      const mem = current();
      if (!mem) return;
      this.memoryDetailModal.close();
      this.openMemoryDialog({ edit: mem });
    });
    const more = document.getElementById("memory-detail-more-btn");
    more.addEventListener("click", () => {
      const mem = current();
      if (!mem) return;
      actionMenu.open({
        anchor: more,
        items: [
          { label: "Chia sẻ", icon: "share", onSelect: () => this.shareMemory(mem) },
          { label: "Xóa", icon: "trash", danger: true, onSelect: () => { this.memoryDetailModal.close(); this.deleteMemory(mem.id); } }
        ]
      });
    });
  }

  /** Shares the memory text with the system sheet, or copies it when sharing is not available. */
  async shareMemory(mem) {
    const place = locationLabel(mem.location);
    const text = `${mem.title}\n${formatDateVi(String(mem.date || "").slice(0, 10))}${place ? " · " + place : ""}${mem.story ? "\n\n" + mem.story : ""}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: mem.title, text: text });
      } catch (err) {
        if (!err || err.name !== "AbortError") throw err;
      }
      return;
    }
    await navigator.clipboard.writeText(text);
    this.showToast("Đã sao chép");
  }

  // "Ngày này năm xưa": nhắc lại các khoảnh khắc cùng ngày-tháng ở những năm trước
  renderOnThisDay() {
    if (!this.onThisDayCard) return;
    const hits = memoriesOnThisDay(this.memories, new Date());
    this.onThisDayCard.hidden = hits.length === 0;
    this.onThisDayCard.innerHTML = hits.slice(0, 1).map(onThisDayHtml).join("");
  }

  initTimelineViewToggle() {
    const feedBtn = document.getElementById("timeline-view-feed-btn");
    const gridBtn = document.getElementById("timeline-view-grid-btn");
    if (!feedBtn || !gridBtn) return;
    const apply = (view) => {
      this.timelineView = view;
      this.saveData(TIMELINE_VIEW_KEY, view);
      feedBtn.setAttribute("aria-pressed", String(view === "feed"));
      gridBtn.setAttribute("aria-pressed", String(view === "grid"));
      this.renderTimeline();
    };
    feedBtn.addEventListener("click", () => apply("feed"));
    gridBtn.addEventListener("click", () => apply("grid"));
    this.bindTimelineEvents();
    apply(this.timelineView);
  }

  // ==========================================
  // NHỮNG NƠI MUỐN ĐI CÙNG EM (PLACES WISHLIST)
  // ==========================================
  initPlaces() {
    // 1. Chuyển đổi tab bộ lọc (Chưa đi / Đã đến)
    document.querySelectorAll("#places [data-filter]").forEach(tab => {
      tab.addEventListener("click", () => {
        this.placesFilter = tab.dataset.filter || "unvisited";
        this.syncPlacesFilterTabs();
        this.renderPlaces();
        window.history.replaceState({ view: "places" }, "", buildHash({ view: "places", placesFilter: this.placesFilter }));
      });
    });

    if (this.placesListContainer) this.bindPlaceRowActions();

    // 2. Nút reload vị trí và sắp xếp nơi gần nhất từ trên xuống (tính đường ngắn nhất)
    if (this.reloadPlacesGpsBtn) {
      this.reloadPlacesGpsBtn.addEventListener("click", () => {
        this.reloadPlacesByGps();
      });
    }

    // 3. Thêm địa điểm mới: nút FAB gọi openPlaceDialog() (xem app_shell.js)

    // 4. Đóng modal thêm / sửa địa điểm: mọi đường đóng đi qua beforeClose
    if (this.placeModal) this.placeModal.beforeClose = () => this.confirmDiscardPlace();
    if (this.closePlaceModalBtn) {
      this.closePlaceModalBtn.addEventListener("click", () => window.appShell.requestClose(this.placeModal));
    }
    if (this.placeModal) {
      this.placeModal.addEventListener("close", () => { this.editingPlaceId = ""; });
    }
    this.bindMarkVisitedSheet();

    // 5. Nút lấy toạ độ GPS hiện tại điền vào ô link map
    if (this.btnPlaceUseCurrentGps) {
      this.btnPlaceUseCurrentGps.addEventListener("click", () => {
        this.btnPlaceUseCurrentGps.setAttribute("aria-busy", "true");
        if (this.placeMapInput) this.placeMapInput.placeholder = "Đang lấy toạ độ...";

        this.getUserPosition(
          (pos) => {
            const lat = Number(pos.lat).toFixed(6);
            const lng = Number(pos.lng).toFixed(6);
            if (this.placeMapInput) {
              this.placeMapInput.value = `https://www.google.com/maps?q=${lat},${lng}`;
            }
            this.btnPlaceUseCurrentGps.setAttribute("aria-busy", "false");
            this.showToast("Đã lấy toạ độ vị trí hiện tại!");
          },
          (err) => {
            console.warn("Lỗi GPS:", err);
            this.btnPlaceUseCurrentGps.setAttribute("aria-busy", "false");
            if (this.placeMapInput && !this.placeMapInput.value) {
              this.placeMapInput.placeholder = "Dán link Google Maps, toạ độ hoặc để trống...";
            }
            this.showToast("Không lấy được GPS. Bé dán link Google Maps hoặc tên quán nhé!", 3500);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
    }

    // 6. Xử lý lưu địa điểm mới
    if (this.placeForm) {
      this.placeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!this.isAuthenticated) {
          this.showToast("Chế độ chỉ xem: Không thể thêm địa điểm!");
          return;
        }

        const name = (this.placeNameInput ? this.placeNameInput.value : "").trim();
        const mapUrl = (this.placeMapInput ? this.placeMapInput.value : "").trim();
        const tiktokUrl = (this.placeTiktokInput ? this.placeTiktokInput.value : "").trim();
        const notes = (this.placeNotesInput ? this.placeNotesInput.value : "").trim();

        if (!name) {
          this.showToast("Cần có tên địa điểm nhé.");
          return;
        }
        if (this.editingPlaceId) {
          this.saveEditedPlace(this.editingPlaceId, { name, mapUrl, tiktokUrl, notes });
          return;
        }

        // 1. Trích xuất toạ độ siêu tốc từ mapUrl hoặc tên nếu có sẵn
        const directCoords = this.extractCoordinates(mapUrl) || this.extractCoordinates(name);

        const newPlace = {
          id: "place-" + Date.now(),
          name: name,
          mapUrl: mapUrl,
          tiktokUrl: tiktokUrl,
          lat: directCoords ? directCoords.lat : null,
          lng: directCoords ? directCoords.lng : null,
          notes: notes,
          visited: false,
          createdAt: new Date().toISOString()
        };

        // Đưa ngay vào đầu danh sách để phản hồi UI tức thì (0ms)
        this.places.unshift(newPlace);
        this.saveData("journey_places_v2", this.places);
        this.sendPlaceToBackend(newPlace);

        if (this.placeModal) this.placeModal.close();

        // 2. Hàm tính khoảng cách và đường đi xe ngắn nhất
        const calculateForPlace = (placeObj) => {
          if (!this.lastUserPosition || placeObj.lat == null || placeObj.lng == null) return;
          const straightKm = this.calculateDistanceKm(
            this.lastUserPosition.lat,
            this.lastUserPosition.lng,
            placeObj.lat,
            placeObj.lng
          );
          this.placeDistances.set(placeObj.id, straightKm);
          this.renderPlaces();

          // Gọi API tính quãng đường đi xe ngắn nhất & thời gian di chuyển
          this.fetchDrivingRoute(
            this.lastUserPosition.lat,
            this.lastUserPosition.lng,
            placeObj.lat,
            placeObj.lng
          ).then(route => {
            if (route) {
              this.placeRoutes.set(placeObj.id, route);
              this.renderPlaces();
            }
          });
        };

        // 3. Nếu đã trích xuất được toạ độ:
        if (directCoords) {
          this.showToast("Đã lưu địa điểm mới & đang tính đường đi ngắn nhất");
          if (this.lastUserPosition) {
            calculateForPlace(newPlace);
          } else {
            this.getUserPosition(() => {
              calculateForPlace(newPlace);
            });
          }
        } else {
          // Chưa có toạ độ (do dán link rút gọn maps.app.goo.gl hoặc chỉ nhập tên quán)
          newPlace.isResolving = true;
          this.renderPlaces();
          this.showToast("Đã lưu địa điểm! Đang tự động tìm toạ độ & tính đường đi...", 3000);

          this.resolveCoordinatesAsync(mapUrl, name).then(resolved => {
            newPlace.isResolving = false;
            if (resolved) {
              newPlace.lat = resolved.lat;
              newPlace.lng = resolved.lng;
              this.saveData("journey_places_v2", this.places);
              this.sendPlaceToBackend(newPlace);

              if (this.lastUserPosition) {
                calculateForPlace(newPlace);
              } else {
                this.getUserPosition(() => {
                  calculateForPlace(newPlace);
                });
              }
            } else {
              this.renderPlaces();
            }
          });
        }

        this.renderPlaces();
      });
    }

    if (this.periodChip) this.periodChip.addEventListener("click", () => this.switchView("be"));

    // 7. Wordmark: back to Moments and scroll to the top, even when Moments is already open
    if (this.navLogoBtn) {
      this.navLogoBtn.addEventListener("click", () => {
        this.switchView("moments");
        const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduceMotion ? "instant" : "smooth" });
      });
    }

    // Xử lý nút Back/Forward trên điện thoại và trình duyệt
    window.addEventListener("popstate", () => {
      if (window.appShell && window.appShell.consumeBack()) return; // Back closed a sheet first
      const route = parseRoute(window.location.hash);
      this.placesFilter = route.placesFilter;
      this.switchView(route.view, false);
    });

    // Mở trang ban đầu dựa theo URL hash (mặc định là trang khoảnh khắc)
    const initialRoute = parseRoute(window.location.hash);
    this.placesFilter = initialRoute.placesFilter;
    this.switchView(initialRoute.view, false);

    // 8. Nút Kiểm tra xem nơi đang đứng đã từng đi đến chưa
    if (this.checkVisitedGpsBtn) {
      this.checkVisitedGpsBtn.addEventListener("click", () => {
        this.checkIfCurrentLocationVisited();
      });
    }

    // Đóng modal kết quả kiểm tra
    if (this.closeCheckResultBtn) {
      this.closeCheckResultBtn.addEventListener("click", () => {
        if (this.checkResultModal) this.checkResultModal.close();
      });
    }
    if (this.checkResultCloseActionBtn) {
      this.checkResultCloseActionBtn.addEventListener("click", () => {
        if (this.checkResultModal) this.checkResultModal.close();
      });
    }

    // 9. Nút Thêm vị trí tôi đang đứng vào danh sách đã đến luôn
    if (this.addCurrentLocationBtn) {
      this.addCurrentLocationBtn.addEventListener("click", () => {
        if (!this.isAuthenticated) {
          this.openAuthModal(() => {
            this.openAddCurrentLocationModal();
          }, "Nhập mật mã để lưu chỗ này.");
          return;
        }
        this.openAddCurrentLocationModal();
      });
    }

    // Đóng modal Thêm vị trí đang đứng
    if (this.closeAddCurrentLocBtn) {
      this.closeAddCurrentLocBtn.addEventListener("click", () => {
        if (this.addCurrentLocModal) this.addCurrentLocModal.close();
      });
    }

    // Form submit: Thêm vị trí đang đứng vào danh sách ĐÃ ĐẾN
    if (this.addCurrentLocForm) {
      this.addCurrentLocForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveCurrentLocationAsVisited();
      });
    }

    // 9. Tự động lấy vị trí hiện tại của thiết bị trong nền để sẵn sàng tính khoảng cách
    this.getUserPosition(
      () => {
        this.calculateAllDistancesAndRoutes(false);
      },
      () => {},
      { timeout: 7000 }
    );
  }

  /** The place form's values as one string, to detect unsaved changes. */
  placeFormSnapshot() {
    return [this.placeNameInput, this.placeMapInput, this.placeTiktokInput, this.placeNotesInput]
      .map((el) => (el ? el.value : "")).join("\u0001");
  }

  /** @returns {Promise<boolean>} true when the sheet may close. */
  async confirmDiscardPlace() {
    if (this.placeFormSnapshot() === this.placeSnapshot) return true;
    return confirmSheet({ title: "Bỏ thay đổi?", confirmLabel: "Bỏ", cancelLabel: "Sửa tiếp", danger: true });
  }

  /**
   * Opens the add / edit place sheet.
   * @param {{place?: object}} [prefill] pass an existing place to edit it
   */
  openPlaceDialog(prefill) {
    if (!this.isAuthenticated) {
      this.openAuthModal(() => this.openPlaceDialog(prefill), "Nhập mật mã để thêm địa điểm.");
      return;
    }
    const place = prefill && prefill.place ? prefill.place : null;
    this.editingPlaceId = place ? String(place.id) : "";
    if (this.placeForm) this.placeForm.reset();
    document.getElementById("place-modal-title").textContent = place ? "Sửa địa điểm" : "Thêm địa điểm";
    if (place) {
      this.placeNameInput.value = place.name || "";
      this.placeMapInput.value = place.mapUrl || "";
      this.placeTiktokInput.value = place.tiktokUrl || "";
      this.placeNotesInput.value = place.notes || "";
    }
    this.placeSnapshot = this.placeFormSnapshot();
    if (this.placeModal) this.placeModal.showModal();
    if (this.placeNameInput) this.placeNameInput.focus();
    // Kích hoạt ngầm định vị để có toạ độ người dùng trước khi bấm lưu
    if (!place) this.getUserPosition();
  }

  /** Updates a place in place (same id, keeps visited and createdAt); coordinates change only with the map field. */
  saveEditedPlace(id, fields) {
    const place = this.places.find((p) => String(p.id) === String(id));
    if (!place) return;
    const mapChanged = fields.mapUrl !== (place.mapUrl || "");
    Object.assign(place, { name: fields.name, mapUrl: fields.mapUrl, tiktokUrl: fields.tiktokUrl, notes: fields.notes });
    if (mapChanged) {
      const coords = this.extractCoordinates(fields.mapUrl) || this.extractCoordinates(fields.name);
      place.lat = coords ? coords.lat : null;
      place.lng = coords ? coords.lng : null;
    }
    this.saveData("journey_places_v2", this.places);
    this.sendPlaceToBackend(place);
    this.placeModal.close();
    this.placesRenderSignature = "";
    this.renderPlaces();
    this.showToast("Đã lưu thay đổi");
    if (mapChanged && place.lat == null) this.autoResolveMissingPlaceCoordinates();
  }

  // ==========================================
  // ĐIỀU HƯỚNG CHUYỂN TRANG (KHOẢNH KHẮC VS NƠI MUỐN ĐẾN)
  // ==========================================
  switchView(viewName, updateHistory = true, opts = {}) {
    // Cross-fade between tabs where supported (progressive enhancement); otherwise switch instantly.
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof document.startViewTransition === "function" && !reduceMotion && this.currentView) {
      const transition = document.startViewTransition(() => this.applyView(viewName, updateHistory, opts));
      // A skipped transition (hidden tab, rapid taps) is harmless: the view is still switched.
      [transition.ready, transition.finished, transition.updateCallbackDone].forEach((p) => { if (p && p.catch) p.catch(() => {}); });
      return;
    }
    this.applyView(viewName, updateHistory, opts);
  }

  applyView(viewName, updateHistory, opts = {}) {
    if (viewName === "be" && !this.isAuthenticated) {
      this.openAuthModal();
      viewName = "moments";
    }
    if (!VIEW_NAMES.includes(viewName)) viewName = "moments";
    this.viewScroll = this.viewScroll || {};
    if (this.currentView) this.viewScroll[this.currentView] = window.scrollY || 0;
    this.currentView = viewName;
    if (opts.placesFilter) this.placesFilter = opts.placesFilter;
    document.dispatchEvent(new CustomEvent("journey:viewchange", { detail: { view: viewName } }));

    const views = { moments: this.viewMoments, places: this.viewPlaces, be: this.viewBe };
    VIEW_NAMES.forEach((name) => { if (views[name]) views[name].hidden = name !== viewName; });

    if (viewName === "places") {
      this.syncPlacesFilterTabs();
      this.renderPlaces();
      this.calculateAllDistancesAndRoutes(false);
    } else if (viewName === "be") {
      this.renderBePage();
    }

    window.scrollTo({ top: this.viewScroll[viewName] || 0, behavior: "instant" });

    if (updateHistory) {
      const hash = buildHash({ view: viewName, placesFilter: this.placesFilter });
      const url = hash || window.location.pathname + window.location.search;
      window.history.pushState({ view: viewName }, "", url);
    }
  }

  /** Marks the places filter tab that matches this.placesFilter. */
  syncPlacesFilterTabs() {
    document.querySelectorAll("#places [data-filter]").forEach((tab) => {
      const selected = (tab.dataset.filter || "unvisited") === this.placesFilter;
      tab.setAttribute("aria-selected", String(selected));
      tab.setAttribute("tabindex", selected ? "0" : "-1");
    });
  }

  // ==========================================
  // XỬ LÝ ĐỊNH VỊ GPS VÀ TÍNH TOÁN ĐƯỜNG ĐI
  // ==========================================

  // Lấy vị trí GPS của thiết bị với cơ chế fallback 2 tầng và cache
  getUserPosition(successCb, errorCb, options = {}) {
    if (!navigator.geolocation) {
      if (errorCb) errorCb(new Error("Trình duyệt không hỗ trợ Geolocation"));
      return;
    }

    // Nếu vừa lấy vị trí trong vòng 60 giây, tái sử dụng tức thì
    if (this.lastUserPosition && (Date.now() - (this.lastUserPosition.timestamp || 0) < 60000)) {
      if (successCb) successCb(this.lastUserPosition);
      return;
    }

    const defaultOpts = { enableHighAccuracy: true, timeout: 6500, maximumAge: 120000 };
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.lastUserPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now()
        };
        this.saveData("journey_last_user_pos", this.lastUserPosition);
        if (successCb) successCb(this.lastUserPosition);
      },
      (err) => {
        // Fallback định vị mạng / WiFi (độ nhạy cao trên iPhone)
        navigator.geolocation.getCurrentPosition(
          (posFallback) => {
            this.lastUserPosition = {
              lat: posFallback.coords.latitude,
              lng: posFallback.coords.longitude,
              accuracy: posFallback.coords.accuracy,
              timestamp: Date.now()
            };
            this.saveData("journey_last_user_pos", this.lastUserPosition);
            if (successCb) successCb(this.lastUserPosition);
          },
          (errFallback) => {
            console.warn("Lỗi Geolocation:", errFallback);
            if (errorCb) errorCb(errFallback);
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
      },
      { ...defaultOpts, ...options }
    );
  }

  // Trích xuất toạ độ vĩ độ, kinh độ từ chuỗi nhập hoặc link Google Maps / Apple Maps
  extractCoordinates(str) {
    if (!str) return null;
    const clean = String(str).trim();

    // 1. Link Google Maps URL protobuf (!3d<lat>!4d<lng>)
    const protoMatch = clean.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (protoMatch) {
      return { lat: parseFloat(protoMatch[1]), lng: parseFloat(protoMatch[2]) };
    }

    // 2. Link Google Maps có @lat,lng: /@10.776889,106.695444
    const atMatch = clean.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    // 3. Link query ?q=lat,lng hoặc &ll=lat,lng hoặc destination=lat,lng hoặc daddr=lat,lng
    const qMatch = clean.match(/[?&](?:q|ll|query|destination|daddr)=(-?\d+\.\d+)[,+](-?\d+\.\d+)/);
    if (qMatch) {
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }

    // 4. Link Apple Maps hoặc query dạng lat=...&lon=...
    const latLonMatch = clean.match(/[?&]lat=(-?\d+(?:\.\d+)?)&(?:lon|lng)=(-?\d+(?:\.\d+)?)/);
    if (latLonMatch) {
      return { lat: parseFloat(latLonMatch[1]), lng: parseFloat(latLonMatch[2]) };
    }

    // 5. Toạ độ trực tiếp: 10.776889, 106.695444 hoặc 10.776889 106.695444
    const directMatch = clean.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (directMatch) {
      const lat = parseFloat(directMatch[1]);
      const lng = parseFloat(directMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }

    return null;
  }

  // Tự động tìm toạ độ qua API Geocoding (Nominatim & Photon) khi link không có toạ độ
  async resolveCoordinatesAsync(mapUrl, name) {
    // 1. Thử regex từ link và tên
    let coords = this.extractCoordinates(mapUrl) || this.extractCoordinates(name);
    if (coords) return coords;

    // 2. Trích xuất tên địa điểm trong URL nếu là link Google Maps dạng /place/Ten+Dia+Diem
    let searchQuery = (name || "").trim();
    if (mapUrl && mapUrl.includes("/place/")) {
      const m = mapUrl.match(/\/place\/([^/@?]+)/);
      if (m && m[1]) {
        try {
          const decoded = decodeURIComponent(m[1].replace(/\+/g, " "));
          if (decoded && decoded.length > 2) searchQuery = decoded;
        } catch (e) {}
      }
    }

    if (!searchQuery) return null;

    const userLat = this.lastUserPosition ? this.lastUserPosition.lat : 10.776;
    const userLng = this.lastUserPosition ? this.lastUserPosition.lng : 106.700;

    // 3. Gọi OpenStreetMap Nominatim API (tìm chính xác tại Việt Nam)
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&countrycodes=vn&limit=1`;
      const nomRes = await this.geocodeQueue(() => fetch(nomUrl, { headers: { "Accept-Language": "vi,en" } }));
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (nomData && nomData.length > 0) {
          return {
            lat: parseFloat(nomData[0].lat),
            lng: parseFloat(nomData[0].lon)
          };
        }
      }
    } catch (e) {
      console.warn("Lỗi tìm kiếm Nominatim:", e);
    }

    // 4. Fallback qua Photon Komoot API với bias toạ độ khu vực
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&lat=${userLat}&lon=${userLng}&limit=1`;
      const pRes = await this.geocodeQueue(() => fetch(photonUrl));
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData.features && pData.features.length > 0) {
          const pt = pData.features[0].geometry.coordinates; // [lon, lat]
          return { lat: pt[1], lng: pt[0] };
        }
      }
    } catch (e) {
      console.warn("Lỗi tìm kiếm Photon:", e);
    }

    return null;
  }

  // Tự động phân giải các địa điểm trước đó chưa có toạ độ
  async autoResolveMissingPlaceCoordinates() {
    let hasUpdated = false;
    for (const place of this.places) {
      if (!canGeocode(place, Date.now())) continue;
      const coords = await this.resolveCoordinatesAsync(place.mapUrl, place.name);
      hasUpdated = true;
      if (!coords) {
        place.geocodeFailedAt = Date.now(); // không thử lại trong 24 giờ (BUG-08)
        continue;
      }
      place.lat = coords.lat;
      place.lng = coords.lng;
      delete place.geocodeFailedAt;
      if (this.lastUserPosition) {
        const d = this.calculateDistanceKm(this.lastUserPosition.lat, this.lastUserPosition.lng, coords.lat, coords.lng);
        this.placeDistances.set(place.id, d);
      }
      if (this.isAuthenticated) this.sendPlaceToBackend(place); // để máy kia nhận luôn toạ độ
    }
    if (hasUpdated) {
      this.saveData("journey_places_v2", this.places);
      this.renderPlaces();
    }
  }

  // Công thức Haversine tính khoảng cách theo đường chim bay giữa 2 toạ độ (chạy trong < 0.005ms)
  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
    const R = 6371; // Bán kính Trái Đất theo km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Gọi API định tuyến để tính đường đi xe ngắn nhất và thời gian di chuyển
  async fetchDrivingRoute(userLat, userLng, destLat, destLng) {
    if (userLat == null || userLng == null || destLat == null || destLng == null) return null;

    const cacheKey = routeCacheKey(userLat, userLng, destLat, destLng);
    const cached = this.routeCache[cacheKey];
    if (isRouteFresh(cached, Date.now())) return cached.route;

    try {
      // Gọi OSRM Routing Machine tính quãng đường đi xe ngắn nhất
      const url = `https://router.project-osrm.org/route/v1/driving/${destLng},${destLat};${userLng},${userLat}?overview=false`;
      const res = await this.routeQueue(() => fetch(url));
      if (res.ok) {
        const data = await res.json();
        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distanceKm = Number((route.distance / 1000).toFixed(1));
          const durationMin = Math.max(1, Math.round(route.duration / 60));
          const result = {
            distanceKm,
            durationMin,
            isDrivingRoute: true
          };
          this.routeCache[cacheKey] = { route: result, savedAt: Date.now() };
          this.saveData(ROUTE_CACHE_KEY, this.routeCache);
          return result;
        }
      }
    } catch (e) {
      console.warn("OSRM routing API error, fallback to straight line:", e);
    }

    // Fallback: Haversine với hệ số uốn lượn đô thị (~1.3x)
    const straight = this.calculateDistanceKm(userLat, userLng, destLat, destLng);
    if (straight != null) {
      const estKm = Number((straight * 1.3).toFixed(1));
      const estMin = Math.max(1, Math.round((estKm / 25) * 60));
      return {
        distanceKm: estKm,
        durationMin: estMin,
        isDrivingRoute: false
      };
    }

    return null;
  }

  // Tạo Universal URL gọi API Google Maps của thiết bị và điều hướng đường ngắn nhất
  getDeviceGoogleMapsUrl(place) {
    const hasCoords = place.lat != null && place.lng != null && !isNaN(place.lat) && !isNaN(place.lng);
    const destination = hasCoords 
      ? `${place.lat},${place.lng}` 
      : encodeURIComponent(place.name + " " + (place.address || ""));

    // Nếu đã có toạ độ hiện tại của người dùng, gọi Google Maps Directions API đường ngắn nhất
    if (this.lastUserPosition && this.lastUserPosition.lat != null && this.lastUserPosition.lng != null) {
      const origin = `${this.lastUserPosition.lat},${this.lastUserPosition.lng}`;
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    }

    // Nếu chưa có toạ độ người dùng, để origin tự do (Google Maps sẽ dùng Vị trí hiện tại của thiết bị)
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
  }

  formatDistance(km) {
    return formatDistanceVi(km);
  }

  // Tính toán khoảng cách và gọi API đường ngắn nhất cho toàn bộ địa điểm
  calculateAllDistancesAndRoutes(forceSort = false) {
    if (!this.lastUserPosition) return;
    const uLat = this.lastUserPosition.lat;
    const uLng = this.lastUserPosition.lng;

    // 1. Tính khoảng cách thẳng tức thì (<1ms)
    this.places.forEach(p => {
      if (p.lat != null && p.lng != null) {
        const d = this.calculateDistanceKm(uLat, uLng, p.lat, p.lng);
        this.placeDistances.set(p.id, d);
      }
    });

    if (forceSort) {
      this.sortPlacesByDistance();
    }
    this.renderPlaces(forceSort);

    // 2. Đường đi xe chỉ tính cho vài nơi gần nhất, giãn cách ≥ 1 giây và có cache (BUG-08)
    const routedIds = new Set(nearestPlaceIds(this.places, this.placeDistances));
    this.places.forEach(p => {
      if (routedIds.has(p.id)) {
        this.fetchDrivingRoute(uLat, uLng, p.lat, p.lng).then(route => {
          if (route) {
            this.placeRoutes.set(p.id, route);
            if (forceSort) {
              this.sortPlacesByDistance();
            }
            this.renderPlaces(forceSort);
          }
        });
      }
    });
  }

  sortPlacesByDistance() {
    this.places.sort((a, b) => {
      const routeA = this.placeRoutes.get(a.id);
      const routeB = this.placeRoutes.get(b.id);
      const distA = routeA ? routeA.distanceKm : (this.placeDistances.has(a.id) ? this.placeDistances.get(a.id) : 999999);
      const distB = routeB ? routeB.distanceKm : (this.placeDistances.has(b.id) ? this.placeDistances.get(b.id) : 999999);
      return distA - distB;
    });
    this.saveData("journey_places_v2", this.places);
  }

  /** Sets a location chip to idle, busy, or "needs permission". */
  setGpsChipState(chip, state) {
    if (!chip) return;
    const label = chip.querySelector(".chip__label");
    chip.setAttribute("aria-busy", String(state === "busy"));
    chip.disabled = state === "busy";
    if (label && !chip.dataset.idleLabel) chip.dataset.idleLabel = label.textContent;
    if (label) {
      label.textContent = state === "busy" ? "Đang tìm vị trí…" : state === "denied" ? "Bật vị trí" : chip.dataset.idleLabel;
    }
  }

  /** Explains how to turn location back on (shared by the sort and "have we been here" chips). */
  showLocationDeniedSheet() {
    return confirmSheet({
      title: "Cần quyền vị trí",
      body: "Cần quyền vị trí để sắp xếp theo khoảng cách. Vào Cài đặt › Safari › Vị trí để bật.",
      confirmLabel: "Đóng"
    });
  }

  // Lấy vị trí GPS hiện tại và sắp xếp danh sách nơi gần nhất từ trên xuống dưới
  reloadPlacesByGps() {
    this.setGpsChipState(this.reloadPlacesGpsBtn, "busy");
    this.autoResolveMissingPlaceCoordinates();

    const onGotLocation = () => {
      this.placesSortedByDistance = true;
      if (this.reloadPlacesGpsBtn) this.reloadPlacesGpsBtn.setAttribute("aria-pressed", "true");
      this.setGpsChipState(this.reloadPlacesGpsBtn, "idle");
      this.calculateAllDistancesAndRoutes(true);
    };

    this.getUserPosition(
      () => onGotLocation(),
      (err) => {
        const denied = !!(err && err.code === 1);
        this.setGpsChipState(this.reloadPlacesGpsBtn, denied ? "denied" : "idle");
        if (denied) this.showLocationDeniedSheet();
        else this.showToast("Không nhận được GPS. Bé kiểm tra lại cài đặt định vị máy nhé!", 3500);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }

  // ==========================================
  // TRA CỨU ĐỊA CHỈ NGƯỢC (REVERSE GEOCODING TỪ TOẠ ĐỘ GPS)
  // ==========================================
  async reverseGeocode(lat, lng) {
    if (lat == null || lng == null) return null;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi,en`;
      const res = await fetch(url, { signal: controller.signal, headers: { "Accept-Language": "vi,en" } });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const a = data.address;
          const specific = a.amenity || a.shop || a.tourism || a.leisure || a.cafe || a.restaurant || a.historic;
          const street = a.road || a.pedestrian || a.suburb;
          const district = a.city_district || a.district || a.suburb;
          const city = a.city || a.town || a.province || "";

          if (specific && street) return `${specific} - ${street}`;
          if (specific) return specific;
          if (street && district) return `${street}, ${district}`;
          if (street) return `${street}${city ? ", " + city : ""}`;
          if (data.display_name) {
            const parts = data.display_name.split(",").map(p => p.trim());
            return parts.slice(0, 2).join(", ");
          }
        }
      }
    } catch (e) {
      console.warn("Reverse geocode timeout/lỗi:", e);
    }
    return null;
  }

  // ==========================================
  // KIỂM TRA XEM NƠI ĐANG ĐỨNG ĐÃ TỪNG ĐẾN CHƯA
  // ==========================================
  checkIfCurrentLocationVisited() {
    this.setGpsChipState(this.checkVisitedGpsBtn, "busy");

    this.getUserPosition(
      async (pos) => {
        this.setGpsChipState(this.checkVisitedGpsBtn, "idle");
        const uLat = pos.lat;
        const uLng = pos.lng;

        // Quét qua danh sách các địa điểm
        const visitedPlaces = this.places.filter(p => p.visited);
        const unvisitedPlaces = this.places.filter(p => !p.visited);

        // Tính khoảng cách tới tất cả địa điểm đã đến
        const visitedWithDist = visitedPlaces
          .filter(p => p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng))
          .map(p => {
            const distKm = this.calculateDistanceKm(uLat, uLng, p.lat, p.lng);
            return { place: p, distKm, distM: Math.round(distKm * 1000) };
          })
          .sort((a, b) => a.distKm - b.distKm);

        // Tính khoảng cách tới các địa điểm "Muốn đi"
        const unvisitedWithDist = unvisitedPlaces
          .filter(p => p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng))
          .map(p => {
            const distKm = this.calculateDistanceKm(uLat, uLng, p.lat, p.lng);
            return { place: p, distKm, distM: Math.round(distKm * 1000) };
          })
          .sort((a, b) => a.distKm - b.distKm);

        const THRESHOLD_METERS = 200; // Bán kính 200 mét tính là đang ở tại địa điểm đó

        // 1. Trùng khớp với địa điểm ĐÃ TỪNG ĐẾN (<= 200m)
        if (visitedWithDist.length > 0 && visitedWithDist[0].distM <= THRESHOLD_METERS) {
          const match = visitedWithDist[0];
          const when = match.place.updatedAt ? ` (${formatDateVi(new Date(match.place.updatedAt))})` : "";
          this.showCheckLocationResult({
            title: "Hai đứa đã từng đến đây",
            desc: `Hai đứa đã từng đến đây: ${match.place.name}${when}.`,
            primaryText: "Xem địa điểm",
            onPrimary: () => {
              if (this.checkResultModal) this.checkResultModal.close();
              this.highlightPlaceInList(match.place.id, "visited");
            }
          });
          return;
        }

        // 2. Trùng khớp với một địa điểm đang trong mục "MUỐN ĐI" (<= 200m)
        if (unvisitedWithDist.length > 0 && unvisitedWithDist[0].distM <= THRESHOLD_METERS) {
          const match = unvisitedWithDist[0];
          this.showCheckLocationResult({
            title: "Hai đứa đang ở nơi muốn đến",
            desc: `Hai đứa đang đứng ngay tại ${match.place.name}.`,
            primaryText: this.isAuthenticated ? "Đánh dấu đã đến" : "",
            onPrimary: () => {
              if (this.checkResultModal) this.checkResultModal.close();
              this.markPlaceVisited(match.place.id);
            }
          });
          return;
        }

        // 3. Chưa có kỷ niệm nào quanh đây
        const detectedAddress = this.isAuthenticated ? await this.reverseGeocode(uLat, uLng) : null;
        this.showCheckLocationResult({
          title: "Nơi mới",
          desc: `Chưa có kỷ niệm nào quanh đây (bán kính ${THRESHOLD_METERS} m).`,
          primaryText: this.isAuthenticated ? "Lưu chỗ này" : "",
          onPrimary: () => {
            if (this.checkResultModal) this.checkResultModal.close();
            this.openAddCurrentLocationModal(uLat, uLng, detectedAddress);
          }
        });
      },
      (err) => {
        const denied = !!(err && err.code === 1);
        this.setGpsChipState(this.checkVisitedGpsBtn, denied ? "denied" : "idle");
        if (denied) {
          this.showLocationDeniedSheet();
        } else {
          this.showToast("Không nhận được GPS. Bé kiểm tra lại định vị máy nhé!", 3500);
        }
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  }

  showCheckLocationResult(cfg) {
    if (!this.checkResultModal) return;
    if (this.checkResultTitle) this.checkResultTitle.textContent = cfg.title || "Kết quả kiểm tra";
    if (this.checkResultDesc) this.checkResultDesc.textContent = cfg.desc || "";
    if (this.checkResultPrimaryBtn) {
      const hasPrimary = !!(cfg.primaryText && cfg.onPrimary);
      this.checkResultPrimaryBtn.hidden = !hasPrimary;
      if (hasPrimary) {
        if (this.checkResultPrimaryText) this.checkResultPrimaryText.textContent = cfg.primaryText;
        this.checkResultPrimaryBtn.onclick = (e) => {
          e.preventDefault();
          cfg.onPrimary();
        };
      }
    }
    this.checkResultModal.showModal();
  }

  // ==========================================
  // THÊM VỊ TRÍ ĐANG ĐỨNG VÀO DANH SÁCH ĐÃ ĐẾN
  // ==========================================
  openAddCurrentLocationModal(fixedLat = null, fixedLng = null, fixedName = null) {
    if (!this.isAuthenticated) {
      this.showToast("Chỉ Kim & Thư mới có quyền thêm địa điểm");
      this.openAuthModal();
      return;
    }

    const showModalWithCoords = (lat, lng, suggestedName) => {
      this.tempCurrentLocData = { lat, lng };
      if (this.addCurrentLocForm) this.addCurrentLocForm.reset();

      if (this.currentLocCoordsDisplay) {
        this.currentLocCoordsDisplay.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }
      if (this.currentLocNameInput) {
        this.currentLocNameInput.value = suggestedName || "";
        if (!suggestedName) {
          this.currentLocNameInput.placeholder = "Ví dụ: Quán cafe Xinh, Phố đi bộ...";
        }
      }
      if (this.currentLocNotesInput) {
        const today = new Date();
        const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
        this.currentLocNotesInput.placeholder = `Ghé thăm cùng em ngày ${dateStr}`;
      }

      if (this.addCurrentLocModal) this.addCurrentLocModal.showModal();
      if (this.currentLocNameInput) this.currentLocNameInput.focus();
    };

    if (fixedLat != null && fixedLng != null) {
      showModalWithCoords(fixedLat, fixedLng, fixedName);
      return;
    }

    if (this.addCurrentLocationBtn) {
      this.addCurrentLocationBtn.classList.add("spinning");
    }
    this.showToast("Đang lấy toạ độ vị trí hiện tại của bạn...", 2500);

    this.getUserPosition(
      async (pos) => {
        if (this.addCurrentLocationBtn) {
          this.addCurrentLocationBtn.classList.remove("spinning");
        }
        const lat = pos.lat;
        const lng = pos.lng;
        const suggested = await this.reverseGeocode(lat, lng);
        showModalWithCoords(lat, lng, suggested);
      },
      (err) => {
        if (this.addCurrentLocationBtn) {
          this.addCurrentLocationBtn.classList.remove("spinning");
        }
        if (err && err.code === 1) {
          this.showToast("Cần bật quyền Vị trí cho trình duyệt trong Cài đặt máy nhé", 4500);
        } else {
          this.showToast("Không lấy được GPS. Bé kiểm tra lại định vị máy nhé!", 3500);
        }
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  }

  saveCurrentLocationAsVisited() {
    if (!this.tempCurrentLocData) {
      this.showToast("Không tìm thấy toạ độ vị trí hiện tại!");
      return;
    }

    const name = (this.currentLocNameInput ? this.currentLocNameInput.value : "").trim();
    const notes = (this.currentLocNotesInput ? this.currentLocNotesInput.value : "").trim();
    const tiktokUrl = (this.currentLocTiktokInput ? this.currentLocTiktokInput.value : "").trim();

    if (!name) {
      this.showToast("Bé vui lòng nhập tên địa điểm nhé!");
      return;
    }

    const lat = this.tempCurrentLocData.lat;
    const lng = this.tempCurrentLocData.lng;

    const newPlace = {
      id: "place-" + Date.now(),
      name: name,
      mapUrl: `https://www.google.com/maps?q=${lat},${lng}`,
      tiktokUrl: tiktokUrl,
      lat: lat,
      lng: lng,
      notes: notes,
      visited: true, // THÊM TRỰC TIẾP VÀO ĐÃ ĐẾN
      createdAt: new Date().toISOString()
    };

    // Đưa vào đầu danh sách
    this.places.unshift(newPlace);
    this.saveData("journey_places_v2", this.places);
    this.sendPlaceToBackend(newPlace);

    if (this.addCurrentLocModal) this.addCurrentLocModal.close();
    this.showToast("Đã thêm vị trí hiện tại vào danh sách Đã Đến!");

    // Chuyển sang tab "Đã đến" và highlight thẻ vừa tạo
    this.highlightPlaceInList(newPlace.id, "visited");
  }

  // Cuộn đến và làm sáng nổi bật thẻ địa điểm trong danh sách
  highlightPlaceInList(placeId, targetFilter = "visited") {
    // 1. Chuyển tab bộ lọc
    this.placesFilter = targetFilter;
    this.syncPlacesFilterTabs();

    // 2. Render lại danh sách
    this.renderPlaces();

    // 3. Cuộn đến thẻ và thêm hiệu ứng nhấp nháy nổi bật
    setTimeout(() => {
      const card = document.querySelector(`.place[data-id="${CSS.escape(String(placeId))}"]`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("is-highlighted");
        setTimeout(() => card.classList.remove("is-highlighted"), HIGHLIGHT_MS);
      }
    }, 150);
  }

  // Đánh dấu đã đi / muốn đi
  bindMarkVisitedSheet() {
    const modal = document.getElementById("mark-visited-modal");
    if (!modal) return;
    const finish = (thenAddMemory) => {
      const id = this.markVisitedPlaceId;
      modal.close();
      this.markPlaceVisited(id, { thenAddMemory: thenAddMemory });
    };
    document.getElementById("mark-visited-ok").addEventListener("click", () => finish(false));
    document.getElementById("mark-visited-memory").addEventListener("click", () => finish(true));
    document.getElementById("cancel-mark-visited-btn").addEventListener("click", () => modal.close());
  }

  /** Asks before marking a place as visited (the sheet offers "Đã đến" and "Đã đến và lưu khoảnh khắc"). */
  openMarkVisitedSheet(id) {
    if (!this.isAuthenticated) {
      this.showToast("Chỉ Kim & Thư mới có quyền đánh dấu đã đi");
      this.openAuthModal();
      return;
    }
    const place = this.places.find((p) => String(p.id) === String(id));
    if (!place) return;
    this.markVisitedPlaceId = String(id);
    document.getElementById("mark-visited-name").textContent = place.name;
    document.getElementById("mark-visited-modal").showModal();
  }

  markPlaceVisited(id, opts = {}) {
    const place = this.places.find((p) => String(p.id) === String(id));
    if (!place || !this.isAuthenticated) return;
    place.visited = true;
    place.updatedAt = Date.now();
    this.saveData("journey_places_v2", this.places);
    this.sendPlaceToBackend(place);
    this.highlightPlaceInList(id, "visited");
    this.showToast("Đã chuyển sang Đã đến");
    if (opts.thenAddMemory) this.openMemoryForPlace(place);
  }

  unmarkPlaceVisited(id) {
    const place = this.places.find((p) => String(p.id) === String(id));
    if (!place || !this.isAuthenticated) return;
    place.visited = false;
    place.updatedAt = Date.now();
    this.saveData("journey_places_v2", this.places);
    this.sendPlaceToBackend(place);
    this.placesRenderSignature = "";
    this.renderPlaces();
    this.showToast("Đã chuyển về Muốn đi");
  }

  // Mở form khoảnh khắc điền sẵn tên và vị trí của địa điểm, và liên kết hai bản ghi
  openMemoryForPlace(place) {
    const mapsUrl = safeUrl(place.mapUrl);
    this.openMemoryDialog({
      prefill: {
        title: place.name,
        location: mapsUrl ? `${place.name} (${mapsUrl})` : place.name,
        placeId: String(place.id)
      }
    });
  }

  // Xóa địa điểm khỏi danh sách
  /** Delete with a 5 s undo window, same rules as deleteMemory. */
  async deletePlace(id) {
    if (!this.isAuthenticated) {
      this.showToast("Chỉ Kim & Thư mới có quyền xóa địa điểm");
      this.openAuthModal();
      return;
    }
    const pid = String(id);
    const kept = this.places.find((p) => String(p.id) === pid);
    if (!kept) return;
    const confirmed = await confirmSheet({
      title: "Xóa địa điểm này?",
      body: "Địa điểm sẽ bị xóa trên cả hai điện thoại.",
      confirmLabel: "Xóa",
      cancelLabel: "Giữ lại",
      danger: true,
      icon: "trash"
    });
    if (!confirmed) return;
    this.pendingDeleteIds.place.add(pid);
    this.places = this.places.filter((p) => String(p.id) !== pid);
    this.saveData("journey_places_v2", this.places);
    this.placesRenderSignature = "";
    this.renderPlaces();
    this.undo.schedule("place:" + pid, () => this.commitPlaceDelete(pid));
    this.showToast("Đã xóa", TOAST_ACTION_MS, { label: "Hoàn tác", onClick: () => this.undoPlaceDelete(pid, kept) });
  }

  commitPlaceDelete(pid) {
    this.pendingDeleteIds.place.delete(pid);
    const before = this.places.length;
    this.places = this.places.filter((p) => String(p.id) !== pid);
    if (this.places.length !== before) {
      this.saveData("journey_places_v2", this.places);
      this.renderPlaces();
    }
    if (!this.deletedPlaceIds.includes(pid)) {
      this.deletedPlaceIds.push(pid);
      this.saveData("journey_deleted_place_ids", this.deletedPlaceIds);
    }
    this.sendToBackend({ type: "delete_place", id: pid });
  }

  undoPlaceDelete(pid, kept) {
    if (!this.undo.cancel("place:" + pid)) return;
    this.pendingDeleteIds.place.delete(pid);
    if (!this.places.some((p) => String(p.id) === pid)) this.places.unshift(kept);
    this.saveData("journey_places_v2", this.places);
    this.placesRenderSignature = "";
    this.renderPlaces();
  }

  // Hiển thị danh sách địa điểm ra màn hình
  renderPlaces(hasJustSorted = false) {
    if (!this.placesListContainer) return;

    // Cập nhật số lượng đếm trên tab Muốn đi & Đã đến
    const unvisitedCount = this.places.filter(p => !p.visited).length;
    const visitedCount = this.places.filter(p => p.visited).length;

    if (this.countPlacesUnvisited) this.countPlacesUnvisited.textContent = unvisitedCount;
    if (this.countPlacesVisited) this.countPlacesVisited.textContent = visitedCount;

    // Lọc theo tab hiện tại
    const filtered = this.places.filter((p) => (this.placesFilter === "visited" ? p.visited : !p.visited));

    // D-08: skip the DOM rebuild when nothing that the list shows has changed (tab switches, repeated merges)
    const signature = JSON.stringify([
      this.placesFilter, hasJustSorted, this.isAuthenticated, filtered, this.placesSortedByDistance === true,
      this.firstSyncDone === true,
      Array.from(this.placeDistances.entries()), Array.from(this.placeRoutes.entries()),
      this.memories.filter((m) => m.placeId).map((m) => m.placeId)
    ]);
    if (signature === this.placesRenderSignature && this.placesListContainer.childElementCount > 0) return;
    this.placesRenderSignature = signature;

    if (this.shouldShowPlacesSkeleton()) {
      this.placesListContainer.innerHTML = placeSkeletonHtml().repeat(PLACES_SKELETON_ROWS);
      return;
    }
    const previousTops = this.captureRowTops();
    if (filtered.length === 0) {
      this.renderPlacesEmpty();
      return;
    }

    this.shownDistanceIds = this.shownDistanceIds || new Set();
    this.placesListContainer.innerHTML = filtered.map((place) => {
      const route = this.placeRoutes.get(place.id);
      const straightKm = this.placeDistances.has(place.id) ? this.placeDistances.get(place.id) : null;
      const distance = route ? { km: route.distanceKm, approx: false } : (straightKm != null ? { km: straightKm, approx: true } : undefined);
      const isNew = !!distance && !this.shownDistanceIds.has(place.id);
      if (distance) this.shownDistanceIds.add(place.id);
      const linkedMemory = this.memories.find((m) => m.placeId && String(m.placeId) === String(place.id));
      return placeRowHtml(place, {
        couple: this.isAuthenticated, distance: distance, distanceIsNew: isNew,
        linkedMemoryId: linkedMemory ? String(linkedMemory.id) : "",
        mapsUrl: this.getDeviceGoogleMapsUrl(place)
      });
    }).join("");
    if (hasJustSorted) this.animateRowsFrom(previousTops);
  }

  /** Skeleton rows only while the untouched sample places are shown and the first backend sync is pending. */
  shouldShowPlacesSkeleton() {
    if (!this.config.apiUrl || this.firstSyncDone === true) return false;
    return this.places.every((p) => DEFAULT_PLACE_IDS.includes(p.id));
  }

  renderPlacesEmpty() {
    const visited = this.placesFilter === "visited";
    const title = visited ? "Chưa có nơi nào hai đứa đã đến." : "Chưa có nơi nào muốn đến.";
    const body = visited ? "Đánh dấu một nơi là đã đến để lưu lại nhé." : "Lưu quán xinh hay điểm hẹn để đi cùng nhau nhé.";
    const addButton = !visited && this.isAuthenticated
      ? '<button type="button" class="btn btn--primary" id="empty-add-place-btn">Thêm địa điểm</button>' : "";
    this.placesListContainer.innerHTML = `<div class="empty"><span class="empty__art">${icon("pin", { size: EMPTY_ART_PX })}</span><p class="t-headline">${title}</p><p class="muted">${body}</p>${addButton}</div>`;
    const button = document.getElementById("empty-add-place-btn");
    if (button) button.addEventListener("click", () => this.openPlaceDialog());
  }

  captureRowTops() {
    const tops = new Map();
    this.placesListContainer.querySelectorAll(".place[data-id]").forEach((row) => {
      tops.set(row.dataset.id, row.getBoundingClientRect().top);
    });
    return tops;
  }

  /** FLIP: rows slide from their old position after a sort (skipped under reduced motion). */
  animateRowsFrom(previousTops) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this.placesListContainer.querySelectorAll(".place[data-id]").forEach((row) => {
      const before = previousTops.get(row.dataset.id);
      if (before === undefined) return;
      const delta = before - row.getBoundingClientRect().top;
      if (!delta) return;
      row.style.transition = "none";
      row.style.transform = `translateY(${delta}px)`;
      requestAnimationFrame(() => {
        row.style.transition = `transform ${FLIP_MS}ms var(--ease-out)`;
        row.style.transform = "";
      });
    });
  }

  /** One delegated handler for the row actions: visit, more menu, linked memory. */
  bindPlaceRowActions() {
    this.placesListContainer.addEventListener("click", (event) => {
      const target = event.target.closest ? event.target : null;
      if (!target) return;
      const row = target.closest(".place");
      const visit = target.closest(".place__visit");
      const more = target.closest(".place__more");
      const memory = target.closest(".place__memory");
      if (visit && row) this.openMarkVisitedSheet(row.dataset.id);
      else if (more && row) this.openPlaceMenu(more, row.dataset.id);
      else if (memory) {
        const mem = this.memories.find((m) => String(m.id) === memory.dataset.memoryId);
        if (mem) this.openMemoryDetail(mem);
      }
    });
  }

  openPlaceMenu(anchor, placeId) {
    const place = this.places.find((p) => String(p.id) === String(placeId));
    if (!place) return;
    const items = [{ label: "Sửa", icon: "edit", onSelect: () => this.openPlaceDialog({ place: place }) }];
    if (place.visited) items.push({ label: "Chuyển về Muốn đi", icon: "pin", onSelect: () => this.unmarkPlaceVisited(placeId) });
    items.push({ label: "Xóa", icon: "trash", danger: true, onSelect: () => this.deletePlace(placeId) });
    actionMenu.open({ anchor: anchor, items: items });
  }

  // ==========================================
  // TRÁI TIM BAY (CANVAS NỀN) VÀ LỚP PHÁO TIM (CANVAS TRÊN CÙNG)
  // ==========================================
  initPetalsCanvas() {
    const canvas = document.getElementById("petal-canvas");
    const burstCanvas = document.getElementById("burst-canvas");
    if (!canvas || !burstCanvas) return;
    this.petals = new PetalCanvas({
      canvas: canvas,
      burstCanvas: burstCanvas,
      enabled: () => this.loadData(PETALS_SETTING_KEY, "on") !== "off"
    });
    this.petals.start();
  }

  // ==========================================
  // KHOẢNH KHẮC ĂN MỪNG (CHỈ MỘT CHUYỂN ĐỘNG LỚN)
  // ==========================================
  /** @param {{reason: "milestone"|"save", label?: string, origin?: Element}} options */
  celebrate(options) {
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      if (options.reason === "milestone") this.showCelebrateBanner(options.label);
      return;
    }
    const originEl = options.origin || this.countDays;
    const target = originEl ? originEl.getBoundingClientRect() : null;
    const x = target ? target.left + target.width / 2 : window.innerWidth / 2;
    const y = target ? target.top + target.height / 2 : window.innerHeight / 2;
    if (this.petals) this.petals.burst(x, y, CELEBRATE_MS);
    if (options.reason === "milestone") this.rollUpDayCount(this.lastCounterDays);
  }

  showCelebrateBanner(label) {
    if (!this.milestoneLine) return;
    const banner = document.createElement("p");
    banner.className = "celebrate-banner";
    banner.setAttribute("role", "status");
    banner.textContent = `Tròn ${label}`;
    this.milestoneLine.insertAdjacentElement("afterend", banner);
    setTimeout(() => banner.remove(), CELEBRATE_BANNER_MS);
  }

  /** Rolls the day number up from days - 30 to days once, with requestAnimationFrame (not a loop). */
  rollUpDayCount(days) {
    if (!this.countDays || !Number.isFinite(days)) return;
    const from = Math.max(0, days - ROLL_UP_FROM_DAYS);
    const startedAt = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / CELEBRATE_MS);
      this.countDays.textContent = Number(Math.round(from + (days - from) * progress)).toLocaleString("vi-VN");
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /** Celebrates once per local day when today is a milestone day. */
  maybeCelebrateMilestone(milestone) {
    if (!milestone || milestone.daysLeft !== 0) return;
    const today = formatLocalDate(new Date());
    if (this.loadData(CELEBRATED_KEY, "") === today) return;
    this.saveData(CELEBRATED_KEY, today);
    this.celebrate({ reason: "milestone", label: milestone.label });
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
      this.musicToggleBtn.classList.add("active");
      this.musicToggleBtn.setAttribute("aria-pressed", "true");
      this.syncMusicSwitch();

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
    this.musicToggleBtn.classList.remove("active");
    this.musicToggleBtn.setAttribute("aria-pressed", "false");
    this.syncMusicSwitch();
  }

  // ==========================================
  // ĐỒNG BỘ: HÀNG ĐỢI GHI (OUTBOX) + KÉO THAY ĐỔI (DELTA)
  // ==========================================
  async initSync() {
    try {
      const store = await createOutboxStore(window.indexedDB);
      this.syncEngine = new SyncEngine({
        store: store,
        send: (payload) => this.postToBackend(payload),
        onConfirmed: (entry, result) => this.handleWriteConfirmed(entry, result),
        onUnauthorized: () => { if (this.isAuthenticated) this.lockForRejectedPasscode(); },
        onRetry: (entry) => this.handleSyncRetry(entry),
        onChange: () => {}
      });
      await this.syncEngine.load();
      await this.purgeRetiredOutbox();
      await this.restoreQueuedState();
    } catch (e) {
      console.error("Không khởi tạo được hàng đợi đồng bộ:", e);
      this.showToast("Không bật được hàng đợi đồng bộ, dữ liệu mới có thể chưa được gửi lên.", 6000);
    }
    this.bindSyncTriggers();
    await this.syncFromBackend();
  }

  // Bỏ các mục chat / ghi chú hẹn giờ còn nằm trong hàng đợi (tính năng đã bị gỡ)
  async purgeRetiredOutbox() {
    for (const key of this.syncEngine.keys().filter(isRetiredOutboxKey)) await this.syncEngine.remove(key);
  }

  // Khôi phục ảnh đang chờ gửi và đưa lại vào hàng đợi các mục đang "chờ" nhưng mất hàng đợi
  async restoreQueuedState() {
    this.syncEngine.keys().forEach((key) => {
      const payload = this.syncEngine.getEntry(key).payload;
      if (!payload.imageBase64) return;
      if (payload.type !== "memory") return;
      const item = this.memories.find((x) => String(x.id) === String(payload.id));
      if (item && !item.image) item.image = payload.imageBase64;
    });
    const queued = new Set(this.syncEngine.keys());
    const orphanMemories = this.memories.filter((m) => m.syncState === "pending" && !queued.has(`memory:${m.id}`));
    const orphanPlaces = this.places.filter((p) => p.syncState === "pending" && !queued.has(`place:${p.id}`));
    for (const m of orphanMemories) await this.queueMemory(m);
    for (const p of orphanPlaces) await this.sendPlaceToBackend(p);
    this.renderTimeline();
  }

  /** First failed attempt: tell the user once a minute (only when a sync link is set and the phone is online). */
  handleSyncRetry(entry) {
    if (!this.config.apiUrl || entry.attempts !== 1 || !navigator.onLine) return;
    const now = Date.now();
    if (now - (this.lastSyncToastAt || 0) < SYNC_TOAST_GAP_MS) return;
    this.lastSyncToastAt = now;
    this.showToast("Chưa đồng bộ được. Sẽ thử lại tự động.", TOAST_ACTION_MS, {
      label: "Thử ngay", onClick: () => this.syncEngine.retryNow(entry.key)
    });
  }

  /** Offline banner: shown on `offline`, closable until the next `offline`, hidden again on `online`. */
  bindOfflineBanner() {
    const banner = document.getElementById("offline-banner");
    const close = document.getElementById("close-offline-banner-btn");
    if (!banner) return;
    window.addEventListener("offline", () => { banner.hidden = false; });
    window.addEventListener("online", () => { banner.hidden = true; });
    if (close) close.addEventListener("click", () => { banner.hidden = true; });
    banner.hidden = navigator.onLine !== false;
  }

  bindSyncTriggers() {
    const markActive = () => { this.lastActivityAt = Date.now(); };
    ["pointerdown", "keydown", "touchstart"].forEach((evt) => document.addEventListener(evt, markActive, { passive: true }));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") this.syncFromBackend();
      else clearTimeout(this.pollTimer);
    });
    window.addEventListener("online", () => this.syncFromBackend());
  }

  scheduleNextPoll() {
    clearTimeout(this.pollTimer);
    const delay = pollIntervalMs({
      visible: document.visibilityState !== "hidden",
      isAuth: this.isAuthenticated,
      lastActivityAt: this.lastActivityAt,
      now: Date.now()
    });
    if (delay === null) return;
    this.pollTimer = setTimeout(() => this.syncFromBackend(), delay);
  }

  resetSyncCursor() {
    this.syncCursor = 0;
    this.saveData(SYNC_CURSOR_KEY, 0);
  }

  async fetchJson(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  // Gửi một thay đổi lên Apps Script. Backend upsert theo id nên gửi lại luôn an toàn.
  postToBackend(payload) {
    if (!this.config.apiUrl) return Promise.reject(new Error("Chưa cấu hình link backend"));
    const body = JSON.stringify({ ...payload, passcode: this.config.passcode || "" });
    return this.fetchJson(this.config.apiUrl, { method: "POST", body: body }, POST_TIMEOUT_MS);
  }

  // Đưa một thay đổi vào hàng đợi bền vững rồi thử gửi ngay
  async sendToBackend(payload) {
    if (this.syncReady) await this.syncReady;
    if (!this.syncEngine) return;
    try {
      await this.syncEngine.enqueue(outboxKey(payload), payload);
    } catch (e) {
      console.error("Không lưu được vào hàng đợi:", e);
      this.showToast("Chưa lưu được thay đổi vào hàng đợi đồng bộ. Hãy thử lại nhé!", 5000);
      return;
    }
    this.syncEngine.flush();
  }

  queueMemory(mem) {
    mem.syncState = "pending";
    const image = String(mem.image || "");
    return this.sendToBackend({
      type: "memory", id: mem.id, title: mem.title, date: mem.date, location: mem.location,
      story: mem.story, placeId: mem.placeId || "",
      image: image.startsWith("https://") ? image : "",
      imageBase64: image.startsWith("data:") ? image : ""
    });
  }

  // Một lần gửi duy nhất cho mỗi địa điểm (upsert), không còn gửi trùng sang bảng Tasks (BUG-06)
  sendPlaceToBackend(place) {
    if (!place) return Promise.resolve();
    place.syncState = "pending";
    this.saveData("journey_places_v2", this.places);
    return this.sendToBackend({
      type: "place", id: place.id, name: place.name, mapUrl: place.mapUrl || "", tiktokUrl: place.tiktokUrl || "",
      lat: place.lat == null ? null : place.lat, lng: place.lng == null ? null : place.lng,
      notes: place.notes || "", visited: place.visited === true,
      createdAt: place.createdAt || new Date().toISOString()
    });
  }

  handleWriteConfirmed(entry, result) {
    const p = entry.payload;
    const clear = (list, id) => {
      const item = list.find((x) => String(x.id) === String(id));
      if (!item) return false;
      delete item.syncState;
      if (result.imageUrl && !String(item.image || "").startsWith("https://")) item.image = result.imageUrl;
      return true;
    };
    if (p.type === "memory" && clear(this.memories, p.id)) {
      this.persistMemories();
      this.renderTimeline();
    } else if (p.type === "place" && clear(this.places, p.id)) {
      this.saveData("journey_places_v2", this.places);
      this.renderPlaces();
    }
  }

  pendingIdsFor(prefix) {
    if (!this.syncEngine) return [];
    return this.syncEngine.keys().filter((k) => k.startsWith(`${prefix}:`)).map((k) => k.slice(prefix.length + 1));
  }

  async syncFromBackend() {
    if (!this.config.apiUrl || this.isSyncing) return;
    this.isSyncing = true;
    try {
      if (this.syncEngine) await this.syncEngine.flush();
      const params = [`since=${this.syncCursor}`];
      if (this.isAuthenticated) params.push(`passcode=${encodeURIComponent(this.config.passcode || "")}`);
      const data = await this.fetchJson(`${this.config.apiUrl}?${params.join("&")}`, {}, GET_TIMEOUT_MS);
      await this.applyPulledData(data);
      this.saveData(LAST_SYNC_KEY, Date.now());
    } catch (e) {
      console.warn("Chưa đồng bộ được từ Google Drive:", e);
    } finally {
      this.isSyncing = false;
      if (this.firstSyncDone !== true) {
        this.firstSyncDone = true;
        this.renderTimeline();
        this.renderPlaces();
      }
      this.scheduleNextPoll();
    }
  }

  async applyPulledData(data) {
    if (this.isAuthenticated && data.isAuth === false) {
      this.lockForRejectedPasscode();
      return;
    }
    if (this.syncEngine) await this.syncEngine.reconcile(data);
    const deleted = data.deleted || {};
    this.mergeMemories(data.memories || [], deleted.memories || []);
    this.mergePlaces(data.places || [], deleted.places || []);
    this.mergePeriod(data.period);
    if (data.since === 0 && this.isAuthenticated) await this.adoptUnsyncedLocal(data);
    if (Number.isFinite(Number(data.serverTime))) {
      this.syncCursor = Math.max(0, Number(data.serverTime) - SYNC_CURSOR_OVERLAP_MS);
      this.saveData(SYNC_CURSOR_KEY, this.syncCursor);
    }
  }

  rememberTombstones(listName, storageKey, ids) {
    let added = false;
    ids.forEach((raw) => {
      const id = String(raw);
      if (!this[listName].includes(id)) {
        this[listName].push(id);
        added = true;
      }
    });
    if (added) this.saveData(storageKey, this[listName]);
  }

  mergeMemories(upserts, deletedIds) {
    this.rememberTombstones("deletedMemoryIds", "journey_deleted_mem_ids", deletedIds);
    const result = applyDelta(this.memories, { upserts: upserts, deletedIds: deletedIds }, {
      pendingIds: this.pendingIdsFor("memory"),
      tombstones: this.deletedMemoryIds.concat(Array.from(this.pendingDeleteIds.memory)),
      keepLocalWhenEmpty: ["image"]
    });
    if (!result.changed) return;
    this.memories = result.items.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.persistMemories();
    this.renderTimeline();
  }

  normalizeServerPlace(place) {
    const normalized = { ...place };
    if (normalized.lat != null && normalized.lat !== "") normalized.lat = parseFloat(normalized.lat);
    if (normalized.lng != null && normalized.lng !== "") normalized.lng = parseFloat(normalized.lng);
    if ((normalized.lat == null || isNaN(normalized.lat)) && normalized.mapUrl) {
      const coords = this.extractCoordinates(normalized.mapUrl);
      if (coords) {
        normalized.lat = coords.lat;
        normalized.lng = coords.lng;
      }
    }
    return normalized;
  }

  mergePlaces(upserts, deletedIds) {
    this.rememberTombstones("deletedPlaceIds", "journey_deleted_place_ids", deletedIds);
    const result = applyDelta(this.places, { upserts: upserts.map((p) => this.normalizeServerPlace(p)), deletedIds: deletedIds }, {
      pendingIds: this.pendingIdsFor("place"),
      tombstones: this.deletedPlaceIds.concat(Array.from(this.pendingDeleteIds.place)),
      keepLocalWhenEmpty: ["lat", "lng"]
    });
    if (!result.changed) return;
    this.places = result.items;
    this.saveData("journey_places_v2", this.places);
    this.renderPlaces();
    this.calculateAllDistancesAndRoutes(false);
  }

  // Kỳ dâu đồng bộ giữa hai máy: bản mới hơn (updatedAt) thắng, trừ khi máy này đang chờ gửi bản của mình
  mergePeriod(serverPeriod) {
    if (!serverPeriod || !serverPeriod.startDate) return;
    if (this.syncEngine && this.syncEngine.getEntry("period")) return;
    if (Number(serverPeriod.updatedAt) <= Number(this.period.updatedAt || 0)) return;
    this.period = this.normalizePeriod({ ...this.period, ...serverPeriod });
    this.saveData("journey_period_v1", this.period);
    this.renderPeriodTracker();
  }

  // Sau lần đồng bộ đầy đủ: đẩy lên những mục chỉ có trên máy này (từ bản cũ từng làm rơi dữ liệu)
  async adoptUnsyncedLocal(data) {
    const deleted = data.deleted || {};
    const memories = findUnsyncedLocal(this.memories, data.memories || [], deleted.memories, {
      defaultIds: DEFAULT_MEMORY_IDS, pendingIds: this.pendingIdsFor("memory"), tombstones: this.deletedMemoryIds
    });
    const places = findUnsyncedLocal(this.places, data.places || [], deleted.places, {
      defaultIds: DEFAULT_PLACE_IDS, pendingIds: this.pendingIdsFor("place"), tombstones: this.deletedPlaceIds
    });
    for (const m of memories) await this.queueMemory(m);
    for (const p of places) await this.sendPlaceToBackend(p);
    if (memories.length + places.length > 0) {
      this.persistMemories();
      this.renderTimeline();
      this.renderPlaces();
    }
  }

  /** A tiny tick for long-press, unless vibration is turned off. */
  hapticTick() {
    if (this.loadData(HAPTIC_SETTING_KEY, "on") === "off") return;
    if (navigator.vibrate) navigator.vibrate(HAPTIC_TICK_MS);
  }

  // UI-01: ảnh Drive lỗi → thử lại ảnh gốc một lần, rồi hiện ô hồng có trái tim.
  /**
   * Fades photos in on load, retries a failed photo once with its original URL, then swaps the memory for the
   * heart card with a retry button (feed) or a text tile (grid).
   */
  attachImageFallbacks(root) {
    root.querySelectorAll("img[data-fallback-src]").forEach((img) => {
      const markLoaded = () => img.classList.add("is-loaded");
      img.addEventListener("load", markLoaded);
      if (img.complete && img.naturalWidth > 0) markLoaded();
      img.addEventListener("error", () => {
        const original = img.dataset.fallbackSrc;
        if (original && img.getAttribute("src") !== original && !img.dataset.retried) {
          img.dataset.retried = "1";
          img.src = original;
          return;
        }
        this.showMemoryTextFallback(img);
      });
    });
  }

  showMemoryTextFallback(img) {
    const holder = img.closest("[data-id]");
    const mem = holder ? this.memories.find((m) => String(m.id) === holder.dataset.id) : null;
    if (!mem) return;
    if (holder.classList.contains("memory")) {
      holder.outerHTML = memoryFailedCardHtml(mem);
    } else if (holder.classList.contains("tile")) {
      holder.outerHTML = gridTileHtml(Object.assign({}, mem, { image: "" }));
    }
  }

  /** "Mở bản đồ" link for the detail sheet; "" when the location has no safe map URL. */
  formatLocationBadge(locationStr) {
    if (!locationStr) return "";
    const match = locationStr.match(/(https?:\/\/[^\s\)]+)/);
    if (!match) return "";
    const url = safeUrl(match[1]);
    if (!url) return "";
    return `<a href="${this.escapeHTML(url)}" target="_blank" rel="noopener noreferrer" class="map-link btn btn--text">Mở bản đồ</a>`;
  }

  // Ngày gọn cho dòng meta dưới ảnh: "25/10 · 17:09" (cùng năm) hoặc "25/10/2025 · 17:09".
  formatMemoryDateShort(dateStr) {
    if (!dateStr) return "";
    const [datePart, timePart] = String(dateStr).split("T");
    const [year, month, day] = datePart.split("-");
    if (!year || !month || !day) return datePart;
    const sameYear = String(new Date().getFullYear()) === year;
    let out = `${parseInt(day, 10)}/${parseInt(month, 10)}${sameYear ? "" : `/${year}`}`;
    const time = timePart ? timePart.split(":").slice(0, 2).join(":") : "";
    if (time.length === 5) out += ` · ${time}`;
    return out;
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
    return escapeHtml(str);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.journeyApp = new JourneyApp();
});
