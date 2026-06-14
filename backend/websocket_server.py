import websockets
import json
import queue
import asyncio

connected_clients = set()

message_queue = queue.Queue()

async def handler(websocket):

    connected_clients.add(websocket)

    print("Frontend connected.")

    try:

        async for message in websocket:

            print("Received:", message)

            data = json.loads(message)

            if data["type"] == "user_message":

                message_queue.put(
                    data["text"]
                )

    except:
        pass

    finally:

        connected_clients.remove(websocket)

        print("Frontend disconnected.")


async def broadcast(data):

    if connected_clients:

        message = json.dumps(data)

        await asyncio.gather(
            *[
                client.send(message)
                for client in connected_clients
            ]
        )