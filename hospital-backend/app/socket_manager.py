import socketio

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

@sio.event
async def connect(sid, environ):
    print(f"Socket connected: {sid}")

@sio.event
async def join_user_room(sid, data):
    """
    Client joins a room specific to their user ID to receive targeted notifications.
    Frontend should call this after user logs in.
    """
    user_id = data.get('user_id')
    if user_id:
        sio.enter_room(sid, f'user_{user_id}')
        print(f"SID {sid} joined room for user {user_id}")

@sio.event
async def join_pharmacy_room(sid, data):
    """ A pharmacy user joins a common room to get all new prescriptions """
    sio.enter_room(sid, 'pharmacy_queue')
    print(f"SID {sid} joined pharmacy queue room")


@sio.event
async def disconnect(sid):
    print(f"Socket disconnected: {sid}")

# Helper to emit notifications
async def notify_user(user_id: int, event: str, data: dict):
    await sio.emit(event, data, room=f'user_{user_id}')

async def notify_pharmacy(event: str, data: dict):
    await sio.emit(event, data, room='pharmacy_queue')