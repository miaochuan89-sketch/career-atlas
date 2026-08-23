# Career Atlas

Career Atlas 是范邈川为自己设计的一款本地优先 Windows 求职管理 App。它把日常计划、岗位管理、人脉跟进、作品集推进和定向简历集中在一个清晰的工作台中。

**当前版本：1.10.0**

## 功能

- 每日任务列表与打卡
- 每周 KPI：Portfolio hours、Applications、Networking、Skill hours
- 自定义求职时间线与阶段目标
- 岗位与 Networking tracker
- Portfolio 项目进度
- 可新增、复制、改名和删除的多版本定向简历管理
- 简历模块可自由新增、删除、改名和排序，并实时预览
- 右侧预览与 PDF 共用同一份 US Letter 打印模板，根据内容量自动采用舒展、标准、紧凑或密集排版
- 多方向求职策略视图
- 全球招聘资源导航：综合招聘、校园资源、设计/建筑、游戏/创意与中国招聘平台
- Dashboard 数据概览
- Foundation、Portfolio Ready、Market Ready、Interview 四阶段动态策略
- GitHub 主页、项目 README、LinkedIn、Portfolio 与简历之间的一致性建设
- 任务页可切换「每日任务（今天）」「未来 7 天」和「所有任务」，清楚展示步骤、预计时间和完成标准
- 任务按日期优先排序；同一天依次考虑完成状态、机会价值、准备度和所需时间
- 随阶段自动变化的 KPI 与投入权重
- 从 2026-08-22 重新启动的高密度计划：工作日每天 2–3 项且总计不超过 120 分钟，周末适度增加；每项都有可检查的产出
- 本地持久化与 CSV 导出

## 安装（推荐）

打开 `outputs/installer/Career-Atlas-Setup-1.10.0.exe`，按提示完成安装。1.10.0 将未来两周升级为每天 2–3 项高效率任务，工作日严格控制在两小时以内。

已安装的版本也可以在应用右上角选择“检查更新”，从项目的 GitHub Release 获取正式更新。

## 技术栈

- Electron 37：Windows 桌面运行环境
- Vanilla JavaScript、HTML、CSS：界面与业务逻辑
- Chromium Local Storage：本地数据持久化
- Electron Builder / NSIS：Windows 安装包
- GitHub Actions / GitHub Releases：版本构建与更新分发

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

## 项目结构

- `src/`：页面、样式与本地业务逻辑
- `electron/`：桌面窗口、安全桥接、PDF/Word 导出和更新逻辑
- `.github/workflows/`：Release 自动构建流程
- `package.json`：项目版本、运行脚本与安装包配置

## 数据说明

所有数据使用 Electron/Chromium 的本地存储保存在当前 Windows 用户目录中，不会上传。岗位、联系人与作品集页面均可导出 UTF-8 CSV，可直接用 Excel 打开。

仓库不提交 `.env`、凭据、个人简历数据、缓存、测试临时文件或本地构建产物。
