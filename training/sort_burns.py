"""
Sorts the YOLO-format burn dataset (data/burns/) into class folders
for simple image classification training.

Classes: 0 = first_degree, 1 = second_degree, 2 = third_degree
"""

import os
import shutil
from pathlib import Path

# --- CONFIG ---
SOURCE_DIR = Path("data/burns")
DEST_DIR = Path("data/burns_sorted")

CLASS_MAP = {
    "0": "first_degree",
    "1": "second_degree",
    "2": "third_degree",
}

IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"]


def main():
    # Create destination folders
    for class_name in CLASS_MAP.values():
        (DEST_DIR / class_name).mkdir(parents=True, exist_ok=True)

    skipped_empty = 0
    skipped_no_image = 0
    skipped_unknown_class = 0
    sorted_count = 0

    txt_files = list(SOURCE_DIR.glob("*.txt"))
    print(f"Found {len(txt_files)} label files to process...")

    for txt_path in txt_files:
        stem = txt_path.stem  # e.g. "img1"

        # Read first line of label file to get class id
        with open(txt_path, "r") as f:
            first_line = f.readline().strip()

        if not first_line:
            skipped_empty += 1
            continue

        class_id = first_line.split()[0]

        if class_id not in CLASS_MAP:
            skipped_unknown_class += 1
            continue

        class_name = CLASS_MAP[class_id]

        # Find matching image file (could be .jpg or .jpeg)
        image_path = None
        for ext in IMAGE_EXTENSIONS:
            candidate = SOURCE_DIR / f"{stem}{ext}"
            if candidate.exists():
                image_path = candidate
                break

        if image_path is None:
            skipped_no_image += 1
            continue

        # Copy image into its class folder
        dest_path = DEST_DIR / class_name / image_path.name
        shutil.copy2(image_path, dest_path)
        sorted_count += 1

    print("\n--- Done ---")
    print(f"Sorted images:          {sorted_count}")
    print(f"Skipped (empty label):  {skipped_empty}")
    print(f"Skipped (no image):     {skipped_no_image}")
    print(f"Skipped (unknown class):{skipped_unknown_class}")

    print("\nPer-class counts:")
    for class_name in CLASS_MAP.values():
        count = len(list((DEST_DIR / class_name).glob("*")))
        print(f"  {class_name}: {count}")


if __name__ == "__main__":
    main()
