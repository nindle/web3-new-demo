# GitHub Pages 部署指南

## 概述

本项目已配置GitHub Pages自动化部署。当代码推送到`main`分支时，将自动触发构建和部署流程。

## 部署配置

### 1. GitHub Repository 设置

1. **启用GitHub Pages:**
   - 访问仓库 Settings → Pages
   - Source 选择 "GitHub Actions"

2. **配置环境变量:**
   - 访问 Settings → Secrets and variables → Actions
   - 点击 "New repository secret"
   - 添加名为 `VITE_PROJECT_ID` 的secret，值为您的Reown项目ID

### 2. 自动部署流程

- **触发条件**: 推送到 `main` 分支
- **构建工具**: GitHub Actions
- **部署目标**: GitHub Pages
- **访问地址**: https://nindle.github.io/web3-new-demo/

### 3. 工作流程文件

位置: `.github/workflows/deploy.yml`

主要步骤：
1. 检出代码
2. 设置Node.js环境
3. 安装依赖
4. 构建生产版本
5. 部署到GitHub Pages

### 4. 本地构建测试

```bash
# 生产环境构建
pnpm run build:prod

# 预览构建结果
pnpm run preview
```

### 5. 文件结构

```
.github/
  workflows/
    deploy.yml          # GitHub Actions 工作流
dist/                   # 构建输出目录
src/                    # 源代码
vite.config.ts          # Vite配置（包含base路径设置）
package.json            # 项目依赖和脚本
README.md               # 项目说明
DEPLOYMENT.md           # 本部署指南
```

## 故障排除

### 常见问题

1. **构建失败**
   - 检查是否添加了`VITE_PROJECT_ID` secret
   - 确认Node.js版本兼容性

2. **页面显示空白**
   - 检查Vite配置中的base路径是否正确
   - 确认资源路径是否正确

3. **样式丢失**
   - 确认CSS文件路径相对于base路径正确

### 调试步骤

1. 查看GitHub Actions构建日志
2. 本地运行 `pnpm run build:prod` 测试构建
3. 使用 `pnpm run preview` 预览生产版本

## 更新部署

要更新部署，只需：

1. 提交代码到main分支
2. 推送到GitHub
3. GitHub Actions会自动构建和部署

```bash
git add .
git commit -m "更新内容"
git push origin main
```

部署完成后，访问 https://nindle.github.io/web3-new-demo/ 查看更新结果。
