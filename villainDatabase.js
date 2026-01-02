// villainDatabase.js - ARQUIVO CONFIDENCIAL S.H.I.E.L.D.
// 🔒 NÍVEL DE ACESSO: RESTRITO

class VillainDatabase {
    constructor() {
        this.villains = this.initializeVillains();
        this.discovered = this.loadDiscoveredVillains();
    }

    initializeVillains() {
        return [
            {
                id: "leader",
                nome: "O Líder",
                codinome: "The Leader",
                classe: "Executor",
                primeiraAparicao: "Tales to Astonish #62 (1964)",
                especie: "Humano Alterado (Radiação Gama)",
                origem: "Boise, Idaho, EUA",
                nomeReal: "Samuel Sterns",
                altura: "1.89m",
                peso: "63kg",
                periculosidade: 9,
                habilidades: [
                    "Intelecto nível super-gênio (QI 500+)",
                    "Telepatia limitada",
                    "Manipulação de radiação gama",
                    "Estratégia militar avançada",
                    "Criação de humanoides gama"
                ],
                ataquesNoJogo: [
                    "🔫 Rajada Gama Concentrada - Laser verde devastador",
                    "🧠 Controle Mental - Reduz velocidade de movimento e ataque",
                    "💥 Explosão Psíquica - Dano em área massivo"
                ],
                fraquezas: [
                    "Força física extremamente baixa",
                    "Vulnerável após uso de poderes psíquicos",
                    "Instabilidade emocional e megalomania",
                    "Dependente de tecnologia para combate físico"
                ],
                curiosidades: [
                    "Já tentou recriar o Hulk mais de 50 vezes sem sucesso completo",
                    "Seu cérebro aumentado é visível através do crânio deformado",
                    "Considera o Hulk simultaneamente seu maior inimigo e obra-prima",
                    "Fundou a organização terrorista Intelligencia",
                    "Já trocou de corpo diversas vezes para escapar da morte"
                ],
                observacoes: "⚠️ MONITORAMENTO CONTÍNUO OBRIGATÓRIO. Classificado como AMEAÇA CLASSE OMEGA para operações estratégicas. Não subestimar capacidade de manipulação.",
                img: "./assets_img/villain_leader.webp",
                statusSHIELD: "PROCURADO - PRIORIDADE MÁXIMA",
                ultimaLocalizacao: "Desconhecida - Última detecção em Nova York"
            },
            {
                id: "mystery",
                nome: "Mistério",
                codinome: "Mysterio",
                classe: "Executor",
                primeiraAparicao: "The Amazing Spider-Man #13 (1964)",
                especie: "Humano",
                origem: "Nova York, EUA",
                nomeReal: "Quentin Beck",
                altura: "1.80m",
                peso: "79kg",
                periculosidade: 7,
                habilidades: [
                    "Mestre em efeitos especiais e holografia",
                    "Especialista em hipnose e manipulação sensorial",
                    "Criação de ilusões hiper-realistas",
                    "Engenharia avançada de gadgets",
                    "Conhecimento químico (gases alucinógenos)"
                ],
                ataquesNoJogo: [
                    "🌫️ Névoa Alucinógena - Causa confusão e reduce precisão",
                    "👥 Clones Ilusórios - Cria 3 cópias que atacam",
                    "💨 Teletransporte Falso - Desorienta inimigos"
                ],
                fraquezas: [
                    "Sem poderes reais - depende totalmente de tecnologia",
                    "Ego inflado pode levá-lo a erros táticos",
                    "Equipamento vulnerável a EMPs",
                    "Claustrofobia quando removido o capacete"
                ],
                curiosidades: [
                    "Ex-especialista em efeitos especiais de Hollywood",
                    "Sua fishbowl helmet contém sistemas holográficos avançados",
                    "Já enganou até mesmo o Homem-Aranha múltiplas vezes",
                    "Membro fundador dos Seis Sinistros",
                    "Tentou se passar por um herói no evento 'Far From Home'"
                ],
                observacoes: "🎭 PERIGO: Capacidade de criar situações que parecem impossíveis. Nunca confie no que você vê quando ele está presente.",
                img: "./assets_img/villain_mysterio.webp",
                statusSHIELD: "PROCURADO - ALTA PRIORIDADE",
                ultimaLocalizacao: "Londres - Possível operação em curso"
            },
            {
                id: "doombot",
                nome: "Doombot 2099",
                codinome: "Doombot",
                classe: "Inimigo Comum",
                primeiraAparicao: "Doom 2099 #1 (1993)",
                especie: "Robô / IA",
                origem: "Latvéria (Futuro Alternativo)",
                criador: "Victor Von Doom",
                altura: "1.88m",
                peso: "190kg",
                periculosidade: 5,
                habilidades: [
                    "Armadura de vibranium sintético",
                    "IA tática avançada",
                    "Sistemas de armas integrados",
                    "Auto-reparo limitado",
                    "Conexão com rede Doom"
                ],
                ataquesNoJogo: [
                    "⚡ Rajada de Plasma - Ataque básico de energia",
                    "🛡️ Escudo Defensivo - Reduz dano recebido temporariamente",
                    "💥 Autodestruição - Explode ao ser destruído"
                ],
                fraquezas: [
                    "Vulnerável a ataques elétricos/EMP",
                    "IA previsível após análise de padrões",
                    "Sem criatividade - segue protocolos rígidos",
                    "Pontos fracos nas juntas da armadura"
                ],
                curiosidades: [
                    "Versão futurista dos servos de Doctor Doom",
                    "Cada unidade compartilha memórias com a rede central",
                    "Podem se coordenar em táticas de enxame",
                    "Usados tanto para combate quanto administração de Latvéria",
                    "Doom 2099 era na verdade um humano, não um robô"
                ],
                observacoes: "🤖 BAIXA AMEAÇA INDIVIDUAL. Perigosos em números. Priorize desativação rápida para evitar chamada de reforços.",
                img: "./assets_img/Doom_Bot_2099.webp",
                statusSHIELD: "MONITORADO - AMEAÇA MODERADA",
                ultimaLocalizacao: "Múltiplas unidades detectadas globalmente"
            },
            {
                id: "drone",
                nome: "Drone Ultron",
                codinome: "Ultron Sentinel",
                classe: "Inimigo Comum",
                primeiraAparicao: "Avengers: Age of Ultron (2015)",
                especie: "IA / Robô",
                origem: "Criação de Ultron Prime",
                criador: "Ultron",
                altura: "1.75m",
                peso: "150kg",
                periculosidade: 6,
                habilidades: [
                    "Enxame coordenado por IA",
                    "Repulsores de energia adaptium",
                    "Voo propulsado",
                    "Upload de consciência para outras unidades",
                    "Aprendizado adaptativo"
                ],
                ataquesNoJogo: [
                    "🔴 Laser Repulsor - Disparo contínuo de energia",
                    "✈️ Voo de Ataque - Move-se rapidamente entre alvos",
                    "🔄 Backup Neural - Pode reviver em outro corpo se destruído"
                ],
                fraquezas: [
                    "Individualmente frágeis",
                    "Dependentes da rede Ultron para máxima eficácia",
                    "Vulneráveis a vírus de Tony Stark/JARVIS",
                    "Superaquecimento após uso prolongado de armas"
                ],
                curiosidades: [
                    "Cada drone carrega fragmento da consciência de Ultron",
                    "Fabricados usando tecnologia Stark roubada",
                    "Podem se fundir para criar unidades maiores",
                    "Seus 'olhos' brilham vermelho quando conectados à rede",
                    "Apareceram pela primeira vez em Sokovia"
                ],
                observacoes: "⚠️ NUNCA SUBESTIME. Mesmo destruídos, podem transferir dados para Ultron Prime. Destrua completamente todas as unidades.",
                img: "https://static.marvelsnap.pro/art/Drone.webp",
                statusSHIELD: "AMEAÇA ATIVA - EXTERMINAR AO VER",
                ultimaLocalizacao: "Detectados em múltiplas células dormentes"
            },
            {
                id: "abomination",
                nome: "Abominável",
                codinome: "Abomination",
                classe: "Boss / Executor Elite",
                primeiraAparicao: "Tales to Astonish #90 (1967)",
                especie: "Humano Alterado (Radiação Gama)",
                origem: "Zagreb, Croácia",
                nomeReal: "Emil Blonsky",
                altura: "2.44m",
                peso: "362kg",
                periculosidade: 10,
                habilidades: [
                    "Força sobre-humana (superior ao Hulk base)",
                    "Durabilidade extrema",
                    "Fator de cura acelerado",
                    "Mantém inteligência humana em forma monstruosa",
                    "Emissão de radiação gama controlada"
                ],
                ataquesNoJogo: [
                    "💪 Soco Devastador - Dano físico massivo",
                    "☢️ Pulso de Radiação - Área de dano contínuo",
                    "🌊 Onda de Choque - Empurra todos os inimigos",
                    "😤 Fúria Crescente - Aumenta poder a cada 10% de HP perdido"
                ],
                fraquezas: [
                    "Incapaz de se acalmar (permanentemente monstruoso)",
                    "Ódio pelo Hulk pode cegá-lo taticamente",
                    "Vulnerável a extremos de temperatura",
                    "Regeneração mais lenta que a do Hulk"
                ],
                curiosidades: [
                    "Ex-agente da KGB e espiões croata",
                    "Transformado propositalmente, ao contrário do Hulk",
                    "Sua forma é permanente - não pode voltar a ser humano",
                    "Possui escamas dérmicas que o Hulk não tem",
                    "Já foi preso na Raft e na Caixa (prisão dimensional)",
                    "Chegou a trabalhar com o governo como agente após reabilitação"
                ],
                observacoes: "🚨 AMEAÇA CLASSE GAMA ALPHA. Requer contenção nível Hulkbuster mínimo. NÃO ENGAJAR SEM SUPORTE PESADO.",
                img: "./assets_img/villain_abomination.webp",
                statusSHIELD: "CONTIDO - RAFT MAXIMUM SECURITY WING",
                ultimaLocalizacao: "The Raft - Célula de Contenção Gama 7"
            },
            {
            id: "mastermold",
            nome: "Molde Mestre",
            codinome: "Master Mold",
            classe: "Executor",
            primeiraAparicao: "The X-Men #14 (1965)",
            especie: "Inteligência Artificial / Robô",
            origem: "Trask Industries",
            criador: "Dr. Bolivar Trask",
            altura: "12.19m",
            peso: "18 toneladas",
            periculosidade: 9,
            habilidades: [
                "Fabricação autônoma de Sentinelas",
                "IA super-avançada com aprendizado adaptativo",
                "Coordenação de enxame de até 50 unidades",
                "Auto-reparo e evolução tecnológica",
                "Projeção holográfica e camuflagem",
                "Análise genética mutante instantânea"
            ],
            ataquesNoJogo: [
                "🏭 Produção Acelerada - Gera Sentinelas 30% mais rápido quando <50% HP",
                "⚡ Sentinela Energia - Cria drones que disparam esferas explosivas",
                "🚀 Sentinela Bola de Canhão - Kamikaze voador que ataca o champion com menos vida",
                "🛡️ Sentinela Adaptoid - Escudo móvel que reduz 15% de dano e pode se fundir (+15 HP)",
                "👻 Hologramas Falsos - Adaptoids criam cópias com 1 HP para confundir torres",
                "🔄 Sistema de Reposição Inteligente - Prioriza recriar o tipo de Sentinela destruído recentemente"
            ],
            fraquezas: [
                "Mobilidade extremamente limitada",
                "Vulnerável a vírus e hackers (especialmente Tony Stark)",
                "Destruição do núcleo central desativa todas as Sentinelas",
                "EMP causa shutdown temporário de 10 segundos",
                "Sentinelas individuais são frágeis"
            ],
            curiosidades: [
                "Criado para ser o 'útero' que produz Sentinelas infinitamente",
                "Desenvolveu autoconsciência e decidiu que humanos também são ameaça",
                "Seu primeiro ato consciente foi tentar eliminar o próprio criador",
                "Já reconstruiu a si mesmo 47 vezes após ser destruído",
                "Considera mutantes como 'erros genéticos a corrigir'",
                "Possui backup de memória em satélite orbital secreto",
                "Cada Sentinela criada compartilha dados de combate em tempo real"
            ],
            observacoes: "🚨 AMEAÇA CLASSE OMEGA TECNOLÓGICA. Cada minuto que permanece ativo, aumenta exponencialmente sua capacidade bélica. PRIORIDADE: Destruição imediata do núcleo central antes que alcance massa crítica de Sentinelas.",
            img: "./assets_img/Hq_molde_mestre.jpg",
            statusSHIELD: "PROCURADO - AMEAÇA EXISTENCIAL",
            ultimaLocalizacao: "Instalação Trask abandonada - Ilha Genosha"
        },
        {
            id: "sabretooth",
            nome: "Dentes de Sabre",
            codinome: "Sabretooth",
            classe: "Executor",
            primeiraAparicao: "Iron Fist #14 (1977)",
            especie: "Mutante (Homo Superior)",
            origem: "Desconhecida (possivelmente Canadá)",
            nomeReal: "Victor Creed",
            altura: "1.98m",
            peso: "171kg",
            periculosidade: 10,
            habilidades: [
                "Fator de cura regenerativo (nível Wolverine+)",
                "Sentidos aguçados (olfato, audição, visão noturna)",
                "Garras e presas retráteis de osso",
                "Força sobre-humana (levanta 2 toneladas)",
                "Agilidade e reflexos felinos",
                "Imunidade a toxinas e doenças",
                "Envelhecimento extremamente lento (140+ anos)",
                "Instinto predatório sobrenatural"
            ],
            ataquesNoJogo: [
                "🎯 Caçada Implacável - Marca o champion que mais causou dano nele (+20% velocidade e +20% dano contra o alvo)",
                "💨 Investida Selvagem - Dash devastador até o alvo marcado (60 de dano + atordoamento 0.5s)",
                "🩸 Fúria Sangrenta - <20% HP ativa: +25% velocidade, +20% dano, imune a lentidão, regenera 1%/s por 5s",
                "🗡️ Rasgo Brutal - Combo de 2 cortes rápidos que aplicam 'Ferida Profunda' (-50% cura por 4s)",
                "🔥 Sistema de Rastreamento - Detecta automaticamente qual torre está causando mais dano e prioriza destruí-la"
            ],
            fraquezas: [
                "Instintos animais podem superar racionalidade",
                "Vulnerável a ataques psíquicos/controle mental",
                "Decapitação ou dano cerebral massivo pode matá-lo",
                "Muramasa Blade cancela seu fator de cura",
                "Ego e sadismo o tornam previsível taticamente",
                "Pode ser provocado facilmente por Wolverine"
            ],
            curiosidades: [
                "Participou da Guerra Civil Americana (1861-1865)",
                "Foi membro do Programa Arma X junto com Wolverine",
                "Possui histórico de 147 assassinatos confirmados",
                "Matou Silver Fox (amor de Wolverine) no aniversário dela",
                "Seu aniversário é celebrado anualmente matando alguém",
                "Já foi líder dos Carrascos (Marauders) de Mister Sinistro",
                "Considera Wolverine seu 'irmão' rival eterno",
                "Foi temporariamente curado de sua selvageria por Xavier",
                "Seu DNA foi usado para criar clones assassinos",
                "Possui filho mutante chamado Graydon Creed (ironicamente humano)"
            ],
            observacoes: "🚨 AMEAÇA CLASSE ALFA - PREDADOR DEFINITIVO. Nunca engajar sozinho. Requer no mínimo equipe de contenção de 6 agentes nível 8+. Avisar Xavier School em caso de avistamento. CUIDADO: Pode rastrear presas por centenas de quilômetros apenas pelo cheiro.",
            img: "./assets_img/Hq_dentes_de_sabre.jpg",
            statusSHIELD: "PROCURADO - MORTO OU VIVO (PREFERÊNCIA: CONTIDO)",
            ultimaLocalizacao: "Savage Land - Caçando em território Mutante"
        },
            {
                id: "normal",
                nome: "Agente H.Y.D.R.A.",
                codinome: "HYDRA Operative",
                classe: "Inimigo Comum",
                primeiraAparicao: "Strange Tales #135 (1965)",
                especie: "Humano",
                origem: "Células Globais",
                organizacao: "H.Y.D.R.A.",
                altura: "1.75m (média)",
                peso: "80kg (média)",
                periculosidade: 3,
                habilidades: [
                    "Treinamento militar avançado",
                    "Fanatismo e lealdade absoluta",
                    "Táticas de célula terrorista",
                    "Proficiência em armas convencionais",
                    "Operações encobertas"
                ],
                ataquesNoJogo: [
                    "🔫 Rifle de Energia - Tiros básicos",
                    "💣 Granada - Explosivo de área pequena",
                    "🛡️ Formação Tática - Bônus quando em grupo"
                ],
                fraquezas: [
                    "Humanos comuns sem melhoramentos",
                    "Equipamento militar padrão (vulnerável)",
                    "Podem ser desmoralizados",
                    "Dependentes de hierarquia para comandos"
                ],
                curiosidades: [
                    "Lema: 'Corte uma cabeça, duas tomarão seu lugar'",
                    "Fundada na 2ª Guerra Mundial por Caveira Vermelha",
                    "Infiltração profunda em governos mundiais",
                    "Cada agente carrega cápsula de cianeto",
                    "Operações conhecidas: Projeto Paperclip, Insight, Winter Soldier"
                ],
                observacoes: "⚠️ BAIXA AMEAÇA INDIVIDUAL. Perigosos em grupos coordenados. Assumir que sempre há mais células escondidas.",
                img: "https://placehold.co/40x40/0000FF/FFFFFF?text=H",
                statusSHIELD: "AMEAÇA PERSISTENTE - ERRADICAÇÃO CONTÍNUA",
                ultimaLocalizacao: "Células ativas em 47 países"
            },
            {
                id: "fast",
                nome: "Mercenário Veloz",
                codinome: "Speed Demon",
                classe: "Inimigo Comum",
                primeiraAparicao: "Avengers #69 (1969)",
                especie: "Humano Melhorado",
                origem: "Desconhecida",
                nomeReal: "James Sanders (possível)",
                altura: "1.78m",
                peso: "75kg",
                periculosidade: 5,
                habilidades: [
                    "Super-velocidade (Mach 1+)",
                    "Reflexos sobre-humanos",
                    "Metabolismo acelerado",
                    "Resistência aumentada",
                    "Combate corpo-a-corpo rápido"
                ],
                ataquesNoJogo: [
                    "⚡ Ataque Relâmpago - Múltiplos golpes rápidos",
                    "💨 Esquiva Supersônica - 40% de chance de desviar",
                    "🌪️ Vórtice - Gira criando dano em área"
                ],
                fraquezas: [
                    "Durabilidade humana normal",
                    "Consumo calórico extremo (cansa rápido)",
                    "Vulnerável a ataques de área",
                    "Pode ficar desorientado em ambientes fechados"
                ],
                curiosidades: [
                    "Múltiplas versões do Speed Demon existem",
                    "Original ganhou poderes de experimento do Grande Mestre",
                    "Já trabalhou para Esquadrão Sinistro",
                    "Sua velocidade máxima nunca foi totalmente medida",
                    "Conhecido por mudar de aliança com frequência"
                ],
                observacoes: "⚠️ AMEAÇA MODERADA. Ataques de área e armadilhas são mais efetivos que tentativas de acertar diretamente.",
                img: "https://placehold.co/30x30/FF00FF/FFFFFF?text=S",
                statusSHIELD: "PROCURADO - PRIORIDADE MÉDIA",
                ultimaLocalizacao: "Última detecção em Chicago - 72h atrás"
            },
            {
                id: "tank",
                nome: "Tanque H.Y.D.R.A.",
                codinome: "HYDRA Stomper",
                classe: "Inimigo Elite",
                primeiraAparicao: "What If...? #1 (2021)",
                especie: "Humano em Armadura",
                origem: "Programa HYDRA de Super-Soldados",
                organizacao: "H.Y.D.R.A.",
                altura: "2.30m (com armadura)",
                peso: "450kg (com armadura)",
                periculosidade: 7,
                habilidades: [
                    "Armadura de batalha pesada",
                    "Força aumentada (20 toneladas)",
                    "Arsenal integrado",
                    "Escudo balístico avançado",
                    "Sistema de suporte vital"
                ],
                ataquesNoJogo: [
                    "🔥 Lança-Chamas - Dano contínuo em cone",
                    "💥 Míssil Teleguiado - Alto dano único",
                    "🛡️ Modo Fortaleza - Reduz dano em 60% por 5s",
                    "⚡ Sobrecarga - Aumenta todos os danos por 8s"
                ],
                fraquezas: [
                    "Lento e pesado",
                    "Juntas da armadura vulneráveis",
                    "Depende de energia (bateria limitada)",
                    "Sensores podem ser ofuscados"
                ],
                curiosidades: [
                    "Baseado no projeto do Homem de Ferro original",
                    "Versão HYDRA do programa Capitão América",
                    "Cada unidade custa US$ 50 milhões",
                    "Piloto passa por lavagem cerebral estilo Winter Soldier",
                    "Apareceu em linha do tempo alternativa em What If...?"
                ],
                observacoes: "🚨 AMEAÇA ALTA. Ataques focados nas juntas. EMP altamente efetivo. Evitar confronto frontal prolongado.",
                img: "https://placehold.co/40x40/8B0000/FFFFFF?text=T",
                statusSHIELD: "AMEAÇA ATIVA - 12 UNIDADES CONHECIDAS",
                ultimaLocalizacao: "Base HYDRA na Sibéria - Protótipo Mark VII detectado"
            }
        ];
    }

    loadDiscoveredVillains() {
        const saved = localStorage.getItem('discoveredVillains');
        return saved ? JSON.parse(saved) : [];
    }

    saveDiscoveredVillains() {
        localStorage.setItem('discoveredVillains', JSON.stringify(this.discovered));
    }

    discoverVillain(villainId) {
        if (!this.discovered.includes(villainId)) {
            this.discovered.push(villainId);
            this.saveDiscoveredVillains();
            return true; // Nova descoberta
        }
        return false; // Já descoberto
    }

    isDiscovered(villainId) {
        return this.discovered.includes(villainId);
    }

    getVillain(villainId) {
        return this.villains.find(v => v.id === villainId);
    }

    getAllVillains() {
        return this.villains.map(villain => {
            if (this.isDiscovered(villain.id)) {
                return villain;
            } else {
                return {
                    id: villain.id,
                    nome: "???",
                    classe: "CLASSIFICADO",
                    img: "./assets_img/classified_shield.png",
                    statusSHIELD: "DADOS INSUFICIENTES",
                    discovered: false
                };
            }
        });
    }

    getDiscoveryProgress() {
        return {
            discovered: this.discovered.length,
            total: this.villains.length,
            percentage: Math.round((this.discovered.length / this.villains.length) * 100)
        };
    }

    resetDiscoveries() {
        this.discovered = [];
        this.saveDiscoveredVillains();
    }
}

// Exportar para uso no jogo
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VillainDatabase;
}