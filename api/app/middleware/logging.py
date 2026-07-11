import time
from starlette.types import ASGIApp, Receive, Scope, Send
from app.logger import log


class LoggingMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        method = scope.get("method", "")
        path = scope.get("path", "")
        request_id = scope.get("state", {}).get("request_id", "-")
        start = time.perf_counter()

        log.info("request", request_id=request_id, method=method, path=path)

        status_code = 0

        async def send_with_log(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
            await send(message)

        async def send_and_log(message):
            await send_with_log(message)
            if message["type"] == "http.response.body" and not message.get("more_body"):
                ms = round((time.perf_counter() - start) * 1000, 1)
                level = "error" if status_code >= 500 else "warning" if status_code >= 400 else "info"
                getattr(log, level)(
                    "response",
                    request_id=request_id,
                    method=method,
                    path=path,
                    status=status_code,
                    ms=ms,
                )

        await self.app(scope, receive, send_and_log)
