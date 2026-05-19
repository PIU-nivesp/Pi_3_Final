const { createApp, ref, computed, onMounted, watch } = Vue;

createApp({
    setup() {
        // --- ESTADO DE CARREGAMENTO GLOBAL ---
        const isLoading = ref(false);
        const activeRequests = ref(0);

        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            activeRequests.value++;
            isLoading.value = true;
            try {
                return await originalFetch.apply(this, args);
            } finally {
                activeRequests.value--;
                if (activeRequests.value <= 0) {
                    activeRequests.value = 0;
                    isLoading.value = false;
                }
            }
        };

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
        const formPaciente = ref({ id: null, nome: '', documento: '', endereco: '', telefone: '', medicamentos_em_uso: '', medico_prescritor: '', crm_medico: '' });
        const formEntrada = ref({ medicamentoId: '', quantidade: 1, qtd_caixas: 1, unidades_por_caixa: 1, fabricante: '', lote: '', validade: '', tipo: 'COMPRIMIDO', unidade_dosagem: 'MG' });
        const formSaida = ref({ medicamentoId: '', pacienteId: '', quantidade: 1, endereco: '', telefone: '' });
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
        const openModal = (tipo) => { 
            if (tipo === 'novo-medicamento' && !formMedicamento.value.id) {
                formMedicamento.value = { id: null, nome: '', dosagem: '', quantidade: 0, estoque_critico: 10, tipo: 'COMPRIMIDO', unidade_dosagem: 'MG', quantidade_por_caixa: 1, fabricante: '', lote: '', validade: '' };
            }
            if (tipo === 'novo-paciente' && !formPaciente.value.id) {
                formPaciente.value = { id: null, nome: '', documento: '', endereco: '', telefone: '', medicamentos_em_uso: '', medico_prescritor: '', crm_medico: '' };
            }
            currentModal.value = tipo; 
        };
        const closeModal = () => { 
            currentModal.value = null; 
            // Limpa IDs ao fechar para que o próximo 'novo' abra limpo
            formMedicamento.value.id = null;
            formPaciente.value.id = null;
        };

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
            }
        };

        const saveMedicamento = async () => {
            await ApiService.saveMedicamento(formMedicamento.value);
            await loadData();
            closeModal();
            formMedicamento.value = { id: null, nome: '', dosagem: '', quantidade: 0, estoque_critico: 10, tipo: 'COMPRIMIDO', unidade_dosagem: 'MG', quantidade_por_caixa: 1, fabricante: '', lote: '', validade: '' };
        };

        const editMedicamento = (med) => {
            formMedicamento.value = { ...med };
            openModal('novo-medicamento');
        };

        const deleteMedicamento = async (id) => {
            if (confirm('Tem certeza que deseja excluir este medicamento? Esta ação não pode ser desfeita.')) {
                const res = await ApiService.deleteMedicamento(id);
                if (res) {
                    await loadData();
                }
            }
        };

        const savePaciente = async () => {
            await ApiService.savePaciente(formPaciente.value);
            // Atualiza lista de pacientes
            pacientes.value = await ApiService.getPacientes();
            closeModal();
            formPaciente.value = { id: null, nome: '', documento: '', endereco: '', telefone: '', medicamentos_em_uso: '', medico_prescritor: '', crm_medico: '' };
        };

        const editPaciente = (pac) => {
            formPaciente.value = { ...pac };
            openModal('novo-paciente');
        };

        const deletePaciente = async (id) => {
            if (confirm('Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.')) {
                const res = await ApiService.deletePaciente(id);
                if (res) {
                    pacientes.value = await ApiService.getPacientes();
                }
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
            // Reset form
            formEntrada.value = { medicamentoId: '', quantidade: 1, qtd_caixas: 1, unidades_por_caixa: 1, fabricante: '', lote: '', validade: '', tipo: 'COMPRIMIDO', unidade_dosagem: 'MG' };
        };

        const registrarSaida = async () => {
            await ApiService.updateEstoque(
                formSaida.value.medicamentoId, 
                formSaida.value.quantidade, 
                'saida', 
                formSaida.value.pacienteId,
                {
                    endereco: formSaida.value.endereco,
                    telefone: formSaida.value.telefone
                }
            );
            await loadData();
            closeModal();
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
        };

        const abrirRelatorio = async (id) => {
            const rel = await ApiService.getRelatorio(id);
            if (rel) {
                rel.conteudoData = JSON.parse(rel.conteudo);
                relatorioAberto.value = rel;
                openModal('visualizar-relatorio');
            }
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
            isLoading,
            isAuthenticated, isLoggingIn, loginForm, handleLogin, handleLogout,
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
}).mount('#app');