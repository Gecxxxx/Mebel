"""Normalize an explicitly supplied public Tilda export. No credentials or customer data."""
from pathlib import Path
from PIL import Image, ImageOps
from io import BytesIO
from html import unescape
import json, re, urllib.request, concurrent.futures, hashlib, time

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'import-2026-10-30'
TARGET = ROOT / 'public/assets/catalog'
TARGET.mkdir(parents=True, exist_ok=True)

def clean(value):
    return re.sub(r'\s+', ' ', unescape(re.sub(r'<[^>]+>', ' ', str(value or '')))).strip()

def number(value):
    try: return float(re.sub(r'\s+', '', str(value)).replace(',', '.'))
    except ValueError: return 0

raw = {}
memberships = {}
for name, category in [('stoly', 'stoly'), ('stulya', 'stulya'), ('obedennyye_gruppy', 'obedennye-gruppy')]:
    file = next(SOURCE.glob(name + '-*.json'))
    for p in json.loads(file.read_text(encoding='utf-8'))['products']:
        uid = str(p['uid'])
        raw[uid] = p
        memberships.setdefault(uid, []).append(category)

images = {}
products = []
for uid, p in raw.items():
    if 'copy' in p.get('title', '').lower(): continue
    if p.get('title', '').lower().startswith('обувница'): continue
    title = re.sub(r'"([^"]+)"', r'«\1»', clean(p['title']))
    if title.lower().startswith(('стул', 'табурет')): category = 'stulya'
    elif title.lower().startswith('стол'): category = 'stoly'
    else: category = memberships[uid][-1]
    old_slug = p.get('url', '').rstrip('/').rsplit('/', 1)[-1]
    slug = re.sub(r'^\d+-\d+-', '', old_slug) or uid
    if slug == 'copy': slug = 'model-' + uid
    gallery = json.loads(p.get('gallery') or '[]')
    selected = [g['img'] for g in gallery if g.get('img')][:3]
    local = []
    for url in selected:
        ext = Path(url.split('?')[0]).suffix.lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.webp']: ext = '.jpg'
        file = hashlib.sha256(url.encode()).hexdigest()[:18] + '.webp'
        images[url] = file
        local.append('catalog/' + file)
    options = json.loads(p.get('json_options') or '[]')
    options = [{'name': clean(o.get('title')), 'values': [clean(x) for x in o.get('values', [])]} for o in options if o.get('values')]
    editions = []
    for e in p.get('editions', []):
        values = {o['name']: clean(e.get(o['name'])) for o in options}
        editions.append({'id': str(e.get('uid', '')), 'values': values, 'price': number(e.get('price'))})
    prices = [e['price'] for e in editions if e['price'] > 0] or [number(p.get('price'))]
    specs = [{'name': clean(c['title']), 'value': clean(c['value'])} for c in p.get('characteristics', []) if clean(c.get('value'))]
    properties = [{'name': clean(c['title']), 'value': clean(c.get('values', ''))} for c in p.get('properties', []) if clean(c.get('values'))]
    products.append({
        'id': uid, 'slug': slug, 'name': title, 'category': category,
        'brand': clean(p.get('brand')), 'images': local, 'price': min(prices), 'maxPrice': max(prices),
        'collections': memberships[uid],
        'options': options, 'editions': editions, 'specs': specs, 'properties': properties,
        'sourceUrl': p.get('url'), 'sourceDate': '2026-10-30',
    })

def download(item):
    url, filename = item
    path = TARGET / filename
    if path.exists() and path.stat().st_size > 100: return None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=25) as response:
                data = response.read()
                if not response.headers.get('Content-Type', '').startswith('image/'): raise ValueError('Not an image')
            with Image.open(BytesIO(data)) as source_image:
                image = ImageOps.exif_transpose(source_image)
                if image.mode not in ('RGB', 'RGBA'): image = image.convert('RGBA' if 'transparency' in image.info else 'RGB')
                image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                image.save(path, 'WEBP', quality=86, method=5)
            return None
        except Exception as error:
            if attempt == 2: return {'url': url, 'error': str(error)}
            time.sleep(1)

failures = []
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
    for result in pool.map(download, images.items()):
        if result: failures.append(result)
if failures:
    print(json.dumps({'download_failures': failures}, ensure_ascii=True)); raise SystemExit(1)

slugs = [p['slug'] for p in products]
for p in products:
    if slugs.count(p['slug']) > 1: p['slug'] += '-' + p['id'][-6:]

(ROOT / 'src/data').mkdir(exist_ok=True)
(ROOT / 'src/data/catalog.json').write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding='utf-8')
manifest = {'importedAt': '2026-10-30', 'sources': ['https://stolyistulya48.ru/stoly', 'https://stolyistulya48.ru/stulya', 'https://stolyistulya48.ru/obedennyye_gruppy'], 'products': len(products), 'images': len(images), 'priceStatus': 'Source catalog reference; not confirmed current offers', 'bytes': sum((TARGET / name).stat().st_size for name in set(images.values()))}
(ROOT / 'src/data/catalog-provenance.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(manifest, ensure_ascii=True))
