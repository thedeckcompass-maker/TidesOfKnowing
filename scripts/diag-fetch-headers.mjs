import https from "node:https";

const url = process.argv[2] || "https://www.tidesofknowing.com/";

https
  .get(
    url,
    {
      headers: { "User-Agent": "TOK-diag/1.0" },
    },
    (res) => {
      console.log("URL:", url);
      console.log("status:", res.statusCode);
      console.log("cache-control:", res.headers["cache-control"]);
      console.log("cf-cache-status:", res.headers["cf-cache-status"]);
      console.log("age:", res.headers["age"]);
      console.log("etag:", res.headers["etag"]);
      let body = "";
      res.on("data", (c) => {
        body += c;
        if (body.length > 500_000) res.destroy();
      });
      res.on("end", () => {
        const re = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
        const links = body.match(re) || [];
        console.log("stylesheet link tags:", links.length);
        links.forEach((tag) => console.log(" ", tag.replace(/\s+/g, " ").slice(0, 220)));
        const nav = body.includes('class="site-nav"');
        const toggle = body.includes("site-nav-toggle");
        console.log("has site-nav:", nav);
        console.log("has site-nav-toggle:", toggle);
        console.log(
          "\nPaste in DevTools console on the page (after it loads) for live layout evidence:\n"
        );
        console.log(
          `JSON.stringify({innerWidth,visualViewport:visualViewport?.width,max900:matchMedia("(max-width: 900px)").matches,min901:matchMedia("(min-width: 901px)").matches,navDisplay:getComputedStyle(document.getElementById("site-primary-nav")).display,toggleDisplay:getComputedStyle(document.querySelector(".site-nav-toggle")).display})`
        );
      });
    }
  )
  .on("error", (e) => {
    console.error(e);
    process.exit(1);
  });
