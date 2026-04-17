/* ============================================================
   ARQUIVO: js/entrada_saida.js - Movimentação Japan Security
   ============================================================ */

// 1. Carrega a lista de veículos nos inputs de autocompletar
async function carregarListaVeiculos() {
    const veiculos = await dbListar("vehicles");
    const datalist = document.getElementById('listaVeiculos');
    if (datalist) {
        datalist.innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
    }
}

// 2. Reconhecimento Automático de KM ao selecionar/digitar veículo
document.getElementById('veiculoInput').addEventListener('change', async function() {
    const placaDigitada = this.value.toUpperCase();
    if (!placaDigitada) return;

    const [movs, vists, frota] = await Promise.all([
        dbListar("movimentacao"),
        dbListar("vistorias"),
        dbListar("vehicles")
    ]);

    // Busca o KM mais recente em movimentações ou vistorias
    const historico = [...movs, ...vists]
        .filter(r => (r.veiculo === placaDigitada || r.viatura === placaDigitada))
        .sort((a, b) => b.timestamp - a.timestamp);

    if (historico.length > 0) {
        document.getElementById('kmInput').value = historico[0].km;
    } else {
        const carro = frota.find(v => v.placa === placaDigitada);
        if (carro) document.getElementById('kmInput').value = carro.kmAtual;
    }
});

// 3. Registro de Entrada/Saída com Motorista
async function registrarMovimentacao(tipo) {
    const vtr = document.getElementById('veiculoInput').value.toUpperCase();
    const km = document.getElementById('kmInput').value;
    const motorista = document.getElementById('motoristaInput').value;

    if (!vtr || !km || !motorista) {
        alert("Atenção: Viatura, KM e Motorista são obrigatórios!");
        return;
    }

    const registro = {
        id: Date.now(),
        timestamp: new Date().getTime(),
        data: new Date().toLocaleString('pt-BR'),
        viatura: vtr,
        km: parseInt(km),
        motorista: motorista,
        tipo: tipo 
    };

    await dbSalvar("movimentacao", registro);
    
    // Limpa campos e recarrega a tela
    document.getElementById('veiculoInput').value = "";
    document.getElementById('kmInput').value = "";
    document.getElementById('motoristaInput').value = "";
    carregarTabelaMovimentacao();
}

// 4. Carregar Tabela com Nome do Motorista
async function carregarTabelaMovimentacao() {
    const registros = await dbListar("movimentacao");
    const tbody = document.getElementById('corpoTabela');
    if (!tbody) return;

    registros.sort((a, b) => b.timestamp - a.timestamp);

    tbody.innerHTML = registros.map(reg => `
        <tr>
            <td><small>${reg.data}</small></td>
            <td><strong>${reg.viatura}</strong><br><span style="font-size: 0.7rem; color: #888;">${reg.motorista}</span></td>
            <td>${reg.km}</td>
            <td style="color: ${reg.tipo === 'ENTRADA' ? '#27ae60' : '#e63946'}; font-weight: bold;">${reg.tipo}</td>
        </tr>
    `).join('');
}

// 5. Gerar PDF Separado por Veículo e Ordenado por Data
async function gerarPDFMovimentacao() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const registros = await dbListar("movimentacao");

    if (registros.length === 0) return alert("Não há dados para gerar o PDF.");

    // Agrupar registros por Viatura
    const agrupadoPorVtr = registros.reduce((acc, reg) => {
        if (!acc[reg.viatura]) acc[reg.viatura] = [];
        acc[reg.viatura].push(reg);
        return acc;
    }, {});

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70);
    doc.text("JAPAN SECURITY - RELATÓRIO DE MOVIMENTAÇÃO", 14, 20);
    
    let yPos = 30;

    for (const vtr in agrupadoPorVtr) {
        // Ordena do mais antigo para o mais novo dentro do grupo do veículo
        const logs = agrupadoPorVtr[vtr].sort((a, b) => a.timestamp - b.timestamp);
        
        const rows = logs.map(l => [l.data, l.motorista, l.km, l.tipo]);

        doc.autoTable({
            head: [[`VIATURA: ${vtr}`, 'MOTORISTA', 'KM', 'TIPO']],
            body: rows,
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40] },
            styles: { fontSize: 8 },
            margin: { top: 30 }
        });

        yPos = doc.lastAutoTable.finalY + 15;

        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
    }

    doc.save(`movimentacao_japan_security.pdf`);
}

// Inicialização
window.onload = () => {
    carregarListaVeiculos();
    carregarTabelaMovimentacao();
};
