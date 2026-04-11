document.getElementById('formVeiculo').addEventListener('submit', function(e) {
    e.preventDefault();
    salvarVeiculo();
});

function salvarVeiculo() {
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    
    const novoVeiculo = {
        id: Date.now(),
        nome: document.getElementById('nome').value,
        placa: document.getElementById('placa').value.toUpperCase(),
        ano: document.getElementById('ano').value,
        kmAtual: document.getElementById('kmInicial').value || 0,
        ultimaTroca: document.getElementById('kmInicial').value || 0
    };

    veiculos.push(novoVeiculo);
    localStorage.setItem("vehicles", JSON.stringify(veiculos));
    
    document.getElementById('formVeiculo').reset();
    renderizarVeiculos();
}

function renderizarVeiculos() {
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const tabela = document.getElementById('tabelaVeiculos');
    tabela.innerHTML = "";

    veiculos.forEach(v => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${v.nome}</strong></td>
            <td><span class="plate-badge">${v.placa}</span></td>
            <td>${v.ano}</td>
            <td>${v.kmAtual} km</td>
            <td>${v.ultimaTroca} km</td>
            <td style="text-align: center;">
                <button class="btn-small btn-danger" onclick="excluirVeiculo(${v.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tabela.appendChild(tr);
    });

    document.getElementById('totalAtivos').innerText = veiculos.length;
}

function excluirVeiculo(id) {
    if(confirm("Deseja realmente remover este veículo da frota?")) {
        let veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
        veiculos = veiculos.filter(v => v.id !== id);
        localStorage.setItem("vehicles", JSON.stringify(veiculos));
        renderizarVeiculos();
    }
}

// Inicializa a tabela ao carregar
renderizarVeiculos();