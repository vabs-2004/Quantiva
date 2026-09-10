import os
import re

TARGET_DIRS = [r"d:\Learning\drdo\src", r"d:\Learning\drdo"]

FONT_REPLACEMENTS = {
    "text-2xl": "text-xl",
    "text-xl": "text-lg",
    "text-lg": "text-base",
    "text-base": "text-sm",
    "text-sm": "text-xs",
}

def process_file(filepath):
    if not (filepath.endswith(".jsx") or filepath.endswith(".js") or filepath.endswith(".html")):
        return

    if "index.css" in filepath or "theme_updater" in filepath or "vite.config.js" in filepath or "package" in filepath:
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # Careful to replace exactly
    for old, new in FONT_REPLACEMENTS.items():
        pattern = r'(?<![-a-zA-Z0-9])' + re.escape(old) + r'(?![-a-zA-Z0-9])'
        content = re.sub(pattern, new, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for target in TARGET_DIRS:
    for root, dirs, files in os.walk(target):
        if "node_modules" in root or "dist" in root:
            continue
        for file in files:
            process_file(os.path.join(root, file))

print("Done reducing fonts.")
