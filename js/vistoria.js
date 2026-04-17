/**
 * LÓGICA DE VISTORIA - JAPAN SECURITY
 * Filtros por Data/Hora e Exportação Agrupada por Veículo
 */

async function carregarPlacas() {
    const veiculos = await dbListar("vehicles");
    const datalist = document.getElementById('listaVeiculos');
    if(datalist) {
        datalist.innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
    }
}

async function carregarTabela() {
    const dados = await dbListar("vistorias");
    const tbody = document.getElementById('tabelaVistoria');
    if(!tbody) return;
    
    tbody.innerHTML = dados.reverse().map(d => `
        <tr>
            <td>${d.data.split(',')[0]}</td>
            <td><strong>${d.veiculo}</strong></td>
            <td>${d.vigilante}</td>
            <td>${d.km} KM</td>
            <td style="text-align:right;">
                <button class="btn-delete" onclick="excluir(${d.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function salvarVistoria() {
    const veiculo = document.getElementById('veiculo').value.toUpperCase();
    const km = document.getElementById('km').value;
    const vigilante = document.getElementById('vigilante').value;
    const agora = new Date();

    if(!veiculo || !km) return alert("Preencha Viatura e KM!");

    const vistoria = {
        id: Date.now(),
        timestamp: agora.getTime(), // Para o filtro de data/hora
        data: agora.toLocaleString('pt-BR'),
        veiculo: veiculo,
        km: km,
        vigilante: vigilante,
        obs: document.getElementById('obs').value,
        check: {
            oleo: document.getElementById('oleo').checked ? 'OK' : 'X',
            agua: document.getElementById('agua').checked ? 'OK' : 'X',
            pneus: document.getElementById('pneus').checked ? 'OK' : 'X',
            limpeza: document.getElementById('limpeza').checked ? 'OK' : 'X',
            f_esq: document.getElementById('f_esq').checked ? 'OK' : 'X',
            f_dir: document.getElementById('f_dir').checked ? 'OK' : 'X',
            l_esq: document.getElementById('l_esq').checked ? 'OK' : 'X',
            l_dir: document.getElementById('l_dir').checked ? 'OK' : 'X'
        }
    };

    await dbSalvar("vistorias", vistoria);
    alert("Vistoria finalizada com sucesso!");
    location.reload();
}

async function excluir(id) {
    if(confirm("Excluir este registro de vistoria?")) {
        await dbExcluir("vistorias", id);
        carregarTabela();
    }
}

/**
 * GERAÇÃO DE PDF DE VISTORIA COM FILTRO DE DATA/HORA
 */
async function gerarVistoriaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let dados = await dbListar("vistorias");

    // 1. Captura filtros de data/hora (os mesmos IDs que usamos na outra tela para manter o padrão)
    // Se você não tiver os inputs de filtro no vistoria.html, adicione-os como fez no entrada_saida.html
    const dataIni = document.getElementById('f_data_ini')?.value;
    const horaIni = document.getElementById('f_hora_ini')?.value || "00:00";
    const dataFim = document.getElementById('f_data_fim')?.value;
    const horaFim = document.getElementById('f_hora_fim')?.value || "23:59";

    if (dataIni && dataFim) {
        const start = new Date(`${dataIni}T${horaIni}`).getTime();
        const end = new Date(`${dataFim}T${horaFim}`).getTime();
        dados = dados.filter(d => d.timestamp >= start && d.timestamp <= end);
    }

    if (dados.length === 0) return alert("Nenhum registro encontrado para exportar.");

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70);
    doc.text("RELATÓRIO DE VISTORIAS - JAPAN SECURITY", 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Período: ${dataIni || 'Geral'} até ${dataFim || 'Geral'}`, 14, 22);

    const veiculosUnicos = [...new Set(dados.map(d => d.veiculo))];
    let y = 30;

    veiculosUnicos.forEach(vtr => {
        if (y > 240) { doc.addPage(); y = 20; }
        
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont(undefined, 'bold');
        doc.text(`VEÍCULO: ${vtr}`, 14, y);
        doc.setFont(undefined, 'normal');

        const vistoriasVtr = dados.filter(d => d.veiculo === vtr);
        const rows = vistoriasVtr.map(d => [
            d.data,
            d.vigilante,
            d.km + " KM",
            `ÓLEO: ${d.check.oleo} | ÁGUA: ${d.check.agua} | PNEUS: ${d.check.pneus}\nFAROL: E:${d.check.f_esq} D:${d.check.f_dir} | LANT: E:${d.check.l_esq} D:${d.check.l_dir}`,
            d.obs || "-"
        ]);

        doc.autoTable({
            head: [['Data/Hora', 'Vigilante', 'KM', 'Itens Verificados', 'Observações']],
            body: rows,
            startY: y + 5,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [40, 40, 40] },
            columnStyles: { 3: { cellWidth: 60 } } // Dá mais espaço para o checklist
        });

        y = doc.lastAutoTable.finalY + 15;
    });

    doc.save(`vistorias_japan_${Date.now()}.pdf`);
}

window.onload = () => {
    carregarPlacas();
    carregarTabela();
};
