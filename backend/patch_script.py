import os
import re

file_path = r"backend\generate_all_notebooks.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We want to import plot_bloch_multivector at the top of each script if missing
content = content.replace("from qiskit.visualization import circuit_drawer, plot_histogram\n", 
                          "from qiskit.visualization import circuit_drawer, plot_histogram, plot_bloch_multivector\n")

# We want to add the bloch plot just before BLOCH_THETA is printed
# Find: print(f"BLOCH_THETA=
# Replace with:
# fig3 = plot_bloch_multivector(sv)
# display(fig3)
# plt.close(fig3)
# print(f"BLOCH_THETA=

new_code = """
try:
    fig3 = plot_bloch_multivector(sv)
    display(fig3)
    plt.close(fig3)
except Exception:
    pass
print(f"BLOCH_THETA="""

content = content.replace('print(f"BLOCH_THETA=', new_code)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("generate_all_notebooks.py patched successfully.")
