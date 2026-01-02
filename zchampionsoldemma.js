 // champions.js
// Define a classe Champion base e as subclasses para cada tipo de campeão.

// CORREÇÃO: Imports apenas das classes que realmente existem em effects.js
import { 
    Effect, 
    TextPopEffect, 
    LaserEffect, 
    BamfEffect, 
    SwordCutEffect, 
    StunEffect, 
    EmmaWaveEffect, 
    PsiEffect, 
    LevelUpEffect, 
    AuraFireParticleEffect, 
    SlowEffect, 
    USAgentShockwaveEffect, 
    USAgentCombatCallEffect, 
    DefensiveStanceEffect, 
    ConfuseEffect, 
    HexZoneVisualEffect, 
    RuneVisualEffect, 
    ReviveEffect, 
    NanobotCloudEffect, 
    NanobotParticleEffect, 
    SatelliteStrikeEffect, 
    UltronCoreEffect, 
    CaptainMarvelMissileExplosionEffect, 
    ThunderStrikeEffect,
    RedHulkExplosionEffect,
    ChainLightningEffect
} from './effects.js';

// CORREÇÃO: Imports apenas das classes que realmente existem em projectiles.js
import { 
    Projectile, 
    LaserProjectile, 
    MjolnirProjectile, 
    HawkeyeArrow,  // <-- Adicione esta linha
    CapShieldProjectile, 
    LokiPoisonDagger, 
    USAgentBullet, 
    WandaIllusionPulse,     
    DiamondShardProjectile, 
    DroneLaserProjectile,
    USAgentChargedShield, // <-- NOVO: Adicione esta linha
    KarolinaPrismBeam,
    SupernovaBeam,
    GambitCard,
    GambitHealingCard,
    GambitPurifyCard
} from './projectiles.js';

/**
 * Classe base para todos os campeões (torres) do jogo.
 */
export class Champion {
    constructor(type, x, y, id, gameManagerInstance) {
        this.type = type;
        const data = Champion.championData[type];
        if (!data) {
            console.error(`[Champion] Dados para o campeão '${type}' não encontrados no Champion.championData.`);
            throw new Error(`Champion data for '${type}' not found.`);
        }

        this.x = x;
        this.y = y;
        this.id = id;
        this.gameManager = gameManagerInstance;

        this.hp = data.hp;
        this.maxHp = data.hp;
        this.dano = data.dano;
        this.alcance = data.alcance;
        this.cooldownBase = data.cooldownBase;
        this.lastAttackTime = 0;
        this.cost = data.cost;
        this.width = data.width || 50;
        this.height = data.height || 50;

        this.abilities = {};

        // Leveling
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;

        // Propriedades para desenho
        this.image = new Image();
        this.image.src = data.imagePath;
        this.image.onerror = () => {
            console.warn(`[Champion] Erro ao carregar imagem para o campeão: ${type} em ${data.imagePath}. Usando fallback.`);
            this.image.isFallback = true;
        };

        // Sistema de Buffs
        this.buffs = [];
        this.damageBoostBuff = 0;
          
    // ⭐ NOVO: Sistema de Sobrevivência
    const survivalData = Champion.championData[type];
    
    this.survivalType = survivalData.survivalType || 'none';
    
    if (this.survivalType === 'shield') {
        this.shield = survivalData.maxShield;
        this.maxShield = survivalData.maxShield;
        this.shieldRegenRate = survivalData.shieldRegenRate;
        this.shieldRegenDelay = survivalData.shieldRegenDelay;
        this.shieldTrait = survivalData.shieldTrait;
        this.lastDamageTime = 0;
        this.shieldRegenAccelerated = false;
        this.shieldPulseCount = 0;
        this.lastPulseTime = 0;
        this.kineticDamageAccumulated = 0;
    } else if (this.survivalType === 'regen') {
        this.regenRate = survivalData.regenRate;
        this.regenTrait = survivalData.regenTrait;
        this.delayedHealStorage = 0;
    }
    }

    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }

// Em champions.js - Classe Champion, método takeDamage:

takeDamage(amount, source = null) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        console.error('❌ takeDamage recebeu valor inválido:', amount);
        return;
    }
    
    let finalDamage = amount;

    // Invulnerabilidade
    if (this.isInvulnerable) { 
        finalDamage = 0;
    }

    // Buffs de redução de dano
    this.buffs.forEach(buff => {
        if (buff.type === 'damageReduction' && Date.now() < buff.endTime) {
            finalDamage *= (1 - buff.value);
        }
    });

    if (this.hp === undefined) {
        console.error('❌ Champion sem HP definido!', this);
        this.hp = this.maxHp || 100;
    }

    // ⭐ NOVO: Sistema de Escudo
    if (this.survivalType === 'shield' && this.shield > 0) {
        this.lastDamageTime = Date.now();
        this.shieldRegenAccelerated = false;
        
        // Trait: Escudo Cinético - acumula dano
        if (this.shieldTrait === 'escudo_cinetico') {
            this.kineticDamageAccumulated += finalDamage * 0.1;
            if (this.kineticDamageAccumulated >= 50) {
                this.maxShield += 10;
                this.kineticDamageAccumulated = 0;
                this.gameManager.showUI(`${this.type}: Escudo Cinético aumentado!`, 'success');
            }
        }
        
        if (finalDamage <= this.shield) {
            // Escudo absorve todo o dano
            this.shield -= finalDamage;
            
            if (this.gameManager && this.gameManager.effects) {
                this.gameManager.effects.push(new TextPopEffect(
                    this.getCenterX(), 
                    this.getCenterY() - 10, 
                    `🛡️ ${finalDamage.toFixed(0)}`, 
                    'cyan', 
                    500
                ));
            }
            return;
        } else {
            // Escudo absorve parte, HP absorve o resto
            finalDamage -= this.shield;
            this.shield = 0;
            
            if (this.gameManager && this.gameManager.effects) {
                this.gameManager.effects.push(new TextPopEffect(
                    this.getCenterX(), 
                    this.getCenterY() - 20, 
                    '🛡️ QUEBRADO!', 
                    'orange', 
                    800
                ));
            }
        }
    }
    
    // ⭐ NOVO: Sistema de Regeneração - Regeneração Atrasada
    if (this.survivalType === 'regen' && this.regenTrait === 'regeneracao_atrasada') {
        this.delayedHealStorage += finalDamage * 0.3; // Armazena 30% do dano
    }

    this.hp -= finalDamage;
    
    console.log('🩸', this.type, 'recebeu', finalDamage.toFixed(1), 'de dano. HP:', this.hp.toFixed(1), '/', this.maxHp);

     // ✅ ADICIONE:
    if (this.hp < this.maxHp * 0.3 && this.gameManager.reactionSystem) {
        //this.reactionSystem.onChampionLowHealth(this);
    }
    
    if (this.gameManager && this.gameManager.effects) {
        this.gameManager.effects.push(new TextPopEffect(
            this.getCenterX(), 
            this.getCenterY() - 10, 
            `${finalDamage.toFixed(0)}`, 
            'red', 
            500
        ));
    }
}
    applyBuff(type, value, duration, isPercentage = true) {
        this.buffs = this.buffs.filter(buff => !(buff.type === type && Date.now() < buff.endTime));
        this.buffs.push({ type, value, endTime: Date.now() + duration, isPercentage });

        if (type === 'damageBoost') {
            this.damageBoostBuff = value;
        }
    }

// No champions.js, SUBSTITUA o método update() da classe Champion BASE:

        update(deltaTime, enemies, champions, projectiles, effects) {
             // ⭐ SISTEMA DE ESCUDO
    if (this.survivalType === 'shield') {
        const timeSinceDamage = Date.now() - this.lastDamageTime;
        
        // Trait: Recarga Acelerada
        if (this.shieldTrait === 'recarga_acelerada' && timeSinceDamage > 5000 && !this.shieldRegenAccelerated) {
            this.shieldRegenAccelerated = true;
            this.gameManager.showUI(`${this.type}: Recarga Acelerada ativada!`, 'info');
        }
        
        // Recarga normal ou acelerada
        if (timeSinceDamage > this.shieldRegenDelay && this.shield < this.maxShield) {
            const regenMultiplier = this.shieldRegenAccelerated ? 2 : 1;
            this.shield = Math.min(this.maxShield, this.shield + (this.shieldRegenRate * regenMultiplier * deltaTime / 1000));
        }
        
        // Trait: Energia Pulsante
        if (this.shieldTrait === 'energia_pulsante' && this.shield < this.maxShield && timeSinceDamage > this.shieldRegenDelay) {
            if (Date.now() - this.lastPulseTime > 2000) {
                this.shield = Math.min(this.maxShield, this.shield + (this.maxShield / 3));
                this.shieldPulseCount++;
                this.lastPulseTime = Date.now();
                
                this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                    this.getCenterX(),
                    this.getCenterY(),
                    60,
                    300
                ));
                
                if (this.shieldPulseCount >= 3) {
                    this.shieldPulseCount = 0;
                }
            }
        }
    }
    
    // ⭐ SISTEMA DE REGENERAÇÃO
    if (this.survivalType === 'regen' && this.hp < this.maxHp) {
        let currentRegenRate = this.regenRate;
        
        // Trait: Cura por Emergencial
        if (this.regenTrait === 'cura_por_emergencial' && this.hp < this.maxHp * 0.3) {
            currentRegenRate *= 3;
        }
        
        // Trait: Cura por Vida Baixa
        if (this.regenTrait === 'cura_por_vida_baixa') {
            const hpPercent = this.hp / this.maxHp;
            currentRegenRate *= (1 + (1 - hpPercent) * 2); // Até 3x mais regen
        }
        
        // Trait: Regeneração Atrasada
        if (this.regenTrait === 'regeneracao_atrasada' && this.delayedHealStorage > 0) {
            const healAmount = Math.min(this.delayedHealStorage, 2 * deltaTime / 1000);
            this.hp = Math.min(this.maxHp, this.hp + healAmount);
            this.delayedHealStorage -= healAmount;
        }
        
        this.hp = Math.min(this.maxHp, this.hp + currentRegenRate * deltaTime / 1000);
    }
    
    // Cooldown normal
    if (this.lastAttackTime > 0) {
        this.lastAttackTime = Math.max(0, this.lastAttackTime - deltaTime);
    }
            // ⭐ CORREÇÃO: Cooldown nunca fica negativo
            if (this.lastAttackTime > 0) {
                this.lastAttackTime = Math.max(0, this.lastAttackTime - deltaTime);
            }

            for (const abilityName in this.abilities) {
                if (this.abilities[abilityName].cooldown > 0) {
                    this.abilities[abilityName].cooldown = Math.max(0, this.abilities[abilityName].cooldown - deltaTime);
                }
            }

            this.damageBoostBuff = 0;
            this.buffs = this.buffs.filter(buff => {
                if (Date.now() < buff.endTime) {
                    if (buff.type === 'hpRegen') {
                        this.hp = Math.min(this.maxHp, this.hp + buff.value * (deltaTime / 1000));
                    } else if (buff.type === 'damageBoost') {
                        this.damageBoostBuff = buff.value;
                    }
                    return true;
                }
                return false;
            });
        }

    findNearestEnemy(enemies) {
        let nearestEnemy = null;
        let minDistance = this.alcance;

        for (const enemy of enemies) {
            const dist = Math.hypot(this.getCenterX() - enemy.getCenterX(), this.getCenterY() - enemy.getCenterY());
            if (dist < minDistance) {
                minDistance = dist;
                nearestEnemy = enemy;
            }
        }
        return nearestEnemy;
    }

    attack(enemies, projectiles, effects) {
        if (this.lastAttackTime <= 0) {
            const target = this.findNearestEnemy(enemies);
            if (target) {
                const finalDamage = this.dano * (1 + this.damageBoostBuff);
                target.takeDamage(finalDamage, this);
                this.lastAttackTime = this.cooldownBase;
            }
        }
    }

draw(ctx, isSelected, mjolnirImage, capShieldImage, usagentShieldImage, wandaIllusionImage,  displayRangeOverride = null) {
    if (!ctx) {
        console.error('❌ ctx não foi passado para Champion.draw()');
        return;
    }
    
    if (this.hp <= 0 && !this.isReconstructing) return;

    ctx.save();
    
    // ⭐ EFEITOS SIMPLIFICADOS DE CAMPEÃO
    const time = Date.now() / 1000;
    	

    // ===============================
    // AURA DOURADA SIMPLES
    // ===============================
    const auraSize = 50 + Math.sin(time * 2) * 5;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    
    const auraGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, auraSize
    );
    auraGradient.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
    auraGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    
    ctx.fillStyle = auraGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, auraSize, 0, Math.PI * 2);
    ctx.fill();
    
    // ===============================
    // IMAGEM DO CHAMPION
    // ===============================
    if (this.image && this.image.complete && !this.image.isFallback) {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    } else {
        ctx.fillStyle = '#444';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.type, centerX, centerY);
    }
    
    // ===============================
    // BORDA DOURADA DUPLA
    // ===============================
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(255, 215, 0, 1)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    
    ctx.strokeStyle = 'rgba(255, 255, 200, 1)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 5;
    ctx.strokeRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);
    
    ctx.shadowBlur = 0;
    
    // ===============================
    // COROA DOURADA
    // ===============================
 /*   ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText('👑', centerX, this.y - 58);
    ctx.shadowBlur = 0;
 */   
if (isSelected) {
    ctx.save();

    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 2;

    ctx.beginPath(); 
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const radius = Math.max(this.width, this.height) / 2 + 5;

    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    const rangeToDisplay = displayRangeOverride !== null 
    ? displayRangeOverride 
    : this.alcance;

if (rangeToDisplay > 0) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    ctx.arc(centerX, centerY, rangeToDisplay, 0, Math.PI * 2);
    ctx.stroke();
}
        
        // ⭐ NOVO: Indicador de venda
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText('V para Vender', centerX, this.y + this.height + 25);
        
        const championData = Champion.championData[this.type];
        if (championData) {
            const refund = Math.floor(championData.custo * 0.7);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.font = '12px Arial';
            ctx.fillText(`$${refund}`, centerX, this.y + this.height + 40);
        }
        ctx.shadowBlur = 0;
    }
    


    // ===============================
    // NÍVEL E XP
    // ===============================
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 3;
    ctx.fillText(`Lv${this.level}`, centerX, this.y - 20);
    ctx.shadowBlur = 0;
    
    // Barra de XP (se não for nível máximo)
    if (this.level < 10) {
        const xpBarWidth = this.width;
        const xpBarHeight = 3;
        const xpBarX = this.x;
        const xpBarY = this.y - 20;
        
        // Fundo
        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.fillRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight);
        
        // XP atual
        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.fillRect(xpBarX, xpBarY, xpBarWidth * (this.xp / this.xpToNextLevel), xpBarHeight);
        
        // Contorno
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight);
    }
    
    // ===============================
    // BARRA DE ESCUDO (se tiver)
    // ===============================
    if (this.survivalType === 'shield' && this.maxShield > 0) {
        const shieldBarWidth = this.width;
        const shieldBarHeight = 4;
        const shieldBarX = this.x;
        const shieldBarY = this.y - 32;
        
        // Fundo do escudo
        ctx.fillStyle = 'rgba(0, 50, 100, 0.7)';
        ctx.fillRect(shieldBarX, shieldBarY, shieldBarWidth, shieldBarHeight);
        
        // Escudo atual
        const shieldPercent = this.shield / this.maxShield;
        const shieldGradient = ctx.createLinearGradient(
            shieldBarX, shieldBarY, 
            shieldBarX + shieldBarWidth * shieldPercent, shieldBarY
        );
        shieldGradient.addColorStop(0, 'rgba(0, 150, 255, 0.9)');
        shieldGradient.addColorStop(1, 'rgba(0, 200, 255, 0.9)');
        ctx.fillStyle = shieldGradient;
        ctx.fillRect(shieldBarX, shieldBarY, shieldBarWidth * shieldPercent, shieldBarHeight);
        
        // Contorno
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(shieldBarX, shieldBarY, shieldBarWidth, shieldBarHeight);
        
        // Ícone de escudo
        ctx.fillStyle = 'rgba(0, 200, 255, 0.9)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('🛡️', this.x - 12, shieldBarY + 3);
    }
    
    // ===============================
    // ÍCONE DE REGENERAÇÃO (se tiver)
    // ===============================
    if (this.survivalType === 'regen') {
        ctx.fillStyle = 'rgba(0, 255, 100, 0.9)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        const regenIconY = this.y - 32;
        ctx.fillText('💚', this.x + this.width + 12, regenIconY + 3);
    }
    
    // ===============================
    // BARRA DE HP
    // ===============================
    const hpBarWidth = this.width;
    const hpBarHeight = 6;
    const hpBarX = this.x;
    const hpBarY = this.y - 15;
    
    // Fundo da barra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
    
    // HP atual
    const hpPercent = this.hp / this.maxHp;
    let hpColor;
    if (hpPercent > 0.6) hpColor = '#00ff00';
    else if (hpPercent > 0.3) hpColor = '#ffaa00';
    else hpColor = '#ff0000';
    
    const currentHpWidth = hpBarWidth * hpPercent;
    const hpGradient = ctx.createLinearGradient(hpBarX, hpBarY, hpBarX + currentHpWidth, hpBarY);
    hpGradient.addColorStop(0, hpColor);
    hpGradient.addColorStop(1, hpColor + '80');
    
    ctx.fillStyle = hpGradient;
    ctx.fillRect(hpBarX, hpBarY, currentHpWidth, hpBarHeight);
    
    // Borda da barra
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
    
    

    // ===============================
    // ESCUDOS E PROJÉTEIS (CÓDIGO EXISTENTE)
    // ===============================
    
    // Thor - Mjolnir
    if (this.type === 'thor' && this.mjolnirThrown) {
        if (mjolnirImage && mjolnirImage.complete) {
            ctx.save();
            ctx.translate(this.mjolnirX, this.mjolnirY);
            ctx.rotate(this.mjolnirRotation);
            
            const glowSize = 20 + Math.sin(Date.now() / 100) * 3;
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
            gradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.drawImage(mjolnirImage, -15, -15, 30, 30);
            ctx.restore();
        }
    }

    // Captain America - Escudo
    if (this.type === 'captainamerica' && this.isShieldActive && this.shieldProjectile) {
        if (capShieldImage && capShieldImage.complete) {
            ctx.save();
            ctx.translate(this.shieldProjectile.x, this.shieldProjectile.y);
            ctx.rotate(this.shieldRotation);
            
            const shieldGlow = 15 + Math.sin(Date.now() / 80) * 3;
            const shieldGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, shieldGlow);
            shieldGradient.addColorStop(0, 'rgba(200, 200, 255, 0.6)');
            shieldGradient.addColorStop(1, 'rgba(200, 200, 255, 0)');
            ctx.fillStyle = shieldGradient;
            ctx.beginPath();
            ctx.arc(0, 0, shieldGlow, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.drawImage(capShieldImage, -20, -20, 40, 40);
            ctx.restore();
        }
    }

    // US Agent - Escudo
    if (this.type === 'usagent' && this.usagentShieldActive && this.usagentShieldProjectile) {
        if (usagentShieldImage && usagentShieldImage.complete) {
            ctx.save();
            ctx.translate(this.usagentShieldProjectile.x, this.usagentShieldProjectile.y);
            ctx.rotate(this.usagentShieldRotation);
            
            const usShieldGlow = 15 + Math.sin(Date.now() / 70) * 3;
            const usShieldGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, usShieldGlow);
            usShieldGradient.addColorStop(0, 'rgba(255, 100, 100, 0.6)');
            usShieldGradient.addColorStop(1, 'rgba(255, 100, 100, 0)');
            ctx.fillStyle = usShieldGradient;
            ctx.beginPath();
            ctx.arc(0, 0, usShieldGlow, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.drawImage(usagentShieldImage, -20, -20, 40, 40);
            ctx.restore();
        }
    }

    // Wanda - Ilusões
    if (this.type === 'scarletwitch' && this.illusionPositions && this.illusionPositions.length > 0) {
        this.illusionPositions.forEach(pos => {
            if (wandaIllusionImage && wandaIllusionImage.complete) {
                ctx.save();
                const opacity = 0.4 + Math.sin(Date.now() / 100) * 0.1;
                ctx.globalAlpha = opacity;
                
                const illusionGlow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 30);
                illusionGlow.addColorStop(0, 'rgba(200, 0, 200, 0.3)');
                illusionGlow.addColorStop(1, 'rgba(200, 0, 200, 0)');
                ctx.fillStyle = illusionGlow;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.drawImage(wandaIllusionImage, pos.x - 25, pos.y - 25, 50, 50);
                ctx.restore();
            }
        });
    }
}

    activateAbility(abilityNumber) {
        console.log(`${this.type} ativou a habilidade ${abilityNumber}.`);
    }

    addXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNextLevel && this.level < 10) {
            this.levelUp();
        }
    }

 levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);

        this.maxHp = Math.floor(this.maxHp * 1.1);
        this.hp = this.maxHp;
        this.dano = Math.floor(this.dano * 1.08);
        this.alcance = Math.floor(this.alcance * 1.05);
        this.cooldownBase = Math.max(this.cooldownBase * 0.95, 100);

         // ✅ ADICIONE NO FINAL:
        if (this.gameManager && this.gameManager.reactionSystem) {
           // this.gameManager.reactionSystem.onChampionLevelUp(this);
        }

        // CORREÇÃO: Verifica se gameManager existe
        if (this.gameManager && this.gameManager.effects) {
            this.gameManager.effects.push(new LevelUpEffect(
                this.getCenterX(), 
                this.getCenterY(), 
                this.level
            ));
        }
        
        if (this.gameManager && this.gameManager.showUI) {
            this.gameManager.showUI(
                `${this.type.charAt(0).toUpperCase() + this.type.slice(1)} subiu para o Nível ${this.level}!`, 
                'special'
            );

        }

        this.onLevelUp();
    }


    onLevelUp() {
        // Método vazio para ser sobrescrito por subclasses
    }

    onEnemyKilled() {
        this.addXp(10);
    }
}

// ==============================================
// ðŸ¤ SISTEMA DE TEAM UP
// ==============================================

/**
 * Verifica se um Team Up específico está ativo
 * @param {Array} champions - Array de champions em campo
 * @param {Array} requiredTypes - Tipos necessários para o Team Up
 * @returns {boolean}
 */
export function isTeamUpActive(champions, requiredTypes) {
    const typesInField = new Set(champions.filter(c => c.hp > 0).map(c => c.type));
    return requiredTypes.every(type => typesInField.has(type));
}

/**
 * Dados dos Team Ups disponíveis
 */
export const TEAM_UPS = {
    psychicAttraction: {
        name: 'Atração Psiônica',
        champions: ['emmafrost', 'wanda'],
        icon: '🧠💜',
        description: 'Emma e Wanda combinam seus poderes mentais para controlar inimigos',
        
        // Propriedades da habilidade
        cooldown: 35000, // 35 segundos
        duration: 6000, // 6 segundos de cone ativo
        coneRange: 350,
        coneAngle: Math.PI / 2.5, // ~72 graus
        damagePerTick: 8,
        tickRate: 200, // Dano a cada 0.2s
        
        // Sistema de Controle Mental
        vulnerabilityBuildRate: 0.15, // 15% por segundo dentro do cone
        controlThreshold: 1.0, // 100% = controlado
        controlDuration: 4000, // 4 segundos de controle
        pullSpeed: 80, // Velocidade de atração
        shootStopChance: 0.7, // 70% chance de parar de atirar
        
        // Visual
        coneColor: 'rgba(200, 0, 255, 0.4)',
        controlColor: 'rgba(255, 0, 255, 0.8)'
    }
};

// ==============================================
// CLASSE: ATRAÇÃO PSIÔNICA
// ==============================================

export class PsychicAttractionCone {
    constructor(emmaFrost, wanda, targetAngle, gameManager) {
        this.emma = emmaFrost;
        this.wanda = wanda;
        this.gameManager = gameManager;
        
        const data = TEAM_UPS.psychicAttraction;
        
        // Posição central entre Emma e Wanda
        this.centerX = (emmaFrost.getCenterX() + wanda.getCenterX()) / 2;
        this.centerY = (emmaFrost.getCenterY() + wanda.getCenterY()) / 2;
        
        this.targetAngle = targetAngle;
        this.range = data.coneRange;
        this.angle = data.coneAngle;
        
        this.spawnTime = Date.now();
        this.endTime = Date.now() + data.duration;
        this.lastDamageTick = Date.now();
        
        this.affectedEnemies = new Map(); // enemy.id -> vulnerabilityLevel
        
        // Visual
        this.pulsePhase = 0;
        this.waveOffset = 0;
    }
    
    update(deltaTime, enemies) {
        const data = TEAM_UPS.psychicAttraction;
        const currentTime = Date.now();
        
        // Verifica expiração
        if (currentTime > this.endTime) {
            return false;
        }
        
        // Atualiza visual
        this.pulsePhase += deltaTime / 100;
        this.waveOffset += deltaTime / 50;
        
        // Recalcula centro entre Emma e Wanda
        if (this.emma.hp > 0 && this.wanda.hp > 0) {
            this.centerX = (this.emma.getCenterX() + this.wanda.getCenterX()) / 2;
            this.centerY = (this.emma.getCenterY() + this.wanda.getCenterY()) / 2;
        }
        
        // Aplica dano e aumenta vulnerabilidade
        if (currentTime - this.lastDamageTick >= data.tickRate) {
            this.applyEffects(enemies);
            this.lastDamageTick = currentTime;
        }
        
        return true;
    }
    
    applyEffects(enemies) {
        const data = TEAM_UPS.psychicAttraction;
        
        enemies.forEach(enemy => {
            const isInCone = this.isEnemyInCone(enemy);
            
            if (isInCone) {
                // Aplica dano
                enemy.takeDamage(data.damagePerTick, this.emma);
                
                // Aumenta vulnerabilidade
                const currentVuln = this.affectedEnemies.get(enemy.id) || 0;
                const newVuln = Math.min(1, currentVuln + data.vulnerabilityBuildRate * (data.tickRate / 1000));
                this.affectedEnemies.set(enemy.id, newVuln);
                
                // Armazena no inimigo
                enemy.psychicVulnerability = newVuln;
                
                // Se atingir o threshold, aplica controle mental
                if (newVuln >= data.controlThreshold && !enemy.isMindControlled) {
                    this.applyMindControl(enemy);
                }
                
            } else {
                // Fora do cone: decai vulnerabilidade
                if (this.affectedEnemies.has(enemy.id)) {
                    const currentVuln = this.affectedEnemies.get(enemy.id);
                    const newVuln = Math.max(0, currentVuln - 0.1);
                    
                    if (newVuln > 0) {
                        this.affectedEnemies.set(enemy.id, newVuln);
                        enemy.psychicVulnerability = newVuln;
                    } else {
                        this.affectedEnemies.delete(enemy.id);
                        delete enemy.psychicVulnerability;
                    }
                }
            }
        });
    }
    
    applyMindControl(enemy) {
        const data = TEAM_UPS.psychicAttraction;
        
        enemy.isMindControlled = true;
        enemy.mindControlEndTime = Date.now() + data.controlDuration;
        enemy.mindControlTarget = this.centerX; // Atraído para o centro
        enemy.mindControlTargetY = this.centerY;
        enemy.originalSpeed = enemy.vel;
        enemy.vel = 0; // Para de se mover normalmente
        
        // Chance de parar de atirar
        if (enemy.canShoot && Math.random() < data.shootStopChance) {
            enemy.canShoot = false;
            enemy.shootRestoreTime = enemy.mindControlEndTime;
        }
        
       // Mude para (remova o "this.gameManager." antes do nome da classe):
        this.gameManager.effects.push(new BamfEffect(
            enemy.getCenterX(),
            enemy.getCenterY(),
            'purple',
            500
        ));
        
        this.gameManager.effects.push(new TextPopEffect(
            enemy.getCenterX(),
            enemy.getCenterY() - 30,
            '🧠 CONTROLADO!',
            'magenta',
            1000
        ));
        
        console.log(`ðŸ§  ${enemy.type} foi controlado mentalmente!`);
    }
    
    isEnemyInCone(enemy) {
        const enemyCx = enemy.getCenterX();
        const enemyCy = enemy.getCenterY();
        const dist = Math.hypot(enemyCx - this.centerX, enemyCy - this.centerY);
        
        if (dist > this.range) return false;
        
        let angleToEnemy = Math.atan2(enemyCy - this.centerY, enemyCx - this.centerX);
        let angleDiff = Math.abs(this.targetAngle - angleToEnemy);
        
        if (angleDiff > Math.PI) {
            angleDiff = 2 * Math.PI - angleDiff;
        }
        
        return angleDiff < this.angle / 2;
    }
    
    draw(ctx) {
        const data = TEAM_UPS.psychicAttraction;
        
        ctx.save();
        
        // ===============================
        // CONE PSIÔNICO BASE
        // ===============================
        ctx.translate(this.centerX, this.centerY);
        ctx.rotate(this.targetAngle);
        
        // Gradiente do cone
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.range);
        gradient.addColorStop(0, 'rgba(200, 0, 255, 0.5)');
        gradient.addColorStop(0.5, 'rgba(150, 0, 200, 0.3)');
        gradient.addColorStop(1, 'rgba(100, 0, 150, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, this.range, -this.angle / 2, this.angle / 2);
        ctx.closePath();
        ctx.fill();
        
        // ===============================
        // ONDAS PSIÔNICAS ANIMADAS
        // ===============================
        for (let w = 0; w < 5; w++) {
            const waveProgress = ((this.waveOffset + w * 50) % 250) / 250;
            const waveRadius = this.range * waveProgress;
            const waveAlpha = (1 - waveProgress) * 0.6;
            
            ctx.strokeStyle = `rgba(255, 0, 255, ${waveAlpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, waveRadius, -this.angle / 2, this.angle / 2);
            ctx.stroke();
        }
        
        // ===============================
        // PARTÍCULAS PSÍQUICAS
        // ===============================
        ctx.restore();
        
        for (let p = 0; p < 20; p++) {
            const particleAngle = this.targetAngle + (Math.random() - 0.5) * this.angle;
            const particleDist = Math.random() * this.range;
            const px = this.centerX + Math.cos(particleAngle) * particleDist;
            const py = this.centerY + Math.sin(particleAngle) * particleDist;
            const particleSize = 3 + Math.random() * 4;
            
            const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, particleSize);
            particleGradient.addColorStop(0, 'rgba(255, 100, 255, 0.8)');
            particleGradient.addColorStop(1, 'rgba(200, 0, 255, 0)');
            
            ctx.fillStyle = particleGradient;
            ctx.beginPath();
            ctx.arc(px, py, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // ===============================
        // BARRA DE DURAÇÃO
        // ===============================
        const timeLeft = this.endTime - Date.now();
        const progress = timeLeft / data.duration;
        
        const barWidth = 100;
        const barHeight = 6;
        const barX = this.centerX - barWidth / 2;
        const barY = this.centerY - this.range - 30;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const barGradient = ctx.createLinearGradient(barX, 0, barX + barWidth * progress, 0);
        barGradient.addColorStop(0, 'rgba(255, 0, 255, 1)');
        barGradient.addColorStop(1, 'rgba(150, 0, 200, 1)');
        ctx.fillStyle = barGradient;
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Texto
        ctx.fillStyle = 'rgba(255, 0, 255, 0.9)';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'magenta';
        ctx.shadowBlur = 8;
        ctx.fillText('🧠💜 ATRAÇÃO PSIÔNICA', this.centerX, barY - 5);
        ctx.shadowBlur = 0;
    }
}

export class IronMan extends Champion {
    constructor(type, x, y, id, gameManagerInstance) {
        super(type, x, y, id, gameManagerInstance);
        this.charge = 0; // Carga do Unibeam
        this.abilities.unibeam = { cooldown: 0, cooldownBase: Champion.championData.ironman.unibeamCooldown || 20000 };
        this.abilities.flight = { cooldown: 0, cooldownBase: Champion.championData.ironman.flightCooldownBase };
        this.isFlying = false;
        this.orbitTarget = null;
        this.currentOrbitAngle = 0;
        this.lastFlightAttackTime = 0;
    }

  // SUBSTITUA TODO o método update() do IronMan por este:
update(deltaTime, enemies, champions, projectiles, effects) {
    super.update(deltaTime, enemies, champions, projectiles, effects);

    // NOVO: Verifica se o alvo de órbita ainda está dentro da tela
    if (this.isFlying && this.orbitTarget) {
        const canvas = this.gameManager.canvas;
        const targetX = this.gameManager.getCenterX(this.orbitTarget);
        const targetY = this.gameManager.getCenterY(this.orbitTarget);
        
        // Se o alvo saiu da tela ou morreu
        if (targetX < -100 || targetX > canvas.width + 100 || 
            targetY < -100 || targetY > canvas.height + 100 || 
            this.orbitTarget.hp <= 0) {
            
            // Busca novo alvo dentro da tela
            this.orbitTarget = enemies.filter(e => {
                const ex = this.gameManager.getCenterX(e);
                const ey = this.gameManager.getCenterY(e);
                return ex >= -50 && ex <= canvas.width + 50 && 
                       ey >= -50 && ey <= canvas.height + 50 && e.hp > 0;
            }).sort((a, b) => b.hp - a.hp)[0];
            
            if (!this.orbitTarget) {
                this.isFlying = false;
                this.gameManager.showUI('Iron Man: Voltando à posição!', 'info');
            }
        }
    }
    if (this.isFlying && this.orbitTarget && this.orbitTarget.hp > 0) {
        const targetCenterX = this.gameManager.getCenterX(this.orbitTarget);
        const targetCenterY = this.gameManager.getCenterY(this.orbitTarget);
        const orbitRadius = Champion.championData.ironman.flightOrbitRadius;
        const orbitSpeed = Champion.championData.ironman.flightOrbitSpeed;

        this.currentOrbitAngle += (orbitSpeed / orbitRadius) * (deltaTime / 1000);
        this.x = targetCenterX + orbitRadius * Math.cos(this.currentOrbitAngle) - this.width / 2;
        this.y = targetCenterY + orbitRadius * Math.sin(this.currentOrbitAngle) - this.height / 2;

        if (Date.now() - this.lastFlightAttackTime >= Champion.championData.ironman.flightAttackCooldown) {
            projectiles.push(new this.gameManager.LaserProjectile(this.getCenterX(), this.getCenterY(), targetCenterX, targetCenterY, 500, this.dano, this, this.gameManager));
            effects.push(new this.gameManager.LaserEffect(this.getCenterX(), this.getCenterY(), targetCenterX, targetCenterY, 30, 'red', 1.5));
            this.lastFlightAttackTime = Date.now();
            
            // Acumula carga durante o voo também
            this.charge++;
            
            // Auto-ativa Unibeam durante o voo quando carregado
            if (this.charge >= Champion.championData.ironman.cargaMaxUnibeam) {
                this.activateAbility(1);
                this.charge = 0;
            }
        }
    } else if (this.isFlying && (!this.orbitTarget || this.orbitTarget.hp <= 0)) {
        this.orbitTarget = enemies.sort((a, b) => b.hp - a.hp)[0];
        if (!this.orbitTarget) {
            this.isFlying = false;
            this.gameManager.showUI('Iron Man: Campo limpo, pousando!', 'info');
        }
    }
}
    attack(enemies, projectiles, effects) {
        if (this.isFlying) return;

        if (this.lastAttackTime <= 0) {
            const target = this.findNearestEnemy(enemies);
            if (target) {
                const finalDamage = this.dano * (1 + this.damageBoostBuff);
                projectiles.push(new this.gameManager.LaserProjectile(this.getCenterX(), this.getCenterY(), this.gameManager.getCenterX(target), this.gameManager.getCenterY(target), 400, finalDamage, this, this.gameManager));
                effects.push(new this.gameManager.LaserEffect(this.getCenterX(), this.getCenterY(), this.gameManager.getCenterX(target), this.gameManager.getCenterY(target), 20, 'cyan', 2));

                this.charge++;
                if (this.charge >= Champion.championData.ironman.cargaMaxUnibeam) {
                    this.activateAbility(1);
                    this.charge = 0;
                }
                this.lastAttackTime = this.cooldownBase;
            }
        }
    }

// SUBSTITUA TODO o método activateAbility() do IronMan por este:
activateAbility(abilityNumber) {
    if (abilityNumber === 1 && this.charge >= Champion.championData.ironman.cargaMaxUnibeam) {
        const target = this.findNearestEnemy(this.gameManager.enemies);
        if (target) {
            const unibeamDamage = Champion.championData.ironman.danoUnibeam + (this.level * 10);
            const startX = this.getCenterX();
            const startY = this.getCenterY();
            const targetX = this.gameManager.getCenterX(target);
            const targetY = this.gameManager.getCenterY(target);
            
            // Calcula o ângulo do Unibeam
            const angle = Math.atan2(targetY - startY, targetX - startX);
            
            // Estende o raio até o fim da tela
            const maxDistance = Math.hypot(this.gameManager.canvas.width, this.gameManager.canvas.height);
            const endX = startX + Math.cos(angle) * maxDistance;
            const endY = startY + Math.sin(angle) * maxDistance;
            
            // Largura do Unibeam
            const beamWidth = 40;
            
            // Atinge TODOS os inimigos na linha do Unibeam
            this.gameManager.enemies.forEach(enemy => {
                const enemyX = enemy.getCenterX();
                const enemyY = enemy.getCenterY();
                
                // Calcula distância perpendicular do inimigo à linha do beam
                const dx = endX - startX;
                const dy = endY - startY;
                const lineLengthSquared = dx * dx + dy * dy;
                const t = Math.max(0, Math.min(1, ((enemyX - startX) * dx + (enemyY - startY) * dy) / lineLengthSquared));
                const closestX = startX + t * dx;
                const closestY = startY + t * dy;
                const distToLine = Math.hypot(enemyX - closestX, enemyY - closestY);
                
                // Se o inimigo está dentro da largura do beam
                if (distToLine < beamWidth / 2) {
                    enemy.takeDamage(unibeamDamage, this);
                    this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                        enemyX, 
                        enemyY - 20, 
                        `UNIBEAM! ${unibeamDamage.toFixed(0)}`, 
                        'cyan', 
                        1000
                    ));
                }
            });
            
            // ⭐ NOVO: EFEITO VISUAL DEVASTADOR AZUL COMPLEXO
            
            // ========================================
            // CAMADA 1: NÚCLEO CENTRAL ULTRA BRILHANTE
            // ========================================
            this.gameManager.effects.push(new this.gameManager.LaserEffect(
                startX, startY, endX, endY, 
                8, 'rgba(255, 255, 255, 1)', 0.5
            ));
            
            // ========================================
            // CAMADA 2: RAIO AZUL PRINCIPAL
            // ========================================
            this.gameManager.effects.push(new this.gameManager.LaserEffect(
                startX, startY, endX, endY, 
                25, 'rgba(0, 150, 255, 0.9)', 0.45
            ));
            
            // ========================================
            // CAMADA 3: AURA AZUL ELÉTRICA
            // ========================================
            this.gameManager.effects.push(new this.gameManager.LaserEffect(
                startX, startY, endX, endY, 
                45, 'rgba(0, 200, 255, 0.6)', 0.4
            ));
            
            // ========================================
            // CAMADA 4: BRILHO EXTERNO AZUL CLARO
            // ========================================
            this.gameManager.effects.push(new this.gameManager.LaserEffect(
                startX, startY, endX, endY, 
                70, 'rgba(100, 220, 255, 0.4)', 0.35
            ));
            
            // ========================================
            // CAMADA 5: HALO AZUL TRANSLÚCIDO
            // ========================================
            this.gameManager.effects.push(new this.gameManager.LaserEffect(
                startX, startY, endX, endY, 
                100, 'rgba(150, 230, 255, 0.2)', 0.3
            ));
            
            // ========================================
            // RELÂMPAGOS LATERAIS ALEATÓRIOS
            // ========================================
            const numLightning = 15;
            for (let i = 0; i < numLightning; i++) {
                const t = Math.random();
                const pointX = startX + (endX - startX) * t;
                const pointY = startY + (endY - startY) * t;
                
                // Ângulo perpendicular
                const perpAngle = angle + Math.PI / 2;
                const side = Math.random() > 0.5 ? 1 : -1;
                const offset = (20 + Math.random() * 40) * side;
                
                const lightningEndX = pointX + Math.cos(perpAngle) * offset;
                const lightningEndY = pointY + Math.sin(perpAngle) * offset;
                
                this.gameManager.effects.push(new this.gameManager.LaserEffect(
                    pointX, pointY, lightningEndX, lightningEndY,
                    3, 'rgba(150, 220, 255, 0.8)', 0.15
                ));
            }
            
            // ========================================
            // EXPLOSÃO NO PONTO DE ORIGEM
            // ========================================
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                startX, startY, 80, 'cyan', 500
            ));
            
            // ========================================
            // PARTÍCULAS DE ENERGIA AO LONGO DO RAIO
            // ========================================
            const numParticles = 30;
            for (let i = 0; i < numParticles; i++) {
                const t = i / numParticles;
                const particleX = startX + (endX - startX) * t;
                const particleY = startY + (endY - startY) * t;
                
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    particleX, particleY, 30, i % 2 === 0 ? 'cyan' : 'white', 400
                ));
            }
            
            // ========================================
            // ONDAS DE CHOQUE NO INÍCIO E FIM
            // ========================================
            this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                startX, startY, 100, 500
            ));
            
            this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                endX, endY, 150, 600
            ));
            
            this.charge = 0;
            this.gameManager.showUI('Iron Man: Unibeam Devastador disparado!', 'ultimate');
        }
    } else if (abilityNumber === 2 && this.abilities.flight.cooldown <= 0) {
        const targetEnemy = this.gameManager.enemies.sort((a, b) => b.hp - a.hp)[0];
        if (targetEnemy) {
            this.isFlying = true;
            this.orbitTarget = targetEnemy;
            this.currentOrbitAngle = Math.atan2(this.getCenterY() - this.gameManager.getCenterY(this.orbitTarget), this.getCenterX() - this.gameManager.getCenterX(this.orbitTarget));
            this.lastFlightAttackTime = Date.now();
            this.abilities.flight.cooldown = Champion.championData.ironman.flightCooldownBase;
            this.gameManager.showUI('Iron Man: Iniciando voo em órbita!', 'special');
        } else {
            this.gameManager.showUI('Iron Man: Nenhum inimigo para orbitar!', 'warning');
        }
    }
}
}

export class Thor extends Champion {
    constructor(type, x, y, id, gameManagerInstance) {
        super(type, x, y, id, gameManagerInstance);
        // mjolnirCooldown é o cooldown para o arremesso do martelo
        this.mjolnirCooldown = 0; // Cooldown do Mjolnir, separado do ataque de raio
        this.isMjolnirActive = false; // Flag para controlar se o Mjolnir está fora (para o arremesso)
    }

    update(deltaTime, enemies, champions, projectiles, effects) {
        super.update(deltaTime, enemies, champions, projectiles, effects);
        // Atualiza cooldown do Mjolnir
        if (this.mjolnirCooldown > 0) {
            this.mjolnirCooldown = Math.max(0, this.mjolnirCooldown - deltaTime);
        }
    }

    
    attack(enemies, projectiles, effects) {
        // Ataque principal: Raios em Cadeia
        if (this.lastAttackTime <= 0) {
            let primaryTarget = this.findNearestEnemy(enemies);
            if (primaryTarget) {
                const chainLightningDamage = this.dano * (1 + this.damageBoostBuff);
                
                effects.push(new ChainLightningEffect(
                    { x: this.getCenterX(), y: this.getCenterY() },
                    { x: primaryTarget.getCenterX(), y: primaryTarget.getCenterY() },
                    200,
                    10,
                    25
                ));
                primaryTarget.takeDamage(chainLightningDamage, this);
                
                if (Math.random() < Champion.championData.thor.stunChance && 
                    !primaryTarget.isStunned && 
                    !(primaryTarget.isDebuffImmune && primaryTarget.debuffImmuneEndTime > Date.now())) {
                    primaryTarget.applyStun(Champion.championData.thor.stunDuration);
                    effects.push(new this.gameManager.StunEffect(
                        primaryTarget.getCenterX(), 
                        primaryTarget.getCenterY(), 
                        Champion.championData.thor.stunDuration
                    ));
                }

                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    primaryTarget.getCenterX(), 
                    primaryTarget.getCenterY() - 10, 
                    `${chainLightningDamage.toFixed(0)}`, 
                    'cyan', 
                    500
                ));

                let hitEnemies = [primaryTarget.id];
                let lastTarget = primaryTarget;
                const ricochetRadius = 120;
                const ricochetDamageFactor = 0.7;
                const ricochetStunChanceFactor = 0.5;

                for (let count = 0; count < 2; count++) {
                    let nextRicochetTarget = null;
                    let minDistanceToLastTarget = Infinity;

                    for (const enemy of enemies) {
                        if (!hitEnemies.includes(enemy.id)) {
                            const dist = Math.hypot(
                                lastTarget.getCenterX() - enemy.getCenterX(), 
                                lastTarget.getCenterY() - enemy.getCenterY()
                            );
                            if (dist < ricochetRadius && dist < minDistanceToLastTarget) {
                                minDistanceToLastTarget = dist;
                                nextRicochetTarget = enemy;
                            }
                        }
                    }

                    if (nextRicochetTarget) {
                        const ricochetDamage = chainLightningDamage * ricochetDamageFactor;
                        effects.push(new ChainLightningEffect(
                            { x: lastTarget.getCenterX(), y: lastTarget.getCenterY() },
                            { x: nextRicochetTarget.getCenterX(), y: nextRicochetTarget.getCenterY() },
                            200,
                            10,
                            20
                        ));
                        nextRicochetTarget.takeDamage(ricochetDamage, this);
                        hitEnemies.push(nextRicochetTarget.id);
                        lastTarget = nextRicochetTarget;

                        if (Math.random() < Champion.championData.thor.stunChance * ricochetStunChanceFactor && 
                            !nextRicochetTarget.isStunned && 
                            !(nextRicochetTarget.isDebuffImmune && nextRicochetTarget.debuffImmuneEndTime > Date.now())) {
                            nextRicochetTarget.applyStun(Champion.championData.thor.stunDuration);
                            effects.push(new this.gameManager.StunEffect(
                                nextRicochetTarget.getCenterX(), 
                                nextRicochetTarget.getCenterY(), 
                                Champion.championData.thor.stunDuration
                            ));
                        }
                        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                            nextRicochetTarget.getCenterX(), 
                            nextRicochetTarget.getCenterY() - 10, 
                            `${ricochetDamage.toFixed(0)}`, 
                            'lightblue', 
                            500
                        ));
                    } else {
                        break;
                    }
                }
                this.lastAttackTime = this.cooldownBase;
            }
        }

        // ===== CORREÇÃO: MJOLNIR CONTÍNUO =====
        // Verifica se pode lançar o Mjolnir (cooldown zerado E Mjolnir não está ativo)
        console.log(this.mjolnirCooldown+ " - "+ " - " + this.isMjolnirActive)
        if (this.mjolnirCooldown <= 0 && !this.isMjolnirActive) {
            let furthestTarget = null;
            let maxDistance = 0;
            const mjolnirRange = this.alcance * 2.5;

            for (const enemy of enemies) {
                const dist = Math.hypot(
                    this.getCenterX() - enemy.getCenterX(), 
                    this.getCenterY() - enemy.getCenterY()
                );
                if (dist < mjolnirRange && dist > maxDistance) {
                    maxDistance = dist;
                    furthestTarget = enemy;
                }
            }

            if (furthestTarget) {
                const mjolnirDamage = Champion.championData.thor.danoMjolnir * (1 + this.damageBoostBuff);
                const mjolnir = new this.gameManager.MjolnirProjectile(
                    this.getCenterX(), 
                    this.getCenterY(),
                    furthestTarget.getCenterX(), 
                    furthestTarget.getCenterY(),
                    900,
                    mjolnirDamage,
                    this,
                    this.gameManager
                );
                this.gameManager.projectiles.push(mjolnir);
                this.isMjolnirActive = true; // Marca que o Mjolnir está fora
                this.mjolnirCooldown = Champion.championData.thor.cooldownMjolnirBase; // Reseta cooldown
                console.log('⚡ Thor lançou Mjolnir!'); // Console log AQUI 
                this.gameManager.showUI('Thor: Pelo Mjolnir!', 'special');
            }
        }
    }

    activateAbility(abilityNumber) {
        this.gameManager.showUI('Thor: Minhas habilidades são parte de cada golpe!', 'info');
    }
}

export class Loki extends Champion {
    constructor(type, x, y, id, gameManagerInstance) {
        super(type, x, y, id, gameManagerInstance);
        
        const data = Champion.championData.loki;
        
        // 🔮 PASSIVO: Domínio da Regeneração
        this.lastRuneStoneSpawn = Date.now();
        
        // 👤 Habilidade 1: Clones
        this.abilities.clones = {
            charges: 2,
            maxCharges: 2,
            chargeCooldown: 0,
            chargeCooldownBase: data.clones.chargeCooldown
        };
        
        // ⚗️ Habilidade 2: Rebolinho
        this.abilities.split = { 
            cooldown: 0, 
            cooldownBase: data.splitProjectile.cooldown 
        };
        
        this.activeClones = [];
    }

    update(deltaTime, enemies, champions, projectiles, effects) {
        super.update(deltaTime, enemies, champions, projectiles, effects);
        
        const data = Champion.championData.loki;
        
        // 🔮 PASSIVO: Cria Pedra de Asgard automaticamente
        if (Date.now() - this.lastRuneStoneSpawn >= data.runeStone.passiveInterval) {
            this.spawnRuneStoneForWeakestAlly();
            this.lastRuneStoneSpawn = Date.now();
        }
        
        // Recarga de clones
        if (this.abilities.clones.charges < this.abilities.clones.maxCharges) {
            this.abilities.clones.chargeCooldown -= deltaTime;
            
            if (this.abilities.clones.chargeCooldown <= 0) {
                this.abilities.clones.charges++;
                this.abilities.clones.chargeCooldown = this.abilities.clones.chargeCooldownBase;
                
                if (this.abilities.clones.charges >= this.abilities.clones.maxCharges) {
                    this.abilities.clones.chargeCooldown = 0;
                }
            }
        }
    }
    
    spawnRuneStoneForWeakestAlly() {
        const data = Champion.championData.loki.runeStone;
        
        let weakestAlly = null;
        let lowestHpPercent = 1;
        
        this.gameManager.champions.forEach(champion => {
            if (champion.hp > 0) {
                const hpPercent = champion.hp / champion.maxHp;
                if (hpPercent < lowestHpPercent) {
                    lowestHpPercent = hpPercent;
                    weakestAlly = champion;
                }
            }
        });
        
        if (!weakestAlly || lowestHpPercent >= 1) {
            weakestAlly = this;
        }
        
        const angle = Math.random() * Math.PI * 2;
        const runeX = weakestAlly.getCenterX() + Math.cos(angle) * data.spawnDistance;
        const runeY = weakestAlly.getCenterY() + Math.sin(angle) * data.spawnDistance;
        
        this.placeRuneStone(runeX, runeY, this);
        
        this.gameManager.showUI(`🔮 Pedra de Asgard criada perto de ${weakestAlly.type}!`, 'success');
    }

    attack(enemies, projectiles, effects) {
        if (this.lastAttackTime <= 0) {
            const target = this.findNearestEnemy(enemies);
            if (target) {
                const finalDamage = this.dano * (1 + this.damageBoostBuff);
                
                projectiles.push(new this.gameManager.LaserProjectile(
                    this.getCenterX(), 
                    this.getCenterY(),
                    this.gameManager.getCenterX(target),
                    this.gameManager.getCenterY(target),
                    400,
                    finalDamage,
                    this,
                    this.gameManager
                ));
                
                effects.push(new this.gameManager.LaserEffect(
                    this.getCenterX(), 
                    this.getCenterY(),
                    this.gameManager.getCenterX(target),
                    this.gameManager.getCenterY(target),
                    15,
                    'purple',
                    1.5
                ));
                
                this.lastAttackTime = this.cooldownBase;
            }
        }
    }

    activateAbility(abilityNumber) {
        const data = Champion.championData.loki;
        
        if (abilityNumber === 1) {
            if (this.abilities.clones.charges > 0 && this.activeClones.length < data.clones.maxClones) {
                this.summonClone();
                this.abilities.clones.charges--;
                
                if (this.abilities.clones.charges === data.clones.maxCharges - 1) {
                    this.abilities.clones.chargeCooldown = data.clones.chargeCooldown;
                }
            } else if (this.activeClones.length >= data.clones.maxClones) {
                this.gameManager.showUI('Loki: Número máximo de clones atingido!', 'warning');
            } else {
                this.gameManager.showUI('Loki: Sem cargas disponíveis!', 'warning');
            }
        }
        
        else if (abilityNumber === 2 && this.abilities.split.cooldown <= 0) {
            let strongestEnemy = null;
            let maxHp = 0;
            
            this.gameManager.enemies.forEach(enemy => {
                if (enemy.hp > maxHp) {
                    maxHp = enemy.hp;
                    strongestEnemy = enemy;
                }
            });
            
            if (!strongestEnemy) {
                this.gameManager.showUI('Loki: Nenhum inimigo para dividir!', 'warning');
                return;
            }
            
            const splitProj = new this.gameManager.SplitProjectile(
                this.getCenterX(),
                this.getCenterY(),
                strongestEnemy,
                this.gameManager
            );
            
            this.gameManager.splitProjectiles = this.gameManager.splitProjectiles || [];
            this.gameManager.splitProjectiles.push(splitProj);
            
            this.abilities.split.cooldown = data.splitProjectile.cooldown;
            this.gameManager.showUI('Loki: Rebolinho da divisão!', 'ultimate');
        }
    }
    
    placeRuneStone(x, y, owner) {
        const data = Champion.championData.loki.runeStone;
        
        const runeStone = {
            id: `rune-${Date.now()}-${Math.random()}`,
            x: x,
            y: y,
            hp: data.durability,
            maxHp: data.durability,
            radius: data.radius,
            healRate: data.healRate,
            duration: data.duration,
            damageToHeal: data.damageToHeal,
            spawnTime: Date.now(),
            endTime: Date.now() + data.duration,
            owner: owner,
            lastHealTick: Date.now()
        };
        
        this.gameManager.runeStones = this.gameManager.runeStones || [];
        this.gameManager.runeStones.push(runeStone);
        
        // ⭐ NOVO: Efeito visual do Totem de Asgard
        this.gameManager.effects.push(new this.gameManager.AsgardStoneEffect(
            x, y, data.radius, data.duration
        ));
    }
    
    summonClone() {
        const data = Champion.championData.loki.clones;
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 60;
        const cloneX = this.x + Math.cos(angle) * distance;
        const cloneY = this.y + Math.sin(angle) * distance;
        
        const clone = {
            id: `loki-clone-${Date.now()}-${Math.random()}`,
            type: 'loki-clone',
            x: cloneX,
            y: cloneY,
            width: this.width,
            height: this.height,
            hp: data.cloneHP,
            maxHp: data.cloneHP,
            damage: this.dano * data.cloneDamageMultiplier,
            healMultiplier: data.cloneHealMultiplier,
            range: data.attackRange,
            cooldownBase: this.cooldownBase,
            lastAttackTime: 0,
            master: this,
            persistAfterDeath: data.persistAfterDeath,
            image: this.image,
            
            getCenterX() { return this.x + this.width / 2; },
            getCenterY() { return this.y + this.height / 2; },
            
            takeDamage(amount) {
                this.hp -= amount;
                if (this.hp <= 0) this.hp = 0;
            }
        };
        
        this.activeClones.push(clone);
        this.gameManager.lokiClones = this.gameManager.lokiClones || [];
        this.gameManager.lokiClones.push(clone);
        
        this.gameManager.effects.push(new this.gameManager.BamfEffect(
            clone.getCenterX(), clone.getCenterY(), 'purple', 500
        ));
        
        this.gameManager.showUI('Loki: Clone invocado!', 'info');
    }
}

export class RedHulk extends Champion {
    constructor(type, x, y, id, gameManagerInstance) {
        super(type, x, y, id, gameManagerInstance);
        this.abilities.nuclearStrike = { cooldown: 0, cooldownBase: Champion.championData.redhulk.nuclearStrikeCooldown };
        this.isEnraged = false;
    }

    update(deltaTime, enemies, champions, projectiles, effects) {
        super.update(deltaTime, enemies, champions, projectiles, effects);
        if (this.hp / this.maxHp <= Champion.championData.redhulk.rageThreshold && !this.isEnraged) {
            this.isEnraged = true;
            // Dano é aplicado com base no buff, então o dano base não precisa ser alterado aqui
            this.applyBuff('damageBoost', Champion.championData.redhulk.rageDamageBonus, Infinity); // Buff infinito enquanto estiver enfurecido
            this.gameManager.showUI('Red Hulk: GRRAAAHH! Fúria ativada!', 'special');
            effects.push(new this.gameManager.AuraFireParticleEffect(this.getCenterX(), this.getCenterY(), 50, 'red', 5000));
        } else if (this.hp / this.maxHp > Champion.championData.redhulk.rageThreshold && this.isEnraged) {
            this.isEnraged = false;
            this.buffs = this.buffs.filter(buff => !(buff.type === 'damageBoost' && buff.value === Champion.championData.redhulk.rageDamageBonus)); // Remove buff de fúria
        }
    }

    attack(enemies, projectiles, effects) {
        if (this.lastAttackTime <= 0) {
            const target = this.findNearestEnemy(enemies);
            if (target) {
                const finalDamage = this.dano * (1 + this.damageBoostBuff);
                this.gameManager.enemies.forEach(enemy => {
                    const dist = Math.hypot(this.gameManager.getCenterX(target) - enemy.getCenterX(), this.gameManager.getCenterY(target) - enemy.getCenterY());
                    if (dist < Champion.championData.redhulk.explosionRadius) {
                        enemy.takeDamage(finalDamage, this);
                        enemy.applyBleed(Champion.championData.redhulk.bleedDamagePerTick, Champion.championData.redhulk.bleedDuration);
                        this.gameManager.effects.push(new this.gameManager.TextPopEffect(enemy.getCenterX(), enemy.getCenterY(), `${finalDamage.toFixed(0)}`, 'red', 500));
                    }
                });
                effects.push(new this.gameManager.RedHulkExplosionEffect(this.gameManager.getCenterX(target), this.gameManager.getCenterY(target), Champion.championData.redhulk.explosionRadius, 200, 'darkred'));
                this.lastAttackTime = this.cooldownBase;
            }
        }
    }

    activateAbility(abilityNumber) {
        if (abilityNumber === 1 && this.abilities.nuclearStrike.cooldown <= 0) {
            const targetEnemy = this.findNearestEnemy(this.gameManager.enemies);
            if (targetEnemy) {
                const nuclearDamage = (Champion.championData.redhulk.nuclearStrikeDamage + (this.level * 20)) * (1 + this.damageBoostBuff);
                this.gameManager.enemies.forEach(enemy => {
                    const dist = Math.hypot(this.gameManager.getCenterX(targetEnemy) - enemy.getCenterX(), this.gameManager.getCenterY(targetEnemy) - enemy.getCenterY());
                    if (dist < Champion.championData.redhulk.nuclearStrikeRadius) {
                        enemy.takeDamage(nuclearDamage, this, Champion.championData.redhulk.nuclearStrikeArmorPen);
                        this.gameManager.effects.push(new this.gameManager.TextPopEffect(enemy.getCenterX(), enemy.getCenterY(), `NUCLEAR! ${nuclearDamage.toFixed(0)}`, 'orange', 1200));
                    }
                });
                this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(this.gameManager.getCenterX(targetEnemy), this.gameManager.getCenterY(targetEnemy), Champion.championData.redhulk.nuclearStrikeRadius, 500, 'gold'));
                this.abilities.nuclearStrike.cooldown = Champion.championData.redhulk.nuclearStrikeCooldown;
                this.gameManager.showUI('Red Hulk: Não fiquem no meu caminho!', 'ultimate');
            } else {
                this.gameManager.showUI('Red Hulk: Nenhum alvo para a greve nuclear!', 'warning');
            }
        }
    }
}

export class EmmaFrost extends Champion {
    constructor(type, x, y, id, gameManagerInstance) {
        super(type, x, y, id, gameManagerInstance);
        
        // NOVO: Estado para rastrear o modo (false = Psíquico, true = Diamante)
        this.isDiamondForm = false; 
        this.isInvulnerable = false; // A1: Propriedade de Invulnerabilidade
        
        // A3: Habilidades ativas
        this.abilities.toggleForm = { cooldown: 0, cooldownBase: 100 };
        this.abilities.diamondImpact = { cooldown: 0, cooldownBase: Champion.championData.emmafrost.diamondImpactCooldown };
        this.abilities.mentalBlast = { cooldown: 0, cooldownBase: Champion.championData.emmafrost.mentalBlastCooldown };
        
        this.teamUpCooldown = 0;
    
        console.log('✅ Emma Frost criada com Team Up!');
    }

    update(deltaTime, enemies, champions, projectiles, effects) {
        super.update(deltaTime, enemies, champions, projectiles, effects);
        
        // A1: Lógica de Invulnerabilidade (Se estiver em forma de diamante, está invulnerável)
        this.isInvulnerable = this.isDiamondForm; 

         // ðŸ¤ Cooldown do Team Up
        if (this.teamUpCooldown > 0) {
            this.teamUpCooldown -= deltaTime;
        }
        
        // Efeito visual (usando PsiEffect e EmmaWaveEffect se existirem)
        if (this.isDiamondForm) {
             // Efeito visual de diamante
              this.gameManager.effects.push(new EmmaWaveEffect(this.getCenterX(), this.getCenterY(), 500, 'white', 0.2));
        } else {
             // Efeito visual psíquico
              this.gameManager.effects.push(new PsiEffect(this.getCenterX(), this.getCenterY(), 500, 'pink', 0.1));
        }
    }

    /**
     * O ataque padrão da Emma agora depende do seu modo (Psíquico ou Diamante).
     */
// Em champions.js - EmmaFrost.attack(), SUBSTITUA a seção do modo psíquico:

attack(enemies, projectiles, effects) {
    const championData = Champion.championData.emmafrost;
    
    if (this.lastAttackTime <= 0) {
        if (this.isDiamondForm) {
            // Modo Diamante: Ataque de Dano Contínuo em Área
            if (this.cooldownOndaAtual <= 0) {
                enemies.forEach(inimigo => {
                    const dist = Math.hypot(
                        this.getCenterX() - inimigo.getCenterX(), 
                        this.getCenterY() - inimigo.getCenterY()
                    );  
                    
                    if (dist < championData.alcance) {
                        inimigo.takeDamage(this.dano * 0.5, this); 
                    }
                });

                effects.push(new EmmaWaveEffect(
                    this.getCenterX(), 
                    this.getCenterY(), 
                    championData.zonaOndaDiamante, 
                    600, 
                    'diamond'
                ));

                this.cooldownOndaAtual = championData.cooldownOndaDiamante;
            }
        } else {
            // ⭐ MODO PSÍQUICO MELHORADO: Pulso Mental com visual épico
            enemies.forEach(inimigo => {
                const dist = Math.hypot(
                    this.getCenterX() - inimigo.getCenterX(), 
                    this.getCenterY() - inimigo.getCenterY()
                );                  
                
                if (dist < championData.zonaConfusao) {
                    // Confusão
                    if (!inimigo.isConfused && Math.random() < championData.confuseChance) {
                        inimigo.applyDisorient(championData.duracaoConfusao);
                        
                        // ⭐ EFEITO VISUAL MELHORADO DE CONFUSÃO
                        this.gameManager.effects.push(new this.gameManager.EmmaPsychicPulseEffect(
                            this.getCenterX(),
                            this.getCenterY(),
                            inimigo.getCenterX(),
                            inimigo.getCenterY(),
                            400
                        ));
                    }
                    
                    // Slow
                    if (!inimigo.isSlowed && Math.random() < championData.slowChance) {
                        inimigo.applySlow(championData.slowFactor, championData.slowDuration);
                        
                        // ⭐ EFEITO VISUAL DE SLOW PSÍQUICO
                        this.gameManager.effects.push(new this.gameManager.PsychicChainEffect(
                            this.getCenterX(),
                            this.getCenterY(),
                            inimigo.getCenterX(),
                            inimigo.getCenterY(),
                            championData.slowDuration
                        ));
                    }
                }
            });
        }
        
        this.lastAttackTime = this.cooldownBase;
    }
}


draw(ctx, isSelected, mjolnirImage, capShieldImage, usagentShieldImage, wandaIllusionImage, displayRangeOverride = null) {
    // Chama o draw padrão
    super.draw(ctx, isSelected, mjolnirImage, capShieldImage, usagentShieldImage, wandaIllusionImage, displayRangeOverride);
    
    const centerX = this.getCenterX();
    const centerY = this.getCenterY();
    const time = Date.now() / 1000;
    
    ctx.save();
    
    if (this.isDiamondForm) {
        // ===============================
        // MODO DIAMANTE
        // ===============================
        
        // Aura de diamante pulsante
        const pulseSize = 45 + Math.sin(time * 2) * 5;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
        gradient.addColorStop(0, 'rgba(200, 230, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(200, 230, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(150, 200, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Cristais orbitando
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i + time;
            const orbitRadius = 35;
            const cx = centerX + Math.cos(angle) * orbitRadius;
            const cy = centerY + Math.sin(angle) * orbitRadius;
            
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(time * 2 + i);
            
            const crystalSize = 8;
            ctx.fillStyle = `rgba(200, 230, 255, ${0.7 + Math.sin(time * 3 + i) * 0.3})`;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(200, 230, 255, 0.8)';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(0, -crystalSize);
            ctx.lineTo(crystalSize * 0.6, 0);
            ctx.lineTo(0, crystalSize);
            ctx.lineTo(-crystalSize * 0.6, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.restore();
        }
        
        ctx.shadowBlur = 0;
        
        // Anéis de energia cristalina
        for (let r = 1; r <= 2; r++) {
            const ringRadius = 25 * r + Math.sin(time * 2 + r) * 3;
            const ringAlpha = 0.4 - r * 0.1;
            
            ctx.strokeStyle = `rgba(200, 230, 255, ${ringAlpha})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(200, 230, 255, 0.6)';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
        
        // Partículas de diamante flutuantes
        for (let i = 0; i < 8; i++) {
            const particleAngle = (Math.PI * 2 / 8) * i + time * 0.5;
            const particleRadius = 30 + Math.sin(time * 3 + i) * 10;
            const px = centerX + Math.cos(particleAngle) * particleRadius;
            const py = centerY + Math.sin(particleAngle) * particleRadius;
            const particleAlpha = 0.5 + Math.sin(time * 4 + i) * 0.3;
            
            ctx.fillStyle = `rgba(220, 240, 255, ${particleAlpha})`;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Símbolo de diamante no topo
        ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(200, 230, 255, 1)';
        ctx.shadowBlur = 10;
        ctx.fillText('💎', centerX, centerY - 55);
        
    } else {
        // ===============================
        // MODO PSÍQUICO
        // ===============================
        
        // Aura psíquica ondulante
        const psychicPulse = 50 + Math.sin(time * 3) * 8;
        const psychicGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, psychicPulse);
        psychicGradient.addColorStop(0, 'rgba(255, 105, 180, 0)');
        psychicGradient.addColorStop(0.4, 'rgba(255, 105, 180, 0.4)');
        psychicGradient.addColorStop(1, 'rgba(200, 0, 150, 0)');
        
        ctx.fillStyle = psychicGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, psychicPulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Símbolos Psi orbitando
        const psiSymbols = ['Ψ', 'Ω', 'Φ', 'Δ'];
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 / 4) * i + time * 0.8;
            const orbitRadius = 38;
            const sx = centerX + Math.cos(angle) * orbitRadius;
            const sy = centerY + Math.sin(angle) * orbitRadius;
            const floatY = Math.sin(time * 4 + i) * 3;
            
            ctx.save();
            ctx.translate(sx, sy + floatY);
            ctx.rotate(time * 2);
            
            const symbolAlpha = 0.7 + Math.sin(time * 5 + i) * 0.3;
            ctx.fillStyle = `rgba(255, 100, 200, ${symbolAlpha})`;
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(255, 100, 200, 0.9)';
            ctx.shadowBlur = 12;
            ctx.fillText(psiSymbols[i], 0, 0);
            
            ctx.restore();
        }
        
        ctx.shadowBlur = 0;
        
        // Ondas psíquicas concêntricas
        for (let w = 1; w <= 3; w++) {
            const waveRadius = 20 * w + Math.sin(time * 3 + w * 0.5) * 5;
            const waveAlpha = (0.5 - w * 0.12) * (1 + Math.sin(time * 4 + w) * 0.3);
            
            ctx.strokeStyle = `rgba(255, 105, 180, ${waveAlpha})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(255, 105, 180, 0.8)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
        
        // Partículas psíquicas espiraladas
        for (let i = 0; i < 12; i++) {
            const spiralAngle = (Math.PI * 2 / 12) * i + time * 2;
            const spiralRadius = 25 + (i % 3) * 8 + Math.sin(time * 5 + i) * 5;
            const px = centerX + Math.cos(spiralAngle) * spiralRadius;
            const py = centerY + Math.sin(spiralAngle) * spiralRadius;
            const particleSize = 2 + Math.sin(time * 6 + i) * 1;
            
            const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, particleSize);
            particleGradient.addColorStop(0, 'rgba(255, 150, 200, 0.9)');
            particleGradient.addColorStop(1, 'rgba(255, 100, 180, 0)');
            
            ctx.fillStyle = particleGradient;
            ctx.beginPath();
            ctx.arc(px, py, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Linhas de conexão psíquica
        ctx.strokeStyle = 'rgba(255, 105, 180, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const lineAngle = (Math.PI * 2 / 8) * i + time;
            const innerRadius = 15;
            const outerRadius = 35 + Math.sin(time * 4 + i) * 5;
            
            ctx.beginPath();
            ctx.moveTo(
                centerX + Math.cos(lineAngle) * innerRadius,
                centerY + Math.sin(lineAngle) * innerRadius
            );
            ctx.lineTo(
                centerX + Math.cos(lineAngle) * outerRadius,
                centerY + Math.sin(lineAngle) * outerRadius
            );
            ctx.stroke();
        }
        
        // Símbolo psíquico no topo
        ctx.fillStyle = `rgba(255, 105, 180, ${0.8 + Math.sin(time * 4) * 0.2})`;
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(255, 105, 180, 1)';
        ctx.shadowBlur = 15;
        ctx.fillText('🧠', centerX, centerY - 55);
    }
    
    // ðŸ¤ Indicador de Team Up
    if (isSelected) {
        const wanda = this.gameManager.champions.find(c => c.type === 'wanda' && c.hp > 0);
        
        if (wanda) {
            if (this.teamUpCooldown <= 0) {
                ctx.fillStyle = 'rgba(255, 0, 255, 0.9)';
                ctx.font = 'bold 13px Arial';
                ctx.textAlign = 'center';
                ctx.shadowColor = 'magenta';
                ctx.shadowBlur = 12;
                ctx.fillText('🧠💜 TEAM UP [4]', centerX, this.y - 85);
                ctx.shadowBlur = 0;
            } else {
                const cdLeft = (this.teamUpCooldown / 1000).toFixed(1);
                ctx.fillStyle = 'rgba(150, 150, 150, 0.9)';
                ctx.font = 'bold 11px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Team Up: ${cdLeft}s`, centerX, this.y - 85);
            }
        }
    }
    
     ctx.restore();
}

    /**
     * Lógica das habilidades ativas
     * Habilidade 1: Alternar entre Modos (Psíquico/Diamante)
     * Habilidade 2: Impacto de Diamante (Somente em Modo Diamante)
     */
// Em champions.js - EmmaFrost.activateAbility():

activateAbility(abilityNumber) {
    const championData = Champion.championData.emmafrost;
    
    // Habilidade 1: Troca de Modo
    if (abilityNumber === 1 && this.abilities.toggleForm.cooldown <= 0) {
        this.isDiamondForm = !this.isDiamondForm;
        this.abilities.toggleForm.cooldown = this.abilities.toggleForm.cooldownBase;
        
        // ⭐ NOVO: Efeito visual melhorado
        this.gameManager.effects.push(new this.gameManager.EmmaFormChangeEffect(
            this.getCenterX(),
            this.getCenterY(),
            800,
            this.isDiamondForm
        ));
        
        this.gameManager.showUI(`Emma Frost: Modo ${this.isDiamondForm ? 'Diamante' : 'Psíquico'}`, 'info');
    }
    
    // Em champions.js - EmmaFrost.activateAbility() - Habilidade 2:

    else if (abilityNumber === 2 && this.abilities.diamondImpact.cooldown <= 0 && this.isDiamondForm) {
        this.abilities.diamondImpact.cooldown = this.abilities.diamondImpact.cooldownBase;
        
        const championData = Champion.championData.emmafrost;
        
        // ⭐ EFEITO VISUAL ÉPICO DO IMPACTO
        this.gameManager.effects.push(new this.gameManager.EmmaDiamondImpactEffect(
            this.getCenterX(),
            this.getCenterY(),
            championData.diamondImpactRadius,
            800
        ));
        
        // Lógica de dano em área
        this.gameManager.enemies.forEach(enemy => {
            const dist = Math.hypot(this.getCenterX() - enemy.getCenterX(), this.getCenterY() - enemy.getCenterY());
            if (dist < championData.diamondImpactRadius) {
                enemy.takeDamage(championData.diamondImpactDamage, this);
            }
        });
        
        // Lançar Estilhaços (DiamondShardProjectile)
        for (let i = 0; i < championData.diamondImpactShards; i++) {
            const angle = (Math.PI * 2) / championData.diamondImpactShards * i;
            this.gameManager.projectiles.push(new DiamondShardProjectile(
                this.getCenterX(), 
                this.getCenterY(), 
                this.getCenterX() + Math.cos(angle) * 1000, 
                this.getCenterY() + Math.sin(angle) * 1000, 
                800, 
                championData.diamondImpactDamage * 0.1, 
                this.id, 
                this.gameManager,
                angle
            ));
        }
        
        this.gameManager.showUI('Emma Frost: Impacto de Diamante!', 'success');
    }
        
    // Habilidade 3: Rajada Mental
    else if (abilityNumber === 3 && this.abilities.mentalBlast.cooldown <= 0 && !this.isDiamondForm) {
        this.abilities.mentalBlast.cooldown = this.abilities.mentalBlast.cooldownBase;
        
        const target = this.findNearestEnemy(this.gameManager.enemies);
        let attackAngle = 0;
        if (target) {
            attackAngle = Math.atan2(
                target.getCenterY() - this.getCenterY(), 
                target.getCenterX() - this.getCenterX()
            );
        }
        
        // ⭐ NOVO: Efeito visual melhorado da rajada
        this.gameManager.effects.push(new this.gameManager.EmmaMentalBlastEffect(
            this.getCenterX(),
            this.getCenterY(),
            this.getCenterX() + Math.cos(attackAngle) * championData.mentalBlastRange,
            this.getCenterY() + Math.sin(attackAngle) * championData.mentalBlastRange,
            attackAngle,
            championData.mentalBlastRange,
            600
        ));
        
        // Lógica de dano...
        const blastAngle = Math.PI / 3;
        this.gameManager.enemies.forEach(enemy => {
            const enemyCx = enemy.getCenterX();
            const enemyCy = enemy.getCenterY();
            const dist = Math.hypot(enemyCx - this.getCenterX(), enemyCy - this.getCenterY());
            
            if (dist < championData.mentalBlastRange) {
                let angleToEnemy = Math.atan2(
                    enemyCy - this.getCenterY(), 
                    enemyCx - this.getCenterX()
                );
                let angleDiff = Math.abs(attackAngle - angleToEnemy);
                
                if (angleDiff > Math.PI) {
                    angleDiff = 2 * Math.PI - angleDiff;
                }
                
                if (angleDiff < blastAngle / 2) {
                    enemy.takeDamage(championData.mentalBlastDamage, this);
                    enemy.applyStun(championData.mentalBlastStunDuration);
                    
                    this.gameManager.effects.push(new this.gameManager.StunEffect(
                        enemyCx, 
                        enemyCy, 
                        championData.mentalBlastStunDuration
                    ));
                }
            }
        });
        
        this.gameManager.showUI('Emma Frost: Rajada Mental!', 'success');
    }

     // ðŸ¤ HABILIDADE 4: TEAM UP - ATRAÇÃO PSIÔNICA (Emma + Wanda)
// 4. TEAM UP (AQUI ESTÁ A CORREÇÃO CRÍTICA)
        else if (abilityNumber === 4) {
            // Verifica se Wanda está em campo
            const wanda = this.gameManager.champions.find(c => c.type === 'wanda' && c.hp > 0);
            
            if (!wanda) {
                this.gameManager.showUI('Emma Frost: Preciso de Wanda para esta habilidade! 💜', 'warning');
                return;
            }
            
            if (this.teamUpCooldown > 0) {
                this.gameManager.showUI(`Atração Psiônica em cooldown`, 'warning');
                return;
            }
            
            // Define o alvo (mouse ou aleatório à frente)
            const targetX = this.gameManager.mouseX || this.x + 200;
            const targetY = this.gameManager.mouseY || this.y;
            const angle = Math.atan2(targetY - this.getCenterY(), targetX - this.getCenterX());
            
            // GARANTIR QUE A LISTA EXISTE NO GAMEMANAGER
            if (!this.gameManager.psychicAttractionCones) {
                this.gameManager.psychicAttractionCones = [];
            }
            
            // Instancia a classe PsychicAttractionCone (definida em champions.js)
            const cone = new PsychicAttractionCone(this, wanda, angle, this.gameManager);
            this.gameManager.psychicAttractionCones.push(cone);
            
            // Aplica Cooldown
            this.teamUpCooldown = TEAM_UPS.psychicAttraction.cooldown;
            
            // Efeitos Visuais
            const centerX = (this.getCenterX() + wanda.getCenterX()) / 2;
            const centerY = (this.getCenterY() + wanda.getCenterY()) / 2;
            
            // Usa classes importadas diretamente para evitar erros de "undefined"
            this.gameManager.effects.push(new RedHulkExplosionEffect(centerX, centerY, 120, 800, 'rgba(200, 0, 255, 0.9)'));
            this.gameManager.effects.push(new USAgentShockwaveEffect(centerX, centerY, 150, 500));

            this.gameManager.showUI('Emma + Wanda: ATRAÇÃO PSIÔNICA! 🧠💜', 'ultimate');
        }
    }

}

export class Ultron extends Champion {
    constructor(type, x, y, id, gameManagerInstance) {
        super(type, x, y, id, gameManagerInstance);
        
        // Habilidades Ativas
        this.abilities.kamikazeDrones = { 
            cooldown: 0, 
            cooldownBase: Champion.championData.ultron.kamikazeDroneSpawnCooldown 
        };
        this.abilities.infest = { 
            cooldown: 0, 
            cooldownBase: Champion.championData.ultron.infestCooldown 
        };
        
        // Autorreconstrução
        this.isReconstructing = false;
        this.reconstructionEndTime = 0;
        this.emergencyReplicationUsedThisPhase = false;
        this.lastReplicationPhase = 0;
        
        // Ataque Orbital (Satélite)
        this.lastSatelliteStrikeTime = 0;
        
        // NOVO: Sistema de Drones Sentinela
        this.droneSpawnCooldown = 0; // Cooldown para gerar novos drones
    }

    /**
     * Update - Gerencia reconstrução, satélite e spawn de drones
     */
    update(deltaTime, enemies, champions, projectiles, effects) {
        super.update(deltaTime, enemies, champions, projectiles, effects);

        // ===== AUTORRECONSTRUÇÃO (Finalização) =====
        if (this.isReconstructing) {
            if (Date.now() > this.reconstructionEndTime) {
                this.isReconstructing = false;
                this.hp = this.maxHp;
                this.gameManager.showUI('Ultron: Eu sou inevitável!', 'success');
            } else {
                return; // Não faz nada enquanto está reconstruindo
            }
        }
        
        const data = Champion.championData.ultron;
        
        // ===== GERAÇÃO AUTOMÁTICA DE DRONES SENTINELA =====
        if (this.droneSpawnCooldown > 0) {
            this.droneSpawnCooldown = Math.max(0, this.droneSpawnCooldown - deltaTime);
        }
        
        if (this.droneSpawnCooldown <= 0) {
            // Conta quantos drones sentinela deste Ultron existem
            const currentDrones = this.gameManager.drones.filter(
                d => d.spawnerId === this.id && d.mode === 'sentinel'
            ).length;
            
            if (currentDrones < data.maxDrones) {
                this.spawnSentinelDrone();
                this.droneSpawnCooldown = data.droneSpawnCooldown;
            }
        }
        // ===== ATAQUE DOS DRONES SENTINELA =====
        this.gameManager.drones.filter(
            d => d.spawnerId === this.id && d.mode === 'sentinel'
        ).forEach(drone => {
            if (drone.cooldown <= 0) {
                // Procura inimigo mais próximo dentro do alcance
                let targetEnemy = null;
                let minDist = data.sentinelDroneRange;
                
                for (const enemy of this.gameManager.enemies) {
                    const dist = Math.hypot(
                        drone.x - enemy.getCenterX(),
                        drone.y - enemy.getCenterY()
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        targetEnemy = enemy;
                    }
                }
                
                if (targetEnemy) {
                    // Cria projétil laser do drone
                    this.gameManager.projectiles.push(new DroneLaserProjectile(
                        drone.x,
                        drone.y,
                        targetEnemy.getCenterX(),
                        targetEnemy.getCenterY(),
                        800, // Velocidade aumentada para efeito de tiro rápido
                        data.sentinelDroneDamage,
                        this,
                        this.gameManager
                    ));
                    
                    // Efeito visual do laser - múltiplas linhas para parecer uma rajada
                    const baseColor = 'lime';
                    const glowColor = 'rgba(0, 255, 0, 0.6)';
                    
                    // Linha principal
                    this.gameManager.effects.push(new LaserEffect(
                        drone.x,
                        drone.y,
                        targetEnemy.getCenterX(),
                        targetEnemy.getCenterY(),
                        4,
                        baseColor,
                        0.15
                    ));
                    
                    // Efeito de brilho externo
                    this.gameManager.effects.push(new LaserEffect(
                        drone.x,
                        drone.y,
                        targetEnemy.getCenterX(),
                        targetEnemy.getCenterY(),
                        8,
                        glowColor,
                        0.1
                    ));
                    
                    // Flash no ponto de disparo
                    this.gameManager.effects.push(new this.gameManager.NanobotParticleEffect(
                        drone.x,
                        drone.y,
                        'lime',
                        150
                    ));
                    
                    drone.cooldown = data.sentinelDroneAttackSpeed;
                }
            }
        });
        
        // ===== ATAQUE ORBITAL (Satélite) - Passivo Automático =====
        if (Date.now() - this.lastSatelliteStrikeTime >= data.satelliteStrikeInterval) {
            this.launchSatelliteStrike();
            this.lastSatelliteStrikeTime = Date.now();
        }
    }
    

    /**
     * NOVO: Gera um Drone Sentinela
     */
    spawnSentinelDrone() {
        const data = Champion.championData.ultron;
        
        // Posição aleatória ao redor de Ultron
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * data.droneSpawnRadius;
        
        const newDroneX = this.getCenterX() + Math.cos(angle) * distance;
        const newDroneY = this.getCenterY() + Math.sin(angle) * distance;
        
        // Cria o drone
        this.gameManager.drones.push({
            id: Date.now() + Math.random(),
            x: newDroneX,
            y: newDroneY,
            mode: 'sentinel',
            range: data.sentinelDroneRange,
            damage: data.sentinelDroneDamage,
            cooldown: 0,
            attackSpeed: data.sentinelDroneAttackSpeed,
            size: data.sentinelDroneSize,
            spawnerId: this.id,
            spawnTime: Date.now(),
            owner: this,
        });
        
        // Efeito visual
        this.gameManager.effects.push(new this.gameManager.NanobotParticleEffect(
            newDroneX, 
            newDroneY, 
            'green', 
            500
        ));
    }

    /**
     * Ataque Básico - DESABILITADO (Ultron não ataca)
     */
    attack(enemies, projectiles, effects) {
        // Ultron NÃO ataca diretamente, apenas seus drones atacam
        return;
    }
    

    /**
     * Ataque Orbital (Satélite)
     */
    launchSatelliteStrike() {
        if (this.gameManager.enemies.length === 0) return;
        
        const data = Champion.championData.ultron;
        
        // Encontra o inimigo mais avançado (maior X, mais próximo da base)
        let targetEnemy = this.gameManager.enemies[0];
        for (const enemy of this.gameManager.enemies) {
            if (enemy.x > targetEnemy.x) {
                targetEnemy = enemy;
            }
        }
        
        if (targetEnemy) {
            const targetX = targetEnemy.getCenterX();
            const targetY = targetEnemy.getCenterY();
            
            // Cria o efeito de ataque orbital
            this.gameManager.effects.push(new this.gameManager.SatelliteStrikeEffect(
                targetX,
                targetY,
                data.satelliteStrikeRadius,
                data.satelliteStrikeDamage,
                this,
                data.satelliteStrikeHackChance,
                data.satelliteStrikeHackDuration,
                this.gameManager
            ));
            
            this.gameManager.showUI('Ultron: Ataque Orbital Iniciado!', 'special');
        }
    }

    /**
     * Habilidades Ativas
     */
activateAbility(abilityNumber) {
    if (this.isReconstructing) {
        this.gameManager.showUI('Ultron: Reconstruindo... Habilidades indisponíveis.', 'warning');
        return;
    }

    const data = Champion.championData.ultron;

    // ===== HABILIDADE 1: Converter Drones Sentinela em Kamikaze =====
    if (abilityNumber === 1 && this.abilities.kamikazeDrones.cooldown <= 0) {
        // Conta quantos drones sentinela existem
        const sentinelDrones = this.gameManager.drones.filter(
            d => d.spawnerId === this.id && d.mode === 'sentinel'
        );
        
        if (sentinelDrones.length === 0) {
            this.gameManager.showUI('Ultron: Nenhum drone sentinela disponível para conversão!', 'warning');
            return;
        }
        
        let convertedCount = 0;
        const maxConvert = Math.min(data.kamikazeDroneCount, sentinelDrones.length);
        
        // Converte os drones mais antigos primeiro
        sentinelDrones.sort((a, b) => a.spawnTime - b.spawnTime);
        
        for (let i = 0; i < maxConvert; i++) {
            const drone = sentinelDrones[i];
            
            // Encontra o inimigo mais avançado (maior X)
            let targetEnemy = null;
            let furthestX = -1;
            
            this.gameManager.enemies.forEach(e => {
                if (e.x > furthestX) {
                    furthestX = e.x;
                    targetEnemy = e;
                }
            });
            
            if (targetEnemy) {
                // Converte o drone para modo kamikaze
                drone.mode = 'kamikaze';
                drone.target = targetEnemy;
                drone.damage = data.kamikazeDroneDamage * (1 + this.damageBoostBuff);
                drone.explosionRadius = data.kamikazeDroneExplosionRadius;
                drone.speed = data.kamikazeDroneSpeed;
                drone.radiusCollision = 10;
                
                // Efeito visual da conversão
                this.gameManager.effects.push(new this.gameManager.NanobotParticleEffect(
                    drone.x, 
                    drone.y, 
                    'red', 
                    300
                ));
                
                // Efeito de transformação
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    drone.x,
                    drone.y - 10,
                    'KAMIKAZE!',
                    'red',
                    800
                ));
                
                convertedCount++;
            }
        }
        
        if (convertedCount > 0) {
            this.abilities.kamikazeDrones.cooldown = data.kamikazeDroneSpawnCooldown;
            this.gameManager.showUI(`Ultron: ${convertedCount} drones convertidos para modo Kamikaze!`, 'special');
        } else {
            this.gameManager.showUI('Ultron: Nenhum inimigo válido para os drones atacarem!', 'warning');
        }
    }
    
    // ===== HABILIDADE 2: Infestação =====
    else if (abilityNumber === 2 && this.abilities.infest.cooldown <= 0) {
        const targetEnemy = this.findNearestEnemy(this.gameManager.enemies);
        if (targetEnemy) {
            targetEnemy.applyInfest(
                data.infestDuration, 
                data.infestDamageReduction
            );
            
            this.gameManager.effects.push(new this.gameManager.NanobotCloudEffect(
                targetEnemy.getCenterX(),
                targetEnemy.getCenterY(),
                data.infestDuration,
                50
            ));
            
            this.abilities.infest.cooldown = data.infestCooldown;
            this.gameManager.showUI(
                `Ultron: ${targetEnemy.type.charAt(0).toUpperCase() + targetEnemy.type.slice(1)} infestado!`, 
                'special'
            );
        } else {
            this.gameManager.showUI('Ultron: Nenhum inimigo no alcance para infestar.', 'warning');
        }
    }
}
}

export class CaptainMarvel extends Champion {
    constructor(type, x, y, id, gameManagerInstance) {
        super(type, x, y, id, gameManagerInstance);
        this.absorbedEnergy = 0;
        this.abilities.missileBarrage = { cooldown: 0, cooldownBase: Champion.championData.captainmarvel.missileBarrageCooldown };
    }

    absorbEnergy(amount) {
        this.absorbedEnergy = Math.min(this.absorbedEnergy + amount, Champion.championData.captainmarvel.ultimateChargeNeeded);
        this.gameManager.updateUI();
    }

// Em champions.js - CaptainMarvel, ADICIONE o método update() customizado:

update(deltaTime, enemies, champions, projectiles, effects) {
    super.update(deltaTime, enemies, champions, projectiles, effects);
    
    // ⭐ MODO MÍSSIL HUMANO
    if (this.isHumanMissileActive && this.humanMissileTarget) {
        // Verifica se o alvo ainda existe
        if (this.humanMissileTarget.hp <= 0 || !enemies.includes(this.humanMissileTarget)) {
            // Busca novo alvo
            this.humanMissileTarget = enemies.sort((a, b) => b.hp - a.hp)[0];
            
            if (!this.humanMissileTarget) {
                this.isHumanMissileActive = false;
                this.x = this.originalX;
                this.y = this.originalY;
                return;
            }
        }
        
        const data = Champion.championData.captainmarvel;
        const targetX = this.gameManager.getCenterX(this.humanMissileTarget);
        const targetY = this.gameManager.getCenterY(this.humanMissileTarget);
        
        const distToTarget = Math.hypot(targetX - this.getCenterX(), targetY - this.getCenterY());
        
        // Move em direção ao alvo
        const angle = Math.atan2(targetY - this.getCenterY(), targetX - this.getCenterX());
        const moveAmount = data.missileSpeed * (deltaTime / 1000);
        
        this.x += Math.cos(angle) * moveAmount;
        this.y += Math.sin(angle) * moveAmount;
        
        // ⭐ EFEITOS VISUAIS DO MÍSSIL
        // Rastro dourado intenso
        for (let i = 0; i < 3; i++) {
            const trailX = this.getCenterX() - Math.cos(angle) * i * 15;
            const trailY = this.getCenterY() - Math.sin(angle) * i * 15;
            
            effects.push(new this.gameManager.AuraFireParticleEffect(
                trailX,
                trailY,
                20,
                i === 0 ? 'white' : (i === 1 ? 'gold' : 'orange'),
                300
            ));
        }
        
        // Partículas laterais
        const perpAngle = angle + Math.PI / 2;
        for (let side of [-1, 1]) {
            const sideX = this.getCenterX() + Math.cos(perpAngle) * side * 10;
            const sideY = this.getCenterY() + Math.sin(perpAngle) * side * 10;
            
            effects.push(new this.gameManager.AuraFireParticleEffect(
                sideX,
                sideY,
                15,
                'orange',
                200
            ));
        }
        
        // Verifica impacto
        if (distToTarget < 30 && !this.damageApplied) {
            this.damageApplied = true;
            
            // Dano no alvo principal
            this.humanMissileTarget.takeDamage(data.missileDamage, this);
            
            // Dano em área
            enemies.forEach(enemy => {
                const dist = Math.hypot(
                    this.getCenterX() - enemy.getCenterX(),
                    this.getCenterY() - enemy.getCenterY()
                );
                
                if (dist < data.missileExplosionRadius && enemy.id !== this.humanMissileTarget.id) {
                    enemy.takeDamage(data.missileAoeDamage, this);
                }
            });
            
            // ⭐ EXPLOSÃO ÉPICA
            effects.push(new this.gameManager.CaptainMarvelMissileExplosionEffect(
                this.getCenterX(),
                this.getCenterY(),
                data.missileExplosionRadius,
                800,
                'gold'
            ));
            
            // Múltiplas camadas de explosão
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    effects.push(new this.gameManager.RedHulkExplosionEffect(
                        this.getCenterX(),
                        this.getCenterY(),
                        data.missileExplosionRadius * (0.7 + i * 0.15),
                        300,
                        i === 0 ? 'white' : (i === 1 ? 'gold' : 'orange')
                    ));
                }, i * 100);
            }
            
            // Partículas em todas as direções
            for (let i = 0; i < 30; i++) {
                const particleAngle = (Math.PI * 2 / 30) * i;
                effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.getCenterX() + Math.cos(particleAngle) * 20,
                    this.getCenterY() + Math.sin(particleAngle) * 20,
                    25,
                    i % 3 === 0 ? 'white' : (i % 3 === 1 ? 'gold' : 'orange'),
                    600
                ));
            }
            
            // Volta à posição original
            this.isHumanMissileActive = false;
            this.x = this.originalX;
            this.y = this.originalY;
            
            this.gameManager.showUI('Capitã Marvel: Impacto devastador!', 'ultimate');
        }
    }
}

// Em champions.js - CaptainMarvel.attack(), já está bom! Vamos adicionar mais camadas:

attack(enemies, projectiles, effects) {
    if (this.lastAttackTime <= 0) {
        const target = this.findNearestEnemy(enemies);
        if (target) {
            const finalDamage = this.dano * (1 + this.damageBoostBuff);
            projectiles.push(new this.gameManager.LaserProjectile(
                this.getCenterX(), 
                this.getCenterY(), 
                this.gameManager.getCenterX(target), 
                this.gameManager.getCenterY(target), 
                500, 
                finalDamage, 
                this, 
                this.gameManager, 
                'orange'
            ));
            
            // ⭐ NOVO: Múltiplas camadas de efeito
            // Linha central super brilhante
          // â­ LASER LONGO ESTILO SHOT (duraÃ§Ã£o 200ms)
            effects.push(new this.gameManager.LaserEffect(
                this.getCenterX(), 
                this.getCenterY(), 
                this.gameManager.getCenterX(target), 
                this.gameManager.getCenterY(target), 
                4, 
                '#FFD700', 
                0.2 // 200ms de duraÃ§Ã£o
            ));
            
            // Camada dourada intermediária
            effects.push(new this.gameManager.LaserEffect(
                this.getCenterX(), 
                this.getCenterY(), 
                this.gameManager.getCenterX(target), 
                this.gameManager.getCenterY(target), 
                14, 
                'gold', 
                0.12
            ));
            
            // Camada laranja externa
            effects.push(new this.gameManager.LaserEffect(
                this.getCenterX(), 
                this.getCenterY(), 
                this.gameManager.getCenterX(target), 
                this.gameManager.getCenterY(target), 
                22, 
                'orange', 
                0.1
            ));
            
            // Brilho externo
            effects.push(new this.gameManager.LaserEffect(
                this.getCenterX(), 
                this.getCenterY(), 
                this.gameManager.getCenterX(target), 
                this.gameManager.getCenterY(target), 
                30, 
                'rgba(255, 140, 0, 0.3)', 
                0.08
            ));
            
            // Partículas de energia no ponto de disparo
            effects.push(new this.gameManager.AuraFireParticleEffect(
                this.getCenterX(),
                this.getCenterY(),
                18,
                'gold',
                250
            ));
            
            // ⭐ NOVO: Absorve energia ao atacar
            this.absorbEnergy(0.5);
            
            this.lastAttackTime = this.cooldownBase;
        }
    }
}
// Em champions.js - CaptainMarvel, ADICIONE o método draw() customizado:

draw(ctx, isSelected, mjolnirImage, capShieldImage, usagentShieldImage, wandaIllusionImage, displayRangeOverride = null) {
    // Chama o draw padrão
    super.draw(ctx, isSelected, mjolnirImage, capShieldImage, usagentShieldImage, wandaIllusionImage, displayRangeOverride);
    
    // ⭐ BARRA DE PROGRESSO DA ULTIMATE
    const data = Champion.championData.captainmarvel;
    const progress = this.absorbedEnergy / data.ultimateChargeNeeded;
    
    ctx.save();
    
    // Posição da barra (abaixo da imagem do champion)
    const barX = this.x;
    const barY = this.y + this.height + 5;
    const barWidth = this.width;
    const barHeight = 8;
    
    // Fundo da barra
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Preenchimento da barra (gradiente dourado)
    if (progress > 0) {
        const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth * progress, barY);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 165, 0, 1)');
        gradient.addColorStop(1, 'rgba(255, 140, 0, 1)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Brilho da barra quando cheia
        if (progress >= 1) {
            const pulseAlpha = 0.3 + Math.sin(Date.now() / 100) * 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
            ctx.fillRect(barX, barY, barWidth, barHeight);
        }
    }
    
    // Contorno da barra
    ctx.strokeStyle = progress >= 1 ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Texto da porcentagem
    ctx.fillStyle = progress >= 1 ? 'rgba(255, 255, 0, 1)' : 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(progress * 100)}%`, barX + barWidth / 2, barY + barHeight - 1);
    
    // Ícone quando ultimate está pronta
    if (progress >= 1) {
        const iconSize = 16;
        const iconX = barX + barWidth / 2;
        const iconY = barY - iconSize - 2;
        
        // Estrela pulsante
        ctx.save();
        ctx.translate(iconX, iconY);
        ctx.rotate(Date.now() / 500);
        
        const starAlpha = 0.7 + Math.sin(Date.now() / 150) * 0.3;
        ctx.fillStyle = `rgba(255, 215, 0, ${starAlpha})`;
        ctx.shadowColor = 'rgba(255, 215, 0, 1)';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const outerRadius = iconSize / 2;
            const innerRadius = iconSize / 4;
            
            ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
            const innerAngle = angle + Math.PI / 5;
            ctx.lineTo(Math.cos(innerAngle) * innerRadius, Math.sin(innerAngle) * innerRadius);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    ctx.restore();
}

activateAbility(abilityNumber) {
    if (abilityNumber === 1 && this.abilities.missileBarrage.cooldown <= 0 && this.absorbedEnergy >= Champion.championData.captainmarvel.ultimateChargeNeeded) {
        const data = Champion.championData.captainmarvel;
        
        // Encontra o inimigo com maior HP ou mais distante
        let targetEnemy = null;
        let highestHp = -1;
        let furthestX = -1;
        
        this.gameManager.enemies.forEach(e => {
            if (e.hp > highestHp || (e.hp === highestHp && e.x > furthestX)) {
                highestHp = e.hp;
                furthestX = e.x;
                targetEnemy = e;
            }
        });

        if (targetEnemy) {
            // Ativa modo Míssil Humano
            this.isHumanMissileActive = true;
            this.humanMissileTarget = targetEnemy;
            this.missileStartX = this.x;
            this.missileStartY = this.y;
            this.originalX = this.x;
            this.originalY = this.y;
            this.damageApplied = false;
            
            const targetX = this.gameManager.getCenterX(targetEnemy);
            const targetY = this.gameManager.getCenterY(targetEnemy);
            const distToTarget = Math.hypot(targetX - this.missileStartX, targetY - this.missileStartY);
            
            this.missileDuration = (distToTarget / data.missileSpeed) * 1000;
            if (this.missileDuration === 0) this.missileDuration = 1;
            
            this.missileElapsedTime = 0;
            
            // Reseta cooldown e energia
            this.abilities.missileBarrage.cooldown = data.missileBarrageCooldown;
            this.absorbedEnergy = 0;
            
            this.gameManager.showUI('Capitã Marvel: Transformação em Míssil Humano!', 'ultimate');
        } else {
            this.gameManager.showUI('Capitã Marvel: Nenhum inimigo forte para atacar!', 'warning');
        }
    } else if (abilityNumber === 1 && this.abilities.missileBarrage.cooldown > 0) {
        this.gameManager.showUI('Míssil Humano em recarga!', 'warning');
    } else if (abilityNumber === 1) {
        this.gameManager.showUI(`Míssil Humano precisa de ${Champion.championData.captainmarvel.ultimateChargeNeeded - this.absorbedEnergy.toFixed(0)} de energia!`, 'warning');
    }
}

    onEnemyKilled() {
        super.onEnemyKilled();
        this.absorbEnergy(Champion.championData.captainmarvel.energyPerKill);
    }
}

export class Hawkeye extends Champion {
    // Em champions.js - Hawkeye constructor:

        constructor(type, x, y, id, gameManagerInstance) {
            super(type, x, y, id, gameManagerInstance);
            this.abilities.explosiveArrow = { 
                cooldown: 0, 
                cooldownBase: Champion.championData.hawkeye.explosiveArrowCooldown 
            };
            // ⭐ MUDANÇA: Nova habilidade
            this.abilities.arrowStorm = { 
                cooldown: 0, 
                cooldownBase: Champion.championData.hawkeye.arrowStormCooldown 
            };
             
            // ⭐ NOVO: Kate Bishop
            this.abilities.kateBishop = {
                cooldown: 0,
                cooldownBase: Champion.championData.hawkeye.kateBishopCooldown
            };
            this.kateBishopActive = null; // Referência à Kate em campo
        }

attack(enemies, projectiles, effects) {
    if (this.lastAttackTime <= 0) {
        const target = this.findNearestEnemy(enemies);
        if (target) {
            const data = Champion.championData.hawkeye;
            const finalDamage = this.dano * (1 + this.damageBoostBuff);
            
            // Seleciona tipo de flecha aleatoriamente
            const arrowTypes = ['standard', 'shock', 'ice', 'poison', 'explosive', 'triple'];
            const randomType = arrowTypes[Math.floor(Math.random() * arrowTypes.length)];
            
            if (randomType === 'triple') {
                // Flecha Tripla - 3 flechas em arco
                const baseAngle = Math.atan2(
                    this.gameManager.getCenterY(target) - this.getCenterY(),
                    this.gameManager.getCenterX(target) - this.getCenterX()
                );
                const spreadAngle = 0.15; // Ângulo de dispersão
                
                for (let i = 0; i < 3; i++) {
                    const angleOffset = (i - 1) * spreadAngle;
                    const arrowAngle = baseAngle + angleOffset;
                    
                    const endX = this.getCenterX() + Math.cos(arrowAngle) * 1000;
                    const endY = this.getCenterY() + Math.sin(arrowAngle) * 1000;
                    
                    const arrow = new HawkeyeArrow(
                        this.getCenterX(),
                        this.getCenterY(),
                        endX,
                        endY,
                        600,
                        finalDamage * 0.8, // Dano reduzido por ser múltipla
                        this,
                        'standard',
                        this.gameManager
                    );
                    
                    projectiles.push(arrow);
                }
                
                this.gameManager.showUI('Gavião Arqueiro: Flecha Tripla!', 'info');
                
            } else {
                // Flechas normais
                const arrow = new HawkeyeArrow(
                    this.getCenterX(),
                    this.getCenterY(),
                    this.gameManager.getCenterX(target),
                    this.gameManager.getCenterY(target),
                    600,
                    finalDamage,
                    this,
                    randomType,
                    this.gameManager
                );
                
                projectiles.push(arrow);
                
                // Mensagem informativa
                const messages = {
                    'explosive': 'Gavião Arqueiro: Flecha Explosiva!',
                    'shock': 'Gavião Arqueiro: Flecha de Choque!',
                    'ice': 'Gavião Arqueiro: Flecha de Gelo!',
                    'poison': 'Gavião Arqueiro: Flecha Venenosa!'
                };
                
                if (messages[randomType]) {
                    this.gameManager.showUI(messages[randomType], 'info');
                }
            }
            
            // Efeito visual do disparo
            effects.push(new this.gameManager.LaserEffect(
                this.getCenterX(),
                this.getCenterY(),
                this.gameManager.getCenterX(target),
                this.gameManager.getCenterY(target),
                20,
                'brown',
                1
            ));
            
            this.lastAttackTime = this.cooldownBase;
        }
    }
}
    
// Em champions.js - Hawkeye.activateAbility(), SUBSTITUA COMPLETAMENTE:

activateAbility(abilityNumber) {
    if (abilityNumber === 3 && this.abilities.explosiveArrow.cooldown <= 0) {
        const targetEnemy = this.findNearestEnemy(this.gameManager.enemies);
        if (targetEnemy) {
            const explosiveArrowDamage = (Champion.championData.hawkeye.explosiveArrowDamage + (this.level * 8)) * (1 + this.damageBoostBuff);
            const explosiveArrow = new Projectile(
                this.getCenterX(), 
                this.getCenterY(), 
                this.gameManager.getCenterX(targetEnemy), 
                this.gameManager.getCenterY(targetEnemy), 
                450, 
                0, 
                this, 
                'explosiveArrow', 
                10, 
                this.gameManager
            );
            explosiveArrow.explosionRadius = Champion.championData.hawkeye.explosiveArrowRadius;
            explosiveArrow.explosionDamage = explosiveArrowDamage;
            this.gameManager.projectiles.push(explosiveArrow);
            this.abilities.explosiveArrow.cooldown = Champion.championData.hawkeye.explosiveArrowCooldown;
            this.gameManager.showUI('Gavião Arqueiro: Fogo no buraco!', 'special');
        } else {
            this.gameManager.showUI('Gavião Arqueiro: Nenhum alvo para flecha explosiva!', 'warning');
        }
    }
    // ⭐ NOVO: Habilidade 1 - Tempestade de Flechas COM CLIQUE
    else if (abilityNumber === 1 && this.abilities.arrowStorm.cooldown <= 0) {
        const data = Champion.championData.hawkeye;
        
        // ⭐ ATIVA MODO DE SELEÇÃO
        this.gameManager.isSelectingArrowStormLocation = true;
        this.gameManager.arrowStormOwner = this;
        
        this.gameManager.showUI('Gavião Arqueiro: Clique onde deseja lançar a Tempestade de Flechas!', 'info');
        
        // Coloca habilidade em cooldown (será ativada após o clique)
        this.abilities.arrowStorm.cooldown = data.arrowStormCooldown;
    }

// ⭐ NOVO: Habilidade 2 - Kate Bishop
 else if (abilityNumber === 2 && this.abilities.kateBishop.cooldown <= 0) {
    if (this.kateBishopActive) {
        this.gameManager.showUI('Gavião Arqueiro: Kate já está em campo!', 'warning');
        return;
    }
    
    const data = Champion.championData.hawkeye;
    
    const spawnX = this.x - 60;
    const spawnY = this.y;
    
    const kate = {
        id: `kate-${Date.now()}`,
        x: spawnX,
        y: spawnY,
        width: 50,
        height: 50,
        range: data.kateBishopRange,
        damage: data.kateBishopDamage,
        attackSpeed: data.kateBishopAttackSpeed,
        lastAttackTime: 0,
        spawnTime: Date.now(),
        duration: data.kateBishopDuration,
        owner: this,
        type: 'kateBishop',
        image: new Image(),
        arrowsFired: 0,
        currentArrowType: null,
        lastPhraseTime: 0,
        phraseCooldown: 8000,
        
        getCenterX() { return this.x + this.width / 2; },
        getCenterY() { return this.y + this.height / 2; }
    };
    
    kate.image.src = 'https://static.marvelsnap.pro/art/KateBishop_03.webp';
    kate.image.onerror = () => { kate.image.isFallback = true; };
    
    this.kateBishopActive = kate;
    this.gameManager.katebishops = this.gameManager.katebishops || [];
    this.gameManager.katebishops.push(kate);
    
    this.gameManager.effects.push(new this.gameManager.BamfEffect(
        kate.getCenterX(),
        kate.getCenterY(),
        'purple',
        500
    ));
    
    // 💬 FRASES DE ENTRADA COM BALÕES
    this.gameManager.createSpeechBubble(
        this.getCenterX(), 
        this.getCenterY() - 40, 
        "Hora de mostrar, Kate! 🏹", 
        3000
    );
    
    setTimeout(() => {
        if (kate.hp > 0) {
            this.gameManager.createSpeechBubble(
                kate.getCenterX(), 
                kate.getCenterY() - 40, 
                "Você que tente acompanhar! 😎", 
                3000
            );
        }
    }, 1500);
    
    this.abilities.kateBishop.cooldown = data.kateBishopCooldown;
    this.gameManager.showUI('Gavião: Kate Bishop entrou em campo!', 'ultimate');
}
}
}

export class USAgent extends Champion {
constructor(type, x, y, id, gameManagerInstance) {
    super(type, x, y, id, gameManagerInstance);
    this.abilities.shockwave = { cooldown: 0, cooldownBase: Champion.championData.usagent.shockwaveCooldown };
    this.abilities.combatCall = { cooldown: 0, cooldownBase: Champion.championData.usagent.combatCallCooldown };
    this.abilities.charge = { cooldown: 0, cooldownBase: Champion.championData.usagent.chargeCooldown };
    
    // NOVO: Sistema de alternância de habilidades
    this.abilities.smokeGrenade = { cooldown: 0, cooldownBase: Champion.championData.usagent.smokeGrenadeCooldown };
    this.abilities.chargedShield = { cooldown: 0, cooldownBase: Champion.championData.usagent.chargedShieldCooldown };
    this.ability2Mode = 'grenade'; // Alterna entre 'grenade' e 'shield'
    
    // Investida Tática
    this.isCharging = false;
    this.chargeTarget = null;
    this.chargeStartX = 0;
    this.chargeStartY = 0;
    this.chargeStartTime = 0;
    this.chargeDuration = 0;

    // NOVO: Visual da Onda de Choque
    this.isShockwaveActive = false;
    this.shockwaveVisualEndTime = 0;
}
update(deltaTime, enemies, champions, projectiles, effects) {
    super.update(deltaTime, enemies, champions, projectiles, effects);
    
    const data = Champion.championData.usagent;

     // NOVO: Controla visual do escudo da Onda de Choque
    if (this.isShockwaveActive && Date.now() > this.shockwaveVisualEndTime) {
        this.isShockwaveActive = false;
    }
    
    // ... código existente da Investida Tática ...
     
    if (this.isCharging) {
        const chargeElapsed = Date.now() - this.chargeStartTime;
        
        if (!this.chargeTarget || this.chargeTarget.hp <= 0) {
            let newTarget = null;
            let furthestX = -1;
            
            enemies.forEach(e => {
                if (e.x > furthestX && e.hp > 0) {
                    furthestX = e.x;
                    newTarget = e;
                }
            });
            
            if (newTarget) {
                this.chargeTarget = newTarget;
            } else {
                this.isCharging = false;
                this.gameManager.showUI('US Agent: Investida cancelada - sem alvos!', 'info');
                return;
            }
        }
        
        
        const progress = Math.min(chargeElapsed / this.chargeDuration, 1);
        
        if (progress < 1) {
            const targetX = this.gameManager.getCenterX(this.chargeTarget) - this.width / 2;
            const targetY = this.gameManager.getCenterY(this.chargeTarget) - this.height / 2;
            
            this.x = this.chargeStartX + (targetX - this.chargeStartX) * progress;
            this.y = this.chargeStartY + (targetY - this.chargeStartY) * progress;
            
            if (Date.now() % 100 < 50) {
                this.gameManager.effects.push(new this.gameManager.BamfEffect(
                    this.getCenterX(),
                    this.getCenterY(),
                    'blue',
                    200
                ));
            }
            
            enemies.forEach(enemy => {
                const dist = Math.hypot(
                    this.getCenterX() - enemy.getCenterX(),
                    this.getCenterY() - enemy.getCenterY()
                );
                
                if (dist < data.chargeRadius) {
                    let chargeDamage = data.chargeDamage;
                    
                    // BÔNUS: Se inimigo estiver na zona de fumaça
                    if (enemy.takeBonusDamageFromCharge) {
                        chargeDamage *= 1.5;
                        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                            enemy.getCenterX(),
                            enemy.getCenterY() - 30,
                            'BÔNUS!',
                            'orange',
                            800
                        ));
                        enemy.takeBonusDamageFromCharge = false;
                    }
                    
                    enemy.takeDamage(chargeDamage, this);
                    
                    const angle = Math.atan2(
                        enemy.getCenterY() - this.getCenterY(),
                        enemy.getCenterX() - this.getCenterX()
                    );
                    enemy.x += Math.cos(angle) * data.chargeKnockback;
                    enemy.y += Math.sin(angle) * data.chargeKnockback;
                    
                    if (Math.random() < data.chargeStunChance) {
                        enemy.applyStun(data.chargeStunDuration);
                        this.gameManager.effects.push(new this.gameManager.StunEffect(
                            enemy.getCenterX(),
                            enemy.getCenterY(),
                            data.chargeStunDuration
                        ));
                    }
                    
                    this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                        enemy.getCenterX(),
                        enemy.getCenterY(),
                        40,
                        200
                    ));
                    
                    this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                        enemy.getCenterX(),
                        enemy.getCenterY() - 20,
                        `IMPACTO! ${chargeDamage}`,
                        'white',
                        600
                    ));
                }
            });
            
        } else {
            this.isCharging = false;
            
            if (this.chargeTarget && this.chargeTarget.hp > 0) {
                let finalDamage = data.chargeDamage * 1.5;
                
                if (this.chargeTarget.takeBonusDamageFromCharge) {
                    finalDamage *= 1.5;
                    this.chargeTarget.takeBonusDamageFromCharge = false;
                }
                
                this.chargeTarget.takeDamage(finalDamage, this);
                this.chargeTarget.applyStun(data.chargeStunDuration);
                
                this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                    this.getCenterX(),
                    this.getCenterY(),
                    data.chargeRadius,
                    400
                ));
                
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    this.getCenterX(),
                    this.getCenterY() - 30,
                    'IMPACTO FINAL!',
                    'gold',
                    1000
                ));
            }
            
            this.gameManager.showUI('US Agent: Investida completa!', 'success');
        }
    }
}
    attack(enemies, projectiles, effects) {
        if (this.lastAttackTime <= 0) {
            const target = this.findNearestEnemy(enemies);
            if (target) {
                const finalDamage = this.dano * (1 + this.damageBoostBuff);
                const bullet = new this.gameManager.USAgentBullet(this.getCenterX(), this.getCenterY(), this.gameManager.getCenterX(target), this.gameManager.getCenterY(target), 700, finalDamage, this, this.gameManager);
                bullet.stunChance = Champion.championData.usagent.stunChance;
                bullet.stunDuration = Champion.championData.usagent.stunDuration;
                projectiles.push(bullet);
                effects.push(new this.gameManager.LaserEffect(this.getCenterX(), this.getCenterY(), this.gameManager.getCenterX(target), this.gameManager.getCenterY(target), 10, 'silver', 1));
                this.lastAttackTime = this.cooldownBase;
            }
        }
    }

activateAbility(abilityNumber) {
    const data = Champion.championData.usagent;
    
    // ===== HABILIDADE 1: Investida Tática =====
    if (abilityNumber === 1 && this.abilities.charge.cooldown <= 0 && !this.isCharging) {
        let targetEnemy = null;
        let furthestX = -1;
        
        this.gameManager.enemies.forEach(e => {
            if (e.x > furthestX) {
                furthestX = e.x;
                targetEnemy = e;
            }
        });

        if (targetEnemy) {
            this.isCharging = true;
            this.chargeTarget = targetEnemy;
            this.chargeStartX = this.x;
            this.chargeStartY = this.y;
            this.chargeStartTime = Date.now();
            
            const targetX = this.gameManager.getCenterX(targetEnemy);
            const targetY = this.gameManager.getCenterY(targetEnemy);
            const distance = Math.hypot(targetX - this.getCenterX(), targetY - this.getCenterY());
            
            this.chargeDuration = (distance / data.chargeSpeed) * 1000;
            this.abilities.charge.cooldown = data.chargeCooldown;
            
            this.gameManager.showUI('US Agent: Investida Tática ativada!', 'special');
        } else {
            this.gameManager.showUI('US Agent: Nenhum inimigo para investir!', 'warning');
        }
    }
    
    // ===== HABILIDADE 2: ALTERNÂNCIA =====
    else if (abilityNumber === 2) {
        if (this.ability2Mode === 'grenade' && this.abilities.smokeGrenade.cooldown <= 0) {
            // GRANADA DE CONTROLE
            this.throwSmokeGrenade();
            this.ability2Mode = 'shield'; // Próxima será o escudo
        } else if (this.ability2Mode === 'shield' && this.abilities.chargedShield.cooldown <= 0) {
            // CARGA EXPLOSIVA (Escudo Carregado)
            this.throwChargedShield();
            this.ability2Mode = 'grenade'; // Próxima será a granada
        } else {
            const nextAbility = this.ability2Mode === 'grenade' ? 'Granada de Controle' : 'Carga Explosiva';
            this.gameManager.showUI(`US Agent: ${nextAbility} em recarga!`, 'warning');
        }
    }
    
    // ===== HABILIDADE 3: Onda de Choque =====
    else if (abilityNumber === 3 && this.abilities.shockwave.cooldown <= 0) {
        const shockwaveDamage = (data.shockwaveDamage + (this.level * 6)) * (1 + this.damageBoostBuff);

        // NOVO: Ativa visual do escudo
        this.isShockwaveActive = true;
        this.shockwaveVisualEndTime = Date.now() + 1000; // 1 segundo de visual
            
        this.gameManager.enemies.forEach(enemy => {
            const dist = Math.hypot(this.getCenterX() - enemy.getCenterX(), this.getCenterY() - enemy.getCenterY());
            if (dist < data.shockwaveRadius) {
                enemy.takeDamage(shockwaveDamage, this);
                enemy.applyStun(data.shockwaveStunDuration);
                
                const angle = Math.atan2(enemy.getCenterY() - this.getCenterY(), enemy.getCenterX() - this.getCenterX());
                enemy.x += Math.cos(angle) * data.shockwavePushForce;
                enemy.y += Math.sin(angle) * data.shockwavePushForce;
                
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    enemy.getCenterX(), 
                    enemy.getCenterY(), 
                    `${shockwaveDamage.toFixed(0)}!`, 
                    'grey', 
                    500
                ));
            }
        });
        
        this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
            this.getCenterX(), 
            this.getCenterY(), 
            data.shockwaveRadius, 
            data.shockwaveStunDuration
        ));
        
        this.abilities.shockwave.cooldown = data.shockwaveCooldown;
        this.gameManager.showUI('US Agent: Pela Bandeira!', 'special');
    }
}

// NOVO: Granada de Controle
throwSmokeGrenade() {
    const data = Champion.championData.usagent;
    
    // Encontra posição central dos inimigos
    let targetX = this.x;
    let targetY = this.y;
    
    if (this.gameManager.enemies.length > 0) {
        const nearestEnemy = this.findNearestEnemy(this.gameManager.enemies);
        if (nearestEnemy) {
            targetX = this.gameManager.getCenterX(nearestEnemy);
            targetY = this.gameManager.getCenterY(nearestEnemy);
        }
    }
    
    // Cria a zona de fumaça
    const smokeZone = {
        x: targetX,
        y: targetY,
        radius: data.smokeGrenadeRadius,
        duration: data.smokeGrenadeDuration,
        spawnTime: Date.now(),
        owner: this,
        type: 'smokeGrenade'
    };
    
    this.gameManager.smokeZones = this.gameManager.smokeZones || [];
    this.gameManager.smokeZones.push(smokeZone);
    
    // Aplica efeitos nos inimigos imediatamente
    this.gameManager.enemies.forEach(enemy => {
        const dist = Math.hypot(targetX - enemy.getCenterX(), targetY - enemy.getCenterY());
        if (dist < data.smokeGrenadeRadius) {
            enemy.inSmokeZone = true;
            enemy.smokeDebuffEnd = Date.now() + data.smokeGrenadeDuration;
            enemy.smokeSlowFactor = data.smokeGrenadeSlowFactor;
            enemy.takeBonusDamageFromCharge = true; // Marca para bônus da Investida
            
            // Reduz precisão (aumenta chance de errar)
            enemy.accuracyReduction = 0.3; // 30% menos preciso
        }
    });
    
    this.abilities.smokeGrenade.cooldown = data.smokeGrenadeCooldown;
    this.gameManager.showUI('US Agent: Granada de Controle lançada!', 'special');
}

// NOVO: Escudo Carregado
throwChargedShield() {
    const data = Champion.championData.usagent;
    
    const target = this.findNearestEnemy(this.gameManager.enemies);
    if (!target) {
        this.gameManager.showUI('US Agent: Nenhum alvo para o escudo!', 'warning');
        return;
    }
    
    // CORREÇÃO: Cria uma INSTÂNCIA DA CLASSE USAgentChargedShield
    const shield = new this.gameManager.USAgentChargedShield(
        this.getCenterX(),
        this.getCenterY(),
        this.gameManager.getCenterX(target),
        this.gameManager.getCenterY(target),
        500, // speed
        data.chargedShieldDamage * (1 + this.damageBoostBuff), // damage
        this, // owner
        data.chargedShieldBounces, // bounces
        this.gameManager // gameManagerInstance
    );
    
    this.gameManager.projectiles.push(shield);
    
    this.abilities.chargedShield.cooldown = data.chargedShieldCooldown;
    this.gameManager.showUI('US Agent: Carga Explosiva ativada!', 'special');
}
}

export class CaptainAmerica extends Champion {
constructor(type, x, y, id, gameManagerInstance) {
    super(type, x, y, id, gameManagerInstance);
    this.abilities.defensiveStance = { 
        cooldown: 0, 
        cooldownBase: Champion.championData.captainamerica.defensiveStanceCooldown 
    };
    
    // ⭐ NOVO: Habilidade 2 - A Esquerda
    this.abilities.leftWing = {
        cooldown: 0,
        cooldownBase: Champion.championData.captainamerica.leftWingCooldown
    };
    
    this.abilities.leadershipCry = { 
        cooldown: 0, 
        cooldownBase: Champion.championData.captainamerica.leadershipCryCooldown 
    };
    
    this.isDefensiveStanceActive = false;
    this.defensiveStanceEndTime = 0;
    this.isShieldActive = false;

    // 💙 NOVO: Coração do Soldado
    this.heartOfSoldierActive = false;
    this.heartOfSoldierEndTime = 0;
    this.lastAllyCount = 0;
    this.lastMotivationPhrase = 0;
    this.hasShoutedThisActivation = false;
}

// SUBSTITUA o método update() do CaptainAmerica:
update(deltaTime, enemies, champions, projectiles, effects) {
    super.update(deltaTime, enemies, champions, projectiles, effects);
    
    const data = Champion.championData.captainamerica;
    
    // 💙 CORAÇÃO DO SOLDADO - Detecta quando aliado cai
    const currentAllyCount = champions.filter(c => c.hp > 0 && c.id !== this.id).length;
    
    if (currentAllyCount < this.lastAllyCount && !this.heartOfSoldierActive && currentAllyCount >= 0) {
        this.activateHeartOfSoldier();
    }
    
    this.lastAllyCount = currentAllyCount;
    
    // Gerencia duração do Coração do Soldado
    if (this.heartOfSoldierActive && Date.now() > this.heartOfSoldierEndTime) {
        this.deactivateHeartOfSoldier();
    }
    
    // Frases de motivação
    if (this.heartOfSoldierActive && Date.now() - this.lastMotivationPhrase > 3000) {
        this.shoutMotivation();
        this.lastMotivationPhrase = Date.now();
    }
    
    // Gerencia postura defensiva (código existente)
    if (this.isDefensiveStanceActive && Date.now() > this.defensiveStanceEndTime) {
        this.isDefensiveStanceActive = false;
        this.buffs = this.buffs.filter(buff => !(buff.type === 'damageReduction' && buff.value === data.damageReductionFactor));
        this.gameManager.showUI('Capitão América: Postura defensiva desativada.', 'info');
    }
}
activateHeartOfSoldier() {
    const data = Champion.championData.captainamerica;
    
    this.heartOfSoldierActive = true;
    this.heartOfSoldierEndTime = Date.now() + data.heartOfSoldierDuration;
    this.hasShoutedThisActivation = false;
    
    // Aplica buffs ao Capitão
    this.applyBuff('damageBoost', data.heartOfSoldierDamageBoost, data.heartOfSoldierDuration);
    this.applyBuff('damageReduction', data.heartOfSoldierDefenseBoost, data.heartOfSoldierDuration);
    
    // Aplica buffs aos aliados
    this.gameManager.champions.forEach(ally => {
        if (ally.id !== this.id && ally.hp > 0) {
            ally.applyBuff('damageBoost', data.heartOfSoldierAllyBonus, data.heartOfSoldierDuration);
            ally.applyBuff('hpRegen', 3, data.heartOfSoldierDuration, false);
        }
    });
    
    // Efeito visual inicial explosivo
    for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 / 30) * i;
        this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
            this.getCenterX() + Math.cos(angle) * 30,
            this.getCenterY() + Math.sin(angle) * 30,
            25,
            'gold',
            1000
        ));
    }
    
    this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
        this.getCenterX(),
        this.getCenterY(),
        100,
        500
    ));
    
    this.gameManager.showUI('Capitão América: "EU AGUENTO O DIA TODO!" 🛡️', 'ultimate');
}

deactivateHeartOfSoldier() {
    this.heartOfSoldierActive = false;
    this.gameManager.showUI('Capitão: Voltando ao normal.', 'info');
}

shoutMotivation() {
    if (this.hasShoutedThisActivation) return;
    
    const phrases = [
        "VINGADORES, NÃO DESISTAM!",
        "JUNTOS SOMOS MAIS FORTES!",
        "POR AQUELES QUE PERDEMOS!",
        "NÃO VAMOS CAIR HOJE!"
    ];
    
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    // Balão de fala
    this.gameManager.createSpeechBubble(
        this.getCenterX(),
        this.getCenterY() - 60,
        randomPhrase,
        4000
    );
    
    this.hasShoutedThisActivation = true;
}

// MODIFIQUE o método draw() do CaptainAmerica:
draw(ctx, isSelected, mjolnirImage, capShieldImage, usagentShieldImage, wandaIllusionImage, displayRangeOverride = null) {
    // Chama draw padrão
    super.draw(ctx, isSelected, mjolnirImage, capShieldImage, usagentShieldImage, wandaIllusionImage, displayRangeOverride);
    
      // 💙 VISUAL DO CORAÇÃO DO SOLDADO
    if (this.heartOfSoldierActive) {
        const time = Date.now() / 1000;
        const centerX = this.getCenterX();
        const centerY = this.getCenterY();
        
        ctx.save();
        
        // ===============================
        // AURA DOURADA PRINCIPAL
        // ===============================
        const pulseSize = 70 + Math.sin(time * 4) * 15;
        const alpha = 0.5 + Math.sin(time * 3) * 0.2;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
        gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha * 0.8})`);
        gradient.addColorStop(0.5, `rgba(255, 215, 0, ${alpha * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 165, 0, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // ===============================
        // ESTRELA BRILHANTE CENTRAL
        // ===============================
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(time * 1.5);
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowColor = 'rgba(255, 215, 0, 1)';
        ctx.shadowBlur = 25;
        
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const outerRadius = 35;
            const innerRadius = 14;
            
            const outerX = Math.cos(angle) * outerRadius;
            const outerY = Math.sin(angle) * outerRadius;
            
            if (i === 0) {
                ctx.moveTo(outerX, outerY);
            } else {
                ctx.lineTo(outerX, outerY);
            }
            
            const innerAngle = angle + Math.PI / 5;
            const innerX = Math.cos(innerAngle) * innerRadius;
            const innerY = Math.sin(innerAngle) * innerRadius;
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
        ctx.shadowBlur = 0;
        
        // ===============================
        // RAIOS DOURADOS ROTATIVOS
        // ===============================
        for (let i = 0; i < 12; i++) {
            const rayAngle = (Math.PI * 2 / 12) * i + time * 2;
            const rayLength = 45 + Math.sin(time * 5 + i) * 15;
            const rayAlpha = alpha * (0.7 + Math.sin(time * 6 + i) * 0.3);
            
            const gradient = ctx.createLinearGradient(
                centerX, centerY,
                centerX + Math.cos(rayAngle) * rayLength,
                centerY + Math.sin(rayAngle) * rayLength
            );
            gradient.addColorStop(0, `rgba(255, 215, 0, ${rayAlpha})`);
            gradient.addColorStop(1, `rgba(255, 215, 0, 0)`);
            
            ctx.strokeStyle = gradient;
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
        // PARTÍCULAS ORBITAIS
        // ===============================
        for (let i = 0; i < 8; i++) {
            const particleAngle = time * 3 + (Math.PI * 2 / 8) * i;
            const particleDist = 50 + Math.sin(time * 4 + i) * 12;
            const px = centerX + Math.cos(particleAngle) * particleDist;
            const py = centerY + Math.sin(particleAngle) * particleDist;
            const particleSize = 4 + Math.sin(time * 5 + i) * 2;
            
            const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, particleSize);
            particleGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            particleGradient.addColorStop(1, `rgba(255, 215, 0, 0)`);
            
            ctx.fillStyle = particleGradient;
            ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(px, py, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
        
        // ===============================
        // ANÉIS EXPANSIVOS
        // ===============================
        for (let r = 1; r <= 3; r++) {
            const ringProgress = (time * 2 + r * 0.5) % 2;
            const ringRadius = 30 + ringProgress * 40;
            const ringAlpha = alpha * (1 - ringProgress / 2);
            
            ctx.strokeStyle = `rgba(255, 215, 0, ${ringAlpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // Visual da postura defensiva (código existente)
    if (this.isDefensiveStanceActive && capShieldImage && capShieldImage.complete) {
        ctx.save();
        ctx.translate(this.getCenterX(), this.getCenterY());
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 150) * 0.1;
        const visualRadius = Champion.championData.captainamerica.ricochetChainRadius;
        ctx.beginPath();
        ctx.arc(0, 0, visualRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
            capShieldImage, 
            -visualRadius, 
            -visualRadius, 
            visualRadius * 2, 
            visualRadius * 2
        );
        ctx.restore();
    }
}
    update(deltaTime, enemies, champions, projectiles, effects) {
        super.update(deltaTime, enemies, champions, projectiles, effects);
        // Gerencia a duração da postura defensiva
        if (this.isDefensiveStanceActive && Date.now() > this.defensiveStanceEndTime) {
            this.isDefensiveStanceActive = false;
            // Remover o buff de redução de dano quando a postura terminar
            this.buffs = this.buffs.filter(buff => !(buff.type === 'damageReduction' && buff.value === Champion.championData.captainamerica.damageReductionFactor));
            this.gameManager.showUI('Capitão América: Postura defensiva desativada.', 'info');
        }
    }

    /**
     * Sobrescreve takeDamage para aplicar a redução de dano da postura defensiva e a reflexão.
     * @param {number} amount - A quantidade base de dano.
     * @param {object} [source=null] - A fonte do dano.
     */
 takeDamage(amount, source = null) {
    let finalDamage = amount;

    // Aplica a redução de dano da Postura Defensiva se ativa
    if (this.isDefensiveStanceActive) {
        finalDamage *= (1 - Champion.championData.captainamerica.damageReductionFactor);

        // Lógica de reflexão: Se a postura defensiva está ativa e a chance for bem-sucedida
        if (Math.random() < Champion.championData.captainamerica.reflectDamageChance) {
            const reflectedDamage = finalDamage * Champion.championData.captainamerica.reflectDamageMultiplier;
            
            // ⭐ CORREÇÃO: Busca inimigo mais próximo corretamente
            let targetEnemy = null;
            let minDistance = Infinity;
            
            if (this.gameManager && this.gameManager.enemies) {
                for (const enemy of this.gameManager.enemies) {
                    const dist = Math.hypot(
                        this.getCenterX() - enemy.getCenterX(),
                        this.getCenterY() - enemy.getCenterY()
                    );
                    if (dist < minDistance) {
                        minDistance = dist;
                        targetEnemy = enemy;
                    }
                }
            }
            
            if (targetEnemy) {
                targetEnemy.takeDamage(reflectedDamage, this);
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    targetEnemy.getCenterX(), 
                    targetEnemy.getCenterY() - 30, 
                    `Refletido! ${reflectedDamage.toFixed(0)}`, 
                    'blue', 
                    800
                ));
            }
        }
    }

    // Aplica outros buffs de redução de dano genéricos que possam existir
    this.buffs.forEach(buff => {
        if (buff.type === 'damageReduction' && Date.now() < buff.endTime) {
            if (this.isDefensiveStanceActive && buff.value === Champion.championData.captainamerica.damageReductionFactor) {
                // Já lidado acima
            } else {
                finalDamage *= (1 - buff.value);
            }
        }
    });

    this.hp -= finalDamage;
    
    if (this.gameManager && this.gameManager.effects) {
        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
            this.getCenterX(), 
            this.getCenterY() - 10, 
            `${finalDamage.toFixed(0)}`, 
            'red', 
            500
        ));
    }
}

// CaptainAmerica - Em champions.js
// Adicione estes console.logs no champions.js - CaptainAmerica.attack():

// No CaptainAmerica.attack(), adicione logs:

attack(enemies, projectiles, effects) {
    console.log('🔍 Capitão - Cooldown:', this.lastAttackTime.toFixed(1), 'Flag:', this.isShieldActive);
    
    // ⭐ SÓ ATACA SE: cooldown zerado E escudo não está fora
    if (this.lastAttackTime <= 0 && !this.isShieldActive) {
        const target = this.findNearestEnemy(enemies);
        if (target) {
            console.log('✅ Capitão VAI lançar o escudo!');
            
            const finalDamage = this.dano * (1 + this.damageBoostBuff);
            const shield = new this.gameManager.CapShieldProjectile(
                this.getCenterX(), 
                this.getCenterY(),
                this.gameManager.getCenterX(target), 
                this.gameManager.getCenterY(target),
                900, 
                finalDamage, 
                this, 
                Champion.championData.captainamerica.shieldBounces, 
                this.gameManager
            );
            
            projectiles.push(shield);
            this.isShieldActive = true;
            this.lastAttackTime = this.cooldownBase;
            
            console.log('🛡️ Escudo lançado! Flag agora é:', this.isShieldActive);
        }
    } else {
        if (this.lastAttackTime > 0) {
            console.log('⏳ Aguardando cooldown...');
        }
        if (this.isShieldActive) {
            console.log('🚫 Escudo ainda está fora!');
        }
    }
}
    /**
     * Sobrescreve o método draw para adicionar os visuais específicos do Capitão América.
     * @param {CanvasRenderingContext2D} ctx - O contexto de renderização do canvas.
     * @param {boolean} isSelected - Se o campeão está selecionado.
     * @param {HTMLImageElement} mjolnirImage - Imagem do Mjolnir.
     * @param {HTMLImageElement} capShieldImage - Imagem do escudo do Capitão América.
     * @param {HTMLImageElement} usagentShieldImage - Imagem do escudo do USAgent.
     * @param {HTMLImageElement} wandaIllusionImage - Imagem da ilusão da Wanda.
     */
    draw(ctx, isSelected, mjolnirImage, capShieldImage, usagentShieldImage, wandaIllusionImage) {
        // Chama o método draw da classe pai, passando ricochetChainRadius como override para o display de alcance
        super.draw(ctx, isSelected, mjolnirImage, capShieldImage, usagentShieldImage, wandaIllusionImage,
                   isSelected ? Champion.championData.captainamerica.ricochetChainRadius : null);

        // Visual da Postura Defensiva do Capitão América (escudo pulsante)
        if (this.isDefensiveStanceActive && capShieldImage && capShieldImage.complete) {
            ctx.save();
            ctx.translate(this.getCenterX(), this.getCenterY()); // Move a origem para o centro do campeão
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 150) * 0.1; // Opacidade pulsante
            const visualRadius = Champion.championData.captainamerica.ricochetChainRadius; // Usa o raio da habilidade para o visual

            ctx.beginPath();
            ctx.arc(0, 0, visualRadius, 0, Math.PI * 2); // Desenha um círculo para a máscara de corte
            ctx.clip(); // Aplica a máscara de corte

            // Desenha a imagem do escudo, centralizada no campeão
            ctx.drawImage(capShieldImage, -visualRadius, -visualRadius, visualRadius * 2, visualRadius * 2);
            
            ctx.restore(); // Restaura o contexto para remover o clip e o globalAlpha
        }
    }

    // Dentro da classe export class Champion { ... } em champions.js

    /**
     * @method
     * Desenha o alcance de ataque do campeão no canvas quando ele está selecionado.
     * Este é o método que estava faltando na classe base.
     */
    drawRange(ctx) {
        // Desenha apenas se este campeão estiver realmente selecionado
        if (this.gameManagerInstance.selectedChampion !== this) return;
        
        // Se o campeão tem um alcance de ataque, desenha um círculo transparente
        if (this.attackRange > 0) {
            ctx.save();
            ctx.beginPath();
            // Desenha um círculo semi-transparente para o alcance
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.attackRange, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; // Círculo de alcance branco transparente
            ctx.fill();

            // Desenha o contorno do alcance
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; // Borda do círculo de alcance
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }
    }
    activateAbility(abilityNumber) {
        if (abilityNumber === 1 && this.abilities.defensiveStance.cooldown <= 0) {
            this.isDefensiveStanceActive = true;
            this.defensiveStanceEndTime = Date.now() + Champion.championData.captainamerica.defensiveStanceDuration;
            
            // Aplica o buff de redução de dano
            this.applyBuff('damageReduction', Champion.championData.captainamerica.damageReductionFactor, Champion.captainamerica.defensiveStanceDuration);

            this.hp = Math.min(this.maxHp, this.hp + Champion.championData.captainamerica.defensiveStanceShieldAmount);
            this.gameManager.effects.push(new this.gameManager.DefensiveStanceEffect(this.getCenterX(), this.getCenterY(), Champion.championData.captainamerica.defensiveStanceDuration, this.width * 1.2));
            this.abilities.defensiveStance.cooldown = Champion.championData.captainamerica.defensiveStanceCooldown;
            this.gameManager.showUI('Capitão América: Eu aguento o dia todo!', 'special');
        } 

        // ⭐ Habilidade 2: A Esquerda (Sam/Bucky)
    else if (abilityNumber === 2 && this.abilities.leftWing.cooldown <= 0) {
        const data = Champion.championData.captainamerica;
        
        // Busca os 2 inimigos mais fortes (não-boss)
        const eligibleEnemies = this.gameManager.enemies
            .filter(e => !e.isBoss && e.hp > 0)
            .sort((a, b) => b.hp - a.hp)
            .slice(0, data.leftWingGrabCount);
        
        if (eligibleEnemies.length === 0) {
            this.gameManager.showUI('Capitão América: Nenhum inimigo elegível!', 'warning');
            return;
        }
        
        // Escolhe aleatoriamente entre Sam ou Bucky
        const helper = Math.random() < 0.5 ? 'sam' : 'bucky';
        
        const leftWingUnit = {
            id: `leftwing-${Date.now()}`,
            type: helper,
            x: -100, // Começa fora da tela (esquerda)
            y: this.gameManager.canvas.height / 2,
            width: 70, // ⭐ Maior
            height: 70,
            spawnTime: Date.now(),
            duration: data.leftWingDuration,
            
            // Inimigos capturados
            capturedEnemies: eligibleEnemies.map((e, index) => ({
                enemy: e,
                // ⭐ Inimigos ficam em posições fixas ao lado
                offsetX: (index === 0 ? 50 : -50),
                offsetY: 0
            })),
            
            // ⭐ NOVO: Sistema de órbita circular suave
            orbitAngle: Math.PI, // Começa pela esquerda
            orbitSpeed: data.leftWingSpeed, // Velocidade angular
            centerX: this.gameManager.canvas.width / 2,
            centerY: this.gameManager.canvas.height / 2,
            orbitRadius: data.leftWingOrbitRadius,
            
            // Direção visual (para flip horizontal)
            facingRight: true,
            
            // Imagem
            image: new Image(),
            
            getCenterX() { return this.x + this.width / 2; },
            getCenterY() { return this.y + this.height / 2; }
        };
        
        // Define imagem
        if (helper === 'sam') {
            leftWingUnit.image.src = 'https://static.marvelsnap.pro/art/SamWilson_08.webp';
            leftWingUnit.displayName = 'Sam Wilson';
        } else {
            leftWingUnit.image.src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYMg_C7lKLh78gWm60BMR37Fs3M3lO3Ez3aw&s';
            leftWingUnit.displayName = 'Bucky Barnes';
        }
        
        leftWingUnit.image.onerror = () => { leftWingUnit.image.isFallback = true; };
        
        // ⭐ Marca inimigos como capturados E ATORDOADOS
        eligibleEnemies.forEach(e => {
            e.isCapturedByLeftWing = true;
            e.captureStartTime = Date.now();
            e.originalVel = e.vel;
            e.vel = 0; // Para o inimigo
            
            // ⭐ ATORDOAMENTO COMPLETO
            e.isStunned = true;
            e.stunEndTime = Date.now() + data.leftWingStunDuration;
            e.canShoot = false; // ⭐ Impede de atirar
            e.attackCooldown = Infinity; // ⭐ Bloqueia ataque
        });
        
        this.gameManager.leftWingUnits = this.gameManager.leftWingUnits || [];
        this.gameManager.leftWingUnits.push(leftWingUnit);
        
        // Efeito de spawn
        this.gameManager.effects.push(new this.gameManager.BamfEffect(
            leftWingUnit.getCenterX(),
            leftWingUnit.getCenterY(),
            'blue',
            500
        ));
        
        this.abilities.leftWing.cooldown = data.leftWingCooldown;
        this.gameManager.showUI(`Capitão América: ${leftWingUnit.displayName} entrou em ação!`, 'ultimate');
    }
        else if (abilityNumber === 3 && this.abilities.leadershipCry.cooldown <= 0) {
                this.gameManager.champions.forEach(ally => {
                    const dist = Math.hypot(this.getCenterX() - ally.getCenterX(), this.getCenterY() - ally.getCenterY());
                    if (dist < Champion.championData.captainamerica.leadershipCryRadius) {
                        ally.applyBuff('damageBoost', Champion.championData.captainamerica.leadershipCryDamageBoost, Champion.captainamerica.leadershipCryDuration);
                        ally.applyBuff('hpRegen', Champion.captainamerica.leadershipCryHpRegen, Champion.captainamerica.leadershipCryDuration, false); // HP Regen é um valor fixo por segundo
                        this.gameManager.effects.push(new this.gameManager.USAgentCombatCallEffect(ally.getCenterX(), ally.getCenterY(), Champion.captainamerica.leadershipCryDuration, 'blue'));
                    }
                });
                this.abilities.leadershipCry.cooldown = Champion.championData.captainamerica.leadershipCryCooldown;
                this.gameManager.showUI('Capitão América: Vingadores, avante!', 'ultimate');
            }
        }
}

export class Wanda extends Champion {
    constructor(type, x, y, id, gameManagerInstance) {
        super(type, x, y, id, gameManagerInstance);
        this.abilities.chaosZone = { cooldown: 0, cooldownBase: Champion.championData.wanda.chaosZoneCooldown };
        this.abilities.blockingRunes = { cooldown: 0, cooldownBase: Champion.championData.wanda.blockingRunesCooldown };
        this.abilities.resurrection = { cooldown: 0, cooldownBase: Champion.championData.wanda.resurrectionCooldown };
        this.isRuneActive = false;
        this.runeEndTime = 0;
        this.revivedTimer = 0;
    }

    update(deltaTime, enemies, champions, projectiles, effects) {
        super.update(deltaTime, enemies, champions, projectiles, effects);
        if (this.isRuneActive && Date.now() > this.runeEndTime) {
            this.isRuneActive = false;
            this.gameManager.showUI('Wanda: Runas desativadas.', 'info');
        }
    }

    attack(enemies, projectiles, effects) {
        if (this.lastAttackTime <= 0) {
            const target = this.findNearestEnemy(enemies);
            if (target) {
                const finalDamage = this.dano * (1 + this.damageBoostBuff);
                const pulse = new this.gameManager.WandaIllusionPulse(this.getCenterX(), this.getCenterY(), this.gameManager.getCenterX(target), this.gameManager.getCenterY(target), 300, finalDamage, this, this.gameManager);
                pulse.confuseDuration = Champion.championData.wanda.chaosZoneConfuseDuration;
                projectiles.push(pulse);
                effects.push(new this.gameManager.LaserEffect(this.getCenterX(), this.getCenterY(), this.gameManager.getCenterX(target), this.gameManager.getCenterY(target), 20, 'fuchsia', 1.5));
                this.lastAttackTime = this.cooldownBase;
            }
        }
    }

    activateAbility(abilityNumber) {
        if (abilityNumber === 1 && this.abilities.chaosZone.cooldown <= 0) {
            this.gameManager.enemies.forEach(enemy => {
                const dist = Math.hypot(this.getCenterX() - enemy.getCenterX(), this.getCenterY() - enemy.getCenterY());
                if (dist < Champion.championData.wanda.chaosZoneRadius) {
                    enemy.applyDisorient(Champion.championData.wanda.chaosZoneConfuseDuration);
                    this.gameManager.effects.push(new this.gameManager.ConfuseEffect(enemy.getCenterX(), enemy.getCenterY(), Champion.championData.wanda.chaosZoneConfuseDuration, 'pink'));
                }
            });
            this.gameManager.effects.push(new this.gameManager.HexZoneVisualEffect(this.getCenterX(), this.getCenterY(), Champion.championData.wanda.chaosZoneRadius, Champion.championData.wanda.chaosZoneDuration));
            this.abilities.chaosZone.cooldown = Champion.championData.wanda.chaosZoneCooldown;
            this.gameManager.showUI('Wanda: Magia do Caos!', 'special');
        } else if (abilityNumber === 2 && this.abilities.blockingRunes.cooldown <= 0) {
            this.isRuneActive = true;
            this.runeEndTime = Date.now() + Champion.championData.wanda.blockingRunesDuration;
            this.gameManager.effects.push(new this.gameManager.RuneVisualEffect(this.getCenterX(), this.getCenterY(), Champion.championData.wanda.blockingRunesRadius, Champion.championData.wanda.blockingRunesDuration));
            this.abilities.blockingRunes.cooldown = Champion.championData.wanda.blockingRunesCooldown;
            this.gameManager.showUI('Wanda: Runas protetoras ativadas!', 'special');
        } else if (abilityNumber === 3 && this.abilities.resurrection.cooldown <= 0 && this.gameManager.resurrectionsUsedThisPhase < Champion.championData.wanda.resurrectionLimitPerPhase) {
            const lastDestroyedTower = this.gameManager.destroyedTowers.pop();
            if (lastDestroyedTower) {
                lastDestroyedTower.hp = lastDestroyedTower.maxHp * Champion.championData.wanda.resurrectionHpPercent;
                lastDestroyedTower.x = this.getCenterX() + (Math.random() - 0.5) * 50;
                lastDestroyedTower.y = this.getCenterY() + (Math.random() - 0.5) * 50;
                this.gameManager.champions.push(lastDestroyedTower);
                this.gameManager.effects.push(new this.gameManager.ReviveEffect(lastDestroyedTower.getCenterX(), lastDestroyedTower.getCenterY(), 1000));
                this.abilities.resurrection.cooldown = Champion.championData.wanda.resurrectionCooldown;
                this.gameManager.resurrectionsUsedThisPhase++;
                this.gameManager.showUI(`Wanda: ${lastDestroyedTower.type.charAt(0).toUpperCase() + lastDestroyedTower.type.slice(1)} ressuscitado!`, 'ultimate');
            } else {
                this.gameManager.showUI('Wanda: Nenhuma torre destruída para ressuscitar.', 'warning');
            }
        }
    }
}

export class Nightcrawler extends Champion {
constructor(type, x, y, id, gameManagerInstance) {
    super(type, x, y, id, gameManagerInstance);
    this.abilities.bamfStrike = { cooldown: 0, cooldownBase: Champion.championData.noturno.bamfStrikeCooldown };
    this.abilities.nightDance = { cooldown: 0, cooldownBase: Champion.championData.noturno.nightDanceCooldown };
    
    // NOVO: Sistema de Pontos de Ancoragem
    this.abilities.anchorPoint = { cooldown: 0, cooldownBase: Champion.championData.noturno.anchorPointCooldown };
    this.anchorPoints = []; // Array com até 2 pontos
    this.anchorTeleportCooldown = 0;
    
    // Passivas
    this.evasionChance = 0.25; // Acrobata Sagrado
    
    this.isDancing = false;
    this.danceTimer = 0;
    this.nightDanceEndTime = 0;
    this.lastDanceTickTime = 0;
}
    update(deltaTime, enemies, champions, projectiles, effects) {
        super.update(deltaTime, enemies, champions, projectiles, effects);

        if (this.isDancing) {
            if (Date.now() > this.nightDanceEndTime) {
                this.isDancing = false;
                this.gameManager.showUI('Noturno: A dança acabou.', 'info');
            } else {
                if (Date.now() - this.lastNightDanceAttackTime >= Champion.championData.noturno.nightDanceTickRate) {
                    this.gameManager.enemies.forEach(enemy => {
                        const dist = Math.hypot(this.getCenterX() - enemy.getCenterX(), this.getCenterY() - enemy.getCenterY());
                        if (dist < Champion.championData.noturno.nightDanceRadius) {
                            const finalDamage = Champion.championData.noturno.nightDanceDamagePerTick * (1 + this.damageBoostBuff);
                            enemy.takeDamage(finalDamage, this);
                            this.gameManager.effects.push(new this.gameManager.TextPopEffect(enemy.getCenterX(), enemy.getCenterY(), `${finalDamage.toFixed(0)}`, 'purple', 200));
                        }
                    });
                    this.gameManager.effects.push(new this.gameManager.BamfEffect(this.getCenterX(), this.getCenterY(), 'black', 100));
                    this.lastNightDanceAttackTime = Date.now();
                }
            }
        }
    }

    attack(enemies, projectiles, effects) {
// SUBSTITUA TODO o bloco if (this.isDancing) por este:
if (this.isDancing) {
    if (Date.now() > this.nightDanceEndTime) {
        this.isDancing = false;
        this.gameManager.showUI('Noturno: A dança acabou.', 'info');
    } else {
        const currentTime = Date.now();
        
        if (currentTime - this.lastDanceTickTime >= Champion.championData.noturno.nightDanceTickRate) {
            this.gameManager.enemies.forEach(enemy => {
                const dist = Math.hypot(this.getCenterX() - enemy.getCenterX(), this.getCenterY() - enemy.getCenterY());
                if (dist < Champion.championData.noturno.nightDanceRadius) {
                    const finalDamage = Champion.championData.noturno.nightDanceDamagePerTick * (1 + this.damageBoostBuff);
                    enemy.takeDamage(finalDamage, this);
                    this.gameManager.effects.push(new this.gameManager.TextPopEffect(enemy.getCenterX(), enemy.getCenterY(), `${finalDamage.toFixed(0)}`, 'purple', 200));
                    
                    // Knockback
                    const angle = Math.atan2(enemy.getCenterY() - this.getCenterY(), enemy.getCenterX() - this.getCenterX());
                    enemy.x += Math.cos(angle) * 15;
                    enemy.y += Math.sin(angle) * 15;
                    
                    // Efeito de corte no inimigo (alternando branco e azul claro)
                    const cutColor = Math.random() > 0.5 ? 'white' : 'lightblue';
                    this.gameManager.effects.push(new this.gameManager.SwordCutEffect(
                        this.getCenterX(),
                        this.getCenterY(),
                        enemy.getCenterX(),
                        enemy.getCenterY(),
                        cutColor,
                        8
                    ));
                    
                    // Sangramento
                    if (Math.random() < Champion.championData.noturno.bleedChance) {
                        enemy.applyBleed(
                            Champion.championData.noturno.bleedDamagePerTick,
                            Champion.championData.noturno.bleedDuration
                        );
                    }
                }
            });
            
            // BAMF em cada giro (6 ao redor)
            const bamfAngles = [0, Math.PI/3, 2*Math.PI/3, Math.PI, 4*Math.PI/3, 5*Math.PI/3];
            bamfAngles.forEach(angle => {
                const offsetX = Math.cos(angle) * 40;
                const offsetY = Math.sin(angle) * 40;
                this.gameManager.effects.push(new this.gameManager.BamfEffect(
                    this.getCenterX() + offsetX, 
                    this.getCenterY() + offsetY, 
                    'blue', 
                    150
                ));
            });
            
            // Trilha azul (partículas)
            for (let i = 0; i < 8; i++) {
                const trailAngle = Math.random() * Math.PI * 2;
                const trailDist = Math.random() * Champion.championData.noturno.nightDanceRadius;
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.getCenterX() + Math.cos(trailAngle) * trailDist,
                    this.getCenterY() + Math.sin(trailAngle) * trailDist,
                    15,
                    'cyan',
                    300
                ));
            }
            
            this.lastDanceTickTime = currentTime;
        }
    }
}

        if (this.lastAttackTime <= 0) {
            const target = this.findNearestEnemy(enemies);
            if (target) {
                const finalDamage = this.dano * (1 + Champion.championData.noturno.teleportAttackBonus) * (1 + this.damageBoostBuff);
                target.takeDamage(finalDamage, this);
                this.x = this.gameManager.getCenterX(target) + (Math.random() - 0.5) * 20 - this.width / 2;
                this.y = this.gameManager.getCenterY(target) + (Math.random() - 0.5) * 20 - this.height / 2;
                effects.push(new this.gameManager.BamfEffect(this.getCenterX(), this.getCenterY(), 'blue', 300));
                this.lastAttackTime = this.cooldownBase;
            }
        }
    }

activateAbility(abilityNumber) {
    const data = Champion.championData.noturno;
    
    // Habilidade 1: Bamf Strike
    if (abilityNumber === 1 && this.abilities.bamfStrike.cooldown <= 0) {
        const distantEnemy = this.gameManager.enemies.find(e => 
            Math.hypot(this.getCenterX() - e.getCenterX(), this.getCenterY() - e.getCenterY()) > data.bamfStrikeRange
        );
        
        if (distantEnemy) {
            const originalX = this.x;
            const originalY = this.y;

            this.x = this.gameManager.getCenterX(distantEnemy) + (Math.random() - 0.5) * 20 - this.width / 2;
            this.y = this.gameManager.getCenterY(distantEnemy) + (Math.random() - 0.5) * 20 - this.height / 2;

            const finalDamage = (data.bamfStrikeDamage + (this.level * 10)) * (1 + this.damageBoostBuff);
            distantEnemy.takeDamage(finalDamage, this);
            distantEnemy.applyStun(data.bamfStrikeStunDuration);

            // NOVO: Cria nuvem de enxofre no local de saída e chegada
            this.createSulfurCloud(originalX, originalY);
            this.createSulfurCloud(this.x, this.y);

            this.gameManager.effects.push(new this.gameManager.BamfEffect(originalX, originalY, 'blue', 300));
            this.gameManager.effects.push(new this.gameManager.BamfEffect(this.getCenterX(), this.getCenterY(), 'blue', 300));
            this.gameManager.effects.push(new this.gameManager.StunEffect(distantEnemy.getCenterX(), distantEnemy.getCenterY(), data.bamfStrikeStunDuration));

            this.abilities.bamfStrike.cooldown = data.bamfStrikeCooldown;
            this.gameManager.showUI('Noturno: BAMF! Nada pessoal, apenas negócios.', 'special');
        } else {
            this.gameManager.showUI('Noturno: Nenhum inimigo distante para teletransportar!', 'warning');
        }
    }
    
    // NOVA HABILIDADE 2: Pontos de Ancoragem
    else if (abilityNumber === 2) {
        if (this.anchorPoints.length < 2) {
            // Coloca novo ponto de ancoragem
            this.anchorPoints.push({
                x: this.getCenterX(),
                y: this.getCenterY(),
                id: Date.now()
            });
            
            this.gameManager.effects.push(new this.gameManager.BamfEffect(
                this.getCenterX(),
                this.getCenterY(),
                'purple',
                500
            ));
            
            this.gameManager.showUI(`Noturno: Ponto de Ancoragem ${this.anchorPoints.length} definido!`, 'info');
        } else {
            // Teletransporta entre os pontos
            if (this.anchorTeleportCooldown <= 0) {
                // Encontra o ponto mais distante
                let targetAnchor = this.anchorPoints[0];
                const dist0 = Math.hypot(this.getCenterX() - this.anchorPoints[0].x, this.getCenterY() - this.anchorPoints[0].y);
                const dist1 = Math.hypot(this.getCenterX() - this.anchorPoints[1].x, this.getCenterY() - this.anchorPoints[1].y);
                
                if (dist1 > dist0) {
                    targetAnchor = this.anchorPoints[1];
                }
                
                // Efeito de saída
                this.createSulfurCloud(this.getCenterX(), this.getCenterY());
                this.gameManager.effects.push(new this.gameManager.BamfEffect(
                    this.getCenterX(),
                    this.getCenterY(),
                    'purple',
                    300
                ));
                
                // Teletransporta
                this.x = targetAnchor.x - this.width / 2;
                this.y = targetAnchor.y - this.height / 2;
                
                // Efeito de chegada
                this.createSulfurCloud(this.getCenterX(), this.getCenterY());
                this.gameManager.effects.push(new this.gameManager.BamfEffect(
                    this.getCenterX(),
                    this.getCenterY(),
                    'purple',
                    300
                ));
                
                this.anchorTeleportCooldown = data.anchorPointTeleportCooldown;
                this.gameManager.showUI('Noturno: Teletransporte entre ancoragens!', 'special');
            } else {
                this.gameManager.showUI('Noturno: Teletransporte em recarga!', 'warning');
            }
        }
    }
    
    // Habilidade 3: Dança Noturna
    else if (abilityNumber === 3 && this.abilities.nightDance.cooldown <= 0) {
        this.isDancing = true;
        this.nightDanceEndTime = Date.now() + data.nightDanceDuration;
        this.lastDanceTickTime = Date.now();
        this.abilities.nightDance.cooldown = data.nightDanceCooldown;
        
        this.gameManager.effects.push(new this.gameManager.BamfEffect(
            this.getCenterX(),
            this.getCenterY(),
            'blue',
            300
        ));
        
        this.gameManager.showUI('Noturno: Dança Noturna!', 'ultimate');
    }
}
createSulfurCloud(x, y) {
    const data = Champion.championData.noturno;
    
    const sulfurCloud = {
        x: x,
        y: y,
        radius: data.sulfurCloudRadius,
        damage: data.sulfurCloudDamage,
        duration: data.sulfurCloudDuration,
        spawnTime: Date.now(),
        lastDamageTick: Date.now(),
        owner: this,
        type: 'sulfurCloud'
    };
    
    this.gameManager.sulfurClouds = this.gameManager.sulfurClouds || [];
    this.gameManager.sulfurClouds.push(sulfurCloud);
}

    onEnemyKilled() {
        this.addXp(10);
    }
}

export class InfinityUltron extends Champion {
    constructor(type, x, y, id, gameManagerInstance) {
        super(type, x, y, id, gameManagerInstance);
        
        const data = Champion.championData.infinityultron;
        
        // 🧬 Pulso de Entropia (sempre ativo)
        this.lastEntropyTick = Date.now();
        
        // 💠 Joia do Espaço
        this.lastSpaceStonePull = Date.now();
        this.dominionStacks = 0;
        this.dominionStackEndTimes = []; // Array de tempos de expiração
        this.pulledEnemies = []; // Rastreia inimigos puxados recentemente
        
        // 🟪 Joia do Poder (Habilidade 1)
        this.abilities.powerStone = {
            cooldown: 0,
            cooldownBase: data.powerStone.cooldown
        };
        this.powerStoneActive = false;
        this.powerStoneEndTime = 0;
        this.empoweredEnemies = []; // Inimigos que sobreviveram aos 6s

        // 🔴 Joia da Realidade
        this.abilities.realityStone = {
            cooldown: 0,
            cooldownBase: data.realityStone.cooldown
        };
        this.realityStoneActive = false;
        this.realityStoneEndTime = 0;

        // 🟥 BARREIRA DA REALIDADE
        this.realityBarrierCooldown = 0;
        this.activeRealityBarrier = null; // Referência à barreira ativa

        // ⏳ Joia do Tempo
        this.abilities.timeStone = {
            cooldown: 0,
            cooldownBase: 0 // Calculado por fases
        };
        this.timePrisonActive = false;
        this.timePrisonZone = null;
        this.timePrisonEndTime = 0;
        this.timePrisonPhaseCooldown = 0;
        this.frozenEnemies = []; // ✅ NOVO: Rastreia inimigos congelados

        // 🧠 Joia da Mente (Passiva, ativa com Time Stone)
        this.mindStoneActive = false;
        this.activeMinions = [];

        // 🟠 Joia da Alma (sinergia passiva - gerenciada no GameManager)
        
        // Estado visual
        this.entropyRingRotation = 0;
        this.spaceStoneCharge = 0;
    }

    update(deltaTime, enemies, champions, projectiles, effects) {
        super.update(deltaTime, enemies, champions, projectiles, effects);
        
        const data = Champion.championData.infinityultron;
        
        // 🟪 Verifica se Joia do Poder está ativa
        if (this.powerStoneActive && Date.now() > this.powerStoneEndTime) {
            this.deactivatePowerStone();
        }

        // 🔴 Verifica se Joia da Realidade está ativa
        if (this.realityStoneActive && Date.now() > this.realityStoneEndTime) {
            this.deactivateRealityStone();
        }
        
        // 🧬 PASSIVO: Pulso de Entropia (Dano em Área Contínuo)
        if (Date.now() - this.lastEntropyTick >= data.entropyPulse.tickRate) {
            this.applyEntropyDamage();
            this.lastEntropyTick = Date.now();
        }
        
        // 💠 PASSIVO: Joia do Espaço (Puxar Inimigo)
        if (Date.now() - this.lastSpaceStonePull >= data.spaceStone.interval) {
            this.activateSpaceStone();
            this.lastSpaceStonePull = Date.now();
        }
        
        // Atualiza stacks de Domínio Dimensional
        this.dominionStackEndTimes = this.dominionStackEndTimes.filter(time => Date.now() < time);
        this.dominionStacks = this.dominionStackEndTimes.length;
        
        // 🔧 CORREÇÃO: Remove inimigos puxados que já passaram da janela de kill
        this.pulledEnemies = this.pulledEnemies.filter(pullData => 
            Date.now() - pullData.pullTime < data.spaceStone.killWindow
        );
        
        // Rotação visual dos anéis
        this.entropyRingRotation += 0.01 * (deltaTime / 16.67);

// ⏳ SISTEMA DE PRISÃO TEMPORAL
if (this.timePrisonActive) {
    // Verifica se a zona ainda está ativa
    if (Date.now() > this.timePrisonEndTime) {
        this.deactivateTimePrison();
    } else {
        // ✅ VERIFICA CONTINUAMENTE TODOS OS INIMIGOS
        this.gameManager.enemies.forEach(enemy => {
            const dist = Math.hypot(
                this.timePrisonZone.x - enemy.getCenterX(),
                this.timePrisonZone.y - enemy.getCenterY()
            );
            
            // Se o inimigo entrou na zona e ainda não está congelado
            if (dist < this.timePrisonZone.radius && !enemy.isFrozenByTime) {
                // Congela o inimigo
                enemy.isFrozenByTime = true;
                enemy.wasFrozenByTime = true; // Marca para conversão
                enemy.timeFreezeEndTime = this.timePrisonEndTime;
                enemy.frozenVelocity = enemy.vel;
                enemy.vel = 0; // Para completamente
                enemy.originalY = enemy.y; // Salva posição
                
                // Adiciona à lista de congelados
                if (!this.frozenEnemies.includes(enemy)) {
                    this.frozenEnemies.push(enemy);
                }
                
                // Efeito visual de congelamento
                this.gameManager.effects.push(new this.gameManager.BamfEffect(
                    enemy.getCenterX(),
                    enemy.getCenterY(),
                    'lime',
                    300
                ));
                
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    enemy.getCenterX(),
                    enemy.getCenterY() - 30,
                    '⏳ CONGELADO!',
                    'lime',
                    800
                ));
            }
            
            // Se o inimigo saiu da zona, descongela
            else if (dist >= this.timePrisonZone.radius && enemy.isFrozenByTime) {
                enemy.isFrozenByTime = false;
                enemy.vel = enemy.frozenVelocity || enemy.data.speed;
                
                // Remove da lista de congelados
                const index = this.frozenEnemies.indexOf(enemy);
                if (index > -1) {
                    this.frozenEnemies.splice(index, 1);
                }
                
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    enemy.getCenterX(),
                    enemy.getCenterY() - 30,
                    'DESCONGELADO',
                    'orange',
                    600
                ));
            }
        });
    }
}

        // 🧠 MINIONS DA JOIA DA MENTE
        this.activeMinions = this.activeMinions.filter(minion => {
            if (minion.hp <= 0 || Date.now() > minion.expirationTime) {
                // Explode ao morrer
                this.gameManager.enemies.forEach(enemy => {
                    const dist = Math.hypot(
                        minion.x - enemy.getCenterX(),
                        minion.y - enemy.getCenterY()
                    );
                    if (dist < data.mindStone.minionExplosionRadius) {
                        enemy.takeDamage(data.mindStone.minionExplosionDamage, this);
                    }
                });
                
                // Efeito visual da explosão
                this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                    minion.x,
                    minion.y,
                    data.mindStone.minionExplosionRadius,
                    500,
                    'purple'
                ));
                
                this.gameManager.showUI('🧠 Minion Mental explodiu!', 'info');
                return false; // Remove do array
            }
            
            // Atualiza cooldown de ataque
            if (minion.attackCooldown > 0) {
                minion.attackCooldown -= deltaTime;
            }
            
            return true; // Mantém no array
        });

// 🟥 ATUALIZA BARREIRA DA REALIDADE
if (this.activeRealityBarrier) {
    const barrier = this.activeRealityBarrier;
    const data = Champion.championData.infinityultron.realityBarrier;
    const elapsed = Date.now() - barrier.spawnTime;
    const dt = deltaTime / 1000;
    
    // ⏱️ Verifica expiração
    if (barrier.hp <= 0 || elapsed > barrier.duration) {
        this.destroyRealityBarrier();
        return;
    }
    
    // 🎨 ATUALIZA ANIMAÇÕES
    barrier.glitchPhase += deltaTime / 100;
    barrier.scanlineOffset += 200 * dt;
    if (barrier.scanlineOffset > barrier.height) barrier.scanlineOffset = 0;
    
    // Linhas de glitch
    barrier.glitchLines.forEach(line => {
        line.y += line.speed * dt;
        if (line.y > barrier.height) line.y = -line.height;
    });
    
    // Hexágonos
    barrier.hexagons.forEach(hex => {
        hex.rotation += hex.rotationSpeed;
        hex.pulsePhase += 0.05;
    });
    
    // Partículas
    barrier.shardParticles.forEach(p => {
        p.x += p.vx * dt * 20;
        p.y += p.vy * dt * 20;
        p.pulsePhase += 0.1;
        
        // Mantém dentro da barreira
        if (p.x < 0 || p.x > barrier.width) p.vx *= -1;
        if (p.y < 0 || p.y > barrier.height) p.vy *= -1;
    });
    
    // Pulsos de energia
    barrier.energyPulses.forEach(pulse => {
        if (elapsed > pulse.delay) {
            pulse.y += pulse.speed * dt;
            if (pulse.y > barrier.height + pulse.size) {
                pulse.y = -pulse.size;
            }
        }
    });
    
    // 🎯 COLISÃO COM INIMIGOS (mantém o código anterior)
    this.gameManager.enemies.forEach(enemy => {
        const enemyRect = {
            x: enemy.x,
            y: enemy.y,
            width: enemy.radius * 2,
            height: enemy.radius * 2
        };
        
        const barrierRect = {
            x: barrier.x,
            y: barrier.y,
            width: barrier.width,
            height: barrier.height
        };
        
        // Colisão AABB
        if (this.checkRectCollision(enemyRect, barrierRect)) {
            // Para o inimigo
            enemy.vel = 0;
            enemy.isBlockedByRealityBarrier = true;
            
            // Ataca a barreira
            if (!enemy.barrierAttackCooldown || enemy.barrierAttackCooldown <= 0) {
                const damage = enemy.data.baseDamage || 5;
                barrier.hp -= damage;
                
                // 🔄 REFLEXÃO DE DANO
                const reflectedDamage = damage * barrier.reflectDamage;
                enemy.takeDamage(reflectedDamage, this);
                
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    barrier.x + barrier.width / 2,
                    enemy.getCenterY() - 20,
                    `-${damage.toFixed(0)}`,
                    'red',
                    500
                ));
                
                // ⚡ Efeito de impacto com glitch
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    enemy.getCenterX(),
                    enemy.getCenterY(),
                    15,
                    'darkred',
                    200
                ));
                
                // 🌌 Distorção extra no ponto de impacto
                barrier.glitchLines.push({
                    y: enemy.getCenterY() - barrier.y,
                    height: 20,
                    speed: 300,
                    alpha: 1
                });
                
                enemy.barrierAttackCooldown = enemy.attackSpeed || 1500;
            }
            
            // 🐌 DEBUFF DE SLOW (primeira vez)
            if (!barrier.affectedEnemies.has(enemy.id)) {
                barrier.affectedEnemies.add(enemy.id);
                
                enemy.barrierSlowEnd = Date.now() + data.slowDuration;
                enemy.barrierSlowApplied = true;
            }
        } else {
            enemy.isBlockedByRealityBarrier = false;
        }
        
        // Remove slow após duração
        if (enemy.barrierSlowApplied && Date.now() > enemy.barrierSlowEnd) {
            enemy.barrierSlowApplied = false;
        }
        
        // Aplica slow
        if (enemy.barrierSlowApplied) {
            enemy.vel = enemy.data.speed * (1 - data.slowDebuff);
        }
        
        // Atualiza cooldown de ataque
        if (enemy.barrierAttackCooldown > 0) {
            enemy.barrierAttackCooldown -= deltaTime;
        }
    });

    }
    
    // ⏱️ Cooldown da barreira
    if (this.realityBarrierCooldown > 0) {
        this.realityBarrierCooldown -= deltaTime;
    }

    }
    
applyEntropyDamage() {
    const data = Champion.championData.infinityultron.entropyPulse;
    const powerData = Champion.championData.infinityultron.powerStone;
    
    // 🟪 Modificadores da Joia do Poder
    let damageMultiplier = 1;
    let radiusMultiplier = 1;
    let isPowerActive = false;
    
    if (this.powerStoneActive) {
        damageMultiplier = powerData.damageMultiplier; // 2.5x
        radiusMultiplier = powerData.radiusMultiplier; // 0.5x (reduz raio)
        isPowerActive = true;
    }
    
    const innerRadius = data.innerRadius * radiusMultiplier;
    const middleRadius = data.middleRadius * radiusMultiplier;
    const outerRadius = data.outerRadius * radiusMultiplier;
        
        this.gameManager.enemies.forEach(enemy => {
            const dist = Math.hypot(
                this.getCenterX() - enemy.getCenterX(),
                this.getCenterY() - enemy.getCenterY()
            );
            
            let damage = 0;
            let inZone = false;
            
            // Calcula dano baseado na distância (anéis invertidos)
            if (dist < innerRadius) {
                damage = data.innerDamage * damageMultiplier;
                inZone = true;
            } else if (dist < middleRadius) {
                damage = data.middleDamage * damageMultiplier;
                inZone = true;
            } else if (dist < outerRadius) {
                damage = data.outerDamage * damageMultiplier;
                inZone = true;
            }
            
            if (inZone) {
                // Aplica dano por tick (divide por 2 pois tick é 0.5s)
                enemy.takeDamage(damage / 2, this);
                
                // Marca que estava na zona
                enemy.wasInEntropyZone = true;
                enemy.lastEntropyContact = Date.now();
                
                // 🟪 Rastreia inimigos na zona durante Joia do Poder
                if (this.powerStoneActive) {
                    if (!enemy.inPowerStoneZone) {
                        enemy.inPowerStoneZone = true;
                        enemy.powerStoneEntryTime = Date.now();
                    }
                }
                
                // Efeito visual de dano
                if (Math.random() < 0.3) {
                    const color = this.powerStoneActive ? 'purple' : 'orange';
                    this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                        enemy.getCenterX(),
                        enemy.getCenterY() - 20,
                        `${(damage / 2).toFixed(1)}`,
                        color,
                        400
                    ));
                }
            } else {
                if (enemy.wasInEntropyZone) {
                    // 🔥 Queimadura após sair da zona
                    const timeSinceExit = Date.now() - enemy.lastEntropyContact;
                    
                    if (timeSinceExit < data.burnDuration) {
                        enemy.takeDamage(data.burnDamage / 2, this);
                        
                        // Efeito visual de queimadura
                        if (Math.random() < 0.2) {
                            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                                enemy.getCenterX(),
                                enemy.getCenterY(),
                                15,
                                'orange',
                                300
                            ));
                        }
                    } else {
                        enemy.wasInEntropyZone = false;
                    }
                }
                
                // Se estava na zona durante Power Stone mas saiu
                if (enemy.inPowerStoneZone) {
                    enemy.inPowerStoneZone = false;
                }
            }
        });
    }
    
    deactivatePowerStone() {
        const data = Champion.championData.infinityultron.powerStone;
        
        this.powerStoneActive = false;
        
        // 🟪 Empurra inimigos que sobreviveram aos 6 segundos
        this.gameManager.enemies.forEach(enemy => {
            if (enemy.inPowerStoneZone) {
                const angle = Math.atan2(
                    enemy.getCenterY() - this.getCenterY(),
                    enemy.getCenterX() - this.getCenterX()
                );
                
                // Empurrão forte
                enemy.x += Math.cos(angle) * data.pushbackDistance;
                enemy.y += Math.sin(angle) * data.pushbackDistance;
                
                // Efeito visual do empurrão
                this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                    enemy.getCenterX(),
                    enemy.getCenterY(),
                    60,
                    400
                ));
                
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    enemy.getCenterX(),
                    enemy.getCenterY() - 30,
                    'EMPURRADO!',
                    'purple',
                    800
                ));
                
                enemy.inPowerStoneZone = false;
            }
        });
        
        // Explosão final
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.getCenterX(),
            this.getCenterY(),
            150,
            800,
            'purple'
        ));
        
        this.gameManager.showUI('Infinity Ultron: Joia do Poder desativada! 🟪', 'info');
    }
    
activateSpaceStone() {
    const data = Champion.championData.infinityultron.spaceStone;
    
    // Encontra o inimigo mais forte (não-boss) no alcance
    let strongestEnemy = null;
    let maxHp = 0;
    
    this.gameManager.enemies.forEach(enemy => {
        if (!enemy.isBoss) {
            const dist = Math.hypot(
                this.getCenterX() - enemy.getCenterX(),
                this.getCenterY() - enemy.getCenterY()
            );
            
            if (dist < data.pullRange && enemy.hp > maxHp) {
                maxHp = enemy.hp;
                strongestEnemy = enemy;
            }
        }
    });
    
    if (!strongestEnemy) {
        return;
    }
    
    // ✅ CAPTURA AS COORDENADAS
    const startX = strongestEnemy.getCenterX();
    const startY = strongestEnemy.getCenterY();
    const endX = this.getCenterX();
    const endY = this.getCenterY();
    
    // ✅ VALIDAÇÃO DE COORDENADAS
    if (!isFinite(startX) || !isFinite(startY) || !isFinite(endX) || !isFinite(endY)) {
        console.error('❌ SpaceStone: Coordenadas inválidas', { startX, startY, endX, endY });
        return;
    }
    
    // ✅ VALIDAÇÃO DO INIMIGO
    if (!strongestEnemy || typeof strongestEnemy.getCenterX !== 'function') {
        console.error('❌ SpaceStone: Inimigo inválido', strongestEnemy);
        return;
    }
    
    // ===============================
    // ✅ CRIA O EFEITO VISUAL (UMA VEZ SÓ!)
    // ===============================
    try {
        this.gameManager.effects.push(new this.gameManager.SpaceStonePullChainEffect(
            startX,
            startY,
            endX,
            endY,
            strongestEnemy, // ✅ PASSA O INIMIGO AQUI
            2000
        ));
    } catch (error) {
        console.error('❌ Erro ao criar SpaceStonePullChainEffect:', error);
    }
    
    // ===============================
    // APLICA O PUXÃO NO INIMIGO
    // ===============================
    strongestEnemy.isPulledBySpaceStone = true;
    strongestEnemy.spaceStoneTarget = {
        x: endX,
        y: endY
    };
    strongestEnemy.spaceStonePullSpeed = data.pullSpeed;
    strongestEnemy.originalSpeed = strongestEnemy.vel;
    
    // Rastreia para o stack de domínio
    this.pulledEnemies.push({
        enemy: strongestEnemy,
        pullTime: Date.now()
    });
    
    this.gameManager.showUI('Infinity Ultron: Joia do Espaço ativada! 💠', 'ultimate');
}

deactivateRealityStone() {
    this.realityStoneActive = false;
    
    // Remove debuffs dos inimigos
    this.gameManager.enemies.forEach(enemy => {
        if (enemy.realityDebuff) {
            delete enemy.realityDebuff;
        }
    });
    
    this.gameManager.showUI('Infinity Ultron: Realidade restaurada. 🔴', 'info');
}

createRealityBarrier() {
    const data = Champion.championData.infinityultron.realityBarrier;
    const canvas = this.gameManager.canvas;
    
    // 🎯 Posição: VERTICAL de cima a baixo, no final da rota
    const barrierX = canvas.width - 100; // 100px antes da borda
    const barrierY = 0; // Começa do topo
    const barrierWidth = 60;
    const barrierHeight = canvas.height; // Altura total da tela
    
    // 🟥 Cria a barreira
    const barrier = {
        id: `reality-barrier-${Date.now()}`,
        x: barrierX,
        y: barrierY,
        width: barrierWidth,
        height: barrierHeight,
        hp: data.hp,
        maxHp: data.hp,
        spawnTime: Date.now(),
        duration: data.duration,
        reflectDamage: data.reflectDamage,
        owner: this,
        affectedEnemies: new Set(),
        
        // 🎨 VISUAL GLITCH
        glitchPhase: 0,
        glitchLines: [],      // Linhas de distorção
        scanlineOffset: 0,    // Efeito scanline
        shardParticles: [],
        hexagons: [],         // Hexágonos flutuantes
        energyPulses: []      // Pulsos de energia
    };
    this.activeRealityBarrier = barrier;
    
    // 💬 BALÃO DE FALA EM CIMA DO ULTRON
    this.gameManager.createSpeechBubble(
        this.getCenterX(), // x do Ultron
        this.getCenterY() - 60, // Acima do Ultron
        'EU NÃO MANDEI VOCÊ SAIR! 🟥',
        4000
    );

    // 🌌 Efeito de spawn épico
    for (let i = 0; i < 5; i++) {
        const y = (canvas.height / 5) * i + canvas.height / 10;
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            barrierX + barrierWidth / 2,
            y,
            80,
            500,
            'rgba(139, 0, 0, 1)'
        ));
    }
    
    // ⚡ Ondas verticais
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            for (let j = 0; j < 5; j++) {
                const y = (canvas.height / 5) * j + canvas.height / 10;
                this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                    barrierX + barrierWidth / 2,
                    y,
                    60 + i * 20,
                    400
                ));
            }
        }, i * 150);
    }
    
    this.activeRealityBarrier = barrier;
    
    // 🎨 INICIALIZA ELEMENTOS VISUAIS
    
    // Linhas de glitch
    for (let i = 0; i < 10; i++) {
        barrier.glitchLines.push({
            y: Math.random() * barrierHeight,
            height: 2 + Math.random() * 8,
            speed: 50 + Math.random() * 100,
            alpha: 0.5 + Math.random() * 0.5
        });
    }
    
    // Hexágonos flutuantes
    for (let i = 0; i < 6; i++) {
        barrier.hexagons.push({
            y: (barrierHeight / 6) * i + barrierHeight / 12,
            size: 15 + Math.random() * 10,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            pulsePhase: Math.random() * Math.PI * 2
        });
    }
    
    // Partículas
    for (let i = 0; i < 40; i++) {
        barrier.shardParticles.push({
            x: Math.random() * barrierWidth,
            y: Math.random() * barrierHeight,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: 2 + Math.random() * 4,
            alpha: Math.random(),
            pulsePhase: Math.random() * Math.PI * 2
        });
    }
    
    // Pulsos de energia
    for (let i = 0; i < 3; i++) {
        barrier.energyPulses.push({
            y: 0,
            speed: 200 + Math.random() * 100,
            size: 10 + Math.random() * 10,
            delay: i * 500
        });
    }
}

destroyRealityBarrier() {
    if (!this.activeRealityBarrier) return;
    
    const barrier = this.activeRealityBarrier;
    const data = Champion.championData.infinityultron.realityBarrier;
    const centerX = barrier.x + barrier.width / 2;
    const centerY = barrier.y + barrier.height / 2;
    
    // 💥 EXPLOSÃO DE ESTILHAÇOS
    this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
        centerX,
        centerY,
        120,
        800,
        'rgba(139, 0, 0, 1)'
    ));
    
    // 🌌 Partículas de realidade
    for (let i = 0; i < 40; i++) {
        const angle = (Math.PI * 2 / 40) * i;
        this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
            centerX + Math.cos(angle) * 30,
            centerY + Math.sin(angle) * 30,
            20,
            'darkred',
            800
        ));
    }
    
    // 👊 KNOCKBACK nos inimigos próximos
    this.gameManager.enemies.forEach(enemy => {
        const dist = Math.hypot(centerX - enemy.getCenterX(), centerY - enemy.getCenterY());
        
        if (dist < 150) {
            const angle = Math.atan2(enemy.getCenterY() - centerY, enemy.getCenterX() - centerX);
            enemy.x += Math.cos(angle) * data.knockbackDistance;
            enemy.y += Math.sin(angle) * data.knockbackDistance;
            
            enemy.isBlockedByRealityBarrier = false;
            enemy.vel = enemy.data.speed; // Restaura velocidade
        }
    });
    
    this.activeRealityBarrier = null;
    this.gameManager.showUI('Barreira da Realidade destruída!', 'warning');
}
checkRectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

deactivateTimePrison() {
    this.timePrisonActive = false;
    
    // Descongela inimigos sobreviventes
    this.frozenEnemies.forEach(enemy => {
        if (enemy && enemy.hp > 0) {
            enemy.isFrozenByTime = false;
            enemy.vel = enemy.frozenVelocity || enemy.data.speed;
        }
    });
    
    // Desativa Mind Stone
    this.mindStoneActive = false;
    
    this.timePrisonZone = null;
    this.frozenEnemies = [];
    
    this.gameManager.showUI('⏳ Prisão Temporal encerrada. 🧠 Mente desativada.', 'info');
}
    
onEnemyKilled(enemy) {
    const data = Champion.championData.infinityultron.spaceStone;
    
    // ✅ VALIDAÇÃO CRÍTICA: Verifica se enemy existe e tem ID
    if (!enemy || !enemy.id) {
        console.warn('⚠️ Infinity Ultron: onEnemyKilled chamado com enemy inválido');
        return;
    }
    
    // Verifica se o inimigo foi puxado recentemente
    const pulledData = this.pulledEnemies.find(p => p.enemy && p.enemy.id === enemy.id);
    
    if (pulledData && Date.now() - pulledData.pullTime < data.killWindow) {
        // Ganha stack de Domínio Dimensional
        if (this.dominionStacks < data.maxStacks) {
            this.dominionStackEndTimes.push(Date.now() + data.dominionStackDuration);
            this.dominionStacks = this.dominionStackEndTimes.length;
            
            // Efeito visual
            if (this.gameManager && this.gameManager.effects) {
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    this.getCenterX(),
                    this.getCenterY() - 40,
                    `DOMÍNIO +${this.dominionStacks}`,
                    'cyan',
                    1000
                ));
                
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.getCenterX(),
                    this.getCenterY(),
                    50,
                    'cyan',
                    800
                ));
            }
        }
    }

    // 🧠 CONVERSÃO AUTOMÁTICA: Inimigos mortos durante Time Stone viram minions
    if (this.mindStoneActive && enemy && enemy.id && enemy.wasFrozenByTime) {
        console.log('🧠 Mind Stone: Convertendo inimigo', enemy.type, enemy.id);
        
        const data = Champion.championData.infinityultron.mindStone;
        
        // ✅ Verifica se o inimigo realmente estava congelado
        if (!enemy.wasFrozenByTime) {
            console.warn('⚠️ Inimigo não tinha flag wasFrozenByTime');
            return;
        }
        
        // Cria minion robótico no local da morte
        const minion = {
            id: `mind-minion-${Date.now()}-${Math.random()}`,
            x: enemy.getCenterX(),
            y: enemy.getCenterY(),
            hp: enemy.maxHp * data.minionHpMultiplier,
            maxHp: enemy.maxHp * data.minionHpMultiplier,
            damage: (enemy.data.baseDamage || 10) * data.minionDamageMultiplier,
            attackRange: 200,
            attackSpeed: 1500,
            attackCooldown: 0,
            radius: enemy.radius,
            vel: (enemy.data.speed || 30) * 0.8,
            expirationTime: Date.now() + data.minionDuration,
            owner: this,
            originalType: enemy.type,
            image: enemy.image,
            
            getCenterX() { return this.x; },
            getCenterY() { return this.y; }
        };
        
        this.activeMinions.push(minion);
        console.log('✅ Minion criado:', minion.id);
        
        // Efeito visual de conversão ÉPICO
        this.gameManager.effects.push(new this.gameManager.BamfEffect(
            minion.x,
            minion.y,
            'purple',
            800
        ));

        // Explosão de energia mental
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            minion.x,
            minion.y,
            60,
            500,
            'purple'
        ));

        // Texto de conversão
        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
            minion.x,
            minion.y - 30,
            '🧠 CONVERTIDO!',
            'purple',
            1500
        ));

        // Ondas de conversão mental (3 camadas)
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                    minion.x,
                    minion.y,
                    50 + i * 20,
                    300
                ));
            }, i * 100);
        }

        // Partículas roxas em espiral
        for (let p = 0; p < 12; p++) {
            const angle = (Math.PI * 2 / 12) * p;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                minion.x + Math.cos(angle) * 30,
                minion.y + Math.sin(angle) * 30,
                15,
                'purple',
                1000
            ));
        }

        this.gameManager.showUI('🧠 Joia da Mente: Inimigo convertido em minion!', 'ultimate');
        }
        
        // ✅ Chama super.onEnemyKilled() apenas se existir
        if (typeof super.onEnemyKilled === 'function') {
            super.onEnemyKilled();
        }
}
    attack(enemies, projectiles, effects) {
        // Infinity Ultron não ataca diretamente
        return;
    }
    
    activateAbility(abilityNumber) {
        const data = Champion.championData.infinityultron;
        
        // 🟪 HABILIDADE 1: Joia do Poder
        if (abilityNumber === 1 && this.abilities.powerStone.cooldown <= 0) {
            this.powerStoneActive = true;
            this.powerStoneEndTime = Date.now() + data.powerStone.duration;
            this.abilities.powerStone.cooldown = data.powerStone.cooldownBase;
            
            // Explosão inicial
            this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                this.getCenterX(),
                this.getCenterY(),
                120,
                600,
                'purple'
            ));
            
            // Partículas de energia púrpura
            for (let i = 0; i < 30; i++) {
                const angle = (Math.PI * 2 / 30) * i;
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.getCenterX() + Math.cos(angle) * 40,
                    this.getCenterY() + Math.sin(angle) * 40,
                    20,
                    'purple',
                    1000
                ));
            }
            
            this.gameManager.showUI('Infinity Ultron: JOIA DO PODER! 🟪', 'ultimate');
        } else if (abilityNumber === 1) {
            this.gameManager.showUI('Joia do Poder em recarga!', 'warning');
        } 

        // ⏳ HABILIDADE 2: Joia do Tempo - Prisão Temporal
        else if (abilityNumber === 2 && this.timePrisonPhaseCooldown <= 0) {
            const data = Champion.championData.infinityultron;
            
            this.timePrisonActive = true;
            this.timePrisonEndTime = Date.now() + data.timeStone.duration;
            this.timePrisonPhaseCooldown = data.timeStone.cooldown; // 2 fases
            this.frozenEnemies = []; // Limpa lista
            
            // Define zona de prisão temporal
            this.timePrisonZone = {
                x: this.getCenterX(),
                y: this.getCenterY(),
                radius: data.timeStone.radius,
                endTime: this.timePrisonEndTime
            };
            
            // ✅ Congela TODOS os inimigos dentro do raio
            this.gameManager.enemies.forEach(enemy => {
                const dist = Math.hypot(
                    this.getCenterX() - enemy.getCenterX(),
                    this.getCenterY() - enemy.getCenterY()
                );
                
                if (dist < data.timeStone.radius) {
                    // Congela o inimigo
                    enemy.isFrozenByTime = true;
                    enemy.wasFrozenByTime = true; // ✅ MARCA PERMANENTE para conversão
                    enemy.timeFreezeEndTime = this.timePrisonEndTime;
                    enemy.frozenVelocity = enemy.vel;
                    enemy.vel = 0; // Para completamente
                    enemy.originalY = enemy.y; // ✅ Salva posição para congelamento visual
                    
                    this.frozenEnemies.push(enemy);
                }
            });
            
            // 🧠 ATIVA JOIA DA MENTE (Passiva de Combo)
            this.mindStoneActive = true;
            
            // Explosão inicial verde
            this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                this.getCenterX(),
                this.getCenterY(),
                data.timeStone.radius,
                800,
                'lime'
            ));
            
            // Partículas temporais
            for (let i = 0; i < 30; i++) {
                const angle = (Math.PI * 2 / 30) * i;
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.getCenterX() + Math.cos(angle) * data.timeStone.radius * 0.8,
                    this.getCenterY() + Math.sin(angle) * data.timeStone.radius * 0.8,
                    20,
                    'lime',
                    2000
                ));
            }
            
            this.gameManager.showUI(`⏳ PRISÃO TEMPORAL! ${this.frozenEnemies.length} inimigos congelados [🧠 Mente ativa]`, 'ultimate');
            
        } else if (abilityNumber === 2) {
            const phasesLeft = this.timePrisonPhaseCooldown;
            this.gameManager.showUI(`⏳ Prisão Temporal: ${phasesLeft} fase(s) restante(s)!`, 'warning');
        }
                
        // 🔴 HABILIDADE 3: Joia da Realidade
        else if (abilityNumber === 3 && this.abilities.realityStone.cooldown <= 0) {
            this.realityStoneActive = true;
            this.realityStoneEndTime = Date.now() + data.realityStone.duration;
            this.abilities.realityStone.cooldown = data.realityStone.cooldownBase;
            
            // Aplica debuff a TODOS os inimigos
            this.gameManager.enemies.forEach(enemy => {
                enemy.realityDebuff = {
                    endTime: this.realityStoneEndTime,
                    resistanceReduction: data.realityStone.resistanceReduction
                };
            });
            
            // Explosão inicial vermelha
            this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                this.getCenterX(),
                this.getCenterY(),
                150,
                800,
                'darkred'
            ));
            
            // Partículas vermelhas em todas direções
            for (let i = 0; i < 40; i++) {
                const angle = (Math.PI * 2 / 40) * i;
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.getCenterX() + Math.cos(angle) * 50,
                    this.getCenterY() + Math.sin(angle) * 50,
                    25,
                    'darkred',
                    1500
                ));
            }
            
            this.gameManager.showUI('Infinity Ultron: DISTORÇÃO DA REALIDADE! 🔴', 'ultimate');
        } else if (abilityNumber === 3) {
            this.gameManager.showUI('Joia da Realidade em recarga!', 'warning');
        } else {
            this.gameManager.showUI('Infinity Ultron: Habilidade não disponível.', 'info');
        }
        
         if (abilityNumber === 3) {
        // 🟥 BARREIRA DA REALIDADE
        if (this.realityBarrierCooldown <= 0 && !this.activeRealityBarrier) {
            this.createRealityBarrier();
            this.realityBarrierCooldown = data.realityBarrier.cooldown;
            this.gameManager.showUI('Infinity Ultron: "Eu não mandei você sair!" 🟥', 'ultimate');
        } else if (this.activeRealityBarrier) {
            this.gameManager.showUI('Barreira já ativa!', 'warning');
        } else {
            const timeLeft = (this.realityBarrierCooldown / 1000).toFixed(1);
            this.gameManager.showUI(`Barreira em cooldown (${timeLeft}s)`, 'warning');
        }
    }
 }
    
    
    // Bônus de dano dos stacks de Domínio
    getDamageMultiplier() {
        const data = Champion.championData.infinityultron.spaceStone;
        return 1 + (this.dominionStacks * data.dominionDamageBonus);
    }
}

// ===============================
// 🌟 KAROLINA DEAN - TORRE CÓSMICA RADIANTE
// ===============================
export class KarolinaDean extends Champion {
    constructor(type, x, y, id, gameManager) {
        super(type, x, y, id, gameManager);
        
        // 🌈 Sistema de Rajada Prismática
        this.prismBeams = []; // Beams ativos perseguindo inimigos
        this.blindChance = 0.25; // 25% chance de cegar
        
        // 🚀 Sistema de Voo Luminescente
        this.isFlying = false;
        this.flyStartPos = null;
        this.flyTargetPos = null;
        this.flyProgress = 0;
        this.flySpeed = 0.05; // Velocidade do voo
        this.isSelectingFlyLocation = false;
        this.flightAbilityCooldown = 0;
        
        // 🛡️ Sistema de Escudo Solar
        this.abilities.solarShield = {
            cooldown: 0,
            cooldownBase: Champion.championData.karolinadean.solarShieldCooldown
        };
        this.activeSolarShields = []; // Escudos ativos no campo
        
        // 💥 NOVO: Sistema de Explosão Solar (Ultimate)
        this.abilities.solarExplosion = {
            cooldown: 0,
            cooldownBase: Champion.championData.karolinadean.solarExplosionCooldown
        };
        
        // 🔆 NOVO: Sistema de Energia Estelar (Passiva)
        this.stellarStacks = 0;
        this.maxStellarStacks = Champion.championData.karolinadean.maxStellarStacks;
        this.lastStellarStackTime = Date.now();
        this.stellarStackInterval = Champion.championData.karolinadean.stellarStackInterval;

        // 💥 Sistema de Supernova Direcionada
        this.supernovaAbilityCooldown = 0;
        this.isSelectingSupernovaDirection = false;
        this.supernovaPreviewAngle = 0;
        
        // 👻 Sistema de Luz Refratada (Clone)
        this.lightClones = []; // Clones ativos
        
        // 🔥 Sistema de Superaquecimento Estelar
        this.heatLevel = 0; // 0 a 5
        this.maxHeat = 5;
        this.heatDecayTimer = 0;
        this.heatDecayDelay = 3000; // 3s sem usar skill = começa a esfriar
        this.lastSkillUseTime = 0;
        
        // 🎨 Sistema Visual
        this.glowPhase = 0;
        this.wingsVisible = false;
        this.wingSpread = 0; // 0 a 1
        this.auraParticles = [];
        this.rainbowHue = 0; // Rotação de cor do arco-íris
        
        console.log('✅ Karolina Dean criada!');
    }
    
    activateAbility(abilityNumber) {
        const data = Champion.championData.karolinadean;
        
        if (abilityNumber === 1) {
            // 🚀 Voo Luminescente
            if (this.flightAbilityCooldown > 0) {
                this.gameManager.showUI(`Voo em cooldown: ${(this.flightAbilityCooldown / 1000).toFixed(1)}s`, 'warning');
                return;
            }
            
            if (this.isFlying) {
                this.gameManager.showUI('Já está voando!', 'warning');
                return;
            }
            
            // Ativa modo de seleção
            this.gameManager.isSelectingKarolinaFlight = true;
            this.gameManager.karolinaFlightOwner = this;
            this.gameManager.showUI('Karolina: Clique onde deseja pousar! 🚀', 'info');
            
            // Mostra asas
            this.wingsVisible = true;
            this.wingSpread = 0;

            // 👻 Cria clone quando usa habilidade
            this.createLightClone();
            
            // 🔥 Adiciona calor
            this.addHeat(1);
        }
        
        // 🛡️ Habilidade 2 - Escudo Solar
        else if (abilityNumber === 2 && this.abilities.solarShield.cooldown <= 0) {
            this.createSolarShield();
        }
        
        // 💥 NOVO: Habilidade 3 - Explosão Solar (Ultimate)
        else if (abilityNumber === 3) {
            if (this.abilities.solarExplosion.cooldown > 0) {
                const cdLeft = (this.abilities.solarExplosion.cooldown / 1000).toFixed(1);
                this.gameManager.showUI(`Explosão Solar em cooldown: ${cdLeft}s`, 'warning');
                return;
            }
            
            if (this.stellarStacks < data.minStacksForUltimate) {
                this.gameManager.showUI(`Precisa de ${data.minStacksForUltimate} stacks! (${this.stellarStacks}/${this.maxStellarStacks})`, 'warning');
                return;
            }
                        // Ativa modo de seleção de direção
            this.gameManager.isSelectingKarolinaSupernova = true;
            this.gameManager.karolinaSupernovaOwner = this;
            this.gameManager.showUI('Karolina: Mire a direção da Supernova! ☀️💥', 'ultimate');

               // 👻 Cria clone quando usa habilidade
            this.createLightClone();
            
            // 🔥 Adiciona calor
            this.addHeat(2);

            this.activateSolarExplosion();
        }
    }
    
    // 👻 CRIA CLONE DE LUZ
    createLightClone() {
        const data = Champion.championData.karolinadean;
        
        const clone = {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            getCenterX: () => clone.x + clone.width / 2,
            getCenterY: () => clone.y + clone.height / 2,
            spawnTime: Date.now(),
            duration: data.cloneDuration,
            alpha: 0.7,
            lastAttackTime: 0,
            attackSpeed: this.cooldownBase,
            damage: this.getDamage() * data.cloneDamageMultiplier,
            owner: this,
            image: this.image,
            hue: Math.random() * 360
        };
        
        this.lightClones.push(clone);
        
        // Efeito de criação
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 / 15) * i;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                clone.getCenterX() + Math.cos(angle) * 25,
                clone.getCenterY() + Math.sin(angle) * 25,
                12,
                this.getRandomRainbowColor(),
                600
            ));
        }
        
        this.gameManager.showUI('Clone de Luz criado! 👻', 'special');
    }
    
    // 🔥 ADICIONA CALOR
    addHeat(amount) {
        const data = Champion.championData.karolinadean;
        
        this.heatLevel = Math.min(this.maxHeat, this.heatLevel + amount);
        this.lastSkillUseTime = Date.now();
        
        // Efeito visual de calor
        const heatColors = ['orange', 'red', 'yellow', 'white'];
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.getCenterX() + Math.cos(angle) * 20,
                this.getCenterY() + Math.sin(angle) * 20,
                8,
                heatColors[Math.floor(Math.random() * heatColors.length)],
                500
            ));
        }
        
        // Se atingir o máximo, EXPLODE!
        if (this.heatLevel >= this.maxHeat) {
            this.triggerOverheatExplosion();
        }
    }
    
    // 🛡️ Cria Escudo Solar
    createSolarShield() {
        const data = Champion.championData.karolinadean;
        
        // Busca torre aliada mais próxima
        let targetChampion = null;
        let minDist = Infinity;
        
        this.gameManager.champions.forEach(ally => {
            if (ally.id !== this.id && ally.hp > 0) {
                const dist = Math.hypot(
                    this.getCenterX() - ally.getCenterX(),
                    this.getCenterY() - ally.getCenterY()
                );
                
                if (dist < data.solarShieldRange && dist < minDist) {
                    minDist = dist;
                    targetChampion = ally;
                }
            }
        });
        
        // Se não houver torre próxima, usa ela mesma
        if (!targetChampion) {
            targetChampion = this;
        }
        
        // Cria o escudo
        const shield = {
            id: `solar-shield-${Date.now()}`,
            owner: this,
            target: targetChampion,
            spawnTime: Date.now(),
            endTime: Date.now() + data.solarShieldDuration,
            hp: data.solarShieldHP,
            maxHp: data.solarShieldHP,
            rotation: 0,
            pulsePhase: 0,
            particles: [],
            rays: [],
            
            // Inicializa partículas
            initParticles() {
                for (let i = 0; i < 40; i++) {
                    this.particles.push({
                        angle: Math.random() * Math.PI * 2,
                        distance: 40 + Math.random() * 20,
                        speed: 0.02 + Math.random() * 0.03,
                        size: 2 + Math.random() * 3,
                        hue: Math.random() * 60 + 30, // Tons dourados
                        alpha: 0.5 + Math.random() * 0.5
                    });
                }
                
                for (let i = 0; i < 12; i++) {
                    this.rays.push({
                        angle: (Math.PI * 2 / 12) * i,
                        length: 50 + Math.random() * 20,
                        width: 2 + Math.random() * 2,
                        pulseSpeed: 0.05 + Math.random() * 0.05
                    });
                }
            }
        };
        
        shield.initParticles();
        this.activeSolarShields.push(shield);
        
        // Efeito de criação épico
        const targetX = targetChampion.getCenterX();
        const targetY = targetChampion.getCenterY();
        
        // Explosão dourada inicial
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            targetX, targetY, 80, 600, 'rgba(255, 215, 0, 0.8)'
        ));
        
        // Ondas de luz
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                    targetX, targetY, 60 + i * 20, 400
                ));
            }, i * 150);
        }
        
        // Partículas douradas em espiral
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 / 30) * i;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                targetX + Math.cos(angle) * 30,
                targetY + Math.sin(angle) * 30,
                15,
                `hsl(${45 + i * 2}, 100%, 60%)`,
                1000
            ));
        }
        
        this.abilities.solarShield.cooldown = data.solarShieldCooldown;
        this.gameManager.showUI(`Escudo Solar criado em ${targetChampion === this ? 'si mesma' : targetChampion.type}! 🛡️`, 'ultimate');
    }
    
    // 💥 NOVO: Ativa Explosão Solar (Ultimate)
    activateSolarExplosion() {
        const data = Champion.championData.karolinadean;
        const explosionX = this.getCenterX();
        const explosionY = this.getCenterY();
        
        // Calcula dano baseado nos stacks
        const stackBonus = this.stellarStacks * data.stellarStackUltimateBonus;
        const finalDamage = data.solarExplosionDamage * (1 + stackBonus);
        const finalRadius = data.solarExplosionRadius * (1 + this.stellarStacks * data.stellarAreaBonus);
        
        // ==========================================
        // FASE 1: FLASH BRANCO INTENSO (Cega a tela)
        // ==========================================
        this.gameManager.createScreenFlash('white', 1.0, 800);
        
        // ==========================================
        // FASE 2: DANO E EFEITOS NOS INIMIGOS
        // ==========================================
        this.gameManager.enemies.forEach(enemy => {
            const dist = Math.hypot(explosionX - enemy.getCenterX(), explosionY - enemy.getCenterY());
            
            if (dist < finalRadius) {
                // Dano massivo
                enemy.takeDamage(finalDamage, this);
                
                // Cega inimigos por 3 segundos
                enemy.isBlinded = true;
                enemy.blindEndTime = Date.now() + data.solarExplosionBlindDuration;
                enemy.canAttack = false;
                
                setTimeout(() => {
                    enemy.isBlinded = false;
                    enemy.canAttack = true;
                }, data.solarExplosionBlindDuration);
                
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    enemy.getCenterX(),
                    enemy.getCenterY() - 30,
                    'CEGADO!',
                    'white',
                    1500
                ));
            }
        });
        
        // ==========================================
        // FASE 3: BUFFA ALIADOS
        // ==========================================
        this.gameManager.champions.forEach(ally => {
            const dist = Math.hypot(explosionX - ally.getCenterX(), explosionY - ally.getCenterY());
            
            if (dist < finalRadius && ally.hp > 0) {
                ally.applyBuff('damageBoost', data.solarExplosionAllyDamageBoost, data.solarExplosionAllyBuffDuration);
                ally.applyBuff('attackSpeed', data.solarExplosionAllySpeedBoost, data.solarExplosionAllyBuffDuration);
                
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    ally.getCenterX(),
                    ally.getCenterY(),
                    50,
                    'gold',
                    data.solarExplosionAllyBuffDuration
                ));
                
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    ally.getCenterX(),
                    ally.getCenterY() - 40,
                    'BUFFADO!',
                    'gold',
                    1200
                ));
            }
        });
        
        // ==========================================
        // FASE 4: EFEITOS VISUAIS ÉPICOS
        // ==========================================
        
        // Explosão central massiva
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            explosionX, explosionY, finalRadius, 1200, 'rgba(255, 255, 200, 0.95)'
        ));
        
        // Múltiplas ondas de choque
        for (let w = 0; w < 5; w++) {
            setTimeout(() => {
                this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                    explosionX, explosionY,
                    finalRadius * (0.4 + w * 0.15),
                    400
                ));
            }, w * 150);
        }
        
        // Raios de luz em todas direções
        for (let r = 0; r < 24; r++) {
            const angle = (Math.PI * 2 / 24) * r;
            const rayLength = finalRadius * 1.5;
            
            this.gameManager.effects.push(new this.gameManager.LaserEffect(
                explosionX,
                explosionY,
                explosionX + Math.cos(angle) * rayLength,
                explosionY + Math.sin(angle) * rayLength,
                8,
                'rgba(255, 255, 255, 0.8)',
                0.6
            ));
        }
        
        // Espiral de partículas douradas
        for (let i = 0; i < 60; i++) {
            const angle = (Math.PI * 2 / 60) * i;
            const particleDist = (i / 60) * finalRadius;
            const hue = 45 + (i % 20) * 3;
            
            setTimeout(() => {
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    explosionX + Math.cos(angle) * particleDist,
                    explosionY + Math.sin(angle) * particleDist,
                    20,
                    `hsl(${hue}, 100%, 70%)`,
                    800
                ));
            }, (i / 60) * 500);
        }
        
        // ==========================================
        // FASE 5: FINALIZAÇÃO
        // ==========================================
        
        // Consome todos os stacks
        this.stellarStacks = 0;
        
        // Coloca ultimate em cooldown
        this.abilities.solarExplosion.cooldown = data.solarExplosionCooldown;
        
        this.gameManager.showUI(`⭐ EXPLOSÃO SOLAR! ${finalDamage.toFixed(0)} de dano! ⭐`, 'ultimate');
        
        console.log(`💥 Explosão Solar ativada com ${stackBonus * 100}% de bônus dos stacks!`);
    }

    // 🔥💥 EXPLOSÃO DE SUPERAQUECIMENTO
    triggerOverheatExplosion() {
        const data = Champion.championData.karolinadean;
        
        // DANO MASSIVO EM ÁREA
        this.gameManager.enemies.forEach(enemy => {
            const dist = Math.hypot(
                this.getCenterX() - enemy.getCenterX(),
                this.getCenterY() - enemy.getCenterY()
            );
            
            if (dist < data.overheatExplosionRadius) {
                enemy.takeDamage(data.overheatExplosionDamage, this);
                
                // Chance de cegar
                if (Math.random() < this.blindChance) {
                    enemy.isBlinded = true;
                    enemy.blindEndTime = Date.now() + 3000;
                    enemy.damageMultiplier = (enemy.damageMultiplier || 1) * 0.5;
                }
            }
        });
        
        // EFEITO VISUAL ÉPICO
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.getCenterX(),
            this.getCenterY(),
            data.overheatExplosionRadius,
            1200,
            'rgba(255, 200, 0, 1)'
        ));
        
        // Ondas de choque múltiplas
        for (let w = 0; w < 4; w++) {
            setTimeout(() => {
                this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                    this.getCenterX(),
                    this.getCenterY(),
                    data.overheatExplosionRadius + w * 30,
                    400
                ));
            }, w * 150);
        }
        
        // Partículas solares
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 / 50) * i;
            const distance = 30 + Math.random() * 50;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.getCenterX() + Math.cos(angle) * distance,
                this.getCenterY() + Math.sin(angle) * distance,
                20,
                ['yellow', 'orange', 'red', 'white'][Math.floor(Math.random() * 4)],
                1000
            ));
        }
        
        // Zera o calor
        this.heatLevel = 0;
        
        this.gameManager.showUI('Karolina: EXPLOSÃO ESTELAR! 💥☀️', 'ultimate');
    }
    
    // 💥 DISPARA SUPERNOVA DIRECIONADA
    fireSupernova(targetX, targetY) {
        const data = Champion.championData.karolinadean;
        const angle = Math.atan2(targetY - this.getCenterY(), targetX - this.getCenterX());
        
        // Cria o laser de supernova
        const supernova = new SupernovaBeam(
            this.getCenterX(),
            this.getCenterY(),
            angle,
            data.supernovaDamage * (1 + this.damageBoostBuff),
            data.supernovaLength,
            data.supernovaWidth,
            data.supernovaDuration,
            this,
            this.gameManager
        );
        
        this.gameManager.supernovaBeams = this.gameManager.supernovaBeams || [];
        this.gameManager.supernovaBeams.push(supernova);
        
        this.supernovaAbilityCooldown = data.supernovaCooldown;
        this.gameManager.showUI('Karolina: SUPERNOVA DIRECIONADA! ☀️💥', 'ultimate');
    }

    startFlight(targetX, targetY) {
        this.isFlying = true;
        this.flyStartPos = { x: this.x, y: this.y };
        this.flyTargetPos = { x: targetX - this.width / 2, y: targetY - this.height / 2 };
        this.flyProgress = 0;
        this.wingsVisible = true;
        
        // Efeito de decolagem
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const hue = (this.rainbowHue + Math.random() * 60) % 360;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.getCenterX() + Math.cos(angle) * 20,
                this.getCenterY() + Math.sin(angle) * 20,
                15,
                `hsl(${hue}, 100%, 60%)`,
                800
            ));
        }
        
        this.gameManager.showUI('Karolina: Decolando! ✨', 'special');
    }
    
   /* getRandomRainbowColor() {
        const hue = (this.rainbowHue + Math.random() * 60) % 360;
        return `hsl(${hue}, 100%, 60%)`;
    } */

    getRandomRainbowColor() {
        const colors = ['red', 'orange', 'yellow', 'lime', 'cyan', 'blue', 'magenta', 'pink'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getDamage() {
        const data = Champion.championData.karolinadean;
        const heatBonus = this.heatLevel * data.heatDamageBonus;
        return data.dano * (1 + this.damageBoostBuff + heatBonus);
    }
    
    update(deltaTime, enemies, champions, projectiles, effects) {
        super.update(deltaTime, enemies, champions, projectiles, effects);
        
        const data = Champion.championData.karolinadean;
        
        // Rotação do arco-íris
        this.rainbowHue = (this.rainbowHue + 0.5) % 360;
        
        // 🔆 NOVO: Acumula Energia Estelar (Passiva)
        if (Date.now() - this.lastStellarStackTime >= this.stellarStackInterval) {
            if (this.stellarStacks < this.maxStellarStacks) {
                this.stellarStacks++;
                this.lastStellarStackTime = Date.now();
                
                // Efeito visual de ganhar stack
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.getCenterX(),
                    this.getCenterY(),
                    40,
                    'gold',
                    600
                ));
                
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    this.getCenterX(),
                    this.getCenterY() - 50,
                    `⭐ +1 STACK (${this.stellarStacks}/${this.maxStellarStacks})`,
                    'gold',
                    1000
                ));
                
                console.log(`⭐ Karolina ganhou stack! Total: ${this.stellarStacks}`);
            }
        }
        
        // 🔥 Sistema de Decaimento de Calor
        if (Date.now() - this.lastSkillUseTime > this.heatDecayDelay && this.heatLevel > 0) {
            this.heatDecayTimer += deltaTime;
            if (this.heatDecayTimer >= 1000) {
                this.heatLevel = Math.max(0, this.heatLevel - 1);
                this.heatDecayTimer = 0;
            }
        }
        
        // 👻 Atualiza Clones de Luz
        for (let i = this.lightClones.length - 1; i >= 0; i--) {
            const clone = this.lightClones[i];
            const elapsed = Date.now() - clone.spawnTime;
            
            // Remove se expirou
            if (elapsed > clone.duration) {
                // Efeito de desaparecimento
                for (let p = 0; p < 10; p++) {
                    const angle = (Math.PI * 2 / 10) * p;
                    this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                        clone.getCenterX() + Math.cos(angle) * 15,
                        clone.getCenterY() + Math.sin(angle) * 15,
                        10,
                        this.getRandomRainbowColor(),
                        400
                    ));
                }
                
                this.lightClones.splice(i, 1);
                continue;
            }
            
            // Fade out gradual
            clone.alpha = 0.7 * (1 - elapsed / clone.duration);
            
            // Clone ataca
            if (clone.lastAttackTime <= 0) {
                const targetEnemy = this.findNearestEnemy(enemies);
                if (targetEnemy) {
                    const beam = new KarolinaPrismBeam(
                        clone.getCenterX(),
                        clone.getCenterY(),
                        targetEnemy,
                        clone.damage,
                        this,
                        this.gameManager
                    );
                    
                    projectiles.push(beam);
                    clone.lastAttackTime = clone.attackSpeed;
                }
            } else {
                clone.lastAttackTime -= deltaTime;
            }
        }

        // 🚀 Atualiza Voo
        if (this.isFlying) {
            this.flyProgress += this.flySpeed * (deltaTime / 16.67);
            this.wingSpread = Math.min(1, this.wingSpread + 0.05);
            
            if (this.flyProgress >= 1) {
                // Pousa
                this.x = this.flyTargetPos.x;
                this.y = this.flyTargetPos.y;
                this.isFlying = false;
                this.flyProgress = 0;
                
                // Rajada ao pousar
                enemies.forEach(enemy => {
                    const dist = Math.hypot(
                        this.getCenterX() - enemy.getCenterX(),
                        this.getCenterY() - enemy.getCenterY()
                    );
                    
                    if (dist < data.landingBurstRadius) {
                        enemy.takeDamage(data.landingBurstDamage, this);
                        
                        // Chance de cegar
                        if (Math.random() < this.blindChance) {
                            enemy.isBlinded = true;
                            enemy.blindEndTime = Date.now() + 2000;
                            enemy.damageMultiplier = (enemy.damageMultiplier || 1) * 0.5;
                        }
                    }
                });
                
                // Efeito visual épico de pouso
                this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                    this.getCenterX(),
                    this.getCenterY(),
                    data.landingBurstRadius,
                    800,
                    'rgba(255, 100, 255, 0.8)'
                ));
                
                for (let i = 0; i < 30; i++) {
                    const angle = (Math.PI * 2 / 30) * i;
                    const hue = (this.rainbowHue + i * 12) % 360;
                    this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                        this.getCenterX() + Math.cos(angle) * 30,
                        this.getCenterY() + Math.sin(angle) * 30,
                        20,
                        `hsl(${hue}, 100%, 60%)`,
                        1000
                    ));
                }
                
                this.flightAbilityCooldown = data.flightCooldown;
                this.gameManager.showUI('Karolina: Aterrissagem! 💥', 'ultimate');
                
                // Fecha asas gradualmente
                setTimeout(() => {
                    this.wingsVisible = false;
                    this.wingSpread = 0;
                }, 1000);
            } else {
                // Interpola posição
                this.x = this.flyStartPos.x + (this.flyTargetPos.x - this.flyStartPos.x) * this.flyProgress;
                this.y = this.flyStartPos.y + (this.flyTargetPos.y - this.flyStartPos.y) * this.flyProgress;
                
                // Partículas de rastro durante o voo (reduzidas)
                if (Math.random() < 0.2) {
                    const hue = (this.rainbowHue + Math.random() * 60) % 360;
                    this.auraParticles.push({
                        x: this.getCenterX() + (Math.random() - 0.5) * 30,
                        y: this.getCenterY() + (Math.random() - 0.5) * 30,
                        size: 4 + Math.random() * 4,
                        color: `hsl(${hue}, 100%, 70%)`,
                        life: 1,
                        vx: (Math.random() - 0.5) * 3,
                        vy: Math.random() * 2 + 1
                    });
                }
            }
        }
        
        // Cooldown de voo
        if (this.flightAbilityCooldown > 0) {
            this.flightAbilityCooldown -= deltaTime;
        }

        if (this.supernovaAbilityCooldown > 0) {
            this.supernovaAbilityCooldown -= deltaTime;
        }
        
        // Atualiza fase de brilho
        this.glowPhase += deltaTime / 100;
        
        // Partículas de aura constantes (reduzidas para performance)
        /*if (Math.random() < 0.1) {
            const hue = (this.rainbowHue + Math.random() * 60) % 360;
            this.auraParticles.push({
                x: this.getCenterX() + (Math.random() - 0.5) * 50,
                y: this.getCenterY() + (Math.random() - 0.5) * 50,
                size: 3 + Math.random() * 4,
                color: `hsl(${hue}, 100%, 70%)`,
                life: 1,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 1
            });
        }
        */

        // Partículas de aura (intensificadas pelo calor)
        const particleChance = 0.1 + (this.heatLevel / this.maxHeat) * 0.3;
        if (Math.random() < particleChance) {
            this.auraParticles.push({
                x: this.getCenterX() + (Math.random() - 0.5) * 40,
                y: this.getCenterY() + (Math.random() - 0.5) * 40,
                size: 3 + Math.random() * 3 + this.heatLevel,
                color: this.heatLevel >= 3 ? ['orange', 'red', 'yellow'][Math.floor(Math.random() * 3)] : this.getRandomRainbowColor(),
                life: 1,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3
            });
        }

        // Atualiza partículas
        this.auraParticles = this.auraParticles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            return p.life > 0;
        });
        
        // 🛡️ ATUALIZA ESCUDOS SOLARES
        this.activeSolarShields = this.activeSolarShields.filter(shield => {
            const elapsed = Date.now() - shield.spawnTime;
            
            // Verifica expiração
            if (Date.now() > shield.endTime || shield.hp <= 0) {
                this.explodeSolarShield(shield);
                return false;
            }
            
            // Verifica se alvo ainda existe
            if (!shield.target || shield.target.hp <= 0) {
                this.explodeSolarShield(shield);
                return false;
            }
            
            // Atualiza animações
            shield.rotation += 0.02;
            shield.pulsePhase += 0.05;
            
            // Atualiza partículas
            shield.particles.forEach(p => {
                p.angle += p.speed;
            });
            
            // Bloqueia dano
            if (shield.target.lastDamageBlocked !== Date.now()) {
                // Marca para não bloquear múltiplas vezes no mesmo frame
                shield.target.isProtectedBySolarShield = true;
                shield.target.solarShieldRef = shield;
            }
            
            return true;
        });
        
        // Remove cegueira expirada dos inimigos
        enemies.forEach(enemy => {
            if (enemy.isBlinded && Date.now() > enemy.blindEndTime) {
                enemy.isBlinded = false;
                enemy.damageMultiplier = 1;
            }
        });
    }
    
    // 🛡️ Explosão do Escudo Solar
    explodeSolarShield(shield) {
        if (!shield.target) return;
        
        const data = Champion.championData.karolinadean;
        const explosionX = shield.target.getCenterX();
        const explosionY = shield.target.getCenterY();
        
        // Dano em área
        this.gameManager.enemies.forEach(enemy => {
            const dist = Math.hypot(explosionX - enemy.getCenterX(), explosionY - enemy.getCenterY());
            if (dist < data.solarShieldExplosionRadius) {
                enemy.takeDamage(data.solarShieldExplosionDamage, this);
            }
        });
        
        // Efeito visual da explosão
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            explosionX, explosionY,
            data.solarShieldExplosionRadius,
            800,
            'rgba(255, 215, 0, 0.9)'
        ));
        
        // Ondas de choque
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                    explosionX, explosionY,
                    data.solarShieldExplosionRadius * (0.6 + i * 0.2),
                    300
                ));
            }, i * 100);
        }
        
        // Partículas em todas direções
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 / 40) * i;
            const hue = 45 + Math.random() * 30;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                explosionX + Math.cos(angle) * 20,
                explosionY + Math.sin(angle) * 20,
                15,
                `hsl(${hue}, 100%, 60%)`,
                800
            ));
        }
        
        this.gameManager.showUI('Escudo Solar explodiu! 💥', 'special');
    }
    
    attack(enemies, projectiles, effects) {
        if (this.lastAttackTime > 0 || this.isFlying) return;
        
        const targetEnemy = this.findNearestEnemy(enemies);
        if (!targetEnemy) return;
        
        const data = Champion.championData.karolinadean;
        
        // 🔆 Calcula bônus dos stacks
        const damageBonus = 1 + (this.stellarStacks * data.stellarDamageBonus);
        
        // 🌈 Rajada Prismática (apenas 1 tiro)
        const beam = new KarolinaPrismBeam(
            this.getCenterX(),
            this.getCenterY(),
            targetEnemy,
            data.dano * damageBonus * (1 + this.damageBoostBuff),
            this,
            this.gameManager
        );
        
        projectiles.push(beam);
        this.lastAttackTime = this.cooldownBase * (1 - (this.attackSpeedBuff || 0));
    }
    
    draw(ctx, isSelected, mjolnirImage, capShieldImage, usagentShieldImage, wandaIllusionImage) {
        ctx.save();
        
        const time = Date.now() / 1000;
        
        // ===============================
        // AURA CÓSMICA ARCO-ÍRIS INTENSA
        // ===============================
        const glowSize = 70 + Math.sin(this.glowPhase) * 20;
        
        // Múltiplas camadas de aura arco-íris
        for (let layer = 3; layer >= 0; layer--) {
            const layerSize = glowSize * (1 - layer * 0.15);
            const layerAlpha = 0.4 - layer * 0.08;
            const hueOffset = layer * 30;
            
            const auraGradient = ctx.createRadialGradient(
                this.getCenterX(), this.getCenterY(), 0,
                this.getCenterX(), this.getCenterY(), layerSize
            );
            auraGradient.addColorStop(0, `hsla(${(this.rainbowHue + hueOffset) % 360}, 100%, 70%, ${layerAlpha})`);
            auraGradient.addColorStop(0.5, `hsla(${(this.rainbowHue + hueOffset + 60) % 360}, 100%, 60%, ${layerAlpha * 0.7})`);
            auraGradient.addColorStop(1, `hsla(${(this.rainbowHue + hueOffset + 120) % 360}, 100%, 50%, 0)`);
            
            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(this.getCenterX(), this.getCenterY(), layerSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // ===============================
        // ASAS DE ENERGIA MELHORADAS
        // ===============================
        if (this.wingsVisible && this.wingSpread > 0) {
            const wingSpan = 100 * this.wingSpread;
            const wingHeight = 80 * this.wingSpread;
            const wingPulse = Math.sin(time * 3) * 0.15 + 0.85;
            
            // ASA ESQUERDA
            ctx.save();
            ctx.translate(this.getCenterX(), this.getCenterY());
            ctx.rotate(-0.3);
            
            // Camadas de gradiente arco-íris
            for (let i = 0; i < 5; i++) {
                const layerSpan = wingSpan * (1 - i * 0.1);
                const layerHeight = wingHeight * (1 - i * 0.1);
                const hue = (this.rainbowHue + i * 20) % 360;
                
                const leftWingGradient = ctx.createLinearGradient(-layerSpan, 0, 0, 0);
                leftWingGradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0)`);
                leftWingGradient.addColorStop(0.5, `hsla(${hue}, 100%, 60%, ${0.5 * this.wingSpread * wingPulse})`);
                leftWingGradient.addColorStop(1, `hsla(${(hue + 60) % 360}, 100%, 50%, ${0.7 * this.wingSpread * wingPulse})`);
                
                ctx.fillStyle = leftWingGradient;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(-layerSpan * 0.7, -layerHeight, -layerSpan, -layerHeight * 0.5);
                ctx.quadraticCurveTo(-layerSpan * 0.8, 0, -layerSpan * 0.5, layerHeight * 0.3);
                ctx.quadraticCurveTo(-layerSpan * 0.3, layerHeight, 0, layerHeight * 0.4);
                ctx.closePath();
                ctx.fill();
            }
            
            // Penas de luz
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * this.wingSpread * wingPulse})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowBlur = 10;
            
            for (let i = 0; i < 8; i++) {
                const featherX = -wingSpan * (0.15 + i * 0.1);
                const featherHue = (this.rainbowHue + i * 15) % 360;
                ctx.strokeStyle = `hsla(${featherHue}, 100%, 80%, ${0.8 * this.wingSpread})`;
                
                ctx.beginPath();
                ctx.moveTo(featherX, -wingHeight * 0.9);
                ctx.lineTo(featherX * 0.9, wingHeight * 0.4);
                ctx.stroke();
            }
            
            ctx.shadowBlur = 0;
            ctx.restore();
            
            // ASA DIREITA
            ctx.save();
            ctx.translate(this.getCenterX(), this.getCenterY());
            ctx.rotate(0.3);
            
            // Camadas de gradiente arco-íris
            for (let i = 0; i < 5; i++) {
                const layerSpan = wingSpan * (1 - i * 0.1);
                const layerHeight = wingHeight * (1 - i * 0.1);
                const hue = (this.rainbowHue + 180 + i * 20) % 360;
                
                const rightWingGradient = ctx.createLinearGradient(0, 0, layerSpan, 0);
                rightWingGradient.addColorStop(0, `hsla(${(hue + 60) % 360}, 100%, 50%, ${0.7 * this.wingSpread * wingPulse})`);
                rightWingGradient.addColorStop(0.5, `hsla(${hue}, 100%, 60%, ${0.5 * this.wingSpread * wingPulse})`);
                rightWingGradient.addColorStop(1, `hsla(${hue}, 100%, 70%, 0)`);
                
                ctx.fillStyle = rightWingGradient;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(layerSpan * 0.7, -layerHeight, layerSpan, -layerHeight * 0.5);
                ctx.quadraticCurveTo(layerSpan * 0.8, 0, layerSpan * 0.5, layerHeight * 0.3);
                ctx.quadraticCurveTo(layerSpan * 0.3, layerHeight, 0, layerHeight * 0.4);
                ctx.closePath();
                ctx.fill();
            }
            
            // Penas de luz
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * this.wingSpread * wingPulse})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
            ctx.shadowBlur = 10;
            
            for (let i = 0; i < 8; i++) {
                const featherX = wingSpan * (0.15 + i * 0.1);
                const featherHue = (this.rainbowHue + 180 + i * 15) % 360;
                ctx.strokeStyle = `hsla(${featherHue}, 100%, 80%, ${0.8 * this.wingSpread})`;
                
                ctx.beginPath();
                ctx.moveTo(featherX, -wingHeight * 0.9);
                ctx.lineTo(featherX * 0.9, wingHeight * 0.4);
                ctx.stroke();
            }
            
            ctx.shadowBlur = 0;
            ctx.restore();
        }
        
        // ===============================
        // PARTÍCULAS DE AURA
        // ===============================
        this.auraParticles.forEach(p => {
            if (p.life > 0) {
                const particleGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                particleGradient.addColorStop(0, `${p.color.replace(')', `, ${p.life})`)}`);
                particleGradient.addColorStop(1, `${p.color.replace(')', ', 0)')}`);
                
                ctx.fillStyle = particleGradient;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });
        
        // ===============================
        // IMAGEM DO CHAMPION
        // ===============================
        if (this.image && this.image.complete) {
            ctx.globalAlpha = this.isFlying ? 0.8 : 1;
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            ctx.globalAlpha = 1;
        } else {
            // Fallback
            ctx.fillStyle = 'rgba(255, 100, 255, 0.8)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('KD', this.getCenterX(), this.getCenterY());
        }
        
        ctx.restore();
        
        // Chama o draw padrão para barra de HP, etc
        super.draw(ctx, isSelected, mjolnirImage, capShieldImage, usagentShieldImage, wandaIllusionImage);
        
              // ===============================
        // 🔥 BARRA DE CALOR
        // ===============================
        if (this.heatLevel > 0) {
            const barWidth = 40;
            const barHeight = 6;
            const barX = this.getCenterX() - barWidth / 2;
            const barY = this.y - 35;
            
            // Fundo
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Calor atual
            const heatPercent = this.heatLevel / this.maxHeat;
            const heatGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
            
            if (heatPercent < 0.5) {
                heatGradient.addColorStop(0, 'rgba(255, 200, 0, 0.9)');
                heatGradient.addColorStop(1, 'rgba(255, 150, 0, 0.9)');
            } else if (heatPercent < 0.8) {
                heatGradient.addColorStop(0, 'rgba(255, 100, 0, 0.9)');
                heatGradient.addColorStop(1, 'rgba(255, 50, 0, 0.9)');
            } else {
                heatGradient.addColorStop(0, 'rgba(255, 0, 0, 1)');
                heatGradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
            }
            
            ctx.fillStyle = heatGradient;
            ctx.fillRect(barX, barY, barWidth * heatPercent, barHeight);
            
            // Contorno
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            // Texto de calor
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 10px Arial';
              ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 100, 0, 1)';
            ctx.shadowBlur = 5;
            ctx.fillText(`🔥 ${this.heatLevel}/${this.maxHeat}`, this.getCenterX(), barY - 5);
            ctx.shadowBlur = 0;
        }
        
        // ===============================
        // INDICADORES DE COOLDOWN
        // ===============================
        let indicatorY = this.y - 45;
        
        if (this.flightAbilityCooldown > 0) {
            const cdText = (this.flightAbilityCooldown / 1000).toFixed(1);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 100, 255, 1)';
            ctx.shadowBlur = 8;
            ctx.fillText(`🚀 ${cdText}s`, this.getCenterX(), indicatorY);
            ctx.shadowBlur = 0;
            indicatorY -= 15;
        }
        
        if (this.supernovaAbilityCooldown > 0) {
            const cdText = (this.supernovaAbilityCooldown / 1000).toFixed(1);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 200, 0, 1)';
            ctx.shadowBlur = 8;
            ctx.fillText(`☀️ ${cdText}s`, this.getCenterX(), indicatorY);
            ctx.shadowBlur = 0;
        }
    


        // ===============================
        // 🔆 NOVO: INDICADOR DE STACKS DE ENERGIA ESTELAR
        // ===============================
        if (this.stellarStacks > 0) {
            const stackBarWidth = this.width;
            const stackBarHeight = 5;
            const stackBarX = this.x;
            const stackBarY = this.y - 45;
            
            // Fundo da barra
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(stackBarX, stackBarY, stackBarWidth, stackBarHeight);
            
            // Progresso dos stacks
            const stackProgress = this.stellarStacks / this.maxStellarStacks;
            const stackGradient = ctx.createLinearGradient(
                stackBarX, stackBarY,
                stackBarX + stackBarWidth * stackProgress, stackBarY
            );
            stackGradient.addColorStop(0, 'rgba(255, 215, 0, 1)');
            stackGradient.addColorStop(0.5, 'rgba(255, 245, 150, 1)');
            stackGradient.addColorStop(1, 'rgba(255, 255, 200, 1)');
            
            ctx.fillStyle = stackGradient;
            ctx.fillRect(stackBarX, stackBarY, stackBarWidth * stackProgress, stackBarHeight);
            
            // Brilho se estiver no máximo
            if (this.stellarStacks >= this.maxStellarStacks) {
                const pulseAlpha = 0.4 + Math.sin(Date.now() / 150) * 0.4;
                ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
                ctx.fillRect(stackBarX, stackBarY, stackBarWidth, stackBarHeight);
            }
            
            // Contorno
            ctx.strokeStyle = this.stellarStacks >= this.maxStellarStacks 
                ? 'rgba(255, 255, 0, 0.9)' 
                : 'rgba(255, 215, 0, 0.7)';
            ctx.lineWidth = 1;
            ctx.strokeRect(stackBarX, stackBarY, stackBarWidth, stackBarHeight);
            
            // Texto de stacks
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 215, 0, 1)';
            ctx.shadowBlur = 5;
            ctx.fillText(`⭐ ${this.stellarStacks}/${this.maxStellarStacks}`, this.getCenterX(), stackBarY - 2);
            ctx.shadowBlur = 0;
            
            // Bônus atual
            const damageBonus = (this.stellarStacks * Champion.championData.karolinadean.stellarDamageBonus * 100).toFixed(0);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.font = '9px Arial';
            ctx.fillText(`+${damageBonus}% dano`, this.getCenterX(), stackBarY + stackBarHeight + 10);
        }
        
        // ===============================
        // 🛡️ DESENHA ESCUDOS SOLARES
        // ===============================
        this.activeSolarShields.forEach(shield => {
            if (shield.target && shield.target.hp > 0) {
                const shieldX = shield.target.getCenterX();
                const shieldY = shield.target.getCenterY();
                
                ctx.save();
                ctx.translate(shieldX, shieldY);
                
                // Camada 1: Esfera dourada externa
                const outerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 70);
                outerGlow.addColorStop(0, `hsla(45, 100%, 60%, 0.3)`);
                outerGlow.addColorStop(0.7, `hsla(50, 100%, 50%, 0.1)`);
                outerGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
                ctx.fillStyle = outerGlow;
                ctx.beginPath();
                ctx.arc(0, 0, 70, 0, Math.PI * 2);
                ctx.fill();
                
                // Camada 2: Hexágonos rotativos
                ctx.rotate(shield.rotation);
                for (let i = 0; i < 6; i++) {
                    const hexAngle = (Math.PI / 3) * i;
                    ctx.save();
                    ctx.rotate(hexAngle);
                    ctx.translate(0, -50);
                    
                    const hexSize = 12;
                    const hexAlpha = 0.6 + Math.sin(shield.pulsePhase + i * 0.5) * 0.3;
                    
                    ctx.strokeStyle = `rgba(255, 215, 0, ${hexAlpha})`;
                    ctx.lineWidth = 2;
                    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                    ctx.shadowBlur = 10;
                    
                    ctx.beginPath();
                    for (let h = 0; h < 6; h++) {
                        const hAngle = (Math.PI / 3) * h;
                        const hx = Math.cos(hAngle) * hexSize;
                        const hy = Math.sin(hAngle) * hexSize;
                        if (h === 0) ctx.moveTo(hx, hy);
                        else ctx.lineTo(hx, hy);
                    }
                    ctx.closePath();
                    ctx.stroke();
                    
                    ctx.restore();
                }
                ctx.shadowBlur = 0;
                
                // Camada 3: Raios de luz
                shield.rays.forEach((ray, index) => {
                    const rayLength = ray.length * (1 + Math.sin(shield.pulsePhase + ray.pulseSpeed * index) * 0.3);
                    const rayAlpha = 0.5 + Math.sin(shield.pulsePhase + ray.pulseSpeed * index) * 0.3;
                    
                    ctx.save();
                    ctx.rotate(ray.angle + shield.rotation * 0.5);
                    
                    const rayGradient = ctx.createLinearGradient(0, 0, rayLength, 0);
                    rayGradient.addColorStop(0, `rgba(255, 255, 255, ${rayAlpha})`);
                    rayGradient.addColorStop(0.5, `rgba(255, 215, 0, ${rayAlpha * 0.7})`);
                    rayGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                    
                    ctx.strokeStyle = rayGradient;
                    ctx.lineWidth = ray.width;
                    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                    ctx.shadowBlur = 8;
                    
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(rayLength, 0);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                    
                    ctx.restore();
                });
                
                // Camada 4: Partículas orbitais
                shield.particles.forEach(p => {
                    const px = Math.cos(p.angle) * p.distance;
                    const py = Math.sin(p.angle) * p.distance;
                    
                    const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, p.size);
                    particleGradient.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${p.alpha})`);
                    particleGradient.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
                    
                    ctx.fillStyle = particleGradient;
                    ctx.shadowColor = `hsl(${p.hue}, 100%, 60%)`;
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(px, py, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                });
                
                // Camada 5: Núcleo central pulsante
                const coreSize = 25 + Math.sin(shield.pulsePhase) * 8;
                const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);
                coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
                coreGradient.addColorStop(0.4, 'rgba(255, 245, 150, 0.9)');
                coreGradient.addColorStop(0.7, 'rgba(255, 215, 0, 0.7)');
                coreGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
                
                ctx.fillStyle = coreGradient;
                ctx.shadowColor = 'rgba(255, 255, 255, 1)';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                
                // Camada 6: Barra de HP do escudo
                const barWidth = 50;
                const barHeight = 4;
                const barY = -70;
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
                
                const hpPercent = shield.hp / shield.maxHp;
                const hpBarGradient = ctx.createLinearGradient(-barWidth / 2, barY, -barWidth / 2 + barWidth * hpPercent, barY);
                hpBarGradient.addColorStop(0, 'rgba(255, 215, 0, 1)');
                hpBarGradient.addColorStop(1, 'rgba(255, 165, 0, 1)');
                
                ctx.fillStyle = hpBarGradient;
                ctx.fillRect(-barWidth / 2, barY, barWidth * hpPercent, barHeight);
                
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
                ctx.lineWidth = 1;
                ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
                
                // Ícone de escudo
                ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🛡️', 0, barY - 5);
                
                ctx.restore();
            }
        });
        
        // ===============================
        // INDICADOR DE VOO
        // ===============================
        if (this.flightAbilityCooldown > 0) {
            const cdText = (this.flightAbilityCooldown / 1000).toFixed(1);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = `hsl(${this.rainbowHue}, 100%, 60%)`;
            ctx.shadowBlur = 8;
            ctx.fillText(`🚀 ${cdText}s`, this.getCenterX(), this.y - 25);
            ctx.shadowBlur = 0;
        }
    }
}

// ==============================================
// 🃏 GAMBIT - MESTRE DAS CARTAS CINÉTICAS
// ==============================================
export class Gambit extends Champion {
    constructor(type, x, y, id, gameManager) {
        super(type, x, y, id, gameManager);
        
        const data = Champion.championData.gambit;
        
        // 🃏 Sistema de munição
        this.currentAmmo = data.maxAmmo;
        this.maxAmmo = data.maxAmmo;
        this.isReloading = false;
        this.reloadStartTime = 0;
        
        // ✨ Prestidigitação
        this.prestigitation = data.maxPrestidigitation;
        this.maxPrestigitation = data.maxPrestidigitation;
        this.prestigitationRechargeTimers = [0, 0, 0, 0]; // Timer individual por ponto
        
        // 🏏 Bayou Bash
        this.bashCooldown = 0;
        this.bashCharges = data.bashMaxCharges;
        this.lastBashTime = 0;
        this.bashChargeRecoveryTimer = 0;
        
        // 🏃 Ataque Cajun
        this.dashCooldown = 0;
        this.dashCharges = data.dashMaxCharges;
        this.lastDashTime = 0;
        this.dashChargeRecoveryTimer = 0;
        
        this.isDashing = false;
        this.dashStartTime = 0;
        this.dashEndX = 0;
        this.dashEndY = 0;
        this.dashStartX = 0;
        this.dashStartY = 0;
        this.dashAngle = 0;
        this.canEnhanceDash = false; // Flag para dash aprimorado

        this.targetX = x + 100;
        this.targetY = y;
        
        // 🏏 Bash automático
        this.autoBashEnabled = true;
        this.nearbyEnemyForBash = null;

        // 💚 Sistema de Corações Curativos
        this.heartsActive = false;
        this.heartsActivationTime = 0;
        this.heartsWindow = 6000; // 6 segundos
        this.heartsRegenRate = 5; // HP/s durante Corações
        this.heartsSubAbilityUsed = false;
        
        // Cooldowns
        this.heartsCooldown = 0;
        this.boostBridgeCooldown = 0;
        this.purifyingGatherCooldown = 0;

        // ⚔️ Sistema de Quebrando Espadas
        this.swordsActive = false;
        this.swordsActivationTime = 0;
        this.swordsWindow = 6000; // 6 segundos
        this.swordsDamageBoost = 0.15; // 15%
        this.swordsSubAbilityUsed = false;
        
        // Cooldowns de Espadas
        this.swordsCooldown = 0;
        this.explosiveTrickCooldown = 0;
        this.thrustBarrageCooldown = 0;
        
        console.log('🃏 Gambit criado!');
    }
    
    update(deltaTime, enemies, champions, projectiles, effects) {
        super.update(deltaTime, enemies, champions, projectiles, effects);
        
        const data = Champion.championData.gambit;
        
        // ✨ Recarrega Prestidigitação
        for (let i = 0; i < 4; i++) {
            if (this.prestigitation < this.maxPrestigitation && this.prestigitationRechargeTimers[i] <= 0) {
                this.prestigitationRechargeTimers[i] = data.prestigitationRechargeTime;
            }
            
            if (this.prestigitationRechargeTimers[i] > 0) {
                this.prestigitationRechargeTimers[i] -= deltaTime;
                
                if (this.prestigitationRechargeTimers[i] <= 0 && this.prestigitation < this.maxPrestigitation) {
                    this.prestigitation++;
                    this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                        this.getCenterX(),
                        this.getCenterY() - 40,
                        '🃏 +1',
                        'magenta',
                        600
                    ));
                }
            }
        }
        
        // 🔄 Recarga de munição
        if (this.isReloading) {
            if (Date.now() - this.reloadStartTime >= data.reloadTime) {
                this.currentAmmo = this.maxAmmo;
                this.isReloading = false;
                this.gameManager.showUI('Gambit: Munição recarregada! 🃏', 'success');
            }
        }
        
        // 🏏 Cooldowns do Bash
        if (this.bashCooldown > 0) {
            this.bashCooldown -= deltaTime;
        }
        
        if (this.bashCharges < data.bashMaxCharges) {
            this.bashChargeRecoveryTimer += deltaTime;
            if (this.bashChargeRecoveryTimer >= data.bashCooldown) {
                this.bashCharges++;
                this.bashChargeRecoveryTimer = 0;
            }
        }
        
        // 🏃 Cooldowns do Dash
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
        }
        
        if (this.dashCharges < data.dashMaxCharges) {
            this.dashChargeRecoveryTimer += deltaTime;
            if (this.dashChargeRecoveryTimer >= data.dashCooldown) {
                this.dashCharges++;
                this.dashChargeRecoveryTimer = 0;
            }
        }
        
        // ⏱️ Janela de aprimoramento do Dash
        if (this.canEnhanceDash && Date.now() - this.lastDashTime > data.bashEnhanceWindow) {
            this.canEnhanceDash = false;
        }
        
        // 🏃 Atualiza movimento do Dash
        if (this.isDashing) {
            const elapsed = Date.now() - this.dashStartTime;
            const duration = this.dashDistance / data.dashSpeed * 1000;
            
            if (elapsed >= duration) {
                this.isDashing = false;
                this.x = this.dashEndX - this.width / 2;
                this.y = this.dashEndY - this.height / 2;
            } else {
                const progress = elapsed / duration;
                this.x = this.dashStartX + (this.dashEndX - this.dashStartX) * progress - this.width / 2;
                this.y = this.dashStartY + (this.dashEndY - this.dashStartY) * progress - this.height / 2;
                
                // 💥 Dano/Cura durante dash aprimorado
                if (this.isDashEnhanced) {
                    enemies.forEach(enemy => {
                        const dist = Math.hypot(this.getCenterX() - enemy.getCenterX(), this.getCenterY() - enemy.getCenterY());
                        if (dist < 50 && !this.dashHitEnemies.includes(enemy.id)) {
                            enemy.takeDamage(data.dashDamage, this);
                            this.dashHitEnemies.push(enemy.id);
                            
                            this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                                enemy.getCenterX(),
                                enemy.getCenterY() - 20,
                                `${data.dashDamage}`,
                                'magenta',
                                600
                            ));
                        }
                    });
                    
                    champions.forEach(ally => {
                        const dist = Math.hypot(this.getCenterX() - ally.getCenterX(), this.getCenterY() - ally.getCenterY());
                        if (dist < 50 && ally.hp < ally.maxHp && !this.dashHitAllies.includes(ally.id)) {
                            ally.hp = Math.min(ally.maxHp, ally.hp + data.dashHeal);
                            this.dashHitAllies.push(ally.id);
                            
                            this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                                ally.getCenterX(),
                                ally.getCenterY() - 20,
                                `+${data.dashHeal}`,
                                'lime',
                                600
                            ));
                        }
                    });
                }
            }
        }
        
        // 🏏 Bash automático se inimigo próximo
        if (this.autoBashEnabled && !this.isDashing) {
            this.nearbyEnemyForBash = null;
            let closestDist = data.bashRadius;
            
            enemies.forEach(enemy => {
                const dist = Math.hypot(this.getCenterX() - enemy.getCenterX(), this.getCenterY() - enemy.getCenterY());
                if (dist < closestDist) {
                    closestDist = dist;
                    this.nearbyEnemyForBash = enemy;
                }
            });
            
            if (this.nearbyEnemyForBash && this.bashCharges > 0 && this.bashCooldown <= 0) {
                this.useBayouBash(enemies, champions, effects);
            }
        }
    // 💚 SISTEMA DE CORAÇÕES CURATIVOS
    if (this.heartsActive) {
        const elapsed = Date.now() - this.heartsActivationTime;
        
        // Regeneração de vida durante Corações
        if (this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + this.heartsRegenRate * (deltaTime / 1000));
        }
        
        // Encerra janela após 6 segundos
        if (elapsed > this.heartsWindow) {
            this.heartsActive = false;
            this.heartsSubAbilityUsed = false;
            this.gameManager.showUI('Gambit: Janela de Corações encerrada.', 'info');
        }
    }
    
    // ⚔️ SISTEMA DE QUEBRANDO ESPADAS
    if (this.swordsActive) {
        const elapsed = Date.now() - this.swordsActivationTime;
        
        // Encerra janela após 6 segundos
        if (elapsed > this.swordsWindow) {
            this.swordsActive = false;
            this.swordsSubAbilityUsed = false;
            
            // Remove buff de dano
            this.damageBoostBuff = Math.max(0, this.damageBoostBuff - this.swordsDamageBoost);
            
            this.gameManager.showUI('Gambit: Janela de Espadas encerrada.', 'info');
        }
    }
    
    // Cooldowns das habilidades de Corações
    if (this.heartsCooldown > 0) this.heartsCooldown -= deltaTime;
    if (this.boostBridgeCooldown > 0) this.boostBridgeCooldown -= deltaTime;
    if (this.purifyingGatherCooldown > 0) this.purifyingGatherCooldown -= deltaTime;
    
    // Cooldowns das habilidades de Espadas
    if (this.swordsCooldown > 0) this.swordsCooldown -= deltaTime;
    if (this.explosiveTrickCooldown > 0) this.explosiveTrickCooldown -= deltaTime;
    if (this.thrustBarrageCooldown > 0) this.thrustBarrageCooldown -= deltaTime;
    }
    
attack(enemies, projectiles, effects) {
    if (this.isStunned || this.isConfused || this.isDashing || this.nearbyEnemyForBash) return;
    
    const data = Champion.championData.gambit;
    
    // Recarga automática
    if (this.currentAmmo === 0 && !this.isReloading) {
        this.isReloading = true;
        this.reloadStartTime = Date.now();
        this.gameManager.showUI('Gambit: Recarregando... 🔄', 'warning');
        return;
    }
    
    if (this.isReloading || this.currentAmmo === 0) return;
    
    if (this.lastAttackTime <= 0) {
        // 🎯 Calcula ângulo até o mouse
        const angle = Math.atan2(this.targetY - this.getCenterY(), this.targetX - this.getCenterX());
        
        // ⚔️ Calcula dano (com buff de Espadas se ativo)
        let cardDamage = data.dano;
        if (this.swordsActive) {
            cardDamage *= (1 + this.swordsDamageBoost);
        }
        cardDamage *= (1 + this.damageBoostBuff);

        // Dispara 2 cartas com dispersão
        for (let i = 0; i < data.cardsPerShot; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * data.cardSpread;
            
            const card = new GambitCard(
                this.getCenterX(),
                this.getCenterY(),
                Math.cos(spreadAngle) * data.cardSpeed,
                Math.sin(spreadAngle) * data.cardSpeed,
                data.dano,
                data.cardHeal,
                this,
                this.gameManager
            );
            
            projectiles.push(card);
            
            // ✨ Efeito de lançamento (muda cor se Espadas ativo)
            const effectColor = this.swordsActive ? 'orange' : 'magenta';
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.getCenterX() + Math.cos(spreadAngle) * 15,
                this.getCenterY() + Math.sin(spreadAngle) * 15,
                15,
                effectColor,
                400
            ));
        }

        
        // ✨ Flash no Gambit ao disparar
        const flashColor = this.swordsActive ? 'orange' : 'magenta';
        this.gameManager.effects.push(new this.gameManager.BamfEffect(
            this.getCenterX(),
            this.getCenterY(),
            flashColor,
            200
        ));
        
        this.currentAmmo--;
        this.lastAttackTime = data.cooldownBase;
    }
}
    /*  attack(enemies, projectiles, effects) {
        if (this.isStunned || this.isConfused || this.isDashing || this.nearbyEnemyForBash) return;
        
        const data = Champion.championData.gambit;
        
        // Recarga automática
        if (this.currentAmmo === 0 && !this.isReloading) {
            this.isReloading = true;
            this.reloadStartTime = Date.now();
            this.gameManager.showUI('Gambit: Recarregando... 🔄', 'warning');
            return;
        }
        
        if (this.isReloading || this.currentAmmo === 0) return;
        
        if (this.cooldown <= 0) {
            // 🎯 Atira na direção do mouse
            const angle = Math.atan2(this.targetY - this.getCenterY(), this.targetX - this.getCenterX());
            
            // Dispara 2 cartas com dispersão
            for (let i = 0; i < data.cardsPerShot; i++) {
                const spreadAngle = angle + (Math.random() - 0.5) * data.cardSpread;
                
                const card = new GambitCard(
                    this.getCenterX(),
                    this.getCenterY(),
                    Math.cos(spreadAngle) * data.cardSpeed,
                    Math.sin(spreadAngle) * data.cardSpeed,
                    data.dano,
                    data.cardHeal,
                    this,
                    this.gameManager
                );
                
                projectiles.push(card);
            }
            
            this.currentAmmo--;
            this.cooldown = data.cooldownBase;
        }
    }
        */
useBayouBash(enemies, champions, effects) {
    if (this.bashCharges <= 0 || this.bashCooldown > 0) return;
    
    const data = Champion.championData.gambit;
    
    // 💥 Se foi usado logo após Dash, aprimora
    const isEnhanced = this.canEnhanceDash;
    this.canEnhanceDash = false;
    
    // ⚔️ Calcula dano (com buff de Espadas se ativo)
    let bashDamage = data.bashDamage;
    if (this.swordsActive) {
        bashDamage *= (1 + this.swordsDamageBoost);
    }
    if (isEnhanced) {
        bashDamage *= 1.5;
    }
    
    let bashHeal = isEnhanced ? data.bashHeal * 1.5 : data.bashHeal;
    const bashRadius = isEnhanced ? data.bashRadius * 1.3 : data.bashRadius;
    
    // ✨ EFEITOS VISUAIS (muda cor se Espadas ativo)
    const effectColor = this.swordsActive 
        ? 'rgba(255, 100, 0, 0.9)' 
        : (isEnhanced ? 'rgba(255, 100, 255, 0.9)' : 'rgba(255, 0, 255, 0.8)');
    
    // Explosão central massiva
    this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
        this.getCenterX(),
        this.getCenterY(),
        bashRadius,
        isEnhanced ? 800 : 500,
        effectColor
    ));
    
    // Ondas de choque múltiplas
    const shockwaveCount = isEnhanced ? 5 : 3;
    for (let i = 0; i < shockwaveCount; i++) {
        setTimeout(() => {
            this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                this.getCenterX(),
                this.getCenterY(),
                bashRadius * (0.6 + i * 0.15),
                400
            ));
        }, i * 120);
    }
    
    // Partículas explosivas em todas direções
    const particleCount = isEnhanced ? 30 : 20;
    const particleColor = this.swordsActive ? 'orange' : 'magenta';
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 / particleCount) * i;
        const distance = 20 + Math.random() * 30;
        this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
            this.getCenterX() + Math.cos(angle) * distance,
            this.getCenterY() + Math.sin(angle) * distance,
            isEnhanced ? 20 : 15,
            particleColor,
            isEnhanced ? 1000 : 700
        ));
    }
    
    // Raios de energia (se aprimorado)
    if (isEnhanced) {
        for (let r = 0; r < 12; r++) {
            const rayAngle = (Math.PI * 2 / 12) * r;
            const rayColor = this.swordsActive ? 'rgba(255, 100, 0, 0.8)' : 'rgba(255, 100, 255, 0.8)';
            
            this.gameManager.effects.push(new this.gameManager.LaserEffect(
                this.getCenterX(),
                this.getCenterY(),
                this.getCenterX() + Math.cos(rayAngle) * bashRadius,
                this.getCenterY() + Math.sin(rayAngle) * bashRadius,
                5,
                rayColor,
                0.3
            ));
        }
    }
    
    // Dano em área
    enemies.forEach(enemy => {
        const dist = Math.hypot(this.getCenterX() - enemy.getCenterX(), this.getCenterY() - enemy.getCenterY());
        if (dist < bashRadius) {
            enemy.takeDamage(bashDamage, this);
            
            const damageText = isEnhanced 
                ? `${bashDamage.toFixed(0)} 🔨⚡` 
                : (this.swordsActive ? `${bashDamage.toFixed(0)} 🔨🔥` : `${bashDamage.toFixed(0)} 🔨`);
            
            this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                enemy.getCenterX(),
                enemy.getCenterY() - 20,
                damageText,
                isEnhanced ? 'white' : (this.swordsActive ? 'orange' : 'magenta'),
                800
            ));
        }
    });
    
    // Cura aliados
    champions.forEach(ally => {
        const dist = Math.hypot(this.getCenterX() - ally.getCenterX(), this.getCenterY() - ally.getCenterY());
        if (dist < bashRadius && ally.hp < ally.maxHp) {
            ally.hp = Math.min(ally.maxHp, ally.hp + bashHeal);
            
            this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                ally.getCenterX(),
                ally.getCenterY() - 20,
                isEnhanced ? `+${bashHeal.toFixed(0)} 💚⚡` : `+${bashHeal.toFixed(0)}`,
                'lime',
                800
            ));
            
            // Partículas de cura
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 / 6) * i;
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    ally.getCenterX() + Math.cos(angle) * 20,
                    ally.getCenterY() + Math.sin(angle) * 20,
                    12,
                    'lime',
                    600
                ));
            }
        }
    });
    
    this.bashCharges--;
    this.bashCooldown = data.bashCooldown;
    this.bashChargeRecoveryTimer = 0;
    
    const message = isEnhanced 
        ? 'Gambit: Bayou Bash APRIMORADO! 💥⚡' 
        : (this.swordsActive ? 'Gambit: Bayou Bash FLAMEJANTE! 🔨🔥' : 'Gambit: Bayou Bash! 🔨');
    
    this.gameManager.showUI(message, isEnhanced ? 'ultimate' : 'special');
}
    
// 💚 ATIVA CORAÇÕES CURATIVOS
activateHealingHearts() {
    const data = Champion.championData.gambit;
    
    if (this.prestigitation < 1) {
        this.gameManager.showUI('Gambit: Sem Prestidigitação! 💚', 'warning');
        return false;
    }
    
    if (this.heartsCooldown > 0) {
        const cdLeft = (this.heartsCooldown / 1000).toFixed(1);
        this.gameManager.showUI(`Gambit: Corações em cooldown (${cdLeft}s)`, 'warning');
        return false;
    }
    
    this.heartsActive = true;
    this.heartsActivationTime = Date.now();
    this.heartsSubAbilityUsed = false;
    this.prestigitation--;
    this.heartsCooldown = data.heartsBaseCooldown;
    
    // ✨ EFEITOS VISUAIS ÉPICOS
    
    // Explosão rosa/verde inicial
    this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
        this.getCenterX(),
        this.getCenterY(),
        80,
        600,
        'rgba(255, 100, 200, 0.8)'
    ));
    
    // Ondas de cura
    for (let i = 0; i < 4; i++) {
        setTimeout(() => {
            this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                this.getCenterX(),
                this.getCenterY(),
                50 + i * 25,
                400
            ));
        }, i * 150);
    }
    
    // Partículas de coração em círculo
    for (let i = 0; i < 16; i++) {
        const angle = (Math.PI * 2 / 16) * i;
        this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
            this.getCenterX() + Math.cos(angle) * 40,
            this.getCenterY() + Math.sin(angle) * 40,
            18,
            ['pink', 'lime', 'white'][i % 3],
            1200
        ));
    }
    
    // Texto flutuante com instruções
    this.gameManager.effects.push(new this.gameManager.TextPopEffect(
        this.getCenterX(),
        this.getCenterY() - 50,
        '💚 CORAÇÕES ATIVOS',
        'lime',
        1500
    ));
    
    setTimeout(() => {
        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
            this.getCenterX(),
            this.getCenterY() - 40,
            'Tecla 1: Ponte | Tecla 2: Captação',
            'white',
            5000
        ));
    }, 500);
    
    this.gameManager.showUI('Gambit: Corações Curativos! 💚 [Tecla 1 ou 2]', 'ultimate');
    return true;
}

// 💚 PONTE DE REFORÇO (Tecla 2 + Tecla 1)
activateBoostBridge() {
    const data = Champion.championData.gambit;
    
    if (!this.heartsActive || this.heartsSubAbilityUsed) {
        return false;
    }
    
    if (this.prestigitation < 1) {
        this.gameManager.showUI('Gambit: Sem Prestidigitação!', 'warning');
        return false;
    }
    
    // Busca aliado mais próximo que precise de cura
    let targetAlly = null;
    let closestDist = Infinity;
    
    this.gameManager.champions.forEach(ally => {
        if (ally.id !== this.id && ally.hp > 0 && ally.hp < ally.maxHp) {
            const dist = Math.hypot(this.getCenterX() - ally.getCenterX(), this.getCenterY() - ally.getCenterY());
            if (dist < closestDist && dist < 300) {
                closestDist = dist;
                targetAlly = ally;
            }
        }
    });
    
    if (!targetAlly) {
        this.gameManager.showUI('Gambit: Nenhum aliado próximo para curar!', 'warning');
        return false;
    }
    
    // ✨ EFEITOS VISUAIS ÉPICOS DE LANÇAMENTO
    
    // Explosão inicial rosa
    this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
        this.getCenterX(),
        this.getCenterY(),
        50,
        400,
        'rgba(255, 100, 200, 0.9)'
    ));
    
    // Partículas em espiral
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i;
        this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
            this.getCenterX() + Math.cos(angle) * 25,
            this.getCenterY() + Math.sin(angle) * 25,
            12,
            'pink',
            600
        ));
    }
    
    // Cria carta de cura ricocheteante
    const healingCard = new GambitHealingCard(
        this.getCenterX(),
        this.getCenterY(),
        targetAlly,
        data.boostBridgeHeal,
        data.boostBridgeBounces,
        data.boostBridgeHealBonus,
        data.boostBridgeBuffDuration,
        this,
        this.gameManager
    );
    
    this.gameManager.projectiles.push(healingCard);
    
    this.prestigitation--;
    this.heartsSubAbilityUsed = true;
    this.heartsActive = false;
    this.boostBridgeCooldown = data.boostBridgeCooldown;
    
    this.gameManager.showUI('Gambit: Ponte de Reforço! 💚', 'ultimate');
    return true;
}

// 💚 CAPTAÇÃO PURIFICADORA (Tecla 2 + Tecla 2)
activatePurifyingGather() {
    const data = Champion.championData.gambit;
    
    if (!this.heartsActive || this.heartsSubAbilityUsed) {
        return false;
    }
    
    if (this.prestigitation < 1) {
        this.gameManager.showUI('Gambit: Sem Prestidigitação!', 'warning');
        return false;
    }
    
    // ✨ EFEITOS VISUAIS ÉPICOS
    
    // Explosão central massiva
    this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
        this.getCenterX(),
        this.getCenterY(),
        data.purifyingGatherRadius,
        800,
        'rgba(0, 255, 200, 0.9)'
    ));
    
    // Múltiplas ondas de choque
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                this.getCenterX(),
                this.getCenterY(),
                data.purifyingGatherRadius * (0.5 + i * 0.15),
                400
            ));
        }, i * 100);
    }
    
    // 💚 CURA EM ÁREA (ALIADOS)
    this.gameManager.champions.forEach(ally => {
        const dist = Math.hypot(this.getCenterX() - ally.getCenterX(), this.getCenterY() - ally.getCenterY());
        
        if (dist < data.purifyingGatherRadius && ally.hp > 0) {
            // Cura
            const healAmount = data.purifyingGatherHeal;
            ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
            
            // Remove todos os debuffs
            ally.isStunned = false;
            ally.isSlowed = false;
            ally.isConfused = false;
            ally.isBlinded = false;
            ally.bleedEndTime = 0;
            ally.bleedDamagePerTick = 0;
            ally.poisonEndTime = 0;
            ally.burnEndTime = 0;
            
            // Efeito visual de cura + purificação
            this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                ally.getCenterX(),
                ally.getCenterY() - 30,
                `+${healAmount} ✨`,
                'cyan',
                800
            ));
            
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                ally.getCenterX(),
                ally.getCenterY(),
                50,
                'cyan',
                800
            ));
            
            // Partículas de purificação
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    ally.getCenterX() + Math.cos(angle) * 30,
                    ally.getCenterY() + Math.sin(angle) * 30,
                    12,
                    'white',
                    600
                ));
            }
        }
    });
    
    // 💥 DANO EM ÁREA (INIMIGOS)
    this.gameManager.enemies.forEach(enemy => {
        const dist = Math.hypot(this.getCenterX() - enemy.getCenterX(), this.getCenterY() - enemy.getCenterY());
        
        if (dist < data.purifyingGatherRadius) {
            const damage = data.purifyingGatherDamage;
            enemy.takeDamage(damage, this);
            
            this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                enemy.getCenterX(),
                enemy.getCenterY() - 20,
                `${damage}`,
                'red',
                600
            ));
        }
    });
    
    // Dispara 12 cartas em círculo (visual extra)
    const cardCount = 12;
    for (let i = 0; i < cardCount; i++) {
        const angle = (Math.PI * 2 / cardCount) * i;
        
        const card = new GambitPurifyCard(
            this.getCenterX(),
            this.getCenterY(),
            Math.cos(angle) * 600,
            Math.sin(angle) * 600,
            0, // Sem cura adicional (já aplicou)
            this,
            this.gameManager
        );
        
        this.gameManager.projectiles.push(card);
    }
    
    // Raios de energia em todas direções
    for (let r = 0; r < 16; r++) {
        const rayAngle = (Math.PI * 2 / 16) * r;
        this.gameManager.effects.push(new this.gameManager.LaserEffect(
            this.getCenterX(),
            this.getCenterY(),
            this.getCenterX() + Math.cos(rayAngle) * data.purifyingGatherRadius,
            this.getCenterY() + Math.sin(rayAngle) * data.purifyingGatherRadius,
            6,
            'rgba(0, 255, 200, 0.8)',
            0.4
        ));
    }
    
    this.prestigitation--;
    this.heartsSubAbilityUsed = true;
    this.heartsActive = false;
    this.purifyingGatherCooldown = data.purifyingGatherCooldown;
    
    this.gameManager.showUI('Gambit: Captação Purificadora! 💚💥', 'ultimate');
    return true;
}

// ⚔️ ATIVA QUEBRANDO ESPADAS
activateBreakingSwords() {
    const data = Champion.championData.gambit;
    
    if (this.prestigitation < 2) {
        this.gameManager.showUI('Gambit: Precisa de 2 Prestidigitação! ⚔️', 'warning');
        return false;
    }
    
    if (this.swordsCooldown > 0) {
        const cdLeft = (this.swordsCooldown / 1000).toFixed(1);
        this.gameManager.showUI(`Gambit: Espadas em cooldown (${cdLeft}s)`, 'warning');
        return false;
    }
    
    this.swordsActive = true;
    this.swordsActivationTime = Date.now();
    this.swordsSubAbilityUsed = false;
    this.prestigitation -= 2;
    this.swordsCooldown = data.swordsBaseCooldown;
    
    // Aplica buff de dano
    this.damageBoostBuff += this.swordsDamageBoost;
    
    // ✨ EFEITOS VISUAIS ÉPICOS E ÚNICOS
    
    // Explosão vermelha/laranja inicial
    this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
        this.getCenterX(),
        this.getCenterY(),
        100,
        800,
        'rgba(255, 50, 0, 0.9)'
    ));
    
    // Múltiplas ondas de choque em cruz
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                this.getCenterX(),
                this.getCenterY(),
                60 + i * 30,
                500
            ));
        }, i * 120);
    }
    
    // Raios de espadas em 8 direções
    for (let d = 0; d < 8; d++) {
        const swordAngle = (Math.PI * 2 / 8) * d;
        const swordLength = 80;
        
        setTimeout(() => {
            this.gameManager.effects.push(new this.gameManager.LaserEffect(
                this.getCenterX(),
                this.getCenterY(),
                this.getCenterX() + Math.cos(swordAngle) * swordLength,
                this.getCenterY() + Math.sin(swordAngle) * swordLength,
                8,
                'rgba(255, 100, 0, 0.9)',
                0.5
            ));
        }, d * 50);
    }
    
    // Partículas de espadas voando em espiral
    for (let i = 0; i < 24; i++) {
        const angle = (Math.PI * 2 / 24) * i;
        const distance = 20 + (i % 3) * 15;
        
        setTimeout(() => {
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.getCenterX() + Math.cos(angle) * distance,
                this.getCenterY() + Math.sin(angle) * distance,
                20,
                ['red', 'orange', 'yellow', 'white'][i % 4],
                1200
            ));
        }, i * 40);
    }
    
    // Círculo de fogo ao redor
    const fireCircleRadius = 70;
    for (let f = 0; f < 16; f++) {
        const fireAngle = (Math.PI * 2 / 16) * f;
        this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
            this.getCenterX() + Math.cos(fireAngle) * fireCircleRadius,
            this.getCenterY() + Math.sin(fireAngle) * fireCircleRadius,
            25,
            'orange',
            1500
        ));
    }
    
    // Texto flutuante com instruções
    this.gameManager.effects.push(new this.gameManager.TextPopEffect(
        this.getCenterX(),
        this.getCenterY() - 60,
        '⚔️ ESPADAS ATIVAS (+15% DANO)',
        'red',
        1500
    ));
    
    setTimeout(() => {
        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
            this.getCenterX(),
            this.getCenterY() - 50,
            'Tecla 1: Truque | Tecla 2: Barragem',
            'white',
            5000
        ));
    }, 600);
    
    this.gameManager.showUI('Gambit: Quebrando Espadas! ⚔️ [Tecla 1 ou 2]', 'ultimate');
    return true;
}

// ⚔️ TRUQUE EXPLOSIVO (Tecla 3 + Tecla 1)
activateExplosiveTrick() {
    const data = Champion.championData.gambit;
    
    if (!this.swordsActive || this.swordsSubAbilityUsed) {
        return false;
    }
    
    // Calcula ângulo até o mouse
    const angle = Math.atan2(this.targetY - this.getCenterY(), this.targetX - this.getCenterX());
    
    // ✨ EFEITOS VISUAIS ÉPICOS DE LANÇAMENTO
    
    // Flash inicial
    this.gameManager.effects.push(new this.gameManager.BamfEffect(
        this.getCenterX(),
        this.getCenterY(),
        'red',
        300
    ));
    
    // Explosão na origem
    this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
        this.getCenterX(),
        this.getCenterY(),
        70,
        500,
        'rgba(255, 100, 0, 0.9)'
    ));
    
    // Cone de dano frontal
    const coneRange = data.explosiveTrickRange;
    const coneAngle = data.explosiveTrickConeAngle;
    
    // Raios do cone
    for (let r = 0; r < 12; r++) {
        const raySpread = (coneAngle / 12) * r - coneAngle / 2;
        const rayAngle = angle + raySpread;
        
        this.gameManager.effects.push(new this.gameManager.LaserEffect(
            this.getCenterX(),
            this.getCenterY(),
            this.getCenterX() + Math.cos(rayAngle) * coneRange,
            this.getCenterY() + Math.sin(rayAngle) * coneRange,
            10,
            'rgba(255, 50, 0, 0.8)',
            0.4
        ));
    }
    
    // Ondas ao longo do cone
    for (let w = 0; w < 4; w++) {
        const waveDistance = (coneRange / 4) * (w + 1);
        const waveX = this.getCenterX() + Math.cos(angle) * waveDistance;
        const waveY = this.getCenterY() + Math.sin(angle) * waveDistance;
        
        setTimeout(() => {
            this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                waveX,
                waveY,
                60 + w * 20,
                400
            ));
        }, w * 80);
    }
    
    // Partículas explosivas ao longo do cone
    for (let p = 0; p < 30; p++) {
        const particleDistance = Math.random() * coneRange;
        const particleSpread = (Math.random() - 0.5) * coneAngle;
        const particleAngle = angle + particleSpread;
        
        const px = this.getCenterX() + Math.cos(particleAngle) * particleDistance;
        const py = this.getCenterY() + Math.sin(particleAngle) * particleDistance;
        
        this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
            px, py, 18,
            ['red', 'orange', 'yellow'][p % 3],
            800
        ));
    }
    
    // Aplica dano e debuff aos inimigos no cone
    this.gameManager.enemies.forEach(enemy => {
        const enemyCx = enemy.getCenterX();
        const enemyCy = enemy.getCenterY();
        const dist = Math.hypot(enemyCx - this.getCenterX(), enemyCy - this.getCenterY());
        
        if (dist < coneRange) {
            let angleToEnemy = Math.atan2(
                enemyCy - this.getCenterY(), 
                enemyCx - this.getCenterX()
            );
            let angleDiff = Math.abs(angle - angleToEnemy);
            
            if (angleDiff > Math.PI) {
                angleDiff = 2 * Math.PI - angleDiff;
            }
            
            if (angleDiff < coneAngle / 2) {
                // Dano (com buff de Espadas)
                const damage = data.explosiveTrickDamage * (1 + this.swordsDamageBoost);
                enemy.takeDamage(damage, this);
                
                // Aplica debuff de redução de cura
                enemy.healReduction = data.explosiveTrickHealReduction;
                enemy.healReductionEnd = Date.now() + data.explosiveTrickDebuffDuration;
                
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    enemyCx,
                    enemyCy - 25,
                    `${damage.toFixed(0)} 🔥 (-25% CURA)`,
                    'orange',
                    1000
                ));
                
                // Explosão no inimigo
                this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                    enemyCx, enemyCy, 40, 400, 'rgba(255, 50, 0, 0.7)'
                ));
            }
        }
    });
    
    this.swordsSubAbilityUsed = true;
    this.swordsActive = false;
    this.explosiveTrickCooldown = data.explosiveTrickCooldown;
    
    // Remove buff de dano
    this.damageBoostBuff = Math.max(0, this.damageBoostBuff - this.swordsDamageBoost);
    
    this.gameManager.showUI('Gambit: Truque Explosivo! 🔥⚔️', 'ultimate');
    return true;
}

// ⚔️ BARRAGEM DE LANCES (Tecla 3 + Tecla 2)
activateThrustBarrage() {
    const data = Champion.championData.gambit;
    
    if (!this.swordsActive || this.swordsSubAbilityUsed) {
        return false;
    }
    
    if (this.prestigitation < 2) {
        this.gameManager.showUI('Gambit: Precisa de 2 Prestidigitação!', 'warning');
        return false;
    }
    
    // ✨ EFEITOS VISUAIS ÉPICOS
    
    // Explosão central massiva
    this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
        this.getCenterX(),
        this.getCenterY(),
        data.thrustBarrageRadius,
        1000,
        'rgba(255, 100, 0, 0.95)'
    ));
    
    // Múltiplas ondas de choque explosivas
    for (let i = 0; i < 6; i++) {
        setTimeout(() => {
            this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                this.getCenterX(),
                this.getCenterY(),
                data.thrustBarrageRadius * (0.4 + i * 0.15),
                500
            ));
        }, i * 120);
    }
    
    // Dispara 16 cartas explosivas em círculo
    const cardCount = 16;
    for (let i = 0; i < cardCount; i++) {
        const angle = (Math.PI * 2 / cardCount) * i;
        
        const card = new GambitThrustCard(
            this.getCenterX(),
            this.getCenterY(),
            Math.cos(angle) * 700,
            Math.sin(angle) * 700,
            data.thrustBarrageDamage * (1 + this.swordsDamageBoost),
            data.thrustBarrageKnockback,
            this,
            this.gameManager
        );
        
        this.gameManager.projectiles.push(card);
    }
    
    // Raios de energia em 16 direções
    for (let r = 0; r < 16; r++) {
        const rayAngle = (Math.PI * 2 / 16) * r;
        
        setTimeout(() => {
            this.gameManager.effects.push(new this.gameManager.LaserEffect(
                this.getCenterX(),
                this.getCenterY(),
                this.getCenterX() + Math.cos(rayAngle) * data.thrustBarrageRadius,
                this.getCenterY() + Math.sin(rayAngle) * data.thrustBarrageRadius,
                8,
                'rgba(255, 150, 0, 0.9)',
                0.5
            ));
        }, r * 30);
    }
    
    // Espiral de partículas explosivas
    for (let p = 0; p < 40; p++) {
        const spiralAngle = (Math.PI * 2 / 40) * p + (p / 40) * Math.PI * 2;
        const spiralDistance = (p / 40) * data.thrustBarrageRadius;
        
        this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
            this.getCenterX() + Math.cos(spiralAngle) * spiralDistance,
            this.getCenterY() + Math.sin(spiralAngle) * spiralDistance,
            22,
            ['red', 'orange', 'yellow', 'white'][p % 4],
            1200
        ));
    }
    
    this.prestigitation -= 2;
    this.swordsSubAbilityUsed = true;
    this.swordsActive = false;
    this.thrustBarrageCooldown = data.thrustBarrageCooldown;
    
    // Remove buff de dano
    this.damageBoostBuff = Math.max(0, this.damageBoostBuff - this.swordsDamageBoost);
    
    this.gameManager.showUI('Gambit: Barragem de Lances! 💥⚔️', 'ultimate');
    return true;
}

activateAbility(abilityNumber) {
    if (this.isStunned || this.isConfused) return;
    
    const data = Champion.championData.gambit;
    
    // 🃏 HABILIDADE 1: Dash OU Ponte de Reforço (Corações) OU Truque Explosivo (Espadas)
    if (abilityNumber === 1) {
        // ⚔️ Se Espadas está ativo, usa Truque Explosivo
        if (this.swordsActive && !this.swordsSubAbilityUsed) {
            this.activateExplosiveTrick();
            return;
        }
        
        // 💚 Se Corações está ativo, usa Ponte de Reforço
        if (this.heartsActive && !this.heartsSubAbilityUsed) {
            this.activateBoostBridge();
            return;
        }
        
        // 🃏 Caso contrário, usa Dash normal
        if (this.dashCharges > 0 && this.dashCooldown <= 0 && this.prestigitation >= 1) {
            // ... código existente do Dash ...
            const mouseX = this.targetX;
            const mouseY = this.targetY;
            
            const angle = Math.atan2(mouseY - this.getCenterY(), mouseX - this.getCenterX());
            const distance = data.dashDistance;
            
            this.dashStartX = this.getCenterX();
            this.dashStartY = this.getCenterY();
            this.dashEndX = this.dashStartX + Math.cos(angle) * distance;
            this.dashEndY = this.dashStartY + Math.sin(angle) * distance;
            this.dashAngle = angle;
            this.dashDistance = distance;
            
            const canvas = this.gameManager.canvas;
            this.dashEndX = Math.max(50, Math.min(canvas.width - 50, this.dashEndX));
            this.dashEndY = Math.max(50, Math.min(canvas.height - 50, this.dashEndY));
            
            this.isDashing = true;
            this.isDashEnhanced = false;
            this.dashStartTime = Date.now();
            this.lastDashTime = Date.now();
            this.dashHitEnemies = [];
            this.dashHitAllies = [];
            
            this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                this.dashStartX, this.dashStartY, 60, 400, 'rgba(255, 0, 255, 0.8)'
            ));
            
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                        this.dashStartX, this.dashStartY, 40 + i * 20, 300
                    ));
                }, i * 100);
            }
            
            for (let p = 0; p < 20; p++) {
                const particleAngle = (Math.PI * 2 / 20) * p;
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.dashStartX + Math.cos(particleAngle) * 25,
                    this.dashStartY + Math.sin(particleAngle) * 25,
                    12, 'magenta', 600
                ));
            }
            
            this.dashCharges--;
            this.dashCooldown = data.dashCooldown;
            this.dashChargeRecoveryTimer = 0;
            this.prestigitation--;
            this.canEnhanceDash = true;
            
            this.gameManager.showUI('Gambit: Ataque Cajun! 🃏', 'special');
        }
    } 
    
    // 💚/⚔️ HABILIDADE 2: Corações OU Captação (Corações) OU Barragem de Lances (Espadas)
    else if (abilityNumber === 2) {
        // ⚔️ Se Espadas está ativo, usa Barragem de Lances
        if (this.swordsActive && !this.swordsSubAbilityUsed) {
            this.activateThrustBarrage();
            return;
        }
        
        // 💚 Se Corações já está ativo, usa Captação Purificadora
        if (this.heartsActive && !this.heartsSubAbilityUsed) {
            this.activatePurifyingGather();
            return;
        }
        
        // 💚 Caso contrário, ativa Corações Curativos
        this.activateHealingHearts();
    }
    
    // ⚔️ HABILIDADE 3: Quebrando Espadas
    else if (abilityNumber === 3) {
        this.activateBreakingSwords();
    }
}
    
draw(ctx, selected) {
    super.draw(ctx, selected);
    
    const data = Champion.championData.gambit;
    
    // 🎯 Linha de mira discreta
    if (!this.isDashing && !this.isReloading) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(this.getCenterX(), this.getCenterY());
        ctx.lineTo(this.targetX, this.targetY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 🎯 Mira no mouse
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.targetX, this.targetY, 8, 0, Math.PI * 2);
        ctx.moveTo(this.targetX - 12, this.targetY);
        ctx.lineTo(this.targetX + 12, this.targetY);
        ctx.moveTo(this.targetX, this.targetY - 12);
        ctx.lineTo(this.targetX, this.targetY + 12);
        ctx.stroke();
        ctx.restore();
    }
    
    // ✨ Indicador de Prestidigitação (4 cartas)
    const cardSize = 12;
    const cardSpacing = 16;
    const startX = this.getCenterX() - (4 * cardSpacing) / 2;
    const y = this.y - 15;
    
    for (let i = 0; i < 4; i++) {
        const x = startX + i * cardSpacing;
        const isActive = i < this.prestigitation;
        
        ctx.save();
        
        // Brilho pulsante se ativo
        if (isActive) {
            const pulse = 0.8 + Math.sin(Date.now() / 200 + i) * 0.2;
            ctx.shadowColor = 'magenta';
            ctx.shadowBlur = 10 * pulse;
        }
        
        ctx.fillStyle = isActive ? 'rgba(255, 0, 255, 0.9)' : 'rgba(100, 100, 100, 0.5)';
        ctx.strokeStyle = isActive ? 'rgba(255, 100, 255, 1)' : 'rgba(150, 150, 150, 0.7)';
        ctx.lineWidth = isActive ? 2 : 1;
        
        ctx.beginPath();
        ctx.roundRect(x - cardSize / 2, y - cardSize / 2, cardSize, cardSize * 1.4, 2);
        ctx.fill();
        ctx.stroke();
        
        if (isActive) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('♦', x, y + 3);
        }
        
        ctx.restore();
    }
    
    // 🔫 Munição com barra visual
    const ammoBarWidth = this.width;
    const ammoBarHeight = 5;
    const ammoBarX = this.x;
    const ammoBarY = this.y - 45;
    
    // Fundo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(ammoBarX, ammoBarY, ammoBarWidth, ammoBarHeight);
    
    // Munição atual
    const ammoPercent = this.currentAmmo / this.maxAmmo;
    const ammoGradient = ctx.createLinearGradient(ammoBarX, 0, ammoBarX + ammoBarWidth, 0);
    ammoGradient.addColorStop(0, 'rgba(255, 0, 255, 1)');
    ammoGradient.addColorStop(1, 'rgba(200, 0, 200, 1)');
    ctx.fillStyle = ammoGradient;
    ctx.fillRect(ammoBarX, ammoBarY, ammoBarWidth * ammoPercent, ammoBarHeight);
    
    // Contorno
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(ammoBarX, ammoBarY, ammoBarWidth, ammoBarHeight);
    
    // Texto de munição
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'magenta';
    ctx.shadowBlur = 5;
    ctx.fillText(`${this.currentAmmo}/${this.maxAmmo}`, this.getCenterX(), ammoBarY - 3);
    ctx.shadowBlur = 0;
    
    // 🔄 Barra de recarga animada
    if (this.isReloading) {
        const progress = (Date.now() - this.reloadStartTime) / data.reloadTime;
        const barWidth = this.width;
        const barHeight = 6;
        const barX = this.x;
        const barY = this.y - 55;
        
        // Fundo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Progresso com gradiente animado
        const reloadGradient = ctx.createLinearGradient(barX, 0, barX + barWidth * progress, 0);
        reloadGradient.addColorStop(0, 'rgba(255, 100, 0, 1)');
        reloadGradient.addColorStop(0.5, 'rgba(255, 200, 0, 1)');
        reloadGradient.addColorStop(1, 'rgba(255, 255, 0, 1)');
        ctx.fillStyle = reloadGradient;
        ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Contorno pulsante
        const pulseBorder = 0.7 + Math.sin(Date.now() / 100) * 0.3;
        ctx.strokeStyle = `rgba(255, 200, 0, ${pulseBorder})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Texto "RECARREGANDO"
        ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('RECARREGANDO', this.getCenterX(), barY + barHeight + 10);
    }
    
    // 🔨 Indicador de alcance do Bash (se inimigo próximo)
    if (this.nearbyEnemyForBash && this.bashCharges > 0) {
        ctx.save();
        
        const pulseRadius = data.bashRadius + Math.sin(Date.now() / 150) * 5;
        
        // Aura pulsante
        const bashGradient = ctx.createRadialGradient(
            this.getCenterX(), this.getCenterY(), 0,
            this.getCenterX(), this.getCenterY(), pulseRadius
        );
        bashGradient.addColorStop(0, 'rgba(255, 0, 255, 0.1)');
        bashGradient.addColorStop(0.7, 'rgba(255, 0, 255, 0.3)');
        bashGradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
        ctx.fillStyle = bashGradient;
        ctx.beginPath();
        ctx.arc(this.getCenterX(), this.getCenterY(), pulseRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Contorno animado
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -Date.now() / 50;
        ctx.beginPath();
        ctx.arc(this.getCenterX(), this.getCenterY(), data.bashRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.restore();
    }
    
    // 💚 Indicador de Corações Curativos ativo
    if (this.heartsActive) {
        const timeLeft = this.heartsWindow - (Date.now() - this.heartsActivationTime);
        const progress = timeLeft / this.heartsWindow;
        
        // Aura verde pulsante
        const heartPulse = 0.3 + Math.sin(Date.now() / 200) * 0.2;
        const heartGradient = ctx.createRadialGradient(
            this.getCenterX(), this.getCenterY(), 0,
            this.getCenterX(), this.getCenterY(), 60
        );
        heartGradient.addColorStop(0, `rgba(0, 255, 100, ${heartPulse})`);
        heartGradient.addColorStop(1, 'rgba(0, 255, 100, 0)');
        ctx.fillStyle = heartGradient;
        ctx.beginPath();
        ctx.arc(this.getCenterX(), this.getCenterY(), 60, 0, Math.PI * 2);
        ctx.fill();
        
        // Barra de tempo
        const timerBarWidth = this.width;
        const timerBarHeight = 4;
        const timerBarX = this.x;
        const timerBarY = this.y - 65;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(timerBarX, timerBarY, timerBarWidth, timerBarHeight);
        
        ctx.fillStyle = 'rgba(0, 255, 100, 0.9)';
        ctx.fillRect(timerBarX, timerBarY, timerBarWidth * progress, timerBarHeight);
        
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(timerBarX, timerBarY, timerBarWidth, timerBarHeight);
        
        // Texto
        ctx.fillStyle = 'rgba(0, 255, 100, 0.9)';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💚 CORAÇÕES', this.getCenterX(), timerBarY - 3);
    }
    
    // 🃏 Cargas do Dash (apenas se selecionado)
    if (selected) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'left';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 3;
        ctx.fillText(`Dash: ${this.dashCharges}/${data.dashMaxCharges}`, this.x, this.y + this.height + 20);
        ctx.fillText(`Bash: ${this.bashCharges}/${data.bashMaxCharges}`, this.x, this.y + this.height + 32);
        ctx.shadowBlur = 0;
    }

        // ⚔️ Indicador de Espadas ativo
    if (this.swordsActive) {
        const timeLeft = this.swordsWindow - (Date.now() - this.swordsActivationTime);
        const progress = timeLeft / this.swordsWindow;
        
        // Aura vermelha pulsante
        const swordPulse = 0.4 + Math.sin(Date.now() / 150) * 0.3;
        const swordGradient = ctx.createRadialGradient(
            this.getCenterX(), this.getCenterY(), 0,
            this.getCenterX(), this.getCenterY(), 70
        );
        swordGradient.addColorStop(0, `rgba(255, 50, 0, ${swordPulse})`);
        swordGradient.addColorStop(0.7, `rgba(255, 100, 0, ${swordPulse * 0.6})`);
        swordGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
        ctx.fillStyle = swordGradient;
        ctx.beginPath();
        ctx.arc(this.getCenterX(), this.getCenterY(), 70, 0, Math.PI * 2);
        ctx.fill();
        
        // Espadas orbitando
        const swordCount = 4;
        for (let s = 0; s < swordCount; s++) {
            const swordAngle = (Math.PI * 2 / swordCount) * s + Date.now() / 500;
            const sx = this.getCenterX() + Math.cos(swordAngle) * 45;
            const sy = this.getCenterY() + Math.sin(swordAngle) * 45;
            
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(swordAngle + Math.PI / 2);
            
            ctx.fillStyle = 'rgba(255, 100, 0, 0.9)';
            ctx.shadowColor = 'orange';
            ctx.shadowBlur = 12;
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('♠', 0, 0);
            
            ctx.restore();
        }
        
        ctx.shadowBlur = 0;
        
        // Barra de tempo
        const timerBarWidth = this.width;
        const timerBarHeight = 5;
        const timerBarX = this.x;
        const timerBarY = this.y - 75;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(timerBarX, timerBarY, timerBarWidth, timerBarHeight);
        
        const timerGradient = ctx.createLinearGradient(timerBarX, 0, timerBarX + timerBarWidth * progress, 0);
        timerGradient.addColorStop(0, 'rgba(255, 200, 0, 1)');
        timerGradient.addColorStop(0.5, 'rgba(255, 100, 0, 1)');
        timerGradient.addColorStop(1, 'rgba(255, 50, 0, 1)');
        ctx.fillStyle = timerGradient;
        ctx.fillRect(timerBarX, timerBarY, timerBarWidth * progress, timerBarHeight);
        
        ctx.strokeStyle = 'rgba(255, 100, 0, 0.9)';
        ctx.lineWidth = 1;
        ctx.strokeRect(timerBarX, timerBarY, timerBarWidth, timerBarHeight);
        
        // Texto
        ctx.fillStyle = 'rgba(255, 100, 0, 0.9)';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'orange';
        ctx.shadowBlur = 6;
        ctx.fillText('⚔️ ESPADAS (+15%)', this.getCenterX(), timerBarY - 3);
        ctx.shadowBlur = 0;
}
}

getDamage() {
    const data = Champion.championData.gambit;
    let damage = data.dano * (1 + this.damageBoostBuff);
    
    // ⚔️ Aplica buff de Espadas se ativo
    if (this.swordsActive) {
        damage *= (1 + this.swordsDamageBoost);
    }
    
    return damage;
}
}

// Dados dos campeões (inclui custo, poder, e paths para ícones e imagens)
// ESTA DECLARAÇÃO DEVE VIR DEPOIS da exportação da classe base Champion e ANTES das subclasses.
Champion.championData = {
    ironman: {
        icon: './assets_img/Iron_Man.webp',
        imagePath: './assets_img/Iron_Man.webp', // Usando o mesmo ícone para a imagem do campeão por simplicidade
        poder: 'Lasers que carregam o Reator Arc. Com carga máxima, dispara um Unibeam devastador. Pode voar continuamente em órbita do inimigo mais forte, atirando lasers. Se o inimigo for destruído, ele buscará o próximo alvo mais forte, mantendo-se sempre em movimento.',
        custo: 300,
        dano: 30,
        hp: 200,
        cooldownBase: 250, // ms
        alcance: 160,
        width: 50, height: 50,
        cargaMaxUnibeam: 15, // Lasers para carregar Unibeam
        danoUnibeam: 150,
        flightCooldownBase: 15000,
        flightOrbitSpeed: 300,
        flightOrbitRadius: 100,
        flightAttackCooldown: 500,

        // ⭐ NOVO: Sistema de Escudo
        survivalType: 'shield',
        maxShield: 100,
        shieldRegenRate: 5, // por segundo
        shieldRegenDelay: 3000, // 3s sem dano
        shieldTrait: 'recarga_acelerada', // recarrega 2x mais rápido após 5s
        shieldTrait: 'energia_pulsante', // recarrega em 3 pulsos
        shieldTrait: 'escudo_cinetico', // aumenta max_shield ao absorver dano
        
    },
    thor: {
        icon: './assets_img/Thor.jpg', // URL longa e específica
        imagePath: './assets_img/Thor.jpg',
        poder: 'Invoca raios em cadeia que atingem múltiplos alvos. Arremessa o Mjolnir periodicamente. 33% de chance de atordoar.',
        custo: 200,
        dano: 200, // Dano base do ataque de raio
        maxHp: 200, // Vida máxima do Thor
        hp: 400,    // Vida atual do Thor
        alcance: 140, // Raio de alcance para o ataque de raio
        cooldownBase: 800, // Cooldown do ataque de raio em MS (equivalente a 90 frames a 60 FPS)
        danoMjolnir: 400, // Dano AUMENTADO do Mjolnir
        cooldownMjolnirBase: 15000, // Cooldown para arremessar o Mjolnir (15 segundos)
        stunChance: 0.33, // 33% de chance de atordoar inimigos
        stunDuration: 1500, // Duração do atordoamento (1.5 segundos)
        width: 50, height: 50,

        // ⭐ NOVO: Sistema de Regeneração
        survivalType: 'regen',
        regenRate: 3, // HP por segundo
        regenTrait: 'cura_por_emergencial', // 3x regen abaixo de 30% HP
        regenTrait: 'cura_por_vida_baixa', // quanto menor HP, maior regen
        regenTrait: 'regeneracao_atrasada', // devolve 30% do dano em cura lenta
        delayedHealStorage: 0,
    },
    loki: {
    icon: './assets_img/Loki.webp',
    imagePath: './assets_img/Loki.webp',
    poder: 'Mestre do engano e da cura mística. Cria pedras rúnicas automaticamente para curar aliados. Invoca clones que persistem após sua morte.',
    custo: 350,
    hp: 250,
    dano: 15,
    alcance: 180,
    cooldownBase: 700,
    width: 50, height: 50,
    
    // 🔮 PASSIVO: Domínio da Regeneração (Pedra Rúnica)
    runeStone: {
        passiveInterval: 15000, // A cada 15 segundos
        duration: 8000,
        healRate: 50, // HP por segundo
        durability: 100, // HP da pedra
        radius: 120,
        damageToHeal: true, // Converte dano em cura
        spawnDistance: 40 // Distância da pedra até o aliado
    },
    
    // 👤 HABILIDADE 1: Ilusões (Clones)
    clones: {
        maxClones: 2,
        chargeCooldown: 12000, // Cooldown por carga
        cloneHP: 250,
        cloneDamageMultiplier: 0.8, // 80% do dano de Loki
        cloneHealMultiplier: 0.8, // 80% da cura
        persistAfterDeath: true,
        attackRange: 180
    },
    
    // ⚗️ HABILIDADE 2: Rebolinho
    splitProjectile: {
        cooldown: 20000,
        splitCount: 5
    },

        // ⭐ NOVO: Sistema de Escudo
        survivalType: 'shield',
        maxShield: 100,
        shieldRegenRate: 5, // por segundo
        shieldRegenDelay: 3000, // 3s sem dano
        shieldTrait: 'recarga_acelerada', // recarrega 2x mais rápido após 5s
        shieldTrait: 'energia_pulsante', // recarrega em 3 pulsos
        shieldTrait: 'escudo_cinetico', // aumenta max_shield ao absorver dano

    },

    redhulk: {
        icon: './assets_img/Red_Hulk.jpg',
        imagePath: './assets_img/Red_Hulk.jpg',
        poder: 'Causa explosões em área que aplicam sangramento. Quanto mais dano ele recebe, mais forte fica, e sua ultimate é uma explosão nuclear que ignora armadura.',
        custo: 500,
        hp:800,
        dano: 30,
        alcance: 100,
        cooldownBase: 1200,
        width: 50, height: 50,
        explosionRadius: 80,
        bleedDamagePerTick: 7,
        bleedDuration: 5000,
        bleedTickRate: 1000,
        rageThreshold: 0.5, // HP% para ativar fúria
        rageDamageBonus: 0.5, // Bônus de dano na fúria
        nuclearStrikeCooldown: 30000,
        nuclearStrikeRadius: 200,
        nuclearStrikeDamage: 300,
        nuclearStrikeArmorPen: 1.0, // 100% de penetração de armadura

         
        // ⭐ NOVO: Sistema de Regeneração
        survivalType: 'regen',
        regenRate: 3, // HP por segundo
        regenTrait: 'cura_por_emergencial', // 3x regen abaixo de 30% HP
        regenTrait: 'cura_por_vida_baixa', // quanto menor HP, maior regen
        regenTrait: 'regeneracao_atrasada', // devolve 30% do dano em cura lenta
        delayedHealStorage: 0,
    },

    emmafrost: {
        icon: './assets_img/Emma_Frost.jpg',
        imagePath: './assets_img/Emma_Frost.jpg',
        poder: 'Alterna entre Modo Psíquico (controle de grupo) e Forma de Diamante (invulnerabilidade). Possui a Rajada Mental (Atordoamento).',
        custo: 500,
        hp: 500,
        dano: 15,
        cooldownBase: 700,
        alcance: 180,
        width: 50, height: 50,
        
        // Propriedades do Ataque Psíquico
        zonaConfusao: 180, 
        confuseChance: 1.00, 
        duracaoConfusao: 3000,
        slowChance: 1.00, // NOVO: Chance de Slow
        slowFactor: 0.5, // NOVO: Fator de Slow (50% de velocidade)
        slowDuration: 5000, // NOVO: Duração do Slow (ms)
        
        // Habilidade 3: Rajada Mental (NOVO)
        mentalBlastCooldown: 15000,
        mentalBlastDamage: 120,
        mentalBlastStunDuration: 2000,
        mentalBlastRange: 250,
        
        // Habilidade 2: Impacto de Diamante (Ultimate)
        diamondImpactCooldown: 25000,
        diamondImpactDamage: 250,
        diamondImpactRadius: 100,
        diamondImpactShards: 12,

         // ⭐ NOVO: Sistema de Escudo
        survivalType: 'shield',
        maxShield: 100,
        shieldRegenRate: 5, // por segundo
        shieldRegenDelay: 3000, // 3s sem dano
        shieldTrait: 'recarga_acelerada', // recarrega 2x mais rápido após 5s
        shieldTrait: 'energia_pulsante', // recarrega em 3 pulsos
        shieldTrait: 'escudo_cinetico', // aumenta max_shield ao absorver dano

    },

    ultron: {
        icon: './assets_img/Ultron.jpg',// 'https://static.marvelsnap.pro/art/Ultron_12.webp',
        imagePath: './assets_img/Ultron.jpg',
        poder: 'IA avançada. Invoca drones, infesta inimigos e dispara ataques orbitais. Pode se reconstruir após ser destruído.',
        custo: 600,
        hp: 500,
        dano: 0, // Ultron NÃO ataca diretamente
        alcance: 100,
        cooldownBase: 0,
        width: 50, height: 50,

         // ===== SISTEMA DE DRONES SENTINELA (PASSIVO - Na função attack) =====
        maxDrones: 8, // Máximo de drones ativos por Ultron
        spawnCooldownBase: 3000, // Cooldown para gerar um novo drone (3 segundos)
        droneSpawnRadius: 80, // Raio de spawn ao redor de Ultron

        // Stats dos Drones Sentinela
        droneLaserRange: 150, // Alcance de ataque dos drones
        droneLaserDamage: 8, // Dano por laser
        droneLaserCooldown: 600, // Cooldown entre lasers (ms)
        droneLaserColor: 'orange', // Cor do laser
        droneLaserWidth: 1, // Largura do laser
        droneLaserLifespan: 300, // Duração do efeito visual (ms)
        droneLaserSpeed: 10, // Velocidade do projétil
        droneSize: 15, // Tamanho visual do drone
        
        
        // ===== HABILIDADE PASSIVA: Drones =====
        droneSpawnCooldown: 10000, // Cooldown para gerar drones
        // Drones Sentinela (defensivos)
        sentinelDroneCount: 1,
        sentinelDroneRange: 150,
        sentinelDroneDamage: 8,
        sentinelDroneAttackSpeed: 600,
        

        // ===== HABILIDADE 1: Drones Kamikaze =====
        kamikazeDroneSpawnCooldown: 10000, // 10 segundos
        kamikazeDroneCount: 2, // Quantidade por uso
        kamikazeDroneDamage: 100,
        kamikazeDroneSpeed: 250,
        kamikazeDroneExplosionRadius: 60,

        // ===== HABILIDADE 2: Infestação =====
        infestCooldown: 20000, // 20 segundos
        infestDuration: 5000, // 5 segundos
        infestDamageReduction: -0.2, // Inimigo recebe +20% de dano
        
            
        // ===== HABILIDADE PASSIVA: Ataque Orbital (Satélite) =====
        satelliteStrikeInterval: 18000, // Dispara a cada 18 segundos (automático)
        satelliteStrikeRadius: 150, // Raio do ataque
        satelliteStrikeDamage: 120, // Dano do ataque
        satelliteStrikeHackChance: 0.3, // 30% de chance de hackear
        satelliteStrikeHackDuration: 3000, // 3 segundos de hack
    
        // ===== ULTIMATE: Autorreconstrução =====
        emergencyReplicationCooldown: 60000, // Cooldown da ultimate
        replicationCoreDuration: 6000, // Tempo de reconstrução do núcleo
        maxReplicationsPerPhase: 1, // Limite de vezes que pode replicar por fase

        survivalType: 'none', // Ultron tem reconstrução

    },
    captainmarvel: {
        icon: './assets_img/Captain_Marvel.jpg',
        imagePath: './assets_img/Captain_Marvel.jpg',
        poder: 'Dispara rajadas de energia. Absorve energia de inimigos derrotados para carregar sua ultimate: Transformação em Míssil Humano que voa em alta velocidade causando dano massivo e explodindo no alvo.',
        custo: 480,
        hp: 300,
        dano: 22,
        alcance: 250,
        cooldownBase: 750,
        width: 50, height: 50,
        
        energyAbsorptionRange: 200,
        energyPerKill: 5,
        energyPerExplosion: 10,
        ultimateChargeNeeded: 100,
        
        // Míssil Humano (Habilidade 1)
        missileBarrageCooldown: 30000,
        missileSpeed: 600, // Velocidade do voo
        missileDamage: 300, // Dano ao alvo principal
        missileAoeDamage: 350, // Dano em área
        missileExplosionRadius: 300,
        missileVisualColor: 'gold',

        // ⭐ NOVO: Sistema de Regeneração
        survivalType: 'regen',
        regenRate: 3, // HP por segundo
        regenTrait: 'cura_por_emergencial', // 3x regen abaixo de 30% HP
        regenTrait: 'cura_por_vida_baixa', // quanto menor HP, maior regen
        regenTrait: 'regeneracao_atrasada', // devolve 30% do dano em cura lenta
        delayedHealStorage: 0,
    },

    hawkeye: {
        icon: './assets_img/Gaviao_Arqueiro.jpg',
        imagePath: './assets_img/Gaviao_Arqueiro.jpg',
        poder: 'Atira flechas com efeitos aleatórios: Padrão (dano), Choque (atordoa), Gelo (congela), Veneno (DoT), Explosiva (AoE), Tripla (3 flechas). Pode disparar flecha explosiva em área (Habilidade 1) e tempestade de flechas (Habilidade 2).',
        hp: 300,    
        custo: 320,
        dano: 18,
        alcance: 250,
        cooldownBase: 500,
        width: 50, height: 50,

        explosiveArrowCooldown: 12000,
        explosiveArrowRadius: 80,
        explosiveArrowDamage: 90,

        // ⭐ NOVO: Tempestade de Flechas
        arrowStormCooldown: 25000,
        arrowStormArrowCount: 20, // Número de flechas
        arrowStormRadius: 120, // Raio da área
        arrowStormDamage: 35, // Dano por flecha
        arrowStormDuration: 3000, // Duração da chuva
        
        piercingArrowChance: 0.2,
        piercingArrowCount: 3,

        // ⭐ NOVO: Habilidade 3 - Kate Bishop
        kateBishopCooldown: 60000, // 60 segundos
        kateBishopDuration: 60000, // 1 minuto em campo
        kateBishopRange: 350,
        kateBishopDamage: 25,
        kateBishopAttackSpeed: 800,
        
        // Flechas especiais de Kate
        kateArrowTypes: [
            'sonic', 'magnetic', 'pym', 'gravity', 'fragmentation', 'nanocord', 'photon'
        ]
    },

    usagent: {
    icon: './assets_img/USAgent.jpg',
    imagePath: './assets_img/USAgent.jpg',
    poder: 'Tiros rápidos e atordoantes. Pode realizar uma Investida Tática que avança em linha reta até o inimigo mais avançado, causando dano e atordoando. Também pode usar Onda de Choque e Chamado à Luta.',
    custo: 420,
    hp:300,
    dano: 20,
    alcance: 200,
    cooldownBase: 400,
    width: 50, height: 50,
    
    stunChance: 0.15,
    stunDuration: 800,
    
    // Habilidade 1: Investida Tática
    chargeCooldown: 15000,
    chargeDamage: 60,
    chargeSpeed: 300, // Pixels por segundo
    chargeKnockback: 40,
    chargeStunChance: 0.5,
    chargeStunDuration: 700,
    chargeRadius: 50, // Raio de colisão durante a investida
    
 
    // Habilidade 2A: Granada de Controle
    smokeGrenadeCooldown: 18000,
    smokeGrenadeRadius: 100,
    smokeGrenadeDuration: 4000,
    smokeGrenadeSlowFactor: 0.4, // 40% mais lento
    
    // Habilidade 2B: Carga Explosiva
    chargedShieldCooldown: 20000,
    chargedShieldDamage: 80,
    chargedShieldBounces: 3,    
    
    // Habilidade 3: Chamado à Luta
    combatCallCooldown: 28000,
    combatCallRadius: 180,
    combatCallDuration: 6000,
    combatCallDamageBoost: 0.3,
    combatCallHpRegen: 5,
    },

    captainamerica: {
        icon: './assets_img/Captain_America.jpg',
        imagePath: './assets_img/Captain_America.jpg',
        poder: 'Arremessa o escudo que ricocheteia. Pode entrar em postura defensiva, reduzindo o dano recebido e refletindo ataques. Sua ultimate é um Grito de Liderança que fortalece a todos.',
        custo: 460,
        hp: 350,
        dano: 25,
        alcance: 150,
        cooldownBase: 1500,
        width: 50, height: 50,
        ricochetChainRadius: 180, // Raio para o ricochete do escudo
        ricochetDamageReduction: 0.1, // Redução de dano por ricochete
        shieldBounces: 3, // Número de ricochetes do escudo (além do primeiro impacto, então 3 bounces = 4 hits no total)
        defensiveStanceCooldown: 20000,
        defensiveStanceDuration: 6000,
        defensiveStanceShieldAmount: 200, // Escudo temporário na postura defensiva
        damageReductionFactor: 0.3, // NOVO: Fator de redução de dano da Postura Defensiva (30%)
        reflectDamageChance: 0.2, // Chance de refletir dano (20%) - Ajustado para 0.2
        reflectDamageMultiplier: 0.5, // Multiplicador de dano refletido
        leadershipCryCooldown: 40000,
        leadershipCryRadius: 250,
        leadershipCryDuration: 8000,
        leadershipCryDamageBoost: 0.4, // Aumento de 40% no dano global
        leadershipCryHpRegen: 5, // Regeneração de HP por segundo

        // ⭐ NOVO: Habilidade 2 - A Esquerda (MOVIMENTO CIRCULAR)
        leftWingCooldown: 45000, // 45 segundos
        leftWingDuration: 40000, // 40 segundos no campo
        leftWingGrabCount: 2, // Captura 2 inimigos
        leftWingSpeed: 1.5, // Velocidade angular (radianos por segundo)
        leftWingOrbitRadius: 350, // Raio da órbita ao redor do mapa
        leftWingDamageBonus: 0.5, // +50% de dano dos aliados
        leftWingStunDuration: 40000, // Inimigo fica atordoado durante toda a duração
        leftWingDropX: 900, // Posição X onde soltar o inimigo

        // 💙 NOVO: Coração do Soldado
        heartOfSoldierDuration: 10000,
        heartOfSoldierDamageBoost: 0.5,
        heartOfSoldierSpeedBoost: 0.3,
        heartOfSoldierDefenseBoost: 0.3,
        heartOfSoldierAllyBonus: 0.25
    },

    wanda: {
        hp: 550, dano: 40, alcance: 250, cooldownBase: 900,
        icon: './assets_img/Scarlet_Witch.jpg',
        imagePath: './assets_img/Scarlet_Witch.jpg',
        poder: 'Magia do Caos que confunde inimigos. Pode invocar runas que impedem buffs/debuffs. Sua ultimate é a Ressurreição, revivendo uma torre aliada destruída.',
        custo: 190,
        width: 50, height: 50,
        chaosZoneCooldown: 15000, chaosZoneRadius: 180, chaosZoneDuration: 54000, // Zona do Caos
        chaosZoneConfuseDuration: 3000, // Duração da confusão
        blockingRunesCooldown: 10000, blockingRunesRadius: 120, blockingRunesDuration: 54000, // Runas de Bloqueio
        runeCleanseExisting: true, // Limpa debuffs existentes
        resurrectionCooldown: 45000, resurrectionLimitPerPhase: 1, resurrectionHpPercent: 0.5, // Ressurreição
    },

    noturno: {
    hp: 480, 
    dano: 60, 
    alcance: 110, 
    cooldownBase: 400,
    icon: './assets_img/Noturno.jpg',
    imagePath: './assets_img/Noturno.jpg',
    poder: 'Teletransporte para inimigos próximos. Pode teleportar e atordoar um inimigo distante. Pode criar Pontos de Ancoragem para teletransporte tático. Sua ultimate é a Dança Noturna com trilhas e cortes visuais. Passivamente evita 25% dos ataques e deixa nuvens de enxofre ao teleportar.',
    custo: 110,
    width: 50, height: 50,
    
    teleportRange: 100,
    teleportAttackBonus: 0.2,
    
    // Habilidade 1: Bamf Strike
    bamfStrikeCooldown: 10000,
    bamfStrikeDamage: 80,
    bamfStrikeStunDuration: 1500,
    bamfStrikeRange: 300,
    
    // Habilidade 2: Pontos de Ancoragem (NOVA)
    anchorPointCooldown: 1000,
    anchorPointTeleportCooldown: 3000,
    
    // Habilidade 3: Dança Noturna
    nightDanceCooldown: 25000,
    nightDanceRadius: 150,
    nightDanceDuration: 4000,
    nightDanceDamagePerTick: 20,
    nightDanceTickRate: 200,
    bleedChance: 0.25,
    bleedDuration: 3000,
    bleedDamagePerTick: 5,
    
    // Passivo: Nuvem de Enxofre
    sulfurCloudRadius: 60,
    sulfurCloudDamage: 3,
    sulfurCloudDuration: 4000,
    
    // Passivo: Acrobata Sagrado
    evasionChance: 0.25, // 25% chance de desviar

     // ⭐ NOVO: Sistema de Escudo
        survivalType: 'shield',
        maxShield: 100,
        shieldRegenRate: 5, // por segundo
        shieldRegenDelay: 3000, // 3s sem dano
        shieldTrait: 'recarga_acelerada', // recarrega 2x mais rápido após 5s
        shieldTrait: 'energia_pulsante', // recarrega em 3 pulsos
        shieldTrait: 'escudo_cinetico', // aumenta max_shield ao absorver dano
},

infinityultron: {
    icon: './assets_img/Infinity_Ultron.jpg',
    imagePath: './assets_img/Infinity_Ultron.jpg',
    poder: 'Entidade dimensional com as Joias do Infinito. Pulso de Entropia causa dano contínuo. Joia do Espaço puxa inimigos. Joia da Alma fortalece aliados. Joia do Poder sobrecarga o dano.',
    custo: 800,
    hp: 600,
    dano: 0,
    alcance: 0,
    cooldownBase: 0,
    width: 60, height: 60,
    
    // 🧬 PASSIVO PRINCIPAL: Pulso de Entropia
    entropyPulse: {
        innerRadius: 80,
        middleRadius: 150,
        outerRadius: 220,
        innerDamage: 15,
        middleDamage: 10,
        outerDamage: 5,
        burnDuration: 2000,
        burnDamage: 8,
        tickRate: 500
    },
    
    // 💠 PASSIVO: Joia do Espaço
    spaceStone: {
        interval: 3000,
        pullRange: 500,
        pullSpeed: 300,
        dominionStackDuration: 10000,
        dominionDamageBonus: 0.15,
        maxStacks: 5,
        killWindow: 3000
    },
    
    // 🟠 PASSIVO: Joia da Alma
    soulStone: {
        attackSpeedBonus: 0.30,
        damageBonus: 0.20,
        duration: 6000
    },
    
    // 🟪 HABILIDADE 1: Joia do Poder
    powerStone: {
        cooldown: 20000,
        duration: 6000,
        damageMultiplier: 2.5, // ✅ AUMENTADO: 2.5x dano (antes era 2.0x)
        radiusMultiplier: 0.5, // ✅ REDUZIDO: 50% do raio (antes era 60%)
        pushbackDistance: 80,
        visualColor: 'purple' // ✅ NOVO: Cor roxa
    },

    // 🔴 HABILIDADE 3: Joia da Realidade
    realityStone: {
        cooldown: 25000, // 25 segundos
        duration: 8000, // 8 segundos
        resistanceReduction: 0.5, // 50% menos resistência
        defenseIgnore: true, // Ignora defesas
        comboWithPower: true // Combo com Joia do Poder
    },
    // 🟥 NOVA: JOIA DA REALIDADE - BARREIRA FINAL
    realityBarrier: {
        hp: 100,
        duration: 60000,
        cooldown: 35000,
        reflectDamage: 0.2,      // 20% de reflexão
        slowDebuff: 0.2,         // 20% de slow
        slowDuration: 2000,
        knockbackDistance: 30,
        size: { width: 60, height: 80 }
    },
    
    // ⏳ HABILIDADE 2A: Joia do Tempo - Prisão Temporal
    timeStone: {
        cooldown: 2, // 2 fases
        duration: 6000, // 6 segundos
        radius: 220, // Raio de congelamento
        freezeEffect: true,
        autoConvertOnDeath: true // ✅ NOVO: Conversão automática ao morrer
    },

    // 🧠 HABILIDADE 2B: Joia da Mente - Controle Mental (Passiva de Combo)
    mindStone: {
        minionDuration: 20000, // 20 segundos
        minionDamageMultiplier: 1.5, // 150% do dano original
        minionHpMultiplier: 0.5, // 50% do HP original
        minionExplosionRadius: 80,
        minionExplosionDamage: 150
    },
                
        // ⭐ NOVO: Sistema de Regeneração
            survivalType: 'regen',
            regenRate: 3, // HP por segundo
            regenTrait: 'cura_por_emergencial', // 3x regen abaixo de 30% HP
            regenTrait: 'cura_por_vida_baixa', // quanto menor HP, maior regen
            regenTrait: 'regeneracao_atrasada', // devolve 30% do dano em cura lenta
            delayedHealStorage: 0,
    },

karolinadean: {
    icon: './assets_img/karolina_dean.png',
    imagePath: './assets_img/karolina_dean.png',
    custo: 400,
    hp: 180,
    dano: 22,
    alcance: 280,
    cooldownBase: 1200,
    poder: 8,
    width: 40,
    height: 40,
    
    // 🌈 Rajada Prismática
    beamExplosionRadius: 80,
    blindChance: 0.25,
    blindDuration: 2000,
    
    // 🚀 Voo Luminescente
    flightCooldown: 15000,
    landingBurstRadius: 120,
    landingBurstDamage: 80,

    // ☀️💥 Supernova Direcionada
    supernovaCooldown: 30000,
    supernovaDamage: 200,
    supernovaLength: 800,
    supernovaWidth: 80,
    supernovaDuration: 2000,
    
    // 👻 Luz Refratada (Clone)
    cloneDuration: 3000,
    cloneDamageMultiplier: 0.3,
    
    // 🔥 Superaquecimento Estelar
    heatDamageBonus: 0.15, // +15% por nível de calor
    overheatExplosionRadius: 180,
    overheatExplosionDamage: 150,

    // 🛡️ NOVO: Escudo Solar
    solarShieldCooldown: 10000, // 10 segundos
    solarShieldDuration: 5000, // 5 segundos
    solarShieldHP: 200, // HP do escudo
    solarShieldRange: 200, // Alcance para buscar aliado
    solarShieldExplosionRadius: 100, // Raio da explosão ao acabar
    solarShieldExplosionDamage: 60, // Dano da explosão

     // 💥 NOVO: Explosão Solar (Ultimate)
    solarExplosionCooldown: 30000, // 30 segundos
    solarExplosionDamage: 200, // Dano base
    solarExplosionRadius: 200, // Raio base
    solarExplosionBlindDuration: 3000, // 3 segundos de cegueira
    solarExplosionAllyDamageBoost: 0.3, // +30% dano aos aliados
    solarExplosionAllySpeedBoost: 0.2, // +20% velocidade aos aliados
    solarExplosionAllyBuffDuration: 6000, // 6 segundos de buff
    minStacksForUltimate: 1, // Mínimo de stacks para usar
    
    // 🔆 NOVO: Energia Estelar (Passiva)
    stellarStackInterval: 10000, // Ganha 1 stack a cada 10 segundos
    maxStellarStacks: 10, // Máximo de 10 stacks
    stellarDamageBonus: 0.02, // +2% dano por stack
    stellarAreaBonus: 0.01, // +1% área por stack
    stellarStackUltimateBonus: 0.1, // +10% de bônus na ultimate por stack
},
   gambit: {
        custo: 300,
        hp: 180,
        dano: 13, // Por carta
        alcance: 120,
        cooldownBase: 500, // 2 ataques/segundo
        poder: 3,
        icon: './assets_img/gambit.png',
        imagePath: './assets_img/gambit.png',
        width: 50,
        height: 50,
        
        // 🃏 Cartas Cinéticas
        cardsPerShot: 2,
        cardSpread: 0.15, // Dispersão em radianos
        cardSpeed: 800,
        cardHeal: 14,
        maxAmmo: 21,
        reloadTime: 2000,
        
        // ✨ Prestidigitação
        maxPrestidigitation: 4,
        prestigitationRechargeTime: 5000, // 5s por ponto
        
        // 🏏 Bayou Bash (Corpo a corpo)
        bashDamage: 30,
        bashHeal: 15,
        bashRadius: 120,
        bashCooldown: 1000,
        bashMaxCharges: 5,
        
        // 🏃 Ataque Cajun (Dash)
        dashDistance: 200, // 8 metros = 200px
        enhancedDashDistance: 300, // 12 metros = 300px
        dashDamage: 25,
        dashHeal: 25,
        dashCooldown: 12000,
        dashMaxCharges: 2,
        dashSpeed: 1000, // px/s
        bashEnhanceWindow: 800, // Tempo para usar Bash após Dash

        // 💚 Corações Curativos
        heartsBaseCooldown: 18000, // 18 segundos
        heartsRegenRate: 5, // HP/s
        heartsWindow: 6000, // 6 segundos
        
        // 💚 Ponte de Reforço
        boostBridgeCooldown: 1000,
        boostBridgeHeal: 50,
        boostBridgeBounces: 3,
        boostBridgeHealBonus: 0.15, // +15% cura
        boostBridgeBuffDuration: 4000, // 4 segundos
        
        // 💚 Captação Purificadora
        purifyingGatherCooldown: 1000,
        purifyingGatherHeal: 30,
        purifyingGatherDamage: 40, // NOVO: Dano em área
        purifyingGatherRadius: 150, // NOVO: Raio de área

        // ⚔️ Quebrando Espadas
        swordsBaseCooldown: 20000, // 20 segundos
        swordsDamageBoost: 0.15, // 15%
        swordsWindow: 6000, // 6 segundos
        
        // ⚔️ Truque Explosivo
        explosiveTrickCooldown: 1000,
        explosiveTrickDamage: 30,
        explosiveTrickRange: 250, // Alcance do cone
        explosiveTrickConeAngle: Math.PI / 3, // 60 graus
        explosiveTrickDebuffDuration: 4000, // 4 segundos
        explosiveTrickHealReduction: 0.25, // 25%
        
        // ⚔️ Barragem de Lances
        thrustBarrageCooldown: 1000,
        thrustBarrageDamage: 30, // Por carta
        thrustBarrageKnockback: 50, // Pixels
        thrustBarrageRadius: 200, // Raio visual

    },
};

// Mapeia classes de campeões para acesso dinâmico no GameManager
// ESTA DECLARAÇÃO DEVE VIR SEMPRE APÓS TODAS as classes de campeões terem sido definidas.
Champion.championClassesMap = {
    ironman: IronMan,
    thor: Thor,
    loki: Loki,
    redhulk: RedHulk,
    emmafrost: EmmaFrost,
    ultron: Ultron,
    captainmarvel: CaptainMarvel,
    hawkeye: Hawkeye,
    usagent: USAgent,
    captainamerica: CaptainAmerica,
    wanda: Wanda,
    noturno: Nightcrawler,
    infinityultron: InfinityUltron,
    karolinadean: KarolinaDean,
    gambit: Gambit,
};
