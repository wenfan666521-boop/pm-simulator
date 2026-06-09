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

  // ========== 故事对话 ==========

  function buildStoryHTML() {
    return '<div id="kleStoryContent" style="padding:16px;"></div>';
  }

  function renderStoryTab() {
    var data = window.kleData.loadAccountData();
    var currentDay = data.currentDay || 1;
    var container = document.getElementById('kleStoryContent');
    if (!container) return;
    var dayLabels = { 1: '初临', 2: '仪式准备', 3: '仪式与离场' };
    var mockData = window.KLE_STORY_MOCK;
    var dayKey = 'day' + currentDay;
    var story = mockData && mockData[dayKey];
    if (!story) {
      container.innerHTML = [
        '<div style="padding:20px 18px;background:linear-gradient(135deg,rgba(102,126,234,0.15),rgba(118,75,162,0.15));border-radius:16px;margin-bottom:16px;border:1px solid rgba(102,126,234,0.15);">',
        '  <div style="font-size:11px;opacity:0.5;margin-bottom:6px;">DAY ' + currentDay + '</div>',
        '  <div style="font-size:20px;font-weight:700;">' + dayLabels[currentDay] + '</div>',
        '  <div style="font-size:12px;opacity:0.45;line-height:1.6;margin-top:8px;">对话树未找到</div>',
        '</div>'
      ].join('');
      return;
    }
    var node = story.start;
    var content = node && node.content || [];
    var choices = [];
    var textLines = [];
    content.forEach(function(item) {
      if (item.Text) {
        textLines.push(item.Text);
      } else if (item.Alternatives) {
        item.Alternatives.forEach(function(alt, idx) {
          choices.push({ text: alt.content[0], target: alt.path, index: idx });
        });
      }
    });
    var html = [
      '<div style="padding:16px;display:flex;flex-direction:column;gap:8px;">',
      '  <div style="padding:14px 16px;background:linear-gradient(135deg,rgba(102,126,234,0.2),rgba(118,75,162,0.2));border-radius:14px;margin-bottom:12px;border:1px solid rgba(102,126,234,0.15);">',
      '    <div style="font-size:11px;opacity:0.5;margin-bottom:4px;">DAY ' + currentDay + '</div>',
      '    <div style="font-size:18px;font-weight:700;">' + dayLabels[currentDay] + '</div>',
      '  </div>'
    ];
    textLines.forEach(function(line) {
      html.push('<div style="padding:10px 14px;background:rgba(102,126,234,0.1);border-radius:12px;font-size:14px;line-height:1.7;">' + line + '</div>');
    });
    if (choices.length > 0) {
      html.push('<div style="margin-top:8px;">');
      choices.forEach(function(c) {
        html.push('<button onclick="window.kleStoryChoose(' + c.index + ',' + currentDay + ',' + JSON.stringify(c.text).replace(/"/g, '&quot;') + ')" style="display:block;width:100%;padding:12px 16px;margin-bottom:8px;border:none;border-radius:12px;background:rgba(255,255,255,0.06);color:#fff;font-size:13px;cursor:pointer;text-align:left;">▶ ' + c.text + '</button>');
      });
      html.push('</div>');
    }
    html.push('</div>');
    container.innerHTML = html.join('');
  }

  // 供按钮 onclick 调用的选择函数
  window.kleStoryChoose = function(choiceIndex, day, choiceText) {
    // 追加玩家选择
    var data = window.kleData.loadAccountData();
    var dayKey = 'day' + day;
    var story = (window.KLE_STORY_MOCK || {})[dayKey];
    if (!story) return;
    var node = story.start;
    var content = node && node.content || [];
    var targetNode = null;
    for (var i = 0; i < content.length; i++) {
      var item = content[i];
      if (item.Alternatives) {
        if (item.Alternatives[choiceIndex]) {
          targetNode = story[item.Alternatives[choiceIndex].path];
          break;
        }
      }
    }
    // 追加选择文本到面板
    var container = document.getElementById('kleStoryContent');
    if (container) {
      var btn = container.querySelectorAll('button')[choiceIndex];
      if (btn) btn.style.opacity = '0.4';
      // 追加克喵下一段
      renderStoryTab();
    }
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

    // 用户气泡
    var userDiv = document.createElement('div');
    userDiv.className = 'kle-chat-row user';
    userDiv.innerHTML = '<div class="kle-bubble kle-bubble-user">' + escapeHtml(text) + '</div>';
    messagesEl.appendChild(userDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // AI 回复
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