function loadDashboard() {
    try {
        // Tenta buscar os dados, se falhar ou estiver vazio, retorna array vazio
        const v = JSON.parse(localStorage.getItem("vehicles")) || [];
        const m = JSON.parse(localStorage.getItem("maintenance")) || [];
        const vi = JSON.parse(localStorage.getItem("vistorias")) || [];
        const mo = JSON.parse(localStorage.getItem("movimentos")) || [];

        // Atualiza os contadores principais
        atualizarContador("totalVehicles", v.length);
        atualizarContador("inMaintenance", m.length);
        atualizarContador("totalVistorias", vi.length);
        atualizarContador("totalMovimentos", mo.length);

        // Funções de inteligência do Dashboard
        verificarAlertasManutencao(m);
        
    } catch (error) {
        console.error("Erro ao carregar dados do Dashboard:", error);
    }
}

// Função auxiliar para atualizar o texto com um efeito simples de transição
function atualizarContador(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.innerText = valor;
    }
}

// Verifica se há veículos que precisam de atenção na manutenção
function verificarAlertasManutencao(manutencoes) {
    const listaAlertas = document.getElementById("recentAlerts");
    if (!listaAlertas) return;

    // Filtra, por exemplo, manutenções com status "Aguardando Peça"
    const urgentes = manutencoes.filter(item => item.tipo === "Aguardando Peça" || item.status === "Pendente");

    if (urgentes.length > 0) {
        listaAlertas.innerHTML = urgentes.map(item => `
            <li class="alert-item">
                <i class="fas fa-exclamation-circle" style="color: #e63946;"></i>
                <strong>${item.veiculo}</strong>: ${item.tipo}
            </li>
        `).join('');
    } else {
        listaAlertas.innerHTML = '<li class="alert-item">✅ Frota sem pendências críticas.</li>';
    }
}

// Inicializa ao carregar a página
document.addEventListener("DOMContentLoaded", loadDashboard);