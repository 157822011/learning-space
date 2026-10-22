# 拾光 · 我的学习空间

一个无需后端、免费部署到 GitHub Pages 的中文学习项目空间。

## 已有功能

- 定义学习项目的成果、目标日期和每周学习次数
- 管理下一步行动并追踪完成进度
- 使用专注计时并自动记录学习时间
- 创建知识卡片，通过主动回忆进行复习
- 查看连续学习天数、累计投入和本周节奏
- 浏览器本地保存、JSON 导入导出
- 深浅色主题、移动端布局和离线访问

## 本地预览

直接用浏览器打开 `index.html` 即可。要测试离线缓存，请在本目录启动任意静态文件服务器。

## 部署到 GitHub Pages

1. 在 GitHub 创建一个空仓库，默认分支使用 `main`。
2. 在本目录添加远端并推送：

   ```powershell
   git remote add origin https://github.com/你的用户名/仓库名.git
   git push -u origin main
   ```

3. 打开仓库的 **Settings → Pages**，把 **Source** 设为 **GitHub Actions**。
4. 等待 `Deploy learning space to GitHub Pages` 工作流完成。
5. 在 **Actions** 或 **Settings → Pages** 中取得公开访问地址。

仓库需要是 Public 才能使用 GitHub Free 的 Pages 免费发布。

## 数据说明

学习记录使用浏览器 `localStorage` 保存，不会上传到服务器。清理浏览器数据或换设备前，请先点击页面顶部的“导出记录”。
