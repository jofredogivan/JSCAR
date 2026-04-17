/* ============================================================
   ARQUIVO: js/dashboard.js
   ============================================================ */

let meuGrafico = null; // Variável global para controlar o gráfico

async function carregarDashboard() {
    const veiculos = await dbListar("vehicles");
    const vistorias = await dbListar("vistorias");
    const movs = await dbListar("movimentacao");
    const manutencoes = await dbListar("maintenance");

    // 1. ALERTAS DE ÓLEO E MANUTENÇÃO
    const areaAlerta = document.getElementById('areaAlertas');
    const alertasManutencao = veiculos.filter(v => {
        if (!v.kmProximaTroca || !v.kmAtual) return false;
        return (parseInt(v.kmProximaTroca) - parseInt(v.kmAtual)) <= 500;
    });

    if (alertasManutencao.length > 0) {
        areaAlerta.innerHTML = alertasManutencao.map(v => `
            <div class="card-alerta pulse" style="background: rgba(230, 57, 70, 0.15); border-left: 5px solid #e63946; padding: 15px; margin-bottom: 15px; border-radius: 8px;">
                <i class="fas fa-tools" style="color: #e63946; margin-right: 10px;"></i>
                <span style="color: #fff;">A viatura <strong>${v.placa}</strong> precisa de revisão (Faltam ${v.kmProximaTroca - v.kmAtual} KM).</span>
            </div>
        `).join('');
    }

    // 2. CONTADORES
    const hoje = new Date().toLocaleDateString('pt-BR');
    document.getElementById('countVistorias').innerText = vistorias.filter(v => v.data === hoje).length;
    
    const mesAtual = new Date().getMonth();
    const anoAtual = new Date().getFullYear();
    document.getElementById('countManutencao').innerText = manutencoes.filter(m => {
        const d = new Date(m.dataOriginal);
        return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    }).length;

    // 3. LÓGICA DE VEÍCULOS EM ROTA VS DISPONÍVEIS
    const ultimoStatusPorVeiculo = {};
    // Inicializa todos como Disponíveis
    veiculos.forEach(v => ultimoStatusPorVeiculo[v.placa] = "ENTRADA");
    
    // Processa movimentações (como dbListar traz do mais novo, pegamos a primeira ocorrência)
    const movsOrdenadas = [...movs].sort((a, b) => a.timestamp - b.timestamp);
    movsOrdenadas.forEach(m => {
        ultimoStatusPorVeiculo[m.placa] = m.tipo;
    });

    const emRota = Object.values(ultimoStatusPorVeiculo).filter(s => s === "SAÍDA").length;
    const disponiveis = veiculos.length - emRota;
    document.getElementById('countRota').innerText = emRota;

    // 4. GRÁFICO DE PIZZA (DOUGHNUT)
    const ctx = document.getElementById('graficoStatus');
    if (ctx) {
        if (meuGrafico) meuGrafico.destroy(); // Limpa gráfico anterior se existir
        
        meuGrafico = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Em Rota', 'Disponíveis'],
                datasets: [{
                    data: [emRota, disponiveis],
                    backgroundColor: ['#e63946', '#27ae60'],
                    hoverOffset: 4,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#fff' } }
                }
            }
        });
    }

    // 5. TABELA DE RESUMO (Últimas 5)
    const tabela = document.getElementById('tabelaResumo');
    const ultimasMovs = movs.slice(0, 5);
    tabela.innerHTML = ultimasMovs.map(m => `
        <tr>
            <td>${m.hora}</td>
            <td><strong>${m.placa}</strong></td>
            <td><span class="badge ${m.tipo === 'SAÍDA' ? 'badge-saida' : 'badge-entrada'}">${m.tipo}</span></td>
        </tr>
    `).join('');
}

window.onload = carregarDashboard;
