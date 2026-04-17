let fotoBase64 = "";

// 1. Função de Câmera e Redimensionamento (para não pesar o sistema)
function previewImagem(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxW = 800;
                const scale = maxW / img.width;
                canvas.width = maxW;
                canvas.height = img.height * scale;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                fotoBase64 = canvas.toDataURL('image/jpeg', 0.7);
                const preview = document.getElementById('preview');
                preview.src = fotoBase64;
                preview.style.display = "block";
            }
        };
        reader.readAsDataURL(file);
    }
}

// 2. Busca Automática de KM ao selecionar veículo
document.getElementById('veiculo').addEventListener('change', async function() {
    const vtr = this.value.toUpperCase();
    if(!vtr) return;

    const [movs, vists, frota] = await Promise.all([
        dbListar("movimentacao"),
        dbListar("vistorias"),
        dbListar("vehicles")
    ]);

    const historico = [...movs, ...vists]
        .filter(r => r.veiculo === vtr)
        .sort((a,b) => b.timestamp - a.timestamp);

    if(historico.length > 0) {
        document.getElementById('km').value = historico[0].km;
    } else {
        const carro = frota.find(v => v.placa === vtr);
        if(carro) document.getElementById('km').value = carro.kmAtual;
    }
});

async function carregarPlacas() {
    const veiculos = await dbListar("vehicles");
    const list = document.getElementById('listaVeiculos');
    if(list) list.innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
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
            <td style="text-align:center">${d.foto ? '<i class="fas fa-camera" style="color:#27ae60"></i>' : '-'}</td>
            <td style="text-align:right;"><button onclick="excluir(${d.id})" style="background:none; border:none; color:#555; cursor:pointer;"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

async function salvarVistoria() {
    const vtr = document.getElementById('veiculo').value.toUpperCase();
    const km = document.getElementById('km').value;
    if(!vtr || !km) return alert("Viatura e KM são obrigatórios!");

    const registro = {
        id: Date.now(),
        timestamp: new Date().getTime(),
        data: new Date().toLocaleString('pt-BR'),
        veiculo: vtr,
        km: km,
        vigilante: document.getElementById('vigilante').value,
        foto: fotoBase64,
        obs: document.getElementById('obs').value,
        check: {
            oleo: document.getElementById('oleo').checked ? 'OK' : 'X',
            agua: document.getElementById('agua').checked ? 'OK' : 'X',
            pneus: document.getElementById('pneus').checked ? 'OK' : 'X',
            limpeza: document.getElementById('limpeza').checked ? 'OK' : 'X',
            macaco: document.getElementById('macaco').checked ? 'OK' : 'X',
            triangulo: document.getElementById('triangulo').checked ? 'OK' : 'X',
            f_esq: document.getElementById('f_esq').checked ? 'OK' : 'X',
            f_dir: document.getElementById('f_dir').checked ? 'OK' : 'X',
            l_esq: document.getElementById('l_esq').checked ? 'OK' : 'X',
            l_dir: document.getElementById('l_dir').checked ? 'OK' : 'X'
        }
    };

    await dbSalvar("vistorias", registro);
    alert("Vistoria salva com sucesso!");
    location.reload();
}

async function gerarVistoriaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let dados = await dbListar("vistorias");

    const dIni = document.getElementById('f_data_ini').value;
    const dFim = document.getElementById('f_data_fim').value;

    if (dIni && dFim) {
        const start = new Date(dIni + "T00:00").getTime();
        const end = new Date(dFim + "T23:59").getTime();
        dados = dados.filter(d => d.timestamp >= start && d.timestamp <= end);
    }

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70);
    doc.text("JAPAN SECURITY - RELATÓRIO DE VISTORIAS", 14, 15);

    let y = 25;
    dados.forEach(d => {
        if (y > 230) { doc.addPage(); y = 20; }
        doc.setFontSize(10); doc.setTextColor(0); doc.setFont(undefined, 'bold');
        doc.text(`VTR: ${d.veiculo} | DATA: ${d.data} | KM: ${d.km}`, 14, y);
        
        doc.setFont(undefined, 'normal'); doc.setFontSize(8); y += 6;
        const c = d.check;
        const linha1 = `Óleo: ${c.oleo} | Água: ${c.agua} | Pneus: ${c.pneus} | Limpeza: ${c.limpeza} | Macaco: ${c.macaco}`;
        const linha2 = `Triângulo: ${c.triangulo} | Farol E/D: ${c.f_esq}/${c.f_dir} | Lant. E/D: ${c.l_esq}/${c.l_dir}`;
        doc.text(linha1, 14, y); y += 4;
        doc.text(linha2, 14, y); y += 5;

        if (d.foto) {
            doc.addImage(d.foto, 'JPEG', 14, y, 40, 25);
            y += 30;
        } else { y += 5; }
        
        if(d.obs) { doc.text(`Obs: ${d.obs}`, 14, y); y += 5; }
        doc.line(14, y, 196, y); y += 10;
    });

    doc.save("vistorias_japan.pdf");
}

async function excluir(id) {
    if(confirm("Excluir esta vistoria?")) { await dbExcluir("vistorias", id); carregarTabela(); }
}

window.onload = () => { carregarPlacas(); carregarTabela(); };
