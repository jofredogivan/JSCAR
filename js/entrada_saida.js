async function inicializar() {
    const veiculos = await dbListar("vehicles");
    const dl = document.getElementById('listaVeiculos');
    if (dl) dl.innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
    renderizarTabela();
}

async function puxarKmAutomatico() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    const veiculos = await dbListar("vehicles");
    const v = veiculos.find(item => item.placa === placa);
    if (v) document.getElementById('km').value = v.kmAtual;
}

async function salvar() {
    const obj = {
        id: Date.now(),
        placa: document.getElementById('veiculo').value.toUpperCase(),
        tipo: document.getElementById('tipo').value,
        km: parseInt(document.getElementById('km').value),
        responsavel: document.getElementById('responsavel').value,
        data: new Date().toLocaleDateString('pt-BR'),
        dataOriginal: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
    };

    if (!obj.placa || !obj.km) return alert("Preencha Placa e KM!");

    await dbSalvar("movimentacao", obj);
    
    // Atualiza KM no cadastro do veículo
    const veiculos = await dbListar("vehicles");
    const vIdx = veiculos.find(v => v.placa === obj.placa);
    if (vIdx) {
        vIdx.kmAtual = obj.km;
        await dbSalvar("vehicles", vIdx);
    }

    alert("Registrado!");
    location.reload();
}

async function renderizarTabela() {
    let dados = await dbListar("movimentacao");
    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;
    const filtroPlaca = document.getElementById('veiculoFiltro').value.toUpperCase();

    if (inicio && fim) dados = dados.filter(d => d.dataOriginal >= inicio && d.dataOriginal <= fim);
    if (filtroPlaca) dados = dados.filter(d => d.placa.includes(filtroPlaca));

    const tbody = document.getElementById('tabela');
    tbody.innerHTML = dados.map(m => `
        <tr>
            <td>${m.data} <small>${m.hora}</small></td>
            <td><strong>${m.placa}</strong></td>
            <td><span class="badge ${m.tipo === 'SAÍDA' ? 'badge-saida' : 'badge-entrada'}">${m.tipo}</span></td>
            <td>${m.km} KM</td>
            <td>${m.responsavel}</td>
            <td><button onclick="excluir(${m.id})" style="color:red; background:none; border:none; cursor:pointer;"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

async function gerarRelatorioPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dados = await dbListar("movimentacao"); // Aqui você pode aplicar os mesmos filtros da tabela se desejar

    doc.setFontSize(16);
    doc.text("JAPAN SECURITY - RELATÓRIO DE MOVIMENTAÇÃO", 14, 20);
    
    const colunas = ["Data", "Viatura", "Operação", "KM", "Responsável"];
    const linhas = dados.map(d => [d.data, d.placa, d.tipo, d.km, d.responsavel]);

    doc.autoTable({
        head: [colunas],
        body: linhas,
        startY: 30,
        headStyles: { fillColor: [230, 57, 70] }
    });

    doc.save("movimentacao_japan.pdf");
}

async function excluir(id) {
    if(confirm("Excluir?")) { await dbExcluir("movimentacao", id); renderizarTabela(); }
}

window.onload = inicializar;
