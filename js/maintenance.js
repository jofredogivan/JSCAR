/* ============================================================
   ARQUIVO: js/maintenance.js - JAPAN SECURITY
   ============================================================ */

let notaBase64 = "";

async function carregarDados() {
    const [manutencoes, frota] = await Promise.all([
        dbListar("manutencao"),
        dbListar("vehicles")
    ]);

    // 1. Carregar Lista de Placas
    const list = document.getElementById('listaVeiculos');
    if(list) list.innerHTML = frota.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');

    // 2. Calcular Dashboard Financeiro
    let somaTotal = 0;
    manutencoes.forEach(m => {
        somaTotal += parseFloat(m.valor || 0);
    });

    document.getElementById('totalGasto').innerText = somaTotal.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' });
    document.getElementById('totalRegistros').innerText = manutencoes.length;

    // 3. Popular Tabela
    const tbody = document.getElementById('tabelaManutencao');
    if(!tbody) return;

    tbody.innerHTML = manutencoes.sort((a,b) => b.timestamp - a.timestamp).map(m => `
        <tr style="border-left: 4px solid ${m.tipo === 'CORRETIVA' ? '#e63946' : '#3498db'};">
            <td><small>${m.data.split(',')[0]}</small></td>
            <td>
                <strong>${m.veiculo}</strong><br>
                <small style="color: #888; text-transform: uppercase;">${m.servico}</small>
            </td>
            <td style="font-weight: bold; color: #27ae60;">R$ ${parseFloat(m.valor).toFixed(2)}</td>
            <td style="text-align: right;">
                <button onclick="excluirManutencao(${m.id})" style="background:none; border:none; color:#555; cursor:pointer;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function previewNota(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxW = 1000; // Qualidade maior para ler a nota fiscal
                const scale = maxW / img.width;
                canvas.width = maxW;
                canvas.height = img.height * scale;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                notaBase64 = canvas.toDataURL('image/jpeg', 0.8);
                
                const preview = document.getElementById('previewNota');
                preview.src = notaBase64;
                preview.style.display = "block";
            }
        };
        reader.readAsDataURL(file);
    }
}

async function salvarManutencao() {
    const vtr = document.getElementById('m_veiculo').value.toUpperCase();
    const valor = document.getElementById('m_valor').value;
    const servico = document.getElementById('m_servico').value;

    if(!vtr || !valor || !servico) {
        return alert("Viatura, Valor e Descrição são obrigatórios!");
    }

    const registro = {
        id: Date.now(),
        timestamp: new Date().getTime(),
        data: new Date().toLocaleString('pt-BR'),
        veiculo: vtr,
        tipo: document.getElementById('m_tipo').value,
        valor: valor,
        servico: servico,
        km: document.getElementById('m_km').value,
        proximaKm: document.getElementById('m_proxima').value,
        comprovante: notaBase64
    };

    await dbSalvar("manutencao", registro);
    alert("Manutenção registrada com sucesso!");
    location.reload();
}

async function excluirManutencao(id) {
    if(confirm("Deseja apagar este registro de manutenção?")) {
        await dbExcluir("manutencao", id);
        carregarDados();
    }
}

window.onload = carregarDados;
