#!/usr/bin/env python3
"""Generate color fingerprints for all comic covers using concurrent downloads."""

import json, os, sys, time
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from PIL import Image

GRID_SIZE = 8
TIMEOUT = 8
HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}

def download_and_fingerprint(url):
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        img = Image.open(BytesIO(resp.content)).convert('RGB')
        w, h = img.size
        dim = min(w, h)
        left, top = (w - dim) // 2, (h - dim) // 2
        img = img.crop((left, top, left + dim, top + dim))
        img = img.resize((GRID_SIZE, GRID_SIZE), Image.LANCZOS)
        pixels = list(img.getdata())
        return [c for rgb in pixels for c in rgb]
    except:
        return None

def make_slug(title):
    slug = title.lower()
    for ch in ' #:\'",!?&()[]{}—–-/':
        slug = slug.replace(ch, '-')
    while '--' in slug:
        slug = slug.replace('--', '-')
    return slug.strip('-')

def main():
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    with open('data/issues.json') as f:
        data = json.load(f)
    with open('variants.json') as f:
        variants_data = json.load(f)

    cover_map = data.get('coverMap', {})
    title_to_slug = {issue['title']: make_slug(issue['title']) for issue in data.get('issues', [])}

    # Build all jobs: (slug, key, url)
    jobs = []
    for title, url in cover_map.items():
        slug = title_to_slug.get(title, make_slug(title))
        jobs.append((slug, 'a', url))

    for slug, variants in variants_data.items():
        for idx, v in enumerate(variants):
            if v.get('url'):
                jobs.append((slug, f'v{idx}', v['url']))

    print(f"Processing {len(jobs)} cover images with 20 threads...")
    fingerprints = {}
    ok = 0
    fail = 0

    with ThreadPoolExecutor(max_workers=20) as pool:
        futures = {pool.submit(download_and_fingerprint, url): (slug, key) for slug, key, url in jobs}
        for future in as_completed(futures):
            slug, key = futures[future]
            fp = future.result()
            if fp:
                if slug not in fingerprints:
                    fingerprints[slug] = {}
                fingerprints[slug][key] = fp
                ok += 1
            else:
                fail += 1
            if (ok + fail) % 100 == 0:
                print(f"  {ok + fail}/{len(jobs)} done ({ok} ok, {fail} failed)")

    print(f"\nDone: {ok} ok, {fail} failed")
    print(f"Issues with fingerprints: {len(fingerprints)}")

    with open('cover-fingerprints.json', 'w') as f:
        json.dump(fingerprints, f, separators=(',', ':'))

    size_kb = os.path.getsize('cover-fingerprints.json') / 1024
    print(f"Saved cover-fingerprints.json ({size_kb:.1f} KB)")

if __name__ == '__main__':
    main()
