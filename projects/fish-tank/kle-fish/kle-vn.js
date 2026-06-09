/**
 * 小克鱼 · 视觉小说引擎 (kle-vn.js)
 * 全屏覆盖层，打字机效果，点击推进/选项
 * 数据来源：kle-story.js (inkjs 驱动)
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
    // 自动播放时的停顿（毫秒）
    autoPlayDelay: 1500,
  };

  // ==================== 状态 ====================
  var state = {
    day: 1,
    isTyping: false,
    typedText: '',
    fullText: '',
    canClick: false,          // 文本走完了，可以点击推进
    showingChoices: false,
    autoTimer: null,
    autoPlay: false,          // 自动播放开关
    autoPlayTimer: null,       // 自动播放推进定时器
    skipTypingCallback: false, // 打断打字时，阻止旧callback执行nextItem
    waitingForInput: false,   // 等待前端输入框（如名字）
    currentText: '',          // 当前显示的完整文本
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
      '  <button id="kle-vn-autoplay" style="background:none;border:none;color:rgba(180,150,255,0.4);font-size:12px;cursor:pointer;padding:4px 10px;border-radius:20px;border:1px solid rgba(180,150,255,0.2);transition:all 0.2s;">▶ 自动</button>',
      '</div>',

      // 角色展示区
      '<div id="kle-vn-char" style="flex:1;display:flex;align-items:center;justify-content:center;padding-top:50px;min-height:0;">',
      '  <div id="kle-vn-char-img" style="font-size:96px;filter:drop-shadow(0 0 24px rgba(180,150,255,0.3));transition:transform 0.4s;"></div>',
      '</div>',

      // 对话框
      '<div id="kle-vn-textbox" style="width:100%;max-width:680px;margin:0 16px;padding-bottom:20px;flex-shrink:0;">',
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
      '<div id="kle-vn-hint" style="position:absolute;bottom:20px;left:50%;transform:translateX(-50%);color:rgba(180,150,255,0.5);font-size:12px;animation:pulse 1.2s ease-in-out infinite;">▼ 点击继续</div>',

      // 名字输入浮层（默认隐藏）
      '<div id="kle-vn-name-input" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(10,8,20,0.9);z-index:10000;align-items:center;justify-content:center;flex-direction:column;">',
      '  <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(180,150,255,0.3);border-radius:16px;padding:32px;max-width:400px;width:90%;text-align:center;">',
      '    <div style="font-size:14px;color:#b49cff;margin-bottom:16px;">请输入你的名字</div>',
      '    <input id="kle-vn-name-field" type="text" placeholder="你的名字" style="width:100%;padding:12px 16px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#e8e0d4;font-size:15px;outline:none;text-align:center;margin-bottom:16px;">',
      '    <button id="kle-vn-name-submit" style="padding:10px 32px;border:none;border-radius:20px;background:rgba(180,150,255,0.3);color:#e8e0d4;font-size:14px;cursor:pointer;">确认</button>',
      '  </div>',
      '</div>',
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
      '  transition:background 0.2s,border-color 0.2s,transform 0.1s;',
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

    // 点击任意空白区域 → 推进（排除按钮和选项区）
    overlay.addEventListener('click', function (e) {
      var tag = e.target.tagName.toUpperCase();
      if (tag === 'BUTTON') return; // 关闭/自动播放按钮不触发推进
      if (tag === 'INPUT') return;  // 输入框不触发推进
      if (e.target === textBox || textBox.contains(e.target)) return; // 文本框内已由 textBox 处理
      if (e.target === choiceArea || choiceArea.contains(e.target)) return; // 选项区不触发推进
      if (state.waitingForInput) return; // 等待输入时不触发推进
      // 空白区域点击 → 等同于点击文本框
      onTextBoxClick();
    });

    // 关闭按钮
    document.getElementById('kle-vn-close').addEventListener('click', function () {
      close();
    });

    // 自动播放按钮
    document.getElementById('kle-vn-autoplay').addEventListener('click', function () {
      toggleAutoPlay();
    });

    // 名字输入确认
    document.getElementById('kle-vn-name-submit').addEventListener('click', function () {
      var input = document.getElementById('kle-vn-name-field');
      var name = input.value.trim();
      if (name) {
        submitName(name);
      }
    });
    document.getElementById('kle-vn-name-field').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var name = e.target.value.trim();
        if (name) submitName(name);
      }
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
    state.skipTypingCallback = false;
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

  // ==================== 名字输入 ====================
  function showNameInput() {
    state.waitingForInput = true;
    var inputDiv = document.getElementById('kle-vn-name-input');
    var inputField = document.getElementById('kle-vn-name-field');
    inputDiv.style.display = 'flex';
    inputField.value = '';
    inputField.focus();
  }

  function submitName(name) {
    var inputDiv = document.getElementById('kle-vn-name-input');
    inputDiv.style.display = 'none';
    state.waitingForInput = false;

    // 写入 ink 变量
    if (window.kleStory) {
      window.kleStory.setVar('player_name', name);
    }

    // 继续故事
    state.canClick = false;
    processItem();
  }

  // ==================== 核心：驱动 ink story ====================
  function processItem() {
    hideContinueHint();
    hideChoices();

    // 检查是否需要显示选项
    if (window.kleStory && window.kleStory.hasChoices()) {
      showChoices(window.kleStory.getChoices());
      return;
    }

    // 获取下一段文本
    if (window.kleStory && window.kleStory.canContinue()) {
      var text = window.kleStory.getNextText();
      if (text) {
        nameLabel.textContent = CFG.charName;
        typeText(text, function () {
          state.canClick = true;
          // 自动播放模式下，打字完成后自动推进
          if (state.autoPlay) {
            scheduleAutoAdvance();
          }
          // 打断过打字的不触发
          if (state.skipTypingCallback) return;
        });
        return;
      }
    }

    // 无法继续也没有选项 → 结束或等待
    showContinueHint();
  }

  // ==================== 点击推进 ====================
  function onTextBoxClick() {
    if (state.waitingForInput) return;
    if (state.showingChoices) return;

    if (state.isTyping) {
      // 打字中 → 瞬完成 + 打断 callback + 推进
      state.skipTypingCallback = true;
      finishTyping();
      state.canClick = true;
      state.canClick = false;
      clearTimeout(state.autoTimer);
      nextItem();
    } else if (state.canClick) {
      // 已完成 → 推进
      state.canClick = false;
      clearTimeout(state.autoTimer);
      nextItem();
    }
  }

  function nextItem() {
    // 检查选项
    if (window.kleStory && window.kleStory.hasChoices()) {
      showChoices(window.kleStory.getChoices());
      return;
    }
    // 继续下一段文本
    if (window.kleStory && window.kleStory.canContinue()) {
      processItem();
    } else {
      // 无法继续，显示结束提示
      showContinueHint();
    }
  }

  // ==================== 选项 ====================
  function showChoices(choices) {
    state.showingChoices = true;
    choiceArea.innerHTML = '';
    choiceArea.style.display = 'flex';
    continueHint.style.display = 'none';

    choices.forEach(function (choice, idx) {
      var btn = document.createElement('button');
      btn.className = 'kle-vn-choice-btn';
      btn.textContent = choice.text;
      btn.addEventListener('click', (function (index) {
        return function () {
          // 隐藏选项
          choiceArea.style.display = 'none';
          choiceArea.innerHTML = '';
          state.showingChoices = false;

          // 写入玩家选择
          nameLabel.textContent = '你';
          typeText(choice.text, function () {});

          // 让 ink 处理选项
          if (window.kleStory) {
            window.kleStory.choose(index);
          }

          // 继续故事
          setTimeout(function () {
            processItem();
          }, 100);
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

  // ==================== 开启 / 关闭 ====================
  function open(day) {
    if (day) state.day = day;

    // 重置状态
    state.isTyping = false;
    state.canClick = false;
    state.showingChoices = false;
    state.waitingForInput = false;
    state.skipTypingCallback = false;
    state.autoPlay = false;
    clearTimeout(state.autoTimer);
    clearTimeout(state.autoPlayTimer);

    // 构建 DOM
    if (!overlay) buildDOM();

    // 加载故事（首次）
    if (window.kleStory) {
      if (!window.kleStory.loadDay) {
        // 旧版 mock story，可能未初始化
        window.kleStory.loadDay(state.day).then(function () {
          document.getElementById('kle-vn-daylabel').textContent = 'DAY ' + state.day + ' · 初临';
          overlay.style.display = 'flex';
          requestAnimationFrame(function () {
            overlay.style.opacity = '1';
          });
          processItem();
        }).catch(function (err) {
          console.error('加载故事失败:', err);
        });
        return;
      }
    }

    // 显示面板
    var dayLabels = { 1: '初临', 2: '仪式准备', 3: '仪式与离场' };
    document.getElementById('kle-vn-daylabel').textContent = 'DAY ' + state.day + ' · ' + (dayLabels[state.day] || '');
    overlay.style.display = 'flex';
    requestAnimationFrame(function () {
      overlay.style.opacity = '1';
    });

    processItem();
  }

  function close() {
    if (!overlay) return;
    clearTimeout(state.autoPlayTimer);
    clearTimeout(state.autoTimer);
    state.autoPlay = false;
    state.waitingForInput = false;
    overlay.style.opacity = '0';
    setTimeout(function () {
      overlay.style.display = 'none';
    }, 300);
  }

  // ==================== 自动播放 ====================
  function toggleAutoPlay() {
    state.autoPlay = !state.autoPlay;
    updateAutoPlayBtn();
    if (state.autoPlay && state.canClick && !state.showingChoices) {
      scheduleAutoAdvance();
    }
  }

  function updateAutoPlayBtn() {
    var btn = document.getElementById('kle-vn-autoplay');
    if (!btn) return;
    if (state.autoPlay) {
      btn.style.color = '#b49cff';
      btn.style.borderColor = 'rgba(180,150,255,0.6)';
      btn.style.background = 'rgba(180,150,255,0.1)';
      btn.textContent = '⏸ 自动';
    } else {
      btn.style.color = 'rgba(180,150,255,0.4)';
      btn.style.borderColor = 'rgba(180,150,255,0.2)';
      btn.style.background = 'none';
      btn.textContent = '▶ 自动';
    }
  }

  function scheduleAutoAdvance() {
    clearTimeout(state.autoPlayTimer);
    if (!state.autoPlay) return;
    state.autoPlayTimer = setTimeout(function () {
      if (state.autoPlay && state.canClick && !state.showingChoices && !state.waitingForInput) {
        clearTimeout(state.autoTimer);
        state.canClick = false;
        nextItem();
        if (state.autoPlay) {
          scheduleAutoAdvance();
        }
      }
    }, CFG.autoPlayDelay);
  }

  // ==================== 对外接口 ====================
  window.KLE_VN = {
    open: open,
    close: close,
  };
})();