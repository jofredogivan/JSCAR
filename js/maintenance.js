/* ============================================================
   ARQUIVO: js/maintenance.js
   ============================================================ */

async function inicializar() {
    const veiculos = await dbListar("vehicles");
    const dl = document.getElementById('listaVeiculos');
    if (dl) {
        dl.innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
    }
    // Define a data de hoje no campo de data por padrão
    const dataInput = document.getElementById('dataServico');
    if (dataInput) dataInput.value = new Date().toISOString().split('T')[0];
    
    renderizarTabela();
}

async function puxarKmAutomatico() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    const veiculos = await dbListar("vehicles");
    const vEncontrado = veiculos.find(v => v.placa === placa);
    if (vEncontrado) {
        document.getElementById('km').value = vEncontrado.kmAtual || "";
    }
}

async function salvar() {
    const vInput = document.getElementById('veiculo');
    const kInput = document.getElementById('km');
    const pInput = document.getElementById('proximaTroca');
    const sInput = document.getElementById('servico');
    const dInput = document.getElementById('dataServico');

    if (!vInput.value || !kInput.value || !pInput.value) {
        return alert("Preencha Placa, KM Realizado e Próxima Troca!");
    }

    const placa = vInput.value.toUpperCase();

    const manutencao = {
        id: Date.now(),
        placa: placa,
        kmRealizado: parseInt(kInput.value),
        kmProximaTroca: parseInt(pInput.value),
        servico: sInput.value,
        data: dInput.value.split('-').reverse().join('/'), // Converte para PT-BR
        dataOriginal: dInput.value // Para filtros
    };

    await dbSalvar("maintenance", manutencao);

    // CRITICAL: Atualiza o veículo com a data da próxima troca para o Dashboard avisar
    const veiculos = await dbListar("vehicles");
    const vIdx = veiculos.find(v => v.placa === placa);
    if (vIdx) {
        vIdx.kmAtual = manutencao.kmRealizado;
        vIdx.kmProximaTroca = manutencao.kmProximaTroca;
        await dbSalvar("vehicles", vIdx);
    }

    alert("Manutenção registrada e alertas atualizados!");
    renderizarTabela();
}

async function renderizarTabela() {
    let dados = await dbListar("maintenance");
    const tbody = document.getElementById('tabela');
    if (!tbody) return;

    // Filtro de Data (se preenchido)
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;

    if (inicio && fim) {
        dados = dados.filter(m => m.dataOriginal >= inicio && m.dataOriginal <= fim);
    }

    tbody.innerHTML = dados.map(m => `
        <tr>
            <td><strong>${m.placa}</strong></td>
            <td>${m.data}</td>
            <td>${m.servico}</td>
            <td>${m.kmRealizado} KM</td>
            <td style="color: #f1c40f;">${m.kmProximaTroca} KM</td>
            <td>
                <button onclick="excluirManutencao(${m.id})" style="background:none; border:none; color:#e63946; cursor:pointer;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function excluirManutencao(id) {
    if (confirm("Excluir este registro de manutenção?")) {
        await dbExcluir("maintenance", id);
        renderizarTabela();
    }
}

// Função para gerar o Relatório PDF
async function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dados = await dbListar("maintenance");

    doc.setFontSize(18);
    doc.text("JAPAN SECURITY - RELATÓRIO DE MANUTENÇÃO", 14, 20);
    
    const colunas = ["Veículo", "Data", "Serviço", "KM Realizado", "Próxima Troca"];
    const linhas = dados.map(m => [m.placa, m.data, m.servico, m.kmRealizado, m.kmProximaTroca]);

    doc.autoTable({
        head: [colunas],
        body: linhas,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80] }
    });

    doc.save(`manutencao_japan_security_${Date.now()}.pdf`);
}

window.onload = inicializar;
