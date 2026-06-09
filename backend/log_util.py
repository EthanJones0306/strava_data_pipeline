import builtins
from datetime import datetime

_original_print = builtins.print


def _ts_print(*args, **kwargs):
    _original_print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]", *args, **kwargs)


builtins.print = _ts_print
