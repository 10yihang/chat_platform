import asyncio
import websockets
import json

# 存储所有连接的clients
connected_clients = set()

async def handle_client(websocket):
    """处理客户端连接"""
    # 添加新连接到集合
    connected_clients.add(websocket)
    print(f"New client connected. Total clients: {len(connected_clients)}")
    
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
                await websocket.send(json.dumps({
                    'status': 'error',
                    'message': 'Invalid JSON format'
                }))
                
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    finally:
        connected_clients.remove(websocket)
        print(f"Client removed. Total clients: {len(connected_clients)}")

async def main():
    server = await websockets.serve(
        handle_client,
        "localhost",
        8765,
        ping_interval=None
    )
    print("WebSocket server started on ws://localhost:8765")
    await server.wait_closed()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nServer stopped by user")