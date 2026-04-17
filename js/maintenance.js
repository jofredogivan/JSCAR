/* ============================================================
   ARQUIVO: js/maintenance.js
   ============================================================ */

async function carregarPlacas() {
    const veiculos = await dbListar("vehicles");
    const list = document.getElementById('listaVeiculos');
    if (list) {
        list.innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
    }
}

// 1. Puxa KM e sugere próxima troca (+10.000km)
async function puxarKmAutomatico() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    if (!placa) return;

    const [movs, vists, frota] = await Promise.all([
        dbListar("movimentacao"),
        dbListar("vistorias"),
        dbListar("vehicles")
    ]);

    // Encontra o KM mais alto registrado
    const historico = [...movs, ...vists]
        .filter(r => r.veiculo === placa)
        .sort((a, b) => b.timestamp - a.timestamp);

    let kmAtual = 0;
    if (historico.length > 0) {
        kmAtual = parseInt(historico[0].km);
    } else {
        const carro = frota.find(v => v.placa === placa);
        if (carro) kmAtual = parseInt(carro.kmAtual);
    }

    document.getElementById('km').value = kmAtual;
    // Sugestão padrão de +10.000 KM para troca de óleo
    document.getElementById('proximaTroca').value = kmAtual + 10000;
    document.getElementById('dataServico').valueAsDate = new Date();
}

// 2. Salva e atualiza o status do veículo
async function salvar() {
    const vtr = document.getElementById('veiculo').value.toUpperCase();
    const kmRealizado = parseInt(document.getElementById('km').value);
    const proximaTroca = parseInt(document.getElementById('proximaTroca').value);
    const servico = document.getElementById('servico').value;
    const data = document.getElementById('dataServico').value;

    if (!vtr || !kmRealizado || !servico || !data) {
        return alert("Preencha todos os campos obrigatórios!");
    }

    const registro = {
        id: Date.now(),
        timestamp: new Date(data).getTime(),
        veiculo: vtr,
        data: data,
        servico: servico,
        kmRealizado: kmRealizado,
        proximaTroca: proximaTroca
    };

    // Salva na tabela de histórico de manutenção
    await dbSalvar("manutencoes", registro);

    // ATUALIZAÇÃO CRÍTICA: Atualiza o cadastro do veículo para zerar o alerta no Dashboard
    const frota = await dbListar("vehicles");
    const veiculoIndex = frota.findIndex(v => v.placa === vtr);
    
    if (veiculoIndex !== -1) {
        const veiculoAtualizado = frota[veiculoIndex];
        veiculoAtualizado.kmUltimaTroca = kmRealizado; // Define que a troca foi feita NESTE KM
        await dbSalvar("vehicles", veiculoAtualizado);
    }

    alert("Manutenção registrada! O alerta do veículo foi atualizado.");
    location.reload();
}

async function renderizarTabela() {
    const dados = await dbListar("manutencoes");
    const tbody = document.getElementById('tabela');
    const dIni = document.getElementById('dataInicio').value;
    const dFim = document.getElementById('dataFim').value;

    let filtrados = dados;
    if (dIni && dFim) {
        filtrados = dados.filter(d => d.data >= dIni && d.data <= dFim);
    }

    tbody.innerHTML = filtrados.reverse().map(d => `
        <tr>
            <td><strong>${d.veiculo}</strong></td>
            <td>${new Date(d.data).toLocaleDateString('pt-BR')}</td>
            <td>${d.servico}</td>
            <td>${d.kmRealizado} KM</td>
            <td style="color: #27ae60; font-weight:bold;">${d.proximaTroca} KM</td>
            <td><button class="btn-delete" onclick="excluir(${d.id})"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

async function excluir(id) {
    if (confirm("Deseja excluir este registro de manutenção?")) {
        await dbExcluir("manutencoes", id);
        renderizarTabela();
    }
}

// 3. Geração de PDF de Manutenção
function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(230, 57, 70);
    doc.text("JAPAN SECURITY - RELATÓRIO DE MANUTENÇÃO", 14, 20);
    
    doc.autoTable({
        html: '.modern-table',
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [230, 57, 70] },
        columns: [
            { header: 'Veículo', dataKey: 'veiculo' },
            { header: 'Data', dataKey: 'data' },
            { header: 'Serviço', dataKey: 'servico' },
            { header: 'KM Realizado', dataKey: 'km' },
            { header: 'Próxima Troca', dataKey: 'proxima' }
        ]
    });

    doc.save(`manutencao_japan_${Date.now()}.pdf`);
}

window.onload = () => {
    carregarPlacas();
    renderizarTabela();
};
