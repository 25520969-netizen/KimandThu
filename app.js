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
  apiUrl: ""
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

// ==========================================
// BỘ QUẢN LÝ ỨNG DỤNG (JOURNEY APP)
// ==========================================
class JourneyApp {
  constructor() {
    this.config = this.loadData("journey_config_v3", DEFAULT_CONFIG);
    this.memories = this.loadData("journey_memories_v3", DEFAULT_MEMORIES);
    this.showAllMemories = false;
    this.audioContext = null;
    this.isPlayingMelody = false;
    this.melodyTimer = null;

    this.initDOM();
    this.initEvents();
    this.initPhotoUpload();
    this.startLiveCounter();
    this.renderProfile();
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

    // Timeline & Modals
    this.timelineContainer = document.getElementById("timeline-list-container");
    this.openAddMemoryBtn = document.getElementById("open-add-memory-modal-btn");
    this.heroAddMemoryBtn = document.getElementById("hero-add-memory-btn");
    this.memoryModal = document.getElementById("memory-modal");
    this.memoryForm = document.getElementById("memory-form");
    this.closeMemoryBtn = document.getElementById("close-memory-modal-btn");
    this.cancelMemoryBtn = document.getElementById("cancel-memory-btn");

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

    this.memoryFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target.result;
        this.compressImage(rawDataUrl, 1200, 0.85, (compressedUrl) => {
          this.uploadPreviewImg.src = compressedUrl;
          this.memoryImageInput.value = compressedUrl;
          this.uploadDropzone.style.display = "none";
          this.uploadPreviewWrapper.style.display = "block";
        });
      };
      reader.readAsDataURL(file);
    });

    if (this.removePreviewBtn) {
      this.removePreviewBtn.addEventListener("click", () => {
        this.memoryFileInput.value = "";
        this.memoryImageInput.value = "assets/images/memory1.jpg";
        this.uploadPreviewWrapper.style.display = "none";
        this.uploadDropzone.style.display = "flex";
      });
    }

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
      const today = new Date().toISOString().split("T")[0];
      document.getElementById("memory-date-input").value = today;
      if (this.uploadDropzone && this.uploadPreviewWrapper) {
        this.uploadDropzone.style.display = "flex";
        this.uploadPreviewWrapper.style.display = "none";
        this.memoryImageInput.value = "assets/images/memory1.jpg";
      }
      this.memoryModal.showModal();
    };

    if (this.openAddMemoryBtn) this.openAddMemoryBtn.addEventListener("click", openMemoryDialog);
    if (this.heroAddMemoryBtn) this.heroAddMemoryBtn.addEventListener("click", openMemoryDialog);
    if (this.closeMemoryBtn) this.closeMemoryBtn.addEventListener("click", () => this.memoryModal.close());
    if (this.cancelMemoryBtn) this.cancelMemoryBtn.addEventListener("click", () => this.memoryModal.close());

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
      // Sắp xếp sự kiện gần nhất lên đầu
      this.memories.sort((a, b) => new Date(b.date) - new Date(a.date));
      this.saveData("journey_memories_v3", this.memories);
      this.sendToBackend({ type: "memory", ...newMemory, imageBase64: newMemory.image });
      this.renderTimeline();
      this.memoryForm.reset();
      this.memoryModal.close();
      this.spawnHeartConfetti();
    });

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

      this.saveData("journey_config_v3", this.config);
      this.renderProfile();
      this.updateCounter();
      this.settingsModal.close();
      this.spawnHeartConfetti();
    });

    this.resetDataBtn.addEventListener("click", () => {
      if (confirm("Em có muốn đặt lại các kỷ niệm mẫu mặc định không?")) {
        localStorage.removeItem("journey_config_v3");
        localStorage.removeItem("journey_memories_v3");
        this.config = { ...DEFAULT_CONFIG };
        this.memories = [ ...DEFAULT_MEMORIES ];
        this.renderProfile();
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

    // Hiển thị gọn gàng (mặc định 4 sự kiện mới nhất, có nút xem thêm nếu nhiều hơn)
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
        if (data.memories && data.memories.length > 0) {
          this.memories = data.memories;
          this.saveData("journey_memories_v3", this.memories);
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
