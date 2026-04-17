/**
 * LÓGICA DE VISTORIA - JAPAN SECURITY
 */

async function carregarPlacas() {
    const veiculos = await dbListar("vehicles");
    document.getElementById('listaVeiculos').innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
}

async function carregarTabela() {
    const dados = await dbListar("vistorias");
    const tbody = document.getElementById('tabelaVistoria');
    
    tbody.innerHTML = dados.reverse().map(d => `
        <tr>
            <td>${d.data.split(',')[0]}</td>
            <td><strong>${d.veiculo}</strong></td>
            <td>${d.vigilante}</td>
            <td>${d.km}</td>
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

    if(!veiculo || !km) return alert("Preencha Viatura e KM!");

    const vistoria = {
        id: Date.now(),
        data: new Date().toLocaleString('pt-BR'),
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
    alert("Vistoria salva!");
    location.reload();
}

async function excluir(id) {
    if(confirm("Excluir registro de vistoria?")) {
        await dbExcluir("vistorias", id);
        carregarTabela();
    }
}

async function gerarVistoriaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dados = await dbListar("vistorias");

    if (dados.length === 0) return alert("Sem dados para exportar.");

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70);
    doc.text("RELATÓRIO DE VISTORIAS - JAPAN SECURITY", 14, 15);

    const veiculosUnicos = [...new Set(dados.map(d => d.veiculo))];
    let y = 25;

    veiculosUnicos.forEach(vtr => {
        if (y > 250) { doc.addPage(); y = 20; }
        
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`VEÍCULO: ${vtr}`, 14, y);

        const vistoriasVtr = dados.filter(d => d.veiculo === vtr);
        const rows = vistoriasVtr.map(d => [
            d.data,
            d.vigilante,
            d.km,
            `Óleo: ${d.check.oleo} | Água: ${d.check.agua}\nFaróis: E:${d.check.f_esq} D:${d.check.f_dir}\nLant: E:${d.check.l_esq} D:${d.check.l_dir}`,
            d.obs || "-"
        ]);

        doc.autoTable({
            head: [['Data/Hora', 'Vigilante', 'KM', 'Checklist', 'Observações']],
            body: rows,
            startY: y + 5,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [40, 40, 40] }
        });

        y = doc.lastAutoTable.finalY + 15;
    });

    doc.save("vistorias_japan_security.pdf");
}

window.onload = () => {
    carregarPlacas();
    carregarTabela();
};
