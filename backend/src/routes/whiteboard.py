from flask import Blueprint, request, jsonify
from extensions import socketio
from flask_socketio import emit, join_room, leave_room

whiteboard_bp = Blueprint('whiteboard', __name__)

# 存储每个房间的白板状态
whiteboard_states = {}

@socketio.on('join_whiteboard')
def handle_join_whiteboard(data):
    room = data.get('room')
    token = data.get('token')
    
    if not room:
        return

    join_room(room)
    if room in whiteboard_states:
        emit('whiteboard_state', {
            'state': whiteboard_states[room],
            'room': room
        })

@socketio.on('leave_whiteboard')
def handle_leave_whiteboard(data):
    room = data.get('room')
    if room:
        leave_room(room)

@socketio.on('draw')
def handle_draw(data):
    room = data.get('room')
    if not room:
        return

    # 更新房间的白板状态
    if room not in whiteboard_states:
        whiteboard_states[room] = []
    
    draw_data = {
        'x': data.get('x'),
        'y': data.get('y'),
        'drawing': data.get('drawing'),
        'color': data.get('color', '#000000'),
        'lineWidth': data.get('lineWidth', 2),
        'room': room 
    }
    
    whiteboard_states[room].append(draw_data)
    
    print(f'Broadcasting whiteboard event to room: {room}')
    emit('draw', draw_data, room=room, broadcast=True)

@socketio.on('clear_whiteboard')
def handle_clear_whiteboard(data):
    room = data.get('room')
    if room:
        whiteboard_states[room] = []  # 清空状态
        emit('clear_whiteboard', {'room': room}, room=room, broadcast=True)

@socketio.on('request_whiteboard_state')
def handle_state_request(data):
    room = data.get('room')
    if room and room in whiteboard_states:
        emit('whiteboard_state', {
            'state': whiteboard_states[room],
            'room': room
        })
