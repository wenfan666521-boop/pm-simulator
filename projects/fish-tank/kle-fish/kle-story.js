/**
 * 小克鱼模块 - 故事对话引擎
 * 加载 ink JSON 文件，驱动对话树状态
 */

(function() {
  'use strict';

  // 当前故事状态
  var _story = null;       // 加载的 JSON 数据
  var _currentNode = null; // 当前节点名
  var _day = 1;            // 当前第几天
  var _vars = {};          // ink 变量
  var _callStack = [];     // 函数调用栈（用于 return）
  var _pendingInput = null; // 等待玩家输入时的回调
  var _listeners = [];     // 事件监听器

  // ========== 事件系统 ==========

  function on(event, callback) {
    _listeners.push({ event, callback });
  }

  function emit(event, data) {
    _listeners.forEach(function(l) {
      if (l.event === event) l.callback(data);
    });
  }

  // ========== 加载故事 JSON ==========

  /**
   * 加载指定天数的 ink JSON
   * @param {number} day 1/2/3
   * @returns {Promise}
   */
  function loadDay(day) {
    return new Promise(function(resolve, reject) {
      var path;
      if (KLE_CONFIG.devMode) {
        path = 'kle-fish/kle-ink/day' + day + '.ink.json';
      } else {
        path = 'kle-fish/kle-ink/day' + day + '.ink.json';
      }
      fetch(path)
        .then(function(r) {
          if (!r.ok) throw new Error('加载失败: ' + path);
          return r.json();
        })
        .then(function(json) {
          _story = json;
          _day = day;
          _vars = {};
          _callStack = [];
          // ink JSON 根节点通常是 "start"
          _currentNode = 'start';
          resolve(json);
        })
        .catch(reject);
    });
  }

  // ========== 核心：推进对话 ==========

  /**
   * 执行到下一个有内容的节点，返回片段列表
   * @returns {Array} [{type, content, choices}]
   */
  function continueStory() {
    if (!_story || !_currentNode) return [];

    var result = [];
    var node = _story[_currentNode];
    if (!node) return [];

    // ink JSON 格式：节点内容是数组，逐条处理
    var content = node.content || [];
    var i = 0;

    while (i < content.length) {
      var item = content[i];
      i++;

      if (typeof item === 'string') {
        // 纯文本
        var text = parseInline(item);
        result.push({ type: 'text', content: text });
      } else if (typeof item === 'object') {
        // 分支选择
        if (item.hasOwnProperty(' Alternatives')) {
          // 选项
          var choices = item.Alternatives.map(function(alt) {
            return { text: parseInline(alt.content[0]), target: alt.path };
          });
          result.push({ type: 'choices', choices: choices });
        } else if (item.hasOwnProperty('VAR')) {
          // 变量赋值
          var varName = item.VAR.name;
          var varVal = item.VAR.value;
          _vars[varName] = varVal;
        } else if (item.hasOwnProperty('Goto')) {
          // 跳转
          _currentNode = item.Goto.path;
          node = _story[_currentNode];
          content = node ? (node.content || []) : [];
          i = 0;
        } else if (item.hasOwnProperty('Call')) {
          // 函数调用
          _callStack.push({ node: _currentNode, index: i });
          _currentNode = item.Call.path;
          node = _story[_currentNode];
          content = node ? (node.content || []) : [];
          i = 0;
        } else if (item.hasOwnProperty('Return')) {
          // 函数返回
          var ret = _callStack.pop();
          if (ret) {
            _currentNode = ret.node;
            node = _story[_currentNode];
            content = node ? (node.content || []) : [];
            i = ret.index;
          }
        } else if (item.hasOwnProperty('Choice')) {
          // 分支（单选）
          var choice = item.Choice;
          if (choice.conditionVar) {
            // 条件选择
            var cond = _vars[choice.conditionVar.name];
            var targetPath = cond ? choice.whenTrue : choice.whenFalse;
            if (targetPath) {
              _currentNode = targetPath;
              node = _story[_currentNode];
              content = node ? (node.content || []) : [];
              i = 0;
            } else {
              // 没有分支路径，结束
              break;
            }
          }
        } else if (item.hasOwnProperty('Text')) {
          result.push({ type: 'text', content: parseInline(item.Text) });
        }
      }
    }

    return result;
  }

  // ========== 内联变量解析 ==========

  /**
   * 替换 {变量名} 为实际值
   */
  function parseInline(text) {
    return text.replace(/\{([^}]+)\}/g, function(match, varName) {
      var val = _vars[varName.trim()];
      return val !== undefined ? val : match;
    });
  }

  // ========== 发送文本后推进 ==========

  /**
   * 向克喵发送消息，推进对话
   * @param {string} text
   */
  function sendText(text) {
    if (_pendingInput) {
      var cb = _pendingInput;
      _pendingInput = null;
      cb(text);
    } else {
      // 追加玩家消息作为文本
      emit('text', { type: 'player', content: text });
    }
  }

  // ========== 发送文本 ==========

  /**
   * 发送一段克喵的对话文本
   */
  function emitText(text) {
    emit('text', { type: 'kle', content: parseInline(text) });
  }

  // ========== 选择选项 ==========

  /**
   * 玩家选择了一个选项
   * @param {number} index 选项索引
   */
  function chooseChoice(index) {
    var node = _story[_currentNode];
    if (!node || !node.content) return;

    var content = node.content;
    var choiceIndex = -1;
    var i = 0;
    while (i < content.length) {
      var item = content[i];
      if (typeof item === 'object' && item.hasOwnProperty('Alternatives')) {
        choiceIndex++;
        if (choiceIndex === index) {
          var target = item.Alternatives[index].path;
          _currentNode = target;
          emit('diver', { target: target });
          return;
        }
      }
      i++;
    }
  }

  // ========== 跳转到节点 ==========

  function goToNode(nodeName) {
    if (_story && _story[nodeName]) {
      _currentNode = nodeName;
      emit('diver', { target: nodeName });
    }
  }

  // ========== 获取当前可选选项 ==========

  /**
   * 获取当前节点的可选选项（需要玩家选择后才能继续）
   */
  function getCurrentChoices() {
    if (!_story || !_currentNode) return [];
    var node = _story[_currentNode];
    if (!node || !node.content) return [];

    var content = node.content;
    for (var i = 0; i < content.length; i++) {
      var item = content[i];
      if (typeof item === 'object' && item.hasOwnProperty('Alternatives')) {
        return item.Alternatives.map(function(alt) {
          return { text: parseInline(alt.content[0]), target: alt.path };
        });
      }
    }
    return [];
  }

  // ========== 设置变量 ==========

  function setVar(key, value) {
    _vars[key] = value;
  }

  function getVar(key) {
    return _vars[key];
  }

  // ========== 对外暴露 ==========

  window.kleStory = {
    loadDay: loadDay,
    continueStory: continueStory,
    sendText: sendText,
    chooseChoice: chooseChoice,
    goToNode: goToNode,
    getCurrentChoices: getCurrentChoices,
    setVar: setVar,
    getVar: getVar,
    on: on,
    emit: emit,

    // 获取当前状态（调试用）
    _getState: function() {
      return { day: _day, node: _currentNode, vars: _vars };
    }
  };

})();
