const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        // --- ESTADO DE AUTENTICAÇÃO ---
        const isAuthenticated = ref(false); 
        const isLoggingIn = ref(false);
        const loginForm = ref({ user: '', password: '' });

        // --- ESTADOS DO DASHBOARD ---
        const medicamentos = ref([]);
        const pacientes = ref([]);
        const movimentos = ref([]);
        const searchQuery = ref('');
        const currentModal = ref(null);

        // --- ACESSIBILIDADE ---
        const showA11yPanel = ref(false);
        const highContrast = ref(false);
        const fontSizeRem = ref(1);

        // --- FORMULÁRIOS ---
        const formMedicamento = ref({ nome: '', dosagem: '', quantidade: 0, estoque_critico: 10 });
        const formPaciente = ref({ nome: '', documento: '' });
        const formEntrada = ref({ medicamentoId: '', quantidade: 1 });
        const formSaida = ref({ medicamentoId: '', pacienteId: '', quantidade: 1 });

        // --- COMPUTED PROPERTIES ---
        const filteredMedicamentos = computed(() => {
            if (!medicamentos.value) return [];
            const q = searchQuery.value.toLowerCase();
            return medicamentos.value.filter(m => m.nome.toLowerCase().includes(q));
        });

        const medicamentosEmAlerta = computed(() => {
            if (!medicamentos.value) return 0;
            return medicamentos.value.filter(m => m.quantidade > 0 && m.quantidade <= m.estoque_critico).length;
        });

        const medicamentosEmFalta = computed(() => {
            if (!medicamentos.value) return 0;
            return medicamentos.value.filter(m => m.quantidade === 0).length;
        });

        // --- FUNÇÕES DE DADOS (API) ---
        const loadData = async () => {
            try {
                const resMed = await ApiService.getMedicamentos();
                medicamentos.value = Array.isArray(resMed) ? resMed : [];
                
                const resPac = await ApiService.getPacientes();
                pacientes.value = Array.isArray(resPac) ? resPac : [];
            } catch (e) {
                console.error("Erro ao carregar dados:", e);
            }
        };

        // --- FUNÇÕES DE LOGIN ---
        const handleLogin = () => {
            isLoggingIn.value = true;
            // Simula o tempo de login
            setTimeout(() => {
                isAuthenticated.value = true;
                isLoggingIn.value = false;
                loadData();
            }, 800);
        };

        const handleLogout = () => {
            isAuthenticated.value = false;
            loginForm.value = { user: '', password: '' };
        };

        // --- FUNÇÕES DE ACESSIBILIDADE ---
        const toggleA11yPanel = () => showA11yPanel.value = !showA11yPanel.value;
        
        const toggleHighContrast = () => {
            highContrast.value = !highContrast.value;
            if (highContrast.value) {
                document.body.classList.add('high-contrast');
            } else {
                document.body.classList.remove('high-contrast');
            }
        };

        const adjustFontSize = (delta) => {
            let newSize = fontSizeRem.value + (delta * 0.1);
            if (newSize >= 0.8 && newSize <= 1.5) {
                fontSizeRem.value = newSize;
                document.documentElement.style.fontSize = `${newSize * 16}px`;
            }
        };

        // --- FUNÇÕES DE MODAL E CADASTRO ---
        const openModal = (name) => currentModal.value = name;
        
        const closeModal = () => {
            currentModal.value = null;
            // Limpa os formulários ao fechar
            formMedicamento.value = { nome: '', dosagem: '', quantidade: 0, estoque_critico: 10 };
            formPaciente.value = { nome: '', documento: '' };
        };

        const saveMedicamento = async () => {
            await ApiService.saveMedicamento(formMedicamento.value);
            await loadData();
            closeModal();
        };

        const savePaciente = async () => {
            await ApiService.savePaciente(formPaciente.value);
            await loadData();
            closeModal();
        };

        const registrarEntrada = async () => {
            await ApiService.updateEstoque(formEntrada.value.medicamentoId, formEntrada.value.quantidade, 'entrada');
            await loadData();
            closeModal();
        };

        const registrarSaida = async () => {
            await ApiService.updateEstoque(formSaida.value.medicamentoId, formSaida.value.quantidade, 'saida', formSaida.value.pacienteId);
            await loadData();
            closeModal();
        };

        onMounted(() => { 
            // Inicialização
        });

        // TUDO que o HTML precisa usar DEVE estar aqui no return
        return {
            isAuthenticated, isLoggingIn, loginForm, handleLogin, handleLogout,
            medicamentos, pacientes, movimentos, searchQuery, filteredMedicamentos,
            medicamentosEmAlerta, medicamentosEmFalta, 
            showA11yPanel, highContrast, fontSizeRem, toggleA11yPanel, toggleHighContrast, adjustFontSize,
            currentModal, openModal, closeModal,
            formMedicamento, formPaciente, formEntrada, formSaida,
            saveMedicamento, savePaciente, registrarEntrada, registrarSaida
        };
    }
}).mount('#app');