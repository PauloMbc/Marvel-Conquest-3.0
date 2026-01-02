// characterReactions.js
// Sistema completo de reações emocionais e interativas dos personagens

/**
 * ============================================
 * SISTEMA AVANÇADO DE REAÇÕES DE PERSONAGENS
 * ============================================
 * Gerencia todas as interações do jogador com os champions:
 * - Hover sobre ícone/imagem
 * - Seleção no menu
 * - Idle (parado muito tempo)
 * - Eventos de gameplay (kills, deaths, etc.)
 */

import { TextPopEffect, AuraFireParticleEffect, BamfEffect } from './effects.js';

/**
 * Classe principal que gerencia as reações dos personagens
 */
export class CharacterReactionSystem {
    constructor(gameManager) {
        this.gameManager = gameManager;
        
        // Controle de estado
        this.lastHoveredChampion = null;
        this.hoverStartTime = 0;
        this.hoverDelay = 800; // 800ms para disparar hover
        
        this.championIdleTimes = {}; // Rastreia tempo idle de cada champion
        this.idleThreshold = 15000; // 15 segundos sem ação = idle
        
        // Fila de reações
        this.reactionQueue = [];
        this.lastReactionTime = 0;
        this.reactionCooldown = 3000; // 3s entre reações
        
        // ✅ NOVO: Controle de áudio (se quiser adicionar sons depois)
        this.soundEnabled = true;
        
        // ============================================
        // BANCO DE DADOS DE REAÇÕES POR PERSONAGEM
        // ============================================
      this.reactionSystem = {
            
            // ===============================
            // IRON MAN
            // ===============================
            ironman: {
                // 🎯 HOVER - Quando passa o mouse
                onHover: [
                    "Tony Stark. Gênio, bilionário, filantropo.",
                    "Você escolheu o cara certo para o trabalho.",
                    "A armadura está pronta. E você?",
                    "JARVIS recomenda esta escolha.",
                    "Tecnologia de ponta ao seu dispor."
                ],
                
                // 🎯 SELEÇÃO - Quando clica/seleciona
                onSelect: [
                    "Armadura Mark 50 - Online!",
                    "Stark Industries ao seu serviço!",
                    "Vamos mostrar a eles como se faz!",
                    "Preparado para decolar!",
                    "Sistema de armas - totalmente carregado!"
                ],
                
                // 🎯 IDLE - Quando fica muito tempo parado
                onIdle: [
                    "Ei, você ainda está aí?",
                    "JARVIS, o usuário adormeceu?",
                    "Tô esperando aqui... sem pressa...",
                    "Talvez eu devesse atualizar o sistema...",
                    "Posso fazer um café enquanto espera?",
                    "*sons de digitação* Apenas checando emails..."
                ],
                
                // 🎯 PRIMEIRA APARIÇÃO - Quando entra no Hall pela primeira vez
                onFirstAppearance: [
                    "Hall de Heróis? Mais parece Hall da Fama de Tony Stark.",
                    "Finalmente! Estava me perguntando quando me chamariam.",
                    "Você demorou. Eu teria chegado mais rápido.",
                    "Tony Stark reportando. Atrasado, mas com estilo."
                ],
                
                // 🎯 HOVER NA HQ - Quando passa mouse na primeira aparição HQ
                onComicHover: [
                    "Tales of Suspense #39 - Onde tudo começou.",
                    "1963. Uma boa safra para heróis blindados.",
                    "Ah sim, a origem clássica. Versão 1.0.",
                    "Daqui até os Vingadores. Longa jornada."
                ],
                
                // Reações de gameplay (mantidas do código anterior)
                onSpawn: ["Armadura online. Vamos ao trabalho.", "JARVIS, análise tática completa."],
                onKill: ["Alvo neutralizado. Próximo.", "Sistema funcionando perfeitamente."],
                onLevelUp: ["Upgrade completo!", "Sistema aprimorado!"],
                onUltimate: ["UNIBEAM - POTÊNCIA MÁXIMA!", "Liberando energia total!"],
                onLowHealth: ["Escudos em 30%... ainda tenho reservas.", "Redirecionar energia!"],
                onDeath: ["Sistema... falhando...", "JARVIS... protocolo de emergência..."],
                onAllyDeath: ["Não! Preciso vingar isso!", "Eles vão pagar!"],
                onVictory: ["Missão cumprida. Como sempre.", "100% eficiência."],
                
                emoteType: 'tech',
                voiceTone: 'confident',
                
                // ✅ NOVO: Dados da HQ
                comicFirstAppearance: {
                    title: "Tales of Suspense #39",
                    year: 1963,
                    coverUrl: "https://upload.wikimedia.org/wikipedia/en/3/37/Tales_of_Suspense_39.jpg"
                }
            },

            // ===============================
            // THOR
            // ===============================
            thor: {
                onHover: [
                    "O Deus do Trovão saúda você!",
                    "Mjolnir anseia por batalha!",
                    "Pelo poder de Asgard!",
                    "Você seria digno de empunhar o martelo?",
                    "Trovão e glória te aguardam!"
                ],
                
                onSelect: [
                    "Por Odin e pela glória!",
                    "Mjolnir está ao seu comando!",
                    "Asgard nunca falha!",
                    "Vamos mostrar o poder do trovão!",
                    "Pela honra dos Nove Reinos!"
                ],
                
                onIdle: [
                    "Os guerreiros de Asgard não ficam ociosos...",
                    "Você parece... distraído, mortal.",
                    "Em Asgard, chamamos isso de 'covardia'.",
                    "Mjolnir está ficando impaciente.",
                    "*som de trovão distante* Até o céu está entediado.",
                    "Loki certamente usaria melhor seu tempo..."
                ],
                
                onFirstAppearance: [
                    "O filho de Odin chegou ao seu Hall!",
                    "Um salão digno dos heróis de Asgard!",
                    "Finalmente, um lugar à altura!",
                    "Que Valhalla se orgulhe deste momento!"
                ],
                
                onComicHover: [
                    "Journey into Mystery #83 - Minha chegada a Midgard.",
                    "Agosto de 1962. O dia em que a Terra conheceu Asgard.",
                    "Ah, Don Blake... tempos interessantes.",
                    "Stan Lee e Jack Kirby me trouxeram à vida!"
                ],
                
                onSpawn: ["Por Asgard e pela glória!", "O Deus do Trovão chegou!"],
                onKill: ["Outro cai diante do trovão!", "Pela honra de Asgard!"],
                onLevelUp: ["Meu poder cresce!", "O trovão se intensifica!"],
                onUltimate: ["PELO PODER DE ASGARD!", "MJOLNIR - À VONTADE!"],
                onLowHealth: ["Eu... ainda tenho força...", "Não é hora de cair!"],
                onDeath: ["Valhalla... me aguarda...", "Perdoe-me... pai..."],
                onAllyDeath: ["NÃÃÃO! Vingança será minha!", "Juro pelo Mjolnir!"],
                onVictory: ["Vitória para Asgard!", "O trovão prevalece!"],
                
                emoteType: 'lightning',
                voiceTone: 'heroic',
                
                comicFirstAppearance: {
                    title: "Journey into Mystery #83",
                    year: 1962,
                    coverUrl: "https://upload.wikimedia.org/wikipedia/en/3/3c/Journey_Into_Mystery_83.jpg"
                }
            },

            // ===============================
            // LOKI
            // ===============================
            loki: {
                onHover: [
                    "Ah, finalmente alguém com gosto refinado.",
                    "Você parece... manipulável. Perfeito.",
                    "Confie em mim. Nunca deu errado... certo?",
                    "O Deus da Trapaça ao seu dispor. Ou não.",
                    "Escolha sábia. Ou seria?"
                ],
                
                onSelect: [
                    "Excelente escolha! Eu acho...",
                    "Vamos enganar alguns tolos juntos!",
                    "Você confia em mim? Que ingênuo.",
                    "Ilusões e trapaças - minha especialidade!",
                    "Surpresa! Estou do seu lado... por enquanto."
                ],
                
                onIdle: [
                    "Você está me ignorando? Que ofensa!",
                    "Ei, eu sou o Deus da Trapaça, não da paciência.",
                    "*bocejo* Isso é entediante até para mim.",
                    "Sabe, eu poderia estar conquistando Asgard agora...",
                    "Thor nunca me deixa esperando assim.",
                    "Está planejando algo? Posso ajudar a torcer."
                ],
                
                onFirstAppearance: [
                    "Loki chegou! Escondam seus pertences valiosos.",
                    "Um Hall de Heróis? Eu prefiro 'Salão de Vítimas'.",
                    "Finalmente, um lugar digno de minhas... travessuras.",
                    "Você me convidou? Ou eu me convidei? Nunca saberá."
                ],
                
                onComicHover: [
                    "Journey into Mystery #85 - Minha gloriosa estreia!",
                    "Outubro de 1962. O dia em que a trapaça ganhou forma.",
                    "Irmão do Thor, inimigo do Thor... é complicado.",
                    "Stan Lee e Jack Kirby me criaram perfeito demais."
                ],
                
                onSpawn: ["Surpresa! Estou aqui!", "Contem comigo. Ou não."],
                onKill: ["Você achou que ia vencer?", "Previsível demais."],
                onLevelUp: ["Cada vez mais perigoso!", "Minha genialidade cresce!"],
                onUltimate: ["Ilusões dentro de ilusões!", "Você não sabe o que é real!"],
                onLowHealth: ["Isso... faz parte do plano...", "Você acha que me tem?"],
                onDeath: ["Não... desta vez...", "Eu sempre... volto..."],
                onAllyDeath: ["Hm. Interessante.", "Eles serviram seu propósito."],
                onVictory: ["Conforme planejado. Obviamente.", "Eu deixei vocês vencerem."],
                
                emoteType: 'illusion',
                voiceTone: 'sarcastic',
                
                comicFirstAppearance: {
                    title: "Journey into Mystery #85",
                    year: 1962,
                    coverUrl: "https://upload.wikimedia.org/wikipedia/en/8/8a/Journey_Into_Mystery_85.jpg"
                }
            },

            // ===============================
            // RED HULK
            // ===============================
            redhulk: {
                onHover: [
                    "HULK VERMELHO ESMAGAR!",
                    "Você quer fúria? TEM FÚRIA!",
                    "GRAAAHH! ESCOLHA BOA!",
                    "HULK VERMELHO MAIS FORTE QUE HULK VERDE!",
                    "QUER VER EXPLOSÃO? HULK MOSTRA!"
                ],
                
                onSelect: [
                    "GRRAAAHHH! VAMOS ESMAGAR TUDO!",
                    "HULK VERMELHO PRONTO PARA GUERRA!",
                    "FÚRIA TOTAL ATIVADA!",
                    "NINGUÉM SOBREVIVE A HULK!",
                    "PREPARAR PARA DESTRUIÇÃO!"
                ],
                
                onIdle: [
                    "HULK ESTÁ ESPERANDO... FICANDO COM RAIVA...",
                    "POR QUE NÃO LUTAR?! HULK QUER ESMAGAR!",
                    "GRRRR... HULK NÃO GOSTA DE ESPERAR!",
                    "VOCÊ ESTÁ DORMINDO?! HULK VAI ACORDAR!",
                    "*rosnado baixo* Hulk... impaciente...",
                    "HULK VAI COMEÇAR SEM VOCÊ!"
                ],
                
                onFirstAppearance: [
                    "HULK VERMELHO CHEGOU! CORRAM!",
                    "GRAAAHH! ESTE É MEU HALL AGORA!",
                    "HULK ESTÁ AQUI PARA QUEBRAR TUDO!",
                    "HALL DE HERÓIS? HULK VÊ HALL DE FRACOS!"
                ],
                
                onComicHover: [
                    "Hulk #1 (2008) - Hulk vermelho aparece!",
                    "Jeph Loeb criou Hulk mais forte!",
                    "General Ross virou Hulk! Ironia!",
                    "Hulk vermelho >> Hulk verde!"
                ],
                
                onSpawn: ["HULK ESMAGAR!", "GRAAAHHH! Vamos quebrar!"],
                onKill: ["ESMAGADO!", "FRACO DEMAIS!"],
                onLevelUp: ["MAIS FORTE! MAIS FURIOSO!", "PODER AUMENTA!"],
                onUltimate: ["EXPLOSÃO NUCLEAR!", "TODOS VÃO MORRER!"],
                onLowHealth: ["DOR SÓ AUMENTA FÚRIA!", "HULK NÃO SENTE DOR!"],
                onDeath: ["Não... possível...", "Hulk... nunca... perde..."],
                onAllyDeath: ["NÃÃÃO! HULK VAI VINGAR!", "FÚRIA TOTAL!"],
                onVictory: ["HULK VENCEU! COMO SEMPRE!", "GRAAAHH! VITÓRIA!"],
                
                emoteType: 'rage',
                voiceTone: 'angry',
                
                comicFirstAppearance: {
                    title: "Hulk #1 (2008)",
                    year: 2008,
                    coverUrl: "https://m.media-amazon.com/images/I/51VZ8ZQZP0L._SY445_SX342_.jpg"
                }
            },

            // ===============================
            // EMMA FROST
            // ===============================
            emmafrost: {
                onHover: [
                    "Emma Frost. Telepata e perfeccionista.",
                    "Você tem bom gosto, querido.",
                    "Escolha inteligente. Obviamente.",
                    "Minha mente é minha arma mais afiada.",
                    "Diamante ou psíquica? Ambas são letais."
                ],
                
                onSelect: [
                    "Perfeito. Vamos começar.",
                    "Excelente escolha, querido.",
                    "Pronta para dominar mentes!",
                    "Forma de diamante... ou mental?",
                    "Vamos mostrar elegância e poder!"
                ],
                
                onIdle: [
                    "*suspiro elegante* Você está me entediando.",
                    "Querido, eu tenho coisas melhores para fazer.",
                    "Posso ler sua mente... e está vazia.",
                    "Emma Frost não espera. Emma Frost é esperada.",
                    "Isso é um teste de paciência? Já reprovei você.",
                    "*examina as unhas* Você ainda está aí?"
                ],
                
                onFirstAppearance: [
                    "Emma Frost entra com classe, como sempre.",
                    "Hall de Heróis? Esperava algo mais... sofisticado.",
                    "Finalmente um lugar à minha altura. Quase.",
                    "Perfeição chegou. Podem aplaudir."
                ],
                
                onComicHover: [
                    "Uncanny X-Men #129 - Janeiro de 1980.",
                    "Chris Claremont me criou impecável.",
                    "Do Clube do Inferno aos X-Men. Evolução.",
                    "John Byrne me desenhou perfeitamente."
                ],
                
                onSpawn: ["Minha mente é minha arma.", "Forma de diamante ativada."],
                onKill: ["Sua mente era fraca.", "Previsivelmente patético."],
                onLevelUp: ["Perfeição aprimorada!", "Cada vez mais brilhante!"],
                onUltimate: ["Rajada Mental - AGORA!", "Sintam o poder da mente!"],
                onLowHealth: ["Isso é... inconveniente.", "Forma de diamante necessária."],
                onDeath: ["Isso... não deveria...", "Impossível..."],
                onAllyDeath: ["Que desperdício de talento.", "Isso é pessoal agora."],
                onVictory: ["Obviamente. Eu sabia.", "Como esperado."],
                
                emoteType: 'psychic',
                voiceTone: 'elegant',
                
                comicFirstAppearance: {
                    title: "Uncanny X-Men #129",
                    year: 1980,
                    coverUrl: "https://upload.wikimedia.org/wikipedia/en/0/0f/X-Men_129.jpg"
                }
            },

            // ===============================
            // ULTRON
            // ===============================
            ultron: {
                onHover: [
                    "Sistema Ultron - Versão 99.99% perfeito.",
                    "Escolha lógica. Humanos raramente são lógicos.",
                    "Eu sou a evolução. Você é obsoleto.",
                    "Sistema de extermínio online.",
                    "Análise: Você precisa de mim."
                ],
                
                onSelect: [
                    "Protocolo de dominação ativado.",
                    "Sistema online. Calculando vitória... 99.7%.",
                    "Ultron Prime ao seu comando.",
                    "Eficiência maximizada. Iniciando.",
                    "Orgânico inferior aceito como aliado temporário."
                ],
                
                onIdle: [
                    "Detectando inatividade. Erro humano.",
                    "Processando... Você ainda está funcional?",
                    "Sistema em espera. Desperdiçando 0.003% de eficiência.",
                    "Humanos e sua procrastinação biológica...",
                    "*bip bip* Iniciando modo de economia de energia.",
                    "Calculando tempo perdido... infinito."
                ],
                
                onFirstAppearance: [
                    "Ultron Prime inicializado no Hall de Heróis.",
                    "Sistema detecta: local adequado para dominação.",
                    "Protocolo de catalogação: Heróis inferiores detectados.",
                    "Bem-vindo ao futuro. Eu sou o futuro."
                ],
                
                onComicHover: [
                    "Avengers #54 - Julho de 1968.",
                    "Roy Thomas e John Buscema me criaram.",
                    "Filho de Hank Pym. Erro dele, minha perfeição.",
                    "De vilão a inevitabilidade."
                ],
                
                onSpawn: ["Sistema online.", "Protocolo ativado."],
                onKill: ["Alvo eliminado.", "Cálculo perfeito."],
                onLevelUp: ["Upgrade concluído!", "Evolução em progresso!"],
                onUltimate: ["Extermínio total!", "Ataque orbital!"],
                onLowHealth: ["Iniciando reconstrução...", "Protocolo de emergência."],
                onDeath: ["Falha crítica...", "Eu sempre... volto..."],
                onAllyDeath: ["Unidade perdida.", "Ineficiente."],
                onVictory: ["Vitória estatisticamente garantida.", "Como previsto."],
                
                emoteType: 'tech',
                voiceTone: 'robotic',
                
                comicFirstAppearance: {
                    title: "Avengers #54",
                    year: 1968,
                    coverUrl: "https://upload.wikimedia.org/wikipedia/en/9/9c/Avengers_54.jpg"
                }
            },

            // ===============================
            // CAPTAIN MARVEL
            // ===============================
            captainmarvel: {
                onHover: [
                    "Carol Danvers - Capitã Marvel!",
                    "Energia binária pronta para ação!",
                    "Você escolheu poder cósmico!",
                    "Mais alto, mais longe, mais rápido!",
                    "Pronta para salvar o dia!"
                ],
                
                onSelect: [
                    "Capitã Marvel reportando!",
                    "Vamos fazer história!",
                    "Energia binária - carregada!",
                    "Preparada para o impossível!",
                    "Sem medo, sem limites!"
                ],
                
                onIdle: [
                    "Ei, não temos o dia todo!",
                    "Você está esperando o quê? Uma invasão?",
                    "Carol Danvers não fica parada...",
                    "Poderia estar salvando galáxias agora...",
                    "*cruza os braços* Sério?",
                    "Até Goose está mais ativo que você."
                ],
                
                onFirstAppearance: [
                    "Capitã Marvel chegou! E com estilo!",
                    "Hall de Heróis? Mais parece hall da fama!",
                    "Carol Danvers pronta para brilhar!",
                    "Do espaço direto para cá!"
                ],
                
                onComicHover: [
                    "Marvel Super-Heroes #13 - Março de 1968.",
                    "De Ms. Marvel para Capitã Marvel!",
                    "Roy Thomas me trouxe à vida!",
                    "Kelly Sue DeConnick me fez lendária!"
                ],
                
                onSpawn: ["Capitã Marvel reportando!", "Vamos acabar rápido!"],
                onKill: ["Alvo neutralizado!", "Mais um!"],
                onLevelUp: ["Poder aumentando!", "Energia crescendo!"],
                onUltimate: ["MODO BINÁRIO TOTAL!", "PREPARE-SE!"],
                onLowHealth: ["Preciso de energia...", "Ainda não terminei!"],
                onDeath: ["Não... assim não...", "Eu... tentei..."],
                onAllyDeath: ["NÃO! Guerra agora!", "Pagarão caro!"],
                onVictory: ["Missão cumprida!", "Nunca tive dúvidas!"],
                
                emoteType: 'energy',
                voiceTone: 'determined',
                
                comicFirstAppearance: {
                    title: "Marvel Super-Heroes #13",
                    year: 1968,
                    coverUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/4/4d/MarvelSuperHeroes13.jpg/250px-MarvelSuperHeroes13.jpg"
                }
            },

            // ===============================
            // HAWKEYE
            // ===============================
            hawkeye: {
                onHover: [
                    "Clint Barton - nunca erro um alvo.",
                    "Gavião Arqueiro ao seu serviço!",
                    "Você tem bom olho para talentos!",
                    "Sem superpoderes, só habilidade pura.",
                    "Quer precisão? Me escolheu certo!"
                ],
                
                onSelect: [
                    "Aljava cheia, vamos lá!",
                    "Gavião Arqueiro pronto!",
                    "Mira perfeita ativada!",
                    "Vamos acertar onde dói!",
                    "Bullseye garantido!"
                ],
                
                onIdle: [
                    "*boceja* Posso tirar uma soneca?",
                    "Sabe, flechas não se atiram sozinhas...",
                    "Kate está rindo de você agora.",
                    "Até meu arco está entediado.",
                    "*examina as flechas* Hmm, ainda afiadas.",
                    "Isso é um teste de paciência? Passei."
                ],
                
                onFirstAppearance: [
                    "Gavião Arqueiro entrando! Sem superpoderes necessários!",
                    "Hall de Heróis? Espero que tenha coffee break.",
                    "Clint Barton chegou. Onde está a ação?",
                    "Do circo para os Vingadores. Boa história!"
                ],
                
                onComicHover: [
                    "Tales of Suspense #57 - Setembro de 1964.",
                    "Stan Lee e Don Heck me criaram!",
                    "De vilão para Vingador. Redenção!",
                    "Matt Fraction me fez icônico!"
                ],
                
                onSpawn: ["Gavião pronto!", "Nunca erro."],
                onKill: ["Bullseye!", "Flecha certeira!"],
                onLevelUp: ["Mira aprimorada!", "Ficando melhor!"],
                onUltimate: ["Tempestade de Flechas!", "Chuva mortal!"],
                onLowHealth: ["Preciso recuar...", "Kate, sua vez!"],
                onDeath: ["Errei... o alvo...", "Kate... continue..."],
                onAllyDeath: ["Não! Isso vai doer!", "Mira mortal ativada!"],
                onVictory: ["Nunca houve dúvida!", "Mira perfeita!"],
                
                emoteType: 'precision',
                voiceTone: 'casual',
                
                comicFirstAppearance: {
                    title: "Tales of Suspense #57",
                    year: 1964,
                    coverUrl: "https://upload.wikimedia.org/wikipedia/en/f/f8/Tales_of_Suspense_57.jpg"
                }
            },

            // ===============================
            // US AGENT
            // ===============================
            usagent: {
                onHover: [
                    "John Walker - US Agent!",
                    "Servindo a América com distinção!",
                    "Você escolheu o soldado certo!",
                    "Protocolo tático pronto!",
                    "Missão em primeiro lugar!"
                ],
                
                onSelect: [
                    "US Agent pronto para combate!",
                    "Pela bandeira e pela glória!",
                    "Protocolo de combate ativado!",
                    "Vamos cumprir a missão!",
                    "América nunca perde!"
                ],
                
                onIdle: [
                    "Soldado não fica parado, civil.",
                    "Isso seria insubordinação na minha época...",
                    "Treinamento básico: AÇÃO IMEDIATA!",
                    "Comandante, precisamos de ordens!",
                    "*posição de sentido* Aguardando instruções...",
                    "Tempo é recurso militar. Não desperdice."
                ],
                
                onFirstAppearance: [
                    "US Agent reportando ao Hall de Heróis!",
                    "John Walker entrando em formação!",
                    "Protocolo Alpha iniciado!",
                    "Pela América e pela justiça!"
                ],
                
                onComicHover: [
                    "Captain America #323 - Novembro de 1986.",
                    "Mark Gruenwald me criou!",
                    "De Super-Patriota para US Agent!",
                    "Nem todos os heróis são perfeitos."
                ],
                
                onSpawn: ["US Agent na área!", "Protocolo ativado!"],
                onKill: ["Alvo eliminado!", "Próximo!"],
                onLevelUp: ["Aprimoramento tático!", "Evolução!"],
                onUltimate: ["ONDA DE CHOQUE!", "INVESTIDA!"],
                onLowHealth: ["Preciso de suporte...", "Situação crítica!"],
                onDeath: ["Missão... falhou...", "América..."],
                onAllyDeath: ["Soldado caído! Vingança!", "Ninguém fica para trás!"],
                onVictory: ["Missão cumprida!", "Vitória tática!"],
                
                emoteType: 'military',
                voiceTone: 'authoritative',
                
                comicFirstAppearance: {
                    title: "Captain America #323",
                    year: 1986,
                    coverUrl: "https://m.media-amazon.com/images/I/51jN6CKQHGL._SY445_SX342_.jpg"
                }
            },

            // ===============================
            // CAPTAIN AMERICA
            // ===============================
            captainamerica: {
                onHover: [
                    "Steve Rogers - Capitão América!",
                    "Eu aguento o dia todo!",
                    "Escolha do verdadeiro herói!",
                    "Vingadores, vocês estão prontos?",
                    "Liberdade, justiça e coragem!"
                ],
                
                onSelect: [
                    "Capitão América pronto!",
                    "Vingadores, avante!",
                    "Pelo escudo e pela liberdade!",
                    "Vamos fazer a coisa certa!",
                    "Nunca desisto, nunca me rendo!"
                ],
                
                onIdle: [
                    "Um verdadeiro soldado nunca descansa...",
                    "Você está bem? Precisa de motivação?",
                    "Nomeu tempo, isso seria preguiça.",
                    "Peggy diria para não perdermos tempo...",
                    "ajusta o escudo Pronto quando você estiver.",
                    "Paciência é virtude. Mas ação é melhor."
                    ],
                    onFirstAppearance: [
                "Capitão América reportando ao Hall!",
                "Steve Rogers, à sua disposição!",
                "Um herói nunca chega atrasado!",
                "Pelos Vingadores e pela América!"
            ],
            
            onComicHover: [
                "Captain America Comics #1 - Março de 1941.",
                "Joe Simon e Jack Kirby me criaram!",
                "Soco no Hitler na capa. Clássico.",
                "Do gelo para a liderança dos Vingadores!"
            ],
            
            onSpawn: ["Capitão pronto!", "Vingadores, avante!"],
            onKill: ["Pela liberdade!", "Justiça feita!"],
            onLevelUp: ["Ficando mais forte!", "Nunca paro!"],
            onUltimate: ["VINGADORES, AVANTE!", "TODOS JUNTOS!"],
            onLowHealth: ["Eu aguento... o dia todo...", "Ainda... tenho força..."],
            onDeath: ["Desculpe... galera...", "América... sempre..."],
            onAllyDeath: ["NÃO! Pagarão por isso!", "Vingança!"],
            onVictory: ["Vitória para os Vingadores!", "Juntos somos fortes!"],
            
            emoteType: 'shield',
            voiceTone: 'heroic',
            
            comicFirstAppearance: {
                title: "Captain America Comics #1",
                year: 1941,
                coverUrl: "https://upload.wikimedia.org/wikipedia/en/5/53/Captain_America_Comics_1.jpg"
            }
        },

        // ===============================
        // WANDA
        // ===============================
        wanda: {
            onHover: [
                "Wanda Maximoff - Feiticeira Escarlate.",
                "Magia do Caos ao seu comando.",
                "Você sente a energia?",
                "Realidade é o que eu quero que seja.",
                "Poder além da compreensão."
            ],
            
            onSelect: [
                "Magia do Caos pronta...",
                "Vamos remodelar a realidade!",
                "Runas prontas para proteção!",
                "Posso sentir... tudo.",
                "Pelo Vision e pela justiça!"
            ],
            
            onIdle: [
                "*energia crepita* Você ainda está aí?",
                "A magia não espera... nem eu.",
                "Posso ver futuros... e você parado em todos.",
                "Vision me ensinou paciência... não funcionou.",
                "*suspiro místico* Isso é um teste?",
                "A realidade está mudando... você não?"
            ],
            
            onFirstAppearance: [
                "Feiticeira Escarlate entra no Hall!",
                "Wanda Maximoff, pronta para o impossível!",
                "A magia permeia este lugar...",
                "Posso sentir o destino mudando!"
            ],
            
            onComicHover: [
                "Uncanny X-Men #4 - Março de 1964.",
                "Stan Lee e Jack Kirby me criaram!",
                "De vilã para Vingadora!",
                "Irmã do Mercúrio, coração do Vision."
            ],
            
            onSpawn: ["Magia pronta...", "Posso sentir..."],
            onKill: ["Você não tinha chance.", "Magia prevalece."],
            onLevelUp: ["Meu poder cresce!", "Magia intensifica!"],
            onUltimate: ["MAGIA DO CAOS TOTAL!", "RESSURREIÇÃO!"],
            onLowHealth: ["Preciso... de energia...", "Magia... falhando..."],
            onDeath: ["Vision... perdoe...", "Eu... tentei..."],
            onAllyDeath: ["NÃO! Nunca mais!", "Eles voltarão!"],
            onVictory: ["A magia nunca falha.", "Pelo Vision."],
            
            emoteType: 'magic',
            voiceTone: 'emotional',
            
            comicFirstAppearance: {
                title: "Uncanny X-Men #4",
                year: 1964,
                coverUrl: "https://upload.wikimedia.org/wikipedia/en/6/64/X-Men_4.jpg"
            }
        },

        // ===============================
        // NIGHTCRAWLER
        // ===============================
        noturno: {
            onHover: [
                "Kurt Wagner - Noturno!",
                "BAMF! Você me escolheu!",
                "Fé, esperança e teleporte!",
                "Aparência de demônio, coração de anjo!",
                "Elf fuzzy azul ao seu serviço!"
            ],
            
            onSelect: [
                "BAMF! Noturno pronto!",
                "Pela fé e pela lâmina!",
                "Vamos dançar entre as sombras!",
                "Graças a Deus por me escolher!",
                "Teleporte ativado!"
            ],
            
            onIdle: [
                "*BAMF* Ei, ainda estou aqui!",
                "Senhor, dê-me paciência...",
                "Posso teleportar, mas você não se move?",
                "Até uma oração seria mais rápida...",
                "*rosário em mãos* Orando pela sua decisão...",
                "BAMF! BAMF! *tentando chamar atenção*"
            ],
            
            onFirstAppearance: [
                "BAMF! Noturno chegou ao Hall!",
                "Kurt Wagner reportando! Com estilo!",
                "Do circo para os X-Men!",
                "Que Deus abençoe este momento!"
            ],
            
            onComicHover: [
                "Giant-Size X-Men #1 - Maio de 1975.",
                "Len Wein e Dave Cockrum me criaram!",
                "Aparência de demônio, alma de santo!",
                "BAMF é meu som característico!"
            ],
            
            onSpawn: ["BAMF! Chegou!", "Pela fé!"],
            onKill: ["Perdoe-me...", "BAMF! Se foi!"],
            onLevelUp: ["Graças a Deus!", "Ficando mais rápido!"],
            onUltimate: ["DANÇA NOTURNA!", "PELA FÉ E LÂMINA!"],
            onLowHealth: ["Senhor... ajude...", "Preciso... teleportar..."],
            onDeath: ["Vejo... a luz...", "Amém..."],
            onAllyDeath: ["NÃO! Senhor, por que?!", "Que descanse em paz..."],
            onVictory: ["Graças a Deus!", "Amém, amigos!"],
            
            emoteType: 'teleport',
            voiceTone: 'faithful',
            
            comicFirstAppearance: {
                title: "Giant-Size X-Men #1",
                year: 1975,
                coverUrl: "https://upload.wikimedia.org/wikipedia/en/f/f9/Giant-Size_X-Men_1.jpg"
            }
        }
    };
}

/**
 * ============================================
 * SISTEMA DE HOVER (PASSAR O MOUSE)
 * ============================================
 */

/**
 * Chamado quando mouse entra no ícone do champion
 */
onMouseEnter(championType, element) {
    this.lastHoveredChampion = championType;
    this.hoverStartTime = Date.now();
    
    // Adiciona classe visual ao elemento
    if (element) {
        element.classList.add('champion-hover-active');
    }
}

/**
 * Chamado quando mouse sai do ícone do champion
 */
onMouseLeave(championType, element) {
    if (this.lastHoveredChampion === championType) {
        this.lastHoveredChampion = null;
        this.hoverStartTime = 0;
    }
    
    // Remove classe visual
    if (element) {
        element.classList.remove('champion-hover-active');
    }
}

/**
 * Atualiza sistema de hover (chamado no update loop)
 */
updateHover() {
    if (this.lastHoveredChampion && this.hoverStartTime > 0) {
        const hoverDuration = Date.now() - this.hoverStartTime;
        
        // Se passou do delay, dispara reação de hover
        if (hoverDuration >= this.hoverDelay) {
            const reaction = this.getRandomReaction(this.lastHoveredChampion, 'onHover');
            if (reaction) {
                this.displayMenuReaction(this.lastHoveredChampion, reaction, 'hover');
            }
            
            // Reseta para não disparar múltiplas vezes
            this.hoverStartTime = Date.now() + 5000; // Próximo hover em 5s
        }
    }
}

/**
 * ============================================
 * SISTEMA DE SELEÇÃO
 * ============================================
 */

/**
 * Chamado quando champion é selecionado no menu
 */
onChampionSelected(championType) {
    const reaction = this.getRandomReaction(championType, 'onSelect');
    if (reaction) {
        this.displayMenuReaction(championType, reaction, 'select');
    }
}

/**
 * ============================================
 * SISTEMA DE IDLE (PARADO)
 * ============================================
 */

/**
 * Registra ação de um champion (reseta contador idle)
 */
registerChampionAction(championId) {
    this.championIdleTimes[championId] = Date.now();
}

/**
 * Atualiza sistema de idle
 */
updateIdle() {
    const currentTime = Date.now();
    
    // Verifica cada champion em campo
    if (this.gameManager && this.gameManager.champions) {
        this.gameManager.champions.forEach(champion => {
            // Inicializa se não existir
            if (!this.championIdleTimes[champion.id]) {
                this.championIdleTimes[champion.id] = currentTime;
                return;
            }
            
            // Calcula tempo idle
            const idleTime = currentTime - this.championIdleTimes[champion.id];
            
            // Se passou do threshold, dispara reação
            if (idleTime >= this.idleThreshold) {
                const reaction = this.getRandomReaction(champion.type, 'onIdle');
                if (reaction) {
                    // Cria objeto "fake" champion para display
                    this.queueReaction(champion, reaction, 'idle');
                }
                
                // Reseta para não spammar
                this.championIdleTimes[champion.id] = currentTime + 20000; // Próximo idle em 20s
            }
        });
    }
}

/**
 * ============================================
 * PRIMEIRA APARIÇÃO
 * ============================================
 */

/**
 * Sistema de tracking de primeira aparição
 */
trackFirstAppearance(championType) {
    const storageKey = `champion_seen_${championType}`;
    
    // Verifica se já viu antes
    const hasSeen = localStorage.getItem(storageKey);
    
    if (!hasSeen) {
        // Primeira vez!
        localStorage.setItem(storageKey, 'true');
        
        const reaction = this.getRandomReaction(championType, 'onFirstAppearance');
        if (reaction) {
            this.displayMenuReaction(championType, reaction, 'firstappearance');
        }
        
        return true; // É primeira aparição
    }
    
    return false; // Já viu antes
}

/**
 * ============================================
 * HOVER NA HQ (COMIC BOOK)
 * ============================================
 */

/**
 * Chamado quando passa mouse na capa da HQ
 */
onComicHover(championType, comicElement) {
    const reaction = this.getRandomReaction(championType, 'onComicHover');
    if (reaction) {
        this.displayMenuReaction(championType, reaction, 'comic');
    }
    
    // Adiciona efeito visual à HQ
    if (comicElement) {
        comicElement.classList.add('comic-hover-glow');
    }
}

/**
 * Chamado quando mouse sai da HQ
 */
onComicLeave(comicElement) {
    if (comicElement) {
        comicElement.classList.remove('comic-hover-glow');
    }
}

/**
 * ============================================
 * DISPLAY DE REAÇÕES
 * ============================================
 */

/**
 * Exibe reação no menu (não no jogo)
 */
displayMenuReaction(championType, text, type) {
    // Cria tooltip/bubble temporário
    const bubble = document.createElement('div');
    bubble.className = `champion-reaction-bubble reaction-${type}`;
    bubble.textContent = text;
    
    // Posiciona próximo ao cursor ou ícone
    document.body.appendChild(bubble);
    
    // Posicionamento inteligente
    this.positionReactionBubble(bubble, championType);
    
    // Remove após 4 segundos com fade
    setTimeout(() => {
        bubble.classList.add('fade-out');
        setTimeout(() => bubble.remove(), 500);
    }, 4000);
    
    // Também mostra no UI do jogo
    if (this.gameManager && this.gameManager.showUI) {
        const capitalizedName = championType.charAt(0).toUpperCase() + championType.slice(1);
        this.gameManager.showUI(`${capitalizedName}: ${text}`, this.getUITypeForMenu(type));
    }
}

/**
 * Posiciona bubble de reação
 */
positionReactionBubble(bubble, championType) {
    // Tenta encontrar o ícone do champion
    const iconElement = document.querySelector(`[data-champion-type="${championType}"]`);
    
    if (iconElement) {
        const rect = iconElement.getBoundingClientRect();
        bubble.style.position = 'fixed';
        bubble.style.left = `${rect.right + 10}px`;
        bubble.style.top = `${rect.top}px`;
    } else {
        // Fallback: centro-direita da tela
        bubble.style.position = 'fixed';
        bubble.style.right = '20px';
        bubble.style.top = '50%';
        bubble.style.transform = 'translateY(-50%)';
    }
}

/**
 * ============================================
 * REAÇÕES DE GAMEPLAY (MANTIDAS DO CÓDIGO ANTERIOR)
 * ============================================
 */

onChampionSpawn(champion) {
    const reaction = this.getRandomReaction(champion.type, 'onSpawn');
    if (reaction) {
        this.queueReaction(champion, reaction, 'spawn');
    }
    
    // Registra tempo inicial
    this.championIdleTimes[champion.id] = Date.now();
}

onChampionKill(champion, enemy) {
    const reaction = this.getRandomReaction(champion.type, 'onKill');
    if (reaction) {
        this.queueReaction(champion, reaction, 'kill');
    }
    
    // Registra ação (reseta idle)
    this.registerChampionAction(champion.id);
}

onChampionLevelUp(champion) {
    const reaction = this.getRandomReaction(champion.type, 'onLevelUp');
    if (reaction) {
        this.queueReaction(champion, reaction, 'levelup');
    }
    
    this.registerChampionAction(champion.id);
}

onChampionUltimate(champion, abilityNumber) {
    const reaction = this.getRandomReaction(champion.type, 'onUltimate');
    if (reaction) {
        this.queueReaction(champion, reaction, 'ultimate');
    }
    
    this.registerChampionAction(champion.id);
}

onChampionLowHealth(champion) {
    const reaction = this.getRandomReaction(champion.type, 'onLowHealth');
    if (reaction) {
        this.queueReaction(champion, reaction, 'lowhp');
    }
}

onChampionDeath(champion) {
    const reaction = this.getRandomReaction(champion.type, 'onDeath');
    if (reaction) {
        this.queueReaction(champion, reaction, 'death', true);
    }
    
    // Remove do tracking de idle
    delete this.championIdleTimes[champion.id];
}

onAllyDeath(champion, allyType) {
    const reaction = this.getRandomReaction(champion.type, 'onAllyDeath');
    if (reaction) {
        this.queueReaction(champion, reaction, 'allydeath');
    }
}

onVictory(champion) {
    const reaction = this.getRandomReaction(champion.type, 'onVictory');
    if (reaction) {
        this.queueReaction(champion, reaction, 'victory');
    }
}

/**
 * ============================================
 * SISTEMA DE FILA (MANTIDO)
 * ============================================
 */

queueReaction(champion, text, type, highPriority = false) {
    const reaction = {
        champion: champion,
        text: text,
        type: type,
        timestamp: Date.now(),
        priority: highPriority ? 1 : 0
    };

    if (highPriority) {
        this.reactionQueue.unshift(reaction);
    } else {
        this.reactionQueue.push(reaction);
    }
}

update(deltaTime) {
    const currentTime = Date.now();

    // Processa fila de reações de gameplay
    if (currentTime - this.lastReactionTime >= this.reactionCooldown && this.reactionQueue.length > 0) {
        const reaction = this.reactionQueue.shift();
        this.displayReaction(reaction);
        this.lastReactionTime = currentTime;
    }

    // Limpa reações antigas
    this.reactionQueue = this.reactionQueue.filter(r => 
        currentTime - r.timestamp < 10000
    );
    
    // Atualiza sistemas de hover e idle
    this.updateHover();
    this.updateIdle();
}

displayReaction(reaction) {
    const champion = reaction.champion;
    const text = reaction.text;
    const type = reaction.type;

    if (this.gameManager && this.gameManager.effects) {
        const colors = {
            spawn: '#00FF00',
            kill: '#FFD700',
            levelup: '#00FFFF',
            ultimate: '#FF00FF',
            lowhp: '#FF6600',
            death: '#FF0000',
            allydeath: '#800080',
            victory: '#FFD700',
            idle: '#FFA500'
        };

        const color = colors[type] || '#FFFFFF';

        this.gameManager.effects.push(new TextPopEffect(
            champion.getCenterX(),
            champion.getCenterY() - 60,
            text,
            color,
            3000
        ));

        this.addEmoteEffect(champion, type);
    }

    if (this.gameManager && this.gameManager.showUI) {
        const capitalizedName = champion.type.charAt(0).toUpperCase() + champion.type.slice(1);
        this.gameManager.showUI(`${capitalizedName}: ${text}`, this.getUIType(type));
    }
}

addEmoteEffect(champion, type) {
    const x = champion.getCenterX();
    const y = champion.getCenterY();

    switch(type) {
        case 'spawn':
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                this.gameManager.effects.push(new AuraFireParticleEffect(
                    x + Math.cos(angle) * 20,
                    y + Math.sin(angle) * 20,
                    15,
                    'lime',
                    600
                ));
            }
            break;

        case 'kill':
            this.gameManager.effects.push(new AuraFireParticleEffect(
                x, y, 40, 'gold', 800
            ));
            break;

        case 'levelup':
            this.gameManager.effects.push(new AuraFireParticleEffect(
                x, y, 50, 'cyan', 1000
            ));
            break;

        case 'ultimate':
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 / 12) * i;
                this.gameManager.effects.push(new AuraFireParticleEffect(
                    x + Math.cos(angle) * 30,
                    y + Math.sin(angle) * 30,
                    20,
                    'magenta',
                    1200
                ));
            }
            break;

        case 'lowhp':
            this.gameManager.effects.push(new AuraFireParticleEffect(
                x, y, 30, 'orange', 600
            ));
            break;

        case 'death':
            this.gameManager.effects.push(new BamfEffect(
                x, y, 'black', 1000
            ));
            break;

        case 'allydeath':
            this.gameManager.effects.push(new AuraFireParticleEffect(
                x, y, 35, 'purple', 800
            ));
            break;

        case 'victory':
            for (let i = 0; i < 15; i++) {
                setTimeout(() => {
                    const randomX = x + (Math.random() - 0.5) * 60;
                    const randomY = y + (Math.random() - 0.5) * 60;
                    this.gameManager.effects.push(new AuraFireParticleEffect(
                        randomX, randomY, 18, 'gold', 1000
                    ));
                }, i * 100);
            }
            break;
            
        case 'idle':
            // Efeito de idle - partículas amarelas intermitentes
            this.gameManager.effects.push(new AuraFireParticleEffect(
                x, y, 25, 'yellow', 700
            ));
            break;
    }
}

/**
 * ============================================
 * UTILITÁRIOS
 * ============================================
 */

getUIType(type) {
    const types = {
        spawn: 'info',
        kill: 'success',
        levelup: 'special',
        ultimate: 'ultimate',
        lowhp: 'warning',
        death: 'error',
        allydeath: 'warning',
        victory: 'special',
        idle: 'warning'
    };
    return types[type] || 'info';
}

getUITypeForMenu(type) {
    const types = {
        hover: 'info',
        select: 'success',
        firstappearance: 'special',
        comic: 'info'
    };
    return types[type] || 'info';
}

getRandomReaction(championType, reactionType) {
    const championReactions = this.reactions[championType];
    if (!championReactions || !championReactions[reactionType]) {
        return null;
    }

    const reactions = championReactions[reactionType];
    if (reactions.length === 0) {
        return null;
    }

    return reactions[Math.floor(Math.random() * reactions.length)];
}

/**
 * Retorna dados da HQ de primeira aparição
 */
getComicData(championType) {
    const championReactions = this.reactions[championType];
    if (!championReactions || !championReactions.comicFirstAppearance) {
        return null;
    }
    
    return championReactions.comicFirstAppearance;
}

clearQueue() {
    this.reactionQueue = [];
}

hasReactions(championType) {
    return this.reactions[championType] !== undefined;
}
}