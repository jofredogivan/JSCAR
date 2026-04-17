/**
 * LÓGICA DE MOVIMENTAÇÃO - JAPAN SECURITY
 * Filtros por Data/Hora e Exportação Agrupada
 */

async function carregarPlacas() {
    const veiculos = await dbListar("vehicles");
    document.getElementById('listaVeiculos').innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
}

async function carregarTabela() {
    const dados = await dbListar("movimentacao");
    const tbody = document.getElementById('tabelaMovimentacao');
    
    // Inverte para mostrar os mais recentes primeiro
    tbody.innerHTML = dados.reverse().map(d => `
        <tr>
            <td>${d.data}</td>
            <td><strong>${d.veiculo}</strong></td>
            <td><span class="badge ${d.tipo === 'SAÍDA' ? 'badge-saida' : 'badge-entrada'}">${d.tipo}</span></td>
            <td>${d.km} KM</td>
            <td>${d.responsavel}</td>
            <td style="text-align:right;">
                <button class="btn-delete" onclick="excluir(${d.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function salvarMovimento() {
    const veiculo = document.getElementById('veiculo').value.toUpperCase();
    const tipo = document.getElementById('tipo').value;
    const km = document.getElementById('km').value;
    const responsavel = document.getElementById('responsavel').value;
    const obs = document.getElementById('obs').value;

    if(!veiculo || !km || !responsavel) return alert("Preencha todos os campos obrigatórios!");

    const registro = {
        id: Date.now(),
        timestamp: new Date().getTime(), // Para ordenação e filtros técnicos
        data: new Date().toLocaleString('pt-BR'),
        veiculo: veiculo,
        tipo: tipo,
        km: km,
        responsavel: responsavel,
        obs: obs
    };

    await dbSalvar("movimentacao", registro);
    
    // Limpar campos
    document.getElementById('veiculo').value = '';
    document.getElementById('km').value = '';
    document.getElementById('obs').value = '';
    
    carregarTabela();
}

async function excluir(id) {
    if(confirm("Excluir este registro permanentemente?")) {
        await dbExcluir("movimentacao", id);
        carregarTabela();
    }
}

async function gerarRelatorioPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let dados = await dbListar("movimentacao");

    // Lógica de Filtro de Data e Hora
    const dataIni = document.getElementById('f_data_ini').value;
    const horaIni = document.getElementById('f_hora_ini').value;
    const dataFim = document.getElementById('f_data_fim').value;
    const horaFim = document.getElementById('f_hora_fim').value;

    if (dataIni && dataFim) {
        const inicio = new Date(`${dataIni}T${horaIni}`).getTime();
        const fim = new Date(`${dataFim}T${horaFim}`).getTime();
        
        dados = dados.filter(d => d.timestamp >= inicio && d.timestamp <= fim);
    }

    if (dados.length === 0) return alert("Nenhum registro encontrado para este período.");

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70);
    doc.text("MOVIMENTAÇÃO JAPAN SECURITY POR VEÍCULO", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Período: ${dataIni || 'Geral'} até ${dataFim || 'Geral'}`, 14, 22);

    // Agrupamento por Veículo (Padrão da sua planilha)
    const veiculosUnicos = [...new Set(dados.map(d => d.veiculo))];
    let currentY = 30;

    veiculosUnicos.forEach(vtr => {
        if (currentY > 260) { doc.addPage(); currentY = 20; }
        
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`VEÍCULO: ${vtr}`, 14, currentY);

        const movs = dados.filter(d => d.veiculo === vtr);
        const rows = movs.map(m => [m.data, m.tipo, m.responsavel, m.km + " KM", m.obs || "-"]);

        doc.autoTable({
            head: [['Data/Hora', 'Tipo', 'Motorista', 'KM', 'Obs']],
            body: rows,
            startY: currentY + 5,
            theme: 'striped',
            headStyles: { fillColor: [50, 50, 50] },
            styles: { fontSize: 8 }
        });

        currentY = doc.lastAutoTable.finalY + 15;
    });

    doc.save("movimentacao_japan_security.pdf");
}

window.onload = () => {
    carregarPlacas();
    carregarTabela();
};
