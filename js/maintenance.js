function puxarKmAutomatico() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const vEncontrado = veiculos.find(v => v.placa.toUpperCase() === placa);
    if (vEncontrado) document.getElementById('km').value = vEncontrado.kmAtual || 0;
}

function salvar() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    const km = document.getElementById('km').value;
    const servico = document.getElementById('servico').value;
    const dataInput = document.getElementById('dataServico').value;
    const proxima = document.getElementById('proximaTroca').value;

    if(!placa || !km || !servico || !dataInput || !proxima) return alert("Preencha todos os campos!");

    const veiculosBase = JSON.parse(localStorage.getItem("vehicles")) || [];
    const infoVeiculo = veiculosBase.find(v => v.placa.toUpperCase() === placa);
    const nomeVeiculo = infoVeiculo ? infoVeiculo.nome : "Não Identificado";

    const registro = {
        placa: placa,
        veiculoNome: nomeVeiculo,
        km: km,
        tipo: servico,
        // Mantemos o formato ISO para o filtro funcionar e formatamos na exibição
        dataOriginal: dataInput, 
        dataExibicao: dataInput.split('-').reverse().join('/'),
        proxima: proxima
    };

    const historico = JSON.parse(localStorage.getItem("maintenance")) || [];
    historico.unshift(registro);
    localStorage.setItem("maintenance", JSON.stringify(historico));

    // Atualiza base de veículos
    let idx = veiculosBase.findIndex(v => v.placa.toUpperCase() === placa);
    if (idx !== -1) { 
        veiculosBase[idx].kmAtual = km;
        veiculosBase[idx].kmProximaTroca = proxima;
        localStorage.setItem("vehicles", JSON.stringify(veiculosBase)); 
    }

    location.reload();
}

function renderizarTabela() {
    let dados = JSON.parse(localStorage.getItem("maintenance")) || [];
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;

    // Lógica de Filtro
    if (inicio || fim) {
        dados = dados.filter(m => {
            return (!inicio || m.dataOriginal >= inicio) && (!fim || m.dataOriginal <= fim);
        });
    }

    document.getElementById('tabela').innerHTML = dados.map((m, index) => `
        <tr>
            <td><strong>${m.placa}</strong><br><small>${m.veiculoNome}</small></td>
            <td>${m.dataExibicao}</td>
            <td>${m.tipo}</td>
            <td>${m.km} KM</td>
            <td>${m.proxima} KM</td>
            <td>
                <button class="btn-delete" onclick="excluirRegistro(${index})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function excluirRegistro(index) {
    if (confirm("Excluir este registro de manutenção?")) {
        let dados = JSON.parse(localStorage.getItem("maintenance")) || [];
        dados.splice(index, 1);
        localStorage.setItem("maintenance", JSON.stringify(dados));
        renderizarTabela();
    }
}

function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let dados = JSON.parse(localStorage.getItem("maintenance")) || [];
    
    // Aplicar o mesmo filtro da tabela no PDF
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;
    if (inicio || fim) {
        dados = dados.filter(m => {
            return (!inicio || m.dataOriginal >= inicio) && (!fim || m.dataOriginal <= fim);
        });
    }

    if (dados.length === 0) return alert("Não há dados para o período selecionado.");

    const agrupado = dados.reduce((acc, item) => {
        const chave = `${item.placa} - ${item.veiculoNome}`;
        if (!acc[chave]) acc[chave] = [];
        acc[chave].push(item);
        return acc;
    }, {});

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70);
    doc.text("HISTÓRICO DE MANUTENÇÃO - JAPAN SECURITY", 14, 15);

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
            head: [['Data', 'Serviço', 'KM Realizado', 'Próxima Troca']],
            body: agrupado[veiculo].map(m => [m.dataExibicao, m.tipo, m.km + " KM", m.proxima + " KM"]),
            theme: 'grid',
            headStyles: { fillColor: [60, 60, 60] }
        });
        yPos = doc.lastAutoTable.finalY + 15;
    });

    doc.save('manutencao_filtrada_japan.pdf');
}

window.onload = () => {
    const v = JSON.parse(localStorage.getItem("vehicles")) || [];
    document.getElementById('listaVeiculos').innerHTML = v.map(i => `<option value="${i.placa}">${i.nome}</option>`).join('');
    renderizarTabela();
};