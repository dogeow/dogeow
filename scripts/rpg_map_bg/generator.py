"""生成逻辑：调用 ollama、查找新图、缩放、保存。物品图标可选 rembg 抠图（透明背景）。"""
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Optional

from . import config
from . import prompts
from .thermal import format_thermal_status, wait_if_hot


def require_rembg() -> None:
    """物品流程依赖 rembg；未安装则打印提示并退出，不继续运行。"""
    try:
        import rembg  # noqa: F401
    except ImportError:
        print("物品图标需要 rembg 抠图（透明背景），未检测到 rembg。")
        print("请先安装: pip install rembg  或  pip install -r rpg_map_bg/requirements.txt")
        sys.exit(1)


def _remove_bg(path: Path) -> bool:
    """用 rembg 去除背景，保存为带透明通道的 PNG。不依赖背景色，白底/黑底均可。"""
    try:
        from PIL import Image
        from rembg import remove as rembg_remove

        img = Image.open(path).convert("RGB")
        out = rembg_remove(img)
        out.save(path, "PNG")
        return True
    except ImportError:
        print("  -> WARN: rembg 未安装，跳过抠图。安装: pip install rembg")
        return False
    except Exception as e:
        print(f"  -> WARN: rembg 失败: {e}")
        return False


def _find_latest_image(
    work_dir: Path,
    exclude_prefix: str,
    extensions: tuple[str, ...] = (".png", ".jpg", ".jpeg"),
) -> Optional[Path]:
    """在 work_dir 下找最新生成的图片（排除以 exclude_prefix 开头的）。"""
    candidates = []
    for ext in extensions:
        for f in work_dir.glob(f"*{ext}"):
            if not f.name.startswith(exclude_prefix):
                candidates.append(f)
    if not candidates:
        return None
    candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return candidates[0]


def _resize_square(path: Path, size: int) -> bool:
    """用 sips 缩放到 size x size（macOS）。"""
    try:
        subprocess.run(
            ["sips", "-z", str(size), str(size), str(path), "--out", str(path)],
            capture_output=True,
            timeout=10,
            check=True,
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return False


def _resize_square_preserve_alpha(path: Path, size: int) -> bool:
    """用 PIL 缩放到 size x size，保留透明通道（rembg 抠图后必须用此函数，否则 sips 会丢 alpha 或填白底）。"""
    try:
        from PIL import Image

        img = Image.open(path)
        if img.mode != "RGBA":
            img = img.convert("RGBA")
        img = img.resize((size, size), Image.Resampling.LANCZOS)
        img.save(path, "PNG")
        return True
    except Exception as e:
        print(f"  -> WARN: PIL resize 失败: {e}")
        return False


def _resize_landscape(path: Path, width: int, height: int) -> bool:
    """用 sips 先按宽缩放再裁到 height x width。"""
    try:
        subprocess.run(
            ["sips", "--resampleWidth", str(width), str(path), "--out", str(path)],
            capture_output=True,
            timeout=10,
            check=True,
        )
        subprocess.run(
            ["sips", "--cropToHeightWidth", str(height), str(width), str(path), "--out", str(path)],
            capture_output=True,
            timeout=10,
            check=True,
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return False


def _run_ollama(prompt: str, cwd: Optional[Path] = None) -> bool:
    """执行 ollama run MODEL PROMPT。cwd 为输出目录，ollama 会把生成的图保存到该目录。"""
    try:
        subprocess.run(
            ["ollama", "run", config.OLLAMA_MODEL, prompt],
            cwd=str(cwd) if cwd else None,
            stdin=subprocess.DEVNULL,
            timeout=600,
        )
        return True
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def _elapsed_fmt(seconds: int) -> str:
    if seconds >= 60:
        return f"{seconds // 60}m {seconds % 60}s"
    return f"{seconds}s"


def generate_map(start: int, end: int) -> None:
    """生成地图背景 map_1.jpg .. map_46.jpg，横图 640x360。"""
    config.BG_DIR.mkdir(parents=True, exist_ok=True)
    for i in range(start, end + 1):
        outfile = config.BG_DIR / f"map_{i}.jpg"
        if outfile.exists():
            print(f"Skip {outfile.name} (exists)")
            continue
        if i > len(prompts.MAP_PROMPTS):
            print(f"Skip {outfile.name} (no prompt for index {i})")
            continue
        prompt = prompts.MAP_PROMPTS[i - 1]
        wait_if_hot()
        print(f"[thermal] 生成前: {format_thermal_status()}")
        print(f"Generating {i}/{end}: {outfile.name} (will resize to landscape {config.BG_W}x{config.BG_H})")
        gen_start = int(time.time())
        _run_ollama(prompt, cwd=config.BG_DIR)
        gen_end = int(time.time())
        print(f"[thermal] 生成后: {format_thermal_status()}")
        latest = _find_latest_image(config.BG_DIR, "map_")
        if latest and latest.exists():
            latest.rename(outfile)
            origin = outfile.with_stem(outfile.stem + "_origin")
            shutil.copy2(outfile, origin)
            _resize_landscape(outfile, config.BG_W, config.BG_H)
            print(f"  -> saved as {outfile} ({config.BG_W}x{config.BG_H})，耗时: {_elapsed_fmt(gen_end - gen_start)}")
        else:
            print("  -> WARN: no new image file found, check ollama output")


def _generate_icons(
    mode: str,
    out_prefix: str,
    prompts_tuple: tuple[str, ...],
    work_dir: Path,
    start: int,
    end: int,
    *,
    apply_rembg: bool = False,
) -> None:
    """通用图标生成：技能/怪物/物品。apply_rembg 为 True 时用 rembg 抠图（透明背景）。"""
    work_dir.mkdir(parents=True, exist_ok=True)
    for i in range(start, end + 1):
        outfile = work_dir / f"{out_prefix}_{i}.png"
        if outfile.exists():
            print(f"Skip {outfile.name} (exists)")
            continue
        idx = i - 1
        if idx >= len(prompts_tuple):
            print(f"Skip {outfile.name} (no prompt for index {i})")
            continue
        prompt = prompts_tuple[idx]
        wait_if_hot()
        print(f"[thermal] 生成前: {format_thermal_status()}")
        print(f"Generating {mode} {i}/{end}: {outfile.name} ({config.SKILL_SIZE}x{config.SKILL_SIZE})")
        gen_start = int(time.time())
        _run_ollama(prompt, cwd=work_dir)
        gen_end = int(time.time())
        print(f"[thermal] 生成后: {format_thermal_status()}")
        latest = _find_latest_image(work_dir, out_prefix + "_")
        if latest and latest.exists():
            latest.rename(outfile)
            origin = outfile.with_stem(outfile.stem + "_origin")
            shutil.copy2(outfile, origin)
            if apply_rembg:
                _remove_bg(outfile)
                _resize_square_preserve_alpha(outfile, config.SKILL_SIZE)
            else:
                _resize_square(outfile, config.SKILL_SIZE)
            print(f"  -> saved as {outfile}，耗时: {_elapsed_fmt(gen_end - gen_start)}")
        else:
            print("  -> WARN: no new image file found")


def generate_skills(start: int, end: int) -> None:
    """生成技能图标 skill_1.png .. skill_30.png。"""
    _generate_icons(
        "skill",
        "skill",
        prompts.SKILL_PROMPTS,
        config.SKILL_DIR,
        start,
        end,
    )


def generate_monsters(start: int, end: int) -> None:
    """生成怪物图标 monster_1.png .. monster_46.png。"""
    _generate_icons(
        "monster",
        "monster",
        prompts.MONSTER_PROMPTS,
        config.MONSTER_DIR,
        start,
        end,
    )


def generate_items(start: int, end: int) -> None:
    """生成物品图标 item_1.png .. item_163.png，并用 rembg 抠图得到透明背景。"""
    _generate_icons(
        "item",
        "item",
        prompts.ITEM_PROMPTS,
        config.ITEM_DIR,
        start,
        end,
        apply_rembg=True,
    )
