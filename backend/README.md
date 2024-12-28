# README.md

# 在线聊天平台后端服务

基于 Flask 的实时聊天平台后端服务，提供完整的实时通讯功能支持。

## 🔥 核心功能

### 用户系统
- JWT token 身份验证
- 用户注册与登录
- 访客模式支持
- 用户信息管理
- 登录日志记录

### 即时通讯
- WebSocket 实时消息
- 群聊/私聊支持
- 在线状态管理
- 消息历史记录
- 表情消息支持

### 音视频通话
- 一对一语音通话
- 一对一视频通话
- WebRTC 信令服务
- ICE 候选协商

### 文件处理
- 文件分片上传
- 大文件支持
- 文件进度跟踪
- 头像文件管理
- 安全下载控制

### AI 对话
- 多模型支持（DOUBAO/GEMINI/DEEPSEEK/GROK）
- 流式响应
- 上下文理解
- 智能回复建议

## 🛠 技术架构

### 核心框架
- Flask: Web 框架
- Flask-SocketIO: WebSocket 支持
- Flask-SQLAlchemy: ORM 数据库操作
- Flask-JWT-Extended: JWT 认证
- Flask-Redis: Redis 缓存支持

### 数据存储
- MySQL: 主数据库
- Redis: 缓存与会话管理

### 日志系统
- 自动日志轮转
- 分级日志记录
- 时间戳格式化输出

## 📁 项目结构

```
backend/
├── src/
│   ├── routes/              # 路由控制器
│   │   ├── auth.py         # 用户认证
│   │   ├── chat.py         # 聊天功能
│   │   ├── file.py         # 文件处理
│   │   └── ai.py           # AI 服务
│   ├── services/           # 业务逻辑
│   │   ├── chat.py         # 聊天服务
│   │   ├── call_service.py # 通话服务
│   │   └── file_manager.py # 文件管理
│   ├── models/             # 数据模型
│   ├── extensions.py       # 扩展配置
│   ├── config.py          # 全局配置
│   └── app.py             # 应用入口
```

## 🚀 部署说明

### 环境要求
- Python 3.8+
- MySQL 5.7+
- Redis 6.0+
- SSL 证书（用于 HTTPS/WSS）

### 安装步骤

1. 安装依赖：
```bash
pip install -r requirements.txt
```

2. 配置环境变量：
```bash
cp .env.example .env
# 编辑 .env 文件配置数据库等信息
```

3. 初始化数据库：
```bash
flask db upgrade
```

4. 启动服务：
```bash
python src/app.py
```

## 🗃️ 数据库配置

### 数据表说明
- users: 用户基本信息
- profiles: 用户详细资料
- user_groups: 群组信息
- group_members: 群组成员关系
- messages: 聊天消息记录
- login_logs: 登录日志
- friendships: 好友关系
- friend_requests: 好友请求

### 初始化数据库
1. 创建数据库：
```sql
CREATE DATABASE chat_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 导入表结构：
```bash
mysql -u your_username -p chat_platform < sql/create.sql
```

3. 配置数据库连接：
在 .env 文件中设置以下参数：
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=chat_platform
```

### 数据备份恢复
- 备份数据：
```bash
mysqldump -u your_username -p chat_platform > backup.sql
```

- 恢复数据：
```bash
mysql -u your_username -p chat_platform < backup.sql
```

## 🔒 安全特性

- HTTPS/WSS 加密通信
- JWT 令牌认证
- SQL 注入防护
- 文件上传安全检查
- 跨域保护（CORS）

## 📝 开发说明

### 日志配置
使用 Python 的 logging 模块，支持日志分级和文件轮转：
- INFO 级别：普通操作日志
- ERROR 级别：错误信息
- 自动按大小切分（1MB）
- 保留最近 10 个日志文件

### WebSocket 事件
主要的 Socket.IO 事件：
- chat：聊天消息
- call_request：通话请求
- file_transfer：文件传输
- user_status：用户状态

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支
3. 提交改动
4. 发起 Pull Request

## 📄 许可证

MIT License