// 拆分自 logic.js - 鱼CRUD + 喂鱼 + 碰撞 + 水草

  // 生成用户唯一ID
  function generateUserId() {
    const stored = localStorage.getItem('fishTankUserId');
    if (stored) return stored;
    const newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('fishTankUserId', newId);
    return newId;
  }

  // 显示提示消息
  function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:#fff;padding:15px 25px;border-radius:10px;font-size:14px;z-index:9999;animation:fadeIn 0.2s;';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  function schedulePlantGenerate() {
    const now = Date.now();
    if (now >= nextPlantGenerateTime) {
      generateRandomPlant();
      nextPlantGenerateTime = now + Math.random() * 20 * 1000; // 0-20秒
    }
  }

  // 生成随机水草/珊瑚
  function generateRandomPlant() {
    const tank = document.getElementById('tankWater');
    if (!tank) return;

    // 检查水草数量是否达到上限50
    if (plants.length >= 50) return;

    const tankWidth = tank.offsetWidth;
    const tankHeight = tank.offsetHeight;
    const plantType = plantTypes[Math.floor(Math.random() * plantTypes.length)];
    const x = Math.random() * (tankWidth - 30);
    const y = tankHeight - 50; // 生成在水缸底部

    const plant = document.createElement('div');
    plant.className = 'plant';
    plant.textContent = plantType;
    plant.style.left = x + 'px';
    plant.style.bottom = '10px';
    plant.style.fontSize = '24px';
    plant.style.position = 'absolute';
    plant.style.cursor = 'pointer';
    plant.style.transition = 'transform 0.2s';
    // 计算当前plants中最大的ID数字，加1作为新ID，确保不重复
    const maxPlantId = plants.reduce((max, p) => {
      const num = parseInt(p.id.split('-')[1]) || 0;
      return num > max ? num : max;
    }, -1);
    const newPlantId = 'plant-' + (maxPlantId + 1);
    plant.id = newPlantId;
    plant.onclick = () => collectPlant(newPlantId);

    tank.appendChild(plant);
    plants.push({ id: plant.id, type: plantType, x, y });
  }

  // 收集水草,减少喂鱼冷却1分钟
  function collectPlant(plantId) {
    const plantEl = document.getElementById(plantId);
    if (!plantEl) return;

    stats.plantsCollected++; // 记录收集水草次数
    checkAchievements(); // 检查成就

    // 减少喂鱼冷却1分钟
    if (!canFeedFish()) {
      lastFeedFishTime = Math.max(0, lastFeedFishTime - 60000);
      updateFeedFishButton();
    }

    // 收集动画
    plantEl.style.transform = 'scale(0)';
    plantEl.style.opacity = '0';
    setTimeout(() => {
      if (plantEl.parentNode) {
        plantEl.parentNode.removeChild(plantEl);
      }
    }, 200);

    plants = plants.filter(p => p.id !== plantId);
    saveGameDataToDB();
    saveGameDataToDB();
  }

  // 检查是否可以添加鱼
  function canAddFish() {
    const now = Date.now();
    return now - lastAddFishTime >= ADD_FISH_COOLDOWN;
  }

  // 获取冷却剩余时间(秒)
  function getCooldownRemaining() {
    const now = Date.now();
    const elapsed = now - lastAddFishTime;
    const remaining = ADD_FISH_COOLDOWN - elapsed;
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  // 更新添加鱼按钮状态
  function updateAddFishButton() {
    const btn = document.getElementById('addFishBtn');
    if (!btn) return;

    if (canAddFish()) {
      btn.disabled = false;
      btn.textContent = '➕ 添加鱼';
      btn.style.opacity = '1';
    } else {
      const remaining = getCooldownRemaining();
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      btn.disabled = true;
      btn.textContent = `⏳ ${minutes}:${seconds.toString().padStart(2, '0')}`;
      btn.style.opacity = '0.6';
    }
  }

  // 添加随机鱼
  function addRandomFish() {
    stats.addFishClicks++; // 记录点击添加鱼按钮
    checkAchievements(); // 检查成就
    if (!canAddFish()) {
      saveGameDataToDB();
      saveGameDataToDB();
      return;
    }

    const tank = document.getElementById('tankWater');
    const fish = document.createElement('div');
    const fishType = fishTypes[Math.floor(Math.random() * fishTypes.length)];
    const x = Math.random() * (tank.offsetWidth - 40);
    const y = Math.random() * (tank.offsetHeight - 40);

    fish.className = 'fish fish-new';
    fish.textContent = fishType;
    fish.style.left = x + 'px';
    fish.style.top = y + 'px';
    // 鱼的移动完全由JS控制,不再使用CSS动画
    fish.id = 'fish-' + fishIdCounter++;

    // 绑定点击事件 - 摸鱼减少冷却时间
    fish.style.cursor = 'pointer';
    fish.onclick = () => petFish(fish.id);

    tank.appendChild(fish);

    // 设置收藏长按触发
    setupCollectionLongPress(fish, fish.id);

    // 5秒后移除新鱼特效
    setTimeout(() => {
      fish.classList.remove('fish-new');
    }, 5000);
    fishes.push({ id: fish.id, type: fishType, x, y, dx: (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 8), dy: (Math.random() - 0.5) * 3, feedCount: 0, collected: false, name: '', description: '', collectedAt: null });

    lastAddFishTime = Date.now();
    updateFishCount();
    checkAchievements(); // 检查成就
    saveGameDataToDB();
    saveGameDataToDB();
  }

  // 收藏长按触发 - PC和移动端统一长按弹出
  function setupCollectionLongPress(fishEl, fishId) {
    let longPressTimer = null;
    const longPressDuration = 600; // 长按600ms触发

    // PC: mousedown 开始计时
    fishEl.addEventListener('mousedown', (e) => {
      longPressTimer = setTimeout(() => {
        e.stopPropagation();
        showCollectionMenu(fishId);
      }, longPressDuration);
    });
    fishEl.addEventListener('mouseup', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    });
    fishEl.addEventListener('mouseleave', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    });

    // 移动端: 长按0.6秒触发
    fishEl.addEventListener('touchstart', (e) => {
      longPressTimer = setTimeout(() => {
        e.preventDefault();
        e.stopPropagation();
        showCollectionMenu(fishId);
      }, longPressDuration);
    }, { passive: false });
    fishEl.addEventListener('touchend', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    });
    fishEl.addEventListener('touchmove', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    });
  }

  // 显示收藏菜单
  // 长按菜单（收藏/取消收藏/删除）
  function showCollectionMenu(fishId) {
    const fishData = fishes.find(f => f.id === fishId);
    if (!fishData) return;

    const isCollected = fishData.collected;
    const isGift = !!fishData.sender;
    const fishIcon = fishData.type.startsWith('assets/')
      ? '<img src="' + fishData.type + '" style="width:36px;height:36px;vertical-align:middle;">'
      : fishData.type;
    const giftTag = isGift ? '<span style="margin-left:8px;font-size:12px;opacity:0.6;">🎁礼物鱼</span>' : '';

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    var btn1, btn2;
    if (isCollected) {
      btn1 = '<button onclick="uncollectFish(\'' + fishId + '\');this.parentNode.parentNode.parentNode.remove();" style="padding:12px 20px;border:none;border-radius:12px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;cursor:pointer;font-size:14px;font-weight:bold;">⭐ 取消收藏</button>';
    } else {
      btn1 = '<button onclick="confirmCollectFish(\'' + fishId + '\');this.parentNode.parentNode.parentNode.remove();" style="padding:12px 20px;border:none;border-radius:12px;background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);color:#fff;cursor:pointer;font-size:14px;font-weight:bold;">⭐ 收藏</button>';
    }
    btn2 = '<button onclick="confirmDeleteFish(\'' + fishId + '\');this.parentNode.parentNode.remove();" style="padding:12px 20px;border:none;border-radius:12px;background:linear-gradient(135deg,#ff6b6b 0%,#ee5a5a 100%);color:#fff;cursor:pointer;font-size:14px;">🗑️ 删除</button>';

    var html = '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:25px;border-radius:20px;color:#fff;width:280px;box-shadow:0 15px 50px rgba(0,0,0,0.5);">';
    html += '<div style="text-align:center;font-size:16px;font-weight:bold;margin-bottom:20px;">' + fishIcon + giftTag + '</div>';
    html += '<div style="display:flex;flex-direction:column;gap:10px;">' + btn1 + btn2;
    html += '<button onclick="this.parentNode.parentNode.parentNode.remove()" style="padding:10px 20px;border:none;border-radius:10px;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);cursor:pointer;font-size:13px;">关闭</button>';
    html += '</div></div>';
    overlay.innerHTML = html;

    document.body.appendChild(overlay);
  }

  // 确认收藏（弹出输入名字/描述的框）
  function confirmCollectFish(fishId) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1001;';

    var html = '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:25px;border-radius:20px;color:#fff;width:280px;box-shadow:0 15px 50px rgba(0,0,0,0.5);">';
    html += '<div style="text-align:center;font-size:16px;font-weight:bold;margin-bottom:15px;">⭐ 收藏这条鱼</div>';
    html += '<input type="text" id="collectNameInput" placeholder="给鱼起个名字（选填）" maxlength="20" style="width:100%;padding:10px 12px;border:none;border-radius:10px;background:rgba(255,255,255,0.15);color:#fff;font-size:14px;box-sizing:border-box;margin-bottom:10px;outline:none;">';
    html += '<textarea id="collectDescInput" placeholder="描述（选填，最多100字）" maxlength="100" rows="2" style="width:100%;padding:10px 12px;border:none;border-radius:10px;background:rgba(255,255,255,0.15);color:#fff;font-size:14px;resize:none;box-sizing:border-box;margin-bottom:15px;outline:none;"></textarea>';
    html += '<div style="display:flex;gap:10px;">';
    html += '<button id="cancelCollectBtn" style="flex:1;padding:10px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:13px;">取消</button>';
    html += '<button id="confirmCollectBtn" style="flex:1;padding:10px;border:none;border-radius:10px;background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);color:#fff;cursor:pointer;font-size:13px;font-weight:bold;">确认</button>';
    html += '</div></div>';
    overlay.innerHTML = html;

    document.body.appendChild(overlay);
    document.getElementById('collectNameInput').focus();

    // 用闭包绑定，不依赖 onclick 字符串
    document.getElementById('cancelCollectBtn').addEventListener('click', function() {
      overlay.remove();
    });
    document.getElementById('confirmCollectBtn').addEventListener('click', function() {
      var name = document.getElementById('collectNameInput').value.trim();
      var desc = document.getElementById('collectDescInput').value.trim();
      var fishData = fishes.find(function(f) { return f.id === fishId; });
      if (!fishData) return;
      fishData.collected = true;
      fishData.name = name;
      fishData.description = desc;
      fishData.collectedAt = Date.now();
      overlay.remove();
      saveGameDataToDB();
      saveGameDataToDB();
      showToast('⭐ 收藏成功');
    });
  }

  // 执行收藏（已由 confirmCollectFish 的闭包处理，此函数保留作备用）
  function doCollectFish(fishId) {
    var fishData = fishes.find(function(f) { return f.id === fishId; });
    if (!fishData) return;
    var name = (document.getElementById('collectNameInput') || {value: ''}).value.trim();
    var desc = (document.getElementById('collectDescInput') || {value: ''}).value.trim();
    fishData.collected = true;
    fishData.name = name;
    fishData.description = desc;
    fishData.collectedAt = Date.now();
    saveGameDataToDB();
    saveGameDataToDB();
    showToast('⭐ 收藏成功');
  }

  // 取消收藏
  function uncollectFish(fishId) {
    const fishData = fishes.find(f => f.id === fishId);
    if (!fishData) return;
    fishData.collected = false;
    fishData.name = '';
    fishData.description = '';
    fishData.collectedAt = null;
    saveGameDataToDB();
    saveGameDataToDB();
    showToast('☆ 已取消收藏');
  }

  // 确认删除鱼
  function confirmDeleteFish(fishId) {
    const fishData = fishes.find(f => f.id === fishId);
    if (!fishData) return;
    const isGift = !!fishData.sender;
    const msg = isGift
      ? '🎁 放生后祝福语将丢失，确定要删除这条礼物鱼吗？'
      : '确定要放生这条鱼吗？';
    if (!confirm(msg)) return;
    deleteFish(fishId);
  }

  // 删除鱼（实际执行）
  function deleteFish(fishId) {
    const fishEl = document.getElementById(fishId);
    if (fishEl) fishEl.remove();
    fishes = fishes.filter(f => f.id !== fishId);
    saveGameDataToDB();
    saveGameDataToDB();
    updateFishCount();
    checkSecretAchievements();
    showToast('🗑️ 鱼已放生');
  }

  // 添加特殊SVG鱼到鱼缸
  function addSpecialFishToTank(svgPath, fishName) {
    const tank = document.getElementById('tankWater');
    const fish = document.createElement('div');
    const x = Math.random() * (tank.offsetWidth - 60);
    const y = Math.random() * (tank.offsetHeight - 60);

    fish.className = 'fish fish-new';
    fish.style.left = x + 'px';
    fish.style.top = y + 'px';
    fish.style.width = '50px';
    fish.style.height = '50px';
    fish.id = 'fish-' + fishIdCounter++;

    // 使用img标签显示SVG
    const img = document.createElement('img');
    img.src = svgPath;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.pointerEvents = 'none';
    fish.appendChild(img);

    // 绑定点击事件 - 摸鱼减少冷却时间
    fish.style.cursor = 'pointer';
    fish.onclick = () => petFish(fish.id);

    tank.appendChild(fish);

    // 设置收藏长按触发
    setupCollectionLongPress(fish, fish.id);

    // 5秒后移除新鱼特效
    setTimeout(() => {
      fish.classList.remove('fish-new');
    }, 5000);

    fishes.push({ id: fish.id, type: svgPath, x, y, dx: (Math.random() > 0.5 ? 1 : -1) * (6 + Math.random() * 6), dy: (Math.random() - 0.5) * 2, feedCount: 0, isSpecial: true, collected: false, name: '', description: '', collectedAt: null });

    lastAddFishTime = Date.now();
    updateFishCount();
    checkAchievements();
    saveGameDataToDB();
    saveGameDataToDB();
  }

  // 摸鱼 - 点击鱼减少冷却时间
  function petFish(fishId) {
    stats.petFishClicks++; // 记录摸鱼点击次数
    checkAchievements(); // 检查成就
    if (!canAddFish()) {
      lastAddFishTime = Math.max(0, lastAddFishTime - 60000); // 减少1分钟
      updateAddFishButton();
      saveGameDataToDB();
      saveGameDataToDB();

      // 显示摸鱼反馈(不改变鱼的永久大小)
      const fishEl = document.getElementById(fishId);
      const fishData = fishes.find(f => f.id === fishId);
      if (fishEl && fishData) {
        // 保存当前大小
        const currentScale = 1 + (fishData.feedCount || 0) * 0.15;
        fishEl.style.transform = `scale(${currentScale * 1.2})`;
        setTimeout(() => {
          fishEl.style.transform = `scale(${currentScale})`;
        }, 150);
        
        // 有概率触发在线事件（摸鱼小惊喜）
        if (Math.random() < 0.10) triggerOnlineEvent('petting');
      }
    }
  }

  // 生成水泡
  function generateBubble() {
    const tank = document.getElementById('tankWater');
    const bubble = document.createElement('div');
    const x = Math.random() * (tank.offsetWidth - 20);

    bubble.className = 'fish bubble';
    bubble.textContent = '●';
    bubble.style.left = x + 'px';
    bubble.style.bottom = '0px';

    tank.appendChild(bubble);
    bubbles.push(bubble);

    // 3秒后移除水泡
    setTimeout(() => {
      if (bubble.parentNode) {
        bubble.parentNode.removeChild(bubble);
        bubbles = bubbles.filter(b => b !== bubble);
      }
    }, 3000);
  }

  // 更新鱼的位置 - 更加自由随意的游动
  function updateFishPositions() {
    const tank = document.getElementById('tankWater');
    const tankWidth = tank.offsetWidth;
    const tankHeight = tank.offsetHeight;

    fishes.forEach(fish => {
      const fishEl = document.getElementById(fish.id);
      if (!fishEl) return;

      // === 重力感应逻辑 ===
      if (gravityEnabled && (Math.abs(gravityX) > 2 || Math.abs(gravityY) > 2)) {
        // 根据重力倾斜调整移动方向
        fish.dx += gravityX * gravitySensitivity * 0.05;
        fish.dy += gravityY * gravitySensitivity * 0.05;
      }
      // ======================

      // === 鱼饵吸引逻辑 ===
      const BAIT_DETECT_RANGE = 400; // 检测鱼饵的范围（像素）
      if (currentBait && currentBait.parentNode) {
        const baitRect = currentBait.getBoundingClientRect();
        const fishRect = fishEl.getBoundingClientRect();
        const fishCenterX = fishRect.left + fishRect.width / 2;
        const fishCenterY = fishRect.top + fishRect.height / 2;
        const baitCenterX = baitRect.left + baitRect.width / 2;
        const baitCenterY = baitRect.top + baitRect.height / 2;

        const dx = baitCenterX - fishCenterX;
        const dy = baitCenterY - fishCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 在检测范围内，主动靠近鱼饵
        if (distance < BAIT_DETECT_RANGE && distance > 5) {
          const speed = 3; // 靠近速度
          fish.dx += (dx / distance) * speed * 0.1;
          fish.dy += (dy / distance) * speed * 0.1;
        }
      }
      // =====================

      // 每100ms随机改变方向和速度,让游动更自然
      if (Math.random() < 0.2) {
        fish.dx += (Math.random() - 0.5) * 8; // 水平速度变化更大
        fish.dy += (Math.random() - 0.5) * 1; // 垂直速度变化很小

        // 限制最大速度:水平快,垂直慢
        const maxSpeedX = 25;
        const maxSpeedY = 5;
        fish.dx = Math.max(-maxSpeedX, Math.min(maxSpeedX, fish.dx));
        fish.dy = Math.max(-maxSpeedY, Math.min(maxSpeedY, fish.dy));
      }

      // 更新位置
      fish.x += fish.dx * 0.1; // 乘以0.1因为每100ms更新一次
      fish.y += fish.dy * 0.1;

      // 边界检测 - 碰到边界时水平翻转反方向移动
      if (fish.x <= 0) {
        fish.x = 0;
        fish.dx = Math.abs(fish.dx); // 水平翻转向右
      } else if (fish.x >= tankWidth - 40) {
        fish.x = tankWidth - 40;
        fish.dx = -Math.abs(fish.dx); // 水平翻转向左
      }

      if (fish.y <= 0) {
        fish.y = 0;
        fish.dy = Math.abs(fish.dy) + 1; // 向下
      } else if (fish.y >= tankHeight - 40) {
        fish.y = tankHeight - 40;
        fish.dy = -Math.abs(fish.dy) - 1; // 向上
      }

      fishEl.style.left = fish.x + 'px';
      fishEl.style.top = fish.y + 'px';
    });
  }

  // 检查是否可以喂鱼
  function canFeedFish() {
    const now = Date.now();
    return now - lastFeedFishTime >= FEED_FISH_COOLDOWN;
  }

  // 获取喂鱼冷却剩余时间(秒)
  function getFeedCooldownRemaining() {
    const now = Date.now();
    const elapsed = now - lastFeedFishTime;
    const remaining = FEED_FISH_COOLDOWN - elapsed;
    return Math.max(0, Math.ceil(remaining / 1000));
  }

  // 更新喂鱼按钮状态
  function updateFeedFishButton() {
    const btn = document.getElementById('feedFishBtn');
    if (!btn) return;

    if (canFeedFish()) {
      btn.disabled = false;
      btn.textContent = '🍽️ 喂鱼';
      btn.style.opacity = '1';
    } else {
      const remaining = getFeedCooldownRemaining();
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      btn.disabled = true;
      btn.textContent = `⏳ ${minutes}:${seconds.toString().padStart(2, '0')}`;
      btn.style.opacity = '0.6';
    }
  }

  // 退出投喂模式
  function exitFeedingMode() {
    isFeedingMode = false;
    document.getElementById('feedingHint').style.display = 'none';
    document.getElementById('fishTank').style.cursor = 'default';
    // 移除点击事件监听
    const tank = document.getElementById('tankWater');
    tank.removeEventListener('click', handleTankClick);
    // 清理碰撞检测
    if (baitCheckInterval) {
      clearInterval(baitCheckInterval);
      baitCheckInterval = null;
    }
    // 清理鱼饵
    if (currentBait) {
      if (currentBait.parentNode) currentBait.remove();
      currentBait = null;
    }
  }

  // 处理鱼缸点击（放置鱼饵）
  function handleTankClick(e) {
    if (!isFeedingMode) return;

    // 获取点击位置（相对于 tankWater）
    const tank = document.getElementById('tankWater');
    const rect = tank.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 防止点击到其他元素
    if (e.target !== tank && !e.target.classList.contains('fish-counter') && !e.target.classList.contains('feeding-hint')) {
      // 点击的是鱼或其他元素，可能不是用户想要的，忽略
      if (e.target.classList.contains('fish')) return;
    }

    // 如果已存在鱼饵，先删掉旧的
    if (currentBait) {
      if (currentBait.parentNode) currentBait.remove();
      currentBait = null;
    }
    // 清理之前的碰撞检测循环
    if (baitCheckInterval) {
      clearInterval(baitCheckInterval);
      baitCheckInterval = null;
    }

    // 创建鱼饵
    const bait = document.createElement('div');
    bait.className = 'bait';
    bait.textContent = '🍎';
    bait.style.left = x + 'px';
    bait.style.top = y + 'px';
    tank.appendChild(bait);
    currentBait = bait;

    // 鱼饵轻微下沉动画（用 CSS 动画模拟漂浮，同时往下慢慢移）
    let baitY = y;
    const sinkSpeed = 0.5; // 每帧下沉速度（像素）

    // 碰撞检测循环
    baitCheckInterval = setInterval(() => {
      if (!currentBait || !currentBait.parentNode) {
        clearInterval(baitCheckInterval);
        return;
      }

      // 鱼饵缓慢下沉
      baitY += sinkSpeed;
      currentBait.style.top = baitY + 'px';

      // 边界检测：鱼饵沉到底部或超出范围就消失（不退出投喂模式，用户可继续放）
      if (baitY > tank.offsetHeight - 30 || baitY < -30) {
        if (currentBait) {
          if (currentBait.parentNode) currentBait.remove();
          currentBait = null;
        }
        if (baitCheckInterval) {
          clearInterval(baitCheckInterval);
          baitCheckInterval = null;
        }
        return;
      }

      // 碰撞检测：鱼饵和每条鱼
      for (const fish of fishes) {
        const fishEl = document.getElementById(fish.id);
        if (!fishEl || !fishEl.parentNode) continue;

        const fishRect = fishEl.getBoundingClientRect();
        const baitRect = currentBait.getBoundingClientRect();

        // 检测重叠
        if (!(fishRect.right < baitRect.left ||
              fishRect.left > baitRect.right ||
              fishRect.bottom < baitRect.top ||
              fishRect.top > baitRect.bottom)) {
          // 碰撞了！
          clearInterval(baitCheckInterval);
          baitCheckInterval = null;

          // 鱼饵消失动画
          currentBait.classList.add('bait-eaten');
          setTimeout(() => {
            if (currentBait && currentBait.parentNode) currentBait.remove();
            currentBait = null;
          }, 300);

          // 鱼变大动画
          fishEl.classList.add('fish-eating');
          fish.feedCount++;
          const scale = 1 + fish.feedCount * 0.15;
          fishEl.style.transform = `scale(${scale})`;
          setTimeout(() => {
            fishEl.classList.remove('fish-eating');
          }, 400);

          // 更新统计
          stats.successfulFeeds++;
          saveGameDataToDB();
          saveGameDataToDB();
          checkAchievements();

          // 有概率触发在线事件
          if (Math.random() < 0.15) triggerOnlineEvent('feeding');

          // 退出投喂模式
          setTimeout(() => exitFeedingMode(), 350);
          return;
        }
      }
    }, 16); // ~60fps
  }

  // 喂鱼
  function feedFish() {
    stats.feedFishClicks++; // 记录点击喂鱼按钮
    checkAchievements(); // 检查成就

    // 如果已经在投喂模式，退出
    if (isFeedingMode) {
      exitFeedingMode();
      return;
    }

    if (!canFeedFish()) {
      saveGameDataToDB();
      saveGameDataToDB();
      return;
    }

    lastFeedFishTime = Date.now();
    updateFeedFishButton();

    // 进入投喂模式
    isFeedingMode = true;
    document.getElementById('feedingHint').style.display = 'block';
    document.getElementById('fishTank').style.cursor = 'crosshair';

    // 添加点击事件监听
    const tank = document.getElementById('tankWater');
    tank.addEventListener('click', handleTankClick);

    // 检查是否有特殊鱼饵（先显示提示，等用户放置后再检查）
    // 这里简化处理：先进入普通投喂模式
    saveGameDataToDB();
    saveGameDataToDB();
  }

  // 显示特殊鱼饵选择弹窗
  function showSpecialBaitPopup(baitEmoji, multiplier, tank, tankWidth, tankHeight, baitType) {
    if (fishes.length === 0) {
      alert('鱼缸里没有鱼，无法使用特殊鱼饵！');
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'specialBaitOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:1000;display:flex;align-items:center;justify-content:center;';

    // 根据鱼饵类型设置名称和颜色
    let baitName, multiplierText, titleColor, effectText;
    if (baitType === 'legend') {
      baitName = '传说鱼饵';
      multiplierText = '10倍';
      titleColor = '#FFD700';
      effectText = '变大10倍';
    } else if (baitType === 'magic') {
      baitName = '神奇鱼饵';
      multiplierText = '2倍';
      titleColor = '#7DCFFF';
      effectText = '变大2倍';
    } else if (baitType === 'shrink') {
      baitName = '缩小鱼饵';
      multiplierText = '1/2';
      titleColor = '#B19CD9';
      effectText = '缩小到1/2';
    } else {
      baitName = '还原鱼饵';
      multiplierText = '1倍';
      titleColor = '#77DD77';
      effectText = '还原到1倍';
    }

    // 生成鱼的选项HTML
    let fishOptionsHTML = '';
    fishes.forEach((f, index) => {
      const currentScale = 1 + f.feedCount * 0.15;
      const newScale = baitType === 'restore' ? 1 : currentScale * multiplier;
      const arrow = baitType === 'restore' ? '→ 1.0x' : `→ ${newScale.toFixed(1)}x`;
      fishOptionsHTML += `<div class="special-bait-fish-item" onclick="applySpecialBait(${index}, ${multiplier}, '${baitEmoji}', '${baitType}')" style="padding:10px;margin:8px 0;background:rgba(255,255,255,0.1);border-radius:10px;cursor:pointer;text-align:center;">
        <div style="font-size:32px;margin-bottom:5px;">${f.type}</div>
        <div style="font-size:12px;opacity:0.8;">当前: ${currentScale.toFixed(1)}x ${arrow}</div>
      </div>`;
    });

    overlay.innerHTML = `
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:30px;border-radius:20px;color:#fff;width:320px;max-height:450px;overflow-y:auto;text-align:center;">
        <div style="font-size:48px;margin-bottom:15px;">${baitEmoji}</div>
        <div style="font-size:20px;font-weight:bold;margin-bottom:10px;color:${titleColor};">${baitName}</div>
        <div style="font-size:14px;opacity:0.8;margin-bottom:20px;">选择一条鱼使其<strong>${effectText}</strong></div>
        <div style="max-height:300px;overflow-y:auto;">
          ${fishOptionsHTML}
        </div>
        <button onclick="document.getElementById('specialBaitOverlay').remove()" style="margin-top:15px;width:100%;padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">取消</button>
      </div>
    `;

    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
  }

  // 应用特殊鱼饵效果
  function applySpecialBait(fishIndex, multiplier, baitEmoji, baitType) {
    if (fishIndex < 0 || fishIndex >= fishes.length) return;

    const targetFish = fishes[fishIndex];
    const fishEl = document.getElementById(targetFish.id);

    if (fishEl) {
      let newScale;
      let toastBg, toastMsg;

      if (baitType === 'restore') {
        // 还原鱼饵：恢复到1倍
        newScale = 1;
        targetFish.feedCount = 0;
        toastBg = 'linear-gradient(135deg,#77DD77 0%,#28a745 100%)';
        toastMsg = '鱼儿还原到 <strong>1倍</strong>！';
      } else {
        // 其他鱼饵：乘以倍率
        const currentScale = 1 + targetFish.feedCount * 0.15;
        newScale = currentScale * multiplier;
        targetFish.feedCount = Math.round((newScale - 1) / 0.15);

        if (baitType === 'legend') {
          toastBg = 'linear-gradient(135deg,#FFD700 0%,#FFA500 100%)';
          toastMsg = `鱼儿变大 <strong>10倍</strong>！`;
        } else if (baitType === 'magic') {
          toastBg = 'linear-gradient(135deg,#7DCFFF 0%,#007AFF 100%)';
          toastMsg = `鱼儿变大 <strong>2倍</strong>！`;
        } else {
          toastBg = 'linear-gradient(135deg,#B19CD9 0%,#9370DB 100%)';
          toastMsg = `鱼儿缩小到 <strong>1/2</strong>！`;
        }
      }

      // 应用变换效果
      fishEl.style.transform = `scale(${newScale})`;

      // 显示成功提示
      const toast = document.createElement('div');
      toast.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:${toastBg};color:#fff;padding:20px 30px;border-radius:15px;font-size:16px;z-index:9999;text-align:center;box-shadow:0 0 30px rgba(0,0,0,0.3);`;
      toast.innerHTML = `${baitEmoji} ${toastMsg}<br><span style="font-size:24px;margin-top:10px;display:block;">${targetFish.type}</span>`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }

    // 关闭弹窗
    const overlay = document.getElementById('specialBaitOverlay');
    if (overlay) overlay.remove();

    // 记录特殊鱼饵使用次数
    if (baitType === 'legend') stats.legendBaitUsed++;
    else if (baitType === 'magic') stats.magicBaitUsed++;
    else if (baitType === 'shrink') stats.shrinkBaitUsed++;
    else if (baitType === 'restore') stats.restoreBaitUsed++;

    saveGameDataToDB();
    saveGameDataToDB();
    stats.successfulFeeds++;
    checkAchievements();
  }

  // 清理鱼缸
  function cleanTank() {
    // 分离收藏和非收藏的鱼
    const collectedFish = fishes.filter(f => f.collected);
    const normalFish = fishes.filter(f => !f.collected);

    if (normalFish.length === 0) {
      if (collectedFish.length > 0) {
        alert('已跳过 ' + collectedFish.length + ' 条收藏鱼，没有可清理的鱼！');
      } else {
        alert('鱼缸里没有鱼！');
      }
      return;
    }

    if (!confirm('确定要清理鱼缸吗?收藏的鱼会被保留，其余鱼、鱼饵和水草都会被清除!')) {
      return;
    }

    stats.cleanCount++; // 记录清理次数
    const tank = document.getElementById('tankWater');

    // 清理所有非收藏的鱼
    normalFish.forEach(fish => {
      const fishEl = document.getElementById(fish.id);
      if (fishEl) {
        fishEl.style.opacity = '0';
        setTimeout(() => {
          if (fishEl.parentNode) {
            fishEl.parentNode.removeChild(fishEl);
          }
        }, 300);
      }
    });

    // 清理所有收藏鱼在鱼缸中的元素（但保留数据）
    collectedFish.forEach(fish => {
      const fishEl = document.getElementById(fish.id);
      if (fishEl) {
        fishEl.style.opacity = '0';
        setTimeout(() => {
          if (fishEl.parentNode) {
            fishEl.parentNode.removeChild(fishEl);
          }
        }, 300);
      }
    });
    // 重置fishes数组，重新只放入收藏的鱼
    fishes = [];
    collectedFish.forEach(f => {
      fishes.push(f);
    });

    // 重新渲染收藏的鱼
    collectedFish.forEach(f => {
      const fishEl = document.createElement('div');
      fishEl.className = 'fish';
      const isSpecialFish = f.isSpecial || (f.type && f.type.startsWith('assets/'));
      if (isSpecialFish) {
        fishEl.style.width = '50px';
        fishEl.style.height = '50px';
        const img = document.createElement('img');
        img.src = f.type;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.pointerEvents = 'none';
        fishEl.appendChild(img);
      } else {
        fishEl.textContent = f.type;
      }
      fishEl.style.left = f.x + 'px';
      fishEl.style.top = f.y + 'px';
      fishEl.style.cursor = 'pointer';
      fishEl.style.opacity = '0';
      const oldId = f.id;
      fishEl.id = 'fish-' + fishIdCounter++;
      f.id = fishEl.id;
      fishEl.onclick = () => petFish(fishEl.id);
      tank.appendChild(fishEl);
      setupCollectionLongPress(fishEl, fishEl.id);
      setTimeout(() => {
        fishEl.style.opacity = '1';
      }, 50);
    });

    // 清理所有鱼饵
    const foods = tank.querySelectorAll('[id^="food-"]');
    foods.forEach(food => {
      if (food.parentNode) {
        food.parentNode.removeChild(food);
      }
    });

    // 清理所有水草
    plants.forEach(plant => {
      const plantEl = document.getElementById(plant.id);
      if (plantEl && plantEl.parentNode) {
        plantEl.parentNode.removeChild(plantEl);
      }
    });
    plants = [];

    // 重置冷却时间
    lastAddFishTime = 0;
    lastFeedFishTime = 0;
    nextPlantGenerateTime = 0;

    updateFishCount();
    updateAddFishButton();
    updateFeedFishButton();
    saveGameDataToDB();
    saveGameDataToDB();

    if (collectedFish.length > 0) {
      alert('已保留 ' + collectedFish.length + ' 条收藏鱼！');
    }
  }

  // 更新鱼的数量
  function updateFishCount() {
    document.getElementById('fishCount').textContent = fishes.length;
  }
