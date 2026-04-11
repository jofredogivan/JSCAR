function exportarDados() {
    // Reúne todos os dados em um único objeto
    const dadosSistema = {
        vehicles: JSON.parse(localStorage.getItem("vehicles")) || [],
        vistorias: JSON.parse(localStorage.getItem("vistorias")) || [],
        maintenance: JSON.parse(localStorage.getItem("maintenance")) || [],
        movimentos: JSON.parse(localStorage.getItem("movimentos")) || [],
        exportadoEm: new Date().toLocaleString()
    };

    // Converte para string e cria o arquivo para download
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dadosSistema));
    const downloadAnchorNode = document.createElement('a');
    
    const dataFormatada = new Date().toISOString().slice(0,10);
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `backup_japan_security_${dataFormatada}.json`);
    
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importarDados() {
    const input = document.getElementById('arquivoBackup');
    
    if (!input.files[0]) {
        alert("Por favor, selecione um arquivo de backup primeiro.");
        return;
    }

    const confirmacao = confirm("Isso irá apagar todos os dados atuais e carregar os dados do arquivo. Deseja continuar?");
    
    if (confirmacao) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const dados = JSON.parse(e.target.result);
                
                // Distribui os dados de volta para as chaves do localStorage
                if (dados.vehicles) localStorage.setItem("vehicles", JSON.stringify(dados.vehicles));
                if (dados.vistorias) localStorage.setItem("vistorias", JSON.stringify(dados.vistorias));
                if (dados.maintenance) localStorage.setItem("maintenance", JSON.stringify(dados.maintenance));
                if (dados.movimentos) localStorage.setItem("movimentos", JSON.stringify(dados.movimentos));

                alert("Backup restaurado com sucesso! O sistema irá recarregar.");
                window.location.href = "dashboard.html";
                
            } catch (err) {
                alert("Erro ao ler o arquivo. Certifique-se de que é um backup válido do Japan Security Car.");
                console.error(err);
            }
        };
        
        reader.readAsText(input.files[0]);
    }
}