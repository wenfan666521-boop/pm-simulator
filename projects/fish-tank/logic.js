// 拆分自 logic.js - 核心初始化 + UI管理 + 鱼缸切换

  // 初始化
  async function init() {
    try {
      await initDB();
      
      // 加载所有鱼缸
      tanks = await loadAllTanks();
      
      // 选中上次鱼缸（从 IndexedDB 的 gameData 中恢复）
      if (tanks.length === 0) {
        // 没有鱼缸，创建默认鱼缸
        const now = Date.now();
        const defaultTank = {
          id: 'default',
          name: '我的鱼缸',
          fishes: [],
          plants: [],
          lastAddFishTime: 0,
          lastFeedFishTime: 0,
          nextPlantGenerateTime: now + Math.random() * 20 * 1000,
          createdAt: now,
          lastFishId: 0  // ✅ 新鱼缸ID计数器从0开始
        };
        await saveTankData('default', defaultTank);
        tanks = [defaultTank];
      } else {
        // 使用第一个鱼缸
        currentTankId = tanks[0].id;
      }
      
      // 加载当前鱼缸数据
      const currentTankData = await loadTankData(currentTankId);
      if (currentTankData) {
        currentTankName = currentTankData.name;
        currentTankCreatedAt = currentTankData.createdAt;
        fishes = currentTankData.fishes || [];
        plants = []; // 水草不存档，动态生成
        lastAddFishTime = currentTankData.lastAddFishTime || 0;
        lastFeedFishTime = currentTankData.lastFeedFishTime || 0;
        nextPlantGenerateTime = currentTankData.nextPlantGenerateTime || Date.now();
        // ✅ 恢复该鱼缸的鱼ID计数器
        fishIdCounter = currentTankData.lastFishId || 0;
        // 如果有鱼但没存lastFishId，从现有鱼的ID里推算
        if (fishes.length > 0 && fishIdCounter === 0) {
          const maxId = Math.max(...fishes.map(f => {
            const match = String(f.id).match(/fish-(\d+)/);
            return match ? parseInt(match[1]) + 1 : 0;
          }));
          fishIdCounter = Math.max(fishIdCounter, maxId);
        }
        // 重新渲染鱼和植物
        renderFishesAndPlants();
      }
      
      // 加载全局游戏数据（成就、统计等）
      const dbData = await loadGameDataFromDB();
      if (dbData) {
        applyGameData(dbData, false); // 不覆盖鱼和植物数据
      }
      
      // 加载当前鱼缸背景
      const bgUrl = await loadBackgroundFromDB();
      if (bgUrl) setTankBackground(bgUrl, false);
      
      // 更新标题显示
      updateTankTitle();
    } catch (err) {
      console.error('IndexedDB 初始化失败:', err);
    }

    setInterval(generateBubble, 2000);
    setInterval(updateFishPositions, 100);
    setInterval(updateAddFishButton, 1000);
    setInterval(updateFeedFishButton, 1000);
    setInterval(schedulePlantGenerate, 1000);
    updateAddFishButton();
    updateFeedFishButton();
    schedulePlantGenerate();
    resetDailyEventLimits();
    initBackgroundMusic();
    
    // 如果之前开启过重力感应，自动初始化
    if (gravityEnabled) {
      initGravitySensor();
    }

    const toggleBtn = document.getElementById('toggleBtn');
    if (toggleBtn) {
      toggleBtn.textContent = isInIframe ? '🖥️ 全屏' : '🌟小星';
    }
    
    // 初始化滑动切换鱼缸手势
    initSwipeGesture();

    // 启动离线奖励检查（延迟 800ms，避免初始化项太拥挤）
    console.log('[init] 计划 800ms 后执行 checkOfflineReward');
    setTimeout(checkOfflineReward, 800);
    // 访问时间戳心跳：每 5 分钟写一次，防崩溃
    // 延后到 checkOfflineReward 之后启动，避免覆盖掉用户设置的离线时间
    console.log('[init] 计划 1500ms 后执行 startOfflineHeartbeat');
    setTimeout(() => {
      console.log('[init] 开始执行 startOfflineHeartbeat');
      startOfflineHeartbeat();
    }, 1500);
    // 页面重新可见时检查离线奖励
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('[可见性] 页面重新可见，触发离线奖励检查');
        checkOfflineReward();
      }
    });
  }
  
  // 滑动切换鱼缸手势

  function initBackgroundMusic() {
    bgAudio = new Audio('minimax-output/aquarium-piano-slow.mp3');
    bgAudio.loop = true;
    bgAudio.volume = 0.3;
    if (bgMusicEnabled) { bgAudio.muted = false; bgAudio.play().catch(() => {}); } else { bgAudio.muted = true; }
  }

  function toggleBackgroundMusic() {
    bgMusicEnabled = !bgMusicEnabled;
    if (bgAudio) { bgMusicEnabled ? bgAudio.play().catch(() => {}) : bgAudio.pause(); }
    showMenu();
  }

  // 全屏切换函数
  function toggleFullscreen() {
    if (isInIframe) {
      // 在iframe中,打开新窗口(全屏版本)
      window.open('fish-tank.html', '_blank');
    } else {
      // 在新窗口中,显示欢迎弹窗
      alert('欢迎回小星工具箱首页看看:https://aowuaowu2026.xyz/');
    }
  }

  // 滑动切换鱼缸手势
  function initSwipeGesture() {
    const tankArea = document.querySelector('.app-container');
    let startX = 0;
    let startY = 0;
    const SWIPE_THRESHOLD = 80; // 滑动触发阈值
    
    tankArea.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    
    tankArea.addEventListener('touchend', async (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      
      // 只处理水平滑动，且垂直滑动距离不超过水平的一半
      if (Math.abs(deltaX) > Math.abs(deltaY) * 2 && Math.abs(deltaX) > SWIPE_THRESHOLD) {
        const currentIndex = tanks.findIndex(t => t.id === currentTankId);
        if (currentIndex === -1) return;
        
        let targetIndex;
        if (deltaX > 0) {
          // 向右滑 → 上一个鱼缸
          targetIndex = currentIndex - 1;
          if (targetIndex < 0) targetIndex = tanks.length - 1;
        } else {
          // 向左滑 → 下一个鱼缸
          targetIndex = currentIndex + 1;
          if (targetIndex >= tanks.length) targetIndex = 0;
        }
        
        if (tanks[targetIndex]) {
          await switchTank(tanks[targetIndex].id);
        }
      }
    }, { passive: true });
  }

  // 渲染所有鱼和植物
  function renderFishesAndPlants() {
    const tank = document.getElementById('tankWater');
    // 清空现有鱼和植物（保留计数器和提示元素）
    const fishEls = tank.querySelectorAll('.fish');
    const plantEls = tank.querySelectorAll('.plant');
    fishEls.forEach(el => el.remove());
    plantEls.forEach(el => el.remove());
    
    // 更新鱼数量显示
    updateFishCount();
    
    // 渲染鱼
    fishes.forEach(fish => {
      const fishEl = document.createElement('div');
      fishEl.className = 'fish';
      fishEl.id = fish.id;
      fishEl.onclick = () => petFish(fish.id);
      fishEl.style.cursor = 'pointer';
      
      const isSpecialFish = fish.isSpecial || (fish.type && fish.type.startsWith('assets/'));
      if (isSpecialFish) {
        fishEl.style.cssText = `position:absolute;left:${fish.x}px;top:${fish.y}px;width:50px;height:50px;cursor:pointer;z-index:10;`;
        const img = document.createElement('img');
        img.src = fish.type;
        img.style.cssText = 'width:100%;height:100%;pointer-events:none;';
        fishEl.appendChild(img);
      } else {
        fishEl.textContent = fish.type;
        fishEl.style.cssText = `position:absolute;left:${fish.x}px;top:${fish.y}px;font-size:24px;cursor:pointer;z-index:10;`;
      }
      
      // 应用喂鱼后的大小变换
      const feedCount = fish.feedCount || 0;
      fishEl.style.transform = `scale(${1 + feedCount * 0.15})`;
      
      // 应用礼物鱼的特殊属性
      if (fish.sender) {
        fishEl.dataset.sender = fish.sender;
        fishEl.dataset.blessing = fish.blessing;
        fishEl.dataset.name = fish.name || '';
        fishEl.dataset.description = fish.description || '';
      }
      
      tank.appendChild(fishEl);
      setupCollectionLongPress(fishEl, fish.id);
    });
    
    // 渲染植物
    plants.forEach(plant => {
      const plantEl = document.createElement('div');
      plantEl.className = 'plant';
      plantEl.textContent = plant.type;
      plantEl.style.left = plant.x + 'px';
      plantEl.style.bottom = '10px';
      plantEl.style.fontSize = '24px';
      plantEl.style.position = 'absolute';
      plantEl.style.cursor = 'pointer';
      plantEl.style.transition = 'transform 0.2s';
      plantEl.id = plant.id;
      plantEl.onclick = () => collectPlant(plant.id);
      tank.appendChild(plantEl);
    });
  }

  // 更新鱼缸标题
  function updateTankTitle() {
    const titleEl = document.getElementById('tankTitle');
    if (titleEl) {
      titleEl.innerHTML = `🐠 ${currentTankName} <span onclick="event.stopPropagation();showTankSelector()" id="tankCountBadge" style="font-size:12px;opacity:0.7;margin-left:8px;cursor:pointer;padding:4px 8px;background:rgba(255,255,255,0.1);border-radius:12px;">切换鱼缸</span> <span id="devHint" style="font-size:12px;opacity:0;"></span>`;
    }
  }

  // 显示鱼缸选择器
  function showTankSelector() {
    // 先刷新鱼缸列表
    loadAllTanks().then(allTanks => {
      tanks = allTanks;
      updateTankTitle();
      
      const overlay = document.createElement('div');
      overlay.id = 'tankSelectorOverlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
      overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
      
      const panel = document.createElement('div');
      panel.style.cssText = 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:30px;border-radius:20px;color:#fff;width:350px;max-height:80vh;overflow-y:auto;';
      
      let tankListHTML = '<div style="font-size:20px;font-weight:bold;margin-bottom:20px;text-align:center;">🐠 鱼缸列表</div>';
      tankListHTML += '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">';
      
      tanks.forEach(tank => {
        const isCurrent = tank.id === currentTankId;
        const fishCount = tank.fishes?.length || 0;
        const createdAt = new Date(tank.createdAt).toLocaleDateString();
        tankListHTML += `
          <div style="padding:15px;border-radius:12px;background:${isCurrent ? 'rgba(102,126,234,0.3)' : 'rgba(255,255,255,0.1)'};margin-bottom:10px;border:${isCurrent ? '2px solid #667eea' : '2px solid transparent'};">
            <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="switchTank('${tank.id}')">
              <span style="font-weight:bold;font-size:16px;">${isCurrent ? '📍 ' : ''}${tank.name}</span>
              <span style="font-size:12px;opacity:0.7;">🐟 ${fishCount} 条鱼</span>
            </div>
            <div style="font-size:11px;opacity:0.5;margin-top:5px;margin-bottom:10px;">创建于 ${createdAt}</div>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
              <button onclick="event.stopPropagation();showRenameTankPanel('${tank.id}')" style="padding:6px 12px;border:none;border-radius:8px;background:rgba(255,255,255,0.15);color:#fff;cursor:pointer;font-size:12px;">✏️ 重命名</button>
              ${tanks.length > 1 ? `<button onclick="event.stopPropagation();showDeleteTankConfirm('${tank.id}')" style="padding:6px 12px;border:none;border-radius:8px;background:rgba(255,107,107,0.3);color:#ff6b6b;cursor:pointer;font-size:12px;">🗑️ 删除</button>` : ''}
            </div>
          </div>
        `;
      });
      
      tankListHTML += '</div>';
      
      panel.innerHTML = tankListHTML + `
        <div style="display:flex;gap:10px;">
          <button onclick="showCreateTankPanel()" style="flex:1;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;cursor:pointer;font-size:14px;">➕ 新建鱼缸</button>
          <button onclick="document.getElementById('tankSelectorOverlay').remove()" style="flex:1;padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">关闭</button>
        </div>
      `;
      
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
    });
  }

  // 显示重命名鱼缸弹窗
  function showRenameTankPanel(tankId) {
    const tank = tanks.find(t => t.id === tankId);
    if (!tank) return;
    
    document.getElementById('tankSelectorOverlay')?.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'renameTankOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1001;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    
    const panel = document.createElement('div');
    panel.style.cssText = 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:30px;border-radius:20px;color:#fff;width:350px;';
    
    panel.innerHTML = `
      <div style="font-size:20px;font-weight:bold;margin-bottom:20px;text-align:center;">✏️ 重命名鱼缸</div>
      <div style="font-size:14px;opacity:0.7;margin-bottom:15px;text-align:center;">当前名称：${tank.name}</div>
      <input type="text" id="renameTankName" placeholder="请输入新的鱼缸名称" value="${tank.name}" style="width:100%;padding:15px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;margin-bottom:20px;font-size:14px;" />
      <div style="display:flex;gap:10px;">
        <button onclick="renameTank('${tankId}')" style="flex:1;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;cursor:pointer;font-size:14px;">确认</button>
        <button onclick="document.getElementById('renameTankOverlay').remove();showTankSelector();" style="flex:1;padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">取消</button>
      </div>
    `;
    
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    document.getElementById('renameTankName').focus();
    document.getElementById('renameTankName').select();
  }

  // 显示删除鱼缸确认弹窗
  function showDeleteTankConfirm(tankId) {
    if (tanks.length <= 1) {
      showToast('至少需要保留一个鱼缸！');
      return;
    }
    
    const tank = tanks.find(t => t.id === tankId);
    if (!tank) return;
    
    document.getElementById('tankSelectorOverlay')?.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'deleteTankOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1001;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    
    const panel = document.createElement('div');
    panel.style.cssText = 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:30px;border-radius:20px;color:#fff;width:350px;';
    
    panel.innerHTML = `
      <div style="font-size:20px;font-weight:bold;margin-bottom:20px;text-align:center;">🗑️ 确认删除</div>
      <div style="font-size:14px;text-align:center;margin-bottom:20px;line-height:1.6;">
        确定要删除鱼缸「<span style="color:#667eea;font-weight:bold;">${tank.name}</span>」吗？<br>
        <span style="color:#ff6b6b;opacity:0.8;">该鱼缸中的 ${tank.fishes?.length || 0} 条鱼将永久丢失！</span>
      </div>
      <div style="display:flex;gap:10px;">
        <button onclick="executeDeleteTank('${tankId}')" style="flex:1;padding:12px;border:none;border-radius:10px;background:#ff6b6b;color:#fff;cursor:pointer;font-size:14px;">确认删除</button>
        <button onclick="document.getElementById('deleteTankOverlay').remove();showTankSelector();" style="flex:1;padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">取消</button>
      </div>
    `;
    
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  // 显示新建鱼缸弹窗
  function showCreateTankPanel() {
    document.getElementById('tankSelectorOverlay')?.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'createTankOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1001;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    
    const panel = document.createElement('div');
    panel.style.cssText = 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:30px;border-radius:20px;color:#fff;width:350px;';
    
    panel.innerHTML = `
      <div style="font-size:20px;font-weight:bold;margin-bottom:20px;text-align:center;">🐠 新建鱼缸</div>
      <input type="text" id="newTankName" placeholder="请输入鱼缸名称" value="鱼缸 ${tanks.length + 1}" style="width:100%;padding:15px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;margin-bottom:20px;font-size:14px;" />
      <div style="display:flex;gap:10px;">
        <button onclick="createNewTank()" style="flex:1;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;cursor:pointer;font-size:14px;">创建</button>
        <button onclick="document.getElementById('createTankOverlay').remove();showTankSelector();" style="flex:1;padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">取消</button>
      </div>
    `;
    
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    document.getElementById('newTankName').focus();
    document.getElementById('newTankName').select();
  }

  // 切换鱼缸
  async function switchTank(tankId, isNewTank = false) {
    if (tankId === currentTankId) return;
    await saveGameDataToDB();
    const tankData = await loadTankData(tankId);
    if (tankData) {
      currentTankId = tankId;
      currentTankName = tankData.name;
      currentTankCreatedAt = tankData.createdAt;
      fishes = tankData.fishes || [];
      plants = [];
      lastAddFishTime = tankData.lastAddFishTime || 0;
      lastFeedFishTime = tankData.lastFeedFishTime || 0;
      nextPlantGenerateTime = tankData.nextPlantGenerateTime || Date.now();
      fishIdCounter = tankData.lastFishId || 0;
      if (fishes.length > 0 && fishIdCounter === 0) {
        const maxId = Math.max(...fishes.map(f => {
          const match = String(f.id).match(/fish-(\d+)/);
          return match ? parseInt(match[1]) + 1 : 0;
        }));
        fishIdCounter = Math.max(fishIdCounter, maxId);
      }
      renderFishesAndPlants();
      updateTankTitle();
      updateAddFishButton();
      updateFeedFishButton();
      if (isNewTank) {
        resetTankBackground(false);
      } else {
        const bgUrl = await loadBackgroundFromDB();
        setTankBackground(bgUrl, false);
      }
    }
    document.getElementById('tankSelectorOverlay')?.remove();
  }

  // 重命名鱼缸
  async function renameTank(tankId) {
    const newName = document.getElementById('renameTankName').value.trim();
    if (!newName) return;
    const tank = tanks.find(t => t.id === tankId);
    if (!tank) return;
    tank.name = newName;
    await saveTankData(tankId, tank);
    if (tankId === currentTankId) {
      currentTankName = newName;
      updateTankTitle();
    }
    tanks = await loadAllTanks();
    showTankSelector();
  }

  // 执行删除鱼缸
  async function executeDeleteTank(tankId) {
    document.getElementById('deleteTankOverlay')?.remove();
    await deleteTank(tankId);
    if (tankId === currentTankId) {
      const remainingTanks = tanks.filter(t => t.id !== tankId);
      if (remainingTanks.length > 0) {
        await switchTank(remainingTanks[0].id);
      }
    }
    tanks = await loadAllTanks();
    updateTankTitle();
    showTankSelector();
  }

  // 创建新鱼缸
  async function createNewTank() {
    const tankName = document.getElementById('newTankName').value.trim();
    if (!tankName) return;
    document.getElementById('createTankOverlay')?.remove();
    const now = Date.now();
    const tankId = 'tank_' + now;
    const newTank = {
      id: tankId,
      name: tankName,
      fishes: [],
      plants: [],
      lastAddFishTime: 0,
      lastFeedFishTime: 0,
      nextPlantGenerateTime: now + Math.random() * 20 * 1000,
      createdAt: now,
      lastFishId: 0
    };
    await saveTankData(tankId, newTank);
    await switchTank(tankId, true);
    tanks = await loadAllTanks();
    updateTankTitle();
  }

  // 显示背景设置面板
  function showBackgroundPanel() {
    const existing = document.getElementById('backgroundPanelOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'backgroundPanelOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const panel = document.createElement('div');
    panel.style.cssText = 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:30px;border-radius:20px;color:#fff;width:320px;text-align:center;';
    panel.innerHTML = `
      <div style="font-size:24px;margin-bottom:20px;">🖼️ 鱼缸背景</div>
      <input type="file" id="bgFileInput" accept="image/*" style="display:none;" onchange="handleBackgroundUpload(this.files[0])">
      <button onclick="document.getElementById('bgFileInput').click()" style="width:100%;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;cursor:pointer;font-size:14px;margin-bottom:10px;">📤 上传背景图片</button>
      <button onclick="resetTankBackground()" style="width:100%;padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;margin-bottom:10px;">🔄 恢复默认背景</button>
      <button onclick="document.getElementById('backgroundPanelOverlay').remove()" style="width:100%;padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">关闭</button>
    `;

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  // 处理背景图片上传
  function handleBackgroundUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setTankBackground(e.target.result, true);
      document.getElementById('backgroundPanelOverlay')?.remove();
    };
    reader.readAsDataURL(file);
  }

  // 设置鱼缸背景 (url: 图片URL, saveToDB: 是否保存到数据库)
  function setTankBackground(url, saveToDB = false) {
    const tank = document.getElementById('fishTank');
    if (url) {
      tank.style.backgroundImage = `url('${url}')`;
      tank.style.backgroundSize = 'cover';
      tank.style.backgroundPosition = 'center center';
      tank.style.backgroundRepeat = 'no-repeat';
      tank.classList.add('has-background');
      if (saveToDB && url.startsWith('data:')) saveBackgroundToDB(url).catch(err => console.error('saveBackgroundToDB 失败:', err));
    } else {
      // 重置为默认背景
      tank.style.backgroundImage = '';
      tank.classList.remove('has-background');
    }
  }

  // 重置鱼缸背景为默认
  function resetTankBackground(showMessage = true) {
    setTankBackground(null, false); // 不保存到DB，保存操作下面单独处理
    // 从数据库删除当前鱼缸的背景
    if (db) {
      const transaction = db.transaction(['tankBackgrounds'], 'readwrite');
      transaction.objectStore('tankBackgrounds').delete(currentTankId);
    }
    document.getElementById('backgroundPanelOverlay')?.remove();
    if (showMessage) {
      showToast('🔄 已恢复默认背景');
    }
  }

  // 显示菜单
  function showMenu() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:30px;border-radius:20px;color:#fff;width:280px;box-shadow:0 15px 50px rgba(0,0,0,0.5);">' +
      '<div style="text-align:center;font-size:18px;font-weight:bold;margin-bottom:20px;">☰ 菜单</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<button onclick="showAchievements();this.parentNode.parentNode.parentNode.remove();" style="padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">🏆 成就列表</button>' +
      '<button onclick="showOfflineEventLog();this.parentNode.parentNode.parentNode.remove();" style="padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;position:relative;">📜 事件日志 <span id="offlineUnreadBadge" style="display:none;background:red;border-radius:10px;padding:2px 6px;font-size:11px;vertical-align:middle;"></span></button>' +
      '<button onclick="showCollectionList();this.parentNode.parentNode.parentNode.remove();" style="padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">📋 收藏列表</button>' +
      '<button onclick="cleanTank();this.parentNode.parentNode.parentNode.remove();" style="padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">🧹 清理鱼缸</button>' +
      '<button onclick="showSavePanel();this.parentNode.parentNode.parentNode.remove();" style="padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">📦 存档管理</button>' +
      '<button onclick="showSettingsPanel();this.parentNode.parentNode.parentNode.remove();" style="padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">⚙️ 设置</button>' +
      '</div>' +
      '<button onclick="this.parentNode.parentNode.remove()" style="margin-top:20px;width:100%;padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">关闭</button>' +
      '</div>';

    document.body.appendChild(overlay);
  }

  // 显示设置面板
  function showSettingsPanel() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1001;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:30px;border-radius:20px;color:#fff;width:300px;box-shadow:0 15px 50px rgba(0,0,0,0.5);">' +
      '<div style="text-align:center;font-size:18px;font-weight:bold;margin-bottom:20px;">⚙️ 设置</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<button onclick="toggleFullscreen();this.parentNode.parentNode.parentNode.remove();" style="padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">🖥️ 全屏模式</button>' +
      '<button onclick="showTankSelector();this.parentNode.parentNode.parentNode.remove();" style="padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">🐠 鱼缸管理</button>' +
      '<button onclick="showBackgroundPanel();this.parentNode.parentNode.parentNode.remove();" style="padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">🖼️ 背景设置</button>' +
      '<button onclick="toggleBackgroundMusic();this.parentNode.parentNode.parentNode.remove();" style="padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">🎵 背景音乐 ' + (bgMusicEnabled ? 'ON' : 'OFF') + '</button>' +
      '<button onclick="toggleGravity();this.parentNode.parentNode.parentNode.remove();" style="padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">🧭 重力感应 ' + (gravityEnabled ? 'ON' : 'OFF') + '</button>' +
      '<div style="padding:12px;background:rgba(255,255,255,0.05);border-radius:10px;">' +
      '<div style="font-size:12px;margin-bottom:8px;">🎚️ 灵敏度: <span id="sensitivityValue">' + gravitySensitivity.toFixed(1) + '</span></div>' +
      '<input type="range" min="0.1" max="1.0" step="0.1" value="' + gravitySensitivity + '" oninput="setGravitySensitivity(this.value)" style="width:100%;height:6px;cursor:pointer;">' +
      '</div>' +
      '</div>' +
      '<button onclick="this.parentNode.parentNode.remove()" style="margin-top:20px;width:100%;padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">关闭</button>' +
      '</div>';

    document.body.appendChild(overlay);
  }

  // 显示收藏列表
  function showCollectionList() {
    const collectedFish = fishes.filter(f => f.collected);

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    let listHTML = '';
    if (collectedFish.length === 0) {
      listHTML = '<div style="text-align:center;padding:40px 20px;opacity:0.7;">还没有收藏的鱼哦～<br>悬停或长按一条鱼即可收藏！</div>';
    } else {
      collectedFish.forEach((f, index) => {
        const fishEl = document.getElementById(f.id);
        listHTML += `<div style="padding:15px;background:rgba(255,255,255,0.1);border-radius:10px;margin-bottom:10px;cursor:pointer;" onclick="focusOnFish('${f.id}');this.parentNode.parentNode.parentNode.remove();">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <span style="font-size:28px;">${f.type.startsWith('assets/') ? '<img src="' + f.type + '" style="width:32px;height:32px;vertical-align:middle;">' : f.type}</span>
            <span style="font-size:16px;font-weight:bold;">⭐ ${f.name || ('鱼 #' + f.id.split('-')[1])}</span>
          </div>
          ${f.description ? '<div style="font-size:12px;opacity:0.7;margin-left:38px;">' + f.description + '</div>' : ''}
          ${f.sender ? '<div style="font-size:10px;opacity:0.6;margin-left:38px;margin-top:4px;">来自: ' + f.sender + '</div>' : ''}
          ${f.blessing ? '<div style="font-size:11px;opacity:0.85;margin-left:38px;margin-top:3px;color:#F7DC6F;font-style:italic;">💬 "' + f.blessing + '"</div>' : ''}
          <div style="font-size:10px;opacity:0.5;margin-left:38px;">收藏于 ${new Date(f.collectedAt).toLocaleDateString()}</div>
        </div>`;
      });
    }

    overlay.innerHTML = `
      <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:30px;border-radius:20px;color:#fff;width:320px;max-height:500px;overflow-y:auto;box-shadow:0 15px 50px rgba(0,0,0,0.5);">
        <div style="text-align:center;font-size:18px;font-weight:bold;margin-bottom:20px;">📋 收藏列表 (${collectedFish.length})</div>
        <div style="max-height:400px;overflow-y:auto;">
          ${listHTML}
        </div>
        <button onclick="this.parentNode.parentNode.remove()" style="margin-top:15px;width:100%;padding:12px;border:none;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:14px;">关闭</button>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  // 定位并聚焦到某条鱼
  function focusOnFish(fishId) {
    const fishEl = document.getElementById(fishId);
    if (!fishEl) return;
    // 鱼缸滚动到鱼的位置
    const tank = document.getElementById('fishTank');
    if (tank) {
      const fishRect = fishEl.getBoundingClientRect();
      const tankRect = tank.getBoundingClientRect();
      tank.scrollTop = fishRect.top - tankRect.top + tank.scrollTop - 100;
    }
    // 高亮闪烁效果
    fishEl.style.transition = 'transform 0.3s, filter 0.3s';
    fishEl.style.transform = 'scale(1.5)';
    fishEl.style.filter = 'drop-shadow(0 0 20px gold)';
    setTimeout(() => {
      fishEl.style.transform = '';
      fishEl.style.filter = '';
    }, 1500);
  }

  // 显示成就列表弹窗
  function showAchievements() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    // 计算普通成就
    const normalUnlocked = achievements.filter(id => ACHIEVEMENTS.some(a => a.id === id));
    const secretUnlocked = achievements.filter(id => SECRET_ACHIEVEMENTS.some(a => a.id === id));
    const unlockedCount = normalUnlocked.length + secretUnlocked.length;
    const totalCount = ACHIEVEMENTS.length + SECRET_ACHIEVEMENTS.length;

    let listHTML = '';

    // 普通成就列表
    ACHIEVEMENTS.forEach(a => {
      const isUnlocked = normalUnlocked.includes(a.id);
      if (isUnlocked) {
        listHTML += `<div style="padding:15px;background:rgba(255,255,255,0.15);border-radius:10px;margin-bottom:10px;">
          <div style="font-size:18px;margin-bottom:5px;">🏆 ${a.name}</div>
          <div style="font-size:12px;opacity:0.8;margin-bottom:5px;">${a.description}</div>
          <div style="font-size:11px;opacity:0.6;color:#aaa;">解锁条件: ${a.unlockHint}</div>
        </div>`;
      } else {
        listHTML += `<div style="padding:12px 15px;background:rgba(255,255,255,0.05);border-radius:10px;margin-bottom:8px;opacity:0.4;">
          <div style="font-size:16px;">🔒 ${a.name}</div>
        </div>`;
      }
    });

    // 隐藏成就列表(解锁后才显示,带金色边框和✨前缀)
    SECRET_ACHIEVEMENTS.forEach(a => {
      if (!achievements.includes(a.id)) return; // 未解锁的不显示
      listHTML += `<div style="padding:15px;background:rgba(255,215,0,0.1);border-radius:10px;margin-bottom:10px;border:1px solid rgba(255,215,0,0.4);">
        <div style="font-size:12px;opacity:0.6;color:#F7DC6F;margin-bottom:5px;">✨ 隐藏成就</div>
        <div style="font-size:18px;margin-bottom:5px;">✨ ${a.name}</div>
        <div style="font-size:12px;opacity:0.8;margin-bottom:5px;font-style:italic;">"${a.description}"</div>
      </div>`;
    });

    const popup = document.createElement('div');
    popup.style.cssText = 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:25px;border-radius:20px;color:#fff;width:340px;max-height:450px;overflow-y:auto;';
    popup.innerHTML = `
      <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:5px;">🏆 成就列表</div>
      <div style="text-align:center;font-size:14px;opacity:0.7;margin-bottom:20px;">(${unlockedCount}/${totalCount})</div>
      ${listHTML}
      <button onclick="this.parentNode.parentNode.remove()" style="width:100%;margin-top:15px;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;cursor:pointer;font-size:14px;">关闭</button>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  }

  // 初始化重力感应
  function initGravitySensor() {
    if (window.DeviceOrientationEvent) {
      // iOS 13+ 需要用户授权
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(response => {
            if (response === 'granted') {
              window.addEventListener('deviceorientation', handleDeviceOrientation);
            }
          })
          .catch(console.error);
      } else {
        // 其他系统直接监听
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
    }
  }

  // 处理设备倾斜
  function handleDeviceOrientation(event) {
    if (!gravityEnabled) return;
    
    // beta: 前后倾斜 (-180 ~ 180)
    // gamma: 左右倾斜 (-90 ~ 90)
    gravityY = event.beta || 0;
    gravityX = event.gamma || 0;
  }

  // 切换重力感应
  function toggleGravity() {
    gravityEnabled = !gravityEnabled;
    
    if (gravityEnabled) {
      initGravitySensor();
      // 重置重力值，避免突然抖动
      gravityX = 0;
      gravityY = 0;
    }
    
    showSettingsPanel();
    showToast(gravityEnabled ? '🧭 重力感应已开启' : '🧭 重力感应已关闭');
  }

  // 设置重力灵敏度
  function setGravitySensitivity(value) {
    gravitySensitivity = parseFloat(value);
    document.getElementById('sensitivityValue').textContent = gravitySensitivity.toFixed(1);
    showToast(`🧭 灵敏度已调整为 ${gravitySensitivity.toFixed(1)}`);
  }

  init();
