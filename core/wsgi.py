import os
from django.core.wsgi import get_wsgi_application

# Define o módulo de definições padrão para o Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Esta é a variável que o Vercel e o servidor WSGI procuram
application = get_wsgi_application()