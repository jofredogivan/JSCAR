/**
 * LÓGICA DE MOVIMENTAÇÃO - JAPAN SECURITY
 * KM Automático + Filtros + PDF Agrupado
 */

// 1. Monitora o campo de veículo para preencher o KM automaticamente
document.getElementById('veiculo').addEventListener('change', async function() {
    const placaDigitada = this.value.toUpperCase();
    if (!placaDigitada) return;

    // Busca todos os movimentos para achar o último KM desse veículo específico
    const movimentos = await dbListar("movimentacao");
    const vistorias = await dbListar("vistorias");
    const frota = await dbListar("vehicles");

    // Tenta achar o último registro de KM (seja na movimentação ou na vistoria)
    const todosRegistros = [...movimentos, ...vistorias].filter(r => r.veiculo === placaDigitada);
    
    if (todosRegistros.length > 0) {
        // Ordena pelo timestamp mais recente
        todosRegistros.sort((a, b) => b.timestamp - a.timestamp);
        document.getElementById('km').value = todosRegistros[0].km;
    } else {
        // Se nunca rodou, pega o KM inicial do cadastro da frota
        const carro = frota.find(v => v.placa === placaDigitada);
        if (carro) {
            document.getElementById('km').value = carro.kmAtual;
        }
    }
});

async function carregarPlacas() {
    const veiculos = await dbListar("vehicles");
    const datalist = document.getElementById('listaVeiculos');
    if(datalist) {
        datalist.innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
    }
}

async function carregarTabela() {
    const dados = await dbListar("movimentacao");
    const tbody = document.getElementById('tabelaMovimentacao');
    if(!tbody) return;
    
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

    if(!veiculo || !km || !responsavel) return alert("Preencha todos os campos!");

    const agora = new Date();
    const registro = {
        id: Date.now(),
        timestamp: agora.getTime(),
        data: agora.toLocaleString('pt-BR'),
        veiculo: veiculo,
        tipo: tipo,
        km: km,
        responsavel: responsavel,
        obs: obs
    };

    await dbSalvar("movimentacao", registro);
    
    // Limpar campos após salvar
    document.getElementById('veiculo').value = '';
    document.getElementById('km').value = '';
    document.getElementById('obs').value = '';
    
    carregarTabela();
}

async function gerarRelatorioPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let dados = await dbListar("movimentacao");

    const dataIni = document.getElementById('f_data_ini').value;
    const dataFim = document.getElementById('f_data_fim').value;

    if (dataIni && dataFim) {
        const start = new Date(dataIni + "T00:00").getTime();
        const end = new Date(dataFim + "T23:59").getTime();
        dados = dados.filter(d => d.timestamp >= start && d.timestamp <= end);
    }

    if (dados.length === 0) return alert("Nenhum registro no período.");

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70);
    doc.text("MOVIMENTAÇÃO JAPAN SECURITY", 14, 15);

    const veiculosUnicos = [...new Set(dados.map(d => d.veiculo))];
    let currentY = 30;

    veiculosUnicos.forEach(vtr => {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text(`VEÍCULO: ${vtr}`, 14, currentY);

        const movs = dados.filter(d => d.veiculo === vtr);
        const rows = movs.map(m => [m.data, m.tipo, m.responsavel, m.km + " KM", m.obs || "-"]);

        doc.autoTable({
            head: [['Data/Hora', 'Tipo', 'Motorista', 'KM', 'Obs']],
            body: rows,
            startY: currentY + 4,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [40, 40, 40] }
        });
        currentY = doc.lastAutoTable.finalY + 12;
    });

    doc.save("movimentacao_japan.pdf");
}

async function excluir(id) {
    if(confirm("Excluir registro?")) {
        await dbExcluir("movimentacao", id);
        carregarTabela();
    }
}

window.onload = () => {
    carregarPlacas();
    carregarTabela();
};
