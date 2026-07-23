# AI Creator Studio

基于 Vue 3、Vite 和 Electron 的 AI 创作客户端，可通过兼容 Agnes API 的服务完成图像生成、视频生成和流式对话。项目既可作为浏览器应用运行，也可打包为 Windows 桌面应用。

> 本项目直接从客户端调用 API，适合个人使用和原型验证。部署给不受信任的用户前，请先增加后端代理和鉴权层，避免暴露 API Key。

## 功能

- 文生图与图生图：支持提示词、反向提示词、尺寸选择，以及 URL 或本地图片作为参考图。
- 文生视频与图生视频：可设置帧数、帧率和反向提示词；提交后在画廊中轮询任务状态。
- 对话：通过 SSE 接收流式回复，支持新建、切换、重命名和删除本地会话。
- 对话角色：新建会话时可选择普通对话、提示词助手、视觉导演、视频分镜师或品牌文案师；角色会随会话保存。
- 项目工作台：以项目归档创作简报、模板和生成版本；旧画廊记录会自动归入“历史创作”。
- 内容模板与版本对比：内置新品发布、社媒封面、品牌故事和角色设定模板；可选择 1-2 个已完成版本并排比较。
- 对话带入创作：可将 AI 回复直接带入图片或视频表单，并归档到当前项目。
- 创作画廊：按图片或视频筛选、预览、下载、删除和刷新任务状态；内置演示素材不会被删除。
- 本地配置与数据：API Key、API 地址、用户作品和对话记录保存在浏览器 `localStorage` 中。
- Windows 桌面端：提供 Electron 开发启动与 Windows x64 打包脚本，桌面端支持系统托盘与原生菜单。

## 技术栈

- Vue 3（Composition API）
- Vite 6
- Electron 41
- 原生 Fetch API 与 Server-Sent Events（SSE）
- `marked`（渲染对话中的 Markdown）

## 环境要求

- Node.js 18 或更高版本。GitHub Actions 当前使用 Node.js 24 构建。
- 可访问一个实现下列接口的 Agnes API 兼容服务，并拥有有效的 Bearer Token。

## 快速开始

安装依赖并启动浏览器开发服务器：

```bash
npm install
npm run dev
```

开发服务器固定监听 `http://localhost:3000`。端口已配置为严格模式，若被占用，Vite 会退出而不是自动选择其他端口。

首次启动后，打开“设置”页面，填写 API Key；可按需填写 API 地址并使用“测试连接”验证凭据。

## 可用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器（端口 3000）。 |
| `npm run build` | 构建 Web 静态文件到 `build/`。 |
| `npm run preview` | 本地预览已构建的 Web 静态文件。 |
| `npm run electron:dev` | 并行启动 Vite 和 Electron 开发窗口。 |
| `npm run electron:build` | 先构建 Web 文件，再使用 `electron-packager` 产出 Windows x64 应用到 `dist/`。该命令会清理其指定的旧打包输出目录。 |

## API 配置与运行差异

默认 API 地址为 `https://apihub.agnes-ai.com/v1`，认证方式为：

```http
Authorization: Bearer <API_KEY>
Content-Type: application/json
```

开发环境下，所有 `/api/*` 请求都会由 Vite 转发到 `https://apihub.agnes-ai.com/v1/*`。因此，浏览器开发模式不会使用设置页中的自定义 API 地址。

生产 Web 构建和 Electron 环境会直接使用设置页中的 API 地址。自托管 Web 版本时，目标 API 必须允许浏览器跨域请求（CORS）；更推荐由自己的服务端代理请求。

客户端调用的接口及预期用途如下：

| 方法与路径 | 用途 |
| --- | --- |
| `GET /models` | 测试 API Key 是否可用。 |
| `POST /images/generations` | 创建图片；兼容 `data[0].url`、`data[0].b64_json`、`url` 或 `output_url` 形式的结果。 |
| `POST /videos` | 创建异步视频任务，读取响应中的 `id` 或 `task_id`。 |
| `GET /videos/:taskId` | 查询视频任务及视频地址。生成中的任务每 5 秒轮询一次。 |
| `POST /chat/completions` | 使用 SSE 获取流式对话结果。 |

当前客户端会根据创作类型自动选择模型：图片为 `agnes-image-2.1-flash`，视频为 `agnes-video-v2.0`；对话默认使用 `agnes-2.0-flash`。所用服务需支持这些模型名，或需要相应调整源码。

## 数据与安全

- API Key 及用户内容保存在当前浏览器配置文件的 `localStorage`，没有加密，也不会同步到项目服务器。
- 参考图的本地上传会以 Base64 Data URL 传至 API；请确认你的服务端接受这种格式和相应的请求体大小。
- 请求遇到网络错误或 `429`、`502`、`503`、`504` 时，客户端会做最多 3 次指数退避重试；视频状态请求最多重试 2 次。
- 请勿将真实 API Key 写入源码、构建产物或公开仓库。当前代码中存在默认密钥回退逻辑，公开部署前应删除该逻辑，并撤销任何已暴露的密钥。

## 项目结构

```text
.
|- src/
|  |- api/                 # 图片、视频、对话和通用请求封装
|  |- components/          # 项目、对话、创作、画廊及通用组件
|  |- composables/         # 全局状态和业务流程
|  |- electron/            # Electron 主进程与预加载脚本
|  |- images/              # 内置图标和画廊演示素材
|  |- App.vue
|  `- main.js
|- styles/main.css          # 全局样式
|- vite.config.js           # Vite、开发服务器及 API 代理配置
`- .github/workflows/ci.yml # master 分支的构建与 GitHub Pages 部署
```

## 构建与部署

执行 `npm run build` 后，静态文件位于 `build/`。仓库中的 GitHub Actions 会在 `master` 分支推送时构建该目录并发布到 `gh-pages` 分支。

由于静态站点会在访问者浏览器中直接请求 API，部署前应确认 CORS、密钥保护和服务访问策略。GitHub Pages 不适合承载需要私密 API Key 的生产应用。

## 开发说明

- 代码中的文本以 UTF-8 保存。若终端显示中文乱码，请检查终端的编码设置，而不是修改源文件编码。
- 项目未提供自动化测试脚本；提交前至少执行 `npm run build` 以验证生产构建。
- 仓库当前未声明许可证；复用或发布前请先补充明确的许可条款。
