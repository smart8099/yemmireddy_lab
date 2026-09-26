"""Import publications from a Google Scholar profile into src/content/publications.

Usage:
    python3 scripts/import-content/import_scholar.py mpOZAYAAAAAJ
    python3 scripts/import-content/import_scholar.py mpOZAYAAAAAJ --cache /tmp/scholar.json

Existing files are never overwritten, so it is safe to re-run to pick up new
papers; anything edited in the admin panel is preserved. Review new files
before committing: Scholar data is sometimes incomplete or duplicated.
Scholar has no API and rate-limits scrapers; requests are spaced out.
"""
import argparse, html, json, pathlib, re, time, urllib.request

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
OUT = pathlib.Path(__file__).resolve().parents[2] / "src/content/publications"

# Scholar entries to leave out (duplicates, proposals). Matched against the title start.
SKIP = [
    "CPS 2019 Agricultural Water Treatment RFP",
]

JOURNALS = {
    "food control": "Food Control",
    "international journal of food microbiology": "International Journal of Food Microbiology",
    "journal of food safety": "Journal of Food Safety",
    "journal of integrative agriculture": "Journal of Integrative Agriculture",
    "lwt": "LWT – Food Science and Technology",
    "lwt food science and technology": "LWT – Food Science and Technology",
    "lwt-food science and technology": "LWT – Food Science and Technology",
    "plos one": "PLOS ONE",
}

TYPES = {  # title start -> (type, venue)
    "Efficacy of Photocatalytic Nanocoatings on Food Contact Surfaces": ("Thesis", "Ph.D. dissertation, University of Georgia"),
    "Develop rapid drying technologies": ("Thesis", "Thesis, University of Georgia"),
    "Agriculture Water Treatment": ("Report", "Center for Produce Safety"),
    "Exploring Xenophagy": ("Conference", None),
}

clean = lambda x: html.unescape(re.sub(r"<[^>]+>", "", x)).strip()


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8")


def fetch(user):
    s = get(f"https://scholar.google.com/citations?user={user}&hl=en&cstart=0&pagesize=100&sortby=pubdate")
    rows = []
    for r in re.findall(r'<tr class="gsc_a_tr">(.*?)</tr>', s, re.S):
        link = html.unescape(re.search(r'href="([^"]+)" class="gsc_a_at"', r).group(1))
        time.sleep(4)
        d = get("https://scholar.google.com" + link)
        if "gsc_oci_title" not in d:
            raise SystemExit("Scholar blocked the request; try again later or use --cache.")
        fields = {clean(f): clean(v) for f, v in re.findall(r'<div class="gsc_oci_field">(.*?)</div><div class="gsc_oci_value"[^>]*>(.*?)</div>', d, re.S)}
        m = re.search(r'class="gsc_oci_title_link" href="([^"]+)"', d)
        rows.append({
            "full_title": clean(re.search(r'id="gsc_oci_title"[^>]*>(.*?)</div>', d, re.S).group(1)),
            "fields": fields,
            "href": html.unescape(m.group(1)) if m else None,
        })
        print("fetched", rows[-1]["full_title"][:70])
    return rows


def q(v):
    return json.dumps(v, ensure_ascii=False)  # JSON strings are valid YAML scalars


def slug(title, year):
    words = re.sub(r"[^a-z0-9]+", " ", title.lower()).split()[:8]
    return f"{year}-{'-'.join(words)}"


def convert(rows):
    seen, out = set(), []
    # When Scholar lists a paper twice, keep the copy with the most complete data.
    rows = sorted(rows, key=lambda p: -(len(p["fields"]) + 5 * bool(p["fields"].get("Journal"))))
    for p in rows:
        f, title = p["fields"], p["full_title"]
        title = re.sub(r"\bsalmonella\b", "Salmonella", title)
        key = re.sub(r"[^a-z]", "", title.lower())[:60]
        year = (f.get("Publication date") or "")[:4]
        if key in seen or not year or any(title.startswith(s) for s in SKIP):
            continue
        seen.add(key)

        venue = f.get("Journal") or f.get("Source") or f.get("Conference") or f.get("Book") or ""
        pages = f.get("Pages", "")
        doi = None
        m = re.match(r"(.+?)\s+(\d+)\((\d+)\):\s*(\S+)$", venue)  # "Journal 80(8): N1903-N1911"
        if m:
            venue, f["Volume"], f["Issue"], pages = m.groups()
        if pages.lower().startswith("doi:"):
            doi, pages = pages[4:].strip(), ""
        venue = JOURNALS.get(venue.lower(), venue)
        kind = "Journal article" if venue else "Other"
        for start, (t, v) in TYPES.items():
            if title.startswith(start):
                kind, venue = t, v or venue
        href = p.get("href") or ""
        m = re.search(r"(10\.\d{4,9}/[^\s?#&]+)", href)
        if m and not doi:
            doi = m.group(1).rstrip("/")
        out.append({
            "title": title,
            "authors": f.get("Authors", ""),
            "venue": venue or None,
            "volume": f.get("Volume"),
            "issue": f.get("Issue"),
            "pages": pages or None,
            "year": int(year),
            "type": kind,
            "doi": doi,
            "url": None if doi else (href or None),
        })
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("user", help="Scholar user id, e.g. mpOZAYAAAAAJ")
    ap.add_argument("--cache", help="JSON file to read/write fetched data")
    a = ap.parse_args()
    cache = pathlib.Path(a.cache) if a.cache else None
    if cache and cache.exists():
        rows = json.loads(cache.read_text())
    else:
        rows = fetch(a.user)
        if cache:
            cache.write_text(json.dumps(rows, indent=1))
    OUT.mkdir(parents=True, exist_ok=True)
    existing = {re.sub(r"[^a-z]", "", (re.search(r"^title: (.*)$", f.read_text(), re.M) or [None, ""])[1].lower().strip('"'))[:60] for f in OUT.glob("*.yml")}
    written = 0
    for pub in convert(rows):
        if re.sub(r"[^a-z]", "", pub["title"].lower())[:60] in existing:
            continue
        lines = [f"{k}: {q(v)}" for k, v in pub.items() if v not in (None, "")]
        (OUT / f"{slug(pub['title'], pub['year'])}.yml").write_text("\n".join(lines) + "\n")
        written += 1
    print(f"wrote {written} new publication(s) to {OUT}")


if __name__ == "__main__":
    main()
