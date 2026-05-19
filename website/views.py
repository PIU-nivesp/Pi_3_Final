import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.management import call_command
from io import StringIO
from django.core.serializers.json import DjangoJSONEncoder
from .models import Medicamento, Paciente, Movimentacao, Relatorio# 1. Renderiza a página HTML
def home(request):
    return render(request, 'index.html')

# 2. APIs de Listagem
def api_medicamentos(request):
    medicamentos = list(Medicamento.objects.all().values())
    return JsonResponse(medicamentos, safe=False, encoder=DjangoJSONEncoder)

def api_pacientes(request):
    pacientes = list(Paciente.objects.all().values())
    return JsonResponse(pacientes, safe=False, encoder=DjangoJSONEncoder)

def api_movimentacoes(request):
    movimentos = list(Movimentacao.objects.all().values('id', 'tipo', 'quantidade', 'data', 'medicamento__nome', 'paciente__nome'))
    return JsonResponse(movimentos, safe=False, encoder=DjangoJSONEncoder)

def api_relatorios(request):
    relatorios = list(Relatorio.objects.all().order_by('-data_geracao').values('id', 'titulo', 'tipo', 'data_geracao'))
    return JsonResponse(relatorios, safe=False, encoder=DjangoJSONEncoder)

def api_get_relatorio(request, id):
    rel = get_object_or_404(Relatorio, id=id)
    return JsonResponse({
        'id': rel.id,
        'titulo': rel.titulo,
        'tipo': rel.tipo,
        'conteudo': rel.conteudo,
        'data_geracao': rel.data_geracao
    }, encoder=DjangoJSONEncoder)

# 3. APIs de Criação e Atualização
@csrf_exempt
def api_save_medicamento(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        med_id = data.get('id')
        
        if med_id:
            med = get_object_or_404(Medicamento, id=med_id)
            med.nome = data.get('nome')
            med.dosagem = data.get('dosagem')
            med.quantidade = data.get('quantidade', med.quantidade)
            med.estoque_critico = data.get('estoque_critico', med.estoque_critico)
            med.tipo = data.get('tipo', med.tipo)
            med.unidade_dosagem = data.get('unidade_dosagem', med.unidade_dosagem)
            med.quantidade_por_caixa = data.get('quantidade_por_caixa', med.quantidade_por_caixa)
            med.fabricante = data.get('fabricante', med.fabricante)
            med.lote = data.get('lote', med.lote)
            med.fornecedor = data.get('fornecedor', med.fornecedor)
            if 'validade' in data:
                med.validade = data.get('validade') if data.get('validade') else None
            med.save()
        else:
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
                fornecedor=data.get('fornecedor'),
                validade=data.get('validade') if data.get('validade') else None
            )
        return JsonResponse({'status': 'ok', 'id': med.id})

@csrf_exempt
def api_delete_medicamento(request, id):
    if request.method in ['POST', 'DELETE']:
        med = get_object_or_404(Medicamento, id=id)
        med.delete()
        return JsonResponse({'status': 'ok'})

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
            pac.medicamentos_em_uso = data.get('medicamentos_em_uso', pac.medicamentos_em_uso)
            pac.medico_prescritor = data.get('medico_prescritor', pac.medico_prescritor)
            pac.crm_medico = data.get('crm_medico', pac.crm_medico)
            pac.save()
        else:
            pac = Paciente.objects.create(
                nome=data.get('nome'),
                documento=data.get('documento'),
                endereco=data.get('endereco', ''),
                telefone=data.get('telefone', ''),
                medicamentos_em_uso=data.get('medicamentos_em_uso', ''),
                medico_prescritor=data.get('medico_prescritor', ''),
                crm_medico=data.get('crm_medico', '')
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
            fabricante=data.get('fabricante'),
            lote=data.get('lote'),
            validade=data.get('validade') if data.get('validade') else None
        )

        return JsonResponse({'status': 'ok', 'nova_quantidade': med.quantidade})

def run_migrations_view(request):
    out = StringIO()
    try:
        # Tenta aplicar as migrations
        call_command('showmigrations', stdout=out)
        call_command('migrate', interactive=False, stdout=out)
        
        # Garante que as colunas existam executando SQL bruto (útil se a migration foi marcada como aplicada mas falhou)
        from django.db import connection
        with connection.cursor() as cursor:
            try:
                cursor.execute("ALTER TABLE website_paciente ADD COLUMN medicamentos_em_uso text;")
                out.write("\nAdicionada coluna medicamentos_em_uso.")
            except Exception as e:
                out.write(f"\nColuna medicamentos_em_uso possivelmente ja existe: {str(e)}")
                
            try:
                cursor.execute("ALTER TABLE website_paciente ADD COLUMN medico_prescritor varchar(150);")
                out.write("\nAdicionada coluna medico_prescritor.")
            except Exception as e:
                out.write(f"\nColuna medico_prescritor possivelmente ja existe: {str(e)}")
                
            try:
                cursor.execute("ALTER TABLE website_paciente ADD COLUMN crm_medico varchar(50);")
                out.write("\nAdicionada coluna crm_medico.")
            except Exception as e:
                out.write(f"\nColuna crm_medico possivelmente ja existe: {str(e)}")

        result = out.getvalue()
        return JsonResponse({'status': 'success', 'output': result})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})