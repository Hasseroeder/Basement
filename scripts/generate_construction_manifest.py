#!/usr/bin/env python3
import json
import os
from pathlib import Path

# point this at your media folder
media_dir = Path(__file__).resolve().parent.parent / "media" / "construction"

files = []
for root, dirs, filenames in os.walk(media_dir):
    for fname in filenames:
        # build path *relative* to media_dir
        rel = Path(root, fname).relative_to(media_dir).as_posix()
        files.append(rel)

files.sort()

out_path = media_dir / "construction-list.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(files, f, indent=4)

print(f"✅ Generated list.json with {len(files)} files")
