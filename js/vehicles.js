/* ============================================================
   ARQUIVO: js/vehicles.js
   ============================================================ */

async function inicializar() {
    renderizarTabela();
}

async function salvarVeiculo() {
    const pInput = document.getElementById('placa');
    const nInput = document.getElementById('nome');
    const kInput = document.getElementById('kmAtual');
    const mInput = document.getElementById('modelo');

    if (!pInput.value || !nInput.value || !kInput.value) {
        return alert("Placa, Nome e KM Inicial são obrigatórios!");
    }

    const placa = pInput.value.toUpperCase().trim();

    // Criamos o objeto do veículo
    // Note: kmProximaTroca começa vazio até que se registre uma manutenção
    const novoVeiculo = {
        placa: placa,
        nome: nInput.value,
        kmAtual: parseInt(kInput.value),
        modelo: mInput.value,
        kmProximaTroca: null,
        dataCadastro: new Date().toLocaleDateString('pt-BR')
    };

    // Salva no IndexedDB (Object Store: "vehicles")
    await dbSalvar("vehicles", novoVeiculo);

    alert(`Viatura ${placa} cadastrada com sucesso!`);
    
    // Limpa os campos
    pInput.value = "";
    nInput.value = "";
    kInput.value = "";
    mInput.value = "";
    
    renderizarTabela();
}

async function renderizarTabela() {
    const dados = await dbListar("vehicles");
    const tbody = document.getElementById('tabelaVeiculos');
    if (!tbody) return;

    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum veículo cadastrado.</td></tr>';
        return;
    }

    tbody.innerHTML = dados.map(v => `
        <tr>
            <td><strong>${v.placa}</strong></td>
            <td>${v.nome} <br><small style="color:#888">${v.modelo || ''}</small></td>
            <td>${v.kmAtual} KM</td>
            <td style="color: ${v.kmProximaTroca ? '#f1c40f' : '#888'}">
                ${v.kmProximaTroca ? v.kmProximaTroca + ' KM' : 'Não definida'}
            </td>
            <td>
                <button onclick="excluirVeiculo('${v.placa}')" style="background:none; border:none; color:#e63946; cursor:pointer;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function excluirVeiculo(placa) {
    if (confirm(`Deseja remover a viatura ${placa} do sistema? Isso não apagará o histórico de movimentações.`)) {
        await dbExcluir("vehicles", placa);
        renderizarTabela();
    }
}

window.onload = inicializar;
