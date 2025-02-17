const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const { geradortxt } = require("./geradortxt")

const app = express();


// Middleware para lidar com uploads de arquivos
app.use(fileUpload());

// Rota para exibir um formulário de upload
app.get("/upload", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});




// Rota para processar o upload do PDF
app.post("/upload", (req, res) => {

    function deletarPastaComArquivos(pasta) {
        if (fs.existsSync(pasta)) {
            fs.readdirSync(pasta).forEach(arquivo => {
                const caminhoArquivo = path.join(pasta, arquivo);
                if (fs.lstatSync(caminhoArquivo).isDirectory()) {
                    deletarPastaComArquivos(caminhoArquivo); // Recursivamente exclui subpastas
                } else {
                    fs.unlinkSync(caminhoArquivo); // Exclui arquivo
                }
            });
            fs.rmdirSync(pasta); // Exclui a pasta depois que estiver vazia
            console.log(`Pasta deletada: ${pasta}`);
        }
    }
    
    // Caminhos das pastas
    const uploadsFolder = path.join(__dirname, "uploads");
    const outputFolder2 = path.join(__dirname, "outputFolder");
    
    // Excluir pastas após o processamento
    deletarPastaComArquivos(uploadsFolder);
    deletarPastaComArquivos(outputFolder2);


//------------------------------------------------------------------------------
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
            res.status(200).json({ message: "Upload concluído!" });
         
        });
    });
});

//-------------------------------------------------------------------------

        // Expressões regulares
        const regexNumeroProcesso = /<b>(\d{8,})\s*<\/b>\s*<br\s*\/?>/g;;
        const regexDescricao = /<b>\d{8,}\s*<\/b>\s*<br\s*\/?>\s*([^<]+)/i;
        const regexTitular = /Titular:\s*([^<]+?)\s*\[/i;
        const regexDetalhes = /Detalhes do despacho:\s*([\s\S]*?)(?=\s*<br\s*\/?>\s*<b>|<br\s*\/?>\s*Procurador:|$)/i;
        const regexPeticao = /Petição \(tipo\):\s*(.*?)(?=<br\/>)/i;
        const regexApresentacao = /Apresentação:\s*(.*?)(?=\s*<br\/>)/i;
        const regexNatureza = /Natureza:\s*(.*?)(?=\s*<br\/>)/i;
        const regexData = /<br\/>\s*(\d{2}\/\d{2}\/\d{4})\s*<b>\s*<\/b><br\/>/i;
        const regexProcessoAfetado = /Processo afetado:\s*([\d\-A-Z\s]+)/i;
        const regexCFE = /CFE:\s*([\d\.,\s]+)/i;
        const regexNCL = /NCL\((\d+)\):\s*([\d,\s]*\d+\s*(?:e\s*\d+)?)/;
        const regexDataDeposito = /Data de depósito:\s*(\d{2}\/\d{2}\/\d{4})/;
        const regexDataRecebimento = /Data de recebimento pelo INPI:\s*([\d\/]+)/i;
        const regexNumeroInscricaoInter = /Número da Inscrição Internacional:\s*([\d]+)/i;
        const regexProcurador = /Procurador:\s*([^<]+)/i;
        const regexRequerente = /Requerente:\s*([^<]+)/;



// Rota que chama a função e retorna os dados extraídos
app.get("/extrair", (req, res) => {
        
const outputFolder = path.join(__dirname, "outputFolder");

// Função para encontrar o maior arquivo HTML
function encontrarMaiorArquivoHTML(diretorio) {
    const arquivos = fs.readdirSync(diretorio);
       

    let maiorArquivo = null;
    let maiorTamanho = 0;

    const arquivosHTML = arquivos.filter((arquivo) => {
        return arquivo.endsWith(".html");
    });

    if(arquivosHTML.length === 0 ){
        console.error("Nenum arquivo HTML encontrado no diretório: ", diretorio);
        return null
    }


    arquivosHTML.forEach((arquivo) => {
        const caminhoCompleto = path.join(diretorio, arquivo);

        try {
            const stats = fs.statSync(caminhoCompleto);

            // Garante que é um arquivo e não um diretório
            if (stats.isFile()) {
                if (stats.size > maiorTamanho) {
                    maiorTamanho = stats.size;
                    maiorArquivo = caminhoCompleto;
                }
            }
        } catch (error) {
            console.error(`Erro ao acessar ${arquivo}:`, error.message);
        }
    });

    return maiorArquivo;
}

// Obtendo o maior arquivo HTML na pasta
const arquivoMaior = encontrarMaiorArquivoHTML(outputFolder);

if (!arquivoMaior) {
    console.error("Nenhum arquivo HTML encontrado na pasta.");
} else {
    console.log("Maior arquivo encontrado:", arquivoMaior);
}

const dados = extrairDadosDoHTML(arquivoMaior);



function extrairDadosDoHTML(caminho) {
    try {
        const conteudoBruto = fs.readFileSync(caminho, "utf-8");
        const conteudoLimpo = conteudoBruto.replace(/&#\d+;/g, ' ').replace(/&amp;/g, "&");
        
        const processos = [...conteudoLimpo.matchAll(regexNumeroProcesso)].map(match => ({
            processo: match[1],
            index: match.index
        }));
        console.log("Conteúdo do processos: ", processos);
        

        const dadosProcessos = [];

        processos.forEach((proc, index) => {
            //Definir os limite de busca (antes do próximo processo)
            const proximoProcesso = processos[index + 1];
            const limite = proximoProcesso ? proximoProcesso.index : conteudoLimpo.length

            //Recortar trecho do html - parágrafo
            const trechoProcesso = conteudoLimpo.slice(proc.index, limite)
            
           
            //Descrição do processo
            const descricaoMatch = trechoProcesso.match(regexDescricao);
            const descricao = descricaoMatch && descricaoMatch[1] ? descricaoMatch[1].trim() : "Desconhecido";
                        

            // Procurar titular dentro do trecho
            const titularMatch = trechoProcesso.match(regexTitular);
            const titular = titularMatch && titularMatch[1] ? titularMatch[1].trim() : "Null";

            // Procura por Detalhes do depacho
            const detalhesMatch = trechoProcesso.match(regexDetalhes);
            const detalhes = detalhesMatch && detalhesMatch[1] ? detalhesMatch[1].trim() : "Null";
            const detalhesLimpos = detalhes.replace(/<br\s*\/?>|\r\n?|\n/g, ' ');


            // Procurar "Petição (tipo):" dentro do trecho
            const peticaoMatch = trechoProcesso.match(regexPeticao);
            const peticao = peticaoMatch && peticaoMatch[1] ? peticaoMatch[1].trim() : "Null";

            // Procurar "Apresentação:" dentro do trecho
            const apresentacaoMatch = trechoProcesso.match(regexApresentacao);
            const apresentacao = apresentacaoMatch && apresentacaoMatch[1] ? apresentacaoMatch[1].trim() : "Null";

            // Procurar "Natureza:" dentro do trecho
            const naturezaMatch = trechoProcesso.match(regexNatureza);
            const natureza = naturezaMatch && naturezaMatch[1] ? naturezaMatch[1].trim() : "Null";

            // Procurar data dentro do trecho
            const dataMatch = trechoProcesso.match(regexData);
            const data = dataMatch ? dataMatch[0] : "Null";
            const dataLimpa = data.replace(/<[^>]+>/g, "").trim();

            // Procurar "Processo afetado:" dentro do trecho
            const processoAfetadoMatch = trechoProcesso.match(regexProcessoAfetado);
            const processoAfetado = processoAfetadoMatch && processoAfetadoMatch[1] ? processoAfetadoMatch[1].trim() : "Null";

            // CFE
            const cfeMatch = trechoProcesso.match(regexCFE);
            const cfe = cfeMatch && cfeMatch[1] ? cfeMatch[1].trim() : "Null";         

            //NCL
            const nclMatch = trechoProcesso.match(regexNCL);
            const NCL = nclMatch && nclMatch[1] && nclMatch[2] ? `NCL(${nclMatch[1]}): ${nclMatch[2].replace(/\s*e\s*/, ", ").trim()}` : "Null";


            // Procurar Data de Depósito dentro do trecho
            const dataDepositoMatch = trechoProcesso.match(regexDataDeposito);
            const dataDeposito = dataDepositoMatch && dataDepositoMatch[1] ? dataDepositoMatch[1].trim() : "Null";

            // Procurar data de recebimento dentro do trecho
            const dataRecebimentoMatch = trechoProcesso.match(regexDataRecebimento);
            const dataRecebimento = dataRecebimentoMatch && dataRecebimentoMatch[1] ? dataRecebimentoMatch[1].trim() : "Null";

            //Nº inscrição internacional
            const numeroInscricaoMatch = trechoProcesso.match(regexNumeroInscricaoInter);
            const numeroInscricao = numeroInscricaoMatch && numeroInscricaoMatch[1] ? numeroInscricaoMatch[1].trim() : "Null";

            //Procurador
            const procuradorMatch = trechoProcesso.match(regexProcurador);
            const procurador = procuradorMatch && procuradorMatch[1] ? procuradorMatch[1].trim() : "Null";

            //Requerente
            const requerenteMatch = trechoProcesso.match(regexRequerente);
            const requerente = requerenteMatch && requerenteMatch[1] ? requerenteMatch[1].trim() : "Null";


            //-------------------------------------------------------------------

            //Armazena os dados extraídos em um array de objetos
            dadosProcessos.push({                
                processo: proc.processo,
                descricao: descricao,
                data: dataLimpa,
                titular: titular,
                dataDeposito: dataDeposito,
                recebimentoINPI: dataRecebimento,
                inscricaoInternacional: numeroInscricao,
                despacho: detalhesLimpos,
                peticao: peticao,
                apresentacao: apresentacao,
                natureza: natureza,
                requerente: requerente,
                procurador: procurador,
                processoAfetado: processoAfetado,
                cfe: cfe,
                NCL:NCL
                
            })

        })

        const jsonDados = JSON.stringify(dadosProcessos, null, 2); // Formatação com espaçamento de 2 espaços
        
        fs.writeFileSync('processos.json', jsonDados, 'utf-8');
        console.log('Arquivo processos.json salvo com sucesso!');


        //console.log("conteúdo dos dadosProcessos: ", dadosProcessos);
        return dadosProcessos;
        

    } catch (erro) {
        console.error("Erro ao processar HTML:", erro);
        return { erro: "Erro ao processar o arquivo" };
    }
}

res.json(dados);




});


// Inicia o servidor
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}/upload`);
});