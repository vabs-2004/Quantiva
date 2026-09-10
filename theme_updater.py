import os
import re

TARGET_DIRS = [r"d:\Learning\drdo\src", r"d:\Learning\drdo"]

REPLACEMENTS = {
    "var(--color-drdo-navy-deep)": "var(--color-app-base)",
    "var(--color-drdo-navy)": "var(--color-app-surface)",
    "var(--color-drdo-navy-light)": "var(--color-app-surface-hover)",
    "var(--color-drdo-navy-lighter)": "var(--color-app-surface-alt)",
    "var(--color-drdo-white)": "var(--color-app-text-main)",
    "var(--color-drdo-slate)": "var(--color-app-text-muted)",
    "var(--color-drdo-slate-light)": "var(--color-app-text-light)",
    "var(--color-drdo-border)": "var(--color-app-border)",
    "var(--color-drdo-border-light)": "var(--color-app-border-light)",
    "var(--color-drdo-cyan)": "var(--color-app-primary)",
    "var(--color-drdo-cyan-dim)": "var(--color-app-primary-hover)",
    "var(--color-drdo-cyan-glow)": "var(--color-app-primary-glow)",
    "var(--color-drdo-gold)": "var(--color-app-accent)",
    "var(--color-drdo-gold-dim)": "var(--color-app-accent-hover)",
    "var(--color-drdo-success)": "var(--color-app-success)",
    "var(--color-drdo-error)": "var(--color-app-error)",
    "var(--color-drdo-warning)": "var(--color-app-warning)",
    "drdo-glass": "app-glass",
    "drdo-glow-border": "app-glow-border",
    "drdo-console": "app-console",
    "drdo-gradient-line": "app-gradient-line",
    "drdo-pulse-dot": "app-pulse-dot",
    "drdo-card-hover": "app-card-hover",
    "DRDO QuantumLab": "QuantumLab",
    "DRDO": "QL",
}

FONT_REPLACEMENTS = {
    "text-[9px]": "text-xs",
    "text-[10px]": "text-sm",
    "text-[11px]": "text-base",
    "text-xs": "text-sm",
    "text-sm": "text-base",
    "text-base": "text-lg",
    "text-lg": "text-xl",
}

def process_file(filepath):
    if not (filepath.endswith(".jsx") or filepath.endswith(".js") or filepath.endswith(".html")):
        return

    # Don't modify the theme_updater.py or index.css since we manually updated it
    if "index.css" in filepath or "theme_updater" in filepath or "vite.config.js" in filepath or "package" in filepath:
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    for old, new in REPLACEMENTS.items():
        content = content.replace(old, new)
    
    # Careful with FONT_REPLACEMENTS as they can chain if we just string.replace
    # Replace from largest to smallest to avoid overlap, but we have text-xs -> text-sm -> text-base
    # Better to use regex boundaries
    for old, new in FONT_REPLACEMENTS.items():
        # Match old exactly, not followed or preceded by word characters
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

print("Done updating theme and fonts.")
