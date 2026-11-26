#!/usr/bin/env python3
"""Fetch live deals from public deal-site RSS feeds and write assets/live-feed.json.

Runs on a schedule in GitHub Actions (.github/workflows/live-feed.yml).
Uses only the feeds these sites publish for readers, not page scraping.
Items that look like the same product at the same price are grouped together.
"""
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

FEEDS = [
    ("Slickdeals", "https://slickdeals.net/newsearch.php?mode=frontpage&searcharea=deals&searchin=first&rss=1"),
    ("DealNews", "https://www.dealnews.com/?rss=1"),
]
UA = "turkey-to-toast/1.0 (+https://github.com/AravindB98/turkey-to-toast)"
OUT = Path(__file__).resolve().parent.parent / "assets" / "live-feed.json"
MAX_ITEMS = 80
STOP = set("the a an and or for with w/ of to in on at by + free shipping s&h ship sh pickup prime".split())


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/xml"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def price_of(title):
    m = re.search(r"\$\s?([\d,]+(?:\.\d{1,2})?)", title)
    return float(m.group(1).replace(",", "")) if m else None


def tokens(title):
    t = re.sub(r"\$\s?[\d,.]+", " ", title.lower())
    t = re.sub(r"[^a-z0-9 ]+", " ", t)
    return {w for w in t.split() if w not in STOP and len(w) > 1}


def parse(source, xml_bytes):
    root = ET.fromstring(xml_bytes)
    items = []
    for it in root.iter("item"):
        title = (it.findtext("title") or "").strip()
        link = (it.findtext("link") or "").strip()
        if not title or not link.startswith("https://"):
            continue
        try:
            when = parsedate_to_datetime(it.findtext("pubDate") or "").astimezone(timezone.utc)
        except (TypeError, ValueError):
            when = datetime.now(timezone.utc)
        cats = [c.text.strip() for c in it.findall("category") if c.text and c.text.strip() != "Frontpage Deals"]
        items.append({
            "title": title,
            "url": link,
            "source": source,
            "price": price_of(title),
            "category": cats[0] if cats else "",
            "published": when.strftime("%Y-%m-%dT%H:%M:%SZ"),
        })
    return items


def group_same(items):
    """Merge items that are the same product at the same price, keeping every link."""
    groups = []
    for it in items:
        tk = tokens(it["title"])
        for g in groups:
            if it["price"] is not None and g["price"] == it["price"]:
                inter = len(tk & g["_tk"])
                union = len(tk | g["_tk"]) or 1
                if inter / union >= 0.6:
                    g["offers"].append({"source": it["source"], "url": it["url"]})
                    break
        else:
            g = dict(it)
            g["_tk"] = tk
            g["offers"] = [{"source": it["source"], "url": it["url"]}]
            groups.append(g)
    for g in groups:
        del g["_tk"]
    return groups


def main():
    items, errors = [], []
    for source, url in FEEDS:
        try:
            items.extend(parse(source, fetch(url)))
        except Exception as e:  # keep going if one feed is down
            errors.append(f"{source}: {e}")
    if not items:
        print("No feed items fetched; leaving the existing file alone.", errors, file=sys.stderr)
        return 0
    items.sort(key=lambda i: i["published"], reverse=True)
    grouped = group_same(items)[:MAX_ITEMS]
    data = {
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "sources": [s for s, _ in FEEDS],
        "items": grouped,
    }
    if OUT.exists():
        try:
            if json.loads(OUT.read_text(encoding="utf-8")).get("items") == grouped:
                print("Feed unchanged; not rewriting.")
                return 0
        except ValueError:
            pass
    OUT.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(grouped)} items ({len(items)} raw) to {OUT}", "errors:" if errors else "", *errors)
    return 0


if __name__ == "__main__":
    sys.exit(main())
