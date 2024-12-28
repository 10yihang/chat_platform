<!--
 * @author: yihang_01
 * @Date: 2024-12-17 01:17:53
 * @LastEditTime: 2024-12-26 16:41:18
 * QwQ 加油加油
-->
# 在线聊天平台

一个功能完整的在线聊天平台，支持实时通讯、文件共享、音视频通话等功能。

tips: 时间紧，仍有许多bug，主要是为了完成python大作业

## 🌟 主要功能

### 用户系统
- 账户注册与登录
- 用户资料管理
- 游客模式支持

### 即时通讯
- 私人聊天
- 群组聊天
- 公共频道
- 消息历史记录
- 表情包支持
- 图片分享

### 音视频功能
- 实时视频通话
- 语音通话
- 音频消息
- 视频消息

### 文件管理
- 文件上传与分享
- 文件预览
- 在线文档协作

### 好友系统
- 好友添加与管理
- 在线状态显示
- 好友分组

### 其他特性
- 实时通知
- 消息提醒
- 主题切换
- 多语言支持

## 🛠️ 技术栈

### 后端
- Python 3.8+
- Flask 框架
- SQLAlchemy ORM
- Socket.IO
- Redis
- JWT 认证
- SQLite/MySQL 数据库

### 前端
- React 18
- TypeScript
- Material-UI
- Socket.IO Client
- React Router
- WebRTC

## 📦 安装部署

### 环境要求
- Python 3.8+
- Node.js 14+
- Redis 服务器
- SSL 证书（用于HTTPS和WSS）

### 后端部署
1. 克隆项目并进入后端目录
```bash
git clone https://github.com/10yihang/chat_platform.git
cd chat_platform/backend
```

2. 创建并激活虚拟环境
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. 安装依赖
```bash
pip install -r requirements.txt
```

4. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件配置必要的环境变量
```

5. 初始化数据库
```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE chat_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# 导入数据库结构
mysql -u your_username -p chat_platform < backend/sql/create.sql

# 配置数据库连接
# 在 .env 文件中设置：
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=chat_platform
```

6. 运行服务器
```bash
python src/app.py
```

### 前端部署
1. 进入前端目录
```bash
cd chat_platform/frontend
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env.local
# 编辑 .env.local 配置API地址
```

4. 运行开发服务器
```bash
npm start
```

5. 构建生产版本
```bash
npm run build
```

## 🔧 配置说明

### 后端配置
- `PORT`: 服务器端口（默认5000）
- `DATABASE_URL`: 数据库连接URL
- `REDIS_URL`: Redis连接URL
- `JWT_SECRET_KEY`: JWT密钥
- `UPLOAD_FOLDER`: 文件上传目录
- `SSL_CERT_PATH`: SSL证书路径
- `SSL_KEY_PATH`: SSL密钥路径

### 前端配置
- `REACT_APP_API_URL`: 后端API地址
- `REACT_APP_SOCKET_URL`: WebSocket服务器地址
- `REACT_APP_PUBLIC_URL`: 静态资源路径

## 📝 开发指南

### 代码规范
- 遵循PEP 8 Python代码规范
- 使用ESLint和Prettier进行前端代码格式化
- 提交前进行代码检查

### 分支管理
- `main`: 主分支，保持稳定
- `develop`: 开发分支
- `feature/*`: 新功能分支
- `bugfix/*`: 问题修复分支

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

该项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件
