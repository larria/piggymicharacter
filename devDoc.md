# 📱 PWA 离线支持与部署指南

> **文档更新时间**: 2025-12-05
> **项目状态**: 单仓库 (GitHub Pages) + PWA 离线支持

本项目集成了 **PWA (Progressive Web App)** 技术，允许用户将网页添加到 iPad/手机主屏幕，实现：
1. **离线使用**：在没有网络的情况下也能完整运行游戏（包括图片和音频）。
2. **沉浸体验**：隐藏浏览器地址栏，全屏运行，类似原生 App。
3. **自动更新**：后台自动下载新版本资源。

---

## 🛠️ 技术方案

*   **构建工具**: Vite
*   **PWA 插件**: `vite-plugin-pwa` (基于 Google Workbox)
*   **缓存策略**: **Cache First (缓存优先)**。优先读取本地缓存，无网络时完全可用。
*   **更新模式**: `autoUpdate`。发现新版本时在后台静默下载，下次启动 App 时自动替换。

---

## ⚙️ 关键配置说明

如果你需要修改缓存策略或添加新类型的资源，请关注以下文件。

### 1. `vite.config.js`

这是 PWA 的核心配置文件。

```javascript
VitePWA({
  registerType: 'autoUpdate', // 自动更新模式
  
  workbox: {
    // 1. 匹配所有需要缓存的文件类型
    // 如果后续加了 .webp 或 .json 数据文件，记得在这里补上
    globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,mp3}'],
    
    // 2. 调大单个文件缓存限制 (默认是 2MB)
    // 项目中 bgm_main.mp3 接近 2MB，为了保险起见设为 4MB
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, 
  },

  // 3. 决定安装到主屏幕后的外观
  manifest: {
    name: '咪猪头识字',
    short_name: '咪猪头识字',
    display: 'standalone', // 关键：全屏模式
    orientation: 'landscape', // 关键：强制横屏
    theme_color: '#ffffff',
    icons: [
      // 这里引用的图片在 public/ 目录下
      { src: 'app.png', sizes: '192x192', type: 'image/png' },
      { src: 'app.png', sizes: '512x512', type: 'image/png' }
    ]
  }
})
```

### 2. `index.html` (iOS 适配)

iPad/iPhone 的 Safari 需要特殊的 Meta 标签才能识别为 Web App 并隐藏顶部/底部栏。

```html
<!-- iOS 添加到主屏幕后的标题 -->
<meta name="apple-mobile-web-app-title" content="咪猪头识字">
<!-- 开启 Web App 能力 -->
<meta name="apple-mobile-web-app-capable" content="yes">
<!-- 状态栏样式：沉浸式 -->
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

---

## 🚀 部署与更新流程

本项目采用 **`gh-pages`** 插件将构建产物 (`dist/`) 推送到 GitHub 的 `gh-pages` 分支进行托管。

### 1. 正常迭代发布
每次修改完代码（src 目录）后，执行以下步骤：

1.  **提交源码**（保存进度）：
    ```bash
    git add .
    git commit -m "feat: 更新了xx功能"
    git push
    ```

2.  **构建并发布**（自动更新网站）：
    ```bash
    npm run deploy
    ```
    *此命令会执行 `vite build` 打包，并自动将 `dist` 文件夹推送到远程 `gh-pages` 分支。*

### 2. 验证 PWA 是否生效

1.  运行 `npm run deploy` 发布。
2.  等待 1-2 分钟（GitHub Pages 更新 DNS）。
3.  在 iPad Safari 访问网站。
4.  点击分享按钮 -> **“添加到主屏幕”**。
5.  从主屏幕图标打开游戏。
6.  **开启飞行模式（断网）**。
7.  彻底杀掉后台进程，重新点击图标进入。
8.  **预期结果**：游戏能正常加载，图片能显示，声音能播放。

---

## ❓ 常见问题 (FAQ)

### Q1: 我发布了新版本，为什么 iPad 上还是旧的？
**A: 这是 PWA 的正常机制。**
1.  用户打开 App 时，为了速度，会直接加载本地旧缓存（秒开）。
2.  后台 Service Worker 会检测到有新版本，并开始下载。
3.  **下载完成后**，用户**下一次**彻底关闭并重新打开 App 时，才会应用新版本。
4.  *无需操作，多打开几次自然就更新了。*

### Q2: 新加了很大的视频文件，为什么离线不能看了？
**A: 检查文件大小限制。**
检查 `vite.config.js` 中的 `maximumFileSizeToCacheInBytes`。默认限制是 2MB。如果资源超过这个大小，Workbox 默认**不会**缓存它。你需要调大这个数值。

### Q3: 为什么 `dist` 文件夹不在 GitHub 的 main 分支里？
**A: 这是刻意设计的。**
为了保持源码仓库整洁，我们将 `dist` 加入了 `.gitignore`。
构建后的代码只存在于 `gh-pages` 分支中，专门用于网站展示。请勿手动将 `dist` 提交到 `main` 分支。

### Q4: iOS 上顶部还是有黑条/状态栏？
**A: 检查 `viewport-fit=cover`。**
确保 `index.html` 的 viewport 设置如下：
```html
<meta name="viewport" content="..., viewport-fit=cover">
```
并且 CSS 中使用了 `env(safe-area-inset-bottom)` 等变量来适配刘海屏。
```