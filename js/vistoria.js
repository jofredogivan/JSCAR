/* ============================================================
   ARQUIVO: js/vistoria.js
   ============================================================ */

// Função para comprimir a foto e economizar espaço no banco
async function processarFoto(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; // Largura máxima otimizada
                const scale = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scale;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Retorna a imagem em JPEG com 70% de qualidade
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
}

async function inicializar() {
    const veiculos = await dbListar("vehicles");
    const dl = document.getElementById('listaVeiculos');
    if (dl) {
        dl.innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
    }
    renderizarTabela();
}

async function puxarKmAutomatico() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    const veiculos = await dbListar("vehicles");
    const vEncontrado = veiculos.find(v => v.placa === placa);
    if (vEncontrado) {
        document.getElementById('km').value = vEncontrado.kmAtual || "";
    }
}

async function salvar() {
    const vInput = document.getElementById('veiculo');
    const kInput = document.getElementById('km');
    const vigInput = document.getElementById('vigilante');
    const fotoFile = document.getElementById('fotoVeiculo').files[0];
    const obs = document.getElementById('obsAvaria').value;

    if (!vInput.value || !kInput.value || !vigInput.value) {
        return alert("Preencha Placa, KM e Vigilante!");
    }

    let fotoBase64 = "";
    if (fotoFile) {
        fotoBase64 = await processarFoto(fotoFile);
    }

    const vistoria = {
        id: Date.now(),
        placa: vInput.value.toUpperCase(),
        km: parseInt(kInput.value),
        vigilante: vigInput.value,
        obs: obs,
        foto: fotoBase64,
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        checklist: {
            oleo: document.getElementById('oleo').checked,
            agua: document.getElementById('agua').checked,
            pneus: document.getElementById('pneus').checked,
            limpeza: document.getElementById('limpeza').checked,
            macaco: document.getElementById('macaco').checked,
            triangulo: document.getElementById('triangulo').checked,
            farol_esq: document.getElementById('farol_esq').checked,
            farol_dir: document.getElementById('farol_dir').checked,
            lanterna_esq: document.getElementById('lanterna_esq').checked,
            lanterna_dir: document.getElementById('lanterna_dir').checked
        }
    };

    await dbSalvar("vistorias", vistoria);

    // Também atualiza o KM na base do veículo
    const veiculos = await dbListar("vehicles");
    const vIdx = veiculos.find(v => v.placa === vistoria.placa);
    if (vIdx) {
        vIdx.kmAtual = vistoria.km;
        await dbSalvar("vehicles", vIdx);
    }

    alert("Vistoria salva com sucesso!");
    location.reload();
}

async function renderizarTabela() {
    const dados = await dbListar("vistorias");
    const tbody = document.getElementById('tabela');
    if (!tbody) return;

    tbody.innerHTML = dados.map(v => `
        <tr>
            <td>${v.data}<br><small>${v.hora}</small></td>
            <td><strong>${v.placa}</strong></td>
            <td>${v.vigilante}</td>
            <td>${v.km} KM</td>
            <td>
                <button onclick="excluirVistoria(${v.id})" style="background:none; border:none; color:#e63946; cursor:pointer;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

async function excluirVistoria(id) {
    if (confirm("Excluir esta vistoria permanentemente?")) {
        await dbExcluir("vistorias", id);
        renderizarTabela();
    }
}

window.onload = inicializar;
