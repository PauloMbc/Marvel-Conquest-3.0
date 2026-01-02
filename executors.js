// executors.js
// ===============================
// 💀 SISTEMA DE EXECUTORES - MINI BOSSES
// ===============================

import { Enemy } from './enemies.js';

// ===============================
// 👑 CLASSE BASE: EXECUTOR
// ===============================
export class Executor extends Enemy {
    constructor(id, x, y, type, data, path, gameManager) {
        super(id, x, y, type, data, path);
        this.gameManager = gameManager;
        this.isExecutor = true;
        this.executorType = type;
        this.baseDamageToBase = 20; // Dano à base se chegar vivo
        this.goldReward = 100;
        this.crownGlow = 0;
        this.isAbomination = false; // Para quando transformado
        
        console.log(`💀 Executor criado: ${type}`);
    }
    
    takeDamage(amount, attacker) {
        super.takeDamage(amount, attacker);
        
        // Efeito visual ao levar dano
        if (this.gameManager) {
            for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2;
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.getCenterX() + Math.cos(angle) * 20,
                    this.getCenterY() + Math.sin(angle) * 20,
                    12,
                    'red',
                    600
                ));
            }
        }
    }
    
    onDeath() {
        if (this.gameManager) {
            // Recompensa extra
            this.gameManager.money += this.goldReward;
            
            // Explosão épica
            this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                this.getCenterX(),
                this.getCenterY(),
                100,
                1000,
                'rgba(139, 0, 0, 1)'
            ));
            
            // Ondas de choque
            for (let w = 0; w < 3; w++) {
                setTimeout(() => {
                    this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                        this.getCenterX(),
                        this.getCenterY(),
                        80 + w * 30,
                        500
                    ));
                }, w * 150);
            }
            
            // Partículas douradas
            for (let i = 0; i < 30; i++) {
                const angle = (Math.PI * 2 / 30) * i;
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.getCenterX() + Math.cos(angle) * 30,
                    this.getCenterY() + Math.sin(angle) * 30,
                    15,
                    'gold',
                    1200
                ));
            }
            
            this.gameManager.showUI(`💀 Executor ${this.executorType} derrotado! +$${this.goldReward}`, 'ultimate');
        }
    }
    
    drawCrown(ctx) {
        ctx.save();
        ctx.translate(this.getCenterX(), this.getCenterY() - this.radius - 20);
        
        this.crownGlow = (this.crownGlow + 0.05) % (Math.PI * 2);
        const glowAlpha = 0.6 + Math.sin(this.crownGlow) * 0.3;
        
        // Brilho da coroa
        const crownGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
        crownGradient.addColorStop(0, `rgba(255, 215, 0, ${glowAlpha})`);
        crownGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        
        ctx.fillStyle = crownGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Coroa dourada
        ctx.fillStyle = `rgba(255, 215, 0, ${glowAlpha})`;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(255, 215, 0, 1)';
        ctx.shadowBlur = 15;
        ctx.fillText('👑', 0, 8);
        ctx.shadowBlur = 0;
        
        ctx.restore();
    }
}

// ===============================
// 👑 LÍDER - EXECUTOR QUE PARALISA O MAPA
// ===============================
export class LeaderExecutor extends Executor {
    constructor(id, x, y, path, gameManager) {
        const data = {
            hp: 400,
            speed: 20,
            radius: 25,
            reward: 0, // Reward customizado no Executor
            imagePath: './assets_img/Leader.jpg',
            baseDamage: 15,
            attackRange: 300,
            attackSpeed: 2000
        };
        
        super(id, x, y, 'leader', data, path, gameManager);
        
        this.isParalyzingMap = true;
        this.laserRicochetCooldown = 0;
        this.laserRicochetInterval = 3000; // 3s entre ricochetes
        this.abominationCooldown = 0;
        this.abominationInterval = 15000; // 15s para transformar inimigo
        this.abominationTarget = null;
        
        // Ativa paralisia global
        this.activateMapParalysis();
    }
    
 activateMapParalysis() {
        if (!this.gameManager) return;
        
        // ✅ PARALISA TODOS OS CHAMPIONS (INCLUINDO OS QUE SE MOVEM)
        this.gameManager.champions.forEach(champion => {
            if (champion.hp > 0) {
                champion.isParalyzed = true;
                
                // ✅ SALVA ESTADOS ORIGINAIS
                if (!champion.paralysisBackup) {
                    champion.paralysisBackup = {
                        canFly: champion.isFlying || false,
                        canTeleport: champion.type === 'noturno',
                        canMove: true
                    };
                }
                
                // ✅ BLOQUEIA VOO (Iron Man, Karolina)
                if (champion.type === 'ironman' && champion.isFlying) {
                    champion.isFlying = false;
                    champion.orbitProgress = 0;
                }
                
                // ✅ BLOQUEIA VOO DA KAROLINA
                if (champion.type === 'karolinadean' && champion.isFlying) {
                    champion.isFlying = false;
                    champion.flyProgress = 0;
                }
                
                // ✅ BLOQUEIA TELEPORTE DO NOTURNO
                if (champion.type === 'noturno') {
                    champion.canUseTeleport = false;
                }
                
                // Efeito visual de paralisia
                for (let i = 0; i < 10; i++) {
                    const angle = (Math.PI * 2 / 10) * i;
                    this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                        champion.getCenterX() + Math.cos(angle) * 25,
                        champion.getCenterY() + Math.sin(angle) * 25,
                        12,
                        'yellow',
                        800
                    ));
                }
            }
        });
        
        this.gameManager.showUI('👑 LÍDER: Todos os champions PARALISADOS!', 'warning');
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.gameManager) return;
        
        // ✅ MANTÉM PARALISIA ATIVA EM TODOS
        this.gameManager.champions.forEach(champion => {
            if (champion.hp > 0) {
                champion.isParalyzed = true;
                
                // Iron Man não pode voar
                if (champion.type === 'ironman' && champion.isFlying) {
                    champion.isFlying = false;
                }
                
                // Karolina não pode voar
                if (champion.type === 'karolinadean' && champion.isFlying) {
                    champion.isFlying = false;
                }
                
                // Noturno não pode teleportar
                if (champion.type === 'noturno') {
                    champion.canUseTeleport = false;
                }
            }
        });

        // ⚡ Laser Ricochete
        this.laserRicochetCooldown -= deltaTime;
        if (this.laserRicochetCooldown <= 0) {
            this.fireLaserRicochet();
            this.laserRicochetCooldown = this.laserRicochetInterval;
        }
        
        // 💀 Transformar em Abominável
        this.abominationCooldown -= deltaTime;
        if (this.abominationCooldown <= 0 && !this.abominationTarget) {
            this.transformEnemyToAbomination();
            this.abominationCooldown = this.abominationInterval;
        }
    }
    
    fireLaserRicochet() {
        if (!this.gameManager || this.gameManager.champions.length === 0) return;
        
        // Encontra 2 champions mais próximos
        const targets = this.gameManager.champions
            .filter(c => c.hp > 0)
            .sort((a, b) => {
                const distA = Math.hypot(this.getCenterX() - a.getCenterX(), this.getCenterY() - a.getCenterY());
                const distB = Math.hypot(this.getCenterX() - b.getCenterX(), this.getCenterY() - b.getCenterY());
                return distA - distB;
            })
            .slice(0, 2);
        
        if (targets.length === 0) return;
        
        // Dispara laser no primeiro alvo
        const laser = new LeaderLaserProjectile(
            this.getCenterX(),
            this.getCenterY(),
            targets,
            40,
            this,
            this.gameManager
        );
        
        if (!this.gameManager.leaderLasers) {
            this.gameManager.leaderLasers = [];
        }
        
        this.gameManager.leaderLasers.push(laser);
        this.gameManager.showUI('👑 LÍDER: Laser Ricochete disparado!', 'warning');
    }
    
    transformEnemyToAbomination() {
        if (!this.gameManager || this.gameManager.enemies.length <= 1) return;
        
        // Escolhe um inimigo comum aleatório (que não seja executor)
        const validEnemies = this.gameManager.enemies.filter(e => 
            !e.isExecutor && 
            !e.isAbomination && 
            e.hp > 0 &&
            e.id !== this.id
        );
        
        if (validEnemies.length === 0) return;
        
        const target = validEnemies[Math.floor(Math.random() * validEnemies.length)];
        
        // Transforma em Abominável
        target.isAbomination = true;
        target.isUnstoppable = true; // Imparável
        target.maxHp = 200;
        target.hp = 200;
        target.radiationDamage = 5; // Dano de radiação por segundo
        target.radiationRadius =  90; // ✅ ALCANCE MAIOR
        target.regenRate = 6; // 6 HP/s
        target.lastRegenTime = Date.now();
        target.radiationParticles = [];
        target.data.radius = 28; // ✅ MAIOR

         // ✅ IMAGEM DO ABOMINÁVEL
        target.abominationImage = this.gameManager.createImage('./assets_img/Abomination.webp');
        
        // Efeito visual épico
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            target.getCenterX(),
            target.getCenterY(),
            80,
            1000,
            'rgba(0, 255, 0, 0.8)'
        ));
        
        // Raios verdes
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                target.getCenterX() + Math.cos(angle) * 30,
                target.getCenterY() + Math.sin(angle) * 30,
                15,
                'lime',
                1000
            ));
        }
        
        this.abominationTarget = target;
        this.gameManager.showUI('👑 LÍDER: Inimigo transformado em ABOMINÁVEL! ☢️', 'warning');
    }
    
   onDeath() {
        // ✅ REMOVE PARALISIA DE TODOS OS CHAMPIONS
        if (this.gameManager) {
            this.gameManager.champions.forEach(champion => {
                if (champion.isParalyzed) {
                    champion.isParalyzed = false;
                    
                    // Restaura habilidades
                    if (champion.paralysisBackup) {
                        if (champion.type === 'noturno') {
                            champion.canUseTeleport = true;
                        }
                        champion.paralysisBackup = null;
                    }
                    
                    // Efeito de libertação
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 / 8) * i;
                        this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                            champion.getCenterX() + Math.cos(angle) * 20,
                            champion.getCenterY() + Math.sin(angle) * 20,
                            10,
                            'cyan',
                            600
                        ));
                    }
                }
            });
            
            this.gameManager.showUI('✅ Champions libertados da paralisia!', 'success');
        }
        
        super.onDeath();
    }
    
    draw(ctx) {
        super.draw(ctx);
        this.drawCrown(ctx);
        
        // Aura de paralisia
        const time = Date.now() / 1000;
        const pulseSize = 50 + Math.sin(time * 3) * 10;
        
        ctx.save();
        const auraGradient = ctx.createRadialGradient(
            this.getCenterX(), this.getCenterY(), 0,
            this.getCenterX(), this.getCenterY(), pulseSize
        );
        auraGradient.addColorStop(0, 'rgba(255, 255, 0, 0.4)');
        auraGradient.addColorStop(0.7, 'rgba(255, 200, 0, 0.2)');
        auraGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
        
        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(this.getCenterX(), this.getCenterY(), pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ===============================
// 🌫️ MISTÉRIO - EXECUTOR COM ILUSÕES
// ===============================
export class MysteryExecutor extends Executor {
    constructor(id, x, y, path, gameManager) {
        const data = {
            hp: 400,
            speed: 25,
            radius: 25,
            reward: 0,
            imagePath: './assets_img/mystery_executor.png',
            baseDamage: 12,
            attackRange: 250,
            attackSpeed: 2500
        };
        
        super(id, x, y, 'mystery', data, path, gameManager);
        
        this.isRealMystery = true;
        this.illusions = [];
        this.illusionsKilled = 0;
        this.rangeBonus = 0; // +2% por ilusão morta
        this.blindnessBonus = 0; // +2% por ilusão morta
        this.poisonGasCooldown = 0;
        this.poisonGasInterval = 4000; // 4s entre gases
        this.sinisterAuraPhase = 0;
        
        // Cria 5 ilusões
        this.createIllusions();
    }
    
    createIllusions() {
        if (!this.gameManager) return;
        
        const canvas = this.gameManager.canvas;
        
        for (let i = 0; i < 5; i++) {
            const illusionX = 100 + Math.random() * (canvas.width - 200);
            const illusionY = 50 + Math.random() * (canvas.height - 100);
            
            const illusion = {
                id: `illusion-${Date.now()}-${i}`,
                x: illusionX,
                y: illusionY,
                radius: 25,
                hp: 100,
                maxHp: 100,
                getCenterX: function() { return this.x + this.radius; },
                getCenterY: function() { return this.y + this.radius; },
                isIllusion: true,
                master: this,
                alpha: 0.8,
                hue: Math.random() * 360,
                poisonRadius: 80,
                poisonDamage: 3,
                
                // ✅ ADICIONE ESTAS PROPRIEDADES:
                image: this.gameManager.createImage('./assets_img/mysterio.jpg'),
                vel: this.data.speed, // Mesma velocidade do mestre
                pathIndex: 0,
                path: [
                    { x: illusionX, y: illusionY },
                    { x: canvas.width + 50, y: illusionY }
                ]
            };
            
            this.illusions.push(illusion);
                
                // Efeito de spawn
                for (let p = 0; p < 15; p++) {
                    const angle = (Math.PI * 2 / 15) * p;
                    this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                        illusion.getCenterX() + Math.cos(angle) * 25,
                        illusion.getCenterY() + Math.sin(angle) * 25,
                        12,
                        'purple',
                        800
                    ));
                }
            }
            
            this.gameManager.showUI('🌫️ MISTÉRIO: 5 ilusões criadas! Encontre o verdadeiro!', 'warning');
        }
        
        update(deltaTime) {
            super.update(deltaTime);
            
            if (!this.gameManager) return;
            
            this.sinisterAuraPhase += deltaTime / 100;

            // ✅ ATUALIZA MOVIMENTO DAS ILUSÕES
            this.illusions.forEach(illusion => {
            if (illusion.pathIndex < illusion.path.length - 1) {
                const target = illusion.path[illusion.pathIndex + 1];
                const dx = target.x - illusion.x;
                const dy = target.y - illusion.y;
                const distance = Math.hypot(dx, dy);
                
                if (distance < 5) {
                    illusion.pathIndex++;
                } else {
                    const angle = Math.atan2(dy, dx);
                    const moveAmount = illusion.vel * (deltaTime / 1000);
                    illusion.x += Math.cos(angle) * moveAmount;
                    illusion.y += Math.sin(angle) * moveAmount;
                }
            }
        });
            
            // ☠️ Gás Venenoso
            this.poisonGasCooldown -= deltaTime;
            if (this.poisonGasCooldown <= 0) {
                this.releasePoisonGas();
                this.poisonGasCooldown = this.poisonGasInterval;
            }
            
            // Remove ilusões mortas
            this.illusions = this.illusions.filter(illusion => {
                if (illusion.hp <= 0) {
                    this.onIllusionKilled(illusion);
                    return false;
                }
                return true;
            });
            
            // 25% chance de champions não enxergarem
            this.gameManager.champions.forEach(champion => {
                if (Math.random() < 0.0025 && !champion.isBlinded) { // ~0.25% por frame
                    champion.isBlinded = true;
                    champion.blindEndTime = Date.now() + 2000;
                    
                    this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                        champion.getCenterX(),
                        champion.getCenterY() - 30,
                        'CEGO!',
                        'purple',
                        1000
                    ));
                }
            });
        }
        
        releasePoisonGas() {
            if (!this.gameManager) return;
            
            // Gás venenoso do Mistério real
            const gas = {
                x: this.getCenterX(),
                y: this.getCenterY(),
                radius: 100,
                duration: 5000,
                spawnTime: Date.now(),
                damage: 5,
                owner: this
            };
            
            if (!this.gameManager.poisonGases) {
                this.gameManager.poisonGases = [];
            }
            
            this.gameManager.poisonGases.push(gas);
            
            // Também libera gás das ilusões
            this.illusions.forEach(illusion => {
                const illusionGas = {
                    x: illusion.getCenterX(),
                    y: illusion.getCenterY(),
                    radius: illusion.poisonRadius,
                    duration: 5000,
                    spawnTime: Date.now(),
                    damage: illusion.poisonDamage,
                    owner: this
                };
                
                this.gameManager.poisonGases.push(illusionGas);
            });
        }
        
        onIllusionKilled(illusion) {
            this.illusionsKilled++;
            this.rangeBonus += 0.02; // +2%
            this.blindnessBonus += 0.02; // +2%
            
            // Atualiza alcance do Mistério real
            this.data.attackRange = 250 * (1 + this.rangeBonus);
            
            // Efeito de morte da ilusão
            if (this.gameManager) {
                this.gameManager.effects.push(new this.gameManager.BamfEffect(
                    illusion.getCenterX(),
                    illusion.getCenterY(),
                    'purple',
                    600
                ));
                
                for (let i = 0; i < 10; i++) {
                    const angle = (Math.PI * 2 / 10) * i;
                    this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                        illusion.getCenterX() + Math.cos(angle) * 20,
                        illusion.getCenterY() + Math.sin(angle) * 20,
                        12,
                        'purple',
                        600
                    ));
                }
                
                this.gameManager.showUI(`🌫️ Ilusão destruída! Mistério ficou mais forte! (+${(this.rangeBonus * 100).toFixed(0)}% alcance)`, 'warning');
            }
        }
        
        onDeath() {
            // Remove todas as ilusões
            if (this.gameManager) {
                this.illusions.forEach(illusion => {
                    this.gameManager.effects.push(new this.gameManager.BamfEffect(
                        illusion.getCenterX(),
                        illusion.getCenterY(),
                        'purple',
                        800
                    ));
                });
                
                this.illusions = [];
                this.gameManager.showUI('🌫️ Mistério verdadeiro derrotado! Ilusões desapareceram!', 'success');
            }
            
            super.onDeath();
        }
        
        draw(ctx) {
            super.draw(ctx);
            this.drawCrown(ctx);
            
            // Aura sinistra verde
            const pulseSize = 60 + Math.sin(this.sinisterAuraPhase) * 15;
            
            ctx.save();
            const auraGradient = ctx.createRadialGradient(
                this.getCenterX(), this.getCenterY(), 0,
                this.getCenterX(), this.getCenterY(), pulseSize
            );
            auraGradient.addColorStop(0, 'rgba(100, 255, 100, 0.5)');
            auraGradient.addColorStop(0.6, 'rgba(50, 200, 50, 0.3)');
            auraGradient.addColorStop(1, 'rgba(0, 150, 0, 0)');
            
            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(this.getCenterX(), this.getCenterY(), pulseSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Fumaça verde
            if (Math.random() < 0.3) {
                const smokeX = this.getCenterX() + (Math.random() - 0.5) * 40;
                const smokeY = this.getCenterY() + (Math.random() - 0.5) * 40;
                
                ctx.fillStyle = `rgba(50, 255, 50, ${0.3 + Math.random() * 0.3})`;
                ctx.beginPath();
                ctx.arc(smokeX, smokeY, 8 + Math.random() * 8, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
            
            // Indicador de bônus
            if (this.illusionsKilled > 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.shadowColor = 'rgba(100, 255, 100, 1)';
                ctx.shadowBlur = 10;
                ctx.fillText(`↑${(this.rangeBonus * 100).toFixed(0)}%`, this.getCenterX(), this.getCenterY() - this.radius - 35);
                ctx.shadowBlur = 0;
            }
        }
}

// ===============================
// ⚡ LASER RICOCHETE DO LÍDER
// ===============================
export class LeaderLaserProjectile {  // ← ADICIONE 'export' AQUI
    constructor(x, y, targets, damage, owner, gameManager) {
        this.x = x;
        this.y = y;
        this.targets = targets;
        this.currentTargetIndex = 0;
        this.damage = damage;
        this.owner = owner;
        this.gameManager = gameManager;
        this.speed = 500;
        this.isDestroyed = false;
        this.trailParticles = [];
    }
    
    update(deltaTime) {
        if (this.currentTargetIndex >= this.targets.length) {
            this.isDestroyed = true;
            return;
        }
        
        const target = this.targets[this.currentTargetIndex];
        
        if (!target || target.hp <= 0) {
            this.currentTargetIndex++;
            return;
        }
        
        const targetX = target.getCenterX();
        const targetY = target.getCenterY();
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        
        // Adiciona rastro
        this.trailParticles.push({
            x: this.x,
            y: this.y,
            life: 1
        });
        
        if (this.trailParticles.length > 15) {
            this.trailParticles.shift();
        }
        
        this.trailParticles.forEach(p => p.life -= 0.05);
        
        // Movimento
        const moveAmount = this.speed * (deltaTime / 1000);
        
        if (distance < 25) {
            // Acertou o alvo
            target.takeDamage(this.damage, this.owner);
            
            // Efeito de impacto
            this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                targetX, targetY, 40, 400, 'rgba(0, 255, 0, 0.8)'
            ));
            
            // Partículas
            for (let i = 0; i < 8; i++) {
                const particleAngle = (Math.PI * 2 / 8) * i;
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    targetX + Math.cos(particleAngle) * 15,
                    targetY + Math.sin(particleAngle) * 15,
                    10,
                    'lime',
                    500
                ));
            }
            
            // Vai para o próximo alvo
            this.currentTargetIndex++;
            
            if (this.currentTargetIndex >= this.targets.length) {
                this.isDestroyed = true;
            }
        } else {
            this.x += Math.cos(angle) * moveAmount;
            this.y += Math.sin(angle) * moveAmount;
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        // Rastro
        this.trailParticles.forEach(p => {
            if (p.life > 0) {
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10);
                gradient.addColorStop(0, `rgba(0, 255, 0, ${p.life})`);
                gradient.addColorStop(1, 'rgba(0, 200, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Laser verde
        const laserGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 20);
        laserGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        laserGradient.addColorStop(0.4, 'rgba(0, 255, 0, 0.9)');
        laserGradient.addColorStop(1, 'rgba(0, 200, 0, 0)');
        
        ctx.fillStyle = laserGradient;
        ctx.shadowColor = 'rgba(0, 255, 0, 1)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Núcleo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// ===============================
// 🦁 DENTES DE SABRE - EXECUTOR BERSERKER
// ===============================
export class SabretoothExecutor extends Executor {
    constructor(id, x, y, path, gameManager) {
        const data = {
            hp: 500,
            speed: 30,
            radius: 26,
            reward: 0,
            imagePath: './assets_img/Sabretooth.jpg',
            baseDamage: 18,
            attackRange: 50, // Corpo a corpo
            attackSpeed: 800 // Ataque rápido
        };
        
        super(id, x, y, 'sabretooth', data, path, gameManager);
        
        // ⚔️ CAÇADA IMPLACÁVEL
        this.huntedTarget = null;
        this.huntedTargetDamage = 0;
        this.huntBonusSpeed = 0.20; // +20%
        this.huntBonusDamage = 0.20; // +20%
        this.lastDamageSource = null;
        this.damageTracker = new Map(); // Rastreia dano de cada champion
        
        // 💨 INVESTIDA SELVAGEM
        this.dashCooldown = 0;
        this.dashInterval = 6000; // 6s
        this.dashSpeed = 400;
        this.dashDuration = 0;
        this.isDashing = false;
        this.dashTargetX = 0;
        this.dashTargetY = 0;
        this.dashStunDuration = 500; // 0.5s
        this.dashDamage = 60;
        
        // 🩸 FÚRIA SANGRENTA
        this.isEnraged = false;
        this.enrageThreshold = 0.20; // 20% HP
        this.enrageDuration = 5000;
        this.enrageEndTime = 0;
        this.enrageSpeedBonus = 0.25; // +25%
        this.enrageDamageBonus = 0.20; // +20%
        this.enrageRegenRate = 0.01; // 1% por segundo
        
        // 🗡️ RASGO BRUTAL
        this.slashCombo = 0; // 0 ou 1 (2 cortes)
        this.lastSlashTime = 0;
        this.slashComboWindow = 600; // 0.6s para combo
        this.deepWoundDuration = 4000; // 4s
        this.deepWoundHealReduction = 0.50; // -50% cura
        
        // 🎯 COMPORTAMENTO
        this.neverRetreat = true;
        this.prioritizeCloseTowers = true;
        
        // 🎨 VISUAL
        this.furyAuraPhase = 0;
        this.clawTrails = [];
        
        console.log('🦁 DENTES DE SABRE: Caçador selvagem spawnou!');
    }
    
    // ===============================
    // 🎯 CAÇADA IMPLACÁVEL
    // ===============================
    trackDamageSource(amount, attacker) {
        if (!attacker || !attacker.id) return;
        
        const currentDamage = this.damageTracker.get(attacker.id) || 0;
        this.damageTracker.set(attacker.id, currentDamage + amount);
        
        // Atualiza alvo caçado
        let maxDamage = 0;
        let newTarget = null;
        
        this.damageTracker.forEach((damage, championId) => {
            if (damage > maxDamage) {
                maxDamage = damage;
                const champion = this.gameManager.champions.find(c => c.id === championId);
                if (champion && champion.hp > 0) {
                    newTarget = champion;
                }
            }
        });
        
        if (newTarget && newTarget !== this.huntedTarget) {
            this.huntedTarget = newTarget;
            this.huntedTargetDamage = maxDamage;
            
            // Efeito visual de marcação
            this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                newTarget.getCenterX(),
                newTarget.getCenterY() - 40,
                '🎯 CAÇADO!',
                'red',
                1000
            ));
            
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 / 12) * i;
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    newTarget.getCenterX() + Math.cos(angle) * 30,
                    newTarget.getCenterY() + Math.sin(angle) * 30,
                    12,
                    'darkred',
                    800
                ));
            }
        }
    }
    
    getEffectiveSpeed() {
        let speed = this.data.speed;
        
        // Bônus da caçada
        if (this.huntedTarget && this.huntedTarget.hp > 0) {
            speed *= (1 + this.huntBonusSpeed);
        }
        
        // Bônus da fúria
        if (this.isEnraged) {
            speed *= (1 + this.enrageSpeedBonus);
        }
        
        return speed;
    }
    
    getEffectiveDamage() {
        let damage = this.data.baseDamage;
        
        // Bônus da caçada (apenas contra alvo)
        if (this.huntedTarget && this.lastAttackedChampion === this.huntedTarget) {
            damage *= (1 + this.huntBonusDamage);
        }
        
        // Bônus da fúria
        if (this.isEnraged) {
            damage *= (1 + this.enrageDamageBonus);
        }
        
        return damage;
    }
    
    // ===============================
    // 💨 INVESTIDA SELVAGEM
    // ===============================
    executeDash() {
        if (!this.gameManager || this.isDashing) return;
        
        // Encontra o champion que mais causou dano
        let maxDamage = 0;
        let dashTarget = null;
        
        this.damageTracker.forEach((damage, championId) => {
            if (damage > maxDamage) {
                const champion = this.gameManager.champions.find(c => c.id === championId && c.hp > 0);
                if (champion) {
                    maxDamage = damage;
                    dashTarget = champion;
                }
            }
        });
        
        if (!dashTarget) return;
        
        this.isDashing = true;
        this.dashDuration = 1000; // 1s de dash
        this.dashTargetX = dashTarget.getCenterX();
        this.dashTargetY = dashTarget.getCenterY();
        
        // Efeito visual de preparação
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.getCenterX(),
            this.getCenterY(),
            50,
            300,
            'rgba(255, 100, 0, 0.8)'
        ));
        
        this.gameManager.showUI('🦁 INVESTIDA SELVAGEM!', 'warning');
    }
    
    updateDash(deltaTime) {
        if (!this.isDashing) return;
        
        this.dashDuration -= deltaTime;
        
        if (this.dashDuration <= 0) {
            this.isDashing = false;
            
            // Impacto no destino
            this.dashImpact();
            return;
        }
        
        // Movimento do dash
        const dx = this.dashTargetX - this.getCenterX();
        const dy = this.dashTargetY - this.getCenterY();
        const distance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        
        if (distance < 10) {
            this.isDashing = false;
            this.dashImpact();
            return;
        }
        
        const moveAmount = this.dashSpeed * (deltaTime / 1000);
        this.x += Math.cos(angle) * moveAmount;
        this.y += Math.sin(angle) * moveAmount;
        
        // Rastro de dash
        if (Math.random() < 0.3) {
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.getCenterX() + (Math.random() - 0.5) * 30,
                this.getCenterY() + (Math.random() - 0.5) * 30,
                15,
                'orange',
                400
            ));
        }
    }
    
    dashImpact() {
        if (!this.gameManager) return;
        
        const impactRadius = 80;
        
        // Dano e stun em champions próximos
        this.gameManager.champions.forEach(champion => {
            const dist = Math.hypot(
                champion.getCenterX() - this.getCenterX(),
                champion.getCenterY() - this.getCenterY()
            );
            
            if (dist <= impactRadius && champion.hp > 0) {
                champion.takeDamage(this.dashDamage, this);
                
                // Atordoamento
                champion.isStunned = true;
                champion.stunEndTime = Date.now() + this.dashStunDuration;
                
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    champion.getCenterX(),
                    champion.getCenterY() - 30,
                    'ATORDOADO!',
                    'yellow',
                    800
                ));
            }
        });
        
        // Explosão visual
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.getCenterX(),
            this.getCenterY(),
            impactRadius,
            800,
            'rgba(255, 150, 0, 0.9)'
        ));
        
        // Ondas de choque
        for (let i = 0; i < 2; i++) {
            setTimeout(() => {
                this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                    this.getCenterX(),
                    this.getCenterY(),
                    60 + i * 30,
                    400
                ));
            }, i * 100);
        }
    }
    
    // ===============================
    // 🩸 FÚRIA SANGRENTA
    // ===============================
    checkEnrage() {
        if (this.isEnraged) return;
        
        const hpPercent = this.hp / this.maxHp;
        
        if (hpPercent <= this.enrageThreshold) {
            this.isEnraged = true;
            this.enrageEndTime = Date.now() + this.enrageDuration;
            
            // Efeito visual épico
            this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                this.getCenterX(),
                this.getCenterY(),
                100,
                1000,
                'rgba(255, 0, 0, 0.9)'
            ));
            
            // Raios vermelhos
            for (let i = 0; i < 20; i++) {
                const angle = (Math.PI * 2 / 20) * i;
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.getCenterX() + Math.cos(angle) * 40,
                    this.getCenterY() + Math.sin(angle) * 40,
                    18,
                    'red',
                    1200
                ));
            }
            
            this.gameManager.showUI('🦁 FÚRIA SANGRENTA ATIVADA!', 'ultimate');
        }
    }
    
    updateEnrage(deltaTime) {
        if (!this.isEnraged) return;
        
        // Regeneração
        const regenAmount = this.maxHp * this.enrageRegenRate * (deltaTime / 1000);
        this.hp = Math.min(this.hp + regenAmount, this.maxHp);
        
        // Partículas de fúria
        if (Math.random() < 0.2) {
            const angle = Math.random() * Math.PI * 2;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.getCenterX() + Math.cos(angle) * 25,
                this.getCenterY() + Math.sin(angle) * 25,
                12,
                'darkred',
                500
            ));
        }
        
        // Fim da fúria
        if (Date.now() >= this.enrageEndTime) {
            this.isEnraged = false;
            this.gameManager.showUI('🦁 Fúria Sangrenta terminou', 'info');
        }
    }
    
    // ===============================
    // 🗡️ RASGO BRUTAL (2 Cortes)
    // ===============================
    performSlashAttack(target) {
        if (!target) return;
        
        const now = Date.now();
        const damage = this.getEffectiveDamage();
        
        // Sistema de combo
        if (now - this.lastSlashTime > this.slashComboWindow) {
            this.slashCombo = 0;
        }
        
        // Corte 1 ou 2
        this.slashCombo = (this.slashCombo + 1) % 2;
        this.lastSlashTime = now;
        
        // Dano dobrado (2 cortes rápidos)
        target.takeDamage(damage, this);
        
        // Aplica ferida profunda
        target.hasDeepWound = true;
        target.deepWoundEndTime = now + this.deepWoundDuration;
        target.deepWoundHealReduction = this.deepWoundHealReduction;
        
        // Efeito visual do corte
        const slashAngle = this.slashCombo === 0 ? -0.5 : 0.5;
        
        for (let i = 0; i < 5; i++) {
            const offset = i * 10;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                target.getCenterX() + Math.cos(slashAngle) * offset,
                target.getCenterY() + Math.sin(slashAngle) * offset,
                10,
                'crimson',
                400
            ));
        }
        
        // Rastro da garra
        this.clawTrails.push({
            x: target.getCenterX(),
            y: target.getCenterY(),
            angle: slashAngle,
            life: 1
        });
        
        if (this.clawTrails.length > 10) {
            this.clawTrails.shift();
        }
        
        // Indicador de ferida
        if (this.slashCombo === 1) {
            this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                target.getCenterX(),
                target.getCenterY() - 35,
                '🩸 FERIDA PROFUNDA!',
                'darkred',
                1000
            ));
        }
    }
    
    // ===============================
    // 📊 UPDATE PRINCIPAL
    // ===============================
    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.gameManager) return;
        
        // Verifica fúria
        this.checkEnrage();
        
        // Atualiza fúria
        if (this.isEnraged) {
            this.updateEnrage(deltaTime);
        }
        
        // Atualiza dash
        if (this.isDashing) {
            this.updateDash(deltaTime);
            return; // Não faz mais nada durante o dash
        }
        
        // Cooldown do dash
        this.dashCooldown -= deltaTime;
        if (this.dashCooldown <= 0 && this.damageTracker.size > 0) {
            this.executeDash();
            this.dashCooldown = this.dashInterval;
        }
        
        // Atualiza velocidade baseada na caçada
        this.vel = this.getEffectiveSpeed();
        
        // Remove alvo caçado se morreu
        if (this.huntedTarget && this.huntedTarget.hp <= 0) {
            this.huntedTarget = null;
            this.damageTracker.delete(this.huntedTarget?.id);
        }
        
        // Atualiza rastros de garras
        this.clawTrails.forEach(trail => trail.life -= 0.05);
        this.clawTrails = this.clawTrails.filter(t => t.life > 0);
        
        // Aura visual
        this.furyAuraPhase += deltaTime / 100;
    }
    
    // ===============================
    // 💥 OVERRIDE: TAKE DAMAGE
    // ===============================
    takeDamage(amount, attacker) {
        super.takeDamage(amount, attacker);
        
        // Rastreia fonte de dano
        this.trackDamageSource(amount, attacker);
        
        // Sangue extra
        if (this.gameManager) {
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.getCenterX() + Math.cos(angle) * 15,
                    this.getCenterY() + Math.sin(angle) * 15,
                    10,
                    'darkred',
                    500
                ));
            }
        }
    }
    
    // ===============================
    // 💀 OVERRIDE: DEATH
    // ===============================
    onDeath() {
        if (this.gameManager) {
            // Remove marcações
            this.damageTracker.clear();
            
            // Explosão brutal
            this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                this.getCenterX(),
                this.getCenterY(),
                120,
                1500,
                'rgba(139, 0, 0, 1)'
            ));
            
            // Sangue explosivo
            for (let i = 0; i < 40; i++) {
                const angle = (Math.PI * 2 / 40) * i;
                const distance = 30 + Math.random() * 40;
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.getCenterX() + Math.cos(angle) * distance,
                    this.getCenterY() + Math.sin(angle) * distance,
                    15,
                    'crimson',
                    1500
                ));
            }
        }
        
        super.onDeath();
    }
    
    // ===============================
    // 🎨 RENDER
    // ===============================
    draw(ctx) {
        // Rastros de garras
        this.clawTrails.forEach(trail => {
            if (trail.life > 0) {
                ctx.save();
                ctx.translate(trail.x, trail.y);
                ctx.rotate(trail.angle);
                
                ctx.strokeStyle = `rgba(139, 0, 0, ${trail.life})`;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                
                ctx.beginPath();
                ctx.moveTo(-20, -10);
                ctx.lineTo(20, 10);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(-15, 0);
                ctx.lineTo(25, 0);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(-20, 10);
                ctx.lineTo(20, -10);
                ctx.stroke();
                
                ctx.restore();
            }
        });
        
        // Aura de fúria
        if (this.isEnraged) {
            const pulseSize = 70 + Math.sin(this.furyAuraPhase) * 20;
            
            ctx.save();
            const auraGradient = ctx.createRadialGradient(
                this.getCenterX(), this.getCenterY(), 0,
                this.getCenterX(), this.getCenterY(), pulseSize
            );
            auraGradient.addColorStop(0, 'rgba(255, 0, 0, 0.6)');
            auraGradient.addColorStop(0.5, 'rgba(200, 0, 0, 0.4)');
            auraGradient.addColorStop(1, 'rgba(150, 0, 0, 0)');
            
            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(this.getCenterX(), this.getCenterY(), pulseSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Marcação de alvo caçado
        if (this.huntedTarget && this.huntedTarget.hp > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            ctx.beginPath();
            ctx.moveTo(this.getCenterX(), this.getCenterY());
            ctx.lineTo(this.huntedTarget.getCenterX(), this.huntedTarget.getCenterY());
            ctx.stroke();
            
            ctx.setLineDash([]);
            ctx.restore();
        }
        
        super.draw(ctx);
        this.drawCrown(ctx);
        
        // Indicador de fúria
        if (this.isEnraged) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 0, 0, 1)';
            ctx.shadowBlur = 10;
            ctx.fillText('🩸 FÚRIA', this.getCenterX(), this.getCenterY() - this.radius - 40);
            ctx.shadowBlur = 0;
        }
    }
}

// ===============================
// 🤖 MOLDE MESTRE - EXECUTOR FABRICANTE
// ===============================
export class MasterMoldExecutor extends Executor {
    constructor(id, x, y, path, gameManager) {
        const data = {
            hp: 450,
            speed: 22,
            radius: 28,
            reward: 0,
            imagePath: './assets_img/molde_mestre.webp',
            baseDamage: 15,
            attackRange: 200,
            attackSpeed: 2000
        };
        
        super(id, x, y, 'mastermold', data, path, gameManager);
        
        // 🏭 PRODUÇÃO DE SENTINELAS
        this.maxSentinels = 5;
        this.sentinels = [];
        this.spawnCooldownBase = 1000; // 1s base
        this.spawnCooldown = 0;
        this.spawnRadius = 100;
        this.productionBoostActive = false; // +30% quando <50% HP
        this.productionBoostMultiplier = 0.70; // 0.7s ao invés de 1s = +30% mais rápido
        
        // 📊 CONTADOR DE TIPOS DESTRUÍDOS
        this.sentinelDeaths = {
            energy: 0,
            cannonball: 0,
            adaptoid: 0
        };
        this.priorityType = null; // Tipo prioritário para reposição
        
        // 🎯 SISTEMA DE PRIORIZAÇÃO
        this.lastDestroyedType = null;
        this.lastDestroyedTime = 0;
        this.quickDestructionThreshold = 3000; // 3s = "destruído rápido demais"
        
        // 🎨 VISUAL
        this.factoryGlow = 0;
        this.productionParticles = [];
        
        console.log('🤖 MOLDE MESTRE: Fábrica de Sentinelas ativada!');
    }
    
    // ===============================
    // 🏭 SISTEMA DE PRODUÇÃO
    // ===============================
    getProductionSpeed() {
        const hpPercent = this.hp / this.maxHp;
        
        if (hpPercent < 0.50 && !this.productionBoostActive) {
            this.productionBoostActive = true;
            this.gameManager.showUI('🤖 MOLDE MESTRE: Produção acelerada! +30%', 'warning');
        }
        
        if (this.productionBoostActive) {
            return this.spawnCooldownBase * this.productionBoostMultiplier;
        }
        
        return this.spawnCooldownBase;
    }
    
    decideSentinelType() {
        // 1️⃣ PRIORIDADE: Recriar tipo destruído recentemente
        if (this.priorityType) {
            const type = this.priorityType;
            this.priorityType = null; // Reseta após usar
            return type;
        }
        
        // 2️⃣ ESTRATÉGIA: Balancear tipos
        const counts = {
            energy: this.sentinels.filter(s => s.type === 'energy').length,
            cannonball: this.sentinels.filter(s => s.type === 'cannonball').length,
            adaptoid: this.sentinels.filter(s => s.type === 'adaptoid').length
        };
        
        // 3️⃣ ADAPTOID: Apenas se HP baixo (<50%)
        const hpPercent = this.hp / this.maxHp;
        if (hpPercent < 0.50 && counts.adaptoid < 2) {
            return 'adaptoid';
        }
        
        // 4️⃣ BALANCEAMENTO: Cria o tipo com menos unidades
        const minCount = Math.min(counts.energy, counts.cannonball, counts.adaptoid);
        
        if (counts.energy === minCount) return 'energy';
        if (counts.cannonball === minCount) return 'cannonball';
        return 'adaptoid';
    }
    
    spawnSentinel() {
        if (this.sentinels.length >= this.maxSentinels) return;
        
        const type = this.decideSentinelType();
        const angle = Math.random() * Math.PI * 2;
        const spawnX = this.getCenterX() + Math.cos(angle) * this.spawnRadius;
        const spawnY = this.getCenterY() + Math.sin(angle) * this.spawnRadius;
        
        let sentinel = null;
        
        switch(type) {
            case 'energy':
                sentinel = new EnergySentinel(
                    `sentinel-energy-${Date.now()}-${Math.random()}`,
                    spawnX,
                    spawnY,
                    this,
                    this.gameManager
                );
                break;
                
            case 'cannonball':
                sentinel = new CannonballSentinel(
                    `sentinel-cannonball-${Date.now()}-${Math.random()}`,
                    spawnX,
                    spawnY,
                    this,
                    this.gameManager
                );
                break;
                
            case 'adaptoid':
                sentinel = new AdaptoidSentinel(
                    `sentinel-adaptoid-${Date.now()}-${Math.random()}`,
                    spawnX,
                    spawnY,
                    this,
                    this.gameManager
                );
                break;
        }
        
        if (sentinel) {
            this.sentinels.push(sentinel);
            
            // ✅ EFEITO DE FABRICAÇÃO ÉPICO
            
            // 1️⃣ Explosão central
            this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                spawnX,
                spawnY,
                80,
                800,
                'rgba(0, 150, 255, 0.8)'
            ));
            
            // 2️⃣ Raios azuis girando
            for (let i = 0; i < 20; i++) {
                const particleAngle = (Math.PI * 2 / 20) * i;
                setTimeout(() => {
                    this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                        spawnX + Math.cos(particleAngle) * 40,
                        spawnY + Math.sin(particleAngle) * 40,
                        12,
                        'cyan',
                        600
                    ));
                }, i * 30);
            }
            
            // 3️⃣ Ondas de choque
            for (let w = 0; w < 3; w++) {
                setTimeout(() => {
                    this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                        spawnX,
                        spawnY,
                        50 + w * 25,
                        400
                    ));
                }, w * 100);
            }
            
            // 4️⃣ Linha de energia do Molde Mestre até a sentinela
            for (let i = 0; i < 10; i++) {
                const t = i / 10;
                const lineX = this.getCenterX() + (spawnX - this.getCenterX()) * t;
                const lineY = this.getCenterY() + (spawnY - this.getCenterY()) * t;
                
                setTimeout(() => {
                    this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                        lineX,
                        lineY,
                        10,
                        'lightblue',
                        300
                    ));
                }, i * 40);
            }
            
            // 5️⃣ Texto de tipo
            const typeNames = {
                energy: '⚡ ENERGIA',
                cannonball: '🚀 CANHÃO',
                adaptoid: '🛡️ ADAPTOID'
    };
        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
            spawnX,
            spawnY - 30,
            typeNames[type],
            'cyan',
            1000
        ));
    }
    }
        
    onSentinelDestroyed(sentinel) {
        const destroyTime = Date.now();
        const type = sentinel.type;
        
        // Remove da lista
        this.sentinels = this.sentinels.filter(s => s.id !== sentinel.id);
        
        // Incrementa contador
        this.sentinelDeaths[type]++;
        
        // ✅ DETECÇÃO DE DESTRUIÇÃO RÁPIDA
        if (this.lastDestroyedType === type && 
            (destroyTime - this.lastDestroyedTime) < this.quickDestructionThreshold) {
            
            this.priorityType = type;
            
        }
        
        this.lastDestroyedType = type;
        this.lastDestroyedTime = destroyTime;
    }
    
    // ===============================
    // 📊 UPDATE PRINCIPAL
    // ===============================
    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.gameManager) return;
        
        // 🏭 Produção de sentinelas
        this.spawnCooldown -= deltaTime;
        if (this.spawnCooldown <= 0) {
            this.spawnSentinel();
            this.spawnCooldown = this.getProductionSpeed();
        }
        
        // 🤖 Atualiza sentinelas
        this.sentinels.forEach(sentinel => {
            if (sentinel && sentinel.update) {
                sentinel.update(deltaTime);
            }
        });
        
        // 🗑️ Remove sentinelas mortas
        this.sentinels = this.sentinels.filter(s => s.hp > 0);
        
        // 🎨 Visual
        this.factoryGlow += deltaTime / 100;
        
        // Partículas de produção
        if (this.productionBoostActive && Math.random() < 0.3) {
            const angle = Math.random() * Math.PI * 2;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.getCenterX() + Math.cos(angle) * 30,
                this.getCenterY() + Math.sin(angle) * 30,
                12,
                'orange',
                400
            ));
        }
    }
    
    // ===============================
    // 💀 OVERRIDE: DEATH
    // ===============================
    onDeath() {
        // Destrói todas as sentinelas
        if (this.gameManager) {
            this.sentinels.forEach(sentinel => {
                if (sentinel.hp > 0) {
                    this.gameManager.effects.push(new this.gameManager.BamfEffect(
                        sentinel.x,
                        sentinel.y,
                        'cyan',
                        600
                    ));
                }
            });
            
            this.sentinels = [];
            
            // Explosão da fábrica
            this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                this.getCenterX(),
                this.getCenterY(),
                150,
                1500,
                'rgba(0, 150, 255, 0.9)'
            ));
            
            this.gameManager.showUI('🤖 MOLDE MESTRE: Fábrica destruída!', 'success');
        }
        
        super.onDeath();
    }
    
    // ===============================
    // 🎨 RENDER
    // ===============================
    draw(ctx) {
        // Aura de produção
        const pulseSize = 50 + Math.sin(this.factoryGlow) * 15;
        const alpha = this.productionBoostActive ? 0.6 : 0.3;
        
        ctx.save();
        const auraGradient = ctx.createRadialGradient(
            this.getCenterX(), this.getCenterY(), 0,
            this.getCenterX(), this.getCenterY(), pulseSize
        );
        auraGradient.addColorStop(0, `rgba(0, 150, 255, ${alpha})`);
        auraGradient.addColorStop(0.5, `rgba(0, 100, 200, ${alpha * 0.5})`);
        auraGradient.addColorStop(1, 'rgba(0, 50, 150, 0)');
        
        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(this.getCenterX(), this.getCenterY(), pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        super.draw(ctx);
        this.drawCrown(ctx);
        
        // Sentinelas ativas
        this.sentinels.forEach(sentinel => {
            if (sentinel && sentinel.draw) {
                sentinel.draw(ctx);
            }
        });
        
        // Contador de sentinelas
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 150, 255, 1)';
        ctx.shadowBlur = 10;
        ctx.fillText(
            `🤖 ${this.sentinels.length}/${this.maxSentinels}`,
            this.getCenterX(),
            this.getCenterY() - this.radius - 35
        );
        ctx.shadowBlur = 0;
        
        // Indicador de boost
        if (this.productionBoostActive) {
            ctx.fillStyle = 'rgba(255, 150, 0, 0.9)';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('⚡ +30%', this.getCenterX(), this.getCenterY() - this.radius - 50);
        }
    }
}

// ===============================
// ⚡ SENTINELA ENERGIA (MELHORADA)
// ===============================
class EnergySentinel {
    constructor(id, x, y, master, gameManager) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = 22; // ✅ MAIOR (era 15)
        this.hp = 50;
        this.maxHp = 50;
        this.type = 'energy';
        this.master = master;
        this.gameManager = gameManager;
        
        this.speed = 80;
        this.attackRange = 250;
        this.attackCooldown = 0;
        this.attackInterval = 2000;
        this.projectileDamage = 25;
        this.explosionRadius = 60;
        
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.orbitRadius = 60;
        this.orbitSpeed = 0.02;
        
        this.glowPhase = 0; // ✅ PARA ANIMAÇÃO
        
        this.image = gameManager.createImage('./assets_img/sentinel_energy.webp');
    }
    
    getCenterX() { return this.x; }
    getCenterY() { return this.y; }
    
    update(deltaTime) {
        if (!this.master || this.master.hp <= 0) {
            this.hp = 0;
            return;
        }
        
        // Orbita ao redor do Molde Mestre
        this.orbitAngle += this.orbitSpeed;
        this.x = this.master.getCenterX() + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.y = this.master.getCenterY() + Math.sin(this.orbitAngle) * this.orbitRadius;
        
        this.glowPhase += deltaTime / 100; // ✅ ANIMAÇÃO
        
        // Ataque
        this.attackCooldown -= deltaTime;
        if (this.attackCooldown <= 0) {
            this.fireEnergyBlast();
            this.attackCooldown = this.attackInterval;
        }
    }
    
    fireEnergyBlast() {
        const targets = this.gameManager.champions.filter(c => c.hp > 0);
        if (targets.length === 0) return;
        
        const target = targets.reduce((closest, current) => {
            const distCurrent = Math.hypot(current.getCenterX() - this.x, current.getCenterY() - this.y);
            const distClosest = Math.hypot(closest.getCenterX() - this.x, closest.getCenterY() - this.y);
            return distCurrent < distClosest ? current : closest;
        });
        
        const dist = Math.hypot(target.getCenterX() - this.x, target.getCenterY() - this.y);
        if (dist > this.attackRange) return;
        
        const projectile = new EnergyBlastProjectile(
            this.x,
            this.y,
            target,
            this.projectileDamage,
            this.explosionRadius,
            this,
            this.gameManager
        );
        
        if (!this.gameManager.sentinelProjectiles) {
            this.gameManager.sentinelProjectiles = [];
        }
        
        this.gameManager.sentinelProjectiles.push(projectile);
    }
    
    takeDamage(amount, attacker) {
        this.hp -= amount;
        
        if (this.hp <= 0) {
            this.onDeath();
        }
    }
    
    onDeath() {
        this.gameManager.effects.push(new this.gameManager.BamfEffect(
            this.x,
            this.y,
            'cyan',
            500
        ));
        
        this.master.onSentinelDestroyed(this);
    }
    
    draw(ctx) {
        ctx.save();
        
        // ✅ BRILHO PULSANTE MAIS FORTE
        const pulseSize = this.radius * 2.5 + Math.sin(this.glowPhase) * 8;
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, pulseSize);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // ✅ RAIOS DE ENERGIA
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 / 4) * i + this.glowPhase;
            const rayLength = this.radius * 1.5;
            
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.6 + Math.sin(this.glowPhase + i) * 0.3})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + Math.cos(angle) * rayLength,
                this.y + Math.sin(angle) * rayLength
            );
            ctx.stroke();
        }
        
        // Corpo
        if (this.image.complete) {
            ctx.drawImage(
                this.image,
                this.x - this.radius,
                this.y - this.radius,
                this.radius * 2,
                this.radius * 2
            );
        } else {
            ctx.fillStyle = 'cyan';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // HP bar
        const barWidth = 35;
        const barHeight = 5;
        const hpPercent = this.hp / this.maxHp;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 12, barWidth, barHeight);
        
        ctx.fillStyle = 'cyan';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 12, barWidth * hpPercent, barHeight);
        
        ctx.restore();
    }
}
// ===============================
// 💥 PROJÉTIL DE ENERGIA
// ===============================
class EnergyBlastProjectile {
    constructor(x, y, target, damage, explosionRadius, owner, gameManager) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.explosionRadius = explosionRadius;
        this.owner = owner;
        this.gameManager = gameManager;
        
        this.speed = 300;
        this.radius = 12;
        this.isDestroyed = false;
        this.trailParticles = [];
    }
    
    update(deltaTime) {
        if (!this.target || this.target.hp <= 0) {
            this.isDestroyed = true;
            return;
        }
        
        const targetX = this.target.getCenterX();
        const targetY = this.target.getCenterY();
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        
        // Rastro
        this.trailParticles.push({ x: this.x, y: this.y, life: 1 });
        if (this.trailParticles.length > 10) {
            this.trailParticles.shift();
        }
        this.trailParticles.forEach(p => p.life -= 0.1);
        
        // Movimento
        const moveAmount = this.speed * (deltaTime / 1000);
        
        if (distance < 20) {
            this.explode();
        } else {
            this.x += Math.cos(angle) * moveAmount;
            this.y += Math.sin(angle) * moveAmount;
        }
    }
    
    explode() {
        // Dano em área
        this.gameManager.champions.forEach(champion => {
            const dist = Math.hypot(champion.getCenterX() - this.x, champion.getCenterY() - this.y);
            if (dist <= this.explosionRadius && champion.hp > 0) {
                champion.takeDamage(this.damage, this.owner);
            }
        });
        
        // Efeito visual
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.x,
            this.y,
            this.explosionRadius,
            600,
            'rgba(0, 255, 255, 0.8)'
        ));
        
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 / 15) * i;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.x + Math.cos(angle) * 30,
                this.y + Math.sin(angle) * 30,
                10,
                'cyan',
                500
            ));
        }
        
        this.isDestroyed = true;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Rastro
        this.trailParticles.forEach(p => {
            if (p.life > 0) {
                ctx.fillStyle = `rgba(0, 255, 255, ${p.life * 0.5})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Esfera de energia
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 150, 255, 0.5)');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'cyan';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.restore();
    }
}

// ===============================
// 🚀 SENTINELA BOLA DE CANHÃO (MELHORADA)
// ===============================
class CannonballSentinel {
    constructor(id, x, y, master, gameManager) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = 22; // ✅ MAIOR (era 15)
        this.hp = 60;
        this.maxHp = 60;
        this.type = 'cannonball';
        this.master = master;
        this.gameManager = gameManager;
        
        this.speed = 300;
        this.damage = 20;
        this.isLaunched = false;
        this.target = null;
        this.launchCooldown = 1000;
        
        this.trailParticles = [];
        this.thrustPhase = 0; // ✅ PARA ANIMAÇÃO
        
        this.image = gameManager.createImage('./assets_img/sentinel_cannonball.webp');
    }
    
    getCenterX() { return this.x; }
    getCenterY() { return this.y; }
    
    update(deltaTime) {
        if (!this.master || this.master.hp <= 0) {
            this.hp = 0;
            return;
        }
        
        this.thrustPhase += deltaTime / 50; // ✅ ANIMAÇÃO
        
        if (!this.isLaunched) {
            this.launchCooldown -= deltaTime;
            
            if (this.launchCooldown <= 0) {
                this.chooseTargetAndLaunch();
            }
        } else {
            this.flyToTarget(deltaTime);
        }
    }
    
    chooseTargetAndLaunch() {
        const targets = this.gameManager.champions.filter(c => c.hp > 0);
        if (targets.length === 0) return;
        
        this.target = targets.reduce((lowest, current) => {
            return current.hp < lowest.hp ? current : lowest;
        });
        
        this.isLaunched = true;
        
        // ✅ EFEITO DE LANÇAMENTO
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.x,
            this.y,
            40,
            400,
            'rgba(255, 150, 0, 0.8)'
        ));
        
        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
            this.x,
            this.y - 20,
            '🚀 LANÇADO!',
            'orange',
            600
        ));
    }
    
    flyToTarget(deltaTime) {
        if (!this.target || this.target.hp <= 0) {
            this.hp = 0;
            return;
        }
        
        const targetX = this.target.getCenterX();
        const targetY = this.target.getCenterY();
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        
        // Rastro de fogo
        this.trailParticles.push({ x: this.x, y: this.y, life: 1 });
        if (this.trailParticles.length > 15) {
            this.trailParticles.shift();
        }
        this.trailParticles.forEach(p => p.life -= 0.08);
        
        const moveAmount = this.speed * (deltaTime / 1000);
        
        if (distance < 25) {
            this.impact();
        } else {
            this.x += Math.cos(angle) * moveAmount;
            this.y += Math.sin(angle) * moveAmount;
        }
    }
    
    impact() {
        if (this.target && this.target.hp > 0) {
            this.target.takeDamage(this.damage, this);
        }
        
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.x,
            this.y,
            50,
            600,
            'rgba(255, 100, 0, 0.9)'
        ));
        
        this.hp = 0;
        this.master.onSentinelDestroyed(this);
    }
    
    takeDamage(amount, attacker) {
        this.hp -= amount;
        
        if (this.hp <= 0) {
            this.onDeath();
        }
    }
    
    onDeath() {
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.x,
            this.y,
            40,
            400,
            'rgba(255, 50, 0, 0.8)'
        ));
        
        this.master.onSentinelDestroyed(this);
    }
    
    draw(ctx) {
        ctx.save();
        
        // Rastro de fogo
        this.trailParticles.forEach(p => {
            if (p.life > 0) {
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
                gradient.addColorStop(0, `rgba(255, 150, 0, ${p.life})`);
                gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // ✅ CHAMAS DE PROPULSÃO (se lançado)
        if (this.isLaunched) {
            for (let i = 0; i < 3; i++) {
                const flameSize = this.radius * 0.6 + Math.sin(this.thrustPhase + i) * 5;
                const flameX = this.x - Math.cos(Math.atan2(
                    this.target.getCenterY() - this.y,
                    this.target.getCenterX() - this.x
                )) * (this.radius + i * 8);
                const flameY = this.y - Math.sin(Math.atan2(
                    this.target.getCenterY() - this.y,
                    this.target.getCenterX() - this.x
                )) * (this.radius + i * 8);
                
                const flameGradient = ctx.createRadialGradient(flameX, flameY, 0, flameX, flameY, flameSize);
                flameGradient.addColorStop(0, 'rgba(255, 255, 100, 0.9)');
                flameGradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.7)');
                flameGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                
                ctx.fillStyle = flameGradient;
                ctx.beginPath();
                ctx.arc(flameX, flameY, flameSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Corpo
        if (this.image.complete) {
            ctx.drawImage(
                this.image,
                this.x - this.radius,
                this.y - this.radius,
                this.radius * 2,
                this.radius * 2
            );
        } else {
            ctx.fillStyle = 'orange';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // HP bar
        const barWidth = 35;
        const barHeight = 5;
        const hpPercent = this.hp / this.maxHp;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 12, barWidth, barHeight);
        
        ctx.fillStyle = 'orange';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 12, barWidth * hpPercent, barHeight);
        
        ctx.restore();
    }
}

// ===============================
// 🛡️ SENTINELA ADAPTOID (MELHORADA)
// ===============================
class AdaptoidSentinel {
    constructor(id, x, y, master, gameManager) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = 24; // ✅ MAIOR (era 16)
        this.hp = 70;
        this.maxHp = 70;
        this.type = 'adaptoid';
        this.master = master;
        this.gameManager = gameManager;
        
        this.speed = 60;
        this.healAmount = 15;
        this.damageReduction = 0.15;
        this.isShielding = true;
        
        this.hologramCooldown = 0;
        this.hologramInterval = 5000;
        this.holograms = [];
        
        this.canMerge = true;
        this.mergeThreshold = 20;
        
        this.orbitAngle = Math.random() * Math.PI * 2;
        this.orbitRadius = 80;
        this.orbitSpeed = 0.015;
        
        this.shieldPulse = 0;
        this.shieldRotation = 0; // ✅ PARA ANIMAÇÃO
        
        this.image = gameManager.createImage('./assets_img/sentinel_adaptoid.webp');
    }
    
    getCenterX() { return this.x; }
    getCenterY() { return this.y; }
    
    update(deltaTime) {
        if (!this.master || this.master.hp <= 0) {
            this.hp = 0;
            return;
        }
        
        if (this.canMerge && this.master.hp <= this.mergeThreshold) {
            this.mergeWithMaster();
            return;
        }
        
        this.orbitAngle += this.orbitSpeed;
        this.x = this.master.getCenterX() + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.y = this.master.getCenterY() + Math.sin(this.orbitAngle) * this.orbitRadius;
        
        this.hologramCooldown -= deltaTime;
        if (this.hologramCooldown <= 0) {
            this.createHologram();
            this.hologramCooldown = this.hologramInterval;
        }
        
        this.holograms.forEach(holo => {
            if (holo.update) holo.update(deltaTime);
        });
        
        this.holograms = this.holograms.filter(h => h.hp > 0);
        
        this.shieldPulse += deltaTime / 100;
        this.shieldRotation += deltaTime / 1000; // ✅ ROTAÇÃO DO ESCUDO
    }
    
    createHologram() {
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        
        const hologram = {
            id: `hologram-${Date.now()}-${Math.random()}`,
            x: this.master.getCenterX() + Math.cos(angle) * distance,
            y: this.master.getCenterY() + Math.sin(angle) * distance,
            radius: 20,
            hp: 1,
            maxHp: 1,
            alpha: 0.6,
            phaseShift: Math.random() * Math.PI * 2,
            
            getCenterX() { return this.x; },
            getCenterY() { return this.y; },
            
            takeDamage(amount) {
                this.hp = 0;
            },
            
            update(deltaTime) {
                this.phaseShift += 0.05;
                this.alpha = 0.4 + Math.sin(this.phaseShift) * 0.3;
            },
            
            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.radius
                );
                gradient.addColorStop(0, 'rgba(0, 255, 100, 0.8)');
                gradient.addColorStop(1, 'rgba(0, 150, 50, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'rgba(0, 255, 100, 1)';
                ctx.fillText('🤖', this.x, this.y + 7);
                
                ctx.globalAlpha = 1;
                ctx.restore();
            }
        };
        
        this.holograms.push(hologram);
        
        if (!this.gameManager.holograms) {
            this.gameManager.holograms = [];
        }
        this.gameManager.holograms.push(hologram);
        
        this.gameManager.effects.push(new this.gameManager.BamfEffect(
            hologram.x,
            hologram.y,
            'lime',
            400
        ));
    }
    
    mergeWithMaster() {
        this.master.hp = Math.min(this.master.hp + this.healAmount, this.master.maxHp);
        
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.x,
            this.y,
            60,
            800,
            'rgba(0, 255, 100, 0.9)'
        ));
        
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 / 15) * i;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.x + Math.cos(angle) * 25,
                this.y + Math.sin(angle) * 25,
                12,
                'lime',
                800
            ));
        }
        
        this.gameManager.showUI(`🛡️ ADAPTOID: Fusão! +${this.healAmount} HP`, 'success');
        
        this.hp = 0;
        this.master.onSentinelDestroyed(this);
    }
    
    takeDamage(amount, attacker) {
        this.hp -= amount;
        
        if (this.hp <= 0) {
            this.onDeath();
        }
    }
    
    onDeath() {
        this.holograms.forEach(holo => {
            this.gameManager.effects.push(new this.gameManager.BamfEffect(
                holo.x,
                holo.y,
                'lime',
                300
            ));
        });
        
        this.gameManager.effects.push(new this.gameManager.BamfEffect(
            this.x,
            this.y,
            'lime',
            500
        ));
        
        this.master.onSentinelDestroyed(this);
    }
    
    draw(ctx) {
        ctx.save();
        
        // ✅ ESCUDO HEXAGONAL ROTATIVO
        const shieldSize = this.radius * 2.2;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.shieldRotation);
        
        ctx.strokeStyle = `rgba(0, 255, 100, ${0.5 + Math.sin(this.shieldPulse) * 0.3})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            const x = Math.cos(angle) * shieldSize;
            const y = Math.sin(angle) * shieldSize;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.rotate(-this.shieldRotation);
        ctx.translate(-this.x, -this.y);
        
        // Brilho do escudo
        const shieldGradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, shieldSize
        );
        shieldGradient.addColorStop(0, 'rgba(0, 255, 100, 0.3)');
        shieldGradient.addColorStop(0.7, 'rgba(0, 200, 50, 0.2)');
        shieldGradient.addColorStop(1, 'rgba(0, 150, 0, 0)');
        
        ctx.fillStyle = shieldGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, shieldSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Corpo
        if (this.image.complete) {
            ctx.drawImage(
                this.image,
                this.x - this.radius,
                this.y - this.radius,
                this.radius * 2,
                this.radius * 2
            );
        } else {
            ctx.fillStyle = 'lime';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // HP bar
        const barWidth = 35;
        const barHeight = 5;
        const hpPercent = this.hp / this.maxHp;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 12, barWidth, barHeight);
        
        ctx.fillStyle = 'lime';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 12, barWidth * hpPercent, barHeight);
        
        ctx.restore();
        
        // Hologramas
        this.holograms.forEach(holo => {
            if (holo.draw) holo.draw(ctx);
        });
    }
}

// ===============================
// 🔫 JUSTICEIRO - EXECUTOR TÁTICO
// ===============================
export class PunisherExecutor extends Executor {
    constructor(id, x, y, path, gameManager) {
        const data = {
            hp: 300,
            speed: 30,
            radius: 24,
            reward: 0,
            imagePath: './assets_img/punisher.jpg',
            baseDamage: 6,
            attackRange: 200,
            attackSpeed: 100 // Rifle rápido
        };
        
        super(id, x, y, 'punisher', data, path, gameManager);
        
        // 🔫 SISTEMA DE ARMAS
        this.currentWeapon = 'rifle'; // 'rifle' ou 'shotgun'
        this.weaponSwitchRange = 100;
        this.lastWeaponSwitch = 0;
        this.weaponSwitchCooldown = 500;
        
        // 🎯 RIFLE
        this.rifleAmmo = 40;
        this.rifleMaxAmmo = 40;
        this.rifleReloadTime = 2000;
        this.rifleReloading = false;
        this.rifleReloadStart = 0;
        this.rifleDamage = 5;
        this.rifleFireRate = 50; // 10 tiros/s
        this.rifleLastShot = 0;
        this.rifleFalloffStart = 120; // Dano cai após 120 unidades
        
        // 💥 SHOTGUN
        this.shotgunAmmo = 8;
        this.shotgunMaxAmmo = 8;
        this.shotgunReloadTime = 2500;
        this.shotgunReloading = false;
        this.shotgunReloadStart = 0;
        this.shotgunDamagePerPellet = 10;
        this.shotgunPellets = 14;
        this.shotgunFireRate = 800;
        this.shotgunLastShot = 0;
        this.shotgunSpread = 0.3; // Espalhamento dos pellets
        this.shotgunOptimalRange = 80;
        
        // 🌫️ GRENADAS DE FUMAÇA
        this.smokeGrenadeCooldown = 0;
        this.smokeGrenadeInterval = 8000; // 8s
        this.smokeGrenadeDuration = 5000;
        this.smokeGrenadeRadius = 100;
        this.smokeGrenadeBlindChance = 0.7; // 70% chance de cegar
        
        // 🔧 TORRETA AUTOMÁTICA
        this.turretCooldown = 0;
        this.turretInterval = 12000; // 12s
        this.turretDuration = 8000;
        this.turretMaxActive = 2;
        this.activeTurrets = [];
        
        // 🎨 VISUAL
        this.muzzleFlash = null;
        this.muzzleFlashDuration = 0;
        this.shellCasings = [];
        this.weaponGlow = 0;
        
        console.log('🔫 JUSTICEIRO: Executor tático spawnou!');
    }
    
    // ===============================
    // 🎯 SISTEMA DE TROCA DE ARMAS
    // ===============================
    updateWeaponChoice(target) {
        if (!target) return;
        
        const dist = Math.hypot(
            this.getCenterX() - target.getCenterX(),
            this.getCenterY() - target.getCenterY()
        );
        
        const now = Date.now();
        const canSwitch = (now - this.lastWeaponSwitch) > this.weaponSwitchCooldown;
        
        if (canSwitch) {
            const shouldUseShotgun = dist <= this.weaponSwitchRange;
            const newWeapon = shouldUseShotgun ? 'shotgun' : 'rifle';
            
            if (newWeapon !== this.currentWeapon) {
                this.currentWeapon = newWeapon;
                this.lastWeaponSwitch = now;
                
                // Efeito de troca
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    this.getCenterX(),
                    this.getCenterY() - 40,
                    `🔫 ${newWeapon.toUpperCase()}`,
                    'yellow',
                    800
                ));
                
                // Partículas de troca
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                        this.getCenterX() + Math.cos(angle) * 20,
                        this.getCenterY() + Math.sin(angle) * 20,
                        10,
                        'orange',
                        400
                    ));
                }
            }
        }
    }
    
    // ===============================
    // 🎯 ATAQUE COM RIFLE
    // ===============================
    fireRifle(target) {
        const now = Date.now();
        
        // Verifica cooldown
        if (now - this.rifleLastShot < this.rifleFireRate) return;
        
        // Verifica munição
        if (this.rifleAmmo <= 0) {
            if (!this.rifleReloading) {
                this.startRifleReload();
            }
            return;
        }
        
        // Calcula dano com falloff
        const dist = Math.hypot(
            this.getCenterX() - target.getCenterX(),
            this.getCenterY() - target.getCenterY()
        );
        
        let damage = this.rifleDamage;
        if (dist > this.rifleFalloffStart) {
            const falloffFactor = Math.max(0.5, 1 - (dist - this.rifleFalloffStart) / 100);
            damage *= falloffFactor;
        }
        
        // Aplica dano
        target.takeDamage(damage, this);
        
        // Consome munição
        this.rifleAmmo--;
        this.rifleLastShot = now;
        
        // 🎨 EFEITO VISUAL DO RIFLE
        this.createRifleMuzzleFlash();
        this.createRifleTracer(target);
        this.createShellCasing();
        
        // Texto de dano
        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
            target.getCenterX(),
            target.getCenterY() - 20,
            `-${damage.toFixed(0)}`,
            'red',
            500
        ));
    }
    
    startRifleReload() {
        this.rifleReloading = true;
        this.rifleReloadStart = Date.now();
        
        this.gameManager.showUI('🔫 Justiceiro: Recarregando rifle...', 'info');
    }
    
    createRifleMuzzleFlash() {
        this.muzzleFlash = {
            type: 'rifle',
            time: Date.now(),
            duration: 100
        };
        
        // Flash MUITO mais intenso
        const angle = Math.atan2(
            this.gameManager.champions[0]?.getCenterY() - this.getCenterY() || 0,
            this.gameManager.champions[0]?.getCenterX() - this.getCenterX() || 1
        );
        
        // Explosão frontal amarela brilhante
        for (let i = 0; i < 8; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 0.4;
            const distance = 15 + Math.random() * 10;
            
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.getCenterX() + Math.cos(spreadAngle) * distance,
                this.getCenterY() + Math.sin(spreadAngle) * distance,
                12,
                'yellow',
                200
            ));
        }
        
        // Flash central branco
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.getCenterX() + Math.cos(angle) * 20,
            this.getCenterY() + Math.sin(angle) * 20,
            25,
            150,
            'rgba(255, 255, 255, 0.9)'
        ));
    }

    createRifleTracer(target) {
        // Linha traçante DUPLA (mais realista)
        const startX = this.getCenterX();
        const startY = this.getCenterY();
        const endX = target.getCenterX();
        const endY = target.getCenterY();
        
        // Traçante principal (laranja)
        const tracer1 = {
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            color: 'rgba(255, 200, 0, 0.9)',
            width: 3,
            duration: 150,
            spawnTime: Date.now(),
            hasGlow: true
        };
        
        // Traçante secundário (amarelo brilhante)
        const tracer2 = {
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            color: 'rgba(255, 255, 100, 0.7)',
            width: 1.5,
            duration: 150,
            spawnTime: Date.now(),
            hasGlow: true
        };
        
        if (!this.gameManager.rifleTracers) {
            this.gameManager.rifleTracers = [];
        }
        this.gameManager.rifleTracers.push(tracer1, tracer2);
        
        // Impacto no alvo
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                endX + Math.cos(angle) * 10,
                endY + Math.sin(angle) * 10,
                8,
                'orange',
                300
            ));
        }
    }
    
    createShellCasing() {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 3 + Math.random() * 2;
        
        this.shellCasings.push({
            x: this.getCenterX(),
            y: this.getCenterY(),
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity - 2,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.3,
            life: 1,
            gravity: 0.2
        });
        
        if (this.shellCasings.length > 20) {
            this.shellCasings.shift();
        }
    }
    
    // ===============================
    // 💥 ATAQUE COM SHOTGUN
    // ===============================
    fireShotgun(target) {
        const now = Date.now();
        
        // Verifica cooldown
        if (now - this.shotgunLastShot < this.shotgunFireRate) return;
        
        // Verifica munição
        if (this.shotgunAmmo <= 0) {
            if (!this.shotgunReloading) {
                this.startShotgunReload();
            }
            return;
        }
        
        // Calcula ângulo base para o alvo
        const baseAngle = Math.atan2(
            target.getCenterY() - this.getCenterY(),
            target.getCenterX() - this.getCenterX()
        );
        
        // Dispara múltiplos pellets
        for (let i = 0; i < this.shotgunPellets; i++) {
            const spreadAngle = baseAngle + (Math.random() - 0.5) * this.shotgunSpread;
            
            // Cria pellet
            const pellet = {
                x: this.getCenterX(),
                y: this.getCenterY(),
                angle: spreadAngle,
                speed: 400,
                damage: this.shotgunDamagePerPellet,
                owner: this,
                spawnTime: Date.now(),
                maxDistance: 150,
                traveled: 0
            };
            
            if (!this.gameManager.shotgunPellets) {
                this.gameManager.shotgunPellets = [];
            }
            this.gameManager.shotgunPellets.push(pellet);
        }
        
        // Consome munição
        this.shotgunAmmo--;
        this.shotgunLastShot = now;
        
        // 💥 EFEITO VISUAL DO SHOTGUN
        this.createShotgunMuzzleFlash();
        this.createShotgunSmoke();
        
        // Recuo visual
        const recoilAngle = baseAngle + Math.PI;
        this.x += Math.cos(recoilAngle) * 5;
        this.y += Math.sin(recoilAngle) * 5;
    }
    
    startShotgunReload() {
        this.shotgunReloading = true;
        this.shotgunReloadStart = Date.now();
        
        this.gameManager.showUI('💥 Justiceiro: Recarregando shotgun...', 'info');
    }
    
    createShotgunMuzzleFlash() {
        this.muzzleFlash = {
            type: 'shotgun',
            time: Date.now(),
            duration: 250
        };
        
        // Flash MASSIVO em cone
        const angle = Math.atan2(
            this.gameManager.champions[0]?.getCenterY() - this.getCenterY() || 0,
            this.gameManager.champions[0]?.getCenterX() - this.getCenterX() || 1
        );
        
        // Cone de explosão
        for (let i = 0; i < 20; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 0.8;
            const distance = 20 + Math.random() * 30;
            
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.getCenterX() + Math.cos(spreadAngle) * distance,
                this.getCenterY() + Math.sin(spreadAngle) * distance,
                15,
                i % 2 === 0 ? 'orange' : 'yellow',
                400
            ));
        }
        
        // Explosão central GIGANTE
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.getCenterX() + Math.cos(angle) * 25,
            this.getCenterY() + Math.sin(angle) * 25,
            60,
            300,
            'rgba(255, 200, 0, 0.95)'
        ));
        
        // Anel de fogo
        for (let i = 0; i < 12; i++) {
            const ringAngle = angle + (Math.PI * 2 / 12) * i;
            setTimeout(() => {
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.getCenterX() + Math.cos(ringAngle) * 35,
                    this.getCenterY() + Math.sin(ringAngle) * 35,
                    12,
                    'red',
                    350
                ));
            }, i * 20);
        }
    }

    createShotgunSmoke() {
        // Fumaça DENSA e persistente
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const dist = 20 + Math.random() * 40;
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.getCenterX() + Math.cos(angle) * dist,
                    this.getCenterY() + Math.sin(angle) * dist,
                    20,
                    'gray',
                    1200
                ));
            }, i * 80);
        }
    }
    
    // ===============================
    // 🌫️ GRANADA DE FUMAÇA
    // ===============================
    throwSmokeGrenade() {
        if (!this.gameManager || this.gameManager.champions.length === 0) return;
        
        // Escolhe champion mais próximo
        const target = this.gameManager.champions
            .filter(c => c.hp > 0)
            .sort((a, b) => {
                const distA = Math.hypot(this.getCenterX() - a.getCenterX(), this.getCenterY() - a.getCenterY());
                const distB = Math.hypot(this.getCenterX() - b.getCenterX(), this.getCenterY() - b.getCenterY());
                return distA - distB;
            })[0];
        
        if (!target) return;
        
        const smokeZone = {
            x: target.getCenterX(),
            y: target.getCenterY(),
            radius: this.smokeGrenadeRadius,
            duration: this.smokeGrenadeDuration,
            spawnTime: Date.now(),
            owner: this,
            blindChance: this.smokeGrenadeBlindChance,
            lastBlindCheck: 0
        };
        
        if (!this.gameManager.punisherSmoke) {
            this.gameManager.punisherSmoke = [];
        }
        this.gameManager.punisherSmoke.push(smokeZone);
        
        // Efeito de lançamento
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            smokeZone.x,
            smokeZone.y,
            this.smokeGrenadeRadius,
            this.smokeGrenadeDuration,
            'rgba(80, 80, 80, 0.7)'
        ));
        
        this.gameManager.showUI('🔫 Justiceiro: Granada de fumaça lançada!', 'warning');
    }
    
    // ===============================
    // 🔧 TORRETA AUTOMÁTICA
    // ===============================
    deployTurret() {
        if (!this.gameManager) return;
        if (this.activeTurrets.length >= this.turretMaxActive) return;
        
        // Posiciona torreta atrás do Justiceiro
        const angle = Math.random() * Math.PI * 2;
        const turretX = this.getCenterX() + Math.cos(angle) * 60;
        const turretY = this.getCenterY() + Math.sin(angle) * 60;
        
        const turret = {
            id: `turret-${Date.now()}-${Math.random()}`,
            x: turretX,
            y: turretY,
            radius: 15,
            hp: 50,
            maxHp: 50,
            range: 180,
            damage: 12,
            fireRate: 400,
            lastShot: 0,
            spawnTime: Date.now(),
            endTime: Date.now() + this.turretDuration,
            owner: this,
            rotation: 0,
            targetAngle: 0,
            
            getCenterX() { return this.x; },
            getCenterY() { return this.y; }
        };
        
        this.activeTurrets.push(turret);
        
        if (!this.gameManager.punisherTurrets) {
            this.gameManager.punisherTurrets = [];
        }
        this.gameManager.punisherTurrets.push(turret);
        
        // Efeito de deploy
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            turretX,
            turretY,
            50,
            400,
            'rgba(100, 100, 100, 0.8)'
        ));
        
        for (let i = 0; i < 12; i++) {
            const particleAngle = (Math.PI * 2 / 12) * i;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                turretX + Math.cos(particleAngle) * 25,
                turretY + Math.sin(particleAngle) * 25,
                10,
                'silver',
                600
            ));
        }
        
        this.gameManager.showUI('🔫 Justiceiro: Torreta implantada!', 'special');
    }

// ===============================
// 🪝 GANCHO DE MOBILIDADE (REFATORADO)
// ===============================
hookCooldown = 0;
hookInterval = 6000; // 6s entre ganchos
isGrappling = false;
grapplingStartTime = 0;
grapplingDuration = 300; // 0.3s para chegar (MUITO RÁPIDO)
grapplingStartX = 0;
grapplingStartY = 0;
grapplingTargetX = 0;
grapplingTargetY = 0;
hookMinAngle = 20 * (Math.PI / 180);
hookMaxAngle = 160 * (Math.PI / 180);
hookMinLength = 5 * 20;
hookMaxLength = 35 * 20;
hookDamageThreshold = 0.5;
hookCableSegments = [];

throwGrapplingHook() {
    if (!this.gameManager) return;
    
    const hpPercent = this.hp / this.maxHp;
    if (hpPercent > this.hookDamageThreshold) return;
    
    const canvas = this.gameManager.canvas;
    let targetX = 0;
    let targetY = 0;
    let validPoint = false;
    
    // Tenta encontrar ponto válido
    for (let i = 0; i < 20; i++) {
        const angle = this.hookMinAngle + Math.random() * (this.hookMaxAngle - this.hookMinAngle);
        const distance = this.hookMinLength + Math.random() * (this.hookMaxLength - this.hookMinLength);
        
        targetX = this.getCenterX() + Math.cos(angle) * distance;
        targetY = this.getCenterY() + Math.sin(angle) * distance;
        
        if (targetX > 50 && targetX < canvas.width - 50 &&
            targetY > 50 && targetY < canvas.height - 50) {
            validPoint = true;
            break;
        }
    }
    
    if (!validPoint) return;
    
    // Inicia grappling
    this.isGrappling = true;
    this.grapplingStartTime = Date.now();
    this.grapplingStartX = this.getCenterX();
    this.grapplingStartY = this.getCenterY();
    this.grapplingTargetX = targetX;
    this.grapplingTargetY = targetY;
    
    // Efeito de lançamento
    this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
        this.getCenterX(),
        this.getCenterY(),
        50,
        300,
        'rgba(150, 150, 150, 0.9)'
    ));
    
    // Raios metálicos
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i;
        this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
            this.getCenterX() + Math.cos(angle) * 25,
            this.getCenterY() + Math.sin(angle) * 25,
            12,
            'silver',
            400
        ));
    }
    
    this.gameManager.showUI('🪝 Justiceiro: Gancho disparado!', 'special');
}

updateGrappling(deltaTime) {
    if (!this.isGrappling) return;
    
    const elapsed = Date.now() - this.grapplingStartTime;
    
    if (elapsed >= this.grapplingDuration) {
        // Chegou ao destino - teleporta instantaneamente
        this.x = this.grapplingTargetX - this.radius;
        this.y = this.grapplingTargetY - this.radius;
        this.isGrappling = false;
        
        // Efeito de impacto MASSIVO
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.getCenterX(),
            this.getCenterY(),
            80,
            600,
            'rgba(200, 200, 200, 1)'
        ));
        
        // Ondas de choque
        for (let w = 0; w < 3; w++) {
            setTimeout(() => {
                this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                    this.getCenterX(),
                    this.getCenterY(),
                    60 + w * 30,
                    400
                ));
            }, w * 100);
        }
        
        // Partículas metálicas
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.getCenterX() + Math.cos(angle) * 40,
                this.getCenterY() + Math.sin(angle) * 40,
                15,
                'silver',
                800
            ));
        }
        
        return;
    }
    
    // Interpolação suave
    const progress = elapsed / this.grapplingDuration;
    const easeProgress = this.easeOutCubic(progress);
    
    this.x = this.grapplingStartX + (this.grapplingTargetX - this.grapplingStartX) * easeProgress - this.radius;
    this.y = this.grapplingStartY + (this.grapplingTargetY - this.grapplingStartY) * easeProgress - this.radius;
    
    // Rastro intenso de partículas
    if (Math.random() < 0.8) {
        this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
            this.getCenterX() + (Math.random() - 0.5) * 20,
            this.getCenterY() + (Math.random() - 0.5) * 20,
            12,
            'gray',
            300
        ));
    }
}

easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

    // ===============================
    // ⚖️ SENTENÇA FINAL (ULTIMATE)
    // ===============================
    isFinalSentenceActive = false;
    finalSentenceEndTime = 0;
    finalSentenceDuration = 8000; // 8s
    finalSentenceCooldown = 0;
    finalSentenceInterval = 45000; // 45s
    finalSentenceHealAmount = 100; // Cura 100 HP
    finalSentenceActivationThreshold = 0.25; // Ativa abaixo de 25% HP
    finalSentenceGatlingFireRate = 50; // Disparo MUITO rápido
    finalSentenceGatlingDamage = 8;
    finalSentenceMissileFireRate = 500;
    finalSentenceMissileDamage = 40;
    finalSentenceLastGatlingShot = 0;
    finalSentenceLastMissile = 0;

    activateFinalSentence() {
        if (!this.gameManager) return;
        
        const hpPercent = this.hp / this.maxHp;
        
        // Só ativa se HP < 25%
        if (hpPercent > this.finalSentenceActivationThreshold) return;
        
        this.isFinalSentenceActive = true;
        this.finalSentenceEndTime = Date.now() + this.finalSentenceDuration;
        
        // Cura parcial
        this.hp = Math.min(this.maxHp, this.hp + this.finalSentenceHealAmount);
        
        // Efeito visual ÉPICO
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.getCenterX(),
            this.getCenterY(),
            150,
            1500,
            'rgba(255, 0, 0, 0.9)'
        ));
        
        // Ondas de choque
        for (let w = 0; w < 5; w++) {
            setTimeout(() => {
                this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                    this.getCenterX(),
                    this.getCenterY(),
                    80 + w * 40,
                    600
                ));
            }, w * 150);
        }
        
        // Raios vermelhos
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 / 30) * i;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.getCenterX() + Math.cos(angle) * 50,
                this.getCenterY() + Math.sin(angle) * 50,
                20,
                'red',
                1500
            ));
        }
        
        this.gameManager.showUI('⚖️ JUSTICEIRO: SENTENÇA FINAL ATIVADA!', 'ultimate');
    }

    fireFinalSentenceGatling(target) {
        const now = Date.now();
        
        if (now - this.finalSentenceLastGatlingShot < this.finalSentenceGatlingFireRate) return;
        
        // Dispara 2 balas por vez (dual gatling)
        for (let gun = 0; gun < 2; gun++) {
            const offsetAngle = gun === 0 ? -0.1 : 0.1;
            const angle = Math.atan2(
                target.getCenterY() - this.getCenterY(),
                target.getCenterX() - this.getCenterX()
            ) + offsetAngle;
            
            // Projétil teleguiado
            const bullet = {
                x: this.getCenterX() + Math.cos(angle) * 20,
                y: this.getCenterY() + Math.sin(angle) * 20,
                target: target,
                speed: 600,
                damage: this.finalSentenceGatlingDamage,
                owner: this,
                spawnTime: Date.now(),
                isFinalSentenceBullet: true,
                color: 'red'
            };
            
            if (!this.gameManager.finalSentenceBullets) {
                this.gameManager.finalSentenceBullets = [];
            }
            this.gameManager.finalSentenceBullets.push(bullet);
            
            // Muzzle flash vermelho
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                bullet.x,
                bullet.y,
                8,
                'red',
                150
            ));
        }
        
        this.finalSentenceLastGatlingShot = now;
    }

    fireFinalSentenceMissile() {
        const now = Date.now();
        
        if (now - this.finalSentenceLastMissile < this.finalSentenceMissileFireRate) return;
        
        // Escolhe champion aleatório
        const targets = this.gameManager.champions.filter(c => c.hp > 0);
        if (targets.length === 0) return;
        
        const target = targets[Math.floor(Math.random() * targets.length)];
        
        const missile = {
            x: this.getCenterX(),
            y: this.getCenterY(),
            target: target,
            speed: 400,
            damage: this.finalSentenceMissileDamage,
            explosionRadius: 80,
            owner: this,
            spawnTime: Date.now(),
            rotation: 0,
            trailParticles: []
        };
        
        if (!this.gameManager.finalSentenceMissiles) {
            this.gameManager.finalSentenceMissiles = [];
        }
        this.gameManager.finalSentenceMissiles.push(missile);
        
        // Efeito de lançamento
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.getCenterX(),
            this.getCenterY(),
            40,
            300,
            'rgba(255, 100, 0, 0.8)'
        ));
        
        this.finalSentenceLastMissile = now;
    }

    updateFinalSentence(deltaTime) {
        if (!this.isFinalSentenceActive) return;
        
        const now = Date.now();
        
        // Verifica se terminou
        if (now >= this.finalSentenceEndTime) {
            this.isFinalSentenceActive = false;
            this.gameManager.showUI('⚖️ Sentença Final encerrada', 'info');
            return;
        }
        
        // Encontra alvos
        const targets = this.gameManager.champions.filter(c => c.hp > 0);
        if (targets.length === 0) return;
        
        // Ataca com TODAS as armas ao mesmo tempo
        targets.forEach(target => {
            // Gatling dual
            this.fireFinalSentenceGatling(target);
        });
        
        // Mísseis (menos frequente)
        this.fireFinalSentenceMissile();
        
        // Aura vermelha pulsante
        if (Math.random() < 0.3) {
            const angle = Math.random() * Math.PI * 2;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.getCenterX() + Math.cos(angle) * 40,
                this.getCenterY() + Math.sin(angle) * 40,
                15,
                'red',
                400
            ));
        }
    }
    
    // ===============================
    // 📊 UPDATE PRINCIPAL
    // ===============================
    update(deltaTime) {
        super.update(deltaTime);
        
        if (!this.gameManager) return;
        
        // Atualiza grappling hook
        this.updateGrappling(deltaTime);
        
        // Se está em grappling, não faz mais nada
        if (this.isGrappling) return;
        
        // Atualiza Sentença Final
        this.updateFinalSentence(deltaTime);
        
        const hpPercent = this.hp / this.maxHp;
        
        // ⚖️ Ativa Sentença Final se HP muito baixo
        this.finalSentenceCooldown -= deltaTime;
        if (!this.isFinalSentenceActive && 
            this.finalSentenceCooldown <= 0 && 
            hpPercent <= this.finalSentenceActivationThreshold) {
            this.activateFinalSentence();
            this.finalSentenceCooldown = this.finalSentenceInterval;
        }
        
        // 🪝 Usa gancho se HP < 50%
        this.hookCooldown -= deltaTime;
        if (this.hookCooldown <= 0 && hpPercent <= this.hookDamageThreshold) {
            this.throwGrapplingHook();
            this.hookCooldown = this.hookInterval;
        }
        
        // Atualiza recargas
        if (this.rifleReloading) {
            if (Date.now() - this.rifleReloadStart >= this.rifleReloadTime) {
                this.rifleAmmo = this.rifleMaxAmmo;
                this.rifleReloading = false;
                this.gameManager.showUI('🔫 Rifle recarregado!', 'success');
            }
        }
        
        if (this.shotgunReloading) {
            if (Date.now() - this.shotgunReloadStart >= this.shotgunReloadTime) {
                this.shotgunAmmo = this.shotgunMaxAmmo;
                this.shotgunReloading = false;
                this.gameManager.showUI('💥 Shotgun recarregado!', 'success');
            }
        }
        
        // Durante Sentença Final, não usa armas normais
        if (this.isFinalSentenceActive) {
            this.weaponGlow += deltaTime / 100;
            return;
        }
        
        // Encontra alvo
        const target = this.gameManager.champions
            .filter(c => c.hp > 0)
            .sort((a, b) => {
                const distA = Math.hypot(this.getCenterX() - a.getCenterX(), this.getCenterY() - a.getCenterY());
                const distB = Math.hypot(this.getCenterX() - b.getCenterX(), this.getCenterY() - b.getCenterY());
                return distA - distB;
            })[0];
        
        if (target) {
            // Atualiza arma baseado na distância
            this.updateWeaponChoice(target);
            
            // Ataca com arma atual
            if (this.currentWeapon === 'rifle') {
                this.fireRifle(target);
            } else {
                this.fireShotgun(target);
            }
        }
        
        // 🌫️ Granada de fumaça
        this.smokeGrenadeCooldown -= deltaTime;
        if (this.smokeGrenadeCooldown <= 0) {
            this.throwSmokeGrenade();
            this.smokeGrenadeCooldown = this.smokeGrenadeInterval;
        }
        
        // 🔧 Torreta
        this.turretCooldown -= deltaTime;
        if (this.turretCooldown <= 0) {
            this.deployTurret();
            this.turretCooldown = this.turretInterval;
        }
        
        // Atualiza cápsulas
        this.shellCasings.forEach(casing => {
            casing.x += casing.vx;
            casing.y += casing.vy;
            casing.vy += casing.gravity;
            casing.rotation += casing.rotationSpeed;
            casing.life -= 0.02;
        });
        this.shellCasings = this.shellCasings.filter(c => c.life > 0);
        
        this.weaponGlow += deltaTime / 100;
    }
    
    // ===============================
    // 🎨 RENDER
    // ===============================
    draw(ctx) {
        super.draw(ctx);
        this.drawCrown(ctx);
        
        // Aura de combate
        const pulseSize = 50 + Math.sin(this.weaponGlow) * 10;
        const weaponColor = this.currentWeapon === 'rifle' ? 'yellow' : 'orange';
        
        ctx.save();
        const auraGradient = ctx.createRadialGradient(
            this.getCenterX(), this.getCenterY(), 0,
            this.getCenterX(), this.getCenterY(), pulseSize
        );
        auraGradient.addColorStop(0, `rgba(${this.currentWeapon === 'rifle' ? '255, 255, 0' : '255, 150, 0'}, 0.4)`);
        auraGradient.addColorStop(0.7, `rgba(${this.currentWeapon === 'rifle' ? '255, 200, 0' : '255, 100, 0'}, 0.2)`);
        auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = auraGradient;
        ctx.beginPath();
        ctx.arc(this.getCenterX(), this.getCenterY(), pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Muzzle flash
        if (this.muzzleFlash && (Date.now() - this.muzzleFlash.time) < this.muzzleFlash.duration) {
            const flashSize = this.muzzleFlash.type === 'shotgun' ? 35 : 20;
            ctx.fillStyle = this.muzzleFlash.type === 'shotgun' ? 'rgba(255, 150, 0, 0.9)' : 'rgba(255, 255, 0, 0.8)';
            ctx.shadowColor = weaponColor;
            ctx.shadowBlur = 25;
            ctx.beginPath();
            ctx.arc(this.getCenterX(), this.getCenterY(), flashSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Cápsulas
        this.shellCasings.forEach(casing => {
            ctx.save();
            ctx.translate(casing.x, casing.y);
            ctx.rotate(casing.rotation);
            ctx.globalAlpha = casing.life;
            ctx.fillStyle = 'rgba(200, 180, 100, 0.9)';
            ctx.fillRect(-3, -1, 6, 2);
            ctx.restore();
        });
        
        // Indicador de arma atual
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = weaponColor;
        ctx.shadowBlur = 10;
        ctx.fillText(
            `${this.currentWeapon === 'rifle' ? '🎯' : '💥'} ${this.currentWeapon === 'rifle' ? this.rifleAmmo : this.shotgunAmmo}`,
            this.getCenterX(),
            this.getCenterY() - this.radius - 35
        );
        ctx.shadowBlur = 0;
    }
}

// ===============================
// 🎯 SISTEMA DE SPAWN DE EXECUTORES
// ===============================
export class ExecutorSpawnSystem {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.activeExecutors = new Set();
        this.spawnedThisPhase = new Set();
        this.executorTypes = ['leader', 'mystery', 'sabretooth', 'mastermold', 'punisher'];
    }
    
    canSpawnExecutor(type) {
        // Não pode ter duplicatas
        return !this.activeExecutors.has(type);
    }
    
    spawnRandomExecutor() {
        const availableTypes = this.executorTypes.filter(type => this.canSpawnExecutor(type));
        
        if (availableTypes.length === 0) {
            console.log('💀 Nenhum executor disponível para spawn');
            return null;
        }
        
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        return this.spawnExecutor(type);
    }
    
    spawnExecutor(type) {
        if (!this.canSpawnExecutor(type)) {
            console.log(`💀 Não pode spawnar ${type} - já existe no mapa`);
            return null;
        }
        
        const canvas = this.gameManager.canvas;
        const startY = 100 + Math.random() * (canvas.height - 200);
        const startX = -50;
        const endX = canvas.width + 50;
        
        const path = [
            { x: startX, y: startY },
            { x: endX, y: startY }
        ];
        
        let executor = null;
        
        if (type === 'leader') {
            executor = new LeaderExecutor(
                `executor-leader-${Date.now()}`,
                startX,
                startY,
                path,
                this.gameManager
            );
        } else if (type === 'mystery') {
            executor = new MysteryExecutor(
                `executor-mystery-${Date.now()}`,
                startX,
                startY,
                path,
        this.gameManager
        );
    }
    else if (type === 'sabretooth') {
    executor = new SabretoothExecutor(
        `executor-sabretooth-${Date.now()}`,
        startX,
        startY,
        path,
        this.gameManager
    );
    }
    else if (type === 'mastermold') {
        executor = new MasterMoldExecutor(
            `executor-mastermold-${Date.now()}`,
            startX,
            startY,
            path,
            this.gameManager
        );
    }

    else if (type === 'punisher') {
        executor = new PunisherExecutor(
            `executor-punisher-${Date.now()}`,
            startX,
            startY,
            path,
            this.gameManager
        );
    }

    if (executor) {
        this.activeExecutors.add(type);
        this.spawnedThisPhase.add(type);
        this.gameManager.enemies.push(executor);
        
        this.gameManager.showUI(`💀 EXECUTOR ${type.toUpperCase()} SURGIU!`, 'warning');
        console.log(`💀 Executor ${type} spawnado!`);
    }
    
    return executor;
}

onExecutorDeath(executor) {
    this.activeExecutors.delete(executor.executorType);
    console.log(`💀 Executor ${executor.executorType} morreu, removido da lista`);
}

resetPhase() {
    this.spawnedThisPhase.clear();
    console.log('💀 Sistema de executores resetado para nova fase');
}
}