"""Servidor local de FAVALORO (solo Python, sin instalar nada).

Igual que `python -m http.server`, pero le pide al navegador que siempre
revise si hay una versión nueva: así, después de cada cambio, quien abra el
link ve lo último sin tener que borrar la caché.
Uso: python servidor.py [puerto]
"""
import http.server
import os
import sys


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
os.chdir(os.path.dirname(os.path.abspath(__file__)))
print(f"FAVALORO en http://localhost:{port}  (Ctrl+C para cerrar)")
http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
