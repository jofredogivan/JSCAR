/* ============================================================
   ARQUIVO: js/entrada_saida.js (VERSÃO DE RECUPERAÇÃO)
   ============================================================ */

// FUNÇÃO PARA LER OS DADOS (BUSCA EM TODAS AS CHAVES POSSÍVEIS)
function lerMovimentacoes() {
    // 1. Tenta ler o nome novo
    let dados = localStorage.getItem("movimentacao");
    
    // 2. Se estiver vazio, tenta ler o nome que está no seu backup JSON (vistorias)
    if (!dados || dados === "[]") {
        dados = localStorage.getItem("vistorias");
        
        // Se achou como 'vistorias', já salva no nome certo para as próximas vezes
        if (dados && dados !== "[]") {
            localStorage.setItem("movimentacao", dados);
        }
    }
    
    return JSON.parse(dados) || [];
}

// 1. Busca KM automático ao selecionar veículo
function puxarKmAutomatico() {
    const campoPlaca = document.getElementById('veiculo');
    if (!campoPlaca) return;
    const placa = campoPlaca.value.toUpperCase();
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const vEncontrado = veiculos.find(v => v.placa.toUpperCase() === placa);
    if (vEncontrado) {
        document.getElementById('km').value = vEncontrado.kmAtual || 0;
    }
}

// 2. Salva o registro
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

    const historico = lerMovimentacoes();
    historico.unshift(registro);
    localStorage.setItem("movimentacao", JSON.stringify(historico));

    // Atualiza KM na base de veículos
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

// 3. Renderiza a tabela (Puxa os dados antigos e novos)
function renderizarTabela() {
    const dados = lerMovimentacoes();
    const tbody = document.getElementById('tabela');
    if (!tbody) return;

    tbody.innerHTML = dados.map((m) => `
        <tr>
            <td>${m.data}<br><small>${m.hora}</small></td>
            <td><strong>${m.placa}</strong><br><small>${m.veiculoNome || ''}</small></td>
            <td><span class="${m.tipo === 'Entrada' ? 'badge-entrada' : 'badge-saida'}">${m.tipo || 'N/A'}</span></td>
            <td>${m.motorista || m.vigilante || '-'}</td>
            <td>${m.km || '0'} KM</td>
            <td>
                <button class="btn-delete" onclick="excluirRegistro(${m.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function excluirRegistro(id) {
    if (confirm("Deseja excluir?")) {
        let dados = lerMovimentacoes();
        const novaLista = dados.filter(item => item.id !== id);
        localStorage.setItem("movimentacao", JSON.stringify(novaLista));
        renderizarTabela();
    }
}

// Função para gerar o PDF respeitando os dados recuperados
function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dados = lerMovimentacoes();

    if (dados.length === 0) return alert("Sem dados para exportar!");

    doc.text("RELATÓRIO DE MOVIMENTAÇÃO - JAPAN SECURITY", 14, 15);
    doc.autoTable({
        startY: 25,
        head: [['Data', 'Placa', 'Tipo', 'Motorista', 'KM']],
        body: dados.map(m => [m.data + " " + m.hora, m.placa, m.tipo || 'N/A', m.motorista || m.vigilante, m.km + " KM"]),
        theme: 'grid',
        headStyles: { fillColor: [230, 57, 70] }
    });
    doc.save('movimentacao_japan.pdf');
}

window.onload = () => {
    const v = JSON.parse(localStorage.getItem("vehicles")) || [];
    const dl = document.getElementById('listaVeiculos');
    if(dl) dl.innerHTML = v.map(i => `<option value="${i.placa}">${i.nome}</option>`).join('');
    renderizarTabela();
};
