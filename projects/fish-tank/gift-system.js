// 拆分自 logic.js - 礼物系统 + 开发者模式

  // 处理标题点击(开发者模式解锁)
  function handleTitleClick() {
    const now = Date.now();
    const hint = document.getElementById('devHint');

    // 如果超过3秒不清零,重新计数
    if (now - devLastClickTime > 3000) {
      devClickCount = 0;
    }

    devLastClickTime = now;
    devClickCount++;

    if (devModeUnlocked) return; // 已经解锁

    if (devClickCount === 5) {
      hint.textContent = '(还差2次...)';
      hint.style.opacity = '0.6';
    } else if (devClickCount === 6) {
      hint.textContent = '(再1次!)';
      hint.style.opacity = '0.8';
    } else if (devClickCount >= 7) {
      devModeUnlocked = true;
      hint.textContent = '✨';
      hint.style.opacity = '1';
      showDevModeUnlockedToast();
      saveGameDataToDB();
      saveGameDataToDB();
    }
  }

  // 显示开发者模式解锁提示
  function showDevModeUnlockedToast() {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:#fff;padding:20px 30px;border-radius:15px;font-size:16px;z-index:9999;text-align:center;';
    toast.innerHTML = '🔧 开发者模式已解锁!<br><span style="font-size:12px;opacity:0.7;">收礼面板中可输入测试口令</span>';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // 检查并重置每日使用次数
  function checkDevDailyReset() {
    const today = new Date().toDateString();
    if (devLastUsageDate !== today) {
      devDailyUsage = 0;
      devLastUsageDate = today;
    }
  }

  // ========== 送礼系统 ==========

  // 语义识别物品
  function recognizeItem(itemName) {
    // 本地映射表优先匹配
    for (const [key, emoji] of Object.entries(itemToEmojiMap)) {
      if (itemName.includes(key) || key.includes(itemName)) {
        return emoji;
      }
    }

    // 没有匹配到则返回默认礼物
    return '🎁';
  }

  // 解析礼物代码
  function parseGiftCode(code) {
    try {
      // 提取【】中间的内容
      const match = code.match(/【([^】]+)】/);
      const raw = match ? match[1] : code.trim();
      // base64解码 + lz-string解压
      const decompressed = decodeURIComponent(atob(raw));
      const jsonStr = LZString.decompressFromBase64(decompressed);
      return jsonStr ? JSON.parse(jsonStr) : null;
    } catch {
      return null;
    }
  }

  // 根据祝福语获取emoji(本地关键词匹配)
  function getEmojiByBlessing(blessing) {
    if (!blessing) return null;

    for (const [keywords, emoji] of Object.entries(BLESSING_EMOJI_MAP)) {
      const regex = new RegExp(keywords);
      if (regex.test(blessing)) {
        return emoji;
      }
    }
    return null;
  }

  // 显示庆祝动画
  // 显示庆祝动画(全屏遮罩,点击关闭)
  function showCelebrationAnimation(emoji, blessing, onClose) {
    // 创建全屏遮罩
    const overlay = document.createElement('div');
    overlay.id = 'celebrationOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:2000;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;';

    // 顶部文字(两行)
    const topTextContainer = document.createElement('div');
    topTextContainer.style.cssText = 'position:absolute;top:60px;left:50%;transform:translateX(-50%);text-align:center;animation:fadeInDown 0.8s ease-out;';

    const topLine = document.createElement('div');
    topLine.style.cssText = 'color:#F7DC6F;font-size:22px;font-weight:bold;text-shadow:0 2px 10px rgba(0,0,0,0.5);margin-bottom:8px;';
    topLine.textContent = '✨ 你的祝福获得了海神的馈赠 ✨';

    const bottomLine = document.createElement('div');
    bottomLine.style.cssText = 'color:rgba(220,220,220,0.9);font-size:14px;font-style:italic;text-shadow:0 1px 5px rgba(0,0,0,0.5);';
    bottomLine.textContent = '快送去给朋友吧~';

    topTextContainer.appendChild(topLine);
    topTextContainer.appendChild(bottomLine);
    overlay.appendChild(topTextContainer);

    // 创建粒子容器
    const particleContainer = document.createElement('div');
    particleContainer.style.cssText = 'position:absolute;width:100px;height:100px;left:50%;top:50%;margin-left:-50px;margin-top:-50px;z-index:5;';

    // 创建emoji
    const emojiDiv = document.createElement('div');
    emojiDiv.style.cssText = 'font-size:120px;z-index:10;position:relative;animation:glowPulse 1.5s ease-in-out infinite;filter:drop-shadow(0 0 30px gold);cursor:pointer;';
    emojiDiv.textContent = emoji;

    // 创建光环
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;width:100px;height:100px;left:50%;top:50%;margin-left:-50px;margin-top:-50px;border:3px solid gold;border-radius:50%;opacity:0;animation:ringExpand 1.5s ease-out ${i * 0.4}s infinite;`;
      particleContainer.appendChild(ring);
    }

    // 创建星星
    const starPositions = [{x:-120,y:-80},{x:100,y:-60},{x:-90,y:60},{x:110,y:80},{x:-60,y:-130},{x:70,y:-120},{x:-140,y:20},{x:130,y:30}];
    const starEmojis = ['✨','⭐','🌟','💫'];
    starPositions.forEach((pos,i) => {
      const star = document.createElement('div');
      star.style.cssText = `position:absolute;left:calc(50% + ${pos.x}px);top:calc(50% + ${pos.y}px);font-size:20px;animation:starTwinkle 0.8s ease-in-out ${i * 0.1}s infinite;`;
      star.textContent = starEmojis[i % 4];
      particleContainer.appendChild(star);
    });

    // 创建粒子
    const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#F7DC6F','#DDA0DD','#87CEEB'];
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 150;
      p.style.cssText = `position:absolute;width:10px;height:10px;border-radius:50%;left:50%;top:50%;margin-left:-5px;margin-top:-5px;background:${colors[Math.floor(Math.random() * colors.length)]};animation:particleFly 1.5s ease-out ${Math.random() * 0.5}s infinite;--tx:${Math.cos(angle) * distance}px;--ty:${Math.sin(angle) * distance}px;`;
      particleContainer.appendChild(p);
    }

    // 提示文字
    const hint = document.createElement('div');
    hint.style.cssText = 'margin-top:30px;color:rgba(255,255,255,0.6);font-size:14px;z-index:10;';
    hint.textContent = '点击任意位置继续';

    overlay.appendChild(particleContainer);
    overlay.appendChild(emojiDiv);
    overlay.appendChild(hint);

    // 点击关闭
    overlay.onclick = () => {
      overlay.remove();
      if (onClose) onClose();
    };

    document.body.appendChild(overlay);
  }

  // 更新礼物数显示
  function updateGiftCountDisplay() {
    const countDisplay = document.getElementById('giftCountDisplay');
    if (countDisplay) {
      countDisplay.textContent = `剩余礼物:${giftCount} 个`;
    }
  }

  // 显示送礼面板
  function showGiftPanel() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const giftPanel = document.createElement('div');
    giftPanel.className = 'gift-panel';
    giftPanel.innerHTML = `
      <span class="gift-close" onclick="closeGiftPanel()">✕</span>
      <h3>💫 祈祷祝福</h3>
      <div id="giftCountDisplay" style="text-align:center;margin-bottom:15px;padding:8px;background:rgba(255,255,255,0.1);border-radius:10px;font-size:12px;color:rgba(255,255,255,0.8);">剩余礼物:${giftCount} 个</div>
      <div class="gift-section">
        <input type="text" id="giftSenderName" placeholder="你的名字">
        <textarea id="giftBlessing" placeholder="输入祝福语" maxlength="200"></textarea>
        <button id="confirmGiftBtn">生成礼物</button>
      </div>
      <div id="giftLoading" class="gift-section" style="display:none;">
        <h4>🔮 AI 正在分析...</h4>
        <div style="text-align:center;margin:20px 0;">
          <div style="font-size:48px;margin-bottom:10px;">⏳</div>
          <div id="loadingBlessing" style="font-size:12px;opacity:0.8;"></div>
          <div style="font-size:10px;opacity:0.6;margin-top:10px;">语义分析中...</div>
        </div>
        <div style="width:100%;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;margin:15px 0;">
          <div id="loadingProgress" style="width:0%;height:100%;background:linear-gradient(90deg,#667eea,#764ba2);border-radius:2px;transition:width 0.3s ease;"></div>
        </div>
      </div>
      <div id="giftResult" class="gift-section" style="display:none;">
        <h4>🎁 礼物确认</h4>
        <div style="text-align:center;margin:15px 0;">
          <div style="font-size:48px;margin-bottom:10px;">🎁</div>
          <div style="font-size:14px;">礼物:预览</div>
          <div style="font-size:12px;opacity:0.8;margin:10px 0;">祝福语</div>
        </div>
        <div style="display:flex;gap:10px;margin-top:15px;">
          <button id="addToMyTankBtn" style="flex:1;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#34c759 0%,#28a745 100%);color:#fff;cursor:pointer;font-size:14px;">🏠 放入鱼缸</button>
          <button id="sendToFriendBtn" style="flex:1;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;cursor:pointer;font-size:14px;">📤 送给朋友</button>
        </div>
        <div id="giftCodeDisplay" class="gift-code-display" style="display:none;margin-top:15px;"></div>
      </div>
    `;

    // 保存当前面板引用
    currentGiftPanel = giftPanel;

    // 绑定按钮事件
    giftPanel.querySelector('#confirmGiftBtn').onclick = confirmGift;
    giftPanel.querySelector('#addToMyTankBtn').onclick = addGiftToMyTank;
    giftPanel.querySelector('#sendToFriendBtn').onclick = sendGiftToFriend;

    overlay.appendChild(giftPanel);
    document.body.appendChild(overlay);
  }

  function closeGiftPanel() {
    if (currentGiftPanel && currentGiftPanel.parentNode) {
      currentGiftPanel.parentNode.remove();
    }
    currentGiftPanel = null;
  }

  // 显示收礼面板
  function showReceivePanel() {
    // 简单的弹窗创建
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

    // 检查是否需要重置每日次数
    checkDevDailyReset();

    // 构建开发者模式部分
    let devSectionHTML = '';
    if (devModeUnlocked) {
      devSectionHTML = '<div style="margin-top:15px;padding-top:15px;border-top:1px dashed rgba(255,255,255,0.2);">' +
        '<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:8px;">🔧 开发者模式 · 无限兑换</div>' +
        '<input type="text" id="devCodeInput" placeholder="输入测试口令" style="width:100%;padding:8px;border:none;border-radius:8px;background:rgba(255,255,255,0.1);color:#fff;margin-bottom:8px;box-sizing:border-box;">' +
        '<button id="confirmDevBtn" style="width:100%;padding:8px;border:none;border-radius:8px;background:rgba(100,100,100,0.5);color:#fff;cursor:pointer;font-size:12px;">兑换 (+' + DEV_REWARD_AMOUNT + '礼物)</button>' +
        '</div>';
    }

    // 构建面板HTML
    var panelHTML = '<span class="gift-close" onclick="this.parentNode.parentNode.remove()">✕</span>' +
      '<h3>📬 收取礼物</h3>' +
      '<div class="gift-section">' +
      '<input type="text" id="receiveCodeInput" placeholder="粘贴礼物代码">' +
      '<button id="confirmReceiveBtn">确认收取</button>' +
      '</div>' +
      '<div id="receiveResult" class="gift-section" style="display:none;">' +
      '<h4>🎁 礼物预览</h4>' +
      '<div style="text-align:center;margin:20px 0;">' +
      '<div style="font-size:48px;margin-bottom:10px;">🎁</div>' +
      '<div style="font-size:14px;">礼物:预览</div>' +
      '<div style="font-size:12px;opacity:0.8;margin:10px 0;">祝福语</div>' +
      '<div style="font-size:11px;opacity:0.6;">送礼人</div>' +
      '</div>' +
      '<button id="addToTankBtn">放入鱼缸</button>' +
      '</div>' +
      devSectionHTML;

    overlay.innerHTML = '<div class="gift-panel" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:30px;border-radius:20px;color:#fff;width:380px;max-width:90%;box-shadow:0 15px 50px rgba(0,0,0,0.5);">' + panelHTML + '</div>';

    document.body.appendChild(overlay);

    // 绑定按钮事件
    document.getElementById('confirmReceiveBtn').onclick = confirmReceive;
    document.getElementById('addToTankBtn').onclick = addReceivedFish;
    if (devModeUnlocked) {
      document.getElementById('confirmDevBtn').onclick = confirmDevCode;
    }
  }

  // 确认收取礼物
  function confirmReceive() {
    const code = document.getElementById('receiveCodeInput').value;

    if (!code) {
      alert('请输入礼物代码');
      return;
    }

    // 检查是否是特殊鱼代码
    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.startsWith('FISH_')) {
      const fishKey = trimmedCode.substring(5); // 去掉FISH_前缀
      const specialFish = SPECIAL_FISH[fishKey];
      if (!specialFish) {
        alert('无效的特殊鱼代码');
        return;
      }
      const codeHash = btoa(encodeURIComponent(code));
      if (usedCodes.includes(codeHash) && !devModeUnlocked) {
        alert('这条鱼已经被兑换过了~');
        return;
      }
      if (!devModeUnlocked) {
        usedCodes.push(codeHash);
        saveGameDataToDB();
        saveGameDataToDB();
      }
      addSpecialFishToTank(specialFish.svg, specialFish.name);
      alert(`🎉 成功兑换特殊鱼：${specialFish.name}！`);
      return;
    }

    const giftData = parseGiftCode(code);

    if (!giftData) {
      alert('无效的礼物代码');
      return;
    }

    // 生成码的hash用于标识(需要先编码防止非Latin1字符)
    const codeHash = btoa(encodeURIComponent(code.trim()));

    // 检查是否已使用过(开发者模式下跳过此检查)
    if (usedCodes.includes(codeHash) && !devModeUnlocked) {
      alert('这个礼物已经被兑换过了~');
      return;
    }

    // 标记为已使用(开发者模式下跳过)
    if (!devModeUnlocked) {
      usedCodes.push(codeHash);
      saveGameDataToDB();
    saveGameDataToDB();
    }

    // 显示礼物预览(使用缩短字段名 e/s/b)
    const resultDiv = document.getElementById('receiveResult');
    resultDiv.style.display = 'block';

    resultDiv.querySelector('div').innerHTML = `
      <div style="font-size:48px;margin-bottom:10px;">${giftData.e}</div>
      <div style="font-size:14px;">礼物:${giftData.e}</div>
      <div style="font-size:12px;opacity:0.8;margin:10px 0;">祝福:${giftData.b}</div>
      <div style="font-size:11px;opacity:0.6;">-- ${giftData.s}</div>
    `;

    // 保存当前礼物数据
    currentReceivedGift = { emoji: giftData.e, sender: giftData.s, blessing: giftData.b };
  }

  // 确认测试口令
  function confirmDevCode() {
    const code = document.getElementById('devCodeInput').value;

    if (!code) {
      alert('请输入测试口令');
      return;
    }

    // 验证口令（开发者模式下不限制次数）
    if (code === DEV_MODE_PASSWORD) {
      giftCount += DEV_REWARD_AMOUNT;
      saveGameDataToDB();
    saveGameDataToDB();

      alert(`🎁 测试口令兑换成功！获得 ${DEV_REWARD_AMOUNT} 个礼物！\n剩余礼物：${giftCount} 个`);

      // 清空输入框并关闭弹窗
      document.getElementById('devCodeInput').value = '';
      closeDevPanel();
    } else if (code === 'magic5') {
      nextFeedMagicBait = true;
      alert('🍬 神奇鱼饵已激活！下次喂鱼必定触发2倍变大效果！');
      document.getElementById('devCodeInput').value = '';
      closeDevPanel();
    } else if (code === 'legend100') {
      nextFeedLegendBait = true;
      alert('🍰 传说鱼饵已激活！下次喂鱼必定触发10倍变大效果！');
      document.getElementById('devCodeInput').value = '';
      closeDevPanel();
    } else if (code === 'shrink5') {
      nextFeedShrinkBait = true;
      alert('🍸 缩小鱼饵已激活！下次喂鱼必定触发缩小效果！');
      document.getElementById('devCodeInput').value = '';
      closeDevPanel();
    } else if (code === 'restore') {
      nextFeedRestoreBait = true;
      alert('🧃 还原鱼饵已激活！下次喂鱼必定触发还原效果！');
      document.getElementById('devCodeInput').value = '';
      closeDevPanel();
    } else if (code.startsWith('offline:')) {
      // offline:H — 设置离线时长 H 小时，用于测试离线奖励
      const hours = parseFloat(code.split(':')[1] || '1');
      const offsetMs = hours * 3600 * 1000; // 毫秒
      const newTime = Date.now() - offsetMs;
      localStorage.setItem('lastVisitTime', newTime.toString());
      console.log('[开发者口令] offline:', hours, 'h, 设置 lastVisitTime =', newTime, '| 当前时间:', Date.now(), '| 差值(ms):', Date.now() - newTime);
      const rule = REWARD_RULES.find(r => (hours * 60) >= r.minMinutes && (hours * 60) < r.maxMinutes);
      const ruleInfo = rule ? `，将触发 ${rule.draws} 次抽奖，礼物上限 ${rule.giftCap}` : '，但不满足最低触发条件';
      alert(`⏰ 离线时间已设为 ${hours}h（${Math.round(hours * 60)} 分钟）${ruleInfo}\n刷新页面后生效。`);
      document.getElementById('devCodeInput').value = '';
      closeDevPanel();
    } else {
      alert('无效的测试口令');
    }
  }

  // 关闭开发者面板
  function closeDevPanel() {
    const devPanel = document.querySelector('.gift-panel');
    if (devPanel && devPanel.parentNode) {
      devPanel.parentNode.remove();
    }
  }

  // 将收到的礼物鱼放入鱼缸
  function addReceivedFish() {
    if (!currentReceivedGift) return;

    const tank = document.getElementById('tankWater');
    const x = Math.random() * (tank.offsetWidth - 40);
    const y = Math.random() * (tank.offsetHeight - 40);
    const fish = document.createElement('div');
    fish.className = 'fish fish-new';
    fish.textContent = currentReceivedGift.emoji;
    fish.style.left = x + 'px';
    fish.style.top = y + 'px';
    fish.id = 'fish-' + fishIdCounter++;
    fish.onclick = () => petFish(fish.id);
    fish.style.cursor = 'pointer';
    tank.appendChild(fish);
    setTimeout(() => fish.classList.remove('fish-new'), 5000);

    // 设置收藏长按触发
    setupCollectionLongPress(fish, fish.id);

    // 注册到鱼群数组(驱动游动)
    fishes.push({
      id: fish.id,
      type: currentReceivedGift.emoji,
      x: x,
      y: y,
      dx: (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 8),
      dy: (Math.random() - 0.5) * 3,
      feedCount: 0,
      collected: false,
      collectedAt: Date.now(),
      sender: currentReceivedGift.sender,
      blessing: currentReceivedGift.blessing,
      name: '',
      description: ''
    });

    // 更新统计
    stats.giftsReceived++;
    saveGameDataToDB();
    saveGameDataToDB();
    checkAchievements(); // 检查普通成就
    checkSecretAchievements(); // 检查隐藏成就(鱼数量变化相关)

    // 关闭弹窗
    const overlay = document.querySelector('.gift-panel').parentNode;
    if (overlay) overlay.remove();

    // 显示祝福弹窗
    showBlessingPopup(currentReceivedGift.sender, currentReceivedGift.blessing);

    currentReceivedGift = null;
  }

  // 确认礼物
  // 确认礼物(新的AI优先流程)
  // 确认礼物(AI优先流程)
  function confirmGift() {
    const senderName = document.getElementById('giftSenderName').value;
    const blessing = document.getElementById('giftBlessing').value.trim();

    if (blessing.length > 200) {
      alert('祝福语不能超过200字');
      return;
    }

    // 检查礼物数量
    if (giftCount <= 0) {
      alert('礼物数不足,请先解锁成就获得更多礼物!');
      return;
    }

    if (!blessing) {
      alert('请输入祝福语');
      return;
    }

    // 显示加载状态
    const resultDiv = document.getElementById('giftResult');
    const loadingDiv = document.getElementById('giftLoading');

    resultDiv.style.display = 'none';
    loadingDiv.style.display = 'block';

    // 显示祝福语在加载中
    document.getElementById('loadingBlessing').textContent = `「${blessing}」`;

    // 更新加载进度(20秒完成)
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 0.5;
      document.getElementById('loadingProgress').style.width = `${Math.min(progress, 100)}%`;
      if (progress >= 100) clearInterval(progressInterval);
    }, 100);

    // 显示结果的函数
    function showResult(emoji) {
      currentGiftEmoji = emoji;
      loadingDiv.style.display = 'none';
      resultDiv.style.display = 'block';

      // 更新礼物预览
      resultDiv.querySelector('div').innerHTML = `
        <div style="font-size:48px;margin-bottom:10px;">${emoji}</div>
        <div style="font-size:14px;">礼物:${emoji}</div>
        <div style="font-size:12px;opacity:0.8;margin:10px 0;">祝福:${blessing}</div>
      `;

      // 显示两个按钮(默认隐藏代码区域)
      document.getElementById('addToMyTankBtn').style.display = 'block';
      document.getElementById('sendToFriendBtn').style.display = 'block';
      document.getElementById('giftCodeDisplay').style.display = 'none';
    }

    // AI优先:先调用AI语义理解
    getAIEmoji(blessing).then(aiEmoji => {
      clearInterval(progressInterval);

      if (aiEmoji) {
        // AI成功:显示庆祝动画,点击后显示结果
        showCelebrationAnimation(aiEmoji, blessing, () => {
          showResult(aiEmoji);
        });
      } else {
        // AI失败:尝试本地关键词匹配(不显示庆祝动画)
        const localEmoji = getEmojiByBlessing(blessing) || fishTypes[Math.floor(Math.random() * fishTypes.length)];
        showResult(localEmoji);
      }
    }).catch(error => {
      // AI调用错误:静默降级到本地匹配
      clearInterval(progressInterval);

      const localEmoji = getEmojiByBlessing(blessing) || fishTypes[Math.floor(Math.random() * fishTypes.length)];
      showResult(localEmoji);
    });
  }

  // 放入自己的鱼缸
  function addGiftToMyTank() {
    const emoji = currentGiftEmoji || fishTypes[Math.floor(Math.random() * fishTypes.length)];

    // 扣除礼物数
    giftCount--;
    totalGiftsSent++;
    updateGiftCountDisplay();

    // 添加鱼到鱼缸
    const tank = document.getElementById('tankWater');
    const x = Math.random() * (tank.offsetWidth - 40);
    const y = Math.random() * (tank.offsetHeight - 40);
    const fish = document.createElement('div');
    fish.className = 'fish fish-new';
    fish.textContent = emoji;
    fish.style.left = x + 'px';
    fish.style.top = y + 'px';
    fish.id = 'fish-' + fishIdCounter++;
    fish.onclick = () => petFish(fish.id);
    fish.style.cursor = 'pointer';
    tank.appendChild(fish);
    setTimeout(() => fish.classList.remove('fish-new'), 5000);

    // 设置收藏长按触发
    setupCollectionLongPress(fish, fish.id);

    // 注册到鱼群数组
    fishes.push({
      id: fish.id,
      type: emoji,
      x: x,
      y: y,
      dx: (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 8),
      dy: (Math.random() - 0.5) * 3,
      feedCount: 0
    });

    // 更新统计
    stats.giftsReceived++;
    saveGameDataToDB();
    saveGameDataToDB();
    checkAchievements(); // 检查普通成就
    checkSecretAchievements(); // 检查隐藏成就

    // 关闭面板
    closeGiftPanel();

    // 显示成功提示
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#34c759 0%,#28a745 100%);color:#fff;padding:20px 30px;border-radius:15px;font-size:16px;z-index:9999;text-align:center;';
    toast.innerHTML = `💫 祝福已放入鱼缸!<br><span style="font-size:24px;margin-top:10px;display:block;">${emoji}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // 送给朋友
  function sendGiftToFriend() {
    const senderName = document.getElementById('giftSenderName').value;
    const blessing = document.getElementById('giftBlessing').value;

    const emoji = currentGiftEmoji || fishTypes[Math.floor(Math.random() * fishTypes.length)];

    // 构建礼物数据
    const giftData = {
      e: emoji,
      s: senderName || '神秘好友',
      b: blessing || '祝你养鱼开心!'
    };

    // 扣除礼物数
    giftCount--;
    totalGiftsSent++;
    updateGiftCountDisplay();

    // 生成礼物码
    const jsonStr = JSON.stringify(giftData);
    const compressed = LZString.compressToBase64(jsonStr);
    const giftCode = btoa(encodeURIComponent(compressed));

    // 显示代码区域,隐藏两个按钮
    const codeDisplay = document.getElementById('giftCodeDisplay');
    codeDisplay.innerHTML = `<code>${giftCode}</code>`;
    codeDisplay.style.display = 'block';
    document.getElementById('addToMyTankBtn').style.display = 'none';
    document.getElementById('sendToFriendBtn').style.display = 'none';

    // 创建复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.style.cssText = 'width:100%;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;cursor:pointer;font-size:14px;margin-top:10px;';
    copyBtn.textContent = '复制代码';
    copyBtn.onclick = () => {
      const copyText = '送你一个礼物,粘贴口令代码去领取吧~【' + giftCode + '】';
      navigator.clipboard.writeText(copyText).then(() => {
        copyBtn.textContent = '已复制!';
      }).catch(() => {
        alert('复制失败,请手动复制');
      });
    };

    const oldCopyBtn = codeDisplay.querySelector('button');
    if (oldCopyBtn) {
      oldCopyBtn.remove();
    }
    codeDisplay.appendChild(copyBtn);

    // 自动复制
    const copyText = '送你一个礼物,粘贴口令代码去领取吧~【' + giftCode + '】';
    navigator.clipboard.writeText(copyText).then(() => {
      copyBtn.textContent = '发送给朋友领取礼物吧!';
      copyBtn.style.background = 'linear-gradient(135deg,#34c759 0%,#28a745 100%)';
    }).catch(() => {});

    // 保存统计
    stats.giftsSent++;
    saveGameDataToDB();
    saveGameDataToDB();
  }

  // 生成礼物代码(已废弃,保留兼容性)
  function generateGiftCode() {
    sendGiftToFriend();
  }

  // 接收礼物
  function receiveGift() {
    const code = document.getElementById('giftCodeInput').value;

    if (!code) {
      alert('请输入礼物代码');
      return;
    }

    const giftData = parseGiftCode(code);

    if (giftData) {
      // 显示礼物确认弹窗
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1001;display:flex;align-items:center;justify-content:center;';
      overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

      const popup = document.createElement('div');
      popup.style.cssText = 'background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px;border-radius:20px;color:#fff;width:340px;text-align:center;';
      popup.innerHTML = `
        <div style="font-size:48px;margin-bottom:15px;">🎁</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:10px;">收到礼物!</div>
        <div style="font-size:14px;margin-bottom:15px;">${giftData.s} 送你 ${giftData.e}</div>
        <div style="font-size:12px;opacity:0.9;line-height:1.5;margin-bottom:20px;">祝福:${giftData.b}</div>
        <button onclick="this.parentNode.parentNode.remove();addGiftFish('${giftData.e}', '${giftData.s}', '${giftData.b}')" style="padding:12px 30px;border:none;border-radius:25px;background:rgba(255,255,255,0.2);color:#fff;cursor:pointer;font-size:14px;">放入鱼缸</button>
      `;

      overlay.appendChild(popup);
      document.body.appendChild(overlay);
    } else {
      alert('无效的礼物代码');
    }
  }

  // 添加礼物鱼到鱼缸
  function addGiftFish(emoji, sender, blessing) {
    const tank = document.getElementById('tankWater');
    const x = Math.random() * (tank.offsetWidth - 40);
    const y = Math.random() * (tank.offsetHeight - 40);
    const fish = document.createElement('div');
    fish.className = 'fish fish-new';
    fish.textContent = emoji;
    fish.style.left = x + 'px';
    fish.style.top = y + 'px';
    fish.id = 'fish-' + fishIdCounter++;
    fish.onclick = () => petFish(fish.id);
    fish.style.cursor = 'pointer';
    tank.appendChild(fish);
    setTimeout(() => fish.classList.remove('fish-new'), 5000);

    // 设置收藏长按触发（和普通鱼一样）
    setupCollectionLongPress(fish, fish.id);

    // 注册到鱼群数组(驱动游动)
    fishes.push({
      id: fish.id,
      type: emoji,
      x: x,
      y: y,
      dx: (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 8),
      dy: (Math.random() - 0.5) * 3,
      feedCount: 0,
      collected: false,
      name: '',
      description: ''
    });

    // 更新统计
    stats.giftsReceived++;
    saveGameDataToDB();
    saveGameDataToDB();
    checkAchievements(); // 检查普通成就
    checkSecretAchievements(); // 检查隐藏成就(鱼数量变化相关)

    // 显示祝福弹窗
    showBlessingPopup(sender, blessing);
  }

  // 显示祝福弹窗
  function showBlessingPopup(sender, blessing) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1001;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const popup = document.createElement('div');
    popup.style.cssText = 'background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px;border-radius:20px;color:#fff;width:340px;text-align:center;';
    popup.innerHTML = `
      <div style="font-size:48px;margin-bottom:15px;">🎉</div>
      <div style="font-size:18px;font-weight:700;margin-bottom:10px;">收到祝福!</div>
      <div style="font-size:14px;margin-bottom:15px;">${sender} 的祝福</div>
      <div style="font-size:12px;opacity:0.9;line-height:1.5;margin-bottom:20px;">${blessing}</div>
      <button onclick="this.parentNode.parentNode.remove()" style="padding:12px 30px;border:none;border-radius:25px;background:rgba(255,255,255,0.2);color:#fff;cursor:pointer;font-size:14px;">谢谢</button>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  }
