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
    path('api/medicamentos/novo/', views.api_save_medicamento, name='api_save_medicamento'),
    path('api/medicamentos/estoque/', views.api_update_estoque, name='api_update_estoque'),
    path('api/pacientes/', views.api_pacientes, name='api_pacientes'),
    path('api/pacientes/novo/', views.api_save_paciente, name='api_save_paciente'),
    path('api/movimentacoes/', views.api_movimentacoes, name='api_movimentacoes'),
    path('run-migrations/', views.run_migrations_view, name='run_migrations'),
]