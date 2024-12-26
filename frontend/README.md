# 在线聊天平台前端

基于 React + TypeScript 构建的现代化在线聊天平台前端应用。

## 🚀 特性列表

### 即时通讯界面
- 私聊/群聊切换
- 消息实时更新
- 消息历史记录
- 表情包支持
- 图片预览
- 在线状态显示

### 多媒体支持
- 图片发送与预览
- 文件上传与下载
- 音频消息
- 视频消息
- 实时音视频通话

### 用户界面
- 响应式设计
- 深色/浅色主题
- 自定义主题颜色
- 消息通知
- 快捷键支持

## 🛠️ 技术栈

- React 18
- TypeScript 4.x
- Material-UI v5
- Socket.IO Client
- WebRTC
- Redux Toolkit
- React Router v6
- Axios
- SCSS/Styled-components

## 📁 项目结构

```
frontend/
├── src/
│   ├── components/       # 可复用组件
│   ├── pages/           # 页面组件
│   ├── hooks/           # 自定义 Hooks
│   ├── contexts/        # React Context
│   ├── services/        # API 服务
│   ├── utils/           # 工具函数
│   ├── types/           # TypeScript 类型定义
│   ├── assets/          # 静态资源
│   └── theme/           # 主题配置
```

## 🔧 开发环境配置

### 前置要求
- Node.js >= 14.x
- npm >= 6.x

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 创建环境配置文件
```bash
cp .env.example .env.local
```

4. 启动开发服务器
```bash
npm start
```

5. 构建生产版本
```bash
npm run build
```

## ⚙️ 环境变量配置

在 `.env.local` 文件中配置以下变量：

```env
REACT_APP_API_URL=https://api.example.com
REACT_APP_SOCKET_URL=wss://socket.example.com
REACT_APP_PUBLIC_URL=/
```

## 📝 开发规范

### 代码风格
- 使用 ESLint + Prettier 进行代码格式化
- 遵循 TypeScript 严格模式
- 组件使用函数式组件和 Hooks

### 命名规范
- 组件文件：PascalCase
- 工具函数：camelCase
- 样式文件：kebab-case

### Git 提交规范
```
feat: 新功能
fix: 修复
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建过程或辅助工具的变动
```

## 🔨 常用命令

```bash
# 开发
npm start

# 构建
npm run build

# 测试
npm test

# 代码检查
npm run lint

# 格式化代码
npm run format
```

## 🚀 部署指南

1. 构建生产版本
```bash
npm run build
```

2. 配置 nginx（示例）
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/build;
        try_files $uri $uri/ /index.html;
    }
}
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交改动
4. 推送到分支
5. 提交 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件