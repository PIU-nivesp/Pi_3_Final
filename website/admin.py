from django.contrib import admin
from .models import Medicamento, Paciente, Movimentacao

@admin.register(Medicamento)
class MedicamentoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'dosagem', 'quantidade', 'estoque_critico')
    search_fields = ('nome',)

@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = ('nome', 'documento', 'telefone')
    search_fields = ('nome', 'documento')

@admin.register(Movimentacao)
class MovimentacaoAdmin(admin.ModelAdmin):
    list_display = ('data', 'tipo', 'medicamento', 'paciente', 'quantidade')
    list_filter = ('tipo', 'data')