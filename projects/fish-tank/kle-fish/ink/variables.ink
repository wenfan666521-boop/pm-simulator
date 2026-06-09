// ==========================================
// variables.ink — 全局变量声明
// ==========================================
// 所有游戏状态跟踪的变量在这里定义
// 在 script.ink 中 INCLUDE 此文件后即可使用

// ---- 玩家信息 ----
VAR player_name = ""              // 玩家输入的名字
VAR player_gender = ""            // 玩家性别（可选）

// ---- 克喵好感度 ----
// 范围：-10 ~ +10
// >= 3 解锁深度对话
// <= -2 克喵态度变冷淡
VAR rapport_klei = 0

// ---- 日期进度 ----
VAR current_day = 1               // 当前第几天
VAR day1_completed = false        // DAY1 是否完成
VAR day2_completed = false
VAR day3_completed = false

// ---- 道具栏 ----
VAR has_pendulum = false          // 灵摆
VAR has_copper_bell = false       // 铜哨（阿兹克给的）
VAR has_tarot_spread = false       // 塔罗牌（二维世界替代品）
VAR has_old_map = false           // 旧地图（标注源堡残卷）

// ---- 任务状态 ----
VAR quest_accepted = false        // 是否接受了克喵的请求
VAR quest_progress = 0             // 任务完成进度（0~100）
VAR discovered_cat_origin = false // 是否发现克喵在猫身体里

// ---- 特殊标记 ----
VAR used_divination = false       // 是否使用过占卜
VAR chose_deep_talk = false      // 是否触发深度对话分支