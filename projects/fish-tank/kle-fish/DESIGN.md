# 小克鱼模块设计文档

> 摸鱼模拟器 × 诡秘之主 联动故事线
> 最后更新：2026-06-09

---

## 一、世界观概述

### 1.1 两条世界线的关系

- **摸鱼模拟器**：深溺统治的深海世界，鱼是深溺的记忆碎片，人类通过送礼维系关系
- **诡秘之主桌宠项目**：克莱恩（愚者分出的灵之虫）流落到异世界的桌宠故事
- **连接点**：小克鱼是连接两个世界的特殊存在——它不是深溺自然造出来的，是"被引导来的"

### 1.2 深溺的设定（参考）

- 整个海洋的深处有一个无法被命名的东西，名为"深溺"
- 它无意志、无善恶、有记忆
- 送礼的本质是向深溺贡献一段关系，深溺消化关系后造出鱼
- 鱼是深溺在人类世界的触角和碎片

### 1.3 小克鱼的特殊性

- 小克鱼是唯一一个**有名字的鱼**
- 它不是深溺自然造出来的，是被"引导"来的
- 它的使命是体验完三天故事后离开，并解锁分享资格
- 完成三天后离开鱼缸，用户获得"分享者"身份

---

## 二、核心规则

| 规则 | 说明 |
|------|------|
| 获取方式 | 种子码兑换（`KLE-FISH-SEED`） |
| 持有数量 | 一个用户最多一条 |
| 删除限制 | 不可删除 |
| 分享资格 | 完成三天故事后解锁，每个用户限生成一次 |
| 分享码限制 | 一次性，只能被一个用户使用 |
| 故事进度 | 自然日 + 任务完成情况双条件推进 |

---

## 三、数据结构

### 3.1 IndexedDB 结构

```
fishTankDB
├── store: tankData （现有，普通鱼数据）
│   └── fishes: [...]
└── store: kleFish           （新建，小克鱼实例）
    └── { id, type, x, y, receivedAt, generatedBy, ancestors }
```

### 3.2 用户账户数据（localStorage 或独立 store）

```js
{
  // 身份标记（永久）
  isKleHolder: false,           // 是否收到过小克鱼
  canGenerateKleCode: false,    // 三天完成后解锁

  // 故事进度
  progress: 0,                   // 0=未开始，1/2/3=当前进度
  currentDay: 1,                 // 自然日推进：1~3
  lastVisitDate: '',             // 上次访问日期
  completed: false,              // 三天是否全部完成

  // 任务状态
  tasks: {
    day1: { pendulum: false, coin: false, divination: false },
    day2: { door: false, clock: false, fur: false, tea: false },
    day3: { ritual: false }
  },

  // 道具
  items: [], // 已获得的道具列表
  itemsObtainedAt: {}, // 获得时间戳

  // 谱系
  generatedBy: null,            // 种子码兑换为null
  ancestors: [], // [userId, ...]
}
```

### 3.3 小克鱼本体数据（kleFish store）

```js
{
  id: 'fish-kle-xxx',
  type: '🐱', // 或 assets/路径
  isKleFish: true,
  receivedAt: timestamp,
  generatedBy: userId,         // 谁分享的
  ancestors: [userId, ...]     // 谱系链
}
```

---

## 四、文件结构

```
projects/fish-tank/
├── logic.js / gift-system.js   （现有）
│
└── kle-fish/                   ← 小克鱼独立模块
    ├── kle-config.js           ← 常量（种子码、AI提示词、台词库）
    ├── kle-data.js            ← 数据层（IndexedDB + localStorage API）
    ├── kle-share.js           ← 分享码生成与解析
    ├── kle-story.js           ← ink编译 + 对话树驱动
    ├── kle-ink/ ← ink源文件
    │   ├── day1.ink
    │   ├── day2.ink
    │   └── day3.ink
    ├── kle-ai.js              ← AI自由对话
    ├── kle-panel.js            ← 四个Tab UI
    ├── kle-system.js           ← 入口文件，统一API
    └── DESIGN.md              ← 本文档
```

---

## 五、专属面板设计

### 5.1 布局

```
┌──────────────────────────────────────────┐
│  🐱 小克鱼                    [×] 关闭   │
├──────────────────────────────────────────┤
│  [自由对话]  [故事对话]  [道具栏]  [任务栏]│
├──────────────────────────────────────────┤
│ │
│           各 Tab 内容区域                 │
│                                          │
└──────────────────────────────────────────┘
```

### 5.2四个 Tab

| Tab | 内容 | AI/预设 |
|-----|------|--------|
| 自由对话 | AI接入，克喵身份回复 | AI（百炼）|
| 故事对话 | DAY1/2/3对话树，玩家选择推进 | ink预设 |
| 道具栏 | 已获得的道具平铺 |预设 |
| 任务栏 | 今日任务列表+进度条 | 预设 |

### 5.3 道具栏细节

- 不分 DAY，全部平铺
- 只显示已获得道具
- 未获得不显示
- 空时显示"暂无其他道具"

### 5.4 任务栏细节

- 显示今日任务列表
- 进度条（完成数/总数）
- 自然日提示（"第 X 天 / 3 天"）
- 自动打勾（故事中完成即更新）

---

## 六、三天剧情大纲

### DAY1：初临

**任务**：找到灵摆、找到金币、进行占卜

**对话方向**：
- 小克鱼初到，困惑"这里是哪里"
- 玩家帮助小克鱼找到灵摆和金币
- 完成占卜，引出"需要举行仪式"

### DAY2：仪式准备

**任务**：收集门的图案、时钟截图、猫毛、虚拟红茶

**对话方向**：
- 小克鱼准备仪式
- 四个材料各有来历
- 完成后进入 DAY3

### DAY3：仪式与离场

**任务**：完成仪式（玩家输入一段话）

**对话方向**：
- 小克鱼坦白真相（身份、使命）
- 玩家输入文字，触发离场
- 小克鱼离开，解锁分享资格

---

## 七、外部接口

```js
// 触发入口（现有系统调用）
kleSystem.onGiftReceived(giftData);   // 收到特殊码时
kleSystem.onLongPress(fishId); // 长按小克鱼 → 打开面板

// 查询入口
kleSystem.isKleFish(fishId);
kleSystem.getHolderStatus(userId);
```

---

## 八、注意事项

1. **导出/导入**：暂不支持 kleFish store，换手机小克鱼可能丢失，后续反馈后补充
2. **清理鱼缸**：`cleanTank` 不影响 kleFish store
3. **每日语音气泡**：暂不开发
4. **持有者标识**：暂不开发

---

## 九、开发 TODO（完整版）

### 阶段一：数据层
- [ ] 新建 `kleFish` IndexedDB store
- [ ] `kle-config.js` — 种子码常量、AI system prompt
- [ ] `kle-data.js` — 增删改查读写 API
- [ ] `kle-share.js` — 种子码兑换 + 分享码生成/解析

### 阶段二：小克鱼本体
- [ ] 判断 `isKleFish` 的逻辑
- [ ] 小克鱼渲染（特殊外观）
- [ ] 长按入口拦截（区分普通鱼）
- [ ] 小克鱼不可删除

### 阶段三：专属面板（四个 Tab）
- [ ] 面板整体布局 + Tab 切换
- [ ] 道具栏 Tab
- [ ] 任务栏 Tab
- [ ] 故事对话 Tab（ink）
- [ ] 自由对话 Tab（AI）

### 阶段四：三天剧情系统
- [ ] `DAY1.ink` 对话树
- [ ] `DAY2.ink` 对话树
- [ ] `DAY3.ink` 对话树
- [ ] `kle-story.js` — ink编译 + 对话推进
- [ ] 自然日切换逻辑
- [ ] 任务完成自动打勾
- [ ] DAY3 完成 → 离场动画

### 阶段五：接入现有系统
- [ ] init 时读取 kleFish store → 渲染
- [ ] 兑换码入口
- [ ] 特殊码收到时调用 `kleSystem.onGiftReceived()`
- [ ] 分享码生成入口（三天后解锁）

---

*END*