# 石髓 SHISUI · 竞品对标与改进清单

> 对标对象：合成器旗舰（Xfer Serum 2、Vital、Arturia Pigments、Kilohearts Phase Plant）、移动端标杆（Moog Animoog Z、Moog Model 15、AudioKit Synth One）、和声工具（Scaler 3、Captain Chords）、中国乐器音源（Ample Sound China 系列、Sound Magic Legendary Hu / Neo Guzheng、Wavesfactory Guzheng）。
> 依据：公开的产品页与评测（见文末来源）+ 我们自己的使用经验。价格与版本随时会变，以官网为准。

## 1. 他们各自的优点，以及我们怎么用

| 对标 | 他们做得好的 | 我们已经有的 | 这一轮落地的 | 还没做的 |
| --- | --- | --- | --- | --- |
| **Serum 2** | 拖一下就接线的调制；每个振荡器窗口里波形实时流动；蓝线在黑底上极清楚；五种引擎（波表 / 采样 / 颗粒 / 频谱 / 多采样）；琶音 + 片段音序器 | 点芯片再点旋钮的接线；波表 + 3D 波浪；金色三层描边；琶音 | 波形窗按屏幕刷新率逐帧画（60 / 120 Hz），相关性锁相不再跳 | 拖拽接线（手机上不好用，暂不做）；颗粒 / 采样引擎 |
| **Vital** | 免费基础版就是完整合成器；频谱扭曲；每个调制源有自己的颜色 | 完全免费开源；接口 / LFO / 宏按来源分色 | — | 频谱扭曲（Warp）可做成"毒液"里的一项 |
| **Pigments** | 色彩鲜明、分区清楚；「Play」简化页只留宏；每个分区都有自己的骰子；序列器 / 琶音一体 | 玩 / 塑 / 深三层；宏；惊喜（整机随机） | **每个面板标题右侧的 🎲 只随机这一块**（锁定的旋钮跳过） | 分区级撤销 |
| **Phase Plant** | 模块化叠加，效果链按通道分组 | 放大链固定顺序（二极管 → 电子管 → 箱体） | — | 效果顺序可拖动 |
| **Animoog Z** | 为触屏而生：琴键上 X/Y 滑动改音色；3D 轨道球；一屏演奏页 | Y 位置 = 力度；XY 板 | **手指在琴键上上下滑 = 调制轮**（默认接揉弦深度与亮度，可在矩阵改）；手机底栏一行指路 + 短键盘 + 可收起；顶栏一行 + 「⋯」 | 每个键独立 X 滑动换音色（需要更宽的键） |
| **Model 15** | 拟物到极致、可缩放；Metal 渲染流畅 | 大理石鎏金材质 | 手机轻量模式保住帧率 | 面板缩放 |
| **Synth One** | 免费、慷慨、预设多、社区投稿 | 免费开源、报错一键提 Issue | 预设收藏 ★ | 社区预设投稿（可用 Issue 模板实现） |
| **Scaler 3** | 调式识别、和弦建议、自动声部连接（voice leading）、按风格的和弦集 | 指路：调式 / 和弦识别、下一音、配和弦、走向 | **一键和声**：每弹一个音自动配和弦，按走向表权重预测下一个（芯片上显示概率），声部放旋律下方一个八度内并加低八度根音 | 风格和弦集（古风 / 爵士 / 流行） |
| **Captain Chords** | 钢琴卷帘、段落管理、节奏生成 | 鼓机 16 步 | — | 和弦段落（A/B 段）与节奏型联动 |
| **Ample China / Sound Magic / Wavesfactory** | 真实采样的演奏法（滑音、揉弦、轮指、泛音）、多种定弦、权威 | 物理建模（不是采样）：拨弦位置 / 弓压 / 气息 / 簧片可连续调；原声按钮一键回真实 | — | 演奏法快捷键（泛音、轮指、花舌）；定弦预设（D 调筝、G 调筝） |

## 2. 我们的差异化（继续放大）

1. **零安装、全平台**：浏览器即开，PWA 装到手机，离线可用，国内离线 ZIP。对标产品全部要安装、多数收费。
2. **中国乐器物理建模**：不是样本回放，弓压、气息、簧片、拨弦位置是连续可调的物理量，插电与毒液也作用在模型上。采样音源做不到"二胡通电"。
3. **石头与金**：行业清一色黑底蓝线，我们是白大理石 + 鎏金 + 黑曜石窗口，金色三层描边保证清楚。磨损皮肤随使用变老，这是别人没有的"物件感"。
4. **随机接口**：真随机 / π / 碳-14 衰变当调制源，带舷窗可视化。
5. **指路 + 一键和声 + 鼓机 + 侧链**：新手一分钟做出"像样的一段"，玩音乐的人可以关掉。

## 3. 颜色与状态语言（从 Serum / Pigments 学来的规则）

- **一个信号色**：显示用金（亮金 / 哑金 / 熔金可选），只用于"正在发生的事"：波形、播放头、调制环、点亮的琴键。装饰金箔占比 ≤ 6%，不抢信号。
- **状态分级**：静态 = 墨色；可点 = 大理石按钮；选中 = 金底；被调制 = 亮金芯 + 深色描边的环；推荐 = 金色内描边（hint）；和声 = 蓝色内描边（hint2）。
- **黑曜石窗口**：所有实时视图统一黑底，这样金色在任何面板上都清楚（Serum 蓝线在黑底的原理）。
- **毒液**：整机换成黑曜石 + 绿 / 紫，信号色改绿。

## 4. 下一轮建议（按性价比排序）

1. 演奏法快捷：古筝泛音 / 轮指、二胡抛弓、笛子花舌作为"演奏"分组的按钮与 MIDI 键开关。
2. 风格和弦集：古风（五声）、流行（1645）、爵士（ii–V–I）切换，影响指路与一键和声的走向表。
3. 鼓机与和弦联动：贝斯已跟和弦根音；再加"和弦垫"轨（按一键和声的和弦自动铺一层）。
4. 预设标签筛选与"用户作品"投稿（Issue 模板）。
5. 效果顺序可拖动（Phase Plant 式）。

## 来源

- [Dubspot：Pigments 6 vs Serum 2](https://blog.dubspot.com/plugins/compare/pigments-6-vs-serum-2) · [Serum 2 vs Vital](https://blog.dubspot.com/de/plugins/compare/serum-2-vs-vital)
- [Synth Anatomy：Animoog Z](https://synthanatomy.com/tag/animoog-z) · [Moog Model 15 App Store](https://apps.apple.com/us/app/moog-model-15/id1041465860) · [MusicTech：best mobile synth apps](https://musictech.com/guides/buyers-guide/best-mobile-synth-apps/)
- [MusicTech：Scaler 3 review](https://musictech.com/reviews/plug-ins/scaler-3-review/) · [Plugin Boutique：What's new in Scaler 3](https://help.pluginboutique.com/hc/en-us/articles/35864679857684-What-s-new-in-Scaler-3) · [AudioCipher：Scaler 2 vs Captain Chords](https://www.audiocipher.com/post/scaler-2-vs-captain-chords)
- [VI-Control：Sound Magic Legendary Hu](https://vi-control.net/community/threads/sound-magic-legendary-hu-erhu-zhonghu-gehu-and-jinhu-bundle.128542/) · [KVR：Nu Guzheng](https://www.kvraudio.com/product/nu-guzheng-by-samplescience/details)
