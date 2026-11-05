// UI-13: smaller Drive thumbnails per view.

test("resizeDriveThumbnail: rewrites sz for Drive thumbnails", () => {
  const url = "https://drive.google.com/thumbnail?id=abc123&sz=w1200";
  assertEqual(resizeDriveThumbnail(url, 400), "https://drive.google.com/thumbnail?id=abc123&sz=w400");
  assertEqual(resizeDriveThumbnail(url, 800), "https://drive.google.com/thumbnail?id=abc123&sz=w800");
});

test("resizeDriveThumbnail: adds sz when missing", () => {
  assertEqual(resizeDriveThumbnail("https://drive.google.com/thumbnail?id=abc", 800), "https://drive.google.com/thumbnail?id=abc&sz=w800");
});

test("resizeDriveThumbnail: leaves other URLs untouched", () => {
  assertEqual(resizeDriveThumbnail("https://example.com/a.jpg?sz=w1200", 400), "https://example.com/a.jpg?sz=w1200");
  assertEqual(resizeDriveThumbnail("assets/images/memory3.jpg", 400), "assets/images/memory3.jpg");
  assertEqual(resizeDriveThumbnail(null, 400), null);
});

test("resizeDriveThumbnail: clamps absurd widths", () => {
  assertEqual(resizeDriveThumbnail("https://drive.google.com/thumbnail?id=a&sz=w1200", 99999), "https://drive.google.com/thumbnail?id=a&sz=w1600");
  assertEqual(resizeDriveThumbnail("https://drive.google.com/thumbnail?id=a&sz=w1200", "x"), "https://drive.google.com/thumbnail?id=a&sz=w800");
});
