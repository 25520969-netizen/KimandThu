/**
 * Floating hearts (spec 2.4). The class keeps its old name. A fixed canvas behind the page draws a few small
 * hearts that rise and sway; a second canvas above the page draws the celebration burst. The frame loop runs only
 * while PetalCanvas.shouldAnimate() is true (tab visible, no dialog open, setting on, reduced motion off, or a
 * burst is playing); when it is false the loop is cancelled.
 */
(function (root) {
  "use strict";

  const PHONE_COUNT = 12;
  const WIDE_COUNT = 16;
  const WIDE_MIN_WIDTH_PX = 768;
  const STATIC_COUNT = 8;
  const STATIC_SEED = 0x6b0b0;
  const BURST_COUNT = 24;
  const BURST_DEFAULT_MS = 1200;
  const BURST_DIST_MIN_PX = 60;
  const BURST_DIST_MAX_PX = 140;
  const BURST_RISE_PX = 40;
  const BURST_ALPHA = 0.9;
  const DPR_CAP = 2;
  const MAX_DT_MS = 50;
  const THEME_CHECK_EVERY_FRAMES = 15;
  const SPRITE_PX = 64;
  const HEART_VIEWBOX_PX = 24;
  const HEART_PATH = "M12 20s-8-4.9-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.1-8 11-8 11z";
  const SIZE_RANGE = [10, 22];
  const SPEED_RANGE = [12, 28];
  const SWAY_AMP_RANGE = [10, 24];
  const SWAY_PERIOD_RANGE = [4000, 7000];
  const TILT_DEG = 15;
  const FALLBACK_RGB = [255, 127, 165];
  const FALLBACK_ALPHA = [0.14, 0.26];

  /** @param {string} hex "#RRGGBB" @returns {number[]} [r, g, b] */
  function hexToRgb(hex) {
    const match = /^#([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!match) return FALLBACK_RGB.slice();
    const n = parseInt(match[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function between(range, random) {
    return range[0] + random() * (range[1] - range[0]);
  }

  /** Small seeded generator, so the static frame does not reshuffle on resize. */
  function seededRandom(seed) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class PetalCanvas {
    /** @param {{canvas: HTMLCanvasElement, burstCanvas: HTMLCanvasElement, enabled?: () => boolean}} options */
    constructor(options) {
      this.canvas = options.canvas;
      this.burstCanvas = options.burstCanvas;
      this.enabled = options.enabled || (() => true);
      this.ctx = this.canvas.getContext("2d");
      this.burstCtx = this.burstCanvas.getContext("2d");
      this.hearts = [];
      this.particles = [];
      this.burstStart = 0;
      this.burstDuration = 0;
      this.covered = false;
      this.frameId = 0;
      this.frames = 0;
      this.lastTime = 0;
      this.theme = { rgb: FALLBACK_RGB.slice(), alpha: FALLBACK_ALPHA.slice() };
      this.sprite = null;
    }

    reducedMotion() {
      return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }

    isCovered() {
      return !!root.document.querySelector("dialog[open]");
    }

    bursting() {
      return this.particles.length > 0;
    }

    start() {
      this.fit();
      root.addEventListener("resize", () => this.fit());
      root.document.addEventListener("visibilitychange", () => this.update());
      root.document.addEventListener("close", () => this.update(), true);
      new MutationObserver(() => this.update()).observe(root.document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
      const query = root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)") : null;
      if (query && query.addEventListener) query.addEventListener("change", () => this.update());
      this.update();
    }

    stop() {
      root.cancelAnimationFrame(this.frameId);
      this.frameId = 0;
    }

    fit() {
      const dpr = Math.min(root.devicePixelRatio || 1, DPR_CAP);
      this.width = root.innerWidth;
      this.height = root.innerHeight;
      [[this.canvas, this.ctx], [this.burstCanvas, this.burstCtx]].forEach(([canvas, ctx]) => {
        canvas.width = Math.round(this.width * dpr);
        canvas.height = Math.round(this.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      });
      if (this.hearts.length !== PetalCanvas.heartCount(this.width)) this.hearts = [];
      this.update();
    }

    /** Starts or cancels the loop, and keeps the hearts canvas in step when no loop runs. */
    update() {
      this.covered = this.isCovered();
      const animate = PetalCanvas.shouldAnimate(this.state());
      if (animate && !this.frameId) {
        this.readTheme();
        this.lastTime = root.performance.now();
        this.frameId = root.requestAnimationFrame((now) => this.frame(now));
      } else if (!animate && this.frameId) {
        this.stop();
      }
      if (!this.frameId) this.paintIdle();
    }

    state() {
      return {
        hidden: !!root.document.hidden, reducedMotion: this.reducedMotion(),
        enabled: this.enabled(), covered: this.covered, bursting: this.bursting()
      };
    }

    /** No loop: clear when the setting is off, draw one fixed frame under reduced motion, otherwise keep the last frame. */
    paintIdle() {
      if (!this.enabled()) {
        this.ctx.clearRect(0, 0, this.width, this.height);
        return;
      }
      if (this.reducedMotion() && !this.covered) this.drawStaticFrame();
    }

    /** Reads the accent colour and the heart opacity range; rebuilds the sprite and the alphas when they changed. */
    readTheme() {
      const style = root.getComputedStyle(root.document.documentElement);
      const rgb = hexToRgb(style.getPropertyValue("--c-accent"));
      const low = parseFloat(style.getPropertyValue("--heart-alpha-min")) || FALLBACK_ALPHA[0];
      const high = parseFloat(style.getPropertyValue("--heart-alpha-max")) || FALLBACK_ALPHA[1];
      const changed = !this.sprite || rgb.join() !== this.theme.rgb.join() || low !== this.theme.alpha[0] || high !== this.theme.alpha[1];
      this.theme = { rgb: rgb, alpha: [low, high] };
      if (!changed) return;
      this.sprite = this.buildSprite(rgb);
      this.hearts.forEach((heart) => { heart.alpha = between(this.theme.alpha, Math.random); });
    }

    buildSprite(rgb) {
      const sprite = root.document.createElement("canvas");
      sprite.width = SPRITE_PX;
      sprite.height = SPRITE_PX;
      const ctx = sprite.getContext("2d");
      ctx.scale(SPRITE_PX / HEART_VIEWBOX_PX, SPRITE_PX / HEART_VIEWBOX_PX);
      ctx.fillStyle = "rgb(" + rgb.join(",") + ")";
      ctx.fill(new root.Path2D(HEART_PATH));
      return sprite;
    }

    newHeart(random, anywhere) {
      const size = between(SIZE_RANGE, random);
      return {
        x: random() * this.width, y: anywhere ? random() * this.height : this.height + size,
        size: size, speed: between(SPEED_RANGE, random), swayAmp: between(SWAY_AMP_RANGE, random),
        swayPeriod: between(SWAY_PERIOD_RANGE, random), t: random() * SWAY_PERIOD_RANGE[1], alpha: between(this.theme.alpha, random)
      };
    }

    ensureHearts() {
      const count = PetalCanvas.heartCount(this.width);
      this.hearts = [];
      for (let i = 0; i < count; i += 1) this.hearts.push(this.newHeart(Math.random, true));
    }

    drawHeart(x, y, size, tiltRad, alpha) {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.rotate(tiltRad);
      ctx.drawImage(this.sprite, -size / 2, -size / 2, size, size);
      ctx.restore();
    }

    drawSwaying(heart) {
      const phase = Math.sin((2 * Math.PI * heart.t) / heart.swayPeriod);
      this.drawHeart(heart.x + heart.swayAmp * phase, heart.y, heart.size, (TILT_DEG * phase * Math.PI) / 180, heart.alpha);
    }

    /** One frame of STATIC_COUNT hearts from a fixed seed (reduced motion). */
    drawStaticFrame() {
      this.readTheme();
      const random = seededRandom(STATIC_SEED);
      this.ctx.clearRect(0, 0, this.width, this.height);
      for (let i = 0; i < STATIC_COUNT; i += 1) {
        const heart = this.newHeart(random, true);
        this.drawHeart(heart.x, heart.y, heart.size, 0, heart.alpha);
      }
    }

    drawHearts(dt) {
      if (this.hearts.length === 0) this.ensureHearts();
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.hearts.forEach((heart, index) => {
        if (PetalCanvas.stepHeart(heart, dt, { width: this.width, height: this.height })) {
          this.hearts[index] = this.newHeart(Math.random, false);
        }
        this.drawSwaying(this.hearts[index]);
      });
    }

    drawBurst(now) {
      const ctx = this.burstCtx;
      ctx.clearRect(0, 0, this.width, this.height);
      const progress = (now - this.burstStart) / this.burstDuration;
      if (progress >= 1) {
        this.particles = [];
        return;
      }
      const eased = 1 - Math.pow(1 - progress, 2);
      this.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = (1 - progress) * BURST_ALPHA;
        ctx.translate(p.x + Math.cos(p.angle) * p.dist * eased, p.y + Math.sin(p.angle) * p.dist * eased - BURST_RISE_PX * progress);
        ctx.rotate(p.tilt + progress * Math.PI);
        ctx.drawImage(this.sprite, -p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
    }

    frame(now) {
      this.frameId = 0;
      const dt = Math.min(now - this.lastTime, MAX_DT_MS);
      this.lastTime = now;
      this.frames += 1;
      if (this.frames % THEME_CHECK_EVERY_FRAMES === 0) {
        this.covered = this.isCovered();
        this.readTheme();
      }
      if (!PetalCanvas.shouldAnimate(this.state())) {
        this.update();
        return;
      }
      if (this.enabled() && !this.covered) this.drawHearts(dt);
      if (this.bursting()) this.drawBurst(now);
      this.frameId = root.requestAnimationFrame((next) => this.frame(next));
    }

    /** One-off celebration: hearts radiate from (x, y) for durationMs. No-op under reduced motion. */
    burst(x, y, durationMs, count) {
      if (this.reducedMotion()) return;
      if (!this.sprite) this.readTheme();
      const total = count || BURST_COUNT;
      this.burstDuration = durationMs || BURST_DEFAULT_MS;
      this.burstStart = root.performance.now();
      this.particles = [];
      for (let i = 0; i < total; i += 1) {
        this.particles.push({
          x: x, y: y, angle: (i / total) * Math.PI * 2 + Math.random() * 0.3,
          dist: between([BURST_DIST_MIN_PX, BURST_DIST_MAX_PX], Math.random), size: between(SIZE_RANGE, Math.random),
          tilt: ((Math.random() * 2 - 1) * TILT_DEG * Math.PI) / 180
        });
      }
      this.update();
    }
  }

  /** @param {number} viewportWidth @returns {number} hearts on screen: 12 on phones, 16 from 768 px */
  PetalCanvas.heartCount = (viewportWidth) => (viewportWidth >= WIDE_MIN_WIDTH_PX ? WIDE_COUNT : PHONE_COUNT);

  /** @param {{hidden: boolean, reducedMotion: boolean, enabled: boolean, covered: boolean, bursting: boolean}} s */
  PetalCanvas.shouldAnimate = (s) => {
    if (s.hidden || s.reducedMotion) return false;
    return s.bursting ? true : s.enabled && !s.covered;
  };

  /**
   * Moves a heart up and advances its sway clock.
   * @returns {boolean} true when the heart has fully left the top, so the caller respawns it below the bottom edge
   */
  PetalCanvas.stepHeart = (heart, dtMs) => {
    heart.y -= (heart.speed * dtMs) / 1000;
    heart.t += dtMs;
    return heart.y < -heart.size;
  };

  PetalCanvas.hexToRgb = hexToRgb;
  root.PetalCanvas = PetalCanvas;
})(typeof window !== "undefined" ? window : this);
