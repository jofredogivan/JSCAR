// 1. Carregar veículos do LocalStorage (Banco de dados do navegador)
let veiculos = JSON.parse(localStorage.getItem('veiculos')) || [];

// 2. Ao carregar a página, desenha a tabela
document.addEventListener('DOMContentLoaded', () => {
    renderizarTabela();
});

// 3. Função para Salvar ou Atualizar Veículo
function salvarVeiculo() {
    const nome = document.getElementById('nome').value;
    const placa = document.getElementById('placa').value.toUpperCase();
    const ano = document.getElementById('ano').value;
    const kmAtual = document.getElementById('kmAtual').value;
    const kmTroca = document.getElementById('kmTroca').value;
    const editIndex = document.getElementById('editIndex').value;

    // Validação de campos obrigatórios
    if (!nome || !placa || !ano) {
        alert("Preencha Modelo, Placa e Ano!");
        return;
    }

    const veiculoData = { nome, placa, ano, kmAtual, kmTroca };

    if (editIndex === "-1") {
        // Se for -1, é um NOVO cadastro
        veiculos.push(veiculoData);
        alert("Veículo cadastrado com sucesso!");
    } else {
        // Se tiver um número, estamos EDITANDO um existente
        veiculos[editIndex] = veiculoData;
        alert("Dados atualizados com sucesso!");
    }

    // Salva a lista atualizada no LocalStorage
    localStorage.setItem('veiculos', JSON.stringify(veiculos));
    
    limparCampos();
    renderizarTabela();
}

// 4. Função para exibir os veículos na tabela
function renderizarTabela() {
    const tbody = document.getElementById('tabelaVeiculos');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    veiculos.forEach((v, index) => {
        const tr = document.createElement('tr');
        tr.style.cursor = "pointer"; // Indica que a linha é clicável
        
        tr.innerHTML = `
            <td onclick="prepararEdicao(${index})"><strong>${v.nome}</strong> (${v.ano || 'N/A'})</td>
            <td onclick="prepararEdicao(${index})">${v.placa}</td>
            <td onclick="prepararEdicao(${index})">${v.kmAtual || 0}</td>
            <td onclick="prepararEdicao(${index})">${v.kmTroca || 0}</td>
            <td style="text-align: center;">
                <button onclick="excluirVeiculo(${index})" style="background:none; border:none; color:#e63946; cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 5. Função para carregar os dados no formulário para EDITAR
function prepararEdicao(index) {
    const v = veiculos[index];
    
    document.getElementById('nome').value = v.nome;
    document.getElementById('placa').value = v.placa;
    document.getElementById('ano').value = v.ano || '';
    document.getElementById('kmAtual').value = v.kmAtual || '';
    document.getElementById('kmTroca').value = v.kmTroca || '';
    document.getElementById('editIndex').value = index;

    // Altera o texto do botão para indicar atualização
    document.getElementById('btnSalvar').innerHTML = '<i class="fas fa-sync"></i> Atualizar Veículo';
    document.getElementById('btnCancelar').style.display = 'block';
    
    // Rola para o topo (importante para celular ver o formulário)
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 6. Função para EXCLUIR um veículo
function excluirVeiculo(index) {
    const v = veiculos[index];
    if (confirm(`Tem certeza que deseja excluir o veículo placa: ${v.placa}?`)) {
        veiculos.splice(index, 1); // Remove da lista
        localStorage.setItem('veiculos', JSON.stringify(veiculos)); // Salva a nova lista
        renderizarTabela(); // Atualiza a tela
        
        // Se estava editando o veículo que foi excluído, limpa o formulário
        if (document.getElementById('editIndex').value == index) {
            limparCampos();
        }
    }
}

// 7. Função para limpar o formulário e resetar botões
function limparCampos() {
    document.getElementById('nome').value = '';
    document.getElementById('placa').value = '';
    document.getElementById('ano').value = '';
    document.getElementById('kmAtual').value = '';
    document.getElementById('kmTroca').value = '';
    document.getElementById('editIndex').value = "-1";
    
    document.getElementById('btnSalvar').innerHTML = '<i class="fas fa-save"></i> Salvar Veículo';
    document.getElementById('btnCancelar').style.display = 'none';
}

function cancelarEdicao() {
    limparCampos();
}
