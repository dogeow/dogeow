"""CLI：用法与原 shell 一致。"""
import argparse
import platform as plat_module
import sys

from . import config
from .generator import generate_items, generate_map, generate_monsters, generate_skills, require_rembg
from .platform import get_platform


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="用 ollama 生成 RPG 地图背景、技能/怪物/物品图标。",
        epilog="""
示例:
  全部:   python -m rpg_map_bg all
  地图:   python -m rpg_map_bg [start [end]]
  技能:   python -m rpg_map_bg skills [start [end]]
  怪物:   python -m rpg_map_bg monsters [start [end]]
  物品:   python -m rpg_map_bg items [start [end]]
环境变量: OLLAMA_MODEL, THERMAL_THRESHOLD, PAUSE_SECONDS
        """,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "mode_or_start",
        nargs="?",
        default="map",
        help="模式: all|map|skills|monsters|items；或地图起始序号",
    )
    parser.add_argument("start", nargs="?", type=int, help="起始序号")
    parser.add_argument("end", nargs="?", type=int, help="结束序号")
    args = parser.parse_args()

    mode_raw = args.mode_or_start.lower()
    if mode_raw == "all":
        args.mode = "all"
        args.start = args.start  # 忽略，all 用各模式默认范围
        args.end = args.end
    elif mode_raw in ("skill", "skills"):
        args.mode = "skill"
        args.start = args.start or config.SKILL_START
        args.end = args.end or config.SKILL_END
    elif mode_raw in ("monster", "monsters"):
        args.mode = "monster"
        args.start = args.start or config.MONSTER_START
        args.end = args.end or config.MONSTER_END
    elif mode_raw in ("item", "items", "equipment"):
        args.mode = "item"
        args.start = args.start or config.ITEM_START
        args.end = args.end or config.ITEM_END
    else:
        args.mode = "map"
        # 地图：第一位置=start，第二位置=end（无则 46）
        second_pos = args.start
        try:
            args.start = int(args.mode_or_start)
        except (ValueError, TypeError):
            args.start = config.MAP_START
        args.end = int(second_pos) if second_pos is not None else config.MAP_END

    return args


def main() -> None:
    args = _parse_args()

    print(f"[platform] 当前: {get_platform()}")
    if plat_module.machine() == "arm64":
        print("[thermal] 热等级参考(°C)：0 Nominal <~65，1 Moderate ~65–80，2 Heavy ~80–95，3 Critical >95")
    print()

    if args.mode == "all":
        require_rembg()
        generate_map(config.MAP_START, config.MAP_END)
        generate_skills(config.SKILL_START, config.SKILL_END)
        generate_monsters(config.MONSTER_START, config.MONSTER_END)
        generate_items(config.ITEM_START, config.ITEM_END)
    elif args.mode == "map":
        generate_map(args.start, args.end)
    elif args.mode == "skill":
        generate_skills(args.start, args.end)
    elif args.mode == "monster":
        generate_monsters(args.start, args.end)
    elif args.mode == "item":
        require_rembg()
        generate_items(args.start, args.end)
    else:
        print("Unknown mode", args.mode, file=sys.stderr)
        sys.exit(1)

    print("Done.")


if __name__ == "__main__":
    main()
