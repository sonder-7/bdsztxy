# 实战特训营管理系统

## 本地开发环境

本项目本地开发使用和线上一致的核心技术栈：

- Backend: Django 5.2 + Django REST Framework
- Frontend: React + Vite
- Database: PostgreSQL 16
- Runtime: Node.js 22 + npm

当前机器没有管理员权限，Homebrew 无法安装，所以 Node.js 和 PostgreSQL 已安装为项目本地工具：

- Node.js: `.tools/node-v22.21.1-darwin-arm64`
- PostgreSQL: `.tools/postgresql-16`
- Python venv: `.venv`
- PostgreSQL data: `.local/pgdata`

## 常用命令

加载开发环境变量和 PATH：

```bash
source scripts/dev-env.sh
```

启动 PostgreSQL：

```bash
scripts/start-postgres.sh
```

停止 PostgreSQL：

```bash
scripts/stop-postgres.sh
```

检查环境：

```bash
scripts/check-env.sh
```

数据库连接：

```text
postgresql://camp_app:camp_app_dev@127.0.0.1:55432/debate_camp_dev
```
