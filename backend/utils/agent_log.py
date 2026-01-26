import json

DEBUG_LOG_PATH = "/home/ubuntu/sehan_website_docker_production/.cursor/debug.log"


def agent_log(payload):
    """Append a small JSON line to the shared debug log (best-effort)."""
    try:
        with open(DEBUG_LOG_PATH, "a") as f:
            f.write(json.dumps(payload) + "\n")
    except Exception:
        # Swallow errors to avoid impacting runtime
        pass

