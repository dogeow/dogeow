# 暗黑挂机游戏设计文档

## 游戏概述

类似暗黑2风格的挂机手机游戏，玩家创建角色后在地图上自动战斗，打怪掉装备，提升角色实力。

## 核心系统

### 1. 角色系统 (Character)

**属性**：

- 基础属性：力量、敏捷、体力、能量、等级、经验
- 战斗属性：生命值、法力值、攻击力、防御力、暴击率、暴击伤害
- 资源：金币

**职业**：

- 战士：高生命、高攻击
- 法师：高法力、高技能伤害
- 游侠：高敏捷、高暴击

### 2. 装备系统 (Equipment)

**装备槽位**：

- 武器 (weapon)
- 头盔 (helmet)
- 盔甲 (armor)
- 手套 (gloves)
- 靴子 (boots)
- 腰带 (belt)
- 戒指1 (ring1)
- 戒指2 (ring2)
- 护身符 (amulet)

**装备品质**：

- 普通 (common) - 白色
- 魔法 (magic) - 蓝色
- 稀有 (rare) - 黄色
- 传奇 (legendary) - 橙色
- 神话 (mythic) - 绿色

**装备属性**：

- 基础属性加成
- 随机词缀（魔法及以上品质）

### 3. 背包系统 (Inventory)

- 背包格子：40格
- 仓库格子：100格（可扩展）
- 装备可堆叠：否
- 消耗品可堆叠：是

### 4. 技能系统 (Skill)

**技能类型**：

- 主动技能：需要手动/自动释放
- 被动技能：永久生效

**技能槽**：最多装备6个主动技能

**技能升级**：使用技能点升级

### 5. 地图系统 (Map)

**地图结构**：

- 多个区域（Act）
- 每个区域有多个地图
- 地图有怪物等级范围
- 地图有传送点（解锁后可快速传送）

**地图类型**：

- 普通地图：常规刷怪
- 精英地图：精英怪，更高掉率
- Boss地图：Boss战，掉落套装

### 6. 怪物系统 (Monster)

**怪物类型**：

- 普通怪
- 精英怪（蓝色/黄色名字）
- Boss

**怪物属性**：

- 生命值、攻击力、防御力
- 等级、经验值
- 掉落表

### 7. 战斗系统 (Combat)

**战斗流程**：

1. 角色进入地图
2. 自动寻找并攻击怪物
3. 技能自动释放（按设置优先级）
4. 怪物死亡后掉落物品
5. 自动拾取（可设置过滤）
6. 继续寻找下一个怪物

**战斗公式**：

- 物理伤害 = 攻击力 × (1 - 怪物防御/(怪物防御+100))
- 技能伤害 = 基础伤害 × 技能倍率 × 属性加成

### 8. 物品掉落系统 (Loot)

**掉落机制**：

- 基于怪物等级和类型
- 掉落装备品质概率
- 掉落词缀随机生成

**拾取过滤**：

- 按品质过滤
- 按类型过滤

### 9. 传送系统 (Teleport)

- 解锁传送点后可快速传送
- 传送需要消耗金币或时间

## 数据库设计

### 表结构

```sql
-- 游戏角色
game_characters
- id
- user_id
- name
- class (warrior/mage/ranger)
- level
- experience
- gold
- stats (JSON: str, dex, vit, ene)
- skill_points
- stat_points
- created_at
- updated_at

-- 角色装备
game_equipment
- id
- character_id
- slot
- item_id (外键到game_items)

-- 游戏物品
game_items
- id
- character_id
- definition_id
- quality
- stats (JSON)
- is_in_storage
- quantity
- slot_index

-- 物品定义
game_item_definitions
- id
- name
- type (weapon/helmet/armor/etc)
- base_stats (JSON)
- required_level
- icon

-- 技能定义
game_skill_definitions
- id
- name
- description
- type (active/passive)
- class_restriction
- max_level
- base_damage
- mana_cost
- cooldown

-- 角色技能
game_character_skills
- id
- character_id
- skill_id
- level
- slot_index (1-6)

-- 地图定义
game_map_definitions
- id
- name
- act
- level_range (JSON)
- monster_types (JSON)
- teleport_enabled

-- 角色地图进度
game_character_maps
- id
- character_id
- map_id
- unlocked
- teleport_unlocked
- current

-- 怪物定义
game_monster_definitions
- id
- name
- type (normal/elite/boss)
- level
- stats (JSON)
- drop_table (JSON)
- experience

-- 战斗日志
game_combat_logs
- id
- character_id
- map_id
- monster_id
- damage_dealt
- damage_taken
- loot_dropped (JSON)
- experience_gained
- created_at
```

## API 设计

### 角色相关

- GET /game/character - 获取当前角色
- POST /game/character - 创建角色
- PUT /game/character/stats - 分配属性点
- PUT /game/character/skills - 装备技能

### 背包相关

- GET /game/inventory - 获取背包物品
- POST /game/inventory/equip - 装备物品
- POST /game/inventory/unequip - 卸下装备
- POST /game/inventory/sell - 出售物品
- POST /game/inventory/move - 移动物品

### 地图相关

- GET /game/maps - 获取所有地图
- POST /game/maps/{id}/enter - 进入地图
- POST /game/maps/{id}/teleport - 传送到地图

### 战斗相关

- GET /game/combat/status - 获取战斗状态
- POST /game/combat/start - 开始挂机
- POST /game/combat/stop - 停止挂机

### WebSocket事件

- GameCombatUpdate - 战斗更新
- GameLootDropped - 物品掉落
- GameLevelUp - 升级
- GameCharacterDeath - 角色死亡
