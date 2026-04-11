// === FUNÇÃO PARA EXPORTAR BACKUP ===
function exportarBackup() {
    const dados = {
        vehicles: JSON.parse(localStorage.getItem("vehicles")) || [],
        vistorias: JSON.parse(localStorage.getItem("vistorias")) || [],
        movimentacoes: JSON.parse(localStorage.getItem("movimentacoes")) || [],
        manutencoes: JSON.parse(localStorage.getItem("manutencoes")) || []
    };

    const dataString = JSON.stringify(dados, null, 2);
    const blob = new Blob([dataString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    
    link.href = url;
    link.download = `backup_japan_security_${dataAtual}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// === FUNÇÃO PARA IMPORTAR/RESTAURAR BACKUP ===
function importarBackup() {
    const fileInput = document.getElementById('fileBackup');
    const arquivo = fileInput.files[0];

    if (!arquivo) {
        alert("Por favor, selecione o arquivo de backup (.json) primeiro.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const dadosRestaurados = JSON.parse(e.target.result);

            // Validação básica para ver se o arquivo é do sistema
            if (!dadosRestaurados.vehicles && !dadosRestaurados.vistorias) {
                throw new Error("Arquivo de backup inválido ou vazio.");
            }

            if (confirm("Isso irá apagar os dados atuais e restaurar os do arquivo. Deseja continuar?")) {
                
                // Limpa o banco de dados atual
                localStorage.clear();

                // Grava os novos dados chave por chave
                if (dadosRestaurados.vehicles) 
                    localStorage.setItem("vehicles", JSON.stringify(dadosRestaurados.vehicles));
                
                if (dadosRestaurados.vistorias) 
                    localStorage.setItem("vistorias", JSON.stringify(dadosRestaurados.vistorias));
                
                if (dadosRestaurados.movimentacoes) 
                    localStorage.setItem("movimentacoes", JSON.stringify(dadosRestaurados.movimentacoes));
                
                if (dadosRestaurados.manutencoes) 
                    localStorage.setItem("manutencoes", JSON.stringify(dadosRestaurados.manutencoes));

                alert("Dados restaurados com sucesso! O sistema será reiniciado.");
                window.location.href = "index.html"; // Volta para a home
            }
        } catch (erro) {
            console.error(erro);
            alert("Erro ao restaurar: Verifique se o arquivo está correto.");
        }
    };

    reader.readAsText(arquivo);
}
