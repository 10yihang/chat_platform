import asyncio
import websockets
import json

# 存储所有连接的clients
connected_clients = set()

async def handle_client(websocket, path):
    """处理客户端连接"""
    # 添加新连接到集合
    connected_clients.add(websocket)
    try:
        while True:
            # 等待接收消息
            message = await websocket.recv()
            
            try:
                data = json.loads(message)
                # 处理GET请求
                if data.get('method') == 'GET':
                    response = {
                        'status': 'success',
                        'method': 'GET',
                        'data': {
                            'message': 'Hello from WebSocket Server!',
                            'timestamp': asyncio.get_event_loop().time()
                        }
                    }
                    await websocket.send(json.dumps(response))
                else:
                    # 回显收到的消息
                    await websocket.send(json.dumps({
                        'status': 'success',
                        'message': f'Echo: {message}'
                    }))
                    
            except json.JSONDecodeError:
                # 如果不是JSON格式，直接回显
                await websocket.send(f"Echo: {message}")
                
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    finally:
        # 移除断开的连接
        connected_clients.remove(websocket)

async def main():
    # 启动WebSocket服务器
    server = await websockets.serve(
        handle_client,
        "localhost",
        8765,
        ping_interval=None  # 禁用自动ping以保持长连接
    )
    print("WebSocket server started on ws://localhost:8765")
    await server.wait_closed()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped by user")