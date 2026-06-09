/**
 * 小克鱼模块 - 专属面板
 * 长按小克鱼后弹出的四个 Tab 面板
 */

(function() {
  'use strict';

  // 当前打开面板的鱼 ID
  let _currentKleFishId = null;

  // ========== 面板 DOM 结构 ==========

  /**
   * 打开小克鱼专属面板
   * @param {string} fishId
   */
  function open(fishId) {
    _currentKleFishId = fishId;
    remove(); // 先移除已有的

    const overlay = document.createElement('div');
    overlay.id = 'klePanelOverlay';
    overlay.style.cssText = _overlayStyle();

    const panel = document.createElement('div');
    panel.id = 'klePanel';
    panel.style.cssText = _panelStyle();

    panel.innerHTML = _buildHTML();

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Tab 切换
    panel.querySelectorAll('.kle-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // 默认打开道具栏
    switchTab('items');

    // 关闭按钮
    panel.querySelector('.kle-close-btn').addEventListener('click', remove);

    // 点击遮罩关闭
    overlay.addEventListener('click', e => { if (e.target === overlay) remove(); });

    // 渲染道具栏内容
    renderItemsTab();
  }

  function remove() {
    const overlay = document.getElementById('klePanelOverlay');
    if (overlay) overlay.remove();
    _currentKleFishId = null;
  }

  // ========== Tab 切换 ==========

  function switchTab(tabName) {
    // 更新按钮状态
    document.querySelectorAll('.kle-tab-btn').forEach(btn => {
      btn.className = 'kle-tab-btn' + (btn.dataset.tab === tabName ? ' active' : '');
    });

    // 更新内容区
    const content = document.getElementById('kleTabContent');
    if (!content) return;

    switch (tabName) {
      case 'items': content.innerHTML = _buildItemsTabHTML(); break;
      case 'tasks': content.innerHTML = _buildTasksTabHTML(); break;
      case 'story': content.innerHTML = _buildStoryTabHTML(); break;
      case 'chat': content.innerHTML = _buildChatTabHTML(); break;
    }

    // 渲染对应 Tab 内容
    if (tabName === 'items') renderItemsTab();
    if (tabName === 'tasks') renderTasksTab();
    if (tabName === 'story') renderStoryTab();
    if (tabName === 'chat') initChatTab();
  }

  // ========== 道具栏 Tab ==========

  function _buildItemsTabHTML() {
    return `
      <div id="kleItemsContent" style="padding:15px;line-height:2;font-size:14px;">
        加载中…
      </div>
    `;
  }

  function renderItemsTab() {
    const data = window.kleData.loadAccountData();
    const items = data.items || [];
    const container = document.getElementById('kleItemsContent');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = '<div style="text-align:center;opacity:0.4;padding:30px;">暂无道具</div>';
      return;
    }

    container.innerHTML = items.map(key => {
      const item = KLE_CONFIG.ITEMS[key];
      if (!item) return '';
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="font-size:20px;">${item.emoji}</span>
          <span>${item.name}</span>
          <span style="margin-left:auto;color:#34c759;">✅</span>
        </div>
      `;
    }).join('');
  }

  // ========== 任务栏 Tab ==========

  function _buildTasksTabHTML() {
    return `
      <div id="kleTasksContent" style="padding:15px;font-size:14px;">
        加载中…
      </div>
    `;
  }

  function renderTasksTab() {
    const data = window.kleData.loadAccountData();
    const currentDay = data.currentDay ||1;
    const tasks = data.tasks || {};
    const taskList = KLE_CONFIG.TASKS['day' + currentDay] || [];

    const container = document.getElementById('kleTasksContent');
    if (!container) return;

    const completedCount = taskList.filter(t => tasks['day' + currentDay] && tasks['day' + currentDay][t.key]).length;
    const total = taskList.length;

    let html = `
      <div style="margin-bottom:15px;padding:10px;background:rgba(102,126,234,0.2);border-radius:10px;">
        <div style="font-size:13px;opacity:0.7;">第 ${currentDay} 天 / 3 天</div>
        <div style="font-size:18px;font-weight:bold;">DAY ${currentDay}</div>
      </div>
    `;

    html += taskList.map(t => {
      const done = tasks['day' + currentDay] && tasks['day' + currentDay][t.key];
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="color:${done ? '#34c759' : '#666'};">${done ? '☑' : '☐'}</span>
          <span style="color:${done ? '#fff' : '#888'};text-decoration:${done ? 'none' : 'none'};">${t.name}</span>
          ${done ? '<span style="margin-left:auto;color:#34c759;font-size:12px;">已完成</span>' : ''}
        </div>
      `;
    }).join('');

    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    html += `
      <div style="margin-top:15px;">
        <div style="display:flex;justify-content:space-between;font-size:12px;opacity:0.6;margin-bottom:5px;">
          <span>进度</span><span>${completedCount} / ${total}</span>
        </div>
        <div style="width:100%;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;">
          <div style="width:${percent}%;height:100%;background:linear-gradient(90deg,#667eea,#764ba2);border-radius:3px;transition:width 0.3s;"></div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // ========== 故事对话 Tab ==========

  function _buildStoryTabHTML() {
    return `
      <div id="kleStoryContent" style="padding:15px;font-size:14px;">
        <div style="text-align:center;padding:40px;opacity:0.5;">故事对话 · 待接入 ink</div>
       <div id="kleStoryText" style="margin-top:15px;line-height:1.8;"></div>
      </div>
    `;
  }

  function renderStoryTab() {
    const data = window.kleData.loadAccountData();
    const currentDay = data.currentDay || 1;
    const textEl = document.getElementById('kleStoryText');
    if (!textEl) return;

    const dayLabels = {1: '初临', 2: '仪式准备', 3: '仪式与离场' };
    textEl.innerHTML = `
      <div style="background:rgba(102,126,234,0.15);border-radius:10px;padding:15px;margin-bottom:15px;">
        <div style="font-size:12px;opacity:0.6;">DAY ${currentDay}</div>
        <div style="font-size:16px;font-weight:bold;margin-top:5px;">${dayLabels[currentDay] || ''}</div>
        <div style="font-size:12px;opacity:0.5;margin-top:5px;">故事对话将在 ink 文件完成后接入</div>
      </div>
      <div style="opacity:0.4;font-size:12px;text-align:center;padding:20px;">
        对话树内容加载中…
      </div>
    `;
  }

  // ========== 自由对话 Tab ==========

  function _buildChatTabHTML() {
    return `
      <div style="display:flex;flex-direction:column;height:100%;">
        <div id="kleChatMessages" style="flex:1;overflow-y:auto;padding:15px;line-height:1.8;font-size:13px;">
          <div style="text-align:center;opacity:0.4;padding:30px;">连接中…</div>
        </div>
        <div style="padding:10px 15px;border-top:1px solid rgba(255,255,255,0.1);display:flex;gap:8px;">
          <input type="text" id="kleChatInput" placeholder="输入消息…" style="flex:1;padding:8px 12px;border:none;border-radius:20px;background:rgba(255,255,255,0.1);color:#fff;font-size:13px;outline:none;">
          <button id="kleChatSendBtn" class="btn" style="padding:8px 16px;border:none;border-radius:20px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-size:13px;cursor:pointer;">发送</button>
        </div>
      </div>
    `;
  }

  function initChatTab() {
    const messagesEl = document.getElementById('kleChatMessages');
    if (!messagesEl) return;

    // 初始欢迎语
    messagesEl.innerHTML = `
      <div style="display:flex;gap:10px;margin-bottom:15px;">
        <span style="font-size:20px;">🐱</span>
        <div>
          <div style="font-size:12px;opacity:0.6;">克喵</div>
          <div style="background:rgba(102,126,234,0.2);padding:10px 14px;border-radius:014px 14px 14px;margin-top:4px;line-height:1.6;">
            你好，我是克莱恩……呃，或者说"克喵"。<br>
            请问你是……？
          </div>
        </div>
      </div>
    `;

    // 发送按钮
    const sendBtn = document.getElementById('kleChatSendBtn');
    const input = document.getElementById('kleChatInput');
    if (sendBtn && input) {
      sendBtn.addEventListener('click', () => sendChatMessage(input.value, messagesEl, input));
      input.addEventListener('keydown', e => { if (e.key === 'Enter') sendChatMessage(input.value, messagesEl, input); });
      input.focus();
    }
  }

  function sendChatMessage(text, messagesEl, input) {
    text = text.trim();
    if (!text) return;
    input.value = '';

    // 追加用户消息
    const userDiv = document.createElement('div');
    userDiv.style.cssText = 'text-align:right;margin-bottom:12px;';
    userDiv.innerHTML = `
      <div style="display:inline-block;background:rgba(255,255,255,0.1);padding:8px 14px;border-radius:14px 0 14px 14px;font-size:13px;">${escapeHtml(text)}</div>
    `;
    messagesEl.appendChild(userDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // 调用 AI
    window.kleAI.chat(text).then(reply => {
      const aiDiv = document.createElement('div');
      aiDiv.style.cssText = 'display:flex;gap:10px;margin-bottom:15px;';
      aiDiv.innerHTML = `
        <span style="font-size:20px;">🐱</span>
        <div>
          <div style="font-size:12px;opacity:0.6;">克喵</div>
          <div style="background:rgba(102,126,234,0.2);padding:10px 14px;border-radius:0 14px 14px 14px;margin-top:4px;line-height:1.6;">${escapeHtml(reply)}</div>
        </div>
      `;
      messagesEl.appendChild(aiDiv);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }).catch(() => {
      const aiDiv = document.createElement('div');
      aiDiv.style.cssText = 'display:flex;gap:10px;margin-bottom:15px;';
      aiDiv.innerHTML = `
        <span style="font-size:20px;">🐱</span>
        <div>
          <div style="font-size:12px;opacity:0.6;">克喵</div>
          <div style="background:rgba(102,126,234,0.2);padding:10px 14px;border-radius:0 14px 14px 14px;margin-top:4px;line-height:1.6;color:#ff6b6b;">抱歉，我现在无法回应……</div>
        </div>
      `;
      messagesEl.appendChild(aiDiv);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ========== 样式 ==========

  function _overlayStyle() {
    return 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
  }

  function _panelStyle() {
    return 'background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:20px;color:#fff;width:360px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 15px 50px rgba(0,0,0,0.5);';
  }

  function _buildHTML() {
    return `
      <div style="padding:18px 20px0;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.1);">
        <div style="display:flex;align-items:center;gap:8px;font-size:16px;font-weight:bold;">
          🐱 小克鱼
        </div>
        <button class="kle-close-btn" style="background:none;border:none;color:#aaa;font-size:18px;cursor:pointer;padding:4px;">✕</button>
      </div>
      <div style="display:flex;border-bottom:1px solid rgba(255,255,255,0.1);overflow-x:auto;">
        <button class="kle-tab-btn" data-tab="chat" style="flex:1;padding:10px 0;border:none;background:none;color:#888;font-size:12px;cursor:pointer;white-space:nowrap;">💬 自由对话</button>
        <button class="kle-tab-btn" data-tab="story" style="flex:1;padding:10px 0;border:none;background:none;color:#888;font-size:12px;cursor:pointer;white-space:nowrap;">📖 故事对话</button>
        <button class="kle-tab-btn" data-tab="items" style="flex:1;padding:10px 0;border:none;background:none;color:#888;font-size:12px;cursor:pointer;white-space:nowrap;">🎒 道具栏</button>
        <button class="kle-tab-btn" data-tab="tasks" style="flex:1;padding:10px 0;border:none;background:none;color:#888;font-size:12px;cursor:pointer;white-space:nowrap;">✅ 任务栏</button>
      </div>
      <div id="kleTabContent" style="flex:1;overflow-y:auto;min-height:200px;"></div>
    `;
  }

  // ========== 对外暴露 API ==========

  window.klePanel = {
    open,
    remove,
    switchTab
  };

})();