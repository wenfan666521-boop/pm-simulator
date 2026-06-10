/**
 * 小克鱼模块 - 专属面板
 * 长按小克鱼后弹出的四个 Tab 面板
 */

(function () {
  'use strict';

  //注入全局样式
  if (!document.getElementById('kle-panel-styles')) {
    var style = document.createElement('style');
    style.id = 'kle-panel-styles';
    style.textContent = [
      '.kle-tab-btn { border: none; background: none; color: rgba(255,255,255,0.4); font-size: 13px; cursor: pointer; white-space: nowrap; letter-spacing: 0.3px; transition: all 0.2s; padding: 13px 0 11px; flex: 1; }',
      '.kle-tab-btn:hover { color: rgba(255,255,255,0.7); }',
      '.kle-tab-btn.active { color: #fff; font-weight: 600; border-bottom: 2px solid #667eea; background: rgba(102,126,234,0.08); }',
      '#kleTabContent::-webkit-scrollbar { width: 4px; }',
      '#kleTabContent::-webkit-scrollbar-track { background: transparent; }',
      '#kleTabContent::-webkit-scrollbar-thumb { background: rgba(102,126,234,0.3); border-radius: 2px; }',
      '.kle-chat-row { display: flex; flex-direction: column; margin-bottom: 14px; }',
      '.kle-chat-row.ai { align-items: flex-start; }',
      '.kle-chat-row.user { align-items: flex-end; }',
      '.kle-bubble { max-width: 82%; padding: 10px 14px; border-radius: 16px; line-height: 1.7; font-size: 14px; word-break: break-word; }',
      '.kle-bubble-user { background: linear-gradient(135deg,#667eea,#764ba2); align-self: flex-end; border-bottom-right-radius: 5px; }',
      '.kle-bubble-ai { background: rgba(102,126,234,0.22); align-self: flex-start; border-bottom-left-radius: 5px; }',
      '.kle-sender-tag { font-size: 11px; opacity: 0.45; margin-bottom: 4px; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  // 当前打开面板的鱼 ID
  var _currentKleFishId = null;

  // ========== 打开/关闭 ==========

  function open(fishId) {
    _currentKleFishId = fishId;
    remove();
    var overlay = document.createElement('div');
    overlay.id = 'klePanelOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.78);z-index:2000;display:flex;align-items:center;justify-content:center;';

    var panel = document.createElement('div');
    panel.id = 'klePanel';
    panel.style.cssText = [
      'background:linear-gradient(160deg,#0f1629 0%,#1a2744 60%,#1e3a5f 100%);',
      'border:1px solid rgba(102,126,234,0.3);',
      'border-radius:24px;',
      'color:#fff;',
      'width:min(440px,92vw);',
      'max-height:88vh;',
      'overflow:hidden;',
      'display:flex;',
      'flex-direction:column;',
      'box-shadow:0 30px 90px rgba(0,0,0,0.8),0 0 0 1px rgba(102,126,234,0.08) inset;'
    ].join('');

    panel.innerHTML = buildHTML();

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Tab 切换事件
    var btns = panel.querySelectorAll('.kle-tab-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchTab(btn.dataset.tab);
      });
    });

    // 关闭
    panel.querySelector('.kle-close-btn').addEventListener('click', remove);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) remove();
    });

    // 默认打开剧情Tab
    switchTab('story');
  }

  function remove() {
    var overlay = document.getElementById('klePanelOverlay');
    if (overlay) overlay.remove();
    _currentKleFishId = null;
  }

  // ========== Tab 切换 ==========

  function switchTab(tabName) {
    document.querySelectorAll('.kle-tab-btn').forEach(function (btn) {
      btn.className = 'kle-tab-btn' + (btn.dataset.tab === tabName ? ' active' : '');
    });
    var content = document.getElementById('kleTabContent');
    if (!content) return;
    switch (tabName) {
      case 'items': content.innerHTML = buildItemsHTML(); renderItemsTab(); break;
      case 'tasks': content.innerHTML = buildTasksHTML(); renderTasksTab(); break;
      case 'story': content.innerHTML = buildStoryHTML(); renderStoryTab(); break;
      case 'chat': content.innerHTML = buildChatHTML(); initChatTab(); break;
    }
  }

  // ========== HTML 骨架 ==========

  function buildHTML() {
    return [
      '<div style="padding:20px 24px 16px;display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.2);border-bottom:1px solid rgba(255,255,255,0.06);">',
      '  <div style="display:flex;align-items:center;gap:12px;">',
      '    <span style="font-size:30px;line-height:1;">🐱</span>',
      '    <div>',
      '      <div style="font-size:17px;font-weight:700;letter-spacing:0.5px;">小克鱼</div>',
      '      <div id="kleDayLabel" style="font-size:11px;opacity:0.4;margin-top:3px;">第 1 天 / 3 天</div>',
      '    </div>',
      '  </div>',
      '  <button class="kle-close-btn" style="background:rgba(255,255,255,0.06);border:none;color:rgba(255,255,255,0.5);font-size:16px;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">✕</button>',
      '</div>',
      '<div style="display:flex;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.1);">',
      '  <button class="kle-tab-btn active" data-tab="chat" style="flex:1;">💬 对话</button>',
      '  <button class="kle-tab-btn" data-tab="story" style="flex:1;">📖 剧情</button>',
      '  <button class="kle-tab-btn" data-tab="items" style="flex:1;">🎒 道具</button>',
      '  <button class="kle-tab-btn" data-tab="tasks" style="flex:1;">✅ 任务</button>',
      '</div>',
      '<div id="kleTabContent" style="flex:1;display:flex;flex-direction:column;overflow:hidden;"></div>'
    ].join('');
  }

  // ========== 道具栏 ==========

  function buildItemsHTML() {
    return '<div id="kleItemsContent" style="padding:16px;"></div>';
  }

  function renderItemsTab() {
    var data = window.kleData.loadAccountData();
    var items = data.items || [];
    var container = document.getElementById('kleItemsContent');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = '<div style="text-align:center;opacity:0.3;padding:50px 0;font-size:14px;">🎒 还没有获得任何道具</div>';
      return;
    }
    var html = '<div style="padding:4px 0;">';
    items.forEach(function (key) {
      var item = KLE_CONFIG.ITEMS[key];
      if (!item) return;
      html += [
        '<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:rgba(255,255,255,0.04);border-radius:14px;margin-bottom:8px;border:1px solid rgba(255,255,255,0.05);">',
        '  <span style="font-size:26px;line-height:1;">' + item.emoji + '</span>',
        '  <div style="flex:1;">',
        '    <div style="font-size:14px;font-weight:600;">' + item.name + '</div>',
        '    <div style="font-size:11px;opacity:0.4;margin-top:2px;">已获得</div>',
        '  </div>',
        '  <div style="width:22px;height:22px;border-radius:50%;background:rgba(52,199,89,0.2);display:flex;align-items:center;justify-content:center;font-size:11px;color:#34c759;font-weight:bold;">✓</div>',
        '</div>'
      ].join('');
    });
    container.innerHTML = html + '</div>';
  }

  // ========== 任务栏 ==========

  function buildTasksHTML() {
    return '<div id="kleTasksContent" style="padding:16px;"></div>';
  }

  function renderTasksTab() {
    var data = window.kleData.loadAccountData();
    var currentDay = data.currentDay || 1;
    var tasks = data.tasks || {};
    var taskList = KLE_CONFIG.TASKS['day' + currentDay] || [];
    var container = document.getElementById('kleTasksContent');
    if (!container) return;

    var dayLabels = { 1: '初临', 2: '仪式准备', 3: '仪式与离场' };
    var completedCount = taskList.filter(function (t) {
      return tasks['day' + currentDay] && tasks['day' + currentDay][t.key];
    }).length;
    var total = taskList.length;
    var percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    var html = [
      '<div style="padding:14px 16px;background:linear-gradient(135deg,rgba(102,126,234,0.2),rgba(118,75,162,0.2));border-radius:16px;margin-bottom:16px;border:1px solid rgba(102,126,234,0.15);">',
      '  <div style="font-size:11px;opacity:0.5;margin-bottom:4px;">DAY ' + currentDay + ' · ' + dayLabels[currentDay] + '</div>',
      '  <div style="font-size:22px;font-weight:700;letter-spacing:1px;">任务进度</div>',
      '</div>'
    ].join('');

    taskList.forEach(function (t) {
      var done = tasks['day' + currentDay] && tasks['day' + currentDay][t.key];
      html += [
        '<div style="display:flex;align-items:center;gap:12px;padding:13px 16px;background:rgba(255,255,255,0.03);border-radius:12px;margin-bottom:8px;border:1px solid rgba(255,255,255,' + (done ? '0.08' : '0.04') + ');">',
        '  <div style="width:22px;height:22px;border-radius:50%;border:2px solid ' + (done ? '#34c759' : 'rgba(255,255,255,0.2)') + ';display:flex;align-items:center;justify-content:center;font-size:11px;color:' + (done ? '#34c759' : 'transparent') + ';font-weight:bold;">✓</div>',
        '  <span style="font-size:14px;color:' + (done ? '#fff' : 'rgba(255,255,255,0.55)') + ';font-weight:' + (done ? '600' : '400') + ';">' + t.name + '</span>',
        done ? '<span style="margin-left:auto;font-size:11px;color:#34c759;">已完成</span>' : '',
        '</div>'
      ].join('');
    });

    html += [
      '<div style="margin-top:16px;">',
      '  <div style="display:flex;justify-content:space-between;font-size:12px;opacity:0.5;margin-bottom:6px;">',
      '    <span>总进度</span><span>' + completedCount + ' / ' + total + '</span>',
      '  </div>',
      '  <div style="width:100%;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;">',
      '    <div style="width:' + percent + '%;height:100%;background:linear-gradient(90deg,#667eea,#764ba2);border-radius:3px;transition:width 0.4s ease;"></div>',
      '  </div>',
      '</div>'
    ].join('');

    container.innerHTML = html;
  }

  // ========== 故事对话（入口页） ==========
  // 章节结构（与 kle-story.js 同步）
  var CHAPTER_LIST = [
    'day1-1', 'day1-2', 'day1-3',
    'day2-1', 'day2-2',
    'day3-1', 'day3-2',
  ];
  var CHAPTER_NAMES = {
    'day1-1': '初临·始', 'day1-2': '初临·寻', 'day1-3': '初临·别',
    'day2-1': '仪式·晓', 'day2-2': '仪式·寻',
    'day3-1': '离场·晨', 'day3-2': '离场·终',
  };
  var DAY_MAP = {
    'day1-1': 1, 'day1-2': 1, 'day1-3': 1,
    'day2-1': 2, 'day2-2': 2,
    'day3-1': 3, 'day3-2': 3,
  };

  function buildStoryHTML() {
    return '<div id="kleStoryContent" style="padding:16px;overflow-y:auto;flex:1;"></div>';
  }

  function renderStoryTab() {
    var container = document.getElementById('kleStoryContent');
    if (!container) return;

    // 获取解锁状态
    var unlocked = [];
    var completed = [];
    if (window.kleStory && window.kleStory.getUnlockedChapters) {
      unlocked = window.kleStory.getUnlockedChapters();
    }
    // 从存档读取已完成章节
    var saveData = null;
    if (window.kleStory && window.kleStory.loadFromStorage) {
      saveData = window.kleStory.loadFromStorage();
    }
    var currentChapterId = saveData && saveData.chapterId;

    // 按 DAY 分组
    var dayGroups = { 1: [], 2: [], 3: [] };
    CHAPTER_LIST.forEach(function (cid) {
      var day = DAY_MAP[cid];
      if (day) dayGroups[day].push(cid);
    });

    var dayLabels = { 1: '初临', 2: '仪式准备', 3: '仪式与离场' };
    var html = '<div style="display:flex;flex-direction:column;gap:8px;">';

    [1, 2, 3].forEach(function (dayNum) {
      var chapters = dayGroups[dayNum];
      if (!chapters.length) return;

      var isExpanded = (dayNum === 1); // 默认展开 DAY1
      var dayCompleteCount = 0;
      chapters.forEach(function (cid) {
        // 已完成的判断：chapterId 在存档中，且是这一组最后一章且有下一章解锁
        if (unlocked.indexOf(getNextChapterId(cid)) !== -1) dayCompleteCount++;
      });
      var allUnlocked = chapters.every(function (cid) { return unlocked.indexOf(cid) !== -1; });

      // DAY 标题栏（可点击展开/折叠）
      html += [
        '<div class="kle-chapter-day" data-day="' + dayNum + '" style="',
        '  background:rgba(102,126,234,0.12);',
        '  border-radius:12px;',
        '  border:1px solid rgba(102,126,234,0.18);',
        '  overflow:hidden;',
        '  cursor:pointer;',
        '  transition:border-color 0.2s;',
        '">',
        '  <div class="kle-chapter-day-header" style="padding:12px 14px;display:flex;align-items:center;justify-content:space-between;">',
        '    <div style="display:flex;align-items:center;gap:10px;">',
        '      <span style="font-size:15px;">📂</span>',
        '      <div>',
        '        <div style="font-size:13px;font-weight:600;color:#e8e0d4;">DAY ' + dayNum + ' · ' + (dayLabels[dayNum] || '') + '</div>',
        '        <div style="font-size:11px;opacity:0.45;margin-top:2px;">' + dayCompleteCount + ' / ' + chapters.length + ' 完成</div>',
        '      </div>',
        '    </div>',
        '    <div style="display:flex;align-items:center;gap:8px;">',
        '      ' + (allUnlocked ? '<span style="font-size:11px;opacity:0.4;color:#b49cff;">已解锁</span>' : ''),
        '      <span class="kle-chevron" style="font-size:12px;opacity:0.5;transition:transform 0.2s;transform:rotate(' + (isExpanded ? '0deg' : '-90deg') + ');">▾</span>',
        '    </div>',
        '  </div>',
        '  <div class="kle-chapter-day-body" style="padding:0 14px 12px;display:' + (isExpanded ? 'flex' : 'none') + ';flex-direction:column;gap:6px;">'
      ].join('');

      chapters.forEach(function (cid) {
        var name = CHAPTER_NAMES[cid] || cid;
        var isUnlocked = unlocked.indexOf(cid) !== -1;
        var isCurrent = cid === currentChapterId;
        var isDone = unlocked.indexOf(getNextChapterId(cid)) !== -1; // 下一章已解锁 = 本章已完成

        if (!isUnlocked) {
          // 锁定状态
          html += [
            '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,0.03);opacity:0.4;">',
            '  <span style="font-size:12px;">🔒</span>',
            '  <span style="font-size:13px;color:rgba(232,224,212,0.4);">' + name + '</span>',
            '</div>'
          ].join('');
        } else {
          // 已解锁，可点击
          var bgColor = isCurrent ? 'rgba(180,150,255,0.15)' : 'rgba(255,255,255,0.06)';
          var borderColor = isCurrent ? 'rgba(180,150,255,0.5)' : 'rgba(255,255,255,0.08)';
          var textColor = isCurrent ? '#b49cff' : '#e8e0d4';
          html += [
            '<div onclick="window.KLE_VN && window.KLE_VN.openChapter(\'' + cid + '\')" style="',
            '  display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;',
            '  background:' + bgColor + ';border:1px solid ' + borderColor + ';',
            '  cursor:pointer;transition:all 0.2s;">',
            '  <span style="font-size:12px;">' + (isDone ? '✅' : '🔓') + '</span>',
            '  <span style="font-size:13px;color:' + textColor + ';flex:1;">' + name + '</span>',
            '  <span style="font-size:11px;opacity:0.4;color:' + textColor + ';">' + (isCurrent ? '进行中' : (isDone ? '已完成' : '')) + '</span>',
            '</div>'
          ].join('');
        }
      });

      html += '</div></div>';
    });

    html += '</div>';
    container.innerHTML = html;

    // 绑定折叠/展开事件
    container.querySelectorAll('.kle-chapter-day-header').forEach(function (header) {
      header.addEventListener('click', function (e) {
        e.stopPropagation();
        var dayDiv = header.closest('.kle-chapter-day');
        var body = dayDiv.querySelector('.kle-chapter-day-body');
        var chevron = dayDiv.querySelector('.kle-chevron');
        var isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : 'flex';
        chevron.style.transform = 'rotate(' + (isOpen ? '-90deg' : '0deg') + ')';
      });
    });
  }

  function getNextChapterId(cid) {
    var idx = CHAPTER_LIST.indexOf(cid);
    if (idx === -1 || idx >= CHAPTER_LIST.length - 1) return null;
    return CHAPTER_LIST[idx + 1];
  }

  // ========== 自由对话 ==========

  function buildChatHTML() {
    return [
      '<div id="kleChatMessages" style="display:flex;flex-direction:column;flex:1;overflow:hidden;">',
      '  <div id="kleChatMessagesInner" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:4px;min-height:0;"></div>',
      '  <div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:10px;background:rgba(0,0,0,0.15);flex-shrink:0;">',
      '    <input type="text" id="kleChatInput" placeholder="和克喵说点什么…" style="flex:1;padding:11px 16px;border:none;border-radius:22px;background:rgba(255,255,255,0.08);color:#fff;font-size:14px;outline:none;">',
      '    <button id="kleChatSendBtn" style="padding:11px 20px;border:none;border-radius:22px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-size:14px;font-weight:600;cursor:pointer;letter-spacing:0.3px;white-space:nowrap;">发送</button>',
      '  </div>',
      '</div>'
    ].join('');
  }

  function initChatTab() {
    var messagesEl = document.getElementById('kleChatMessagesInner');
    if (!messagesEl) return;

    messagesEl.innerHTML = [
      '<div class="kle-chat-row ai">',
      '  <div class="kle-sender-tag">🐱 克喵</div>',
      '  <div class="kle-bubble kle-bubble-ai">你好，我是克莱恩……呃，或者说"克喵"。请问你是……？</div>',
      '</div>'
    ].join('');

    var sendBtn = document.getElementById('kleChatSendBtn');
    var input = document.getElementById('kleChatInput');
    if (sendBtn && input) {
      sendBtn.addEventListener('click', function () { sendChatMessage(input); });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendChatMessage(input); });
      input.focus();
    }
  }

  function sendChatMessage(input) {
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    var messagesEl = document.getElementById('kleChatMessagesInner');
    if (!messagesEl) return;

    var userDiv = document.createElement('div');
    userDiv.className = 'kle-chat-row user';
    userDiv.innerHTML = '<div class="kle-bubble kle-bubble-user">' + escapeHtml(text) + '</div>';
    messagesEl.appendChild(userDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    window.kleAI.chat(text).then(function (reply) {
      var aiDiv = document.createElement('div');
      aiDiv.className = 'kle-chat-row ai';
      aiDiv.innerHTML = '<div class="kle-sender-tag">🐱 克喵</div><div class="kle-bubble kle-bubble-ai">' + escapeHtml(reply) + '</div>';
      messagesEl.appendChild(aiDiv);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }).catch(function () {
      var aiDiv = document.createElement('div');
      aiDiv.className = 'kle-chat-row ai';
      aiDiv.innerHTML = '<div class="kle-sender-tag">🐱 克喵</div><div class="kle-bubble kle-bubble-ai" style="color:#ff8a8a;">抱歉，我现在无法回应……</div>';
      messagesEl.appendChild(aiDiv);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ========== 对外暴露 ==========

  window.klePanel = {
    open: open,
    remove: remove,
    switchTab: switchTab
  };

})();