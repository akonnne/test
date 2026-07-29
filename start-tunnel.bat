@echo off
chcp 65001 >nul
REM 数道·万象 —— 启动 cloudflared 隧道
REM 方式 A：快速临时隧道（自动生成 *.trycloudflare.com 地址，每次重启会变）
REM cloudflared tunnel --url http://localhost:8099

REM 方式 B：固定域名隧道（需先按 TUNNEL.md 创建并配置 cloudflared/config.yml）
cloudflared tunnel --config cloudflared/config.yml run

pause
