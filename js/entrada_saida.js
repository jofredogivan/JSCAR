/* ============================================================
   ARQUIVO: js/entrada_saida.js
   ============================================================ */

function lerMovimentacoes() {
    let dados = localStorage.getItem("movimentacao");
    if (!dados || dados === "[]") {
        dados = localStorage.getItem("movimentacoes");
    }
    return JSON.parse(dados) || [];
}

function puxarKmAutomatico() {
    const campoPlaca = document.getElementById('veiculo');
    if (!campoPlaca) return;
    const placa = campoPlaca.value.toUpperCase();
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const vEncontrado = veiculos.find(v => v.placa.toUpperCase() === placa);
    if (vEncontrado) {
        document.getElementById('km').value = vEncontrado.kmAtual || 0;
    }
}

function salvar() {
    const placaDigitada = document.getElementById('veiculo').value.toUpperCase();
    const km = document.getElementById('km').value;
    const motorista = document.getElementById('motorista').value;
    const obs = document.getElementById('obs').value;
    const tipo = document.getElementById('tipo').value;

    if (!placaDigitada || !km || !motorista) {
        alert("Preencha os campos obrigatórios!");
        return;
    }

    const veiculosBase = JSON.parse(localStorage.getItem("vehicles")) || [];
    const infoVeiculo = veiculosBase.find(v => v.placa.toUpperCase() === placaDigitada);
    const nomeVeiculo = infoVeiculo ? infoVeiculo.nome : "Não Identificado";

    const registro = {
        id: Date.now(),
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        placa: placaDigitada,
        veiculoNome: nomeVeiculo,
        tipo: tipo,
        km: km,
        motorista: motorista,
        obs: obs
    };

    const historico = lerMovimentacoes();
    historico.unshift(registro);
    localStorage.setItem("movimentacao", JSON.stringify(historico));

    let idx = veiculosBase.findIndex(v => v.placa.toUpperCase() === placaDigitada);
    if (idx !== -1) { 
        veiculosBase[idx].kmAtual = km; 
        localStorage.setItem("vehicles", JSON.stringify(veiculosBase)); 
    }

    renderizarTabela();
    limparCampos();
    alert("Registro salvo com sucesso!");
}

function limparCampos() {
    document.getElementById('veiculo').value = "";
    document.getElementById('km').value = "";
    document.getElementById('motorista').value = "";
    document.getElementById('obs').value = "";
}

function renderizarTabela() {
    const dados = lerMovimentacoes();
    const tbody = document.getElementById('tabela');
    if (!tbody) return;

    tbody.innerHTML = dados.map((m) => `
        <tr>
            <td>${m.data}<br><small>${m.hora}</small></td>
            <td><strong>${m.placa}</strong><br><small>${m.veiculoNome}</small></td>
            <td>${m.tipo}</td>
            <td>${m.motorista}</td>
            <td>${m.km} KM</td>
            <td>
                <button class="btn-delete" onclick="excluirRegistro(${m.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function excluirRegistro(id) {
    if (confirm("Deseja excluir?")) {
        let dados = lerMovimentacoes();
        const novaLista = dados.filter(item => item.id !== id);
        localStorage.setItem("movimentacao", JSON.stringify(novaLista));
        renderizarTabela();
    }
}

window.onload = () => {
    const v = JSON.parse(localStorage.getItem("vehicles")) || [];
    const dl = document.getElementById('listaVeiculos');
    if(dl) dl.innerHTML = v.map(i => `<option value="${i.placa}">${i.nome}</option>`).join('');
    renderizarTabela();
};
