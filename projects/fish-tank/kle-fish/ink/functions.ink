// ==========================================
// functions.ink — 通用函数
// ==========================================

// ---- 好感度增加（上限10，下限-10）----
=== GIVE_RAPPORT ===
~ rapport_klei += 1
{if rapport_klei > 10}
    ~ rapport_klei = 10
{endif}
->->

// ---- 好感度减少（下限-10）----
=== REDUCE_RAPPORT ===
~ rapport_klei -= 1
{if rapport_klei < -10}
    ~ rapport_klei = -10
{endif}
->->

// ---- 获得灵摆 ----
=== GET_PENDULUM ===
🐱「找到了灵摆！这东西在二维世界也能用。」
~ has_pendulum = true
->->

// ---- 获得铜哨 ----
=== GET_COPPER_BELL ===
🐱「铜哨……阿兹克先生。」
~ has_copper_bell = true
->->

// ---- 获得塔罗牌 ----
=== GET_TAROT ===
🐱「塔罗牌？这是灵摆的二维版替代品。」
~ has_tarot_spread = true
->->

// ---- 获得旧地图 ----
=== GET_MAP ===
🐱「这张旧地图……标着源堡的位置。」
~ has_old_map = true
->->