/**
 * 小克鱼模块 - 数据层
 * 负责 IndexedDB（kleFish store）和 localStorage 的读写
 */

(function() {
  'use strict';

  const DB_NAME = 'fishTankDB';
  const STORE_KLE_FISH = KLE_CONFIG.devMode ? 'kleFish_dev' : 'kleFish';
  const DB_VERSION = 1;

  //当前的 DB 实例
  let _db = null;

  // ========== IndexedDB 基础操作 ==========

  /**
   * 打开数据库（独立的 kleFish store）
   */
  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        _db = request.result;
        resolve(_db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_KLE_FISH)) {
          db.createObjectStore(STORE_KLE_FISH, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * 获取当前数据库实例
   */
  function getDB() {
    if (_db) return Promise.resolve(_db);
    return openDB();
  }

  // ========== kleFish store 操作（鱼本体）==========

  /**
   * 保存小克鱼实例到 IndexedDB
   * @param {Object} fishData { id, type, x, y, receivedAt, generatedBy, ancestors }
   */
  function saveKleFish(fishData) {
    return loadKleFish().then(existing => {
      if (existing) {
        return Promise.reject(new Error('ALREADY_HAS_KLE_FISH'));
      }
      return getDB();
    }).then(db => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_KLE_FISH, 'readwrite');
        const store = tx.objectStore(STORE_KLE_FISH);
        const request = store.put(fishData);
        request.onsuccess = () => resolve(fishData);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 从 IndexedDB 读取小克鱼实例
   */
  function loadKleFish() {
    return getDB().then(db => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_KLE_FISH, 'readonly');
        const store = tx.objectStore(STORE_KLE_FISH);
        const request = store.getAll();
        request.onsuccess = () => {
          const results = request.result;
          // 返回第一条（理论上只有一条）
          resolve(results.length > 0 ? results[0] : null);
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * 删除小克鱼实例（通常在 DAY3 离场时调用）
   */
  function deleteKleFish() {
    return getDB().then(db => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_KLE_FISH, 'readwrite');
        const store = tx.objectStore(STORE_KLE_FISH);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
  }

  // ========== localStorage 操作（账户数据）==========

  /**
   * 获取 localStorage key（带环境后缀）
   */
  function _getLSKey(baseKey) {
    const suffix = KLE_CONFIG.devMode ? KLE_CONFIG.dbSuffix : '';
    return baseKey + suffix;
  }

  /**
   * 默认的账户数据
   */
  function _defaultAccountData() {
    return {
      isKleHolder: false,
      canGenerateKleCode: false,
      progress: 0,
      currentDay: 1,
      lastVisitDate: '',
      completed: false,
      tasks: {
        day1: { pendulum: false, coin: false, divination: false },
        day2: { door: false, clock: false, fur: false, tea: false },
        day3: { ritual: false }
      },
      items: [],
      itemsObtainedAt: {},
      generatedBy: null,
      ancestors: []
    };
  }

  /**
   * 保存账户数据
   * @param {Object} data
   */
  function saveAccountData(data) {
    const key = _getLSKey(KLE_CONFIG.STORAGE_KEYS.accountData);
    localStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * 读取账户数据
   */
  function loadAccountData() {
    const key = _getLSKey(KLE_CONFIG.STORAGE_KEYS.accountData);
    const raw = localStorage.getItem(key);
    if (!raw) return _defaultAccountData();
    try {
      return { ..._defaultAccountData(), ...JSON.parse(raw) };
    } catch {
      return _defaultAccountData();
    }
  }

  /**
   * 清除账户数据
   */
  function clearAccountData() {
    const key = _getLSKey(KLE_CONFIG.STORAGE_KEYS.accountData);
    localStorage.removeItem(key);
  }

  // ========== 便捷操作 ==========

  /**
   * 检查用户是否已有小克鱼（账户维度）
   */
  function hasKleHolder() {
    const data = loadAccountData();
    return data.isKleHolder;
  }

  /**
   * 检查用户是否可以生成分享码
   */
  function canGenerateCode() {
    const data = loadAccountData();
    return data.canGenerateKleCode;
  }

  /**
   * 给账户数据追加道具
   * @param {string} itemKey
   */
  function addItem(itemKey) {
    const data = loadAccountData();
    if (!data.items.includes(itemKey)) {
      data.items.push(itemKey);
      data.itemsObtainedAt[itemKey] = Date.now();
      saveAccountData(data);
    }
  }

  /**
   * 完成任务
   * @param {string} dayKey 'day1' | 'day2' | 'day3'
   * @param {string} taskKey
   */
  function completeTask(dayKey, taskKey) {
    const data = loadAccountData();
    if (data.tasks[dayKey] && taskKey in data.tasks[dayKey]) {
      data.tasks[dayKey][taskKey] = true;
      saveAccountData(data);
    }
  }

  /**
   * 检查某天任务是否全部完成
   * @param {string} dayKey
   */
  function isDayComplete(dayKey) {
    const data = loadAccountData();
    const dayTasks = data.tasks[dayKey];
    return Object.values(dayTasks).every(v => v === true);
  }

  /**
   * 推进到下一天
   */
  function advanceToNextDay() {
    const data = loadAccountData();
    if (data.currentDay < 3) {
      data.currentDay++;
      data.progress = data.currentDay;
      saveAccountData(data);
    }
    return data.currentDay;
  }

  /**
   * 标记故事完成 + 解锁分享资格
   */
  function completeStory() {
    const data = loadAccountData();
    data.completed = true;
    data.canGenerateKleCode = true;
    data.progress = 3;
    saveAccountData(data);
  }

  /**
   * 清除所有测试数据（IndexedDB + localStorage）
   */
  function clearAllTestData() {
    clearAccountData();
    return deleteKleFish().then(() => {
      console.log('[kle-data] 所有测试数据已清除');
    });
  }

  // ========== 对外暴露 API ==========

  window.kleData = {
    // IndexedDB
    openDB,
    saveKleFish,
    loadKleFish,
    deleteKleFish,

    // localStorage
    saveAccountData,
    loadAccountData,
    clearAccountData,

    // 便捷操作
    hasKleHolder,
    canGenerateCode,
    addItem,
    completeTask,
    isDayComplete,
    advanceToNextDay,
    completeStory,

    // 测试
    clearAllTestData
  };

})();