/**
 * KIM & THƯ 💕 CHUYỆN TÌNH CHÚNG MÌNH
 * Ứng dụng ghi lại hành trình yêu, dòng thời gian kỷ niệm và những mong ước tương lai.
 */

// ==========================================
// DỮ LIỆU MẶC ĐỊNH & KHỞI TẠO
// ==========================================
const DEFAULT_CONFIG = {
  partnerOne: "Kim",
  partnerTwo: "Thư",
  startDate: "2025-04-02T19:00:00",
  quote: "Iu béeeee:3",
  apiUrl: ""
};

const DEFAULT_TASKS = [
  {
    id: "task-1",
    title: "Đi dã ngoại ở công viên và ăn bánh sandwich dâu tây",
    category: "food",
    targetDate: "Cuối tuần đẹp trời",
    notes: "Mang theo khăn trải bàn ca-rô, sandwich dâu tây kem tươi tự làm và máy ảnh chụp lấy liền! 🍓",
    completed: false
  },
  {
    id: "task-2",
    title: "Ngắm hoàng hôn & săn sao băng trên đồi Đà Lạt",
    category: "travel",
    targetDate: "Mùa thu này",
    notes: "Một bình cacao nóng, hai chiếc áo len đôi thật ấm, và cùng ngồi ngắm sao băng rơi trên đồi thông ✨",
    completed: true
  },
  {
    id: "task-3",
    title: "Dựng lều chăn gối xem phim Ghibli suốt đêm",
    category: "cozy",
    targetDate: "Ngày mưa tới",
    notes: "Giăng đèn đom đóm trong lều chăn giữa phòng khách, làm bắp rang bơ và cày trọn bộ phim hoạt hình 🏰",
    completed: false
  },
  {
    id: "task-4",
    title: "Cùng mặc Hanbok đôi dạo chơi ở Seoul",
    category: "travel",
    targetDate: "Mùa xuân tới",
    notes: "Nắm tay nhau đi dạo dưới những tán hoa anh đào nở rộ ở Cung điện Gyeongbokgung 🌸",
    completed: false
  },
  {
    id: "task-5",
    title: "Tự tay làm bánh quy matcha thơm phức tại nhà",
    category: "food",
    targetDate: "Sắp tới nè",
    notes: "Đeo tạp dề đôi, bật nhạc jazz nhẹ nhàng trong bếp, rồi thi xem bánh quy của ai nặn hình dễ thương hơn 🍵",
    completed: false
  },
  {
    id: "task-6",
    title: "Bữa tối lãng mạn dưới ánh nến và cùng khiêu vũ chậm",
    category: "date",
    targetDate: "Kỷ niệm ngày yêu",
    notes: "Một góc bàn ấm cúng với nến thơm, hoa tươi và cùng nhảy một bài hát hai đứa thích nhất dưới bầu trời đêm 🕯️",
    completed: false
  }
];

const DEFAULT_MEMORIES = [
  {
    id: "mem-1",
    title: "Ngày Đầu Tiên Đi Cafe Cùng Nhau",
    date: "2025-04-02",
    location: "Góc quán cafe quen",
    image: "assets/images/memory1.jpg",
    story: "Anh vẫn nhớ hôm ấy hai đứa ngại ngùng thế nào lúc mới gặp. Thế mà tiếng cười cứ tự nhiên vang lên, ba tiếng đồng hồ trôi qua cứ ngỡ mới năm phút. Khoảnh khắc ấy anh biết em chính là cô gái đặc biệt nhất đời anh."
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
    id: "mem-3",
    title: "Ngắm Bầu Trời Sao Dưới Chiếc Chăn Ấm",
    date: "2025-11-20",
    location: "Đồi thông lộng gió",
    image: "assets/images/memory3.jpg",
    story: "Hai đứa ngồi cạnh nhau dưới chiếc chăn len to sưởi ấm, chiếc đèn bão vàng lung linh. Khi thấy vệt sao băng vụt qua, anh chẳng cần ước điều gì nữa — bởi vì điều ước đẹp nhất vũ trụ đã ngồi ngay bên cạnh anh rồi."
  }
];

const LETTERS = {
  1: {
    title: "Mở ra khi em nhớ anh...",
    content: `Bé Thư yêu dấu của anh,\n\nMỗi khi em đọc được lá thư này và cảm thấy nhớ anh, hãy nhắm mắt lại 3 giây và hít thở thật sâu nhé.\n\nDù hai đứa ở bất cứ đâu hay thế giới có bận rộn đến thế nào, tâm trí anh lúc nào cũng hướng về em — về nụ cười ngọt ngào, ánh mắt dịu dàng và những câu chuyện líu lo của em.\n\nEm là bến đỗ bình yên nhất và là niềm hạnh phúc lớn nhất của anh. Nhớ anh thì nhắn tin hay gọi ngay cho anh nhé, anh luôn đợi nghe giọng em nè!\n\nIu béeeee:3 ❤️`
  },
  2: {
    title: "Mở ra khi em có một ngày mệt mỏi...",
    content: `Bé Thư của anh à,\n\nAnh biết hôm nay có lẽ là một ngày dài và đầy áp lực với em. Em đã cố gắng rất nhiều rồi, và anh tự hào về em vô cùng.\n\nNhớ nhé: một ngày khó khăn không thể làm mất đi sự đáng yêu và rạng rỡ của em. Em không cần phải gồng mình gánh vác cả thế giới đâu. Về nhà cởi giày ra, uống một ly nước ấm, trùm chăn nghỉ ngơi thật ngoan nhé.\n\nCó anh ở đây rồi, để anh ôm em một cái thật chặt. Ngày mai mặt trời sẽ lại lên và mọi thứ sẽ dịu dàng trở lại thôi! 🌸`
  },
  3: {
    title: "Mở ra khi em khó ngủ...",
    content: `Bé iu của anh,\n\nNếu đêm nay giấc ngủ lỡ trốn tìm với em, đừng lo lắng hay suy nghĩ nhiều nha.\n\nHãy nghĩ về những khoảnh khắc bình yên nhất của hai đứa: buổi chiều đi dạo mát rượi, những ngày mưa rả rích nằm nghe nhạc trong phòng ấm, và tất cả những chuyến đi rực rỡ đang đợi tụi mình ở phía trước.\n\nAnh gửi cho em một triệu cái ôm ấm áp và những giấc mơ ngọt ngào nhất. Nhắm mắt lại ngủ ngoan nhé, bé cưng của anh. 🌙✨`
  },
  4: {
    title: "Chúc mừng ngày kỷ niệm của tụi mình!",
    content: `Chúc mừng ngày kỷ niệm tình yêu của Kim và Thư!\n\nNhìn lại hành trình từ lúc 19:00 ngày 2 tháng 4 năm 2025, mỗi ngày trôi qua có em bên cạnh đều là một món quà vô giá mà anh luôn cảm ơn cuộc đời.\n\nCảm ơn em đã bước vào cuộc sống của anh, đã yêu thương và cùng anh chia sẻ từng niềm vui nhỏ bé. Cùng anh đi tiếp một chặng đường thật dài, cùng nhau hoàn thành hết tất cả những mong ước trong danh sách này nhé!\n\nIu béeeee:3\nMãi mãi yêu em trọn vẹn bằng cả trái tim! 💖`
  }
};

// ==========================================
// BỘ QUẢN LÝ ỨNG DỤNG (JOURNEY APP)
// ==========================================
class JourneyApp {
  constructor() {
    this.config = this.loadData("journey_config_v2", DEFAULT_CONFIG);
    this.tasks = this.loadData("journey_tasks_v2", DEFAULT_TASKS);
    this.memories = this.loadData("journey_memories_v2", DEFAULT_MEMORIES);
    this.activeCategory = "all";
    this.audioContext = null;
    this.isPlayingMelody = false;
    this.melodyTimer = null;
    this.showAllMemories = false;

    this.initDOM();
    this.initEvents();
    this.initPhotoUpload();
    this.startLiveCounter();
    this.renderProfile();
    this.renderTasks();
    this.renderTimeline();
    this.initPetalsCanvas();
    this.syncFromBackend();
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
    // Nav & Profile
    this.navCoupleNames = document.getElementById("nav-couple-names");
    this.partnerOneName = document.getElementById("partner-one-name");
    this.partnerTwoName = document.getElementById("partner-two-name");
    this.heroQuote = document.getElementById("hero-custom-quote");

    // Live Counter
    this.countDays = document.getElementById("count-days");
    this.countHours = document.getElementById("count-hours");
    this.countMinutes = document.getElementById("count-minutes");
    this.countSeconds = document.getElementById("count-seconds");

    // Task Notes
    this.tasksContainer = document.getElementById("task-notes-container");
    this.categoryTabs = document.getElementById("category-filter");
    this.totalTasksCount = document.getElementById("total-tasks-count");
    this.progressText = document.getElementById("progress-text");
    this.taskProgressBar = document.getElementById("task-progress-bar");

    // Modals
    this.taskModal = document.getElementById("task-modal");
    this.taskForm = document.getElementById("task-form");
    this.openAddTaskBtn = document.getElementById("open-add-task-modal-btn");
    this.closeTaskBtn = document.getElementById("close-task-modal-btn");
    this.cancelTaskBtn = document.getElementById("cancel-task-btn");

    this.memoryModal = document.getElementById("memory-modal");
    this.memoryForm = document.getElementById("memory-form");
    this.openAddMemoryBtn = document.getElementById("open-add-memory-modal-btn");
    this.closeMemoryBtn = document.getElementById("close-memory-modal-btn");
    this.cancelMemoryBtn = document.getElementById("cancel-memory-btn");
    this.timelineContainer = document.getElementById("timeline-list-container");

    this.letterModal = document.getElementById("letter-modal");
    this.letterTitle = document.getElementById("letter-modal-title");
    this.letterContent = document.getElementById("letter-modal-content");
    this.closeLetterBtn = document.getElementById("close-letter-modal-btn");
    this.dismissLetterBtn = document.getElementById("dismiss-letter-btn");

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

    // Photo Upload Elements
    this.memoryFileInput = document.getElementById("memory-file-input");
    this.memoryImageInput = document.getElementById("memory-image-input");
    this.uploadDropzone = document.getElementById("upload-dropzone");
    this.uploadPreviewWrapper = document.getElementById("upload-preview-wrapper");
    this.uploadPreviewImg = document.getElementById("upload-preview-img");
    this.removePreviewBtn = document.getElementById("remove-preview-btn");
  }

  // ==========================================
  // XỬ LÝ CHỌN ẢNH TỪ ĐIỆN THOẠI (EASY UPLOAD)
  // ==========================================
  initPhotoUpload() {
    if (!this.memoryFileInput) return;

    // Khi người dùng chọn file ảnh từ điện thoại/máy tính
    this.memoryFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target.result;
        // Nén ảnh nhẹ nhàng trên canvas để đảm bảo mượt mà
        this.compressImage(rawDataUrl, 1200, 0.85, (compressedUrl) => {
          this.uploadPreviewImg.src = compressedUrl;
          this.memoryImageInput.value = compressedUrl;
          this.uploadDropzone.style.display = "none";
          this.uploadPreviewWrapper.style.display = "block";
        });
      };
      reader.readAsDataURL(file);
    });

    // Nút đổi ảnh khác
    if (this.removePreviewBtn) {
      this.removePreviewBtn.addEventListener("click", () => {
        this.memoryFileInput.value = "";
        this.memoryImageInput.value = "assets/images/memory1.jpg";
        this.uploadPreviewWrapper.style.display = "none";
        this.uploadDropzone.style.display = "flex";
      });
    }

    // Khi chọn các tranh minh họa có sẵn
    document.querySelectorAll(".preset-img-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const url = e.target.dataset.url;
        this.memoryImageInput.value = url;
        this.uploadPreviewImg.src = url;
        this.uploadDropzone.style.display = "none";
        this.uploadPreviewWrapper.style.display = "block";
      });
    });
  }

  // Nén ảnh client-side để không vượt quá dung lượng localStorage
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
    // Phân loại danh mục mong ước
    this.categoryTabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;
      this.categoryTabs.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
      this.activeCategory = btn.dataset.category;
      this.renderTasks();
    });

    // Mở / Đóng modal Thêm mong ước
    this.openAddTaskBtn.addEventListener("click", () => this.taskModal.showModal());
    this.closeTaskBtn.addEventListener("click", () => this.taskModal.close());
    this.cancelTaskBtn.addEventListener("click", () => this.taskModal.close());

    // Submit form thêm mong ước
    this.taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("task-title-input").value.trim();
      const category = document.getElementById("task-category-select").value;
      const targetDate = document.getElementById("task-target-input").value.trim() || "Sắp tới nè";
      const notes = document.getElementById("task-notes-input").value.trim();

      if (!title) return;

      const newTask = {
        id: "task-" + Date.now(),
        title,
        category,
        targetDate,
        notes,
        completed: false
      };

      this.tasks.unshift(newTask);
      this.saveData("journey_tasks_v2", this.tasks);
      this.sendToBackend({ type: "task", ...newTask });
      this.renderTasks();
      this.taskForm.reset();
      this.taskModal.close();
      this.spawnHeartConfetti();
    });

    // Mở / Đóng modal Thêm kỷ niệm
    this.openAddMemoryBtn.addEventListener("click", () => {
      // Đặt ngày mặc định là hôm nay
      const today = new Date().toISOString().split("T")[0];
      document.getElementById("memory-date-input").value = today;
      // Reset upload preview
      if (this.uploadDropzone && this.uploadPreviewWrapper) {
        this.uploadDropzone.style.display = "flex";
        this.uploadPreviewWrapper.style.display = "none";
        this.memoryImageInput.value = "assets/images/memory1.jpg";
      }
      this.memoryModal.showModal();
    });
    this.closeMemoryBtn.addEventListener("click", () => this.memoryModal.close());
    this.cancelMemoryBtn.addEventListener("click", () => this.memoryModal.close());

    // Submit form thêm kỷ niệm
    this.memoryForm.addEventListener("submit", (e) => {
      e.preventDefault();
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
      this.memories.sort((a, b) => new Date(b.date) - new Date(a.date));
      this.saveData("journey_memories_v2", this.memories);
      this.sendToBackend({ type: "memory", ...newMemory, imageBase64: newMemory.image });
      this.renderTimeline();
      this.memoryForm.reset();
      this.memoryModal.close();
      this.spawnHeartConfetti();
    });

    // Mở lá thư
    document.querySelectorAll(".envelope-card").forEach(card => {
      card.addEventListener("click", () => {
        const letterId = card.dataset.letterId;
        const letter = LETTERS[letterId];
        if (letter) {
          this.letterTitle.textContent = letter.title;
          this.letterContent.textContent = letter.content;
          this.letterModal.showModal();
          this.spawnHeartConfetti();
        }
      });
    });
    this.closeLetterBtn.addEventListener("click", () => this.letterModal.close());
    this.dismissLetterBtn.addEventListener("click", () => this.letterModal.close());

    // Cài đặt thông tin
    this.openSettingsBtn.addEventListener("click", () => {
      document.getElementById("cfg-him-name").value = this.config.partnerOne;
      document.getElementById("cfg-her-name").value = this.config.partnerTwo;
      document.getElementById("cfg-start-date").value = this.config.startDate.slice(0, 16);
      document.getElementById("cfg-quote").value = this.config.quote;
      const apiInput = document.getElementById("cfg-api-url");
      if (apiInput) apiInput.value = this.config.apiUrl || "";
      this.settingsModal.showModal();
    });
    this.closeSettingsBtn.addEventListener("click", () => this.settingsModal.close());

    this.settingsForm.addEventListener("submit", (e) => {
      e.preventDefault();
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

      this.saveData("journey_config_v2", this.config);
      this.renderProfile();
      this.updateCounter();
      this.settingsModal.close();
      this.spawnHeartConfetti();
    });

    this.resetDataBtn.addEventListener("click", () => {
      if (confirm("Em có muốn đặt lại các dữ liệu mẫu mặc định ngọt ngào không?")) {
        localStorage.removeItem("journey_config_v2");
        localStorage.removeItem("journey_tasks_v2");
        localStorage.removeItem("journey_memories_v2");
        this.config = { ...DEFAULT_CONFIG };
        this.tasks = [ ...DEFAULT_TASKS ];
        this.memories = [ ...DEFAULT_MEMORIES ];
        this.renderProfile();
        this.renderTasks();
        this.renderTimeline();
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
  // DANH SÁCH MONG ƯỚC (TASK NOTES)
  // ==========================================
  renderTasks() {
    const filtered = this.activeCategory === "all"
      ? this.tasks
      : this.tasks.filter(t => t.category === this.activeCategory);

    this.totalTasksCount.textContent = this.tasks.length;

    const completedCount = this.tasks.filter(t => t.completed).length;
    const totalCount = this.tasks.length;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    this.progressText.textContent = `Đã hoàn thành ${completedCount} trên ${totalCount} mong ước (${percent}%)`;
    this.taskProgressBar.style.width = `${percent}%`;

    if (filtered.length === 0) {
      this.tasksContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          <p style="font-size: 1.25rem; font-family: var(--font-handwriting);">Chưa có mong ước nào trong mục này nè! ✨</p>
          <p style="font-size: 0.9rem; margin-top: 6px;">Bấm <strong>+ Thêm Mong Ước Mới</strong> để hai đứa cùng ghi thêm nha!</p>
        </div>
      `;
      return;
    }

    const categoryNames = {
      travel: "✈️ Du Lịch",
      date: "☕ Hẹn Hò",
      food: "🍲 Ăn Uống",
      cozy: "🏡 Khoảnh Khắc",
      milestone: "💍 Cột Mốc"
    };

    this.tasksContainer.innerHTML = filtered.map(task => `
      <article class="task-note ${task.completed ? "completed" : ""}" data-id="${task.id}">
        <div>
          <div class="task-note-top">
            <span class="task-category-badge">${categoryNames[task.category] || "🌸 Mong Ước"}</span>
            <div class="task-actions">
              <button class="task-icon-action delete-task-btn" title="Xóa mong ước này" aria-label="Xóa">🗑️</button>
            </div>
          </div>

          <div class="task-content">
            <div class="task-checkbox-wrap toggle-task-status">
              <span class="custom-checkbox" aria-hidden="true">${task.completed ? "✓" : ""}</span>
              <h3 class="task-title">${this.escapeHTML(task.title)}</h3>
            </div>
            ${task.notes ? `<p class="task-details">${this.escapeHTML(task.notes)}</p>` : ""}
          </div>
        </div>

        <div class="task-note-footer">
          <span class="task-target-date">🗓️ ${this.escapeHTML(task.targetDate)}</span>
          ${task.completed 
            ? `<span class="completed-stamp">Đã Cùng Nhau Làm 💕</span>` 
            : `<span style="font-size: 0.78rem; color: var(--pink-primary);">Trong tương lai gần ✨</span>`
          }
        </div>
      </article>
    `).join("");

    // Gắn sự kiện tương tác
    this.tasksContainer.querySelectorAll(".task-note").forEach(card => {
      const id = card.dataset.id;

      card.querySelector(".toggle-task-status").addEventListener("click", () => {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
          task.completed = !task.completed;
          this.saveData("journey_tasks_v2", this.tasks);
          this.sendToBackend({ type: "toggle_task", id: task.id, completed: task.completed });
          this.renderTasks();
          if (task.completed) {
            this.spawnHeartConfetti();
          }
        }
      });

      card.querySelector(".delete-task-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm("Em có muốn xóa mong ước này khỏi danh sách không?")) {
          this.tasks = this.tasks.filter(t => t.id !== id);
          this.saveData("journey_tasks_v2", this.tasks);
          this.renderTasks();
        }
      });
    });
  }

  // ==========================================
  // DÒNG THỜI GIAN KỶ NIỆM (TIMELINE)
  // ==========================================
  renderTimeline() {
    if (this.memories.length === 0) {
      this.timelineContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <p>Chưa có kỷ niệm nào được lưu. Bấm "+ Thêm Kỷ Niệm Mới" để lưu giữ khoảnh khắc đầu tiên nhé!</p>
        </div>
      `;
      return;
    }

    // Luôn sắp xếp từ sự kiện gần nhất trở về trước (mới nhất ở trên cùng)
    this.memories.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Hiển thị gọn gàng (tối đa 4 sự kiện mới nhất, có nút xem thêm nếu nhiều hơn)
    const visibleMemories = this.showAllMemories ? this.memories : this.memories.slice(0, 4);

    this.timelineContainer.innerHTML = visibleMemories.map((mem) => {
      const dateParts = mem.date.split("-");
      let dateFormatted = mem.date;
      if (dateParts.length === 3) {
        dateFormatted = `Ngày ${parseInt(dateParts[2])} tháng ${parseInt(dateParts[1])}, ${dateParts[0]}`;
      }

      return `
        <div class="timeline-item" data-id="${mem.id}">
          <div class="polaroid-card">
            <div class="polaroid-img-wrapper">
              <img src="${mem.image}" alt="${this.escapeHTML(mem.title)}" loading="lazy">
              ${mem.location ? `<span class="polaroid-badge">📍 ${this.escapeHTML(mem.location)}</span>` : ""}
            </div>
            <div class="polaroid-meta">
              <span class="polaroid-date">🗓️ ${dateFormatted}</span>
              <h3 class="polaroid-title">${this.escapeHTML(mem.title)}</h3>
              <p class="polaroid-caption">"${this.escapeHTML(mem.story)}"</p>
            </div>
          </div>
        </div>
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

    this.timelineContainer.querySelectorAll(".polaroid-card").forEach(card => {
      card.addEventListener("click", () => {
        const item = card.closest(".timeline-item");
        const mem = this.memories.find(m => m.id === item.dataset.id);
        if (mem) {
          this.lightboxImg.src = mem.image;
          this.lightboxTitle.textContent = mem.title;
          const dateParts = mem.date.split("-");
          const dateStr = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : mem.date;
          this.lightboxDate.textContent = `📍 ${mem.location || "Cùng Nhau"} • 🗓️ ${dateStr}`;
          this.lightboxStory.textContent = mem.story;
          this.lightboxModal.showModal();
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

      // Giai điệu nhẹ nhàng êm ái
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
      fetch(this.config.apiUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }).catch(e => console.warn("Lỗi gửi dữ liệu lên Google Drive Backend:", e));
    } catch (e) {
      console.warn("Lỗi fetch:", e);
    }
  }

  syncFromBackend() {
    if (!this.config.apiUrl) return;
    fetch(this.config.apiUrl)
      .then(res => res.json())
      .then(data => {
        if (data.tasks && data.tasks.length > 0) {
          this.tasks = data.tasks;
          this.saveData("journey_tasks_v2", this.tasks);
          this.renderTasks();
        }
        if (data.memories && data.memories.length > 0) {
          this.memories = data.memories;
          this.saveData("journey_memories_v2", this.memories);
          this.renderTimeline();
        }
      })
      .catch(e => console.warn("Chưa đồng bộ được từ Google Drive:", e));
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
