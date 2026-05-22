// ==================== 事件库 ====================
// 数据源：https://xcn6gvimkp72.feishu.cn/sheets/Lu5xsTHT2hL2pltbIHAcDLrVnrg
// 维护方式：伙伴在飞书表中维护 → 通知小星 → 同步到此文件
// 字段说明：
//   id: 事件唯一标识
//   trigger: 'offline'（离线时触发）| 'online'（在线行为触发）| 'both'（两者皆可）
//   tier: common(+1) / rare(+2) / epic(+3) / legendary(+5) / peaceful(+0)
//   reward: 礼物数（与 tier 对应）
//   name: 事件名
//   emoji: 主图标
//   description: 故事文案，支持变量 {hours} {minutes} {fishCount} {plantCount}
//   weight: 同等级内权重（默认 1）
//   unlockCondition: 触发条件，如 'offline>=4h'，留空=随时
//   source: 触发来源（online事件专用），如 ['feeding', 'petting']
//   enabled: 是否启用

window.EVENTS = [
  // ========== 离线事件 ==========
  {
    id: 'offline_bottle_001', trigger: 'offline', tier: 'common', reward: 1,
    name: '海螺漂流瓶', emoji: '🐚',
    description: '一个旧旧的漂流瓶随着夜潮飘进了鱼缸…里面是一封写给你的信，墨迹有些晕开，但落款是一句温柔的「想你了」。',
    weight: 1, unlockCondition: '', enabled: true
  },
  {
    id: 'offline_tide_001', trigger: 'offline', tier: 'common', reward: 1,
    name: '涨潮的礼物', emoji: '🎁',
    description: '凌晨的潮汐带来了远方的祝福，海浪在玻璃壁上留下了一个小小的礼物盒，里面装着一颗珍珠。',
    weight: 1, unlockCondition: '', enabled: true
  },
  {
    id: 'offline_octopus_001', trigger: 'offline', tier: 'common', reward: 1,
    name: '路过的章鱼', emoji: '🐙',
    description: '一只迷路的小章鱼路过你的鱼缸，它好奇地用触手摸了摸玻璃，然后从口袋里掏出一颗贝壳作为「打扰费」放下，慢悠悠地游走了。',
    weight: 1, unlockCondition: '', enabled: true
  },
  {
    id: 'offline_doublebottle_001', trigger: 'offline', tier: 'rare', reward: 2,
    name: '双倍漂流', emoji: '🐚',
    description: '你不在的 {hours} 小时里，两个漂流瓶前后脚漂进了鱼缸。它们碰在一起，发出清脆的「叮」一声，像在打招呼。',
    weight: 1, unlockCondition: '', enabled: true
  },
  {
    id: 'offline_fishgift_001', trigger: 'offline', tier: 'rare', reward: 2,
    name: '鱼群的感谢', emoji: '🐟',
    description: '你的 {fishCount} 条小🐠们偷偷开了一场会议，决定要感谢你这么用心地照顾它们。它们集体游到水草丛里，搬出了两颗藏了很久的星砂。',
    weight: 1, unlockCondition: '', enabled: true
  },
  {
    id: 'offline_starfall_001', trigger: 'offline', tier: 'epic', reward: 3,
    name: '流星划过', emoji: '🌟',
    description: '凌晨3点，你不在的时候，一颗流星拖着银色的尾巴划过夜空，最后坠入你的鱼缸…它化作三颗星砂，被小🐠们小心地藏在了水草丛里。\n据说，看见流星坠入鱼缸的人，会拥有一整个温柔的夏天。',
    weight: 1, unlockCondition: 'offline>=4h', enabled: true
  },
  {
    id: 'offline_mermaid_001', trigger: 'offline', tier: 'legendary', reward: 5,
    name: '海妖低语', emoji: '🧜♀️',
    description: '你听见了来自深海的歌声。\n\n那是一首古老的、属于鲸落与海沟的旋律。海妖循着鱼缸里的水声游来，她在玻璃外停留了 {hours} 个小时，留下五颗会发光的眼泪。\n\n「这个鱼缸里，住着一个温柔的人。」她轻声说。',
    weight: 1, unlockCondition: 'offline>=6h', enabled: true
  },
  {
    id: 'offline_dream_001', trigger: 'offline', tier: 'peaceful', reward: 0,
    name: '安静的夜晚', emoji: '💤',
    description: '鱼缸安静了一晚。小🐠们做了甜甜的梦，梦里有大海，有水草，还有你。',
    weight: 1, unlockCondition: '', enabled: true
  },
  {
    id: 'offline_moonlight_001', trigger: 'offline', tier: 'peaceful', reward: 0,
    name: '月光洒落', emoji: '🌙',
    description: '你离开的 {hours} 小时里，月光把鱼缸照得像撒了一层银粉。鱼儿一动不动，仿佛被时间凝固。',
    weight: 1, unlockCondition: '', enabled: true
  },

  // ========== 在线事件（喂鱼/摸鱼触发） ==========
  {
    id: 'online_feeding_surprise', trigger: 'online', tier: 'common', reward: 1,
    name: '小惊喜', emoji: '🎁',
    description: '🐟 很开心，送了你一份小礼物',
    weight: 1, source: ['feeding'], enabled: true
  },
  {
    id: 'online_bubble_gift', trigger: 'online', tier: 'common', reward: 1,
    name: '泡泡礼物', emoji: '🫧',
    description: '你的小鱼悄悄吐出了一个泡泡，里面装着惊喜',
    weight: 1, source: ['feeding', 'petting'], enabled: true
  },
  {
    id: 'online_shimmer', trigger: 'online', tier: 'common', reward: 1,
    name: '意外之喜', emoji: '✨',
    description: '海草间闪过一丝光芒，是鱼儿藏的小宝贝',
    weight: 1, source: ['petting'], enabled: true
  },
  {
    id: 'online_coral_gift', trigger: 'online', tier: 'rare', reward: 2,
    name: '珊瑚藏宝', emoji: '🪸',
    description: '小珊瑚从水草丛里探出头，递出了一份珍贵的礼物',
    weight: 1, source: ['feeding'], enabled: true
  },
  {
    id: 'online_starfish_blessing', trigger: 'online', tier: 'rare', reward: 2,
    name: '海星祝福', emoji: '⭐',
    description: '路过的小海星为你送上祝福，愿你今晚好梦',
    weight: 1, source: ['petting'], enabled: true
  },
  {
    id: 'online_shell_discovery', trigger: 'online', tier: 'common', reward: 1,
    name: '贝壳发现', emoji: '🐚',
    description: '在沙子里发现了一个漂亮的贝壳，里面有意外的惊喜',
    weight: 1, source: ['feeding', 'petting'], enabled: true
  }
];

// 事件等级概率分布（合计 100）
window.EVENT_TIER_PROBABILITY = {
  common: 50,
  rare: 25,
  epic: 10,
  legendary: 3,
  peaceful: 12
};

// 离线时长 → 抽奖次数 + 礼物上限
window.REWARD_RULES = [
  { minMinutes: 1,   maxMinutes: 30,  draws: 1, giftCap: 3 },
  { minMinutes: 30,  maxMinutes: 120, draws: 1, giftCap: 5 },
  { minMinutes: 120, maxMinutes: 240, draws: 2, giftCap: 8 },
  { minMinutes: 240, maxMinutes: Infinity, draws: 3, giftCap: 10 }
];

// 离线最低触发门槛（分钟）
window.OFFLINE_MIN_TRIGGER_MINUTES = 30;

// 日志保留条数上限
window.EVENT_LOG_MAX = 30;