# 石髓 SHISUI · Marble × Venom 弦管合成器

> **Live demo:** <https://syxmadeit.github.io/SHISUI1/> · License: MIT · Status: public beta

**English:** SHISUI is a browser synthesizer (Web Audio + AudioWorklet, no build step, no install) built around physically modelled Chinese instruments — guzheng, erhu, dizi, guan/suona and a string ensemble — with an "electrified" signal chain (pickup → diode → tube → cabinet), a Venom mode, and random ports driven by true randomness, the digits of π and a simulated carbon‑14 decay. Marble and gilded-marble UI, Chladni sand visualizer, recording to WAV, eight persistent sound slots, MIDI, bilingual labels. Open the live demo, click **AWAKEN**, play with **Z X C V** or **Q W E R**. Found a bug? Use the **Report** button in the top bar — it prefills a GitHub Issue with logs.



古筝 · 二胡 · 竹笛 · 管子/唢呐 · 弦乐群 的物理建模内核，插电拾音、二极管与电子管放大链，
以及由 **真随机 / 圆周率 / 碳-14 衰变** 驱动的随机接口。大理石里流淌的液态金属，光从金脉中迸出。

## 运行

无需构建、无需安装。

- **在线**：<https://syxmadeit.github.io/SHISUI1/>（GitHub Pages），打开后点"唤醒石髓 AWAKEN"。
- **装到手机 / 桌面（PWA）**：用上面的在线网址打开一次 → 安卓 Chrome 点菜单「安装应用」（或页内 `?` 指南里的「装到手机」按钮）；iPhone / iPad 用 Safari 打开 → 底部「分享」→「添加到主屏幕」。之后主屏幕上有图标，全屏运行，**没有网络也能用**（已缓存全部文件，约 2 MB）。有新版本时会在下次打开自动更新。
- **本地（一键下载）**：<https://github.com/SYXMadeit/SHISUI1/archive/refs/heads/main.zip> → 解压 → 双击 `index.html`（Chrome / Edge / Firefox / Safari 最新版）。页内 `?` 指南里也有同一个下载按钮。
- 或本地起个静态服务：`python3 -m http.server 8000` 然后打开 `http://localhost:8000/`。

## 上手

1. **玩**：转四个宏（力 / 光 / 空 / 毒），按 `A S D F…` 弹奏，空格刷新随机接口，点"惊喜"。
2. **塑**：切乐器瓷砖，调拨弦位置 / 弓压 / 笛膜 / 簧片，开插电，调二极管与电子管。
3. **深**：点接口球或源芯片再点任意旋钮接线；写代码：`seq('C4 E4 . G4', 0.25)`、`onDecay(...)`。

4. **指路**：琴键上方的「指路」开着时，弹几个音它会猜出调式（含宫商角徵羽），点亮推荐的下一个音，给出三个配套和弦（点一下试听）和一轮之后的走向。玩音乐的人可以关掉。
5. **鼓**：「鼓机」面板开关一按就是 tech house：Bodzin 式撞墙底鼓、滚动贝斯、踩镲、拍手，16 步格子随便点；底鼓会把合成器按下去（采样级侧链）。贝斯根音跟着指路的和弦走。
6. **录**：底部"录音 · 声音槽"面板按 ● 或 `Shift+R`，录下你听到的一切，停止后进入一个槽；⬇ 导出 WAV。让槽循环再录 = 叠录新素材。

`Ctrl/⌘+K` 查找任何东西。右键旋钮锁定。`💾 存预设` 存到浏览器本地，改动会自动记住。`?` 看完整指南。

## 获取代码

```
git clone https://github.com/SYXMadeit/SHISUI1.git
cd SHISUI1
```
或直接下载 ZIP：<https://github.com/SYXMadeit/SHISUI1/archive/refs/heads/main.zip>（等同于仓库页面 Code → Download ZIP），解压得到 `SHISUI1-main` 文件夹，双击里面的 `index.html`。

## 字体

界面标题用 [ZCOOL QingKe HuangYou（站酷庆科黄油体）](https://fonts.google.com/specimen/ZCOOL+QingKe+HuangYou)，英文与数字用 [Silkscreen](https://fonts.google.com/specimen/Silkscreen) 像素字，正文用 ZCOOL XiaoWei。三者都是 SIL Open Font License，可商用、可随项目分发；已按界面用到的字子集化后放在 `fonts/`（约 0.6 MB），不依赖 Google Fonts，中国大陆和离线都能正常显示。许可证见 `fonts/OFL-*.txt`。

## 中国大陆访问

GitHub Pages 在大陆时通时断。给国内朋友用，最稳的是直接发离线 ZIP（上面的一键下载链接，或把 ZIP 转存到网盘），解压双击 `index.html` 即可，不需要联网。

## 测试

```
node --check js/*.js
node test/dsp-smoke.js    # DSP 数值冒烟测试（每种乐器出声、不发散、性能）
```

## 隐私与兼容性提醒 · Notes before you play

- **报错按钮会公开什么**：点「报错 Report」生成的 GitHub Issue 里包含你的浏览器版本（User-Agent）、屏幕尺寸、采样率、当时的音色参数、最近的操作记录与错误日志。**不包含**账号、姓名、录音音频或声音槽内容。提交前可以在 GitHub 页面上删掉任何一段。
  *The Report button prefills a public GitHub Issue with your browser User-Agent, screen size, sample rate, current patch, recent actions and error log. It never includes your account, name, recorded audio or slot contents. You can delete any section before submitting.*
- **手机与 Safari**：本项目在桌面 Chrome / Edge 上开发和测试；手机 Safari、手机 Chrome 只做过基本适配，没有系统性真机测试。公测阶段特别欢迎手机端反馈（触控、延迟、发不出声、布局）。
  *Developed and tested on desktop Chrome / Edge. Mobile Safari and mobile Chrome have only basic adaptation and no systematic device testing yet. Mobile feedback is especially welcome during the beta.*
- **声音槽与预设存在你自己的浏览器里**（IndexedDB / localStorage），换浏览器或清理站点数据会丢，想保留请导出 WAV / JSON。

## 报错与自动修复

页面顶栏「报错 Report」会收集最近的错误、操作记录、状态与环境，加上你的描述，生成预填好的 GitHub Issue（label `bug-report`）。
让 Claude Code 每天自动分析这些 Issue 并提出修复 PR 的设置方法见 [docs/bug-routine.md](docs/bug-routine.md)；PR 需开发者确认后才会合并。

设计说明、声音架构、对标分析见 [DESIGN.md](DESIGN.md)。
