const fs = require("fs") 
const path = require("path")
 
 // Expressões regulares
 const regexNumeroProcesso = /<b>(\d{8,})\s*<\/b>\s*<br\s*\/?>/g;
 const regexDescricao = /<b>\d{8,}\s*<\/b>\s*<br\s*\/?>\s*([^<]+)/i;

 //-------------- Novas REGEXs ----------------------------------

//const regexTitular = /<b>\s*Titular(?:\(es\))?:\s*<\/b>\s*([^<\[]+?)\s*\[|Titular:\s*([^<\[]+?)\s*\[/i;
//const regexTitular = /Titular(?:\(es\))?:\s*([^<]+)\s*\[([A-Z]{2})\]/i;
const regexTitular = /Titular(?:\(es\))?:\s*([^<]+)\s*\[([A-Z]{2}(?:\/[A-Z]{2})?)\]/i;


const regexSobrestadores = /Sobrestador(?:es|\(es\)):\s*([^<]+)<br\/>/i;
const regexClassesReivindicadas = /Classes reivindicadas:\s*([^<]+?)\s*<br\/>/i;
const regexClassesDeferidas = /Classes deferidas:\s*([^<]+?)\s*<br\/>/i;
const regexClassesIndeferidas = /Classes indeferidas:\s*([^<]+)\s*<br\/>/i;
const regexClasses = /Classes:\s*(NCL\(\d+\)\s*[\d\s\w]+)/i;
const regexCedente = /Cedente:\s*([^<]+)\s*\[([A-Z]{2}\/[A-Z]{2})\]/i;
const regexCessionario = /Cessionário:\s*([^<]+)/i;





 const caminhoArquivo = path.join(__dirname, "Marcas2822s.html")
 const dados = extrairDadosDoHTML(caminhoArquivo);

 function extrairDadosDoHTML(caminho) {
         try {
         const conteudoBruto = fs.readFileSync(caminho, "utf-8");
         const conteudoLimpo = conteudoBruto.replace(/&#\d+;/g, " ").replace(/&amp;/g, "&");
         
         //---------------------- só para extrair o conteúdo do html para gerar as regex ------------------
         // Criar um objeto com os dados
         const dadosLimpos = { conteudo: conteudoLimpo };
 
         // Converter para JSON
         const json = JSON.stringify(dadosLimpos, null, 2); // O `null, 2` formata o JSON com identação
 
                
 
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
             
             //----------------- Novas REGEXs ------------------

             //Titulares
            //  const titularMatch = trechoProcesso.match(regexTitular);
            //  const titular = titularMatch && (titularMatch[1] || titularMatch[2]) ? (titularMatch[1] || titularMatch[2]).trim() : "Null";
            const titularMatch = trechoProcesso.match(regexTitular);
            const titular = titularMatch && titularMatch[1] ? `${titularMatch[1].trim()} [${titularMatch[2]}]` : "Null";
            
            
            // Procurar Classes Reivindicadas dentro do trecho
            const classesReivindicadasMatch = trechoProcesso.match(regexClassesReivindicadas);
            const classesReivindicadas = classesReivindicadasMatch && classesReivindicadasMatch[1] ? classesReivindicadasMatch[1].trim() : "Null";
            
            // Procurar Classes dentro do trecho
            const classesMatch = trechoProcesso.match(regexClasses);
            const classes = classesMatch && classesMatch[1] ? classesMatch[1].trim() : "Null";
            
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
             titular: titular,
             sobrestadores: sobrestadores,
             classesReivindicadas: classesReivindicadas,
             classesDeferidas: classesDeferidas,
             classesIndeferidas: classesIndeferidas,
             classes: classes,
             cedente: cedente,
             cessionario: cessionario,
             
             });
         });
 
         console.log(dadosProcessos);


         // Converte o resultado para o formato JSON
        const jsonString = JSON.stringify(dadosProcessos, null, 2);

        // Escreve o JSON em um arquivo
        fs.writeFileSync("resultadoRegex.json", jsonString, "utf-8");

        console.log("Arquivo JSON gerado com sucesso!");




        } catch (erro) {
        console.error("Erro ao processar HTML:", erro);
        return { erro: "Erro ao processar o arquivo" };
        }
    }
    
  

   