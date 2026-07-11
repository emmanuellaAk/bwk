import uuid
from starlette.types import ASGIApp, Receive, Scope, Send


class RequestIDMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] in ("http", "websocket"):
            scope.setdefault("state", {})
            scope["state"]["request_id"] = str(uuid.uuid4())

        async def send_with_header(message):
            if message["type"] == "http.response.start":
                rid = scope.get("state", {}).get("request_id", "-")
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", rid.encode()))
                message = {**message, "headers": headers}
            await send(message)

        await self.app(scope, receive, send_with_header)
