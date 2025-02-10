const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();


// Middleware para lidar com uploads de arquivos
app.use(fileUpload());

// Rota para exibir um formulário de upload
app.get("/upload", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Rota para processar o upload do PDF
app.post("/upload", (req, res) => {
    if (!req.files || !req.files.pdf) {
        return res.status(400).send("Nenhum arquivo foi enviado.");
    }

    const pdfFile = req.files.pdf;
    const inputPDF = path.join(__dirname, "uploads", pdfFile.name);
    const outputHTML = path.join(__dirname, "outputFolder", `${path.parse(pdfFile.name).name}.html`);

    // Criar diretórios caso não existam
    if (!fs.existsSync(path.join(__dirname, "uploads"))) fs.mkdirSync(path.join(__dirname, "uploads"));
    if (!fs.existsSync(path.join(__dirname, "outputFolder"))) fs.mkdirSync(path.join(__dirname, "outputFolder"));

    // Salvar o arquivo no servidor
    pdfFile.mv(inputPDF, (err) => {
        if (err) {
            return res.status(500).send(err);
        }

        // Caminho para o Poppler
        const popplerPath = "C:\\poppler\\poppler-24.08.0\\Library\\bin\\pdftohtml.exe";

        // Comando para converter PDF para HTML
        const command = `${popplerPath} "${inputPDF}" "${outputHTML}"`;

        // Executa o comando
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Erro: ${error.message}`);
                return res.status(500).send("Erro ao converter o arquivo.");
            }
            if (stderr) {
                console.error(`Erro de saída: ${stderr}`);
            }

            console.log(`Conversão concluída! Arquivo salvo como ${outputHTML}`);

            // Enviar o HTML convertido para o cliente
            res.download(outputHTML, (err) => {
                if (err) {
                    console.error(err);
                    res.status(500).send("Erro ao enviar o arquivo convertido.");
                }
            });
        });
    });
});


// Inicia o servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
