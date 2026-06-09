/**
 * 小克鱼模块 - 分享码系统
 * 种子码兑换 + 一次性特殊分享码生成与解析
 */

(function() {
  'use strict';

  /**
   * 判断是否为小克鱼专属码
   * 通过 base64 + lz-string 压缩的内容里是否含特定标记
   */
  function isKleSpecialCode(code) {
    if (!code) return false;
    try {
      // 尝试解析，特殊码会包含 'KLE' 标记
      const raw = extractRaw(code);
      if (!raw) return false;
      const decompressed = LZString.decompressFromBase64(raw);
      if (!decompressed) return false;
      const parsed = JSON.parse(decompressed);
      return parsed && parsed._kle === true;
    } catch {
      return false;
    }
  }

  /**
   * 提取原始内容（base64 解压后）
   */
  function extractRaw(code) {
    try {
      const match = code.match(/【([^】]+)】/);
      const raw = match ? match[1] : code.trim();
      return raw;
    } catch {
      return null;
    }
  }

  /**
   * 解析礼物码（通用解析，返回数据）
   * @param {string} code
   * @returns {Object|null} { emoji, sender, blessing } 或 null
   */
  function parseGiftCode(code) {
    if (!code) return null;
    try {
      const raw = extractRaw(code);
      if (!raw) return null;
      const decompressed = LZString.decompressFromBase64(raw);
      if (!decompressed) return null;
      return JSON.parse(decompressed);
    } catch {
      return null;
    }
  }

  /**
   * 种子码兑换
   * @param {string} code 用户输入的码
   * @param {string} currentUserId 当前用户ID
   * @returns {Object} { success, error, fishData }
   */
  function exchangeSeedCode(code, currentUserId) {
    const normalizedCode = code.trim().toUpperCase();
    const seedCode = KLE_CONFIG.devMode ? KLE_CONFIG.SEED_CODE_DEV : KLE_CONFIG.SEED_CODE;

    if (normalizedCode !== seedCode) {
      return { success: false, error: 'INVALID_CODE', fishData: null };
    }

    if (window.kleData.hasKleHolder()) {
      return { success: false, error: 'ALREADY_HOLDER', fishData: null };
    }

    const fishData = {
      id: 'fish-kle-' + Date.now(),
      type: '🐱',
      x: Math.random() * 200 + 50,
      y: Math.random() * 200 + 50,
      isKleFish: true,
      receivedAt: Date.now(),
      generatedBy: null,
      ancestors: []
    };

    // 保存小克鱼
    return window.kleData.saveKleFish(fishData).then(() => {
      // 更新账户数据
      const accountData = window.kleData.loadAccountData();
      accountData.isKleHolder = true;
      accountData.progress = 1;
      accountData.currentDay = 1;
      accountData.lastVisitDate = _getTodayStr();
      window.kleData.saveAccountData(accountData);

      return { success: true, error: null, fishData };
    });
  }

  /**
   * 解析特殊分享码（用户 B 收到用户 A 的码）
   * @param {string} code
   * @param {string} currentUserId 当前用户ID
   * @returns {Object} { success, error, fishData }
   */
  function exchangeSpecialCode(code, currentUserId) {
    if (!isKleSpecialCode(code)) {
      return { success: false, error: 'NOT_KLE_CODE', fishData: null };
    }

    const raw = extractRaw(code);
    const decompressed = LZString.decompressFromBase64(raw);
    const parsed = JSON.parse(decompressed);

    if (parsed._used) {
      return { success: false, error: 'CODE_ALREADY_USED', fishData: null };
    }

    if (window.kleData.hasKleHolder()) {
      return { success: false, error: 'ALREADY_HOLDER', fishData: null };
    }

    const generatorId = parsed._from;
    const ancestorsChain = parsed._ancestors || [];

    const fishData = {
      id: 'fish-kle-' + Date.now(),
      type: '🐱',
      x: Math.random() * 200 + 50,
      y: Math.random() * 200 + 50,
      isKleFish: true,
      receivedAt: Date.now(),
      generatedBy: generatorId,
      ancestors: [...ancestorsChain, generatorId]
    };

    return window.kleData.saveKleFish(fishData).then(() => {
      const accountData = window.kleData.loadAccountData();
      accountData.isKleHolder = true;
      accountData.progress = 1;
      accountData.currentDay = 1;
      accountData.lastVisitDate = _getTodayStr();
      accountData.generatedBy = generatorId;
      accountData.ancestors = fishData.ancestors;
      window.kleData.saveAccountData(accountData);

      return { success: true, error: null, fishData };
    });
  }

  /**
   * 生成分享码（一次性特殊码）
   * @param {string} generatorUserId 生成者 userId
   * @returns {Object} { success, error, code }
   */
  function generateShareCode(generatorUserId) {
    if (!window.kleData.canGenerateCode()) {
      return { success: false, error: 'CANNOT_GENERATE', code: null };
    }

    const accountData = window.kleData.loadAccountData();
    const ancestors = accountData.ancestors || [];

    const payload = {
      _kle: true,
      _from: generatorUserId,
      _ancestors: ancestors,
      _used: false,
      _createdAt: Date.now()
    };

    const jsonStr = JSON.stringify(payload);
    const compressed = LZString.compressToBase64(jsonStr);
    const code = '【' + compressed + '】';

    // 消耗分享资格（每人只能生成一次）
    accountData.canGenerateKleCode = false;
    window.kleData.saveAccountData(accountData);

    return { success: true, error: null, code };
  }

  /**
   * 获取今日日期字符串
   */
  function _getTodayStr() {
    return new Date().toISOString().split('T')[0];
  }

  // ========== 对外暴露 API ==========

  window.kleShare = {
    isKleSpecialCode,
    parseGiftCode,
    exchangeSeedCode,
    exchangeSpecialCode,
    generateShareCode
  };

})();