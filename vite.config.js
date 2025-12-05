import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { VantResolver } from '@vant/auto-import-resolver';
// 1. 引入 PWA 插件
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/piggymicharacter/', // 你的仓库名
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      resolvers: [VantResolver()],
    }),
    Components({
      resolvers: [VantResolver()],
    }),
    // 2. 配置 PWA
    VitePWA({
      // 注册模式：'autoUpdate' 表示发现新版本自动下载并更新，适合这种游戏应用
      registerType: 'autoUpdate',

      // 开发环境也启用 PWA（可选，便于调试，正式发布会自动启用）
      devOptions: {
        enabled: true
      },

      // 关键：Workbox 缓存策略配置
      workbox: {
        // 匹配所有静态资源：js, css, html, 以及你的图片和音频格式
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,mp3}'],

        // ⚠️ 重要：你的 bgm_main.mp3 约 2MB，Workbox 默认限制缓存文件最大 2MB
        // 这里调大到 4MB，确保 BGM 也能被离线缓存
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },

      // 需要包含在 sw 预缓存列表之外的静态资源（位于 public 目录下的）
      includeAssets: ['favicon.ico', 'app.png'],

      // manifest.json 配置（决定添加到主屏幕后的样子）
      manifest: {
        name: '咪猪头识字',
        short_name: '咪猪头识字',
        description: '幼儿汉字学习游戏',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // 像原生 App 一样全屏，无浏览器地址栏
        orientation: 'landscape', // 强制横屏（既然你说是 iPad 横版）
        icons: [
          {
            src: 'app.png', // public 目录下的图标
            sizes: '192x192', // 这里假设 app.png 够大，实际最好准备不同尺寸
            type: 'image/png'
          },
          {
            src: 'app.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})