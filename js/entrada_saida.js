/* ============================================================
   ARQUIVO: js/entrada_saida.js
   ============================================================ */

// Preenche o datalist de veículos e carrega a tabela ao iniciar
async function inicializar() {
    const veiculos = await dbListar("vehicles");
    const dl = document.getElementById('listaVeiculos');
    if (dl) {
        dl.innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
    }
    renderizarTabela();
}

// Puxa o último KM registrado para facilitar o preenchimento
async function puxarKmAutomatico() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    const veiculos = await dbListar("vehicles");
    const vEncontrado = veiculos.find(v => v.placa === placa);
    if (vEncontrado) {
        document.getElementById('km').value = vEncontrado.kmAtual || "";
    }
}

async function salvar() {
    const vInput = document.getElementById('veiculo');
    const tInput = document.getElementById('tipo');
    const kInput = document.getElementById('km');
    const rInput = document.getElementById('responsavel');

    if (!vInput.value || !kInput.value || !rInput.value) {
        return alert("Por favor, preencha todos os campos obrigatórios!");
    }

    const placa = vInput.value.toUpperCase();

    const novoRegistro = {
        id: Date.now(),
        placa: placa,
        tipo: tInput.value,
        km: parseInt(kInput.value),
        responsavel: rInput.value,
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().getTime()
    };

    // 1. Salva a movimentação
    await dbSalvar("movimentacao", novoRegistro);

    // 2. Atualiza o KM na tabela de veículos para manter o Dashboard em dia
    const veiculos = await dbListar("vehicles");
    const vIdx = veiculos.find(v => v.placa === placa);
    if (vIdx) {
        vIdx.kmAtual = novoRegistro.km;
        await dbSalvar("vehicles", vIdx);
    }

    alert("Movimentação registrada com sucesso!");
    
    // Limpa apenas o campo de veículo para facilitar o próximo
    vInput.value = "";
    kInput.value = "";
    renderizarTabela();
}

async function renderizarTabela() {
    const dados = await dbListar("movimentacao");
    const tbody = document.getElementById('tabela');
    if (!tbody) return;

    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhum registro encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = dados.map(m => `
        <tr>
            <td>${m.data}<br><small>${m.hora}</small></td>
            <td><strong>${m.placa}</strong></td>
            <td><span class="badge ${m.tipo === 'SAÍDA' ? 'badge-saida' : 'badge-entrada'}">${m.tipo}</span></td>
            <td>${m.km} KM</td>
            <td>${m.responsavel}</td>
            <td>
                <button onclick="excluirMov(${m.id})" class="btn-delete" style="background:none; border:none; color:#e63946; cursor:pointer;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function excluirMov(id) {
    if (confirm("Deseja realmente excluir este registro de movimentação?")) {
        await dbExcluir("movimentacao", id);
        renderizarTabela();
    }
}

// Inicialização
window.onload = inicializar;
