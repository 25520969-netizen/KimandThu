/**
 * Pure HTML templates for the Moments screen (spec 4.1). Everything user-supplied goes through escapeHtml and
 * safeUrl. Depends on: escapeHtml, safeUrl, resizeDriveThumbnail, icon, formatDayMonth, formatMonthLabel.
 */
(function (root) {
  "use strict";

  const IMAGE_URL_OPTIONS = { allowRelative: true, allowDataImage: true };
  const FEED_THUMB_PX = 800;
  const GRID_THUMB_PX = 400;
  const OTD_THUMB_PX = 100;
  const MAP_COORDS_LABEL = "Toạ độ Google Maps";

  /** "2026-10-25T17:09" -> "25/10 · 17:09" (time omitted when absent). */
  function metaDate(dateStr) {
    const parts = String(dateStr || "").split("T");
    if (!parts[0]) return "";
    const day = root.formatDayMonth(parts[0]);
    const time = parts[1] ? parts[1].split(":").slice(0, 2).join(":") : "";
    return time.length === 5 ? day + " · " + time : day;
  }

  /** Plain-text place name: any map URL and its parentheses are removed. */
  function locationLabel(locationStr) {
    if (!locationStr) return "";
    const hasUrl = /https?:\/\/\S+/.test(locationStr);
    const label = String(locationStr).replace(/https?:\/\/[^\s)]+/g, "").replace(/[()]/g, "").trim();
    if (hasUrl && (!label || label === "-")) return MAP_COORDS_LABEL;
    return label;
  }

  const STATUS_ICON_PX = 14;
  const FAILED_ART_PX = 48;
  const OTD_DISPLAY_PX = 48;

  function pendingStatusHtml() {
    return root.icon("cloud-pending", { size: STATUS_ICON_PX }) + "Chưa đồng bộ";
  }

  /** "25/10 · 17:09 · Place" (plain text, escaped). */
  function metaTextHtml(mem) {
    const place = locationLabel(mem.location);
    const parts = [root.escapeHtml(metaDate(mem.date))];
    if (place) parts.push(root.escapeHtml(place));
    return parts.join(" · ");
  }

  function metaRowHtml(mem, extraClasses) {
    return '<p class="memory__meta t-meta' + (extraClasses || "") + '">' + metaTextHtml(mem) + "</p>";
  }

  function titleHtml(mem) {
    return '<h3 class="memory__title t-title clamp-2">' + root.escapeHtml(mem.title) + "</h3>";
  }

  function openButtonOpen(mem) {
    return '<button type="button" class="memory__open" aria-label="' + root.escapeHtml(mem.title) + '">';
  }

  function quoteHtml(mem) {
    return mem.story ? '<p class="memory__quote hand clamp-3">“' + root.escapeHtml(mem.story) + "”</p>" : "";
  }

  /** A moment without a photo: title, meta (with the inline pending status) and the story. */
  function memoryTextCardHtml(mem) {
    const pending = mem.syncState === "pending" ? ' <span class="status status--warn">' + pendingStatusHtml() + "</span>" : "";
    return '<article class="memory memory--text" data-id="' + root.escapeHtml(mem.id) + '">' + openButtonOpen(mem) +
      titleHtml(mem) + '<p class="memory__meta t-meta muted">' + metaTextHtml(mem) + pending + "</p>" + quoteHtml(mem) +
      "</button></article>";
  }

  /** A photo that failed to load: the pink heart box, the title and a retry button outside the open button. */
  function memoryFailedCardHtml(mem) {
    return '<article class="memory memory--failed" data-id="' + root.escapeHtml(mem.id) + '">' + openButtonOpen(mem) +
      '<div class="memory__photo memory__photo--failed">' + root.icon("heart", { size: FAILED_ART_PX }) + "</div>" +
      '<div class="memory__overlay memory__overlay--plain">' + titleHtml(mem) + metaRowHtml(mem, " muted") + "</div></button>" +
      '<button type="button" class="btn btn--text memory__retry" data-id="' + root.escapeHtml(mem.id) +
      '">Ảnh chưa tải được · Thử lại</button></article>';
  }

  /** @param {{couple: boolean}} opts */
  function memoryBlockHtml(mem, opts) {
    const image = root.safeUrl(mem.image, IMAGE_URL_OPTIONS);
    if (!image) return memoryTextCardHtml(mem);
    const src = root.resizeDriveThumbnail(image, FEED_THUMB_PX);
    const badge = mem.syncState === "pending" ? '<span class="memory__badge status status--warn">' + pendingStatusHtml() + "</span>" : "";
    return '<article class="memory memory--photo" data-id="' + root.escapeHtml(mem.id) + '">' + openButtonOpen(mem) +
      '<div class="memory__photo skeleton"><img class="memory__img" src="' + root.escapeHtml(src) + '" alt="' +
      root.escapeHtml(mem.title) + '" width="800" height="1000" loading="lazy" decoding="async" data-fallback-src="' +
      root.escapeHtml(image) + '"></div>' +
      '<div class="memory__overlay">' + titleHtml(mem) + metaRowHtml(mem) + "</div>" + badge + "</button></article>";
  }

  function gridTileHtml(mem) {
    const image = root.safeUrl(mem.image, IMAGE_URL_OPTIONS);
    const label = root.escapeHtml(mem.title);
    const inner = image
      ? '<img src="' + root.escapeHtml(root.resizeDriveThumbnail(image, GRID_THUMB_PX)) + '" alt="" width="400" height="400" loading="lazy" decoding="async" data-fallback-src="' + root.escapeHtml(image) + '">'
      : '<span class="tile__text clamp-3">' + label + "</span>";
    return '<button type="button" class="tile" data-id="' + root.escapeHtml(mem.id) + '" aria-label="' + label + '">' + inner + "</button>";
  }

  function monthLabelHtml(yearMonth) {
    return '<h2 class="month-label t-headline">' + root.escapeHtml(root.formatMonthLabel(yearMonth)) + "</h2>";
  }

  /** @param {{memory: object, yearsAgo: number}} hit */
  function onThisDayHtml(hit) {
    const mem = hit.memory;
    const image = root.safeUrl(mem.image, IMAGE_URL_OPTIONS);
    const thumb = image
      ? '<img class="otd-row__thumb" src="' + root.escapeHtml(root.resizeDriveThumbnail(image, OTD_THUMB_PX)) + '" alt="" width="' + OTD_DISPLAY_PX + '" height="' + OTD_DISPLAY_PX + '">'
      : '<span class="otd-row__thumb" aria-hidden="true"></span>';
    const place = locationLabel(mem.location);
    const sub = hit.yearsAgo + " năm trước" + (place ? " · " + place : "");
    return '<button type="button" class="otd-row" data-id="' + root.escapeHtml(mem.id) + '">' + thumb +
      '<span class="otd-row__text"><span class="t-headline">Ngày này năm xưa</span><span class="t-meta muted">' +
      root.escapeHtml(sub) + "</span></span>" + root.icon("chevron-right") + "</button>";
  }

  /** The detail sheet's photo: a button that opens the lightbox; "" when the photo URL is empty or unsafe. */
  function detailPhotoHtml(mem) {
    const image = root.safeUrl(mem.image, IMAGE_URL_OPTIONS);
    if (!image) return "";
    return '<button type="button" class="detail__photo" aria-label="Phóng to ảnh"><img src="' + root.escapeHtml(image) +
      '" alt="' + root.escapeHtml(mem.title) + '"></button>';
  }

  /** Shown when the detail photo fails to load. It must not carry the class detail__photo (that opens the lightbox). */
  function detailPhotoFailedHtml() {
    return '<div class="detail__failed">' + root.icon("heart", { size: FAILED_ART_PX }) +
      '<button type="button" class="btn btn--secondary detail__retry">Ảnh chưa tải được · Thử lại</button></div>';
  }

  function memorySkeletonHtml() {
    return '<div class="memory-skeleton skeleton skeleton--photo" aria-hidden="true"></div>';
  }

  /** Maps/TikTok/places helpers below build the Places rows (spec 4.4). */
  function placeActionLabel(label) {
    return '<span class="btn__label">' + root.escapeHtml(label) + "</span>";
  }

  function placeActionButton(cls, iconName, label, extra) {
    return '<button type="button" class="btn ' + cls + '" aria-label="' + root.escapeHtml(label) + '"' + (extra || "") + ">" +
      root.icon(iconName, { size: 18 }) + placeActionLabel(label) + "</button>";
  }

  function placeLinkAction(cls, href, iconName, label) {
    return '<a class="btn ' + cls + '" href="' + root.escapeHtml(href) + '" target="_blank" rel="noopener noreferrer" aria-label="' +
      root.escapeHtml(label) + '">' + root.icon(iconName, { size: 18 }) + placeActionLabel(label) + "</a>";
  }

  function placeVisitedLine(place, linkedMemoryId) {
    if (!place.visited) return "";
    const when = place.updatedAt ? " · " + root.formatDateVi(new Date(place.updatedAt)) : "";
    const memory = linkedMemoryId
      ? '<button type="button" class="btn btn--text place__memory" data-memory-id="' + root.escapeHtml(linkedMemoryId) + '">Xem khoảnh khắc ›</button>'
      : "";
    return '<p class="t-meta muted">Đã đến' + when + "</p>" + memory;
  }

  /**
   * @param {object} place
   * @param {{couple: boolean, distance?: {km: number, approx: boolean}, distanceIsNew?: boolean,
   *   linkedMemoryId?: string, mapsUrl: string}} opts
   */
  function placeRowHtml(place, opts) {
    const id = root.escapeHtml(place.id);
    const mapsUrl = root.safeUrl(opts.mapsUrl);
    const tiktokUrl = root.safeUrl(place.tiktokUrl);
    const check = place.visited ? '<span class="status status--success">' + root.icon("check", { size: 18 }) + "</span>" : "";
    const distance = opts.distance
      ? '<span class="place__distance' + (opts.distanceIsNew ? " is-new" : "") + '">' +
        root.escapeHtml(root.formatDistanceVi(opts.distance.km, { approx: opts.distance.approx })) + "</span>"
      : "";
    const pending = place.syncState === "pending"
      ? '<p class="t-meta status status--warn">' + root.icon("cloud-pending", { size: 14 }) + "Chưa đồng bộ</p>" : "";
    const actions = [];
    if (mapsUrl) actions.push(placeLinkAction("btn--soft", mapsUrl, "navigation", "Chỉ đường"));
    if (tiktokUrl) actions.push(placeLinkAction("btn--secondary", tiktokUrl, "tiktok", "TikTok"));
    if (opts.couple && !place.visited) actions.push(placeActionButton("btn--secondary place__visit", "check", "Đã đi"));
    if (opts.couple) {
      actions.push('<button type="button" class="icon-btn place__more" aria-label="Thêm thao tác">' + root.icon("more") + "</button>");
    }
    return '<article class="place' + (place.visited ? " is-visited" : "") + '" role="listitem" data-id="' + id + '">' +
      '<div class="place__head"><h3 class="place__title clamp-2">' + check + root.escapeHtml(place.name) + "</h3>" + distance + "</div>" +
      (place.notes ? '<p class="place__notes clamp-2 muted">' + root.escapeHtml(place.notes) + "</p>" : "") +
      pending + placeVisitedLine(place, opts.linkedMemoryId) +
      '<div class="place__actions">' + actions.join("") + "</div></article>";
  }

  function placeSkeletonHtml() {
    return '<div class="skeleton skeleton--row" aria-hidden="true"></div>';
  }

  root.placeRowHtml = placeRowHtml;
  root.placeSkeletonHtml = placeSkeletonHtml;
  root.locationLabel = locationLabel;
  root.memoryBlockHtml = memoryBlockHtml;
  root.memoryTextCardHtml = memoryTextCardHtml;
  root.memoryFailedCardHtml = memoryFailedCardHtml;
  root.gridTileHtml = gridTileHtml;
  root.monthLabelHtml = monthLabelHtml;
  root.onThisDayHtml = onThisDayHtml;
  root.memorySkeletonHtml = memorySkeletonHtml;
  root.detailPhotoHtml = detailPhotoHtml;
  root.detailPhotoFailedHtml = detailPhotoFailedHtml;
})(typeof window !== "undefined" ? window : this);
