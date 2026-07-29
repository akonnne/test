// PM2 进程管理配置（可选）
// 用法：npm i -g pm2 && pm2 start ecosystem.config.js && pm2 save && pm2 startup
module.exports = {
  apps: [{
    name: 'shudao-wanxiang',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 8099,
      HOST: '0.0.0.0'
      // 把 DEEPSEEK_KEY 和 ALLOWED_ORIGINS 放到 .env 文件或系统环境变量里，不要写死在这里
    }
  }]
};
