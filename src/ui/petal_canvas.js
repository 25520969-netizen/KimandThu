/**
 * Petal canvas (spec 2.3): the only ambient motion is a few petals drifting around the hero, plus a short
 * celebration burst. The frame loop runs only while the hero is on screen, the tab is visible, nothing covers
 * the page, petals are enabled and reduced motion is off. When any condition fails the loop is cancelled.
 */
(function (root) {
  "use strict";

  const DEFAULT_COUNT = 6;
  const MAX_COUNT = 8;
  const BURST_COUNT = 24;
  const BURST_DEFAULT_MS = 1200;
  const DPR_CAP = 2;
  const COVER_CHECK_EVERY_FRAMES = 15;
  const OPACITY_MIN = 0.35;
  const OPACITY_RANGE = 0.2;
  const FALLBACK_RGB = [232, 93, 117];

  /** @param {string} hex "#RRGGBB" @returns {number[]} [r, g, b] */
  function hexToRgb(hex) {
    const match = /^#([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!match) return FALLBACK_RGB.slice();
    const n = parseInt(match[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  class PetalCanvas {
    /** @param {{canvas: HTMLCanvasElement, hero: Element, count?: number, enabled?: () => boolean}} options */
    constructor(options) {
      this.canvas = options.canvas;
      this.hero = options.hero;
      this.count = Math.min(options.count || DEFAULT_COUNT, MAX_COUNT);
      this.enabled = options.enabled || (() => true);
      this.ctx = this.canvas.getContext("2d");
      this.petals = [];
      this.burstParticles = [];
      this.burstUntil = 0;
      this.heroVisible = false;
      this.covered = false;
      this.frameId = 0;
      this.frames = 0;
      this.rgb = FALLBACK_RGB.slice();
    }

    reducedMotion() {
      return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }

    start() {
      this.fit();
      root.addEventListener("resize", () => this.fit());
      root.document.addEventListener("visibilitychange", () => this.update());
      root.document.addEventListener("close", () => this.update(), true);
      new MutationObserver(() => this.update()).observe(root.document.body, { attributes: true, attributeFilter: ["class"] });
      if (typeof IntersectionObserver !== "undefined" && this.hero) {
        new IntersectionObserver((entries) => {
          this.heroVisible = entries[0].isIntersecting;
          this.update();
        }).observe(this.hero);
      }
    }

    stop() {
      root.cancelAnimationFrame(this.frameId);
      this.frameId = 0;
      this.clear();
    }

    fit() {
      const dpr = Math.min(root.devicePixelRatio || 1, DPR_CAP);
      this.width = root.innerWidth;
      this.height = root.innerHeight;
      this.canvas.width = Math.round(this.width * dpr);
      this.canvas.height = Math.round(this.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    clear() {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }

    isCovered() {
      return root.document.body.classList.contains("chat-open") || !!root.document.querySelector("dialog[open]");
    }

    burstActive() {
      return Date.now() < this.burstUntil;
    }

    shouldRun() {
      if (root.document.hidden || this.reducedMotion()) return false;
      if (this.burstActive()) return true;
      return this.heroVisible && this.enabled() && !this.isCovered();
    }

    /** Starts or cancels the frame loop to match shouldRun(). */
    update() {
      this.covered = this.isCovered();
      if (this.shouldRun()) {
        if (!this.frameId) {
          this.rgb = hexToRgb(root.getComputedStyle(root.document.documentElement).getPropertyValue("--c-accent"));
          this.frameId = root.requestAnimationFrame(() => this.frame());
        }
      } else if (this.frameId) {
        this.stop();
      }
    }

    spawnPetals(box) {
      this.petals = [];
      for (let i = 0; i < this.count; i += 1) {
        this.petals.push({
          x: Math.random() * box.width, y: Math.random() * box.height,
          size: Math.random() * 6 + 5, vx: Math.random() * 0.6 - 0.2, vy: Math.random() * 0.4 + 0.25,
          rotation: Math.random() * 360, spin: Math.random() * 0.8 - 0.4,
          opacity: OPACITY_MIN + Math.random() * OPACITY_RANGE
        });
      }
    }

    drawPetal(x, y, size, rotation, opacity) {
      const ctx = this.ctx;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.fillStyle = "rgba(" + this.rgb.join(",") + "," + opacity + ")";
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawDrift() {
      if (!this.heroVisible || !this.enabled() || this.covered) return;
      const box = this.hero.getBoundingClientRect();
      if (this.petals.length === 0) this.spawnPetals(box);
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(box.left, box.top, box.width, box.height);
      this.ctx.clip();
      this.petals.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.rotation += p.spin;
        if (p.y > box.height + 20) { p.y = -20; p.x = Math.random() * box.width; }
        if (p.x > box.width + 20) p.x = -20;
        if (p.x < -20) p.x = box.width + 20;
        this.drawPetal(box.left + p.x, box.top + p.y, p.size, p.rotation, p.opacity);
      });
      this.ctx.restore();
    }

    drawBurst() {
      if (!this.burstActive()) { this.burstParticles = []; return; }
      const progress = 1 - (this.burstUntil - Date.now()) / this.burstDuration;
      this.burstParticles.forEach((p) => {
        const dist = p.speed * progress * this.burstDuration / 16;
        this.drawPetal(p.x + Math.cos(p.angle) * dist, p.y + Math.sin(p.angle) * dist - 30 * progress,
          p.size, p.rotation + progress * 180, (1 - progress) * 0.9);
      });
    }

    frame() {
      this.frames += 1;
      if (this.frames % COVER_CHECK_EVERY_FRAMES === 0) this.covered = this.isCovered();
      this.frameId = 0;
      if (!this.shouldRun()) { this.clear(); return; }
      this.clear();
      this.drawDrift();
      this.drawBurst();
      this.frameId = root.requestAnimationFrame(() => this.frame());
    }

    /** One-off celebration: petals radiate from (x, y) for durationMs. No-op under reduced motion. */
    burst(x, y, durationMs) {
      if (this.reducedMotion()) return;
      this.burstDuration = durationMs || BURST_DEFAULT_MS;
      this.burstUntil = Date.now() + this.burstDuration;
      this.burstParticles = [];
      for (let i = 0; i < BURST_COUNT; i += 1) {
        this.burstParticles.push({
          x: x, y: y, angle: (i / BURST_COUNT) * Math.PI * 2 + Math.random() * 0.3,
          speed: 0.25 + Math.random() * 0.35, size: Math.random() * 5 + 5, rotation: Math.random() * 360
        });
      }
      this.update();
    }
  }

  PetalCanvas.hexToRgb = hexToRgb;
  root.PetalCanvas = PetalCanvas;
})(typeof window !== "undefined" ? window : this);
