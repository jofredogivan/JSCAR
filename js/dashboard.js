/* ============================================================
   ARQUIVO: js/dashboard.js - Versão Otimizada Mobile
   ============================================================ */

let chartLinha = null;
let chartPizza = null;

async function carregarDashboard() {
    // 1. Busca dados das tabelas do IndexedDB
    const veiculos = await dbListar("vehicles");
    const vistorias = await dbListar("vistorias");
    const movs = await dbListar("movimentacao");

    // 2. Atualiza os cards numéricos (IDs ajustados para o seu HTML)
    if (document.getElementById('countFrotaTotal')) {
        document.getElementById('countFrotaTotal').innerText = veiculos.length;
    }
    if (document.getElementById('countVistorias')) {
        const hoje = new Date().toLocaleDateString('pt-BR');
        const vistsHoje = vistorias.filter(v => v.data && v.data.includes(hoje)).length;
        document.getElementById('countVistorias').innerText = vistsHoje;
    }

    // 3. Lógica para identificar status da frota
    const statusAtual = {};
    veiculos.forEach(v => statusAtual[v.placa] = "ENTRADA"); 
    
    const movsOrdenadas = [...movs].sort((a, b) => a.timestamp - b.timestamp);
    movsOrdenadas.forEach(m => {
        statusAtual[m.veiculo || m.placa] = m.tipo;
    });

    const emRota = Object.values(statusAtual).filter(s => s === "SAÍDA").length;
    const naBase = veiculos.length - emRota;

    // 4. Configuração do Gráfico de Pizza (Doughnut)
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
                responsive: true,
                maintainAspectRatio: false, // CRÍTICO PARA MOBILE
                cutout: '70%',
                layout: { padding: 10 },
                plugins: {
                    legend: { 
                        position: 'bottom', 
                        labels: { color: '#ccc', font: { size: 10 }, boxWidth: 10 } 
                    }
                }
            }
        });
    }

    // 5. Configuração do Gráfico de Linha (Movimentação)
    const ctxLinha = document.getElementById('graficoLinha');
    if (ctxLinha) {
        if (chartLinha) chartLinha.destroy();
        
        chartLinha = new Chart(ctxLinha, {
            type: 'line',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Registros',
                    data: [2, 5, 3, 8, 4, 10, 2], 
                    borderColor: '#e63946',
                    backgroundColor: 'rgba(230, 57, 70, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // CRÍTICO PARA MOBILE
                scales: {
                    y: { beginAtZero: true, grid: { color: '#333' }, ticks: { color: '#888', font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { color: '#888', font: { size: 10 } } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // 6. Alerta de Manutenção Integrado
    // Verifica se algum veículo passou de 9500km desde a última troca
    const areaAlertas = document.getElementById('areaAlertas'); // Certifique-se de ter essa div se quiser alertas detalhados
    if (areaAlertas) {
        const criticos = veiculos.filter(v => {
            const hist = [...vistorias, ...movs].filter(r => r.veiculo === v.placa).sort((a,b) => b.timestamp - a.timestamp);
            const kmAtual = hist.length > 0 ? hist[0].km : v.kmAtual;
            return (kmAtual - v.kmUltimaTroca >= 9500);
        });

        if (criticos.length > 0) {
            areaAlertas.innerHTML = criticos.map(v => `
                <div style="background: rgba(230,57,70,0.1); padding: 10px; border-radius: 5px; margin-bottom: 8px; border-left: 4px solid #e63946;">
                    <small style="color: #e63946; font-weight: bold;">TROCA DE ÓLEO</small><br>
                    <span style="color: #fff; font-size: 12px;">${v.nome} (${v.placa})</span>
                </div>
            `).join('');
        }
    }
}

// Inicializa
window.onload = carregarDashboard;
