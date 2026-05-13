from django.db import models

class Medicamento(models.Model):
    nome = models.CharField(max_length=100, verbose_name="Nome do Medicamento")
    dosagem = models.CharField(max_length=50, verbose_name="Dosagem")
    quantidade = models.IntegerField(default=0, verbose_name="Quantidade em Estoque")
    # Usamos snake_case para bater com o que configuramos na View e no Index
    estoque_critico = models.IntegerField(default=10, verbose_name="Nível de Alerta")

    def __str__(self):
        return f"{self.nome} ({self.dosagem})"

    class Meta:
        verbose_name = "Medicamento"
        verbose_name_plural = "Medicamentos"

class Paciente(models.Model):
    nome = models.CharField(max_length=200, verbose_name="Nome Completo")
    documento = models.CharField(max_length=20, unique=True, verbose_name="CPF ou Prontuário")

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = "Paciente"
        verbose_name_plural = "Pacientes"