import os
from django.core.wsgi import get_wsgi_application
from django.core.management import call_command

# Define o módulo de definições padrão para o Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Tenta rodar as migrações automaticamente ao iniciar o servidor (importante para Vercel + SQLite)
try:
    call_command('migrate', interactive=False)
except Exception as e:
    print(f"Erro ao rodar migrações: {e}")

# Esta é a variável que o Vercel e o servidor WSGI procuram
application = get_wsgi_application()