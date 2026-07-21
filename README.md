# Creator Studio

基于 Agnes AI 的多媒体创作工作室，支持图片生成和视频生成。

## 功能

- 🖼 **文生图** — 使用 agnes-image-2.1-flash 生成高质量图片
- 🔄 **图生图** — 基于参考图片进行风格转换/编辑
- 🎬 **文生视频** — 使用 agnes-video-v2.0 生成视频
- 🎞 **图生视频** — 让静态图片动起来
- 📜 **创作画廊** — 统一管理所有作品
- ⚙️ **本地设置** — API Key 和安全存储

## 快速开始

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## API 配置

- Base URL: `https://apihub.agnes-ai.com/v1`
- 图片模型: `agnes-image-2.1-flash`
- 视频模型: `agnes-video-v2.0`
- 认证: Bearer Token

## 技术栈

- Vue 3 (Composition API)
- Vite
- 原生 Fetch API
