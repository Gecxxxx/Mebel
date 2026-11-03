"""Prepare responsive, metadata-free WebP copies of client photographs.

Usage: python scripts/import-client-works.py <source-folder>
Only orientation, downsampling and format conversion are applied; no retouching.
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
numbers = [2, 3, 7, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22,
           23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
           38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
           53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67]
output = root / 'public/assets/works'
output.mkdir(parents=True, exist_ok=True)
photos = {}
for number in numbers:
    file = next(source.glob(f'photo_{number}_*'))
    with Image.open(file) as original:
        picture = ImageOps.exif_transpose(original).convert('RGB')
        widths = sorted(set(min(width, picture.width) for width in (480, 960, 1600)))
        variants = []
        for width in widths:
            height = round(picture.height * width / picture.width)
            name = f'work-{number:02d}-{width}.webp'
            picture.resize((width, height), Image.Resampling.LANCZOS).save(
                output / name, 'WEBP', quality=86, method=6)
            variants.append({'width': width, 'height': height, 'image': f'works/{name}'})
        preferred = next((v for v in variants if v['width'] >= 960), variants[-1])
        photos[str(number)] = {
            'source': file.name, 'width': picture.width, 'height': picture.height,
            'image': preferred['image'], 'variants': variants,
        }
(root / 'src/data/work-photo-sources.json').write_text(
    json.dumps(photos, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Prepared {len(photos)} photographs, {sum(len(p["variants"]) for p in photos.values())} responsive files.')
