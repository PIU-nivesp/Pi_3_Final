from django.db import models

class Medicamento(models.Model):
    nome = models.CharField(max_length=100, verbose_name="Nome do Medicamento")
    dosagem = models.CharField(max_length=50, verbose_name="Dosagem")
    quantidade = models.IntegerField(default=0, verbose_name="Quantidade em Estoque")
    # Usamos snake_case para bater com o que configuramos na View e no Index
    estoque_critico = models.IntegerField(default=10, verbose_name="Nível de Alerta")
    
    # Novos campos para calculadora e rastreio
    tipo = models.CharField(max_length=20, choices=[('COMPRIMIDO', 'Comprimido'), ('GOTA', 'Gota')], blank=True, null=True, verbose_name="Tipo")
    unidade_dosagem = models.CharField(max_length=20, choices=[('MG', 'mg'), ('ML', 'ml'), ('CAPSULA', 'Cápsula')], blank=True, null=True, verbose_name="Unidade de Dosagem")
    quantidade_por_caixa = models.IntegerField(default=1, verbose_name="Quantidade por Caixa")
    fabricante = models.CharField(max_length=100, blank=True, null=True, verbose_name="Fabricante")
    lote = models.CharField(max_length=50, blank=True, null=True, verbose_name="Lote")
    validade = models.DateField(blank=True, null=True, verbose_name="Validade")

    def __str__(self):
        return f"{self.nome} ({self.dosagem})"

    class Meta:
        verbose_name = "Medicamento"
        verbose_name_plural = "Medicamentos"

class Paciente(models.Model):
    nome = models.CharField(max_length=200, verbose_name="Nome Completo")
    documento = models.CharField(max_length=20, unique=True, verbose_name="CPF ou Prontuário")
    endereco = models.CharField(max_length=255, blank=True, null=True, verbose_name="Endereço")
    telefone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefone de Contato")
    medicamentos_em_uso = models.TextField(blank=True, null=True, verbose_name="Medicamentos em Uso")
    medico_prescritor = models.CharField(max_length=150, blank=True, null=True, verbose_name="Médico Prescritor")
    crm_medico = models.CharField(max_length=50, blank=True, null=True, verbose_name="CRM do Médico")

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = "Paciente"
        verbose_name_plural = "Pacientes"

class Movimentacao(models.Model):
    TIPO_CHOICES = [
        ('ENTRADA', 'Entrada'),
        ('SAIDA', 'Saída (Baixa)'),
    ]

    medicamento = models.ForeignKey(Medicamento, on_delete=models.CASCADE, verbose_name="Medicamento")
    paciente = models.ForeignKey(Paciente, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Paciente")
    quantidade = models.IntegerField(verbose_name="Quantidade")
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, verbose_name="Tipo de Movimentação")
    data = models.DateTimeField(auto_now_add=True, verbose_name="Data/Hora")
    
    # Novos campos solicitados
    endereco = models.CharField(max_length=255, blank=True, null=True, verbose_name="Endereço")
    telefone_contato = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefone de Contato")
    
    # Detalhes da Entrada (Batch)
    fabricante = models.CharField(max_length=100, blank=True, null=True, verbose_name="Fabricante")
    lote = models.CharField(max_length=50, blank=True, null=True, verbose_name="Lote")
    validade = models.DateField(blank=True, null=True, verbose_name="Validade")

    def __str__(self):
        return f"{self.tipo} - {self.medicamento.nome} ({self.quantidade})"

    class Meta:
        verbose_name = "Movimentação"
        verbose_name_plural = "Movimentações"

class Relatorio(models.Model):
    titulo = models.CharField(max_length=200, verbose_name="Título do Relatório")
    tipo = models.CharField(max_length=50, verbose_name="Tipo")
    conteudo = models.TextField(verbose_name="Conteúdo JSON")
    data_geracao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Geração")

    def __str__(self):
        return self.titulo

    class Meta:
        verbose_name = "Relatório"
        verbose_name_plural = "Relatórios"