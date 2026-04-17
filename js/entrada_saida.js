// 1. Busca KM automático ao selecionar veículo
function puxarKmAutomatico() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    const veiculos = JSON.parse(localStorage.getItem("veiculos")) || []; // Ajustado para 'veiculos' (plural) conforme seu JS de veículos
    const vEncontrado = veiculos.find(v => v.placa.toUpperCase() === placa);
    if (vEncontrado) {
        document.getElementById('km').value = vEncontrado.kmAtual || 0;
    }
}

// 2. Salva o registro e atualiza o KM na base global
function salvar() {
    const placaDigitada = document.getElementById('veiculo').value.toUpperCase();
    const km = document.getElementById('km').value;
    const motorista = document.getElementById('motorista').value;
    const obs = document.getElementById('obs').value;
    const tipo = document.getElementById('tipo').value;

    if (!placaDigitada || !km || !motorista) return alert("Preencha os campos obrigatórios!");

    const veiculosBase = JSON.parse(localStorage.getItem("veiculos")) || [];
    const infoVeiculo = veiculosBase.find(v => v.placa.toUpperCase() === placaDigitada);
    const nomeVeiculo = infoVeiculo ? infoVeiculo.nome : "Não Identificado";

    const registro = {
        id: Date.now(),
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        placa: placaDigitada,
        veiculoNome: nomeVeiculo,
        tipo: tipo,
        km: km,
        motorista: motorista,
        obs: obs
    };

    const historico = JSON.parse(localStorage.getItem("movimentacao")) || [];
    historico.unshift(registro);
    localStorage.setItem("movimentacao", JSON.stringify(historico));

    // Atualiza o KM real do veículo na base principal (veiculos)
    let idx = veiculosBase.findIndex(v => v.placa.toUpperCase() === placaDigitada);
    if (idx !== -1) { 
        veiculosBase[idx].kmAtual = km; 
        localStorage.setItem("veiculos", JSON.stringify(veiculosBase)); 
    }

    renderizarTabela();
    limparCampos();
}

function limparCampos() {
    document.getElementById('veiculo').value = "";
    document.getElementById('km').value = "";
    document.getElementById('motorista').value = "";
    document.getElementById('obs').value = "";
}

// 3. Função auxiliar para filtrar os dados (usada pela tabela e pelo PDF)
function obterDadosFiltrados() {
    let dados = JSON.parse(localStorage.getItem("movimentacao")) || [];
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;

    if (inicio || fim) {
        dados = dados.filter(i => {
            // Converte "17/04/2026" para "2026-04-17" para comparar com o input date
            const d = i.data.split('/').reverse().join('-');
            return (!inicio || d >= inicio) && (!fim || d <= fim);
        });
    }
    return dados;
}

// 4. Renderiza a tabela
function renderizarTabela() {
    const dados = obterDadosFiltrados();
    const tabelaCorpo = document.getElementById('tabela');
    if(!tabelaCorpo) return;

    tabelaCorpo.innerHTML = dados.map((m, index) => `
        <tr>
            <td>${m.data}<br><small>${m.hora}</small></td>
            <td><strong>${m.placa}</strong><br><small>${m.veiculoNome}</small></td>
            <td><span class="${m.tipo === 'Entrada' ? 'badge-entrada' : 'badge-saida'}">${m.tipo}</span></td>
            <td>${m.motorista}</td>
            <td>${m.km} KM</td>
            <td>${m.obs || '-'}</td>
            <td>
                <button class="btn-delete" onclick="excluirRegistro(${index})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 5. Excluir Registro
function excluirRegistro(index) {
    if (confirm("Deseja realmente excluir este lançamento?")) {
        let dados = JSON.parse(localStorage.getItem("movimentacao")) || [];
        // Se a tabela estiver filtrada, precisamos achar o ID real para excluir corretamente
        const filtrados = obterDadosFiltrados();
        const itemParaRemover = filtrados[index];
        
        // Remove do histórico global usando o ID único
        const novoHistorico = dados.filter(item => item.id !== itemParaRemover.id);
        
        localStorage.setItem("movimentacao", JSON.stringify(novoHistorico));
        renderizarTabela();
    }
}

// 6. PDF Gerado com base no que está na tela (Filtro aplicado)
function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dados = obterDadosFiltrados(); // Pega apenas os dados que aparecem na busca
    
    if (dados.length === 0) return alert("Não há registros no período selecionado para exportar.");

    // Agrupa por veículo
    const agrupado = dados.reduce((acc, item) => {
        const chave = `${item.placa} - ${item.veiculoNome}`;
        if (!acc[chave]) acc[chave] = [];
        acc[chave].push(item);
        return acc;
    }, {});

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70); // Vermelho Japan Security
    doc.text("RELATÓRIO DE MOVIMENTAÇÃO - JAPAN SECURITY", 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    const filtroInfo = document.getElementById('dataInicio').value ? `Período: ${document.getElementById('dataInicio').value} até ${document.getElementById('dataFim').value}` : "Relatório Geral";
    doc.text(filtroInfo, 14, 22);

    let yPos = 30;
    Object.keys(agrupado).forEach(veiculo => {
        if (yPos > 240) { doc.addPage(); yPos = 20; }

        doc.setFillColor(60, 60, 60);
        doc.rect(14, yPos, 182, 8, 'F');
        doc.setTextColor(255);
        doc.setFontSize(10);
        doc.text(`VEÍCULO: ${veiculo}`, 18, yPos + 5.5);
        doc.setTextColor(0);
        yPos += 10;

        doc.autoTable({
            startY: yPos,
            head: [['Data/Hora', 'Tipo', 'Motorista', 'KM', 'Obs']],
            body: agrupado[veiculo].map(m => [m.data + " " + m.hora, m.tipo, m.motorista, m.km + " KM", m.obs]),
            theme: 'grid',
            headStyles: { fillColor: [230, 57, 70] }, // Cabeçalho da tabela em vermelho
            margin: { left: 14, right: 14 }
        });
        yPos = doc.lastAutoTable.finalY + 12;
    });

    doc.save(`movimentacao_${new Date().getTime()}.pdf`);
}

// 7. Carregamento Inicial
window.onload = () => {
    const v = JSON.parse(localStorage.getItem("veiculos")) || [];
    const datalist = document.getElementById('listaVeiculos');
    if(datalist) {
        datalist.innerHTML = v.map(i => `<option value="${i.placa}">${i.nome}</option>`).join('');
    }
    renderizarTabela();
};
