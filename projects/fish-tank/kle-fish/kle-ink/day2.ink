// DAY2 · 仪式准备
// 小克鱼解释仪式，收集四个材料

VAR door_found = false
VAR clock_found = false
VAR fur_found = false
VAR tea_found = false
VAR player_name = ""

=== start ===
# day: 2
# title: 仪式准备

🐱 "{player_name}，早上好。"
🐱 "昨晚我整理了一下思路。"
🐱 "如果我要回到"那边"，需要举行一个仪式。"

请选择你的回应：

+ "什么仪式？"
  -> ritual_explain
+ "你已经想好怎么做了吗？"
  -> ritual_explain

=== ritual_explain ===
🐱 "「向愚者祈求，建立一个稳定的坐标」。"
🐱 "这不是撕裂空间，而是建立一种……连接。"
🐱 "但仪式需要一些特殊的材料。"

→ 任务: 收集4个材料

请选择你的回应：

+ "需要什么材料？我来帮你找。"
  -> materials_intro
+ "听起来很复杂……"
  -> worry_response

=== worry_response ===
🐱 "我知道这听起来很奇怪。"
🐱 "但这是我能想到的唯一办法。"
🐱 "而且……有你在帮忙，我觉得也许真的能成功。"

-> materials_intro

=== materials_intro ===
🐱 "需要四样东西："
🐱 "🚪 一个代表「空间」的图案——你可以用手指在屏幕上画一扇门。"
🐱"🕐 一个代表「时间」的截图——系统时钟的截图。"
🐱 "🐱 一点「猫毛」——这个我自己提供就好。"
🐱 "🍵 一杯「虚拟的红茶」——这是献给我的。"

请先选择要收集哪个材料：

+ "收集门的图案"
  -> collect_door
+ "截取时钟"
  -> collect_clock
+ "收集猫毛"
  -> collect_fur
+ "献上红茶"
  -> collect_tea

=== collect_door ===
🐱 "对，空间需要一个形状。"
🐱 "在屏幕上画一扇门吧——代表通往某处的入口。"

请画一扇门（用手指或鼠标在屏幕上画）：
# item: door

你画了一扇门……它发出了微弱的光。
🐱 "完美！这扇门可以通向任何地方……也可以通向愚者的灰雾。"
🐱 "谢谢你。"

{all_found: "四样材料都收集齐了！"}
{!all_found: "还需要 {missing_count} 样材料。"}

-> check_all_materials

=== collect_clock ===
🐱 "时间……这是仪式的核心。"
🐱 "新月或满月的时间最好，但普通的时间也可以。"

你截取了屏幕上的时钟：
# item: clock

🐱 "时间是线性的，但对愚者来说时间是重叠的。"
🐱 "这张截图可以锚定我的时间点。"

{all_found: "四样材料都收集齐了！"}
{!all_found: "还需要 {missing_count} 样材料。"}

-> check_all_materials

=== collect_fur ===
🐱 "这个我自己来。"
你轻轻拔下一根猫毛：
🐱 "……嘶。疼。虽然是灵之虫，但还是会疼的。"
🐱 "好了，这根毛能承载我的灵魂碎片。"

# item: fur

{all_found: "四样材料都收集齐了！"}
{!all_found: "还需要 {missing_count} 样材料。"}

-> check_all_materials

=== collect_tea ===
🐱 "茶……愚者喜欢在举行仪式前喝一杯茶。"
🐱 "普通的茶就行。"

你将一杯虚拟的红茶递给克喵。
🐱 "……谢谢。这杯茶让我想起了在贝克兰德的日子。"
🐱 "那时候我还会去咖啡馆喝咖啡，而不是在鱼缸里……"

# item: tea

{all_found: "四样材料都收集齐了！"}
{!all_found: "还需要 {missing_count} 样材料。"}

-> check_all_materials

=== check_all_materials ===
{if door_found && clock_found && fur_found && tea_found:}
    -> materials_complete
{else:}
    -> materials_intro

=== all_found ===
{door_found && clock_found && fur_found && tea_found}

=== missing_count ===
{
  - door_found: "3"
  - clock_found: "3"
  - fur_found: "3"
  - tea_found: "3"
  - door_found && clock_found: "2"
  - door_found && fur_found: "2"
  - door_found && tea_found: "2"
  - clock_found && fur_found: "2"
  - clock_found && tea_found: "2"
  - fur_found && tea_found: "2"
  - door_found && clock_found && fur_found: "1"
  - door_found && clock_found && tea_found: "1"
  - door_found && fur_found && tea_found: "1"
  - clock_found && fur_found && tea_found: "1"
  - else: "4"
}

=== materials_complete ===
🐱 "四样材料都齐了！"
🐱 "明天就是仪式的日子。"

请选择你的回应：

+ "明天见，克喵。"
  -> day_end
+ "这个仪式需要多长时间？"
  -> ritual_duration

=== ritual_duration ===
🐱 "不会很长。但那之后……"
🐱 "也许一切都会不一样。"

-> day_end

=== day_end ===
🐱 "晚安，{player_name}。"
🐱 "明天……我们再见。"

DAY2 完成！
# complete: day2
→ 进入 DAY3

=== END ===