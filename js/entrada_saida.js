/* ============================================================
   ARQUIVO: js/entrada_saida.js (ATUALIZADO POR JOFRE)
   ============================================================ */

function lerMovimentacoes() {
    let dados = localStorage.getItem("movimentacao");
    if (!dados || dados === "[]") {
        dados = localStorage.getItem("vistorias");
        if (dados && dados !== "[]") {
            localStorage.setItem("movimentacao", dados);
        }
    }
    return JSON.parse(dados || "[]");
}

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
        // Usamos ISO para facilitar a filtragem por data depois
        dataIso: new Date().toISOString(), 
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

    let idx = veiculosBase.findIndex(v => v.placa.toUpperCase() === vInput.value.toUpperCase());
    if (idx !== -1) { 
        veiculosBase[idx].kmAtual = kInput.value; 
        localStorage.setItem("vehicles", JSON.stringify(veiculosBase)); 
    }

    alert("Registrado com sucesso!");
    vInput.value = ""; kInput.value = ""; mInput.value = ""; oInput.value = "";
    renderizarTabela();
}

// NOVA FUNÇÃO: Renderiza com suporte a Filtros
function renderizarTabela() {
    let dados = lerMovimentacoes();
    const tbody = document.getElementById('tabela');
    if (!tbody) return;

    // Lógica de Filtro por Data
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;

    if (inicio && fim) {
        const dInicio = new Date(inicio);
        const dFim = new Date(fim);
        dados = dados.filter(item => {
            const dItem = item.dataIso ? new Date(item.dataIso) : new Date(item.data.split('/').reverse().join('-'));
            return dItem >= dInicio && dItem <= dFim;
        });
    }

    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Nenhum registro encontrado no período.</td></tr>';
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

// NOVA FUNÇÃO: Gerar PDF (Conecta com os botões do HTML)
function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dados = lerMovimentacoes(); // Aqui você também pode aplicar o filtro se quiser

    doc.setFontSize(16);
    doc.text("JAPAN SECURITY - RELATÓRIO DE MOVIMENTAÇÃO", 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 22);

    const rows = dados.map(m => [
        `${m.data} ${m.hora}`,
        m.placa,
        m.tipo,
        m.motorista || m.vigilante,
        `${m.km} KM`
    ]);

    doc.autoTable({
        startY: 30,
        head: [['Data/Hora', 'Viatura', 'Operação', 'Motorista', 'KM']],
        body: rows,
        theme: 'striped'
    });

    doc.save(`movimentacao_${Date.now()}.pdf`);
}

function excluir(id) {
    if (confirm("Deseja excluir este registro?")) {
        let dados = lerMovimentacoes();
        localStorage.setItem("movimentacao", JSON.stringify(dados.filter(item => item.id !== id)));
        renderizarTabela();
    }
}

window.onload = () => {
    const v = JSON.parse(localStorage.getItem("vehicles")) || [];
    const dl = document.getElementById('listaVeiculos');
    if (dl) dl.innerHTML = v.map(i => `<option value="${i.placa}">${i.nome}</option>`).join('');
    renderizarTabela();
};
