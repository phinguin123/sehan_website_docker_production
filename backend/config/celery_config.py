# Use 'redis' hostname in Docker, 'localhost' for local development
import os
redis_host = os.environ.get('REDIS_HOST', 'redis')  # Default to 'redis' for Docker
broker_url = f'redis://{redis_host}:6379/0'
result_backend = f'redis://{redis_host}:6379/1'
task_serializer = 'json'
accept_content = ['json']
result_serializer = 'json'
timezone = 'Asia/Seoul'
enable_utc = True
