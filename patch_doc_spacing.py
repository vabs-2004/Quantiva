import re

with open('QuantumLab_Project_Documentation.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove 100vh and 95vh heights that cause spillover blank pages
content = re.sub(r'min-height:\s*100vh;', 'height: 90vh;', content)
content = re.sub(r'\.cover-page\s*\{\s*min-height:\s*95vh;\s*\}', '', content)

# 2. Fix page breaks for tables and pre blocks (avoiding huge blank spaces before them)
content = re.sub(r'page-break-inside:\s*avoid;', '', content)  # Removes it from everything (table, pre, callouts)

# Add it only to table rows so rows don't get cut in half, but tables can split across pages
if 'tr { page-break-inside: avoid;' not in content:
    content = content.replace('thead {', 'tr { page-break-inside: avoid; }\n    thead {')

# 3. Remove forced page breaks on H1 (which left large blank spaces at the end of previous pages)
content = re.sub(r'h1\s*\{\s*page-break-before:\s*always;\s*\}', '', content)
content = re.sub(r'h1:first-of-type\s*\{\s*page-break-before:\s*avoid;\s*\}', '', content)

# 4. Remove forced page break after Table of Contents
content = re.sub(r'\.toc\s*\{\s*page-break-after:\s*always;\s*\}', '.toc { padding-bottom: 30px; margin-bottom: 30px; border-bottom: 2px solid var(--border); }', content)

with open('QuantumLab_Project_Documentation.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Spacing CSS updated successfully.")
