import hashlib
import os
import shutil
from collections import Counter, defaultdict
from pathlib import Path

SRC = "data/dermnet_merged"
DST = "data/dermnet_clean"
IMG_EXT = (".jpg", ".jpeg", ".png", ".bmp")

# hash -> list of (split, class, path)
items = defaultdict(list)
for split in ("train", "test"):
    split_dir = os.path.join(SRC, split)
    for cls in sorted(os.listdir(split_dir)):
        cls_dir = os.path.join(split_dir, cls)
        if not os.path.isdir(cls_dir):
            continue
        for f in sorted(os.listdir(cls_dir)):
            if f.lower().endswith(IMG_EXT):
                path = os.path.join(cls_dir, f)
                with open(path, "rb") as fh:
                    digest = hashlib.md5(fh.read()).hexdigest()
                items[digest].append((split, cls, path))

if os.path.exists(DST):
    shutil.rmtree(DST)

counts = Counter()
conflicts = 0   # same image under two different classes: ambiguous, dropped
in_both = 0     # same image in train and test: kept in train only

for digest, entries in items.items():
    classes = {c for _, c, _ in entries}
    if len(classes) > 1:
        conflicts += 1
        continue
    cls = classes.pop()
    splits = {s for s, _, _ in entries}
    if len(splits) > 1:
        in_both += 1
    split = "train" if "train" in splits else "test"
    src = entries[0][2]
    out_dir = os.path.join(DST, split, cls)
    os.makedirs(out_dir, exist_ok=True)
    shutil.copy2(src, os.path.join(out_dir, digest + Path(src).suffix.lower()))
    counts[(split, cls)] += 1

print("Unique images in source:", len(items))
print("Dropped (conflicting class labels):", conflicts)
print("Images that were in both train and test (kept in train):", in_both)
print()
for split in ("train", "test"):
    total = sum(v for (s, _), v in counts.items() if s == split)
    print(f"{split}: {total}")
    for (s, cls), v in sorted(counts.items()):
        if s == split:
            print(f"   {cls}: {v}")