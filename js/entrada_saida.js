/* ============================================================
   ARQUIVO: js/entrada_saida.js
   ============================================================ */

// 1. FUNÇÃO DE RECUPERAÇÃO: Puxa do backup (vistorias) para o novo (movimentacao)
function lerMovimentacoes() {
    let dados = localStorage.getItem("movimentacao");
    
    // Se não encontrar no nome novo, busca no nome que está no seu JSON (vistorias)
    if (!dados || dados === "[]") {
        dados = localStorage.getItem("vistorias");
        if (dados && dados !== "[]") {
            // Se achou, salva no formato novo para padronizar
            localStorage.setItem("movimentacao", dados);
        }
    }
    return JSON.parse(dados || "[]");
}

// 2. BUSCA KM AUTOMÁTICO
function puxarKmAutomatico() {
    const campoVeiculo = document.getElementById('veiculo');
    if (!campoVeiculo) return;
    
    const placa = campoVeiculo.value.toUpperCase();
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const vEncontrado = veiculos.find(v => v.placa.toUpperCase() === placa);
    
    if (vEncontrado) {
        document.getElementById('km').value = vEncontrado.kmAtual || 0;
    }
}

// 3. SALVAR NOVA MOVIMENTAÇÃO
function salvar() {
    const vInput = document.getElementById('veiculo');
    const kInput = document.getElementById('km');
    const mInput = document.getElementById('motorista');
    const tInput = document.getElementById('tipo');
    const oInput = document.getElementById('obs');

    if (!vInput.value || !kInput.value || !mInput.value) {
        alert("Preencha Viatura, KM e Motorista!");
        return;
    }

    const veiculosBase = JSON.parse(localStorage.getItem("vehicles")) || [];
    const info = veiculosBase.find(v => v.placa.toUpperCase() === vInput.value.toUpperCase());

    const novoRegistro = {
        id: Date.now(),
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        placa: vInput.value.toUpperCase(),
        veiculoNome: info ? info.nome : "Viatura",
        tipo: tInput.value,
        km: kInput.value,
        motorista: mInput.value,
        obs: oInput.value
    };

    const historico = lerMovimentacoes();
    historico.unshift(novoRegistro);
    localStorage.setItem("movimentacao", JSON.stringify(historico));

    // Atualiza o KM no cadastro de veículos
    let idx = veiculosBase.findIndex(v => v.placa.toUpperCase() === vInput.value.toUpperCase());
    if (idx !== -1) { 
        veiculosBase[idx].kmAtual = kInput.value; 
        localStorage.setItem("vehicles", JSON.stringify(veiculosBase)); 
    }

    alert("Registrado com sucesso!");
    vInput.value = "";
    kInput.value = "";
    mInput.value = "";
    oInput.value = "";
    
    renderizarTabela();
}

// 4. DESENHAR A TABELA NA TELA
function renderizarTabela() {
    const dados = lerMovimentacoes();
    const tbody = document.getElementById('tabela');
    if (!tbody) return;

    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Nenhum dado encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = dados.map((m) => `
        <tr>
            <td>${m.data}<br><small>${m.hora}</small></td>
            <td><strong>${m.placa}</strong><br><small>${m.veiculoNome || ''}</small></td>
            <td>${m.tipo || 'Saída'}</td>
            <td>${m.motorista || m.vigilante || '-'}</td>
            <td>${m.km} KM</td>
            <td>
                <button onclick="excluir(${m.id})" style="color:red; background:none; border:none; cursor:pointer;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 5. EXCLUIR REGISTRO
function excluir(id) {
    if (confirm("Deseja excluir este registro?")) {
        let dados = lerMovimentacoes();
        const novaLista = dados.filter(item => item.id !== id);
        localStorage.setItem("movimentacao", JSON.stringify(novaLista));
        renderizarTabela();
    }
}

// 6. INICIALIZAÇÃO
window.onload = () => {
    // Preenche o datalist de veículos
    const v = JSON.parse(localStorage.getItem("vehicles")) || [];
    const dl = document.getElementById('listaVeiculos');
    if (dl) dl.innerHTML = v.map(i => `<option value="${i.placa}">${i.nome}</option>`).join('');
    
    renderizarTabela();
};
