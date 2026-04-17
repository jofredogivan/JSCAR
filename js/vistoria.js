/* ============================================================
   ARQUIVO: js/vistoria.js
   ============================================================ */

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
    if (v) document.getElementById('km').value = v.kmAtual || "";
}

// Comprime a imagem para não sobrecarregar o IndexedDB
async function processarFoto(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scale = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
}

async function salvar() {
    const vInput = document.getElementById('veiculo').value.toUpperCase();
    const kInput = document.getElementById('km').value;
    const vigInput = document.getElementById('vigilante').value;
    const fotoFile = document.getElementById('fotoVeiculo').files[0];

    if (!vInput || !kInput || !vigInput) return alert("Preencha Placa, KM e Vigilante!");

    let fotoBase64 = "";
    if (fotoFile) fotoBase64 = await processarFoto(fotoFile);

    const vistoria = {
        id: Date.now(),
        placa: vInput,
        km: parseInt(kInput),
        vigilante: vigInput,
        obs: document.getElementById('obsAvaria').value,
        foto: fotoBase64,
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
        checklist: {
            oleo: document.getElementById('oleo').checked,
            agua: document.getElementById('agua').checked,
            pneus: document.getElementById('pneus').checked,
            limpeza: document.getElementById('limpeza').checked,
            farol_esq: document.getElementById('farol_esq').checked,
            farol_dir: document.getElementById('farol_dir').checked,
            lanterna_esq: document.getElementById('lanterna_esq').checked,
            lanterna_dir: document.getElementById('lanterna_dir').checked
        }
    };

    await dbSalvar("vistorias", vistoria);

    // Atualiza o KM no cadastro do veículo
    const veiculos = await dbListar("vehicles");
    const vIdx = veiculos.find(v => v.placa === vInput);
    if (vIdx) {
        vIdx.kmAtual = vistoria.km;
        await dbSalvar("vehicles", vIdx);
    }

    alert("Vistoria salva com sucesso!");
    location.reload();
}

async function renderizarTabela() {
    let dados = await dbListar("vistorias");
    const filtro = document.getElementById('veiculoFiltro').value.toUpperCase();
    
    if (filtro) dados = dados.filter(d => d.placa.includes(filtro));

    const tbody = document.getElementById('tabelaVistoria');
    tbody.innerHTML = dados.map(v => `
        <tr>
            <td>${v.data} <small>${v.hora}</small></td>
            <td><strong>${v.placa}</strong></td>
            <td>${v.vigilante}</td>
            <td>${v.km} KM</td>
            <td>
                <button onclick="excluir(${v.id})" style="color:red; background:none; border:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function gerarRelatorioVistoriaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const filtro = document.getElementById('veiculoFiltro').value.toUpperCase();
    let dados = await dbListar("vistorias");

    if (filtro) dados = dados.filter(d => d.placa === filtro);

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70);
    doc.text("JAPAN SECURITY - RELATÓRIO DE VISTORIAS", 14, 20);

    const colunas = ["Data", "Viatura", "Vigilante", "KM", "Obs"];
    const linhas = dados.map(v => [v.data, v.placa, v.vigilante, v.km, v.obs || "-"]);

    doc.autoTable({
        head: [colunas],
        body: linhas,
        startY: 30,
        headStyles: { fillColor: [0, 0, 0] }
    });

    doc.save(`vistorias_${filtro || 'geral'}.pdf`);
}

async function excluir(id) {
    if(confirm("Deseja excluir esta vistoria?")) {
        await dbExcluir("vistorias", id);
        renderizarTabela();
    }
}

window.onload = inicializar;
