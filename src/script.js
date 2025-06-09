// ======= Estado do jogo =======
let equipes = JSON.parse(localStorage.getItem("equipes")) || []
let temas = JSON.parse(localStorage.getItem("temas")) || {}
let perguntasUsadas = []
let vezAtual = 0
let perguntaAtualTema = null
let perguntaAtualIndex = null


// ======= Elementos da UI =======
const nomeEquipeInput = document.getElementById("nomeEquipe")
const listaEquipes = document.getElementById("listaEquipes")
const nomeTemaInput = document.getElementById("nomeTema")
const textoPerguntaInput = document.getElementById("textoPergunta")
const listaTemas = document.getElementById("listaTemas")
const selectTemas = document.getElementById("temaSelecionado")
const togglePerguntas = document.getElementById("togglePerguntas")
const jogoEl = document.getElementById("jogo")
const countdownEl = document.getElementById("countdown")
const btnIniciar = document.querySelector("button[onclick='iniciarJogo()']")
const cadastroEquipesEl = document.getElementById("cadastro-equipes")
const cadastroPerguntasEl = document.getElementById("cadastro-perguntas")
const iniciarJogoSection = document.getElementById("iniciar-jogo-section")
const switchHeader = document.getElementById("switchHeader")
const placar = document.getElementById("placar")
const btnResetar = document.getElementById("btnResetar")

// ======= Atualizar visibilidade perguntas =======
function atualizarVisibilidadePerguntas() {
    listaTemas.style.display = togglePerguntas.checked ? "none" : "block"
}
togglePerguntas.addEventListener("change", atualizarVisibilidadePerguntas)

// ======= Persistência =======
function salvarDados() {
    localStorage.setItem("equipes", JSON.stringify(equipes))
    localStorage.setItem("temas", JSON.stringify(temas))
}
function carregarDados() {
    equipes = JSON.parse(localStorage.getItem("equipes")) || []
    temas = JSON.parse(localStorage.getItem("temas")) || {}
}

// ======= Render =======
function renderEquipes() {
    listaEquipes.innerHTML = equipes.map((equipe, i) => {
        const cor = corEquipe(equipe.nome)
        return `
      <div class="card card-equipe" style="background-color: ${cor};">
        <span>${equipe.nome}</span>
        <button onclick="removerEquipe(${i})">❌</button>
      </div>
    `
    }).join("")
}

function renderTemas() {
    listaTemas.innerHTML = Object.entries(temas).map(([tema, obj]) => {
        const cor = obj.cor || corTema(tema)
        const perguntasHTML = (obj.perguntas || []).map((p, idx) => `
      <div class="card card-pergunta" style="background-color: ${cor}; filter: brightness(85%);">
        <span>– ${p}</span>
        <button onclick="removerPergunta('${tema}', ${idx})">❌</button>
      </div>
    `).join("")
        return `
      <div class="card card-tema" style="background-color: ${cor};">
        <strong>${tema}</strong>
        <button onclick="removerTema('${tema}')">❌</button>
        <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;">
          ${perguntasHTML}
        </div>
      </div>
    `
    }).join("")
}

function renderSelectTemas() {
    const temasKeys = Object.keys(temas)
    if (temasKeys.length === 0) {
        selectTemas.innerHTML = `<option disabled selected>Nenhum tema cadastrado</option>`
    } else {
        selectTemas.innerHTML = temasKeys.map(t => `<option value="${t}">${t}</option>`).join("")
    }
}

function renderPlacar() {
    document.getElementById("placar").innerHTML = equipes.map(
        e => `<div>${e.nome}: ${e.pontos} ponto(s)</div>`
    ).join("")
}

// ======= CRUD =======
function adicionarEquipe() {
    const nome = nomeEquipeInput.value.trim()
    if (!nome) return
    const cor = corEquipe(nome)
    equipes.push({ nome, pontos: 0, cor })
    nomeEquipeInput.value = ""
    salvarDados()
    renderEquipes()
}

function removerEquipe(index) {
    equipes.splice(index, 1)
    salvarDados()
    renderEquipes()
}

function adicionarTema() {
    const tema = nomeTemaInput.value.trim()
    if (!tema) return
    if (!temas[tema]) temas[tema] = { cor: corTema(tema), perguntas: [] }
    nomeTemaInput.value = ""
    salvarDados()
    renderTemas()
    renderSelectTemas()
}

function removerTema(tema) {
    if (!confirm(`Remover tema "${tema}"?`)) return
    delete temas[tema]
    salvarDados()
    renderTemas()
    renderSelectTemas()
}

function adicionarPergunta() {
    const tema = selectTemas.value
    const pergunta = textoPerguntaInput.value.trim()
    if (!tema || !pergunta) return
    if (!temas[tema]) temas[tema] = { cor: corTema(tema), perguntas: [] }
    temas[tema].perguntas.push(pergunta)
    textoPerguntaInput.value = ""
    salvarDados()
    renderTemas()
}

function removerPergunta(tema, idx) {
    temas[tema].perguntas.splice(idx, 1)
    salvarDados()
    renderTemas()
}

// ======= Lógica do jogo =======
function sortearPergunta() {
    const temasDisponiveis = Object.keys(temas).filter(t => temas[t].perguntas.length > 0)
    if (temasDisponiveis.length === 0) return null

    const tema = temasDisponiveis[Math.floor(Math.random() * temasDisponiveis.length)]
    const perguntas = temas[tema].perguntas
    const idx = Math.floor(Math.random() * perguntas.length)
    const pergunta = perguntas[idx]  // NÃO remove ainda

    return { tema, pergunta, idx }
}



function proximaRodada() {
    renderPlacar()  // <- garantir que a última pontuação apareça

    const sorteada = sortearPergunta()
    if (!sorteada) {
        alert("Fim do jogo! Todas as perguntas foram usadas.")
        mostrarTelaPlacarFinal()
        return
    }

    perguntasUsadas.push(sorteada)

    const equipe = equipes[vezAtual]
    document.getElementById("vezEquipe").textContent = `Vez da equipe: ${equipe.nome}`
    document.getElementById("temaSorteado").textContent = `Tema sorteado: ${sorteada.tema}`
    document.getElementById("perguntaSorteada").textContent = sorteada.pergunta
    mostrarTelaDoJogo()
}


function responder(acertou) {
    const ultimaPergunta = perguntasUsadas[perguntasUsadas.length - 1]
    if (!ultimaPergunta) return

    if (acertou) {
        equipes[vezAtual].pontos++
        // Remover a pergunta do tema original
        const perguntasTema = temas[ultimaPergunta.tema].perguntas
        perguntasTema.splice(ultimaPergunta.idx, 1)
    }

    vezAtual = (vezAtual + 1) % equipes.length
    salvarDados()
    contagemRegressiva(3, proximaRodada)
}



function contagemRegressiva(segundos = 5, aoTerminar) {
    esconderConteudosParaContagem()
    countdownEl.style.display = "flex"
    countdownEl.textContent = segundos

    let contador = segundos - 1
    const intervalo = setInterval(() => {
        if (contador === 0) {
            clearInterval(intervalo)
            countdownEl.style.display = "none"
            aoTerminar()
            return
        }
        countdownEl.textContent = contador
        contador--
    }, 1000)
}

function esconderConteudosParaContagem() {
    cadastroEquipesEl.style.display = "none"
    cadastroPerguntasEl.style.display = "none"
    btnIniciar.style.display = "none"
    jogoEl.style.display = "none"
    iniciarJogoSection.style.display = "none"  // ESCONDER ESSA AQUI

}

// Mostra o jogo após a contagem
function mostrarTelaDoJogo() {
    cadastroEquipesEl.style.display = "none"
    cadastroPerguntasEl.style.display = "none"
    btnIniciar.style.display = "none"
    jogoEl.style.display = "flex"
    iniciarJogoSection.style.display = "none"
    switchHeader.style.display = "none"
    countdownEl.style.display = "none"
    placar.style.display = "block"
    btnResetar.style.display = "none"
}

function mostrarTelaPlacarFinal() {
    renderPlacar()
    jogoEl.style.display = "none"
    cadastroEquipesEl.style.display = "none"
    cadastroPerguntasEl.style.display = "none"
    iniciarJogoSection.style.display = "none"
    countdownEl.style.display = "none"
    switchHeader.style.display = "none"
    placar.style.display = "block"
    btnResetar.style.display = "block"
}


// Função iniciar jogo com contagem regressiva
function iniciarJogo() {
    if (equipes.length === 0 || Object.keys(temas).length === 0) {
        alert("Cadastre ao menos uma equipe e uma pergunta.")
        return
    }

    contagemRegressiva(5, () => {
        iniciarJogoDeFato()
    })
}

// Função que começa o jogo após contagem
function iniciarJogoDeFato() {
    atualizarVisibilidadePerguntas()
    mostrarTelaDoJogo()
    proximaRodada()
}

// Resetar tudo
function resetarTudo() {
    if (!confirm("Tem certeza que deseja apagar todos os dados?")) return
    localStorage.clear()
    location.reload()
}

// Eventos para Enter
nomeEquipeInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        e.preventDefault()
        adicionarEquipe()
    }
})

nomeTemaInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        e.preventDefault()
        adicionarTema()
    }
})

textoPerguntaInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        e.preventDefault()
        adicionarPergunta()
    }
})

// Funções de cor para tema e equipe
function corEquipe(nome) {
    return stringToColor(nome + "equipe")
}

function corTema(nome) {
    return stringToColor(nome + "tema")
}

function stringToColor(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    let color = "#"
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff
        color += ("00" + value.toString(16)).substr(-2)
    }
    return color
}

// Inicializa interface
function inicializar() {
    carregarDados()
    renderEquipes()
    renderTemas()
    renderSelectTemas()
    atualizarVisibilidadePerguntas()
    renderPlacar()
    mostrarTelaInicial()
}

function mostrarTelaInicial() {
    cadastroEquipesEl.style.display = "block"
    cadastroPerguntasEl.style.display = "block"
    btnIniciar.style.display = "block"
    jogoEl.style.display = "none"
    countdownEl.style.display = "none"
    iniciarJogoSection.style.display = "block" 
}

window.onload = inicializar
