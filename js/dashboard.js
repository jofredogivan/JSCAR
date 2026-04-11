function atualizarDashboard() {
    // Busca os veículos cadastrados no LocalStorage
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const listaNotificacoes = document.getElementById('listaNotificacoes');
    
    let ok = 0;
    let alerta = 0;
    listaNotificacoes.innerHTML = "";

    veiculos.forEach(v => {
        // Lógica de Manutenção: Verifica se o KM atual está próximo da Próxima Troca
        // Consideramos alerta se faltar 500km ou se já tiver passado
        const kmAtual = parseFloat(v.kmAtual) || 0;
        const kmTroca = parseFloat(v.kmTroca) || 0;
        const kmRestante = kmTroca - kmAtual;

        if (kmTroca > 0 && kmRestante <= 500) {
            alerta++;
            const item = document.createElement('div');
            item.className = 'check-item';
            item.style.marginBottom = '10px';
            item.style.borderLeft = '4px solid #e63946';
            item.style.display = 'flex';
            item.style.justifyContent = 'flex-start';
            
            let msg = kmRestante <= 0 
                ? `Vencido há ${Math.abs(kmRestante)} KM` 
                : `Trocar em ${kmRestante} KM`;

            item.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="color: #e63946; margin-right: 10px;"></i>
                <span><strong>${v.placa} (${v.nome})</strong>: <span style="color: #e63946">${msg}</span></span>
            `;
            listaNotificacoes.appendChild(item);
        } else {
            ok++;
        }
    });

    // Atualiza os números nos cards superiores
    document.getElementById('totalVeiculos').innerText = veiculos.length;
    document.getElementById('totalAlertas').innerText = alerta;

    if (veiculos.length === 0) {
        listaNotificacoes.innerHTML = "<p style='color: #888; padding: 10px;'>Nenhum veículo cadastrado no sistema.</p>";
    } else if (alerta === 0) {
        listaNotificacoes.innerHTML = "<p style='color: #2ecc71; padding: 10px;'><i class='fas fa-check-circle'></i> Toda a frota está com a manutenção em dia!</p>";
    }

    // --- CONFIGURAÇÃO DO GRÁFICO EM CÍRCULO ---
    const ctx = document.getElementById('chartStatus').getContext('2d');
    
    // Destrói gráfico existente para evitar bugs de sobreposição ao atualizar
    if (window.chartInstancia) {
        window.chartInstancia.destroy();
    }

    window.chartInstancia = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Em Dia', 'Revisão Necessária'],
            datasets: [{
                data: [ok, alerta],
                backgroundColor: ['#2ecc71', '#e63946'],
                borderColor: '#2a2a2a',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#b0b0b0',
                        font: { size: 12, family: 'Segoe UI' },
                        padding: 20
                    }
                }
            }
        }
    });
}

// Executa a função assim que a página termina de carregar
window.onload = atualizarDashboard;
