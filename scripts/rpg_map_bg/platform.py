"""检测当前平台：Intel 或 Apple Silicon。"""
import subprocess


def get_platform() -> str:
    """返回如 'Apple Silicon (M1)' 或 'Intel (x86_64)'。"""
    try:
        out = subprocess.run(
            ["uname", "-m"],
            capture_output=True,
            text=True,
            timeout=2,
        )
        arch = (out.stdout or "").strip() if out.returncode == 0 else ""
    except (subprocess.TimeoutExpired, FileNotFoundError):
        arch = ""

    if arch == "arm64":
        try:
            p = subprocess.run(
                ["system_profiler", "SPHardwareDataType"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            if p.returncode == 0:
                for line in p.stdout.splitlines():
                    if "Chip:" in line:
                        chip = line.split(":", 1)[-1].strip()
                        if chip:
                            return f"Apple Silicon ({chip})"
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        return "Apple Silicon (arm64)"

    if arch == "x86_64":
        try:
            out = subprocess.run(
                ["sysctl", "-n", "machdep.cpu.brand_string"],
                capture_output=True,
                text=True,
                timeout=2,
            )
            if out.returncode == 0 and out.stdout.strip():
                return f"Intel ({out.stdout.strip()})"
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        return "Intel (x86_64)"

    return f"未知 ({arch})"
