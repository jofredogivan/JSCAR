/* ============================================================
   ARQUIVO: js/entrada_saida.js - VERSÃO FINAL CORRIGIDA
   ============================================================ */

// Função para ler o histórico (tenta todos os nomes de backup)
function lerMovimentacoes() {
    let dados = localStorage.getItem("movimentacao");
    if (!dados || dados === "[]") {
        dados = localStorage.getItem("vistorias"); // Nome que está no seu JSON de backup
        if (dados && dados !== "[]") {
            localStorage.setItem("movimentacao", dados);
        }
    }
    return JSON.parse(dados || "[]");
}

// 1. Busca KM automático
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

// 2. Função Salvar (CORRIGIDA)
function salvar() {
    // Pegando os valores dos campos exatamente como estão no seu HTML
    const veiculoInput = document.getElementById('veiculo');
    const kmInput = document.getElementById('km');
    const motoristaInput = document.getElementById('motorista');
    const tipoInput = document.getElementById('tipo');
    const obsInput = document.getElementById('obs');

    const placaDigitada = veiculoInput.value.toUpperCase();
    const km = kmInput.value;
    const motorista = motoristaInput.value;
    const tipo = tipoInput.value;
    const obs = obsInput.value;

    // Validação
    if (!placaDigitada || !km || !motorista) {
        alert("Atenção: Viatura, KM e Motorista são obrigatórios!");
        return;
    }

    // Busca o nome do veículo na base para o relatório
    const veiculosBase = JSON.parse(localStorage.getItem("vehicles")) || [];
    const infoVeiculo = veiculosBase.find(v => v.placa.toUpperCase() === placaDigitada);
    const nomeVeiculo = infoVeiculo ? infoVeiculo.nome : "Não Identificado";

    // Cria o objeto do registro
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

    try {
        // Salva no Histórico
        const historico = lerMovimentacoes();
        historico.unshift(registro);
        localStorage.setItem("movimentacao", JSON.stringify(historico));

        // Atualiza o KM na base de veículos (vehicles)
        let idx = veiculosBase.findIndex(v => v.placa.toUpperCase() === placaDigitada);
        if (idx !== -1) { 
            veiculosBase[idx].kmAtual = km; 
            localStorage.setItem("vehicles", JSON.stringify(veiculosBase)); 
        }

        // Limpa os campos e atualiza a tela
        veiculoInput.value = "";
        kmInput.value = "";
        motoristaInput.value = "";
        obsInput.value = "";
        
        renderizarTabela();
        alert("Movimentação registrada com sucesso!");
    } catch (e) {
        console.error("Erro ao salvar:", e);
        alert("Erro técnico ao salvar. Verifique o console.");
    }
}

// 3. Renderiza a tabela
function renderizarTabela() {
    const dados = lerMovimentacoes();
    const tbody = document.getElementById('tabela');
    if (!tbody) return;

    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Nenhum registro encontrado</td></tr>';
        return;
    }

    tbody.innerHTML = dados.map((m) => `
        <tr>
            <td>${m.data}<br><small>${m.hora}</small></td>
            <td><strong>${m.placa}</strong><br><small>${m.veiculoNome || ''}</small></td>
            <td><span class="${m.tipo === 'Entrada' ? 'badge-entrada' : 'badge-saida'}">${m.tipo || 'Saída'}</span></td>
            <td>${m.motorista || m.vigilante || '-'}</td>
            <td>${m.km} KM</td>
            <td>
                <button class="btn-delete" onclick="excluirRegistro(${m.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 4. Excluir
function excluirRegistro(id) {
    if (confirm("Deseja realmente excluir este registro?")) {
        let dados = lerMovimentacoes();
        const novaLista = dados.filter(item => item.id !== id);
        localStorage.setItem("movimentacao", JSON.stringify(novaLista));
        renderizarTabela();
    }
}

// 5. PDF
function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dados = lerMovimentacoes();

    if (dados.length === 0) return alert("Sem dados para exportar!");

    doc.setFontSize(14);
    doc.text("JAPAN SECURITY - RELATÓRIO DE MOVIMENTAÇÃO", 14, 15);
    
    doc.autoTable({
        startY: 25,
        head: [['Data', 'Placa', 'Tipo', 'Motorista', 'KM']],
        body: dados.map(m => [m.data + " " + m.hora, m.placa, m.tipo || 'N/A', m.motorista || m.vigilante, m.km + " KM"]),
        theme: 'grid',
        headStyles: { fillColor: [230, 57, 70] }
    });
    doc.save('movimentacao.pdf');
}

// Inicialização
window.onload = () => {
    const v = JSON.parse(localStorage.getItem("vehicles")) || [];
    const dl = document.getElementById('listaVeiculos');
    if(dl) dl.innerHTML = v.map(i => `<option value="${i.placa}">${i.nome}</option>`).join('');
    renderizarTabela();
};
