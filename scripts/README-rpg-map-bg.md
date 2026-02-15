# RPG 地图/技能/怪物/物品图生成（Python）

用 Ollama 在 `dogeow/public/game/rpg` 下生成地图背景、技能图标、怪物图标、装备图标。由原 `generate-rpg-map-bg.sh` 迁移为 Python 工程。

## 用法

**一条命令跑全部**（地图 + 技能 + 怪物 + 物品）：

```bash
cd dogeow/scripts && python -m rpg_map_bg all
```

或从项目根目录（如 `likunyan`）：

```bash
python dogeow/scripts/run-rpg-map-bg.py all
```

**方式一**（推荐，可从项目任意位置执行）：

```bash
python dogeow/scripts/run-rpg-map-bg.py [模式] [start [end]]
```

**方式二**：进入 scripts 目录后以模块运行：

```bash
cd dogeow/scripts
python -m rpg_map_bg [模式] [start [end]]
```

| 模式         | 说明                        | 默认范围   | 输出                                     |
| ------------ | --------------------------- | ---------- | ---------------------------------------- |
| **all**      | 全部（地图→技能→怪物→物品） | 各模式默认 | 见下列四项                               |
| （无或数字） | 地图背景                    | 1–46       | `bg/map_1.jpg` … `map_46.jpg`（640×360） |
| skills       | 技能图标                    | 1–30       | `skills/skill_1.png` …（128×128）        |
| monsters     | 怪物图标                    | 1–46       | `monsters/monster_1.png` …（128×128）    |
| items        | 物品图标                    | 1–163      | `items/item_1.png` …（128×128）          |

示例：

```bash
python -m rpg_map_bg all           # 全部：地图 1–46、技能 1–30、怪物 1–46、物品 1–163
python -m rpg_map_bg              # 仅地图 1–46
python -m rpg_map_bg 5 10         # 仅地图 5–10
python -m rpg_map_bg skills       # 仅技能 1–30
python -m rpg_map_bg monsters 1 5  # 仅怪物 1–5
python -m rpg_map_bg items        # 仅物品 1–163
```

## 环境变量

- `OLLAMA_MODEL`：生图模型（默认 `x/z-image-turbo`）
- `THERMAL_THRESHOLD`：热等级 ≥ 此值则暂停（默认 1）
- `PAUSE_SECONDS`：过热时每次暂停秒数（默认 90）

## 依赖

- Python 3.9+
- 系统：Ollama、macOS `sips`（缩放/裁剪）
- 热检测（可选）：Apple Silicon 需 `sudo` 运行 `powermetrics`

## 工程结构

```
dogeow/scripts/
├── rpg_map_bg/
│   ├── __init__.py
│   ├── __main__.py   # CLI 入口
│   ├── config.py     # 路径、尺寸、环境变量
│   ├── thermal.py    # CPU 热检测与等待
│   ├── platform.py   # 平台检测
│   ├── prompts.py    # 地图/技能/怪物/物品提示词
│   └── generator.py  # 调用 ollama、找图、缩放、保存
└── README-rpg-map-bg.md
```

原 shell 脚本 `generate-rpg-map-bg.sh` 可保留作备用，或删除后仅用本 Python 工程。
