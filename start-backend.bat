@echo off
chcp 65001 >nul
REM 数道·万象 —— 启动常驻后端（Node.js + cloudflared 隧道架构）
REM 确保已安装 Node.js（>=18），并在本目录放置了 .env 文件（含 DEEPSEEK_KEY）

cd /d "%~dp0"

REM 如需让前端用新的隧道域名访问，取消下一行注释并把域名改成你的实际域名
REM set ALLOWED_ORIGINS=https://your-tunnel-domain.trycloudflare.com

node server.js
pause
