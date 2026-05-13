from django.contrib import admin
from .models import Medicamento, Paciente

@admin.register(Medicamento)
class MedicamentoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'dosagem', 'quantidade', 'estoque_critico')
    search_fields = ('nome',)

@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = ('nome', 'documento')
    search_fields = ('nome', 'documento')