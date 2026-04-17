// Função para filtrar a tabela em tempo real
function filtrarTabela() {
    const input = document.getElementById('filtroPlaca');
    const filter = input.value.toUpperCase();
    const tr = document.querySelectorAll("#corpoTabela tr");

    tr.forEach(row => {
        const tdViatura = row.getElementsByTagName("td")[1];
        if (tdViatura) {
            const text = tdViatura.textContent || tdViatura.innerText;
            row.style.display = text.toUpperCase().includes(filter) ? "" : "none";
        }
    });
}

// Função para Gerar PDF
async function gerarPDFMovimentacao() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Título do Relatório
    doc.setFontSize(18);
    doc.text("JAPAN SECURITY - Relatório de Movimentação", 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 28);

    // Pega os dados da tabela
    const rows = [];
    const registros = await dbListar("movimentacao");
    // Ordena por data
    registros.sort((a,b) => b.timestamp - a.timestamp);

    registros.forEach(reg => {
        rows.push([reg.data, reg.viatura, reg.km, reg.tipo]);
    });

    doc.autoTable({
        head: [['Data/Hora', 'Viatura', 'KM', 'Tipo']],
        body: rows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [230, 57, 70] } // Vermelho Japan Security
    });

    doc.save(`movimentacao_japan_${Date.now()}.pdf`);
}
