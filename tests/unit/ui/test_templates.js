// Pure HTML templates for the Moments screen.

const TPL_MEM = {
  id: "m1", title: "Quán <b>cà phê</b>", story: 'Nắng "đẹp"', date: "2026-10-25T17:09",
  location: "Quán (https://maps.google.com/?q=1,2)", image: "https://drive.google.com/thumbnail?id=abc&sz=w1000"
};

test("templates: title and story are escaped", () => {
  const html = memoryBlockHtml(TPL_MEM, { couple: true });
  assertEqual(html.indexOf("<b>"), -1);
  assertTrue(html.indexOf("&lt;b&gt;") !== -1, "title escaped");
  assertTrue(html.indexOf("&quot;đẹp&quot;") !== -1, "story quotes escaped");
});

test("templates: no <button> nested inside .memory__open", () => {
  [memoryBlockHtml(TPL_MEM, { couple: true }), memoryTextCardHtml(TPL_MEM, { retry: true })].forEach((html) => {
    const open = html.match(/<button[^>]*memory__open[\s\S]*?<\/button>/)[0];
    assertEqual((open.match(/<button/g) || []).length, 1);
  });
});

test("templates: memory without a photo renders a text card; retry sits outside the open button", () => {
  const html = memoryBlockHtml(Object.assign({}, TPL_MEM, { image: "" }), { couple: true });
  assertTrue(html.indexOf("memory--text") !== -1);
  const retry = memoryTextCardHtml(TPL_MEM, { retry: true });
  assertTrue(retry.indexOf("Thử lại") !== -1);
  assertTrue(retry.indexOf("</button><button") !== -1, "retry follows the open button");
});

test("templates: photo has size attributes, alt text and the pending state", () => {
  const html = memoryBlockHtml(Object.assign({}, TPL_MEM, { syncState: "pending" }), { couple: true });
  assertTrue(html.indexOf('width="800" height="1000"') !== -1);
  assertTrue(html.indexOf('alt="Quán &lt;b&gt;cà phê&lt;/b&gt;"') !== -1);
  assertTrue(html.indexOf("Chưa đồng bộ") !== -1);
  assertTrue(html.indexOf("25/10 · 17:09") !== -1);
});

test("templates: locationLabel strips map urls", () => {
  assertEqual(locationLabel("Quán (https://maps.google.com/?q=1,2)"), "Quán");
  assertEqual(locationLabel("https://maps.google.com/?q=1,2"), "Toạ độ Google Maps");
  assertEqual(locationLabel(""), "");
});

test("templates: grid tile, month label and on-this-day row", () => {
  assertTrue(gridTileHtml(TPL_MEM).indexOf('class="tile"') !== -1);
  assertTrue(gridTileHtml(Object.assign({}, TPL_MEM, { image: "" })).indexOf("tile__text") !== -1);
  assertEqual(monthLabelHtml("2026-10"), '<h2 class="month-label t-meta">Tháng 10, 2026</h2>');
  const row = onThisDayHtml({ memory: TPL_MEM, yearsAgo: 1 });
  assertTrue(row.indexOf("Ngày này năm xưa") !== -1 && row.indexOf("1 năm trước · Quán") !== -1);
});

test("templates: no emoji in markup built from emoji-free fixtures", () => {
  const all = memoryBlockHtml(TPL_MEM, { couple: true }) + memoryTextCardHtml(TPL_MEM, { retry: true }) +
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

test("chatSkeletonHtml: three bubble skeletons", () => {
  assertEqual((chatSkeletonHtml().match(/skeleton--bubble/g) || []).length, 3);
});

test("placeRowHtml: visited rows show the date from updatedAt, or just \"Đã đến\"", () => {
  const visited = Object.assign({}, TPL_PLACE, { visited: true, updatedAt: new Date(2026, 9, 12).getTime() });
  assertTrue(placeRowHtml(visited, TPL_PLACE_OPTS).indexOf("Đã đến · 12/10/2026") !== -1);
  const noDate = placeRowHtml(Object.assign({}, TPL_PLACE, { visited: true }), TPL_PLACE_OPTS);
  assertTrue(noDate.indexOf(">Đã đến<") !== -1 && noDate.indexOf("Đã đến ·") === -1);
});
