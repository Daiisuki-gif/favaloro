@echo off
chcp 65001 >nul
title FAVALORO - compartir por internet
cd /d "%~dp0"
rem Comparte la web con un link https usando esta computadora como servidor.
rem Usa cloudflared (programa oficial y gratis de Cloudflare). No necesita cuenta.
set "CFDIR=%LOCALAPPDATA%\FAVALORO"
set "CF=%CFDIR%\cloudflared.exe"
if not exist "%CF%" (
  echo Bajando cloudflared de Cloudflare ^(una sola vez, ~50 MB^)...
  mkdir "%CFDIR%" 2>nul
  curl -L -o "%CF%" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
)
start "FAVALORO servidor" /min python servidor.py 8080
echo.
echo  Abriendo el link https para tus companeros...
echo  Busca la linea que dice https://....trycloudflare.com y compartila.
echo  El link funciona mientras esta ventana siga abierta. Cerrala para dejar de compartir.
echo.
"%CF%" tunnel --no-autoupdate --url http://127.0.0.1:8080 --logfile "%CFDIR%\tunel.log"
