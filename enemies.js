    // enemies.js
    // Define a classe Enemy, que representa os inimigos no jogo.

    import { TextPopEffect } from './effects.js';
    import { Champion } from './champions.js';
    export class Enemy {
        constructor(id, x, y, type, data, path) {
            this.id = id;
            this.x = x;
            this.y = y;
            this.type = type;
            this.hp = data.hp;
            this.maxHp = data.hp;
            this.width = data.radius * 2;
            this.height = data.radius * 2;
            this.radius = data.radius;
            this.currentPathIndex = 0;

            // NOVO: Sistema de ataque - USA DADOS DO TIPO
            this.attackRange = 300; // ⭐ Usa do data
            this.attackCooldown = 0;
            this.attackSpeed = 2000; // ⭐ Usa do data
            
            
            // CORREÇÃO: Velocidade agora vem de data.speed
            this.vel = data.speed || 50;
            
            this.data = data;
            this.path = path;
            this.pathIndex = 0;
            this.targetX = path[0].x;
            this.targetY = path[0].y;
            this.isAlive = true;
            this.passedBase = false;
            this.isDestroyed = false;
            this.lastAttacker = null;

            // Status de debuff
            this.isStunned = false;
            this.stunEndTime = 0;
            this.isHacked = false; // <-- ADICIONE ESTA LINHA SE NÃO EXISTIR
            this.hackEndTime = 0; // <-- ADICIONE ESTA LINHA SE NÃO EXISTIR
            
            this.isConfused = false;
            this.confuseEndTime = 0;
            this.confuseMoveDuration = 200;
            this.lastConfuseMoveTime = 0;
            this.randomMove = { dx: 0, dy: 0 };
            
            this.isPoisoned = false;
            this.poisonEndTime = 0;
            this.poisonDamagePerTick = 0;
            this.poisonTickRate = 0;
            this.lastPoisonTick = 0;
            
            this.isBleeding = false;
            this.bleedDamagePerTick = 0;
            this.bleedTickRate = 0;
            this.lastBleedTick = 0;
            this.bleedEndTime = 0;
            
            this.isSlowed = false;
            this.slowFactor = 1; // 1 = velocidade normal, 0.5 = 50% slow
            this.slowEndTime = 0;
            
            this.isDisarmed = false;
            this.disarmEndTime = 0;
            
            this.isConfuso = false;
            this.confusoEndTime = 0;
            
            this.isHacked = false;
            this.hackedEndTime = 0;
            this.nanobotDamageReduction = 0;
            
            this.isMindControlled = false;
            this.mindControlEndTime = 0;
            
            this.isDebuffImmune = false;
            this.debuffImmuneEndTime = 0;

            this.isDead = false;
            this.isBoss = data.isBoss || false;

            // Buffs
            this.damageReductionBuff = 0;

            // Carregamento da Imagem
            this.image = new Image();
            this.image.src = data.imagePath;
            this.image.onerror = () => {
                console.error(`[Enemy] Erro ao carregar imagem para o inimigo: ${type} em ${data.imagePath}. Usando fallback.`);
                this.image.isFallback = true;
            };

            this.gameManager = null;
        }

        getCenterX() {
            return this.x + this.radius;
        }

        getCenterY() {
            return this.y + this.radius;
        }

        takeDamage(amount, source = null, armorPen = 0) {
                      
            if (typeof amount !== 'number' || isNaN(amount)) {
                console.error('❌ Enemy takeDamage recebeu valor inválido:', amount);
                return;
            }
            let finalDamage = amount;

            // ⭐ NOVO: Bônus de dano se capturado por Left Wing
            if (this.isCapturedByLeftWing && this.leftWingDamageMultiplier) {
                finalDamage *= this.leftWingDamageMultiplier;
            }

            if (this.nanobotDamageReduction < 0) {
                finalDamage *= (1 + this.nanobotDamageReduction);
            }

            if (this.damageReductionBuff > 0) {
                finalDamage *= (1 - this.damageReductionBuff);
            }

            // ⏳ MARCA PARA CONVERSÃO SE MORRER CONGELADO
            if (this.isFrozenByTime && finalDamage >= this.hp) {
                this.wasFrozenByTime = true; // Garante que está marcado
                console.log('⏳ Inimigo morto enquanto congelado:', this.type, this.id);
            }   

            this.hp -= finalDamage;

            if (this.hp <= 0) {
                this.hp = 0;
                console.log('💀 Inimigo morreu:', this.type, 'wasFrozenByTime:', this.wasFrozenByTime);
            }

            this.lastAttacker = source;
            
            // Rastreia dano para nano-cordas
            this.recentDamage = (this.recentDamage || 0) + finalDamage;
            
            if (this.hp <= 0) {
                this.isDestroyed = true;
            }
            
            if (this.gameManager && this.gameManager.effects) {
                // ⭐ Cor diferente se capturado
                const color = this.isCapturedByLeftWing ? 'gold' : 'red';
                
                this.gameManager.effects.push(new TextPopEffect(
                    this.getCenterX(), 
                    this.getCenterY() - 10, 
                    `${finalDamage.toFixed(0)}`, 
                    color, 
                    500
                ));
            }
            
        // 🔴 NOVO: Joia da Realidade ignora resistências
        if (this.realityDebuff && Date.now() < this.realityDebuff.endTime) {
            // Se source for Infinity Ultron, ignora armadura COMPLETAMENTE
            if (source && source.type === 'infinityultron') {
                // Não aplica redução de armadura
            } else {
                // Outros champions ganham 50% de armor penetration
                armorPen = Math.max(armorPen, this.realityDebuff.resistanceReduction);
            }
        } else {
            // Lógica normal de armadura...
            const effectiveArmor = Math.max(0, this.armor * (1 - armorPen));
            const damageReduction = effectiveArmor / (100 + effectiveArmor);
            finalDamage *= (1 - damageReduction);
        }

       // ⏳ NOVO: Dano dobrado durante Prisão Temporal (apenas de Infinity Ultron)
        if (this.timeVulnerable && source && source.type === 'infinityultron') {
            // ✅ ACESSO SEGURO SEM IMPORTAR Champion
            const timeStoneData = source.gameManager?.Champion?.championData?.infinityultron?.timeStone;
            
            if (timeStoneData) {
                finalDamage *= timeStoneData.damageMultiplier; // 2x dano
                
                // Efeito visual de dano temporal
                if (this.gameManager && this.gameManager.effects) {
                    this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                        this.getCenterX(),
                        this.getCenterY() - 40,
                        '⏳ TEMPORAL!',
                        'lime',
                        800
                    ));
                }
            } else {
                // Fallback: se não conseguir acessar, usa 2x mesmo assim
                finalDamage *= 2.0;
            }
        }
}

        applyHack(duration) {
            // Implementa a lógica do debuff de Hack (ex: redução de velocidade, dano contínuo, etc.)
            
            // Define o status de hackeado
            this.isHacked = true;
            this.hackEndTime = Date.now() + duration;

            // Lógica adicional do Hack (Ex: Slow temporário, como exemplo)
            // Se o hack for um Slow
            this.isSlowed = true;
            this.slowFactor = 0.5; // Exemplo de 50% de slow
            this.slowEndTime = this.hackEndTime;

            // Você deve adicionar a lógica específica do "Hack" aqui.
            // O status visual (o ícone 🤖) já parece estar sendo tratado na função draw do Enemy
            // (conforme snippet do enemies.js: `if (this.isHacked) { ... this.ctx.fillText('🤖', 5, 5); }`)
        }


        applyStun(duration) {
            if (!this.isDebuffImmune) {
                this.isStunned = true;
                this.stunEndTime = Date.now() + duration;
            }
        }

        applyConfuse(duration) {
            if (!this.isDebuffImmune) {
                this.isConfused = true;
                this.confuseEndTime = Date.now() + duration;
                this.lastConfuseMoveTime = 0;
            }
        }

        applyPoison(damagePerTick, duration, tickRate) {
            if (!this.isDebuffImmune) {
                this.isPoisoned = true;
                this.poisonDamagePerTick = damagePerTick;
                this.poisonTickRate = tickRate;
                this.lastPoisonTick = Date.now();
                this.poisonEndTime = Date.now() + duration;
            }
        }

        applyBleed(damagePerTick, duration) {
            if (!this.isDebuffImmune) {
                this.isBleeding = true;
                this.bleedDamagePerTick = damagePerTick;
                this.bleedTickRate = 1000;
                this.lastBleedTick = Date.now();
                this.bleedEndTime = Date.now() + duration;
            }
        }

        // NOVO MÉTODO: Aplica Slow
        applySlow(factor, duration) {
            // Aplica o MAIOR fator de lentidão (menor valor de fator)
            if (Date.now() < this.slowEndTime) {
                this.slowFactor = Math.min(this.slowFactor, factor);
            } else {
                this.slowFactor = factor;
            }
            this.isSlowed = true;
            this.slowEndTime = Date.now() + duration;
        }   

        applyDisarm(duration) {
            if (!this.isDebuffImmune) {
                this.isDisarmed = true;
                this.disarmEndTime = Date.now() + duration;
            }
        }

        applyDisorient(duration) {
            if (!this.isDebuffImmune) {
                this.isConfuso = true;
                this.confusoEndTime = Date.now() + duration;
            }
        }

        applyInfest(duration, damageReduction) {
            if (!this.isDebuffImmune) {
                this.isHacked = true;
                this.hackedEndTime = Date.now() + duration;
                this.nanobotDamageReduction = damageReduction;
            }
        }

        applyMindControl(duration) {
            if (!this.isDebuffImmune) {
                this.isMindControlled = true;
                this.mindControlEndTime = Date.now() + duration;
            }
        }

        applyBuff(type, value, duration) {
            if (type === 'damageReduction') {
                this.damageReductionBuff = value;
                this.damageReductionBuffEndTime = Date.now() + duration;
            }
        }

        update(deltaTime) {
            const now = Date.now(); 
    
            if (this.hp <= 0) {
                this.isDestroyed = true;
                return;
            }
            
            // Limpa debuffs expirados
            if (this.isStunned && Date.now() > this.stunEndTime) {
                this.isStunned = false;
            }
            // ⭐ NOVO: Limpa efeitos de Kate Bishop
            if (this.isTrapped && now > this.trapEndTime) {
                this.isTrapped = false;
            }
                    
             if (this.isBlinded && now > this.blindEndTime) {
                this.isBlinded = false;
                this.accuracyReduction = 0;
            }
            
            if (this.isShootingInterrupted && now > this.interruptEndTime) {
                this.isShootingInterrupted = false;
            }
            
            // Reseta dano recente
            if (this.recentDamage) {
                this.recentDamage *= 0.95; // Decai rapidamente
            }
                // Se isConfuso e isConfused forem o mesmo debuff: USE APENAS UM.
            // Assumindo que isConfused é o correto (limpando o isConfuso também, por segurança)
            if (this.isConfused && now > this.confuseEndTime) {
                this.isConfused = false;
            }
            if (this.isConfuso && now > this.confusoEndTime) {
                this.isConfuso = false;
            }
            if (this.isPoisoned && Date.now() > this.poisonEndTime) {
                this.isPoisoned = false;
            }
            if (this.isBleeding && Date.now() > this.bleedEndTime) {
                this.isBleeding = false;
            }
        // Limpa Slow
            if (this.isSlowed && now > this.slowEndTime) {
                this.isSlowed = false;
                this.slowFactor = 1;
            }
            if (this.isDisarmed && Date.now() > this.disarmEndTime) {
                this.isDisarmed = false;
            }
            
            if (this.isHacked && Date.now() > this.hackedEndTime) {
                this.isHacked = false;
                this.nanobotDamageReduction = 0;
            }
            if (this.isMindControlled && Date.now() > this.mindControlEndTime) {
                this.isMindControlled = false;
            }
            if (this.damageReductionBuff > 0 && Date.now() > this.damageReductionBuffEndTime) {
                this.damageReductionBuff = 0;
            }

            // --- DANO PERIÓDICO ---
            // Aplica dano de veneno/sangramento (OK)
            if (this.isPoisoned && now - this.lastPoisonTick > this.poisonTickRate) {
                this.takeDamage(this.poisonDamagePerTick, { id: 'poison', type: 'effect' });
                this.lastPoisonTick = now;
            }
            if (this.isBleeding && now - this.lastBleedTick > this.bleedTickRate) {
                this.takeDamage(this.bleedDamagePerTick, { id: 'bleed', type: 'effect' });
                this.lastBleedTick = now;
            } 
            // No método update() da classe Enemy, ADICIONE antes do movimento:

            // 💠 Sistema de Puxão pela Joia do Espaço
            if (this.isPulledBySpaceStone && this.spaceStoneTarget) {
                const targetX = this.spaceStoneTarget.x;
                const targetY = this.spaceStoneTarget.y;
                const dist = Math.hypot(targetX - this.getCenterX(), targetY - this.getCenterY());
                
                if (dist > 30) {
                    // Puxa em direção ao Ultron
                    const angle = Math.atan2(targetY - this.getCenterY(), targetX - this.getCenterX());
                    const pullAmount = this.spaceStonePullSpeed * (deltaTime / 1000);
                    
                    this.x += Math.cos(angle) * pullAmount;
                    this.y += Math.sin(angle) * pullAmount;
                    
                    // Efeito visual de arrasto
                    if (Math.random() < 0.2) {
                        this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                            this.getCenterX(),
                            this.getCenterY(),
                            15,
                            'cyan',
                            300
                        ));
                    }
                } else {
                    // Chegou perto, para o puxão
                    this.isPulledBySpaceStone = false;
                    this.vel = this.originalSpeed;
                }
            }

              // ⭐ CORREÇÃO: Verifica se chegou ao final do mapa
            if (this.pathIndex >= this.path.length) {
                if (!this.reachedEnd) {
                    this.reachedEnd = true;
                    this.passedBase = true;
                    
                    // ⭐ USA 'this' ao invés de 'enemy'
                    if (this.gameManager) {
                        this.gameManager.baseHealth -= 5;
                        
                        // Efeito visual de perda de vida
                        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                            this.gameManager.canvas.width / 2,
                            50,
                            '-5 VIDA!',
                            'red',
                            1500
                        ));
                        
                        // Animação de dano na tela
                        for (let i = 0; i < 15; i++) {
                            const angle = (Math.PI * 2 / 15) * i;
                            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                                this.gameManager.canvas.width / 2 + Math.cos(angle) * 30,
                                50 + Math.sin(angle) * 30,
                                20,
                                'red',
                                800
                            ));
                        }
                        
                        this.gameManager.showUI(`⚠️ Inimigo ${this.type} passou! -5 de vida da base!`, 'error');
                        this.gameManager.updateUI();
                        
                        // ⭐ Verifica Game Over
                        if (this.gameManager.baseHealth <= 0) {
                            this.gameManager.isGameOver = true;
                            this.gameManager.showUI("💀 GAME OVER! A base foi destruída.", 'error');
                            this.gameManager.isPaused = true;
                        }
                    }
                }
                return;
            }
            

            // MOVIMENTO - Simplificado e corrigido
            if (!this.isAlive) return;

            // Se estiver atordoado, não se move
            if (this.isStunned || this.isDestroyed) return; 

            // Calcula velocidade efetiva
            let currentSpeed = this.vel;
            if (this.isSlowed) {
                currentSpeed *= (this.slowFactor);
            }

            const moveAmount = currentSpeed * (deltaTime / 1000);

        // Se estiver confuso, tem um movimento aleatório de curta duração
            if (this.isConfused) {
                if (now - this.lastConfuseMoveTime > this.confuseMoveDuration) {
                    this.targetX = this.x + (Math.random() - 0.5) * 50;
                    this.targetY = this.y + (Math.random() - 0.5) * 50;
                    this.lastConfuseMoveTime = now;
                }
            } else if (this.pathIndex < this.path.length) {
                // Move para o próximo ponto do caminho (padrão)
                this.targetX = this.path[this.pathIndex].x;
                this.targetY = this.path[this.pathIndex].y;
            } else {
                // Chegou ao fim do caminho (base)
                this.passedBase = true;
                this.isDestroyed = true; 
                return;
            }
        
            // Movimento normal ao longo do caminho
            const targetPoint = { x: this.targetX, y: this.targetY };
            const dx = targetPoint.x - this.x; // Usando this.x/y para movimento
            const dy = targetPoint.y - this.y;
            const distance = Math.hypot(dx, dy);

            if (distance <= moveAmount) {
                // Chegou ao ponto, avança para o próximo
                this.x = targetPoint.x;
                this.y = targetPoint.y;
                
                // Só avança o pathIndex se não estiver confuso, e se houver mais pontos
                if (!this.isConfused && this.pathIndex < this.path.length) { 
                    this.pathIndex++;
                }
                
                if (!this.isConfused && this.pathIndex >= this.path.length) {
                    this.passedBase = true;
                    this.isAlive = false;
                    this.isDestroyed = true; 
                }
            } else {
                // Move em direção ao ponto
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * moveAmount;
                this.y += Math.sin(angle) * moveAmount;
            }

        // NOVO: Sistema de ataque aos campeões
   
// NOVO: Sistema de ataque aos campeões
// Em enemies.js - No final do método update(), SUBSTITUA toda a seção de ataque:

// NOVO: Sistema de ataque aos campeões
if (this.attackCooldown > 0) {
    this.attackCooldown -= deltaTime;
}

if (this.attackCooldown <= 0 && !this.isStunned && !this.isConfused) {
    // ⭐ MUDANÇA: Busca QUALQUER champion dentro do alcance
    let possibleTargets = [];
    
    if (this.gameManager && this.gameManager.champions) {
         //console.log('🔍 Inimigo', this.type, 'em', this.getCenterX().toFixed(0), ',', this.getCenterY().toFixed(0));
        //console.log('   Champions disponíveis:', this.gameManager.champions.length);
        
        let nearestChampion = null;
        let minDist = this.attackRange;
        
            
        this.gameManager.champions.forEach((champion, index) => {
            // ⭐ VERIFICAÇÃO DETALHADA
            if (!champion) {
                //console.log('   Champion', index, ': NULL');
                return;
            }
            
            if (champion.hp === undefined || champion.hp <= 0) {
                //console.log('   Champion', index, champion.type, ': MORTO (HP:', champion.hp, ')');
                return;
            }
            
            // Verifica se tem os métodos necessários
            if (!champion.getCenterX || !champion.getCenterY) {
                //console.log('   Champion', index, champion.type, ': SEM MÉTODOS getCenterX/Y');
                return;
            }
            
            const dist = Math.hypot(
                this.getCenterX() - champion.getCenterX(),
                this.getCenterY() - champion.getCenterY()
            );
            
            //console.log('   Champion', champion.type, 'dist:', dist.toFixed(1), '(alcance:', this.attackRange, ')');
            
            // ⭐ Só considera se está DENTRO DO ALCANCE
            if (dist < minDist) {
                minDist = dist;
                nearestChampion = champion;
            }
            // ⭐ SE ESTÁ NO ALCANCE, adiciona à lista
            if (dist < this.attackRange) {
                possibleTargets.push({
                    champion: champion,
                    distance: dist
                });
            }
        });
    }
    
    // Se encontrou champions no alcance, escolhe um aleatório
    if (possibleTargets.length > 0) {
        // ⭐ ALEATORIZA: Escolhe um target aleatório da lista
        const randomIndex = Math.floor(Math.random() * possibleTargets.length);
        const targetData = possibleTargets[randomIndex];
        const targetChampion = targetData.champion;
    
                  
        // Verifica redução de precisão (granada de fumaça)
        const missChance = this.accuracyReduction || 0;
        if (Math.random() > missChance) {
            const projectile = {
                x: this.getCenterX(),
                y: this.getCenterY(),
                targetX: targetChampion.getCenterX(),
                targetY: targetChampion.getCenterY(),
                speed: 300,
                damage: this.data.baseDamage || 5,
                owner: this,
                type: 'enemyBullet',
                radius: 5,
                color: 'red',
                spawnTime: Date.now(),
                lifespan: 3000
            };
            
            if (!this.gameManager.enemyProjectiles) {
                this.gameManager.enemyProjectiles = [];
            }
            
            this.gameManager.enemyProjectiles.push(projectile);
            //console.log('✅ Projétil criado! Total:', this.gameManager.enemyProjectiles.length);

        } else {
                //console.log('❌ Tiro errou devido à fumaça!');
            }
            
            this.attackCooldown = this.attackSpeed;
        } else {
            //console.log('❌ Nenhum champion no alcance de', this.attackRange);
        }
    } else {
        //console.log('❌ gameManager ou champions não existe!');
    }
}

        
draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

    // ⭐ NOVO: EFEITOS VISUAIS PARA INIMIGOS
    const time = Date.now() / 1000;
    
    // ===============================
    // AURA VERMELHA (inimigos comuns)
    // ===============================
    if (this.type !== 'tank') {
        const auraSize = 35 + Math.sin(time * 3) * 3;
        const auraGradient = ctx.createRadialGradient(
            this.radius, this.radius, 0,
            this.radius, this.radius, auraSize
        );
        auraGradient.addColorStop(0, 'rgba(255, 0, 0, 0.15)');
        auraGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(this.radius, this.radius, auraSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // ===============================
    // EFEITO ESPECIAL PARA TANKS (AURA ROXA)
    // ===============================
    if (this.type === 'tank') {
        const tankAuraSize = 45 + Math.sin(time * 2) * 5;
        const tankGradient = ctx.createRadialGradient(
            this.radius, this.radius, 0,
            this.radius, this.radius, tankAuraSize
        );
        tankGradient.addColorStop(0, 'rgba(139, 0, 0, 0.3)');
        tankGradient.addColorStop(0.5, 'rgba(139, 0, 0, 0.2)');
        tankGradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
        
        ctx.fillStyle = tankGradient;
        ctx.beginPath();
        ctx.arc(this.radius, this.radius, tankAuraSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Partículas orbitando
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 / 4) * i + time * 1.5;
            const particleDist = 30 + Math.sin(time * 4 + i) * 3;
            const px = this.radius + Math.cos(angle) * particleDist;
            const py = this.radius + Math.sin(angle) * particleDist;
            
            ctx.fillStyle = 'rgba(139, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // ===============================
    // EFEITO ESPECIAL PARA DRONES (ENERGIA AZUL)
    // ===============================
    if (this.type === 'drone') {
        const droneGlow = 0.5 + Math.sin(time * 5) * 0.3;
        ctx.strokeStyle = `rgba(100, 150, 255, ${droneGlow})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.radius, this.radius, this.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // ===============================
    // BORDA VERMELHA PARA TODOS
    // ===============================
    const borderPulse = 0.4 + Math.sin(time * 4) * 0.2;
    ctx.strokeStyle = `rgba(255, 50, 50, ${borderPulse})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
    ctx.shadowBlur = 8;
    
    if (this.type === 'tank') {
        // Borda mais grossa para tanks
        ctx.lineWidth = 3;
        ctx.shadowBlur = 12;
    }
    
    ctx.beginPath();
    ctx.arc(this.radius, this.radius, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ===============================
    // DESENHA A IMAGEM DO INIMIGO
    // ===============================
    if (this.image.complete && !this.image.isFallback) {
        ctx.drawImage(this.image, 0, 0, this.width, this.height);
    } else {
        // Fallback para um círculo colorido
        const colorMap = {
            doombot: 'darkgray',
            drone: 'lightgray',
            normal: 'blue',
            fast: 'purple',
            tank: 'darkred'
        };
        ctx.fillStyle = colorMap[this.type] || 'black';
        ctx.beginPath();
        ctx.arc(this.radius, this.radius, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.charAt(0).toUpperCase(), this.radius, this.radius);
    }
    
    // ⭐ NOVO: ÍCONE DE PERIGO PARA TANKS
    if (this.type === 'tank') {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(255, 0, 0, 1)';
        ctx.shadowBlur = 8;
        ctx.fillText('⚠️', this.radius, -8);
        ctx.shadowBlur = 0;
    }
    
    // ⭐ NOVO: ÍCONE DE VELOCIDADE PARA FAST
    if (this.type === 'fast') {
        ctx.fillStyle = 'rgba(255, 100, 255, 0.9)';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(255, 100, 255, 0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText('💨', this.radius, -8);
        ctx.shadowBlur = 0;
    }
       

            // Desenha a imagem do inimigo ou fallback
            if (this.image.complete && !this.image.isFallback) {
                ctx.drawImage(this.image, 0, 0, this.width, this.height);
            } else {
                // Fallback para um círculo colorido
                const colorMap = {
                    doombot: 'darkgray',
                    drone: 'lightgray',
                    normal: 'blue',
                    fast: 'purple',
                    tank: 'darkred'
                };
                ctx.fillStyle = colorMap[this.type] || 'black';
                ctx.beginPath();
                ctx.arc(this.radius, this.radius, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.type.charAt(0).toUpperCase(), this.radius, this.radius);
            }
            
            // Desenha barra de vida
            const healthBarWidth = this.width;
            const healthBarHeight = 5;
            const healthBarY = -10;
            ctx.fillStyle = 'red';
            ctx.fillRect(0, healthBarY, healthBarWidth, healthBarHeight);
            ctx.fillStyle = 'lime';
            ctx.fillRect(0, healthBarY, healthBarWidth * (this.hp / this.maxHp), healthBarHeight);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, healthBarY, healthBarWidth, healthBarHeight);

            // Desenha ícones de status
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            let statusIconY = healthBarY - 5;

            if (this.isConfuso || this.isConfused) {
                ctx.fillStyle = 'rgba(255, 255, 0, 1)';
                ctx.fillText('?', this.radius, statusIconY);
                statusIconY -= 20;
            }
            
            if (this.isStunned) {
                ctx.fillStyle = 'rgba(100, 200, 255, 1)';
                ctx.fillText('✨', this.radius, statusIconY);
                statusIconY -= 20;
            }

            if (this.isBleeding) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
                ctx.beginPath();
                ctx.arc(this.width - 5, 5, 5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            if (this.isPoisoned) {
                ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
                ctx.beginPath();
                ctx.arc(this.width - 5, this.height - 5, 5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            if (this.isSlowed) {
                ctx.fillStyle = 'rgba(100, 100, 255, 0.6)';
                ctx.font = '16px Arial';
                ctx.fillText('🐌', 5, this.height - 5);
            }
            
            if (this.isHacked) {
                ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
                ctx.font = '16px Arial';
                ctx.fillText('🤖', 5, 5);
            }
            
            if (this.isDisarmed) {
                ctx.fillText('🚫', this.radius, statusIconY);
                statusIconY -= 20;
            }
            
            if (this.isMindControlled) {
                ctx.fillText('🧠', this.radius, statusIconY);
                statusIconY -= 20;
            }
            
            if (this.isDebuffImmune) {
                ctx.fillText('✨', this.radius, statusIconY);
                statusIconY -= 20;
            }

            if (this.isTrapped) {
                ctx.fillStyle = 'rgba(147, 112, 219, 1)';
                ctx.fillText('🕸️', this.radius, statusIconY);
                statusIconY -= 20;
            }
            
            if (this.isBlinded) {
                ctx.fillStyle = 'rgba(240, 230, 140, 1)';
                ctx.fillText('💫', this.radius, statusIconY);
                statusIconY -= 20;
            }
            
            if (this.isDisarmed) {
                ctx.fillText('🔇', this.radius, statusIconY);
                statusIconY -= 20;
            }
            // ⭐ NOVO: Indicador de captura
            if (this.isCapturedByLeftWing) {
                ctx.fillStyle = 'rgba(0, 150, 255, 1)';
                ctx.fillText('🎯', this.radius, statusIconY);
                statusIconY -= 20;
                
                // Aura azul pulsante
                const pulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
                ctx.strokeStyle = `rgba(0, 150, 255, ${pulse})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.radius, this.radius, this.radius + 5, 0, Math.PI * 2);
                ctx.stroke();
            }
                // No método draw() da classe Enemy, APÓS desenhar os ícones de status:

            // 🔥 FAÍSCAS DA JEAN GREY
            if (this.phoenixSparks && this.phoenixSparks > 0) {
                const sparkTime = Date.now() / 1000;
                
                for (let i = 0; i < this.phoenixSparks; i++) {
                    const angle = (Math.PI * 2 / 3) * i + sparkTime * 2;
                    const sparkRadius = 20 + Math.sin(sparkTime * 4 + i) * 3;
                    const sx = Math.cos(angle) * sparkRadius;
                    const sy = Math.sin(angle) * sparkRadius;
                    
                    ctx.fillStyle = `rgba(255, 150, 0, ${0.8 + Math.sin(sparkTime * 5 + i) * 0.2})`;
                    ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(this.radius + sx, this.radius + sy, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            ctx.restore();
        }
    }