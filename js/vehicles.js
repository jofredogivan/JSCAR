/* ============================================================
   ARQUIVO: js/vehicles.js
   SISTEMA: Gestão de Frota - Japan Security
   ============================================================ */

// 1. Carrega os dados da "gaveta" antiga para garantir que nada sumiu
let veiculos = JSON.parse(localStorage.getItem('vehicles')) || [];

// 2. Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    renderizarTabela();
});

// 3. Função para Salvar Novo ou Atualizar Existente
function salvarVeiculo() {
    const nome = document.getElementById('nome').value;
    const placa = document.getElementById('placa').value.toUpperCase();
    const ano = document.getElementById('ano').value;
    const kmAtual = document.getElementById('kmAtual').value;
    const kmTroca = document.getElementById('kmTroca').value;
    const editIndex = document.getElementById('editIndex').value;

    // Validação de campos essenciais
    if (!nome || !placa || !ano) {
        alert("Por favor, preencha Modelo, Placa e Ano!");
        return;
    }

    const veiculoData = {
        nome: nome,
        placa: placa,
        ano: ano,
        kmAtual: kmAtual || 0,
        kmTroca: kmTroca || 0
    };

    if (editIndex === "-1") {
        // NOVO CADASTRO
        veiculos.push(veiculoData);
        alert("Veículo cadastrado com sucesso!");
    } else {
        // ATUALIZAÇÃO DE EXISTENTE
        veiculos[editIndex] = veiculoData;
        alert("Dados atualizados com sucesso!");
    }

    // Salva na chave 'vehicles' para manter compatibilidade
    localStorage.setItem('vehicles', JSON.stringify(veiculos));
    
    limparCampos();
    renderizarTabela();
}

// 4. Função para desenhar a tabela na tela
function renderizarTabela() {
    const tbody = document.getElementById('tabelaVeiculos');
    if (!tbody) return;

    tbody.innerHTML = '';

    veiculos.forEach((v, index) => {
        const tr = document.createElement('tr');
        tr.style.cursor = "pointer"; // Indica que a linha pode ser clicada
        
        tr.innerHTML = `
            <td onclick="prepararEdicao(${index})">
                <strong>${v.nome}</strong> ${v.ano ? `(${v.ano})` : ''}
            </td>
            <td onclick="prepararEdicao(${index})">${v.placa}</td>
            <td onclick="prepararEdicao(${index})">${v.kmAtual} KM</td>
            <td onclick="prepararEdicao(${index})">${v.kmTroca} KM</td>
            <td style="text-align: center;">
                <button onclick="excluirVeiculo(${index})" style="background:none; border:none; color:#e63946; cursor:pointer;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 5. Função para carregar os dados no formulário (EDITAR)
function prepararEdicao(index) {
    const v = veiculos[index];

    document.getElementById('nome').value = v.nome;
    document.getElementById('placa').value = v.placa;
    document.getElementById('ano').value = v.ano || '';
    document.getElementById('kmAtual').value = v.kmAtual || '';
    document.getElementById('kmTroca').value = v.kmTroca || '';
    
    // Define o índice de edição no campo oculto
    document.getElementById('editIndex').value = index;

    // Muda o visual do botão para indicar edição
    const btnSalvar = document.getElementById('btnSalvar');
    btnSalvar.innerHTML = '<i class="fas fa-sync"></i> Atualizar Dados';
    btnSalvar.style.background = '#d4af37'; // Destaque em dourado
    btnSalvar.style.color = '#000';

    document.getElementById('btnCancelar').style.display = 'block';

    // Sobe para o formulário (melhor experiência no celular)
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 6. Função para EXCLUIR veículo
function excluirVeiculo(index) {
    const placa = veiculos[index].placa;
    if (confirm(`Deseja realmente remover a viatura placa ${placa}?`)) {
        veiculos.splice(index, 1);
        localStorage.setItem('vehicles', JSON.stringify(veiculos));
        renderizarTabela();
        
        // Se o veículo excluído estava sendo editado, limpa o form
        if (document.getElementById('editIndex').value == index) {
            limparCampos();
        }
    }
}

// 7. Funções Utilitárias (Limpar e Cancelar)
function limparCampos() {
    document.getElementById('nome').value = '';
    document.getElementById('placa').value = '';
    document.getElementById('ano').value = '';
    document.getElementById('kmAtual').value = '';
    document.getElementById('kmTroca').value = '';
    document.getElementById('editIndex').value = "-1";

    const btnSalvar = document.getElementById('btnSalvar');
    btnSalvar.innerHTML = '<i class="fas fa-save"></i> Salvar Veículo';
    btnSalvar.style.background = ''; // Volta ao padrão do CSS
    btnSalvar.style.color = '';

    document.getElementById('btnCancelar').style.display = 'none';
}

function cancelarEdicao() {
    limparCampos();
}
