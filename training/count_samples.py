import os
from collections import Counter

import pandas as pd

IMG_EXT = (".jpg", ".jpeg", ".png", ".bmp")


def count_folder(root):
    """Count images per class folder, handling train/test subfolders."""
    total = Counter()
    for split in sorted(os.listdir(root)):
        split_path = os.path.join(root, split)
        if not os.path.isdir(split_path):
            continue
        for cls in sorted(os.listdir(split_path)):
            cls_path = os.path.join(split_path, cls)
            if os.path.isdir(cls_path):
                n = sum(f.lower().endswith(IMG_EXT) for f in os.listdir(cls_path))
                print(f"  {split}/{cls}: {n}")
                total[cls] += n
    return total


def count_recursive(root):
    """Count images in every folder, whatever the layout."""
    counts = Counter()
    for dirpath, _, files in os.walk(root):
        n = sum(f.lower().endswith(IMG_EXT) for f in files)
        if n:
            rel = os.path.relpath(dirpath, root)
            print(f"  {rel}: {n}")
            counts[rel] += n
    return counts


for name in ("data/burns", "data/burns_sorted"):
    print(f"=== {name} ===")
    c = count_recursive(name)
    print(f"{name} total:", sum(c.values()))
    print()

print("=== DermNet (merged, 11 classes) ===")
derm = count_folder("data/dermnet_merged")
print("DermNet merged total:", sum(derm.values()), "| classes:", len(derm))

print("\n=== HAM10000 ===")
df = pd.read_csv("data/ham10000/HAM10000_metadata.csv")
print("HAM10000 total:", len(df), "| classes:", df["dx"].nunique())
print("Unique lesions:", df["lesion_id"].nunique())