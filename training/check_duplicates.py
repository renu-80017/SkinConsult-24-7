import hashlib
import os
from collections import defaultdict

ROOT = "data/dermnet_merged"
IMG_EXT = (".jpg", ".jpeg", ".png", ".bmp")

hashes = defaultdict(list)
for dirpath, _, files in os.walk(ROOT):
    for f in files:
        if f.lower().endswith(IMG_EXT):
            path = os.path.join(dirpath, f)
            with open(path, "rb") as fh:
                hashes[hashlib.md5(fh.read()).hexdigest()].append(path)

total = sum(len(v) for v in hashes.values())
dupes = {h: p for h, p in hashes.items() if len(p) > 1}

cross = 0
for paths in dupes.values():
    splits = {os.path.relpath(p, ROOT).split(os.sep)[0] for p in paths}
    if len(splits) > 1:
        cross += 1

print("Total files:", total)
print("Unique images:", len(hashes))
print("Duplicate groups:", len(dupes))
print("Images shared between train and test:", cross)