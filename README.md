# Career Atlas

Career Atlas 是范邈川为自己设计的一款本地优先 Windows 求职管理 App。它把日常计划、岗位管理、人脉跟进和作品集推进集中在一个清晰的工作台中，并连接专业的外部简历工具。

**当前版本：1.18.0**

## 功能

- 每日任务列表与打卡
- 每周 KPI：Portfolio hours、Applications、Networking、Skill hours
- 自定义求职时间线与阶段目标
- 岗位与 Networking tracker
- Portfolio 项目进度
- FlowCV 简历入口：从侧边栏直接在系统浏览器打开 FlowCV；登录信息和简历内容由 FlowCV 管理
- 多方向求职策略视图
- 全球招聘资源导航：综合招聘、校园资源、设计/建筑、游戏/创意与中国招聘平台
- Dashboard 数据概览
- Foundation、Portfolio Ready、Market Ready、Interview 四阶段动态策略
- GitHub 主页、项目 README、LinkedIn、Portfolio 与简历之间的一致性建设
- 任务页可切换「每日任务（今天）」「未来 7 天」和「所有任务」，清楚展示步骤、预计时间和完成标准
- 可导入、预览和导出 Career Atlas 任务计划 JSON；支持日期范围替换、智能合并和完全替换，并在导入前自动备份
- 任务按日期优先排序；同一天依次考虑完成状态、机会价值、准备度和所需时间
- 随阶段自动变化的 KPI 与投入权重
- 从 2026-08-24 重新启动的高密度计划：工作日约 90 分钟，通过批处理和模板复用完成 2–3 个可检查产出；周末适度增加
- 日期按电脑所在时区计算，避免每日任务和求职时间线错位
- 本地持久化与 CSV 导出

## 安装（推荐）

打开 `outputs/installer/Career-Atlas-Setup-1.18.0.exe`，按提示完成安装。任务计划可通过 JSON 导入与导出，以后调整计划通常不再需要重新安装 App。

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
