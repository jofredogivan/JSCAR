/* ============================================================
   ARQUIVO: js/entrada_saida.js - Design & Funcionalidades Premium
   Atualizado para Lançamento Retroativo (Data/Hora Manual)
   ============================================================ */

window.onload = () => {
    // Configura data/hora atual nos campos de registro por padrão
    const agora = new Date();
    const campoData = document.getElementById('reg_data');
    const campoHora = document.getElementById('reg_hora');
    
    if(campoData) campoData.value = agora.toISOString().split('T')[0];
    if(campoHora) campoHora.value = agora.toTimeString().slice(0, 5);

    carregarListaVeiculos();
    carregarTabelaMovimentacao();
};

async function carregarListaVeiculos() {
    const veiculos = await dbListar("vehicles");
    const datalist = document.getElementById('listaVeiculos');
    if (datalist) {
        datalist.innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
    }
}

// Busca Automática de KM ao trocar a viatura
document.getElementById('veiculoInput').addEventListener('change', async function() {
    const placaDigitada = this.value.toUpperCase();
    if (!placaDigitada) return;

    const [movs, vists, frota] = await Promise.all([
        dbListar("movimentacao"),
        dbListar("vistorias"),
        dbListar("vehicles")
    ]);

    const historico = [...movs, ...vists]
        .filter(r => (r.viatura === placaDigitada || r.veiculo === placaDigitada))
        .sort((a, b) => b.timestamp - a.timestamp);

    if (historico.length > 0) {
        document.getElementById('kmInput').value = historico[0].km;
    } else {
        const carro = frota.find(v => v.placa === placaDigitada);
        if (carro) document.getElementById('kmInput').value = carro.kmAtual;
    }
});

async function registrarMovimentacao(tipo) {
    const vtr = document.getElementById('veiculoInput').value.toUpperCase();
    const km = document.getElementById('kmInput').value;
    const motorista = document.getElementById('motoristaInput').value;
    
    // Captura os valores dos campos de data/hora manuais
    const dataManual = document.getElementById('reg_data').value;
    const horaManual = document.getElementById('reg_hora').value;

    if (!vtr || !km || !motorista || !dataManual || !horaManual) {
        alert("Preencha todos os campos corretamente!");
        return;
    }

    // Monta o timestamp baseado na data/hora escolhida pelo usuário
    const dataHoraRegistro = new Date(`${dataManual}T${horaManual}`);

    const registro = {
        id: Date.now(),
        timestamp: dataHoraRegistro.getTime(),
        data: dataHoraRegistro.toLocaleString('pt-BR'),
        viatura: vtr,
        km: parseInt(km),
        motorista: motorista,
        tipo: tipo
    };

    await dbSalvar("movimentacao", registro);
    
    // Limpa os campos de texto para o próximo uso
    document.getElementById('veiculoInput').value = "";
    document.getElementById('kmInput').value = "";
    document.getElementById('motoristaInput').value = "";
    
    carregarTabelaMovimentacao();
}

async function excluirRegistro(id) {
    if (confirm("Deseja realmente excluir este registro?")) {
        await dbExcluir("movimentacao", id);
        carregarTabelaMovimentacao();
    }
}

async function carregarTabelaMovimentacao() {
    const [registros, frota] = await Promise.all([
        dbListar("movimentacao"),
        dbListar("vehicles")
    ]);
    
    const tbody = document.getElementById('corpoTabela');
    if (!tbody) return;

    const dIni = document.getElementById('data_ini').value;
    const dFim = document.getElementById('data_fim').value;

    let filtrados = registros;
    
    if (dIni && dFim) {
        const start = new Date(dIni).getTime();
        const end = new Date(dFim).getTime();
        filtrados = registros.filter(r => r.timestamp >= start && r.timestamp <= end);
    }

    filtrados.sort((a, b) => b.timestamp - a.timestamp);

    tbody.innerHTML = filtrados.map(reg => {
        const dadosCarro = frota.find(f => f.placa === reg.viatura);
        const modelo = dadosCarro ? dadosCarro.nome : "Viatura";
        const corStatus = reg.tipo === 'ENTRADA' ? '#27ae60' : '#e63946';

        return `
        <tr style="border-left: 4px solid ${corStatus};">
            <td><small>${reg.data}</small></td>
            <td>
                <strong style="color: #eee;">${reg.viatura}</strong><br>
                <small style="color: #e63946; font-weight: bold; text-transform: uppercase;">${modelo}</small><br>
                <small style="color: #888;">${reg.motorista}</small>
            </td>
            <td>${reg.km}</td>
            <td>
                <span style="color: ${corStatus}; font-weight: bold; font-size: 0.7rem;">${reg.tipo}</span>
            </td>
            <td style="text-align: right;">
                <button onclick="excluirRegistro(${reg.id})" style="background:none; border:none; color: #555; cursor: pointer; padding: 5px;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `}).join('');
}

async function gerarPDFMovimentacao() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const [registros, frota] = await Promise.all([
        dbListar("movimentacao"),
        dbListar("vehicles")
    ]);

    const dIni = document.getElementById('data_ini').value;
    const dFim = document.getElementById('data_fim').value;

    let filtrados = registros;
    if (dIni && dFim) {
        const start = new Date(dIni).getTime();
        const end = new Date(dFim).getTime();
        filtrados = registros.filter(r => r.timestamp >= start && r.timestamp <= end);
    }

    if (filtrados.length === 0) return alert("Nenhum dado para o período.");

    const dataFormatada = (dt) => dt ? new Date(dt).toLocaleString('pt-BR').substring(0, 16) : '---';

    doc.setFillColor(230, 57, 70); 
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("JAPAN SECURITY - CONTROLE DE FROTA", 14, 17);
    doc.setFontSize(9);
    doc.text(`Período: ${dataFormatada(dIni)} até ${dataFormatada(dFim)}`, 14, 22);

    let yPos = 35;
    const agrupado = filtrados.reduce((acc, reg) => {
        if (!acc[reg.viatura]) acc[reg.viatura] = [];
        acc[reg.viatura].push(reg);
        return acc;
    }, {});

    for (const vtr in agrupado) {
        const carro = frota.find(f => f.placa === vtr);
        const modelo = carro ? carro.nome : "";
        const logs = agrupado[vtr].sort((a, b) => a.timestamp - b.timestamp);
        
        doc.autoTable({
            head: [[{content: `VEÍCULO: ${vtr} - ${modelo}`, colSpan: 4, styles: {halign: 'center', fillColor: [30, 30, 30]}}], 
                    ['DATA/HORA', 'MOTORISTA', 'KM', 'STATUS']],
            body: logs.map(l => [l.data, l.motorista, l.km, l.tipo]),
            startY: yPos,
            theme: 'striped',
            headStyles: { fillColor: [60, 60, 60] },
            styles: { fontSize: 8 },
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.index === 3) {
                    data.cell.styles.textColor = (data.cell.raw === 'ENTRADA') ? [39, 174, 96] : [230, 57, 70];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });
        yPos = doc.lastAutoTable.finalY + 15;
        if (yPos > 270) { doc.addPage(); yPos = 20; }
    }

    doc.save(`Relatorio_Frota_JapanSecurity.pdf`);
}
