"""
Reorganizes the DermNet dataset from its original 18 fine-grained
categories into 11 broader, more visually distinguishable groups.

This creates a NEW folder structure at data/dermnet_merged/, leaving
the original data/dermnet/ untouched.

Input:  data/dermnet/train/<18 folders>/, data/dermnet/test/<18 folders>/
Output: data/dermnet_merged/train/<11 folders>/, data/dermnet_merged/test/<11 folders>/
"""

import shutil
from pathlib import Path

SOURCE_BASE = Path("data/dermnet")
DEST_BASE = Path("data/dermnet_merged")

# Maps: new merged category -> list of original folder names to combine
CATEGORY_MAP = {
    "Acne and Rosacea": [
        "Acne and Rosacea Photos",
    ],
    "Eczema and Dermatitis": [
        "Atopic Dermatitis Photos",
        "Eczema Photos",
        "Poison Ivy Photos and other Contact Dermatitis",
    ],
    "Skin Infections Bacterial Fungal Parasitic": [
        "Cellulitis Impetigo and other Bacterial Infections",
        "Nail Fungus and other Nail Disease",
        "Scabies Lyme Disease and other Infestations and Bites",
    ],
    "Viral Skin Infections": [
        "Herpes HPV and other STDs Photos",
    ],
    "Precancerous and Cancerous Lesions": [
        "Actinic Keratosis Basal Cell Carcinoma and other Malignant Lesions",
        "Melanoma Skin Cancer Nevi and Moles",
    ],
    "Benign Growths": [
        "Seborrheic Keratoses and other Benign Tumors",
    ],
    "Autoimmune and Systemic Conditions": [
        "Lupus and other Connective Tissue diseases",
        "Systemic Disease",
    ],
    "Psoriasis and Related Disorders": [
        "Psoriasis pictures Lichen Planus and related diseases",
    ],
    "Pigmentation Disorders": [
        "Light Diseases and Disorders of Pigmentation",
    ],
    "Drug Reactions and Blistering Conditions": [
        "Exanthems and Drug Eruptions",
        "Bullous Disease Photos",
    ],
    "Hair and Scalp Disorders": [
        "Hair Loss Photos Alopecia and other Hair Diseases",
    ],
}


def reorganize_split(split_name):
    """Reorganize one split (train or test)."""
    source_split = SOURCE_BASE / split_name
    dest_split = DEST_BASE / split_name

    print(f"\n--- Processing {split_name} split ---")

    for new_category, original_folders in CATEGORY_MAP.items():
        dest_folder = dest_split / new_category
        dest_folder.mkdir(parents=True, exist_ok=True)

        total_copied = 0
        for original_folder in original_folders:
            source_folder = source_split / original_folder

            if not source_folder.exists():
                print(f"  WARNING: source folder not found: {source_folder}")
                continue

            image_files = list(source_folder.glob("*"))
            for img_path in image_files:
                if img_path.is_file():
                    dest_path = dest_folder / img_path.name
                    # Avoid name collisions when merging multiple folders
                    if dest_path.exists():
                        dest_path = dest_folder / f"{img_path.stem}_{original_folder[:10]}{img_path.suffix}"
                    shutil.copy2(img_path, dest_path)
                    total_copied += 1

        print(f"  {new_category}: {total_copied} images")


def main():
    reorganize_split("train")
    reorganize_split("test")
    print("\nDone! Merged dataset created at data/dermnet_merged/")


if __name__ == "__main__":
    main()