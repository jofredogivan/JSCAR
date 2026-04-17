async function salvar() {
    // ... capturar os inputs normal ...

    const novoRegistro = {
        id: Date.now(),
        placa: vInput.value.toUpperCase(),
        // ... outros campos ...
    };

    // AGORA USAMOS O INDEXEDDB:
    const sucesso = await dbSalvar("movimentacao", novoRegistro);
    
    if(sucesso) {
        alert("Registrado no IndexedDB!");
        renderizarTabela();
    }
}

async function renderizarTabela() {
    // AGORA BUSCAMOS DO INDEXEDDB:
    const dados = await dbListar("movimentacao");
    const tbody = document.getElementById('tabela');
    // ... restante do map() para desenhar a tabela ...
}