/**
 * ApiService
 * Camada de Abstração para comunicação com o Backend Django
 */
class ApiService {
    // MOCK DATA (Fallback para caso o servidor esteja offline)
    static mockMedicamentos = [
        { id: 1, nome: 'Sertralina', dosagem: '50mg', quantidade: 500, estoque_critico: 100 },
    ];

    // --- AUTENTICAÇÃO ---
    static checkAuth() {
        // Verifica se existe um token ou sessão ativa
        return true; 
    }

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
        const response = await fetch('/api/medicamentos/novo/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.CSRF_TOKEN // Importante para o Django
            },
            body: JSON.stringify(medicamento)
        });
        return await response.json();
    }

    // --- PACIENTES ---
    static async getPacientes() {
        try {
            const response = await fetch('/api/pacientes/');
            return await response.json();
        } catch (e) { return []; }
    }

    static async savePaciente(paciente) {
        const response = await fetch('/api/pacientes/novo/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': window.CSRF_TOKEN },
            body: JSON.stringify(paciente)
        });
        return await response.json();
    }

    // --- MOVIMENTAÇÕES (Entrada/Baixa) ---
    static async updateEstoque(medId, qtd, tipo, pacId = null) {
        const response = await fetch(`/api/medicamentos/estoque/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': window.CSRF_TOKEN },
            body: JSON.stringify({
                medicamento_id: medId,
                quantidade: qtd,
                tipo: tipo,
                paciente_id: pacId
            })
        });
        if (!response.ok) throw new Error('Erro na atualização');
        return await response.json();
    }

    static async getMovimentos() {
        try {
            const response = await fetch('/api/movimentacoes/');
            return await response.json();
        } catch (e) { return []; }
    }
}