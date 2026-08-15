# Career Atlas

为 UCLA MSAUD 学生设计的本地优先双轨求职管理桌面应用。

## 功能

- 每日任务列表与打卡
- 每周 KPI：Portfolio hours、Applications、Networking、Skill hours
- 2026-08 至 2027-06 阶段目标
- 岗位与 Networking tracker
- Portfolio 项目进度
- 三套定向简历：美国 Spatial / Experiential、美国 Architecture / Visualization、中国 Game / Creative
- 简历实时预览，并导出 PDF 或 Microsoft Word 可编辑的 RTF 文件
- 美国 / 中国双轨策略视图
- Dashboard 数据概览
- Foundation、Portfolio Ready、Market Ready、Interview 四阶段动态策略
- 按 Deadline、Readiness、Opportunity Value、Career Priority、Effort 自动排序任务
- 随阶段自动变化的 KPI 与投入权重，中国秋招从 2026 年 8 月立即启动
- 本地持久化与 CSV 导出

## 安装（推荐）

打开 `outputs/installer/Career-Atlas-Setup-1.4.0.exe`，按提示完成安装。1.4.0 新增动态阶段、智能优先队列和中国秋招即时任务，同时保留新版简历与 Windows 启动兼容处理。

## 从源码运行

需要 Node.js 20+：

```powershell
npm install
npm start
```

生成 Windows 安装包：

```powershell
npm run dist
```

## 数据说明

所有数据使用 Electron/Chromium 的本地存储保存在当前 Windows 用户目录中，不会上传。岗位、联系人与作品集页面均可导出 UTF-8 CSV，可直接用 Excel 打开。
