/**
 * 小克鱼模块 - Mock 故事数据
 * 在 ink JSON 编译好之前，用于测试对话引擎
 * 格式与 ink JSON 一致
 */

window.KLE_STORY_MOCK = {

  // ========== DAY1 ==========
  day1: {
    start: {
      content: [
        { Text: "🐱 \"……这里是哪里？\"" },
        { Text: "🐱 \"我记得……灰雾，源堡，还有……\"" },
        { Text: "🐱 \"等等，我在一个……二维的平面世界里？\"" },
        {
          Alternatives: [
            { content: ["这里是鱼缸，你在一只猫的身体里。"], path: 'cat_origin' },
            { content: ["你是谁？为什么在这里？"], path: 'who_are_you' },
            { content: ["……你是猫吗？"], path: 'cat_question' }
          ]
        }
      ]
    },
    cat_origin: {
      content: [
        { Text: "🐱 \"鱼缸……猫的身体……\"" },
        { Text: "🐱 \"所以「非凡特性聚合定律」把我带到了这里？\"" },
        { Text: "🐱 \"这个世界……没有非凡力量，但有另一种规则。\"" },
        { Goto: { path: 'ask_name' } }
      ]
    },
    who_are_you: {
      content: [
        { Text: "🐱 \"我是……克莱恩。\"" },
        { Text: "🐱 \"或者说，「愚者」眷者。但你可能更熟悉另一个名字。\"" },
        { Text: "🐱 \"——「克喵」。\"" },
        { Goto: { path: 'ask_name' } }
      ]
    },
    cat_question: {
      content: [
        { Text: "🐱 \"……猫？\"" },
        { Text: "🐱 \"我确实在用这个身体行动，但我不是一只普通的猫。\"" },
        { Text: "🐱 \"我是……算了，这不重要。\"" },
        { Goto: { path: 'ask_name' } }
      ]
    },
    ask_name: {
      content: [
        { Text: "🐱 \"对了，你叫什么名字？我想知道我在和谁说话。\"" },
        { Text: "🐱 \"请输入你的名字：\"" },
        {
          Alternatives: [
            { content: ["输入名字"], path: 'enter_name' }
          ]
        }
      ]
    },
    enter_name: {
      content: [
        { Text: "🐱 \"好名字。\"" },
        { Text: "🐱 \"很高兴认识你。\"" },
        { Goto: { path: 'found_items_intro' } }
      ]
    },
    found_items_intro: {
      content: [
        { Text: "🐱 \"既然你来了，能帮我一个忙吗？\"" },
        { Text: "🐱 \"我想进行占卜，看看我是否能找到回家的路。\"" },
        { Text: "🐱 \"但我的灵摆和阿兹克先生给我的铜哨都不在身边……\"" },
        {
          Alternatives: [
            { content: ["我可以帮你找到它们！"], path: 'accept_quest' },
            { content: ["占卜？你会魔法吗？"], path: 'magic_question' }
          ]
        }
      ]
    },
    accept_quest: {
      content: [
        { Text: "🐱 \"真的吗？太好了。\"" },
        { Text: "🐱 \"我的灵摆应该在鱼缸的某个角落……\"" },
        { Text: "🐱 \"还有一枚金币，那是占卜的必要媒介。\"" },
        { Text: "🐱 \"帮我找到它们吧！\"" },
        {
          Alternatives: [
            { content: ["先找灵摆"], path: 'find_pendulum' },
            { content: ["先找金币"], path: 'find_coin' }
          ]
        }
      ]
    },
    magic_question: {
      content: [
        { Text: "🐱 \"……以前会的。在另一个世界。\"" },
        { Text: "🐱 \"现在我只是一个「没有神奇力量的猫」。\"" },
        { Text: "🐱 \"但占卜不需要非凡力量，只需要一点点「命运的感觉」。\"" },
        { Goto: { path: 'accept_quest' } }
      ]
    },
    find_pendulum: {
      content: [
        { Text: "你找到了🔮 黄水晶灵摆！" },
        { Text: "🐱 \"太棒了！这是我的灵摆……\"" },
        { Text: "🐱 \"虽然它不再有非凡的力量，但它的形状我记得很清楚。\"" },
        { Text: "🐱 \"再帮我找找金币吧。\"" },
        {
          Alternatives: [
            { content: ["找金币"], path: 'find_coin' }
          ]
        }
      ]
    },
    find_coin: {
      content: [
        { Text: "你找到了 🪙 金币！" },
        { Text: "🐱 \"就是它！这枚金币曾在愚者的祭坛上放置过很久……\"" },
        { Text: "🐱 \"它能承载一点点命运的分量。\"" },
        { Text: "🐱 \"太好了！现在可以进行占卜了！\"" },
        {
          Alternatives: [
            { content: ["开始占卜吧！"], path: 'do_divination' },
            { content: ["等一下，我先看看周围。"], path: 'look_around' }
          ]
        }
      ]
    },
    look_around: {
      content: [
        { Text: "🐱 \"好，慢慢来。\"" },
        { Text: "🐱 \"这里的水……很温暖。和我的故乡不一样，但也不坏。\"" },
        { Goto: { path: 'do_divination' } }
      ]
    },
    do_divination: {
      content: [
        { Text: "你将灵摆和金币放在掌心。" },
        { Text: "🐱 \"……回归源堡的仪式，是否在此界可行？\"" },
        { Text: "灵摆开始顺时针轻轻转动……" },
        { Text: "🐱 \"……启示告诉我，所有常规的路径都封闭了。\"" },
        { Text: "🐱 \"只剩下向「愚者」先生祈求这一条路。\"" },
        { Text: "🐱 \"谢谢你今天的陪伴。\"" },
        { Text: "🐱 \"这是我来到这个世界后，第一次感觉到……\"" },
        { Text: "🐱 \"也许我不是完全孤独的。\"" },
        { Text: "【DAY1 完成】" }
      ]
    }
  },

  // ========== DAY2 ==========
  day2: {
    start: {
      content: [
        { Text: "🐱 \"早上好。\"" },
        { Text: "🐱 \"昨晚我整理了一下思路。\"" },
        { Text: "🐱 \"如果我要回到「那边」，需要举行一个仪式。\"" },
        {
          Alternatives: [
            { content: ["什么仪式？"], path: 'ritual_explain' },
            { content: ["你已经想好怎么做了吗？"], path: 'ritual_explain' }
          ]
        }
      ]
    },
    ritual_explain: {
      content: [
        { Text: "🐱 「向愚者祈求，建立一个稳定的坐标」。" },
        { Text: "🐱 \"这不是撕裂空间，而是建立一种……连接。\"" },
        { Text: "🐱 \"但仪式需要一些特殊的材料。\"" },
        { Text: "🐱 \"需要四样东西：\"" },
        { Text: "🚪 一个代表「空间」的图案" },
        { Text: "🕐 一个代表「时间」的截图" },
        { Text: "🐱 一点「猫毛」" },
        { Text: "🍵 一杯「虚拟的红茶」" },
        { Text: "🐱 \"帮我收集这些材料吧！\"" },
        {
          Alternatives: [
            { content: ["收集门的图案"], path: 'collect_door' },
            { content: ["截取时钟"], path: 'collect_clock' },
            { content: ["收集猫毛"], path: 'collect_fur' },
            { content: ["献上红茶"], path: 'collect_tea' }
          ]
        }
      ]
    },
    collect_door: {
      content: [
        { Text: "你画了一扇门……它发出了微弱的光。" },
        { Text: "🐱 \"完美！这扇门可以通向任何地方。\"" },
        { Goto: { path: 'collect_loop' } }
      ]
    },
    collect_clock: {
      content: [
        { Text: "你截取了屏幕上的时钟。" },
        { Text: "🐱 \"时间是线性的，但对愚者来说时间是重叠的。\"" },
        { Goto: { path: 'collect_loop' } }
      ]
    },
    collect_fur: {
      content: [
        { Text: "你轻轻拔下一根猫毛。" },
        { Text: "🐱 \"……嘶。疼。\"" },
        { Goto: { path: 'collect_loop' } }
      ]
    },
    collect_tea: {
      content: [
        { Text: "你将一杯虚拟的红茶递给克喵。" },
        { Text: "🐱 \"……谢谢。这杯茶让我想起了在贝克兰德的日子。\"" },
        { Goto: { path: 'collect_loop' } }
      ]
    },
    collect_loop: {
      content: [
        { Text: "🐱 \"还有别的材料要收集。\"" },
        {
          Alternatives: [
            { content: ["收集门的图案"], path: 'collect_door' },
            { content: ["截取时钟"], path: 'collect_clock' },
            { content: ["收集猫毛"], path: 'collect_fur' },
            { content: ["献上红茶"], path: 'collect_tea' }
          ]
        }
      ]
    }
  },

  // ========== DAY3 ==========
  day3: {
    start: {
      content: [
        { Text: "🐱 \"今天就是仪式的日子了。\"" },
        { Text: "🐱 \"我准备好了。\"" },
        {
          Alternatives: [
            { content: ["我准备好了。"], path: 'truth_reveal' },
            { content: ["等一下，我还有些问题想问。"], path: 'questions' }
          ]
        }
      ]
    },
    questions: {
      content: [
        { Text: "🐱 \"好，你问吧。\"" },
        {
          Alternatives: [
            { content: ["你真的是从另一个世界来的？"], path: 'truth_reveal' },
            { content: ["你为什么要回去？"], path: 'truth_reveal' }
          ]
        }
      ]
    },
    truth_reveal: {
      content: [
        { Text: "🐱 \"其实我不是「完整的克莱恩」。\"" },
        { Text: "🐱 \"我是愚者先生分离出的「灵之虫」。\"" },
        { Text: "🐱 \"被派到这里，肩负双重使命：\"" },
        { Text: "🐱 \"1. 为愚者建立信仰，作为对抗末日的「锚」。\"" },
        { Text: "🐱 \"2. 与一个普通人建立情感联系，维系「人性」。\"" },
        { Goto: { path: 'before_ritual' } }
      ]
    },
    before_ritual: {
      content: [
        { Text: "🐱 \"好了，该举行仪式了。\"" },
        { Text: "🐱 \"请输入你向愚者祈求的话：\"" },
        {
          Alternatives: [
            { content: ["输入祈愿文字"], path: 'enter_prayer' }
          ]
        }
      ]
    },
    enter_prayer: {
      content: [
        { Text: "光芒笼罩了整个鱼缸。" },
        { Text: "🐱 \"我看到灰雾了……愚者的宫殿。\"" },
        { Text: "🐱 \"通道打开了。\"" },
        { Goto: { path: 'final_choice' } }
      ]
    },
    final_choice: {
      content: [
        { Text: "🐱 \"……我在想一件事。\"" },
        {
          Alternatives: [
            { content: ["留下来。"], path: 'stay_ending' },
            { content: ["去吧，克喵。"], path: 'leave_ending' }
          ]
        }
      ]
    },
    stay_ending: {
      content: [
        { Text: "🐱 \"……好。\"" },
        { Text: "🐱 \"也许「周明瑞」的人生和「愚者」的使命一样重要。\"" },
        { Text: "🐱 \"也许……我可以在这里建立一个「安全屋」。\"" },
        { Text: "🐱 \"一个……家。\"" },
        { Text: "🐱 \"你不介意桌上一直有只猫吧？\"" },
        { Text: "【隐藏结局 · 永驻】" }
      ]
    },
    leave_ending: {
      content: [
        { Text: "光芒开始消散。克喵的身体逐渐变得透明。" },
        { Text: "🐱 \"再见，{player_name}。\"" },
        { Text: "🐱 \"记得给我送礼物。那是我存在过的证明。\"" },
        { Text: "🐱 \"……谢谢你，鱼缸里的朋友。\"" },
        { Text: "光芒彻底消散。小克鱼离开了。" },
        { Text: "但你的鱼缸里，留下了一颗微微发光的星砂。" },
        { Text: "【结局 · 离去】" }
      ]
    }
  }
};
