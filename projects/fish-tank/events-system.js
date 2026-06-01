// 拆分自 logic.js - 在线/离线事件

  // 检查并重置每日事件计数
  function resetDailyEventLimits() {
    const today = new Date().toDateString();
    if (dailyEventDate !== today) {
      dailyOnlineEventCount = 0;
      dailyOfflineEventCount = 0;
      dailyEventDate = today;
    }
  }

  // ==================== 离线奖励系统 ====================

  // ==================== 在线事件系统 ====================
  // 触发在线事件（喂鱼/摸鱼时有概率触发）
  function triggerOnlineEvent(source) {
    resetDailyEventLimits();
    if (dailyOnlineEventCount >= 5) return; // 每日上限5次

    const candidates = EVENTS.filter(e =>
      e.trigger === 'online' && e.enabled &&
      (e.source ? e.source.includes(source) : false)
    );
    if (!candidates.length) return;
    dailyOnlineEventCount++;
    
    const totalWeight = candidates.reduce((s, e) => s + (e.weight || 1), 0);
    let rand = Math.random() * totalWeight;
    for (const event of candidates) {
      rand -= (event.weight || 1);
      if (rand <= 0) {
        const entry = { ...event, triggeredAt: new Date().toISOString(), read: false };
        offlineEventLog.unshift(entry);
        if (offlineEventLog.length > EVENT_LOG_MAX) offlineEventLog.pop();
        giftCount = Math.min(giftCount + entry.reward, 9999);
        offlineStats.totalRewards += entry.reward;
        // 更新菜单礼物显示
        const giftEl = document.getElementById('giftCount');
        if (giftEl) giftEl.textContent = giftCount;
        // 右上角浮动提示
        showEventToast(entry);
        // 异步保存
        saveGameDataToDB();
        saveGameDataToDB();
        return;
      }
    }
    // 保底：从候选中随机选一个（权重最高）
    if (candidates.length > 0) {
      const event = candidates[Math.floor(Math.random() * candidates.length)];
      const entry = { ...event, triggeredAt: new Date().toISOString(), read: false };
      offlineEventLog.unshift(entry);
      if (offlineEventLog.length > EVENT_LOG_MAX) offlineEventLog.pop();
      giftCount = Math.min(giftCount + entry.reward, 9999);
      offlineStats.totalRewards += entry.reward;
      const giftEl = document.getElementById('giftCount');
      if (giftEl) giftEl.textContent = giftCount;
      showEventToast(entry);
      saveGameDataToDB();
      saveGameDataToDB();
    }
  }

  // 在线事件浮动提示
  function showEventToast(event) {
    const existing = document.getElementById('eventToast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.id = 'eventToast';
    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:linear-gradient(135deg,rgba(26,26,46,0.95),rgba(22,33,62,0.95));border:1px solid #4a9eff;border-radius:12px;padding:12px 20px;color:#fff;font-size:14px;z-index:9999;box-shadow:0 4px 20px rgba(74,158,255,0.3);display:flex;align-items:center;gap:8px;opacity:1;transition:opacity 0.5s ease;';
    toast.innerHTML = '<span style="font-size:20px;">' + event.emoji + '</span><span> +' + event.reward + ' 🎁</span>';
    
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'margin-left:8px;opacity:0.5;cursor:pointer;font-size:12px;';
    closeBtn.onclick = () => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); };
    toast.appendChild(closeBtn);
    
    document.body.appendChild(toast);
    
    // 3秒后淡出
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 3000);
  }

  // 离线奖励主入口
  function checkOfflineReward() {
    const lastVisit = localStorage.getItem('lastVisitTime');
    console.log('[离线奖励检查] lastVisitTime:', lastVisit, '| 当前时间:', Date.now());
    if (!lastVisit) {
      console.log('[离线奖励] 无lastVisitTime，跳过');
      return;
    }
    const now = Date.now();
    const elapsed = now - parseInt(lastVisit);
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    console.log('[离线奖励] 离线分钟数:', minutes, '触发门槛:', OFFLINE_MIN_TRIGGER_MINUTES);
    if (minutes < OFFLINE_MIN_TRIGGER_MINUTES) {
      console.log('[离线奖励] 未达触发门槛，跳过');
      return;
    }
    const rule = REWARD_RULES.find(r => minutes >= r.minMinutes && minutes < r.maxMinutes);
    if (!rule) {
      console.log('[离线奖励] 无匹配规则，跳过');
      return;
    }
    console.log('[离线奖励] 触发！离线', hours, '小时，', minutes, '分钟，将抽奖', rule.draws, '次');
    const offlineStart = parseInt(localStorage.getItem("lastVisitTime")) || Date.now();
    const events = performOfflineDraws(hours, minutes, rule.draws, rule.giftCap, offlineStart);
    if (events.length > 0) {
      const totalGifts = events.reduce((sum, e) => sum + e.reward, 0);
      offlineStats.totalTriggered++;
      offlineStats.totalRewards += totalGifts;
      if (events.some(e => e.tier === 'legendary')) offlineStats.legendaryCount++;
      giftCount = Math.min(giftCount + totalGifts, 9999);
      showOfflineRewardModal(events, totalGifts, offlineStart);
    }
    // 检查完毕后立即更新 lastVisitTime，避免下次刷新重复触发
    saveLastVisitTime();
    saveGameDataToDB();
    saveGameDataToDB();
  }

  // 执行多次抽奖
  function performOfflineDraws(hours, minutes, draws, giftCap, offlineStartTime) {
    resetDailyEventLimits();
    const results = [];
    const now = Date.now();
    const offlineRange = now - offlineStartTime;
    for (let i = 0; i < draws; i++) {
      if (dailyOfflineEventCount >= 4) break; // 每日离线上限4次
      const tier = selectTier();
      const event = drawSingleEvent(tier, hours, minutes, offlineStartTime, offlineRange, now);
      if (event) {
        results.push(event);
        dailyOfflineEventCount++;
      }
      if (results.reduce((s, e) => s + e.reward, 0) >= giftCap) break;
    }
    return results;
  }

  // 按概率选等级
  function selectTier() {
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const [tier, prob] of Object.entries(EVENT_TIER_PROBABILITY)) {
      cumulative += prob;
      if (rand < cumulative) return tier;
    }
    return 'common';
  }

  // 从指定等级抽一个事件（按 weight 权重）
  function drawSingleEvent(tier, hours, minutes, offlineStartTime, offlineRange, now) {
    const candidates = EVENTS.filter(e => e.trigger !== "online" &&
      e.tier === tier && e.enabled && checkUnlockCondition(e.unlockCondition, hours, minutes)
    );
    if (!candidates.length) return null;
    const totalWeight = candidates.reduce((s, e) => s + (e.weight || 1), 0);
    let rand = Math.random() * totalWeight;
    for (const event of candidates) {
      rand -= (event.weight || 1);
      if (rand <= 0) {
        const desc = event.description
          .replace(/\{hours\}/g, String(hours))
          .replace(/\{minutes\}/g, String(minutes))
          .replace(/\{fishCount\}/g, String(fishes.length))
          .replace(/\{plantCount\}/g, String(plants.length));
        const randomOffset = Math.random() * offlineRange;
        const triggeredTime = new Date(offlineStartTime + randomOffset);
        const entry = { ...event, description: desc, triggeredAt: triggeredTime.toISOString(), read: false };
        offlineEventLog.unshift(entry);
        if (offlineEventLog.length > EVENT_LOG_MAX) offlineEventLog.pop();
        return entry;
      }
    }
    return candidates[candidates.length - 1];
  }

  // 检查解锁条件
  function checkUnlockCondition(cond, hours, minutes) {
    if (!cond) return true;
    const match = cond.match(/offline>=(\d+)h/);
    if (match) return hours >= parseInt(match[1]);
    return true;
  }

  // 离线奖励弹窗
  function showOfflineRewardModal(events, totalGifts, offlineStart) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;';
    const panel = document.createElement('div');
    panel.style.cssText = 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:2px solid #4a9eff;border-radius:20px;padding:30px;max-width:360px;width:90%;text-align:center;color:#fff;box-shadow:0 0 30px rgba(74,158,255,0.3);';
    const elapsed = Date.now() - offlineStart;
    const totalMinutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeStr = hours > 0 ? hours + ' 小时 ' + mins + ' 分钟' : mins + ' 分钟';
    panel.innerHTML = `
      <div style="font-size:20px;font-weight:bold;margin-bottom:20px;">⏰ 你离开了 ${timeStr}</div>
      <div style="max-height:300px;overflow-y:auto;text-align:left;margin-bottom:16px;padding-left:20px;position:relative;">
        <div style="position:absolute;left:7px;top:0;bottom:0;width:2px;background:linear-gradient(to bottom,#4a9eff,#1e6fdd);border-radius:1px;"></div>
        ${events.slice().sort((a, b) => new Date(a.triggeredAt) - new Date(b.triggeredAt)).map(e => {
          const t = new Date(e.triggeredAt);
          const timeStr = t.toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'});
          return `<div style="position:relative;padding-left:20px;margin-bottom:12px;">
            <div style="position:absolute;left:-7px;top:2px;width:12px;height:12px;background:#4a9eff;border-radius:50%;border:2px solid #1a1a2e;"></div>
            <div style="background:rgba(74,158,255,0.1);border-radius:10px;padding:10px 12px;border:1px solid rgba(74,158,255,0.3);">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:16px;">${e.emoji} ${e.name}</span>
                <span style="color:gold;font-size:12px;">+${e.reward} 🎁</span>
              </div>
              <div style="font-size:11px;opacity:0.5;margin-top:2px;">${timeStr}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div style="font-size:11px;opacity:0.5;margin-bottom:14px;">📜 去菜单「事件日志」查看详情</div>
      <button id="offlineRewardConfirmBtn" style="background:linear-gradient(135deg,#4a9eff,#1e6fdd);border:none;border-radius:25px;padding:12px 40px;font-size:16px;font-weight:bold;color:#fff;cursor:pointer;">${totalGifts > 0 ? '收下礼物 ✨' : '知道了'}</button>
    `;
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    document.getElementById('offlineRewardConfirmBtn').onclick = () => {
      document.body.removeChild(overlay);
      saveGameDataToDB();
      saveGameDataToDB();
    };
    overlay.onclick = (e) => { if (e.target === overlay) { document.body.removeChild(overlay); saveGameDataToDB();
      saveGameDataToDB(); } };
  }

  // 事件日志页面
  function showOfflineEventLog() {
    const existing = document.getElementById('eventLogOverlay');
    if (existing) { existing.remove(); return; }
    const overlay = document.createElement('div');
    overlay.id = 'eventLogOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
    const panel = document.createElement('div');
    panel.style.cssText = 'background:#1a1a2e;border:2px solid #4a9eff;border-radius:20px;padding:25px;max-width:400px;width:90%;max-height:80vh;display:flex;flex-direction:column;color:#fff;';
    const unreadCount = offlineEventLog.filter(e => !e.read).length;
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
        <div style="font-size:18px;font-weight:bold;">📜 事件日志${unreadCount ? ` <span style="background:red;border-radius:10px;padding:2px 8px;font-size:12px;">${unreadCount}</span>` : ''}</div>
        <div style="font-size:20px;cursor:pointer;color:#aaa;" onclick="document.body.removeChild(document.getElementById('eventLogOverlay'));">✕</div>
      </div>
      <div style="flex:1;overflow-y:auto;">
        ${offlineEventLog.length === 0 ? '<div style="text-align:center;opacity:0.5;padding:40px 0;">还没有记录</div>' :
          offlineEventLog.slice().sort((a, b) => new Date(a.triggeredAt) - new Date(b.triggeredAt)).map(e => `
            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:12px;margin-bottom:8px;${!e.read ? 'border-left:3px solid gold;' : ''}">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span style="font-size:16px;">${e.emoji} ${e.name}</span>
                <span style="font-size:12px;opacity:0.5;">${new Date(e.triggeredAt).toLocaleString('zh-CN')}</span>
              </div>
              <div style="font-size:13px;opacity:0.8;white-space:pre-line;">${e.description}</div>
              ${e.reward > 0 ? `<div style="color:gold;font-size:12px;margin-top:4px;">+${e.reward} 🎁</div>` : ''}
            </div>
          `).join('')}
      </div>
      <div style="margin-top:15px;padding-top:15px;border-top:1px solid rgba(255,255,255,0.1);font-size:12px;opacity:0.5;text-align:center;">
        共触发 ${offlineStats.totalTriggered} 次 | 累计获得 ${offlineStats.totalRewards} 🎁 | 传说事件 ${offlineStats.legendaryCount} 次
      </div>
    `;
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    overlay.onclick = (e) => { if (e.target === overlay) document.body.removeChild(overlay); };
    markEventsAsRead();
    renderOfflineUnreadBadge();
  }

  // 标记所有事件为已读
  function markEventsAsRead() {
    offlineEventLog.forEach(e => e.read = true);
    saveGameDataToDB();
    saveGameDataToDB();
  }

  // 渲染未读红点（菜单项）
  function renderOfflineUnreadBadge() {
    const badge = document.getElementById('offlineUnreadBadge');
    if (!badge) return;
    const unread = offlineEventLog.filter(e => !e.read).length;
    badge.style.display = unread > 0 ? 'inline-block' : 'none';
    badge.textContent = unread;
  }

  // 心跳：每5分钟更新一次 lastVisitTime
  function startOfflineHeartbeat() {
    setInterval(saveLastVisitTime, 5 * 60 * 1000);
  }

  // 保存访问时间戳
  function saveLastVisitTime() {
    localStorage.setItem('lastVisitTime', Date.now().toString());
    console.log('[心跳] lastVisitTime 已更新:', localStorage.getItem('lastVisitTime'), '| 时间:', new Date().toLocaleTimeString());
  }
