# Genera el PDF del informe de The Muds Devs a partir de informe_muds_devs.html
$dir  = $PSScriptRoot
$raw  = Join-Path $env:TEMP "muds_raw.pdf"
$out  = Join-Path $dir "The_Muds_Devs_Monitoreo_Salud_Astronautas.pdf"
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$html = "file:///" + ((Join-Path $dir "informe_muds_devs.html") -replace '\\','/')
& $edge --headless=new --disable-gpu --no-pdf-header-footer --user-data-dir="$env:TEMP\muds_edge" --print-to-pdf="$raw" $html | Out-Null
Start-Sleep -Seconds 1
python -I (Join-Path $dir "postproceso.py") $raw $out (Join-Path $dir "assets\logo.png")
