# GitHub Pages 部署指南

本项目已经配置好了GitHub Pages的自动部署。按照以下步骤即可启用静态网站托管。

## 自动部署配置

项目已经包含以下配置：

### 1. Vite 配置 (`vite.config.ts`)
- ✅ 生产环境base路径设置为 `/demo/`
- ✅ 优化的构建配置
- ✅ 代码分割和压缩

### 2. GitHub Actions 工作流 (`.github/workflows/deploy.yml`)
- ✅ 自动在`main`分支推送时触发部署
- ✅ 支持手动触发 (`workflow_dispatch`)
- ✅ 优化的pnpm缓存配置
- ✅ 自动添加`.nojekyll`文件
- ✅ 并发控制防止重复部署

## GitHub 仓库设置步骤

### 步骤 1: 推送代码到 GitHub
```bash
git add .
git commit -m "配置GitHub Pages部署"
git push origin main
```

### 步骤 2: 启用 GitHub Pages
1. 进入你的GitHub仓库页面
2. 点击 **Settings** 标签页
3. 在左侧菜单中找到并点击 **Pages**
4. 在 **Source** 部分选择：
   - **Deploy from a branch** 改为 **GitHub Actions**
5. 保存设置

### 步骤 3: 配置环境变量（如果需要）
如果你的项目需要`VITE_PROJECT_ID`：
1. 在仓库 **Settings** > **Secrets and variables** > **Actions**
2. 点击 **New repository secret**
3. 添加：
   - Name: `VITE_PROJECT_ID`
   - Value: 你的Reown项目ID

### 步骤 4: 触发首次部署
推送任何更改到`main`分支，或者：
1. 进入 **Actions** 标签页
2. 选择 **Deploy to GitHub Pages** 工作流
3. 点击 **Run workflow** 手动触发

## 部署状态检查

部署完成后，你的网站将在以下地址访问：
```
https://[你的用户名].github.io/demo/
```

### 检查部署状态：
1. 进入 **Actions** 标签页查看工作流运行状态
2. 绿色勾号表示部署成功
3. 红色X表示部署失败，点击查看详细日志

## 常见问题解决

### 1. 404 错误
- 确认仓库名称是 `demo`
- 检查 `vite.config.ts` 中的 base 路径设置
- 确认 GitHub Pages 源设置为 **GitHub Actions**

### 2. 资源加载失败
- 检查控制台是否有路径错误
- 确认所有静态资源路径都使用了正确的base路径

### 3. 工作流失败
- 检查 `package.json` 中的构建脚本
- 确认所有依赖都已正确安装
- 查看 Actions 日志获取详细错误信息

## 技术特性

✅ **自动化部署**：推送到main分支自动部署  
✅ **缓存优化**：pnpm依赖缓存加速构建  
✅ **代码分割**：优化的Rollup配置减少包大小  
✅ **并发控制**：防止同时运行多个部署任务  
✅ **错误处理**：完善的构建失败处理机制  

部署成功后，你的Vue 3 + AppKit应用将可以通过GitHub Pages访问！
