const fs = require("fs")
const path = require("path")

const caminhoArquivo = path.join(__dirname, "Marcas2823s.html")

const conteudoArquivo = fs.readFileSync(caminhoArquivo, "utf-8")

const regex = /\b[A-ZÀ-Ü][a-zà-ü][\w\s()/-]*:/g;

const campos = Array.from(conteudoArquivo.matchAll(regex));
const camposEncontrados = [...new Set(Array.from(campos, campo => campo[0]))];

// Exibe cada campo em uma linha separada
camposEncontrados.forEach(campo => console.log(campo));


