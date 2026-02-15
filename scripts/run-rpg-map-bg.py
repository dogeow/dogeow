#!/usr/bin/env python3
"""从项目根或任意目录运行：将工作目录设为 scripts 后执行 rpg_map_bg。"""
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def main() -> None:
    os.chdir(SCRIPT_DIR)
    if SCRIPT_DIR not in sys.path:
        sys.path.insert(0, SCRIPT_DIR)
    from rpg_map_bg.__main__ import main as run_main
    run_main()


if __name__ == "__main__":
    main()
