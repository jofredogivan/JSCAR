// Função para Salvar ou Atualizar Veículo
function salvarVeiculo() {
    const nome = document.getElementById('nome').value;
    const placa = document.getElementById('placa').value.toUpperCase();
    const kmAtual = document.getElementById('kmAtual').value;
    const kmTroca = document.getElementById('kmTroca').value;

    if (!nome || !placa || !kmAtual || !kmTroca) {
        alert("Preencha todos os campos corretamente.");
        return;
    }

    let veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];

    // Verifica se a placa já existe para não duplicar
    const indexExistente = veiculos.findIndex(v => v.placa === placa);
    
    const novoVeiculo = { nome, placa, kmAtual, kmTroca };

    if (indexExistente !== -1) {
        veiculos[indexExistente] = novoVeiculo; // Atualiza
    } else {
        veiculos.push(novoVeiculo); // Adiciona novo
    }

    localStorage.setItem("vehicles", JSON.stringify(veiculos));
    
    // Limpa os campos
    document.getElementById('nome').value = "";
    document.getElementById('placa').value = "";
    document.getElementById('kmAtual').value = "";
    document.getElementById('kmTroca').value = "";

    alert("Veículo salvo com sucesso!");
    renderizarTabela();
}

// Função para listar os veículos na tabela
function renderizarTabela() {
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const tbody = document.getElementById('tabelaVeiculos');
    
    if (!tbody) return;

    tbody.innerHTML = veiculos.map((v, index) => `
        <tr>
            <td>${v.nome}</td>
            <td><strong>${v.placa}</strong></td>
            <td>${v.kmAtual} KM</td>
            <td>${v.kmTroca} KM</td>
            <td>
                <button class="btn-delete" onclick="excluirVeiculo(${index})">
                    <i class="fas fa-trash-alt"></i> Excluir
                </button>
            </td>
        </tr>
    `).join('');
}

// Função para Excluir Veículo
function excluirVeiculo(index) {
    if (confirm("Tem certeza que deseja remover este veículo da frota?")) {
        let veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
        veiculos.splice(index, 1);
        localStorage.setItem("vehicles", JSON.stringify(veiculos));
        renderizarTabela();
    }
}

// Carregar a tabela assim que abrir a página
window.onload = renderizarTabela;
