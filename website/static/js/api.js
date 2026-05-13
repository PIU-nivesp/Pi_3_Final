/**
 * ApiService
 * Camada de Abstração para comunicação com o Backend Django
 */
class ApiService {
    // MOCK DATA (Fallback para caso o servidor esteja offline)
    static mockMedicamentos = [
        { id: 1, nome: 'Sertralina', dosagem: '50mg', quantidade: 500, estoque_critico: 100 },
        { id: 2, nome: 'Diazepam', dosagem: '10mg', quantidade: 50, estoque_critico: 20 }
    ];

    // --- MEDICAMENTOS ---
    static async getMedicamentos() {
        try {
            const response = await fetch('/api/medicamentos/');
            if (!response.ok) throw new Error('Erro ao buscar dados');
            return await response.json();
        } catch (error) {
            console.error("Usando fallback (Mock):", error);
            return this.mockMedicamentos;
        }
    }

    static async saveMedicamento(medicamento) {
        try {
            const response = await fetch('/api/medicamentos/novo/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': window.CSRF_TOKEN // Essencial para o Django não bloquear a requisição
                },
                body: JSON.stringify(medicamento)
            });
            if (!response.ok) throw new Error('Erro ao salvar medicamento');
            return await response.json();
        } catch (error) {
            console.error("Erro na API:", error);
            return null;
        }
    }

    // --- PACIENTES ---
    static async getPacientes() {
        try {
            const response = await fetch('/api/pacientes/');
            if (!response.ok) throw new Error('Erro ao buscar pacientes');
            return await response.json();
        } catch (e) { 
            console.error("Erro ao carregar pacientes:", e);
            return []; 
        }
    }

    static async savePaciente(paciente) {
        try {
            const response = await fetch('/api/pacientes/novo/', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'X-CSRFToken': window.CSRF_TOKEN 
                },
                body: JSON.stringify(paciente)
            });
            if (!response.ok) throw new Error('Erro ao salvar paciente');
            return await response.json();
        } catch (error) {
            console.error("Erro na API:", error);
            return null;
        }
    }

    // --- MOVIMENTAÇÕES (Entrada/Baixa) ---
    static async updateEstoque(medId, qtd, tipo, pacId = null) {
        try {
            const response = await fetch(`/api/medicamentos/estoque/`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'X-CSRFToken': window.CSRF_TOKEN 
                },
                body: JSON.stringify({
                    medicamento_id: medId,
                    quantidade: qtd,
                    tipo: tipo,
                    paciente_id: pacId
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro na atualização');
            }
            return await response.json();
        } catch (error) {
            console.error("Erro na movimentação de estoque:", error);
            throw error;
        }
    }

    static async getMovimentos() {
        try {
            const response = await fetch('/api/movimentacoes/');
            if (!response.ok) throw new Error('Erro ao buscar movimentações');
            return await response.json();
        } catch (e) { return []; }
    }
}

// Tornar o ApiService global para que o app.js consiga usá-lo sem "import"
window.ApiService = ApiService;