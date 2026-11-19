// Pure HTML templates for the Moments screen.

const TPL_MEM = {
  id: "m1", title: "Quán <b>cà phê</b>", story: 'Nắng "đẹp"', date: "2026-10-25T17:09",
  location: "Quán (https://maps.google.com/?q=1,2)", image: "https://drive.google.com/thumbnail?id=abc&sz=w1000"
};

test("templates: title and story are escaped; the photo card shows the story below the photo", () => {
  const html = memoryBlockHtml(TPL_MEM, { couple: true });
  assertEqual(html.indexOf("<b>"), -1);
  assertTrue(html.indexOf("&lt;b&gt;") !== -1, "title escaped");
  assertTrue(html.indexOf('<p class="memory__quote hand clamp-2">“Nắng &quot;đẹp&quot;”</p>') !== -1, "photo card story");
  const text = memoryTextCardHtml(TPL_MEM);
  assertEqual(text.indexOf("<b>"), -1);
  assertTrue(text.indexOf("&quot;đẹp&quot;") !== -1, "story quotes escaped");
  assertTrue(text.indexOf("memory__quote hand clamp-3") !== -1, "text card clamp-3");
});

test("templates: no <button> nested inside .memory__open", () => {
  [memoryBlockHtml(TPL_MEM, { couple: true }), memoryTextCardHtml(TPL_MEM), memoryFailedCardHtml(TPL_MEM)].forEach((html) => {
    const open = html.match(/<button[^>]*memory__open[\s\S]*?<\/button>/)[0];
    assertEqual((open.match(/<button/g) || []).length, 1);
  });
});

test("templates: memory without a photo renders a text card; a failed photo renders the heart card with its retry outside the open button", () => {
  const html = memoryBlockHtml(Object.assign({}, TPL_MEM, { image: "" }), { couple: true });
  assertTrue(html.indexOf("memory--text") !== -1);
  const failed = memoryFailedCardHtml(TPL_MEM);
  assertTrue(failed.indexOf("memory--failed") !== -1);
  assertTrue(failed.indexOf("Thử lại") !== -1);
  assertTrue(failed.indexOf("</button><button") !== -1, "retry follows the open button");
  assertTrue(failed.indexOf("M12 20s-8-4.9-8-11") !== -1, "heart path");
});

test("templates: photo has size attributes, alt text and the pending state", () => {
  const html = memoryBlockHtml(Object.assign({}, TPL_MEM, { syncState: "pending" }), { couple: true });
  assertTrue(html.indexOf('width="800" height="1000"') !== -1);
  assertTrue(html.indexOf('alt="Quán &lt;b&gt;cà phê&lt;/b&gt;"') !== -1);
  assertTrue(html.indexOf("Chưa đồng bộ") !== -1);
  assertTrue(html.indexOf("25/10 · 17:09") !== -1);
  assertEqual(html.indexOf("memory__overlay"), -1, "no overlay");
  assertTrue(html.indexOf("memory__body") > html.indexOf("memory__photo"), "body after the photo");
  const body = html.slice(html.indexOf("memory__body"), html.indexOf("memory__badge"));
  assertTrue(body.indexOf("memory__title") !== -1, "title in body");
  assertTrue(body.indexOf("memory__meta t-meta muted") !== -1, "meta in body");
  assertTrue(body.indexOf("25/10 · 17:09") !== -1, "date in body");
  assertTrue(html.indexOf("memory__badge") !== -1, "pending badge");
});

test("templates: a moment without a story shows no quote in any card", () => {
  const mem = Object.assign({}, TPL_MEM, { story: "" });
  [memoryBlockHtml(mem, { couple: true }), memoryFailedCardHtml(mem), memoryTextCardHtml(mem)].forEach((html) => {
    assertEqual(html.indexOf("memory__quote"), -1);
    assertEqual(html.indexOf("“"), -1);
  });
});

test("templates: the failed card shows title, meta and story below the heart", () => {
  const html = memoryFailedCardHtml(TPL_MEM);
  assertTrue(html.indexOf("memory__body") > html.indexOf("memory__photo--failed"), "body after the heart");
  assertTrue(html.indexOf("memory__quote hand clamp-2") !== -1, "story");
  assertEqual(html.indexOf("memory__overlay"), -1);
});

test("templates: the open button is named by the title only", () => {
  const html = memoryBlockHtml(TPL_MEM, { couple: true });
  const label = html.match(/<button[^>]*memory__open" aria-label="([^"]*)"/)[1];
  assertEqual(label, "Quán &lt;b&gt;cà phê&lt;/b&gt;");
  assertEqual(label.indexOf("Nắng"), -1);
});

test("templates: the moment skeleton is a box with a photo block and two bars", () => {
  const html = memorySkeletonHtml();
  assertTrue(html.indexOf('<div class="memory-skeleton" aria-hidden="true">') === 0, "outer box");
  assertEqual(html.split("memory-skeleton__photo").length - 1, 1);
  assertEqual(html.split("memory-skeleton__bar ").length - 1, 2);
  assertTrue(html.indexOf("memory-skeleton__bar--title") !== -1 && html.indexOf("memory-skeleton__bar--meta") !== -1);
});

test("templates: locationLabel strips map urls", () => {
  assertEqual(locationLabel("Quán (https://maps.google.com/?q=1,2)"), "Quán");
  assertEqual(locationLabel("https://maps.google.com/?q=1,2"), "Toạ độ Google Maps");
  assertEqual(locationLabel(""), "");
});

test("templates: grid tile, month label and on-this-day row", () => {
  assertTrue(gridTileHtml(TPL_MEM).indexOf('class="tile"') !== -1);
  assertTrue(gridTileHtml(Object.assign({}, TPL_MEM, { image: "" })).indexOf("tile__text") !== -1);
  assertEqual(monthLabelHtml("2026-10"), '<h2 class="month-label t-headline">Tháng 10, 2026</h2>');
  const row = onThisDayHtml({ memory: TPL_MEM, yearsAgo: 1 });
  assertTrue(row.indexOf("Ngày này năm xưa") !== -1 && row.indexOf("1 năm trước · Quán") !== -1);
});

test("templates: no emoji in markup built from emoji-free fixtures", () => {
  const all = memoryBlockHtml(TPL_MEM, { couple: true }) + memoryTextCardHtml(TPL_MEM) + memoryFailedCardHtml(TPL_MEM) +
    gridTileHtml(TPL_MEM) + monthLabelHtml("2026-10") + onThisDayHtml({ memory: TPL_MEM, yearsAgo: 2 }) + memorySkeletonHtml();
  assertEqual(/\p{Extended_Pictographic}/u.test(all), false);
});

const TPL_PLACE = { id: "p1", name: 'Quán "A" <b>', notes: "Ngon", visited: false, tiktokUrl: "https://www.tiktok.com/@x/video/1" };
const TPL_PLACE_OPTS = { couple: true, mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=1,2" };

test("placeRowHtml: TikTok link only for a safe url", () => {
  assertTrue(placeRowHtml(TPL_PLACE, TPL_PLACE_OPTS).indexOf("tiktok.com") !== -1);
  assertEqual(placeRowHtml(Object.assign({}, TPL_PLACE, { tiktokUrl: "" }), TPL_PLACE_OPTS).indexOf("TikTok"), -1);
  const bad = placeRowHtml(Object.assign({}, TPL_PLACE, { tiktokUrl: "javascript:alert(1)" }), TPL_PLACE_OPTS);
  assertEqual(bad.indexOf("javascript:"), -1);
  assertEqual(bad.indexOf("TikTok"), -1);
});

test("placeRowHtml: escapes the name, guests get no visit/more buttons, no x button", () => {
  const html = placeRowHtml(TPL_PLACE, TPL_PLACE_OPTS);
  assertEqual(html.indexOf("<b>"), -1);
  assertTrue(html.indexOf("&quot;A&quot;") !== -1);
  const guest = placeRowHtml(TPL_PLACE, Object.assign({}, TPL_PLACE_OPTS, { couple: false }));
  assertEqual(guest.indexOf("place__visit"), -1);
  assertEqual(guest.indexOf("place__more"), -1);
  assertEqual(/&times;|×/.test(html), false);
});

test("placeRowHtml: distance, approx, is-new; TikTok and Đã đi have aria-label and a label span", () => {
  const approx = placeRowHtml(TPL_PLACE, Object.assign({}, TPL_PLACE_OPTS, { distance: { km: 3.2, approx: true }, distanceIsNew: true }));
  assertTrue(approx.indexOf("≈ 3,2 km") !== -1);
  assertTrue(approx.indexOf("place__distance is-new") !== -1);
  const row = placeRowHtml(TPL_PLACE, TPL_PLACE_OPTS);
  assertTrue(row.indexOf('aria-label="TikTok"') !== -1 && row.indexOf('aria-label="Đã đi"') !== -1);
  assertTrue(row.indexOf('<span class="btn__label">TikTok</span>') !== -1 && row.indexOf('<span class="btn__label">Đã đi</span>') !== -1);
});

test("placeSkeletonHtml: one skeleton row", () => {
  assertTrue(placeSkeletonHtml().indexOf("skeleton--row") !== -1);
});

test("placeRowHtml: visited rows show the date from updatedAt, or just \"Đã đến\"", () => {
  const visited = Object.assign({}, TPL_PLACE, { visited: true, updatedAt: new Date(2026, 9, 12).getTime() });
  assertTrue(placeRowHtml(visited, TPL_PLACE_OPTS).indexOf("Đã đến · 12/10/2026") !== -1);
  const noDate = placeRowHtml(Object.assign({}, TPL_PLACE, { visited: true }), TPL_PLACE_OPTS);
  assertTrue(noDate.indexOf(">Đã đến<") !== -1 && noDate.indexOf("Đã đến ·") === -1);
});

test("detailPhotoHtml: a safe photo opens the lightbox; an unsafe or empty one renders nothing", () => {
  const html = detailPhotoHtml(TPL_MEM);
  assertTrue(html.indexOf('class="detail__photo"') !== -1);
  assertTrue(html.indexOf('aria-label="Phóng to ảnh"') !== -1);
  assertTrue(html.indexOf('alt="Quán &lt;b&gt;cà phê&lt;/b&gt;"') !== -1, "title escaped in alt");
  assertEqual(html.indexOf("<b>"), -1);
  assertEqual(detailPhotoHtml(Object.assign({}, TPL_MEM, { image: "" })), "");
  assertEqual(detailPhotoHtml(Object.assign({}, TPL_MEM, { image: "javascript:alert(1)" })), "");
});

test("detailPhotoFailedHtml: heart box with a retry button that cannot open the lightbox", () => {
  const html = detailPhotoFailedHtml();
  ["detail__failed", "detail__retry", "Thử lại", "M12 20s-8-4.9-8-11"].forEach((needle) => assertTrue(html.indexOf(needle) !== -1, needle));
  assertEqual(html.indexOf("detail__photo"), -1);
});
