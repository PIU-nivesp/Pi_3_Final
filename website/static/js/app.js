const { createApp, ref, computed, onMounted } = Vue;

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

        // --- SIDEBAR ---
        const showSidebar = ref(true);
        const activeSideTab = ref('dashboard'); // 'dashboard' | 'medicamentos' | 'pacientes'
        const toggleSidebar = () => { showSidebar.value = !showSidebar.value; };
        const setSideTab = (tab) => { activeSideTab.value = tab; showSidebar.value = true; };

        // --- ACESSIBILIDADE ---
        const showA11yPanel = ref(false);
        const highContrast = ref(false);
        const fontSizeRem = ref(1);

        // --- FORMULÁRIOS ---
        const formMedicamento = ref({ nome: '', dosagem: '', quantidade: 0, estoque_critico: 10 });
        const formPaciente = ref({ id: null, nome: '', documento: '', endereco: '', telefone: '' });
        const formEntrada = ref({ medicamentoId: '', quantidade: 1 });
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

        // --- MÉTODOS DE MODAL ---
        const openModal = (tipo) => { currentModal.value = tipo; };
        const closeModal = () => { currentModal.value = null; };

        // --- MÉTODOS DE ACESSIBILIDADE ---
        const toggleA11yPanel = () => { showA11yPanel.value = !showA11yPanel.value; };
        const toggleHighContrast = () => { highContrast.value = !highContrast.value; };
        const adjustFontSize = (delta) => { fontSizeRem.value = Math.max(0.8, Math.min(1.5, fontSizeRem.value + delta)); };

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
        };

        const savePaciente = async () => {
            await ApiService.savePaciente(formPaciente.value);
            // Atualiza lista de pacientes
            pacientes.value = await ApiService.getPacientes();
            closeModal();
            formPaciente.value = { id: null, nome: '', documento: '', endereco: '', telefone: '' };
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

        const registrarEntrada = async () => {
            await ApiService.updateEstoque(formEntrada.value.medicamentoId, formEntrada.value.quantidade, 'entrada');
            await loadData();
            closeModal();
        };

        const registrarSaida = async () => {
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
            await loadData();
        });

        // --- RETORNO PARA O TEMPLATE (CRUCIAL PARA FUNCIONAR) ---
        return {
            isAuthenticated, isLoggingIn, loginForm, handleLogin, handleLogout,
            medicamentos, pacientes, movimentos, searchQuery, filteredMedicamentos, filteredPacientes,
            medicamentosEmAlerta, medicamentosEmFalta, selectedPacienteInfo,
            showSidebar, activeSideTab, toggleSidebar, setSideTab,
            showA11yPanel, highContrast, fontSizeRem, toggleA11yPanel, toggleHighContrast, adjustFontSize,
            currentModal, openModal, closeModal,
            formMedicamento, formPaciente, formEntrada, formSaida, formRelatorio, relatorioAberto,
            relatorios, gerarRelatorio, abrirRelatorio, printRelatorio,
            saveMedicamento, savePaciente, editPaciente, deletePaciente, registrarEntrada, registrarSaida
        };
    }
}).mount('#app');