# 数道·万象 —— 自托管 + Cloudflare Tunnel 架构部署指南

目标架构：

```
访客浏览器 → Cloudflare CDN → cloudflared 隧道 → 你的主机（PC/云服务器）
                                    ↓
                              Node 后端常驻运行（server.js）
                                    ↓
                              DeepSeek API
```

## 一、前置条件

1. 一台能持续开机的电脑或云服务器（Windows / Linux / macOS 均可）。
2. 已安装 Node.js（>=18）。
3. 已注册 Cloudflare 账号。
4. 项目根目录已有 `.env` 文件，内含有效的 `DEEPSEEK_KEY`。

## 二、安装 cloudflared

### Windows

1. 下载官方二进制：
   https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
2. 重命名为 `cloudflared.exe`，放到 `C:\Windows\System32\` 或本项目根目录。
3. 打开 CMD/PowerShell 验证：
   ```cmd
   cloudflared --version
   ```

### Linux / macOS

```bash
# macOS (Homebrew)
brew install cloudflared

# Linux (Debian/Ubuntu)
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

## 三、启动后端

双击运行项目根目录的：

```
start-backend.bat
```

或在终端执行：

```bash
node server.js
```

默认监听 `0.0.0.0:8099`。本地可打开 http://localhost:8099 测试。

## 四、暴露到公网（二选一）

### 方案 A：快速临时隧道（测试用，域名每次会变）

在另一个终端执行：

```bash
cloudflared tunnel --url http://localhost:8099
```

成功后会显示类似：

```
https://abc123-def456.trycloudflare.com
```

把这个地址发给任何人都能访问。**但每次重启 cloudflared，域名会变。**

### 方案 B：固定域名隧道（生产用，需要自有域名）

1. 登录 Cloudflare 获取凭证：
   ```bash
   cloudflared tunnel login
   ```
   这会打开浏览器授权，并在 `~/.cloudflared/`（或 Windows `C:\Users\<用户名>\.cloudflared\`）生成证书。

2. 创建隧道：
   ```bash
   cloudflared tunnel create shudao-wanxiang
   ```
   记下返回的 **Tunnel ID**（UUID，例如 `a1b2c3d4-...`），同时会生成 `<Tunnel ID>.json` 凭证文件。

3. 编辑 `cloudflared/config.yml`：
   - 把 `tunnel:` 后的值改成你的 Tunnel ID。
   - 把 `credentials-file:` 改成对应的 `<Tunnel ID>.json` 绝对路径。

4. 给你的域名添加 DNS 记录，把流量指向隧道：
   ```bash
   cloudflared tunnel route dns shudao-wanxiang shudao-wanxiang.yourdomain.com
   ```
   把 `yourdomain.com` 换成你托管在 Cloudflare 的真实域名。

5. 启动隧道：
   ```bash
   # Windows
   start-tunnel.bat

   # Linux/macOS
   cloudflared tunnel --config cloudflared/config.yml run
   ```

6. 访问 `https://shudao-wanxiang.yourdomain.com` 即可。

## 五、配置跨域（重要）

如果前端通过固定域名访问，需要让后端允许该域名。修改 `start-backend.bat`，取消注释并设置：

```bat
set ALLOWED_ORIGINS=https://shudao-wanxiang.yourdomain.com
```

多个域名用逗号分隔：

```bat
set ALLOWED_ORIGINS=https://a.com,https://b.com
```

## 六、让后端长期后台运行

### Windows

方式 1：把 `start-backend.bat` 放到「启动」文件夹，开机自动运行。
方式 2：使用 [nssm](https://nssm.cc/) 把 `node server.js` 注册成系统服务。

### Linux / macOS

使用 systemd 服务（示例文件 `shudao-wanxiang.service`）：

```ini
[Unit]
Description=数道·万象 Node 后端
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/shudao-wanxiang
ExecStart=/usr/bin/node server.js
Restart=always
Environment="DEEPSEEK_KEY=sk-xxxxxxxx"
Environment="ALLOWED_ORIGINS=https://shudao-wanxiang.yourdomain.com"

[Install]
WantedBy=multi-user.target
```

启用并启动：

```bash
sudo systemctl enable shudao-wanxiang
sudo systemctl start shudao-wanxiang
```

## 七、与现有 Cloudflare Pages 的关系

切换成隧道架构后：
- 静态文件由 `server.js` 自己提供（`site/` 目录）。
- API 由 `server.js` 处理。
- 不再需要 Cloudflare Pages Functions，可以保留或删除 Pages 项目。
- 如果你之前绑定了 `shudao-wanxiang.pages.dev`，可以把 DNS 记录改成指向隧道域名，或在 Pages 设置里暂停部署。

## 八、安全提醒

1. `.env` 文件永远不要提交到 git（已配置 `.gitignore`）。
2. 建议给 DeepSeek key 设置用量上限和余额告警。
3. 后端自带的同源校验 + IP 限流已生效；如需要更严格的全局限流，可在 Cloudflare 控制台开启 WAF / Rate Limiting。
