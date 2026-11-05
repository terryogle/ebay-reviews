/**
 * HealthyLine Outlet — Zero-API Browser Console Collector
 *
 * Если нужно без API-ключей быстро дособрать все страницы отзывов прямо со своего ПК (без капч):
 * 1. Открой в обычном Chrome:
 *    https://www.ebay.com/fdbk/feedback_profile/healthylineoutlet?filter=feedback_page%3ARECEIVED_AS_SELLER
 * 2. Выбери внизу таблицы "200" отзывов на страницу.
 * 3. Открой DevTools (F12 -> Console), вставь этот код и нажми Enter.
 *    Скрипт соберёт отзывы с открытой страницы (или нескольких страниц) и скачает готовый JSON!
 */
(async function collectEbayReviews() {
  const collected = [];
  const seen = new Set();

  function parseCurrentTable() {
    const rows = document.querySelectorAll("table tr");
    rows.forEach((tr) => {
      const posIcon = tr.querySelector('[data-test-type="positive"], [aria-label*="Positive"]');
      if (!posIcon) return;
      const cells = tr.querySelectorAll("td");
      if (cells.length < 3) return;

      const rawFeedback = cells[0].innerText.trim();
      const fromText = cells[1].innerText.trim();
      const whenText = cells[2].innerText.trim();

      if (!rawFeedback || rawFeedback.toLowerCase().includes("order delivered on time with no issues")) return;
      if (fromText.toLowerCase().includes("automated feedback")) return;

      const lines = rawFeedback.split("\n").map((s) => s.trim()).filter(Boolean);
      const comment = lines[0] || "";
      if (!comment || seen.has(comment.toLowerCase())) return;
      seen.add(comment.toLowerCase());

      const itemLine = lines.find((l) => l.includes("(#") && !l.includes("Private listing")) || null;
      const imgEl = cells[0].querySelector("img");
      const buyerLine = (fromText.split("\n")[0] || "Verified eBay Buyer").replace(/^Buyer:\s*/i, "").trim();

      collected.push({
        id: "ebay-" + Math.random().toString(36).slice(2, 12),
        rating: 5,
        text: comment,
        buyer: buyerLine === "*****" ? "Verified eBay Buyer" : buyerLine,
        verified: fromText.toLowerCase().includes("verified purchase"),
        period: whenText || "Verified Purchase",
        tags: ["Verified Buyer"],
        photo: imgEl ? imgEl.src : null,
        seller_reply: null,
        item_title: itemLine,
        product: null,
        featured: false
      });
    });
  }

  for (let p = 1; p <= 8; p++) {
    parseCurrentTable();
    console.log(`[HLO Collector] Page ${p} parsed. Total unique human reviews so far: ${collected.length}`);
    const nextBtn = document.querySelector('button[aria-label*="Next page"]:not([disabled]), a[aria-label*="Next page"]');
    if (!nextBtn || nextBtn.disabled || nextBtn.getAttribute("aria-disabled") === "true") break;
    nextBtn.click();
    await new Promise((r) => setTimeout(r, 2800));
  }

  const blob = new Blob([JSON.stringify(collected, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "ebay_collected_reviews.json";
  a.click();
  console.log(`[HLO Collector] Done! Downloaded ${collected.length} reviews.`);
})();
