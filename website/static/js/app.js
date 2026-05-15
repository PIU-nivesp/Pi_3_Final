const { createApp, ref, computed, onMounted, watch } = Vue;

const CapsLogo = {
    template: `
        <div class="relative w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="logo-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#06b6d4" />
                        <stop offset="100%" stop-color="#1e3a8a" />
                    </linearGradient>
                    <style>
                        .draw-path {
                            stroke-dasharray: 250;
                            stroke-dashoffset: 250;
                            animation: draw 2s ease-in-out forwards;
                        }
                        .draw-fill {
                            opacity: 0;
                            animation: fadeIn 1s ease-out 1.2s forwards;
                        }
                        @keyframes draw {
                            to { stroke-dashoffset: 0; }
                        }
                        @keyframes fadeIn {
                            to { opacity: 1; }
                        }
                    </style>
                </defs>
                
                <!-- Coração -->
                <path class="draw-path" d="M 50 30 C 35 15 15 25 20 45 C 23 58 35 65 45 70" stroke="url(#logo-grad)" stroke-width="4.5" stroke-linecap="round" />
                
                <!-- Mão / Palma e Dedo -->
                <path class="draw-path" d="M 15 65 C 30 85 65 85 85 60 C 90 55 85 45 80 50 C 70 60 55 65 40 60" stroke="url(#logo-grad)" stroke-width="4.5" stroke-linecap="round" style="animation-delay: 0.2s" />
                
                <!-- Mão / Linha Inferior -->
                <path class="draw-path" d="M 25 80 C 40 90 60 85 75 70" stroke="url(#logo-grad)" stroke-width="4.5" stroke-linecap="round" style="animation-delay: 0.4s" />
                
                <!-- Pílula -->
                <g transform="translate(55, 45) rotate(50) translate(-55, -45)">
                    <rect class="draw-path" x="40" y="15" width="30" height="60" rx="15" stroke="url(#logo-grad)" stroke-width="4.5" style="animation-delay: 0.5s" />
                    <line class="draw-path" x1="40" y1="45" x2="70" y2="45" stroke="url(#logo-grad)" stroke-width="4.5" style="animation-delay: 0.7s" />
                    <path class="draw-fill" d="M 40 45 L 70 45 L 70 60 A 15 15 0 0 1 40 60 Z" fill="url(#logo-grad)" />
                    <path class="draw-path" d="M 47 25 A 8 8 0 0 1 60 20" stroke="#ffffff" stroke-width="3" stroke-linecap="round" style="animation-delay: 0.9s" />
                </g>
            </svg>
        </div>
    `
};

createApp({
    setup() {
        // --- ESTADO DE AUTENTICAÇÃO ---
        const isAuthenticated = ref(true); // Definido como true para testes no PI
        const isLoggingIn = ref(false);
        const loginForm = ref({ user: '', password: '' });

        // --- ESTADOS DO DASHBOARD ---
        const medicamentos = ref([]);
        const pacientes = ref([]);
        const movimentos = ref([]);
        const relatorios = ref([]);
        const searchQuery = ref('');
        const currentModal = ref(null);
        const isLoading = ref(false);

        // --- SIDEBAR ---
        const showSidebar = ref(true);
        const activeSideTab = ref('dashboard'); // 'dashboard' | 'medicamentos' | 'pacientes'
        const toggleSidebar = () => { showSidebar.value = !showSidebar.value; };
        const setSideTab = (tab) => { 
            activeSideTab.value = tab; 
            // Fecha a sidebar ao clicar em um item no mobile
            if (window.innerWidth < 768) {
                showSidebar.value = false;
            }
        };

        // --- ACESSIBILIDADE ---
        const showA11yPanel = ref(false);
        const colorMode = ref(localStorage.getItem('caps-a11y-color') || 'default');
        const fontSizeRem = ref(parseFloat(localStorage.getItem('caps-a11y-font-size')) || 1);
        const isBold = ref(localStorage.getItem('caps-a11y-bold') === 'true');

        const applyA11y = () => {
            const html = document.documentElement;
            html.classList.remove('high-contrast', 'monochrome', 'bold-text');
            
            if (colorMode.value === 'high-contrast') html.classList.add('high-contrast');
            if (colorMode.value === 'monochrome') html.classList.add('monochrome');
            if (isBold.value) html.classList.add('bold-text');
            
            html.style.fontSize = fontSizeRem.value + 'rem';
            
            localStorage.setItem('caps-a11y-color', colorMode.value);
            localStorage.setItem('caps-a11y-font-size', fontSizeRem.value);
            localStorage.setItem('caps-a11y-bold', isBold.value);
        };

        // --- FORMULÁRIOS ---
        const formMedicamento = ref({ id: null, nome: '', dosagem: '', quantidade: 0, estoque_critico: 10, tipo: 'COMPRIMIDO', unidade_dosagem: 'MG', quantidade_por_caixa: 1, fabricante: '', lote: '', validade: '' });
        const formPaciente = ref({ id: null, nome: '', documento: '', endereco: '', telefone: '' });
        const formEntrada = ref({ medicamentoId: '', quantidade: 1, qtd_caixas: 1, unidades_por_caixa: 1, fabricante: '', lote: '', validade: '', tipo: 'COMPRIMIDO', unidade_dosagem: 'MG' });
        const formSaida = ref({ medicamentoId: '', pacienteId: '', quantidade: 1, endereco: '', telefone: '', crm: '', nomeMedico: '' });
        const formRelatorio = ref({ tipo: '1', pacienteId: '', medicamentoId: '' });
        const relatorioAberto = ref(null);

        // --- COMPUTED PROPERTIES ---
        const filteredMedicamentos = computed(() => {
            if (!medicamentos.value) return [];
            const q = searchQuery.value.toLowerCase();
            return medicamentos.value.filter(m => m.nome.toLowerCase().includes(q));
        });

        const filteredPacientes = computed(() => {
            if (!pacientes.value) return [];
            const q = searchQuery.value.toLowerCase();
            return pacientes.value.filter(p => p.nome.toLowerCase().includes(q) || p.documento.toLowerCase().includes(q));
        });

        const medicamentosEmAlerta = computed(() => 
            medicamentos.value.filter(m => m.quantidade <= m.estoque_critico && m.quantidade > 0)
        );

        const medicamentosEmFalta = computed(() => 
            medicamentos.value.filter(m => m.quantidade <= 0)
        );

        const selectedPacienteInfo = computed(() => {
            if (!formSaida.value.pacienteId) return null;
            return pacientes.value.find(p => p.id === formSaida.value.pacienteId);
        });

        const calcularTotalEntrada = computed(() => {
            return formEntrada.value.qtd_caixas * formEntrada.value.unidades_por_caixa;
        });

        const calcularCaixasSaida = computed(() => {
            if (!formSaida.value.medicamentoId || !formSaida.value.quantidade) return null;
            const med = medicamentos.value.find(m => m.id === formSaida.value.medicamentoId);
            if (!med || !med.quantidade_por_caixa || med.quantidade_por_caixa <= 0) return null;
            
            const qtd = formSaida.value.quantidade;
            const porCaixa = med.quantidade_por_caixa;
            
            const caixas = Math.floor(qtd / porCaixa);
            const resto = qtd % porCaixa;
            
            return { caixas, resto, porCaixa };
        });

        // --- MÉTODOS DE MODAL ---
        const openModal = (tipo) => { currentModal.value = tipo; };
        const closeModal = () => { currentModal.value = null; };

        // --- MÉTODOS DE ACESSIBILIDADE ---
        const toggleA11yPanel = () => { showA11yPanel.value = !showA11yPanel.value; };
        const setColorMode = (mode) => { colorMode.value = mode; applyA11y(); };
        const toggleBold = () => { isBold.value = !isBold.value; applyA11y(); };
        const adjustFontSize = (delta) => { 
            fontSizeRem.value = Math.round((fontSizeRem.value + delta) * 10) / 10;
            fontSizeRem.value = Math.max(0.8, Math.min(1.5, fontSizeRem.value)); 
            applyA11y();
        };

        // --- MÉTODOS DE DADOS (API) ---
        const loadData = async () => {
            isLoading.value = true;
            try {
                if (typeof ApiService !== 'undefined') {
                    // Carrega ambas as listas em paralelo para manter o sidebar sincronizado
                    const [meds, pacs, rels, movs] = await Promise.all([
                        ApiService.getMedicamentos(),
                        ApiService.getPacientes(),
                        ApiService.getRelatorios(),
                        ApiService.getMovimentos()
                    ]);
                    medicamentos.value = Array.isArray(meds) ? meds : [];
                    pacientes.value = Array.isArray(pacs) ? pacs : [];
                    relatorios.value = Array.isArray(rels) ? rels : [];
                    movimentos.value = Array.isArray(movs) ? movs : [];
                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
                medicamentos.value = [];
                pacientes.value = [];
            } finally {
                isLoading.value = false;
            }
        };

        const saveMedicamento = async () => {
            isLoading.value = true;
            try {
                await ApiService.saveMedicamento(formMedicamento.value);
                medicamentos.value = await ApiService.getMedicamentos();
                closeModal();
                formMedicamento.value = { id: null, nome: '', dosagem: '', quantidade: 0, estoque_critico: 10, tipo: 'COMPRIMIDO', unidade_dosagem: 'MG', quantidade_por_caixa: 1, fabricante: '', lote: '', validade: '' };
            } finally { isLoading.value = false; }
        };

        const editMedicamento = (med) => {
            formMedicamento.value = { ...med };
            openModal('novo-medicamento');
        };

        const deleteMedicamento = async (id) => {
            if (confirm('Tem certeza que deseja excluir este medicamento? Esta ação não pode ser desfeita.')) {
                isLoading.value = true;
                try {
                    const res = await ApiService.deleteMedicamento(id);
                    if (res) {
                        medicamentos.value = await ApiService.getMedicamentos();
                    }
                } finally { isLoading.value = false; }
            }
        };

        const savePaciente = async () => {
            isLoading.value = true;
            try {
                await ApiService.savePaciente(formPaciente.value);
                pacientes.value = await ApiService.getPacientes();
                closeModal();
                formPaciente.value = { id: null, nome: '', documento: '', endereco: '', telefone: '' };
            } finally { isLoading.value = false; }
        };

        const editPaciente = (pac) => {
            formPaciente.value = { ...pac };
            openModal('novo-paciente');
        };

        const deletePaciente = async (id) => {
            if (confirm('Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.')) {
                isLoading.value = true;
                try {
                    const res = await ApiService.deletePaciente(id);
                    if (res) {
                        pacientes.value = await ApiService.getPacientes();
                    }
                } finally { isLoading.value = false; }
            }
        };

        // Watcher para preencher dados do medicamento na entrada
        watch(() => formEntrada.value.medicamentoId, (newId) => {
            if (!newId) return;
            const med = medicamentos.value.find(m => m.id === newId);
            if (med) {
                formEntrada.value.unidades_por_caixa = med.quantidade_por_caixa || 1;
                formEntrada.value.tipo = med.tipo || 'COMPRIMIDO';
                formEntrada.value.unidade_dosagem = med.unidade_dosagem || 'MG';
                formEntrada.value.fabricante = med.fabricante || '';
            }
        });

        const registrarEntrada = async () => {
            isLoading.value = true;
            try {
                const total = formEntrada.value.qtd_caixas * formEntrada.value.unidades_por_caixa;
                await ApiService.updateEstoque(formEntrada.value.medicamentoId, total, 'entrada', null, {
                    fabricante: formEntrada.value.fabricante,
                    lote: formEntrada.value.lote,
                    validade: formEntrada.value.validade,
                    tipo_med: formEntrada.value.tipo,
                    unidade_dosagem: formEntrada.value.unidade_dosagem,
                    quantidade_por_caixa: formEntrada.value.unidades_por_caixa
                });
                await loadData();
                closeModal();
                formEntrada.value = { medicamentoId: '', quantidade: 1, qtd_caixas: 1, unidades_por_caixa: 1, fabricante: '', lote: '', validade: '', tipo: 'COMPRIMIDO', unidade_dosagem: 'MG' };
            } finally { isLoading.value = false; }
        };

        const registrarSaida = async () => {
            isLoading.value = true;
            try {
                await ApiService.updateEstoque(
                    formSaida.value.medicamentoId, 
                    formSaida.value.quantidade, 
                    'saida', 
                    formSaida.value.pacienteId,
                    {
                        endereco: formSaida.value.endereco,
                        telefone: formSaida.value.telefone,
                        crm: formSaida.value.crm,
                        nome_medico: formSaida.value.nomeMedico
                    }
                );
                await loadData();
                closeModal();
            } finally { isLoading.value = false; }
        };

        const gerarRelatorio = async () => {
            let titulo = '';
            let dadosJson = [];
            const movs = movimentos.value;
            const t = formRelatorio.value.tipo;
            
            if (t === '1') {
                const pac = pacientes.value.find(p => p.id === formRelatorio.value.pacienteId);
                titulo = `Relatório por Paciente: ${pac ? pac.nome : ''}`;
                dadosJson = movs.filter(m => m.paciente__nome === (pac ? pac.nome : ''));
            } else if (t === '2') {
                titulo = 'Relatório de Todos os Pacientes';
                dadosJson = movs.filter(m => m.paciente__nome);
            } else if (t === '3') {
                const med = medicamentos.value.find(m => m.id === formRelatorio.value.medicamentoId);
                titulo = `Relatório por Medicamento: ${med ? med.nome : ''}`;
                dadosJson = movs.filter(m => m.medicamento__nome === (med ? med.nome : ''));
            } else if (t === '4') {
                titulo = 'Relatório de Todos os Medicamentos';
                dadosJson = movs;
            } else if (t === '5') {
                titulo = 'Relatório de Pacientes e Medicamentos';
                dadosJson = movs;
            }

            isLoading.value = true;
            try {
                const novoRel = await ApiService.saveRelatorio({
                    titulo,
                    tipo: t,
                    conteudo: JSON.stringify(dadosJson)
                });

                if (novoRel) {
                    await loadData();
                    closeModal();
                    abrirRelatorio(novoRel.id);
                }
            } finally { isLoading.value = false; }
        };

        const abrirRelatorio = async (id) => {
            isLoading.value = true;
            try {
                const rel = await ApiService.getRelatorio(id);
                if (rel) {
                    rel.conteudoData = JSON.parse(rel.conteudo);
                    relatorioAberto.value = rel;
                    openModal('visualizar-relatorio');
                }
            } finally { isLoading.value = false; }
        };

        const printRelatorio = () => {
            window.print();
        };

        const handleLogin = () => { isAuthenticated.value = true; };
        const handleLogout = () => { isAuthenticated.value = false; };

        onMounted(async () => {
            applyA11y();
            await loadData();
        });

        // --- RETORNO PARA O TEMPLATE (CRUCIAL PARA FUNCIONAR) ---
        return {
            isAuthenticated, isLoggingIn, loginForm, handleLogin, handleLogout, isLoading,
            medicamentos, pacientes, movimentos, searchQuery, filteredMedicamentos, filteredPacientes,
            medicamentosEmAlerta, medicamentosEmFalta, selectedPacienteInfo,
            showSidebar, activeSideTab, toggleSidebar, setSideTab,
            showA11yPanel, colorMode, fontSizeRem, isBold, toggleA11yPanel, setColorMode, toggleBold, adjustFontSize,
            currentModal, openModal, closeModal,
            formMedicamento, formPaciente, formEntrada, formSaida, formRelatorio, relatorioAberto,
            relatorios, gerarRelatorio, abrirRelatorio, printRelatorio,
            saveMedicamento, editMedicamento, deleteMedicamento, savePaciente, editPaciente, deletePaciente, registrarEntrada, registrarSaida,
            calcularTotalEntrada, calcularCaixasSaida
        };
    }
})
.component('caps-logo', CapsLogo)
.mount('#app');