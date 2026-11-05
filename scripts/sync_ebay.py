#!/usr/bin/env python3
"""
Automatic eBay -> GitHub Pages Sync for HealthyLine Outlet (healthylineoutlet).

Runs daily via GitHub Actions (.github/workflows/sync-reviews.yml).
Supports:
  1. Long-lived OAuth Refresh Token (recommended, lasts 18 months):
       EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, EBAY_REFRESH_TOKEN
  2. Or direct OAuth User Token (for one-off full backfill):
       EBAY_OAUTH_TOKEN

Note: eBay's GetFeedback API allows querying ANY public seller username
(<UserID>healthylineoutlet</UserID>) using your own free developer account,
or using the seller's own account (which also unlocks private-listing ItemTitles).
"""
import base64
import datetime as dt
import hashlib
import json
import os
import pathlib
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
REVIEWS_JSON = ROOT / "data" / "reviews.json"
SELLER_USERNAME = os.getenv("EBAY_SELLER_USERNAME", "healthylineoutlet")
WC_STORE_API = "https://healthylineoutlet.com/wp-json/wc/store/v1/products"

AUTOMATED_PHRASES = {
    "order delivered on time with no issues",
}


def get_access_token() -> str:
    direct = os.getenv("EBAY_OAUTH_TOKEN", "").strip()
    if direct:
        return direct

    client_id = os.getenv("EBAY_CLIENT_ID", "").strip()
    client_secret = os.getenv("EBAY_CLIENT_SECRET", "").strip()
    refresh_token = os.getenv("EBAY_REFRESH_TOKEN", "").strip()
    if not (client_id and client_secret and refresh_token):
        return ""

    basic = base64.b64encode(f"{client_id}:{client_secret}".encode("utf-8")).decode("ascii")
    body = urllib.parse.urlencode(
        {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "scope": "https://api.ebay.com/oauth/api_scope",
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        "https://api.ebay.com/identity/v1/oauth2/token",
        data=body,
        headers={
            "Authorization": f"Basic {basic}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return payload["access_token"]


def fetch_wc_catalog() -> list[dict]:
    catalog = []
    for page in range(1, 8):
        url = f"{WC_STORE_API}?per_page=20&page={page}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 HLO-Sync/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                items = json.loads(resp.read().decode("utf-8"))
        except Exception:
            break
        if not items:
            break
        for p in items:
            name = p.get("name", "")
            if any(s in name.lower() for s in ("shipping charge", "adjustment", "signature confirmation")):
                continue
            catalog.append(
                {
                    "id": p["id"],
                    "name": name,
                    "slug": p["slug"],
                    "sku": p.get("sku", ""),
                    "permalink": p["permalink"],
                    "thumbnail": p["images"][0]["thumbnail"] if p.get("images") else "",
                    "price": int(p["prices"]["price"]) / 100.0 if p.get("prices", {}).get("price") else None,
                }
            )
        if len(items) < 20:
            break
    return catalog


def detect_tags(text: str) -> list[str]:
    t = text.lower()
    tags = []
    if any(w in t for w in ("pain", "heal", "sciatic", "arthritis", "fibro", "scoliosis", "sleep", "slept", "rest", "detox", "trigger", "back", "relief", "releif")):
        tags.append("Pain Relief & Sleep")
    if any(w in t for w in ("like new", "brand new", "plastic", "condition", "clean", "packaged", "packaging", "box")):
        tags.append("Like-New Condition")
    if any(w in t for w in ("fast", "quick", "speedy", "48 hours", "early", "record time", "shipping", "delivery", "expeditiously")):
        tags.append("Fast Shipping")
    if any(w in t for w in ("communication", "service", "support", "called", "questions", "helpful", "responsive", "addressed")):
        tags.append("Customer Support")
    if any(w in t for w in ("pemf", "infrared", "fir", "taj", "mesh", "rainbow", "platinum", "crystal", "gemstone", "heat")):
        tags.append("PEMF & Infrared")
    return tags or ["Verified Buyer"]


def match_product(text: str, item_title: str, catalog_by_slug: dict) -> dict | None:
    hay = f"{item_title or ''} {text or ''}".lower()
    rules = [
        ("rainbow", "rainbow-chakra-mat"),
        ("taj", "taj-mat"),
        ("4018", "tao-4018-chair-best-deal"),
        ("chair", "tao-4018-chair-best-deal"),
        ("american choice", "american-choice-7428-mat-best-deal"),
        ("7428", "american-choice-7428-mat-best-deal"),
        ("mesh", "mesh-jt-mat"),
        ("platinum", "platinum-mat"),
        ("soft mat", "soft-mat"),
        ("jet mat", "jet-mat"),
        ("tao", "tao-mat"),
        ("portable", "portable-heated-gemstone-pads-with-power-bank"),
        ("1818", "amethyst-far-nfrared-heating-pad"),
    ]
    for kw, slug in rules:
        if kw in hay and slug in catalog_by_slug:
            p = catalog_by_slug[slug]
            return {
                "name": p["name"],
                "slug": p["slug"],
                "url": p["permalink"],
                "thumbnail": p["thumbnail"],
            }
    return None


def format_relative_period(iso_str: str) -> str:
    if not iso_str:
        return "Verified Purchase"
    try:
        dt_val = dt.datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        days = (dt.datetime.now(dt.timezone.utc) - dt_val).days
        if days <= 35:
            return "Past month"
        if days <= 185:
            return "Past 6 months"
        if days <= 370:
            return "Past year"
        return dt_val.strftime("%b %Y")
    except Exception:
        return "Verified Purchase"


def fetch_ebay_feedback_pages(token: str, max_pages: int = 10) -> tuple[dict, list[dict]]:
    ns = {"e": "urn:ebay:apis:eBLBaseComponents"}
    entries = []
    summary = {}

    for page_num in range(1, max_pages + 1):
        xml_body = f"""<?xml version="1.0" encoding="utf-8"?>
<GetFeedbackRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <UserID>{SELLER_USERNAME}</UserID>
  <FeedbackType>FeedbackReceivedAsSeller</FeedbackType>
  <DetailLevel>ReturnAll</DetailLevel>
  <Pagination>
    <EntriesPerPage>200</EntriesPerPage>
    <PageNumber>{page_num}</PageNumber>
  </Pagination>
</GetFeedbackRequest>""".encode("utf-8")

        req = urllib.request.Request(
            "https://api.ebay.com/ws/api.dll",
            data=xml_body,
            headers={
                "X-EBAY-API-IAF-TOKEN": token,
                "X-EBAY-API-COMPATIBILITY-LEVEL": "1231",
                "X-EBAY-API-CALL-NAME": "GetFeedback",
                "X-EBAY-API-SITEID": "0",
                "Content-Type": "text/xml; charset=utf-8",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw_xml = resp.read()

        root = ET.fromstring(raw_xml)
        ack = root.findtext("e:Ack", default="", namespaces=ns)
        if ack not in ("Success", "Warning"):
            err_msg = root.findtext(".//e:LongMessage", default="Unknown eBay API error", namespaces=ns)
            raise RuntimeError(f"eBay GetFeedback failed: {err_msg}")

        if page_num == 1:
            score = root.findtext("e:FeedbackScore", default="", namespaces=ns)
            total_entries = root.findtext("e:PaginationResult/e:TotalNumberOfEntries", default="", namespaces=ns)
            if score.isdigit():
                summary["feedback_score"] = int(score)
            if total_entries.isdigit():
                summary["total_seller_reviews"] = int(total_entries)

        details = root.findall("e:FeedbackDetailArray/e:FeedbackDetail", namespaces=ns)
        if not details:
            break

        for d in details:
            comment_type = d.findtext("e:CommentType", default="", namespaces=ns)
            if comment_type != "Positive":
                continue
            text = (d.findtext("e:CommentText", default="", namespaces=ns) or "").strip()
            if not text or text.lower() in AUTOMATED_PHRASES:
                continue

            fid = d.findtext("e:FeedbackID", default="", namespaces=ns)
            buyer = d.findtext("e:CommentingUser", default="Verified eBay Buyer", namespaces=ns)
            ctime = d.findtext("e:CommentTime", default="", namespaces=ns)
            reply = d.findtext("e:FeedbackResponse", default="", namespaces=ns)
            item_title = d.findtext("e:ItemTitle", default="", namespaces=ns)

            entries.append(
                {
                    "feedback_id": fid,
                    "text": text,
                    "buyer": buyer,
                    "comment_time": ctime,
                    "seller_reply": reply or None,
                    "item_title": item_title or None,
                }
            )

        total_pages = int(root.findtext("e:PaginationResult/e:TotalNumberOfPages", default="1", namespaces=ns))
        if page_num >= total_pages:
            break

    return summary, entries


def main() -> int:
    existing = json.loads(REVIEWS_JSON.read_text(encoding="utf-8"))

    token = get_access_token()
    if not token:
        print(
            "[sync_ebay] No EBAY_OAUTH_TOKEN or EBAY_REFRESH_TOKEN secret configured yet. "
            "Keeping existing data/reviews.json untouched."
        )
        return 0

    print(f"[sync_ebay] Syncing live feedback for '{SELLER_USERNAME}' from eBay Trading API...")
    catalog = fetch_wc_catalog() or existing.get("catalog", [])
    catalog_by_slug = {p["slug"]: p for p in catalog}

    summary, api_entries = fetch_ebay_feedback_pages(token)
    print(f"[sync_ebay] Retrieved {len(api_entries)} positive written reviews from eBay API.")

    by_text_key = {}
    for r in existing.get("reviews", []):
        key = r["text"].strip().lower()[:120]
        by_text_key[key] = r

    added = 0
    merged = []
    seen_keys = set()

    for entry in api_entries:
        key = entry["text"].strip().lower()[:120]
        if key in seen_keys:
            continue
        seen_keys.add(key)

        if key in by_text_key:
            merged.append(by_text_key[key])
        else:
            rid = "ebay-" + (
                entry["feedback_id"]
                or hashlib.md5((entry["text"] + entry["buyer"]).encode("utf-8")).hexdigest()[:10]
            )
            merged.append(
                {
                    "id": rid,
                    "rating": 5,
                    "text": entry["text"],
                    "buyer": entry["buyer"],
                    "verified": True,
                    "period": format_relative_period(entry["comment_time"]),
                    "tags": detect_tags(entry["text"]),
                    "photo": None,
                    "seller_reply": entry["seller_reply"],
                    "item_title": entry["item_title"],
                    "product": match_product(entry["text"], entry["item_title"] or "", catalog_by_slug),
                    "featured": False,
                }
            )
            added += 1

    # Preserve any curated reviews not in the latest window
    for key, old_r in by_text_key.items():
        if key not in seen_keys:
            merged.append(old_r)

    existing["store"].update(summary)
    existing["store"]["last_synced"] = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    existing["catalog"] = catalog
    existing["reviews"] = merged

    REVIEWS_JSON.write_text(json.dumps(existing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[sync_ebay] Done! Added {added} new reviews (total stored: {len(merged)}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
