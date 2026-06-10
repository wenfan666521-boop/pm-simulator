/**
 * 小克鱼 · 道具系统 (items-system.js)
 * 统一道具获取接口 + 获得动画 + 任务面板
 */

(function () {
  // ==================== 常量 ====================
  var ITEMS_STORAGE_KEY = 'kle_items';      // 已获得的道具
  var ITEM_DEFS_KEY = 'kle_item_defs';      // 道具定义（名称/emoji/描述）

  // 默认道具定义（可被覆盖）
  var DEFAULT_ITEM_DEFS = {
    'pendulum':       { name: '灵摆',       emoji: '🪩', description: '克喵的占卜工具' },
    'copper_bell':    { name: '铜哨',       emoji: '🔔', description: '阿兹克先生的信物' },
    'old_map':        { name: '旧地图',     emoji: '🗺️', description: '标注了源堡位置' },
    'feather':        { name: '羽毛',       emoji: '🪶', description: '轻盈而神秘' },
    'crystal':        { name: '水晶',       emoji: '🔮', description: '蕴含着微光' },
  };

  // ==================== 道具定义 ====================

  /**
   * 获取道具定义（合并默认定义 + 用户定义）
   */
  function getItemDef(itemId) {
    var defs = getItemDefs();
    if (defs[itemId]) return defs[itemId];
    // 动态创建默认定义
    return {
      name: itemId,
      emoji: '📦',
      description: '',
    };
  }

  function getItemDefs() {
    try {
      var raw = localStorage.getItem(ITEM_DEFS_KEY);
      if (!raw) return DEFAULT_ITEM_DEFS;
      var stored = JSON.parse(raw);
      // 合并默认定义（stored 覆盖 default）
      var merged = Object.assign({}, DEFAULT_ITEM_DEFS, stored);
      return merged;
    } catch (e) {
      return DEFAULT_ITEM_DEFS;
    }
  }

  /**
   * 注册/更新道具定义（用于后续显示）
   * @param {string} itemId
   * @param {Object} def { name, emoji, description }
   */
  function registerItemDef(itemId, def) {
    var defs = getItemDefs();
    defs[itemId] = def;
    localStorage.setItem(ITEM_DEFS_KEY, JSON.stringify(defs));
  }

  // ==================== 道具状态 ====================

  function getObtainedItems() {
    try {
      var raw = localStorage.getItem(ITEMS_STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  function saveObtainedItems(items) {
    localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
  }

  /**
   * 是否有此道具
   */
  function hasItem(itemId) {
    var items = getObtainedItems();
    return !!items[itemId];
  }

  /**
   * 获取所有已获得道具的 ID 列表
   */
  function getAllObtainedIds() {
    return Object.keys(getObtainedItems());
  }

  // ==================== 核心：赋予道具 ====================

  /**
   * 赋予道具（统一入口，任何系统调用此接口）
   * @param {string} itemId 道具ID
   * @param {Object} opts 可选 { from: 'story'|'event'|'gift'|'achievement', silent: false }
   * @returns {boolean} 是否是新获得（之前没有）
   */
  function grantItem(itemId, opts) {
    opts = opts || {};
    var silent = opts.silent || false;

    var items = getObtainedItems();
    var isNew = !items[itemId];
    items[itemId] = {
      obtainedAt: Date.now(),
      from: opts.from || 'unknown',
    };
    saveObtainedItems(items);

    if (!silent) {
      showItemGrantNotification(itemId);
    }

    // 更新任务面板（如果存在）
    updateTaskPanel();

    // 触发成就检查（未来扩展）
    // checkItemAchievements(itemId);

    return isNew;
  }

  /**
   * 批量赋予道具
   */
  function grantItems(itemIds, opts) {
    opts = opts || {};
    itemIds.forEach(function (id) {
      grantItem(id, Object.assign({}, opts, { silent: true }));
    });
    // 只在最后显示一次通知（显示全部）
    if (!opts.silent && itemIds.length > 0) {
      showMultiItemGrantNotification(itemIds);
      updateTaskPanel();
    }
  }

  // ==================== 获得提示动画 ====================

  function showItemGrantNotification(itemId) {
    var def = getItemDef(itemId);
    var emoji = def.emoji || '📦';
    var name = def.name || itemId;
    showGrantToast(emoji + ' 获得 ' + name + '！', '#b49cff');
  }

  function showMultiItemGrantNotification(itemIds) {
    if (itemIds.length === 0) return;
    if (itemIds.length === 1) {
      showItemGrantNotification(itemIds[0]);
      return;
    }
    var names = itemIds.map(function (id) {
      var def = getItemDef(id);
      return def.emoji + ' ' + def.name;
    }).join(' / ');
    showGrantToast('获得 ' + names + '！', '#b49cff');
  }

  function showGrantToast(message, color) {
    color = color || '#b49cff';
    var toast = document.createElement('div');
    toast.style.cssText = [
      'position:fixed;',
      'top:50%;left:50%;',
      'transform:translate(-50%,-50%) scale(0.8);',
      'background:linear-gradient(135deg,rgba(20,15,40,0.95),rgba(40,20,80,0.95));',
      'color:#fff;',
      'padding:18px 32px;',
      'border-radius:16px;',
      'font-size:15px;',
      'z-index:10000;',
      'border:1px solid ' + color + '40;',
      'box-shadow:0 0 30px ' + color + '30;',
      'opacity:0;',
      'transition:opacity 0.3s,transform 0.3s;',
      'font-family:\"PingFang SC\",\"Microsoft YaHei\",sans-serif;',
      'text-align:center;',
      'max-width:320px;',
      'pointer-events:none;',
    ].join('');

    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%,-50%) scale(1)';
    });

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%,-50%) scale(0.9)';
      setTimeout(function () { toast.remove(); }, 300);
    }, 2200);
  }

  // ==================== 任务面板 ====================

  var taskPanelBuilt = false;

  function buildTaskPanel() {
    if (taskPanelBuilt) return;
    taskPanelBuilt = true;

    var panel = document.createElement('div');
    panel.id = 'kle-task-panel';
    panel.style.cssText = [
      'position:fixed;',
      'top:70px;right:16px;',
      'background:rgba(20,15,40,0.88);',
      'border:1px solid rgba(180,150,255,0.2);',
      'border-radius:14px;',
      'padding:14px 16px;',
      'min-width:160px;',
      'z-index:900;',
      'font-family:\"PingFang SC\",\"Microsoft YaHei\",sans-serif;',
      'color:#e8e0d4;',
      'font-size:12px;',
      'backdrop-filter:blur(8px);',
      'box-shadow:0 4px 20px rgba(0,0,0,0.4);',
      'display:none;',
    ].join('');

    var title = document.createElement('div');
    title.style.cssText = 'font-size:11px;color:rgba(180,150,255,0.6);letter-spacing:1px;margin-bottom:10px;';
    title.textContent = '✦ 寻物任务';
    panel.appendChild(title);

    var list = document.createElement('div');
    list.id = 'kle-task-list';
    panel.appendChild(list);

    document.body.appendChild(panel);
  }

  function updateTaskPanel() {
    buildTaskPanel();

    var panel = document.getElementById('kle-task-panel');
    var list = document.getElementById('kle-task-list');
    if (!panel || !list) return;

    // 获取所有已定义的道具（来自 ITEM_DEFS_KEY + DEFAULT_ITEM_DEFS）
    var allDefs = getItemDefs();
    var obtained = getObtainedItems();
    var defKeys = Object.keys(allDefs);

    if (defKeys.length === 0) {
      panel.style.display = 'none';
      return;
    }

    // 显示任务列表
    var html = '';
    defKeys.forEach(function (itemId) {
      var def = allDefs[itemId];
      var has = !!obtained[itemId];
      var checkmark = has
        ? '<span style="color:#b49cff;">✓</span>'
        : '<span style="color:rgba(180,150,255,0.3);">✗</span>';
      html += [
        '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid rgba(180,150,255,0.08);">',
        '  <span style="font-size:14px;">' + (def.emoji || '📦') + '</span>',
        '  <span style="flex:1;color:' + (has ? 'rgba(232,224,212,0.9)' : 'rgba(232,224,212,0.35)') + ';">' + (def.name || itemId) + '</span>',
        '  ' + checkmark,
        '</div>',
      ].join('');
    });

    list.innerHTML = html;
    panel.style.display = 'block';
  }

  /**
   * 切换任务面板显示/隐藏
   */
  function toggleTaskPanel() {
    var panel = document.getElementById('kle-task-panel');
    if (!panel) {
      updateTaskPanel();
      panel = document.getElementById('kle-task-panel');
    }
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  }

  /**
   * 隐藏任务面板
   */
  function hideTaskPanel() {
    var panel = document.getElementById('kle-task-panel');
    if (panel) panel.style.display = 'none';
  }

  // ==================== 对外接口 ====================
  window.KLE_ITEMS = {
    grant: grantItem,
    grantItems: grantItems,
    has: hasItem,
    getAll: getAllObtainedIds,
    getDef: getItemDef,
    registerDef: registerItemDef,
    updatePanel: updateTaskPanel,
    togglePanel: toggleTaskPanel,
    hidePanel: hideTaskPanel,
  };

})();