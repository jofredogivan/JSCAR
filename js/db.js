const dbName = "JapanSecurityDB";
const dbVersion = 3; // Versão atualizada para incluir novos campos

function abrirDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            // Criação das tabelas se não existirem
            if (!db.objectStoreNames.contains("vehicles")) {
                db.createObjectStore("vehicles", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("vistorias")) {
                db.createObjectStore("vistorias", { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains("movimentacao")) {
                db.createObjectStore("movimentacao", { keyPath: "id" });
            }
        };

        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

// FUNÇÕES GLOBAIS QUE O CONSOLE DISSE QUE ESTÃO FALTANDO:

async function dbSalvar(storeName, objeto) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(objeto);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

async function dbListar(storeName) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function dbExcluir(storeName, id) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}
