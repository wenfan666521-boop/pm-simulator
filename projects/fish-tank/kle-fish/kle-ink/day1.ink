// DAY1 · 初临
// 小克鱼来到鱼缸第一天，探索世界，找到灵摆和金币，进行第一次占卜

VAR pendulum_found = false
VAR coin_found = false
VAR divination_done = false
VAR player_name = ""

=== start ===
# day: 1
# title: 初临

🐱 "……这里是哪里？"
🐱 "我记得……灰雾，源堡，还有……"
🐱 "等等，我在一个……二维的平面世界里？"

请选择你的回应：

+ "这里是鱼缸，你在一只猫的身体里。"
  -> cat_origin
+ "你是谁？为什么在这里？"
  -> who_are_you
+ "……你是猫吗？"
  -> cat_question

=== cat_origin ===
🐱 "鱼缸……猫的身体……"
🐱 "所以「非凡特性聚合定律」把我带到了这里？"
🐱 "这个世界……没有非凡力量，但有另一种规则。"

-> ask_name

=== who_are_you ===
🐱 "我是……克莱恩。"
🐱 "或者说，"愚者"眷者。但你可能更熟悉另一个名字。"
🐱 "——「克喵」。"

-> ask_name

=== cat_question ===
🐱 "……猫？"
🐱 "我确实在用这个身体行动，但我不是一只普通的猫。"
🐱 "我是……算了，这不重要。"

-> ask_name

=== ask_name ===
🐱 "对了，你叫什么名字？我想知道我在和谁说话。"
请输入你的名字（或直接发送）：
+ [输入名字]
   -> enter_name

=== enter_name ===
# prompt: text
# placeholder: 请输入你的名字
# key: player_name

你: {player_name}
🐱 "{player_name}，好名字。"
🐱 "很高兴认识你。"

-> found_items_intro

=== found_items_intro ===
🐱 "既然你来了，能帮我一个忙吗？"
🐱 "我想进行占卜，看看我是否能找到回家的路。"
🐱 "但我的灵摆和阿兹克先生给我的铜哨都不在身边……"

请选择你的回应：

+ "我可以帮你找到它们！"
  -> accept_quest
+ "占卜？你会魔法吗？"
  -> magic_question

=== accept_quest ===
🐱 "真的吗？太好了。"
🐱 "我的灵摆应该在鱼缸的某个角落……"
🐱 "还有一枚金币，那是占卜的必要媒介。"

请先找到灵摆，再找到金币，然后进行占卜。

-> item_choice

=== magic_question ===
🐱 "……以前会的。在另一个世界。"
🐱 "现在我只是一个「没有神奇力量的猫」。"
🐱 "但占卜不需要非凡力量，只需要一点点「命运的感觉」。"

-> item_choice

=== item_choice ===
# items: pendulum,coin
🐱 "帮我找到它们吧！"
→ 任务: 找到灵摆 &找到金币
+ "先找灵摆"
   -> find_pendulum
+ "先找金币"
   -> find_coin

=== find_pendulum ===
🐱 "对，灵摆应该在那边……"
你找到了🔮 黄水晶灵摆！
# item: pendulum
🐱 "太棒了！这是我的灵摆……"
🐱 "虽然它不再有非凡的力量，但它的形状我记得很清楚。"

{coin_found: "还有金币！快去找它！"}
{!coin_found && !pendulum_found: "再帮我找找金币吧。"}

-> check_both_found

=== find_coin ===
🐱 "金币……应该沉在水底。"
你找到了 🪙 金币！
# item: coin
🐱 "就是它！这枚金币曾在愚者的祭坛上放置过很久……"
🐱 "它能承载一点点命运的分量。"

{pendulum_found: "还有灵摆！快去找它！"}
{!coin_found && !pendulum_found: "再帮我找找灵摆吧。"}

-> check_both_found

=== check_both_found ===
{if pendulum_found && coin_found:}
    -> ready_divination
{else:}
    -> item_choice

=== ready_divination ===
🐱 "太好了，灵摆和金币都找到了！"
🐱 "现在可以进行占卜了。"

请选择你的回应：

+ "开始占卜吧！"
  -> do_divination
+ "等一下，我先看看周围。"
  -> look_around

=== look_around ===
🐱 "好，慢慢来。"
🐱 "这里的水……很温暖。和我的故乡不一样，但也不坏。"

-> ready_divination

=== do_divination ===
🐱 "好。让我准备一下……"
你将灵摆和金币放在掌心。
# item: divination

🐱 "……回归源堡的仪式，是否在此界可行？"

灵摆开始顺时针轻轻转动……

🐱 "……启示告诉我，所有常规的路径都封闭了。"
🐱 "只剩下向「愚者」先生祈求这一条路。"

🐱 "{player_name}，谢谢你的陪伴。"
🐱 "这是我来到这个世界后，第一次感觉到……"
🐱 "也许我不是完全孤独的。"

DAY1 完成！
# complete: day1
→ 进入 DAY2

=== END ===