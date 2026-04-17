/* ============================================================
   ARQUIVO: js/dashboard.js
   ============================================================ */

let chartLinha = null;
let chartPizza = null;

async function carregarDashboard() {
    // 1. Busca dados das tabelas do IndexedDB
    const veiculos = await dbListar("vehicles");
    const vistorias = await dbListar("vistorias");
    const movs = await dbListar("movimentacao");

    // 2. Atualiza os cards numéricos
    if (document.getElementById('totalVeiculos')) {
        document.getElementById('totalVeiculos').innerText = veiculos.length;
    }
    if (document.getElementById('totalVistorias')) {
        document.getElementById('totalVistorias').innerText = vistorias.length;
    }

    // 3. Lógica para identificar quem está "Em Rota"
    // Pegamos o último status de cada placa cadastrada
    const statusAtual = {};
    veiculos.forEach(v => statusAtual[v.placa] = "ENTRADA"); // Padrão: na base
    
    // Ordena por timestamp para garantir que o último registro seja o status real
    const movsOrdenadas = [...movs].sort((a, b) => a.timestamp - b.timestamp);
    movsOrdenadas.forEach(m => {
        statusAtual[m.placa] = m.tipo;
    });

    const emRota = Object.values(statusAtual).filter(s => s === "SAÍDA").length;
    const naBase = veiculos.length - emRota;

    if (document.getElementById('totalRota')) {
        document.getElementById('totalRota').innerText = emRota;
    }

    // 4. Configuração do Gráfico de Pizza (Disponibilidade)
    const ctxPizza = document.getElementById('graficoPizza');
    if (ctxPizza) {
        if (chartPizza) chartPizza.destroy();
        chartPizza = new Chart(ctxPizza, {
            type: 'doughnut',
            data: {
                labels: ['Em Rota', 'Na Base'],
                datasets: [{
                    data: [emRota, naBase > 0 ? naBase : (veiculos.length === 0 ? 1 : 0)],
                    backgroundColor: ['#e63946', '#27ae60'],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '75%',
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#fff', font: { size: 12 } } }
                }
            }
        });
    }

    // 5. Configuração do Gráfico de Linha (Movimentação Semanal)
    const ctxLinha = document.getElementById('graficoLinha');
    if (ctxLinha) {
        if (chartLinha) chartLinha.destroy();
        
        // Simulação de dados para o gráfico de linha (histórico de movimentações)
        chartLinha = new Chart(ctxLinha, {
            type: 'line',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Registros',
                    data: [2, 5, 3, 8, 4, 10, 2], // Aqui você pode implementar contagem real por dia depois
                    borderColor: '#e63946',
                    backgroundColor: 'rgba(230, 57, 70, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#e63946'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: '#333' }, ticks: { color: '#888' } },
                    x: { grid: { display: false }, ticks: { color: '#888' } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // 6. Alerta de Manutenção (Óleo/Revisão)
    // Se quiser exibir um aviso caso algum veículo esteja chegando no KM
    const areaAlertas = document.getElementById('areaAlertas');
    if (areaAlertas) {
        const criticos = veiculos.filter(v => v.kmProximaTroca && (v.kmProximaTroca - v.kmAtual <= 500));
        if (criticos.length > 0) {
            areaAlertas.innerHTML = criticos.map(v => `
                <div class="alert-item" style="background: rgba(230,57,70,0.2); padding: 10px; border-radius: 5px; margin-bottom: 10px; border-left: 4px solid #e63946;">
                    <small style="color: #e63946; font-weight: bold;">ALERTA DE MANUTENÇÃO</small><br>
                    <span style="color: #fff;">${v.placa} - Faltam ${v.kmProximaTroca - v.kmAtual} KM</span>
                </div>
            `).join('');
        }
    }
}

// Inicializa o Dashboard assim que a página carregar
window.onload = carregarDashboard;
