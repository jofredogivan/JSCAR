/**
 * LÓGICA DE GESTÃO DE VEÍCULOS - JAPAN SECURITY
 * Funções: Listar, Salvar, Editar e Gerar Relatório de Frota
 */

// 1. Carrega a lista de veículos na tabela ao abrir a página
async function carregar() {
    const lista = await dbListar("vehicles");
    const tbody = document.getElementById('tabelaVeiculos');
    
    if (!tbody) return;

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#555; padding:20px;">Nenhum veículo cadastrado na frota.</td></tr>';
        return;
    }

    // Renderiza a tabela com a função de clique para editar
    tbody.innerHTML = lista.map(v => `
        <tr class="clickable">
            <td onclick="prepararEdicao(${v.id})">
                <i class="fas fa-car" style="color:var(--red); margin-right:10px;"></i>
                <strong>${v.nome}</strong>
            </td>
            <td onclick="prepararEdicao(${v.id})">${v.placa}</td>
            <td onclick="prepararEdicao(${v.id})">${v.ano || '---'}</td>
            <td onclick="prepararEdicao(${v.id})">${v.kmAtual || 0} KM</td>
            <td style="text-align: right;">
                <button class="btn-del" onclick="excluirVeiculo(${v.id})" title="Excluir Veículo">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 2. Salva um novo veículo ou atualiza um existente
async function salvarVeiculo() {
    const id = document.getElementById('veiculoId').value;
    const nome = document.getElementById('nome').value;
    const placa = document.getElementById('placa').value.toUpperCase();
    const ano = document.getElementById('ano').value;
    const km = document.getElementById('kmAtual').value;

    if(!nome || !placa) {
        alert("Atenção: Nome/Modelo e Placa são obrigatórios!");
        return;
    }

    const veiculoObj = {
        id: id ? parseInt(id) : Date.now(),
        nome: nome,
        placa: placa,
        ano: ano,
        kmAtual: parseInt(km) || 0
    };

    try {
        await dbSalvar("vehicles", veiculoObj);
        alert(id ? "Veículo atualizado com sucesso!" : "Veículo adicionado à frota!");
        limparFormulario();
        carregar();
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao acessar o banco de dados.");
    }
}

// 3. Puxa os dados da tabela para os campos de input (Edição)
async function prepararEdicao(id) {
    const lista = await dbListar("vehicles");
    const v = lista.find(item => item.id === id);
    
    if(v) {
        document.getElementById('veiculoId').value = v.id;
        document.getElementById('nome').value = v.nome;
        document.getElementById('placa').value = v.placa;
        document.getElementById('ano').value = v.ano || '';
        document.getElementById('kmAtual').value = v.kmAtual || 0;

        // Altera o visual do título para indicar edição
        const titulo = document.getElementById('formTitle');
        if(titulo) titulo.innerHTML = `<i class="fas fa-edit"></i> Editando: ${v.nome}`;
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// 4. Limpa os campos após salvar ou cancelar
function limparFormulario() {
    document.getElementById('veiculoId').value = '';
    document.getElementById('nome').value = '';
    document.getElementById('placa').value = '';
    document.getElementById('ano').value = '';
    document.getElementById('kmAtual').value = '';
    
    const titulo = document.getElementById('formTitle');
    if(titulo) titulo.innerText = "Cadastrar Novo Veículo";
}

// 5. Remove o veículo do banco de dados
async function excluirVeiculo(id) {
    if(confirm("Deseja realmente remover este veículo da frota? Esta ação não pode ser desfeita.")) {
        await dbExcluir("vehicles", id);
        carregar();
    }
}

/**
 * 6. GERAÇÃO DE PDF DE FROTA (Respeitando a lógica por veículo)
 * Este relatório foca nos dados cadastrais e status atual da frota.
 */
async function gerarRelatorioFrotaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const lista = await dbListar("vehicles");

    if (lista.length === 0) return alert("Não há dados para exportar.");

    // Cabeçalho do PDF
    doc.setFontSize(18);
    doc.setTextColor(230, 57, 70); // Vermelho Japan Security
    doc.text("RELATÓRIO DE FROTA - JAPAN SECURITY", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 28);

    // Tabela de Veículos
    const rows = lista.map(v => [
        v.nome,
        v.placa,
        v.ano || "---",
        v.kmAtual + " KM"
    ]);

    doc.autoTable({
        head: [['Modelo/Nome', 'Placa', 'Ano', 'KM Atual']],
        body: rows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [20, 20, 20] }, // Preto profissional
        styles: { fontSize: 10 }
    });

    doc.save(`frota_japan_security_${Date.now()}.pdf`);
}

// Inicialização
window.onload = carregar;
