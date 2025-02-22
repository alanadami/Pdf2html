#!/usr/bin/env node

    const express = require("express");
    const multer = require("multer");
    //const fileUpload = require("express-fileupload");
    const path = require("path");
    const { exec } = require("child_process");
    const fs = require("fs");
    const os = require("os");

    const app = express();

    app.use(express.json({ limit: "600mb" }));
    app.use(express.urlencoded({ limit: "600mb", extended: true }));

    //Faz com que o servidor não limite o tempo para upload
    app.use((req, res, next) => {
    req.setTimeout(0); // Remove o limite de tempo (útil para uploads grandes)
    next();
    });

    // Rota para exibir um formulário de upload
    app.get("/upload", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
    });

    // Define um diretório seguro para os arquivos gerados
    const baseDir = path.join(os.homedir(), "extrator-pdf");
    const uploadsFolder = path.join(baseDir, "uploads");
    const outputFolder = path.join(baseDir, "outputFolder");

    // Função para apagar arquivos dentro da pasta, mas manter a pasta
    function limparPasta(pasta) {
    if (fs.existsSync(pasta)) {
        fs.readdirSync(pasta).forEach((file) => {
        const filePath = path.join(pasta, file);
        fs.rmSync(filePath, { recursive: true, force: true }); // Remove arquivos e subpastas
        });
    }
    }

    // Função para criar a pasta, limpando-a antes se necessário
    function criarOuLimparPasta(pasta) {
    limparPasta(pasta);
    if (!fs.existsSync(pasta)) {
        fs.mkdirSync(pasta, { recursive: true });
    }
    }

    // Criar/Limpar os diretórios antes de qualquer operação
    [uploadsFolder, outputFolder].forEach(criarOuLimparPasta);

    console.log("Pastas prontas! Conteúdo antigo removido.");

    // Configura o multer para processar uploads
    const upload = multer({
    dest: uploadsFolder,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
    });

    // Rota para processar o upload do PDF
    app.post("/upload", upload.single("pdf"), (req, res) => {
    //--------------------------------------------------

    // Função para apagar arquivos dentro da pasta, mas manter a pasta

    //-------------------------------------------------

    if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo foi enviado." });
    }

    const pdfFile = req.file;
    const inputPDF = path.join(uploadsFolder, pdfFile.filename);
    const outputHTML = path.join(
        outputFolder,
        `${path.parse(pdfFile.originalname).name}.html`
    );

    // Caminho para o Poppler definido pelo executável do poppler

    const popplerPath =
        process.env.POPPLER_PATH ||
        "C:\\poppler\\poppler02\\Library\\bin\\pdftohtml.exe";

    // Comando para converter PDF para HTML
    const command = `"${popplerPath}" "${inputPDF}" "${outputHTML}"`;

    // Executa o comando
    exec(command, (error, stdout, stderr) => {
        if (error) {
        console.error("Erro ao converter o arquivo:", error.message);
        return res
            .status(500)
            .json({
            error: "Erro ao converter o arquivo.",
            details: error.message,
            });
        }
        if (stderr) {
        console.warn("Aviso na conversão:", stderr);
        }

        console.log(`Conversão concluída! Arquivo salvo como ${outputHTML}`);
        res.status(200).json({ message: "Upload concluído!", outputHTML });
    });
    });

    // Middleware de tratamento de erros
    app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res
        .status(400)
        .json({ error: "Erro no upload do arquivo.", details: err.message });
    } else if (err) {
        return res
        .status(500)
        .json({ error: "Erro interno no servidor.", details: err.message });
    }
    next();
    });

            //-------------------------------------------------------------------------

            // Expressões regulares
            const regexNumeroProcesso = /<b>(\d{8,})\s*<\/b>\s*<br\s*\/?>/g;
            const regexDescricao = /<b>\d{8,}\s*<\/b>\s*<br\s*\/?>\s*([^<]+)/i;
            const regexTitular = /Titular(?:\(es\))?:\s*([^<]+)\s*\[([A-Z]{2}(?:\/[A-Z]{2})?)\]/i;
            const regexDetalhes = /Detalhes do despacho:\s*([\s\S]*?)(?=\s*<br\s*\/?>\s*<b>|<br\s*\/?>\s*Procurador:|$)/i;
            const regexPeticao = /Petição \(tipo\):\s*(.*?)(?=<br\/>)/i;
            const regexApresentacao = /Apresentação:\s*(.*?)(?=\s*<br\/>)/i;
            const regexNatureza = /Natureza:\s*(.*?)(?=\s*<br\/>)/i;
            const regexData = /<br\/>\s*(\d{2}\/\d{2}\/\d{4})\s*<b>\s*<\/b><br\/>/i;
            const regexProcessoAfetado = /Processo afetado:\s*([\d\-A-Z\s]+)/i;
            const regexCFE = /CFE:\s*([\d\.,\s]+)/i;
            const regexNCL = /NCL\((\d+)\):\s*([\d,\s]*\d+\s*(?:e\s*\d+)?)/;
            const regexClasses = /Classes:\s*([\w\s(),]+)/;
            const regexDataDeposito = /Data de depósito:\s*(\d{2}\/\d{2}\/\d{4})/;
            const regexDataRecebimento = /Data de recebimento pelo INPI:\s*([\d\/]+)/i;
            const regexNumeroInscricaoInter = /Número da Inscrição Internacional:\s*([\d]+)/i;
            const regexProcurador = /Procurador:\s*([^<]+)/i;
            const regexRequerente = /Requerente:\s*([^<]+)/;
            const regexClassesReivindicadas = /Classes reivindicadas:\s*([^<]+?)\s*<br\/?>/i;
            //-------- Novas -----
            const regexSobrestadores = /Sobrestador(?:es|\(es\)):\s*([^<]+)<br\/>/i;
            //const regexClassesReivindicadas = /Classes reivindicadas:\s*([^<]+?)\s*<br\/>/i;
            const regexClassesDeferidas = /Classes deferidas:\s*([^<]+?)\s*<br\/>/i;
            const regexClassesIndeferidas = /Classes indeferidas:\s*([^<]+)\s*<br\/>/i;
            //const regexClasses = /Classes:\s*(NCL\(\d+\)\s*[\d\s\w]+)/i;
            const regexCedente = /Cedente:\s*([^<]+)\s*\[([A-Z]{2}\/[A-Z]{2})\]/i;
            const regexCessionario = /Cessionário:\s*([^<]+)/i;

    // Rota que chama a função e retorna os dados extraídos
    app.get("/extrair", (req, res) => {
    const outputFolder = path.join(baseDir, "outputFolder");

    // Função para encontrar o maior arquivo HTML
    function encontrarMaiorArquivoHTML(diretorio) {
        const arquivos = fs.readdirSync(diretorio);

        let maiorArquivo = null;
        let maiorTamanho = 0;

        const arquivosHTML = arquivos.filter((arquivo) => {
        return arquivo.endsWith(".html");
        });

        if (arquivosHTML.length === 0) {
        console.error("Nenum arquivo HTML encontrado no diretório: ", diretorio);
        return null;
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
        const conteudoLimpo = conteudoBruto.replace(/&#\d+;/g, " ").replace(/&amp;/g, "&");
        
        //---------------------- só para extrair o conteúdo do html para gerar as regex ------------------
        // Criar um objeto com os dados
        const dadosLimpos = { conteudo: conteudoLimpo };

        // Converter para JSON
        const json = JSON.stringify(dadosLimpos, null, 2); // O `null, 2` formata o JSON com identação

        // Salvar em um arquivo
        fs.writeFileSync("dadosLimpos.json", json, "utf-8");
        // -----------------------------------------------------
        

        const processos = [...conteudoLimpo.matchAll(regexNumeroProcesso)].map(
            (match) => ({
            processo: match[1],
            index: match.index,
            })
        );
        //console.log("Conteúdo do processos: ", processos);

        const dadosProcessos = [];

        processos.forEach((proc, index) => {
            //Definir os limite de busca (antes do próximo processo)
            const proximoProcesso = processos[index + 1];
            const limite = proximoProcesso ? proximoProcesso.index : conteudoLimpo.length;
            //Recortar trecho do html - parágrafo
            const trechoProcesso = conteudoLimpo.slice(proc.index, limite);
            //Descrição do processo
            const descricaoMatch = trechoProcesso.match(regexDescricao);
            const descricao = descricaoMatch && descricaoMatch[1] ? descricaoMatch[1].trim() : "Null";
            // Procurar titular dentro do trecho
            const titularMatch = trechoProcesso.match(regexTitular);
            const titular = titularMatch && titularMatch[1] ? `${titularMatch[1].trim()} [${titularMatch[2]}]` : "Null";
            // Procura por Detalhes do depacho
            const detalhesMatch = trechoProcesso.match(regexDetalhes);
            const detalhes = detalhesMatch && detalhesMatch[1] ? detalhesMatch[1].trim() : "Null";
            const detalhesLimpos = detalhes.replace(/<br\s*\/?>|\r\n?|\n/g, " ");
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
            //NCL Classes
            const classesMatch = trechoProcesso.match(regexClasses);
            const classes = classesMatch && classesMatch[1] ? classesMatch[1].trim() : "Null";
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
            // Procurar "Classes reivindicadas" dentro do trecho
            const classesNCLMatch = trechoProcesso.match(regexClassesReivindicadas);
            const classesReivindicadas = classesNCLMatch && classesNCLMatch[1] ? classesNCLMatch[1].trim() : "Null";

            //------ Novas -----

             //Sobrestadores
             const sobrestadoresMatch = trechoProcesso.match(regexSobrestadores);
             const sobrestadores = sobrestadoresMatch && sobrestadoresMatch[1] ? sobrestadoresMatch[1].trim() : "Null";
 
             // Procurar Classes Deferidas dentro do trecho
             const classesDeferidasMatch = trechoProcesso.match(regexClassesDeferidas);
             const classesDeferidas = classesDeferidasMatch && classesDeferidasMatch[1] ? classesDeferidasMatch[1].trim() : "Null";
             // Procurar Classes Indeferidas dentro do trecho
             const classesIndeferidasMatch = trechoProcesso.match(regexClassesIndeferidas);
             const classesIndeferidas = classesIndeferidasMatch && classesIndeferidasMatch[1] ? classesIndeferidasMatch[1].trim() : "Null";
             //Cedente
             const cedenteMatch = trechoProcesso.match(regexCedente);
             const cedente = cedenteMatch && cedenteMatch[1] ? `${cedenteMatch[1].trim()} [${cedenteMatch[2]}]` : "Null";
             //Cessionário
             const cessionarioMatch = trechoProcesso.match(regexCessionario);
             const cessionario = cessionarioMatch && cessionarioMatch[1] ? cessionarioMatch[1].trim() : "Null";

            //-------------------------------------------------------------------

            //Armazena os dados extraídos em um array de objetos
            dadosProcessos.push({
            processo: proc.processo,
            descricaoDespacho: descricao,
            data: dataLimpa,
            titular: titular,            
            dataDeposito: dataDeposito,
            recebimentoINPI: dataRecebimento,
            inscricaoInternacional: numeroInscricao,
            detalheDespacho: detalhesLimpos,
            peticao: peticao,
            apresentacao: apresentacao,
            natureza: natureza,
            requerente: requerente,
            procurador: procurador,
            processoAfetado: processoAfetado,
            cfe: cfe,
            NCL: NCL,
            classes: classes,
            classesReivindicadas: classesReivindicadas,
            classesDeferidas: classesDeferidas,
            classesIndeferidas: classesIndeferidas,
            sobrestadores: sobrestadores,
            cedente: cedente,
            cessionario: cessionario,
            });
        });

        console.log("Arquivo criado com sucesso!");

        // //---------------------- Escrever o txt -------------------------

        // // Caminho do arquivo de saída
        // const filePath = path.join(__dirname, "processosTxt.txt");

        // // Função para gerar o arquivo TXT
        // function gerartxt(dados) {
        //     if (!dados || dados.length === 0) {
        //     console.log("Nenhum dado para processar.");
        //     return;
        //     }

        //     const lines = [];

        //     dados.forEach((item, index) => {
        //     // Filtrar apenas os campos desejados
        //     const dadosParaTxt = [
        //         index + 1, // Número sequencial
        //         item.processo,
        //         item.descricao,
        //         item.titular,
        //         item.dataDeposito,
        //         item.despacho,
        //     ];

        //     // Criar uma linha separando os campos por tabulação
        //     lines.push(dadosParaTxt.join("\t"));
        //     });

        //     // Escreve no arquivo
        //     fs.writeFileSync(filePath, lines.join("\n"), "utf-8");

        //     console.log("Arquivo 'processosTxt.txt' gerado com sucesso!");
        // }

        // // Chama a função após um pequeno atraso (caso os dados venham de outra fonte assíncrona)
        // setTimeout(() => gerartxt(dadosProcessos), 4000);
        // //gerartxt(dadosProcessos)
        
        

        // //--------------------------------------------------------------------------------

        function removerCamposNulos(obj) {
            if (typeof obj !== "object" || obj === null) return obj; // Se não for um objeto, retorna o próprio valor.
        
            return Object.fromEntries(
                Object.entries(obj)
                    .filter(([_, value]) => value !== null && value?.toString().trim().toLowerCase() !== "null")
                    .map(([key, value]) => [key, removerCamposNulos(value)]) // Aplica a função recursivamente.
            );
        }
        
        const jsonFiltrado = dadosProcessos.map(removerCamposNulos); // Aplica a função para cada objeto do array.
        //console.log(jsonFiltrado);
        

        //----------------------------------------------------------------------------------

        //return dadosProcessos;
        return jsonFiltrado;
        } catch (erro) {
        console.error("Erro ao processar HTML:", erro);
        return { erro: "Erro ao processar o arquivo" };
        }
    }
    
    res.json(dados);
    criarOuLimparPasta(uploadsFolder);
    criarOuLimparPasta(outputFolder);

    console.log("Pastas prontas para nova extração.");

    });



    // Inicia o servidor
    const PORT = 5000;
    app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}/upload`);
    });
