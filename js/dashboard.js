document.addEventListener('DOMContentLoaded', () => {
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const manutencao = JSON.parse(localStorage.getItem("maintenance")) || [];
    const vistorias = JSON.parse(localStorage.getItem("vistorias")) || [];

    // Atualiza contadores
    document.getElementById('totalVehicles').innerText = veiculos.length;
    document.getElementById('inMaintenance').innerText = manutencao.length;
    document.getElementById('totalVistorias').innerText = vistorias.length;

    // Gráfico de Linha
    new Chart(document.getElementById('chartMovimentacao'), {
        type: 'line',
        data: {
            labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Vistorias',
                data: [5, 12, 8, 15, 10, 4, 2],
                borderColor: '#e63946',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(230, 57, 70, 0.1)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });

    // Gráfico de Pizza
    new Chart(document.getElementById('chartStatus'), {
        type: 'doughnut',
        data: {
            labels: ['Ativos', 'Manutenção'],
            datasets: [{
                data: [veiculos.length, manutencao.length],
                backgroundColor: ['#2ecc71', '#e63946'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
});