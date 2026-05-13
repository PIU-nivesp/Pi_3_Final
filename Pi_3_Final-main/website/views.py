import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Medicamento, Paciente, Movimentacao

# 1. Renderiza a página HTML
def home(request):
    return render(request, 'index.html')

# 2. APIs de Listagem
def api_medicamentos(request):
    medicamentos = list(Medicamento.objects.all().values())
    return JsonResponse(medicamentos, safe=False)

def api_pacientes(request):
    pacientes = list(Paciente.objects.all().values())
    return JsonResponse(pacientes, safe=False)

def api_movimentacoes(request):
    movimentos = list(Movimentacao.objects.all().values('id', 'tipo', 'quantidade', 'data', 'medicamento__nome', 'paciente__nome'))
    return JsonResponse(movimentos, safe=False)

# 3. APIs de Criação e Atualização
@csrf_exempt
def api_save_medicamento(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        med = Medicamento.objects.create(
            nome=data.get('nome'),
            dosagem=data.get('dosagem'),
            quantidade=data.get('quantidade', 0),
            estoque_critico=data.get('estoque_critico', 10)
        )
        return JsonResponse({'status': 'ok', 'id': med.id})

@csrf_exempt
def api_save_paciente(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        pac = Paciente.objects.create(
            nome=data.get('nome'),
            documento=data.get('documento'),
            endereco=data.get('endereco', ''),
            telefone=data.get('telefone', '')
        )
        return JsonResponse({'status': 'ok', 'id': pac.id})

@csrf_exempt
def api_update_estoque(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        med_id = data.get('medicamento_id')
        qtd = int(data.get('quantidade', 0))
        tipo = data.get('tipo') # 'entrada' ou 'saida'
        pac_id = data.get('paciente_id')

        med = get_object_or_404(Medicamento, id=med_id)
        pac = Paciente.objects.filter(id=pac_id).first() if pac_id else None

        if tipo == 'saida':
            if med.quantidade < qtd:
                return JsonResponse({'error': 'Estoque insuficiente'}, status=400)
            med.quantidade -= qtd
            db_tipo = 'SAIDA'
        else:
            med.quantidade += qtd
            db_tipo = 'ENTRADA'
        
        med.save()

        # Cria o registro da movimentação com os novos campos
        Movimentacao.objects.create(
            medicamento=med,
            paciente=pac,
            quantidade=qtd,
            tipo=db_tipo,
            endereco=data.get('endereco'),
            telefone_contato=data.get('telefone'),
            crm=data.get('crm'),
            nome_medico=data.get('nome_medico')
        )

        return JsonResponse({'status': 'ok', 'nova_quantidade': med.quantidade})