/* ============================================================
   ARQUIVO: js/db.js - Engine de Dados IndexedDB
   ============================================================ */

const dbName = "JapanSecurityDB";
const dbVersion = 5; // Subi para 5 para aplicar a criação da tabela de manutenção

function abrirDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            
            // Tabela de Veículos
            if (!db.objectStoreNames.contains("vehicles")) {
                db.createObjectStore("vehicles", { keyPath: "id" });
            }
            // Tabela de Vistorias
            if (!db.objectStoreNames.contains("vistorias")) {
                db.createObjectStore("vistorias", { keyPath: "id" });
            }
            // Tabela de Movimentação (Entrada/Saída)
            if (!db.objectStoreNames.contains("movimentacao")) {
                db.createObjectStore("movimentacao", { keyPath: "id" });
            }
            // Tabela de Manutenções (Ajustado para o singular)
            if (!db.objectStoreNames.contains("manutencao")) {
                db.createObjectStore("manutencao", { keyPath: "id" });
            }
        };

        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

// Salvar ou Atualizar (Put)
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

// Listar todos os registros
async function dbListar(storeName) {
    const db = await abrirDB();
    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        } catch (e) {
            console.error("Erro ao listar store: " + storeName, e);
            resolve([]); // Retorna vazio se a store ainda não existir
        }
    });
}

// Excluir registro por ID
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
