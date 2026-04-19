/* ============================================================
   ARQUIVO: js/vistoria.js - FUSÃO FINAL JAPAN SECURITY
   ============================================================ */

let fotoBase64 = "";

// 1. Câmera e Redimensionamento
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

// 2. Busca Automática de KM e Modelo
document.getElementById('veiculo').addEventListener('change', async function() {
    const vtr = this.value.toUpperCase();
    if(!vtr) return;

    const [movs, vists, frota] = await Promise.all([
        dbListar("movimentacao"),
        dbListar("vistorias"),
        dbListar("vehicles")
    ]);

    const historico = [...movs, ...vists]
        .filter(r => (r.veiculo === vtr || r.viatura === vtr))
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

// 3. Tabela com Filtro de Data/Hora e Lixeira
async function carregarTabelaVistoria() {
    const [dados, frota] = await Promise.all([
        dbListar("vistorias"),
        dbListar("vehicles")
    ]);
    
    const tbody = document.getElementById('tabelaVistoria');
    if(!tbody) return;

    const dIni = document.getElementById('f_data_ini').value;
    const dFim = document.getElementById('f_data_fim').value;

    let filtrados = dados;
    // Filtro por Data e Hora Exata
    if (dIni && dFim) {
        const start = new Date(dIni).getTime();
        const end = new Date(dFim).getTime();
        filtrados = dados.filter(d => d.timestamp >= start && d.timestamp <= end);
    }

    const ordenados = filtrados.sort((a, b) => b.timestamp - a.timestamp);

    tbody.innerHTML = ordenados.map(d => {
        const dadosCarro = frota.find(f => f.placa === d.veiculo);
        const modelo = dadosCarro ? dadosCarro.nome : "Viatura";

        return `
        <tr style="border-left: 4px solid #e63946;">
            <td><small>${d.data}</small></td>
            <td>
                <strong style="color: #eee;">${d.veiculo}</strong><br>
                <small style="color: #e63946; font-weight: bold; text-transform: uppercase;">${modelo}</small>
            </td>
            <td><small style="color: #bbb;">${d.vigilante}</small></td>
            <td style="text-align:center">${d.foto ? '<i class="fas fa-camera" style="color:#27ae60"></i>' : '-'}</td>
            <td style="text-align:right;">
                <button onclick="excluir(${d.id})" style="background:none; border:none; color:#555; cursor:pointer; padding: 10px;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `}).join('');
}

async function salvarVistoria() {
    const vtr = document.getElementById('veiculo').value.toUpperCase();
    const km = document.getElementById('km').value;
    const vigilante = document.getElementById('vigilante').value;

    if(!vtr || !km || !vigilante) return alert("Viatura, KM e Vigilante são obrigatórios!");

    const registro = {
        id: Date.now(),
        timestamp: new Date().getTime(),
        data: new Date().toLocaleString('pt-BR'),
        veiculo: vtr,
        km: parseInt(km),
        vigilante: vigilante,
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
    alert("Vistoria finalizada com sucesso!");
    location.reload();
}

// 4. PDF Profissional com Filtro de Horário
async function gerarVistoriaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let [dados, frota] = await Promise.all([
        dbListar("vistorias"),
        dbListar("vehicles")
    ]);

    const dIni = document.getElementById('f_data_ini').value;
    const dFim = document.getElementById('f_data_fim').value;

    if (dIni && dFim) {
        const start = new Date(dIni).getTime();
        const end = new Date(dFim).getTime();
        dados = dados.filter(d => d.timestamp >= start && d.timestamp <= end);
    }

    if (dados.length === 0) return alert("Nenhum dado encontrado para o período.");

    const formatDt = (dt) => dt ? new Date(dt).toLocaleString('pt-BR').substring(0, 16) : '---';

    doc.setFillColor(230, 57, 70); 
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("JAPAN SECURITY - RELATÓRIO TÉCNICO DE VISTORIA", 14, 13);
    doc.setFontSize(9);
    doc.text(`Período: ${formatDt(dIni)} até ${formatDt(dFim)}`, 14, 18);

    let y = 30;
    dados.sort((a,b) => b.timestamp - a.timestamp).forEach(d => {
        if (y > 240) { doc.addPage(); y = 20; }

        const vtrInfo = frota.find(f => f.placa === d.veiculo);
        const modelo = vtrInfo ? vtrInfo.nome : "Viatura";

        doc.setFontSize(10); doc.setTextColor(0); doc.setFont(undefined, 'bold');
        doc.text(`VTR: ${d.veiculo} - ${modelo}`, 14, y);
        doc.text(`DATA: ${d.data}`, 120, y);
        
        doc.setFont(undefined, 'normal'); doc.setFontSize(8); y += 6;
        const c = d.check;
        const l1 = `KM: ${d.km} | Vigilante: ${d.vigilante} | Óleo: ${c.oleo} | Água: ${c.agua} | Pneus: ${c.pneus}`;
        const l2 = `Limpeza: ${c.limpeza} | Macaco: ${c.macaco} | Faróis: ${c.f_esq}/${c.f_dir} | Lanternas: ${c.l_esq}/${c.l_dir}`;
        
        doc.text(l1, 14, y); y += 4;
        doc.text(l2, 14, y); y += 5;

        if (d.foto) {
            try {
                doc.addImage(d.foto, 'JPEG', 14, y, 45, 30);
                y += 35;
            } catch(e) { y += 2; }
        } else { y += 2; }
        
        if(d.obs) { 
            doc.setFont(undefined, 'italic');
            doc.text(`Observações: ${d.obs}`, 14, y); 
            y += 6; 
        }
        
        doc.setDrawColor(220);
        doc.line(14, y, 196, y); y += 12;
    });

    doc.save(`Relatorio_Vistorias_JapanSecurity.pdf`);
}

async function excluir(id) {
    if(confirm("Deseja remover este registro de vistoria?")) { 
        await dbExcluir("vistorias", id); 
        carregarTabelaVistoria(); 
    }
}

window.onload = () => { carregarPlacas(); carregarTabelaVistoria(); };
