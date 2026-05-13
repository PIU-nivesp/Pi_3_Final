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
        const formPaciente = ref({ nome: '', documento: '' });
        const formEntrada = ref({ medicamentoId: '', quantidade: 1 });
        const formSaida = ref({ medicamentoId: '', pacienteId: '', quantidade: 1, endereco: '', telefone: '', crm: '', nomeMedico: '' });

        // --- COMPUTED PROPERTIES ---
        const filteredMedicamentos = computed(() => {
            if (!medicamentos.value) return [];
            const q = searchQuery.value.toLowerCase();
            return medicamentos.value.filter(m => m.nome.toLowerCase().includes(q));
        });

        const medicamentosEmAlerta = computed(() => 
            medicamentos.value.filter(m => m.quantidade <= m.estoque_critico && m.quantidade > 0)
        );

        const medicamentosEmFalta = computed(() => 
            medicamentos.value.filter(m => m.quantidade <= 0)
        );

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
                    const [meds, pacs] = await Promise.all([
                        ApiService.getMedicamentos(),
                        ApiService.getPacientes()
                    ]);
                    medicamentos.value = Array.isArray(meds) ? meds : [];
                    pacientes.value = Array.isArray(pacs) ? pacs : [];
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

        const handleLogin = () => { isAuthenticated.value = true; };
        const handleLogout = () => { isAuthenticated.value = false; };

        onMounted(async () => {
            await loadData();
        });

        // --- RETORNO PARA O TEMPLATE (CRUCIAL PARA FUNCIONAR) ---
        return {
            isAuthenticated, isLoggingIn, loginForm, handleLogin, handleLogout,
            medicamentos, pacientes, movimentos, searchQuery, filteredMedicamentos,
            medicamentosEmAlerta, medicamentosEmFalta,
            showSidebar, activeSideTab, toggleSidebar, setSideTab,
            showA11yPanel, highContrast, fontSizeRem, toggleA11yPanel, toggleHighContrast, adjustFontSize,
            currentModal, openModal, closeModal,
            formMedicamento, formPaciente, formEntrada, formSaida,
            saveMedicamento, savePaciente, registrarEntrada, registrarSaida
        };
    }
}).mount('#app');