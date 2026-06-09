/**
 * 小克鱼模块 - 入口文件
 * 统一对外暴露 API，供正式游戏或测试页调用
 *
 * 使用方式：
 *1. 在 HTML 中引入（注意顺序）：
 *      <script src="kle-fish/kle-config.js"></script>
 *      <script src="kle-fish/kle-data.js"></script>
 *      <script src="kle-fish/kle-share.js"></script>
 *      <script src="kle-fish/kle-ai.js"></script>
 *      <script src="kle-fish/kle-panel.js"></script>
 *      <script src="kle-fish/kle-system.js"></script>
 *
 *   2. 调用 API：
 *      window.kleSystem.init()
 *      window.kleSystem.onGiftReceived(code, userId)
 *      window.kleSystem.onLongPress(fishId)
 *      window.kleSystem.isKleFish(fishId)
 *      window.kleSystem.getHolderStatus()
 */

(function() {
  'use strict';

  // 小克鱼的 emoji（后续换成 Lottie）
  const KLE_EMOJI = '🐱';

  /**
   * 初始化模块
   * - 打开 IndexedDB
   * - 检查自然日切换
   * - 返回当前小克鱼实例（如果有）
   */
  async function init() {
    await window.kleData.openDB();
    _checkDayTransition();
    return await window.kleData.loadKleFish();
  }

  /**
   * 自然日切换检查
   * 如果 lastVisitDate < 今天，且 progress > 0，推进 currentDay
   */
  function _checkDayTransition() {
    const data = window.kleData.loadAccountData();
    if (!data.isKleHolder || data.completed) return;

    const today = _getTodayStr();
    if (data.lastVisitDate && data.lastVisitDate !== today) {
      // 日期变化，推进一天
      const dayMap = {1: 2, 2: 3 };
      const nextDay = dayMap[data.currentDay];
      if (nextDay && nextDay <=3) {
        data.currentDay = nextDay;
        data.progress = nextDay;
        data.lastVisitDate = today;
        window.kleData.saveAccountData(data);
      }
    } else if (!data.lastVisitDate) {
      data.lastVisitDate = today;
      window.kleData.saveAccountData(data);
    }
  }

  /**
   * 收到礼物码后的处理
   * @param {string} code
   * @param {string} userId
   * @returns {Promise<Object>} { success, error, fishData }
   */
  async function onGiftReceived(code, userId) {
    // 先检查是不是小克鱼专属码
    if (window.kleShare.isKleSpecialCode(code)) {
      const result = await window.kleShare.exchangeSpecialCode(code, userId);
      if (result.success) {
        await window.kleData.saveKleFish(result.fishData);
      }
      return result;
    }

    // 再检查种子码（同时支持 dev 和正式码）
    const normalizedCode = code.trim().toUpperCase();
    const isSeedCode = normalizedCode === KLE_CONFIG.SEED_CODE_DEV || normalizedCode === KLE_CONFIG.SEED_CODE;
    if (isSeedCode) {
      const result = window.kleShare.exchangeSeedCode(code, userId);
      if (result.success) {
        await window.kleData.saveKleFish(result.fishData);
      }
      return result;
    }

    return { success: false, error: 'NOT_KLE_CODE', fishData: null };
  }

  /**
   * 长按小克鱼 → 打开专属面板
   * @param {string} fishId
   */
  function onLongPress(fishId) {
    const fishData = window.kleData.loadKleFish();
    if (fishData && fishData.id === fishId) {
      window.klePanel.open(fishId);
    }
  }

  /**
   * 判断一条鱼是否是小克鱼
   * @param {string} fishId
   * @returns {boolean}
   */
  function isKleFish(fishId) {
    const fishData = window.kleData.loadKleFish();
    return fishData && fishData.id === fishId;
  }

  /**
   * 获取持有者状态
   * @returns {Object}
   */
  function getHolderStatus() {
    return window.kleData.loadAccountData();
  }

  /**
   * 渲染小克鱼到虚拟鱼缸
   * 返回小克鱼的数据，用于渲染
   */
  async function getKleFishForRender() {
    return await window.kleData.loadKleFish();
  }

  /**
   * 获取小克鱼的 emoji（后续替换为 Lottie）
   */
  function getKleEmoji() {
    return KLE_EMOJI;
  }

  /**
   * 完成一个任务
   */
  function completeTask(dayKey, taskKey) {
    window.kleData.completeTask(dayKey, taskKey);
    // 检查是否当天所有任务完成
    if (window.kleData.isDayComplete(dayKey)) {
      // 自动推进到下一天
      if (dayKey !== 'day3') {
        window.kleData.advanceToNextDay();
      } else {
        // DAY3 全部完成 →离场
        window.kleData.completeStory();
        window.kleData.deleteKleFish();
      }
    }
  }

  /**
   * 获取今日日期字符串
   */
  function _getTodayStr() {
    return new Date().toISOString().split('T')[0];
  }

  // ========== 对外暴露 API ==========

  window.kleSystem = {
    init,
    onGiftReceived,
    onLongPress,
    isKleFish,
    getHolderStatus,
    getKleFishForRender,
    getKleEmoji,
    completeTask,

    // 透传数据层 API（方便调试）
    data: {
      loadKleFish: () => window.kleData.loadKleFish(),
      saveKleFish: (d) => window.kleData.saveKleFish(d),
      deleteKleFish: () => window.kleData.deleteKleFish(),
      loadAccountData: () => window.kleData.loadAccountData(),
      saveAccountData: (d) => window.kleData.saveAccountData(d),
      addItem: (key) => window.kleData.addItem(key),
      completeTask: (day, key) => window.kleData.completeTask(day, key),
      canGenerateCode: () => window.kleData.canGenerateCode(),
      generateShareCode: (uid) => window.kleShare.generateShareCode(uid),
    }
  };

})();