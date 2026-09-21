import aiohttp
import asyncio
import json

async def stream_data():
    url = 'http://localhost:6969/api/v1/chat/graph-visualization-chat/2831d5c4-c6a7-43a8-aa97-d78bea14eb07'
    
    try:
        print('Sending request...')
        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                headers={
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                json={
                    'prompt': 'Create a visualisation for transactions in the last 7 days',
                }
            ) as response:
                if response.status != 200:
                    raise aiohttp.ClientError(f'HTTP error! status: {response.status}')

                # Process the streaming response
                buffer = ''
                async for chunk in response.content:
                    buffer += chunk.decode('utf-8')
                    lines = buffer.split('\n')
                    buffer = lines.pop()

                    for line in lines:
                        if line.startswith('data: '):
                            try:
                                data = line[6:]  # Remove 'data: ' prefix
                                if data == '[DONE]':
                                    print('Stream ended by server')
                                    return
                                
                                parsed_data = json.loads(data)
                                print('Received:', parsed_data)
                                
                                # Optional: Handle different message types
                                if 'type' in parsed_data:
                                    if parsed_data['type'] == 'assistant':
                                        print('Assistant:', parsed_data.get('content', ''))
                                    elif parsed_data['type'] == 'error':
                                        print('Error:', parsed_data.get('content', ''))
                                
                            except json.JSONDecodeError as e:
                                print('Error parsing JSON:', e)
                                print('Raw data:', data)

    except aiohttp.ClientError as e:
        print('Network error:', str(e))
    except Exception as e:
        print('Error:', str(e))

if __name__ == '__main__':
    print('Starting streaming data...')

    asyncio.run(stream_data())