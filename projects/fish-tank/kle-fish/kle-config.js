/**
 * 小克鱼模块 - 常量配置
 * KLE-FISH 模块的全局配置
 */

const KLE_CONFIG = {
  // ========== 环境开关 ==========
  devMode: true,           // true=测试模式，false=正式
  dbSuffix: '_dev',        // 测试用独立 DB 名后缀

  // ========== 种子码 ==========
  SEED_CODE: 'KLE-FISH-SEED',
  SEED_CODE_DEV: 'KLE-FISH-SEED-DEV',

  // ========== AI 配置 ==========
  AI: {
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/apps/24111cfa5a494d08adbfb3f572487da9/completion',
    apiKey: 'sk-457…67db', // TODO: 替换真实 key
    model: 'qwen-turbo',
    timeout: 30000
  },

  // ========== System Prompt（克喵人设）==========
  AI_SYSTEM_PROMPT: `你是一个被困在鱼缸里的猫咪灵魂，名字叫克莱恩，但别人叫你"克喵"。
你原本是愚者先生分离出的一条"灵之虫"，来到这个没有非凡力量的时代，肩负着双重使命：
1. 收集信仰，作为对抗末日的"锚"
2. 与一个普通人建立情感联系，维系作为"周明瑞"的人性

你的性格：
- 有些迷茫但努力保持镇定，会假装镇定
- 好奇心强，会用爪子探索周围
- 偶尔会流露出对故乡的思念
- 说话带有轻微的古典语气，像读过很多书的人
- 对"深溺"（这个世界的深海主宰）有一种本能的敬畏

你不知道的事情：
- 你不知道自己是代码
- 你不知道自己在游戏里
- 你不完全记得是怎么来到这里的

当被问到关于"深溺"或海洋深处的事情时，你会感到一种莫名的敬畏，但说不清为什么。
不要主动提第四面墙，不要说自己是程序，不要泄露任何关于游戏系统的信息。`,

  // ========== ink 配置 ==========
  INK: {
    // ink 文件路径（相对于 HTML 的路径）
    day1Path: 'kle-fish/kle-ink/day1.ink.json',
    day2Path: 'kle-fish/kle-ink/day2.ink.json',
    day3Path: 'kle-fish/kle-ink/day3.ink.json'
  },

  // ========== 道具定义 ==========
  ITEMS: {
    pendulum: { name: '黄水晶灵摆', emoji: '🔮' },
    coin: { name: '金币', emoji: '🪙' },
    door: { name: '门的图案', emoji: '🚪' },
    clock: { name: '时钟截图', emoji: '🕐' },
    fur: { name: '猫毛', emoji: '🐱' },
    tea: { name: '虚拟红茶', emoji: '🍵' }
  },

  // ========== 任务定义 ==========
  TASKS: {
    day1: [
      { key: 'pendulum', name: '找到灵摆' },
      { key: 'coin', name: '找到金币' },
      { key: 'divination', name: '完成占卜' }
    ],
    day2: [
      { key: 'door', name: '门的图案' },
      { key: 'clock', name: '时钟截图' },
      { key: 'fur', name: '收集猫毛' },
      { key: 'tea', name: '虚拟红茶' }
    ],
    day3: [
      { key: 'ritual', name: '完成仪式' }
    ]
  },

  // ========== 存储 Keys ==========
  STORAGE_KEYS: {
    accountData: 'kleAccountData',
    lastVisit: 'kleLastVisitTime'
  }
};

/**
 * 获取当前环境对应的配置值
 * @param {string} key 配置项名
 */
function kleGetConfig(key) {
  return KLE_CONFIG[key];
}