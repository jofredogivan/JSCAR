/* ============================================================
   ARQUIVO: js/maintenance.js - Gestão de Manutenção Japan Security
   ============================================================ */

window.onload = () => {
    // Define a data de hoje por padrão no campo de registro
    const hoje = new Date().toISOString().split('T')[0];
    if(document.getElementById('m_data')) document.getElementById('m_data').value = hoje;

    carregarListaVeiculos();
    listarManutencoes();
};

async function carregarListaVeiculos() {
    const veiculos = await dbListar("vehicles");
    const datalist = document.getElementById('listaVeiculos');
    if (datalist) {
        datalist.innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
    }
}

// 1. SALVAR MANUTENÇÃO (Ajustado para a store 'manutencao')
async function salvarManutencao() {
    const veiculo = document.getElementById('m_veiculo').value.toUpperCase();
    const servico = document.getElementById('m_servico').value;
    const km = document.getElementById('m_km').value;
    const valor = document.getElementById('m_valor').value;
    const tipo = document.getElementById('m_tipo').value;
    const proximaKm = document.getElementById('m_proxima').value;
    const dataManual = document.getElementById('m_data').value;

    if (!veiculo || !servico || !km || !dataManual) {
        alert("Preencha Viatura, Serviço, KM e Data!");
        return;
    }

    const dataObj = new Date(dataManual + "T12:00:00");

    const registro = {
        id: Date.now(),
        timestamp: dataObj.getTime(),
        dataExibicao: dataObj.toLocaleDateString('pt-BR'),
        veiculo: veiculo,
        servico: servico,
        km: parseInt(km),
        valor: parseFloat(valor || 0),
        tipo: tipo,
        proximaKm: proximaKm || "N/A"
    };

    try {
        // AQUI ESTAVA O ERRO: Nome da store deve ser 'manutencao' conforme seu db.js
        await dbSalvar("manutencao", registro);
        alert("Manutenção registrada com sucesso!");
        
        // Limpar campos
        document.getElementById('m_servico').value = "";
        document.getElementById('m_km').value = "";
        document.getElementById('m_valor').value = "";
        document.getElementById('m_proxima').value = "";
        
        listarManutencoes();
    } catch (e) {
        console.error("Erro ao salvar:", e);
        alert("Erro ao salvar no banco de dados.");
    }
}

// 2. LISTAR COM FILTROS (Ajustado para 'manutencao')
async function listarManutencoes() {
    let dados = await dbListar("manutencao");
    const tbody = document.getElementById('tabelaManutencao');
    if (!tbody) return;

    const dIni = document.getElementById('filtro_data_ini').value;
    const dFim = document.getElementById('filtro_data_fim').value;

    if (dIni && dFim) {
        const start = new Date(dIni + "T00:00:00").getTime();
        const end = new Date(dFim + "T23:59:59").getTime();
        dados = dados.filter(d => d.timestamp >= start && d.timestamp <= end);
    }

    dados.sort((a, b) => b.timestamp - a.timestamp);

    // Totais
    const totalGasto = dados.reduce((sum, item) => sum + item.valor, 0);
    document.getElementById('totalGasto').innerText = `R$ ${totalGasto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('totalRegistros').innerText = dados.length;

    tbody.innerHTML = dados.map(m => `
        <tr>
            <td><small>${m.dataExibicao}</small></td>
            <td>
                <strong>${m.veiculo}</strong><br>
                <small style="color: #888;">${m.servico}</small>
            </td>
            <td>R$ ${m.valor.toFixed(2)}</td>
            <td style="text-align: right;">
                <button onclick="excluirManutencao(${m.id})" style="background:none; border:none; color: #555; cursor:pointer;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 3. EXCLUIR (Ajustado para 'manutencao')
async function excluirManutencao(id) {
    if (confirm("Deseja excluir este registro?")) {
        await dbExcluir("manutencao", id);
        listarManutencoes();
    }
}

// 4. PDF (Ajustado para 'manutencao')
async function gerarPDFManutencao() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let dados = await dbListar("manutencao");

    const dIni = document.getElementById('filtro_data_ini').value;
    const dFim = document.getElementById('filtro_data_fim').value;

    if (dIni && dFim) {
        const start = new Date(dIni + "T00:00:00").getTime();
        const end = new Date(dFim + "T23:59:59").getTime();
        dados = dados.filter(d => d.timestamp >= start && d.timestamp <= end);
    }

    if (dados.length === 0) return alert("Sem dados no período selecionado.");

    doc.setFillColor(230, 57, 70); 
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text("JAPAN SECURITY - RELATÓRIO DE MANUTENÇÃO", 14, 13);
    
    const rows = dados.sort((a,b) => b.timestamp - a.timestamp).map(m => [
        m.dataExibicao, m.veiculo, m.servico, m.km, `R$ ${m.valor.toFixed(2)}`
    ]);

    doc.autoTable({
        head: [['DATA', 'VIATURA', 'SERVIÇO', 'KM', 'VALOR']],
        body: rows,
        startY: 25,
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40] }
    });

    doc.save(`Relatorio_Manutencao.pdf`);
}
