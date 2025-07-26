
import nbformat
import sys
import os

if len(sys.argv) < 2:
    print("Usage: python extract_outputs.py <notebook_path>")
    sys.exit(1)

notebook_path = sys.argv[1]
base = os.path.basename(notebook_path)
output_html = os.path.join(os.path.dirname(notebook_path), base.replace('.ipynb', '_outputs.html'))

with open(notebook_path, "r", encoding="utf-8") as f:
    nb = nbformat.read(f, as_version=4)

html = "<html><body><h1>Notebook Outputs</h1>"
for cell in nb.cells:
    if cell.cell_type == "code" and "outputs" in cell:
        for output in cell.outputs:
            if output.output_type == "stream":
                html += f"<pre>{output.text}</pre>"
            elif output.output_type == "display_data":
                if "image/png" in output.data:
                    img_data = output.data["image/png"]
                    html += f'<img src="data:image/png;base64,{img_data}"/><br>'
                if "text/plain" in output.data:
                    html += f"<pre>{output.data['text/plain']}</pre>"
            elif output.output_type == "execute_result":
                if "text/plain" in output.data:
                    html += f"<pre>{output.data['text/plain']}</pre>"
html += "</body></html>"

with open(output_html, "w", encoding="utf-8") as f:
    f.write(html)

print("HTML file with outputs saved to:", output_html)