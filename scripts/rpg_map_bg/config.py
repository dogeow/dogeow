"""配置：路径、尺寸、环境变量。"""
import os
from pathlib import Path

# 脚本所在目录，向上到 dogeow，再 public/game/rpg
_SCRIPT_DIR = Path(__file__).resolve().parent
_DOGEOW_SCRIPTS = _SCRIPT_DIR.parent  # dogeow/scripts
_DOGEOW_ROOT = _DOGEOW_SCRIPTS.parent  # dogeow
RPG_ROOT = _DOGEOW_ROOT / "public" / "game" / "rpg"

BG_DIR = RPG_ROOT / "bg"
SKILL_DIR = RPG_ROOT / "skills"
MONSTER_DIR = RPG_ROOT / "monsters"
ITEM_DIR = RPG_ROOT / "items"

# 横图尺寸：宽 640、高 360（地图专用）
BG_W = 640
BG_H = 360
# 技能/怪物/物品图标：方图 128x128
SKILL_SIZE = 128

# ollama 生图模型
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "x/z-image-turbo")

# 热检测：>= 此值则暂停（0=正常，1+=过热）
THERMAL_THRESHOLD = int(os.environ.get("THERMAL_THRESHOLD", "1"))
# 过热时每次暂停秒数
PAUSE_SECONDS = int(os.environ.get("PAUSE_SECONDS", "90"))

# 各模式默认范围
MAP_START, MAP_END = 1, 46
SKILL_START, SKILL_END = 1, 30
MONSTER_START, MONSTER_END = 1, 46
ITEM_START, ITEM_END = 1, 163
