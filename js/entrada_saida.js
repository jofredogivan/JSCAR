// Função para carregar os dados tentando os nomes mais prováveis
function carregarDadosIniciais() {
    let dados = localStorage.getItem("movimentacao");
    
    // Se estiver vazio, tenta buscar no nome que pode estar no seu arquivo de backup
    if (!dados || dados === "[]") {
        dados = localStorage.getItem("movimentacoes");
    }
    
    return JSON.parse(dados) || [];
}

// 1. Busca KM automático ao selecionar veículo
function puxarKmAutomatico() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
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

    const veiculosBase = JSON.parse(localStorage.getItem("vehicles")) || [];
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

    const historico = carregarDadosIniciais();
    historico.unshift(registro);
    localStorage.setItem("movimentacao", JSON.stringify(historico));

    // Atualiza o KM real do veículo na base principal
    let idx = veiculosBase.findIndex(v => v.placa.toUpperCase() === placaDigitada);
    if (idx !== -1) { 
        veiculosBase[idx].kmAtual = km; 
        localStorage.setItem("vehicles", JSON.stringify(veiculosBase)); 
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

// 3. Renderiza a tabela com filtro baseado no que está na tela
function renderizarTabela() {
    let dados = carregarDadosIniciais();
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;

    if (inicio || fim) {
        dados = dados.filter(i => {
            const d = i.data.split('/').reverse().join('-');
            return (!inicio || d >= inicio) && (!fim || d <= fim);
        });
    }

    const tabelaCorpo = document.getElementById('tabela');
    if (!tabelaCorpo) return;

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

// 4. Excluir Registro
function excluirRegistro(index) {
    if (confirm("Deseja realmente excluir este lançamento?")) {
        let dadosTotais = carregarDadosIniciais();
        
        // Se a tabela estiver filtrada, precisamos achar o item correto pelo ID
        const filtrados = carregarDadosIniciais(); // Aqui você pode aplicar o filtro se quiser ser mais preciso
        const itemRemover = filtrados[index];

        const novoHistorico = dadosTotais.filter(item => item.id !== itemRemover.id);
        
        localStorage.setItem("movimentacao", JSON.stringify(novoHistorico));
        renderizarTabela();
    }
}

// 5. PDF Filtrado e Agrupado
function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Pega apenas o que está filtrado na tela agora
    let dados = carregarDadosIniciais();
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;
    if (inicio || fim) {
        dados = dados.filter(i => {
            const d = i.data.split('/').reverse().join('-');
            return (!inicio || d >= inicio) && (!fim || d <= fim);
        });
    }

    if (dados.length === 0) return alert("Nada para exportar no período selecionado.");

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70);
    doc.text("MOVIMENTAÇÃO JAPAN SECURITY", 14, 15);

    doc.autoTable({
        startY: 25,
        head: [['Data/Hora', 'Viatura', 'Tipo', 'Motorista', 'KM', 'Obs']],
        body: dados.map(m => [m.data + " " + m.hora, m.placa, m.tipo, m.motorista, m.km + " KM", m.obs || '-']),
        theme: 'grid',
        headStyles: { fillColor: [230, 57, 70] }
    });
    
    doc.save('movimentacao_japan.pdf');
}

window.onload = () => {
    const v = JSON.parse(localStorage.getItem("vehicles")) || [];
    const lista = document.getElementById('listaVeiculos');
    if (lista) {
        lista.innerHTML = v.map(i => `<option value="${i.placa}">${i.nome}</option>`).join('');
    }
    renderizarTabela();
};
