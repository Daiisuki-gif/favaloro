@echo off
rem FAVALORO: abre la web desde http://localhost para que funcionen el microfono y el Bluetooth.
rem Necesita Python (ya viene en muchas PC con Windows). Cerrá esta ventana para apagar la web.
cd /d "%~dp0"
start "" "http://localhost:8080/index.html"
python servidor.py 8080
