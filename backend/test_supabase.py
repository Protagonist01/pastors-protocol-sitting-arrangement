import traceback
from supabase import create_client

try:
    create_client('http://localhost:8000', '123')
except Exception as e:
    with open('trace.txt', 'w') as f:
        traceback.print_exc(file=f)
