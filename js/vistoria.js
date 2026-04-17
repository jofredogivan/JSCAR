<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Japan Security | Vistoria</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>
    
    <style>
        :root { --red: #e63946; --dark: #121212; --card: #1e1e1e; --border: #333; --green: #27ae60; }
        body { background: var(--dark); color: white; font-family: 'Segoe UI', sans-serif; margin: 0; display: flex; }
        .sidebar { width: 250px; background: #000; height: 100vh; border-right: 1px solid var(--border); position: fixed; }
        .sidebar-nav a { display: block; padding: 15px 20px; color: #888; text-decoration: none; border-left: 4px solid transparent; }
        .sidebar-nav a:hover, .sidebar-nav a.active { color: white; background: rgba(230,57,70,0.1); border-left-color: var(--red); }
        .main { flex: 1; margin-left: 250px; padding: 30px; }
        .card { background: var(--card); border-radius: 8px; padding: 20px; border: 1px solid var(--border); margin-bottom: 20px; }
        .grid-inputs { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-bottom: 20px; }
        label { display: block; color: #888; font-size: 11px; margin-bottom: 5px; text-transform: uppercase; }
        .modern-input { width: 100%; background: #2a2a2a; border: 1px solid var(--border); color: white; padding: 12px; border-radius: 4px; box-sizing: border-box; }
        .checklist-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; padding: 15px; background: #151515; border-radius: 5px; }
        .check-item { display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
        .btn { padding: 12px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; transition: 0.3s; display: inline-flex; align-items: center; gap: 8px; justify-content: center; }
        .btn-save { background: var(--red); color: white; width: 100%; margin-top: 20px; }
        .btn-pdf { background: var(--green); color: white; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { text-align: left; color: #888; padding: 12px; border-bottom: 2px solid var(--border); font-size: 12px; }
        td { padding: 12px; border-bottom: 1px solid var(--border); font-size: 14px; }
        .btn-delete { background: none; border: none; color: #555; cursor: pointer; }
        .btn-delete:hover { color: var(--red); transform: scale(1.2); }
        @media (max-width: 768px) { .sidebar { display: none; } .main { margin-left: 0; } }
    </style>
</head>
<body>
    <aside class="sidebar">
        <div style="padding: 30px 20px; text-align: center;"><h2 style="color:var(--red); margin:0; letter-spacing:2px;">JAPAN</h2><span style="font-size:10px; color:#888;">SECURITY</span></div>
        <nav class="sidebar-nav">
            <a href="index.html"><i class="fas fa-chart-line"></i> Dashboard</a>
            <a href="entrada_saida.html"><i class="fas fa-exchange-alt"></i> Movimentação</a>
            <a href="vistoria.html" class="active"><i class="fas fa-clipboard-check"></i> Vistoria</a>
            <a href="vehicles.html"><i class="fas fa-car"></i> Veículos</a>
        </nav>
    </aside>

    <main class="main">
        <h1 style="font-weight: 300; margin-bottom: 30px;">Vistoria de Viatura</h1>

        <div class="card">
            <div class="grid-inputs">
                <div class="input-group">
                    <label>Veículo</label>
                    <input id="veiculo" class="modern-input" list="listaVeiculos" placeholder="Selecione a placa...">
                    <datalist id="listaVeiculos"></datalist>
                </div>
                <div class="input-group"><label>KM Atual</label><input id="km" type="number" class="modern-input"></div>
                <div class="input-group"><label>Vigilante</label><input id="vigilante" class="modern-input"></div>
            </div>

            <h4 style="color:var(--red); margin-bottom:10px; font-size: 13px;">CHECKLIST DE SEGURANÇA E ILUMINAÇÃO</h4>
            <div class="checklist-grid">
                <label class="check-item"><input type="checkbox" id="oleo"> Óleo</label>
                <label class="check-item"><input type="checkbox" id="agua"> Água</label>
                <label class="check-item"><input type="checkbox" id="pneus"> Pneus</label>
                <label class="check-item"><input type="checkbox" id="limpeza"> Limpeza</label>
                <label class="check-item"><input type="checkbox" id="macaco"> Macaco</label>
                <label class="check-item"><input type="checkbox" id="triangulo"> Triângulo</label>
                <label class="check-item"><input type="checkbox" id="farol_esq"> Farol Esq.</label>
                <label class="check-item"><input type="checkbox" id="farol_dir"> Farol Dir.</label>
                <label class="check-item"><input type="checkbox" id="lanterna_esq"> Lanterna Esq.</label>
                <label class="check-item"><input type="checkbox" id="lanterna_dir"> Lanterna Dir.</label>
            </div>
            
            <div class="input-group" style="margin-top: 20px;">
                <label>Observações</label>
                <textarea id="obs" class="modern-input" rows="2"></textarea>
            </div>

            <button class="btn btn-save" onclick="salvar()"><i class="fas fa-save"></i> SALVAR VISTORIA</button>
        </div>

        <div class="card" style="background: rgba(255,255,255,0.02);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h4 style="margin:0; font-size: 14px; color: #888;">HISTÓRICO E EXPORTAÇÃO</h4>
                <button class="btn btn-pdf" onclick="gerarRelatorioVistoriaPDF()"><i class="fas fa-file-pdf"></i> GERAR PDF</button>
            </div>
            <table>
                <thead><tr><th>Data</th><th>Veículo</th><th>Vigilante</th><th>KM</th><th>Ação</th></tr></thead>
                <tbody id="tabelaVistoria"></tbody>
            </table>
        </div>
    </main>

    <script src="js/db.js"></script>
    <script>
        // Carrega placas para o datalist
        async function carregarPlacas() {
            const veiculos = await dbListar("vehicles");
            document.getElementById('listaVeiculos').innerHTML = veiculos.map(v => `<option value="${v.placa}">${v.nome}</option>`).join('');
        }

        async function salvar() {
            const vInput = document.getElementById('veiculo').value.toUpperCase();
            const kInput = document.getElementById('km').value;
            const vigInput = document.getElementById('vigilante').value;

            if(!vInput || !kInput) return alert("Preencha Veículo e KM!");

            const vistoria = {
                id: Date.now(),
                data: new Date().toLocaleString('pt-BR'),
                veiculo: vInput,
                km: kInput,
                vigilante: vigInput,
                obs: document.getElementById('obs').value,
                checklist: {
                    oleo: document.getElementById('oleo').checked ? 'OK' : 'PENDENTE',
                    agua: document.getElementById('agua').checked ? 'OK' : 'PENDENTE',
                    pneus: document.getElementById('pneus').checked ? 'OK' : 'PENDENTE',
                    limpeza: document.getElementById('limpeza').checked ? 'OK' : 'PENDENTE',
                    macaco: document.getElementById('macaco').checked ? 'OK' : 'PENDENTE',
                    triangulo: document.getElementById('triangulo').checked ? 'OK' : 'PENDENTE',
                    farol_esq: document.getElementById('farol_esq').checked ? 'OK' : 'PENDENTE',
                    farol_dir: document.getElementById('farol_dir').checked ? 'OK' : 'PENDENTE',
                    lanterna_esq: document.getElementById('lanterna_esq').checked ? 'OK' : 'PENDENTE',
                    lanterna_dir: document.getElementById('lanterna_dir').checked ? 'OK' : 'PENDENTE'
                }
            };

            await dbSalvar("vistorias", vistoria);
            alert("Vistoria salva!");
            location.reload();
        }

        async function renderizarTabela() {
            const dados = await dbListar("vistorias");
            document.getElementById('tabelaVistoria').innerHTML = dados.reverse().map(d => `
                <tr>
                    <td>${d.data}</td>
                    <td><strong>${d.veiculo}</strong></td>
                    <td>${d.vigilante}</td>
                    <td>${d.km}</td>
                    <td><button class="btn-delete" onclick="deletar(${d.id})"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('');
        }

        async function deletar(id) {
            if(confirm("Excluir esta vistoria?")) {
                await dbExcluir("vistorias", id);
                renderizarTabela();
            }
        }

        async function gerarRelatorioVistoriaPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const dados = await dbListar("vistorias");
            
            doc.setFontSize(16);
            doc.setTextColor(230, 57, 70);
            doc.text("RELATÓRIO DE VISTORIAS - JAPAN SECURITY", 14, 15);

            const veiculos = [...new Set(dados.map(d => d.veiculo))];
            let y = 25;

            veiculos.forEach(vtr => {
                doc.setFontSize(12);
                doc.setTextColor(0, 0, 0);
                doc.text(`VEÍCULO: ${vtr}`, 14, y);
                
                const filtrados = dados.filter(d => d.veiculo === vtr);
                const rows = filtrados.map(d => [
                    d.data, d.vigilante, d.km,
                    `Óleo: ${d.checklist.oleo} | Água: ${d.checklist.agua}\nPneus: ${d.checklist.pneus} | Limpeza: ${d.checklist.limpeza}\nFaróis: E:${d.checklist.farol_esq} D:${d.checklist.farol_dir}\nLanternas: E:${d.checklist.lanterna_esq} D:${d.checklist.lanterna_dir}`,
                    d.obs || "-"
                ]);

                doc.autoTable({
                    head: [['Data', 'Vigilante', 'KM', 'Checklist', 'Obs']],
                    body: rows,
                    startY: y + 5,
                    theme: 'grid',
                    styles: { fontSize: 7 }
                });
                y = doc.lastAutoTable.finalY + 15;
            });
            doc.save("vistorias_japan_security.pdf");
        }

        window.onload = () => { carregarPlacas(); renderizarTabela(); };
    </script>
</body>
</html>
