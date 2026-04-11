// Puxar KM automático igual ao Entrada/Saída
function puxarKmAutomatico() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const vEncontrado = veiculos.find(v => v.placa.toUpperCase() === placa);
    if (vEncontrado) document.getElementById('km').value = vEncontrado.kmAtual || 0;
}

// Converter imagem
async function obterBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function salvar() {
    const placaDigitada = document.getElementById('veiculo').value.toUpperCase();
    const km = document.getElementById('km').value;
    const vigilante = document.getElementById('vigilante').value;
    const fotoFile = document.getElementById('fotoVeiculo').files[0];
    
    if(!placaDigitada || !km) return alert("Preencha Placa e KM!");

    const veiculosBase = JSON.parse(localStorage.getItem("vehicles")) || [];
    const infoVeiculo = veiculosBase.find(v => v.placa.toUpperCase() === placaDigitada);
    const nomeVeiculo = infoVeiculo ? infoVeiculo.nome : "Não Identificado";

    let fotoBase64 = "";
    if (fotoFile) fotoBase64 = await obterBase64(fotoFile);

    const checklist = [];
    if(document.getElementById('oleo').checked) checklist.push("Óleo");
    if(document.getElementById('agua').checked) checklist.push("Água");
    if(document.getElementById('pneus').checked) checklist.push("Pneus");
    if(document.getElementById('limpeza').checked) checklist.push("Limpeza");

    const vistoria = {
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
        placa: placaDigitada,
        veiculoNome: nomeVeiculo,
        km: km,
        vigilante: vigilante,
        foto: fotoBase64,
        itens: checklist.join(', ')
    };

    const vistorias = JSON.parse(localStorage.getItem("vistorias")) || [];
    vistorias.unshift(vistoria);
    localStorage.setItem("vistorias", JSON.stringify(vistorias));

    // Atualiza KM na base global
    let idx = veiculosBase.findIndex(v => v.placa.toUpperCase() === placaDigitada);
    if (idx !== -1) { 
        veiculosBase[idx].kmAtual = km; 
        localStorage.setItem("vehicles", JSON.stringify(veiculosBase)); 
    }
    
    location.reload();
}

function renderizarTabela() {
    let dados = JSON.parse(localStorage.getItem("vistorias")) || [];
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;

    if (inicio || fim) {
        dados = dados.filter(i => {
            const d = i.data.split('/').reverse().join('-');
            return (!inicio || d >= inicio) && (!fim || d <= fim);
        });
    }

    document.getElementById('tabela').innerHTML = dados.map((v, index) => `
        <tr>
            <td>${v.data} ${v.hora}</td>
            <td><strong>${v.placa}</strong><br><small>${v.veiculoNome}</small></td>
            <td>${v.vigilante}</td>
            <td>${v.km} KM</td>
            <td><small>${v.itens || 'Nenhum item'}</small></td>
            <td>
                <button class="btn-delete" onclick="excluirVistoria(${index})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function excluirVistoria(index) {
    if (confirm("Excluir esta vistoria?")) {
        let dados = JSON.parse(localStorage.getItem("vistorias")) || [];
        dados.splice(index, 1);
        localStorage.setItem("vistorias", JSON.stringify(dados));
        renderizarTabela();
    }
}

function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dados = JSON.parse(localStorage.getItem("vistorias")) || [];

    // AGRUPAR POR VEÍCULO
    const agrupado = dados.reduce((acc, item) => {
        const chave = `${item.placa} - ${item.veiculoNome}`;
        if (!acc[chave]) acc[chave] = [];
        acc[chave].push(item);
        return acc;
    }, {});

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70);
    doc.text("RELATÓRIO DE VISTORIAS POR VEÍCULO", 14, 15);

    let yPos = 25;
    Object.keys(agrupado).forEach(veiculo => {
        if (yPos > 230) { doc.addPage(); yPos = 20; }

        doc.setFillColor(230, 57, 70);
        doc.rect(14, yPos, 182, 8, 'F');
        doc.setTextColor(255);
        doc.text(`VEÍCULO: ${veiculo}`, 18, yPos + 5.5);
        doc.setTextColor(0);
        yPos += 10;

        doc.autoTable({
            startY: yPos,
            head: [['Data/Hora', 'Vigilante', 'KM', 'Checklist']],
            body: agrupado[veiculo].map(v => [v.data + " " + v.hora, v.vigilante, v.km + " KM", v.itens]),
            theme: 'grid',
            headStyles: { fillColor: [60, 60, 60] }
        });
        yPos = doc.lastAutoTable.finalY + 15;
    });

    doc.save('vistorias_japan_security.pdf');
}

window.onload = () => {
    const v = JSON.parse(localStorage.getItem("vehicles")) || [];
    document.getElementById('listaVeiculos').innerHTML = v.map(i => `<option value="${i.placa}">${i.nome}</option>`).join('');
    renderizarTabela();
};