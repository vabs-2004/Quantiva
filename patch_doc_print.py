import re

with open('QuantumLab_Project_Documentation.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'(@media print\s*\{)', r'@page { margin: 0; }\n    \1', content)

with open('QuantumLab_Project_Documentation.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Print CSS updated successfully.")
