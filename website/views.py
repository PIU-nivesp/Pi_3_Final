import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.management import call_command
from io import StringIO
from .models import Medicamento, Paciente, Movimentacao, Relatorio# 1. Renderiza a página HTML
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

def api_relatorios(request):
    relatorios = list(Relatorio.objects.all().order_by('-data_geracao').values('id', 'titulo', 'tipo', 'data_geracao'))
    return JsonResponse(relatorios, safe=False)

def api_get_relatorio(request, id):
    rel = get_object_or_404(Relatorio, id=id)
    return JsonResponse({
        'id': rel.id,
        'titulo': rel.titulo,
        'tipo': rel.tipo,
        'conteudo': rel.conteudo,
        'data_geracao': rel.data_geracao
    })

# 3. APIs de Criação e Atualização
@csrf_exempt
def api_save_medicamento(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        med = Medicamento.objects.create(
            nome=data.get('nome'),
            dosagem=data.get('dosagem'),
            quantidade=data.get('quantidade', 0),
            estoque_critico=data.get('estoque_critico', 10),
            tipo=data.get('tipo'),
            unidade_dosagem=data.get('unidade_dosagem'),
            quantidade_por_caixa=data.get('quantidade_por_caixa', 1),
            fabricante=data.get('fabricante'),
            lote=data.get('lote'),
            validade=data.get('validade') if data.get('validade') else None
        )
        return JsonResponse({'status': 'ok', 'id': med.id})

@csrf_exempt
def api_save_relatorio(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        rel = Relatorio.objects.create(
            titulo=data.get('titulo'),
            tipo=data.get('tipo'),
            conteudo=data.get('conteudo')
        )
        return JsonResponse({'status': 'ok', 'id': rel.id})

@csrf_exempt
def api_save_paciente(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        pac_id = data.get('id')
        
        if pac_id:
            pac = get_object_or_404(Paciente, id=pac_id)
            pac.nome = data.get('nome')
            pac.documento = data.get('documento')
            pac.endereco = data.get('endereco', pac.endereco)
            pac.telefone = data.get('telefone', pac.telefone)
            pac.save()
        else:
            pac = Paciente.objects.create(
                nome=data.get('nome'),
                documento=data.get('documento'),
                endereco=data.get('endereco', ''),
                telefone=data.get('telefone', '')
            )
        return JsonResponse({'status': 'ok', 'id': pac.id})

@csrf_exempt
def api_delete_paciente(request, id):
    if request.method == 'POST' or request.method == 'DELETE':
        pac = get_object_or_404(Paciente, id=id)
        pac.delete()
        return JsonResponse({'status': 'ok'})

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

        if tipo == 'entrada':
            med.quantidade += qtd
            db_tipo = 'ENTRADA'
            # Atualiza dados do lote no medicamento (opcional, mas solicitado pelo contexto de 'current' stock)
            if data.get('fabricante'): med.fabricante = data.get('fabricante')
            if data.get('lote'): med.lote = data.get('lote')
            if data.get('validade'): med.validade = data.get('validade')
            if data.get('tipo_med'): med.tipo = data.get('tipo_med')
            if data.get('unidade_dosagem'): med.unidade_dosagem = data.get('unidade_dosagem')
            if data.get('quantidade_por_caixa'): med.quantidade_por_caixa = data.get('quantidade_por_caixa')
        else:
            if med.quantidade < qtd:
                return JsonResponse({'error': 'Estoque insuficiente'}, status=400)
            med.quantidade -= qtd
            db_tipo = 'SAIDA'
        
        med.save()

        # Cria o registro da movimentação com os novos campos
        Movimentacao.objects.create(
            medicamento=med,
            paciente=pac,
            quantidade=qtd,
            tipo=db_tipo,
            endereco=data.get('endereco') or (pac.endereco if pac else ''),
            telefone_contato=data.get('telefone') or (pac.telefone if pac else ''),
            crm=data.get('crm'),
            nome_medico=data.get('nome_medico'),
            fabricante=data.get('fabricante'),
            lote=data.get('lote'),
            validade=data.get('validade') if data.get('validade') else None
        )

        return JsonResponse({'status': 'ok', 'nova_quantidade': med.quantidade})

def run_migrations_view(request):
    out = StringIO()
    try:
        call_command('migrate', interactive=False, stdout=out)
        result = out.getvalue()
        return JsonResponse({'status': 'success', 'output': result})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})