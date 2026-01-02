// big_bad.js - Sistema de Boss Battles

export class BigBad {
    constructor(bossType, gameManager) {
        this.gameManager = gameManager;
        this.type = bossType;
        
        const data = BigBad.bossData[bossType];
        
        // Informações básicas
        this.id = `boss-${Date.now()}`;
        this.name = data.name;
        this.hp = data.maxHp;
        this.maxHp = data.maxHp;
        
        // âœ… POSIÇÃO: LADO ESQUERDO DO MAPA
        const canvas = gameManager.canvas;
        this.x = 100; // Esquerda
        this.y = canvas.height / 2 - 50;
        this.width = 100;
        this.height = 100;
        
        // Imagem
        this.image = new Image();
        this.image.src = data.imagePath;
        this.image.onerror = () => { this.image.isFallback = true; };
        
        // Sistema de Fases do Boss
        this.currentPhase = 1;
        this.maxPhases = data.phases.length;
        this.phaseThresholds = data.phaseThresholds; // [0.66, 0.33] para 3 fases
        
        // Ataques e habilidades
        this.attacks = data.attacks;
        this.lastAttackTime = 0;
        this.attackCooldown = data.attackCooldown;
        this.currentAttackIndex = 0;
        
        // Falas
        this.dialogues = data.dialogues;
        this.lastDialogueTime = 0;
        this.dialogueCooldown = 8000; // 8 segundos entre falas
        
        // Estados
        this.isInvulnerable = false;
        this.isEnraged = false;
        this.isDead = false;
        this.hasSpawnedMinions = false;
        
        // Movimento
        this.moveSpeed = data.moveSpeed || 0;
        this.targetY = this.y;
        this.moveCooldown = 0;
        
        // Efeitos visuais
        this.glowIntensity = 0;
        this.shakeOffset = { x: 0, y: 0 };
        
        console.log(`ðŸ'€ Boss ${this.name} criado!`);
        
        // Fala inicial
        this.speak(this.dialogues.intro);
    }
    
    // ðŸ'¬ Sistema de Falas
    speak(text) {
        if (!text) return;
        
        this.gameManager.createSpeechBubble(
            this.getCenterX(),
            this.y - 30,
            text,
            4000
        );
        
        this.lastDialogueTime = Date.now();
    }
    
    // ðŸ"„ Atualiza Boss
    update(deltaTime) {
        if (this.isDead) return;
        
        const data = BigBad.bossData[this.type];
        
        // ===============================
        // SISTEMA DE FASES
        // ===============================
        const hpPercent = this.hp / this.maxHp;
        const newPhase = this.calculatePhase(hpPercent);
        
        if (newPhase > this.currentPhase) {
            this.changePhase(newPhase);
        }
        
        // ===============================
        // MOVIMENTO VERTICAL
        // ===============================
        if (this.moveSpeed > 0) {
            this.moveCooldown -= deltaTime;
            
            if (this.moveCooldown <= 0) {
                const canvas = this.gameManager.canvas;
                this.targetY = 100 + Math.random() * (canvas.height - 200);
                this.moveCooldown = 3000;
            }
            
            if (Math.abs(this.y - this.targetY) > 5) {
                const direction = this.targetY > this.y ? 1 : -1;
                this.y += direction * this.moveSpeed * (deltaTime / 1000);
            }
        }
        
        // ===============================
        // ATAQUES
        // ===============================
        this.lastAttackTime -= deltaTime;
        
        if (this.lastAttackTime <= 0 && !this.isInvulnerable) {
            this.performAttack();
            this.lastAttackTime = this.attackCooldown;
        }
        
        // ===============================
        // FALAS ALEATÓRIAS
        // ===============================
        if (Date.now() - this.lastDialogueTime > this.dialogueCooldown) {
            if (Math.random() < 0.3) {
                const randomDialogue = this.dialogues.combat[
                    Math.floor(Math.random() * this.dialogues.combat.length)
                ];
                this.speak(randomDialogue);
            }
        }
        
        // ===============================
        // EFEITOS VISUAIS
        // ===============================
        this.glowIntensity = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        
        if (this.isEnraged) {
            this.shakeOffset.x = (Math.random() - 0.5) * 6;
            this.shakeOffset.y = (Math.random() - 0.5) * 6;
        } else {
            this.shakeOffset = { x: 0, y: 0 };
        }
    }
    
    // ðŸ"¢ Calcula fase atual baseado no HP
    calculatePhase(hpPercent) {
        for (let i = 0; i < this.phaseThresholds.length; i++) {
            if (hpPercent > this.phaseThresholds[i]) {
                return i + 1;
            }
        }
        return this.maxPhases;
    }
    
    // ðŸ"„ Muda de fase
    changePhase(newPhase) {
        console.log(`ðŸ'€ Boss entrando na fase ${newPhase}!`);
        
        this.currentPhase = newPhase;
        const data = BigBad.bossData[this.type];
        const phaseData = data.phases[newPhase - 1];
        
        // Invulnerabilidade temporária
        this.isInvulnerable = true;
        setTimeout(() => {
            this.isInvulnerable = false;
        }, 2000);
        
        // Efeito visual
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.getCenterX(),
            this.getCenterY(),
            150,
            1000,
            'rgba(255, 255, 255, 0.9)'
        ));
        
        // Flash na tela
        this.gameManager.createScreenFlash('white', 0.6, 500);
        
        // Fala de mudança de fase
        this.speak(this.dialogues.phaseChange[newPhase - 1]);
        
        // Aplica mudanças da fase
        if (phaseData.attackCooldownMultiplier) {
            this.attackCooldown *= phaseData.attackCooldownMultiplier;
        }
        
        if (phaseData.enrage) {
            this.isEnraged = true;
            this.gameManager.showUI(`${this.name} está ENFURECIDO! ðŸ'¢`, 'error');
        }
        
        // Spawna minions se necessário
        if (phaseData.spawnMinions && !this.hasSpawnedMinions) {
            this.spawnMinions(phaseData.minionCount, phaseData.minionType);
            this.hasSpawnedMinions = true;
        }
    }
    
    // âš"ï¸ Realiza ataque
    performAttack() {
        const data = BigBad.bossData[this.type];
        const phaseData = data.phases[this.currentPhase - 1];
        
        // Seleciona ataque disponível na fase atual
        const availableAttacks = phaseData.availableAttacks;
        const attackName = availableAttacks[
            Math.floor(Math.random() * availableAttacks.length)
        ];
        
        const attackData = this.attacks[attackName];
        
        // Executa ataque específico
        switch (attackName) {
            case 'dualPistols':
                this.attackDualPistols(attackData);
                break;
            case 'quinjetStrike':
                this.attackQuinjetStrike(attackData);
                break;
            case 'agentSwarm':
                this.attackAgentSwarm(attackData);
                break;
            case 'orbitalBombardment':
                this.attackOrbitalBombardment(attackData);
                break;
            case 'commandZoneTrap':
                this.attackCommandZoneTrap(attackData);
                break;
        }
    }
    
    // ðŸ"« Ataque: Pistolas Duplas
    attackDualPistols(attackData) {
        const targets = this.gameManager.champions
            .filter(c => c.hp > 0)
            .sort((a, b) => {
                const distA = Math.hypot(this.getCenterX() - a.getCenterX(), this.getCenterY() - a.getCenterY());
                const distB = Math.hypot(this.getCenterX() - b.getCenterX(), this.getCenterY() - b.getCenterY());
                return distA - distB;
            })
            .slice(0, 2);
        
        if (targets.length === 0) return;
        
        targets.forEach(target => {
            const projectile = {
                x: this.getCenterX(),
                y: this.getCenterY(),
                targetX: target.getCenterX(),
                targetY: target.getCenterY(),
                speed: 600,
                damage: attackData.damage,
                owner: this,
                type: 'bossBullet',
                radius: 6,
                color: 'cyan',
                spawnTime: Date.now(),
                lifespan: 5000,
                targetType: 'champion',
                target: target
            };
            
            this.gameManager.enemyProjectiles.push(projectile);
            
            this.gameManager.effects.push(new this.gameManager.LaserEffect(
                this.getCenterX(),
                this.getCenterY(),
                target.getCenterX(),
                target.getCenterY(),
                4,
                'cyan',
                0.2
            ));
        });
        
        if (Math.random() < 0.3) {
            this.speak("Acertei em cheio! ðŸŽ¯");
        }
    }
    
    // âœˆï¸ Ataque: Quinjet Strike
    attackQuinjetStrike(attackData) {
        const target = this.gameManager.champions
            .filter(c => c.hp > 0)
            .sort((a, b) => b.hp - a.hp)[0];
        
        if (!target) return;
        
        // Cria Quinjet temporário que voa até o alvo
        const quinjet = {
            x: this.getCenterX() - 50,
            y: this.y - 100,
            targetX: target.getCenterX(),
            targetY: target.getCenterY(),
            speed: 500,
            damage: attackData.damage,
            radius: attackData.radius,
            owner: this,
            spawnTime: Date.now(),
            lifetime: 3000
        };
        
        // Movimento do Quinjet (será atualizado no gameManager)
        const updateQuinjet = () => {
            if (Date.now() - quinjet.spawnTime > quinjet.lifetime) return false;
            
            const angle = Math.atan2(quinjet.targetY - quinjet.y, quinjet.targetX - quinjet.x);
            quinjet.x += Math.cos(angle) * quinjet.speed * (1/60);
            quinjet.y += Math.sin(angle) * quinjet.speed * (1/60);
            
            const dist = Math.hypot(quinjet.targetX - quinjet.x, quinjet.targetY - quinjet.y);
            
            if (dist < 30) {
                // Explosão
                this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                    quinjet.x, quinjet.y, quinjet.radius, 500, 'orange'
                ));
                
                this.gameManager.champions.forEach(champion => {
                    const d = Math.hypot(quinjet.x - champion.getCenterX(), quinjet.y - champion.getCenterY());
                    if (d < quinjet.radius && champion.hp > 0) {
                        champion.takeDamage(quinjet.damage, this);
                    }
                });
                
                return false;
            }
            
            return true;
        };
        
        // Adiciona ao sistema de atualização
        if (!this.gameManager.bossQuinjets) {
            this.gameManager.bossQuinjets = [];
        }
        this.gameManager.bossQuinjets.push({ quinjet, update: updateQuinjet });
        
        this.speak("Quinjet, neutralize o alvo! âœˆï¸");
    }
    
    // ðŸ'¥ Ataque: Agent Swarm
    attackAgentSwarm(attackData) {
        for (let i = 0; i < attackData.agentCount; i++) {
            setTimeout(() => {
                this.gameManager.spawnEnemy();
            }, i * 500);
        }
        
        this.speak("Agentes, ataquem! ðŸ'¥");
        this.gameManager.showUI('Nick Fury convocou reforços!', 'error');
    }
    
    // ðŸŽ¯ Ataque: Bombardeio Orbital
    attackOrbitalBombardment(attackData) {
        const canvas = this.gameManager.canvas;
        
        for (let i = 0; i < attackData.missileCount; i++) {
            setTimeout(() => {
                const targetX = 100 + Math.random() * (canvas.width - 200);
                const targetY = 100 + Math.random() * (canvas.height - 200);
                
                // Laser de marcação
                this.gameManager.effects.push(new this.gameManager.TargetLaserEffect(
                    targetX, targetY, 1500, 'red'
                ));
                
                // Míssil cai após 1.5s
                setTimeout(() => {
                    this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                        targetX, targetY, attackData.missileRadius, 600, 'white'
                    ));
                    
                    this.gameManager.champions.forEach(champion => {
                        const dist = Math.hypot(targetX - champion.getCenterX(), targetY - champion.getCenterY());
                        if (dist < attackData.missileRadius && champion.hp > 0) {
                            champion.takeDamage(attackData.missileDamage, this);
                        }
                    });
                }, 1500);
            }, i * 800);
        }
        
        this.speak("Bombardeio orbital autorizado! ðŸŽ¯");
    }
    
    // ðŸ›¡ï¸ Ataque: Command Zone Trap
    attackCommandZoneTrap(attackData) {
        const canvas = this.gameManager.canvas;
        const trapX = 200 + Math.random() * (canvas.width - 400);
        const trapY = 150 + Math.random() * (canvas.height - 300);
        
        // Cria zona de armadilha
        const trap = {
            x: trapX,
            y: trapY,
            radius: attackData.radius,
            duration: attackData.duration,
            damage: attackData.damage,
            slow: attackData.slow,
            spawnTime: Date.now(),
            lastDamageTick: Date.now()
        };
        
        if (!this.gameManager.commandZoneTraps) {
            this.gameManager.commandZoneTraps = [];
        }
        this.gameManager.commandZoneTraps.push(trap);
        
        this.speak("Caiam na armadilha! ðŸ•¸ï¸");
    }
    
    // ðŸ'¾ Spawna minions
    spawnMinions(count, type) {
        this.gameManager.showUI(`${this.name} invocou ${count} ${type}s!`, 'error');
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                this.gameManager.spawnEnemy();
            }, i * 800);
        }
    }
    
    // Método takeDamage corrigido (já existe, mas vamos melhorar):
    takeDamage(amount, attacker) {
        if (this.isInvulnerable || this.isDead) {
            // Efeito visual de invulnerabilidade
            if (this.isInvulnerable) {
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    this.getCenterX(),
                    this.getCenterY() - 40,
                    'INVULNERÁVEL!',
                    'yellow',
                    800
                ));
            }
            return;
        }
        
        this.hp -= amount;
        
        // Efeito visual
        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
            this.getCenterX(),
            this.getCenterY() - 40,
            `-${amount.toFixed(0)}`,
            'red',
            800
        ));
        
        // Partículas de impacto
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.getCenterX() + Math.cos(angle) * 20,
                this.getCenterY() + Math.sin(angle) * 20,
                12,
                'red',
                400
            ));
        }
        
        // Verifica morte
        if (this.hp <= 0) {
            this.die();
        }
    }
    
    // â˜ ï¸ Morte do Boss
    die() {
        this.isDead = true;
        this.hp = 0;
        
        console.log(`ðŸ'€ Boss ${this.name} derrotado!`);
        
        // Fala final
        this.speak(this.dialogues.defeat);
        
        // Explosão massiva
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 80;
                
                this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                    this.getCenterX() + Math.cos(angle) * dist,
                    this.getCenterY() + Math.sin(angle) * dist,
                    60 + Math.random() * 40,
                    800,
                    ['orange', 'red', 'white', 'cyan'][Math.floor(Math.random() * 4)]
                ));
            }, i * 100);
        }
        
        // Flash branco
        setTimeout(() => {
            this.gameManager.createScreenFlash('white', 0.9, 1000);
        }, 1500);
        
        // Desbloqueia o boss como champion
        setTimeout(() => {
            this.unlockBossAsChampion();
        }, 3000);
    }
    
    // ðŸ"" Desbloqueia boss como campeão
    unlockBossAsChampion() {
        const data = BigBad.bossData[this.type];
        
        // Salva no localStorage
        const unlockedBosses = JSON.parse(localStorage.getItem('unlockedBosses') || '[]');
        if (!unlockedBosses.includes(this.type)) {
            unlockedBosses.push(this.type);
            localStorage.setItem('unlockedBosses', JSON.stringify(unlockedBosses));
        }
        
        // Mensagem de desbloqueio
        this.gameManager.showUI(`ðŸŽ‰ ${this.name} DESBLOQUEADO como Champion!`, 'success');
        
        // Efeito visual de desbloqueio
        this.gameManager.effects.push(new this.gameManager.LevelUpEffect(
            this.gameManager.canvas.width / 2,
            this.gameManager.canvas.height / 2,
            2000
        ));
    }
    
    // ðŸ"¦ Métodos auxiliares
    getCenterX() {
        return this.x + this.width / 2;
    }
    
    getCenterY() {
        return this.y + this.height / 2;
    }
    
    draw(ctx) {
        if (this.isDead) return;
        
        const data = BigBad.bossData[this.type];
        const centerX = this.getCenterX() + this.shakeOffset.x;
        const centerY = this.getCenterY() + this.shakeOffset.y;
        
        ctx.save();
        
        // ===============================
        // ðŸ"¥ AURA DE BOSS ÉPICA
        // ===============================
        const time = Date.now() / 1000;
        
        // Aura externa pulsante
        for (let layer = 3; layer >= 1; layer--) {
            const layerSize = 120 + layer * 30 + Math.sin(time * 2 + layer) * 20;
            const layerAlpha = (this.glowIntensity * 0.15) / layer;
            
            const auraGradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, layerSize
            );
            auraGradient.addColorStop(0, `rgba(255, 50, 0, ${layerAlpha})`);
            auraGradient.addColorStop(0.5, `rgba(255, 100, 0, ${layerAlpha * 0.7})`);
            auraGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, layerSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // ===============================
        // âš¡ RAIOS DE ENERGIA ORBITAL
        // ===============================
        const numRays = 12;
        for (let i = 0; i < numRays; i++) {
            const rayAngle = (Math.PI * 2 / numRays) * i + time * 0.5;
            const rayLength = 80 + Math.sin(time * 3 + i) * 20;
            const rayAlpha = 0.4 + Math.sin(time * 4 + i) * 0.3;
            
            const rayGradient = ctx.createLinearGradient(
                centerX, centerY,
                centerX + Math.cos(rayAngle) * rayLength,
                centerY + Math.sin(rayAngle) * rayLength
            );
            rayGradient.addColorStop(0, `rgba(255, 100, 0, ${rayAlpha})`);
            rayGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.strokeStyle = rayGradient;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(rayAngle) * rayLength,
                centerY + Math.sin(rayAngle) * rayLength
            );
            ctx.stroke();
        }
        
        // ===============================
        // ðŸ"´ ANÉIS ROTATIVOS
        // ===============================
        for (let ring = 0; ring < 3; ring++) {
            const ringRadius = 70 + ring * 25;
            const ringRotation = time * (ring % 2 === 0 ? 1 : -1) + ring;
            const ringAlpha = (0.6 - ring * 0.15) * this.glowIntensity;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(ringRotation);
            
            ctx.strokeStyle = this.isInvulnerable 
                ? `rgba(255, 255, 0, ${ringAlpha})` 
                : `rgba(255, 50, 0, ${ringAlpha})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([15, 10]);
            ctx.shadowColor = this.isInvulnerable ? 'yellow' : 'red';
            ctx.shadowBlur = 15;
            
            ctx.beginPath();
            ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.setLineDash([]);
            ctx.restore();
            
            // Marcadores nos anéis
            for (let m = 0; m < 8; m++) {
                const markerAngle = (Math.PI * 2 / 8) * m + ringRotation;
                const mx = centerX + Math.cos(markerAngle) * ringRadius;
                const my = centerY + Math.sin(markerAngle) * ringRadius;
                
                ctx.fillStyle = this.isInvulnerable 
                    ? `rgba(255, 255, 100, ${ringAlpha})` 
                    : `rgba(255, 100, 50, ${ringAlpha})`;
                ctx.shadowColor = this.isInvulnerable ? 'yellow' : 'red';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(mx, my, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.shadowBlur = 0;
        
        // ===============================
        // ðŸ–¼ï¸ IMAGEM DO BOSS (COM BRILHO)
        // ===============================
        
        // Sombra dramática
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 10;
        
        if (this.image.complete && !this.image.isFallback) {
            ctx.drawImage(
                this.image,
                this.x + this.shakeOffset.x,
                this.y + this.shakeOffset.y,
                this.width,
                this.height
            );
        } else {
            // Fallback épico
            const fallbackGradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, this.width / 2
            );
            fallbackGradient.addColorStop(0, 'rgba(200, 0, 0, 1)');
            fallbackGradient.addColorStop(1, 'rgba(100, 0, 0, 1)');
            
            ctx.fillStyle = fallbackGradient;
            ctx.fillRect(
                this.x + this.shakeOffset.x,
                this.y + this.shakeOffset.y,
                this.width,
                this.height
            );
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('BOSS', centerX, centerY);
        }
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // ===============================
        // ðŸ"² CONTORNO HEXAGONAL ÉPICO
        // ===============================
        const hexRadius = this.width / 2 + 15;
        const hexSides = 6;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Hexágono duplo
        for (let layer = 0; layer < 2; layer++) {
            const layerRadius = hexRadius + layer * 8;
            const layerAlpha = this.glowIntensity * (1 - layer * 0.3);
            
            ctx.strokeStyle = this.isInvulnerable 
                ? `rgba(255, 255, 0, ${layerAlpha})` 
                : `rgba(255, 0, 0, ${layerAlpha})`;
            ctx.lineWidth = 5 - layer * 2;
            ctx.shadowColor = this.isInvulnerable ? 'yellow' : 'red';
            ctx.shadowBlur = 25;
            
            ctx.beginPath();
            for (let i = 0; i <= hexSides; i++) {
                const angle = (Math.PI * 2 / hexSides) * i - Math.PI / 2;
                const hx = Math.cos(angle) * layerRadius;
                const hy = Math.sin(angle) * layerRadius;
                
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
        
        // ===============================
        // ðŸ'  NOME DO BOSS
        // ===============================
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(centerX - 80, this.y - 35, 160, 25);
        
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - 80, this.y - 35, 160, 25);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(255, 0, 0, 1)';
        ctx.shadowBlur = 10;
        ctx.fillText(this.name.toUpperCase(), centerX, this.y - 17);
        ctx.shadowBlur = 0;
        
        // ===============================
        // ðŸ"Š INDICADOR DE FASE (ÉPICO)
        // ===============================
        const phaseBoxY = this.y - 55;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(centerX - 60, phaseBoxY, 120, 18);
        
        ctx.strokeStyle = this.isInvulnerable 
            ? 'rgba(255, 255, 0, 1)' 
            : 'rgba(255, 100, 0, 1)';
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - 60, phaseBoxY, 120, 18);
        
        // Segmentos de fase
        const segmentWidth = 120 / this.maxPhases;
        for (let p = 0; p < this.maxPhases; p++) {
            if (p < this.currentPhase) {
                ctx.fillStyle = p === this.currentPhase - 1 
                    ? 'rgba(255, 100, 0, 0.9)' 
                    : 'rgba(100, 100, 100, 0.5)';
                ctx.fillRect(
                    centerX - 60 + p * segmentWidth + 2,
                    phaseBoxY + 2,
                    segmentWidth - 4,
                    14
                );
            }
        }
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `FASE ${this.currentPhase}/${this.maxPhases}`,
            centerX,
            phaseBoxY + 13
        );
        
        // ===============================
        // â¤ï¸ BARRA DE HP ÉPICA (3 SEGMENTOS)
        // ===============================
        const barWidth = 200;
        const barHeight = 25;
        const barX = centerX - barWidth / 2;
        const barY = this.y + this.height + 20;
        
        // Fundo com gradiente
        const bgGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
        bgGradient.addColorStop(0, 'rgba(20, 20, 20, 0.95)');
        bgGradient.addColorStop(1, 'rgba(10, 10, 10, 0.95)');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Segmentos de HP
        const segmentWidth2 = barWidth / this.maxPhases;
        const hpPercent = this.hp / this.maxHp;
        
        for (let i = 0; i < this.maxPhases; i++) {
            const segmentStart = i / this.maxPhases;
            const segmentEnd = (i + 1) / this.maxPhases;
            
            if (hpPercent > segmentStart) {
                const fillPercent = Math.min(
                    (hpPercent - segmentStart) / (segmentEnd - segmentStart),
                    1
                );
                
                const hpGradient = ctx.createLinearGradient(
                    barX + i * segmentWidth2, barY,
                    barX + i * segmentWidth2, barY + barHeight
                );
                
                // Cores por fase
                if (i === 0) {
                    hpGradient.addColorStop(0, 'rgba(255, 50, 50, 1)');
                    hpGradient.addColorStop(1, 'rgba(200, 0, 0, 1)');
                } else if (i === 1) {
                    hpGradient.addColorStop(0, 'rgba(255, 150, 0, 1)');
                    hpGradient.addColorStop(1, 'rgba(200, 100, 0, 1)');
                } else {
                    hpGradient.addColorStop(0, 'rgba(255, 255, 0, 1)');
                    hpGradient.addColorStop(1, 'rgba(200, 150, 0, 1)');
                }
                
                ctx.fillStyle = hpGradient;
                ctx.fillRect(
                    barX + i * segmentWidth2 + 2,
                    barY + 2,
                    (segmentWidth2 - 4) * fillPercent,
                    barHeight - 4
                );
                
                // Brilho no HP
                ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * this.glowIntensity})`;
                ctx.fillRect(
                    barX + i * segmentWidth2 + 2,
                    barY + 2,
                    (segmentWidth2 - 4) * fillPercent,
                    (barHeight - 4) / 3
                );
            }
            
            // Divisórias
            if (i < this.maxPhases - 1) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(barX + (i + 1) * segmentWidth2, barY);
                ctx.lineTo(barX + (i + 1) * segmentWidth2, barY + barHeight);
                ctx.stroke();
            }
        }
        
        // Contorno da barra
        ctx.strokeStyle = this.isInvulnerable 
            ? 'rgba(255, 255, 0, 1)' 
            : 'rgba(255, 50, 0, 1)';
        ctx.lineWidth = 3;
        ctx.shadowColor = this.isInvulnerable ? 'yellow' : 'red';
        ctx.shadowBlur = 15;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        ctx.shadowBlur = 0;
        
        // Texto de HP
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 5;
        ctx.fillText(
            `${this.hp.toFixed(0)} / ${this.maxHp}`,
            centerX,
            barY + barHeight / 2 + 5
        );
        ctx.shadowBlur = 0;
        
        // ===============================
        // âš ï¸ ESTADO ESPECIAL
        // ===============================
        if (this.isInvulnerable) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 200, 0, 1)';
            ctx.shadowBlur = 15;
            ctx.fillText(
                'âš ï¸ INVULNERÁVEL âš ï¸',
                centerX,
                barY + barHeight + 20
            );
            ctx.shadowBlur = 0;
        }
        
        if (this.isEnraged) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 0, 0, 1)';
            ctx.shadowBlur = 15;
            ctx.fillText(
                'ENFURECIDO',
                centerX,
                barY + barHeight + (this.isInvulnerable ? 35 : 20)
            );
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }

}

// ===============================
// ðŸ"Š DADOS DOS BOSSES
// ===============================
BigBad.bossData = {
    nickfury: {
        name: 'Nick Fury',
        imagePath: './assets_img/Nick_Fury.webp',
        backgroundImage: './assets_img/helicarrier_background.jpg', // ADICIONE AQUI
        bossMusic: './assets_music/boss_theme.mp3', // ADICIONE AQUI
        imagePath: './assets_img/Nick_Fury.webp',
        maxHp: 15000,
        moveSpeed: 80,
        attackCooldown: 2000,
        
        // Fases (3 fases baseadas em HP)
        phaseThresholds: [0.66, 0.33], // 66% HP = Fase 2, 33% HP = Fase 3
        phases: [
            {
                // FASE 1: 100% - 66% HP
                availableAttacks: ['dualPistols', 'quinjetStrike'],
                attackCooldownMultiplier: 1,
                enrage: false
            },
            {
                // FASE 2: 66% - 33% HP
                availableAttacks: ['dualPistols', 'quinjetStrike', 'agentSwarm'],
                attackCooldownMultiplier: 0.8, // Ataca 20% mais rápido
                enrage: false,
                spawnMinions: true,
                minionCount: 5,
                minionType: 'drone'
            },
            {
                // FASE 3: 33% - 0% HP
                availableAttacks: ['dualPistols', 'quinjetStrike', 'orbitalBombardment', 'commandZoneTrap'],
                attackCooldownMultiplier: 0.6, // Ataca 40% mais rápido
                enrage: true
            }
        ],
        
        // Ataques
        attacks: {
            dualPistols: {
                damage: 35,
                count: 2
            },
            quinjetStrike: {
                damage: 80,
                radius: 120
            },
            agentSwarm: {
                agentCount: 3
            },
            orbitalBombardment: {
                missileCount: 5,
                missileDamage: 60,
                missileRadius: 100
            },
            commandZoneTrap: {
                radius: 150,
                duration: 5000,
                damage: 10,
                slow: 0.5
            }
        },
        
        // Falas
        dialogues: {
            intro: "VocÃª realmente achou que poderia derrotar a S.H.I.E.L.D.?¸",
            combat: [
                "Isso é tudo que vocês têm? ˜",
                "S.H.I.E.L.D. nunca desiste! ",
                "Vejo que precisam de mais treinamento...¯",
                "Impressionante... mas não o suficiente."
            ],
            phaseChange: [
                "Agora a luta começa de verdade!",
                "Vocês forçaram minha mão. Chamando reforços!",
                "Hora do protocolo final! ðŸš¨"
            ],
            defeat: "Bom trabalho, agentes. Vocês... mereceram isso...'"
        }
    }
    
};