/* ============================================================
   ARQUIVO: js/dashboard.js (Restaurado para o visual original)
   ============================================================ */

let meuGrafico = null; // Variável global para gerenciar o gráfico

async function carregarDashboard() {
    // 1. Busca os dados dos 3 novos bancos
    const veiculos = await dbListar("vehicles");
    const movs = await dbListar("movimentacao");

    // 2. ALERTAS DE TROCA DE ÓLEO E REVISÃO
    const areaAlerta = document.getElementById('areaAlertas');
    if (areaAlerta) {
        areaAlerta.innerHTML = ""; // Limpa antes de gerar

        const alertas = veiculos.filter(v => {
            if (!v.kmProximaTroca || !v.kmAtual) return false;
            // Filtra se faltar 500km ou menos
            return (parseInt(v.kmProximaTroca) - parseInt(v.kmAtual)) <= 500;
        });

        if (alertas.length > 0) {
            areaAlerta.innerHTML = alertas.map(v => `
                <div class="card-alerta pulse" style="background: rgba(230, 57, 70, 0.15); border-left: 5px solid #e63946; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
                    <i class="fas fa-exclamation-triangle" style="color: #e63946; margin-right: 10px;"></i>
                    <span style="color: #fff;">Viatura <strong>${v.placa}</strong> precisa de revisão (Faltam ${v.kmProximaTroca - v.kmAtual} KM).</span>
                </div>
            `).join('');
        }
    }

    // 3. LÓGICA DO GRÁFICO (EM ROTA vs DISPONÍVEL)
    const ultimoStatusPorVeiculo = {};
    
    // Inicializa todos os cadastrados como Disponíveis (ENTRADA)
    veiculos.forEach(v => ultimoStatusPorVeiculo[v.placa] = "ENTRADA");
    
    // Processa movimentações (como dbListar traz do mais novo, pegamos o primeiro status)
    // Para garantir a ordem cronológica, precisamos sortear pelo timestamp
    const movsOrdenadas = [...movs].sort((a, b) => a.timestamp - b.timestamp);
    movsOrdenadas.forEach(m => {
        ultimoStatusPorVeiculo[m.placa] = m.tipo;
    });

    const emRota = Object.values(ultimoStatusPorVeiculo).filter(s => s === "SAÍDA").length;
    const disponiveis = veiculos.length - emRota;

    // 4. ATUALIZAR/CRIAR O GRÁFICO (Visual Colorido)
    const ctx = document.getElementById('graficoStatus');
    if (ctx) {
        if (meuGrafico) meuGrafico.destroy(); // Limpa se já existir
        
        meuGrafico = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Em Rota', 'Disponíveis'],
                datasets: [{
                    data: [emRota, disponiveis],
                    backgroundColor: ['#e63946', '#27ae60'], // Vermelho e Verde (Padrão Original)
                    hoverOffset: 4,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%', // Estilo Doughnut
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#fff',
                            font: { size: 14 }
                        }
                    }
                }
            }
        });
    }

    // 5. TABELA DE RESUMO (Últimas 5) com as mesmas classes do original
    const tabela = document.getElementById('tabelaResumo');
    if (tabela) {
        const ultimasMovs = movs.slice(0, 5); // Pega as 5 mais recentes
        tabela.innerHTML = ultimasMovs.map(m => `
            <tr>
                <td>${m.hora}</td>
                <td><strong>${m.placa}</strong></td>
                <td><span class="badge ${m.tipo === 'SAÍDA' ? 'badge-saida' : 'badge-entrada'}">${m.tipo}</span></td>
            </tr>
        `).join('');
    }
}

// Inicializa
window.onload = carregarDashboard;
