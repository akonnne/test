# 数道·万象 后端镜像（用于 VPS / 容器 / Railway / Fly.io / Render 等）
# 镜像内 server.js 自带静态托管，无需额外 Nginx 也能跑；
# 生产环境建议再套一层 Nginx/Caddy 反代 + TLS。
FROM node:20-alpine

WORKDIR /app

# 后端代码
COPY server.js server-lib.js ./

# 静态站点（前端）
COPY site ./site

ENV PORT=8080
ENV HOST=0.0.0.0
# 生产务必通过环境变量注入密钥，不要依赖镜像内的回退常量：
# ENV DEEPSEEK_KEY=sk-xxxx

EXPOSE 8080

CMD ["node", "server.js"]
