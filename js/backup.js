/* ============================================================
   ARQUIVO: js/backup.js - Segurança Japan Security
   ============================================================ */

async function exportarBackup() {
    try {
        // Coleta dados de todas as tabelas (Ajustado para os nomes reais do seu DB)
        const veiculos = await dbListar("vehicles");
        const vistorias = await dbListar("vistorias");
        const movimentacoes = await dbListar("movimentacao");
        const manutencoes = await dbListar("manutencoes"); // Ajustado para coincidir com maintenance.js

        const dadosCompletos = {
            dataBackup: new Date().toISOString(),
            vehicles: veiculos,
            vistorias: vistorias,
            movimentacao: movimentacoes,
            manutencoes: manutencoes
        };

        const blob = new Blob([JSON.stringify(dadosCompletos, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup_japan_security_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert("Backup exportado com sucesso! Guarde este arquivo com segurança.");
    } catch (error) {
        console.error(error);
        alert("Erro ao gerar backup: " + error);
    }
}

async function importarBackup() {
    const fileInput = document.getElementById('fileBackup');
    if (!fileInput.files.length) {
        return alert("Selecione o arquivo .json baixado anteriormente.");
    }

    const arquivo = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const dados = JSON.parse(e.target.result);

            if (confirm("Isso apagará os dados atuais do celular e colocará os do arquivo. Confirmar?")) {
                
                // Importa cada categoria
                if (dados.vehicles) {
                    for (let v of dados.vehicles) await dbSalvar("vehicles", v);
                }
                if (dados.vistorias) {
                    for (let vis of dados.vistorias) await dbSalvar("vistorias", vis);
                }
                if (dados.movimentacao) {
                    for (let m of dados.movimentacao) await dbSalvar("movimentacao", m);
                }
                if (dados.manutencoes) {
                    for (let man of dados.manutencoes) await dbSalvar("manutencoes", man);
                }

                alert("Restauração concluída!");
                window.location.href = "index.html";
            }
        } catch (error) {
            alert("Arquivo inválido. Certifique-se de usar o arquivo .json gerado pelo sistema.");
        }
    };

    reader.readAsText(arquivo);
}
