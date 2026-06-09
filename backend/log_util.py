import builtins
import sys
from datetime import datetime

original_print = builtins.print

def timestamped_print(*args, **kwargs):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if args:
        args = (f"[{ts}] {args[0]}",) + args[1:]
    original_print(*args, **kwargs)

builtins.print = timestamped_print
