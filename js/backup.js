/* ============================================================
   ARQUIVO: js/backup.js - Segurança Japan Security
   ============================================================ */

async function exportarBackup() {
    try {
        // Coleta dados de todas as tabelas
        const veiculos = await dbListar("vehicles");
        const vistorias = await dbListar("vistorias");
        const movimentacoes = await dbListar("movimentacao");
        const manutencoes = await dbListar("maintenance");

        const dadosCompletos = {
            dataBackup: new Date().toISOString(),
            vehicles: veiculos,
            vistorias: vistorias,
            movimentacao: movimentacoes,
            maintenance: manutencoes
        };

        // Converte para JSON string
        const blob = new Blob([JSON.stringify(dadosCompletos, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        // Cria o link de download
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup_japan_security_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert("Backup exportado com sucesso! Guarde este arquivo em um local seguro.");
    } catch (error) {
        console.error(error);
        alert("Erro ao gerar backup: " + error);
    }
}

async function importarBackup() {
    const fileInput = document.getElementById('fileBackup');
    if (!fileInput.files.length) {
        return alert("Por favor, selecione o arquivo de backup (.json) primeiro.");
    }

    const arquivo = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const dados = JSON.parse(e.target.result);

            if (confirm("Isso irá substituir os dados atuais. Deseja continuar?")) {
                
                // Importa cada categoria para sua respectiva Object Store
                if (dados.vehicles) {
                    for (let v of dados.vehicles) await dbSalvar("vehicles", v);
                }
                if (dados.vistorias) {
                    for (let vis of dados.vistorias) await dbSalvar("vistorias", vis);
                }
                if (dados.movimentacao) {
                    for (let m of dados.movimentacao) await dbSalvar("movimentacao", m);
                }
                if (dados.maintenance) {
                    for (let man of dados.maintenance) await dbSalvar("maintenance", man);
                }

                alert("Dados restaurados com sucesso! O sistema irá recarregar.");
                window.location.href = "index.html";
            }
        } catch (error) {
            alert("Erro ao processar o arquivo de backup. Verifique se o formato está correto.");
        }
    };

    reader.readAsText(arquivo);
}
