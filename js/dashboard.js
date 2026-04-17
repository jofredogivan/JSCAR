/* ============================================================
   ARQUIVO: js/dashboard.js
   ============================================================ */

async function carregarDashboard() {
    // Busca dados das 3 stores principais
    const veiculos = await dbListar("vehicles");
    const vistorias = await dbListar("vistorias");
    const movimentacoes = await dbListar("movimentacao");
    const manutencoes = await dbListar("maintenance");

    // --- 1. LÓGICA DE ALERTAS DE MANUTENÇÃO ---
    const areaAlerta = document.getElementById('areaAlertas');
    if (areaAlerta) {
        // Filtra veículos que estão a menos de 500km da próxima troca
        const alertas = veiculos.filter(v => {
            if (!v.kmProximaTroca || !v.kmAtual) return false;
            const restante = parseInt(v.kmProximaTroca) - parseInt(v.kmAtual);
            return restante <= 500;
        });

        if (alertas.length > 0) {
            areaAlerta.innerHTML = alertas.map(v => `
                <div class="card-alerta" style="background: rgba(230, 57, 70, 0.2); border-left: 5px solid #e63946; padding: 15px; margin-bottom: 10px; border-radius: 8px; display: flex; align-items: center; gap: 15px;">
                    <i class="fas fa-exclamation-triangle" style="color: #e63946; font-size: 1.5rem;"></i>
                    <div>
                        <strong style="color: #fff;">Alerta de Revisão: ${v.placa}</strong><br>
                        <span style="color: #ccc; font-size: 0.9rem;">Faltam apenas ${parseInt(v.kmProximaTroca) - parseInt(v.kmAtual)} KM para a troca programada.</span>
                    </div>
                </div>
            `).join('');
        } else {
            areaAlerta.innerHTML = '';
        }
    }

    // --- 2. CONTADORES DOS CARDS ---
    
    // Vistorias de Hoje
    const hoje = new Date().toLocaleDateString('pt-BR');
    const totalVistoriasHoje = vistorias.filter(v => v.data === hoje).length;
    document.getElementById('countVistorias').innerText = totalVistoriasHoje;

    // Veículos em Rota (Último evento foi SAÍDA)
    // Agrupamos por placa para saber o último status de cada um
    const statusVeiculos = {};
    movimentacoes.forEach(m => {
        if (!statusVeiculos[m.placa]) {
            statusVeiculos[m.placa] = m.tipo; // Como dbListar já traz do mais novo, o primeiro que achar é o atual
        }
    });
    const emRota = Object.values(statusVeiculos).filter(status => status === "SAÍDA").length;
    document.getElementById('countRota').innerText = emRota;

    // Manutenções do Mês
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    const totalManutencaoMes = manutencoes.filter(m => {
        const dataM = new Date(m.dataOriginal);
        return dataM.getMonth() === mesAtual && dataM.getFullYear() === anoAtual;
    }).length;
    document.getElementById('countManutencao').innerText = totalManutencaoMes;

    // --- 3. RESUMO DE ATIVIDADES (Últimas 5) ---
    const tabelaResumo = document.getElementById('tabelaResumo');
    if (tabelaResumo) {
        const ultimas = movimentacoes.slice(0, 5);
        tabelaResumo.innerHTML = ultimas.map(m => `
            <tr>
                <td>${m.data} <small>${m.hora}</small></td>
                <td><strong>${m.placa}</strong></td>
                <td><span class="badge ${m.tipo === 'SAÍDA' ? 'badge-saida' : 'badge-entrada'}">${m.tipo}</span></td>
            </tr>
        `).join('');
    }
}

// Inicializa ao carregar a página
window.onload = carregarDashboard;
