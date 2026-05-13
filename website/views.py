from django.shortcuts import render
from django.http import JsonResponse
from .models import Medicamento, Paciente # Importa seus modelos

# 1. Renderiza a página HTML
def home(request):
    return render(request, 'index.html')

# 2. API que o Vue.js vai consultar para listar medicamentos
def api_medicamentos(request):
    # Pega todos os medicamentos e converte para uma lista de dicionários
    medicamentos = list(Medicamento.objects.all().values())
    return JsonResponse(medicamentos, safe=False)

# 3. API que o Vue.js vai consultar para listar pacientes
def api_pacientes(request):
    pacientes = list(Paciente.objects.all().values())
    return JsonResponse(pacientes, safe=False)