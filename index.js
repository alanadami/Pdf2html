//import { exec } from "child_process";
const exec = require("child_process")

// Caminho para o Poppler
const popplerPath = `"C:\\poppler\\poppler-24.08.0\\Library\\bin\\pdftohtml.exe"`

// Caminho para o arquivo PDF
const inputPDF = "teste.pdf";
const outputHTML = "./outputFolder/saida.html";

// Comando do Poppler
const command = `${popplerPath} "${inputPDF}" "${outputHTML}"`;

// Executa o comando no terminal
exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`Erro: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`Erro de saída: ${stderr}`);
        return;
    }
    console.log(`Conversão concluída! Arquivo salvo como ${outputHTML}`);
});
