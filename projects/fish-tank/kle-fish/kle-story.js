/**
 * 小克鱼模块 - 故事引擎 (kle-story.js)
 * 基于 inkjs 运行时，对接 kle-vn.js 视觉层
 */

(function () {
  'use strict';

  // ==================== 状态 ====================
  var story = null;          // inkjs.Story 实例
  var storyJson = null;      // 原始 JSON（用于重置）
  var state = {
    currentDay: 1,
  };

  // ==================== 加载故事 ====================

  /**
   * 加载指定日期的 ink 故事
   * @param {number} day 1/2/3
   * @returns {Promise}
   */
  function loadDay(day) {
    return new Promise(function (resolve, reject) {
      // 根据 devMode 确定路径
      var jsonPath = window.KLE_CONFIG && window.KLE_CONFIG.devMode
        ? 'kle-fish/ink/script.json'
        : 'kle-fish/ink/script.json';

      fetch(jsonPath)
        .then(function (res) {
          if (!res.ok) throw new Error('加载故事失败: ' + jsonPath);
          return res.text();
        })
        .then(function (jsonString) {
          // 去掉 var storyContent = wrapper（如果有）
          var cleaned = jsonString.replace(/^\s*var\s+storyContent\s*=\s*/, '').replace(/;\s*$/, '');
          storyJson = cleaned;
          story = new inkjs.Story(cleaned);
          state.currentDay = day;
          resolve({
            day: day,
            canContinue: story.canContinue
          });
        })
        .catch(reject);
    });
  }

  // ==================== 核心读取 ====================

  /**
   * 获取下一段文本
   * @returns {string|null} 文本内容，无则返回 null
   */
  function getNextText() {
    if (!story || !story.canContinue) return null;
    return story.Continue();
  }

  /**
   * 检查能否继续（还有文本未读完）
   */
  function canContinue() {
    return story && story.canContinue;
  }

  /**
   * 获取当前选项列表
   * @returns {Array} [{text: string, index: number}]
   */
  function getChoices() {
    if (!story) return [];
    return story.currentChoices.map(function (choice, i) {
      return {
        text: choice.text,
        index: i
      };
    });
  }

  /**
   * 是否有选项等待玩家选择
   */
  function hasChoices() {
    return story && story.currentChoices && story.currentChoices.length > 0;
  }

  /**
   * 玩家选择选项
   * @param {number} index 选项索引
   */
  function choose(index) {
    if (!story) return;
    story.ChooseChoiceIndex(index);
  }

  // ==================== 变量读写 ====================

  /**
   * 设置故事变量
   * @param {string} name 变量名
   * @param {*} value 值
   */
  function setVar(name, value) {
    if (!story) return;
    story.variablesState[name] = value;
  }

  /**
   * 读取故事变量
   * @param {string} name 变量名
   * @returns {*}
   */
  function getVar(name) {
    if (!story) return undefined;
    return story.variablesState[name];
  }

  /**
   * 获取所有变量（调试用）
   */
  function getAllVars() {
    if (!story) return {};
    var vars = {};
    var state = story.variablesState;
    for (var key in state) {
      if (state.hasOwnProperty(key)) {
        vars[key] = state[key];
      }
    }
    return vars;
  }

  // ==================== 跳转 ====================

  /**
   * 跳转到指定节点（用于读档后定位）
   * @param {string} path 节点路径，如 "day1_start"
   */
  function jumpTo(path) {
    if (!story) return;
    story.ChoosePathString(path);
  }

  // ==================== 状态保存/恢复 ====================

  var SAVE_KEY = 'kle_fish_save';
  var VARS_KEY = 'kle_story_vars';

  /**
   * 保存当前进度
   * @returns {Object} 存档对象
   */
  function saveState() {
    if (!story) return null;
    return {
      storyState: story.state.ToJson(),
      savedAt: Date.now(),
      day: state.currentDay || 1,
    };
  }

  /**
   * 保存存档到 localStorage
   */
  function saveToStorage() {
    var data = saveState();
    if (!data) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    // 同时保存公共变量快照
    localStorage.setItem(VARS_KEY, JSON.stringify(getAllVars()));
  }

  /**
   * 从 localStorage 读取存档
   * @returns {Object|null}
   */
  function loadFromStorage() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /**
   * 检查是否有存档
   * @returns {boolean}
   */
  function hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * 恢复存档
   * @param {Object} saveData 存档对象（来自 loadFromStorage）
   * @returns {Promise}
   */
  function restoreSave(saveData) {
    if (!saveData || !saveData.storyState) return Promise.reject('无效存档');
    return loadDay(saveData.day).then(function () {
      story.state.LoadJson(saveData.storyState);
      return saveData;
    });
  }

  /**
   * 清除存档
   */
  function clearSave() {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(VARS_KEY);
  }

  /**
   * 强制设置当前 day（用于 loadDay 前）
   */
  function setCurrentDay(day) {
    state.currentDay = day;
  }

  /**
   * 重置故事（从头开始）
   */
  function reset() {
    if (!storyJson) return;
    story = new inkjs.Story(storyJson);
  }

  // ==================== 对外接口 ====================
  window.kleStory = {
    loadDay: loadDay,
    getNextText: getNextText,
    canContinue: canContinue,
    getChoices: getChoices,
    hasChoices: hasChoices,
    choose: choose,
    setVar: setVar,
    getVar: getVar,
    getAllVars: getAllVars,
    jumpTo: jumpTo,
    saveState: saveState,
    saveToStorage: saveToStorage,
    loadFromStorage: loadFromStorage,
    hasSave: hasSave,
    restoreSave: restoreSave,
    clearSave: clearSave,
    setCurrentDay: setCurrentDay,
    reset: reset,
  };

})();