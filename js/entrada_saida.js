/* ============================================================
   ARQUIVO: js/entrada_saida.js
   SISTEMA: Gestão de Frota - Japan Security
   ============================================================ */

// 1. BUSCA KM AUTOMÁTICO AO SELECIONAR VEÍCULO
function puxarKmAutomatico() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    // Puxa da gaveta 'vehicles' para bater com o cadastro
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const vEncontrado = veiculos.find(v => v.placa.toUpperCase() === placa);
    
    if (vEncontrado) {
        document.getElementById('km').value = vEncontrado.kmAtual || 0;
    }
}

// 2. SALVA O REGISTRO E ATUALIZA O KM NA BASE GLOBAL
function salvar() {
    const placaDigitada = document.getElementById('veiculo').value.toUpperCase();
    const km = document.getElementById('km').value;
    const motorista = document.getElementById('motorista').value;
    const obs = document.getElementById('obs').value;
    const tipo = document.getElementById('tipo').value;

    if (!placaDigitada || !km || !motorista) {
        alert("Por favor, preencha os campos obrigatórios (Veículo, KM e Motorista)!");
        return;
    }

    // Busca o nome do veículo para o relatório ficar bonito
    const veiculosBase = JSON.parse(localStorage.getItem("vehicles")) || [];
    const infoVeiculo = veiculosBase.find(v => v.placa.toUpperCase() === placaDigitada);
    const nomeVeiculo = infoVeiculo ? infoVeiculo.nome : "Não Identificado";

    const registro = {
        id: Date.now(), // ID único para exclusão segura
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
    historico.unshift(registro); // Adiciona no topo da lista
    localStorage.setItem("movimentacao", JSON.stringify(historico));

    // ATUALIZA O KM REAL NA GAVETA DE VEÍCULOS
    let idx = veiculosBase.findIndex(v => v.placa.toUpperCase() === placaDigitada);
    if (idx !== -1) { 
        veiculosBase[idx].kmAtual = km; 
        localStorage.setItem("vehicles", JSON.stringify(veiculosBase)); 
    }

    renderizarTabela();
    limparCampos();
    alert("Movimentação registrada com sucesso!");
}

function limparCampos() {
    document.getElementById('veiculo').value = "";
    document.getElementById('km').value = "";
    document.getElementById('motorista').value = "";
    document.getElementById('obs').value = "";
}

// 3. OBTÉM DADOS FILTRADOS (Para Tabela e PDF)
function obterDadosFiltrados() {
    let dados = JSON.parse(localStorage.getItem("movimentacao")) || [];
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;

    if (inicio || fim) {
        dados = dados.filter(i => {
            // Converte "17/04/2026" para "2026-04-17" para comparar
            const d = i.data.split('/').reverse().join('-');
            return (!inicio || d >= inicio) && (!fim || d <= fim);
        });
    }
    return dados;
}

// 4. RENDERIZA A TABELA COM FILTRO
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

// 5. EXCLUIR REGISTRO
function excluirRegistro(index) {
    if (confirm("Deseja realmente excluir este lançamento?")) {
        let dadosTotal = JSON.parse(localStorage.getItem("movimentacao")) || [];
        const filtrados = obterDadosFiltrados();
        const itemParaRemover = filtrados[index];
        
        // Remove do histórico global usando o ID único
        const novoHistorico = dadosTotal.filter(item => item.id !== itemParaRemover.id);
        
        localStorage.setItem("movimentacao", JSON.stringify(novoHistorico));
        renderizarTabela();
    }
}

// 6. GERA PDF APENAS DO QUE ESTÁ NA TELA (FILTRADO)
function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dados = obterDadosFiltrados();
    
    if (dados.length === 0) return alert("Não há registros no período selecionado para exportar.");

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70); // Vermelho Japan Security
    doc.text("RELATÓRIO DE MOVIMENTAÇÃO - JAPAN SECURITY", 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    const dataAtual = new Date().toLocaleDateString();
    doc.text(`Gerado em: ${dataAtual}`, 14, 22);

    doc.autoTable({
        startY: 30,
        head: [['Data/Hora', 'Viatura', 'Tipo', 'Motorista', 'KM', 'Obs']],
        body: dados.map(m => [
            m.data + " " + m.hora, 
            m.placa, 
            m.tipo, 
            m.motorista, 
            m.km + " KM", 
            m.obs || '-'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [230, 57, 70] },
        styles: { fontSize: 8 }
    });

    doc.save(`movimentacao_japan_${Date.now()}.pdf`);
}

// 7. CARREGAMENTO INICIAL
window.onload = () => {
    // Carrega a lista de placas para o "Datalist" (Autocompletar)
    const v = JSON.parse(localStorage.getItem("vehicles")) || [];
    const datalist = document.getElementById('listaVeiculos');
    if(datalist) {
        datalist.innerHTML = v.map(i => `<option value="${i.placa}">${i.nome}</option>`).join('');
    }
    renderizarTabela();
};
