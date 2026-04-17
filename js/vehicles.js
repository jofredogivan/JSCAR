async function carregar() {
    const lista = await dbListar("vehicles");
    const tbody = document.getElementById('tabelaVeiculos');
    if (!tbody) return;

    tbody.innerHTML = lista.map(v => `
        <tr class="clickable">
            <td onclick="prepararEdicao(${v.id})"><strong>${v.nome}</strong></td>
            <td onclick="prepararEdicao(${v.id})">${v.placa}</td>
            <td>${v.ano || '---'}</td>
            <td>${v.kmAtual} KM</td>
            <td style="text-align: right;">
                <button onclick="excluirVeiculo(${v.id})" style="background:none; border:none; color:#555; cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function salvarVeiculo() {
    const id = document.getElementById('veiculoId').value;
    const veiculoObj = {
        id: id ? parseInt(id) : Date.now(),
        nome: document.getElementById('nome').value,
        placa: document.getElementById('placa').value.toUpperCase(),
        ano: document.getElementById('ano').value,
        kmAtual: parseInt(document.getElementById('kmAtual').value) || 0
    };

    if(!veiculoObj.nome || !veiculoObj.placa) return alert("Preencha Modelo e Placa!");

    await dbSalvar("vehicles", veiculoObj);
    location.reload();
}

function prepararEdicao(id) {
    dbListar("vehicles").then(lista => {
        const v = lista.find(item => item.id === id);
        document.getElementById('veiculoId').value = v.id;
        document.getElementById('nome').value = v.nome;
        document.getElementById('placa').value = v.placa;
        document.getElementById('ano').value = v.ano;
        document.getElementById('kmAtual').value = v.kmAtual;
        document.getElementById('formTitle').innerHTML = `<i class="fas fa-edit"></i> Editando ${v.nome}`;
    });
}

async function excluirVeiculo(id) {
    if(confirm("Excluir este veículo da frota?")) {
        await dbExcluir("vehicles", id);
        carregar();
    }
}

// PDF DA FROTA (Simples, focado no cadastro)
async function gerarRelatorioFrotaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const lista = await dbListar("vehicles");

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70);
    doc.text("JAPAN SECURITY - RELATÓRIO DE FROTA ATIVA", 14, 20);

    const rows = lista.map(v => [v.nome, v.placa, v.ano, v.kmAtual + " KM"]);
    doc.autoTable({
        head: [['Modelo/VTR', 'Placa', 'Ano', 'KM Atual']],
        body: rows,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [30, 30, 30] }
    });

    doc.save("frota_japan.pdf");
}

window.onload = carregar;
