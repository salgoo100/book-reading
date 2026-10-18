"""Codex가 만든 PNG를 웹용 WebP로 줄이고 원본은 images/_original/ 로 옮긴다.
사용법: python tools/convert_images.py            # 전체
       python tools/convert_images.py cinderella # 특정 이야기만 (다른 Codex 작업이 진행 중일 때)
"""
import glob, os, shutil, sys
from PIL import Image

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "images")
for p in sorted(glob.glob(os.path.join(root, "*", "*.png"))):
    story = os.path.basename(os.path.dirname(p))
    if story == "_original" or (sys.argv[1:] and story not in sys.argv[1:]):
        continue
    im = Image.open(p).convert("RGB")
    im.thumbnail((1200, 1200))
    out = p[:-4] + ".webp"
    im.save(out, "WEBP", quality=80, method=6)
    dest = os.path.join(root, "_original", story)
    os.makedirs(dest, exist_ok=True)
    shutil.move(p, os.path.join(dest, os.path.basename(p)))
    print(f"{story}/{os.path.basename(out)}  {os.path.getsize(out)//1024} KB")
