"""
NeuroGuard Event Dispatcher
Lightweight async/sync event bus for internal pub/sub.
"""

from typing import Callable, Dict, List, Any

_listeners: Dict[str, List[Callable]] = {}
_sync_listeners: Dict[str, List[Callable]] = {}


def on(event: str, callback: Callable):
    """Register an async listener for an event."""
    _listeners.setdefault(event, []).append(callback)


def on_sync(event: str, callback: Callable):
    """Register a sync listener for an event."""
    _sync_listeners.setdefault(event, []).append(callback)


async def dispatch(event: str, payload: Any = None):
    """Fire all async listeners for an event."""
    for cb in _listeners.get(event, []):
        try:
            await cb(payload)
        except Exception as e:
            print(f"Event dispatch error [{event}]: {e}")


def dispatch_sync(event: str, payload: Any = None):
    """Fire all sync listeners for an event."""
    for cb in _sync_listeners.get(event, []):
        try:
            cb(payload)
        except Exception as e:
            print(f"Sync event dispatch error [{event}]: {e}")
