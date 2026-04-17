/* ============================================================
   ARQUIVO: js/backup.js
   ============================================================ */

// 1. EXPORTAR: Pega tudo do LocalStorage e gera um arquivo .json
function exportarBackup() {
    const backup = {
        vehicles: JSON.parse(localStorage.getItem("vehicles")) || [],
        vistorias: JSON.parse(localStorage.getItem("vistorias")) || [],
        movimentacao: JSON.parse(localStorage.getItem("movimentacao")) || [],
        maintenance: JSON.parse(localStorage.getItem("maintenance")) || []
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
    const downloadAnchorNode = document.createElement('a');
    const dataHora = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `backup_japan_security_${dataHora}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// 2. IMPORTAR: Lê o arquivo enviado e salva de volta no LocalStorage
function importarBackup() {
    const fileInput = document.getElementById('fileBackup');
    const file = fileInput.files[0];

    if (!file) {
        alert("Por favor, selecione um arquivo de backup primeiro!");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);

            if (confirm("Isso irá substituir os dados atuais pelos dados do backup. Confirmar?")) {
                // Salva cada chave individualmente
                if (dados.vehicles) localStorage.setItem("vehicles", JSON.stringify(dados.vehicles));
                if (dados.vistorias) localStorage.setItem("vistorias", JSON.stringify(dados.vistorias));
                if (dados.movimentacao) localStorage.setItem("movimentacao", JSON.stringify(dados.movimentacao));
                if (dados.maintenance) localStorage.setItem("maintenance", JSON.stringify(dados.maintenance));

                alert("Backup restaurado com sucesso! O sistema será reiniciado.");
                window.location.href = "index.html";
            }
        } catch (err) {
            alert("Erro ao ler o arquivo. Verifique se é um backup válido.");
            console.error(err);
        }
    };
    reader.readAsText(file);
}
