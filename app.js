/**
 * OUR JOURNEY & FUTURE DREAMS
 * Interactive application logic: Live counter, Future task notes,
 * Memory timeline, Ambient petals canvas, and Web Audio chimes.
 */

// ==========================================
// DEFAULT DATA & STATE
// ==========================================
const DEFAULT_CONFIG = {
  partnerOne: "Kim",
  partnerTwo: "Thư",
  startDate: "2025-04-02T19:00:00",
  quote: "Iu béeeee:3"
};

const DEFAULT_TASKS = [
  {
    id: "task-1",
    title: "Picnic date with strawberry sandwiches at the park",
    category: "food",
    targetDate: "Next Sunny Weekend",
    notes: "Bring our checkered blanket, freshly made strawberry sandwiches, and a Polaroid camera! 🍓",
    completed: false
  },
  {
    id: "task-2",
    title: "Watch the sunset & stargaze on Dalat hill",
    category: "travel",
    targetDate: "This Autumn",
    notes: "Hot cocoa in a thermos, cozy oversized knit sweaters, and watching shooting stars together ✨",
    completed: true
  },
  {
    id: "task-3",
    title: "Build a giant living-room blanket fort & binge Ghibli movies",
    category: "cozy",
    targetDate: "Next Rainy Day",
    notes: "Fairy lights inside the fort, warm popcorn, and watching Spirited Away & Howl's Moving Castle 🏰",
    completed: false
  },
  {
    id: "task-4",
    title: "Dress up in matching Hanbok in Seoul",
    category: "travel",
    targetDate: "Next Spring",
    notes: "Stroll through Gyeongbokgung Palace under the blooming cherry blossom trees 🌸",
    completed: false
  },
  {
    id: "task-5",
    title: "Bake handmade matcha cookies from scratch",
    category: "food",
    targetDate: "Soon",
    notes: "Put on matching aprons, play French jazz music in the kitchen, and see whose cookies look cuter 🍵",
    completed: false
  },
  {
    id: "task-6",
    title: "Candlelight rooftop dinner with slow dancing",
    category: "date",
    targetDate: "Upcoming Anniversary",
    notes: "A little private rooftop table with fairy lights and dancing to our favorite song under the stars 🕯️",
    completed: false
  }
];

const DEFAULT_MEMORIES = [
  {
    id: "mem-1",
    title: "The Day We Had Our First Coffee",
    date: "2024-10-10",
    location: "Cozy Corner Cafe",
    image: "assets/images/memory1.jpg",
    story: "I remember how nervous we both were, holding our warm cups. The laughter came so naturally, and three hours flew by in what felt like five minutes. That was the moment I knew you were someone truly special."
  },
  {
    id: "mem-2",
    title: "Sunset Walk Along the Ocean Coast",
    date: "2025-04-18",
    location: "Beach Shore",
    image: "assets/images/memory2.jpg",
    story: "The sky turned into the most breathtaking gradient of pastel pink and gold. Walking barefoot on the cool sand, feeling the ocean breeze and holding your small hand in mine. Total peace."
  },
  {
    id: "mem-3",
    title: "Stargazing Wrapped in a Blanket",
    date: "2025-11-05",
    location: "Pine Hill",
    image: "assets/images/memory3.jpg",
    story: "We sat on the quiet hill with a warm lantern, wrapped in an oversized wool blanket. When a shooting star passed, I didn't even need to make a wish—because the person I wished for was right beside me."
  }
];

const LETTERS = {
  1: {
    title: "When you miss me...",
    content: `Bé Thư yêu dấu của anh,\n\nWhenever you're reading this and feeling far away, please close your eyes for three seconds and take a deep breath.\n\nNo matter where we are or how busy the world gets, my thoughts always drift back to your smile, your laughter, and the gentle way you look at me.\n\nYou are my safe haven and my favorite thought. Distance is just a temporary number—my heart is always right beside you.\n\nSend me a text right now so I can hear your sweet voice! Iu béeeee:3 ❤️`
  },
  2: {
    title: "When you had a rough day...",
    content: `Bé Thư của anh à,\n\nI'm so sorry today was heavy and tiring. You worked so hard, and anh tự hào về em rất nhiều.\n\nRemember: one difficult day does not define your brightness. You don't have to carry the whole world on your shoulders. Right now, kick off your shoes, grab your favorite warm drink, and wrap yourself in a soft blanket.\n\nYou are deeply loved, safe, and so precious to me. Tomorrow the sun will shine softly again. Let me take care of you tonight! 🌸`
  },
  3: {
    title: "When you can't sleep...",
    content: `My sweet girl Thư,\n\nIf sleep is playing hide and seek with you tonight, don't worry. Let your thoughts slow down.\n\nThink about our favorite quiet moments: the cool breeze on the beach, the gentle patter of rain while we were safe inside, and all the sunny mornings waiting for us in the future.\n\nI'm wishing you peaceful dreams filled with soft clouds and gentle melodies. Ngủ ngoan nhé bé iu. 🌙✨`
  },
  4: {
    title: "Happy Anniversary, bé Thư!",
    content: `Happy Anniversary to my favorite person in the whole universe!\n\nLooking back at our journey since 19:00 on April 2, 2025, every single day with you has been a gift I thank the universe for. You make mundane days feel like adventures, and simple quiet evenings feel like home.\n\nThank you for choosing me, for laughing at my silly jokes, and for loving me so purely. Here is to a lifetime of more memories, more laughter, and checking off every single dream on our bucket list together!\n\nIu béeeee:3\nForever and always yours, with all my love. 💖`
  }
};

// ==========================================
// APP STATE MANAGER
// ==========================================
class JourneyApp {
  constructor() {
    this.config = this.loadData("journey_config", DEFAULT_CONFIG);
    // Auto-update to latest config if previous placeholders exist
    if (this.config.partnerOne === "Minh" || !this.config.partnerOne || this.config.startDate === "2024-10-10T00:00:00") {
      this.config = { ...DEFAULT_CONFIG };
      this.saveData("journey_config", this.config);
    }
    this.tasks = this.loadData("journey_tasks", DEFAULT_TASKS);
    this.memories = this.loadData("journey_memories", DEFAULT_MEMORIES);
    this.activeCategory = "all";
    this.audioContext = null;
    this.isPlayingMelody = false;
    this.melodyTimer = null;

    this.initDOM();
    this.initEvents();
    this.startLiveCounter();
    this.renderProfile();
    this.renderTasks();
    this.renderTimeline();
    this.initPetalsCanvas();
  }

  loadData(key, fallback) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (e) {
      console.warn("Error loading data from localStorage", e);
      return fallback;
    }
  }

  saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Error saving data to localStorage", e);
    }
  }

  // ==========================================
  // DOM ELEMENT REFERENCES
  // ==========================================
  initDOM() {
    // Nav & Profile
    this.navCoupleNames = document.getElementById("nav-couple-names");
    this.partnerOneName = document.getElementById("partner-one-name");
    this.partnerTwoName = document.getElementById("partner-two-name");
    this.heroQuote = document.getElementById("hero-custom-quote");
    this.anniversaryDisplay = document.getElementById("anniversary-date-display");

    // Counters
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
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================
  initEvents() {
    // Category tabs filter
    this.categoryTabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab-btn");
      if (!btn) return;
      this.categoryTabs.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
      btn.classList.add("active");
      this.activeCategory = btn.dataset.category;
      this.renderTasks();
    });

    // Task Modal open/close
    this.openAddTaskBtn.addEventListener("click", () => this.taskModal.showModal());
    this.closeTaskBtn.addEventListener("click", () => this.taskModal.close());
    this.cancelTaskBtn.addEventListener("click", () => this.taskModal.close());

    // Task Form Submit
    this.taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("task-title-input").value.trim();
      const category = document.getElementById("task-category-select").value;
      const targetDate = document.getElementById("task-target-input").value.trim() || "Someday Soon";
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
      this.saveData("journey_tasks", this.tasks);
      this.renderTasks();
      this.taskForm.reset();
      this.taskModal.close();
      this.spawnHeartConfetti();
    });

    // Memory Modal open/close
    this.openAddMemoryBtn.addEventListener("click", () => this.memoryModal.showModal());
    this.closeMemoryBtn.addEventListener("click", () => this.memoryModal.close());
    this.cancelMemoryBtn.addEventListener("click", () => this.memoryModal.close());

    // Preset Image selection in memory modal
    document.querySelectorAll(".preset-img-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        document.getElementById("memory-image-input").value = e.target.dataset.url;
      });
    });

    // Memory Form Submit
    this.memoryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("memory-title-input").value.trim();
      const date = document.getElementById("memory-date-input").value;
      const location = document.getElementById("memory-location-input").value.trim() || "Together";
      const image = document.getElementById("memory-image-input").value.trim() || "assets/images/memory1.jpg";
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
      // Sort memories by date descending
      this.memories.sort((a, b) => new Date(a.date) - new Date(b.date));
      this.saveData("journey_memories", this.memories);
      this.renderTimeline();
      this.memoryForm.reset();
      this.memoryModal.close();
      this.spawnHeartConfetti();
    });

    // Letters Open
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

    // Settings Modal
    this.openSettingsBtn.addEventListener("click", () => {
      document.getElementById("cfg-him-name").value = this.config.partnerOne;
      document.getElementById("cfg-her-name").value = this.config.partnerTwo;
      document.getElementById("cfg-start-date").value = this.config.startDate.slice(0, 16);
      document.getElementById("cfg-quote").value = this.config.quote;
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

      this.saveData("journey_config", this.config);
      this.renderProfile();
      this.updateCounter();
      this.settingsModal.close();
      this.spawnHeartConfetti();
    });

    this.resetDataBtn.addEventListener("click", () => {
      if (confirm("Reset everything back to default romantic sample data?")) {
        localStorage.removeItem("journey_config");
        localStorage.removeItem("journey_tasks");
        localStorage.removeItem("journey_memories");
        this.config = { ...DEFAULT_CONFIG };
        this.tasks = [ ...DEFAULT_TASKS ];
        this.memories = [ ...DEFAULT_MEMORIES ];
        this.renderProfile();
        this.renderTasks();
        this.renderTimeline();
        this.settingsModal.close();
      }
    });

    // Lightbox close
    this.closeLightboxBtn.addEventListener("click", () => this.lightboxModal.close());

    // Send love button
    this.sendLoveBtn.addEventListener("click", (e) => {
      this.spawnHeartBurst(e.clientX, e.clientY);
    });

    // Double tap or click anywhere on background to spawn cute hearts
    document.addEventListener("dblclick", (e) => {
      this.spawnHeartBurst(e.clientX, e.clientY);
    });

    // Music Toggle
    this.musicToggleBtn.addEventListener("click", () => this.toggleMelody());
  }

  // ==========================================
  // PROFILE & LIVE COUNTER
  // ==========================================
  renderProfile() {
    const coupleText = `${this.config.partnerOne} & ${this.config.partnerTwo}`;
    this.navCoupleNames.textContent = coupleText;
    this.partnerOneName.textContent = this.config.partnerOne;
    this.partnerTwoName.textContent = this.config.partnerTwo;
    this.heroQuote.textContent = this.config.quote;

    const dateObj = new Date(this.config.startDate);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const enDate = dateObj.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    if (this.anniversaryDisplay) {
      this.anniversaryDisplay.textContent = `${enDate} at ${hours}:${minutes} (${day}/${month}/${year})`;
    }
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
  // TASK NOTES & FUTURE BUCKET LIST
  // ==========================================
  renderTasks() {
    const filtered = this.activeCategory === "all"
      ? this.tasks
      : this.tasks.filter(t => t.category === this.activeCategory);

    this.totalTasksCount.textContent = this.tasks.length;

    // Calculate progress
    const completedCount = this.tasks.filter(t => t.completed).length;
    const totalCount = this.tasks.length;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    this.progressText.textContent = `${completedCount} of ${totalCount} dreams completed (${percent}%)`;
    this.taskProgressBar.style.width = `${percent}%`;

    if (filtered.length === 0) {
      this.tasksContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          <p style="font-size: 1.2rem; font-family: var(--font-handwriting);">No plans in this category yet! ✨</p>
          <p style="font-size: 0.9rem; margin-top: 6px;">Click <strong>+ Add New Dream</strong> to make a wish together!</p>
        </div>
      `;
      return;
    }

    const categoryIcons = {
      travel: "✈️ Travel",
      date: "☕ Date Night",
      food: "🍲 Food & Cooking",
      cozy: "🏡 Cozy Moment",
      milestone: "💍 Milestone"
    };

    this.tasksContainer.innerHTML = filtered.map(task => `
      <article class="task-note ${task.completed ? "completed" : ""}" data-id="${task.id}">
        <div>
          <div class="task-note-top">
            <span class="task-category-badge">${categoryIcons[task.category] || "🌸 Dream"}</span>
            <div class="task-actions">
              <button class="task-icon-action delete-task-btn" title="Delete note" aria-label="Delete plan">🗑️</button>
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
            ? `<span class="completed-stamp">Done Together 💕</span>` 
            : `<span style="font-size: 0.78rem; color: var(--pink-primary);">In our future ✨</span>`
          }
        </div>
      </article>
    `).join("");

    // Attach actions
    this.tasksContainer.querySelectorAll(".task-note").forEach(card => {
      const id = card.dataset.id;

      // Toggle status
      card.querySelector(".toggle-task-status").addEventListener("click", () => {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
          task.completed = !task.completed;
          this.saveData("journey_tasks", this.tasks);
          this.renderTasks();
          if (task.completed) {
            this.spawnHeartConfetti();
          }
        }
      });

      // Delete task
      card.querySelector(".delete-task-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm("Remove this dream from our wishlist?")) {
          this.tasks = this.tasks.filter(t => t.id !== id);
          this.saveData("journey_tasks", this.tasks);
          this.renderTasks();
        }
      });
    });
  }

  // ==========================================
  // MEMORY TIMELINE
  // ==========================================
  renderTimeline() {
    if (this.memories.length === 0) {
      this.timelineContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <p>No memories added yet. Click "+ Add A New Memory" to start our story!</p>
        </div>
      `;
      return;
    }

    this.timelineContainer.innerHTML = this.memories.map((mem) => {
      const dateFormatted = new Date(mem.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });

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

    // Lightbox click on polaroid
    this.timelineContainer.querySelectorAll(".polaroid-card").forEach(card => {
      card.addEventListener("click", () => {
        const item = card.closest(".timeline-item");
        const mem = this.memories.find(m => m.id === item.dataset.id);
        if (mem) {
          this.lightboxImg.src = mem.image;
          this.lightboxTitle.textContent = mem.title;
          this.lightboxDate.textContent = `📍 ${mem.location || "Together"} • 🗓️ ${new Date(mem.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
          this.lightboxStory.textContent = mem.story;
          this.lightboxModal.showModal();
        }
      });
    });
  }

  // ==========================================
  // AMBIENT PETALS CANVAS
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
  // FLOATING HEARTS & CONFETTI
  // ==========================================
  spawnHeartBurst(clientX, clientY) {
    const symbols = ["💖", "🌸", "💕", "✨", "🤍", "🌷"];
    for (let i = 0; i < 7; i++) {
      const heart = document.createElement("div");
      heart.className = "floating-click-heart";
      heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      
      const offsetX = (Math.random() - 0.5) * 80;
      const offsetY = (Math.random() - 0.5) * 40;
      heart.style.left = `${clientX + offsetX}px`;
      heart.style.top = `${clientY + offsetY}px`;
      heart.style.fontSize = `${Math.floor(Math.random() * 16 + 18)}px`;

      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 1400);
    }
  }

  spawnHeartConfetti() {
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2;
    this.spawnHeartBurst(x, y);
  }

  // ==========================================
  // AMBIENT LULLABY MELODY (WEB AUDIO API)
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
      this.musicStatus.textContent = "Melody Playing 🎶";
      this.musicToggleBtn.classList.add("active");

      // Romantic music box notes (Pentatonic sweet melody)
      const notes = [
        261.63, 329.63, 392.00, 523.25, // C4, E4, G4, C5
        440.00, 392.00, 329.63, 293.66, // A4, G4, E4, D4
        329.63, 392.00, 440.00, 523.25, // E4, G4, A4, C5
        587.33, 523.25, 392.00, 329.63  // D5, C5, G4, E4
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
      console.warn("Audio playback not permitted yet", e);
    }
  }

  playChimeTone(freq) {
    if (!this.audioContext) return;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);

    // Warm music box envelope
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
    this.musicStatus.textContent = "Play Melody";
    this.musicToggleBtn.classList.remove("active");
  }

  // Utility escape
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

// Initialize on page ready
document.addEventListener("DOMContentLoaded", () => {
  window.journeyApp = new JourneyApp();
});
