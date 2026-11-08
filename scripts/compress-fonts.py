"""Losslessly encode the approved local TTF fonts as WOFF2.

One-time tooling: python -m pip install 'fonttools[woff]'.
Original TTF sources are retained; normal website builds need no Python packages.
"""
from pathlib import Path
from fontTools.ttLib import TTFont

fonts = Path(__file__).resolve().parents[1] / 'public' / 'assets' / 'fonts'
for source in sorted(fonts.glob('*.ttf')):
    destination = source.with_suffix('.woff2')
    font = TTFont(source, recalcTimestamp=False)
    font.flavor = 'woff2'
    font.save(destination)
    restored = TTFont(destination)
    assert restored.getBestCmap() == font.getBestCmap(), source.name
    assert restored.getGlyphOrder() == font.getGlyphOrder(), source.name
    print(f'{source.name}: {source.stat().st_size} -> {destination.stat().st_size} bytes')
