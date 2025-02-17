const fs = require("fs");
const path = require("path");
const { dadosProcessos } = require("./index")


// Caminho do arquivo de saída
const filePath = path.join(__dirname, "aquivoTXT.txt");

// Gera o conteúdo do arquivo
const lines = [];

function gerartxt(dados) {

    dados.forEach((item, index) => {
        let count = 1; // Contador para numerar as linhas
        for (const [key, value] of Object.entries(item)) {
            lines.push(`${count}\t${key}\t${value}`);
            count++;
        }
        lines.push(""); // Adiciona uma linha em branco para separar os processos
    });
    
    // Escreve no arquivo
    fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
    
    console.log("Arquivo 'processos.txt' gerado com sucesso!");
}


module.exports = gerartxt()

