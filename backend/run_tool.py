import subprocess, resource, sys


def _limit_resources():
    try:
        resource.setrlimit(resource.RLIMIT_AS, (1_000_000_000, 1_000_000_000))
        resource.setrlimit(resource.RLIMIT_CPU, (30, 30))
    except Exception:
        pass


def run_python_sandbox(script_path: str):
    cmd = [sys.executable, script_path]
    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            preexec_fn=_limit_resources,
        )
        out, err = proc.communicate(timeout=20)
        return out.decode("utf-8", errors="replace"), err.decode("utf-8", errors="replace"), proc.returncode
    except subprocess.TimeoutExpired:
        proc.kill()
        return "", "timeout expired", -1
    except Exception as exc:
        return "", str(exc), -2
