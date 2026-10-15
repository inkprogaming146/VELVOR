import subprocess, shlex, os, resource, sys, tempfile, time

def _limit_resources():
    # small example limits; tune for your environment
    try:
        resource.setrlimit(resource.RLIMIT_AS, (1_000_000_000, 1_000_000_000))  # ~1GB
        resource.setrlimit(resource.RLIMIT_CPU, (30, 30))
    except Exception:
        pass

def run_python_sandbox(script_path, argv=[]):
    # Run script in a subprocess with resource limits using a wrapper
    cmd = [sys.executable, script_path] + argv
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, preexec_fn=_limit_resources)
        out, err = proc.communicate(timeout=20)
        return out.decode(errors="ignore"), err.decode(errors="ignore"), proc.returncode
    except subprocess.TimeoutExpired:
        proc.kill()
        return "", "timeout expired", -1
    except Exception as e:
        return "", str(e), -2
