# Career Atlas

为 UCLA MSAUD 学生设计的本地优先双轨求职管理桌面应用。

## 功能

- 每日任务列表与打卡
- 每周 KPI：Portfolio hours、Applications、Networking、Skill hours
- 2026-08 至 2027-06 阶段目标
- 岗位与 Networking tracker
- Portfolio 项目进度
- 美国 / 中国双轨策略视图
- Dashboard 数据概览
- 本地持久化与 CSV 导出

## 安装（推荐）

打开 `outputs/installer/Career-Atlas-Setup-1.0.0.exe`，按提示选择安装目录。安装完成后可从桌面或开始菜单启动 Career Atlas。

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
