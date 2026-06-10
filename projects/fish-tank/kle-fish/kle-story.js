(function () {
  'use strict';

  // ==================== 常量 ====================
  // 章节列表（顺序很重要，用于找下一章）
  var CHAPTER_LIST = [
    'day1-1', 'day1-2', 'day1-3',
    'day2-1', 'day2-2',
    'day3-1', 'day3-2',
  ];

  var CHAPTER_NAMES = {
    'day1-1': '初临·始',
    'day1-2': '初临·寻',
    'day1-3': '初临·别',
    'day2-1': '仪式·晓',
    'day2-2': '仪式·寻',
    'day3-1': '离场·晨',
    'day3-2': '离场·终',
  };

  // ==================== 状态 ====================
  var story = null;
  var storyJson = null;
  var state = {
    currentChapter: null,   // 当前章节 ID，如 "day1-1"
    currentDay: 1,
  };

  // ==================== 章节解锁 ====================
  var UNLOCKED_KEY = 'kle_chapters_unlocked';

  function getUnlockedChapters() {
    try {
      var raw = localStorage.getItem(UNLOCKED_KEY);
      if (!raw) return ['day1-1']; // 默认解锁第一章
      return JSON.parse(raw);
    } catch (e) {
      return ['day1-1'];
    }
  }

  function saveUnlockedChapters(list) {
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(list));
  }

  function isChapterUnlocked(id) {
    return getUnlockedChapters().indexOf(id) !== -1;
  }

  function unlockChapter(id) {
    var list = getUnlockedChapters();
    if (list.indexOf(id) === -1) {
      list.push(id);
      saveUnlockedChapters(list);
    }
  }

  function getNextChapter(currentId) {
    var idx = CHAPTER_LIST.indexOf(currentId);
    if (idx === -1 || idx >= CHAPTER_LIST.length - 1) return null;
    return CHAPTER_LIST[idx + 1];
  }

  function getChapterName(id) {
    return CHAPTER_NAMES[id] || id;
  }

  // ==================== 加载故事 ====================

  /**
   * 加载指定章节
   * @param {string} chapterId 如 "day1-1"
   * @returns {Promise}
   */
  function loadChapter(chapterId) {
    return new Promise(function (resolve, reject) {
      var jsonPath = 'kle-fish/ink/chapter_' + chapterId + '.json';

      fetch(jsonPath)
        .then(function (res) {
          if (!res.ok) throw new Error('加载故事失败: ' + jsonPath);
          return res.text();
        })
        .then(function (jsonString) {
          var cleaned = jsonString.replace(/^\s*var\s+storyContent\s*=\s*/, '').replace(/;\s*$/, '');
          storyJson = cleaned;
          story = new inkjs.Story(cleaned);
          state.currentChapter = chapterId;
          story.variablesState['chapter_id'] = chapterId;
          restorePublicVars();
          resolve({
            chapterId: chapterId,
            canContinue: story.canContinue
          });
        })
        .catch(reject);
    });
  }

  /**
   * 兼容旧接口：loadDay(day) 按 day 找第一个未解锁章节加载
   * @param {number} day
   * @returns {Promise}
   */
  function loadDay(day) {
    // 找到该 day 下第一个未解锁的章节
    var unlocked = getUnlockedChapters();
    for (var i = 0; i < CHAPTER_LIST.length; i++) {
      var cid = CHAPTER_LIST[i];
      if (cid.indexOf('day' + day + '-') === 0 && unlocked.indexOf(cid) === -1) {
        return loadChapter(cid);
      }
    }
    // 都解锁了，加载该 day 第一个章节
    var firstOfDay = CHAPTER_LIST.filter(function (c) { return c.indexOf('day' + day + '-') === 0; })[0];
    if (firstOfDay) return loadChapter(firstOfDay);
    // 兜底：加载第一章
    return loadChapter('day1-1');
  }

  // ==================== 公共变量 ====================
  var VARS_KEY = 'kle_story_vars';

  function savePublicVars() {
    if (!story) return;
    var vars = getAllVars();
    // 只保留公共变量（以 var_ 开头或已知的全局变量名）
    var publicVars = {};
    var known = ['player_name', 'rapport_klei', 'has_pendulum', 'has_copper_bell',
      'has_tarot_spread', 'has_old_map', 'quest_accepted', 'chapter_id',
      'day1_completed', 'day2_completed', 'day3_completed'];
    known.forEach(function (k) {
      if (vars[k] !== undefined) publicVars[k] = vars[k];
    });
    localStorage.setItem(VARS_KEY, JSON.stringify(publicVars));
  }

  function restorePublicVars() {
    if (!story) return;
    try {
      var raw = localStorage.getItem(VARS_KEY);
      if (!raw) return;
      var pubVars = JSON.parse(raw);
      for (var k in pubVars) {
        if (pubVars.hasOwnProperty(k)) {
          story.variablesState[k] = pubVars[k];
        }
      }
    } catch (e) {}
  }

  // ==================== 核心读取 ====================

  function getNextText() {
    if (!story || !story.canContinue) return null;
    return story.Continue();
  }

  function canContinue() {
    return story && story.canContinue;
  }

  function getChoices() {
    if (!story) return [];
    return story.currentChoices.map(function (choice, i) {
      return {
        text: choice.text,
        index: i
      };
    });
  }

  function hasChoices() {
    return story && story.currentChoices && story.currentChoices.length > 0;
  }

  function choose(index) {
    if (!story) return;
    story.ChooseChoiceIndex(index);
  }

  // ==================== 变量读写 ====================

  function setVar(name, value) {
    if (!story) return;
    story.variablesState[name] = value;
  }

  function getVar(name) {
    if (!story) return undefined;
    return story.variablesState[name];
  }

  function getAllVars() {
    if (!story) return {};
    var vars = {};
    var vs = story.variablesState;
    for (var key in vs) {
      if (vs.hasOwnProperty(key)) {
        vars[key] = vs[key];
      }
    }
    return vars;
  }

  // ==================== 跳转 ====================

  function jumpTo(path) {
    if (!story) return;
    story.ChoosePathString(path);
  }

  // ==================== 状态保存/恢复 ====================

  var SAVE_KEY = 'kle_fish_save';

  function saveState() {
    if (!story) return null;
    return {
      storyState: story.state.ToJson(),
      savedAt: Date.now(),
      chapterId: state.currentChapter,
    };
  }

  function saveToStorage() {
    var data = saveState();
    if (!data) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    savePublicVars();
  }

  function loadFromStorage() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  function restoreSave(saveData) {
    if (!saveData || !saveData.storyState) return Promise.reject('无效存档');
    var cid = saveData.chapterId || 'day1-1';
    return loadChapter(cid).then(function () {
      story.state.LoadJson(saveData.storyState);
      return saveData;
    });
  }

  function clearSave() {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(VARS_KEY);
  }

  function setCurrentDay(day) {
    state.currentDay = day;
  }

  function reset() {
    if (!storyJson) return;
    story = new inkjs.Story(storyJson);
  }

  function getCurrentChapterId() {
    return state.currentChapter;
  }

  // ==================== 对外接口 ====================
  window.kleStory = {
    // 章节加载
    loadChapter: loadChapter,
    loadDay: loadDay,
    getCurrentChapterId: getCurrentChapterId,
    // 读取
    getNextText: getNextText,
    canContinue: canContinue,
    getChoices: getChoices,
    hasChoices: hasChoices,
    choose: choose,
    // 变量
    setVar: setVar,
    getVar: getVar,
    getAllVars: getAllVars,
    // 跳转
    jumpTo: jumpTo,
    // 存档
    saveState: saveState,
    saveToStorage: saveToStorage,
    loadFromStorage: loadFromStorage,
    hasSave: hasSave,
    restoreSave: restoreSave,
    clearSave: clearSave,
    setCurrentDay: setCurrentDay,
    reset: reset,
    // 章节解锁
    getUnlockedChapters: getUnlockedChapters,
    isChapterUnlocked: isChapterUnlocked,
    unlockChapter: unlockChapter,
    getNextChapter: getNextChapter,
    getChapterName: getChapterName,
    CHAPTER_LIST: CHAPTER_LIST,
  };

})();