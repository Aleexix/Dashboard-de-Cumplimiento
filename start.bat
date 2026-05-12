@echo off
title Dashboard ATM Operations
echo.
echo  Instalando dependencias...
pip install -r requirements.txt -q
echo.
echo  Iniciando servidor en http://localhost:5000
echo  Presiona Ctrl+C para detener
echo.
python server.py
pause