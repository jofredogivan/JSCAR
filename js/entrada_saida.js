/* ============================================================
   ARQUIVO: js/entrada_saida.js - Movimentação Inteligente
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

    // Busca em todas as tabelas o último registro desse carro
    const [movs, vists, frota] = await Promise.all([
        dbListar("movimentacao"),
        dbListar("vistorias"),
        dbListar("vehicles")
    ]);

    // Junta movimentações e vistorias para achar o KM mais recente
    const historico = [...movs, ...vists]
        .filter(r => (r.veiculo === placaDigitada || r.viatura === placaDigitada))
        .sort((a, b) => b.timestamp - a.timestamp);

    if (historico.length > 0) {
        document.getElementById('kmInput').value = historico[0].km;
    } else {
        // Se não tem histórico, pega o KM inicial do cadastro da frota
        const carro = frota.find(v => v.placa === placaDigitada);
        if (carro) document.getElementById('kmInput').value = carro.kmAtual;
    }
});

// 3. Registro de Entrada/Saída
async function registrarMovimentacao(tipo) {
    const vtr = document.getElementById('veiculoInput').value.toUpperCase();
    const km = document.getElementById('kmInput').value;

    if (!vtr || !km) {
        alert("Por favor, preencha a Viatura e o KM!");
        return;
    }

    const registro = {
        id: Date.now(),
        timestamp: new Date().getTime(),
        data: new Date().toLocaleString('pt-BR'),
        viatura: vtr,
        km: parseInt(km),
        tipo: tipo // ENTRADA ou SAÍDA
    };

    await dbSalvar("movimentacao", registro);
    
    // Limpa campos e recarrega
    document.getElementById('veiculoInput').value = "";
    document.getElementById('kmInput').value = "";
    carregarTabelaMovimentacao();
}

// 4. Carregar Tabela com Filtro de Data e Hora
async function carregarTabelaMovimentacao() {
    const registros = await dbListar("movimentacao");
    const tbody = document.getElementById('corpoTabela');
    if (!tbody) return;

    // Ordenar por mais recente
    registros.sort((a, b) => b.timestamp - a.timestamp);

    tbody.innerHTML = registros.map(reg => `
        <tr>
            <td>${reg.data}</td>
            <td><strong>${reg.viatura}</strong></td>
            <td>${reg.km}</td>
            <td style="color: ${reg.tipo === 'ENTRADA' ? '#27ae60' : '#e63946'}; font-weight: bold;">${reg.tipo}</td>
        </tr>
    `).join('');
}

// 5. Gerar PDF Separado por Veículo e Data
async function gerarPDFMovimentacao() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const registros = await dbListar("movimentacao");

    // Agrupar registros por Viatura
    const agrupadoPorVtr = registros.reduce((acc, reg) => {
        if (!acc[reg.viatura]) acc[reg.viatura] = [];
        acc[reg.viatura].push(reg);
        return acc;
    }, {});

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70);
    doc.text("JAPAN SECURITY - RELATÓRIO POR VIATURA", 14, 20);
    
    let yPos = 30;

    // Para cada viatura, cria uma seção
    for (const vtr in agrupadoPorVtr) {
        // Ordena os registros daquela viatura por data
        const logs = agrupadoPorVtr[vtr].sort((a, b) => a.timestamp - b.timestamp);
        
        const rows = logs.map(l => [l.data, l.km, l.tipo]);

        doc.autoTable({
            head: [[`VIATURA: ${vtr}`, 'KM', 'TIPO']],
            body: rows,
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40] },
            margin: { top: 30 }
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // Se o próximo grupo for estourar a página, cria uma nova
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
    }

    doc.save(`relatorio_movimentacao_japan.pdf`);
}

// Inicialização
window.onload = () => {
    carregarListaVeiculos();
    carregarTabelaMovimentacao();
};
