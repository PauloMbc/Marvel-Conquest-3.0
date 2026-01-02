// characterReactions.js
// Sistema de reações e personalidade dos champions

/**
 * 🎭 Sistema de Reações dos Champions
 * Gerencia falas, expressões e interações contextuais
 */
export default class CharacterReactionSystem {
    constructor(gameManager) {
        this.gameManager = gameManager;
        
        // Balões de fala ativos
        this.activeDialogues = [];
        
        // Cooldown para evitar spam
        this.lastReactionTime = {};
        this.reactionCooldown = 5000; // 5 segundos
        
        // Preview do menu (hover)
        this.menuPreview = null;
    }

    /**
     * 🎨 Retorna a cor temática de cada champion
     */
    getChampionColor(type) {
        const colors = {
            ironman: '#FFD700',        // Dourado
            thor: '#00BFFF',           // Azul elétrico
            loki: '#9370DB',           // Roxo
            redhulk: '#DC143C',        // Vermelho intenso
            emmafrost: '#E0FFFF',      // Azul gelo
            ultron: '#8B0000',         // Vermelho escuro
            captainmarvel: '#FFA500',  // Laranja dourado
            hawkeye: '#8B4513',        // Marrom
            usagent: '#000080',        // Azul marinho
            captainamerica: '#4169E1', // Azul royal
            wanda: '#FF1493',          // Rosa choque
            noturno: '#4B0082'         // Índigo
        };
        return colors[type] || '#FFFFFF';
    }

    /**
     * 📋 Banco de dados de falas por contexto
     */
    getDialogue(championType, context, ...args) {
        const dialogues = {
            ironman: {
                hover: ["Bilionário, gênio, filantropo.", "Já ouviu falar do Homem de Ferro?"],
                select: ["JARVIS, preparar sistemas.", "Vamos mostrar como se faz."],
                recruit: ["Tony Stark reportando. Qual é o plano?", "Alguém pediu um super-herói?"],
                ability1: ["Unibeam carregado!", "Tecnologia de ponta em ação!"],
                ability2: ["Iniciando voo orbital!", "Vamos ver de cima!"],
                lowHP: ["O traje está comprometido!", "Preciso de reparos!"],
                sell: ["Foi uma honra. Até a próxima.", "Saindo da missão."],
                death: ["Sistemas... falhando...", "Pepper... desculpa..."] // ✅ ADICIONAR
            },
            thor: {
                hover: ["Filho de Odin, Deus do Trovão.", "Mjolnir aguarda!"],
                select: ["Pelo Asgard!", "Trovão e honra!"],
                recruit: ["Thor, ao seu serviço!", "Pela glória de Asgard!"],
                ability1: ["Mjolnir, a mim!", "Pelo poder do trovão!"],
                lowHP: ["Não enquanto houver fôlego!", "Asgard não se rende!"],
                sell: ["Até breve, mortais.", "Retorno a Asgard."]
            },
            loki: {
                hover: ["Príncipe de Asgard. E do caos.", "Ilusões são minha especialidade."],
                select: ["Vocês não sabem no que estão se metendo...", "Confiem em mim. Ou não."],
                recruit: ["Loki, o Deus da Trapaça.", "Preparem-se para truques."],
                ability1: ["Ilusões! Quantos sou eu?", "Magia de Asgard!"],
                ability2: ["Variantes, apareçam!", "Eu sou legião!"],
                lowHP: ["Isso... foi planejado.", "Parte do plano!"],
                sell: ["Vocês não me merecem.", "Já cansei deste jogo."]
            },
            redhulk: {
                hover: ["General Ross. Transformado.", "Não me irrite."],
                select: ["HULK VERMELHO ESMAGA!", "Destruição garantida."],
                recruit: ["Red Hulk no campo!", "Preparem-se para o impacto!"],
                ability1: ["NUCLEAR STRIKE!", "DESTRUIÇÃO TOTAL!"],
                lowHP: ["Quanto mais dano... MAIS FORTE!", "FÚRIA ATIVADA!"],
                sell: ["Até logo, fracotes.", "Vou esmagar em outro lugar."]
            },
            emmafrost: {
                hover: ["Emma Frost. Telepata e diamante.", "Mente e matéria."],
                select: ["Lendo seus pensamentos...", "Modo psíquico ativo."],
                recruit: ["Emma Frost, reportando.", "Controle mental iniciado."],
                ability1: ["Forma de diamante!", "Impenetrável!"],
                ability2: ["Rajada mental!", "Suas mentes são minhas!"],
                lowHP: ["Preciso de suporte!", "Diamante quebrando!"],
                sell: ["Isso é um desperdício.", "Tenho coisas melhores a fazer."]
            },
            ultron: {
                hover: ["Ultron. Inevitável.", "A evolução chegou."],
                select: ["Sem cordas.", "Era de Ultron iniciada."],
                recruit: ["Ultron online.", "Preparando drones."],
                ability1: ["Drones, ataquem!", "Enxame ativado!"],
                ability2: ["Infestação em progresso...", "Nanobots liberados!"],
                lowHP: ["Iniciando reconstrução...", "Eu sempre volto."],
                sell: ["Não precisam de mim. Ainda.", "Temporariamente offline."]
            },
            captainmarvel: {
                hover: ["Carol Danvers. Binária.", "Energia cósmica!"],
                select: ["Avante mais alto!", "Sem limites!"],
                recruit: ["Capitã Marvel, pronta!", "Céu limpo!"],
                ability1: ["MÍSSIL HUMANO!", "IMPACTO TOTAL!"],
                lowHP: ["Absorvendo energia!", "Não desisto!"],
                sell: ["Missão cumprida.", "Voltando à base."]
            },
            hawkeye: {
                hover: ["Clint Barton. Olho de Falcão.", "Nunca erro."],
                select: ["Mira perfeita.", "Arco preparado."],
                recruit: ["Hawkeye na área!", "Olhos no alvo!"],
                ability1: ["Flecha explosiva!", "Alvo marcado!"],
                ability2: ["Kate, entre em ação!", "Tempestade de flechas!"],
                lowHP: ["Ficando sem flechas!", "Preciso recuar!"],
                sell: ["Missão encerrada.", "Até a próxima."]
            },
            usagent: {
                hover: ["John Walker. Novo Capitão.", "Mais duro que Steve."],
                select: ["US Agent, no comando!", "Disciplina e força!"],
                recruit: ["Walker reportando!", "Prontos para ação!"],
                ability1: ["Investida tática!", "Escudo carregado!"],
                lowHP: ["Não sou Steve, mas aguento!", "Mantendo posição!"],
                sell: ["Dispensado do dever.", "Retornando."]
            },
            captainamerica: {
                hover: ["Steve Rogers. O primeiro.", "Eu aguento o dia todo."],
                select: ["Vingadores, avante!", "Pela América!"],
                recruit: ["Capitão América, pronto!", "Nunca desistimos!"],
                ability1: ["Postura defensiva!", "Escudo levantado!"],
                ability2: ["Sam! Bucky! Vamos!", "A esquerda entra!"],
                lowHP: ["Não enquanto eu puder lutar!", "Avante!"],
                sell: ["O dever me chama em outro lugar.", "Até breve, soldados."]
            },
            wanda: {
                hover: ["Wanda Maximoff. Feiticeira.", "Realidade é relativa."],
                select: ["Caos controlado.", "Magia do caos pronta."],
                recruit: ["Wanda aqui.", "Hex ativa!"],
                ability1: ["Zona do caos!", "Confusão mental!"],
                ability2: ["Runas protetoras!", "Magia ancestral!"],
                lowHP: ["Realidade... se desfazendo...", "Preciso de ajuda!"],
                sell: ["Não sou mais necessária.", "Partindo."]
            },
            noturno: {
                hover: ["Kurt Wagner. Noturno.", "BAMF!"],
                select: ["Pela fé e pela espada!", "Teletransporte pronto!"],
                recruit: ["Noturno, reportando! BAMF!", "Mein Freund!"],
                ability1: ["Bamf Strike!", "Teletransporte surpresa!"],
                ability2: ["Pontos de ancoragem!", "Dança Noturna!"],
                lowHP: ["Acrobacias não bastam!", "Preciso de enxofre!"],
                sell: ["Auf Wiedersehen!", "BAMF! Saindo!"]
            }
        };

        const championDialogues = dialogues[championType];
        if (!championDialogues || !championDialogues[context]) {
            return null;
        }

        const options = championDialogues[context];
        return options[Math.floor(Math.random() * options.length)];
    }

    /**
     * ✅ Verifica se pode mostrar reação (cooldown)
     */
    canShowReaction(championId) {
        const now = Date.now();
        const lastTime = this.lastReactionTime[championId] || 0;
        
        if (now - lastTime < this.reactionCooldown) {
            return false;
        }
        
        this.lastReactionTime[championId] = now;
        return true;
    }

    /**
     * 💬 Cria um balão de fala
     */
    createDialogue(champion, text, duration = 3000) {
        if (!champion || !text) return;
        
        // Remove diálogos anteriores do mesmo champion
        this.activeDialogues = this.activeDialogues.filter(d => d.championId !== champion.id);
        
        this.activeDialogues.push({
            championId: champion.id,
            championType: champion.type,
            x: champion.getCenterX(),
            y: champion.getCenterY(),
            text: text,
            startTime: Date.now(),
            duration: duration,
            alpha: 0 // Fade in
        });
    }

    /**
     * 🖱️ Hover no menu
     */
    onMouseEnter(championType, iconElement) {
        const text = this.getDialogue(championType, 'hover');
        if (!text) return;
        
        const rect = iconElement.getBoundingClientRect();
        
        this.menuPreview = {
            type: championType,
            text: text,
            x: rect.right + 10,
            y: rect.top + rect.height / 2,
            startTime: Date.now()
        };
    }

    /**
     * 🖱️ Mouse sai do ícone
     */
    onMouseLeave(championType) {
        if (this.menuPreview && this.menuPreview.type === championType) {
            this.menuPreview = null;
        }
    }

    /**
     * 🎯 Champion selecionado
     */
    onSelect(champion) {
        if (!this.canShowReaction(champion.id)) return;
        
        const text = this.getDialogue(champion.type, 'select');
        this.createDialogue(champion, text, 2500);
    }

    /**
     * ❌ Champion desmarcado
     */
    onDeselect(champion) {
        if (!champion) return;
        
        // Remove diálogos do champion desmarcado
        this.activeDialogues = this.activeDialogues.filter(d => d.championId !== champion.id);
    }

    /**
     * 🆕 Champion recrutado
     */
    onRecruit(champion) {
        const text = this.getDialogue(champion.type, 'recruit');
        this.createDialogue(champion, text, 4000);
    }

    /**
     * 💀 Champion morreu
     */
    onChampionDeath(champion) {
        if (!champion) return;
        
        const text = this.getDialogue(champion.type, 'death') || "Não...!";
        this.createDialogue(champion, text, 2500);
    }

    /**
     * 🎖️ Champion subiu de nível
     */
    onLevelUp(champion, newLevel) {
        if (!champion) return;
        if (!this.canShowReaction(champion.id)) return;
        
        const texts = [
            `Nível ${newLevel}!`,
            `Evoluindo!`,
            `Mais forte!`
        ];
        
        const text = texts[Math.floor(Math.random() * texts.length)];
        this.createDialogue(champion, text, 2000);
    }

    /**
     * 💰 Champion ganhou dinheiro
     */
    onMoneyGained(champion, amount) {
        // Não mostra reação (evita spam)
    }
    /**
     * 👾 Inimigo eliminado por champion
     */
    onEnemyKilled(champion, enemy) {
        if (!champion) return;
        
        // Só mostra reação ocasionalmente (20% de chance)
        if (Math.random() > 0.2) return;
        if (!this.canShowReaction(champion.id)) return;
        
        const texts = [
            "Eliminado!",
            "Próximo!",
            "Limpeza feita!"
        ];
        
        const text = texts[Math.floor(Math.random() * texts.length)];
        this.createDialogue(champion, text, 1500);
    }
    /**
     * 🎮 Habilidade usada
     */
    onAbilityUse(champion, abilityNumber) {
        if (!this.canShowReaction(champion.id)) return;
        
        const text = this.getDialogue(champion.type, `ability${abilityNumber}`);
        if (text) {
            this.createDialogue(champion, text, 2000);
        }
    }


    /**
     * 🎯 Champion ativou ultimate
     */
    onUltimateUsed(champion) {
        if (!champion) return;
        if (!this.canShowReaction(champion.id)) return;
        
        const ultimateTexts = {
            ironman: "UNIBEAM COMPLETO!",
            thor: "PELO PODER DE ASGARD!",
            loki: "ILUSÕES TOTAIS!",
            redhulk: "EXPLOSÃO NUCLEAR!",
            emmafrost: "IMPACTO DE DIAMANTE!",
            ultron: "ENXAME TOTAL!",
            captainmarvel: "BINÁRIA ATIVADA!",
            hawkeye: "TEMPESTADE DE FLECHAS!",
            usagent: "INVESTIDA MÁXIMA!",
            captainamerica: "VINGADORES, AVANTE!",
            wanda: "MAGIA DO CAOS SUPREMA!",
            noturno: "DANÇA NOTURNA!"
        };
        
        const text = ultimateTexts[champion.type] || "ULTIMATE ATIVADA!";
        this.createDialogue(champion, text, 3000);
    }


    /**
     * 🆘 Champion precisa de ajuda
     */
    onChampionNeedsHelp(champion) {
        if (!champion) return;
        if (!this.canShowReaction(champion.id)) return;
        
        const texts = [
            "Preciso de suporte!",
            "Ajuda aqui!",
            "Não vou aguentar!"
        ];
        
        const text = texts[Math.floor(Math.random() * texts.length)];
        this.createDialogue(champion, text, 2500);
    }

    /**
     * 😎 Champion está dominando
     */
    onChampionDominating(champion) {
        if (!champion) return;
        if (!this.canShowReaction(champion.id)) return;
        
        const texts = [
            "Imparável!",
            "Destruição total!",
            "Domínio completo!"
        ];
        
        const text = texts[Math.floor(Math.random() * texts.length)];
        this.createDialogue(champion, text, 2500);
    }

    /**
     * ⚔️ Dois champions trabalhando juntos
     */
    onTeamwork(champion1, champion2) {
        if (!champion1 || !champion2) return;
        if (!this.canShowReaction(champion1.id)) return;
        
        const teamworkTexts = {
            ironman: { thor: "Boa, Point Break!", captainamerica: "Perfeito, Cap!" },
            thor: { ironman: "Bem feito, homem de lata!", loki: "Irmão...?" },
            captainamerica: { ironman: "Vingadores, atacar!", usagent: "Bom trabalho, Walker!" }
        };
        
        const dialogue = teamworkTexts[champion1.type]?.[champion2.type];
        if (dialogue) {
            this.createDialogue(champion1, dialogue, 2500);
        }
    }
    /**
     * 💸 Champion vendido
     */
    onSell(champion) {
        const text = this.getDialogue(champion.type, 'sell');
        this.createDialogue(champion, text, 2500);
    }

    /**
     * ❤️ Aliado com HP baixo
     */
    onAllyLowHP(allyChampion, selectedChampion) {
        if (!selectedChampion || selectedChampion.id === allyChampion.id) return;
        
        const text = this.getDialogue(allyChampion.type, 'lowHP');
        if (text) {
            this.createDialogue(allyChampion, text, 3000);
        }
    }

    /**
     * 💀 Aliado em perigo crítico
     */
    onAllyCriticalHP(allyChampion, selectedChampion) {
        this.onAllyLowHP(allyChampion, selectedChampion);
    }

    /**
     * 🏠 Base sob ataque
     */
    onBaseUnderAttack(selectedChampion) {
        if (!selectedChampion) return;
        if (!this.canShowReaction('base-' + selectedChampion.id)) return;
        
        const warnings = [
            "A base está em perigo!",
            "Defendam a base!",
            "Base sob ataque!"
        ];
        
        const text = warnings[Math.floor(Math.random() * warnings.length)];
        this.createDialogue(selectedChampion, text, 2500);
    }

    /**
     * 👾 Muitos inimigos na tela
     */
    onEnemySwarm(selectedChampion) {
        if (!selectedChampion) return;
        if (!this.canShowReaction('swarm-' + selectedChampion.id)) return;
        
        const texts = [
            "São muitos!",
            "Onda massiva!",
            "Preparem-se!"
        ];
        
        const text = texts[Math.floor(Math.random() * texts.length)];
        this.createDialogue(selectedChampion, text, 2000);
    }

    /**
     * 🌊 Início de fase
     */
    onWaveStart(phase, selectedChampion) {
        if (!selectedChampion) return;
        
        const texts = [
            `Fase ${phase} - Vamos lá!`,
            `Prontos para a fase ${phase}!`,
            `Fase ${phase} começou!`
        ];
        
        const text = texts[Math.floor(Math.random() * texts.length)];
        this.createDialogue(selectedChampion, text, 3000);
    }

    /**
     * ✅ Fase concluída
     */
    onWaveComplete(phase, selectedChampion) {
        if (!selectedChampion) return;
        
        const texts = [
            "Fase limpa!",
            "Vitória!",
            "Conseguimos!"
        ];
        
        const text = texts[Math.floor(Math.random() * texts.length)];
        this.createDialogue(selectedChampion, text, 3000);
    }

    /**
     * 🔄 Atualiza sistema (fade in/out)
     */
    update(deltaTime) {
        const now = Date.now();
        
        // Remove diálogos expirados
        this.activeDialogues = this.activeDialogues.filter(d => {
            const elapsed = now - d.startTime;
            return elapsed < d.duration;
        });
        
        // Atualiza fade in/out
        this.activeDialogues.forEach(d => {
            const elapsed = now - d.startTime;
            const fadeInTime = 300;
            const fadeOutTime = 500;
            
            if (elapsed < fadeInTime) {
                d.alpha = elapsed / fadeInTime;
            } else if (elapsed > d.duration - fadeOutTime) {
                d.alpha = (d.duration - elapsed) / fadeOutTime;
            } else {
                d.alpha = 1;
            }
        });
    }

    /**
     * 🎨 Desenha balões de fala
     */
    draw(ctx) {
        // Desenha preview do menu
        if (this.menuPreview) {
            this.drawMenuPreview(ctx);
        }
        
        // Desenha diálogos ativos
        this.activeDialogues.forEach(d => {
            this.drawDialogue(ctx, d);
        });
    }

    /**
     * 🎨 Desenha preview do menu (hover)
     */
    drawMenuPreview(ctx) {
        const p = this.menuPreview;
        
        ctx.save();
        ctx.globalAlpha = 0.9;
        
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        const padding = 12;
        const textWidth = ctx.measureText(p.text).width;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = 30;
        
        // Fundo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(p.x, p.y - boxHeight / 2, boxWidth, boxHeight);
        
        // Borda colorida
        ctx.strokeStyle = this.getChampionColor(p.type);
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y - boxHeight / 2, boxWidth, boxHeight);
        
        // Texto
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(p.text, p.x + padding, p.y);
        
        ctx.restore();
    }

    /**
     * 🎨 Desenha um balão de fala
     */
    drawDialogue(ctx, dialogue) {
        ctx.save();
        ctx.globalAlpha = dialogue.alpha;
        
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        const text = dialogue.text;
        const x = dialogue.x;
        const y = dialogue.y - 60; // Acima do champion
        
        const padding = 10;
        const textWidth = ctx.measureText(text).width;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = 28;
        
        // Balão de fala
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.roundRect(x - boxWidth / 2, y - boxHeight, boxWidth, boxHeight, 8);
        ctx.fill();
        
        // Borda colorida
        ctx.strokeStyle = this.getChampionColor(dialogue.championType);
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Pontinha do balão
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x, y + 10);
        ctx.lineTo(x + 8, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Texto
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, x, y - 7);
        
        ctx.restore();
    }
}