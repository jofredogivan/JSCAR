/* ============================================================
   ARQUIVO: js/vistoria.js
   ============================================================ */

// 1. FUNÇÃO PARA CONVERTER IMAGEM EM BASE64 (Para salvar no LocalStorage)
async function converterImagemParaBase64(arquivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(arquivo);
    });
}

// 2. BUSCA KM AUTOMÁTICO AO SELECIONAR VEÍCULO
function puxarKmAutomatico() {
    const placa = document.getElementById('veiculo').value.toUpperCase();
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const v = veiculos.find(item => item.placa.toUpperCase() === placa);
    if (v) {
        document.getElementById('km').value = v.kmAtual || 0;
    }
}

// 3. SALVAR VISTORIA
async function salvar() {
    const vInput = document.getElementById('veiculo');
    const kInput = document.getElementById('km');
    const vigInput = document.getElementById('vigilante');
    const fotoInput = document.getElementById('fotoVeiculo');
    const obsInput = document.getElementById('obsAvaria');

    // Validação básica
    if (!vInput.value || !kInput.value || !vigInput.value) {
        alert("Por favor, preencha Veículo, KM e o nome do Vigilante.");
        return;
    }

    let fotoBase64 = "";
    if (fotoInput.files.length > 0) {
        try {
            fotoBase64 = await converterImagemParaBase64(fotoInput.files[0]);
        } catch (e) {
            console.error("Erro ao processar imagem", e);
        }
    }

    // Criando o objeto da vistoria com os novos itens de checklist
    const novaVistoria = {
        id: Date.now(),
        dataIso: new Date().toISOString(),
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        veiculo: vInput.value.toUpperCase(),
        km: kInput.value,
        vigilante: vigInput.value,
        obs: obsInput.value,
        foto: fotoBase64,
        checklist: {
            oleo: document.getElementById('oleo').checked,
            agua: document.getElementById('agua').checked,
            pneus: document.getElementById('pneus').checked,
            limpeza: document.getElementById('limpeza').checked,
            macaco: document.getElementById('macaco').checked,
            triangulo: document.getElementById('triangulo').checked,
            // Novos itens solicitados
            farolEsq: document.getElementById('farol_esq').checked,
            farolDir: document.getElementById('farol_dir').checked,
            lanternaEsq: document.getElementById('lanterna_esq').checked,
            lanternaDir: document.getElementById('lanterna_dir').checked
        }
    };

    // Salva na lista de vistorias
    const listaVistorias = JSON.parse(localStorage.getItem("vistorias")) || [];
    listaVistorias.unshift(novaVistoria);
    localStorage.setItem("vistorias", JSON.stringify(listaVistorias));

    // Atualiza o KM no cadastro global de veículos
    const veiculosBase = JSON.parse(localStorage.getItem("vehicles")) || [];
    let idx = veiculosBase.findIndex(v => v.placa.toUpperCase() === vInput.value.toUpperCase());
    if (idx !== -1) {
        veiculosBase[idx].kmAtual = kInput.value;
        localStorage.setItem("vehicles", JSON.stringify(veiculosBase));
    }

    alert("Vistoria salva com sucesso!");
    location.reload(); // Recarrega para limpar campos e atualizar tabela
}

// 4. RENDERIZAR TABELA COM FILTRO
function renderizarTabela() {
    let dados = JSON.parse(localStorage.getItem("vistorias")) || [];
    const tbody = document.getElementById('tabela');
    if (!tbody) return;

    const inicio = document.getElementById('dataInicio').value;
    const fim = document.getElementById('dataFim').value;

    if (inicio && fim) {
        const dInicio = new Date(inicio);
        const dFim = new Date(fim);
        dados = dados.filter(item => {
            const dItem = new Date(item.dataIso);
            return dItem >= dInicio && dItem <= dFim;
        });
    }

    tbody.innerHTML = dados.map(v => `
        <tr>
            <td>${v.data}<br><small>${v.hora}</small></td>
            <td><strong>${v.veiculo}</strong></td>
            <td>${v.vigilante}</td>
            <td>${v.km} KM</td>
            <td>${v.obs || 'S/ Obs'}</td>
            <td>
                <button onclick="excluir(${v.id})" style="color:red; background:none; border:none; cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 5. EXCLUIR VISTORIA
function excluir(id) {
    if (confirm("Excluir esta vistoria permanentemente?")) {
        let dados = JSON.parse(localStorage.getItem("vistorias")) || [];
        dados = dados.filter(d => d.id !== id);
        localStorage.setItem("vistorias", JSON.stringify(dados));
        renderizarTabela();
    }
}

// 6. GERAR RELATÓRIO PDF
function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dados = JSON.parse(localStorage.getItem("vistorias")) || [];

    doc.setFontSize(16);
    doc.text("JAPAN SECURITY - RELATÓRIO DE VISTORIAS", 14, 15);

    const rows = dados.map(v => [
        `${v.data} ${v.hora}`,
        v.veiculo,
        v.vigilante,
        `${v.km} KM`,
        v.obs || '-'
    ]);

    doc.autoTable({
        startY: 25,
        head: [['Data/Hora', 'Veículo', 'Vigilante', 'KM', 'Observações']],
        body: rows,
        theme: 'grid'
    });

    doc.save('vistorias_japan_security.pdf');
}

// 7. INICIALIZAÇÃO AO CARREGAR PÁGINA
window.onload = () => {
    const veiculos = JSON.parse(localStorage.getItem("vehicles")) || [];
    const dl = document.getElementById('listaVeiculos');
    if (dl) {
        dl.innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
    }
    renderizarTabela();
};
