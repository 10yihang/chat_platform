from flask_socketio import emit
from flask import request
from models.user import User
from extensions import socketio


class CallService:
    def __init__(self):
        self.setup_handlers()
        
    def setup_handlers(self):
        @socketio.on('call_request')
        def handle_call_request(data):
            # 仅当 type == 'voice' 时处理
            call_type = data.get('type')
            if call_type != 'voice':
                return
            try:
                # print(f'处理通话请求: {data}')
                sender_id = data.get('sender_id') or request.sid
                target_id = data.get('target_id')
                caller_name = data.get('caller_name')
                sdp = data.get('sdp')
                call_type = data.get('type')
                
                if not all([target_id, caller_name, sdp]):
                    print(f"请求参数不完整: sender_id={sender_id}, target_id={target_id}, caller_name={caller_name}")
                    emit('call_error', {'message': '请求参数不完整'}, room=request.sid)
                    return
                
                target_user = User.query.get(target_id)
                if not target_user:
                    emit('call_error', {'message': '用户不存在'}, room=request.sid)
                    return

                print(f'用户 {sender_id} ({caller_name}) 请求与用户 {target_id} 通话')
                
                # 发送通话请求到目标用户
                emit('call_received', {
                    'caller_id': sender_id,
                    'caller_name': caller_name,
                    'type': call_type,
                    'sdp': sdp
                }, room=f'user_{target_id}')
                
                # 向发起者确认请求已发送
                emit('call_request_sent', {'message': '通话请求已发送'}, room=request.sid)
                
            except Exception as e:
                print(f"处理通话请求失败: {str(e)}")
                emit('call_error', {'message': '处理通话请求失败'}, room=request.sid)

        @socketio.on('call_answer')
        def handle_call_answer(data):
            try:
                sender_id = data.get('sender_id') or request.sid
                target_id = data.get('target_id')
                sdp = data.get('sdp')
                
                if not all([target_id, sdp]):
                    emit('call_error', {'message': '回答参数不完整'}, room=request.sid)
                    return
                
                print(f'用户 {sender_id} 接受了来自 {target_id} 的通话')
                emit('call_answered', {
                    'sdp': sdp,
                    'answerer_id': sender_id
                }, room=f'user_{target_id}')
                
            except Exception as e:
                print(f"处理通话应答失败: {str(e)}")
                emit('call_error', {'message': '处理通话应答失败'}, room=request.sid)

        @socketio.on('ice_candidate')
        def handle_ice_candidate(data):
            try:
                target_id = data.get('target_id')
                candidate = data.get('candidate')
                sender_id = data.get('sender_id', request.sid)
                
                if not target_id:
                    emit('call_error', {'message': '目标用户ID不存在'})
                    return
                    
                emit('ice_candidate', {
                    'candidate': candidate,
                    'sender_id': sender_id
                }, room=f'user_{target_id}')
            except Exception as e:
                print(f"处理ICE候选失败: {str(e)}")
                emit('call_error', {'message': '处理ICE候选失败'})

        @socketio.on('call_rejected')
        def handle_call_rejected(data):
            try:
                target_id = data.get('target_id')
                sender_id = data.get('sender_id', request.sid)
                
                if not target_id:
                    emit('call_error', {'message': '目标用户ID不存在'})
                    return
                    
                emit('call_rejected', {
                    'sender_id': sender_id
                }, room=f'user_{target_id}')
            except Exception as e:
                print(f"处理通话拒绝失败: {str(e)}")
                emit('call_error', {'message': '处理通话拒绝失败'})

        @socketio.on('call_ended')
        def handle_call_ended(data):
            try:
                target_id = data.get('target_id')
                sender_id = data.get('sender_id', request.sid)
                
                if not target_id:
                    emit('call_error', {'message': '目标用户ID不存在'})
                    return
                
                # 确保双方都收到通话结束事件    
                emit('call_ended', {
                    'sender_id': sender_id
                }, room=[f'user_{target_id}', request.sid])
                
                # emit('call_ended', {
                #     'sender_id': sender_id
                # }, room=request.sid)
                
            except Exception as e:
                print(f"处理通话结束错误: {str(e)}")
                emit('call_error', {'message': '处理通话结束请求失败'}, room=request.sid)

        @socketio.on('video_call_request')
        def handle_video_call_request(data):
            # 仅当 type == 'video' 时处理
            call_type = data.get('type')
            if call_type != 'video':
                return
            try:
                sender_id = data.get('sender_id') or request.sid
                target_id = data.get('target_id')
                caller_name = data.get('caller_name')
                sdp = data.get('sdp')
                call_type = data.get('type')
                
                if not all([target_id, caller_name, sdp]):
                    print(f"请求参数不完整: sender_id={sender_id}, target_id={target_id}, caller_name={caller_name}")
                    emit('call_error', {'message': '请求参数不完整'}, room=request.sid)
                    return
                
                target_user = User.query.get(target_id)
                if not target_user:
                    emit('call_error', {'message': '用户不存在'}, room=request.sid)
                    return

                print(f'用户 {sender_id} ({caller_name}) 请求与用户 {target_id} 视频通话')
                
                # 发送视频通话请求到目标用户
                emit('video_call_received', {
                    'caller_id': sender_id,
                    'caller_name': caller_name,
                    'type': call_type,
                    'sdp': sdp
                }, room=f'user_{target_id}')
                
                # 向发起者确认请求已发送
                emit('call_request_sent', {'message': '视频通话请求已发送'}, room=request.sid)
                
            except Exception as e:
                print(f"处理视频通话请求失败: {str(e)}")
                emit('call_error', {'message': '处理视频通话请求失败'}, room=request.sid)

        @socketio.on('video_call_answer')
        def handle_video_call_answer(data):
            try:
                sender_id = data.get('sender_id') or request.sid
                target_id = data.get('target_id')
                sdp = data.get('sdp')
                
                if not all([target_id, sdp]):
                    emit('call_error', {'message': '回答参数不完整'}, room=request.sid)
                    return
                
                print(f'用户 {sender_id} 接受了来自 {target_id} 的视频通话')
                emit('video_call_answered', {
                    'sdp': sdp,
                    'answerer_id': sender_id
                }, room=f'user_{target_id}')
                
            except Exception as e:
                print(f"处理视频通话应答失败: {str(e)}")
                emit('call_error', {'message': '处理视频通话应答失败'}, room=request.sid)

        @socketio.on('video_ice_candidate')
        def handle_video_ice_candidate(data):
            try:
                target_id = data.get('target_id')
                candidate = data.get('candidate')
                sender_id = data.get('sender_id', request.sid)
                
                if not target_id:
                    emit('call_error', {'message': '目标用户ID不存在'})
                    return
                    
                emit('video_ice_candidate', {
                    'candidate': candidate,
                    'sender_id': sender_id
                }, room=f'user_{target_id}')
            except Exception as e:
                print(f"处理视频ICE候选失败: {str(e)}")
                emit('call_error', {'message': '处理视频ICE候选失败'})

        @socketio.on('video_call_rejected')
        def handle_video_call_rejected(data):
            try:
                target_id = data.get('target_id')
                sender_id = data.get('sender_id', request.sid)
                
                if not target_id:
                    emit('call_error', {'message': '目标用户ID不存在'})
                    return
                    
                emit('video_call_rejected', {
                    'sender_id': sender_id
                }, room=f'user_{target_id}')
            except Exception as e:
                print(f"处理视频通话拒绝失败: {str(e)}")
                emit('call_error', {'message': '处理视频通话拒绝失败'})

        @socketio.on('video_call_ended')
        def handle_video_call_ended(data):
            try:
                target_id = data.get('target_id')
                sender_id = data.get('sender_id', request.sid)
                
                if not target_id:
                    emit('call_error', {'message': '目标用户ID不存在'})
                    return
                
                # 确保双方都收到视频通话结束事件    
                emit('video_call_ended', {
                    'sender_id': sender_id
                }, room=[f'user_{target_id}', request.sid])
                
            except Exception as e:
                print(f"处理视频通话结束错误: {str(e)}")
                emit('call_error', {'message': '处理视频通话结束请求失败'}, room=request.sid)
