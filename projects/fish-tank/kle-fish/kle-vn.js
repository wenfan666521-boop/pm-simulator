/**
 * 小克鱼 · 视觉小说引擎 (kle-vn.js)
 * 全屏覆盖层，打字机效果，点击推进/选项
 */

(function () {
  // ==================== 配置 ====================
  var CFG = {
    charName: '🐱 克喵',
    charEmoji: '🐱',
    // 打字速度（毫秒/字），0=瞬发
    typeSpeed: 35,
    // 选项之间间距
    choiceGap: '10px',
    // 打完一行后自动继续的停顿（毫秒）
    autoContinueDelay: 600,
  };

  // ==================== 状态 ====================
  var state = {
    day: 1,
    currentPath: 'start',
    currentNodeIndex: 0, // 当前节点内的 content 索引
    currentItemIndex: 0,       // 当前 content 数组内的 item 索引
    isTyping: false,
    typedText: '',
    fullText: '',
    canClick: false,          // 文本走完了，可以点击推进
    showingChoices: false,
    autoTimer: null,
  };

  // ==================== DOM 结构 ====================
  var overlay, nameLabel, textBox, textContent, choiceArea, continueHint, charDisplay;

  function buildDOM() {
    overlay = document.createElement('div');
    overlay.id = 'kle-vn-overlay';
    overlay.style.cssText = [
      'position:fixed;inset:0;z-index:9999;',
      'background:rgba(10,8,20,0.96);',
      'display:flex;flex-direction:column;',
      'align-items:center;justify-content:center;',
      'font-family:"PingFang SC","Microsoft YaHei",sans-serif;',
      'color:#e8e0d4;',
      'user-select:none;',
      'opacity:0;transition:opacity 0.3s;',
    ].join('');

    overlay.innerHTML = [
      // 顶栏
      '<div id="kle-vn-topbar" style="position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:16px 20px;z-index:2;">',
      '  <button id="kle-vn-close" style="background:none;border:none;color:rgba(232,224,212,0.5);font-size:22px;cursor:pointer;padding:4px 8px;border-radius:8px;">✕</button>',
      '  <div id="kle-vn-daylabel" style="font-size:12px;color:rgba(232,224,212,0.4);letter-spacing:1px;"></div>',
      '  <div style="width:40px;"></div>',
      '</div>',

      // 角色展示区
      '<div id="kle-vn-char" style="flex:1;display:flex;align-items:center;justify-content:center;padding-top:50px;min-height:0;">',
      '  <div id="kle-vn-char-img" style="font-size:96px;filter:drop-shadow(0 0 24px rgba(180,150,255,0.3));transition:transform 0.4s;"></div>',
      '</div>',

      // 对话框
      '<div id="kle-vn-textbox" style="width:100%;max-width:680px;margin:0 16px20px;flex-shrink:0;">',
      '  <div id="kle-vn-char-name" style="font-size:12px;font-weight:700;color:#b49cff;letter-spacing:2px;margin-bottom:8px;padding-left:4px;"></div>',
      '  <div id="kle-vn-text-content" style="',
      '    background:rgba(255,255,255,0.05);',
      '    border:1px solid rgba(180,150,255,0.2);',
      '    border-radius:16px;',
      '    padding:18px 22px;',
      '    font-size:15px;line-height:1.85;',
      '    min-height:72px;',
      '    cursor:pointer;',
      '    backdrop-filter:blur(12px);',
      '    box-shadow:0 4px 32px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.06);',
      '  "></div>',
      '</div>',

      // 选项区
      '<div id="kle-vn-choices" style="width:100%;max-width:640px;flex-shrink:0;margin:0 16px 24px;display:none;flex-direction:column;gap:10px;"></div>',

      // 继续提示
      '<div id="kle-vn-hint" style="position:absolute;bottom:20px;left:50%;transform:translateX(-50%);color:rgba(180,150,255,0.5);font-size:12px;animation:pulse1.2s ease-in-out infinite;">▼ 点击继续</div>',
    ].join('');

    // 添加动画样式
    var style = document.createElement('style');
    style.textContent = [
      '@keyframes pulse {',
      '  0%,100%{opacity:0.5;transform:translateX(-50%) translateY(0);}',
      '  50%{opacity:1;transform:translateX(-50%) translateY(3px);}',
      '}',
      '#kle-vn-overlay * {box-sizing:border-box;}',
      '.kle-vn-choice-btn {',
      '  width:100%;padding:14px 20px;border:none;border-radius:14px;',
      '  background:rgba(255,255,255,0.07);',
      '  color:#e8e0d4;font-size:14px;text-align:left;cursor:pointer;',
      '  border:1px solid rgba(180,150,255,0.15);',
      '  transition:background 0.2s,border-color 0.2s,transform0.1s;',
      '  font-family:inherit;',
      '}',
      '.kle-vn-choice-btn:hover {',
      '  background:rgba(180,150,255,0.15);',
      '  border-color:rgba(180,150,255,0.5);',
      '  transform:translateX(4px);',
      '}',
      '.kle-vn-choice-btn:active {transform:translateX(2px);}',
    ].join('');
    document.head.appendChild(style);

    document.body.appendChild(overlay);

    // 绑定元素
    nameLabel = document.getElementById('kle-vn-char-name');
    textBox = document.getElementById('kle-vn-text-content');
    textContent = textBox;
    choiceArea = document.getElementById('kle-vn-choices');
    continueHint = document.getElementById('kle-vn-hint');
    charDisplay = document.getElementById('kle-vn-char-img');

    // 默认角色
    charDisplay.textContent = CFG.charEmoji;
    nameLabel.textContent = CFG.charName;

    // 点击文本框 → 推进
    textBox.addEventListener('click', onTextBoxClick);

    // 关闭按钮
    document.getElementById('kle-vn-close').addEventListener('click', function () {
      close();
    });
  }

  // ==================== 打字机 ====================
  var typeTimer = null;

  function typeText(text, onDone) {
    if (CFG.typeSpeed === 0) {
      textContent.textContent = text;
      if (onDone) onDone();
      return;
    }
    var i = 0;
    state.isTyping = true;
    state.fullText = text;
    textContent.textContent = '';
    clearInterval(typeTimer);
    typeTimer = setInterval(function () {
      i++;
      textContent.textContent = text.slice(0, i);
      if (i >= text.length) {
        clearInterval(typeTimer);
        state.isTyping = false;
        if (onDone) onDone();
      }
    }, CFG.typeSpeed);
  }

  // 瞬完所有文本
  function finishTyping() {
    clearInterval(typeTimer);
    state.isTyping = false;
    textContent.textContent = state.fullText;
  }

  // ==================== 核心读取器 ====================
  function getStory() {
    var dayKey = 'day' + state.day;
    return (window.KLE_STORY_MOCK || {})[dayKey];
  }

  function getNode(path) {
    var story = getStory();
    return story && story[path];
  }

  function getCurrentItem() {
    var node = getNode(state.currentPath);
    if (!node) return null;
    var content = node.content || [];
    return content[state.currentItemIndex] || null;
  }

  // ==================== 流程推进 ====================
  function nextItem() {
    var node = getNode(state.currentPath);
    if (!node) return;
    var content = node.content || [];
    state.currentItemIndex++;
    if (state.currentItemIndex >= content.length) {
      // 节点走完，无选项 → 等待点击继续（实际上从 start 重新走）
      showContinueHint();
      return;
    }
    processItem();
  }

  function processItem() {
    var item = getCurrentItem();
    if (!item) {
      showContinueHint();
      return;
    }

    if (item.Text) {
      // 显示文本
      nameLabel.textContent = CFG.charName;
      hideContinueHint();
      hideChoices();
      typeText(item.Text, function () {
        state.canClick = true;
        // 自动继续下一个
        state.autoTimer = setTimeout(function () {
          state.canClick = false;
          nextItem();
        }, CFG.autoContinueDelay);
      });

    } else if (item.Goto) {
      // 自动跳转
      state.currentPath = item.Goto.path;
      state.currentItemIndex = 0;
      processItem();

    } else if (item.Alternatives) {
      // 显示选项
      state.showingChoices = true;
      showChoices(item.Alternatives);
    }
  }

  function onTextBoxClick() {
    if (state.showingChoices) return;

    if (state.isTyping) {
      // 打字中 → 瞬完成
      finishTyping();
      state.canClick = true;
    } else if (state.canClick) {
      // 已完成 → 推进
      state.canClick = false;
      clearTimeout(state.autoTimer);
      nextItem();
    }
  }

  // ==================== 选项 ====================
  function showChoices(alternatives) {
    choiceArea.innerHTML = '';
    choiceArea.style.display = 'flex';
    continueHint.style.display = 'none';

    alternatives.forEach(function (alt, idx) {
      var btn = document.createElement('button');
      btn.className = 'kle-vn-choice-btn';
      btn.textContent = alt.content[0];
      btn.addEventListener('click', (function (i) {
        return function () {
          //记录玩家选择
          appendPlayerChoice(alt.content[0]);
          // 隐藏选项
          choiceArea.style.display = 'none';
          choiceArea.innerHTML = '';
          state.showingChoices = false;
          // 跳转
          state.currentPath = alt.path;
          state.currentItemIndex = 0;
          processItem();
        };
      })(idx));
      choiceArea.appendChild(btn);
    });
  }

  function hideChoices() {
    choiceArea.style.display = 'none';
    choiceArea.innerHTML = '';
    state.showingChoices = false;
  }

  // ==================== 继续提示 ====================
  function showContinueHint() {
    continueHint.style.display = 'block';
  }

  function hideContinueHint() {
    continueHint.style.display = 'none';
  }

  // ==================== 玩家对话气泡 ====================
  // （可扩展：玩家输入名字等场景用）
  function appendPlayerChoice(text) {
    // 在选项区上方显示玩家已选的内容
    // 目前简单处理：显示在文本框里
    nameLabel.textContent = '你';
    typeText(text, function () {});
  }

  // ==================== 对话框显示历史记录 ====================
  // （可扩展：面板标签页展示历史）
  // ==================== 开启 / 关闭 ====================
  function open(day) {
    if (day) state.day = day;
    state.currentPath = 'start';
    state.currentItemIndex = 0;
    state.isTyping = false;
    state.canClick = false;
    state.showingChoices = false;
    clearTimeout(state.autoTimer);

    var dayLabels = { 1: '初临', 2: '仪式准备', 3: '仪式与离场' };
    document.getElementById('kle-vn-daylabel').textContent = 'DAY ' + state.day + ' · ' + (dayLabels[state.day] || '');

    if (!overlay) buildDOM();

    overlay.style.display = 'flex';
    requestAnimationFrame(function () {
      overlay.style.opacity = '1';
    });

    processItem();
  }

  function close() {
    if (!overlay) return;
    overlay.style.opacity = '0';
    setTimeout(function () {
      overlay.style.display = 'none';
    }, 300);
  }

  // ==================== 对外接口 ====================
  window.KLE_VN = {
    open: open,
    close: close,
  };
})();