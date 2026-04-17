async function carregarPlacas() {
    const veiculos = await dbListar("vehicles");
    const dl = document.getElementById('listaVeiculos');
    if(dl) dl.innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
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
            <td style="text-align:right;"><button onclick="excluir(${d.id})" style="background:none; border:none; color:#555; cursor:pointer;"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

async function salvarVistoria() {
    const vtr = document.getElementById('veiculo').value.toUpperCase();
    const km = document.getElementById('km').value;
    const vig = document.getElementById('vigilante').value;
    if(!vtr || !km) return alert("Viatura e KM obrigatórios!");

    const agora = new Date();
    const registro = {
        id: Date.now(),
        timestamp: agora.getTime(),
        data: agora.toLocaleString('pt-BR'),
        veiculo: vtr,
        km: km,
        vigilante: vig,
        check: {
            oleo: document.getElementById('oleo').checked ? 'OK' : 'X',
            agua: document.getElementById('agua').checked ? 'OK' : 'X',
            pneus: document.getElementById('pneus').checked ? 'OK' : 'X',
            f_esq: document.getElementById('f_esq').checked ? 'OK' : 'X',
            f_dir: document.getElementById('f_dir').checked ? 'OK' : 'X',
            l_esq: document.getElementById('l_esq').checked ? 'OK' : 'X',
            l_dir: document.getElementById('l_dir').checked ? 'OK' : 'X'
        }
    };
    await dbSalvar("vistorias", registro);
    location.reload();
}

async function excluir(id) {
    if(confirm("Excluir vistoria?")) { await dbExcluir("vistorias", id); carregarTabela(); }
}

async function gerarVistoriaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let dados = await dbListar("vistorias");

    // FILTRO DE DATA E HORA
    const dIni = document.getElementById('f_data_ini').value;
    const hIni = document.getElementById('f_hora_ini').value || "00:00";
    const dFim = document.getElementById('f_data_fim').value;
    const hFim = document.getElementById('f_hora_fim').value || "23:59";

    if (dIni && dFim) {
        const start = new Date(`${dIni}T${hIni}`).getTime();
        const end = new Date(`${dFim}T${hFim}`).getTime();
        dados = dados.filter(d => d.timestamp >= start && d.timestamp <= end);
    }

    if (dados.length === 0) return alert("Nenhum dado no período selecionado.");

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70);
    doc.text("RELATÓRIO DE VISTORIAS - JAPAN SECURITY", 14, 15);

    const veiculosUnicos = [...new Set(dados.map(d => d.veiculo))];
    let y = 25;

    veiculosUnicos.forEach(vtr => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont(undefined, 'bold');
        doc.text(`VEÍCULO: ${vtr}`, 14, y);
        doc.setFont(undefined, 'normal');

        const vtrs = dados.filter(d => d.veiculo === vtr);
        const rows = vtrs.map(d => [
            d.data,
            d.vigilante,
            d.km + " KM",
            `Oleo: ${d.check.oleo} | Agua: ${d.check.agua} | Pneus: ${d.check.pneus}\nFarol: E:${d.check.f_esq} D:${d.check.f_dir} | Lant: E:${d.check.l_esq} D:${d.check.l_dir}`
        ]);

        doc.autoTable({
            head: [['Data', 'Vigilante', 'KM', 'Itens']],
            body: rows,
            startY: y + 4,
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40] },
            styles: { fontSize: 8 }
        });
        y = doc.lastAutoTable.finalY + 15;
    });

    doc.save("vistorias_japan.pdf");
}

window.onload = () => { carregarPlacas(); carregarTabela(); };
