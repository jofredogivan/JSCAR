// 1. Busca KM automático ao selecionar veículo
function puxarKmAutomatico() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const vEncontrado = veiculos.find(v => v.placa.toUpperCase() === placa);
    if (vEncontrado) {
        document.getElementById('km').value = vEncontrado.kmAtual || 0;
    }
}

// 2. Salva o registro e atualiza o KM na base global
function salvar() {
    const placaDigitada = document.getElementById('veiculo').value.toUpperCase();
    const km = document.getElementById('km').value;
    const motorista = document.getElementById('motorista').value;
    const obs = document.getElementById('obs').value;
    const tipo = document.getElementById('tipo').value;

    if (!placaDigitada || !km || !motorista) return alert("Preencha os campos obrigatórios!");

    const veiculosBase = JSON.parse(localStorage.getItem("vehicles")) || [];
    const infoVeiculo = veiculosBase.find(v => v.placa.toUpperCase() === placaDigitada);
    const nomeVeiculo = infoVeiculo ? infoVeiculo.nome : "Não Identificado";

    const registro = {
        id: Date.now(), // ID único para exclusão segura
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        placa: placaDigitada,
        veiculoNome: nomeVeiculo,
        tipo: tipo,
        km: km,
        motorista: motorista,
        obs: obs
    };

    const historico = JSON.parse(localStorage.getItem("movimentacao")) || [];
    historico.unshift(registro);
    localStorage.setItem("movimentacao", JSON.stringify(historico));

    // Atualiza o KM real do veículo na base principal
    let idx = veiculosBase.findIndex(v => v.placa.toUpperCase() === placaDigitada);
    if (idx !== -1) { 
        veiculosBase[idx].kmAtual = km; 
        localStorage.setItem("vehicles", JSON.stringify(veiculosBase)); 
    }

    renderizarTabela();
    limparCampos();
}

function limparCampos() {
    document.getElementById('veiculo').value = "";
    document.getElementById('km').value = "";
    document.getElementById('motorista').value = "";
    document.getElementById('obs').value = "";
}

// 3. Renderiza a tabela com filtro e botão excluir
function renderizarTabela() {
    let dados = JSON.parse(localStorage.getItem("movimentacao")) || [];
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;

    if (inicio || fim) {
        dados = dados.filter(i => {
            const d = i.data.split('/').reverse().join('-');
            return (!inicio || d >= inicio) && (!fim || d <= fim);
        });
    }

    document.getElementById('tabela').innerHTML = dados.map((m, index) => `
        <tr>
            <td>${m.data} ${m.hora}</td>
            <td><strong>${m.placa}</strong><br><small>${m.veiculoNome}</small></td>
            <td><span class="${m.tipo === 'Entrada' ? 'badge-entrada' : 'badge-saida'}">${m.tipo}</span></td>
            <td>${m.motorista}</td>
            <td>${m.km} KM</td>
            <td>${m.obs || '-'}</td>
            <td>
                <button class="btn-delete" onclick="excluirRegistro(${index})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 4. Excluir Registro
function excluirRegistro(index) {
    if (confirm("Deseja realmente excluir este lançamento?")) {
        let dados = JSON.parse(localStorage.getItem("movimentacao")) || [];
        dados.splice(index, 1);
        localStorage.setItem("movimentacao", JSON.stringify(dados));
        renderizarTabela();
    }
}

// 5. PDF Agrupado por VEÍCULO (Com Nome e Placa)
function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dados = JSON.parse(localStorage.getItem("movimentacao")) || [];
    
    if (dados.length === 0) return alert("Nada para exportar.");

    const agrupado = dados.reduce((acc, item) => {
        const chave = `${item.placa} - ${item.veiculoNome}`;
        if (!acc[chave]) acc[chave] = [];
        acc[chave].push(item);
        return acc;
    }, {});

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70);
    doc.text("MOVIMENTAÇÃO JAPAN SECURITY POR VEÍCULO", 14, 15);

    let yPos = 25;
    Object.keys(agrupado).forEach(veiculo => {
        if (yPos > 230) { doc.addPage(); yPos = 20; }

        doc.setFillColor(230, 57, 70);
        doc.rect(14, yPos, 182, 8, 'F');
        doc.setTextColor(255);
        doc.setFontSize(10);
        doc.text(`VEÍCULO: ${veiculo}`, 18, yPos + 5.5);
        doc.setTextColor(0);
        yPos += 10;

        doc.autoTable({
            startY: yPos,
            head: [['Data/Hora', 'Tipo', 'Motorista', 'KM', 'Obs']],
            body: agrupado[veiculo].map(m => [m.data + " " + m.hora, m.tipo, m.motorista, m.km + " KM", m.obs]),
            theme: 'grid',
            headStyles: { fillColor: [60, 60, 60] }
        });
        yPos = doc.lastAutoTable.finalY + 15;
    });
    doc.save('movimentacao_japan.pdf');
}

// 6. Carregamento Inicial
window.onload = () => {
    const v = JSON.parse(localStorage.getItem("vehicles")) || [];
    document.getElementById('listaVeiculos').innerHTML = v.map(i => `<option value="${i.placa}">${i.nome}</option>`).join('');
    renderizarTabela();
};