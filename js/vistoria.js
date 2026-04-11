// Função para puxar o KM automático ao selecionar o veículo
function puxarKmAutomatico() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const vEncontrado = veiculos.find(v => v.placa.toUpperCase() === placa);
    if (vEncontrado) {
        document.getElementById('km').value = vEncontrado.kmAtual || 0;
    }
}

// Função para converter a imagem em Base64 (para salvar no LocalStorage)
async function converterImagem(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// Função Salvar Vistoria
async function salvar() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    const km = document.getElementById('km').value;
    const vigilante = document.getElementById('vigilante').value;
    const obs = document.getElementById('obsAvaria').value;
    const fotoFile = document.getElementById('fotoVeiculo').files[0];

    // Checklist
    const itens = {
        oleo: document.getElementById('oleo').checked ? "OK" : "PENDENTE",
        agua: document.getElementById('agua').checked ? "OK" : "PENDENTE",
        pneus: document.getElementById('pneus').checked ? "OK" : "PENDENTE",
        limpeza: document.getElementById('limpeza').checked ? "OK" : "PENDENTE",
        macaco: document.getElementById('macaco').checked ? "OK" : "PENDENTE",
        triangulo: document.getElementById('triangulo').checked ? "OK" : "PENDENTE"
    };

    if (!placa || !km || !vigilante) {
        return alert("Por favor, preencha Veículo, KM e Vigilante!");
    }

    let fotoBase64 = "";
    if (fotoFile) {
        fotoBase64 = await converterImagem(fotoFile);
    }

    const agora = new Date();
    const registro = {
        placa: placa,
        km: km,
        vigilante: vigilante,
        obs: obs,
        itens: itens,
        foto: fotoBase64,
        dataISO: agora.toISOString(), // Para o filtro funcionar
        dataExibicao: agora.toLocaleString('pt-BR') // Para a tabela
    };

    // Salva no histórico de vistorias
    const vistorias = JSON.parse(localStorage.getItem("vistorias")) || [];
    vistorias.unshift(registro);
    localStorage.setItem("vistorias", JSON.stringify(vistorias));

    // Atualiza o KM na base do veículo
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const idx = veiculos.findIndex(v => v.placa.toUpperCase() === placa);
    if (idx !== -1) {
        veiculos[idx].kmAtual = km;
        localStorage.setItem("vehicles", JSON.stringify(veiculos));
    }

    alert("Vistoria salva com sucesso!");
    location.reload();
}

// Função para Renderizar Tabela com Filtro
function renderizarTabela() {
    let dados = JSON.parse(localStorage.getItem("vistorias")) || [];
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;

    if (inicio || fim) {
        dados = dados.filter(item => {
            const dataItem = item.dataISO;
            return (!inicio || dataItem >= inicio) && (!fim || dataItem <= fim);
        });
    }

    const tbody = document.getElementById('tabela');
    tbody.innerHTML = dados.map((v, index) => `
        <tr>
            <td>${v.dataExibicao}</td>
            <td><strong>${v.placa}</strong></td>
            <td>${v.vigilante}</td>
            <td>${v.km} KM</td>
            <td><small>${v.obs || '-'}</small></td>
            <td>
                <button class="btn-delete" onclick="excluirVistoria(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function excluirVistoria(index) {
    if (confirm("Deseja excluir este registro?")) {
        let vistorias = JSON.parse(localStorage.getItem("vistorias")) || [];
        vistorias.splice(index, 1);
        localStorage.setItem("vistorias", JSON.stringify(vistorias));
        renderizarTabela();
    }
}

// Função para Gerar PDF Organizado por Veículo
function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let dados = JSON.parse(localStorage.getItem("vistorias")) || [];

    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;

    if (inicio || fim) {
        dados = dados.filter(item => {
            const dataItem = item.dataISO;
            return (!inicio || dataItem >= inicio) && (!fim || dataItem <= fim);
        });
    }

    if (dados.length === 0) return alert("Nenhum dado encontrado para o filtro.");

    // Agrupar por veículo
    const agrupado = dados.reduce((acc, item) => {
        if (!acc[item.placa]) acc[item.placa] = [];
        acc[item.placa].push(item);
        return acc;
    }, {});

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70);
    doc.text("RELATÓRIO DE VISTORIAS - JAPAN SECURITY", 14, 15);

    let yPos = 25;

    Object.keys(agrupado).forEach(placa => {
        if (yPos > 240) { doc.addPage(); yPos = 20; }

        doc.setFillColor(60, 60, 60);
        doc.rect(14, yPos, 182, 8, 'F');
        doc.setTextColor(255);
        doc.setFontSize(10);
        doc.text(`VEÍCULO: ${placa}`, 18, yPos + 5.5);
        doc.setTextColor(0);
        
        yPos += 10;

        const rows = agrupado[placa].map(v => [
            v.dataExibicao,
            v.vigilante,
            v.km,
            `Óleo: ${v.itens.oleo}\nÁgua: ${v.itens.agua}\nPneus: ${v.itens.pneus}\nLimpeza: ${v.itens.limpeza}\nMacaco: ${v.itens.macaco}\nTriângulo: ${v.itens.triangulo}`,
            v.obs || "-"
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Data/Hora', 'Vigilante', 'KM', 'Checklist', 'Observações']],
            body: rows,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [230, 57, 70] }
        });

        yPos = doc.lastAutoTable.finalY + 10;
    });

    doc.save(`vistorias_japan_security.pdf`);
}

// Ao carregar a página
window.onload = () => {
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const datalist = document.getElementById('listaVeiculos');
    datalist.innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
    renderizarTabela();
};
