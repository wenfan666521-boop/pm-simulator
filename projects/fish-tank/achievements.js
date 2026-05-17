/**
 * 摸鱼模拟器 - 成就系统
 * 独立文件存储，防止用户直接查看解锁条件
 * 
 * 使用说明：
 * 1. 在 fish-tank.html 的 <head> 中引入 <script src="achievements.js" defer></script>
 * 2. showAchievements() 函数保留在 HTML 中（包含复杂 UI）
 * 3. 本文件定义所有成就数据、检测逻辑和弹窗函数
 */

let achievements = []; // 已解锁的成就

// ==================== 隐藏成就 ====================
const SECRET_ACHIEVEMENTS = [
  {
    id: 'fate_beacon',
    name: '命运道标上的光芒',
    description: '历史的车轮开始滚滚向前…',
    giftReward: 0,
    check: () => {
      const wolfCount = fishes.filter(f => f.type === '🐺').length;
      const hatCount = fishes.filter(f => f.type === '🎩').length;
      return wolfCount >= 1 && hatCount >= 1;
    }
  },
  {
    id: 'death_overlord',
    name: '死亡执政官',
    description: '你似乎还在沉睡，但没有关系...',
    giftReward: 0,
    check: () => {
      const hatCount = fishes.filter(f => f.type === '🎩').length;
      const snakeCount = fishes.filter(f => f.type === '🐍').length;
      return hatCount >= 1 && snakeCount >= 1;
    }
  },
  {
    id: 'shining_gem',
    name: '最耀眼的宝石',
    description: '我需要的诊金很少，祝我快乐！',
    giftReward: 0,
    check: () => {
      const hatCount = fishes.filter(f => f.type === '🎩').length;
      const gemCount = fishes.filter(f => f.type === '💎').length;
      return hatCount >= 1 && gemCount >= 1;
    }
  },
  {
    id: 'purple_snake',
    name: '紫色的小蛇',
    description: '特意用这种方式解锁，真是辛苦您了！敬礼~☆',
    giftReward: 0,
    check: () => {
      const snakeCount = fishes.filter(f => f.type === '🐍').length;
      const purpleCount = fishes.filter(f => f.type === '🟣').length;
      return snakeCount >= 1 && purpleCount >= 1;
    }
  },
  {
    id: 'yi_qiang_chuan_yun',
    name: '一枪穿云',
    description: '枪声所响起的方向，周泽楷就是规则',
    giftReward: 0,
    check: () => fishes.filter(f => f.type === '🔫').length >= 1 && fishes.filter(f => f.type === '☁').length >= 1
  },
  {
    id: 'fan_hua_xue_jing',
    name: '繁花血景',
    description: '枪响，雷鸣，繁花血景',
    giftReward: 0,
    check: () => fishes.filter(f => f.type === '🩸').length >= 1 && fishes.filter(f => f.type === '🌸').length >= 1
  },
  {
    id: 'bai_hua_liao_luan',
    name: '百花缭乱',
    description: '张佳乐，你为什么要走',
    giftReward: 0,
    check: () => fishes.filter(f => f.type === '💯').length >= 1 && fishes.filter(f => f.type === '🌸').length >= 1
  }
];

// ==================== 普通成就 ====================
const ACHIEVEMENTS = [
  {
    id: 'first_life',
    name: '第一条生命',
    description: '从水下第一颗生命萌芽开始...噢抱歉拿错剧本了',
    giftReward: 1,
    unlockHint: '添加第一条鱼',
    check: () => stats.addFishClicks >= 1
  },
  {
    id: 'grow_up',
    name: '快快长大',
    description: '喂鱼，长大，再喂鱼再长大...世界上没有比这更简单的事了',
    giftReward: 1,
    unlockHint: '第一次喂鱼长大',
    check: () => stats.successfulFeeds >= 1
  },
  {
    id: 'pet_fish',
    name: '摸鱼',
    description: '没有什么比摸鱼更赚钱的事情了，摸得越多，赚得越多...',
    giftReward: 1,
    unlockHint: '第一次摸鱼',
    check: () => stats.petFishClicks >= 1
  },
  {
    id: 'feed_fish',
    name: '喂鱼',
    description: '热知识：给鱼投喂太多饲料是有害的。但别担心，对赛博鱼无害',
    giftReward: 1,
    unlockHint: '投喂6次鱼',
    check: () => stats.feedFishClicks >= 6
  },
  {
    id: 'plant_use',
    name: '水草利用',
    description: '路边采摘的蘑菇不要吃，路边采摘的水草可以给鱼吃...',
    giftReward: 1,
    unlockHint: '第一次收集水草',
    check: () => stats.plantsCollected >= 1
  },
  {
    id: 'five_fish',
    name: '无与伦比',
    description: '没错，这就是五鱼伦比！什么，你说谐音梗扣钱？不听不听……',
    giftReward: 1,
    unlockHint: '添加第五条鱼',
    check: () => stats.addFishClicks >= 5
  },
  {
    id: 'goalkeeper',
    name: '守门员',
    description: '十名球员已经上场，还差一个守门员。铁生已经摩拳擦掌做好准备了…',
    giftReward: 2,
    unlockHint: '添加第十条鱼',
    check: () => stats.addFishClicks >= 10
  },
  {
    id: 'womens_day',
    name: '妇女节',
    description: '女士们，节日快乐。',
    giftReward: 5,
    unlockHint: '拥有三十八条鱼',
    check: () => fishes.length >= 38
  },
  {
    id: 'pet_fish_apprentice',
    name: '摸鱼学徒',
    description: '不错，今天又靠摸鱼赚了5毛钱',
    giftReward: 1,
    unlockHint: '第10次摸鱼',
    check: () => stats.petFishClicks >= 10
  },
  {
    id: 'pet_fish_veteran',
    name: '摸鱼熟练工',
    description: '你已经掌握了基本的摸鱼技巧——偷偷去厕所用手机摸',
    giftReward: 2,
    unlockHint: '第50次摸鱼',
    check: () => stats.petFishClicks >= 50
  },
  {
    id: 'pet_fish_expert',
    name: '摸鱼高手',
    description: '你已经掌握了高级的摸鱼技巧——趁老板不在电脑小窗口摸',
    giftReward: 3,
    unlockHint: '第100次摸鱼',
    check: () => stats.petFishClicks >= 100
  },
  {
    id: 'pet_fish_master',
    name: '摸鱼大师',
    description: '无他，唯手熟尔！',
    giftReward: 3,
    unlockHint: '第500次摸鱼',
    check: () => stats.petFishClicks >= 500
  },
  {
    id: 'feed_fish_20',
    name: '再来一碗',
    description: '鱼已经习惯了「想吃就张嘴」的生活，人什么时候才能过上「穷了就来钱」的日子……',
    giftReward: 1,
    unlockHint: '投喂20次鱼',
    check: () => stats.feedFishClicks >= 20
  },
  {
    id: 'feed_fish_50',
    name: '跨界养猪',
    description: '你以养鱼的名义，成功养出了五头猪。水产局和畜牧局同时给你发来贺电，并询问你到底在养什么。',
    giftReward: 1,
    unlockHint: '投喂50次鱼',
    check: () => stats.feedFishClicks >= 50
  },
  {
    id: 'feed_fish_100',
    name: '通货膨胀',
    description: '投喂100次后，鱼已经对一粒两粒饲料不屑一顾。它们要求加薪和缩短工时。',
    giftReward: 1,
    unlockHint: '投喂100次鱼',
    check: () => stats.feedFishClicks >= 100
  },
  {
    id: 'use_shrink_bait',
    name: '"喝我"',
    description: '爱丽丝喝下了带有「喝我」标签的药水，身体一下子就变小了……',
    giftReward: 1,
    unlockHint: '使用缩小鱼饵',
    check: () => stats.shrinkBaitUsed >= 1
  },
  {
    id: 'use_magic_bait',
    name: '"吃我"',
    description: '爱丽丝吃下了带有「吃我」标签的蛋糕，身体一下子就变大了……',
    giftReward: 1,
    unlockHint: '使用神奇鱼饵',
    check: () => stats.magicBaitUsed >= 1
  },
  {
    id: 'use_legend_bait',
    name: '"吃我"2',
    description: '爱丽丝吃下了带有「吃我」标签的蛋糕，身体一下子就变大了。等一下，这有点太大了吧？！',
    giftReward: 1,
    unlockHint: '使用传说鱼饵',
    check: () => stats.legendBaitUsed >= 1
  },
  {
    id: 'use_restore_bait',
    name: '穿越',
    description: '重生后，我逆袭成为海洋霸主——海神默许了这类小说在海底流通',
    giftReward: 1,
    unlockHint: '使用还原鱼饵',
    check: () => stats.restoreBaitUsed >= 1
  },
  {
    id: 'zhen_mo_yu',
    name: '真·摸鱼',
    description: '难道摸鱼这件事也可以用别人的手替自己摸了吗？',
    giftReward: 1,
    unlockHint: '获得🐟️和✋️',
    check: () => fishes.filter(f => f.type === '🐟️').length >= 1 && fishes.filter(f => f.type === '✋️').length >= 1
  },
  {
    id: 'jian_qiu',
    name: '剪秋',
    description: '剪秋，本宫的头好痛',
    giftReward: 1,
    unlockHint: '获得✂️和🍁',
    check: () => fishes.filter(f => f.type === '✂️').length >= 1 && fishes.filter(f => f.type === '🍁').length >= 1
  }
];

// ==================== 函数定义 ====================

// 检查并解锁成就
function checkAchievements() {
  ACHIEVEMENTS.forEach(achievement => {
    if (!achievements.includes(achievement.id) && achievement.check()) {
      achievements.push(achievement.id);
      if (achievement.giftReward > 0) {
        giftCount += achievement.giftReward;
        showAchievementPopup(achievement, achievement.giftReward);
      } else {
        showAchievementPopup(achievement, 0);
      }
      saveFishToStorage();
    }
  });
  // 检查隐藏成就
  checkSecretAchievements();
}

// 检查并解锁隐藏成就
function checkSecretAchievements() {
  SECRET_ACHIEVEMENTS.forEach(achievement => {
    if (!achievements.includes(achievement.id) && achievement.check()) {
      achievements.push(achievement.id);
      if (achievement.giftReward > 0) {
        giftCount += achievement.giftReward;
        showSecretAchievementPopup(achievement, achievement.giftReward);
      } else {
        showSecretAchievementPopup(achievement, 0);
      }
      saveFishToStorage();
    }
  });
}

// 显示成就弹窗
function showAchievementPopup(achievement, reward) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
  
  const giftText = reward > 0 ? `<div style="font-size:12px;color:#F7DC6F;margin-bottom:15px;">🎁 获得 ${reward} 个礼物！</div>` : '';
  
  const popup = document.createElement('div');
  popup.style.cssText = 'background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px 40px;border-radius:20px;text-align:center;color:#fff;max-width:300px;box-shadow:0 10px 40px rgba(0,0,0,0.5);';
  popup.innerHTML = `
    <div style="font-size:48px;margin-bottom:15px;">🏆</div>
    <div style="font-size:14px;opacity:0.8;margin-bottom:10px;">成就解锁</div>
    <div style="font-size:22px;font-weight:700;margin-bottom:10px;">${achievement.name}</div>
    <div style="font-size:14px;opacity:0.9;line-height:1.5;margin-bottom:10px;">${achievement.description}</div>
    ${giftText}
    <button onclick="this.parentNode.parentNode.remove()" style="margin-top:10px;padding:10px 30px;border:none;border-radius:25px;background:rgba(255,255,255,0.2);color:#fff;cursor:pointer;font-size:14px;">确定</button>
  `;
  
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

// 显示隐藏成就弹窗（特殊样式）
function showSecretAchievementPopup(achievement, reward) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:2000;display:flex;align-items:center;justify-content:center;';
  
  const giftText = reward > 0 ? `<div style="font-size:12px;color:#F7DC6F;margin-bottom:15px;">🎁 获得 ${reward} 个礼物！</div>` : '';
  
  const popup = document.createElement('div');
  popup.style.cssText = 'background:linear-gradient(135deg,#1a1a2e 0%,#0a0a1a 100%);padding:40px 50px;border-radius:24px;text-align:center;color:#fff;max-width:320px;box-shadow:0 0 60px rgba(255,215,0,0.3),0 10px 40px rgba(0,0,0,0.5);border:1px solid rgba(255,215,0,0.2);';
  popup.innerHTML = `
    <div style="font-size:14px;opacity:0.6;margin-bottom:8px;color:#F7DC6F;">✧ 隐藏成就解锁 ✧</div>
    <div style="font-size:32px;margin-bottom:12px;">✨</div>
    <div style="font-size:20px;font-weight:700;margin-bottom:8px;color:#F7DC6F;">${achievement.name}</div>
    <div style="font-size:14px;opacity:0.85;line-height:1.6;margin-bottom:15px;font-style:italic;">"${achievement.description}"</div>
    ${giftText}
    <button onclick="this.parentNode.parentNode.remove()" style="margin-top:10px;padding:10px 30px;border:none;border-radius:20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;cursor:pointer;font-size:14px;">知晓</button>
  `;
  
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}
