from django.contrib import admin
from django.urls import path
from website import views  # Importação mais limpa para acessar todas as funções

urlpatterns = [
    # Painel Administrativo do Django
    path('admin/', admin.site.urls),
    
    # Rota da página principal (Dashboard)
    path('', views.home, name='home'),
    
    # --- ROTAS DE API (Ponte para o Vue.js) ---
    # Endereço: localhost:8000/api/medicamentos/
    path('api/medicamentos/', views.api_medicamentos, name='api_medicamentos'),
    
    # Endereço: localhost:8000/api/pacientes/
    path('api/pacientes/', views.api_pacientes, name='api_pacientes'),
]