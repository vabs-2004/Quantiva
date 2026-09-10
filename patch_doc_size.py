import re

with open('QuantumLab_Project_Documentation.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Update Mermaid init config for larger base font
old_init = """mermaid.initialize({ 
        startOnLoad: true, 
        theme: "base", 
        themeVariables: { 
          fontFamily: "Inter, sans-serif" 
        } 
      });"""

new_init = """mermaid.initialize({ 
        startOnLoad: true, 
        theme: "base", 
        themeVariables: { 
          fontFamily: "Inter, sans-serif",
          fontSize: "18px"
        } 
      });"""

if old_init in content:
    content = content.replace(old_init, new_init)

# Add CSS to force SVG to fill width
css_inject = """<style>
.mermaid svg {
    max-width: 100% !important;
    width: 100% !important;
    height: auto !important;
}
.mermaid {
    width: 100%;
    padding: 20px 0;
}
</style>"""

if ".mermaid svg {" not in content:
    content = content.replace('<div class="arch-box"', css_inject + '\n<div class="arch-box"', 1)

# Update node font sizes directly in the diagram
content = content.replace('font-size:14px', 'font-size:16px')
if 'classDef default font-size:16px' not in content:
    content = content.replace('%% Styling Classes', '%% Styling Classes\\n    classDef default font-size:16px,padding:10px')

with open('QuantumLab_Project_Documentation.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Mermaid diagram resized successfully.")
