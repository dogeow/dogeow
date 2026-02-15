"""热检测：Intel / Apple Silicon CPU 热等级，过热时等待。"""
import re
import subprocess
import time
from typing import Optional

from .config import PAUSE_SECONDS, THERMAL_THRESHOLD

_LEVEL_CN = ("轻微", "中等", "严重", "危急")


def get_thermal_level() -> int:
    """获取当前 CPU 热等级。Intel: sysctl；Apple Silicon: powermetrics（需 sudo）。"""
    # Intel: machdep.xcpm.cpu_thermal_level
    try:
        out = subprocess.run(
            ["sysctl", "-n", "machdep.xcpm.cpu_thermal_level"],
            capture_output=True,
            text=True,
            timeout=2,
        )
        if out.returncode == 0 and out.stdout.strip().isdigit():
            return int(out.stdout.strip())
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass

    # Apple Silicon: powermetrics -s thermal
    try:
        out = subprocess.run(
            ["sudo", "-n", "powermetrics", "-s", "thermal", "-i", "1", "-n", "1"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if out.returncode == 0 and "pressure level" in out.stdout.lower():
            text = out.stdout
            if "critical" in text.lower():
                return 3
            if "heavy" in text.lower():
                return 2
            if "moderate" in text.lower():
                return 1
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass

    return 0


def thermal_level_to_cn(level: int) -> str:
    """热等级转中文。"""
    if 0 <= level < len(_LEVEL_CN):
        return _LEVEL_CN[level]
    return "未知"


def get_thermal_temp() -> Optional[str]:
    """获取 CPU 温度数值（°C）。仅 Intel 可获取，Apple Silicon 返回 None。"""
    try:
        out = subprocess.run(
            [
                "sudo", "-n", "powermetrics", "--samplers", "smc",
                "-n", "1", "-i", "1",
            ],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if out.returncode != 0:
            return None
        m = re.search(r"CPU die temperature:\s*([0-9.]+)\s*C", out.stdout, re.I)
        if m:
            return m.group(1)
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return None


def format_thermal_status() -> str:
    """格式化热状态：等级 + 温度（若有）。"""
    level = get_thermal_level()
    cn = thermal_level_to_cn(level)
    temp = get_thermal_temp()
    if temp:
        return f"温度{cn} ({temp}°C)"
    return f"温度{cn}"


def wait_if_hot() -> None:
    """若过热则循环等待直到降温。"""
    while True:
        level = get_thermal_level()
        if level < THERMAL_THRESHOLD:
            return
        cn = thermal_level_to_cn(level)
        temp = get_thermal_temp()
        if temp:
            print(f"[thermal] CPU 温度偏高（{cn}，{temp}°C），暂停 {PAUSE_SECONDS}s 再检测...")
        else:
            print(f"[thermal] CPU 温度偏高（{cn}），暂停 {PAUSE_SECONDS}s 再检测...")
        time.sleep(PAUSE_SECONDS)
