const { match } = require("node:assert");
const fs = require("node:fs")
const path = require("node:path")

const arquivo = path.join(__dirname, "teste_completo_cru_02.25s.html")

//Array dos processos extraidos
const dadosProcessos = []
const paragrafoProcesso = []

// Expressões regulares
const regexNumeroProcesso = /<b>(\d{8,})\s*<\/b>\s*<br\s*\/?>/g;;
const regexDescricao = /<b>\d{8,}\s*<\/b>\s*<br\s*\/?>\s*([^<]+)/i;


const regexTitular = /Titular:\s*([^<]+?)\s*\[/i;
//const regexDetalhes = /Detalhes do despacho:\s*([\s\S]*?)(?=<br\s*\/?>|Titular:|Procurador:|$)/i;
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






function extrairDadosDoHTML(caminho) {
    try {
        //lendo o arquivo
        const conteudoBruto = fs.readFileSync(caminho, "utf-8")         
        //Remove caracteres especiais
        //const conteudoLimpo = conteudoBruto.replace(/&#\d+;/g, ' ');
        //Usar a const abaixo e verificar se não houve mudança nos demais campos.
        const conteudoLimpo = conteudoBruto.replace(/&#\d+;/g, ' ').replace(/&amp;/g, "&");;
                
               
        
        //Encontrar todos os processos e descrições
        const processos = [...conteudoLimpo.matchAll(regexNumeroProcesso)].map(match => ({
            processo: match[1], // Número do processo
            index: match.index // salvar posição no html para referência
        }))           
        
        const dados = []

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
            // const nclMatch = trechoProcesso.match(regexNCL);
            // const NCL = nclMatch && nclMatch[1] && nclMatch[2] ? `NCL(${nclMatch[1]}): ${nclMatch[2].replace(/\s*e\s*/, ", ").trim()}` : "Desconhecido";

            const nclMatch = trechoProcesso.match(regexNCL);
            const NCL = nclMatch && nclMatch[1] && nclMatch[2] ? `NCL(${nclMatch[1]}): ${nclMatch[2].replace(/\s*e\s*/, ", ").trim()}` : "Desconhecido";


            // Procurar Data de Depósito dentro do trecho
            const dataDepositoMatch = trechoProcesso.match(regexDataDeposito);
            const dataDeposito = dataDepositoMatch && dataDepositoMatch[1] ? dataDepositoMatch[1].trim() : "Desconhecido";

            // Procurar data de recebimento dentro do trecho
            const dataRecebimentoMatch = trechoProcesso.match(regexDataRecebimento);
            const dataRecebimento = dataRecebimentoMatch && dataRecebimentoMatch[1] ? dataRecebimentoMatch[1].trim() : "Desconhecido";

            //Nº inscrição internacional
            const numeroInscricaoMatch = trechoProcesso.match(regexNumeroInscricaoInter);
            const numeroInscricao = numeroInscricaoMatch && numeroInscricaoMatch[1] ? numeroInscricaoMatch[1].trim() : "Desconhecido";

            //Procurador
            const procuradorMatch = trechoProcesso.match(regexProcurador);
            const procurador = procuradorMatch && procuradorMatch[1] ? procuradorMatch[1].trim() : "Desconhecido";

            //Requerente
            const requerenteMatch = trechoProcesso.match(regexRequerente);
            const requerente = requerenteMatch && requerenteMatch[1] ? requerenteMatch[1].trim() : "Desconhecido";

            
            


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
  

    //console.log("Dados extraídos: ", dadosProcessos);
    const jsonDados = JSON.stringify(dadosProcessos, null, 2); // Formatação com espaçamento de 2 espaços
        
    fs.writeFileSync('processos.json', jsonDados, 'utf-8');
    console.log('Arquivo processos.json salvo com sucesso!');


    // return dadosProcessos

    



    } catch (erro) {
        console.error('Erro ao ler o arquivo:', erro);
    }
}

extrairDadosDoHTML(arquivo)