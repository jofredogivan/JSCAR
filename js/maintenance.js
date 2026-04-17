/* ============================================================
   ARQUIVO: js/maintenance.js
   ============================================================ */

function puxarKmAutomatico() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const vEncontrado = veiculos.find(v => v.placa.toUpperCase() === placa);
    if (vEncontrado) {
        document.getElementById('km').value = vEncontrado.kmAtual || 0;
    }
}

function salvar() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    const km = document.getElementById('km').value;
    const servico = document.getElementById('servico').value;
    const dataInput = document.getElementById('dataServico').value;
    const proxima = document.getElementById('proximaTroca').value;

    if(!placa || !km || !servico || !dataInput || !proxima) {
        return alert("Preencha todos os campos obrigatórios!");
    }

    const veiculosBase = JSON.parse(localStorage.getItem("vehicles")) || [];
    const infoVeiculo = veiculosBase.find(v => v.placa.toUpperCase() === placa);
    const nomeVeiculo = infoVeiculo ? infoVeiculo.nome : "Viatura";

    const registro = {
        id: Date.now(),
        placa: placa,
        veiculoNome: nomeVeiculo,
        km: km,
        tipo: servico,
        dataOriginal: dataInput, 
        dataExibicao: dataInput.split('-').reverse().join('/'),
        proxima: proxima
    };

    const historico = JSON.parse(localStorage.getItem("maintenance")) || [];
    historico.unshift(registro);
    localStorage.setItem("maintenance", JSON.stringify(historico));

    // Atualiza base de veículos para Dashboard e alertas
    let idx = veiculosBase.findIndex(v => v.placa.toUpperCase() === placa);
    if (idx !== -1) { 
        veiculosBase[idx].kmAtual = km;
        veiculosBase[idx].kmProximaTroca = proxima;
        localStorage.setItem("vehicles", JSON.stringify(veiculosBase)); 
    }

    alert("Manutenção registrada com sucesso!");
    location.reload();
}

function renderizarTabela() {
    let dados = JSON.parse(localStorage.getItem("maintenance")) || [];
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;

    if (inicio || fim) {
        dados = dados.filter(m => {
            return (!inicio || m.dataOriginal >= inicio) && (!fim || m.dataOriginal <= fim);
        });
    }

    const tbody = document.getElementById('tabela');
    if (!tbody) return;

    if (dados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Nenhum registro encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = dados.map((m) => `
        <tr>
            <td><strong>${m.placa}</strong><br><small>${m.veiculoNome}</small></td>
            <td>${m.dataExibicao}</td>
            <td>${m.tipo}</td>
            <td>${m.km} KM</td>
            <td>${m.proxima} KM</td>
            <td>
                <button onclick="excluirRegistro(${m.id})" style="color:red; background:none; border:none; cursor:pointer;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function excluirRegistro(id) {
    if (confirm("Deseja excluir este registro de manutenção?")) {
        let dados = JSON.parse(localStorage.getItem("maintenance")) || [];
        const novaLista = dados.filter(item => item.id !== id);
        localStorage.setItem("maintenance", JSON.stringify(novaLista));
        renderizarTabela();
    }
}

function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let dados = JSON.parse(localStorage.getItem("maintenance")) || [];
    
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;
    if (inicio || fim) {
        dados = dados.filter(m => {
            return (!inicio || m.dataOriginal >= inicio) && (!fim || m.dataOriginal <= fim);
        });
    }

    if (dados.length === 0) return alert("Não há dados para exportar.");

    // Agrupa para o PDF ficar organizado por carro
    const agrupado = dados.reduce((acc, item) => {
        const chave = `${item.placa} - ${item.veiculoNome}`;
        if (!acc[chave]) acc[chave] = [];
        acc[chave].push(item);
        return acc;
    }, {});

    doc.setFontSize(16);
    doc.setTextColor(200, 0, 0); // Vermelho Japan Security
    doc.text("HISTÓRICO DE MANUTENÇÃO - JAPAN SECURITY", 14, 15);

    let yPos = 25;
    Object.keys(agrupado).forEach(veiculo => {
        if (yPos > 240) { doc.addPage(); yPos = 20; }

        doc.setFillColor(60, 60, 60);
        doc.rect(14, yPos, 182, 8, 'F');
        doc.setTextColor(255);
        doc.setFontSize(10);
        doc.text(`VEÍCULO: ${veiculo}`, 18, yPos + 5.5);
        
        doc.autoTable({
            startY: yPos + 8,
            head: [['Data', 'Serviço', 'KM Realizado', 'Próxima Troca']],
            body: agrupado[veiculo].map(m => [m.dataExibicao, m.tipo, m.km + " KM", m.proxima + " KM"]),
            theme: 'grid',
            headStyles: { fillColor: [100, 100, 100] }
        });
        yPos = doc.lastAutoTable.finalY + 12;
    });

    doc.save(`manutencao_japan_${Date.now()}.pdf`);
}

window.onload = () => {
    const v = JSON.parse(localStorage.getItem("vehicles")) || [];
    const dl = document.getElementById('listaVeiculos');
    if (dl) dl.innerHTML = v.map(i => `<option value="${i.placa}">${i.nome}</option>`).join('');
    renderizarTabela();
};
