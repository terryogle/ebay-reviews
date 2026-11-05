/*!
 * HealthyLine Outlet — Verified eBay Reviews Widget v2.0
 * Universal 1-script embeddable widget (Shadow DOM isolated, zero dependencies).
 *
 * 1-Line Universal Embed (works on ANY site — WordPress, Elementor, Shopify, Tilda, Webflow, HTML):
 *   <script src="https://YOUR_GITHUB_LOGIN.github.io/hlo-ebay-reviews/widget.js" defer></script>
 *
 * Optional URL params on <script src=".../widget.js?layout=carousel&autoplay=true">
 * OR optional container <div> attributes:
 *   <div class="hlo-ebay-reviews" data-layout="carousel" data-autoplay="true"></div>
 *
 * Layouts:
 *   "carousel" (default) — Interactive Homepage Slider with filters, drag-scroll, clickable review modal & "All Reviews" drawer
 *   "showcase"           — Full-page 3-column grid with live search & pagination
 *   "badge"              — Compact Product Page trust pill that opens the full reviews modal
 */
(function () {
  "use strict";

  const capturedCurrentScript = document.currentScript;

  if (window.__HLO_EBAY_WIDGET_V2__) {
    if (typeof window.HLOEbayReviewsInit === "function") {
      window.HLOEbayReviewsInit();
    }
    return;
  }
  window.__HLO_EBAY_WIDGET_V2__ = true;

  function findWidgetScriptEl() {
    if (capturedCurrentScript && capturedCurrentScript.src) return capturedCurrentScript;
    const scripts = document.querySelectorAll('script[src*="widget.js"]');
    return scripts.length > 0 ? scripts[scripts.length - 1] : null;
  }

  const SCRIPT_EL = findWidgetScriptEl();

  function parseScriptInfo() {
    if (!SCRIPT_EL || !SCRIPT_EL.src) {
      return { baseUrl: ".", params: new URLSearchParams() };
    }
    try {
      const u = new URL(SCRIPT_EL.src, window.location.href);
      const baseUrl = (u.origin + u.pathname).replace(/\/[^/]+$/, "");
      return { baseUrl, params: u.searchParams };
    } catch (e) {
      return {
        baseUrl: SCRIPT_EL.src.replace(/\/[^/?#]+(\?.*)?(#.*)?$/, ""),
        params: new URLSearchParams()
      };
    }
  }

  const SCRIPT_INFO = parseScriptInfo();
  const BASE_URL = SCRIPT_INFO.baseUrl;
  let cachedDataPromise = null;

  function fetchReviewsData(customSrc) {
    // Hourly cache-buster so GitHub Actions updates propagate within <= 1 hour everywhere
    const hourStamp = Math.floor(Date.now() / 3600000);
    if (customSrc) {
      const sep = customSrc.includes("?") ? "&" : "?";
      return fetch(customSrc + sep + "v=" + hourStamp).then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      });
    }
    if (!cachedDataPromise) {
      const jsonUrl = BASE_URL + "/data/reviews.json?v=" + hourStamp;
      cachedDataPromise = fetch(jsonUrl).then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      });
    }
    return cachedDataPromise;
  }

  const EBAY_LOGO_SVG = `
    <svg class="ebay-logo" viewBox="0 0 120 48" aria-label="eBay" role="img">
      <text x="2" y="37" font-family="'Poppins', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="38" letter-spacing="-1.8">
        <tspan fill="#e53238">e</tspan><tspan fill="#0064d2">b</tspan><tspan fill="#f5af02">a</tspan><tspan fill="#86b817">y</tspan>
      </text>
    </svg>`;

  const STAR_SVG = `<svg viewBox="0 0 20 20" class="star-icon" aria-hidden="true"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.17 3.604a1 1 0 00.95.69h3.789c.969 0 1.371 1.24.588 1.81l-3.065 2.227a1 1 0 00-.364 1.118l1.17 3.604c.3.921-.755 1.688-1.54 1.118l-3.065-2.227a1 1 0 00-1.175 0l-3.065 2.227c-.784.57-1.838-.197-1.539-1.118l1.17-3.604a1 1 0 00-.364-1.118L2.56 9.031c-.783-.57-.38-1.81.588-1.81h3.789a1 1 0 00.95-.69l1.162-3.604z"/></svg>`;

  const VERIFIED_PLUS_SVG = `<svg viewBox="0 0 20 20" class="pos-icon" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#05823F"/><path d="M10 5.2v9.6M5.2 10h9.6" stroke="#fff" stroke-width="2.3" stroke-linecap="round"/></svg>`;

  const TOP_RATED_SVG = `<svg viewBox="0 0 24 24" class="trs-icon" aria-hidden="true"><path fill="#F5AF02" d="M12 1.8l7.5 3.3v6.2c0 5.3-3.2 10.1-7.5 11.9-4.3-1.8-7.5-6.6-7.5-11.9V5.1L12 1.8z"/><path fill="#fff" d="M10.6 15.6l-3.3-3.3 1.4-1.4 1.9 1.9 4.7-4.7 1.4 1.4-6.1 6.1z"/></svg>`;

  const EXTERNAL_ICON = `<svg viewBox="0 0 16 16" class="ext-icon" aria-hidden="true"><path fill="currentColor" d="M9.5 2.5h4v4h-1.5V5.06L7.28 9.78 6.22 8.72 10.94 4H9.5V2.5zM3.5 4.5h3.5V6H5v5h5V9.5h1.5V13h-8V4.5z"/></svg>`;

  const WIDGET_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

    :host {
      all: initial;
      display: block;
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #12161c;
      line-height: 1.55;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
      --brand: #3b626b;
      --brand-dark: #28454c;
      --brand-soft: #74a69f;
      --brand-tint: #e8f1ef;
      --surface: #ffffff;
      --bg-tinted: #f5f9f8;
      --border: #dce8e6;
      --text: #182026;
      --muted: #5d676e;
      --ebay-green: #05823f;
      --star: #f59e0b;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    .hlo-wrap {
      --brand: #3b626b;
      --brand-dark: #28454c;
      --brand-soft: #74a69f;
      --brand-tint: #e8f1ef;
      --surface: #ffffff;
      --bg-tinted: #f5f9f8;
      --border: #dce8e6;
      --text: #182026;
      --muted: #5d676e;
      --ebay-green: #05823f;
      --star: #f59e0b;
      width: 100%;
      max-width: 1240px;
      margin: 0 auto;
      padding: 26px 28px;
      border-radius: 20px;
    }

    .hlo-wrap.theme-tinted {
      background: var(--bg-tinted);
      border: 1px solid var(--border);
    }

    .hlo-wrap.theme-light {
      background: transparent;
      padding: 8px 0;
    }

    /* Shared Brand Badges */
    .ebay-logo {
      height: 28px;
      width: auto;
      display: block;
    }

    .trs-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #fff9eb;
      border: 1px solid #fde68a;
      color: #92400e;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 999px;
      text-decoration: none;
    }

    .trs-icon {
      width: 15px;
      height: 15px;
      flex-shrink: 0;
    }

    .stars-inline {
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }

    .star-icon {
      width: 17px;
      height: 17px;
      fill: var(--star);
    }

    .ext-icon {
      width: 14px;
      height: 14px;
    }

    .verify-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 16px;
      background: var(--brand);
      color: #ffffff;
      text-decoration: none;
      font-size: 12.5px;
      font-weight: 600;
      border-radius: 999px;
      border: 1px solid var(--brand);
      cursor: pointer;
      font-family: inherit;
      transition: background 0.18s ease, transform 0.15s ease;
      white-space: nowrap;
    }

    .verify-btn:hover {
      background: var(--brand-dark);
      border-color: var(--brand-dark);
      transform: translateY(-1px);
    }

    .ghost-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 15px;
      background: var(--surface);
      color: var(--brand-dark);
      border: 1px solid var(--border);
      font-family: inherit;
      font-size: 12.5px;
      font-weight: 600;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.16s ease;
      white-space: nowrap;
      text-decoration: none;
    }

    .ghost-btn:hover {
      border-color: var(--brand);
      color: var(--brand);
      background: #ffffff;
    }

    /* Filter Pills */
    .pills-scroll {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
    }

    .filter-pill {
      appearance: none;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--muted);
      font-family: inherit;
      font-size: 12px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.16s ease;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .filter-pill:hover {
      border-color: var(--brand-soft);
      color: var(--brand);
    }

    .filter-pill.active {
      background: var(--brand);
      border-color: var(--brand);
      color: #ffffff;
    }

    .pill-count {
      font-size: 10.5px;
      opacity: 0.85;
      background: rgba(0, 0, 0, 0.06);
      padding: 1px 6px;
      border-radius: 999px;
    }

    .filter-pill.active .pill-count {
      background: rgba(255, 255, 255, 0.22);
    }

    /* ==========================================
       CAROUSEL (HOMEPAGE SLIDER) LAYOUT
       ========================================== */
    .carousel-top {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-bottom: 16px;
      margin-bottom: 14px;
      border-bottom: 1px solid var(--border);
    }

    .carousel-brand-summary {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .carousel-rating-cluster {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--text);
    }

    .carousel-rating-cluster strong {
      font-size: 17px;
      font-weight: 700;
      color: var(--text);
    }

    .carousel-meta-text {
      font-size: 12.5px;
      color: var(--muted);
    }

    .carousel-meta-text b {
      color: var(--text);
      font-weight: 600;
    }

    .carousel-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .carousel-subbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .carousel-nav-group {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }

    .nav-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--brand-dark);
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      user-select: none;
    }

    .nav-btn:hover {
      background: var(--brand);
      border-color: var(--brand);
      color: #fff;
      transform: scale(1.04);
    }

    .carousel-track {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: calc((100% - 36px) / 3);
      gap: 18px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      padding: 4px 2px 10px;
      scrollbar-width: none;
      cursor: grab;
      -webkit-overflow-scrolling: touch;
    }

    .carousel-track:focus-visible {
      outline: 2px solid var(--brand-soft);
      outline-offset: 4px;
      border-radius: 16px;
    }

    .carousel-viewport {
      position: relative;
    }

    .edge-fade {
      position: absolute;
      top: 0;
      bottom: 12px;
      width: 54px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.25s ease;
      z-index: 2;
    }

    .edge-fade.left {
      left: 0;
      background: linear-gradient(90deg, var(--bg-tinted) 8%, rgba(245, 249, 248, 0) 100%);
    }

    .edge-fade.right {
      right: 0;
      background: linear-gradient(270deg, var(--bg-tinted) 8%, rgba(245, 249, 248, 0) 100%);
    }

    .theme-light .edge-fade.left {
      background: linear-gradient(90deg, #ffffff 8%, rgba(255, 255, 255, 0) 100%);
    }

    .theme-light .edge-fade.right {
      background: linear-gradient(270deg, #ffffff 8%, rgba(255, 255, 255, 0) 100%);
    }

    .edge-fade.visible {
      opacity: 1;
    }

    .carousel-track.dragging {
      cursor: grabbing;
      scroll-behavior: auto;
      scroll-snap-type: none;
    }

    .carousel-track::-webkit-scrollbar {
      display: none;
    }

    .carousel-track .review-card {
      scroll-snap-align: start;
      min-height: 310px;
      cursor: pointer;
    }

    .carousel-bottom {
      margin-top: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .progress-rail {
      flex: 1 1 200px;
      max-width: 320px;
      height: 5px;
      background: #dce8e6;
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-thumb {
      height: 100%;
      width: 18%;
      background: var(--brand);
      border-radius: 999px;
      transition: width 0.2s ease;
    }

    .carousel-counter {
      font-size: 12px;
      color: var(--muted);
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .slide-counter {
      font-variant-numeric: tabular-nums;
      font-weight: 600;
      color: var(--brand-dark);
      background: #ffffff;
      border: 1px solid var(--border);
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11.5px;
    }

    /* ==========================================
       REVIEW CARDS (SHARED + CLAMPED)
       ========================================== */
    .review-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 15px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
      position: relative;
    }

    .review-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 28px rgba(18, 22, 28, 0.07);
      border-color: #b7d2ce;
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .verified-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11.5px;
      font-weight: 600;
      color: var(--ebay-green);
      background: #ecfdf3;
      border: 1px solid #ccebd9;
      padding: 3px 9px;
      border-radius: 999px;
      text-decoration: none;
    }

    .pos-icon {
      width: 13px;
      height: 13px;
      flex-shrink: 0;
    }

    .review-body {
      font-size: 13.8px;
      color: #222b32;
      line-height: 1.6;
      margin: 0;
      word-break: break-word;
    }

    .review-body.clamped {
      display: -webkit-box;
      -webkit-line-clamp: 5;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .review-body mark {
      background: #fef08a;
      color: inherit;
      padding: 0 2px;
      border-radius: 3px;
    }

    .read-more-inline {
      background: none;
      border: none;
      padding: 0;
      color: var(--brand);
      font-family: inherit;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .read-more-inline:hover {
      text-decoration: underline;
    }

    .buyer-photo-btn {
      align-self: flex-start;
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      padding: 0 10px 0 0;
      background: #f8fafc;
      cursor: zoom-in;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: border-color 0.15s ease;
    }

    .buyer-photo-btn:hover {
      border-color: var(--brand);
    }

    .buyer-photo-btn img {
      width: 46px;
      height: 46px;
      object-fit: cover;
      display: block;
    }

    .buyer-photo-btn span {
      font-size: 11.5px;
      font-weight: 600;
      color: var(--brand);
    }

    .seller-reply {
      background: var(--brand-tint);
      border-left: 3px solid var(--brand);
      padding: 8px 11px;
      border-radius: 0 8px 8px 0;
      font-size: 12px;
      color: var(--brand-dark);
    }

    .seller-reply strong {
      display: block;
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 2px;
      color: var(--brand);
    }

    .product-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 10px;
      background: #f8fbfb;
      border: 1px solid #e3eeec;
      border-radius: 10px;
      text-decoration: none;
      color: var(--text);
      transition: background 0.15s ease, border-color 0.15s ease;
    }

    .product-chip:hover {
      background: var(--brand-tint);
      border-color: var(--brand-soft);
    }

    .product-chip img {
      width: 34px;
      height: 34px;
      border-radius: 6px;
      object-fit: cover;
      flex-shrink: 0;
      background: #fff;
      border: 1px solid #e5e7eb;
    }

    .product-chip-info {
      min-width: 0;
      flex: 1;
    }

    .product-chip-label {
      font-size: 10px;
      color: var(--muted);
      display: block;
      line-height: 1.2;
    }

    .product-chip-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--brand-dark);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }

    .product-chip-arrow {
      font-size: 13px;
      color: var(--brand);
      font-weight: 700;
      padding-right: 2px;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-top: 10px;
      border-top: 1px solid #eef4f3;
      font-size: 11.8px;
      color: var(--muted);
    }

    .buyer-name {
      font-weight: 500;
      color: #3f484f;
    }

    /* ==========================================
       SHOWCASE FULL GRID LAYOUT
       ========================================== */
    .trust-banner {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px 28px;
      display: grid;
      grid-template-columns: 1.25fr 1fr auto;
      gap: 24px;
      align-items: center;
      box-shadow: 0 10px 30px rgba(59, 98, 107, 0.06);
      margin-bottom: 22px;
    }

    .trust-left {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .brand-eyebrow {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .since-tag {
      font-size: 12px;
      color: var(--muted);
      font-weight: 500;
    }

    .headline-row {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 12px;
    }

    .big-score {
      font-size: 30px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: -0.02em;
      line-height: 1.1;
    }

    .stats-sub {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 14px;
      font-size: 13px;
      color: var(--muted);
    }

    .stats-sub strong {
      color: var(--text);
      font-weight: 600;
    }

    .dsr-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(140px, 1fr));
      gap: 10px 18px;
      padding-left: 20px;
      border-left: 1px solid var(--border);
    }

    .dsr-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .dsr-top {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 10px;
      font-size: 12px;
      color: var(--muted);
      font-weight: 500;
    }

    .dsr-top strong {
      color: var(--brand);
      font-weight: 700;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .dsr-bar {
      height: 6px;
      background: var(--brand-tint);
      border-radius: 999px;
      overflow: hidden;
    }

    .dsr-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--brand) 0%, var(--brand-soft) 100%);
      border-radius: 999px;
    }

    .trust-cta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }

    .seller-handle {
      font-size: 11.5px;
      color: var(--muted);
    }

    .seller-handle code {
      background: var(--brand-tint);
      color: var(--brand-dark);
      padding: 2px 6px;
      border-radius: 5px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
    }

    .controls-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 20px;
    }

    .search-box {
      position: relative;
      min-width: 240px;
      flex: 0 1 290px;
    }

    .search-input {
      width: 100%;
      padding: 8px 14px 8px 35px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: var(--surface);
      font-family: inherit;
      font-size: 13px;
      color: var(--text);
      outline: none;
    }

    .search-input:focus {
      border-color: var(--brand);
      box-shadow: 0 0 0 3px rgba(59, 98, 107, 0.12);
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 15px;
      height: 15px;
      color: var(--muted);
      pointer-events: none;
    }

    .reviews-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
    }

    .footer-actions {
      margin-top: 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 14px;
    }

    .load-more-btn {
      appearance: none;
      background: var(--surface);
      border: 1.5px solid var(--brand);
      color: var(--brand);
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 22px;
      border-radius: 999px;
      cursor: pointer;
      transition: all 0.16s ease;
    }

    .load-more-btn:hover {
      background: var(--brand);
      color: #ffffff;
    }

    .all-ebay-link {
      font-size: 13px;
      color: var(--muted);
      text-decoration: none;
      font-weight: 500;
    }

    .all-ebay-link:hover {
      color: var(--brand);
      text-decoration: underline;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 36px 20px;
      background: var(--surface);
      border-radius: 14px;
      border: 1px dashed var(--border);
      color: var(--muted);
      font-size: 14px;
    }

    /* Compact Badge */
    .compact-badge {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      padding: 10px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(18, 22, 28, 0.05);
      cursor: pointer;
      transition: border-color 0.16s ease, transform 0.15s ease;
      font-family: inherit;
    }

    .compact-badge:hover {
      border-color: var(--brand);
      transform: translateY(-1px);
    }

    .compact-badge .ebay-logo {
      height: 22px;
    }

    .badge-divider {
      width: 1px;
      height: 22px;
      background: var(--border);
    }

    .badge-metrics {
      font-size: 12.5px;
      color: var(--text);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .badge-cta {
      font-size: 12px;
      color: var(--brand);
      font-weight: 600;
      text-decoration: underline;
    }

    /* Modals (Single Review Detail + Full Drawer) */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 30, 0.62);
      backdrop-filter: blur(3px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.16s ease;
    }

    .modal-box {
      background: var(--bg-tinted);
      border-radius: 20px;
      max-width: 1100px;
      width: 100%;
      max-height: 88vh;
      overflow-y: auto;
      position: relative;
      padding: 24px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
    }

    .detail-modal-box {
      background: #ffffff;
      border-radius: 18px;
      max-width: 580px;
      width: 100%;
      max-height: 88vh;
      overflow-y: auto;
      position: relative;
      padding: 26px 28px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modal-box .trust-banner {
      display: none;
    }

    .modal-head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 0 52px 14px 0;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }

    .modal-head-main {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .modal-head-title {
      font-size: 19px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: -0.01em;
    }

    .modal-head-sub {
      font-size: 12.5px;
      color: var(--muted);
    }

    .detail-photo {
      width: 100%;
      max-height: 360px;
      object-fit: contain;
      background: #0f171e;
      border-radius: 12px;
      display: block;
    }

    .detail-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding-top: 12px;
      border-top: 1px solid #eef4f3;
    }

    .close-modal-btn {
      position: sticky;
      top: 0;
      float: right;
      margin-left: auto;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: #ffffff;
      color: var(--text);
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      z-index: 5;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .close-modal-btn:hover {
      background: #f1f5f9;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @media (max-width: 1024px) {
      .trust-banner {
        grid-template-columns: 1fr;
      }
      .dsr-grid {
        padding-left: 0;
        border-left: none;
        padding-top: 14px;
        border-top: 1px solid var(--border);
      }
      .trust-cta {
        align-items: flex-start;
      }
      .reviews-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .carousel-track {
        grid-auto-columns: calc((100% - 18px) / 2);
      }
    }

    @media (max-width: 640px) {
      .hlo-wrap {
        padding: 16px;
        border-radius: 14px;
      }
      .reviews-grid {
        grid-template-columns: 1fr;
      }
      .carousel-track {
        grid-auto-columns: 86%;
      }
      .carousel-track .review-card {
        min-height: 0;
      }
      .search-box {
        flex: 1 1 100%;
      }
      .carousel-top {
        gap: 10px;
      }
      .carousel-actions {
        width: 100%;
      }
      .carousel-actions .ghost-btn,
      .carousel-actions .verify-btn {
        flex: 1 1 auto;
        justify-content: center;
      }
      .carousel-subbar {
        flex-wrap: nowrap;
        gap: 10px;
        margin-bottom: 12px;
      }
      .pills-scroll {
        flex: 1 1 auto;
        min-width: 0;
        flex-wrap: nowrap;
        overflow-x: auto;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 2px;
      }
      .pills-scroll::-webkit-scrollbar {
        display: none;
      }
      .filter-pill {
        flex: 0 0 auto;
      }
      .carousel-nav-group {
        margin-left: 0;
        flex: 0 0 auto;
        gap: 6px;
      }
      .nav-btn {
        width: 34px;
        height: 34px;
        font-size: 18px;
      }
      .carousel-bottom {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
      .progress-rail {
        flex: 0 0 auto;
        height: 5px;
        max-width: 100%;
        width: 100%;
      }
      .carousel-counter {
        gap: 8px 12px;
      }
      .carousel-meta-text {
        font-size: 12px;
      }
    }
  `;

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function highlightText(text, query) {
    const safe = escapeHtml(text);
    if (!query || query.trim().length < 2) return safe;
    const escapedQ = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("(" + escapedQ + ")", "gi");
    return safe.replace(re, "<mark>$1</mark>");
  }

  function renderStars(count) {
    let html = '<span class="stars-inline" aria-label="' + count + ' out of 5 stars">';
    for (let i = 0; i < count; i++) html += STAR_SVG;
    html += "</span>";
    return html;
  }

  function detectPageProductSlug() {
    const m = window.location.pathname.match(/\/product\/([^/?#]+)/i);
    return m ? m[1].toLowerCase() : "";
  }

  function injectSeoJsonLd(store) {
    if (document.getElementById("hlo-ebay-jsonld")) return;
    const script = document.createElement("script");
    script.id = "hlo-ebay-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Store",
      name: store.name || "HealthyLine Outlet",
      url: store.website_url || "https://healthylineoutlet.com",
      sameAs: [store.ebay_store_url, store.ebay_profile_url].filter(Boolean),
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5.0",
        bestRating: "5",
        worstRating: "1",
        ratingCount: String(store.feedback_score || 1305),
        reviewCount: String(store.total_seller_reviews || 1077)
      }
    });
    document.head.appendChild(script);
  }

  function openReviewDetailModal(shadowRoot, review, store) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";

    const photoBlock = review.photo
      ? `<img class="detail-photo" src="${escapeHtml(review.photo)}" alt="Verified eBay buyer photo" onerror="this.style.display='none'"/>`
      : "";

    const replyBlock = review.seller_reply
      ? `<div class="seller-reply">
           <strong>HealthyLine Outlet replied</strong>
           ${escapeHtml(review.seller_reply)}
         </div>`
      : "";

    const prodBlock = review.product
      ? `<a class="product-chip" href="${escapeHtml(review.product.url)}" target="_top" rel="noopener">
           ${
             review.product.thumbnail
               ? `<img src="${escapeHtml(review.product.thumbnail)}" alt="${escapeHtml(review.product.name)}" onerror="this.style.display='none'"/>`
               : ""
           }
           <span class="product-chip-info">
             <span class="product-chip-label">Shop matching model on HealthyLineOutlet.com</span>
             <span class="product-chip-title">${escapeHtml(review.product.name)}</span>
           </span>
           <span class="product-chip-arrow">&rarr;</span>
         </a>`
      : "";

    backdrop.innerHTML = `
      <div class="detail-modal-box" role="dialog" aria-modal="true">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            ${renderStars(review.rating || 5)}
            <span class="verified-pill">${VERIFIED_PLUS_SVG} Verified eBay Purchase</span>
          </div>
          <button type="button" class="close-modal-btn" style="position:static;margin:0;" aria-label="Close">&times;</button>
        </div>

        <p class="review-body" style="font-size:15px;line-height:1.68;">${escapeHtml(review.text)}</p>
        ${photoBlock}
        ${replyBlock}
        ${prodBlock}

        <div class="detail-actions">
          <span style="font-size:12.5px;color:#5d676e;">
            Buyer: <strong style="color:#182026;">${escapeHtml(review.buyer || "Verified Buyer")}</strong> &bull; ${escapeHtml(review.period || "Verified Purchase")}
          </span>
          <a class="ghost-btn" href="${escapeHtml(store.ebay_profile_url)}" target="_blank" rel="noopener noreferrer">
            Verify on eBay ${EXTERNAL_ICON}
          </a>
        </div>
      </div>
    `;

    shadowRoot.appendChild(backdrop);
    installEscapeHandler();
    const close = () => backdrop.remove();
    backdrop.querySelector(".close-modal-btn").addEventListener("click", close);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });
  }

  function openAllReviewsModal(shadowRoot, data, opts) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    const box = document.createElement("div");
    box.className = "modal-box";
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "close-modal-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.setAttribute("aria-label", "Close all reviews");

    const store = data.store || {};
    const total = (data.reviews || []).length;
    const head = document.createElement("div");
    head.className = "modal-head";
    head.innerHTML = `
      <div class="modal-head-main">
        <span class="modal-head-title">All ${total} Verified eBay Reviews</span>
        <span class="modal-head-sub">100% Positive &bull; ${(store.feedback_score || 1305).toLocaleString()} Score &bull; Top-Rated since 2013</span>
      </div>
      <a class="ghost-btn" href="${escapeHtml(store.ebay_profile_url)}" target="_blank" rel="noopener noreferrer">
        Verify on eBay ${EXTERNAL_ICON}
      </a>
    `;

    box.appendChild(closeBtn);
    box.appendChild(head);
    backdrop.appendChild(box);
    shadowRoot.appendChild(backdrop);
    installEscapeHandler();

    renderShowcaseInto(box, data, {
      limit: 12,
      theme: "light",
      productSlug: opts.productSlug,
      shadowRootForModals: shadowRoot
    });

    const close = () => backdrop.remove();
    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) close();
    });
  }

  function renderCardHtml(r, query, clampForCarousel) {
    const isLong = (r.text || "").length > 195;
    const bodyCls = clampForCarousel ? "review-body clamped" : "review-body";

    const readMoreHtml =
      clampForCarousel && isLong
        ? `<button type="button" class="read-more-inline" data-open-id="${escapeHtml(r.id)}">Read full review &rarr;</button>`
        : "";

    const photoHtml = r.photo
      ? `<button type="button" class="buyer-photo-btn" data-open-id="${escapeHtml(r.id)}">
           <img src="${escapeHtml(r.photo)}" alt="Verified buyer photo" loading="lazy" onerror="this.parentElement.style.display='none'"/>
           <span>Buyer Photo</span>
         </button>`
      : "";

    const replyHtml =
      !clampForCarousel && r.seller_reply
        ? `<div class="seller-reply">
             <strong>HealthyLine Outlet replied</strong>
             ${escapeHtml(r.seller_reply)}
           </div>`
        : "";

    const productHtml = r.product
      ? `<a class="product-chip" href="${escapeHtml(r.product.url)}" target="_top" rel="noopener">
           ${
             r.product.thumbnail
               ? `<img src="${escapeHtml(r.product.thumbnail)}" alt="${escapeHtml(r.product.name)}" loading="lazy" onerror="this.style.display='none'"/>`
               : ""
           }
           <span class="product-chip-info">
             <span class="product-chip-label">Verified purchase model</span>
             <span class="product-chip-title">${escapeHtml(r.product.name)}</span>
           </span>
           <span class="product-chip-arrow">&rarr;</span>
         </a>`
      : "";

    return `
      <article class="review-card" data-review-id="${escapeHtml(r.id)}">
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div class="card-top">
            ${renderStars(r.rating || 5)}
            <span class="verified-pill">${VERIFIED_PLUS_SVG} Verified eBay</span>
          </div>
          <p class="${bodyCls}">${highlightText(r.text, query)}</p>
          ${readMoreHtml}
          ${photoHtml}
          ${replyHtml}
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${productHtml}
          <div class="card-footer">
            <span class="buyer-name">${escapeHtml(r.buyer || "Verified Buyer")}</span>
            <span>${escapeHtml(r.period || "Verified Purchase")}</span>
          </div>
        </div>
      </article>
    `;
  }

  function bindCardClicks(shadowRoot, scopeEl, reviewsById, store) {
    scopeEl.querySelectorAll(".review-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        // Let direct product links navigate naturally
        if (e.target.closest("a.product-chip")) return;
        // Ignore click if user was dragging the slider
        if (scopeEl.getAttribute("data-dragged") === "1") return;
        const id = card.getAttribute("data-review-id");
        const rev = reviewsById[id];
        if (rev) openReviewDetailModal(shadowRoot, rev, store);
      });
    });
  }

  let escapeHandlerInstalled = false;
  function installEscapeHandler() {
    if (escapeHandlerInstalled) return;
    escapeHandlerInstalled = true;
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const hosts = document.querySelectorAll("#hlo-ebay-reviews, .hlo-ebay-reviews");
      for (let i = hosts.length - 1; i >= 0; i--) {
        const root = hosts[i].shadowRoot;
        if (!root) continue;
        const modals = root.querySelectorAll(".modal-backdrop");
        if (modals.length > 0) {
          modals[modals.length - 1].remove();
          e.stopPropagation();
          return;
        }
      }
    });
  }

  function renderCarouselInto(shadowRoot, data, opts) {
    const store = data.store || {};
    const allReviews = (data.reviews || []).slice();
    const reviewsById = {};
    allReviews.forEach((r) => (reviewsById[r.id] = r));

    let targetSlug = opts.productSlug || "";
    if (targetSlug === "auto") targetSlug = detectPageProductSlug();
    if (targetSlug) {
      allReviews.sort((a, b) => {
        const aM = a.product && a.product.slug.includes(targetSlug) ? 1 : 0;
        const bM = b.product && b.product.slug.includes(targetSlug) ? 1 : 0;
        return bM - aM;
      });
    }

    const categories = [
      { key: "ALL", label: "All Stories", count: allReviews.length },
      {
        key: "Pain Relief & Sleep",
        label: "Pain Relief & Sleep",
        count: allReviews.filter((r) => (r.tags || []).includes("Pain Relief & Sleep")).length
      },
      {
        key: "Like-New Condition",
        label: "Like-New Condition",
        count: allReviews.filter((r) => (r.tags || []).includes("Like-New Condition")).length
      },
      {
        key: "Fast Shipping",
        label: "Fast Shipping",
        count: allReviews.filter((r) => (r.tags || []).includes("Fast Shipping")).length
      },
      {
        key: "PRODUCT_MATCHED",
        label: "Matched to Models",
        count: allReviews.filter((r) => !!r.product).length
      }
    ];

    let currentTag = "ALL";

    const container = document.createElement("div");
    container.className = "hlo-wrap theme-" + (opts.theme || "tinted");
    container.innerHTML = `
      <div class="carousel-top">
        <div class="carousel-brand-summary">
          <a href="${escapeHtml(store.ebay_profile_url)}" target="_blank" rel="noopener noreferrer" title="Official HealthyLine Outlet eBay Feedback Profile" style="display:inline-flex;align-items:center;">
            ${EBAY_LOGO_SVG}
          </a>
          <a class="trs-pill" href="${escapeHtml(store.ebay_profile_url)}" target="_blank" rel="noopener noreferrer">
            ${TOP_RATED_SVG} Top-Rated Seller
          </a>
          <div class="carousel-rating-cluster">
            ${renderStars(5)}
            <strong>100% Positive</strong>
          </div>
          <span class="carousel-meta-text">
            <b>${(store.feedback_score || 1305).toLocaleString()}</b> Rating Score &bull;
            <b>${(store.total_seller_reviews || 1077).toLocaleString()}+</b> Verified Orders
          </span>
        </div>

        <div class="carousel-actions">
          <button type="button" class="ghost-btn open-all-btn">
            Search All Reviews (${allReviews.length})
          </button>
          <a class="verify-btn" href="${escapeHtml(store.ebay_profile_url)}" target="_blank" rel="noopener noreferrer">
            Verify on eBay ${EXTERNAL_ICON}
          </a>
        </div>
      </div>

      <div class="carousel-subbar">
        <div class="pills-scroll" role="tablist">
          ${categories
            .map(
              (c) => `
            <button type="button" class="filter-pill ${c.key === "ALL" ? "active" : ""}" data-tag="${escapeHtml(c.key)}">
              ${escapeHtml(c.label)} <span class="pill-count">${c.count}</span>
            </button>`
            )
            .join("")}
        </div>

        <div class="carousel-nav-group">
          <button type="button" class="nav-btn prev-btn" aria-label="Previous reviews">&lsaquo;</button>
          <button type="button" class="nav-btn next-btn" aria-label="Next reviews">&rsaquo;</button>
        </div>
      </div>

      <div class="carousel-viewport">
        <div class="edge-fade left" aria-hidden="true"></div>
        <div class="carousel-track" tabindex="0" aria-label="Verified eBay buyer reviews slider"></div>
        <div class="edge-fade right visible" aria-hidden="true"></div>
      </div>

      <div class="carousel-bottom">
        <div class="progress-rail" aria-hidden="true">
          <div class="progress-thumb"></div>
        </div>
        <div class="carousel-counter">
          <span class="counter-label">Click any review card to read in full</span>
          <span class="slide-counter"></span>
          <a class="all-ebay-link" href="${escapeHtml(store.ebay_profile_url)}" target="_blank" rel="noopener noreferrer">
            See all ${(store.total_seller_reviews || 1077).toLocaleString()} ratings on eBay &rarr;
          </a>
        </div>
      </div>
    `;

    shadowRoot.appendChild(container);

    const track = container.querySelector(".carousel-track");
    const thumb = container.querySelector(".progress-thumb");
    const pillBtns = container.querySelectorAll(".filter-pill");
    const prevBtn = container.querySelector(".prev-btn");
    const nextBtn = container.querySelector(".next-btn");
    const openAllBtn = container.querySelector(".open-all-btn");

    function getFilteredList() {
      const list = allReviews.filter((r) => {
        if (currentTag === "PRODUCT_MATCHED") return !!r.product;
        if (currentTag !== "ALL") return (r.tags || []).includes(currentTag);
        return true;
      });
      return opts.limit ? list.slice(0, opts.limit) : list;
    }

    function updateProgress() {
      const maxScroll = track.scrollWidth - track.clientWidth;
      const fadeLeft = container.querySelector(".edge-fade.left");
      const fadeRight = container.querySelector(".edge-fade.right");
      const counterEl = container.querySelector(".slide-counter");
      const total = track.querySelectorAll(".review-card").length;

      if (maxScroll <= 2) {
        thumb.style.width = "100%";
        fadeLeft.classList.remove("visible");
        fadeRight.classList.remove("visible");
        if (counterEl) counterEl.textContent = total ? `1 – ${total} of ${total}` : "";
        return;
      }

      const ratio = track.scrollLeft / maxScroll;
      thumb.style.width = Math.min(100, Math.max(12, ratio * 88 + 12)).toFixed(1) + "%";

      fadeLeft.classList.toggle("visible", track.scrollLeft > 8);
      fadeRight.classList.toggle("visible", track.scrollLeft < maxScroll - 8);

      if (counterEl) {
        const firstCard = track.querySelector(".review-card");
        const cardW = firstCard ? firstCard.offsetWidth + 18 : 380;
        const firstVisible = Math.min(total, Math.round(track.scrollLeft / cardW) + 1);
        const perView = Math.max(1, Math.round(track.clientWidth / cardW));
        const lastVisible = Math.min(total, firstVisible + perView - 1);
        counterEl.textContent = `${firstVisible} – ${lastVisible} of ${total}`;
      }
    }

    function renderSlides() {
      const list = getFilteredList();
      track.innerHTML = list.map((r) => renderCardHtml(r, "", true)).join("");
      track.scrollLeft = 0;
      bindCardClicks(shadowRoot, track, reviewsById, store);
      requestAnimationFrame(updateProgress);
    }

    function stepSlide(dir) {
      const firstCard = track.querySelector(".review-card");
      const step = firstCard ? firstCard.offsetWidth + 18 : 380;
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (dir > 0 && track.scrollLeft >= maxScroll - 10) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else if (dir < 0 && track.scrollLeft <= 10) {
        track.scrollTo({ left: maxScroll, behavior: "smooth" });
      } else {
        track.scrollBy({ left: dir * step, behavior: "smooth" });
      }
    }

    prevBtn.addEventListener("click", () => stepSlide(-1));
    nextBtn.addEventListener("click", () => stepSlide(1));
    track.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    // Keyboard support: ←/→ when the slider has focus
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        stepSlide(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepSlide(-1);
      }
    });

    // Escape closes the top-most open modal (works even when focus sits outside the shadow tree)
    installEscapeHandler();

    pillBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        pillBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentTag = btn.getAttribute("data-tag") || "ALL";
        renderSlides();
      });
    });

    openAllBtn.addEventListener("click", () => {
      openAllReviewsModal(shadowRoot, data, opts);
    });

    // Desktop Mouse Drag-to-Scroll
    let isDown = false;
    let startX = 0;
    let startScroll = 0;
    track.addEventListener("mousedown", (e) => {
      if (e.button !== 0 || e.target.closest("a, button")) return;
      isDown = true;
      startX = e.pageX;
      startScroll = track.scrollLeft;
      track.setAttribute("data-dragged", "0");
    });
    window.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 6) {
        track.classList.add("dragging");
        track.setAttribute("data-dragged", "1");
        track.scrollLeft = startScroll - dx;
      }
    });
    window.addEventListener("mouseup", () => {
      if (!isDown) return;
      isDown = false;
      track.classList.remove("dragging");
      setTimeout(() => track.setAttribute("data-dragged", "0"), 60);
    });

    // Gentle Autoplay (pauses on hover / focus / modal)
    if (opts.autoplay) {
      let paused = false;
      container.addEventListener("mouseenter", () => (paused = true));
      container.addEventListener("mouseleave", () => (paused = false));
      container.addEventListener("touchstart", () => (paused = true), { passive: true });
      setInterval(() => {
        if (paused || shadowRoot.querySelector(".modal-backdrop")) return;
        stepSlide(1);
      }, 6000);
    }

    renderSlides();
  }

  function renderShowcaseInto(targetEl, data, opts) {
    const modalRoot = opts.shadowRootForModals || targetEl;
    const store = data.store || {};
    const allReviews = (data.reviews || []).slice();
    const reviewsById = {};
    allReviews.forEach((r) => (reviewsById[r.id] = r));

    let targetSlug = opts.productSlug || "";
    if (targetSlug === "auto") targetSlug = detectPageProductSlug();

    if (targetSlug) {
      allReviews.sort((a, b) => {
        const aMatch = a.product && a.product.slug.includes(targetSlug) ? 1 : 0;
        const bMatch = b.product && b.product.slug.includes(targetSlug) ? 1 : 0;
        return bMatch - aMatch;
      });
    }

    const state = {
      tag: "ALL",
      query: "",
      visibleCount: opts.limit || 9
    };

    const categories = [
      { key: "ALL", label: "All Reviews", count: allReviews.length },
      {
        key: "Pain Relief & Sleep",
        label: "Pain Relief & Sleep",
        count: allReviews.filter((r) => (r.tags || []).includes("Pain Relief & Sleep")).length
      },
      {
        key: "Like-New Condition",
        label: "Like-New Condition",
        count: allReviews.filter((r) => (r.tags || []).includes("Like-New Condition")).length
      },
      {
        key: "Fast Shipping",
        label: "Fast Shipping",
        count: allReviews.filter((r) => (r.tags || []).includes("Fast Shipping")).length
      },
      {
        key: "Customer Support",
        label: "Customer Support",
        count: allReviews.filter((r) => (r.tags || []).includes("Customer Support")).length
      },
      {
        key: "PRODUCT_MATCHED",
        label: "Matched to Models",
        count: allReviews.filter((r) => !!r.product).length
      }
    ];

    const dsr = store.dsr || {};
    const container = document.createElement("div");
    container.className = "hlo-wrap theme-" + (opts.theme || "tinted");

    container.innerHTML = `
      <div class="trust-banner">
        <div class="trust-left">
          <div class="brand-eyebrow">
            ${EBAY_LOGO_SVG}
            <span class="trs-pill">${TOP_RATED_SVG} Top-Rated Seller</span>
            <span class="since-tag">Member since ${escapeHtml(store.member_since || "Feb 2013")}</span>
          </div>
          <div class="headline-row">
            <span class="big-score">${escapeHtml(store.positive_percent || 100)}% Positive</span>
            ${renderStars(5)}
          </div>
          <div class="stats-sub">
            <span><strong>${escapeHtml((store.feedback_score || 1305).toLocaleString())}</strong> Feedback Score</span>
            <span>&bull;</span>
            <span><strong>${escapeHtml((store.total_seller_reviews || 1077).toLocaleString())}+</strong> Seller Reviews</span>
            <span>&bull;</span>
            <span><strong>${escapeHtml(store.items_sold || "3,100+")}</strong> Mats Sold</span>
          </div>
        </div>

        <div class="dsr-grid" aria-label="Detailed Seller Ratings">
          <div class="dsr-item">
            <div class="dsr-top"><span>Accurate description</span><strong>${(dsr.accurate_description || 5.0).toFixed(1)} / 5.0</strong></div>
            <div class="dsr-bar"><div class="dsr-fill" style="width:${((dsr.accurate_description || 5) / 5) * 100}%"></div></div>
          </div>
          <div class="dsr-item">
            <div class="dsr-top"><span>Shipping speed</span><strong>${(dsr.shipping_speed || 5.0).toFixed(1)} / 5.0</strong></div>
            <div class="dsr-bar"><div class="dsr-fill" style="width:${((dsr.shipping_speed || 5) / 5) * 100}%"></div></div>
          </div>
          <div class="dsr-item">
            <div class="dsr-top"><span>Reasonable shipping</span><strong>${(dsr.shipping_cost || 5.0).toFixed(1)} / 5.0</strong></div>
            <div class="dsr-bar"><div class="dsr-fill" style="width:${((dsr.shipping_cost || 5) / 5) * 100}%"></div></div>
          </div>
          <div class="dsr-item">
            <div class="dsr-top"><span>Communication</span><strong>${(dsr.communication || 5.0).toFixed(1)} / 5.0</strong></div>
            <div class="dsr-bar"><div class="dsr-fill" style="width:${((dsr.communication || 5) / 5) * 100}%"></div></div>
          </div>
        </div>

        <div class="trust-cta">
          <a class="verify-btn" href="${escapeHtml(store.ebay_profile_url)}" target="_blank" rel="noopener noreferrer">
            Verify on eBay ${EXTERNAL_ICON}
          </a>
          <span class="seller-handle">Official seller: <code>${escapeHtml(store.ebay_username || "healthylineoutlet")}</code></span>
        </div>
      </div>

      <div class="controls-bar">
        <div class="pills-scroll" role="tablist">
          ${categories
            .map(
              (c) => `
            <button type="button" class="filter-pill ${c.key === "ALL" ? "active" : ""}" data-tag="${escapeHtml(c.key)}">
              ${escapeHtml(c.label)} <span class="pill-count">${c.count}</span>
            </button>`
            )
            .join("")}
        </div>
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="8.5" cy="8.5" r="5.5"/><path d="M13 13l4 4" stroke-linecap="round"/>
          </svg>
          <input type="search" class="search-input" placeholder="Search pain, PEMF, TAJ, condition..." aria-label="Search reviews"/>
        </div>
      </div>

      <div class="reviews-grid"></div>

      <div class="footer-actions">
        <button type="button" class="load-more-btn">Show More Reviews</button>
        <a class="all-ebay-link" href="${escapeHtml(store.ebay_profile_url)}" target="_blank" rel="noopener noreferrer">
          Browse all ${(store.total_seller_reviews || 1077).toLocaleString()} feedback entries on eBay &rarr;
        </a>
      </div>
    `;

    targetEl.appendChild(container);

    const gridEl = container.querySelector(".reviews-grid");
    const loadMoreBtn = container.querySelector(".load-more-btn");
    const searchInput = container.querySelector(".search-input");
    const pillBtns = container.querySelectorAll(".filter-pill");

    function getFiltered() {
      return allReviews.filter((r) => {
        if (state.tag === "PRODUCT_MATCHED" && !r.product) return false;
        if (state.tag !== "ALL" && state.tag !== "PRODUCT_MATCHED") {
          if (!(r.tags || []).includes(state.tag)) return false;
        }
        if (state.query.trim().length > 0) {
          const q = state.query.toLowerCase();
          const hay =
            (r.text || "") +
            " " +
            (r.product ? r.product.name : "") +
            " " +
            (r.item_title || "") +
            " " +
            (r.tags || []).join(" ");
          if (!hay.toLowerCase().includes(q)) return false;
        }
        return true;
      });
    }

    function updateGrid() {
      const filtered = getFiltered();
      if (filtered.length === 0) {
        gridEl.innerHTML = `<div class="empty-state">No reviews matched "<strong>${escapeHtml(state.query)}</strong>". Try searching for <em>TAJ</em>, <em>PEMF</em>, <em>pain</em>, or <em>like new</em>.</div>`;
        loadMoreBtn.style.display = "none";
        return;
      }
      const slice = filtered.slice(0, state.visibleCount);
      gridEl.innerHTML = slice.map((r) => renderCardHtml(r, state.query, false)).join("");

      if (filtered.length > state.visibleCount) {
        const rem = filtered.length - state.visibleCount;
        loadMoreBtn.style.display = "inline-flex";
        loadMoreBtn.textContent = `Show More Reviews (${rem} more)`;
      } else {
        loadMoreBtn.style.display = "none";
      }

      bindCardClicks(modalRoot, gridEl, reviewsById, store);
    }

    pillBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        pillBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        state.tag = btn.getAttribute("data-tag") || "ALL";
        state.visibleCount = opts.limit || 9;
        updateGrid();
      });
    });

    searchInput.addEventListener("input", (e) => {
      state.query = e.target.value || "";
      state.visibleCount = opts.limit || 9;
      updateGrid();
    });

    loadMoreBtn.addEventListener("click", () => {
      state.visibleCount += opts.limit || 9;
      updateGrid();
    });

    updateGrid();
  }

  function renderBadgeInto(shadowRoot, data, opts) {
    const store = data.store || {};
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "compact-badge";
    btn.innerHTML = `
      ${EBAY_LOGO_SVG}
      <span class="badge-divider"></span>
      <span class="badge-metrics">
        ${renderStars(5)}
        <span>100% Positive &bull; ${(store.feedback_score || 1305).toLocaleString()} Score</span>
      </span>
      <span class="badge-cta">Read ${(store.total_seller_reviews || 1077).toLocaleString()}+ Reviews</span>
    `;
    shadowRoot.appendChild(btn);

    btn.addEventListener("click", () => {
      openAllReviewsModal(shadowRoot, data, opts);
    });
  }

  function mountContainer(hostEl) {
    if (hostEl.getAttribute("data-hlo-mounted") === "1") return;
    hostEl.setAttribute("data-hlo-mounted", "1");

    const qParams = SCRIPT_INFO.params;
    const layout = (hostEl.getAttribute("data-layout") || qParams.get("layout") || "carousel").toLowerCase();
    const limitAttr = hostEl.getAttribute("data-limit") || qParams.get("limit");
    const limit = limitAttr ? parseInt(limitAttr, 10) : layout === "carousel" ? 55 : 9;
    const productSlug = hostEl.getAttribute("data-product") || qParams.get("product") || "";
    const theme = hostEl.getAttribute("data-theme") || qParams.get("theme") || "tinted";
    const customSrc = hostEl.getAttribute("data-src") || qParams.get("src") || "";
    const enableSeo = (hostEl.getAttribute("data-seo") || qParams.get("seo")) !== "false";
    const autoplayAttr = hostEl.getAttribute("data-autoplay") || qParams.get("autoplay");
    const autoplay = autoplayAttr !== "false";

    const shadow = hostEl.attachShadow({ mode: "open" });
    const styleEl = document.createElement("style");
    styleEl.textContent = WIDGET_STYLES;
    shadow.appendChild(styleEl);

    const loader = document.createElement("div");
    loader.style.cssText = "padding:24px;text-align:center;color:#5d676e;font-size:13.5px;";
    loader.textContent = "Loading verified eBay reviews...";
    shadow.appendChild(loader);

    fetchReviewsData(customSrc)
      .then((data) => {
        loader.remove();
        if (enableSeo && data.store) injectSeoJsonLd(data.store);

        const opts = { limit, productSlug, theme, autoplay };
        if (layout === "showcase") {
          renderShowcaseInto(shadow, data, opts);
        } else if (layout === "badge") {
          renderBadgeInto(shadow, data, opts);
        } else {
          renderCarouselInto(shadow, data, opts);
        }
      })
      .catch((err) => {
        loader.innerHTML = `<a href="https://www.ebay.com/fdbk/feedback_profile/healthylineoutlet" target="_blank" rel="noopener" style="color:#3b626b;font-weight:600;text-decoration:underline;">View HealthyLine Outlet's 1,077+ Verified Reviews (100% Positive) on eBay &rarr;</a>`;
        console.warn("[HLO eBay Widget] Failed to load reviews JSON:", err);
      });
  }

  function initAll() {
    let targets = document.querySelectorAll("#hlo-ebay-reviews, .hlo-ebay-reviews");
    // Universal 1-Line Embed: if user only pasted <script src=".../widget.js" defer></script> without a <div>,
    // automatically create the container right before the <script> tag!
    if (targets.length === 0 && SCRIPT_EL && SCRIPT_EL.parentNode) {
      const autoDiv = document.createElement("div");
      autoDiv.className = "hlo-ebay-reviews";
      SCRIPT_EL.parentNode.insertBefore(autoDiv, SCRIPT_EL);
      targets = [autoDiv];
    }
    targets.forEach(mountContainer);
  }

  window.HLOEbayReviewsInit = initAll;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
