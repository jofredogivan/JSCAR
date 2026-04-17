/**
 * SISTEMA DE VISTORIA JAPAN SECURITY
 * Versão Completa: Filtros + Checklist + Foto + PDF
 */

let fotoBase64 = ""; // Variável global para armazenar a imagem temporariamente

// 1. Função para Visualizar a Foto antes de salvar
function previewImagem(input) {
    const file = input.files[0];
    if (file) {
        // Redimensionar para não pesar o banco de dados local
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgRedimensionada = new Image();
            imgRedimensionada.src = e.target.result;
            
            imgRedimensionada.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                // Mantém a foto leve para o PDF não travar
                canvas.width = 600; 
                canvas.height = (imgRedimensionada.height / imgRedimensionada.width) * 600;
                ctx.drawImage(imgRedimensionada, 0, 0, canvas.width, canvas.height);
                
                fotoBase64 = canvas.toDataURL('image/jpeg', 0.7);
                const imgDisplay = document.getElementById('preview');
                imgDisplay.src = fotoBase64;
                imgDisplay.style.display = "block";
            };
        };
        reader.readAsDataURL(file);
    }
}

// 2. Carrega as placas dos veículos no datalist
async function carregarPlacas() {
    const veiculos = await dbListar("vehicles");
    const dl = document.getElementById('listaVeiculos');
    if(dl) dl.innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
}

// 3. Mostra o histórico na tabela
async function carregarTabela() {
    const dados = await dbListar("vistorias");
    const tbody = document.getElementById('tabelaVistoria');
    if(!tbody) return;
    
    tbody.innerHTML = dados.reverse().map(d => `
        <tr>
            <td>${d.data.split(',')[0]}</td>
            <td><strong>${d.veiculo}</strong></td>
            <td>${d.km} KM</td>
            <td style="text-align:center">${d.foto ? '<i class="fas fa-camera" style="color:#27ae60"></i>' : '<i class="fas fa-times"></i>'}</td>
            <td style="text-align:right;">
                <button onclick="excluir(${d.id})" style="background:none; border:none; color:#555; cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 4. Salva a Vistoria
async function salvarVistoria() {
    const vtr = document.getElementById('veiculo').value.toUpperCase();
    const km = document.getElementById('km').value;
    const vigilante = document.getElementById('vigilante').value;

    if(!vtr || !km) return alert("Por favor, preencha a Viatura e o KM!");

    const agora = new Date();
    const registro = {
        id: Date.now(),
        timestamp: agora.getTime(),
        data: agora.toLocaleString('pt-BR'),
        veiculo: vtr,
        km: km,
        vigilante: vigilante,
        foto: fotoBase64,
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
    alert("Vistoria salva com sucesso!");
    location.reload(); // Limpa tudo
}

// 5. Gera o PDF com Filtros e Blocos por Veículo
async function gerarVistoriaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let dados = await dbListar("vistorias");

    // Filtros
    const dIni = document.getElementById('f_data_ini').value;
    const dFim = document.getElementById('f_data_fim').value;

    if (dIni && dFim) {
        const start = new Date(dIni + "T00:00").getTime();
        const end = new Date(dFim + "T23:59").getTime();
        dados = dados.filter(d => d.timestamp >= start && d.timestamp <= end);
    }

    if (dados.length === 0) return alert("Sem dados para o período selecionado!");

    doc.setFontSize(16);
    doc.setTextColor(230, 57, 70);
    doc.text("JAPAN SECURITY - RELATÓRIO DE VISTORIA", 14, 15);

    let y = 25;

    // Organiza por veículo no PDF
    const veiculos = [...new Set(dados.map(d => d.veiculo))];

    veiculos.forEach(vtr => {
        const vistorias = dados.filter(d => d.veiculo === vtr);
        
        vistorias.forEach(d => {
            if (y > 230) { doc.addPage(); y = 20; }
            
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.setFont(undefined, 'bold');
            doc.text(`VEÍCULO: ${vtr} | DATA: ${d.data}`, 14, y);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            y += 6;
            doc.text(`Vigilante: ${d.vigilante} | KM: ${d.km} KM`, 14, y);
            y += 5;
            doc.text(`CHECKLIST: Óleo:${d.check.oleo} | Água:${d.check.agua} | Faróis:${d.check.f_esq}/${d.check.f_dir} | Lant:${d.check.l_esq}/${d.check.l_dir}`, 14, y);
            
            if (d.foto) {
                doc.addImage(d.foto, 'JPEG', 14, y + 4, 50, 35);
                y += 45;
            } else {
                y += 10;
            }
            doc.setDrawColor(200);
            doc.line(14, y, 196, y);
            y += 10;
        });
    });

    doc.save("vistorias_japan_security.pdf");
}

async function excluir(id) {
    if(confirm("Deseja apagar esta vistoria?")) {
        await dbExcluir("vistorias", id);
        carregarTabela();
    }
}

window.onload = () => {
    carregarPlacas();
    carregarTabela();
};
