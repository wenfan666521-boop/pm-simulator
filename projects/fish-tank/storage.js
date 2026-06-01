// 拆分自 logic.js - 全局变量 + IndexedDB + 存档
// 必须最先加载

  const fishTypes = ['🐠', '🐟', '🦈', '🐙', '🦑', '🦀', '🦐', '🐚'];
  const plantTypes = ['🍀', '🌱', '🌿', '🪸'];
  // 特殊鱼定义：code -> { name, svg }
  const SPECIAL_FISH = {
    'NIKI': { name: 'niki', svg: 'assets/special-fishes/niki.svg' }
  };
  let fishes = [];
  let bubbles = [];
  let plants = [];
  let fishIdCounter = 0;
  let plantIdCounter = 0; // 每缸独立，在 renderFishesAndPlants 时从当前 plants 计算恢复
  let lastAddFishTime = 0; // 上次添加鱼的时间
  const ADD_FISH_COOLDOWN = 30 * 60 * 1000; // 30分钟冷却时间
  let lastFeedFishTime = 0; // 上次喂鱼的时间
  const FEED_FISH_COOLDOWN = 15 * 60 * 1000; // 15分钟喂鱼冷却时间

  // 手动投喂模式状态
  let isFeedingMode = false;
  let currentBait = null;
  let baitCheckInterval = null;

  // ==================== IndexedDB 数据库 ====================
  const DB_NAME = 'FishTankDB';
  const DB_VERSION = 2; // 升级版本号以支持多鱼缸
  let db = null;

  // ==================== 多鱼缸系统 ====================
  let currentTankId = 'default'; // 当前鱼缸ID
  let currentTankName = '我的鱼缸'; // 当前鱼缸名称
  let currentTankCreatedAt = Date.now(); // 当前鱼缸创建时间
  let tanks = []; // 所有鱼缸列表

  // 初始化 IndexedDB 数据库

  let bgAudio = null;
  let bgMusicEnabled = localStorage.getItem('bgMusicEnabled') === 'true';

  // 重力感应状态
  let gravityEnabled = localStorage.getItem('gravityEnabled') === 'true';
  let gravityX = 0; // X轴倾斜值 (-90 ~ 90)
  let gravityY = 0; // Y轴倾斜值 (-90 ~ 90)
  let gravitySensitivity = parseFloat(localStorage.getItem('gravitySensitivity') || '0.3'); // 重力感应灵敏度 (0.1~1.0

  let stats = {
    addFishClicks: 0,      // 点击添加鱼按钮次数
    feedFishClicks: 0,     // 点击喂鱼按钮次数
    successfulFeeds: 0,     // 成功喂鱼次数(鱼实际变大)
    plantsCollected: 0,     // 收集水草次数
    cleanCount: 0,          // 清理次数
    petFishClicks: 0,      // 点击鱼的次数(摸鱼)
    giftsSent: 0,           // 送礼次数
    giftsReceived: 0,       // 收礼次数
    legendBaitUsed: 0,      // 传说鱼饵使用次数
    magicBaitUsed: 0,       // 神奇鱼饵使用次数
    shrinkBaitUsed: 0,      // 缩小鱼饵使用次数
    restoreBaitUsed: 0      // 还原鱼饵使用次数
  };

  // 礼物系统全局变量
  const INITIAL_GIFT_COUNT = 1; // 初始礼物数
  let giftCount = INITIAL_GIFT_COUNT; // 当前剩余礼物数
  let totalGiftsSent = 0; // 历史送礼总数
  let usedCodes = []; // 已使用的礼物码列表
  let userId = ''; // 用户唯一ID(设备指纹)

  // 开发者模式
  const DEV_MODE_PASSWORD = 'fish666'; // 测试口令
  const DEV_DAILY_LIMIT = 3; // 每日测试口令使用次数
  const DEV_REWARD_AMOUNT = 3; // 每次奖励礼物数
  let devClickCount = 0; // 连续点击次数
  let devLastClickTime = 0; // 上次点击时间
  let devDailyUsage = 0; // 今日已使用次数
  let devLastUsageDate = ''; // 上次使用日期
  let devModeUnlocked = false; // 开发者模式是否解锁(刷新重置)

  // ==================== 离线事件系统状态 ====================
  let offlineEventLog = []; // 事件日志（最多保留 EVENT_LOG_MAX 条，倒序）
  let offlineStats = { totalTriggered: 0, totalRewards: 0, legendaryCount: 0 };
  let dailyOnlineEventCount = 0; // 今日在线事件触发次数
  let dailyOfflineEventCount = 0; // 今日离线事件触发次数
  let dailyEventDate = ''; // 记录日期，跨天重置
  let offlineHeartbeatTimer = null; // 兜底写时间戳的定时器
  const LAST_VISIT_KEY = 'fishTankLastVisitTime';

  // 特殊鱼饵状态
  let nextFeedMagicBait = false; // 下次喂鱼触发神奇鱼饵（2倍）
  let nextFeedLegendBait = false; // 下次喂鱼触发传说鱼饵（10倍）
  let nextFeedShrinkBait = false; // 下次喂鱼触发缩小鱼饵（1/2倍）
  let nextFeedRestoreBait = false; // 下次喂鱼触发还原鱼饵（1倍）

  // 生成用户唯一ID

  const itemToEmojiMap = {
    '金鱼': '🐠', '小鱼': '🐟', '鲨鱼': '🦈', '章鱼': '🐙', '乌贼': '🦑',
    '螃蟹': '🦀', '虾': '🦐', '贝壳': '🐚', '海马': '🐴', '海豚': '🐬',
    '鲸鱼': '🐳', '水母': '🪼', '乌龟': '🐢', '珊瑚': '🪸', '海星': '⭐',
    '海胆': '🦔', '龙虾': '🦞', '河豚': '🐡', '飞鱼': '🐠', '热带鱼': '🐠',
    '神仙鱼': '🐠', '斗鱼': '🐟', '锦鲤': '🐟', '魟鱼': '🦈', '鲨鱼': '🦈',
    '青蛙': '🐸', '鸭子': '🦆', '天鹅': '🦢', '鲸鲨': '🦈', '海豹': '🦭',
    '海狮': '🦭', '海象': '🦣', '三文鱼': '🐟', '金枪鱼': '🐟', '鳗鱼': '🐟',
    '海龟': '🐢', '蜥蜴': '🦎', '蛇': '🐍', '恐龙': '🦕', '龙': '🐉',
    '独角兽': '🦄', '凤凰': '🦅', '鹰': '🦅', '鹦鹉': '🦜', '猫': '🐱',
    '狗': '🐶', '兔子': '🐰', '熊猫': '🐼', '狐狸': '🦊', '熊': '🐻',
    '老虎': '🐯', '狮子': '🦁', '豹': '🐆', '马': '🐴', '鹿': '🦌',
    '牛': '🐮', '猪': '🐷', '羊': '🐑', '鸡': '🐔', '鹰': '🦅',
    '孔雀': '🦚', '火烈鸟': '🦩', '鸽子': '🐦', '猫头鹰': '🦉', '蝴蝶': '🦋',
    '蜜蜂': '🐝', '瓢虫': '🐞', '蚂蚁': '🐜', '蜗牛': '🐌', '毛毛虫': '🐛'
  };

  // 检测是否在iframe中
  const isInIframe = window.self !== window.top;


  // 初始化 IndexedDB 数据库
  function initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => { console.error('IndexedDB 打开失败:', request.error); reject(request.error); };
      request.onsuccess = () => { db = request.result; console.log('IndexedDB 数据库连接成功'); resolve(db); };
      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        const oldVersion = event.oldVersion;
        // 版本1: 基础数据
        if (oldVersion < 1) {
          if (!database.objectStoreNames.contains('fishTankData')) database.createObjectStore('fishTankData', { keyPath: 'id' });
          if (!database.objectStoreNames.contains('background')) database.createObjectStore('background', { keyPath: 'id' });
        }
        // 版本2: 多鱼缸支持
        if (oldVersion < 2) {
          if (!database.objectStoreNames.contains('tanks')) database.createObjectStore('tanks', { keyPath: 'id' });
          if (!database.objectStoreNames.contains('tankBackgrounds')) database.createObjectStore('tankBackgrounds', { keyPath: 'id' });
        }
      };
    });
  }

  // 保存当前鱼缸数据到 IndexedDB
  function saveGameDataToDB() {
    return new Promise((resolve, reject) => {
      if (!db) { reject(new Error('DB not initialized')); return; }
      const fishData = fishes.map(f => ({ id: f.id, type: f.type, x: f.x, y: f.y, dx: f.dx, dy: f.dy, feedCount: f.feedCount||0, isSpecial: f.isSpecial||false, collected: f.collected||false, name: f.name||'', description: f.description||'', collectedAt: f.collectedAt||null, sender: f.sender||'', blessing: f.blessing||'' }));
      const plantData = []; // 水草不存档，动态生成
      const data = { id: 'gameData', fishes: fishData, plants: plantData, lastAddFishTime, lastFeedFishTime, achievements, nextPlantGenerateTime, stats, giftData: { giftCount, totalGiftsSent, usedCodes, userId, devDailyUsage, devLastUsageDate }, offlineEventLog, offlineStats, dailyData: { dailyOnlineEventCount, dailyOfflineEventCount, dailyEventDate } };
      // 同时保存到旧位置和当前鱼缸
      const transaction = db.transaction(['fishTankData', 'tanks'], 'readwrite');
      transaction.objectStore('fishTankData').put(data);
      // 保存当前鱼缸
      const tankData = {
        id: currentTankId,
        name: currentTankName,
        fishes: fishData,
        plants: plantData,
        lastAddFishTime,
        lastFeedFishTime,
        nextPlantGenerateTime,
        createdAt: currentTankCreatedAt,
        lastFishId: fishIdCounter  // ✅ 保存该鱼缸的鱼ID计数器
      };
      transaction.objectStore('tanks').put(tankData);
      transaction.oncomplete = () => { console.log('游戏数据已保存到 IndexedDB'); resolve(); };
      transaction.onerror = () => { console.error('保存失败:', transaction.error); reject(transaction.error); };
    });
  }

  // 保存单个鱼缸数据
  function saveTankData(tankId, tankData) {
    return new Promise((resolve, reject) => {
      if (!db) { reject(new Error('DB not initialized')); return; }
      const transaction = db.transaction(['tanks'], 'readwrite');
      const request = transaction.objectStore('tanks').put({ id: tankId, ...tankData });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 加载单个鱼缸数据
  function loadTankData(tankId) {
    return new Promise((resolve, reject) => {
      if (!db) { reject(new Error('DB not initialized')); return; }
      const transaction = db.transaction(['tanks'], 'readonly');
      const request = transaction.objectStore('tanks').get(tankId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // 加载所有鱼缸列表
  function loadAllTanks() {
    return new Promise((resolve, reject) => {
      if (!db) { reject(new Error('DB not initialized')); return; }
      const tanks = [];
      const transaction = db.transaction(['tanks'], 'readonly');
      const store = transaction.objectStore('tanks');
      store.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          tanks.push(cursor.value);
          cursor.continue();
        } else {
          resolve(tanks);
        }
      };
      store.openCursor().onerror = () => reject(store.openCursor().error);
    });
  }

  // 删除鱼缸
  function deleteTank(tankId) {
    return new Promise((resolve, reject) => {
      if (!db) { reject(new Error('DB not initialized')); return; }
      const transaction = db.transaction(['tanks', 'tankBackgrounds'], 'readwrite');
      transaction.objectStore('tanks').delete(tankId);
      transaction.objectStore('tankBackgrounds').delete(tankId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // 从 IndexedDB 加载游戏数据
  function loadGameDataFromDB() {
    return new Promise((resolve, reject) => {
      if (!db) { reject(new Error('DB not initialized')); return; }
      const transaction = db.transaction(['fishTankData'], 'readonly');
      const store = transaction.objectStore('fishTankData');
      const request = store.get('gameData');
      request.onsuccess = () => { resolve(request.result || null); };
      request.onerror = () => { reject(request.error); };
    });
  }

  // 保存背景图到 IndexedDB (当前鱼缸)
  function saveBackgroundToDB(dataUrl) {
    return new Promise((resolve, reject) => {
      if (!db) { reject(new Error('DB not initialized')); return; }
      
      try {
        const base64 = dataUrl.split(',')[1];
        const binary = atob(base64);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i));
        }
        const mimeType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg';
        const blob = new Blob([new Uint8Array(array)], { type: mimeType });
        
        // 只保存到新的 tankBackgrounds 存储（按鱼缸ID隔离）
        // 不再写入旧的 'background' 存储，避免 fallback 时互相覆盖
        const transaction = db.transaction(['tankBackgrounds'], 'readwrite');
        transaction.objectStore('tankBackgrounds').put({ id: currentTankId, blob, timestamp: Date.now() });
        transaction.oncomplete = () => { console.log('背景图已保存到 IndexedDB'); resolve(); };
        transaction.onerror = () => { reject(transaction.error); };
      } catch (err) {
        reject(err);
      }
    });
  }

  // 从 IndexedDB 加载背景图 (当前鱼缸)
  function loadBackgroundFromDB() {
    return new Promise((resolve, reject) => {
      if (!db) { reject(new Error('DB not initialized')); return; }
      const transaction = db.transaction(['tankBackgrounds'], 'readonly');
      const request = transaction.objectStore('tankBackgrounds').get(currentTankId);
      request.onsuccess = () => {
        if (request.result?.blob) {
          resolve(URL.createObjectURL(request.result.blob));
        } else {
          // 回退到旧的全局背景
          const oldTransaction = db.transaction(['background'], 'readonly');
          const oldRequest = oldTransaction.objectStore('background').get('tankBackground');
          oldRequest.onsuccess = () => resolve(oldRequest.result?.blob ? URL.createObjectURL(oldRequest.result.blob) : null);
        }
      };
      request.onerror = () => { reject(request.error); };
    });
  }

  // 显示存档管理面板
  function showSavePanel() {
    const overlay = document.createElement('div');
    overlay.id = 'savePanelOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:30px;border-radius:20px;color:#fff;width:280px;box-shadow:0 15px 50px rgba(0,0,0,0.5);">' +
      '<div style="text-align:center;font-size:18px;font-weight:bold;margin-bottom:20px;">📦 存档管理</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<button onclick="exportSave()" style="padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">📤 导出存档</button>' +
      '<button onclick="document.getElementById(\'saveFileInput\').click()" style="padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">📥 导入存档</button>' +
      '</div>' +
      '<button onclick="document.getElementById(\'savePanelOverlay\').remove()" style="margin-top:20px;width:100%;padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">关闭</button>' +
      '<input type="file" id="saveFileInput" accept=".json" style="display:none;" onchange="importSave(this.files[0])">' +
      '</div>';

    document.body.appendChild(overlay);
  }

  // 导出存档（支持多鱼缸）
  function exportSave() {
    // 导出时移除每个鱼缸的 plants（水草不需要存档）
    const tanksForExport = tanks.map(tank => ({
      ...tank,
      plants: []
    }));
    
    const saveData = {
      version: 2, // 升级版本号，标识新格式
      exportTime: new Date().toISOString(),
      tanks: tanksForExport, // 所有鱼缸数据（不含水草）
      currentTankId: currentTankId, // 当前激活的鱼缸
      stats: stats,
      achievements: achievements,
      giftCount: giftCount,
      usedCodes: usedCodes
    };

    const json = JSON.stringify(saveData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = url;
    a.download = `fish_tank_save_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('存档已导出！（包含 ' + tanks.length + ' 个鱼缸）');
  }

  // 导入存档（支持多鱼缸）
  function importSave(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // 去除 UTF-8 BOM 头（\uFEFF），避免某些设备导出的文件带有BOM导致解析失败
        let text = e.target.result;
        if (text.charCodeAt(0) === 0xFEFF) {
          text = text.slice(1);
        }
        const data = JSON.parse(text);
        
        // 兼容旧版本（v1只有fishes，没有tanks）
        if (data.version >= 2 && data.tanks && data.currentTankId) {
          // 新格式：完整多鱼缸数据
          tanks = data.tanks;
          currentTankId = data.currentTankId;
          
          // 找到当前鱼缸的数据
          const currentTank = tanks.find(t => t.id === currentTankId);
          if (currentTank) {
            fishes = currentTank.fishes || [];
            currentTankName = currentTank.name || '我的鱼缸';
          }
        } else if (data.fishes && data.stats) {
          // 旧格式（v1）：只有单个鱼缸数据，转换成多鱼缸格式
          tanks = [{
            id: 'default',
            name: '我的鱼缸',
            fishes: data.fishes || [],
            plants: [],
            lastAddFishTime: 0,
            lastFeedFishTime: 0,
            nextPlantGenerateTime: Date.now(),
            createdAt: Date.now(),
            lastFishId: 0
          }];
          currentTankId = 'default';
          fishes = data.fishes || [];
        } else {
          throw new Error('Invalid save file');
        }
        
        stats = { ...stats, ...data.stats };
        achievements = data.achievements || [];
        giftCount = data.giftCount || 1;
        usedCodes = data.usedCodes || [];
        
        // 保存到 IndexedDB
        await saveAllTanks();
        // 同步全局数据（成就、统计、礼物等）到 fishTankData，让 init() 能读到
        await saveGameDataToDB();
        localStorage.setItem('lastTankId', currentTankId);
        
        location.reload();
      } catch (err) {
        alert('存档导入失败：文件格式错误');
      }
    };
    reader.readAsText(file);
  }

  // 保存鱼到localStorage
  function saveFishToStorage() {
    const fishData = fishes.map(f => ({ id: f.id, type: f.type, x: f.x, y: f.y, dx: f.dx, dy: f.dy, feedCount: f.feedCount || 0, isSpecial: f.isSpecial || false, collected: f.collected || false, name: f.name || '', description: f.description || '', collectedAt: f.collectedAt || null, sender: f.sender || '', blessing: f.blessing || '' }));
    const plantData = plants.map(p => ({ id: p.id, type: p.type, x: p.x, y: p.y }));
    const data = {
      fishes: fishData,
      plants: plantData,
      lastAddFishTime,
      lastFeedFishTime,
      achievements,
      nextPlantGenerateTime,
      stats,
      giftData: {
        giftCount: giftCount,
        totalGiftsSent: totalGiftsSent,
        usedCodes: usedCodes,
        userId: userId,
        devDailyUsage: devDailyUsage,
        devLastUsageDate: devLastUsageDate
      }
    };
    localStorage.setItem('fishTankData', JSON.stringify(data));
  }

  // 从localStorage加载鱼
  function loadFishFromStorage() {
    const savedData = localStorage.getItem('fishTankData');
    if (savedData) applyGameData(JSON.parse(savedData));
  }

  // 应用游戏数据（统一加载逻辑，IndexedDB 和 localStorage 共用）
  function applyGameData(data, overwriteFishAndPlants = true) {
    if (!data) return;
    
    lastAddFishTime = data.lastAddFishTime || 0;
    lastFeedFishTime = data.lastFeedFishTime || 0;
    achievements = data.achievements || [];
    nextPlantGenerateTime = data.nextPlantGenerateTime || 0;
    stats = data.stats || { addFishClicks:0, feedFishClicks:0, successfulFeeds:0, plantsCollected:0, cleanCount:0, petFishClicks:0, giftsSent:0, giftsReceived:0, legendBaitUsed:0, magicBaitUsed:0, shrinkBaitUsed:0, restoreBaitUsed:0 };
    offlineEventLog = Array.isArray(data.offlineEventLog) ? data.offlineEventLog : [];
    offlineStats = data.offlineStats || { totalTriggered: 0, totalRewards: 0, legendaryCount: 0 };
    if (data.dailyData) {
      dailyOnlineEventCount = data.dailyData.dailyOnlineEventCount || 0;
      dailyOfflineEventCount = data.dailyData.dailyOfflineEventCount || 0;
      dailyEventDate = data.dailyData.dailyEventDate || '';
    }
    if (data.giftData) {
      giftCount = data.giftData.giftCount ?? INITIAL_GIFT_COUNT;
      totalGiftsSent = data.giftData.totalGiftsSent || 0;
      usedCodes = data.giftData.usedCodes || [];
      devDailyUsage = data.giftData.devDailyUsage || 0;
      devLastUsageDate = data.giftData.devLastUsageDate || '';
    }
    
    // ⚠️ 只有当 overwriteFishAndPlants = true 时才重新渲染鱼和植物
    // 否则只更新全局数据（成就、统计、礼物等），不碰鱼和植物
    if (overwriteFishAndPlants) {
      fishes = data.fishes || [];
      plants = []; // 水草不存档，动态生成
      renderFishesAndPlants();
    }
    
    updateFishCount();
  }
