import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:4323";
const paths = ["/", "/blog/", "/blog/reading-the-grip/", "/blog/reading-the-grip/cheat-sheet/"];

function findOverflowing(page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.right > vw + 1 || r.left < -1) {
        const s = getComputedStyle(el);
        offenders.push({
          tag: el.tagName.toLowerCase(),
          className: el.className?.toString?.().slice(0, 120) ?? "",
          right: Math.round(r.right),
          left: Math.round(r.left),
          width: Math.round(r.width),
          vw,
          position: s.position,
          widthCss: s.width,
          marginLeft: s.marginLeft,
          marginRight: s.marginRight,
        });
      }
    }
    offenders.sort((a, b) => b.right - a.right);
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: vw,
      hasOverflow: document.documentElement.scrollWidth > vw + 1,
      top: offenders.slice(0, 8),
    };
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

for (const path of paths) {
  await page.goto(new URL(path, base).href, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const result = await findOverflowing(page);
  console.log(`\n${path}`);
  console.log(JSON.stringify(result, null, 2));
}

await browser.close();
