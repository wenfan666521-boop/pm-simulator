// ==========================================
// functions.ink — 通用函数
// ==========================================

// ---- 好感度更新 ----
// 示例：~ GIVE_RAPPORT(2)  → 好感度 +2 并显示提示
=== function GIVE_RAPPORT(amount) ===
~ rapport_klei += amount
{if rapport_klei >= 10}
    ~ rapport_klei = 10
{endif}
{if rapport_klei <= -10}
    ~ rapport_klei = -10
{endif}

// ---- 检查好感度等级 ----
// 使用示例：{CHECK_RAPPORT()} 在文本中展开描述
=== function CHECK_RAPPORT ===
{if rapport_klei >= 5}
    好感度：亲密
{elif rapport_klei >= 3}
    好感度：友好
{elif rapport_klei >= 1}
    好感度：尚可
{elif rapport_klei >= -1}
    好感度：陌生
{else}
    好感度：冷淡
{endif}

// ---- 检查道具 ----
=== function HAS_ITEM(item_name) ===
{if item_name == "pendulum"}
    {if has_pendulum}-> true {else}-> false{endif}
{elif item_name == "copper_bell"}
    {if has_copper_bell}-> true {else}-> false{endif}
{elif item_name == "tarot_spread"}
    {if has_tarot_spread}-> true {else}-> false{endif}
{elif item_name == "old_map"}
    {if has_old_map}-> true {else}-> false{endif}
{else}
    -> false
{endif}

// ---- 获得道具提示 ----
=== function OBTAIN_ITEM(item_name) ===
{if item_name == "pendulum"}
    🐱「找到了灵摆！这东西在二维世界也能用。」
    ~ has_pendulum = true
{elif item_name == "copper_bell"}
    🐱「铜哨……阿兹克先生。」
    ~ has_copper_bell = true
{elif item_name == "tarot_spread"}
    🐱「塔罗牌？这是灵摆的二维版替代品。」
    ~ has_tarot_spread = true
{elif item_name == "old_map"}
    🐱「这张旧地图……标着源堡的位置。」
    ~ has_old_map = true
{endif}