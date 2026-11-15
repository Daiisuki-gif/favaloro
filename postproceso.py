"""Agrega encabezado y pie de The Muds Devs a cada página (salvo la portada).
Uso: python postproceso.py entrada.pdf salida.pdf logo.png
"""
import sys
import pymupdf

src, dst, logo = sys.argv[1], sys.argv[2], sys.argv[3]
BROWN = (0x6E / 255, 0x39 / 255, 0x22 / 255)
ORANGE = (0xC8 / 255, 0x6B / 255, 0x34 / 255)
CREAM = (0xF1 / 255, 0xD8 / 255, 0xAE / 255)
L, R = 48.2, 547.1  # márgenes de 17 mm

doc = pymupdf.open(src)
for i, page in enumerate(doc):
    if i == 0:
        continue
    W, H = page.rect.width, page.rect.height
    # encabezado
    page.insert_image(pymupdf.Rect(L - 2, 22, L + 26, 54), filename=logo, keep_proportion=True)
    page.insert_text((L + 30, 47), "The Muds Devs", fontname="hebo", fontsize=9, color=BROWN)
    t = "Monitoreo de salud para astronautas"
    page.insert_text((R - pymupdf.get_text_length(t, "helv", 8), 47), t, fontname="helv", fontsize=8, color=ORANGE)
    page.draw_line((L, 56), (R, 56), color=ORANGE, width=0.8)
    # pie
    page.draw_rect(pymupdf.Rect(0, H - 38, W, H), color=None, fill=BROWN)
    page.draw_rect(pymupdf.Rect(0, H - 40, W, H - 38), color=None, fill=ORANGE)
    page.insert_text((L, H - 16), "NASA Space Apps Challenge 2026  ·  Informe de investigación",
                     fontname="helv", fontsize=7.5, color=CREAM)
    n = f"Página {i + 1}"
    page.insert_text((R - pymupdf.get_text_length(n, "helv", 7.5), H - 16), n, fontname="helv", fontsize=7.5, color=CREAM)

doc.set_metadata({"title": "Monitoreo de salud para astronautas", "author": "The Muds Devs"})
doc.save(dst, garbage=3, deflate=True)
print("ok", doc.page_count, "páginas")
