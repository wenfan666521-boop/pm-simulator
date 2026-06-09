/**
 * 小克鱼模块 - AI 自由对话
 * 接入百炼平台，克喵人设回复
 */

(function() {
  'use strict';

  /**
   * 发送消息给克喵 AI
   * @param {string} userMessage
   * @returns {Promise<string>} AI 回复文本
   */
  async function chat(userMessage) {
    const cfg = KLE_CONFIG.AI;

    const conversationHistory = [
      { role: 'system', content: KLE_CONFIG.AI_SYSTEM_PROMPT }
    ];

    // 简单对话历史，最多保留 6 条
    if (window._kleChatHistory) {
      conversationHistory.push(...window._kleChatHistory.slice(-6));
    }

    conversationHistory.push({ role: 'user', content: userMessage });

    try {
      const response = await Promise.race([
        fetch(cfg.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + cfg.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input: { prompt: userMessage },
            parameters: {}
          })
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), cfg.timeout))
      ]);

      if (!response.ok) {
        throw new Error('API 请求失败: ' + response.status);
      }

      const data = await response.json();
      const reply = data.output?.text || '……我现在有点困惑，说不上话来。';

      // 保存对话历史
      if (!window._kleChatHistory) window._kleChatHistory = [];
      window._kleChatHistory.push({ role: 'user', content: userMessage });
      window._kleChatHistory.push({ role: 'assistant', content: reply });

      return reply;
    } catch (error) {
      console.error('[kle-ai] AI 调用失败:', error);
      return '抱歉，我现在被某种力量困住了，没能听清你说的话……';
    }
  }

  /**
   * 清空对话历史
   */
  function clearHistory() {
    window._kleChatHistory = [];
  }

  // ========== 对外暴露 API ==========

  window.kleAI = {
    chat,
    clearHistory
  };

})();