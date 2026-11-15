"""Arma monitor_muds.html (para publicar) y monitor_local.html (para abrir en Chrome con Bluetooth)."""
import base64
import pathlib

d = pathlib.Path(__file__).parent
src = (d / "monitor_src.html").read_text(encoding="utf-8")
logo = base64.b64encode((d.parent / "assets" / "logo.png").read_bytes()).decode()
out = src.replace("{{LOGO}}", "data:image/png;base64," + logo)
(d / "monitor_muds.html").write_text(out, encoding="utf-8")

head = ('<!doctype html>\n<html lang="es"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>body{margin:0}[hidden]{display:none!important}</style>\n')
local = head + out.replace('<!--BODY-->', '</head><body>', 1) + "\n</body></html>\n"
(d / "monitor_local.html").write_text(local, encoding="utf-8")
print("ok", len(out))
