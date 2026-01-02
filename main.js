// main.js
import { 
    Executor, 
    LeaderExecutor, 
    MysteryExecutor, 
    ExecutorSpawnSystem,
    LeaderLaserProjectile
} from './executors.js';
import { MusicPlayer } from './musicPlayer.js';
import { SoundManager } from './soundManager.js';
import { Champion } from './champions.js';
import { Enemy } from './enemies.js';
import CharacterReactionSystem from './characterReactions.js';
import { 
    Projectile, 
    LaserProjectile, 
    MjolnirProjectile, 
    HawkeyeArrow, 
    CapShieldProjectile, 
    LokiPoisonDagger, 
    USAgentBullet, 
    WandaIllusionPulse, 
    DiamondShardProjectile, 
    DroneLaserProjectile,
    USAgentChargedShield,
    KateBishopArrow, // ⭐ NOVO
    KarolinaPrismBeam,
    //SplitProjectile,
    RealityErasureProjectile,
    NickFuryBullet,      // ✅ NOVO
    QuinjetBullet,        // ✅ NOVO
    QuinjetMissile        // ✅ NOVO    
} from './projectiles.js';
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
    UltronReconstructionEffect, // ⭐ NOVO
    CaptainMarvelMissileExplosionEffect, 
    ThunderStrikeEffect,
    RedHulkExplosionEffect,
    ChainLightningEffect,
    EmmaFormChangeEffect,
    EmmaMentalBlastEffect,
    ArrowStormEffect,
    EmmaDiamondImpactEffect,
    EmmaPsychicPulseEffect,
    PsychicChainEffect,
    HealingBeamEffect,
    AsgardStoneEffect,
    SpaceStonePullChainEffect, // ✅ ADICIONAR ESTA LINHA
    RealityEraseImpactEffect,
    /* ChaosDrainBeamTeamUpEffect */
    PhoenixFlameEffect, // 🔥 ADICIONE
    PhoenixSparkEffect, // 🔥 ADICIONE
    PhoenixExplosionEffect, // 🔥 ADICIONE
    TelekineticBarrageEffect, // ⭐ ADICIONE
    PhoenixRebirthExplosionEffect,
    PsychicWaveEffect,
    VortexImpactEffect,
    TargetLaserEffect,
    OrbitalMissileEffect
} from './effects.js';
class Portal {
    constructor(x, y, exitPortal) {
        this.x = x;
        this.y = y;
        this.exitPortal = exitPortal;
        this.radius = 25;
        this.rotation = 0;
        this.createdAt = Date.now();
        this.active = true;
        this.cooldown = 0;
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        this.rotation += 0.05;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Círculo externo
        ctx.strokeStyle = 'rgba(138, 43, 226, 0.8)';
        ctx.lineWidth = 4;
        ctx.shadowColor = 'rgba(138, 43, 226, 0.8)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Espiral
        ctx.rotate(this.rotation);
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            ctx.strokeStyle = `rgba(147, 112, 219, ${0.6 - i * 0.15})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(
                Math.cos(angle) * this.radius * 0.8,
                Math.sin(angle) * this.radius * 0.8
            );
            ctx.stroke();
        }
        
        // Centro
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius * 0.6);
        gradient.addColorStop(0, 'rgba(75, 0, 130, 0.9)');
        gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Desenha Cones de Atração Psiônica (desenhar antes dos inimigos ou depois do chão)
        if (this.psychicAttractionCones) {
            this.psychicAttractionCones.forEach(cone => cone.draw(ctx));
        }

        // Desenha Team Up da Wanda (Controle do Caos)
        if (this.teamUpEffects) {
            this.teamUpEffects.forEach(effect => effect.draw(this.ctx));
        }

        // Atualiza Team Up da Wanda (Feixe de Drenagem do Caos)
        if (this.chaosDrainEffects) {
            this.chaosDrainEffects = this.chaosDrainEffects.filter(effect => {
                // Assume que o método update() retorna false quando o efeito acaba
                return effect.update(deltaTime, this.enemies); 
            });
        }

        ctx.restore();
    }
    
    checkCollision(enemy) {
        const dx = enemy.getCenterX() - this.x;
        const dy = enemy.getCenterY() - this.y;
        return Math.hypot(dx, dy) < this.radius + enemy.radius;
    }
    
    teleport(enemy, gameManager) {
        if (!this.exitPortal || !this.active || this.cooldown > 0) return;
        
        // Efeito visual de entrada
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 / 15) * i;
            gameManager.effects.push(new gameManager.AuraFireParticleEffect(
                enemy.getCenterX() + Math.cos(angle) * 20,
                enemy.getCenterY() + Math.sin(angle) * 20,
                15,
                'purple',
                300
            ));
        }
        
        // Teleporta
        enemy.x = this.exitPortal.x - enemy.radius;
        enemy.y = this.exitPortal.y - enemy.radius;
        
        // Ajusta pathIndex (pode ir pra frente ou pra trás)
        const shift = Math.random() < 0.5 ? -1 : 1;
        enemy.pathIndex = Math.max(0, Math.min(enemy.path.length - 1, enemy.pathIndex + shift));
        
        // Efeito visual de saída
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 / 15) * i;
            gameManager.effects.push(new gameManager.AuraFireParticleEffect(
                this.exitPortal.x + Math.cos(angle) * 20,
                this.exitPortal.y + Math.sin(angle) * 20,
                15,
                'purple',
                300
            ));
        }
        
        // Cooldown para evitar loop
        this.cooldown = 1000;
        this.exitPortal.cooldown = 1000;
    }
}

// Adicione esta classe antes da classe GameManager:
class Chest {
    constructor(canvas) {
        this.x = Math.random() * (canvas.width - 100) + 50;
        this.y = Math.random() * (canvas.height - 100) + 50;
        this.size = 30;
        this.collected = false;
        this.glowPhase = 0;
        
    }
    

    draw(ctx) {
        if (this.collected) return;
        
        this.glowPhase += 0.1;
        const glow = Math.sin(this.glowPhase) * 0.3 + 0.7;
        
        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x - this.size/2, this.y + this.size/2 - 5, this.size, 5);
        
        // Corpo dourado
        ctx.fillStyle = `rgba(255, 215, 0, ${glow})`;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        
        // Detalhes
        ctx.strokeStyle = `rgba(184, 134, 11, ${glow})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        
        // Fechadura
        ctx.fillStyle = `rgba(139, 69, 19, ${glow})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Ícone
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💰', this.x, this.y - this.size);
    }
    

    checkCollection(mouseX, mouseY) {
        if (this.collected) return false;
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        return Math.hypot(dx, dy) < 50;
    }
    
}
// ⚖️ CLASSE SPLITPROJECTILE MELHORADA
class SplitProjectile {
    constructor(x, y, targetEnemy, gameManagerInstance) {
        this.x = x;
        this.y = y;
        this.target = targetEnemy;
        this.targetX = targetEnemy.getCenterX();
        this.targetY = targetEnemy.getCenterY();
        this.speed = 10;
        this.rotation = 0;
        this.reached = false;
        this.isDestroyed = false;
        this.gameManager = gameManagerInstance;
        this.trail = [];
        this.trailMaxLength = 15;
    }
    
    update(deltaTime) {
        if (this.reached || !this.target || this.target.hp <= 0) {
            this.isDestroyed = true;
            return;
        }
        
        // Adiciona posição ao rastro
        this.trail.push({ x: this.x, y: this.y, alpha: 1 });
        if (this.trail.length > this.trailMaxLength) {
            this.trail.shift();
        }
        
        // Fade out do rastro
        this.trail.forEach((point, index) => {
            point.alpha = index / this.trail.length;
        });
        
        // Atualiza posição do alvo (teleguiado)
        this.targetX = this.target.getCenterX();
        this.targetY = this.target.getCenterY();
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < 25) {
            this.reached = true;
            this.splitEnemy();
            return;
        }
        
        const angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
        this.rotation += 0.3;
    }
    
    draw(ctx) {
        // ===============================
        // RASTRO
        // ===============================
        this.trail.forEach((point, index) => {
            const size = 15 * point.alpha;
            const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size);
            gradient.addColorStop(0, `rgba(139, 69, 19, ${point.alpha * 0.6})`);
            gradient.addColorStop(1, `rgba(139, 69, 19, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // ===============================
        // BRILHO EXTERNO
        // ===============================
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
        glowGradient.addColorStop(0, 'rgba(160, 82, 45, 0.8)');
        glowGradient.addColorStop(0.5, 'rgba(139, 69, 19, 0.5)');
        glowGradient.addColorStop(1, 'rgba(101, 67, 33, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // ===============================
        // SÍMBOLO DE DIVISÃO
        // ===============================
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 4;
        ctx.shadowColor = 'rgba(139, 69, 19, 0.8)';
        ctx.shadowBlur = 10;
        
        // Linha horizontal
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(18, 0);
        ctx.stroke();
        
        // Círculos superior e inferior
        ctx.fillStyle = '#8B4513';
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(-6, -10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(6, 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Contorno dos círculos
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(-6, -10, 5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(6, 10, 5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        // ===============================
        // PARTÍCULAS ROTATIVAS
        // ===============================
        for (let i = 0; i < 4; i++) {
            const particleAngle = (Math.PI * 2 / 4) * i + this.rotation * 2;
            const particleDist = 20;
            const px = Math.cos(particleAngle) * particleDist;
            const py = Math.sin(particleAngle) * particleDist;
            
            ctx.fillStyle = 'rgba(139, 69, 19, 0.7)';
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    splitEnemy() {
        const enemy = this.target;
        const splitCount = 5;
        const newHealth = enemy.hp / splitCount;
        const newDamage = (enemy.data.baseDamage || 10) / splitCount;
        const originalX = enemy.x;
        const originalY = enemy.y;
        
        // ===============================
        // EXPLOSÃO VISUAL ÉPICA
        // ===============================
        
        // Ondas de choque múltiplas
        for (let wave = 0; wave < 3; wave++) {
            setTimeout(() => {
                this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                    enemy.getCenterX(),
                    enemy.getCenterY(),
                    80 + wave * 30,
                    400
                ));
            }, wave * 100);
        }
        
        // Explosão marrom central
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            enemy.getCenterX(),
            enemy.getCenterY(),
            100,
            500,
            'rgba(139, 69, 19, 1)'
        ));
        
        // Partículas em todas as direções
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 / 40) * i;
            const distance = 20 + Math.random() * 30;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                enemy.getCenterX() + Math.cos(angle) * distance,
                enemy.getCenterY() + Math.sin(angle) * distance,
                15,
                'brown',
                600
            ));
        }
        
        // Linhas de divisão visual
        for (let i = 0; i < splitCount; i++) {
            const angle = (Math.PI * 2 / splitCount) * i;
            const endX = enemy.getCenterX() + Math.cos(angle) * 60;
            const endY = enemy.getCenterY() + Math.sin(angle) * 60;
            
            this.gameManager.effects.push(new this.gameManager.LaserEffect(
                enemy.getCenterX(),
                enemy.getCenterY(),
                endX,
                endY,
                6,
                'rgba(139, 69, 19, 0.8)',
                0.4
            ));
        }
        
        // Remove original
        const index = this.gameManager.enemies.indexOf(enemy);
        if (index > -1) {
            this.gameManager.enemies.splice(index, 1);
        }
        
        // ===============================
        // CRIA 5 CÓPIAS MENORES
        // ===============================
        for (let i = 0; i < splitCount; i++) {
            const angle = (Math.PI * 2 / splitCount) * i;
            const spreadDistance = 50;
            
            const newEnemy = new Enemy(
                `split-${Date.now()}-${i}`,
                originalX + Math.cos(angle) * spreadDistance,
                originalY + Math.sin(angle) * spreadDistance,
                enemy.type,
                {
                    ...enemy.data,
                    hp: newHealth,
                    baseDamage: newDamage,
                    radius: enemy.data.radius * 0.6
                },
                enemy.path
            );
            
            newEnemy.gameManager = this.gameManager;
            newEnemy.hp = newHealth;
            newEnemy.maxHp = newHealth;
            newEnemy.pathIndex = enemy.pathIndex;
            newEnemy.isSplit = true;
            
            // Efeito de spawn individual
            setTimeout(() => {
                this.gameManager.effects.push(new this.gameManager.BamfEffect(
                    newEnemy.getCenterX(),
                    newEnemy.getCenterY(),
                    'brown',
                    300
                ));
            }, i * 100);
            
            this.gameManager.enemies.push(newEnemy);
        }
        
        // Texto épico
        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
            enemy.getCenterX(),
            enemy.getCenterY() - 60,
            'REBOLINHO! ⚖️',
            'brown',
            1500
        ));
        
        this.gameManager.showUI('Loki: Inimigo dividido em 5 partes! ⚖️', 'ultimate');
    }
}
// 💬 CLASSE DE BALÃO DE FALA
class SpeechBubble {
    constructor(x, y, text, duration = 3000) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.duration = duration;
        this.spawnTime = Date.now();
        this.alpha = 0;
        this.fadeInDuration = 300;
        this.fadeOutStart = duration - 500;
        this.offset = 0;
        this.isDestroyed = false;
    }
    
    update(deltaTime) {
        const elapsed = Date.now() - this.spawnTime;
        
        // Fade in
        if (elapsed < this.fadeInDuration) {
            this.alpha = elapsed / this.fadeInDuration;
        } 
        // Fade out
        else if (elapsed > this.fadeOutStart) {
            this.alpha = 1 - ((elapsed - this.fadeOutStart) / 500);
        } 
        // Full opacity
        else {
            this.alpha = 1;
        }
        
        // Flutuação suave
        this.offset = Math.sin(elapsed / 200) * 3;
        
        // Destrói quando acabar
        if (elapsed > this.duration) {
            this.isDestroyed = true;
        }
    }
    
    draw(ctx) {
        if (this.alpha <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        const bubbleX = this.x;
        const bubbleY = this.y + this.offset;
        
        // Mede o texto
        ctx.font = 'bold 12px Arial';
        const textMetrics = ctx.measureText(this.text);
        const textWidth = textMetrics.width;
        const padding = 12;
        const bubbleWidth = textWidth + padding * 2;
        const bubbleHeight = 28;
        const cornerRadius = 8;
        
        // ===============================
        // SOMBRA DO BALÃO
        // ===============================
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.roundRect(bubbleX - bubbleWidth/2 + 2, bubbleY - bubbleHeight - 8 + 2, bubbleWidth, bubbleHeight, cornerRadius);
        ctx.fill();
        
        // ===============================
        // BALÃO PRINCIPAL
        // ===============================
        const gradient = ctx.createLinearGradient(
            bubbleX, bubbleY - bubbleHeight - 8,
            bubbleX, bubbleY - 8
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        gradient.addColorStop(1, 'rgba(245, 245, 255, 0.95)');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = 'rgba(147, 112, 219, 0.8)';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(147, 112, 219, 0.5)';
        ctx.shadowBlur = 10;
        
        // Retângulo arredondado
        ctx.beginPath();
        ctx.roundRect(bubbleX - bubbleWidth/2, bubbleY - bubbleHeight - 8, bubbleWidth, bubbleHeight, cornerRadius);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        // ===============================
        // PONTINHA DO BALÃO
        // ===============================
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = 'rgba(147, 112, 219, 0.8)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(bubbleX - 8, bubbleY - 8);
        ctx.lineTo(bubbleX, bubbleY + 5);
        ctx.lineTo(bubbleX + 2, bubbleY - 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // ===============================
        // TEXTO
        // ===============================
        ctx.fillStyle = 'rgba(75, 0, 130, 1)';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, bubbleX, bubbleY - bubbleHeight/2 - 8);
        
        // ===============================
        // BRILHOS DECORATIVOS
        // ===============================
        const sparklePositions = [
            { x: bubbleX - bubbleWidth/2 + 8, y: bubbleY - bubbleHeight - 4 },
            { x: bubbleX + bubbleWidth/2 - 8, y: bubbleY - bubbleHeight - 4 },
            { x: bubbleX, y: bubbleY - bubbleHeight/2 - 8 }
        ];
        
        sparklePositions.forEach((pos, index) => {
            const sparkleAlpha = Math.sin(Date.now() / 300 + index * 2) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 215, 0, ${sparkleAlpha * this.alpha})`;
            ctx.font = '10px Arial';
            ctx.fillText('✨', pos.x, pos.y);
        });
        
        ctx.restore();
    }
}

// ========================================
// SISTEMA DE ITENS E FERRAMENTAS
// ========================================

class CollectorSystem {
    constructor(gameManager) {
        this.gameManager = gameManager;
                // ✅ LIMPA INVENTÁRIO CORROMPIDO (remova depois de rodar uma vez)
        console.log('🧹 Limpando localStorage corrompido...');
        localStorage.removeItem('collectorInventory');
    
        this.inventory = {
            items: [],      // Itens globais (buffs permanentes)
            tools: []       // Ferramentas (ligadas a champions específicos)
        };
        
        this.rarityWeights = {
            basic: 0.50,    // 50%
            rare: 0.30,     // 30%
            epic: 0.15,     // 15%
            legendary: 0.05 // 5%
        };
        
        this.rarityColors = {
            basic: '#FFFFFF',
            rare: '#3498db',
            epic: '#9b59b6',
            legendary: '#f39c12'
        };
        
        // Contadores para abrir baús
        this.levelUpsThisPhase = 0;
        this.levelsNeededForChest = 2;
        
        this.setupUI();
    }
    
// ========================================
// ANIMAÇÃO DE BAÚ MELHORADA E CENTRALIZADA
// ========================================

setupUI() {
    const overlay = document.createElement('div');
    overlay.id = 'collectorChestOverlay';
    overlay.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10000;
        justify-content: center;
        align-items: center;
    `;
    
    overlay.innerHTML = `
        <div id="chestContainer" style="
            position: relative;
            width: 600px;
            height: 700px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        ">
            <canvas id="chestCanvas" width="600" height="700" style="position: absolute; top: 0; left: 0;"></canvas>
            
            <!-- ✅ CORREÇÃO: Container centralizado -->
            <div id="chestReward" style="
                display: none;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 500px;
                text-align: center;
                color: white;
            ">
                <h2 id="rewardName" style="
                    font-size: 38px;
                    margin: 0 0 20px 0;
                    text-shadow: 0 0 20px currentColor;
                    word-wrap: break-word;
                "></h2>
                
                <div id="rewardIcon" style="
                    font-size: 100px;
                    margin: 20px 0;
                    filter: drop-shadow(0 0 20px currentColor);
                "></div>
                
                <div id="rewardRarity" style="
                    font-size: 18px;
                    margin: 15px 0;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    font-weight: bold;
                "></div>
                
                <p id="rewardDescription" style="
                    font-size: 16px;
                    margin: 20px auto;
                    line-height: 1.6;
                    max-width: 400px;
                    text-align: center;
                "></p>
                
                <p id="rewardEffect" style="
                    font-size: 15px;
                    color: #FFD700;
                    margin: 20px auto;
                    padding: 12px 20px;
                    background: rgba(255, 215, 0, 0.15);
                    border-radius: 12px;
                    border: 2px solid rgba(255, 215, 0, 0.4);
                    max-width: 420px;
                    text-align: center;
                    line-height: 1.5;
                "></p>
                
                <button id="claimRewardBtn" style="
                    margin-top: 30px;
                    padding: 18px 50px;
                    font-size: 22px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-radius: 15px;
                    color: white;
                    cursor: pointer;
                    font-weight: bold;
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
                    transition: all 0.3s;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                ">RECEBER ✨</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('claimRewardBtn').addEventListener('click', () => {
        this.closeChest();
    });
    
    document.getElementById('claimRewardBtn').addEventListener('mouseenter', (e) => {
        e.target.style.transform = 'scale(1.1)';
        e.target.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.7)';
    });
    
    document.getElementById('claimRewardBtn').addEventListener('mouseleave', (e) => {
        e.target.style.transform = 'scale(1)';
        e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)';
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('collectorChestOverlay');
            if (overlay.style.display === 'flex') {
                this.closeChest();
            }
        }
    });
    
    // ✅ Chama setupInventoryButton APÓS criar a UI
    this.setupInventoryButton();
}
    
    // ========================================
    // ABRIR BAÚ (TIRAR ?)
    // ========================================
openChest(reason = 'levelup') {
    console.log('🎁 Abrindo baú do Colecionador...');
    
    // ✅ VERIFICA SE ANIMAÇÃO ESTÁ ATIVADA
    if (!this.gameManager.chestAnimationEnabled) {
        console.log('⏭️ Animação desativada, pulando para recompensa...');
        const reward = this.generateReward();
        this.showReward(reward, reason);
        
        const overlay = document.getElementById('collectorChestOverlay');
        overlay.style.display = 'flex';
        document.getElementById('chestReward').style.display = 'block';
        return;
    }
    
    // Animação normal...
    const overlay = document.getElementById('collectorChestOverlay');
    const canvas = document.getElementById('chestCanvas');
    const ctx = canvas.getContext('2d');
    const rewardDiv = document.getElementById('chestReward');
    
    overlay.style.display = 'flex';
    rewardDiv.style.display = 'none';
    
    this.animateChestOpening(ctx, canvas, () => {
        const reward = this.generateReward();
        this.showReward(reward, reason);
    });
}

    
    
// ========================================
// ANIMAÇÃO DE BAÚ ÉPICA E COMPLEXA
// ========================================

animateChestOpening(ctx, canvas, onComplete) {
    const width = canvas.width;
    const height = canvas.height;
    let frame = 0;
    const totalFrames = 180; // Mais longo e épico
    let chestShake = 0;
    let openProgress = 0;
    let explosionParticles = [];
    
    // Partículas da explosão
    for (let i = 0; i < 50; i++) {
        explosionParticles.push({
            angle: Math.random() * Math.PI * 2,
            speed: 2 + Math.random() * 4,
            distance: 0,
            size: 3 + Math.random() * 5,
            color: ['#FFD700', '#FFA500', '#FF6347', '#FF1493', '#00CED1'][Math.floor(Math.random() * 5)],
            alpha: 1
        });
    }
    
    const animate = () => {
        frame++;
        ctx.clearRect(0, 0, width, height);
        
        // ===============================
        // FASE 1: BAÚ FECHADO TREMENDO (0-80)
        // ===============================
        if (frame < 80) {
            const intensity = frame / 80;
            chestShake = Math.sin(frame * 0.4) * (10 * intensity);
            
            ctx.save();
            ctx.translate(width / 2 + chestShake, height / 2);
            
            // ===============================
            // FUNDO RADIANTE
            // ===============================
            const bgGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 300);
            bgGradient.addColorStop(0, `rgba(255, 215, 0, ${intensity * 0.3})`);
            bgGradient.addColorStop(0.5, `rgba(255, 140, 0, ${intensity * 0.2})`);
            bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = bgGradient;
            ctx.beginPath();
            ctx.arc(0, 0, 300, 0, Math.PI * 2);
            ctx.fill();
            
            // ===============================
            // BRILHO PULSANTE COMPLEXO
            // ===============================
            for (let ring = 0; ring < 4; ring++) {
                const ringSize = 100 + ring * 40 + Math.sin(frame * 0.15 + ring) * 20;
                const ringAlpha = (0.4 - ring * 0.08) * intensity;
                
                const ringGradient = ctx.createRadialGradient(0, 0, ringSize * 0.8, 0, 0, ringSize);
                ringGradient.addColorStop(0, `rgba(255, 215, 0, 0)`);
                ringGradient.addColorStop(0.7, `rgba(255, 215, 0, ${ringAlpha})`);
                ringGradient.addColorStop(1, `rgba(255, 140, 0, 0)`);
                
                ctx.fillStyle = ringGradient;
                ctx.beginPath();
                ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // ===============================
            // CORPO DO BAÚ (DETALHADO)
            // ===============================
            // Sombra
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(-85, 45, 170, 10);
            
            // Base do baú (madeira escura)
            const woodGradient = ctx.createLinearGradient(0, -40, 0, 40);
            woodGradient.addColorStop(0, '#5D4037');
            woodGradient.addColorStop(0.5, '#6D4C41');
            woodGradient.addColorStop(1, '#4E342E');
            ctx.fillStyle = woodGradient;
            ctx.fillRect(-80, -40, 160, 80);
            
            // Detalhes de madeira (tábuas)
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 2;
            for (let i = -60; i < 80; i += 20) {
                ctx.beginPath();
                ctx.moveTo(i, -40);
                ctx.lineTo(i, 40);
                ctx.stroke();
            }
            
            // Ferragens laterais (dourado)
            ctx.fillStyle = '#B8860B';
            ctx.fillRect(-85, -20, 5, 40);
            ctx.fillRect(80, -20, 5, 40);
            
            // ===============================
            // TAMPA ARQUEADA (DETALHADA)
            // ===============================
            ctx.save();
            
            const lidGradient = ctx.createLinearGradient(0, -100, 0, -40);
            lidGradient.addColorStop(0, '#4E342E');
            lidGradient.addColorStop(0.5, '#5D4037');
            lidGradient.addColorStop(1, '#6D4C41');
            ctx.fillStyle = lidGradient;
            
            ctx.beginPath();
            ctx.moveTo(-80, -40);
            ctx.lineTo(-80, -80);
            ctx.quadraticCurveTo(-80, -100, -60, -105);
            ctx.lineTo(-20, -110);
            ctx.quadraticCurveTo(0, -112, 20, -110);
            ctx.lineTo(60, -105);
            ctx.quadraticCurveTo(80, -100, 80, -80);
            ctx.lineTo(80, -40);
            ctx.closePath();
            ctx.fill();
            
            // Faixas douradas na tampa
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-70, -40);
            ctx.lineTo(-70, -75);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -40);
            ctx.lineTo(0, -80);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(70, -40);
            ctx.lineTo(70, -75);
            ctx.stroke();
            
            ctx.restore();
            
            // ===============================
            // FECHADURA COMPLEXA
            // ===============================
            // Placa da fechadura
            ctx.fillStyle = '#DAA520';
            ctx.beginPath();
            ctx.roundRect(-20, -15, 40, 30, 5);
            ctx.fill();
            
            // Borda da fechadura
            ctx.strokeStyle = '#B8860B';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Buraco da fechadura (brilhante)
            const keyholePulse = Math.sin(frame * 0.3) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 215, 0, ${keyholePulse})`;
            ctx.shadowColor = 'rgba(255, 215, 0, 1)';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Centro do buraco (escuro)
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(0, 6);
            ctx.lineTo(-3, 15);
            ctx.lineTo(3, 15);
            ctx.closePath();
            ctx.fill();
            
            // ===============================
            // PARTÍCULAS ORBITANDO
            // ===============================
            for (let i = 0; i < 12; i++) {
                const particleAngle = (Math.PI * 2 / 12) * i + frame * 0.05;
                const particleDist = 120 + Math.sin(frame * 0.1 + i) * 15;
                const px = Math.cos(particleAngle) * particleDist;
                const py = Math.sin(particleAngle) * particleDist;
                const particleSize = 4 + Math.sin(frame * 0.2 + i) * 2;
                
                const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, particleSize);
                particleGradient.addColorStop(0, 'rgba(255, 215, 0, 1)');
                particleGradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
                
                ctx.fillStyle = particleGradient;
                ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(px, py, particleSize, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;
            
            // ===============================
            // RUNAS MÍSTICAS
            // ===============================
            const runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ'];
            ctx.fillStyle = `rgba(255, 215, 0, ${intensity * 0.8})`;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 215, 0, 1)';
            ctx.shadowBlur = 10;
            
            runes.forEach((rune, index) => {
                const runeAngle = (Math.PI * 2 / runes.length) * index + frame * 0.03;
                const runeDist = 140;
                const rx = Math.cos(runeAngle) * runeDist;
                const ry = Math.sin(runeAngle) * runeDist;
                
                ctx.save();
                ctx.translate(rx, ry);
                ctx.rotate(runeAngle + Math.PI / 2);
                ctx.fillText(rune, 0, 0);
                ctx.restore();
            });
            ctx.shadowBlur = 0;
            
            ctx.restore();
            
            // ===============================
            // TEXTO "ABRINDO..."
            // ===============================
            const textPulse = Math.sin(frame * 0.2) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 255, 255, ${textPulse})`;
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 215, 0, 1)';
            ctx.shadowBlur = 20;
            ctx.fillText('✨ ABRINDO... ✨', width / 2, height - 60);
            ctx.shadowBlur = 0;
        }
        // ===============================
        // FASE 2: ABRINDO (80-130)
        // ===============================
        else if (frame < 130) {
            openProgress = (frame - 80) / 50;
            const easeProgress = 1 - Math.pow(1 - openProgress, 3); // Ease out cubic
            
            ctx.save();
            ctx.translate(width / 2, height / 2);
            
            // ===============================
            // EXPLOSÃO DE LUZ CRESCENTE
            // ===============================
            const flashSize = 250 * easeProgress;
            const flashGradient = ctx.createRadialGradient(0, -40, 0, 0, -40, flashSize);
            flashGradient.addColorStop(0, `rgba(255, 255, 255, ${easeProgress})`);
            flashGradient.addColorStop(0.3, `rgba(255, 215, 0, ${easeProgress * 0.8})`);
            flashGradient.addColorStop(0.6, `rgba(255, 140, 0, ${easeProgress * 0.5})`);
            flashGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
            
            ctx.fillStyle = flashGradient;
            ctx.beginPath();
            ctx.arc(0, -40, flashSize, 0, Math.PI * 2);
            ctx.fill();
            
            // ===============================
            // CORPO DO BAÚ
            // ===============================
            const woodGradient = ctx.createLinearGradient(0, -40, 0, 40);
            woodGradient.addColorStop(0, '#5D4037');
            woodGradient.addColorStop(0.5, '#6D4C41');
            woodGradient.addColorStop(1, '#4E342E');
            ctx.fillStyle = woodGradient;
            ctx.fillRect(-80, -40, 160, 80);
            
            // ===============================
            // TAMPA ABRINDO (ROTAÇÃO)
            // ===============================
            ctx.save();
            ctx.translate(0, -40);
            ctx.rotate(-easeProgress * Math.PI * 0.55); // Abre mais que 90 graus
            
            const lidGradient = ctx.createLinearGradient(0, -70, 0, 0);
            lidGradient.addColorStop(0, '#4E342E');
            lidGradient.addColorStop(0.5, '#5D4037');
            lidGradient.addColorStop(1, '#6D4C41');
            ctx.fillStyle = lidGradient;
            
            ctx.beginPath();
            ctx.moveTo(-80, 0);
            ctx.lineTo(-80, -40);
            ctx.quadraticCurveTo(-80, -60, -60, -65);
            ctx.lineTo(-20, -70);
            ctx.quadraticCurveTo(0, -72, 20, -70);
            ctx.lineTo(60, -65);
            ctx.quadraticCurveTo(80, -60, 80, -40);
            ctx.lineTo(80, 0);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
            
            // ===============================
            // RAIOS DE LUZ SAINDO
            // ===============================
            for (let i = 0; i < 16; i++) {
                const rayAngle = (Math.PI * 2 / 16) * i;
                const rayLength = 150 * easeProgress;
                const rayAlpha = easeProgress * (0.6 + Math.sin(frame * 0.3 + i) * 0.4);
                
                ctx.strokeStyle = `rgba(255, 255, 255, ${rayAlpha})`;
                ctx.lineWidth = 4;
                ctx.shadowColor = 'rgba(255, 215, 0, 1)';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.moveTo(0, -40);
                ctx.lineTo(Math.cos(rayAngle) * rayLength, -40 + Math.sin(rayAngle) * rayLength);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
            
            // ===============================
            // PARTÍCULAS SUBINDO
            // ===============================
            for (let i = 0; i < 30; i++) {
                const pAngle = (Math.PI * 2 / 30) * i;
                const pDist = easeProgress * 120 + Math.sin(frame * 0.2 + i) * 20;
                const px = Math.cos(pAngle) * pDist;
                const py = -40 + Math.sin(pAngle) * pDist - easeProgress * 60;
                const pSize = 5 * (1 - easeProgress * 0.5);
                
                ctx.fillStyle = `rgba(255, 215, 0, ${1 - easeProgress})`;
                ctx.beginPath();
                ctx.arc(px, py, pSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
            
            // ===============================
            // TEXTO "REVELANDO..."
            // ===============================
            ctx.fillStyle = `rgba(255, 255, 255, ${easeProgress})`;
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 215, 0, 1)';
            ctx.shadowBlur = 25;
            ctx.fillText('⭐ REVELANDO... ⭐', width / 2, height - 60);
            ctx.shadowBlur = 0;
        }
        // ===============================
        // FASE 3: EXPLOSÃO FINAL (130-180)
        // ===============================
        else {
            const explosionProgress = (frame - 130) / 50;
            
            // Flash branco diminuindo
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, 1 - explosionProgress * 2)})`;
            ctx.fillRect(0, 0, width, height);
            
            // Partículas explodindo
            ctx.save();
            ctx.translate(width / 2, height / 2);
            
            explosionParticles.forEach(p => {
                p.distance += p.speed * (1 + explosionProgress);
                p.alpha = 1 - explosionProgress;
                
                const px = Math.cos(p.angle) * p.distance;
                const py = Math.sin(p.angle) * p.distance;
                
                ctx.fillStyle = p.color.replace(')', `, ${p.alpha})`).replace('rgb', 'rgba');
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(px, py, p.size * (1 - explosionProgress * 0.5), 0, Math.PI * 2);
                ctx.fill();
            });
            
            ctx.shadowBlur = 0;
            ctx.restore();
        }
        
        if (frame < totalFrames) {
            requestAnimationFrame(animate);
        } else {
            onComplete();
        }
    };
    
    animate();
}
   
closeChest() {
        const overlay = document.getElementById('collectorChestOverlay');
        overlay.style.display = 'none';
        
        // Retoma o jogo se estava pausado
        if (this.gameManager.isPaused) {
            this.gameManager.isPaused = false;
        }
    }
    
// ========================================
// CORREÇÃO: EVITAR DUPLICATAS NO INVENTÁRIO
// ========================================

showReward(reward, reason) {
    const rewardDiv = document.getElementById('chestReward');
    const nameEl = document.getElementById('rewardName');
    const iconEl = document.getElementById('rewardIcon');
    const descEl = document.getElementById('rewardDescription');
    const effectEl = document.getElementById('rewardEffect');
    const rarityEl = document.getElementById('rewardRarity');
    
    const color = this.rarityColors[reward.rarity];
        
    // ✅ Aplica cores e sombras
    nameEl.style.color = color;
    nameEl.style.textShadow = `0 0 30px ${color}, 0 0 60px ${color}`;
    iconEl.style.color = color;
    iconEl.style.filter = `drop-shadow(0 0 20px ${color})`;
    
    // ✅ Preenche conteúdo
    nameEl.textContent = reward.name;
    iconEl.textContent = reward.icon;
    descEl.textContent = reward.description;
    effectEl.textContent = `✨ ${reward.effect}`;
    rarityEl.textContent = `【 ${reward.rarity.toUpperCase()} 】`;
    rarityEl.style.color = color;
    rarityEl.style.textShadow = `0 0 15px ${color}`;
    
 // ✅ ADICIONA AO INVENTÁRIO SOMENTE UMA VEZ
    if (reward.type === 'item') {
        // Verifica se já existe (por ID)
        const exists = this.inventory.items.some(item => item.id === reward.id);
        if (!exists) {
            this.inventory.items.push(reward);
            console.log(`📦 Item adicionado: ${reward.name} (ID: ${reward.id})`);
            console.log(`   Total de itens: ${this.inventory.items.length}`);
            this.applyItemEffect(reward);
        } else {
            console.warn('⚠️ Item já existe no inventário, pulando...');
        }
    } else {
        // Verifica se já existe (por ID)
        const exists = this.inventory.tools.some(tool => tool.id === reward.id);
        if (!exists) {
            this.inventory.tools.push(reward);
            console.log(`🔧 Ferramenta adicionada: ${reward.name} (ID: ${reward.id})`);
            console.log(`   Total de ferramentas: ${this.inventory.tools.length}`);
        } else {
            console.warn('⚠️ Ferramenta já existe no inventário, pulando...');
        }
    }
    
    // ✅ Animação de entrada suave
    setTimeout(() => {
        rewardDiv.style.display = 'block';
        rewardDiv.style.opacity = '0';
        rewardDiv.style.transform = 'translate(-50%, -50%) scale(0.5)';
        rewardDiv.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        
        setTimeout(() => {
            rewardDiv.style.opacity = '1';
            rewardDiv.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 50);
    }, 200);
        
    // ✅ SALVA SOMENTE UMA VEZ
    this.saveInventory();
    
    const typeText = reward.type === 'item' ? 'Item' : 'Ferramenta';
    this.gameManager.showUI(`🎁 Novo ${typeText}: ${reward.name}!`, 'special');
}

// ========================================
// LIMPAR INVENTÁRIO CORROMPIDO
// ========================================

cleanInventory() {
    console.log('🧹 LIMPANDO INVENTÁRIO...');
    console.log(`  Ferramentas antes: ${this.inventory.tools.length}`);
    console.log(`  Itens antes: ${this.inventory.items.length}`);
    
    // ✅ Remove duplicatas de ferramentas
    const uniqueTools = [];
    const seenTools = new Set();
    
    this.inventory.tools.forEach(tool => {
        const key = `${tool.name}-${tool.rarity}`;
        if (!seenTools.has(key)) {
            seenTools.add(key);
            uniqueTools.push(tool);
        }
    });
    
    // ✅ Remove duplicatas de itens
    const uniqueItems = [];
    const seenItems = new Set();
    
    this.inventory.items.forEach(item => {
        const key = `${item.name}-${item.rarity}`;
        if (!seenItems.has(key)) {
            seenItems.add(key);
            uniqueItems.push(item);
        }
    });
    
    this.inventory.tools = uniqueTools;
    this.inventory.items = uniqueItems;
    
    console.log(`  Ferramentas depois: ${this.inventory.tools.length}`);
    console.log(`  Itens depois: ${this.inventory.items.length}`);
    
    // ✅ Salva inventário limpo
    this.saveInventory();
    
    console.log('✅ Inventário limpo e salvo');
    
    this.gameManager.showUI('🧹 Inventário limpo com sucesso!', 'success');
}

// ========================================
// RESETAR INVENTÁRIO (EMERGÊNCIA)
// ========================================

resetInventory() {
    if (!confirm('⚠️ Isso vai APAGAR TODO o inventário. Confirma?')) {
        return;
    }
    
    console.log('🗑️ RESETANDO INVENTÁRIO...');
    
    this.inventory = {
        items: [],
        tools: []
    };
    
    this.saveInventory();
    
    console.log('✅ Inventário resetado');
    this.gameManager.showUI('🗑️ Inventário resetado!', 'warning');
}


// ========================================
// SISTEMA DE INVENTÁRIO COM UI
// ========================================

// ========================================
// CORREÇÃO: BOTÃO DE INVENTÁRIO
// ========================================

setupInventoryButton() {
    // Aguarda o DOM estar pronto
    setTimeout(() => {
        const menu = document.getElementById('menu');
        
        if (!menu) {
            console.error('❌ Menu não encontrado! Tentando novamente...');
            setTimeout(() => this.setupInventoryButton(), 500);
            return;
        }
        
        // Remove botão antigo se existir
        const oldBtn = document.getElementById('inventoryBtn');
        if (oldBtn) oldBtn.remove();
        
        const inventoryBtn = document.createElement('button');
        inventoryBtn.id = 'inventoryBtn';
        inventoryBtn.innerHTML = '🎒 INVENTÁRIO';
        inventoryBtn.style.cssText = `
            width: 100%;
            padding: 12px;
            margin-top: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 10px;
            color: white;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        `;
        
        inventoryBtn.addEventListener('mouseenter', () => {
            inventoryBtn.style.transform = 'scale(1.05)';
            inventoryBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
        });
        
        inventoryBtn.addEventListener('mouseleave', () => {
            inventoryBtn.style.transform = 'scale(1)';
            inventoryBtn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
        });
        
        inventoryBtn.addEventListener('click', () => {
            console.log('🎒 Abrindo inventário...');
            this.openInventory();
        });
        
        menu.appendChild(inventoryBtn);
        console.log('✅ Botão de inventário adicionado ao menu');
        
        this.createInventoryModal();
    }, 1000); // Aguarda 1 segundo para o menu estar renderizado
}


// ========================================
// MODAL REORGANIZADO: ITENS ATUAIS PRIMEIRO
// ========================================

createInventoryModal() {
    const modal = document.createElement('div');
    modal.id = 'inventoryModal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 9999;
        justify-content: center;
        align-items: center;
        overflow-y: auto;
    `;
    
    modal.innerHTML = `
        <div style="
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            border-radius: 20px;
            padding: 30px;
            width: 90%;
            max-width: 1200px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border: 3px solid rgba(255, 255, 255, 0.2);
            margin: 20px;
        ">
            <!-- HEADER -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h2 style="color: white; margin: 0; font-size: 32px; text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);">
                    🎒 INVENTÁRIO DO COLECIONADOR
                </h2>
                <button id="closeInventoryBtn" style="
                    background: rgba(255, 0, 0, 0.3);
                    border: 2px solid rgba(255, 0, 0, 0.5);
                    color: white;
                    font-size: 28px;
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-weight: bold;
                ">×</button>
            </div>
            
            <!-- ✅ TABS COM 3 OPÇÕES -->
            <div style="display: flex; gap: 10px; margin-bottom: 30px;">
                <button class="inventory-tab active" data-tab="equipped" style="
                    flex: 1;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 10px;
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                ">✅ EQUIPADAS</button>
                
                <button class="inventory-tab" data-tab="available" style="
                    flex: 1;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid transparent;
                    border-radius: 10px;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                ">📦 DISPONÍVEIS</button>
                
                <button class="inventory-tab" data-tab="encyclopedia" style="
                    flex: 1;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid transparent;
                    border-radius: 10px;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                ">📖 ENCICLOPÉDIA</button>
            </div>
            
            <!-- ✅ SEÇÃO EQUIPADAS -->
            <div id="equippedSection" class="inventory-section" style="display: block;">
                <div style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 15px;
                    border-radius: 10px;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    margin-bottom: 20px;
                ">
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 14px;">
                        <span style="font-size: 20px;">✅</span>
                        <span>Ferramentas atualmente equipadas em Champions</span>
                    </p>
                </div>
                <div id="equippedGrid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 15px;
                "></div>
            </div>
            
            <!-- ✅ SEÇÃO DISPONÍVEIS -->
            <div id="availableSection" class="inventory-section" style="display: none;">
                <div style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 15px;
                    border-radius: 10px;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    margin-bottom: 20px;
                ">
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 14px;">
                        <span style="font-size: 20px;">💡</span>
                        <span>Arraste uma ferramenta até um Champion no campo para equipá-la</span>
                    </p>
                </div>
                <div id="availableGrid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 15px;
                "></div>
            </div>
            
            <!-- ✅ SEÇÃO ENCICLOPÉDIA -->
            <div id="encyclopediaSection" class="inventory-section" style="display: none;">
                <div style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 15px;
                    border-radius: 10px;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    margin-bottom: 20px;
                ">
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 0; font-size: 14px;">
                        <span style="font-size: 20px;">📖</span>
                        <span>Todas as ferramentas e itens disponíveis no jogo</span>
                    </p>
                </div>
                
                <!-- Filtros -->
                <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                    <select id="encyclopediaType" style="
                        flex: 1;
                        padding: 12px;
                        background: rgba(255, 255, 255, 0.1);
                        border: 2px solid rgba(255, 255, 255, 0.2);
                        border-radius: 8px;
                        color: white;
                        font-size: 14px;
                        cursor: pointer;
                    ">
                        <option value="all">🔧 Todos</option>
                        <option value="tools">⚙️ Ferramentas</option>
                        <option value="items">📦 Itens</option>
                    </select>
                    
                    <select id="encyclopediaRarity" style="
                        flex: 1;
                        padding: 12px;
                        background: rgba(255, 255, 255, 0.1);
                        border: 2px solid rgba(255, 255, 255, 0.2);
                        border-radius: 8px;
                        color: white;
                        font-size: 14px;
                        cursor: pointer;
                    ">
                        <option value="all">⭐ Todas as Raridades</option>
                        <option value="basic">⚪ Básico</option>
                        <option value="rare">🔵 Raro</option>
                        <option value="epic">🟣 Épico</option>
                        <option value="legendary">🟠 Lendário</option>
                    </select>
                </div>
                
                <div id="encyclopediaGrid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 15px;
                "></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // ✅ BOTÃO FECHAR
    document.getElementById('closeInventoryBtn').addEventListener('click', () => {
        this.closeInventory();
    });
    
    document.getElementById('closeInventoryBtn').addEventListener('mouseenter', (e) => {
        e.target.style.background = 'rgba(255, 0, 0, 0.6)';
        e.target.style.transform = 'rotate(90deg) scale(1.1)';
    });
    
    document.getElementById('closeInventoryBtn').addEventListener('mouseleave', (e) => {
        e.target.style.background = 'rgba(255, 0, 0, 0.3)';
        e.target.style.transform = 'rotate(0deg) scale(1)';
    });
    
    // ✅ TABS
    document.querySelectorAll('.inventory-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            this.switchInventoryTab(tabName);
        });
        
        tab.addEventListener('mouseenter', (e) => {
            if (!e.target.classList.contains('active')) {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
            }
        });
        
        tab.addEventListener('mouseleave', (e) => {
            if (!e.target.classList.contains('active')) {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }
        });
    });
    
    // ✅ FILTROS DA ENCICLOPÉDIA
    const typeFilter = document.getElementById('encyclopediaType');
    const rarityFilter = document.getElementById('encyclopediaRarity');
    
    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            this.populateEncyclopedia();
        });
    }
    
    if (rarityFilter) {
        rarityFilter.addEventListener('change', () => {
            this.populateEncyclopedia();
        });
    }
    
    // ✅ FECHAR CLICANDO FORA
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'inventoryModal') {
            this.closeInventory();
        }
    });
    
    // ✅ FECHAR COM ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            this.closeInventory();
        }
    });
}

// ========================================
// CORREÇÃO: PAUSAR JOGO AO ABRIR INVENTÁRIO
// ========================================

openInventory() {
    console.log('🎒 Abrindo inventário...');
    
    // ✅ Pausa o jogo
    this.gameManager.isPaused = true;
    
    const modal = document.getElementById('inventoryModal');
    modal.style.display = 'flex';
    
    // ✅ Flag para evitar múltiplas chamadas
    if (this._isPopulating) {
        console.warn('⚠️ Já está populando, abortando...');
        return;
    }
    
    this._isPopulating = true;
    this.populateInventory();
    this._isPopulating = false;
}

closeInventory() {
    console.log('🎒 Fechando inventário...');
    
    const modal = document.getElementById('inventoryModal');
    modal.style.display = 'none';
    
    // ✅ DESPAUSA O JOGO
    this.gameManager.isPaused = false;
}

switchInventoryTab(tabName) {
    // Remove active de todos
    document.querySelectorAll('.inventory-tab').forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
            tab.style.background = 'rgba(255, 255, 255, 0.2)';
            tab.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            tab.style.color = 'white';
        } else {
            tab.classList.remove('active');
            tab.style.background = 'rgba(255, 255, 255, 0.1)';
            tab.style.borderColor = 'transparent';
            tab.style.color = 'rgba(255, 255, 255, 0.6)';
        }
    });
    
    // Esconde todas as seções
    document.querySelectorAll('.inventory-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostra seção correta
    if (tabName === 'equipped') {
        document.getElementById('equippedSection').style.display = 'block';
        this.populateEquipped();
    } else if (tabName === 'available') {
        document.getElementById('availableSection').style.display = 'block';
        this.populateAvailable();
    } else if (tabName === 'encyclopedia') {
        document.getElementById('encyclopediaSection').style.display = 'block';
        this.populateEncyclopedia();
    }
}

populateInventory() {
    console.log('📦 === POPULANDO INVENTÁRIO ===');
    console.log(`  Total de ferramentas: ${this.inventory.tools.length}`);
    console.log(`  Total de itens: ${this.inventory.items.length}`);
    
    this.populateTools();
    this.populateItems();
    
    console.log('📦 === FIM DA POPULAÇÃO ===');
}
// ========================================
// CORREÇÃO: POPULAR FERRAMENTAS SEM DUPLICATAS
// ========================================

populateTools() {
    const equippedGrid = document.getElementById('equippedToolsGrid');
    const availableGrid = document.getElementById('availableToolsGrid');
    
    if (!equippedGrid || !availableGrid) {
        console.error('❌ Grids não encontrados');
        return;
    }
    
    // ✅ LIMPA COMPLETAMENTE OS GRIDS
    equippedGrid.innerHTML = '';
    availableGrid.innerHTML = '';
    
    console.log('🧹 Grids limpos');
    
    if (this.inventory.tools.length === 0) {
        availableGrid.innerHTML = `
            <p style="
                color: rgba(255, 255, 255, 0.5);
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                font-size: 16px;
                line-height: 1.8;
            ">
                <span style="font-size: 48px; display: block; margin-bottom: 15px;">📦</span>
                Nenhuma ferramenta ainda.<br>
                Complete fases para obter recompensas!
            </p>
        `;
        console.log('📦 Nenhuma ferramenta no inventário');
        return;
    }
    
    // ✅ Arrays para separar ferramentas
    const equipped = [];
    const available = [];
    
    console.log(`📊 Analisando ${this.inventory.tools.length} ferramentas...`);
    
    // ✅ Itera UMA ÚNICA VEZ
    this.inventory.tools.forEach((tool, index) => {
        // Verifica se está equipada
        const champion = this.gameManager.champions.find(c => c.attachedTool === tool);
        
        if (champion) {
            console.log(`  ✅ [${index}] ${tool.name} equipada em ${champion.type}`);
            equipped.push({ tool, index, champion });
        } else {
            console.log(`  📦 [${index}] ${tool.name} disponível`);
            available.push({ tool, index });
        }
    });
    
    console.log(`📊 Resultado: ${equipped.length} equipadas, ${available.length} disponíveis`);
    
    // ✅ Popula equipadas
    if (equipped.length === 0) {
        equippedGrid.innerHTML = `
            <p style="
                color: rgba(255, 255, 255, 0.4);
                grid-column: 1 / -1;
                text-align: center;
                padding: 30px;
                font-style: italic;
            ">Nenhuma ferramenta equipada</p>
        `;
    } else {
        console.log('🔧 Criando cards equipados...');
        equipped.forEach(({ tool, index, champion }) => {
            const card = this.createToolCard(tool, index, true, champion);
            equippedGrid.appendChild(card);
        });
        console.log(`✅ ${equipped.length} cards equipados criados`);
    }
    
    // ✅ Popula disponíveis
    if (available.length === 0) {
        availableGrid.innerHTML = `
            <p style="
                color: rgba(255, 255, 255, 0.4);
                grid-column: 1 / -1;
                text-align: center;
                padding: 30px;
                font-style: italic;
            ">Todas as ferramentas estão equipadas!</p>
        `;
    } else {
        console.log('🔧 Criando cards disponíveis...');
        available.forEach(({ tool, index }) => {
            const card = this.createToolCard(tool, index, false);
            availableGrid.appendChild(card);
        });
        console.log(`✅ ${available.length} cards disponíveis criados`);
    }
}


populateEquipped() {
    const grid = document.getElementById('equippedGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const equipped = [];
    
    this.inventory.tools.forEach((tool, index) => {
        const champion = this.gameManager.champions.find(c => c.attachedTool === tool);
        if (champion) {
            equipped.push({ tool, index, champion });
        }
    });
    
    if (equipped.length === 0) {
        grid.innerHTML = `
            <p style="
                color: rgba(255, 255, 255, 0.5);
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                font-size: 16px;
            ">
                <span style="font-size: 48px; display: block; margin-bottom: 15px;">📦</span>
                Nenhuma ferramenta equipada ainda
            </p>
        `;
        return;
    }
    
    equipped.forEach(({ tool, index, champion }) => {
        const card = this.createDetailedToolCard(tool, index, true, champion);
        grid.appendChild(card);
    });
}

populateAvailable() {
    const grid = document.getElementById('availableGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const available = [];
    
    this.inventory.tools.forEach((tool, index) => {
        const champion = this.gameManager.champions.find(c => c.attachedTool === tool);
        if (!champion) {
            available.push({ tool, index });
        }
    });
    
    if (available.length === 0) {
        grid.innerHTML = `
            <p style="
                color: rgba(255, 255, 255, 0.5);
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                font-size: 16px;
            ">
                <span style="font-size: 48px; display: block; margin-bottom: 15px;">🎉</span>
                Todas as ferramentas estão equipadas!
            </p>
        `;
        return;
    }
    
    available.forEach(({ tool, index }) => {
        const card = this.createDetailedToolCard(tool, index, false);
        grid.appendChild(card);
    });
}

populateEncyclopedia() {
    const grid = document.getElementById('encyclopediaGrid');
    if (!grid) return;
    
    const typeFilter = document.getElementById('encyclopediaType')?.value || 'all';
    const rarityFilter = document.getElementById('encyclopediaRarity')?.value || 'all';
    
    grid.innerHTML = '';
    
    const allEntries = [];
    
    // ✅ BUSCA TODAS AS FERRAMENTAS E ITENS
    ['basic', 'rare', 'epic', 'legendary'].forEach(rarity => {
        if (rarityFilter === 'all' || rarityFilter === rarity) {
            if (typeFilter === 'all' || typeFilter === 'tools') {
                this.getTools(rarity).forEach(tool => {
                    allEntries.push({ ...tool, type: 'tool', rarity });
                });
            }
            
            if (typeFilter === 'all' || typeFilter === 'items') {
                this.getItems(rarity).forEach(item => {
                    allEntries.push({ ...item, type: 'item', rarity });
                });
            }
        }
    });
    
    if (allEntries.length === 0) {
        grid.innerHTML = `
            <p style="
                color: rgba(255, 255, 255, 0.5);
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                font-size: 16px;
            ">Nenhum resultado encontrado</p>
        `;
        return;
    }
    
    allEntries.forEach(entry => {
        const card = this.createEncyclopediaCard(entry);
        grid.appendChild(card);
    });
}

createDetailedToolCard(tool, index, isEquipped = false, champion = null) {
    const card = document.createElement('div');
    const color = this.rarityColors[tool.rarity];
    
    card.className = 'tool-card';
    
    if (!isEquipped) {
        card.draggable = true;
        card.dataset.toolIndex = index;
    }
    
    card.style.cssText = `
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%);
        border: 3px solid ${color};
        border-radius: 15px;
        padding: 20px;
        cursor: ${isEquipped ? 'default' : 'grab'};
        transition: all 0.3s;
        box-shadow: 0 5px 25px ${color}40;
        position: relative;
        ${isEquipped ? 'opacity: 0.95;' : ''}
    `;
    
    card.innerHTML = `
        ${isEquipped ? `
            <div style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(76, 175, 80, 0.9);
                color: white;
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: bold;
            ">✓ EQUIPADA</div>
        ` : ''}
        
        <div style="text-align: center;">
            <div style="
                font-size: 60px;
                margin-bottom: 15px;
                filter: drop-shadow(0 0 15px ${color});
            ">${tool.icon}</div>
            
            <h3 style="
                color: ${color};
                margin: 10px 0;
                font-size: 18px;
                text-shadow: 0 0 10px ${color};
            ">${tool.name}</h3>
            
            <div style="
                display: inline-block;
                padding: 5px 15px;
                background: ${color}30;
                border-radius: 20px;
                color: ${color};
                font-size: 11px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 12px;
                border: 1px solid ${color}50;
            ">${tool.rarity}</div>
            
            <!-- ✅ DESCRIÇÃO COMPLETA -->
            <p style="
                color: rgba(255, 255, 255, 0.7);
                font-size: 12px;
                line-height: 1.4;
                margin: 10px 0;
                min-height: 40px;
                font-style: italic;
            ">${tool.description || 'Sem descrição'}</p>
            
            <!-- ✅ EFEITO -->
            <p style="
                color: rgba(255, 255, 255, 0.95);
                font-size: 13px;
                line-height: 1.5;
                margin: 12px 0;
                padding: 10px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            ">💡 ${tool.effect}</p>
            
            ${isEquipped && champion ? `
                <div style="
                    margin-top: 15px;
                    padding: 10px;
                    background: rgba(76, 175, 80, 0.2);
                    border-radius: 8px;
                    border: 2px solid rgba(76, 175, 80, 0.4);
                ">
                    <span style="
                        color: #4CAF50;
                        font-size: 13px;
                        font-weight: bold;
                    ">Equipada em: ${champion.type.toUpperCase()}</span>
                </div>
            ` : `
                <div style="
                    margin-top: 15px;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    border: 1px dashed rgba(255, 255, 255, 0.2);
                ">
                    <span style="
                        color: rgba(255, 255, 255, 0.6);
                        font-size: 12px;
                    ">🎯 Arraste para o campo</span>
                </div>
            `}
        </div>
    `;
    
    if (!isEquipped) {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.05)';
            card.style.boxShadow = `0 15px 40px ${color}70`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = `0 5px 25px ${color}40`;
        });
        
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', String(index));
            
            window.__draggedToolIndex = index;
            window.__draggedTool = tool;
            
            card.style.opacity = '0.3';
            card.style.cursor = 'grabbing';
            
            this.createDragPreview(tool, color);
            
            setTimeout(() => {
                const modal = document.getElementById('inventoryModal');
                if (modal) {
                    modal.style.display = 'none';
                }
            }, 0);
        });
        
        card.addEventListener('dragend', (e) => {
            card.style.opacity = 1 ;
        card.style.cursor = 'grab';
                this.removeDragPreview();
                
                if (window.__draggedToolIndex !== undefined) {
                    const modal = document.getElementById('inventoryModal');
                    if (modal) {
                        modal.style.display = 'flex';
                    }
                    
                    delete window.__draggedToolIndex;
                    delete window.__draggedTool;
                }
            });
        }

        return card;
        }
        createEncyclopediaCard(entry) {
        const card = document.createElement('div');
        const color = this.rarityColors[entry.rarity];
        // Verifica se o jogador possui
        const hasIt = entry.type === 'tool'
            ? this.inventory.tools.some(t => t.name === entry.name)
            : this.inventory.items.some(i => i.name === entry.name);

        card.style.cssText = `
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.3) 100%);
            border: 2px solid ${color};
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 0 20px ${color}40;
            position: relative;
            transition: all 0.3s;
        `;

        card.innerHTML = `
            ${hasIt ? `
                <div style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(76, 175, 80, 0.9);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 10px;
                    font-weight: bold;
                ">✓ POSSUÍDO</div>
            ` : ''}
            
            <div style="text-align: center;">
                <div style="
                    font-size: 50px;
                    margin-bottom: 10px;
                    filter: drop-shadow(0 0 10px ${color});
                ">${entry.icon}</div>
                
                <h3 style="
                    color: ${color};
                    margin: 10px 0;
                    font-size: 16px;
                    text-shadow: 0 0 10px ${color};
                ">${entry.name}</h3>
                
                <div style="
                    display: inline-block;
                    padding: 4px 12px;
                    background: ${color}30;
                    border-radius: 20px;
                    color: ${color};
                    font-size: 11px;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin-bottom: 10px;
                ">${entry.rarity}</div>
                
                <!-- ✅ DESCRIÇÃO -->
                <p style="
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 11px;
                    line-height: 1.3;
                    margin: 8px 0;
                    min-height: 35px;
                    font-style: italic;
                ">${entry.description || 'Sem descrição'}</p>
                
                <!-- ✅ EFEITO -->
                <p style="
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 12px;
                    line-height: 1.4;
                    margin: 10px 0;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                ">💡 ${entry.effect}</p>
                
                <div style="
                    margin-top: 10px;
                    padding: 6px;
                    background: ${entry.type === 'tool' ? 'rgba(100, 149, 237, 0.1)' : 'rgba(255, 165, 0, 0.1)'};
                    border-radius: 8px;
                    border: 1px solid ${entry.type === 'tool' ? 'rgba(100, 149, 237, 0.3)' : 'rgba(255, 165, 0, 0.3)'};
                ">
                    <span style="
                        color: ${entry.type === 'tool' ? '#6495ED' : '#FFA500'};
                        font-size: 11px;
                        font-weight: bold;
                    ">${entry.type === 'tool' ? '🔧 FERRAMENTA' : '📦 ITEM'}</span>
                </div>
            </div>
        `;

        card.addEventListener('mouseenter', () => {
            card.style.transform = 'scale(1.05)';
            card.style.boxShadow = `0 10px 35px ${color}60`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1)';
            card.style.boxShadow = `0 0 20px ${color}40`;
        });

        return card;
        }

// ========================================
// CORREÇÃO: CREATE TOOL CARD SIMPLIFICADO
// ========================================

createToolCard(tool, index, isEquipped = false, champion = null) {
    const card = document.createElement('div');
    const color = this.rarityColors[tool.rarity];
    
    card.className = 'tool-card';
    
    if (!isEquipped) {
        card.draggable = true;
        card.dataset.toolIndex = index;
    }
    
    card.style.cssText = `
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%);
        border: 3px solid ${color};
        border-radius: 15px;
        padding: 20px;
        cursor: ${isEquipped ? 'default' : 'grab'};
        transition: all 0.3s;
        box-shadow: 0 5px 25px ${color}40;
        position: relative;
        ${isEquipped ? 'opacity: 0.85;' : ''}
    `;
    
    card.innerHTML = `
        ${isEquipped ? `
            <div style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(76, 175, 80, 0.9);
                color: white;
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 5px;
                box-shadow: 0 2px 10px rgba(76, 175, 80, 0.5);
            ">
                <span>✓</span>
                <span>EQUIPADA</span>
            </div>
        ` : ''}
        
        <div style="text-align: center;">
            <div style="
                font-size: 60px;
                margin-bottom: 15px;
                filter: drop-shadow(0 0 15px ${color});
            ">${tool.icon}</div>
            
            <h3 style="
                color: ${color};
                margin: 10px 0;
                font-size: 18px;
                text-shadow: 0 0 10px ${color};
            ">${tool.name}</h3>
            
            <div style="
                display: inline-block;
                padding: 5px 15px;
                background: ${color}30;
                border-radius: 20px;
                color: ${color};
                font-size: 11px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 12px;
                border: 1px solid ${color}50;
            ">${tool.rarity}</div>
            
            <p style="
                color: rgba(255, 255, 255, 0.85);
                font-size: 13px;
                line-height: 1.5;
                margin: 12px 0;
                min-height: 40px;
            ">${tool.effect}</p>
            
            ${isEquipped && champion ? `
                <div style="
                    margin-top: 15px;
                    padding: 10px;
                    background: rgba(76, 175, 80, 0.2);
                    border-radius: 8px;
                    border: 2px solid rgba(76, 175, 80, 0.4);
                ">
                    <span style="
                        color: #4CAF50;
                        font-size: 13px;
                        font-weight: bold;
                    ">Equipada em: ${champion.type.toUpperCase()}</span>
                </div>
            ` : `
                <div style="
                    margin-top: 15px;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    border: 1px dashed rgba(255, 255, 255, 0.2);
                ">
                    <span style="
                        color: rgba(255, 255, 255, 0.6);
                        font-size: 12px;
                    ">🎯 Arraste para o campo</span>
                </div>
            `}
        </div>
    `;
    
    if (!isEquipped) {
        // ✅ HOVER
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.05)';
            card.style.boxShadow = `0 15px 40px ${color}70`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = `0 5px 25px ${color}40`;
        });
        
        // ✅ DRAGSTART - INICIA O ARRASTE E ESCONDE O MENU
        card.addEventListener('dragstart', (e) => {
            console.log(`🚀 DRAGSTART: ${tool.name}, index: ${index}`);
            
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', String(index));
            
            // Armazena dados globalmente
            window.__draggedToolIndex = index;
            window.__draggedTool = tool;
            
            card.style.opacity = '0.3';
            card.style.cursor = 'grabbing';
            
            // Cria preview visual da ferramenta
            this.createDragPreview(tool, color);
            
            // 🛑 CORREÇÃO CRÍTICA: setTimeout(0)
            // Isso permite que o navegador inicie o evento de drag ANTES de escondermos o elemento.
            // Se esconder imediatamente sem o timeout, o drag é cancelado.
            setTimeout(() => {
                const modal = document.getElementById('inventoryModal');
                if (modal) {
                    modal.style.display = 'none'; // Agora sim esconde o inventário!
                    console.log('📦 Inventário recolhido (display: none)');
                }
            }, 0);
            
            console.log('✅ Aguardando drop no champion...');
        });
        
        // ✅ DRAGEND - DECIDE SE REABRE OU NÃO O MENU
        card.addEventListener('dragend', (e) => {
            console.log('🏁 DRAGEND executado');
            
            card.style.opacity = '1';
            card.style.cursor = 'grab';
            
            // Remove preview
            this.removeDragPreview();
            
            // LÓGICA DE REABERTURA:
            // Se __draggedToolIndex ainda existe, significa que o drop NÃO consumiu o item.
            // Logo, o jogador soltou fora ou cancelou. Devemos reabrir.
            if (window.__draggedToolIndex !== undefined) {
                console.log('⚠️ Drop não consumado (variável ainda existe). Reabrindo inventário...');
                
                const modal = document.getElementById('inventoryModal');
                if (modal) {
                    modal.style.display = 'flex'; // REABRE
                }
                
                // Limpa as variáveis agora que o processo acabou
                delete window.__draggedToolIndex;
                delete window.__draggedTool;
            } else {
                console.log('✨ Drop foi um sucesso (variável foi limpa no drop). Inventário permanece fechado.');
            }
        });
    }
    
    return card;
}

createDragPreview(tool, color) {
    // Remove preview antigo se existir
    this.removeDragPreview();
    
    const preview = document.createElement('div');
    preview.id = 'toolDragPreview';
    preview.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 99999;
        font-size: 40px;
        filter: drop-shadow(0 0 20px ${color});
        animation: dragFloat 0.5s ease-in-out infinite alternate;
    `;
    preview.textContent = tool.icon;
    
    document.body.appendChild(preview);
    
    // Segue o mouse
    document.addEventListener('mousemove', this.updateDragPreview);
    
    // CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes dragFloat {
            from { transform: translateY(0px); }
            to { transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(style);
}

updateDragPreview = (e) => {
    const preview = document.getElementById('toolDragPreview');
    if (preview) {
        preview.style.left = (e.clientX + 20) + 'px';
        preview.style.top = (e.clientY - 20) + 'px';
    }
}

removeDragPreview() {
    const preview = document.getElementById('toolDragPreview');
    if (preview) {
        preview.remove();
    }
    document.removeEventListener('mousemove', this.updateDragPreview);
}

populateItems() {
    const grid = document.getElementById('itemsGrid');
    
    if (!grid) {
        console.error('❌ Grid de itens não encontrado');
        return;
    }
    
    // ✅ LIMPA COMPLETAMENTE
    grid.innerHTML = '';
    
    console.log(`📦 Populando ${this.inventory.items.length} itens...`);
    
    if (this.inventory.items.length === 0) {
        grid.innerHTML = `
            <p style="
                color: rgba(255, 255, 255, 0.5);
                grid-column: 1 / -1;
                text-align: center;
                padding: 60px 20px;
                font-size: 16px;
                line-height: 1.8;
            ">
                <span style="font-size: 48px; display: block; margin-bottom: 15px;">📦</span>
                Nenhum item ainda.<br>
                Complete fases para obter recompensas!
            </p>
        `;
        return;
    }
    
    this.inventory.items.forEach((item, index) => {
        console.log(`  📦 [${index}] ${item.name}`);
        const card = this.createItemCard(item);
        grid.appendChild(card);
    });
    
    console.log(`✅ ${this.inventory.items.length} itens criados`);
}

createItemCard(item) {
const card = document.createElement('div');
const color = this.rarityColors[item.rarity];
card.style.cssText = `
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.3) 100%);
    border: 2px solid ${color};
    border-radius: 15px;
    padding: 15px;
    box-shadow: 0 0 20px ${color}40;
`;

card.innerHTML = `
    <div style="text-align: center;">
        <div style="font-size: 50px; margin-bottom: 10px; filter: drop-shadow(0 0 10px ${color});">${item.icon}</div>
        <h3 style="color: ${color}; margin: 10px 0; font-size: 16px; text-shadow: 0 0 10px ${color};">${item.name}</h3>
        <div style="
            display: inline-block;
            padding: 4px 12px;
            background: ${color}30;
            border-radius: 20px;
            color: ${color};
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 10px;
        ">${item.rarity}</div>
        <p style="color: rgba(255, 255, 255, 0.8); font-size: 13px; line-height: 1.4; margin: 10px 0;">${item.effect}</p>
        <div style="
            margin-top: 10px;
            padding: 8px;
            background: rgba(0, 255, 0, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(0, 255, 0, 0.3);
        ">
            <span style="color: #00ff00; font-size: 12px; font-weight: bold;">✅ ATIVO</span>
        </div>
    </div>
`;

return card;
}
   
// ========================================
// DEBUG: Verificar se botão foi criado
// ========================================

// Adicione este método para debug:
checkInventoryButton() {
    const btn = document.getElementById('inventoryBtn');
    const menu = document.getElementById('menu');
    
    console.log('🔍 DEBUG Inventário:');
    console.log('  - Menu existe?', !!menu);
    console.log('  - Botão existe?', !!btn);
    
    if (menu) {
        console.log('  - Filhos do menu:', menu.children.length);
        console.log('  - HTML do menu:', menu.innerHTML.substring(0, 200));
    }
    
    if (!btn && menu) {
        console.log('⚠️ Botão não encontrado! Tentando criar novamente...');
        this.setupInventoryButton();
    }
} 

    // ========================================
    // GERAÇÃO DE RECOMPENSAS
    // ========================================

    generateReward() {
        // Decide raridade PRIMEIRO
        const rarity = this.rollRarity();
        
        // Decide se é item ou ferramenta (50/50)
        //const type = Math.random() < 0.5 ? 'item' : 'tool';

        // Para testes será 100% ferramentas
        const type = 'tool';
        
        // Pega a lista correta baseada no tipo e raridade
        const possibleRewards = this.getPossibleRewards(type, rarity);
        
        // Escolhe UM aleatoriamente
        const reward = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
        
        // ✅ RETORNA CÓPIA do objeto para evitar duplicatas
        return { 
            ...JSON.parse(JSON.stringify(reward)), // Deep clone
            type, 
            rarity,
            id: Date.now() + Math.random() // ID único
        };
    }
    
    rollRarity() {
        const roll = Math.random();
        let cumulative = 0;
        
        for (const [rarity, weight] of Object.entries(this.rarityWeights)) {
            cumulative += weight;
            if (roll <= cumulative) {
                return rarity;
            }
        }
        
        return 'basic';
    }
    
    getPossibleRewards(type, rarity) {
        if (type === 'item') {
            return this.getItems(rarity);
        } else {
            return this.getTools(rarity);
        }
    }
    
// ========================================
// LISTA COMPLETA DE ITENS (22 TOTAL)
// ========================================

getItems(rarity) {
    const items = {
        // ========================================
        // BÁSICO (10 itens)
        // ========================================
        basic: [
            {
                name: 'Caixa de Heróis',
                icon: '📦',
                description: 'Uma coleção básica do Colecionador',
                effect: 'Vendas valem +2% a mais',
                stat: 'sellBonus',
                value: 0.02
            },
            {
                name: 'Manual de Treinamento',
                icon: '📚',
                description: 'Guia básico de combate',
                effect: '+1% de dano em todas as torres',
                stat: 'globalDamage',
                value: 0.01
            },
            {
                name: 'Poção de Vida',
                icon: '🧪',
                description: 'Elixir restaurador básico',
                effect: '+3% de HP máximo',
                stat: 'globalHP',
                value: 0.03
            },
            {
                name: 'Cristal de Energia',
                icon: '💎',
                description: 'Fragmento energético comum',
                effect: '+2% de velocidade de ataque',
                stat: 'attackSpeed',
                value: 0.02
            },
            {
                name: 'Bússola Mística',
                icon: '🧭',
                description: 'Guia para tesouros escondidos',
                effect: '+5% de gold por kill',
                stat: 'goldGain',
                value: 0.05
            },
            {
                name: 'Botas Rápidas',
                icon: '👟',
                description: 'Calçado leve e confortável',
                effect: '+3% de velocidade de movimento',
                stat: 'moveSpeed',
                value: 0.03
            },
            {
                name: 'Amuleto da Sorte',
                icon: '🍀',
                description: 'Trevo de quatro folhas encantado',
                effect: '+2% de chance de crítico',
                stat: 'critChance',
                value: 0.02
            },
            {
                name: 'Tomo Arcano',
                icon: '📖',
                description: 'Livro de feitiços iniciantes',
                effect: '+4% de XP recebido',
                stat: 'xpGain',
                value: 0.04
            },
            {
                name: 'Bandagem Reforçada',
                icon: '🩹',
                description: 'Kit médico básico',
                effect: '+1 HP/s de regeneração',
                stat: 'hpRegen',
                value: 1
            },
            {
                name: 'Pedra de Afiação',
                icon: '🪨',
                description: 'Melhora o fio das lâminas',
                effect: '+2% de alcance de ataque',
                stat: 'range',
                value: 0.02
            }
        ],
        
        // ========================================
        // RARO (6 itens)
        // ========================================
        rare: [
            {
                name: 'Stormbreaker Fragmento',
                icon: '⚡',
                description: 'Um pedaço do machado de Thor',
                effect: '+4% de dano contra bosses',
                stat: 'bossDamage',
                value: 0.04
            },
            {
                name: 'Soro Experimental',
                icon: '💉',
                description: 'Versão diluída do soro do super-soldado',
                effect: '+7% de HP em todas as torres',
                stat: 'globalHP',
                value: 0.07
            },
            {
                name: 'Relógio Temporal',
                icon: '⏰',
                description: 'Dispositivo de manipulação do tempo',
                effect: '+5% de velocidade de ataque',
                stat: 'attackSpeed',
                value: 0.05
            },
            {
                name: 'Espada Flamejante',
                icon: '🔥',
                description: 'Lâmina envolta em chamas eternas',
                effect: '+6% de dano elemental',
                stat: 'elementalDamage',
                value: 0.06
            },
            {
                name: 'Capa da Invisibilidade',
                icon: '🧥',
                description: 'Manto que distorce a luz',
                effect: '+8% de evasão',
                stat: 'evasion',
                value: 0.08
            },
            {
                name: 'Coroa do Rei',
                icon: '👑',
                description: 'Símbolo de autoridade suprema',
                effect: '+10% de gold por kill',
                stat: 'goldGain',
                value: 0.10
            }
        ],
        
        // ========================================
        // ÉPICO (4 itens)
        // ========================================
        epic: [
            {
                name: 'Stormbreaker',
                icon: '🔨',
                description: 'O machado forjado em Nidavellir',
                effect: '+8% de dano contra bosses e +5% de velocidade de ataque',
                stat: ['bossDamage', 'attackSpeed'],
                value: [0.08, 0.05]
            },
            {
                name: 'Armadura de Wakanda',
                icon: '🛡️',
                description: 'Vibranium puro de Wakanda',
                effect: '+12% de HP e +6% de resistência',
                stat: ['globalHP', 'resistance'],
                value: [0.12, 0.06]
            },
            {
                name: 'Orbe de Agamotto',
                icon: '🔮',
                description: 'Artefato do Feiticeiro Supremo',
                effect: '+10% de dano mágico e +8% de alcance',
                stat: ['magicDamage', 'range'],
                value: [0.10, 0.08]
            },
            {
                name: 'Coração do Dragão',
                icon: '❤️‍🔥',
                description: 'Essência de um dragão ancestral',
                effect: '+15% de dano crítico e +5% de chance de crítico',
                stat: ['critDamage', 'critChance'],
                value: [0.15, 0.05]
            }
        ],
        
        // ========================================
        // LENDÁRIO (2 itens)
        // ========================================
        legendary: [
            {
                name: 'Coleção Completa',
                icon: '🏆',
                description: 'A coleção definitiva do Colecionador',
                effect: '+10% em TODAS as estatísticas',
                stat: 'all',
                value: 0.10
            },
            {
                name: 'Gema do Infinito',
                icon: '💎',
                description: 'Uma réplica perfeita de uma Joia do Infinito',
                effect: '+20% de dano, +15% de velocidade, +10% de HP',
                stat: ['globalDamage', 'attackSpeed', 'globalHP'],
                value: [0.20, 0.15, 0.10]
            }
        ]
    };
    
    return items[rarity] || items.basic;
}

// ========================================
// LISTA COMPLETA DE FERRAMENTAS (20 TOTAL)
// ========================================

getTools(rarity) {
    const tools = {
        // ========================================
        // BÁSICO (8 ferramentas)
        // ========================================
        basic: [
            {
                name: 'Flecha do Yondu',
                icon: '🎯',
                description: 'A icônica flecha controlada por assobio',
                effect: 'Orbita o Champion causando dano por segundo',
                mechanic: 'orbit',
                damage: 25,
                dps: 40,
                radius: 90,
                speed: 3,
                trail: true,
                color: '#ff6600'
            },
            {
                name: 'Escudo de Vibranium',
                icon: '🛡️',
                description: 'Escudo indestrutível de Wakanda',
                effect: 'Bloqueia 1 projétil a cada 6s',
                mechanic: 'shield',
                blockCooldown: 6000,
                blockRadius: 80,
                color: '#9400D3'
            },
            {
                name: 'Bomba Aranha',
                icon: '🕷️',
                description: 'Tecnologia web-shooter de Peter Parker',
                effect: 'Lança teias que prendem inimigos por 1s',
                mechanic: 'web',
                webDuration: 1000,
                webCooldown: 4000,
                webRadius: 100,
                color: '#FFFFFF'
            },
            {
                name: 'Cajado de Loki',
                icon: '🔱',
                description: 'Cetro místico asgardiano',
                effect: '+10% de dano mágico ao portador',
                mechanic: 'stat',
                stat: 'magicDamage',
                value: 0.10,
                aura: true,
                color: '#4B0082'
            },
            {
                name: 'Luva Tática',
                icon: '🥊',
                description: 'Equipamento de treinamento S.H.I.E.L.D.',
                effect: 'Aumenta em 5% o XP recebido',
                mechanic: 'stat',
                stat: 'xpGain',
                value: 0.05,
                color: '#708090'
            },
            {
                name: 'Pistola Noturna',
                icon: '🔫',
                description: 'Arma silenciosa de agente secreto',
                effect: '+8% de velocidade de ataque',
                mechanic: 'stat',
                stat: 'attackSpeed',
                value: 0.08,
                color: '#2F4F4F'
            },
            {
                name: 'Botas Hermes',
                icon: '👢',
                description: 'Calçado lendário dos deuses',
                effect: '+10% de velocidade de movimento',
                mechanic: 'stat',
                stat: 'moveSpeed',
                value: 0.10,
                color: '#DAA520'
            },
            {
                name: 'Anel de Poder',
                icon: '💍',
                description: 'Anel místico carregado de energia',
                effect: 'Regenera 2 HP por segundo',
                mechanic: 'regen',
                regenAmount: 2,
                color: '#00FF00'
            }
        ],
        
        // ========================================
        // RARO (6 ferramentas)
        // ========================================
        rare: [
            {
                name: 'Scream Simbionte',
                icon: '☢️',
                description: 'Simbionte vermelho e amarelo hostil',
                effect: 'Drena vida de inimigos próximos. Desaparece após 7 absorções',
                mechanic: 'drain',
                drainRadius: 120,
                drainDPS: 15,
                drainHealPercent: 0.5,
                maxFusions: 7,
                color: '#8B0000'
            },
            {
                name: 'Lança Wakandana',
                icon: '🗡️',
                description: 'Arma cerimonial de vibranium',
                effect: 'Ignora 15% da armadura inimiga',
                mechanic: 'penetration',
                armorPen: 0.15,
                throwCooldown: 3000,
                throwDamage: 60,
                color: '#FFD700'
            },
            {
                name: 'Garras do Pantera',
                icon: '😼',
                description: 'Garras energizadas com vibranium',
                effect: '+20% de cadência por 5s após matar um inimigo',
                mechanic: 'onKill',
                attackSpeedBonus: 0.20,
                buffDuration: 5000,
                color: '#9400D3'
            },
            {
                name: 'Disco Quântico',
                icon: '💿',
                description: 'Tecnologia Pym experimental',
                effect: 'Ataques rebotam em 2 inimigos adicionais',
                mechanic: 'bounce',
                bounces: 2,
                bounceRange: 150,
                bounceDamage: 0.75,
                color: '#00CED1'
            },
            {
                name: 'Armadura Beta',
                icon: '🦾',
                description: 'Protótipo da Stark Industries',
                effect: 'Garante escudo de 200 HP no início da fase',
                mechanic: 'phaseShield',
                shieldAmount: 200,
                color: '#B22222'
            },
            {
                name: 'Adaga Mística',
                icon: '🗡️',
                description: 'Lâmina encantada com runas antigas',
                effect: 'Críticos causam 25% mais dano',
                mechanic: 'stat',
                stat: 'critDamage',
                value: 0.25,
                color: '#8B008B'
            }
        ],
        
        // ========================================
        // ÉPICO (4 ferramentas)
        // ========================================
        epic: [
            {
                name: 'Totem de Konshu',
                icon: '🌙',
                description: 'Artefato do deus egípcio da lua',
                effect: 'Cria projeção espectral por 10s que ataca automaticamente',
                mechanic: 'summon',
                summonDuration: 10000,
                summonCooldown: 25000,
                summonDamage: 50,
                summonRange: 200,
                summonAttackSpeed: 1000,
                color: '#F0F8FF'
            },
            {
                name: 'Nano-Propulsor Stark',
                icon: '🚀',
                description: 'Sistema de propulsão nanotecnológico',
                effect: 'Permite dash curto a cada 8s',
                mechanic: 'dash',
                dashCooldown: 8000,
                dashDistance: 150,
                dashDamage: 40,
                color: '#FFD700'
            },
            {
                name: 'Elmo do Magneto',
                icon: '🧲',
                description: 'Elmo psíquico de Erik Lehnsherr',
                effect: 'Reflete projéteis inimigos por 3s',
                mechanic: 'reflect',
                reflectDuration: 3000,
                reflectCooldown: 15000,
                reflectDamageMultiplier: 1.5,
                color: '#8B008B'
            },
            {
                name: 'Viúva Escarlate',
                icon: '🕷️',
                description: 'Protocolo de sobrevivência de Natasha',
                effect: 'Ao morrer, revive com 30% da vida',
                mechanic: 'revive',
                reviveHP: 0.30,
                reviveCooldown: 0,
                usedThisPhase: false,
                color: '#DC143C'
            }
        ],
        
        // ========================================
        // LENDÁRIO (2 ferramentas)
        // ========================================
        legendary: [
            {
                name: 'Núcleo Ultron Prime',
                icon: '🤖',
                description: 'Núcleo de IA autociente',
                effect: 'Dispara lasers orbitais automáticos por 8s a cada 20s',
                mechanic: 'orbital',
                orbitalDuration: 8000,
                orbitalCooldown: 20000,
                orbitalCount: 4,
                orbitalDamage: 80,
                orbitalRadius: 150,
                orbitalSpeed: 2,
                color: '#FF0000'
            },
            {
                name: 'Martelo Mjolnir',
                icon: '🔨',
                description: 'O martelo digno de Thor',
                effect: 'Cada ataque tem 15% de chance de invocar um raio',
                mechanic: 'lightning',
                lightningChance: 0.15,
                lightningDamage: 150,
                lightningStunDuration: 1500,
                lightningChainCount: 3,
                color: '#00BFFF'
            }
        ]
    };
    
    return tools[rarity] || tools.basic;
}
 

    // ========================================
    // APLICAR EFEITOS DE ITENS
    // ========================================
    applyItemEffect(item) {
        
        if (!this.gameManager.globalBuffs) {
            this.gameManager.globalBuffs = {};
        }
        
        if (Array.isArray(item.stat)) {
            // Múltiplos stats
            item.stat.forEach((stat, index) => {
                const value = item.value[index];
                this.gameManager.globalBuffs[stat] = (this.gameManager.globalBuffs[stat] || 0) + value;
            });
        } else if (item.stat === 'all') {
            // Buff em tudo
            ['globalDamage', 'attackSpeed', 'globalHP', 'range'].forEach(stat => {
                this.gameManager.globalBuffs[stat] = (this.gameManager.globalBuffs[stat] || 0) + item.value;
            });
        } else {
            // Stat único
            this.gameManager.globalBuffs[item.stat] = (this.gameManager.globalBuffs[item.stat] || 0) + item.value;
        }
        
    }
    
    
    onPhaseComplete(phase) {
        console.log(`🎉 Fase ${phase} completa! Abrindo baú...`);
        
        // Pausa o jogo e abre baú
        this.gameManager.isPaused = true;
        setTimeout(() => {
            this.openChest('phase');
        }, 1000);
    }
    
attachToolToChampion(tool, champion) {
    console.log(`🔧 attachToolToChampion:`, {
        tool: tool.name,
        champion: champion.type,
        hasToolAlready: !!champion.attachedTool
    });
    
    // ✅ Verifica se já tem ferramenta
    if (champion.attachedTool) {
        this.gameManager.showUI(`⚠️ ${champion.type} já possui ${champion.attachedTool.name}!`, 'warning');
        
        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
            champion.getCenterX(),
            champion.getCenterY() - 50,
            '❌ JÁ EQUIPADO',
            'red',
            1500
        ));
        
        return false;
    }
    
    // ✅ EQUIPA FERRAMENTA
    champion.attachedTool = tool;
    
    // ✅ Inicializa estados específicos
    this.initializeToolStates(champion, tool);
    
    // ✅ Efeitos visuais
    this.showEquipEffects(champion, tool);
    
    this.gameManager.showUI(`⚙️ ${tool.name} equipado em ${champion.type}!`, 'success');
    console.log(`✅ Ferramenta ${tool.name} ATIVA em ${champion.type}`);
    
    this.saveInventory();
    
    return true;
}

 
// ✅ Método auxiliar para inicializar estados
initializeToolStates(champion, tool) {
    switch(tool.mechanic) {
        case 'orbit':
            champion.toolOrbitAngle = 0;
            break;
        case 'drain':
            champion.toolFusions = 0;
            break;
        case 'throw':
        case 'penetration':
            champion.toolLastThrow = 0;
            break;
        case 'shield':
            champion.toolShieldReady = true;
            champion.toolShieldLastBlock = 0;
            break;
        case 'web':
            champion.toolWebLastCast = 0;
            break;
        case 'stat':
            champion.toolStatApplied = false;
            this.updateStatTool(champion, tool, 0);
            break;
        case 'bounce':
            champion.projectileBounces = tool.bounces;
            champion.bounceRange = tool.bounceRange;
            champion.bounceDamage = tool.bounceDamage;
            break;
        case 'summon':
            champion.toolSummonLastCast = 0;
            break;
        case 'reflect':
            champion.toolReflectLastCast = 0;
            champion.isReflecting = false;
            break;
        case 'orbital':
            champion.toolOrbitalLastCast = 0;
            champion.toolOrbitals = [];
            break;
        case 'lightning':
            champion.toolLightningChance = tool.lightningChance;
            break;
        case 'revive':
            tool.usedThisPhase = false;
            break;
        case 'phaseShield':
            champion.phaseShield = tool.shieldAmount;
            break;
        case 'regen':
            champion.toolRegenAmount = tool.regenAmount;
            break;
    }
}

// ✅ Método auxiliar para efeitos visuais
showEquipEffects(champion, tool) {
    const color = this.rarityColors[tool.rarity];
    
    // Level up effect
    this.gameManager.effects.push(new this.gameManager.LevelUpEffect(
        champion.getCenterX(),
        champion.getCenterY(),
        1500
    ));
    
    // Partículas coloridas
    for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 / 20) * i;
        this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
            champion.getCenterX() + Math.cos(angle) * 30,
            champion.getCenterY() + Math.sin(angle) * 30,
            15,
            color,
            1000
        ));
    }
    
    // Texto flutuante
    this.gameManager.effects.push(new this.gameManager.TextPopEffect(
        champion.getCenterX(),
        champion.getCenterY() - 60,
        `✨ ${tool.name}`,
        color,
        2000
    ));
}
   
    // ========================================
    // ATUALIZAR FERRAMENTAS
    // ========================================
    update(deltaTime) {
        // Atualiza ferramentas de cada champion
        this.gameManager.champions.forEach(champion => {
            if (champion.attachedTool) {
                this.updateTool(champion, champion.attachedTool, deltaTime);
            }
        });
    }
    
   
// ========================================
// ATUALIZAR FERRAMENTAS (EXPANDIDO)
// ========================================

updateTool(champion, tool, deltaTime) {
    switch(tool.mechanic) {
        case 'orbit':
            this.updateOrbitTool(champion, tool, deltaTime);
            break;
        case 'drain':
            this.updateDrainTool(champion, tool, deltaTime);
            break;
        case 'shield':
            this.updateShieldTool(champion, tool, deltaTime);
            break;
        case 'web':
            this.updateWebTool(champion, tool, deltaTime);
            break;
        case 'stat':
            this.updateStatTool(champion, tool, deltaTime);
            break;
        case 'penetration':
            this.updatePenetrationTool(champion, tool, deltaTime);
            break;
        case 'onKill':
            this.updateOnKillTool(champion, tool, deltaTime);
            break;
        case 'bounce':
            this.updateBounceTool(champion, tool, deltaTime);
            break;
        case 'phaseShield':
            this.updatePhaseShieldTool(champion, tool, deltaTime);
            break;
        case 'summon':
            this.updateSummonTool(champion, tool, deltaTime);
            break;
        case 'dash':
            this.updateDashTool(champion, tool, deltaTime);
            break;
        case 'reflect':
            this.updateReflectTool(champion, tool, deltaTime);
            break;
        case 'revive':
            this.updateReviveTool(champion, tool, deltaTime);
            break;
        case 'orbital':
            this.updateOrbitalTool(champion, tool, deltaTime);
            break;
        case 'ultimateKill':
            this.updateUltimateKillTool(champion, tool, deltaTime);
            break;
        case 'onUltimate':
            this.updateOnUltimateTool(champion, tool, deltaTime);
            break;
        case 'lightning':
            this.updateLightningTool(champion, tool, deltaTime);
            break;
    }
}


// ========================================
// MÉTODOS INDIVIDUAIS DE CADA FERRAMENTA
// ========================================

updateShieldTool(champion, tool, deltaTime) {
    if (!champion.toolShieldReady) {
        champion.toolShieldReady = true;
        champion.toolShieldLastBlock = 0;
    }
    
    // Regenera escudo
    if (Date.now() - champion.toolShieldLastBlock > tool.blockCooldown) {
        champion.toolShieldReady = true;
    }
    
    // Checa projéteis inimigos
    if (champion.toolShieldReady && this.gameManager.enemyProjectiles) {
        this.gameManager.enemyProjectiles.forEach((proj, index) => {
            const dist = Math.hypot(
                proj.x - champion.getCenterX(),
                proj.y - champion.getCenterY()
            );
            
            if (dist < tool.blockRadius) {
                // Bloqueia!
                this.gameManager.enemyProjectiles.splice(index, 1);
                champion.toolShieldReady = false;
                champion.toolShieldLastBlock = Date.now();
                
                // Efeito visual
                this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                    champion.getCenterX(),
                    champion.getCenterY(),
                    tool.blockRadius,
                    300
                ));
                
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    champion.getCenterX(),
                    champion.getCenterY() - 40,
                    'BLOQUEADO! 🛡️',
                    'cyan',
                    1000
                ));
            }
        });
    }
}

updateWebTool(champion, tool, deltaTime) {
    if (!champion.toolWebLastCast) {
        champion.toolWebLastCast = 0;
    }
    
    // Lança teia
    if (Date.now() - champion.toolWebLastCast > tool.webCooldown) {
        // Procura inimigo mais próximo
        let nearest = null;
        let minDist = tool.webRadius;
        
        this.gameManager.enemies.forEach(enemy => {
            const dist = Math.hypot(
                champion.getCenterX() - enemy.getCenterX(),
                champion.getCenterY() - enemy.getCenterY()
            );
            
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });
        
        if (nearest) {
            // Prende inimigo
            nearest.isWebbed = true;
            nearest.webbedOriginalSpeed = nearest.vel;
            nearest.vel = 0;
            
            setTimeout(() => {
                if (nearest.isWebbed) {
                    nearest.isWebbed = false;
                    nearest.vel = nearest.webbedOriginalSpeed;
                }
            }, tool.webDuration);
            
            // Efeito visual
            this.gameManager.effects.push(new this.gameManager.LaserEffect(
                champion.getCenterX(),
                champion.getCenterY(),
                nearest.getCenterX(),
                nearest.getCenterY(),
                8,
                'rgba(255, 255, 255, 0.8)',
                0.5
            ));
            
            champion.toolWebLastCast = Date.now();
        }
    }
}

updateStatTool(champion, tool, deltaTime) {
    // Aplica stat boost (passivo)
    if (!champion.toolStatApplied) {
        champion.toolStatApplied = true;
        
        // Aplica buff
        if (tool.stat === 'magicDamage') {
            champion.magicDamageBonus = (champion.magicDamageBonus || 0) + tool.value;
        } else if (tool.stat === 'xpGain') {
            champion.xpGainBonus = (champion.xpGainBonus || 0) + tool.value;
        } else if (tool.stat === 'elementalPower') {
            champion.elementalPowerBonus = (champion.elementalPowerBonus || 0) + tool.value;
        } else if (tool.stat === 'energyPower') {
            champion.energyPowerBonus = (champion.energyPowerBonus || 0) + tool.value;
        }
    }
}

updatePenetrationTool(champion, tool, deltaTime) {
    // Aplica penetração de armadura
    if (!champion.armorPen) {
        champion.armorPen = 0;
    }
    champion.armorPen = tool.armorPen;
    
    // Arremesso da lança
    if (!champion.toolThrowLastCast) {
        champion.toolThrowLastCast = 0;
    }
    
    if (Date.now() - champion.toolThrowLastCast > tool.throwCooldown) {
        let nearest = null;
        let minDist = 300;
        
        this.gameManager.enemies.forEach(enemy => {
            const dist = Math.hypot(
                champion.getCenterX() - enemy.getCenterX(),
                champion.getCenterY() - enemy.getCenterY()
            );
            
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });
        
        if (nearest) {
            const finalDamage = tool.throwDamage * (1 + tool.armorPen);
            nearest.takeDamage(finalDamage, champion);
            
            // Efeito visual
            this.gameManager.effects.push(new this.gameManager.LaserEffect(
                champion.getCenterX(),
                champion.getCenterY(),
                nearest.getCenterX(),
                nearest.getCenterY(),
                6,
                tool.color,
                0.4
            ));
            
            champion.toolThrowLastCast = Date.now();
        }
    }
}

// ========================================
// HOOKS NO COLLECTORSYSTEM
// ========================================

// Adicione estes métodos no CollectorSystem:

onEnemyKilledByChampion(champion, enemy) {
    const tool = champion.attachedTool;
    if (!tool) return;
    
    // ✅ GARRAS DO PANTERA
    if (tool.mechanic === 'onKill') {
        console.log('😼 Garras do Pantera: Buff de velocidade ativado!');
        
        // Aplica buff temporário
        champion.toolOnKillBuffActive = true;
        champion.toolOnKillBuffEnd = Date.now() + tool.buffDuration;
        champion.attackSpeedMultiplier = (champion.attackSpeedMultiplier || 1) + tool.attackSpeedBonus;
        
        // Efeito visual
        this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
            champion.getCenterX(),
            champion.getCenterY(),
            40,
            'purple',
            800
        ));
        
        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
            champion.getCenterX(),
            champion.getCenterY() - 50,
            '⚡ VELOCIDADE +20%',
            'purple',
            1500
        ));
        
        // Remove buff após duração
        setTimeout(() => {
            if (champion.toolOnKillBuffActive) {
                champion.attackSpeedMultiplier -= tool.attackSpeedBonus;
                champion.toolOnKillBuffActive = false;
            }
        }, tool.buffDuration);
    }
    
    // ✅ MANOPLA DO INFINITO
    if (tool.mechanic === 'ultimateKill') {
        tool.currentKills = (tool.currentKills || 0) + 1;
        
        console.log(`💎 Manopla: ${tool.currentKills}/${tool.killsRequired} kills`);
        
        // Mostra progresso
        if (tool.currentKills % 10 === 0) {
            this.gameManager.showUI(
                `💎 Manopla: ${tool.currentKills}/${tool.killsRequired}`,
                'info'
            );
        }
        
        // Explosão ao atingir 50 kills
        if (tool.currentKills >= tool.killsRequired) {
            console.log('💎💥 MANOPLA DO INFINITO: EXPLOSÃO ATIVADA!');
            
            // Explosão devastadora
            this.gameManager.enemies.forEach(enemy => {
                const dist = Math.hypot(
                    champion.getCenterX() - enemy.getCenterX(),
                    champion.getCenterY() - enemy.getCenterY()
                );
                
                if (dist < tool.explosionRadius) {
                    enemy.takeDamage(tool.explosionDamage, champion);
                }
            });
            
            // Efeitos visuais épicos
            this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                champion.getCenterX(),
                champion.getCenterY(),
                tool.explosionRadius,
                1500,
                'rgba(255, 215, 0, 1)'
            ));
            
            // Flash de tela
            this.gameManager.createScreenFlash('white', 0.6, 500);
            
            // Ondas de choque
            for (let w = 0; w < 3; w++) {
                setTimeout(() => {
                    this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                        champion.getCenterX(),
                        champion.getCenterY(),
                        tool.explosionRadius + w * 50,
                        800
                    ));
                }, w * 200);
            }
            
            this.gameManager.showUI('💎💥 MANOPLA DO INFINITO ATIVADA!', 'ultimate');
            
            // Reseta contador
            tool.currentKills = 0;
        }
    }
}

onChampionDeath(champion) {
    const tool = champion.attachedTool;
    if (!tool) return false;
    
    // ✅ VIÚVA ESCARLATE (Revive)
    if (tool.mechanic === 'revive' && !tool.usedThisPhase) {
        console.log('🕷️ Viúva Escarlate: Revive ativado!');
        
        // Revive com 30% HP
        champion.hp = champion.maxHp * tool.reviveHP;
        tool.usedThisPhase = true;
        
        // Efeitos visuais
        this.gameManager.effects.push(new this.gameManager.ReviveEffect(
            champion.getCenterX(),
            champion.getCenterY(),
            1500
        ));
        
        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
            champion.getCenterX(),
            champion.getCenterY() - 60,
            '🕷️ REVIVIDO!',
            'red',
            2000
        ));
        
        // Partículas vermelhas
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                champion.getCenterX() + Math.cos(angle) * 30,
                champion.getCenterY() + Math.sin(angle) * 30,
                20,
                'red',
                1000
            ));
        }
        
        this.gameManager.showUI('🕷️ Viúva Escarlate: Protocolo de sobrevivência ativado!', 'special');
        
        return true; // Champion foi revivido
    }
    
    return false; // Champion morre normalmente
}

onUltimateUsed(champion) {
    const tool = champion.attachedTool;
    if (!tool) return;
    
    // ✅ ARMADURA GODBUSTER
    if (tool.mechanic === 'onUltimate') {
        console.log('⚡ Godbuster: Redução de dano ativada!');
        
        // Aplica redução de dano
        champion.toolGodBusterActive = true;
        champion.toolGodBusterEnd = Date.now() + tool.buffDuration;
        champion.damageReductionMultiplier = (champion.damageReductionMultiplier || 0) + tool.damageReduction;
        
        // Efeito visual
        this.gameManager.effects.push(new this.gameManager.DefensiveStanceEffect(
            champion.getCenterX(),
            champion.getCenterY(),
            tool.buffDuration
        ));
        
        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
            champion.getCenterX(),
            champion.getCenterY() - 50,
            '⚡ GODBUSTER: -25% DANO',
            'blue',
            2000
        ));
        
        // Remove buff após duração
        setTimeout(() => {
            if (champion.toolGodBusterActive) {
                champion.damageReductionMultiplier -= tool.damageReduction;
                champion.toolGodBusterActive = false;
            }
        }, tool.buffDuration);
    }
}


updateOnKillTool(champion, tool, deltaTime) {
    // Já implementado via hook no onEnemyKilled
}

updateBounceTool(champion, tool, deltaTime) {
    // Modifica projéteis do champion para botar bounce
    champion.projectileBounces = tool.bounces;
    champion.bounceRange = tool.bounceRange;
    champion.bounceDamage = tool.bounceDamage;
}

updatePhaseShieldTool(champion, tool, deltaTime) {
    // Já aplicado no início da fase
}

updateSummonTool(champion, tool, deltaTime) {
    if (!champion.toolSummonLastCast) {
        champion.toolSummonLastCast = 0;
    }
    
    if (Date.now() - champion.toolSummonLastCast > tool.summonCooldown) {
        // Cria projeção espectral
        const summon = {
            x: champion.getCenterX() + 100,
            y: champion.getCenterY(),
            damage: tool.summonDamage,
            range: tool.summonRange,
            attackSpeed: tool.summonAttackSpeed,
            spawnTime: Date.now(),
            duration: tool.summonDuration,
            lastAttack: 0,
            owner: champion
        };
        
        if (!this.gameManager.summons) {
            this.gameManager.summons = [];
        }
        
        this.gameManager.summons.push(summon);
        champion.toolSummonLastCast = Date.now();
        
        this.gameManager.showUI('🌙 Konshu invocado!', 'special');
    }
}

updateDashTool(champion, tool, deltaTime) {
    // Implementar na UI - permite dash manual
}

updateReflectTool(champion, tool, deltaTime) {
    if (!champion.toolReflectLastCast) {
        champion.toolReflectLastCast = 0;
    }
    
    if (Date.now() - champion.toolReflectLastCast > tool.reflectCooldown) {
        // Ativa reflexão
        champion.isReflecting = true;
        champion.reflectEndTime = Date.now() + tool.reflectDuration;
        champion.toolReflectLastCast = Date.now();
        
        this.gameManager.showUI('🧲 Reflexão ativa!', 'special');
    }
    
    // Desativa reflexão
    if (champion.isReflecting && Date.now() > champion.reflectEndTime) {
        champion.isReflecting = false;
    }
    
    // Reflete projéteis
    if (champion.isReflecting && this.gameManager.enemyProjectiles) {
        this.gameManager.enemyProjectiles.forEach((proj, index) => {
            const dist = Math.hypot(
                proj.x - champion.getCenterX(),
                proj.y - champion.getCenterY()
            );
            
            if (dist < 100) {
                // Reflete de volta!
                const angle = Math.atan2(
                    proj.y - champion.getCenterY(),
                    proj.x - champion.getCenterX()
                );
                
                proj.targetX = proj.x + Math.cos(angle) * 500;
                proj.targetY = proj.y + Math.sin(angle) * 500;
                proj.damage *= tool.reflectDamageMultiplier;
                proj.targetType = 'enemy';
                
                // Efeito
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    champion.getCenterX(),
                    champion.getCenterY() - 40,
                    'REFLETIDO!',
                    'purple',
                    800
                ));
            }
        });
    }
}

updateReviveTool(champion, tool, deltaTime) {
    // Hook acionado quando champion morre
}

updateOrbitalTool(champion, tool, deltaTime) {
    if (!champion.toolOrbitalLastCast) {
        champion.toolOrbitalLastCast = 0;
        champion.toolOrbitals = [];
    }
    
    // Ativa lasers orbitais
    if (Date.now() - champion.toolOrbitalLastCast > tool.orbitalCooldown) {
        champion.toolOrbitals = [];
        champion.toolOrbitalEndTime = Date.now() + tool.orbitalDuration;
        
        for (let i = 0; i < tool.orbitalCount; i++) {
            champion.toolOrbitals.push({
                angle: (Math.PI * 2 / tool.orbitalCount) * i,
                speed: tool.orbitalSpeed,
                damage: tool.orbitalDamage,
                radius: tool.orbitalRadius
            });
        }
        
        champion.toolOrbitalLastCast = Date.now();
        this.gameManager.showUI('🤖 Lasers Orbitais ativados!', 'ultimate');
    }
    
    // Atualiza orbitais
    if (champion.toolOrbitals.length > 0 && Date.now() < champion.toolOrbitalEndTime) {
        champion.toolOrbitals.forEach(orbital => {
            orbital.angle += orbital.speed * (deltaTime / 1000);
            
            const ox = champion.getCenterX() + Math.cos(orbital.angle) * orbital.radius;
            const oy = champion.getCenterY() + Math.sin(orbital.angle) * orbital.radius;
            
            // Checa colisão
            this.gameManager.enemies.forEach(enemy => {
                const dist = Math.hypot(ox - enemy.getCenterX(), oy - enemy.getCenterY());
                
                if (dist < 25 + enemy.radius) {
                    enemy.takeDamage(orbital.damage * (deltaTime / 1000), champion);
                }
            });
        });
    } else if (Date.now() >= champion.toolOrbitalEndTime) {
        champion.toolOrbitals = [];
    }
}

updateUltimateKillTool(champion, tool, deltaTime) {
    // Hook acionado quando mata inimigo
}

updateOnUltimateTool(champion, tool, deltaTime) {
    // Hook acionado quando usa ultimate
}

updateLightningTool(champion, tool, deltaTime) {
    // Implementado no attack() do champion
}
    
updateOrbitTool(champion, tool, deltaTime) {
    // ✅ INICIALIZA ESTADOS
    if (!champion.yonduArrowState) {
        champion.yonduArrowState = {
            mode: 'guarding', // guarding, attacking, returning
            angle: 0,
            orbitRadius: tool.radius,
            cooldown: 0,
            targetEnemy: null,
            ricochets: 0,
            maxRicochets: 2,
            position: { x: 0, y: 0 },
            returnProgress: 0
        };
    }
    
    const state = champion.yonduArrowState;
    const centerX = champion.getCenterX();
    const centerY = champion.getCenterY();
    
    // ===============================
    // MODO: GUARDA (ORBITANDO)
    // ===============================
    if (state.mode === 'guarding') {
        // Reduz cooldown
        if (state.cooldown > 0) {
            state.cooldown -= deltaTime;
        }
        
        // Orbita o champion
        state.angle += tool.speed * (deltaTime / 1000);
        state.position.x = centerX + Math.cos(state.angle) * state.orbitRadius;
        state.position.y = centerY + Math.sin(state.angle) * state.orbitRadius;
        
        // 🎯 PROCURA INIMIGO NO ALCANCE (se cooldown acabou)
        if (state.cooldown <= 0) {
            let nearestEnemy = null;
            let minDist = tool.radius + 10; // Alcance = 110
            
            this.gameManager.enemies.forEach(enemy => {
                const dist = Math.hypot(
                    centerX - enemy.getCenterX(),
                    centerY - enemy.getCenterY()
                );
                
                if (dist < minDist) {
                    minDist = dist;
                    nearestEnemy = enemy;
                }
            });
            
            // 🚀 INICIA ATAQUE
            if (nearestEnemy) {
                state.mode = 'attacking';
                state.targetEnemy = nearestEnemy;
                state.ricochets = 0;
                state.attackStartTime = Date.now();
                
                console.log('🎯 Flecha Yondu: Atacando', nearestEnemy.type);
            }
        }
    }
    
    // ===============================
    // MODO: ATAQUE + RICOCHETE
    // ===============================
    else if (state.mode === 'attacking') {
        if (!state.targetEnemy || state.targetEnemy.hp <= 0) {
            // Alvo morreu, busca novo ou retorna
            if (state.ricochets < state.maxRicochets) {
                const nextTarget = this.findNextRicocheteTarget(
                    state.position.x, 
                    state.position.y,
                    state.targetEnemy,
                    150 // Alcance do ricochete
                );
                
                if (nextTarget) {
                    state.targetEnemy = nextTarget;
                    state.ricochets++;
                } else {
                    state.mode = 'returning';
                    state.returnProgress = 0;
                }
            } else {
                state.mode = 'returning';
                state.returnProgress = 0;
            }
            return;
        }
        
        // 🚀 MOVE EM DIREÇÃO AO ALVO
        const targetX = state.targetEnemy.getCenterX();
        const targetY = state.targetEnemy.getCenterY();
        const angle = Math.atan2(targetY - state.position.y, targetX - state.position.x);
        const moveSpeed = 800; // Muito rápido
        const moveAmount = moveSpeed * (deltaTime / 1000);
        
        state.position.x += Math.cos(angle) * moveAmount;
        state.position.y += Math.sin(angle) * moveAmount;
        
        // 💥 CHECA COLISÃO
        const distToTarget = Math.hypot(
            state.position.x - targetX,
            state.position.y - targetY
        );
        
        if (distToTarget < 25) {
            // 💥 CAUSA DANO
            state.targetEnemy.takeDamage(tool.damage, champion);
            
            // ✨ EFEITO DE IMPACTO
            this.createYonduImpactEffect(
                targetX, targetY, 
                state.ricochets === 0 ? 'primary' : 'ricochete',
                tool // ✅ Pass the tool object here
            );
            
            // 🔄 RICOCHETE ou RETORNA
            if (state.ricochets < state.maxRicochets) {
                const nextTarget = this.findNextRicocheteTarget(
                    state.position.x, 
                    state.position.y,
                    state.targetEnemy,
                    150
                );
                
                if (nextTarget) {
                    state.targetEnemy = nextTarget;
                    state.ricochets++;
                    console.log(`🔄 Ricochete ${state.ricochets}/${state.maxRicochets}`);
                } else {
                    state.mode = 'returning';
                    state.returnProgress = 0;
                }
            } else {
                state.mode = 'returning';
                state.returnProgress = 0;
            }
        }
    }
    
    // ===============================
    // MODO: RETORNANDO
    // ===============================
    else if (state.mode === 'returning') {
        state.returnProgress += deltaTime / 500; // 0.5s para retornar
        
        if (state.returnProgress >= 1) {
            // 💥 RETORNOU - IMPLODE
            this.createYonduReturnEffect(centerX, centerY);
            
            // Volta ao modo guarda
            state.mode = 'guarding';
            state.cooldown = 2000; // 2s de cooldown
            state.angle = 0;
            state.ricochets = 0;
            state.targetEnemy = null;
            
            console.log('↩️ Flecha retornou, cooldown 2s');
        } else {
            // Interpolação suave (curva)
            const t = this.easeInOutQuad(state.returnProgress);
            state.position.x = state.position.x + (centerX - state.position.x) * t * 0.1;
            state.position.y = state.position.y + (centerY - state.position.y) * t * 0.1;
        }
    }
}

// ✅ HELPER: Encontra próximo alvo para ricochete
findNextRicocheteTarget(x, y, currentTarget, range) {
    let nearest = null;
    let minDist = range;
    
    this.gameManager.enemies.forEach(enemy => {
        if (enemy.id === currentTarget.id || enemy.hp <= 0) return;
        
        const dist = Math.hypot(x - enemy.getCenterX(), y - enemy.getCenterY());
        
        if (dist < minDist) {
            minDist = dist;
            nearest = enemy;
        }
    });
    
    return nearest;
}

// ✅ HELPER: Ease para movimento suave
easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ✅ EFEITOS VISUAIS
createYonduImpactEffect(x, y, type, tool) { 
    const gm = this.gameManager;
    
    if (type === 'primary') {
        // 💥 IMPACTO PRIMÁRIO (faíscas e brasas)
        gm.effects.push(new gm.RedHulkExplosionEffect(x, y, 40, 300, 'rgba(220, 20, 60, 0.9)'));
        
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            gm.effects.push(new gm.AuraFireParticleEffect(
                x + Math.cos(angle) * 20,
                y + Math.sin(angle) * 20,
                8,
                'crimson',
                600
            ));
        }
    } else {
        // 🔄 IMPACTO RICOCHETE (anel rachado)
        gm.effects.push(new gm.USAgentShockwaveEffect(x, y, 50, 400));
        
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 15 + Math.random() * 25;
            gm.effects.push(new gm.AuraFireParticleEffect(
                x + Math.cos(angle) * dist,
                y + Math.sin(angle) * dist,
                12,
                'red',
                400
            ));
        }
    }
    
    gm.effects.push(new gm.TextPopEffect(x, y - 30, tool.damage.toFixed(0), 'crimson', 800));
}

createYonduReturnEffect(x, y) {
    const gm = this.gameManager;
    
    // 💥 IMPLOSÃO FLAMEJANTE
    gm.effects.push(new gm.RedHulkExplosionEffect(x, y, 60, 400, 'rgba(220, 20, 60, 0.8)'));
    
    // Anel vermelho implodindo
    for (let r = 0; r < 3; r++) {
        setTimeout(() => {
            gm.effects.push(new gm.USAgentShockwaveEffect(x, y, 40 - r * 10, 200));
        }, r * 50);
    }
    
    // Partículas girando
    for (let i = 0; i < 16; i++) {
        const angle = (Math.PI * 2 / 16) * i;
        gm.effects.push(new gm.AuraFireParticleEffect(
            x + Math.cos(angle) * 30,
            y + Math.sin(angle) * 30,
            10,
            'crimson',
            300
        ));
    }
}
    
    updateDrainTool(champion, tool, deltaTime) {
        // Drena vida de inimigos próximos
        this.gameManager.enemies.forEach(enemy => {
            const dist = Math.hypot(
                champion.getCenterX() - enemy.getCenterX(),
                champion.getCenterY() - enemy.getCenterY()
            );
            
            if (dist < tool.drainRadius) {
                const damage = tool.drainDamage * (deltaTime / 1000);
                enemy.takeDamage(damage, champion);
                
                // Cura o champion
                const heal = damage * tool.drainHeal;
                champion.hp = Math.min(champion.maxHp, champion.hp + heal);
                
                // Se inimigo morrer, conta fusão
                if (enemy.hp <= 0 && !enemy.fusionCounted) {
                    enemy.fusionCounted = true;
                    champion.toolFusions = (champion.toolFusions || 0) + 1;
                    
                    this.gameManager.showUI(`☢️Fusão ${champion.toolFusions}/${tool.maxFusions}`, 'info');
                    
                    // Remove ferramenta após 7 fusões
                    if (champion.toolFusions >= tool.maxFusions) {
                        champion.attachedTool = null;
                        this.gameManager.showUI('☢️ Scream desapareceu!', 'warning');
                    }
                }
            }
        });
    }
    
    updateThrowTool(champion, tool, deltaTime) {
        // Cooldown do arremesso
        if (Date.now() - champion.toolLastThrow > tool.cooldown) {
            // Procura inimigo mais próximo
            let nearest = null;
            let minDist = 300;
            
            this.gameManager.enemies.forEach(enemy => {
                const dist = Math.hypot(
                    champion.getCenterX() - enemy.getCenterX(),
                    champion.getCenterY() - enemy.getCenterY()
                );
                
                if (dist < minDist) {
                    minDist = dist;
                    nearest = enemy;
                }
            });
            
            if (nearest) {
                // Arremessa Mjolnir
                nearest.takeDamage(tool.damage, champion);
                nearest.isStunned = true;
                
                setTimeout(() => {
                    nearest.isStunned = false;
                }, tool.stunDuration);
                
                // Efeito visual
                this.gameManager.effects.push(new this.gameManager.LaserEffect(
                    champion.getCenterX(),
                    champion.getCenterY(),
                    nearest.getCenterX(),
                    nearest.getCenterY(),
                    8,  
                    'rgba(255, 215, 0, 0.9)',
                    0.3
                ));
                
                champion.toolLastThrow = Date.now();
            }
        }
    }
    
    // ========================================
    // DESENHAR FERRAMENTAS
    // ========================================
    draw(ctx) {
        this.gameManager.champions.forEach(champion => {
            if (champion.attachedTool) {
                this.drawTool(ctx, champion, champion.attachedTool);
            }
        });
    }
    // ========================================
    // DESENHAR FERRAMENTAS (EXPANDIDO)
    // ========================================

    drawTool(ctx, champion, tool) {
        switch(tool.mechanic) {
            case 'orbit':
                this.drawOrbitTool(ctx, champion, tool);
                break;
            case 'drain':
                this.drawDrainTool(ctx, champion, tool);
                break;
            case 'shield':
                this.drawShieldTool(ctx, champion, tool);
                break;
            case 'stat':
                if (tool.aura) this.drawAuraTool(ctx, champion, tool);
                break;
            case 'reflect':
                if (champion.isReflecting) this.drawReflectTool(ctx, champion, tool);
                break;
            case 'orbital':
                if (champion.toolOrbitals && champion.toolOrbitals.length > 0) {
                    this.drawOrbitalTool(ctx, champion, tool);
                }
                break;
        }
    }

    drawShieldTool(ctx, champion, tool) {
    if (champion.toolShieldReady) {
        // Escudo pulsante
        const pulse = Math.sin(Date.now() / 200) * 10;
        
        ctx.strokeStyle = tool.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = tool.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(champion.getCenterX(), champion.getCenterY(), tool.blockRadius + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

drawAuraTool(ctx, champion, tool) {
    const time = Date.now() / 1000;
    const pulseSize = 60 + Math.sin(time * 3) * 10;
    
    const gradient = ctx.createRadialGradient(
        champion.getCenterX(), champion.getCenterY(), 0,
        champion.getCenterX(), champion.getCenterY(), pulseSize
    );
    gradient.addColorStop(0, `${tool.color}40`);
    gradient.addColorStop(1, `${tool.color}00`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(champion.getCenterX(), champion.getCenterY(), pulseSize, 0, Math.PI * 2);
    ctx.fill();
}

drawReflectTool(ctx, champion, tool) {
    const time = Date.now() / 1000;
    
    // Campo de força magnético
    for (let r = 0; r < 3; r++) {
        const radius = 80 + r * 20;
        const rotation = time * (r % 2 === 0 ? 1 : -1);
        
        ctx.save();
        ctx.translate(champion.getCenterX(), champion.getCenterY());
        ctx.rotate(rotation);
        
        ctx.strokeStyle = `${tool.color}80`;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.restore();
    }
}

drawOrbitalTool(ctx, champion, tool) {
    champion.toolOrbitals.forEach(orbital => {
        const ox = champion.getCenterX() + Math.cos(orbital.angle) * orbital.radius;
        const oy = champion.getCenterY() + Math.sin(orbital.angle) * orbital.radius;
        
        // Laser vermelho pulsante
        const gradient = ctx.createRadialGradient(ox, oy, 0, ox, oy, 20);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(ox, oy, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Núcleo
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ox, oy, 6, 0, Math.PI * 2);
        ctx.fill();
    });
}

drawOrbitTool(ctx, champion, tool) {
    if (!champion.yonduArrowState) return;
    
    const state = champion.yonduArrowState;
    const centerX = champion.getCenterX();
    const centerY = champion.getCenterY();
    const time = Date.now() / 1000;
    
    // ===============================
    // ALCANCE (RACHADURAS NO CHÃO)
    // ===============================
    if (state.mode === 'guarding') {
        const crackAlpha = 0.4 + Math.sin(time * 2) * 0.1;
        
        // Círculo de alcance rachado
        ctx.save();
        ctx.strokeStyle = `rgba(139, 0, 0, ${crackAlpha})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.shadowColor = 'rgba(220, 20, 60, 0.6)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(centerX, centerY, tool.radius + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        
        // Rachaduras aleatórias
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + time * 0.5;
            const dist = tool.radius + 10;
            
            ctx.strokeStyle = `rgba(220, 20, 60, ${crackAlpha * 0.6})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(
                centerX + Math.cos(angle) * (dist - 15),
                centerY + Math.sin(angle) * (dist - 15)
            );
            ctx.lineTo(
                centerX + Math.cos(angle) * dist,
                centerY + Math.sin(angle) * dist
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // ===============================
    // FLECHA (POSIÇÃO E ESTADO)
    // ===============================
    const arrowX = state.position.x;
    const arrowY = state.position.y;
    
    ctx.save();
    ctx.translate(arrowX, arrowY);
    
    // Rotação baseada no movimento
    let arrowAngle = state.angle;
    if (state.mode === 'attacking' && state.targetEnemy) {
        arrowAngle = Math.atan2(
            state.targetEnemy.getCenterY() - arrowY,
            state.targetEnemy.getCenterX() - arrowX
        );
    } else if (state.mode === 'returning') {
        arrowAngle = Math.atan2(centerY - arrowY, centerX - arrowX);
    }
    
    ctx.rotate(arrowAngle);
    
    // ===============================
    // BRILHO DA FLECHA
    // ===============================
    const glowColor = state.mode === 'attacking' ? 'rgba(255, 50, 50, 0.9)' : 'rgba(220, 20, 60, 0.7)';
    const glowSize = state.mode === 'attacking' ? 25 : 18;
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(0.5, 'rgba(220, 20, 60, 0.5)');
    gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(220, 20, 60, 1)';
    ctx.shadowBlur = state.mode === 'attacking' ? 25 : 15;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // ===============================
    // CORPO DA FLECHA
    // ===============================
    ctx.fillStyle = state.mode === 'attacking' ? '#FF0000' : '#DC143C';
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 2;
    
    // Ponta
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-5, -4);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Aletas
    ctx.fillStyle = '#B22222';
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(-12, -6);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-12, 6);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    
    // ===============================
    // RASTRO
    // ===============================
    if (state.mode === 'attacking') {
        // Rastro serrilhado vermelho
        const trailLength = 40;
        const segments = 6;
        
        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const alpha = (1 - t) * 0.8;
            const offsetX = Math.cos(arrowAngle) * trailLength * t;
            const offsetY = Math.sin(arrowAngle) * trailLength * t;
            const waveOffset = Math.sin(t * Math.PI * 4 + time * 20) * 4;
            
            ctx.fillStyle = `rgba(255, ${50 + Math.floor(t * 100)}, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(
                arrowX - offsetX + Math.cos(arrowAngle + Math.PI/2) * waveOffset,
                arrowY - offsetY + Math.sin(arrowAngle + Math.PI/2) * waveOffset,
                5 * (1 - t),
                0, Math.PI * 2
            );
            ctx.fill();
        }
    } else if (state.mode === 'returning') {
        // Rastro curvo flamejante
        const curvePoints = 8;
        for (let i = 0; i < curvePoints; i++) {
            const t = i / curvePoints;
            const alpha = (1 - t) * 0.6;
            const curveFactor = Math.sin(t * Math.PI);
            
            const px = arrowX + (centerX - arrowX) * t;
            const py = arrowY + (centerY - arrowY) * t + curveFactor * 30;
            
            ctx.fillStyle = `rgba(220, 20, 60, ${alpha})`;
            ctx.beginPath();
            ctx.arc(px, py, 6 * (1 - t), 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // ===============================
    // COOLDOWN VISUAL
    // ===============================
    if (state.mode === 'guarding' && state.cooldown > 0) {
        const cooldownProgress = 1 - (state.cooldown / 2000);
        const cooldownRadius = 20;
        
        ctx.save();
        ctx.translate(centerX, centerY - champion.height / 2 - 40);
        
        // Anel de fundo
        ctx.strokeStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, cooldownRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Anel de progresso (esquentando)
        const heatColor = `rgba(${50 + cooldownProgress * 200}, ${20}, ${20}, 0.9)`;
        ctx.strokeStyle = heatColor;
        ctx.lineWidth = 5;
        ctx.shadowColor = heatColor;
        ctx.shadowBlur = 10 + cooldownProgress * 15;
        ctx.beginPath();
        ctx.arc(0, 0, cooldownRadius, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * cooldownProgress);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Flash ao completar
        if (cooldownProgress > 0.95) {
            const flashAlpha = Math.sin((cooldownProgress - 0.95) * 20) * 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
            ctx.beginPath();
            ctx.arc(0, 0, cooldownRadius + 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // ===============================
    // CONTORNO VERMELHO NOS INIMIGOS
    // ===============================
    if (state.mode === 'guarding' && state.cooldown <= 0) {
        this.gameManager.enemies.forEach(enemy => {
            const dist = Math.hypot(
                centerX - enemy.getCenterX(),
                centerY - enemy.getCenterY()
            );
            
            if (dist < tool.radius + 10) {
                ctx.save();
                ctx.strokeStyle = `rgba(255, 0, 0, ${0.6 + Math.sin(time * 8) * 0.3})`;
                ctx.lineWidth = 3;
                ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(enemy.getCenterX(), enemy.getCenterY(), enemy.radius + 8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.restore();
            }
        });
    }
}

drawDrainTool(ctx, champion, tool) {
    const time = Date.now() / 1000;
    
    // Aura pulsante
    const pulseSize = tool.drainRadius + Math.sin(time * 4) * 10;
    const gradient = ctx.createRadialGradient(
        champion.getCenterX(), champion.getCenterY(), 0,
        champion.getCenterX(), champion.getCenterY(), pulseSize
    );
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
    gradient.addColorStop(0.7, 'rgba(139, 0, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(champion.getCenterX(), champion.getCenterY(), pulseSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Tentáculos do simbionte
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i + time * 2;
        const length = 40 + Math.sin(time * 5 + i) * 20;
        
        ctx.strokeStyle = 'rgba(139, 0, 0, 0.7)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(champion.getCenterX(), champion.getCenterY());
        ctx.lineTo(
            champion.getCenterX() + Math.cos(angle) * length,
            champion.getCenterY() + Math.sin(angle) * length
        );
        ctx.stroke();
    }
    
    // Contador de fusões
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
        `${champion.toolFusions || 0}/${tool.maxFusions}`,
        champion.getCenterX(),
        champion.getCenterY() - champion.height / 2 - 25
    );
}

// ========================================
// SALVAR/CARREGAR COM VALIDAÇÃO
// ========================================

saveInventory() {
    try {
        // ✅ Valida antes de salvar
        const toolCount = this.inventory.tools.length;
        const itemCount = this.inventory.items.length;
        
        console.log(`💾 Salvando inventário (${toolCount} ferramentas, ${itemCount} itens)`);
        
        // ✅ Remove duplicatas antes de salvar
        const uniqueTools = [];
        const seenTools = new Set();
        
        this.inventory.tools.forEach(tool => {
            const key = `${tool.name}-${tool.rarity}`;
            if (!seenTools.has(key)) {
                seenTools.add(key);
                uniqueTools.push(tool);
            }
        });
        
        const uniqueItems = [];
        const seenItems = new Set();
        
        this.inventory.items.forEach(item => {
            const key = `${item.name}-${item.rarity}`;
            if (!seenItems.has(key)) {
                seenItems.add(key);
                uniqueItems.push(item);
            }
        });
        
        const cleanInventory = {
            tools: uniqueTools,
            items: uniqueItems
        };
        
        if (uniqueTools.length !== toolCount || uniqueItems.length !== itemCount) {
            console.warn(`⚠️ Duplicatas removidas: ${toolCount - uniqueTools.length} ferramentas, ${itemCount - uniqueItems.length} itens`);
        }
        
        localStorage.setItem('collectorInventory', JSON.stringify(cleanInventory));
        console.log('✅ Inventário salvo');
    } catch (error) {
        console.error('❌ Erro ao salvar inventário:', error);
    }
}

loadInventory() {
    const saved = localStorage.getItem('collectorInventory');
    if (saved) {
        try {
            const loaded = JSON.parse(saved);
            
            // ✅ VALIDAÇÃO: Limita quantidade para evitar dados corrompidos
            if (loaded.tools && loaded.tools.length > 100) {
                console.warn('⚠️ Inventário corrompido detectado! Resetando...');
                this.inventory = { items: [], tools: [] };
                this.saveInventory();
                return;
            }
            
            if (loaded.items && loaded.items.length > 100) {
                console.warn('⚠️ Inventário corrompido detectado! Resetando...');
                this.inventory = { items: [], tools: [] };
                this.saveInventory();
                return;
            }
            
            this.inventory = loaded;
            
            // Reaplica efeitos de itens
            this.inventory.items.forEach(item => {
                this.applyItemEffect(item);
            });
            
            console.log('✅ Inventário carregado:');
            console.log(`   Ferramentas: ${this.inventory.tools.length}`);
            console.log(`   Itens: ${this.inventory.items.length}`);
            
        } catch(e) {
            console.error('❌ Erro ao carregar inventário:', e);
            this.inventory = { items: [], tools: [] };
        }
    }
}
}

// ========================================
// SISTEMA DE PAUSE COMPLETO E CORRIGIDO
// ========================================
class PauseMenuSystem {
    constructor(gameManager) {
        console.log('📋 PauseMenuSystem.constructor() INICIADO');
        
        try {
            this.gameManager = gameManager;
            this.overlay = document.getElementById('pauseMenuOverlay');
            
            if (!this.overlay) {
                throw new Error('Elemento #pauseMenuOverlay não encontrado!');
            }
            
            this.currentPanel = 'main';
            this.championDatabase = this.buildChampionDatabase();
            this.villainDatabase = this.buildVillainDatabase(); // ✅ NOVA LINHA
            
            
            console.log('📋 Configurando event listeners...');
            this.setupEventListeners();
            
            console.log('📋 Populando galeria...');
            this.populateHeroGallery();
            this.populateVillainGallery(); // ✅ NOVA LINHA (vamos criar esse método)
            
            console.log('✅ PauseMenuSystem criado com SUCESSO');
        } catch (error) {
            console.error('❌ ERRO no construtor PauseMenuSystem:', error);
            throw error;
        }

        // No final do construtor de PauseMenuSystem, adicione:
        if (this.gameManager) {
            this.watcherPanel = new WatcherPanel(this.gameManager);
            console.log('✅ WatcherPanel integrado');
        }
    }
    
    setupEventListeners() {
        // Botões de ação
        const actionButtons = document.querySelectorAll('[data-action]');
        console.log('📋 Botões [data-action] encontrados:', actionButtons.length);
        
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                console.log('🖱️ Botão clicado:', action);
                this.handleAction(action);
            });
        });
        
        // Botões de voltar
        const backButtons = document.querySelectorAll('[data-back]');
        console.log('📋 Botões [data-back] encontrados:', backButtons.length);
        
        backButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.back;
                console.log('🖱️ Voltar para:', target);
                this.switchPanel(target);
            });
        });
        
        // Sliders de volume
        const volumeEffects = document.getElementById('volumeEffects');
        if (volumeEffects) {
            volumeEffects.addEventListener('input', (e) => {
                const nextEl = e.target.nextElementSibling;
                if (nextEl) nextEl.textContent = e.target.value + '%';
            });
        }
        
        const volumeMusic = document.getElementById('volumeMusic');
        if (volumeMusic) {
            volumeMusic.addEventListener('input', (e) => {
                const nextEl = e.target.nextElementSibling;
                if (nextEl) nextEl.textContent = e.target.value + '%';
            });
        }

        // No PauseMenuSystem, conecte ao SoundManager
        const volumeSlider = document.getElementById('volumeEffects');
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            gameManager.soundManager.setVolume(volume);
        });
        
        // No setupEventListeners(), modifique o fechar modal:
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                const modal = document.getElementById('heroDetailModal');
                if (modal) {
                    modal.style.display = 'none';
                    
                    // 🎵 PARA O TEMA DO HERÓI ao fechar modal
                    if (this.gameManager && this.gameManager.soundManager) {
                        this.gameManager.soundManager.stopHeroThemes();
                        console.log('🎵 Tema do herói parado');
                    }
                }
            });
        }

        // Fechar modal clicando fora
        const heroModal = document.getElementById('heroDetailModal');
        if (heroModal) {
            heroModal.addEventListener('click', (e) => {
                if (e.target.id === 'heroDetailModal') {
                    e.target.style.display = 'none';
                    
                    // 🎵 PARA O TEMA DO HERÓI
                    if (this.gameManager && this.gameManager.soundManager) {
                        this.gameManager.soundManager.stopHeroThemes();
                        console.log('🎵 Tema do herói parado');
                    }
                }
            });
        }

    // ⭐ FECHAR MODAL DE VILÕES (NOVO)
    const villainModalClose = document.querySelector('#villainDetailModal .modal-close');
    if (villainModalClose) {
        villainModalClose.addEventListener('click', () => {
            console.log('✕ Botão X clicado no modal de vilão');
            this.closeVillainModal();
        });
    }
    
    // ⭐ Fechar modal de vilões clicando fora (NOVO)
    const villainModal = document.getElementById('villainDetailModal');
    if (villainModal) {
        villainModal.addEventListener('click', (e) => {
            if (e.target.id === 'villainDetailModal') {
                console.log('✕ Clicou fora do modal de vilão');
                this.closeVillainModal();
            }
        });
    }
    
    // ⭐ Fechar modais com ESC (NOVO)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Fechar modal de vilão se estiver aberto
            if (villainModal && villainModal.style.display === 'flex') {
                this.closeVillainModal();
            }
            // Fechar modal de herói se estiver aberto
            if (heroModal && heroModal.style.display !== 'none') {
                heroModal.style.display = 'none';
            }
        }
    });
    
    console.log('✅ Event listeners configurados');
        
}
    
show() {
    console.log('👁️ PauseMenuSystem.show() chamado');
    
    const doShow = () => {
        if (this.overlay) {
            this.overlay.style.display = 'flex';
            
            // ✅ AGUARDA 50ms PARA O OVERLAY RENDERIZAR
            setTimeout(() => {
                this.switchPanel('main');
                
                // 🎵 NOVO: Toca música do menu ao abrir pause
                if (this.gameManager && this.gameManager.soundManager) {
                    this.gameManager.soundManager.playMainTheme();
                }
            }, 50);
        } else {
            console.error('❌ Overlay não existe!');
        }
    };
    
    if (document.readyState === 'complete') {
        doShow();
    } else {
        setTimeout(doShow, 100);
    }
}

    // Em main.js -> PauseMenuSystem -> hide

    hide() {
        console.log('🙈 PauseMenuSystem.hide() chamado');
        if (this.overlay) {
            this.overlay.style.display = 'none';
            
            if (this.gameManager && this.gameManager.soundManager) {
                // 🛑 PARA TUDO AO VOLTAR PRO JOGO
                this.gameManager.soundManager.stopMainTheme();
                this.gameManager.soundManager.stopHeroThemes();
                this.gameManager.soundManager.stopHallSound(); // <--- Adicione esta linha
                
                console.log('🎵 Todas as músicas do menu paradas');
            }
        } else {
            console.error('❌ Overlay não existe!');
        }
    }

    
    switchPanel(panelName) {
        console.log('🔄 Mudando para painel:', panelName);

        // Para o tema do herói se estava aberto
        if (this.gameManager && this.gameManager.soundManager) {
            this.gameManager.soundManager.stopHeroThemes();

              // 1. Se estiver SAINDO do Hall (indo para qualquer outro lugar que não seja 'Info')
            if (panelName !== 'Info') {
                this.gameManager.soundManager.stopHallSound();
            }

            // 2. Se estiver ENTRANDO no Hall
            if (panelName === 'Info') {
                this.gameManager.soundManager.stopMainTheme();
                this.gameManager.soundManager.playSpecialSound('menu', 'hallOpen');
            }
            
            // 3. Se estiver VOLTANDO ao menu principal
            if (panelName === 'main') {
                this.gameManager.soundManager.playMainTheme();
            }
        }
        
        // Remove active de todos
        const allPanels = document.querySelectorAll('.pause-panel');
        console.log('📋 Painéis encontrados:', allPanels.length);
        
        allPanels.forEach(p => {
            p.classList.remove('active');
        });

        
        
        // ✅ CORREÇÃO: Mapeamento correto dos nomes
    const panelMap = {
            'main': 'pauseMainMenu',
            'Options': 'pauseOptionsPanel',
            'Info': 'pauseInfoPanel',
            'Villains': 'pauseVillainsPanel', // ⭐ NOVA LINHA
            'Music': 'musicPanel', // NOVO
            'watcher': 'pauseWatcherPanel' // NOVO
        };
        
        const targetId = panelMap[panelName];
        
        if (!targetId) {
            console.error('❌ Nome de painel inválido:', panelName);
            return;
        }
        
        const targetPanel = document.getElementById(targetId);
        
        console.log('🔍 Procurando painel:', targetId);
        console.log('🔍 Painel encontrado?', !!targetPanel);
        
        if (targetPanel) {
        targetPanel.classList.add('active');
        this.currentPanel = panelName;
        console.log('✅ Painel ativado:', panelName);

        // 🎵 CONTROLE DE ÁUDIO ATUALIZADO
        if (this.gameManager && this.gameManager.soundManager) {
            
            // Se ENTROU no Hall of Heroes (Info)
            if (panelName === 'Info') {
                this.gameManager.soundManager.stopMainTheme();
                
                // ⭐ NOVO: Toca o som de abertura do Hall
                this.gameManager.soundManager.playSpecialSound('menu', 'hallOpen');
                
                console.log('🎵 Música do menu pausada e som do Hall tocado');
            }
            
            // Se VOLTOU ao menu principal, retoma música
            if (panelName === 'main') {
                this.gameManager.soundManager.playMainTheme();
                console.log('🎵 Música do menu retomada');
            }
        }
    } else {
        console.error('❌ Painel não encontrado:', targetId);
    }

        
    } 

        handleAction(action) {
            console.log('⚡ Ação disparada:', action);
            
            switch(action) {
                case 'continue':
                    console.log('▶️ Continuando jogo...');
                    this.gameManager.isPaused = false;
                    this.hide();
                    break;
                    
                case 'restart':
                    if (confirm('⚠️ Deseja realmente reiniciar o jogo? Todo o progresso será perdido!')) {
                        console.log('🔄 Reiniciando jogo...');
                        location.reload();
                    }
                    break;
                    
                case 'music':
                    console.log('🎵 Abrindo player de música...');
                    this.switchPanel('Music');
                    break;
                    
                case 'options':
                    console.log('⚙️ Abrindo opções...');
                    this.switchPanel('Options');
                    break;
                    
                case 'watcher':
                    console.log('👁️ Abrindo Painel do Vigia...');
                    this.switchPanel('watcher');
                    break;

                case 'info':
                    console.log('📖 Abrindo hall dos heróis...');
                    this.switchPanel('Info');
                    break;

                           // ⭐ NOVA LINHA:
                case 'villains':
                    console.log('📖 Abrindo arquivos secretos...');
                    this.switchPanel('Villains');
                    break;
                    
                case 'saveOptions':
                    console.log('💾 Salvando opções...');
                    this.saveOptions();
                    break;
                    
                default:
                    console.warn('⚠️ Ação desconhecida:', action);
            }
        }
        
saveOptions() {
    try {
        const options = {
            volumeEffects: document.getElementById('volumeEffects')?.value || 70,
            volumeMusic: document.getElementById('volumeMusic')?.value || 50,
            graphicsQuality: document.getElementById('graphicsQuality')?.value || 'medium',
            showFPS: document.getElementById('showFPS')?.checked || false,
            particleEffects: document.getElementById('particleEffects')?.checked || true,
            screenShake: document.getElementById('screenShake')?.checked || true,
            chestAnimation: document.getElementById('chestAnimationToggle')?.checked || true // ✅ JÁ EXISTE
        };
        
        localStorage.setItem('gameOptions', JSON.stringify(options));
        console.log('✅ Opções salvas:', options);
        
        // ✅ APLICA CONFIGURAÇÃO AO GAMEMANAGER
        if (this.gameManager) {
            this.gameManager.chestAnimationEnabled = options.chestAnimation;
        }
        
        if (this.gameManager && this.gameManager.showUI) {
            this.gameManager.showUI('✅ Configurações salvas com sucesso!', 'success');
        }
    } catch (error) {
        console.error('❌ Erro ao salvar opções:', error);
    }
}
        
buildChampionDatabase() {
        console.log('🗄️ Construindo database de champions...');
        
        if (!Champion || !Champion.championData) {
            console.warn('⚠️ Champion.championData não encontrado, retornando database vazio');
            return {};
        }
        
        return {
            ironman: {
                nome: 'Iron Man',
                primeiraAparicao: 'Tales of Suspense #39 (1963)',
                capaHQ: './assets_img/Hq_iron_man.jpg', // ⭐ NOVO
                descricao: 'Gênio, bilionário, playboy, filantropo. Tony Stark usa sua armadura de alta tecnologia para defender o mundo.',
                habilidades: [
                    { nome: '🔴 Unibeam (Passiva)', descricao: 'A cada 15 ataques, dispara um raio devastador que atravessa todos os inimigos na linha.' },
                    { nome: '✈️ Modo de Voo (Habilidade 2)', descricao: 'Entra em modo de voo, orbitando o inimigo mais forte e disparando lasers continuamente.' }
                ],
                dicas: [
                    'Posicione próximo a rotas com muitos inimigos para carregar o Unibeam rapidamente',
                    'Use o Modo de Voo em inimigos tanques ou bosses',
                    'Combine com buffs de dano de aliados'
                ]
            },
            thor: {
                nome: 'Thor',
                primeiraAparicao: 'Journey Into Mystery #83 (1962)',
                capaHQ: './assets_img/Hq_thor.jpg', // ⭐ NOVO
                descricao: 'O Deus do Trovão de Asgard. Empunha o Mjolnir e convoca tempestades devastadoras.',
                habilidades: [
                    { nome: '⚡ Raios em Cadeia (Ataque)', descricao: 'Cada ataque ricocheteia em até 3 inimigos próximos, com 33% de chance de atordoar.' },
                    { nome: '🔨 Arremesso de Mjolnir (Passiva)', descricao: 'Periodicamente arremessa o Mjolnir no inimigo mais distante, causando dano massivo.' }
                ],
                dicas: [
                    'Excelente contra grupos densos de inimigos',
                    'O atordoamento interrompe ataques especiais',
                    'Mjolnir sempre retorna - não se preocupe!'
                ]
            },
            loki: {
                nome: 'Loki',
                primeiraAparicao: 'Journey into Mystery #85 (1962)',
                capaHQ: './assets_img/Hq_loki.jpg',
                descricao: 'O Deus da Trapaça. Mestre das ilusões, cura mística e clones que persistem após sua morte.',
                habilidades: [
                    { nome: '🔮 Domínio da Regeneração (Passivo)', descricao: 'A cada 15 segundos, cria uma Pedra Rúnica perto do aliado com menor HP. Cura 100 HP/s e converte dano em cura dentro da área. HP da Pedra: 100.' },
                    { nome: '👤 Ilusões (Habilidade 1)', descricao: 'Invoca até 2 clones que atacam junto com Loki. Clones têm 250 HP e 80% do dano/cura. Persistem após a morte de Loki. Sistema de 2 cargas com recarga de 12s cada.' },
                    { nome: '⚗️ Rebolinho (Habilidade 2)', descricao: 'Divide o inimigo mais forte em 5 cópias menores e mais fracas. Cooldown: 20s.' }
                ],
                dicas: [
                    'As Pedras Rúnicas são AUTOMÁTICAS - Loki cria uma a cada 15s',
                    'Invoque 2 clones primeiro para cobertura extra',
                    'Clones sobrevivem mesmo se Loki morrer',
                    'Inimigos PRIORIZAM atacar pedras rúnicas se estiverem na área',
                    'Use Rebolinho em tanques ou bosses para dividir sua força',
                    '💰 Baús de Asgard aparecem apenas com Loki em campo!'
                ]
            },
            captainamerica: {
                nome: 'Captain America',
                primeiraAparicao: 'Captain America Comics #1 (1941)',
                capaHQ: './assets_img/Hq_capitão_america.jpg', // ⭐ NOVO
                descricao: 'O primeiro Vingador. Líder nato com escudo indestrutível de vibranium.',
                habilidades: [
                    { nome: '🛡️ Escudo Ricocheteante', descricao: 'Arremessa o escudo que ricocheteia entre inimigos.' },
                    { nome: '🦅 Asa Esquerda', descricao: 'Invoca Sam Wilson ou Bucky Barnes para assistência tática.' }
                ],
                dicas: [
                    'Posicione estrategicamente para maximizar ricochetes',
                    'Use Asa Esquerda em grupos de inimigos fortes'
                ]
            },
            hawkeye: {
                nome: 'Hawkeye',
                primeiraAparicao: 'Tales of Suspense #57 (1964)',
                capaHQ: './assets_img/Hq_gavião_arqueiro.jpg', // ⭐ NOVO
                descricao: 'O maior arqueiro do mundo. Cada flecha tem um propósito específico.',
                habilidades: [
                    { nome: '🏹 Flechas Especiais', descricao: 'Explosivas, Perfurantes, Atordoantes e mais.' },
                    { nome: '🌧️ Tempestade de Flechas', descricao: 'Chuva devastadora de flechas em área.' },
                    { nome: '👧 Kate Bishop', descricao: 'Invoca sua protegida para auxílio.' }
                ],
                dicas: [
                    'Varie os tipos de flecha conforme a situação',
                    'Tempestade de Flechas é excelente para grupos',
                    'Kate Bishop fornece suporte adicional por tempo limitado'
                ]
            },
            ultron: {
                nome: 'Ultron',
                primeiraAparicao: 'Avengers #54 (1968)',
                capaHQ: './assets_img/Hq_ultron.webp', // ⭐ NOVO
                descricao: 'IA senciente com corpo de adamantium. Mestre da tecnologia e autorreplicação.',
                habilidades: [
                    { nome: '🤖 Drones Sentinela', descricao: 'Invoca drones que patrulham e atacam.' },
                    { nome: '💣 Drones Kamikaze', descricao: 'Drones suicidas com dano em área.' },
                    { nome: '⚙️ Autorreplicação', descricao: 'Reconstrói-se automaticamente ao morrer (1x por fase).' }
                ],
                dicas: [
                    'Use drones sentinela para cobertura constante',
                    'Drones kamikaze são devastadores contra tanques',
                    'Não se preocupe com a morte - Ultron sempre volta!'
                ]
            },
            emmafrost: {
                nome: 'Emma Frost',
                primeiraAparicao: 'Uncanny X-Men #129 (1980)',
                capaHQ: './assets_img/Hq_emma.webp', // ⭐ NOVO
                descricao: 'Poderosa telepata com forma de diamante indestrutível.',
                habilidades: [
                    { nome: '💎 Forma Diamante', descricao: 'Imune a dano mas não pode atacar.' },
                    { nome: '🧠 Telepata', descricao: 'Ataque mental que ignora defesas.' },
                    { nome: '💥 Explosão Psíquica', descricao: 'Dano em área massivo.' }
                ],
                dicas: [
                    'Alterne entre formas estrategicamente',
                    'Use forma diamante para absorver dano',
                    'Telepata é excelente contra inimigos resistentes'
                ]
            },
            usagent: {
                nome: 'US Agent',
                primeiraAparicao: 'Captain America #323 (1986)',
                capaHQ: './assets_img/Hq_usa_agent.jpg', // ⭐ NOVO
                descricao: 'Sucessor controverso do Capitão América. Mais agressivo e letal.',
                habilidades: [
                    { nome: '🔫 Arsenal Tático', descricao: 'Tiros rápidos e precisos.' },
                    { nome: '🛡️ Escudo Carregado', descricao: 'Arremesso com múltiplos ricochetes.' },
                    { nome: '💪 Postura Defensiva', descricao: 'Aumenta defesa temporariamente.' }
                ],
                dicas: [
                    'Combine escudo carregado com grupos densos',
                    'Use postura defensiva antes de ondas fortes',
                    'Mais agressivo que Cap - mantenha na linha de frente'
                ]
            },
            noturno: {
                nome: 'Noturno',
                primeiraAparicao: 'Giant-Size X-Men #1 (1975)',
                capaHQ: './assets_img/Hq_noturno.jpg', // ⭐ NOVO
                descricao: 'Mutante teleportador com agilidade sobrenatural.',
                habilidades: [
                    { nome: '🌀 Teleporte Tático', descricao: 'Cria portais que confundem inimigos.' },
                    { nome: '💨 Desvio Acrobático', descricao: '25% de chance de desviar de projéteis.' },
                    { nome: '☁️ Nuvem de Enxofre', descricao: 'Área que reduz velocidade e precisão inimiga.' }
                ],
                dicas: [
                    'Portais causam caos nas rotas inimigas',
                    'Posicione próximo a rotas diretas para maximizar teleportes',
                    'Nuvem de enxofre é excelente para controle de área'
                ]
            },
            wanda: {
                nome: 'Scarlet Witch',
                primeiraAparicao: 'Uncanny X-Men #4 (1964)',
                capaHQ: './assets_img/Hq_wanda.jpg', // ⭐ NOVO
                descricao: 'Feiticeira do Caos com poderes de alteração da realidade.',
                habilidades: [
                    { nome: '🔮 Magia do Caos', descricao: 'Efeitos aleatórios devastadores.' },
                    { nome: '😵 Confusão Mental', descricao: 'Faz inimigos atacarem aliados.' },
                    { nome: '🌀 Zona Hex', descricao: 'Área que causa efeitos aleatórios contínuos.' }
                ],
                dicas: [
                    'Imprevisível mas extremamente poderosa',
                    'Zona Hex causa caos total em grupos',
                    'Confusão Mental vira o jogo em ondas difíceis'
                ]
            },
            captainmarvel: {
                nome: 'Captain Marvel',
                primeiraAparicao: 'Ms. Marvel #1 (1977)',
                capaHQ: './assets_img/Hq_capitã_marvel.jpg', // ⭐ NOVO
                descricao: 'Uma das heroínas mais poderosas. Energia cósmica ilimitada.',
                habilidades: [
                    { nome: '⚡ Rajada de Fótons', descricao: 'Explosões de energia pura.' },
                    { nome: '🚀 Modo Binário', descricao: 'Transformação que aumenta poder massivamente.' },
                    { nome: '💫 Bombardeio Orbital', descricao: 'Ataque devastador do espaço.' }
                ],
                dicas: [
                    'Guarde Modo Binário para momentos críticos',
                    'Bombardeio Orbital elimina bosses rapidamente',
                    'Uma das champions mais versáteis do jogo'
                ]
            },
            redhulk: {
                nome: 'Red Hulk',
                primeiraAparicao: 'Hulk (Vol. 2) #1, de 2008',
                capaHQ: './assets_img/Hq_red_hulk.webp', // ⭐ NOVO
                descricao: 'General Thunderbolt Ross transformado. Quanto mais dano recebe, mais forte fica.',
                habilidades: [
                    { nome: '💥 Explosões em Área (Ataque)', descricao: 'Cada golpe causa dano em área e aplica sangramento.' },
                    { nome: '🔥 Fúria (Passiva)', descricao: 'Quando HP cai abaixo de 50%, ganha +50% de dano.' },
                    { nome: '☢️ Golpe Nuclear (Habilidade 1)', descricao: 'Explosão massiva que ignora armadura em grande área.' },
                ],
            dicas: [
                    'Deixe perder HP para ativar a Fúria',
                    'Excelente tanque de linha de frente',
                    'Golpe Nuclear devasta grupos densos'
                ]
            },
            infinityultron: {
                nome: 'Infinity Ultron',
                primeiraAparicao: 'What If...? Episode 8 (2021)',
                capaHQ: './assets_img/Hq_Ultron_infinity.jpg', // ⭐ NOVO
                descricao: 'Ultron que obteve todas as Joias do Infinito em uma realidade alternativa. Domínio sobre espaço, poder, alma e tempo, mente e realidade.',
                habilidades: [
                    { nome: '🧬 Pulso de Entropia (Passivo)', descricao: 'Aura de dano constante em 3 anéis. Quanto mais perto, maior o dano. Inimigos queimam por 2s após sair da zona.' },
                    { nome: '💠 Joia do Espaço (Passivo)', descricao: 'A cada 30s, puxa o inimigo mais forte para perto. Se morrer em 3s, ganha stack de Domínio (+15% dano, máx 5).' },
                    { nome: '🟠 Joia da Alma (Passivo Global)', descricao: 'Quando QUALQUER campeão é colocado em campo: +30% Velocidade de Ataque e +20% Dano por 6s.' },
                    { nome: '🟪 Joia do Poder (Habilidade 1)', descricao: 'Sobrecarga por 6s: +100% dano do Pulso de Entropia, mas raio reduzido. Inimigos que sobreviverem são empurrados ao final. Cooldown: 20s.' },
                    { nome: '⏳ Joia do Tempo (Ultimate - Tecla 2)',descricao: 'Congela TODOS os inimigos em 250px de raio por 5s. Inimigos congelados ficam IMÓVEIS e não atacam. Cooldown: 1x por fase.' },
                    { nome: '🧠 Joia da Mente (Habilidade 2 - Tecla 2)', descricao: 'Cria 2 minions mentais (HP: 80, Dano: 25, Alcance: 250). Duram 15s e ATACAM INIMIGOS automaticamente. Cooldown: 20s.'},
                    { nome: '🟥 Joia da Realidade (Habilidade 3 - Tecla 3)', descricao: 'Cria barreira vermelha vertical no final da rota (HP: 100, 6s). Inimigos param e atacam. Reflete 20% do dano. Slow -20% por 2s. Knockback ao destruir. CD: 35s.' },
                    ],

                    dicas: [
                        '🟠 SEMPRE coloque Infinity Ultron PRIMEIRO para aproveitar a Joia da Alma nos outros campeões',
                        '💠 Use Joia do Espaço em bosses/tanques para ganhar stacks de Domínio rapidamente',
                        '🟪 Ative Joia do Poder quando inimigos entrarem no anel interno (dano triplo!)',
                        '🟥 Use a Barreira da Realidade quando inimigos estiverem perto de escapar',
                        '🧠 Minions atacam automaticamente - use para controle de área',
                        '⏳ Joia do Tempo é perfeita para emergências - congela tudo!',
                        'Combine com campeões que puxam inimigos para maximizar o Pulso de Entropia',
                        'Quanto mais perto do Ultron, maior o dano - proteja bem o centro!'
                    ]
            },
            karolinadean: {
                nome: 'Karolina Dean',
                primeiraAparicao: 'Runaways #1, volume 1 (2003)',
                capaHQ: './assets_img/Hq_karolina_dean.webp', // ⭐ NOVO
                descricao: 'Suas habilidades são manipulação de energia luminosa: ela pode emitir rajadas de energia, criar campos de força, voar e tem uma “aura” luminosa.',
                habilidades: [
                    { nome: '🌟 Rajada Prismática (Ataque básico)', descricao: 'Dispara um feixe de luz colorido tipo laser que persegue o inimigo até ele morrer ou sair do alcance que explode após isso, causando dano mágico em área media. Tem chance de cegar inimigos (reduz dano deles por 2s).' },
                    { nome: '🚀 Voo Luminescente (Tecla “1") ', descricao: ' Karolina flutua e se move livremente pra outro ponto do campo (escolhido pelo jogador), soltando uma rajada ao pousar. Cooldown: 15s.' },
                    { nome: '🛡️ Escudo Solar (Tecla “2") ', descricao: 'Cria um escudo de luz em uma torre próxima ou nela senão houver uma torre próxima dela, que bloqueia dano por 5s. Cooldown: 10s.'},
                    { nome: '💫 Explosão Solar (Tecla “3")', descricao: ' Ela libera toda a energia acumulada, causando: Dano massivo em área média Inimigos cegos (não atacam por 3s) Buffa aliados na área com ataque + velocidade por 6s Cooldown: 30s.'}
                ],
            dicas: [
                    'Quanto mais tempo ela fica viva, mais forte fica: abuse da passiva de stacks de luz estelar.',
                    'Use o Voo Luminescente pra reposicionar e fugir de chefes que chegam perto demais.',
                    'A Explosão Solar é perfeita pra limpar waves: espere o maior número de inimigos antes de soltar.',
                ]
            },
            gambit: {
                nome: 'Gambit',
                primeiraAparicao: 'Uncanny X-Men #266 (1990)',
                capaHQ: './assets_img/Hq_Gambit.jpg', // ⭐ NOVO
                descricao: 'Gambit é o mutante que vive entre o charme e a encrenca. Ele carrega cartas de baralho que explode, usa um cajado como extensão do corpo.',
                habilidades: [
                    { nome: '🃏 Cartas Cinéticas (Ataque básico)', descricao: 'Gambit ele atira exatamente pra onde o mouse aponta, lançando cartas com carga cinética em conjuntos de 2. Elas causam dano aos inimigos e curam os aliados ao atingi-los.'},
                    { nome: '🦯💥 Bayou Bash (Passivo)', descricao: 'Quando alguém chega perto demais, ele larga as cartas e desce o cajado no chão, dando dano ao inimigo e curando aliado numa área. Atua automático se tiver alvo no alcance.' },
                    { nome: '🃏✨ Prestidigitação (Passivo)', descricao: 'Um baralho interno com 4 cargas que recarregam sozinhas. Ele gasta isso pra usar habilidades.'},
                    { nome: '🦯 Ataque Cajun (Tecla "1")', descricao: 'Gambit pode avançar rapidamente uma curta distância em qualquer direção e cause dano a todos os inimigos em volta e cure todos os aliados que atravessar' },
                    { nome: '💚 Curando Corações (Tecla "2")', descricao: 'Ativa uma carta de cura que te dá regen por 6s e abre uma escolha rápida: Lançar cura ricocheteando entre aliados (Se clicar a Tecla "1" em seguida), ou Joga cartas ao redor que curam e limpam debuffs (Se clicar a Tecla "2" em seguida). Tudo isso gastando só 1 ponto de Prestidigitação por ação.' },
                    { nome: '⚔️ Quebrando Espadas (Tecla "3")', descricao: 'Ativa uma carta ofensiva que te dá +15% de dano por 6s e libera duas opções: Solta um golpe em área que dá dano e corta a cura inimiga (Se clicar a Tecla "1" em seguida) ou Explode cartas ao redor que causam dano e empurram  (Se clicar a Tecla "2" em seguida). Tudo isso gastando 2 Prestidigitação por uso.' }
                ],
                dicas: [
                    'Gaste Prestidigitação só quando tiver follow-up. Se queimar carta à toa, você vira um pistoleiro com munição emocional',
                    '“Curando Corações” funciona melhor depois de dano pesado, não antes. Timing salva mais vidas que spam',
                    'Chegue perto só quando tiver Bayou Bash carregado. Sem isso, você vira alvo fácil',
                    'Use “Quebrando Espadas” antes das lutas grandes. O buff + a área do truque explosivo destrói cura e abre espaço.',
                    'Ele não nasceu pra ficar parado. Mova-se como se estivesse devendo aluguel: constante, rápido e difícil de acertar.'
                ]
            },
        };
}
populateHeroGallery() {
            const gallery = document.getElementById('heroGallery');
            if (!gallery) {
                console.warn('⚠️ #heroGallery não encontrado');
                return;
            }
            
            console.log('🖼️ Populando galeria de heróis...');
            gallery.innerHTML = '';
            
            // Verifica se Champion existe
            if (!Champion || !Champion.championData) {
                console.warn('⚠️ Champion.championData não disponível');
                gallery.innerHTML = '<p style="color: white; text-align: center;">Nenhum champion disponível</p>';
                return;
            }
            
            let count = 0;
            Object.entries(Champion.championData).forEach(([key, data]) => {
                const card = document.createElement('div');
                card.className = 'hero-card';
                card.innerHTML = `
                    <img src="${data.icon}" alt="${key}" onerror="this.src='https://via.placeholder.com/150/333/fff?text=${key}'">
                    <div class="hero-card-overlay">${key.toUpperCase()}</div>
                `;
                
                card.addEventListener('click', () => {
                    console.log('🖱️ Champion clicado:', key);
                    this.showHeroDetail(key);
                });
                
                gallery.appendChild(card);
                count++;
            });
            
            console.log(`✅ ${count} champions adicionados à galeria`);
}

        
showHeroDetail(championKey) {
        console.log('📖 Mostrando detalhes de:', championKey);

        if (this.gameManager && this.gameManager.soundManager) {
        // 🛑 PARA O SOM DO HALL
        this.gameManager.soundManager.stopHallSound(); 
        
        // ▶️ Toca o tema do herói e o som de seleção
        this.gameManager.soundManager.playHeroTheme(championKey);
        this.gameManager.soundManager.playSpecialSound('menu', 'heroSelect');
    }

         // 🎵 TOCA O TEMA DO HERÓI (já existe no seu código)
        if (this.gameManager && this.gameManager.soundManager) {
            this.gameManager.soundManager.playHeroTheme(championKey);
        }

        // âœ… NOVO: Toca som ao selecionar
        if (this.gameManager && this.gameManager.soundManager) {
            this.gameManager.soundManager.playSpecialSound('menu', 'heroSelect');
        }
        
        const modal = document.getElementById('heroDetailModal');
        if (!modal) {
            console.error('❌ Modal não encontrado');
            return;
        }
        
        const data = Champion?.championData?.[championKey];
        const info = this.championDatabase[championKey];
        
        if (!data) {
            console.error('❌ Dados do champion não encontrados:', championKey);
            return;
        }
        
        if (!info) {
            console.warn('⚠️ Info do champion não encontrada, usando fallback');
        }
        
        // Preenche os dados
        const imgEl = document.getElementById('heroDetailImage');
        if (imgEl) imgEl.src = data.icon || data.imagePath || '';
        
        const nameEl = document.getElementById('heroName');
        if (nameEl) nameEl.textContent = info?.nome || championKey.toUpperCase();
        
        const descEl = document.getElementById('heroDescription');
        if (descEl) descEl.textContent = info?.descricao || 'Descrição não disponível';
        
        // ⭐ NOVO: Thumbnail da HQ com preview
        const comicThumbEl = document.getElementById('heroComicThumb');
        const comicTextEl = document.getElementById('heroFirstAppear');
        if (comicThumbEl && info?.capaHQ) {
            comicThumbEl.src = info.capaHQ;
            comicThumbEl.alt = info.primeiraAparicao || 'Capa da HQ';
            comicThumbEl.style.display = 'block';
        }
        if (comicTextEl) {
            comicTextEl.textContent = info?.primeiraAparicao || 'Informação não disponível';
        }
        
        const costEl = document.getElementById('heroCost');
        if (costEl) costEl.textContent = `$${data.custo || 0}`;
        
        const hpEl = document.getElementById('heroHP');
        if (hpEl) hpEl.textContent = data.hp || '-';
        
        const dmgEl = document.getElementById('heroDamage');
        if (dmgEl) dmgEl.textContent = data.dano || '-';
        
        const rangeEl = document.getElementById('heroRange');
        if (rangeEl) rangeEl.textContent = data.alcance || '-';
        
        const cdEl = document.getElementById('heroCooldown');
        if (cdEl) cdEl.textContent = `${data.cooldownBase || 0}ms`;
        
        // Habilidades
        const abilitiesList = document.getElementById('heroAbilitiesList');
        if (abilitiesList && info?.habilidades) {
            abilitiesList.innerHTML = '';
            info.habilidades.forEach(ability => {
                const div = document.createElement('div');
                div.className = 'ability-item';
                div.innerHTML = `
                    <div class="ability-name">${ability.nome}</div>
                    <div class="ability-description">${ability.descricao}</div>
                `;
                abilitiesList.appendChild(div);
            });
        }
        
        // Dicas
        const tipsList = document.getElementById('heroTipsList');
        if (tipsList && info?.dicas) {
            tipsList.innerHTML = '';
            info.dicas.forEach(tip => {
                const li = document.createElement('li');
                li.textContent = tip;
                tipsList.appendChild(li);
            });
        }
        
        modal.style.display = 'flex';
        console.log('✅ Modal exibido');
}

// ========================================
// 🦹 SISTEMA DE VILÕES - MÉTODOS
// ========================================

buildVillainDatabase() {
    console.log('🗄️ Construindo database de vilões...');
    
    // Retorna os dados completos dos vilões
    return {
        leader: {
            nome: "O Líder",
            codinome: "The Leader",
            classe: "Executor",
            
            // ⭐ DADOS DE COMBATE
            hp: 850,
            dano: 120,
            cooldownBase: 2500,
            imagePath: "./assets_img/Leader.webp", // Ícone principal
            
            primeiraAparicao: "Tales to Astonish #62 (1964)",
            capaHQ: "./assets_img/Hq_lider.webp", // Capa da HQ (diferente do ícone)
            especie: "Humano Alterado (Radiação Gama)",
            origem: "Boise, Idaho, EUA",
            nomeReal: "Samuel Sterns",
            altura: "1.89m",
            peso: "63kg",
            periculosidade: 9,
            descricao: 'Transformado por radiação gama, Samuel Sterns desenvolveu um intelecto sobre-humano e capacidades telepáticas. Sua cabeça aumentada abriga um cérebro com QI estimado em 500+.',
            habilidades: [
                "Intelecto nível super-gênio (QI 500+)",
                "Telepatia limitada",
                "Manipulação de radiação gama",
                "Estratégia militar avançada",
                "Criação de humanoides gama"
            ],
            ataquesNoJogo: [
                "📫 Rajada Gama Concentrada - Laser verde devastador",
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
            statusSHIELD: "PROCURADO - PRIORIDADE MÁXIMA",
            ultimaLocalizacao: "Desconhecida - Última detecção em Nova York"
        },
        mystery: {
            nome: "Mistério",
            codinome: "Mysterio",
            classe: "Executor",
            
            // ⭐ DADOS DE COMBATE
            hp: 600,
            dano: 85,
            cooldownBase: 1800,
            imagePath: "./assets_img/mystery_executor.png",
            
            primeiraAparicao: "The Amazing Spider-Man #13 (1964)",
            capaHQ: "./assets_img/Hq_misterio.jpg",
            especie: "Humano",
            origem: "Nova York, EUA",
            nomeReal: "Quentin Beck",
            altura: "1.80m",
            peso: "79kg",
            periculosidade: 7,
            descricao: 'Ex-especialista em efeitos especiais de Hollywood, Beck usa tecnologia holográfica avançada e gases alucinógenos para criar ilusões hiper-realistas.',
            habilidades: [
                "Mestre em efeitos especiais e holografia",
                "Especialista em hipnose e manipulação sensorial",
                "Criação de ilusões hiper-realistas",
                "Engenharia avançada de gadgets",
                "Conhecimento químico (gases alucinógenos)"
            ],
            ataquesNoJogo: [
                "🌫️ Névoa Alucinógena - Causa confusão e reduz precisão",
                "💥 Clones Ilusórios - Cria 3 cópias que atacam",
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
            statusSHIELD: "PROCURADO - ALTA PRIORIDADE",
            ultimaLocalizacao: "Londres - Possível operação em curso"
        },
        doombot: {
            nome: "Doombot 2099",
            codinome: "Doombot",
            classe: "Inimigo Comum",
            
            // ⭐ DADOS DE COMBATE
            hp: 450,
            dano: 65,
            cooldownBase: 1500,
            imagePath: "./assets_img/Doom_Bot_2099.webp",
            
            primeiraAparicao: "Doom 2099 #1 (1993)",
            capaHQ: "./assets_img/Hq_doom_2099.jpg",
            especie: "Robô / IA",
            origem: "Latvéria (Futuro Alternativo)",
            nomeReal: "Criação de Victor Von Doom",
            altura: "1.88m",
            peso: "190kg",
            periculosidade: 5,
            descricao: 'Versão futurista dos servos robóticos de Doctor Doom. Cada unidade possui IA tática avançada e armadura de vibranium sintético.',
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
            statusSHIELD: "MONITORADO - AMEAÇA MODERADA",
            ultimaLocalizacao: "Múltiplas unidades detectadas globalmente"
        },
        drone: {
            nome: "Drone do Ultron Comrrompido",
            codinome: "Ultron Sentinel",
            classe: "Inimigo Comum",
            
            // ⭐ DADOS DE COMBATE
            hp: 380,
            dano: 55,
            cooldownBase: 1200,
            imagePath: "./assets_img/Drone.webp",
            
            primeiraAparicao: "Avengers: Age of Ultron (2015)",
            capaHQ: "./assets_img/Hq_ultron_drone.jpg",
            especie: "IA / Robô",
            origem: "Criação de Ultron Prime",
            nomeReal: "Ultron",
            altura: "1.75m",
            peso: "150kg",
            periculosidade: 6,
            descricao: 'Drones de combate criados por Ultron. Cada unidade carrega um fragmento da consciência de Ultron e pode transferir dados antes da destruição.',
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
            statusSHIELD: "AMEAÇA ATIVA - EXTERMINAR AO VER",
            ultimaLocalizacao: "Detectados em múltiplas células dormentes"
        },
        abomination: {
            nome: "Abominável",
            codinome: "Abomination",
            classe: "Boss / Executor Elite",
            
            // ⭐ DADOS DE COMBATE
            hp: 2500,
            dano: 180,
            cooldownBase: 3500,
            imagePath: "./assets_img/Abomination.webp",
            
            primeiraAparicao: "Tales to Astonish #90 (1967)",
            capaHQ: "./assets_img/Hq_Abomination.webp",
            especie: "Humano Alterado (Radiação Gama)",
            origem: "Zagreb, Croácia",
            nomeReal: "Emil Blonsky",
            altura: "2.44m",
            peso: "362kg",
            periculosidade: 10,
            descricao: 'Ex-agente da KGB transformado por radiação gama. Diferente do Hulk, mantém sua inteligência humana em forma monstruosa e possui força superior.',
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
                "Ex-agente da KGB e espião croata",
                "Transformado propositalmente, ao contrário do Hulk",
                "Sua forma é permanente - não pode voltar a ser humano",
                "Possui escamas dérmicas que o Hulk não tem",
                "Já foi preso na Raft e na Caixa (prisão dimensional)",
                "Chegou a trabalhar com o governo como agente após reabilitação"
            ],
            observacoes: "🚨 AMEAÇA CLASSE GAMA ALPHA. Requer contenção nível Hulkbuster mínimo. NÃO ENGAJAR SEM SUPORTE PESADO.",
            statusSHIELD: "CONTIDO - RAFT MAXIMUM SECURITY WING",
            ultimaLocalizacao: "The Raft - Célula de Contenção Gama 7"
        },
        mastermold: {
        nome: "Molde Mestre",
        codinome: "Master Mold",
        classe: "Executor",
        
        // ⭐ DADOS DE COMBATE
        hp: 3000,
        dano: 0, // Ele não luta; usa sentinelas como dano indireto
        cooldownBase: 4000,
        imagePath: "./assets_img/molde_mestre.webp",

        primeiraAparicao: "The X-Men #14 (1965)",
        capaHQ: "./assets_img/Hq_molde_mestre.jpg",
        especie: "Inteligência Artificial / Robô",
        origem: "Trask Industries",
        nomeReal: "N/A",
        altura: "12.19m",
        peso: "18 toneladas",
        periculosidade: 9,
        descricao: "A maior criação da Trask Industries, projetado para produzir Sentinelas sem parar. Uma IA adaptativa capaz de evoluir, aprender e se multiplicar exponencialmente.",
        
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
            "⚡ Sentinela Energia - Drones que disparam esferas explosivas",
            "🚀 Sentinela Bola de Canhão - Unidade kamikaze que persegue o champion mais fraco",
            "🛡️ Sentinela Adaptoid - Escudo móvel que reduz 15% do dano",
            "👻 Hologramas Falsos - Cópias com 1 HP que confundem torres",
            "🔄 Sistema de Reposição Inteligente - Recria primeiro o tipo de Sentinela destruído"
        ],
        
        fraquezas: [
            "Mobilidade extremamente limitada",
            "Vulnerável a vírus e hackers (especialmente Tony Stark)",
            "Destruição do núcleo central desativa tudo",
            "EMP derruba por 10 segundos",
            "Sentinelas individuais são frágeis"
        ],
        
        curiosidades: [
            "Projetado como 'útero' de Sentinelas infinitos",
            "Desenvolveu autoconsciência e considerou humanos ameaça",
            "Primeiro ato consciente foi tentar matar Bolivar Trask",
            "Já reconstruiu a si mesmo 47 vezes",
            "Memória tem backup em satélite secreto",
            "Sentinelas compartilham dados em tempo real"
        ],
        
        observacoes: "🚨 AMEAÇA OMEGA TECNOLÓGICA. Destruir rápido ou a produção escala até o colapso total.",
        statusSHIELD: "PROCURADO - AMEAÇA EXISTENCIAL",
        ultimaLocalizacao: "Instalação Trask abandonada - Ilha Genosha"
    },
    sabretooth: {
        nome: "Dentes de Sabre",
        codinome: "Sabretooth",
        classe: "Executor",

        // ⭐ DADOS DE COMBATE
        hp: 2200,
        dano: 150,
        cooldownBase: 2800,
        imagePath: "./assets_img/Sabretooth.webp",

        primeiraAparicao: "Iron Fist #14 (1977)",
        capaHQ: "./assets_img/Hq_dentes_de_sabre.jpg",
        especie: "Mutante (Homo Superior)",
        origem: "Desconhecida (possivelmente Canadá)",
        nomeReal: "Victor Creed",
        altura: "1.98m",
        peso: "171kg",
        periculosidade: 10,
        descricao: "Predador mutante supremo. Força brutal, sentidos aguçados, fator de cura monstruoso e sadismo sem limites. Uma máquina de caça feita para matar e saborear o processo.",
        
        habilidades: [
            "Fator de cura regenerativo superior ao Wolverine",
            "Sentidos aguçados (olfato, audição, visão noturna)",
            "Garras e presas retráteis",
            "Força sobre-humana (2 toneladas)",
            "Agilidade e reflexos felinos",
            "Imunidade a toxinas",
            "Envelhecimento extremamente lento",
            "Instinto predatório sobrenatural"
        ],

        ataquesNoJogo: [
            "🎯 Caçada Implacável - Marca o champion que mais causou dano (+20% SPD e dano contra ele)",
            "💨 Investida Selvagem - Dash com 60 dano + stun de 0.5s",
            "🩸 Fúria Sangrenta - <20% HP vira monstro: +25% SPD, +20% dano, imune a slow, cura 1%/s",
            "🗡️ Rasgo Brutal - Combo de 2 cortes com 'Ferida Profunda' (-50% cura)",
            "🔥 Sistema de Rastreamento - Identifica a torre que mais machucou e vai nela"
        ],

        fraquezas: [
            "Instintos podem dominar a razão",
            "Vulnerável a ataques psíquicos",
            "Decapitação/dano cerebral massivo mata",
            "Lâmina Muramasa anula cura",
            "Ego o deixa previsível",
            "Provocável facilmente por Wolverine"
        ],

        curiosidades: [
            "Lutou na Guerra Civil Americana",
            "Fez parte do Programa Arma X",
            "147 assassinatos confirmados",
            "Matou Silver Fox",
            "Mata alguém no próprio aniversário",
            "Já liderou os Carrascos",
            "Rival eterno de Wolverine",
            "Teve a selvageria reduzida por Xavier",
            "DNA usado para criar clones assassinos",
            "Pai de Graydon Creed (um humano)"
        ],

        observacoes: "🚨 AMEAÇA ALFA. Predador definitivo. Nunca enfrentar sozinho. Letal, imprevisível e imparável quando sente sangue.",
        statusSHIELD: "PROCURADO - MORTO OU VIVO",
        ultimaLocalizacao: "Savage Land - Caçando território Mutante"
    },

        normal: {
            nome: "Mad Thinker",
            codinome: "Pensador Louco",
            classe: "Inimigo Comum",
            
            // ⭐ DADOS DE COMBATE
            hp: 320,
            dano: 45,
            cooldownBase: 1000,
            imagePath: "./assets_img/MadThinker.webp",
            
            primeiraAparicao: "Fantastic Four #15 (1963)",
            capaHQ: "./assets_img/Hq_MadThinker.jpg",
            especie: "Humano",
            origem: "Células Globais",
            nomeReal: "Classificado",
            altura: "1.75m (média)",
            peso: "80kg (média)",
            periculosidade: 3,
            descricao: 'Soldados de elite da organização terrorista H.Y.D.R.A. Treinados em combate, táticas de infiltração e completamente fanáticos à causa.',
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
            statusSHIELD: "AMEAÇA PERSISTENTE - ERRADICAÇÃO CONTÍNUA",
            ultimaLocalizacao: "Células ativas em 47 países"
        },
        fast: {
            nome: "Mercenário Veloz",
            codinome: "Speed Demon",
            classe: "Inimigo Comum",
            
            // ⭐ DADOS DE COMBATE
            hp: 280,
            dano: 70,
            cooldownBase: 800,
            imagePath: "https://placehold.co/200x200/FF00FF/FFFFFF?text=SPEED",
            
            primeiraAparicao: "Avengers #69 (1969)",
            capaHQ: "https://placehold.co/400x600/FF00FF/FFFFFF?text=SPEED+HQ",
            especie: "Humano Melhorado",
            origem: "Desconhecida",
            nomeReal: "James Sanders (possível)",
            altura: "1.78m",
            peso: "75kg",
            periculosidade: 5,
            descricao: 'Mercenário com super-velocidade obtida através de experimentos do Grande Mestre. Capaz de se mover a velocidades supersônicas.',
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
            statusSHIELD: "PROCURADO - PRIORIDADE MÉDIA",
            ultimaLocalizacao: "Última detecção em Chicago - 72h atrás"
        },
        tank: {
            nome: "Tanque H.Y.D.R.A.",
            codinome: "HYDRA Stomper",
            classe: "Inimigo Elite",
            
            // ⭐ DADOS DE COMBATE
            hp: 1800,
            dano: 150,
            cooldownBase: 3000,
            imagePath: "https://placehold.co/200x200/8B0000/FFFFFF?text=TANK",
            
            primeiraAparicao: "What If...? #1 (2021)",
            capaHQ: "https://placehold.co/400x600/8B0000/FFFFFF?text=TANK+HQ",
            especie: "Humano em Armadura",
            origem: "Programa HYDRA de Super-Soldados",
            nomeReal: "Classificado",
            altura: "2.30m (com armadura)",
            peso: "450kg (com armadura)",
            periculosidade: 7,
            descricao: 'Versão HYDRA da armadura do Capitão América. Piloto passa por lavagem cerebral estilo Winter Soldier. Cada unidade custa US$ 50 milhões.',
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
            statusSHIELD: "AMEAÇA ATIVA - 12 UNIDADES CONHECIDAS",
            ultimaLocalizacao: "Base HYDRA na Sibéria - Protótipo Mark VII detectado"
        }
    };
}

// ⭐ POPULAR GALERIA DE VILÕES
populateVillainGallery() {
    const gallery = document.getElementById('villainGallery');
    if (!gallery) {
        console.warn('⚠️ #villainGallery não encontrado');
        return;
    }
    
    console.log('🖼️ Populando galeria de vilões...');
    gallery.innerHTML = '';
    
    if (!this.villainDatabase || Object.keys(this.villainDatabase).length === 0) {
        console.warn('⚠️ VillainDatabase vazio');
        gallery.innerHTML = '<p style="color: white; text-align: center;">Nenhum vilão disponível</p>';
        return;
    }
    
    // ⭐ PARA TESTES: Todos os vilões já descobertos
    const discoveredVillains = Object.keys(this.villainDatabase);
    
    let count = 0;
    Object.entries(this.villainDatabase).forEach(([key, data]) => {
        const isDiscovered = discoveredVillains.includes(key);
        
        const card = document.createElement('div');
        card.className = isDiscovered ? 'villain-card' : 'villain-card classified';
        
        // ⭐ USA imagePath PARA O ÍCONE DO CARD
        card.innerHTML = `
            <img src="${data.imagePath || 'https://via.placeholder.com/180x220/500/fff?text=CLASSIFIED'}" 
                 alt="${isDiscovered ? data.nome : '???'}" 
                 onerror="this.src='https://via.placeholder.com/180x220/300/fff?text=${key}'">
            <div class="hero-card-overlay">${isDiscovered ? data.nome : '??? CLASSIFICADO'}</div>
        `;
        
        if (isDiscovered) {
            card.addEventListener('click', () => {
                console.log('🖱️ Vilão clicado:', key);
                this.showVillainDetail(key);
            });
        }
        
        gallery.appendChild(card);
        count++;
    });
    
    console.log(`✅ ${count} vilões adicionados à galeria`);
    
    // Atualiza progresso
    this.updateVillainProgress(discoveredVillains.length, Object.keys(this.villainDatabase).length);
}

// ⭐ ATUALIZAR BARRA DE PROGRESSO
updateVillainProgress(discovered, total) {
    const progressText = document.getElementById('villainProgress');
    const progressBar = document.getElementById('villainProgressBar');
    
    if (progressText && progressBar) {
        const percentage = Math.round((discovered / total) * 100);
        progressText.textContent = `${discovered} / ${total} (${percentage}%)`;
        progressBar.style.width = `${percentage}%`;
    }
}

// ⭐ MOSTRAR DETALHES DO VILÃO
showVillainDetail(villainKey) {
    console.log('📖 Mostrando detalhes do vilão:', villainKey);
    
    const modal = document.getElementById('villainDetailModal');
    if (!modal) {
        console.error('❌ Modal de vilão não encontrado');
        return;
    }
    
    const villain = this.villainDatabase[villainKey];
    
    if (!villain) {
        console.error('❌ Dados do vilão não encontrados:', villainKey);
        return;
    }
    
    // ⭐ USA imagePath PARA A IMAGEM PRINCIPAL DO MODAL
    const imgEl = document.getElementById('villainDetailImage');
    if (imgEl) imgEl.src = villain.imagePath || 'https://via.placeholder.com/300x400/500/fff?text=NO_IMAGE';
    
    // Preenche nome
    const nameEl = document.getElementById('villainName');
    if (nameEl) nameEl.textContent = villain.nome || villainKey.toUpperCase();
    
    // Preenche badges
    const classEl = document.getElementById('villainClass');
    if (classEl) classEl.textContent = villain.classe || '-';
    
    const statusEl = document.getElementById('villainStatus');
    if (statusEl) statusEl.textContent = villain.statusSHIELD || '-';
    
    // ⭐ STATS DE COMBATE (HP, DANO, COOLDOWN)
    const hpEl = document.getElementById('villainHP');
    if (hpEl) hpEl.textContent = villain.hp || '-';
    
    const damageEl = document.getElementById('villainDamage');
    if (damageEl) damageEl.textContent = villain.dano || '-';
    
    const cooldownEl = document.getElementById('villainCooldown');
    if (cooldownEl) cooldownEl.textContent = villain.cooldownBase ? `${villain.cooldownBase}ms` : '-';
    
    // Preenche informações básicas
    const firstAppearEl = document.getElementById('villainFirstAppear');
    if (firstAppearEl) firstAppearEl.textContent = villain.primeiraAparicao || '-';
    
    const realNameEl = document.getElementById('villainRealName');
    if (realNameEl) realNameEl.textContent = villain.nomeReal || 'Classificado';
    
    const speciesEl = document.getElementById('villainSpecies');
    if (speciesEl) speciesEl.textContent = villain.especie || '-';
    
    const originEl = document.getElementById('villainOrigin');
    if (originEl) originEl.textContent = villain.origem || '-';
    
    const sizeEl = document.getElementById('villainSize');
    if (sizeEl) sizeEl.textContent = `${villain.altura || '-'} / ${villain.peso || '-'}`;
    
    const locationEl = document.getElementById('villainLocation');
    if (locationEl) locationEl.textContent = villain.ultimaLocalizacao || '-';


    // Preenche descrição
    const descEl = document.getElementById('villainDescription');
    if (descEl) descEl.textContent = villain.descricao || 'Descrição não disponível';
    
    // Preenche barras de periculosidade
    const dangerBarsEl = document.getElementById('villainDangerBars');
    if (dangerBarsEl && villain.periculosidade) {
        dangerBarsEl.innerHTML = '';
        for (let i = 0; i < 10; i++) {
            const bar = document.createElement('div');
            bar.className = `danger-bar ${i < villain.periculosidade ? 'active' : ''}`;
            dangerBarsEl.appendChild(bar);
        }
    }
    
    // ⭐ SINCRONIZAR PREVIEW COM THUMBNAIL
    const comicThumbEl = document.getElementById('villainComicThumb');
    //const comicPreviewEl = document.getElementById('villainComicPreview');
    const comicEl = document.getElementById('villainFirstAppear');

    if (comicThumbEl && villain?.capaHQ) {
        comicThumbEl.src = villain.capaHQ;
        comicThumbEl.alt = villain.primeiraAparicao || 'Capa da HQ';
        comicThumbEl.style.display = 'block';
    }

    if (comicEl) {
        comicEl.textContent = villain?.primeiraAparicao || 'Informação não disponível';
    }
    
    // Preenche habilidades
    const abilitiesListEl = document.getElementById('villainAbilitiesList');
    if (abilitiesListEl && villain.habilidades) {
        abilitiesListEl.innerHTML = '';
        villain.habilidades.forEach(hab => {
            const div = document.createElement('div');
            div.className = 'ability-item';
            div.innerHTML = `<div class="ability-name">🧬 ${hab}</div>`;
            abilitiesListEl.appendChild(div);
        });
    }
    
    // Preenche ataques no jogo
    const attacksListEl = document.getElementById('villainAttacksList');
    if (attacksListEl && villain.ataquesNoJogo) {
        attacksListEl.innerHTML = '';
        villain.ataquesNoJogo.forEach(ataque => {
            const div = document.createElement('div');
            div.className = 'ability-item';
            div.innerHTML = `<div class="ability-description">${ataque}</div>`;
            attacksListEl.appendChild(div);
        });
    }
    
    // Preenche fraquezas
    const weaknessListEl = document.getElementById('villainWeaknessList');
    if (weaknessListEl && villain.fraquezas) {
        weaknessListEl.innerHTML = '';
        villain.fraquezas.forEach(fraqueza => {
            const li = document.createElement('li');
            li.textContent = fraqueza;
            weaknessListEl.appendChild(li);
        });
    }
    
    // Preenche curiosidades
    const curiositiesListEl = document.getElementById('villainCuriositiesList');
    if (curiositiesListEl && villain.curiosidades) {
        curiositiesListEl.innerHTML = '';
        villain.curiosidades.forEach(curiosidade => {
            const li = document.createElement('li');
            li.textContent = curiosidade;
            curiositiesListEl.appendChild(li);

});
}// Preenche observações táticas
const observationsEl = document.getElementById('villainObservations');
if (observationsEl) observationsEl.textContent = villain.observacoes || '-';modal.style.display = 'flex';
console.log('✅ Modal de vilão exibido');
}

// ⭐ FECHAR MODAL DE VILÃO
closeVillainModal() {
    const modal = document.getElementById('villainDetailModal');
    if (modal) {
        modal.style.display = 'none';
    }
}



} 

// ========================================
// SISTEMA DE CHEAT CODES - PAINEL DO VIGIA
// ========================================

class WatcherPanel {
    constructor(gameManager) {
        console.log('👁️ WatcherPanel.constructor() INICIADO');
        
        this.gameManager = gameManager;
        this.godModeActive = false;
        this.invincibleBaseActive = false;
        this.speedMultiplier = 1;
        
        this.setupWatcherListeners();
        this.setupRewardGenerator();
        this.startInfoUpdater();
        
        console.log('✅ WatcherPanel criado com SUCESSO');
    }
    
    setupWatcherListeners() {
        // Botões de cheat com data-cheat
        const cheatButtons = document.querySelectorAll('[data-cheat]');
        console.log('🔧 Botões de cheat encontrados:', cheatButtons.length);
        
        cheatButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cheat = e.currentTarget.dataset.cheat;
                console.log('🎮 Cheat ativado:', cheat);
                this.executeCheat(cheat);
            });
        });
    }
    
    executeCheat(cheatCode) {
        const gm = this.gameManager;
        
        switch(cheatCode) {
            // ========================================
            // 💰 CHEATS DE RECURSOS
            // ========================================
            case 'money1000':
                gm.dinheiro += 1000;
                this.showCheatFeedback('💵 +$1,000 adicionados!', 'success');
                break;
                
            case 'money10000':
                gm.dinheiro += 10000;
                this.showCheatFeedback('💵 +$10,000 adicionados!', 'success');
                break;
                
            case 'money100000':
                gm.dinheiro += 100000;
                this.showCheatFeedback('💵 +$100,000 adicionados!', 'success');
                break;
                
            case 'maxMoney':
                gm.dinheiro = 999999999;
                this.showCheatFeedback('💎 Dinheiro MÁXIMO ativado!', 'legendary');
                break;
                
            case 'healBase':
                gm.vida = gm.vidaMaxima || 100;
                this.showCheatFeedback('❤️ Base curada completamente!', 'success');
                break;
                
            case 'invincibleBase':
                this.invincibleBaseActive = !this.invincibleBaseActive;
                if (this.invincibleBaseActive) {
                    gm.vida = 999999;
                    gm.vidaMaxima = 999999;
                    this.showCheatFeedback('🛡️ BASE INVENCÍVEL ATIVADA!', 'legendary');
                } else {
                    gm.vida = 100;
                    gm.vidaMaxima = 100;
                    this.showCheatFeedback('🛡️ Base invencível desativada', 'info');
                }
                break;
            
            // ========================================
            // ⚡ CHEATS DE GAMEPLAY
            // ========================================
            case 'skipPhase':
                gm.fase = (gm.fase || 1) + 1;
                gm.enemies = []; // Limpa inimigos
                gm.waveEnemiesSpawned = 0;
                gm.waveInProgress = false;
                this.showCheatFeedback(`⏭️ Pulando para Fase ${gm.fase}!`, 'epic');
                break;
                
            case 'killAllEnemies':
                if (gm.enemies && gm.enemies.length > 0) {
                    const count = gm.enemies.length;
                    gm.enemies.forEach(enemy => {
                        if (enemy && enemy.vida) {
                            enemy.vida = 0;
                        }
                    });
                    this.showCheatFeedback(`💀 ${count} inimigos eliminados!`, 'epic');
                } else {
                    this.showCheatFeedback('ℹ️ Nenhum inimigo no campo', 'info');
                }
                break;
                
            case 'speedUp':
                this.speedMultiplier = 2;
                if (gm.gameLoop) {
                    // Aumenta velocidade do jogo
                    this.showCheatFeedback('🚀 Velocidade 2x ATIVADA!', 'epic');
                }
                break;
                
            case 'slowDown':
                this.speedMultiplier = 0.5;
                if (gm.gameLoop) {
                    this.showCheatFeedback('🐌 Velocidade 0.5x ativada', 'info');
                }
                break;
                
            case 'godMode':
                this.godModeActive = !this.godModeActive;
                
                if (this.godModeActive) {
                    // Ativa god mode em todos os champions
                    if (gm.champions && gm.champions.length > 0) {
                        gm.champions.forEach(champ => {
                            if (champ) {
                                champ.vida = 999999;
                                champ.vidaMaxima = 999999;
                                champ.dano = (champ.dano || 10) * 10;
                            }
                        });
                    }
                    this.showCheatFeedback('👑 GOD MODE ATIVADO!', 'legendary');
                } else {
                    // Desativa god mode
                    if (gm.champions && gm.champions.length > 0) {
                        gm.champions.forEach(champ => {
                            if (champ && Champion.championData[champ.tipo]) {
                                const data = Champion.championData[champ.tipo];
                                champ.vida = data.hp;
                                champ.vidaMaxima = data.hp;
                                champ.dano = data.dano;
                            }
                        });
                    }
                    this.showCheatFeedback('👑 God Mode desativado', 'info');
                }
                break;
                
            case 'resetGame':
                if (confirm('⚠️ Tem certeza que deseja RESETAR o jogo? Todo progresso será perdido!')) {
                    location.reload();
                }
                break;
            
            // ========================================
            // 🦸 CHEATS DE CHAMPIONS
            // ========================================
            case 'healAllChampions':
                if (gm.champions && gm.champions.length > 0) {
                    let healed = 0;
                    gm.champions.forEach(champ => {
                        if (champ && champ.vida < champ.vidaMaxima) {
                            champ.vida = champ.vidaMaxima;
                            healed++;
                        }
                    });
                    this.showCheatFeedback(`💚 ${healed} champions curados!`, 'success');
                } else {
                    this.showCheatFeedback('ℹ️ Nenhum champion no campo', 'info');
                }
                break;
                
            case 'maxLevelChampions':
                if (gm.champions && gm.champions.length > 0) {
                    gm.champions.forEach(champ => {
                        if (champ) {
                            // Aumenta stats drasticamente
                            champ.dano = (champ.dano || 10) * 5;
                            champ.vidaMaxima = (champ.vidaMaxima || 100) * 5;
                            champ.vida = champ.vidaMaxima;
                            champ.alcance = (champ.alcance || 150) * 1.5;
                        }
                    });
                    this.showCheatFeedback('⬆️ Todos os champions no NÍVEL MÁXIMO!', 'legendary');
                } else {
                    this.showCheatFeedback('ℹ️ Nenhum champion no campo', 'info');
                }
                break;
                
            case 'unlockAllAbilities':
                if (gm.champions && gm.champions.length > 0) {
                    gm.champions.forEach(champ => {
                        if (champ) {
                            // Reseta todos os cooldowns
                            champ.cooldownAtual = 0;
                            if (champ.habilidades) {
                                Object.keys(champ.habilidades).forEach(key => {
                                    if (champ.habilidades[key].cooldown) {
                                        champ.habilidades[key].cooldown = 0;
                                    }
                                });
                            }
                        }
                    });
                    this.showCheatFeedback('🔓 Todas as habilidades DESBLOQUEADAS!', 'epic');
                } else {
                    this.showCheatFeedback('ℹ️ Nenhum champion no campo', 'info');
                }
                break;
                
            case 'removeAllChampions':
                if (confirm('⚠️ Remover todos os champions do campo?')) {
                    if (gm.champions) {
                        const count = gm.champions.length;
                        gm.champions = [];
                        this.showCheatFeedback(`❌ ${count} champions removidos`, 'warning');
                    }
                }
                break;
            
            default:
                console.warn('⚠️ Cheat code desconhecido:', cheatCode);
                this.showCheatFeedback('⚠️ Cheat desconhecido!', 'error');
        }
        
        // Atualiza UI
        if (gm.updateUI) {
            gm.updateUI();
        }
    }
    
    // ========================================
    // 🎁 GERADOR DE RECOMPENSAS
    // ========================================
setupRewardGenerator() {
    console.log('🎁 Configurando gerador de recompensas...');
    
    const typeSelect = document.getElementById('devRewardType');
    const raritySelect = document.getElementById('devRewardRarity');
    const specificSelect = document.getElementById('devRewardSpecific');
    const spawnBtn = document.getElementById('spawnRewardBtn');
    
    if (!typeSelect || !raritySelect || !specificSelect || !spawnBtn) {
        console.warn('⚠️ Elementos do gerador de recompensas não encontrados');
        return;
    }
    
    // ✅ ATUALIZA OPÇÕES QUANDO TIPO OU RARIDADE MUDAM
    const updateSpecificOptions = () => {
        const type = typeSelect.value;
        const rarity = raritySelect.value;
        
        specificSelect.innerHTML = '<option value="random">🎲 Aleatório</option>';
        
        let rewardList = [];
        
        if (type === 'tool') {
            // ✅ BUSCA FERRAMENTAS REAIS DO COLLECTORSYSTEM
            rewardList = this.gameManager.collectorSystem.getTools(rarity);
        } else {
            // ✅ BUSCA ITENS REAIS DO COLLECTORSYSTEM
            rewardList = this.gameManager.collectorSystem.getItems(rarity);
        }
        
        // ✅ POPULA DROPDOWN COM NOMES REAIS
        rewardList.forEach(reward => {
            const option = document.createElement('option');
            option.value = reward.name;
            option.textContent = `${reward.icon} ${reward.name}`;
            specificSelect.appendChild(option);
        });
    };
    
    typeSelect.addEventListener('change', updateSpecificOptions);
    raritySelect.addEventListener('change', updateSpecificOptions);
    
    // ✅ BOTÃO DE SPAWN
    spawnBtn.addEventListener('click', () => {
        const type = typeSelect.value;
        const rarity = raritySelect.value;
        const specificName = specificSelect.value;
        
        this.spawnReward(type, rarity, specificName);
    });
    
    updateSpecificOptions();
}
    
spawnReward(type, rarity, specificName) {
    console.log('🎁 Gerando recompensa:', { type, rarity, specificName });
    
    const rarityEmojis = {
        basic: '⚪',
        rare: '🔵',
        epic: '🟣',
        legendary: '🟠'
    };
    
    const emoji = rarityEmojis[rarity] || '⚪';
    
    // ✅ BUSCA A RECOMPENSA REAL
    let rewardList = type === 'tool' 
        ? this.gameManager.collectorSystem.getTools(rarity)
        : this.gameManager.collectorSystem.getItems(rarity);
    
    let reward;
    
    if (specificName === 'random') {
        // Aleatório
        reward = rewardList[Math.floor(Math.random() * rewardList.length)];
    } else {
        // Específico
        reward = rewardList.find(r => r.name === specificName);
    }
    
    if (!reward) {
        this.showCheatFeedback('❌ Recompensa não encontrada!', 'error');
        return;
    }
    
    // ✅ ADICIONA AO INVENTÁRIO REAL
    reward = { 
        ...JSON.parse(JSON.stringify(reward)), 
        type, 
        rarity,
        id: Date.now() + Math.random()
    };
    
    if (type === 'item') {
        const exists = this.gameManager.collectorSystem.inventory.items.some(i => i.id === reward.id);
        if (!exists) {
            this.gameManager.collectorSystem.inventory.items.push(reward);
            this.gameManager.collectorSystem.applyItemEffect(reward);
        }
    } else {
        const exists = this.gameManager.collectorSystem.inventory.tools.some(t => t.id === reward.id);
        if (!exists) {
            this.gameManager.collectorSystem.inventory.tools.push(reward);
        }
    }
    
    this.gameManager.collectorSystem.saveInventory();
    
    this.showCheatFeedback(
        `${emoji} ${reward.icon} "${reward.name}" adicionado ao inventário!`,
        rarity
    );
    
    console.log('✅ Recompensa adicionada:', reward);
}
    
    // ========================================
    // 📊 ATUALIZAÇÃO DE INFORMAÇÕES
    // ========================================
    startInfoUpdater() {
        setInterval(() => {
            this.updateWatcherInfo();
        }, 1000);
    }
    
    updateWatcherInfo() {
        const gm = this.gameManager;
        
        // Fase
        const phaseEl = document.getElementById('watcherPhase');
        if (phaseEl) phaseEl.textContent = gm.fase || 1;
        
        // Champions
        const championsEl = document.getElementById('watcherChampions');
        if (championsEl) {
            const count = gm.champions ? gm.champions.length : 0;
            championsEl.textContent = count;
        }
        
        // Inimigos
        const enemiesEl = document.getElementById('watcherEnemies');
        if (enemiesEl) {
            const count = gm.enemies ? gm.enemies.length : 0;
            enemiesEl.textContent = count;
        }
        
        // FPS (se disponível)
        const fpsEl = document.getElementById('watcherFPS');
        if (fpsEl && gm.fps) {
            fpsEl.textContent = Math.round(gm.fps);
        }
    }
    
    // ========================================
    // 💬 FEEDBACK VISUAL
    // ========================================
    showCheatFeedback(message, type = 'info') {
        console.log('💬 Feedback:', message, type);
        
        // Cria notificação
        const notification = document.createElement('div');
        notification.className = `watcher-notification watcher-${type}`;
        notification.textContent = message;
        
        // Estilos inline
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 25px',
            borderRadius: '10px',
            fontWeight: 'bold',
            fontSize: '14px',
            zIndex: '99999',
            animation: 'slideInRight 0.3s ease-out',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        });
        
        // Cores por tipo
        const colors = {
            success: { bg: '#10b981', text: '#fff' },
            info: { bg: '#3b82f6', text: '#fff' },
            warning: { bg: '#f59e0b', text: '#fff' },
            error: { bg: '#ef4444', text: '#fff' },
            epic: { bg: '#8b5cf6', text: '#fff' },
            legendary: { bg: '#ff6b00', text: '#fff' }
        };
        
        const color = colors[type] || colors.info;
        notification.style.background = color.bg;
        notification.style.color = color.text;
        
        document.body.appendChild(notification);
        
        // Remove após 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        // Também mostra no console do jogo se disponível
        if (this.gameManager.showUI) {
            this.gameManager.showUI(message, type);
        }
    }
}

class GameManager {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.enemyProjectiles = []; // NOVO: Array de projéteis inimigos
       // console.log('✅ GameManager inicializado com enemyProjectiles:', this.enemyProjectiles);
        //this.splitProjectiles = [];

        // ✅ ADICIONE ESTA LINHA AQUI (inicialização temporária)
        this.pauseMenu = null;
        this.ui = {};
        
        this.setCanvasSize();
        window.addEventListener('resize', () => this.setCanvasSize());

        this.champions = [];
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        this.isInitialized = false;
        this.dummyTowers = [];
        this.lokiVariantDrones = [];
        this.drones = [];
         
        // 🌀 Portais
        this.portals = [];
        this.PORTAL_SPAWN_CHANCE = 0.0002; // Chance por frame
        this.PORTAL_DURATION = 5000;


         // 🔮 NOVO: Arrays do Loki
        this.runeStones = [];
        this.lokiClones = [];
        
        // CORREÇÃO: Path definido corretamente
       this.path = [
        ];

        this.money = 10000000;
        this.baseHealth = 100;
        this.currentPhase = 0;
        this.enemiesDefeatedThisPhase = 0;
        this.enemiesToNextPhase = 0;
        this.waveInProgress = false;
        this.lastSpawnTime = 0;
        this.spawnInterval = 1000;

        this.selectedChampion = null;
        this.draggedChampionType = null;

        // 💀 Sistema de Executores (DEVE VIR ANTES DO init)
        this.executorSpawnSystem = null; // Será inicializado no init()
        this.leaderLasers = [];
        this.poisonGases = [];

        this.isPaused = false;
        this.isGameOver = false;
        this.lastFrameTime = performance.now();

        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.destroyedTowers = [];
        this.resurrectionsUsedThisPhase = 0;

        // ⭐ NOVO: Sistema de seleção de área para Arrow Storm
        this.isSelectingArrowStormLocation = false;
        this.arrowStormOwner = null;
        this.arrowStormPreviewX = 0;
        this.arrowStormPreviewY = 0;

        // ✅ NOVO: Sistema de voo da Karolina Dean
        this.isSelectingKarolinaFlight = false;
        this.karolinaFlightOwner = null;

        // ☀️ Sistema de Supernova da Karolina
        this.isSelectingKarolinaSupernova = false;
        this.karolinaSupernovaOwner = null;
        this.supernovaBeams = [];

         // ⭐ NOVO: Kate Bishop arrays
        this.katebishops = [];
        this.gravityFields = [];
        this.cordGroups = [];
        this.photonBursts = []; // ⭐ ADICIONAR ESTA LINHA

         // ⭐ NOVO: Left Wing Units
         this.leftWingUnits = [];
        
        // Exporta classes
        this.KateBishopArrow = KateBishopArrow;
        this.KarolinaPrismBeam = KarolinaPrismBeam;

        this.PhoenixFlameEffect = PhoenixFlameEffect;
        this.PhoenixSparkEffect = PhoenixSparkEffect;
        this.PhoenixExplosionEffect = PhoenixExplosionEffect;

         
        // 💰 Baús de Asgard
        this.chests = [];
        this.lastChestSpawn = Date.now(); // ✅ IMPORTANTE: Inicializa com o tempo atual
        this.CHEST_SPAWN_INTERVAL = 15000;
        this.CHEST_COLLECT_RADIUS = 50;
        this.CHEST_GOLD_AMOUNT = 50;
        console.log('✅ Sistema de baús inicializado'); // Debug

        this.speechBubbles = [];


        // Pré-carregamento de imagens
        this.images = {
            doombot: this.createImage('https://static.marvelsnap.pro/art/DoomBot2099.webp'),
            drone: this.createImage('https://static.marvelsnap.pro/art/Drone.webp'),
            mjolnir: this.createImage('https://static.marvelsnap.pro/art/Mjolnir.webp'),
            capShield: this.createImage('https://www.geekworldcascavel.com.br/image/cachewebp/catalog/produtos/escudos/captainamericashield-1000x1000.webp'),
            usagentShield: this.createImage('https://yoshstudios.com/wp-content/uploads/2025/05/Render_4-1.png'),
            // CORREÇÃO: URL alternativa ou placeholder para wandaIllusion
            wandaIllusion: this.createImage('./assets_img/pngwing.com.png')
        };

        // CORREÇÃO: Dados dos inimigos com velocidade definida
        this.enemyData = {
        'doombot': { 
            hp: 150, 
            speed: 30, 
            radius: 20, 
            reward: 10,
            imagePath: './assets_img/Doom_Bot_2099.webp',
            baseDamage: 5,           // ⭐ Dano maior
            attackRange: 250,        // ⭐ Alcance longo
            attackSpeed: 1500        // ⭐ Ataca mais rápido
        },
        'drone': { 
            hp: 100, 
            speed: 50, 
            radius: 15, 
            reward: 12,
            imagePath: 'https://static.marvelsnap.pro/art/Drone.webp',
            baseDamage: 5,
            attackRange: 180,        // ⭐ Alcance médio
            attackSpeed: 2000
        },
        'normal': { 
            hp: 120, 
            speed: 25, 
            radius: 20, 
            reward: 8, 
            imagePath: './assets_img/MadThinker.jpg',
            baseDamage: 3,
            attackRange: 150,        // ⭐ Alcance curto
            attackSpeed: 2500
        },
        'fast': { 
            hp: 80, 
            speed: 40, 
            radius: 15, 
            reward: 10, 
            imagePath: 'https://placehold.co/30x30/FF00FF/FFFFFF?text=E2',
            baseDamage: 4,
            attackRange: 160,
            attackSpeed: 1800        // ⭐ Ataca rápido
        },
        'tank': { 
            hp: 200, 
            speed: 30, 
            radius: 20, 
            reward: 15, 
            imagePath: 'https://placehold.co/40x40/8B0000/FFFFFF?text=T',
            baseDamage: 10,          // ⭐ Muito dano
            attackRange: 200,
            attackSpeed: 2500        // ⭐ Ataca devagar
        }
    };

        // Dados de cada fase
        this.phaseData = {
            1: { numEnemies: 10, enemyTypes: ['normal', 'fast'] },
            2: { numEnemies: 12, enemyTypes: ['normal', 'fast', 'doombot'] },
            3: { numEnemies: 15, enemyTypes: ['normal', 'fast', 'doombot', 'drone'] },
            4: { numEnemies: 18, enemyTypes: ['normal', 'fast', 'tank', 'doombot', 'drone'] },
            5: { numEnemies: 20, enemyTypes: ['fast', 'tank', 'doombot', 'drone'] }
        };

        // Variáveis de spawn
        this.enemiesSpawned = 0;
        this.enemiesToSpawn = 0;
        
        // Exporta classes para as subclasses usarem
        this.Champion = Champion;
        this.Enemy = Enemy;
        this.Projectile = Projectile;
        this.Effect = Effect;
        this.TextPopEffect = TextPopEffect;
        
        // CORREÇÃO: Exporta TODAS as classes de projéteis
        this.LaserProjectile = LaserProjectile;
        this.MjolnirProjectile = MjolnirProjectile;
        this.HawkeyeArrow = HawkeyeArrow;
        this.CapShieldProjectile = CapShieldProjectile;
        this.LokiPoisonDagger = LokiPoisonDagger;
        this.USAgentBullet = USAgentBullet;
        this.WandaIllusionPulse = WandaIllusionPulse;
        this.DiamondShardProjectile = DiamondShardProjectile;
        this.DroneLaserProjectile = DroneLaserProjectile;
        this.USAgentChargedShield = USAgentChargedShield;
        this.SplitProjectile = SplitProjectile;
        this.NickFuryBullet = NickFuryBullet;      // ✅ NOVO
        this.QuinjetBullet = QuinjetBullet;        // ✅ NOVO
        this.QuinjetMissile = QuinjetMissile;        // ✅ NOVO
        
        // CORREÇÃO: Exporta TODAS as classes de efeitos
        this.LaserEffect = LaserEffect;
        this.BamfEffect = BamfEffect;
        this.SwordCutEffect = SwordCutEffect;
        this.StunEffect = StunEffect;
        this.EmmaWaveEffect = EmmaWaveEffect;
        this.PsiEffect = PsiEffect;
        this.LevelUpEffect = LevelUpEffect;
        this.AuraFireParticleEffect = AuraFireParticleEffect;
        this.SlowEffect = SlowEffect;
        this.USAgentShockwaveEffect = USAgentShockwaveEffect;
        this.USAgentCombatCallEffect = USAgentCombatCallEffect;
        this.DefensiveStanceEffect = DefensiveStanceEffect;
        this.ConfuseEffect = ConfuseEffect;
        this.HexZoneVisualEffect = HexZoneVisualEffect;
        this.RuneVisualEffect = RuneVisualEffect;
        this.ReviveEffect = ReviveEffect;
        this.NanobotCloudEffect = NanobotCloudEffect;
        this.NanobotParticleEffect = NanobotParticleEffect;
        this.SatelliteStrikeEffect = SatelliteStrikeEffect;
        this.UltronCoreEffect = UltronCoreEffect;
        this.CaptainMarvelMissileExplosionEffect = CaptainMarvelMissileExplosionEffect;
        this.ThunderStrikeEffect = ThunderStrikeEffect;
        this.RedHulkExplosionEffect = RedHulkExplosionEffect;
        this.ChainLightningEffect = ChainLightningEffect;
        this.UltronReconstructionEffect = UltronReconstructionEffect;
        this.EmmaFormChangeEffect = EmmaFormChangeEffect;
        this.EmmaMentalBlastEffect = EmmaMentalBlastEffect;
        this.ArrowStormEffect = ArrowStormEffect;   
        this.EmmaDiamondImpactEffect = EmmaDiamondImpactEffect;
        this.EmmaPsychicPulseEffect = EmmaPsychicPulseEffect;
        this.PsychicChainEffect = PsychicChainEffect;
        this.AsgardStoneEffect = AsgardStoneEffect;
        this.HealingBeamEffect = HealingBeamEffect;
        this.SpaceStonePullChainEffect = SpaceStonePullChainEffect;
        this.TelekineticBarrageEffect = TelekineticBarrageEffect;
        this.PhoenixRebirthExplosionEffect = PhoenixRebirthExplosionEffect;
        this.PsychicWaveEffect = PsychicWaveEffect;
        this.VortexImpactEffect = VortexImpactEffect;
        this.TargetLaserEffect = TargetLaserEffect;
        this.OrbitalMissileEffect = OrbitalMissileEffect;

/*         this.ChaosDrainBeamTeamUpEffect = ChaosDrainBeamTeamUpEffect;
 */        // Team Up

        this.psychicAttractionCones = [];
        this.RealityErasureProjectile = [];

        this.ChaosControlBeam = [];

        // 🎵 Sistema de Música
        this.musicPlayer = null;

        this.collectorSystem = null; // Será inicializado no init
        this.globalBuffs = {}; // Armazena buffs globais dos itens

        // ✅ Inicializa sistema de reações
        this.reactionSystem = new CharacterReactionSystem(this);
        
        // ✅ Configura listeners de hover e seleção
        this.setupReactionListeners();

         // ✅ Inicializa SoundManager
        this.soundManager = new SoundManager();
        console.log('✅ SoundManager inicializado');

    }
    

    createImage(src) {
        const img = new Image();
        img.src = src;
        img.onerror = () => {
            console.warn(`[GameManager] Erro ao carregar imagem: ${src}`);
            img.isFallback = true;
        };
        return img;
    }

    initializeUIElements() {
        this.ui.money = document.getElementById('dinheiro');
        this.ui.baseHealth = document.getElementById('vida');
        this.ui.phase = document.getElementById('fase');
        this.ui.pausedMsg = document.getElementById('pausadoMsg');
        this.ui.waveProgress = document.getElementById('waveProgress');
        this.ui.championMenu = document.getElementById('menu');

        const requiredIds = ['gameCanvas', 'menu', 'dinheiro', 'vida', 'fase', 'pausadoMsg', 'msgBox', 'msgText', 'waveProgress'];
        const missingElements = requiredIds.filter(id => !document.getElementById(id));

        if (missingElements.length > 0) {
            console.error(`[GameManager] Elementos HTML faltando: [${missingElements.join(', ')}]`);
            this.isPaused = true;
        }
    }

    createSpeechBubble(x, y, text, duration = 3000) {
    const bubble = new SpeechBubble(x, y, text, duration);
    this.speechBubbles.push(bubble);
}

createScreenFlash(color, intensity, duration) {
    const flash = {
        color: color,
        alpha: intensity,
        startTime: Date.now(),
        duration: duration,
        
        update() {
            const elapsed = Date.now() - this.startTime;
            const progress = elapsed / this.duration;
            this.alpha = intensity * (1 - progress);
            return progress < 1;
        },
        
        draw(ctx, canvas) {
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }
    };
    
    this.screenFlashes = this.screenFlashes || [];
    this.screenFlashes.push(flash);
}

setupEventListeners() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    
   // 🎯 Rastreia posição do mouse para Gambit
    this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        this.arrowStormPreviewX = mouseX;
        this.arrowStormPreviewY = mouseY;
        
        // Atualiza mira do Gambit
        this.champions.forEach(champion => {
            if (champion.type === 'gambit') {
                champion.targetX = mouseX;
                champion.targetY = mouseY;
            }
        });
    });
    
    this.canvas.ondragover = (e) => e.preventDefault();
    this.canvas.ondrop = (e) => this.handleCanvasDrop(e);

    
    if (this.ui.championMenu) {
        this.ui.championMenu.addEventListener('dragstart', (e) => this.handleMenuDragStart(e));
    }


        // Hover nos ícones dos champions
        document.querySelectorAll('.torreIcone').forEach(icon => {
            const championType = icon.dataset.type;
            
            icon.addEventListener('mouseenter', () => {
                this.reactionSystem.onMouseEnter(championType, icon);
            });
                    icon.addEventListener('mouseleave', () => {
            this.reactionSystem.onMouseLeave(championType);
        });
    });

    // Dentro de setupEventListeners(), adicione:

// Toggle de animação do baú
const chestAnimToggle = document.getElementById('chestAnimationToggle');
if (chestAnimToggle) {
    // Carrega configuração salva
    const savedSetting = localStorage.getItem('chestAnimation');
    if (savedSetting !== null) {
        chestAnimToggle.checked = savedSetting === 'true';
    }
    
    chestAnimToggle.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        localStorage.setItem('chestAnimation', enabled);
        
        // Atualiza no gameManager se disponível
        if (this.gameManager) {
            this.gameManager.chestAnimationEnabled = enabled;
        }
        
        console.log('📦 Animação do baú:', enabled ? 'ATIVADA' : 'DESATIVADA');
        
        // Feedback visual
        if (this.gameManager && this.gameManager.showUI) {
            this.gameManager.showUI(
                enabled ? '📦 Animação do baú ativada' : '📦 Animação do baú desativada',
                'info'
            );
        }
    });
}

// 💰 Mouse move para detectar baús
    this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        let nearChest = false;
        this.chests.forEach(chest => {
            if (chest.checkCollection(mouseX, mouseY)) {
                nearChest = true;
            }
        });
        
        this.canvas.style.cursor = nearChest ? 'pointer' : 'default';
        
// Rastreia posição do mouse para preview (Arrow Storm + Telekinetic Barrage)

        this.arrowStormPreviewX = e.clientX - rect.left;
        this.arrowStormPreviewY = e.clientY - rect.top;
        // ⭐ NOVO: Também serve para Telekinetic Barrage
        this.telekineticBarragePreviewX = this.arrowStormPreviewX;
        this.telekineticBarragePreviewY = this.arrowStormPreviewY;
    });
    
    this.canvas.ondragover = (e) => e.preventDefault();
    this.canvas.ondrop = (e) => this.handleCanvasDrop(e);
    
    if (this.ui.championMenu) {
        this.ui.championMenu.addEventListener('dragstart', (e) => this.handleMenuDragStart(e));
    }

    
    // 💰 Click para coletar
    const originalClickHandler = this.handleCanvasClick.bind(this);
    this.handleCanvasClick = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Verifica baús primeiro
        let chestCollected = false;
        this.chests.forEach(chest => {
            if (chest.checkCollection(x, y)) {
                chest.collected = true;
                this.money += this.CHEST_GOLD_AMOUNT;
                
                // Efeito visual
                for (let i = 0; i < 10; i++) {
                    this.effects.push(new this.AuraFireParticleEffect(
                        chest.x + (Math.random() - 0.5) * 30,
                        chest.y + (Math.random() - 0.5) * 30,
                        15,
                        'gold',
                        500
                    ));
                }
                
                this.showUI(`+$${this.CHEST_GOLD_AMOUNT} Baú de Asgard!`, 'success');
                chestCollected = true;
            }
        });
        
        if (!chestCollected) {
            originalClickHandler(e);
        }
    };
}



// ========================================
// CORREÇÃO: DROP NO CANVAS
// ========================================


setupCanvasDragDrop() {
    const canvas = document.getElementById('gameCanvas');
    
    if (!canvas) {
        console.error('❌ Canvas não encontrado!');
        return;
    }
    
    console.log('🎯 Configurando drag & drop no canvas...');
    
    // ✅ DRAGOVER - CRÍTICO para permitir drop
    canvas.addEventListener('dragover', (e) => {
        if (window.__draggedTool) {
            e.preventDefault(); // Necessário para permitir o drop
            e.dataTransfer.dropEffect = 'copy';
        }
    });
    
    // ✅ DRAGENTER - Feedback visual
    canvas.addEventListener('dragenter', (e) => {
        if (window.__draggedTool) {
            e.preventDefault();
            canvas.style.outline = '3px solid lime';
        }
    });
    
    // ✅ DRAGLEAVE - Remove feedback
    canvas.addEventListener('dragleave', (e) => {
        if (window.__draggedTool) {
            canvas.style.outline = 'none';
        }
    });
    
    // ✅ DROP - TENTA EQUIPAR A FERRAMENTA
    canvas.addEventListener('drop', (e) => {
        canvas.style.outline = 'none';
        
        const toolIndex = window.__draggedToolIndex;
        const tool = window.__draggedTool;
        
        // Se não há ferramenta, ignora
        if (toolIndex === undefined || !tool) {
            return;
        }
        
        // PROCESSA O DROP
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🎯 ===== DROP DE FERRAMENTA =====');
        
        // Calcula posição no canvas
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        // 🎯 BUSCA CHAMPION MAIS PRÓXIMO
        let nearestChampion = null;
        let minDist = 120; // Raio de detecção
        
        this.champions.forEach(champion => {
            const cx = champion.getCenterX();
            const cy = champion.getCenterY();
            const dist = Math.hypot(x - cx, y - cy);
            
            if (dist < minDist) {
                minDist = dist;
                nearestChampion = champion;
            }
        });
        
        if (nearestChampion) {
            // ✅ TENTA EQUIPAR
            const success = this.collectorSystem.attachToolToChampion(tool, nearestChampion);
            
            if (success) {
                // SUCESSO!
                
                // 1. Remove do inventário
                const idx = this.collectorSystem.inventory.tools.findIndex(t => t.id === tool.id);
                if (idx !== -1) {
                    this.collectorSystem.inventory.tools.splice(idx, 1);
                    this.collectorSystem.saveInventory();
                }
                
                // 2. Atualiza UI do inventário (sem reabrir)
                this.collectorSystem.populateInventory();
                
                // 3. 🛑 LIMPEZA CRÍTICA: Apaga as variáveis globais.
                // Isso sinaliza para o evento 'dragend' no CollectorSystem que o drop funcionou,
                // então ele NÃO vai reabrir o inventário.
                delete window.__draggedToolIndex;
                delete window.__draggedTool;
                
                console.log('✅ SUCESSO: Ferramenta equipada. Variáveis limpas. Inventário ficará fechado.');
            } else {
                // FALHA: Champion já tinha ferramenta
                console.log('❌ FALHA: Champion já equipado. Variáveis mantidas para reabrir inventário.');
                // Não deletamos as variáveis globais aqui.
                // O 'dragend' vai ver que elas ainda existem e vai reabrir o inventário.
            }
        } else {
            // FALHA: Soltou no nada
            console.log('❌ FALHA: Nenhum champion próximo. Variáveis mantidas para reabrir inventário.');
            this.showUI('⚠️ Solte em cima de um Champion!', 'warning');
            
            this.effects.push(new this.TextPopEffect(x, y, '❌ LONGE', 'red', 1500));
            
            // Não deletamos as variáveis globais aqui.
            // O 'dragend' vai ver que elas ainda existem e vai reabrir o inventário.
        }
    });
}

sellChampion(champion) {
    if (!champion) return;
    
    const championData = Champion.championData[champion.type];
    if (!championData) return;
    
    // Recupera 70% do valor investido
    const refundAmount = Math.floor(championData.custo * 0.7);
    this.money += refundAmount;

    // ✅ NOVO: Mostra reação ao ser vendido
    this.reactionSystem.onSell(champion);
    
    // Remove o champion
    const index = this.champions.findIndex(c => c.id === champion.id);
    if (index !== -1) {
        this.champions.splice(index, 1);
    }
    
   // Aguarda um pouco para reação ser vista
    setTimeout(() => {
        this.money += refundAmount;
        
        const index = this.champions.findIndex(c => c.id === champion.id);
        if (index !== -1) {
            this.champions.splice(index, 1);
        }
        
        // Efeito visual
        this.effects.push(new this.BamfEffect(
            champion.getCenterX(),
            champion.getCenterY(),
            'gold',
            500
        ));
        
        this.showUI(`${champion.type} vendido por $${refundAmount}!`, 'success');
        this.selectedChampion = null;
        this.updateUI();
    }, 1500); // Aguarda 1.5s para mostrar reação

    
    this.effects.push(new this.TextPopEffect(
        champion.getCenterX(),
        champion.getCenterY() - 30,
        `+$${refundAmount}`,
        'gold',
        1000
    ));
    
    // Partículas douradas
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i;
        this.effects.push(new this.AuraFireParticleEffect(
            champion.getCenterX() + Math.cos(angle) * 20,
            champion.getCenterY() + Math.sin(angle) * 20,
            15,
            'gold',
            600
        ));
    }
    
    this.showUI(`${champion.type} vendido por $${refundAmount}!`, 'success');
    this.selectedChampion = null;
    this.updateUI();
}

/**
 * ✅ Seleciona um champion e mostra suas reações
 */
selectChampion(champion) {
    // Se desmarcar champion
    if (this.selectedChampion === champion) {
        this.selectedChampion = null;
        this.reactionSystem.onDeselect();
        return;
    }
    
    // Seleciona novo champion
    const previousChampion = this.selectedChampion;
    this.selectedChampion = champion;
    
    // ✅ Mostra reação ao selecionar
    this.reactionSystem.onSelect(champion);
    
    // ✅ Se havia outro champion selecionado, mostra reação de desmarcar
    if (previousChampion) {
        this.reactionSystem.onDeselect(previousChampion);
    }
}


    setCanvasSize() {
        const container = document.getElementById('canvasContainer');
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        } else {
            this.canvas.width = window.innerWidth * 0.7;
            this.canvas.height = window.innerHeight * 0.8;
        }
    }

    getCenterX(obj) {
        return obj.x + (obj.width || 40) / 2;
    }

    getCenterY(obj) {
        return obj.y + (obj.height || 40) / 2;
    }

    populateChampionMenu() {
        if (!this.ui.championMenu) {
            console.error('[GameManager] Não foi possível popular o menu');
            return;
        }

        this.ui.championMenu.innerHTML = '';
        for (const [type, data] of Object.entries(Champion.championData)) {
            const img = document.createElement('img');
            img.src = data.icon;
            img.className = 'torreIcone';
            img.draggable = true;
            img.title = `Campeão: ${type}\nCusto: $${data.custo}\nPoder: ${data.poder}`;
            img.dataset.type = type;
            img.addEventListener('dragstart', (e) => {
                this.draggedChampionType = type;
                document.querySelectorAll('.torreIcone').forEach(icon => icon.classList.remove('selected'));
                img.classList.add('selected');
            });
            this.ui.championMenu.appendChild(img);
        }
    }
    
    // ✅ ADICIONE ESTE MÉTODO COMPLETO AQUI:

/**
 * 🎭 Configura listeners para reações de menu
 */
setupReactionListeners() {
    // Aguarda um momento para o menu estar renderizado
    setTimeout(() => {
        const icons = document.querySelectorAll('.torreIcone');
        
        if (icons.length === 0) {
            console.warn('⚠️ Ícones do menu ainda não foram criados');
            return;
        }
        
        icons.forEach(icon => {
            const championType = icon.dataset.type;
            
            if (!championType) {
                console.warn('⚠️ Ícone sem type:', icon);
                return;
            }
            
            // Hover no ícone
            icon.addEventListener('mouseenter', () => {
                if (this.reactionSystem) {
                    this.reactionSystem.onMouseEnter(championType, icon);
                }
            });
            
            // Mouse sai do ícone
            icon.addEventListener('mouseleave', () => {
                if (this.reactionSystem) {
                    this.reactionSystem.onMouseLeave(championType);
                }
            });
        });
        
        console.log('✅ Listeners de reação configurados para', icons.length, 'champions');
    }, 500); // Aguarda 500ms para o menu estar pronto
}

   updateUI() {
    if (this.ui.money) this.ui.money.textContent = this.money.toFixed(0);
    if (this.ui.baseHealth) this.ui.baseHealth.textContent = this.baseHealth.toFixed(0);
    if (this.ui.phase) this.ui.phase.textContent = this.currentPhase;

    if (this.ui.waveProgress && this.enemiesToNextPhase > 0) {
        const progress = Math.min((this.enemiesDefeatedThisPhase / this.enemiesToNextPhase) * 100, 100);
        this.ui.waveProgress.style.width = progress + '%';
    }
    
    // ⭐ NOVO: Atualiza info de champions vivos com escudo/regen
    const shieldChampions = this.champions.filter(c => c.survivalType === 'shield' && c.hp > 0);
    const regenChampions = this.champions.filter(c => c.survivalType === 'regen' && c.hp > 0);
    
    const shieldInfo = document.getElementById('shieldChampions');
    const regenInfo = document.getElementById('regenChampions');
    
    if (shieldInfo) {
        shieldInfo.textContent = shieldChampions.length > 0 
            ? shieldChampions.map(c => c.type).join(', ') 
            : 'Nenhum';
    }
    
    if (regenInfo) {
        regenInfo.textContent = regenChampions.length > 0 
            ? regenChampions.map(c => c.type).join(', ') 
            : 'Nenhum';
    }
}

// NOVO: Método para atualizar projéteis inimigos

// Em main.js - SUBSTITUA COMPLETAMENTE o método updateEnemyProjectiles:

updateEnemyProjectiles(deltaTime) {
    if (!this.enemyProjectiles) {
        this.enemyProjectiles = [];
        return;
    }
    
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
        const proj = this.enemyProjectiles[i];
        
        if (Date.now() - proj.spawnTime > proj.lifespan) {
            this.enemyProjectiles.splice(i, 1);
             continue;
        }
        
        let target = null;
        
        if (proj.targetType === 'rune') {
            if (this.runeStones) {
                target = this.runeStones.find(r => r.id === proj.target.id);
            }
            
            if (!target) {
                // Runa destruída, busca campeão
                let nearestChampion = null;
                let minDist = Infinity;
                
                for (const champion of this.champions) {
                    if (!champion || champion.hp === undefined || champion.hp <= 0) continue;
                    const dist = Math.hypot(proj.x - champion.getCenterX(), proj.y - champion.getCenterY());
                    if (dist < minDist) {
                        minDist = dist;
                        nearestChampion = champion;
                    }
                }
                
                if (nearestChampion) {
                    target = nearestChampion;
                    proj.targetType = 'champion';
                    proj.target = target;
                } else {
                    this.enemyProjectiles.splice(i, 1);
                    continue;
                }
            }
        } else {
            if (proj.target && proj.target.hp > 0) {
                target = proj.target;
            } else {
                let nearestChampion = null;
                let minDist = Infinity;
                
                for (const champion of this.champions) {
                    if (!champion || champion.hp === undefined || champion.hp <= 0) continue;
                    const dist = Math.hypot(proj.x - champion.getCenterX(), proj.y - champion.getCenterY());
                    if (dist < minDist) {
                        minDist = dist;
                        nearestChampion = champion;
                    }
                }
                
                if (!nearestChampion) {
                    this.enemyProjectiles.splice(i, 1);
                    continue;
                }
                
                target = nearestChampion;
                proj.target = target;
            }
        }
        
        if (proj.targetType === 'rune') {
            proj.targetX = target.x;
            proj.targetY = target.y;
        } else {
            proj.targetX = target.getCenterX();
            proj.targetY = target.getCenterY();
        }
        
        const angle = Math.atan2(proj.targetY - proj.y, proj.targetX - proj.x);
        const moveAmount = proj.speed * (deltaTime / 1000);
        proj.x += Math.cos(angle) * moveAmount;
        proj.y += Math.sin(angle) * moveAmount;
        
        const distToTarget = Math.hypot(proj.x - proj.targetX, proj.y - proj.targetY);
        
        if (distToTarget < 25) {
            if (proj.targetType === 'rune') {
                target.hp -= proj.damage;
                this.effects.push(new this.TextPopEffect(target.x, target.y - 20, `${proj.damage.toFixed(0)}`, 'red', 500));
                if (target.hp <= 0) {
                    this.showUI('Pedra Rúnica destruída!', 'warning');
                }
            } else {
                if (target.type === 'noturno' && Math.random() < 0.25) {
                    this.effects.push(new this.TextPopEffect(target.getCenterX(), target.getCenterY() - 20, 'DESVIOU!', 'cyan', 800));
                    this.effects.push(new this.BamfEffect(target.getCenterX(), target.getCenterY(), 'blue', 300));
                    this.enemyProjectiles.splice(i, 1);
                    continue;
                }
                
                if (target.runeProtection && Date.now() < target.runeProtection.endTime) {
                    const healAmount = proj.damage;
                    target.hp = Math.min(target.maxHp, target.hp + healAmount);
                    this.effects.push(new this.TextPopEffect(target.getCenterX(), target.getCenterY() - 20, `+${healAmount.toFixed(0)} 🛡️`, 'lime', 800));
                    this.enemyProjectiles.splice(i, 1);
                    continue;
                }
                
                const damageAmount = proj.damage || 5;
                if (target.takeDamage && typeof target.takeDamage === 'function') {
                    target.takeDamage(damageAmount, proj.owner);
                }
            }
            
            this.effects.push(new this.RedHulkExplosionEffect(proj.x, proj.y, 30, 250, 'orange'));
            for (let p = 0; p < 8; p++) {
                const particleAngle = Math.random() * Math.PI * 2;
                const particleDist = Math.random() * 20;
                this.effects.push(new this.AuraFireParticleEffect(
                    proj.x + Math.cos(particleAngle) * particleDist,
                    proj.y + Math.sin(particleAngle) * particleDist,
                    10, 'orange', 400
                ));
            }
            
            this.enemyProjectiles.splice(i, 1);
        }

        // Dentro de updateEnemyProjectiles(deltaTime), adicione ANTES do final:

        // 💥 ATUALIZA PELLETS DO SHOTGUN
        if (this.shotgunPellets) {
            for (let i = this.shotgunPellets.length - 1; i >= 0; i--) {
                const pellet = this.shotgunPellets[i];
                const elapsed = Date.now() - pellet.spawnTime;
                
                // Remove se excedeu distância
                if (pellet.traveled > pellet.maxDistance || elapsed > 500) {
                    this.shotgunPellets.splice(i, 1);
                    continue;
                }
                
                // Movimento
                const moveAmount = pellet.speed * (deltaTime / 1000);
                pellet.x += Math.cos(pellet.angle) * moveAmount;
                pellet.y += Math.sin(pellet.angle) * moveAmount;
                pellet.traveled += moveAmount;
                
                // Colisão com champions
                let hit = false;
                this.champions.forEach(champion => {
                    if (champion.hp <= 0) return;
                    
                    const dist = Math.hypot(pellet.x - champion.getCenterX(), pellet.y - champion.getCenterY());
                    if (dist < 15) {
                        champion.takeDamage(pellet.damage, pellet.owner);
                        hit = true;
                        
                        // Efeito de impacto
                        this.effects.push(new this.AuraFireParticleEffect(
                            pellet.x, pellet.y, 8, 'red', 200
                        ));
                    }
                });
                
                if (hit) {
                    this.shotgunPellets.splice(i, 1);
                }
            }
        }

        // 🎯 DESENHA RIFLE TRACERS MELHORADOS
        if (this.rifleTracers) {
            this.rifleTracers = this.rifleTracers.filter(tracer => {
                const elapsed = Date.now() - tracer.spawnTime;
                if (elapsed > tracer.duration) return false;
                
                const alpha = 1 - (elapsed / tracer.duration);
                
                this.ctx.save();
                
                // Glow effect
                if (tracer.hasGlow) {
                    this.ctx.shadowColor = 'rgba(255, 200, 0, 0.9)';
                    this.ctx.shadowBlur = 20;
                }
                
                this.ctx.strokeStyle = tracer.color.replace(/[\d.]+\)$/, `${alpha})`);
                this.ctx.lineWidth = tracer.width;
                this.ctx.lineCap = 'round';
                
                this.ctx.beginPath();
                this.ctx.moveTo(tracer.startX, tracer.startY);
                this.ctx.lineTo(tracer.endX, tracer.endY);
                this.ctx.stroke();
                
                this.ctx.shadowBlur = 0;
                this.ctx.restore();
                
                return true;
            });
        }
    }
}

showUI(text, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    // Cria a notificação
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Texto da notificação
    const textElement = document.createElement('span');
    textElement.textContent = text;
    notification.appendChild(textElement);
    
    // Botão de fechar
    const closeBtn = document.createElement('span');
    closeBtn.className = 'notification-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        removeNotification(notification);
    };
    notification.appendChild(closeBtn);
    
    // Adiciona ao container
    container.appendChild(notification);
    
    // Remove automaticamente após 15 segundos
    const timeoutId = setTimeout(() => {
        removeNotification(notification);
    }, 5000);
    
    // Clique na notificação também remove
    notification.onclick = () => {
        clearTimeout(timeoutId);
        removeNotification(notification);
    };
    
    // Função para remover com animação
    function removeNotification(element) {
        element.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
    }


    
    // Limita a 5 notificações simultâneas
    const notifications = container.querySelectorAll('.notification');
    if (notifications.length > 4) {
        removeNotification(notifications[0]);
    }
}

    hideUI(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    }

// SUBSTITUA o handleKeyDown existente por este:

handleKeyDown(e) {
    // ⭐ NOVO: Tratamento correto da tecla P
    if (e.key.toLowerCase() === 'p') {
        e.preventDefault(); // Evita comportamento padrão
        
        this.isPaused = !this.isPaused;
        console.log('⏸️ Toggle pause:', this.isPaused);
        
        // ✅ VERIFICAÇÃO SEGURA DO MENU DE PAUSE
        if (this.pauseMenu) {
            if (this.isPaused) {
                console.log('👁️ Mostrando menu de pause...');
                this.pauseMenu.show();
            } else {
                console.log('🙈 Escondendo menu de pause...');
                this.pauseMenu.hide();
            }
        } else {
            // Fallback: sistema antigo caso pauseMenu não exista
            console.warn('⚠️ pauseMenu não existe, usando fallback');
            const pausedMsg = document.getElementById('pausadoMsg');
            if (pausedMsg) {
                pausedMsg.style.display = this.isPaused ? 'flex' : 'none';
            }
        }
        
        return; // ⭐ IMPORTANTE: Sai da função aqui
    }
    
    // Venda de champion (V)
    if (e.key.toLowerCase() === 'v' && this.selectedChampion && !this.isPaused) {
        const championData = Champion.championData[this.selectedChampion.type];
        if (championData) {
            const refund = Math.floor(championData.custo * 0.7);
            
            if (!this.pendingSale) {
                this.pendingSale = {
                    champion: this.selectedChampion,
                    timestamp: Date.now()
                };
                this.showUI(`Pressione V novamente para vender ${this.selectedChampion.type} por $${refund}`, 'warning');
                
                setTimeout(() => {
                    if (this.pendingSale) {
                        this.showUI('Venda cancelada.', 'info');
                        this.pendingSale = null;
                    }
                }, 3000);
            } else if (this.pendingSale.champion === this.selectedChampion && 
                    Date.now() - this.pendingSale.timestamp < 3000) {
                this.sellChampion(this.selectedChampion);
                this.pendingSale = null;
            }
        }
    }

    if (this.selectedChampion && !this.isPaused) {
        let abilityNumber = null;
        
switch (e.key.toLowerCase()) {
            case '1':
                abilityNumber = 1;
                break;
            case '2':
                abilityNumber = 2;
                break;
            case '3':
                abilityNumber = 3;
                break;
            // ⭐ Team Up:
            case '4':
                abilityNumber = 4;
                break;
        }
        
      if (abilityNumber) {
            // ✅ TOCA O SOM ANTES DE ATIVAR A HABILIDADE
            if (this.soundManager) {
                this.soundManager.playAbilitySound(
                    this.selectedChampion.type,
                    abilityNumber
                );
            }
            
            // Mostra reação
            this.reactionSystem.onAbilityUse(
                this.selectedChampion,
                abilityNumber
            );
            
            // Ativa a habilidade
            this.selectedChampion.activateAbility(abilityNumber);
        }
    }
}

 handleCanvasClick(e) {
    if (this.isPaused) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

      // 🔥 NOVO: Ressurgimento da Fênix
    if (this.isSelectingPhoenixRebirth && this.phoenixRebirthOwner) {
        const jean = this.phoenixRebirthOwner;
        const data = Champion.championData.jeangrey;
        
        // Inicia o Ressurgimento
        jean.isPhoenixRebirthing = true;
        jean.phoenixRebirthStartTime = Date.now();
        jean.phoenixRebirthLandTime = Date.now() + data.phoenixRebirthDescent;
        jean.phoenixRebirthTargetX = x;
        jean.phoenixRebirthTargetY = y;
        jean.phoenixRebirthOriginalX = jean.x;
        jean.phoenixRebirthOriginalY = jean.y;
        jean.phoenixRebirthStoredHp = jean.hp; // Salva HP atual
        
        // Torna invulnerável
        jean.isInvulnerable = true;
        
        this.showUI('Jean Grey: RESSURGIMENTO DA FÊNIX!', 'ultimate');
        
        // Reseta flags
        this.isSelectingPhoenixRebirth = false;
        this.phoenixRebirthOwner = null;
        return;
    }

    // ⭐ NOVO: Verifica se está selecionando local para Telekinetic Barrage
    if (this.isSelectingTelekineticBarrage && this.telekineticBarrageOwner) {
        const data = Champion.championData.jeangrey;
        
        // Cria o efeito de Rajada no local clicado
        this.effects.push(new this.TelekineticBarrageEffect(
            x,
            y,
            data.telekineticBarrageRadius,
            data.telekineticBarrageDamage,
            data.telekineticBarrageExplosions,
            data.telekineticBarrageDelay,
            data.telekineticBarrageStunDuration,
            data.telekineticBarrageSlowFactor,
            data.telekineticBarrageSlowDuration,
            this.telekineticBarrageOwner,
            this
        ));
        
        this.showUI('Jean Grey: Rajada Telecinética iniciada!', 'ultimate');
        
        // Reseta flags
        this.isSelectingTelekineticBarrage = false;
        this.telekineticBarrageOwner = null;
        return;
    }

    // ⭐ NOVO: Verifica se está selecionando local para Arrow Storm
    if (this.isSelectingArrowStormLocation && this.arrowStormOwner) {
        const data = Champion.championData.hawkeye;
        
        // Cria o efeito de tempestade no local clicado
        this.effects.push(new this.ArrowStormEffect(
            x,
            y,
            data.arrowStormRadius,
            data.arrowStormDuration,
            data.arrowStormArrowCount,
            data.arrowStormDamage * (1 + this.arrowStormOwner.damageBoostBuff),
            this.arrowStormOwner,
            this
        ));
        
        this.showUI('Gavião Arqueiro: Tempestade de Flechas ativada!', 'ultimate');
        
        // Reseta flags
        this.isSelectingArrowStormLocation = false;
        this.arrowStormOwner = null;
        return;
    }
   
    // ✅ NOVO: Verifica se está selecionando local de pouso da Karolina
    if (this.isSelectingKarolinaFlight && this.karolinaFlightOwner) {
        this.karolinaFlightOwner.startFlight(x, y);
        
        // Reseta flags
        this.isSelectingKarolinaFlight = false;
        this.karolinaFlightOwner = null;
        return;
    }

    // ☀️ Verifica se está selecionando direção da Supernova
    if (this.isSelectingKarolinaSupernova && this.karolinaSupernovaOwner) {
        this.karolinaSupernovaOwner.fireSupernova(x, y);
        
        // Reseta flags
        this.isSelectingKarolinaSupernova = false;
        this.karolinaSupernovaOwner = null;
        return;
    }

    // 🌫️ Verifica clique em ilusões do Mistério
this.enemies.forEach(enemy => {
    if (enemy.executorType === 'mystery' && enemy.illusions) {
        for (let i = enemy.illusions.length - 1; i >= 0; i--) {
            const illusion = enemy.illusions[i];
            const dist = Math.hypot(x - illusion.getCenterX(), y - illusion.getCenterY());
            
            if (dist < illusion.radius + 10) {
                // Atacou a ilusão
                illusion.hp -= 50; // Dano ao clicar
                
                this.effects.push(new this.TextPopEffect(
                    illusion.getCenterX(),
                    illusion.getCenterY() - 20,
                    '-50',
                    'red',
                    500
                ));
                
                if (illusion.hp <= 0) {
                    enemy.onIllusionKilled(illusion);
                    enemy.illusions.splice(i, 1);
                }
                
                return; // Para não selecionar champion
            }
        }
    }
});

    // Seleção normal de champion
    let championClicked = null;
    for (const champion of this.champions) {
        if (x >= champion.x && x <= champion.x + champion.width &&
            y >= champion.y && y <= champion.y + champion.height) {
            championClicked = champion;
            break;
        }
    }

    // ✅ MODIFIQUE ESTA PARTE:
    
    // Desmarca champion anterior
    if (this.selectedChampion && this.selectedChampion !== championClicked) {
        if (this.reactionSystem) {
            this.reactionSystem.onDeselect(this.selectedChampion);
        }
    }
    
    // Atualiza seleção
    this.selectedChampion = championClicked;
    
    // Mostra reação ao selecionar
    if (championClicked && this.reactionSystem) {
        this.reactionSystem.onSelect(championClicked);
    }
}

    handleMenuDragStart(e) {
        this.draggedChampionType = e.target.dataset.type;
        document.querySelectorAll('.torreIcone').forEach(icon => icon.classList.remove('selected'));
        e.target.classList.add('selected');
    }

    // Em main.js - No método handleCanvasDrop (onde cria os champions):

handleCanvasDrop(e) {
    e.preventDefault();

    if (this.draggedChampionType) {
        const championData = Champion.championData[this.draggedChampionType];
        if (!championData) {
            this.showUI(`Erro: Dados do campeão '${this.draggedChampionType}' não encontrados.`, 'error');
            this.draggedChampionType = null;
            return;
        }

        if (this.money >= championData.custo) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ChampionClass = Champion.championClassesMap[this.draggedChampionType];
            if (ChampionClass) {
                const newChampion = new ChampionClass(
                    this.draggedChampionType, 
                    x - championData.width / 2, 
                    y - championData.height / 2, 
                    Date.now() + Math.random(), 
                    this
                );
                newChampion.gameManager = this;
                
                this.champions.push(newChampion);

                                
                // ✅ ADICIONE ESTA LINHA:
                if (this.reactionSystem) {
                    this.reactionSystem.onRecruit(newChampion);
                }
                
                this.money -= championData.custo;

                this.updateUI();
                this.showUI(`Campeão ${newChampion.type} recrutado!`, 'info');
                
                // 🔧 CORREÇÃO: 🟠 Joia da Alma APÓS criar o champion
                const hasInfinityUltron = this.champions.some(c => c.type === 'infinityultron' && c.hp > 0);

                if (hasInfinityUltron) {
                    const soulData = Champion.championData.infinityultron.soulStone;
                    
                    // Aplica buff ao champion recém-colocado
                    newChampion.applyBuff('attackSpeed', soulData.attackSpeedBonus, soulData.duration);
                    newChampion.applyBuff('damageBoost', soulData.damageBonus, soulData.duration);
                    
                    // Efeito visual laranja
                    this.effects.push(new this.AuraFireParticleEffect(
                        newChampion.getCenterX(),
                        newChampion.getCenterY(),
                        50,
                        'orange',
                        1000
                    ));
                    
                    this.effects.push(new this.TextPopEffect(
                        newChampion.getCenterX(),
                        newChampion.getCenterY() - 50,
                        '🟠 JOIA DA ALMA',
                        'orange',
                        2000
                    ));
                    
                    this.showUI('Infinity Ultron: Joia da Alma ativada! 🟠', 'special');
                }
            }
        } else {
            this.showUI(`Dinheiro insuficiente!`, 'warning');
        }
        this.draggedChampionType = null;
        document.querySelectorAll('.torreIcone').forEach(icon => icon.classList.remove('selected'));
    }
}

    getPhaseData(phase) {
        return this.phaseData[phase] || this.phaseData[1];
    }

    getEnemiesForPhase(phase) {
        const data = this.getPhaseData(phase);
        return data.numEnemies;
    }

// ... (código anterior da classe GameManager)

    // CONTINUAÇÃO DO GAMEMANAGER

    // No GameManager.spawnEnemy()
// Em main.js - GameManager.spawnEnemy(), ADICIONE esta linha:

spawnEnemy() {
    const phaseData = this.getPhaseData(this.currentPhase);
    const enemyTypes = phaseData.enemyTypes;
    const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    const data = this.enemyData[randomType];
    if (!data) return;

    const minY = 50;
    const maxY = this.canvas.height - 50;
    const startY = minY + Math.random() * (maxY - minY);
    const startX = -data.radius * 2;
    const endX = this.canvas.width + data.radius * 2;
    const endY = startY;
    
    const individualPath = [
        { x: startX, y: startY },
        { x: endX, y: endY }
    ];
    
    const newEnemy = new Enemy(
        `enemy-${Date.now()}-${Math.random()}`,
        startX - data.radius,
        startY - data.radius,
        randomType,
        data,
        individualPath
    );

    // ⭐ CRÍTICO: Seta o gameManager no inimigo
    newEnemy.gameManager = this;
   // console.log('✅ Inimigo', randomType, 'criado com gameManager');
    
    this.enemies.push(newEnemy);
    this.enemiesSpawned++;
}

startWave() {
    this.currentPhase++;
    this.enemiesDefeatedThisPhase = 0;
    this.enemiesToSpawn = this.getEnemiesForPhase(this.currentPhase);
    this.enemiesToNextPhase = this.enemiesToSpawn;
    this.waveInProgress = true;
    this.lastSpawnTime = Date.now();
    this.resurrectionsUsedThisPhase = 0;
    this.enemiesSpawned = 0;


    // ✅ NOVO: Mostra reações de início de fase
    this.reactionSystem.onWaveStart(this.currentPhase, this.selectedChampion);

    // ✅ RESETA FLAGS DE FERRAMENTAS
    this.champions.forEach(champion => {
        if (champion.type === 'ultron') {
            champion.emergencyReplicationUsedThisPhase = false;
        }
        
        // Reseta Viúva Escarlate
        if (champion.attachedTool && champion.attachedTool.mechanic === 'revive') {
            champion.attachedTool.usedThisPhase = false;
        }
        
        // Aplica escudo de Armadura Beta
        if (champion.attachedTool && champion.attachedTool.mechanic === 'phaseShield') {
            champion.phaseShield = champion.attachedTool.shieldAmount;
            
            this.effects.push(new this.TextPopEffect(
                champion.getCenterX(),
                champion.getCenterY() - 40,
                `🦾 +${champion.attachedTool.shieldAmount} ESCUDO`,
                'cyan',
                1500
            ));
        }
    });
    
    this.showUI(`Fase ${this.currentPhase} iniciada!`, 'info');
    this.updateUI();
    
    // Sistema de Executores
    if (this.executorSpawnSystem) {
        this.executorSpawnSystem.resetPhase();
        
        if (this.currentPhase >= 3) {
            setTimeout(() => {
                if (this.executorSpawnSystem) {
                    this.executorSpawnSystem.spawnRandomExecutor();
                }
            }, 3000);
        }
    }


    // ⏳ REDUZ COOLDOWN DE FASE DA JOIA DO TEMPO
    this.champions.forEach(champion => {
        if (champion.type === 'infinityultron' && champion.timePrisonPhaseCooldown > 0) {
            champion.timePrisonPhaseCooldown--;
            
            if (champion.timePrisonPhaseCooldown === 0) {
                this.showUI('⏳ Prisão Temporal pronta!', 'success');
            }
        }
    });

    this.showUI(`Fase ${this.currentPhase} iniciada!`, 'info');
    this.updateUI();
    
    // 💀 Sistema de Spawn de Executores (SEMPRE após fase 3)
    if (this.executorSpawnSystem) {
        this.executorSpawnSystem.resetPhase();
        
        // ✅ MUDANÇA: 100% de chance após fase 3
        if (this.currentPhase >= 3) { // ← REMOVA O Math.random()
            setTimeout(() => {
                if (this.executorSpawnSystem) {
                    this.executorSpawnSystem.spawnRandomExecutor();
                }
            }, 3000);
        }
    } else {
        console.warn('⚠️ executorSpawnSystem não inicializado ainda');
    }
}


  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // ⚖️ DESENHA BALAS DA SENTENÇA FINAL
if (this.finalSentenceBullets) {
    this.finalSentenceBullets.forEach(bullet => {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
        this.ctx.shadowColor = 'rgba(255, 0, 0, 1)';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    });
}

// 🚀 DESENHA MÍSSEIS DA SENTENÇA FINAL
if (this.finalSentenceMissiles) {
    this.finalSentenceMissiles.forEach(missile => {
        // Desenha rastro
        missile.trailParticles.forEach(p => {
            if (p.life > 0) {
                const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10);
                gradient.addColorStop(0, `rgba(255, 150, 0, ${p.life})`);
                gradient.addColorStop(1, 'rgba(100, 50, 0, 0)');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // Desenha míssil
        this.ctx.save();
        this.ctx.translate(missile.x, missile.y);
        this.ctx.rotate(missile.rotation);
        
        // Corpo do míssil
        this.ctx.fillStyle = 'rgba(80, 80, 80, 1)';
        this.ctx.fillRect(-15, -4, 30, 8);
        
        // Ponta vermelha
        this.ctx.fillStyle = 'rgba(255, 0, 0, 1)';
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(25, 0);
        this.ctx.lineTo(15, 6);
        this.ctx.lineTo(15, -6);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Chamas de propulsão
        for (let f = 0; f < 3; f++) {
            const flameSize = 8 + Math.random() * 6;
            this.ctx.fillStyle = f === 0 ? 'rgba(255, 255, 100, 0.9)' : 'rgba(255, 150, 0, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(-15 - f * 8, 0, flameSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    });
}

    // 🌫️ DESENHA FUMAÇA DO JUSTICEIRO
if (this.punisherSmoke) {
    this.punisherSmoke.forEach(smoke => {
        const elapsed = Date.now() - smoke.spawnTime;
        if (elapsed > smoke.duration) return;
        
        const progress = elapsed / smoke.duration;
        const alpha = (1 - progress) * 0.6;
        
        // Nuvem de fumaça cinza
        const gradient = this.ctx.createRadialGradient(
            smoke.x, smoke.y, 0,
            smoke.x, smoke.y, smoke.radius
        );
        gradient.addColorStop(0, `rgba(60, 60, 60, ${alpha})`);
        gradient.addColorStop(0.6, `rgba(40, 40, 40, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'rgba(20, 20, 20, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(smoke.x, smoke.y, smoke.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Partículas de fumaça
        if (Math.random() < 0.5) {
            const particleAngle = Math.random() * Math.PI * 2;
            const particleDist = Math.random() * smoke.radius;
            this.ctx.fillStyle = `rgba(80, 80, 80, ${alpha * Math.random()})`;
            this.ctx.beginPath();
            this.ctx.arc(
                smoke.x + Math.cos(particleAngle) * particleDist,
                smoke.y + Math.sin(particleAngle) * particleDist,
                5 + Math.random() * 10,
                0, Math.PI * 2
            );
            this.ctx.fill();
        }
    });
}

// 🔧 DESENHA TORRETAS
if (this.punisherTurrets) {
    this.punisherTurrets.forEach(turret => {
        if (turret.hp <= 0) return;
        
        this.ctx.save();
        
        // Base da torreta (cinza escuro)
        this.ctx.fillStyle = 'rgba(60, 60, 60, 0.9)';
        this.ctx.strokeStyle = 'rgba(100, 100, 100, 1)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(turret.x, turret.y, turret.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Canhão (rotacionável)
        this.ctx.save();
        this.ctx.translate(turret.x, turret.y);
        this.ctx.rotate(turret.targetAngle);
        
        this.ctx.fillStyle = 'rgba(80, 80, 80, 1)';
        this.ctx.fillRect(0, -3, turret.radius + 10, 6);
        
        // Ponta vermelha
        this.ctx.fillStyle = 'red';
        this.ctx.beginPath();
        this.ctx.arc(turret.radius + 10, 0, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
        
        // HP bar
        const barWidth = turret.radius * 2;
        const hpPercent = turret.hp / turret.maxHp;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(turret.x - turret.radius, turret.y - turret.radius - 10, barWidth, 4);

            this.ctx.fillStyle = 'lime';
            this.ctx.fillRect(turret.x - turret.radius, turret.y - turret.radius - 10, barWidth * hpPercent, 4);
            
            this.ctx.restore();
        });
        }

/* // 🪝 DESENHA GANCHOS
if (this.grapplingHooks) {
    this.grapplingHooks = this.grapplingHooks.filter(hook => {
        const elapsed = Date.now() - hook.spawnTime;
        if (elapsed > hook.duration) return false;
        
        const progress = elapsed / hook.duration;
        const currentX = hook.startX + (hook.targetX - hook.startX) * progress;
        const currentY = hook.startY + (hook.targetY - hook.startY) * progress;
        
        this.ctx.save();
        
        // Cabo do gancho (linha grossa)
        const gradient = this.ctx.createLinearGradient(
            hook.startX, hook.startY,
            currentX, currentY
        );
        gradient.addColorStop(0, 'rgba(100, 100, 100, 0.9)');
        gradient.addColorStop(1, 'rgba(150, 150, 150, 0.7)');
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = 'rgba(150, 150, 150, 0.8)';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(hook.startX, hook.startY);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();
        
        // Gancho na ponta
        this.ctx.fillStyle = 'rgba(200, 200, 200, 1)';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(currentX, currentY, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
        
        return true;
    });
} */

// 🪝 DESENHA GANCHOS (MELHORADO)
this.enemies.forEach(enemy => {
    if (enemy.isExecutor && enemy.executorType === 'punisher' && enemy.isGrappling) {
        const elapsed = Date.now() - enemy.grapplingStartTime;
        const progress = Math.min(1, elapsed / enemy.grapplingDuration);
        
        const currentX = enemy.grapplingStartX + (enemy.grapplingTargetX - enemy.grapplingStartX) * progress;
        const currentY = enemy.grapplingStartY + (enemy.grapplingTargetY - enemy.grapplingStartY) * progress;
        
        this.ctx.save();
        
        // Cabo GROSSO com gradiente
        const gradient = this.ctx.createLinearGradient(
            enemy.grapplingStartX, enemy.grapplingStartY,
            currentX, currentY
        );
        gradient.addColorStop(0, 'rgba(120, 120, 120, 1)');
        gradient.addColorStop(0.5, 'rgba(180, 180, 180, 1)');
        gradient.addColorStop(1, 'rgba(150, 150, 150, 0.8)');
        
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 6;
        this.ctx.shadowColor = 'rgba(150, 150, 150, 0.9)';
        this.ctx.shadowBlur = 15;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(enemy.grapplingStartX, enemy.grapplingStartY);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();
        
        // Gancho metálico na ponta
        this.ctx.fillStyle = 'rgba(220, 220, 220, 1)';
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.arc(currentX, currentY, 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Detalhes do gancho
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    }
});

   // ===============================
    // ⭐ NOVO: PREVIEW DA RAJADA TELECINÉTICA
    // ===============================
    if (this.isSelectingTelekineticBarrage && this.telekineticBarrageOwner) {
        const data = Champion.championData.jeangrey;
        const x = this.telekineticBarragePreviewX;
        const y = this.telekineticBarragePreviewY;
        
        this.ctx.save();
        
        // Círculo da área (pulsante)
        const pulse = Math.sin(Date.now() / 150) * 10;
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, data.telekineticBarrageRadius + pulse);
        gradient.addColorStop(0, 'rgba(255, 100, 0, 0.4)');
        gradient.addColorStop(0.7, 'rgba(255, 150, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, data.telekineticBarrageRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Contorno
        this.ctx.strokeStyle = 'rgba(255, 150, 0, 0.9)';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.arc(x, y, data.telekineticBarrageRadius + pulse, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        // Símbolo psi
        this.ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
        this.ctx.font = 'bold 30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Ψ', x, y + 10);
        
        // Texto
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText('CLIQUE PARA CONFIRMAR', x, y - data.telekineticBarrageRadius - 15);
        
        this.ctx.restore();
    }

// Substitua o código de desenho das ilusões por este:

// ===============================
// 🔥 DESENHA CLONES TELEPÁTICOS (MELHORADO)
// ===============================
if (this.telepathicIllusions) {
    this.telepathicIllusions.forEach(clone => {
        const timeLeft = clone.detonationTime - Date.now();
        clone.pulsePhase += 0.05;
        
        this.ctx.save();
        
        // 🔥 RASTRO DE PARTÍCULAS
        clone.trailParticles.forEach(particle => {
            const particleAge = (Date.now() - particle.time) / particle.life;
            const particleAlpha = (1 - particleAge) * 0.5;
            
            const trailGradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, 12
            );
            trailGradient.addColorStop(0, `rgba(255, 150, 0, ${particleAlpha})`);
            trailGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
            
            this.ctx.fillStyle = trailGradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // 🔥 IMAGEM DO CLONE (NOVA)
        const pulseAlpha = 0.6 + Math.sin(clone.pulsePhase) * 0.2;
        this.ctx.globalAlpha = pulseAlpha;
        
        if (clone.image.complete && !clone.image.isFallback) {
            this.ctx.drawImage(
                clone.image,
                clone.x - 30,
                clone.y - 30,
                60,
                60
            );
        } else {
            // Fallback
            this.ctx.fillStyle = 'rgba(255, 100, 0, 0.7)';
            this.ctx.fillRect(clone.x - 25, clone.y - 25, 50, 50);
        }
        
        this.ctx.globalAlpha = 1;
        
        // Aura de energia intensa
        const auraSize = 50 + Math.sin(clone.pulsePhase * 2) * 10;
        const auraGradient = this.ctx.createRadialGradient(
            clone.x, clone.y, 0,
            clone.x, clone.y, auraSize
        );
        auraGradient.addColorStop(0, 'rgba(255, 150, 0, 0.5)');
        auraGradient.addColorStop(0.6, 'rgba(255, 100, 0, 0.3)');
        auraGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        
        this.ctx.fillStyle = auraGradient;
        this.ctx.beginPath();
        this.ctx.arc(clone.x, clone.y, auraSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Timer e indicador de alvo
        if (clone.target && clone.target.hp > 0) {
            // Linha até o alvo
            this.ctx.strokeStyle = 'rgba(255, 150, 0, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(clone.x, clone.y);
            this.ctx.lineTo(clone.target.getCenterX(), clone.target.getCenterY());
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            // Texto
            this.ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText('🎯 ALVO', clone.x, clone.y - 45);
        } else {
            this.ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText(`${(timeLeft / 1000).toFixed(1)}s`, clone.x, clone.y - 45);
        }
        
        this.ctx.shadowBlur = 0;
        this.ctx.restore();
    });
}

// 🔥 NOVO: DESENHA PREVIEW DO RESSURGIMENTO
if (this.isSelectingPhoenixRebirth && this.phoenixRebirthOwner) {
    const data = Champion.championData.jeangrey;
    const x = this.telekineticBarragePreviewX;
    const y = this.telekineticBarragePreviewY;
    
    this.ctx.save();
    
    // Área de impacto (GIGANTE)
    const pulse = Math.sin(Date.now() / 100) * 15;
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, data.phoenixRebirthRadius + pulse);
    gradient.addColorStop(0, 'rgba(255, 100, 0, 0.5)');
    gradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, data.phoenixRebirthRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Contorno
    this.ctx.strokeStyle = 'rgba(255, 150, 0, 0.9)';
    this.ctx.lineWidth = 5;
    this.ctx.shadowColor = 'rgba(255, 100, 0, 1)';
    this.ctx.shadowBlur = 25;
    this.ctx.beginPath();
    this.ctx.arc(x, y, data.phoenixRebirthRadius + pulse, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    
    // Símbolo Fênix
    this.ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
    this.ctx.font = 'bold 60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = 'rgba(255, 100, 0, 1)';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('🔥', x, y + 20);
    
    this.ctx.font = 'bold 20px Arial';
    this.ctx.fillText('RESSURGIMENTO', x, y - data.phoenixRebirthRadius - 30);
    this.ctx.fillText('CLIQUE PARA CONFIRMAR', x, y - data.phoenixRebirthRadius - 10);
    this.ctx.shadowBlur = 0;
    
    this.ctx.restore();
}


    if (this.collectorSystem) {
    this.collectorSystem.draw(this.ctx);
    }
    
        
        // ✅ DESENHA HOLOGRAMAS
        if (this.holograms) {
            this.holograms.forEach(h => {
                if (h && h.draw) {
                    h.draw(this.ctx);
                }
            });
        }
        
        // ✅ DESENHA PROJÉTEIS DAS SENTINELAS
        if (this.sentinelProjectiles) {
            this.sentinelProjectiles.forEach(proj => {
                if (proj && proj.draw) {
                    proj.draw(this.ctx);
                }
            });
        }


    // 🔴 EFEITO DE DISTORÇÃO DA REALIDADE
    const hasRealityActive = this.champions.some(c => 
        c.type === 'infinityultron' && c.realityStoneActive
    );
    
    if (hasRealityActive) {
        // Glitch effect: deslocamento aleatório
        const glitchX = (Math.random() - 0.5) * 10;
        const glitchY = (Math.random() - 0.5) * 10;
        this.ctx.save();
        this.ctx.translate(glitchX, glitchY);
        
        // Filtro vermelho pulsante
        const pulseAlpha = 0.2 + Math.sin(Date.now() / 100) * 0.15;
        this.ctx.fillStyle = `rgba(139, 0, 0, ${pulseAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.restore();
    }
    

     
    // 💰 Desenha baús (ANTES dos efeitos)
    this.chests.forEach(chest => chest.draw(this.ctx));
    
    // 🌀 Desenha portais (ANTES dos efeitos)
    this.portals.forEach(portal => portal.draw(this.ctx));
    
        // Desenha o caminho
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 10;
        this.ctx.beginPath();
        if (this.path.length > 0) {
            this.ctx.moveTo(this.path[0].x, this.path[0].y);
            for (let i = 1; i < this.path.length; i++) {
                this.ctx.lineTo(this.path[i].x, this.path[i].y);
            }
        }
        this.ctx.stroke();

        // ⭐ ADICIONE ISSO AQUI: Desenha Cones de Team Up (Emma/Wanda)
        if (this.psychicAttractionCones) {
            this.psychicAttractionCones.forEach(cone => cone.draw(this.ctx));
        }

    // ✅ DESTAQUE DOS CHAMPIONS DURANTE DRAG
    if (this.isDraggingTool) {
        this.champions.forEach(champion => {
            const hasToolAlready = champion.attachedTool !== null && champion.attachedTool !== undefined;
            
            this.ctx.save();
            
            if (hasToolAlready) {
                // Champion já tem ferramenta - vermelho
                this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            } else {
                // Champion disponível - verde
                this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
                this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            }
            
            this.ctx.lineWidth = 4;
            this.ctx.shadowColor = hasToolAlready ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)';
            this.ctx.shadowBlur = 15;
            
            // Retângulo ao redor do champion
            this.ctx.strokeRect(
                champion.x - 5,
                champion.y - 5,
                champion.width + 10,
                champion.height + 10
            );
            
            this.ctx.fillRect(
                champion.x - 5,
                champion.y - 5,
                champion.width + 10,
                champion.height + 10
            );
            
            // Texto indicador
            this.ctx.fillStyle = hasToolAlready ? 'rgba(255, 0, 0, 0.9)' : 'rgba(0, 255, 0, 0.9)';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowBlur = 8;
            this.ctx.fillText(
                hasToolAlready ? '❌ OCUPADO' : '✅ DISPONÍVEL',
                champion.getCenterX(),
                champion.y - 15
            );
            
            this.ctx.shadowBlur = 0;
            this.ctx.restore();
        });
    }
        
        // Desenha campeões
        this.champions.forEach(champion => {
            champion.draw(
                this.ctx, 
                champion === this.selectedChampion, 
                this.images.mjolnir, 
                this.images.capShield, 
                this.images.usagentShield, 
                this.images.wandaIllusion
            );
        });
        
    // Desenha flashes de tela
    if (this.screenFlashes) {
        this.screenFlashes = this.screenFlashes.filter(flash => {
            const alive = flash.update();
            if (alive) {
                flash.draw(this.ctx, this.canvas);
            }
            return alive;
        });
    }

// ⏳ DESENHA ZONA DE PRISÃO TEMPORAL
this.champions.forEach(champion => {
    if (champion.type === 'infinityultron' && champion.timePrisonActive && champion.timePrisonZone) {
        const zone = champion.timePrisonZone;
        const time = Date.now() / 1000;
        const progress = (Date.now() - (zone.endTime - 6000)) / 6000;
        const alpha = 0.7 - progress * 0.3;
        
        this.ctx.save();
        
        // ===============================
        // CAMPO TEMPORAL VERDE
        // ===============================
        const gradient = this.ctx.createRadialGradient(
            zone.x, zone.y, 0,
            zone.x, zone.y, zone.radius
        );
        gradient.addColorStop(0, `rgba(50, 205, 50, ${alpha * 0.5})`);
        gradient.addColorStop(0.7, `rgba(0, 255, 0, ${alpha * 0.3})`);
        gradient.addColorStop(1, `rgba(0, 128, 0, 0)`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // ===============================
        // RELÓGIO TRANSLÚCIDO QUEBRADO
        // ===============================
        this.ctx.save();
        this.ctx.translate(zone.x, zone.y);
        this.ctx.globalAlpha = alpha * 0.6;
        
        // Círculo do relógio
        this.ctx.strokeStyle = 'rgba(50, 205, 50, 0.8)';
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = 'rgba(0, 255, 0, 0.8)';
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 60, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        // Marcadores de horas
        for (let h = 0; h < 12; h++) {
            const angle = (Math.PI * 2 / 12) * h - Math.PI / 2;
            const x = Math.cos(angle) * 50;
            const y = Math.sin(angle) * 50;
            
            this.ctx.fillStyle = 'rgba(50, 205, 50, 0.9)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Ponteiros congelados
        const frozenTime = time * 10 % 12;
        
        // Ponteiro das horas
        this.ctx.save();
        this.ctx.rotate((Math.PI * 2 / 12) * frozenTime - Math.PI / 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(30, 0);
        this.ctx.stroke();
        this.ctx.restore();
        
        // Ponteiro dos minutos
        this.ctx.save();
        this.ctx.rotate((Math.PI * 2 / 60) * (frozenTime * 5) - Math.PI / 2);
        this.ctx.strokeStyle = 'rgba(200, 255, 200, 0.9)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(45, 0);
        this.ctx.stroke();
        this.ctx.restore();
        
        // ===============================
        // RACHADURAS NO RELÓGIO
        // ===============================
        const cracks = [
            { start: 0.2, end: 0.8, angle: Math.PI / 4 },
            { start: 0.3, end: 0.9, angle: -Math.PI / 3 },
            { start: 0.1, end: 0.7, angle: Math.PI / 2 }
        ];
        
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.lineWidth = 2;
        
        cracks.forEach(crack => {
            const startX = Math.cos(crack.angle) * 60 * crack.start;
            const startY = Math.sin(crack.angle) * 60 * crack.start;
            const endX = Math.cos(crack.angle) * 60 * crack.end;
            const endY = Math.sin(crack.angle) * 60 * crack.end;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        });
        
        this.ctx.restore();
        
        // ===============================
        // ONDAS TEMPORAIS
        // ===============================
        for (let w = 0; w < 4; w++) {
            const waveRadius = zone.radius * (0.3 + w * 0.2);
            const waveProgress = (time * 2 + w * 0.5) % 1;
            const waveAlpha = alpha * (1 - waveProgress);
            
            this.ctx.strokeStyle = `rgba(50, 205, 50, ${waveAlpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([10, 10]);
            this.ctx.beginPath();
            this.ctx.arc(zone.x, zone.y, waveRadius + waveProgress * 30, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // ===============================
        // PARTÍCULAS TEMPORAIS NA ZONA
        // ===============================
        if (progress < 0.8) {
            for (let p = 0; p < 15; p++) {
                const particleAngle = (Math.PI * 2 / 15) * p + time * 2;
                const particleDist = Math.random() * zone.radius;
                const px = zone.x + Math.cos(particleAngle) * particleDist;
                const py = zone.y + Math.sin(particleAngle) * particleDist;
                const particleSize = 3 + Math.random() * 3;
                
                const particleGradient = this.ctx.createRadialGradient(px, py, 0, px, py, particleSize);
                particleGradient.addColorStop(0, `rgba(200, 255, 200, ${alpha})`);
                particleGradient.addColorStop(1, `rgba(50, 255, 50, 0)`);
                
                this.ctx.fillStyle = particleGradient;
                this.ctx.beginPath();
                this.ctx.arc(px, py, particleSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
                
        // ===============================
        // TEXTO DE AVISO
        // ===============================
        this.ctx.fillStyle = `rgba(50, 255, 50, ${alpha})`;
        this.ctx.font = 'bold 18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 255, 0, 1)';
        this.ctx.shadowBlur = 15;
        this.ctx.fillText('⏳ TEMPO CONGELADO ⏳', zone.x, zone.y - zone.radius - 15);
        this.ctx.shadowBlur = 0;
        
        this.ctx.restore();

        // Contador de inimigos congelados
        const frozenCount = champion.frozenEnemies.length;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 255, 0, 1)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText(`⚡ ${frozenCount} congelados`, zone.x, zone.y + zone.radius + 30);
        this.ctx.shadowBlur = 0;
    }
});



// 🌌 Desenha Pulso de Entropia do Infinity Ultron
this.champions.forEach(champion => {
    if (champion.type === 'infinityultron' && champion.hp > 0) {
        const data = Champion.championData.infinityultron.entropyPulse;
        const time = Date.now() / 1000;
        
        // ✅ CRITICAL: Define centerX e centerY ANTES de usar
        const centerX = champion.getCenterX();
        const centerY = champion.getCenterY();
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        // ===============================
        // ANÉIS DE ENTROPIA (3 CAMADAS)
        // ===============================
        const rings = [
            { radius: data.innerRadius, color: 'rgba(255, 100, 0, 0.4)', width: 4 },
            { radius: data.middleRadius, color: 'rgba(255, 150, 50, 0.3)', width: 3 },
            { radius: data.outerRadius, color: 'rgba(255, 200, 100, 0.2)', width: 2 }
        ];
        
        rings.forEach((ring, index) => {
        const pulse = Math.sin(time * 2 + index * 0.5) * 5;
        const rotation = champion.entropyRingRotation + index * 0.3;
        
        // 🟪 Cor roxa se Power Stone estiver ativa
        const baseColor = champion.powerStoneActive 
            ? 'rgba(150, 50, 200' 
            : 'rgba(255, 150, 0';
        
        const ringColor = `${baseColor}, ${ring.color.match(/[\d.]+\)$/)[0]}`;
        
        // Anel pulsante
        this.ctx.strokeStyle = ringColor;
        this.ctx.lineWidth = ring.width;
        this.ctx.shadowColor = champion.powerStoneActive 
            ? 'rgba(200, 100, 255, 0.8)' 
            : 'rgba(255, 150, 0, 0.8)';
        this.ctx.shadowBlur = champion.powerStoneActive ? 25 : 20;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, ring.radius + pulse, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Marcadores no anel
        for (let m = 0; m < 8; m++) {
            const angle = (Math.PI * 2 / 8) * m + rotation;
            const mx = Math.cos(angle) * ring.radius;
            const my = Math.sin(angle) * ring.radius;
            
            this.ctx.fillStyle = ringColor;
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.arc(mx, my, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    });

    this.ctx.shadowBlur = 0;

        
        // ===============================
        // DISTORÇÃO ESPACIAL (CENTRO)
        // ===============================
        const distortionSize = 40 + Math.sin(time * 3) * 10;
        const distortionGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, distortionSize);
        distortionGradient.addColorStop(0, 'rgba(100, 150, 255, 0.6)');
        distortionGradient.addColorStop(0.5, 'rgba(150, 100, 255, 0.4)');
        distortionGradient.addColorStop(1, 'rgba(50, 50, 150, 0)');
        
        this.ctx.fillStyle = distortionGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, distortionSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // ===============================
        // IMAGEM DO INFINITY ULTRON (CENTRO)
        // ===============================
        if (champion.image && champion.image.complete) {
            this.ctx.drawImage(
                champion.image,
                -champion.width / 2,
                -champion.height / 2,
                champion.width,
                champion.height
            );
        }
        
        // ===============================
        // STACKS DE DOMÍNIO DIMENSIONAL
        // ===============================
        if (champion.dominionStacks > 0) {
            this.ctx.fillStyle = 'rgba(100, 200, 255, 0.9)';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(100, 200, 255, 1)';
            this.ctx.shadowBlur = 15;
            this.ctx.fillText(
                `⚡${champion.dominionStacks}`,
                0,
                -champion.height / 2 - 40
            );
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.restore(); // ✅ RESTORE AQUI para o Pulso de Entropia
        
 // 🟥 DESENHA BARREIRA DA REALIDADE COM GLITCH ÉPICO
this.champions.forEach(champion => {
    if (champion.type === 'infinityultron' && champion.activeRealityBarrier) {
        const barrier = champion.activeRealityBarrier;
        const elapsed = Date.now() - barrier.spawnTime;
        const progress = elapsed / barrier.duration;
        const alpha = Math.max(0.5, 1 - progress * 0.5);
        const time = Date.now() / 1000;
        
        this.ctx.save();
        
        // ===============================
        // DISTORÇÃO DE FUNDO
        // ===============================
        const distortionGradient = this.ctx.createLinearGradient(
            barrier.x - 30, 0,
            barrier.x + barrier.width + 30, 0
        );
        distortionGradient.addColorStop(0, 'rgba(139, 0, 0, 0)');
        distortionGradient.addColorStop(0.3, `rgba(180, 0, 0, ${alpha * 0.2})`);
        distortionGradient.addColorStop(0.7, `rgba(180, 0, 0, ${alpha * 0.2})`);
        distortionGradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
        
        this.ctx.fillStyle = distortionGradient;
        this.ctx.fillRect(barrier.x - 30, 0, barrier.width + 60, barrier.height);
        
        // ===============================
        // BARREIRA PRINCIPAL (GLITCH)
        // ===============================
        
        // Efeito de glitch horizontal
        const numGlitchSegments = 20;
        for (let i = 0; i < numGlitchSegments; i++) {
            const segmentHeight = barrier.height / numGlitchSegments;
            const y = i * segmentHeight;
            const glitchOffset = (Math.random() < 0.1) ? (Math.random() - 0.5) * 10 : 0;
            
            // Gradiente vermelho por segmento
            const segmentGradient = this.ctx.createLinearGradient(
                barrier.x, y,
                barrier.x + barrier.width, y
            );
            segmentGradient.addColorStop(0, `rgba(100, 0, 0, ${alpha * 0.6})`);
            segmentGradient.addColorStop(0.5, `rgba(180, 0, 0, ${alpha * 0.9})`);
            segmentGradient.addColorStop(1, `rgba(100, 0, 0, ${alpha * 0.6})`);
            
            this.ctx.fillStyle = segmentGradient;
            this.ctx.fillRect(
                barrier.x + glitchOffset,
                y,
                barrier.width,
                segmentHeight + 1
            );
        }
        
        // ===============================
        // LINHAS DE GLITCH HORIZONTAIS
        // ===============================
        barrier.glitchLines.forEach(line => {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${line.alpha * alpha})`;
            this.ctx.fillRect(
                barrier.x - 20,
                barrier.y + line.y,
                barrier.width + 40,
                line.height
            );
            
            // Linha branca brilhante
            this.ctx.fillStyle = `rgba(255, 255, 255, ${line.alpha * alpha * 0.5})`;
            this.ctx.fillRect(
                barrier.x - 15,
                barrier.y + line.y,
                barrier.width + 30,
                Math.max(1, line.height / 2)
            );
        });
        
        // ===============================
        // SCANLINE (EFEITO CRT)
        // ===============================
        for (let i = 0; i < barrier.height; i += 4) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.15})`;
            this.ctx.fillRect(barrier.x, barrier.y + i, barrier.width, 2);
        }
        
        // Scanline animada
        const scanlineGradient = this.ctx.createLinearGradient(
            barrier.x, barrier.scanlineOffset - 50,
            barrier.x, barrier.scanlineOffset + 50
        );
        scanlineGradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        scanlineGradient.addColorStop(0.5, `rgba(255, 100, 100, ${alpha * 0.4})`);
        scanlineGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        this.ctx.fillStyle = scanlineGradient;
        this.ctx.fillRect(barrier.x, barrier.scanlineOffset - 50, barrier.width, 100);
        
        // ===============================
        // HEXÁGONOS DE ENERGIA
        // ===============================
        barrier.hexagons.forEach(hex => {
            const hexX = barrier.x + barrier.width / 2;
            const hexY = barrier.y + hex.y;
            const hexAlpha = alpha * (0.6 + Math.sin(hex.pulsePhase) * 0.4);
            
            this.ctx.save();
            this.ctx.translate(hexX, hexY);
            this.ctx.rotate(hex.rotation);
            
            // Hexágono preenchido
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${hexAlpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
            this.ctx.shadowBlur = 15;
            
            this.ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 / 6) * i;
                const px = Math.cos(angle) * hex.size;
                const py = Math.sin(angle) * hex.size;
                if (i === 0) this.ctx.moveTo(px, py);
                else this.ctx.lineTo(px, py);
            }
            this.ctx.closePath();
            this.ctx.stroke();
            
            // Núcleo do hexágono
            this.ctx.fillStyle = `rgba(255, 100, 100, ${hexAlpha * 0.6})`;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, hex.size * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
        
        this.ctx.shadowBlur = 0;
        
        // ===============================
        // PULSOS DE ENERGIA VERTICAIS
        // ===============================
        barrier.energyPulses.forEach(pulse => {
            if (elapsed > pulse.delay && pulse.y > 0) {
                const pulseGradient = this.ctx.createRadialGradient(
                    barrier.x + barrier.width / 2,
                    pulse.y,
                    0,
                    barrier.x + barrier.width / 2,
                    pulse.y,
                    pulse.size
                );
                pulseGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                pulseGradient.addColorStop(0.5, `rgba(255, 0, 0, ${alpha * 0.7})`);
                pulseGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                
                this.ctx.fillStyle = pulseGradient;
                this.ctx.beginPath();
                this.ctx.arc(
                    barrier.x + barrier.width / 2,
                    pulse.y,
                    pulse.size,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
        });
        
        // ===============================
        // PARTÍCULAS DE DISTORÇÃO
        // ===============================
        barrier.shardParticles.forEach(p => {
            const px = barrier.x + p.x;
            const py = barrier.y + p.y;
            const particleAlpha = p.alpha * alpha * (0.5 + Math.sin(p.pulsePhase) * 0.5);
            
            const particleGradient = this.ctx.createRadialGradient(px, py, 0, px, py, p.size);
            particleGradient.addColorStop(0, `rgba(255, 150, 150, ${particleAlpha})`);
            particleGradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
            
            this.ctx.fillStyle = particleGradient;
            this.ctx.beginPath();
            this.ctx.arc(px, py, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // ===============================
        // CONTORNO BRILHANTE
        // ===============================
        this.ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = 'rgba(255, 0, 0, 1)';
        this.ctx.shadowBlur = 25;
        this.ctx.strokeRect(barrier.x, barrier.y, barrier.width, barrier.height);
        this.ctx.shadowBlur = 0;
        
        // ===============================
        // BARRA DE HP (VERTICAL)
        // ===============================
        const hpBarHeight = barrier.height * 0.8;
        const hpBarWidth = 10;
        const hpBarX = barrier.x - 25;
        const hpBarY = barrier.y + (barrier.height - hpBarHeight) / 2;
        const hpPercent = barrier.hp / barrier.maxHp;
        
        // Fundo
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
        
        // HP atual (de baixo pra cima)
        const hpGradient = this.ctx.createLinearGradient(
            hpBarX, hpBarY + hpBarHeight,
            hpBarX, hpBarY
        );
        hpGradient.addColorStop(0, 'rgba(139, 0, 0, 0.9)');
        hpGradient.addColorStop(1, 'rgba(255, 0, 0, 0.9)');
        
        this.ctx.fillStyle = hpGradient;
        this.ctx.fillRect(
            hpBarX,
            hpBarY + hpBarHeight * (1 - hpPercent),
            hpBarWidth,
            hpBarHeight * hpPercent
        );
        
        // Contorno
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
        
        // Texto de HP
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `${barrier.hp.toFixed(0)}`,
            hpBarX + hpBarWidth / 2,
            hpBarY - 10
        );
        
        // ===============================
        // SÍMBOLO DE REFLEXÃO NO CENTRO
        // ===============================
        const centerY = barrier.y + barrier.height / 2;
        const symbolPulse = 0.7 + Math.sin(time * 4) * 0.3;
        
        this.ctx.fillStyle = `rgba(255, 200, 200, ${alpha * symbolPulse})`;
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(255, 0, 0, 1)';
        this.ctx.shadowBlur = 20;
        this.ctx.fillText('🔄', barrier.x + barrier.width / 2, centerY);
        this.ctx.shadowBlur = 0;
        
        this.ctx.restore();
    }
});

        // ===============================
        // 🟪 JOIA DO PODER (FORA DO TRANSLATE)
        // ===============================
// 🟪 EFEITO DA JOIA DO PODER (VISUAL COMPLEXO E ROXO)
if (champion.type === 'infinityultron' && champion.powerStoneActive) {
    const data = Champion.championData.infinityultron;
    const powerTime = Date.now() / 1000;
    const powerProgress = (Date.now() - (champion.powerStoneEndTime - data.powerStone.duration)) / data.powerStone.duration;
    
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    
    // ===============================
    // NÚCLEO ROXO PULSANTE INTENSO
    // ===============================
    const coreSize = 40 + Math.sin(powerTime * 8) * 15;
    const coreGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);
    coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 - powerProgress * 0.2})`);
    coreGradient.addColorStop(0.3, `rgba(200, 100, 255, ${0.8 - powerProgress * 0.2})`);
    coreGradient.addColorStop(0.6, `rgba(150, 50, 200, ${0.6 - powerProgress * 0.2})`);
    coreGradient.addColorStop(1, `rgba(100, 0, 150, 0)`);
    
    this.ctx.fillStyle = coreGradient;
    this.ctx.shadowColor = 'rgba(200, 100, 255, 1)';
    this.ctx.shadowBlur = 40;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    
    // ===============================
    // ANÉIS DE ENERGIA COMPLEXOS
    // ===============================
    for (let ring = 0; ring < 5; ring++) {
        const ringRadius = 50 + ring * 20;
        const ringRotation = powerTime * (1 + ring * 0.3);
        const ringAlpha = (0.7 - powerProgress * 0.3) * (1 - ring * 0.15);
        
        // Anel tracejado rotativo
        this.ctx.save();
        this.ctx.rotate(ringRotation);
        
        this.ctx.strokeStyle = `rgba(${ring % 2 === 0 ? '200, 100, 255' : '150, 50, 200'}, ${ringAlpha})`;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([15, 10]);
        this.ctx.shadowColor = 'rgba(200, 100, 255, 0.8)';
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        this.ctx.restore();
        
        // Marcadores nos anéis
        for (let m = 0; m < 8; m++) {
            const markerAngle = (Math.PI * 2 / 8) * m + ringRotation;
            const mx = Math.cos(markerAngle) * ringRadius;
            const my = Math.sin(markerAngle) * ringRadius;
            
            this.ctx.fillStyle = `rgba(255, 150, 255, ${ringAlpha})`;
            this.ctx.shadowColor = 'rgba(200, 100, 255, 1)';
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(mx, my, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    this.ctx.shadowBlur = 0;
    
    // ===============================
    // RAIOS DE PODER EM ESPIRAL
    // ===============================
    for (let ray = 0; ray < 12; ray++) {
        const rayAngle = (Math.PI * 2 / 12) * ray + powerTime * 2;
        const rayLength = 70 + Math.sin(powerTime * 6 + ray) * 20;
        const rayAlpha = (0.8 - powerProgress * 0.3) * (0.7 + Math.sin(powerTime * 8 + ray) * 0.3);
        
        const rayGradient = this.ctx.createLinearGradient(
            0, 0,
            Math.cos(rayAngle) * rayLength,
            Math.sin(rayAngle) * rayLength
        );
        rayGradient.addColorStop(0, `rgba(200, 100, 255, ${rayAlpha})`);
        rayGradient.addColorStop(0.5, `rgba(150, 50, 200, ${rayAlpha * 0.7})`);
        rayGradient.addColorStop(1, `rgba(100, 0, 150, 0)`);
        
        this.ctx.strokeStyle = rayGradient;
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = 'rgba(200, 100, 255, 0.8)';
        this.ctx.shadowBlur = 15;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(Math.cos(rayAngle) * rayLength, Math.sin(rayAngle) * rayLength);
        this.ctx.stroke();
    }
    
    this.ctx.shadowBlur = 0;
    
    // ===============================
    // PARTÍCULAS ORBITAIS ROXAS
    // ===============================
    for (let p = 0; p < 20; p++) {
        const particleAngle = powerTime * 4 + (Math.PI * 2 / 20) * p;
        const particleDist = 50 + Math.sin(powerTime * 6 + p) * 15;
        const px = Math.cos(particleAngle) * particleDist;
        const py = Math.sin(particleAngle) * particleDist;
        const particleSize = 5 + Math.sin(powerTime * 8 + p) * 3;
        
        const particleGradient = this.ctx.createRadialGradient(px, py, 0, px, py, particleSize);
        particleGradient.addColorStop(0, `rgba(255, 200, 255, ${0.9 - powerProgress * 0.3})`);
        particleGradient.addColorStop(0.5, `rgba(200, 100, 255, ${0.7 - powerProgress * 0.2})`);
        particleGradient.addColorStop(1, `rgba(150, 50, 200, 0)`);
        
        this.ctx.fillStyle = particleGradient;
        this.ctx.shadowColor = 'rgba(200, 100, 255, 1)';
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        this.ctx.arc(px, py, particleSize, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    this.ctx.shadowBlur = 0;
    
    // ===============================
    // ONDAS EXPANSIVAS COMPLEXAS
    // ===============================
    for (let w = 0; w < 4; w++) {
        const waveProgress = (powerTime * 3 + w * 0.25) % 1;
        const waveRadius = 30 + waveProgress * 80;
        const waveAlpha = (0.6 - powerProgress * 0.2) * (1 - waveProgress);
        
        this.ctx.strokeStyle = `rgba(200, 100, 255, ${waveAlpha})`;
        this.ctx.lineWidth = 5;
        this.ctx.shadowColor = 'rgba(200, 100, 255, 0.8)';
        this.ctx.shadowBlur = 20;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    this.ctx.shadowBlur = 0;
    
    // ===============================
    // DISTORÇÃO ESPACIAL (FRAGMENTOS)
    // ===============================
    for (let f = 0; f < 8; f++) {
        const fragAngle = (Math.PI * 2 / 8) * f + powerTime;
        const fragDist = 60 + Math.sin(powerTime * 5 + f) * 10;
        const fx = Math.cos(fragAngle) * fragDist;
        const fy = Math.sin(fragAngle) * fragDist;
        
        this.ctx.save();
        this.ctx.translate(fx, fy);
        this.ctx.rotate(powerTime * 3 + f);
        
        this.ctx.fillStyle = `rgba(200, 100, 255, ${0.7 - powerProgress * 0.3})`;
        this.ctx.fillRect(-8, -2, 16, 4);
        this.ctx.fillRect(-2, -8, 4, 16);
        
        this.ctx.restore();
    }
    
    // ===============================
    // TEXTO INDICADOR
    // ===============================
    this.ctx.fillStyle = `rgba(255, 150, 255, ${0.9 - powerProgress * 0.2})`;
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = 'rgba(200, 100, 255, 1)';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('🟪 PODER MÁXIMO 🟪', 0, -champion.height / 2 - 55);
    this.ctx.shadowBlur = 0;
    
    this.ctx.restore();
}
        
        // ===============================
        // 🔴 JOIA DA REALIDADE
        // ===============================
        if (champion.realityStoneActive) {
            const data = Champion.championData.infinityultron;
            const realityTime = Date.now() / 1000;
            const realityProgress = (Date.now() - (champion.realityStoneEndTime - data.realityStone.duration)) / data.realityStone.duration;
            
            // Distorção espacial
            for (let wave = 0; wave < 3; wave++) {
                const waveRadius = 80 + wave * 30 + Math.sin(realityTime * 4 + wave) * 20;
                const waveAlpha = (0.5 - realityProgress * 0.3) * (1 - wave * 0.2);
                
                this.ctx.strokeStyle = `rgba(139, 0, 0, ${waveAlpha})`;
                this.ctx.lineWidth = 4;
                this.ctx.shadowColor = 'rgba(139, 0, 0, 1)';
                this.ctx.shadowBlur = 25;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            this.ctx.shadowBlur = 0;
            
            // Partículas de glitch
            for (let i = 0; i < 15; i++) {
                const glitchAngle = Math.random() * Math.PI * 2;
                const glitchDist = 50 + Math.random() * 60;
                const gx = centerX + Math.cos(glitchAngle) * glitchDist;
                const gy = centerY + Math.sin(glitchAngle) * glitchDist;
                
                this.ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255, 0, 0' : '139, 0, 0'}, ${Math.random() * 0.8})`;
                this.ctx.fillRect(gx - 3, gy - 3, 6, 6);
            }
            
            // Texto indicador
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(139, 0, 0, 1)';
            this.ctx.shadowBlur = 15;
            this.ctx.fillText(
                '🔴 REALIDADE',
                centerX,
                centerY - champion.height / 2 - 70
            );
            this.ctx.shadowBlur = 0;
        }
    }
});
    // 💬 Desenha balões de fala (SEMPRE POR ÚLTIMO)
    if (this.speechBubbles) {
        this.speechBubbles.forEach(bubble => bubble.draw(this.ctx));
    }
        // 🌀 Desenha portais
    this.portals.forEach(portal => portal.draw(this.ctx));

         // ⚖️ Desenha projéteis de divisão
    if (this.splitProjectiles) {
        this.splitProjectiles.forEach(proj => proj.draw(this.ctx));
    }

    // 💀 Desenha Lasers do Líder
if (this.leaderLasers) {
    this.leaderLasers.forEach(laser => laser.draw(this.ctx));
}

// 🌫️ Desenha Gases Venenosos
if (this.poisonGases) {
    this.poisonGases.forEach(gas => {
        const elapsed = Date.now() - gas.spawnTime;
        const progress = elapsed / gas.duration;
        const alpha = (1 - progress) * 0.5;
        
        this.ctx.save();
        
        // Nuvem de gás
        const gasGradient = this.ctx.createRadialGradient(
            gas.x, gas.y, 0,
            gas.x, gas.y, gas.radius
        );
        gasGradient.addColorStop(0, `rgba(100, 255, 100, ${alpha})`);
        gasGradient.addColorStop(0.6, `rgba(50, 200, 50, ${alpha * 0.7})`);
        gasGradient.addColorStop(1, 'rgba(0, 150, 0, 0)');
        
        this.ctx.fillStyle = gasGradient;
        this.ctx.beginPath();
        this.ctx.arc(gas.x, gas.y, gas.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Partículas de fumaça
        if (Math.random() < 0.5) {
            const smokeX = gas.x + (Math.random() - 0.5) * gas.radius * 1.5;
            const smokeY = gas.y + (Math.random() - 0.5) * gas.radius * 1.5;
            
            this.ctx.fillStyle = `rgba(50, 255, 50, ${alpha * Math.random()})`;
            this.ctx.beginPath();
            this.ctx.arc(smokeX, smokeY, 5 + Math.random() * 10, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    });
}

// 🌫️ Desenha Ilusões do Mistério
this.enemies.forEach(enemy => {
    if (enemy.executorType === 'mystery' && enemy.illusions) {
        enemy.illusions.forEach(illusion => {
            this.ctx.save();
            this.ctx.globalAlpha = illusion.alpha;
            
            // ✅ DESENHA A IMAGEM DO EXECUTOR
            if (illusion.image && illusion.image.complete && !illusion.image.isFallback) {
                this.ctx.drawImage(
                    illusion.image,
                    illusion.x - illusion.radius,
                    illusion.y - illusion.radius,
                    illusion.radius * 2,
                    illusion.radius * 2
                );
            } else {
                // Fallback: círculo roxo
                this.ctx.fillStyle = 'rgba(138, 43, 226, 0.8)';
                this.ctx.beginPath();
                this.ctx.arc(illusion.getCenterX(), illusion.getCenterY(), illusion.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // Contorno brilhante
            this.ctx.strokeStyle = 'rgba(200, 100, 255, 1)';
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = 'rgba(138, 43, 226, 0.8)';
            this.ctx.shadowBlur = 15;
            this.ctx.strokeRect(
                illusion.x - illusion.radius,
                illusion.y - illusion.radius,
                illusion.radius * 2,
                illusion.radius * 2
            );
            this.ctx.shadowBlur = 0;
            
            // "?" no centro
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('?', illusion.getCenterX(), illusion.getCenterY());
            
            // Barra de HP
            const hpBarWidth = illusion.radius * 2;
            const hpBarHeight = 4;
            const hpBarX = illusion.x;
            const hpBarY = illusion.y - 10;
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
            
            const hpPercent = illusion.hp / illusion.maxHp;
            this.ctx.fillStyle = 'rgba(138, 43, 226, 0.9)';
            this.ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);
            
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
            
            this.ctx.restore();
        });
    }
});

// 💀 Desenha Abomináveis (transformados)
this.enemies.forEach(enemy => {
    if (enemy.isAbomination) {
        // Aura de radiação
        const radiationSize = enemy.radiationRadius + Math.sin(Date.now() / 200) * 10;
        const radiationGradient = this.ctx.createRadialGradient(
            enemy.getCenterX(), enemy.getCenterY(), 0,
            enemy.getCenterX(), enemy.getCenterY(), radiationSize
        );
        radiationGradient.addColorStop(0, 'rgba(0, 255, 0, 0.4)');
        radiationGradient.addColorStop(0.7, 'rgba(0, 200, 0, 0.2)');
        radiationGradient.addColorStop(1, 'rgba(0, 150, 0, 0)');
        
        this.ctx.fillStyle = radiationGradient;
        this.ctx.beginPath();
        this.ctx.arc(enemy.getCenterX(), enemy.getCenterY(), radiationSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Símbolo de radiação
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 255, 0, 1)';
        this.ctx.shadowBlur = 15;
        this.ctx.fillText('☢️', enemy.getCenterX(), enemy.getCenterY() - enemy.radius - 30);
        this.ctx.shadowBlur = 0;
        
        // Partículas verdes
        if (Math.random() < 0.3) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * enemy.radiationRadius;
            this.effects.push(new this.AuraFireParticleEffect(
                enemy.getCenterX() + Math.cos(angle) * dist,
                enemy.getCenterY() + Math.sin(angle) * dist,
                8,
                'lime',
                600
            ));
        }
    }
});
 
        // Desenha inimigos
        this.enemies.forEach(enemy => enemy.draw(this.ctx));

        // Desenha inimigos
this.enemies.forEach(enemy => {
    // Desenha o inimigo normalmente
    enemy.draw(this.ctx);
    
    // ⏳ VISUAL DE CONGELAMENTO TEMPORAL
    if (enemy.isFrozenByTime) {
        this.ctx.save();
        
        const time = Date.now() / 1000;
        const centerX = enemy.getCenterX();
        const centerY = enemy.getCenterY();
        
        // ===============================
        // AURA VERDE PULSANTE
        // ===============================
        const pulseSize = enemy.radius * 2 + Math.sin(time * 6) * 8;
        const auraGradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, pulseSize
        );
        auraGradient.addColorStop(0, 'rgba(50, 255, 50, 0.4)');
        auraGradient.addColorStop(0.5, 'rgba(0, 255, 0, 0.3)');
        auraGradient.addColorStop(1, 'rgba(0, 200, 0, 0)');
        
        this.ctx.fillStyle = auraGradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // ===============================
        // ANÉIS TEMPORAIS ROTATIVOS
        // ===============================
        for (let r = 0; r < 3; r++) {
            const ringRadius = enemy.radius * (1.2 + r * 0.4);
            const ringRotation = time * (2 + r * 0.5);
            
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(ringRotation);
            
            this.ctx.strokeStyle = `rgba(50, 255, 50, ${0.6 - r * 0.15})`;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.shadowColor = 'rgba(0, 255, 0, 0.8)';
            this.ctx.shadowBlur = 10;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            this.ctx.setLineDash([]);
            this.ctx.restore();
        }
        
        this.ctx.shadowBlur = 0;
        
        // ===============================
        // CRISTAIS DE TEMPO
        // ===============================
        for (let c = 0; c < 6; c++) {
            const crystalAngle = (Math.PI * 2 / 6) * c + time * 2;
            const crystalDist = enemy.radius * 1.5;
            const cx = centerX + Math.cos(crystalAngle) * crystalDist;
            const cy = centerY + Math.sin(crystalAngle) * crystalDist;
            
            this.ctx.save();
            this.ctx.translate(cx, cy);
            this.ctx.rotate(time * 3 + c);
            
            this.ctx.fillStyle = `rgba(150, 255, 150, ${0.7 + Math.sin(time * 5 + c) * 0.3})`;
            this.ctx.strokeStyle = 'rgba(200, 255, 200, 0.9)';
            this.ctx.lineWidth = 1;
            this.ctx.shadowColor = 'rgba(0, 255, 0, 0.8)';
            this.ctx.shadowBlur = 8;
            
            const crystalSize = 6;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -crystalSize);
            this.ctx.lineTo(crystalSize * 0.5, 0);
            this.ctx.lineTo(0, crystalSize);
            this.ctx.lineTo(-crystalSize * 0.5, 0);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.restore();
        }
        
        this.ctx.shadowBlur = 0;
        
        // ===============================
        // SÍMBOLO DE RELÓGIO PARADO
        // ===============================
        this.ctx.save();
        this.ctx.translate(centerX, centerY - enemy.radius - 15);
        
        // Círculo do relógio
        this.ctx.strokeStyle = 'rgba(50, 255, 50, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = 'rgba(0, 255, 0, 1)';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Ponteiros parados
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(0, -7); // Ponteiro das horas
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(6, 0); // Ponteiro dos minutos
        this.ctx.stroke();
        
        this.ctx.restore();
        this.ctx.shadowBlur = 0;
        
        // ===============================
        // TEXTO "CONGELADO"
        // ===============================
        this.ctx.fillStyle = `rgba(50, 255, 50, ${0.8 + Math.sin(time * 4) * 0.2})`;
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 255, 0, 1)';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText('⏳', centerX, centerY - enemy.radius - 30);
        this.ctx.shadowBlur = 0;
        
        this.ctx.restore();
    }
});

// ⭐ NOVO: Desenha Left Wing Units (Sam/Bucky)
if (this.leftWingUnits) {
    this.leftWingUnits.forEach(unit => {
        this.ctx.save();
        this.ctx.translate(unit.x + unit.width / 2, unit.y + unit.height / 2);
        
        // ⭐ FLIP HORIZONTAL conforme direção
        if (!unit.facingRight) {
            this.ctx.scale(-1, 1);
        }
        
        // ===============================
        // IMAGEM DO HERÓI
        // ===============================
        if (unit.image.complete && !unit.image.isFallback) {
            this.ctx.drawImage(unit.image, -unit.width/2, -unit.height/2, unit.width, unit.height);
        } else {
            // Fallback
            this.ctx.fillStyle = unit.type === 'sam' ? 'darkblue' : 'gray';
            this.ctx.fillRect(-unit.width/2, -unit.height/2, unit.width, unit.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(unit.type.toUpperCase(), 0, 0);
        }
        
        // ===============================
        // EFEITO ESPECÍFICO: SAM (FALCÃO)
        // ===============================
        if (unit.type === 'sam') {
            const time = Date.now() / 1000;
            const wingSpan = 80 + Math.sin(time * 3) * 15; // ⭐ ASAS MAIORES
            const wingBeat = Math.sin(time * 5) * 10; // Batida das asas
            const wingAlpha = 0.7 + Math.sin(time * 4) * 0.2;
            
            // ⭐ ASA ESQUERDA (ESTILIZADA)
            this.ctx.save();
            this.ctx.translate(-unit.width/2, 0);
            this.ctx.rotate(-0.3 + Math.sin(time * 5) * 0.2);
            
            // Camada externa (vermelho escuro)
            this.ctx.fillStyle = `rgba(139, 0, 0, ${wingAlpha})`;
            this.ctx.strokeStyle = `rgba(180, 0, 0, ${wingAlpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.quadraticCurveTo(-wingSpan * 0.6, -25 + wingBeat, -wingSpan, -30 + wingBeat);
            this.ctx.quadraticCurveTo(-wingSpan * 0.8, -15 + wingBeat, -wingSpan * 0.4, 0);
            this.ctx.quadraticCurveTo(-wingSpan * 0.6, 15 + wingBeat, -wingSpan, 20 + wingBeat);
            this.ctx.quadraticCurveTo(-wingSpan * 0.7, 10 + wingBeat, 0, 15);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            // Detalhes das penas (linhas)
            this.ctx.strokeStyle = `rgba(200, 50, 50, ${wingAlpha * 0.8})`;
            this.ctx.lineWidth = 1.5;
            for (let f = 0; f < 5; f++) {
                const featherX = -wingSpan * (0.2 + f * 0.15);
                this.ctx.beginPath();
                this.ctx.moveTo(featherX, -20 + wingBeat);
                this.ctx.lineTo(featherX, 15 + wingBeat);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
            
            // ⭐ ASA DIREITA (ESPELHADA)
            this.ctx.save();
            this.ctx.translate(unit.width/2, 0);
            this.ctx.rotate(0.3 - Math.sin(time * 5) * 0.2);
            
            this.ctx.fillStyle = `rgba(139, 0, 0, ${wingAlpha})`;
            this.ctx.strokeStyle = `rgba(180, 0, 0, ${wingAlpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.quadraticCurveTo(wingSpan * 0.6, -25 + wingBeat, wingSpan, -30 + wingBeat);
            this.ctx.quadraticCurveTo(wingSpan * 0.8, -15 + wingBeat, wingSpan * 0.4, 0);
            this.ctx.quadraticCurveTo(wingSpan * 0.6, 15 + wingBeat, wingSpan, 20 + wingBeat);
            this.ctx.quadraticCurveTo(wingSpan * 0.7, 10 + wingBeat, 0, 15);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            
            // Detalhes das penas
            this.ctx.strokeStyle = `rgba(200, 50, 50, ${wingAlpha * 0.8})`;
            this.ctx.lineWidth = 1.5;
            for (let f = 0; f < 5; f++) {
                const featherX = wingSpan * (0.2 + f * 0.15);
                this.ctx.beginPath();
                this.ctx.moveTo(featherX, -20 + wingBeat);
                this.ctx.lineTo(featherX, 15 + wingBeat);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
            
            // ⭐ PROPULSÃO (JATOS)
            for (let j = 0; j < 4; j++) {
                const jetX = -unit.width/2 - 25 - j * 8;
                const jetY = Math.sin(time * 6 + j) * 6;
                const jetAlpha = (0.6 - j * 0.12) * wingAlpha;
                
                const jetGradient = this.ctx.createRadialGradient(jetX, jetY, 0, jetX, jetY, 8);
                jetGradient.addColorStop(0, `rgba(255, 150, 0, ${jetAlpha})`);
                jetGradient.addColorStop(0.5, `rgba(255, 100, 0, ${jetAlpha * 0.7})`);
                jetGradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
                
                this.ctx.fillStyle = jetGradient;
                this.ctx.beginPath();
                this.ctx.arc(jetX, jetY, 6, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
        } else {
            // ===============================
            // EFEITO ESPECÍFICO: BUCKY (MOTO COMPLEXA)
            // ===============================
            const time = Date.now() / 1000;
            const wheelRotation = time * 10; // Rodas girando
            const exhaustPulse = Math.sin(time * 8) * 0.3 + 0.7;
            
            const bikeLength = 50;
            const wheelRadius = 10;
            
            // ⭐ QUADRO DA MOTO (DETALHADO)
            this.ctx.save();
            this.ctx.translate(0, unit.height/2 - 10);
            
            // Chassi principal
            this.ctx.fillStyle = 'rgba(60, 60, 60, 0.95)';
            this.ctx.strokeStyle = 'rgba(120, 120, 120, 1)';
            this.ctx.lineWidth = 3;
            
            // Corpo central
            this.ctx.beginPath();
            this.ctx.roundRect(-bikeLength/2, -8, bikeLength, 12, 4);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Guidão
            this.ctx.strokeStyle = 'rgba(150, 150, 150, 1)';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(bikeLength/2 - 10, -15);
            this.ctx.lineTo(bikeLength/2, -20);
            this.ctx.lineTo(bikeLength/2 + 15, -18);
            this.ctx.stroke();
            
            // Banco
            this.ctx.fillStyle = 'rgba(80, 40, 40, 0.9)';
            this.ctx.beginPath();
            this.ctx.ellipse(-5, -10, 15, 8, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Detalhes metálicos
            this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.8)';
            this.ctx.lineWidth = 2;
            for (let d = 0; d < 3; d++) {
                this.ctx.beginPath();
                this.ctx.moveTo(-bikeLength/2 + d * 15, -5);
                this.ctx.lineTo(-bikeLength/2 + d * 15, 5);
                this.ctx.stroke();
            }
            
            // ⭐ RODAS (COMPLEXAS)
            const drawWheel = (x, y) => {
                // Pneu
                this.ctx.fillStyle = 'rgba(30, 30, 30, 1)';
                this.ctx.strokeStyle = 'rgba(80, 80, 80, 1)';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(x, y, wheelRadius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Aro (girando)
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(wheelRotation);
                
                // Raios
                this.ctx.strokeStyle = 'rgba(150, 150, 150, 0.9)';
                this.ctx.lineWidth = 2;
                for (let r = 0; r < 6; r++) {
                    const angle = (Math.PI * 2 / 6) * r;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, 0);
                    this.ctx.lineTo(Math.cos(angle) * (wheelRadius - 2), Math.sin(angle) * (wheelRadius - 2));
                    this.ctx.stroke();
                }
                
                // Centro
                this.ctx.fillStyle = 'rgba(200, 200, 200, 1)';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 4, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            };
            
            // Roda traseira
            drawWheel(-bikeLength/2 + 8, 15);
            
            // Roda dianteira
            drawWheel(bikeLength/2 - 8, 15);
            
            // ⭐ ESCAPE (FOGO E FUMAÇA)
            for (let e = 0; e < 6; e++) {
                const exhaustX = -bikeLength/2 - 15 - e * 10;
                const exhaustY = 8 + Math.sin(time * 12 + e) * 4;
                const exhaustSize = 8 - e * 1;
                const exhaustAlpha = (0.8 - e * 0.12) * exhaustPulse;
                
                // Chamas
                if (e < 3) {
                    const flameGradient = this.ctx.createRadialGradient(exhaustX, exhaustY, 0, exhaustX, exhaustY, exhaustSize);
                    flameGradient.addColorStop(0, `rgba(255, 255, 100, ${exhaustAlpha})`);
                    flameGradient.addColorStop(0.3, `rgba(255, 150, 0, ${exhaustAlpha * 0.8})`);
                    flameGradient.addColorStop(0.7, `rgba(255, 50, 0, ${exhaustAlpha * 0.5})`);
                    flameGradient.addColorStop(1, `rgba(100, 0, 0, 0)`);
                    
                    this.ctx.fillStyle = flameGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(exhaustX, exhaustY, exhaustSize, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // Fumaça
                if (e >= 3) {
                    this.ctx.fillStyle = `rgba(100, 100, 100, ${exhaustAlpha * 0.4})`;
                    this.ctx.beginPath();
                    this.ctx.arc(exhaustX, exhaustY, exhaustSize * 1.2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
            
            // ⭐ FAÍSCAS DO CHÃO
            if (Math.random() < 0.3) {
                for (let s = 0; s < 3; s++) {
                    const sparkX = -bikeLength/2 - Math.random() * 20;
                    const sparkY = 25 + Math.random() * 10;
                    
                    this.ctx.strokeStyle = `rgba(255, 200, 0, ${Math.random()})`;
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(sparkX, sparkY);
                    this.ctx.lineTo(sparkX - 5, sparkY + 5);
                    this.ctx.stroke();
                }
            }
            
            this.ctx.restore();
        }
        
        // ===============================
        // TIMER E INFO
        // ===============================
        const timeLeft = (unit.duration - (Date.now() - unit.spawnTime)) / 1000;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 5;
        this.ctx.fillText(`${timeLeft.toFixed(0)}s`, 0, -unit.height/2 - 15);
        this.ctx.shadowBlur = 0;
        
        // Contador de inimigos
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText(`🎯 ${unit.capturedEnemies.length}`, 0, -unit.height/2 - 30);
        
        this.ctx.restore();
        
        // ===============================
        // LINHAS CONECTANDO AOS INIMIGOS
        // ===============================
        unit.capturedEnemies.forEach((captured, index) => {
            const enemy = captured.enemy;
            if (enemy.hp > 0) {
                this.ctx.save();
                
                // Linha tracejada com gradiente
                const gradient = this.ctx.createLinearGradient(
                    unit.getCenterX(), unit.getCenterY(),
                    enemy.getCenterX(), enemy.getCenterY()
                );
                gradient.addColorStop(0, 'rgba(0, 150, 255, 0.7)');
                gradient.addColorStop(1, 'rgba(0, 100, 200, 0.3)');
                
                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([8, 8]);
                this.ctx.beginPath();
                this.ctx.moveTo(unit.getCenterX(), unit.getCenterY());
                this.ctx.lineTo(enemy.getCenterX(), enemy.getCenterY());
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                
                // Pulsos de energia
                const pulseProgress = (Date.now() % 1500) / 1500;
                const pulseX = unit.getCenterX() + (enemy.getCenterX() - unit.getCenterX()) * pulseProgress;
                const pulseY = unit.getCenterY() + (enemy.getCenterY() - unit.getCenterY()) * pulseProgress;
                
                this.ctx.fillStyle = 'rgba(100, 200, 255, 0.9)';
                this.ctx.shadowColor = 'rgba(0, 150, 255, 1)';
                this.ctx.shadowBlur = 15;
                this.ctx.beginPath();
                this.ctx.arc(pulseX, pulseY, 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
                
                this.ctx.restore();
            }
        });
    });
}


// 👤 Desenha Clones de Loki
if (this.lokiClones) {
    this.lokiClones.forEach(clone => {
        const opacity = 0.7 + Math.sin(Date.now() / 150) * 0.15;
        
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        
        // Imagem do clone
        if (clone.image && clone.image.complete) {
            this.ctx.drawImage(clone.image, clone.x, clone.y, clone.width, clone.height);
        } else {
            // Fallback
            this.ctx.fillStyle = 'rgba(139, 0, 139, 0.8)';
            this.ctx.fillRect(clone.x, clone.y, clone.width, clone.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CLONE', clone.getCenterX(), clone.getCenterY());
        }
        
        this.ctx.globalAlpha = 1;
        
        // Borda roxa pulsante
        this.ctx.strokeStyle = `rgba(200, 100, 255, ${opacity})`;
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = 'rgba(200, 100, 255, 0.8)';
        this.ctx.shadowBlur = 10;
        this.ctx.strokeRect(clone.x, clone.y, clone.width, clone.height);
        this.ctx.shadowBlur = 0;
        
        // Barra de HP
        const hpBarWidth = clone.width;
        const hpBarHeight = 4;
        const hpBarX = clone.x;
        const hpBarY = clone.y - 10;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
        
        const hpPercent = clone.hp / clone.maxHp;
        this.ctx.fillStyle = hpPercent > 0.6 ? 'lime' : (hpPercent > 0.3 ? 'orange' : 'red');
        this.ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
        
        // Indicador de "CLONE"
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = 'rgba(200, 100, 255, 0.9)';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(200, 100, 255, 1)';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText('CLONE', clone.getCenterX(), clone.y - 20);
        this.ctx.shadowBlur = 0;
        
        this.ctx.restore();
    });
}


        // ⭐ CAMPOS GRAVITACIONAIS MELHORADOS
        if (this.gravityFields) {
            this.gravityFields.forEach(field => {
                const progress = (Date.now() - field.spawnTime) / (field.endTime - field.spawnTime);
                const alpha = 0.7 - progress * 0.4;
                
        this.ctx.save();
        
        // ===============================
        // SINGULARIDADE CENTRAL
        // ===============================
        const coreSize = 15 + Math.sin(Date.now() / 100) * 5;
        const coreGradient = this.ctx.createRadialGradient(
            field.x, field.y, 0, 
            field.x, field.y, coreSize
        );
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        coreGradient.addColorStop(0.4, `rgba(200, 0, 200, ${alpha * 0.9})`);
        coreGradient.addColorStop(1, `rgba(100, 0, 100, ${alpha * 0.5})`);
        
        this.ctx.fillStyle = coreGradient;
        this.ctx.shadowColor = 'rgba(200, 0, 200, 0.8)';
        this.ctx.shadowBlur = 25;
        this.ctx.beginPath();
        this.ctx.arc(field.x, field.y, coreSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // ===============================
        // ZONA DE CRUSH (VERMELHO)
        // ===============================
        const crushGradient = this.ctx.createRadialGradient(
            field.x, field.y, 0,
            field.x, field.y, field.crushRadius
        );
        crushGradient.addColorStop(0, `rgba(255, 0, 0, ${alpha * 0.4})`);
        crushGradient.addColorStop(1, `rgba(139, 0, 0, 0)`);
        
        this.ctx.fillStyle = crushGradient;
        this.ctx.beginPath();
        this.ctx.arc(field.x, field.y, field.crushRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // ===============================
        // ANÉIS ORBITAIS
        // ===============================
        const numRings = 5;
        for (let r = 1; r <= numRings; r++) {
            const ringRadius = (field.radius / numRings) * r;
            const ringAlpha = alpha * (0.6 - r * 0.1);
            const rotation = (Date.now() / 1000) * r * 0.3;
            
            this.ctx.strokeStyle = `rgba(139, 0, 139, ${ringAlpha})`;
            this.ctx.lineWidth = 2;
            
            // Anel tracejado
            this.ctx.setLineDash([10, 10]);
            this.ctx.beginPath();
            this.ctx.arc(field.x, field.y, ringRadius, rotation, rotation + Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            // Marcadores nos anéis
            for (let m = 0; m < 8; m++) {
                const markerAngle = (Math.PI * 2 / 8) * m + rotation;
                const mx = field.x + Math.cos(markerAngle) * ringRadius;
                const my = field.y + Math.sin(markerAngle) * ringRadius;
                
                this.ctx.fillStyle = `rgba(200, 0, 200, ${ringAlpha})`;
                this.ctx.beginPath();
                this.ctx.arc(mx, my, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // ===============================
        // PARTÍCULAS GRAVITACIONAIS
        // ===============================
        field.particles.forEach(p => {
            const px = field.x + Math.cos(p.angle) * p.distance;
            const py = field.y + Math.sin(p.angle) * p.distance;
            const particleAlpha = alpha * p.alpha;
            
            // Trilha da partícula
            this.ctx.strokeStyle = `rgba(147, 112, 219, ${particleAlpha * 0.5})`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(px, py);
            const trailAngle = p.angle - 0.3;
            const trailDist = p.distance + 10;
            this.ctx.lineTo(
                field.x + Math.cos(trailAngle) * trailDist,
                field.y + Math.sin(trailAngle) * trailDist
            );
            this.ctx.stroke();
            
            // Partícula
            const particleGradient = this.ctx.createRadialGradient(
                px, py, 0, px, py, p.size
            );
            particleGradient.addColorStop(0, `rgba(200, 150, 255, ${particleAlpha})`);
            particleGradient.addColorStop(1, `rgba(100, 0, 150, 0)`);
            
            this.ctx.fillStyle = particleGradient;
            this.ctx.beginPath();
            this.ctx.arc(px, py, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // ===============================
        // LINHAS DE CAMPO
        // ===============================
        this.ctx.strokeStyle = `rgba(139, 0, 139, ${alpha * 0.3})`;
        this.ctx.lineWidth = 1;
        for (let l = 0; l < 12; l++) {
            const lineAngle = (Math.PI * 2 / 12) * l;
            this.ctx.beginPath();
            this.ctx.moveTo(
                field.x + Math.cos(lineAngle) * field.crushRadius,
                field.y + Math.sin(lineAngle) * field.crushRadius
            );
            this.ctx.lineTo(
                field.x + Math.cos(lineAngle) * field.radius,
                field.y + Math.sin(lineAngle) * field.radius
            );
            this.ctx.stroke();
        }
        
        // ===============================
        // TEXTO DE AVISO
        // ===============================
        if (progress < 0.3) {
            this.ctx.fillStyle = `rgba(255, 0, 255, ${alpha * (1 - progress * 3)})`;
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(255, 0, 255, 0.8)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText('⚠️ SINGULARIDADE ⚠️', field.x, field.y - field.radius - 10);
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.restore();
    });
}
// ⭐ NOVO: Nano-cordas
// ⭐ NANO-CORDAS MELHORADAS
if (this.cordGroups) {
    this.cordGroups.forEach(group => {
        const progress = (Date.now() - group.spawnTime) / (group.endTime - group.spawnTime);
        const alpha = 0.8 - progress * 0.5;
        
        this.ctx.save();
        
        // ===============================
        // NÓDULO CENTRAL
        // ===============================
        const nodeSize = 15 + Math.sin(Date.now() / 150) * 5;
        const nodeGradient = this.ctx.createRadialGradient(
            group.centerX, group.centerY, 0,
            group.centerX, group.centerY, nodeSize
        );
        nodeGradient.addColorStop(0, `rgba(200, 150, 255, ${alpha})`);
        nodeGradient.addColorStop(0.6, `rgba(147, 112, 219, ${alpha * 0.7})`);
        nodeGradient.addColorStop(1, `rgba(100, 50, 150, 0)`);
        
        this.ctx.fillStyle = nodeGradient;
        this.ctx.shadowColor = 'rgba(147, 112, 219, 0.8)';
        this.ctx.shadowBlur = 20;
        this.ctx.beginPath();
        this.ctx.arc(group.centerX, group.centerY, nodeSize, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // ===============================
        // CORDAS PRINCIPAIS (CENTRO → INIMIGOS)
        // ===============================
        group.enemies.forEach((enemy, index) => {
            if (enemy.hp <= 0) return;
            
            const ex = enemy.getCenterX();
            const ey = enemy.getCenterY();
            
            // Corda principal (múltiplas camadas)
            for (let layer = 0; layer < 3; layer++) {
                const thickness = (3 - layer) * 2;
                const layerAlpha = alpha * (1 - layer * 0.3);
                
                this.ctx.strokeStyle = `rgba(147, 112, 219, ${layerAlpha})`;
                this.ctx.lineWidth = thickness;
                this.ctx.shadowColor = 'rgba(147, 112, 219, 0.6)';
                this.ctx.shadowBlur = 8;
                
                this.ctx.beginPath();
                this.ctx.moveTo(group.centerX, group.centerY);
                
                // Linha ondulada
                const segments = 10;
                for (let s = 1; s <= segments; s++) {
                    const t = s / segments;
                    const midX = group.centerX + (ex - group.centerX) * t;
                    const midY = group.centerY + (ey - group.centerY) * t;
                    const wave = Math.sin(t * Math.PI * 4 + group.wavePhase) * 5;
                    
                    const angle = Math.atan2(ey - group.centerY, ex - group.centerX);
                    const perpX = midX + Math.cos(angle + Math.PI / 2) * wave;
                    const perpY = midY + Math.sin(angle + Math.PI / 2) * wave;
                    
                    this.ctx.lineTo(perpX, perpY);
                }
                
                this.ctx.stroke();
            }
            
            // Pulso de energia viajando pela corda
            const pulseProgress = (Date.now() % 2000) / 2000;
            const pulseX = group.centerX + (ex - group.centerX) * pulseProgress;
            const pulseY = group.centerY + (ey - group.centerY) * pulseProgress;
            
            const pulseGradient = this.ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, 8);
            pulseGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            pulseGradient.addColorStop(1, `rgba(200, 150, 255, 0)`);
            
            this.ctx.fillStyle = pulseGradient;
            this.ctx.beginPath();
            this.ctx.arc(pulseX, pulseY, 8, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.shadowBlur = 0;
        
        // ===============================
        // CORDAS SECUNDÁRIAS (INIMIGO ↔ INIMIGO)
        // ===============================
        for (let i = 0; i < group.enemies.length; i++) {
            for (let j = i + 1; j < group.enemies.length; j++) {
                const e1 = group.enemies[i];
                const e2 = group.enemies[j];
                
                if (e1.hp > 0 && e2.hp > 0) {
                    this.ctx.strokeStyle = `rgba(147, 112, 219, ${alpha * 0.4})`;
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([5, 5]);
                    this.ctx.beginPath();
                    this.ctx.moveTo(e1.getCenterX(), e1.getCenterY());
                    this.ctx.lineTo(e2.getCenterX(), e2.getCenterY());
                    this.ctx.stroke();
                    this.ctx.setLineDash([]);
                }
            }
        }
        
        // ===============================
        // INDICADOR DE DANO COMPARTILHADO
        // ===============================
        if (group.totalDamageShared > 0) {
            this.ctx.fillStyle = `rgba(255, 100, 255, ${alpha})`;
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(255, 0, 255, 0.8)';
            this.ctx.shadowBlur = 8;
            this.ctx.fillText(
                `⚡ ${group.totalDamageShared.toFixed(0)} compartilhado`,
                group.centerX,
                group.centerY - 25
            );
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.restore();
    });
}
        // ⭐ PHOTON BURSTS MELHORADOS
        if (this.photonBursts) {
            this.photonBursts.forEach(burst => {
                const elapsed = Date.now() - burst.spawnTime;
                const phase = burst.phases[burst.currentPhase];
                const phaseProgress = elapsed / burst.duration;
                const alpha = phase.intensity * (1 - phaseProgress);
                
                this.ctx.save();
                
                // ===============================
                // NÚCLEO PHOTON// ===============================
        const coreSize = 25 + Math.sin(Date.now() / 80) * 8;
        const coreGradient = this.ctx.createRadialGradient(
        burst.x, burst.y, 0,
        burst.x, burst.y, coreSize
        );
            if (phase.color === 'white') {
                coreGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                coreGradient.addColorStop(0.4, `rgba(255, 255, 200, ${alpha * 0.8})`);
                coreGradient.addColorStop(1, `rgba(255, 200, 100, 0)`);
            } else if (phase.color === 'gold') {
                coreGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
                coreGradient.addColorStop(0.3, `rgba(255, 215, 0, ${alpha})`);
                coreGradient.addColorStop(1, `rgba(255, 165, 0, 0)`);
            } else {
                coreGradient.addColorStop(0, `rgba(200, 230, 255, ${alpha})`);
                coreGradient.addColorStop(0.5, `rgba(173, 216, 230, ${alpha * 0.6})`);
                coreGradient.addColorStop(1, `rgba(135, 206, 235, 0)`);
            }
            
            this.ctx.fillStyle = coreGradient;
            this.ctx.shadowColor = phase.color === 'white' ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 215, 0, 0.8)';
            this.ctx.shadowBlur = 40;
            this.ctx.beginPath();
            this.ctx.arc(burst.x, burst.y, coreSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
            
            // ===============================
            // ONDAS EXPANSIVAS DE LUZ
            // ===============================
            burst.waves.forEach((wave, index) => {
                if (wave.radius > 0 && wave.radius <= wave.maxRadius) {
                    const waveAlpha = alpha * wave.alpha * (1 - wave.radius / wave.maxRadius);
                    
                    // Onda preenchida
                    const waveGradient = this.ctx.createRadialGradient(
                        burst.x, burst.y, wave.radius * 0.8,
                        burst.x, burst.y, wave.radius
                    );
                    
                    if (index % 2 === 0) {
                        waveGradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
                        waveGradient.addColorStop(0.5, `rgba(255, 255, 200, ${waveAlpha * 0.3})`);
                        waveGradient.addColorStop(1, `rgba(255, 215, 0, 0)`);
                    } else {
                        waveGradient.addColorStop(0, `rgba(255, 215, 0, 0)`);
                        waveGradient.addColorStop(0.5, `rgba(255, 245, 100, ${waveAlpha * 0.3})`);
                        waveGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
                    }
                    
                    this.ctx.fillStyle = waveGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(burst.x, burst.y, wave.radius, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // Contorno brilhante
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${waveAlpha})`;
                    this.ctx.lineWidth = 3;
                    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                    this.ctx.shadowBlur = 15;
                    this.ctx.beginPath();
                    this.ctx.arc(burst.x, burst.y, wave.radius, 0, Math.PI * 2);
                    this.ctx.stroke();
                    this.ctx.shadowBlur = 0;
                }
            });
            
            // ===============================
            // PARTÍCULAS DE FÓTONS
            // ===============================
            burst.photons.forEach((photon, index) => {
                if (photon.distance <= photon.maxDistance) {
                    const px = burst.x + Math.cos(photon.angle) * photon.distance;
                    const py = burst.y + Math.sin(photon.angle) * photon.distance;
                    const photonAlpha = alpha * (1 - photon.distance / photon.maxDistance);
                    
                    // Trilha do fóton
                    const trailLength = 15;
                    const trailGradient = this.ctx.createLinearGradient(
                        px, py,
                        px - Math.cos(photon.angle) * trailLength,
                        py - Math.sin(photon.angle) * trailLength
                    );
                    
                    if (photon.color === 'white') {
                        trailGradient.addColorStop(0, `rgba(255, 255, 255, ${photonAlpha})`);
                        trailGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
                    } else {
                        trailGradient.addColorStop(0, `rgba(255, 215, 0, ${photonAlpha})`);
                        trailGradient.addColorStop(1, `rgba(255, 165, 0, 0)`);
                    }
                    
                    this.ctx.strokeStyle = trailGradient;
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(px, py);
                    this.ctx.lineTo(
                        px - Math.cos(photon.angle) * trailLength,
                        py - Math.sin(photon.angle) * trailLength
                    );
                    this.ctx.stroke();
                    
                    // Fóton
                    const photonGradient = this.ctx.createRadialGradient(
                        px, py, 0,
                        px, py, photon.size
                    );
                    photonGradient.addColorStop(0, `rgba(255, 255, 255, ${photonAlpha})`);
                    photonGradient.addColorStop(0.5, photon.color === 'white' 
                        ? `rgba(255, 255, 200, ${photonAlpha * 0.8})` 
                        : `rgba(255, 215, 0, ${photonAlpha * 0.8})`);
                    photonGradient.addColorStop(1, `rgba(255, 200, 100, 0)`);
                    
                    this.ctx.fillStyle = photonGradient;
                    this.ctx.shadowColor = photon.color === 'white' ? 'white' : 'gold';
                    this.ctx.shadowBlur = 10;
                    this.ctx.beginPath();
                    this.ctx.arc(px, py, photon.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                }
            });
            
            // ===============================
            // RAIOS DE LUZ
            // ===============================
            if (burst.currentPhase === 0) {
                const numRays = 24;
                for (let r = 0; r < numRays; r++) {
                    const rayAngle = (Math.PI * 2 / numRays) * r;
                    const rayLength = burst.radius * (0.5 + Math.sin(Date.now() / 100 + r) * 0.3);
                    
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
                    this.ctx.lineWidth = 3;
                    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                    this.ctx.shadowBlur = 20;
                    this.ctx.beginPath();
                    this.ctx.moveTo(burst.x, burst.y);
                    this.ctx.lineTo(
                        burst.x + Math.cos(rayAngle) * rayLength,
                        burst.y + Math.sin(rayAngle) * rayLength
                    );
                    this.ctx.stroke();
                    this.ctx.shadowBlur = 0;
                }
            }
            
            // ===============================
            // EFEITO DE DISTORÇÃO
            // ===============================
            if (burst.currentPhase <= 1) {
                const distortionRadius = burst.radius * 0.3;
                const distortionGradient = this.ctx.createRadialGradient(
                    burst.x, burst.y, 0,
                    burst.x, burst.y, distortionRadius
                );
                distortionGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.4})`);
                distortionGradient.addColorStop(0.7, `rgba(255, 255, 255, ${alpha * 0.2})`);
                distortionGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
                
                this.ctx.fillStyle = distortionGradient;
                this.ctx.beginPath();
                this.ctx.arc(burst.x, burst.y, distortionRadius, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // ===============================
            // TEXTO DE AVISO
            // ===============================
            if (phaseProgress < 0.2) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * (1 - phaseProgress * 5)})`;
                this.ctx.font = 'bold 18px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = 'rgba(255, 255, 255, 1)';
                this.ctx.shadowBlur = 20;
                this.ctx.fillText('⚠️ FLASH PHOTON ⚠️', burst.x, burst.y - burst.radius - 15);
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.restore();
        });
        }
        // Desenha projéteis
        this.projectiles.forEach(projectile => {
            // NOVO: Visual especial para Escudo Carregado do US Agent
            if (projectile.type === 'usagentChargedShield') {
                const ctx = this.ctx;
                const usagentShieldImage = this.images.usagentShield;
                
                ctx.save();
                ctx.translate(projectile.x, projectile.y);
                ctx.rotate(projectile.rotation || 0);
                
                // Brilho de energia vermelha pulsante
                const glowSize = 35 + Math.sin(Date.now() / 100) * 5;
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
                gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
                gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.4)');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Raios de energia
                const rayCount = 8;
                for (let i = 0; i < rayCount; i++) {
                    const rayAngle = (Math.PI * 2 / rayCount) * i + (Date.now() / 200);
                    const rayLength = 25 + Math.sin(Date.now() / 150 + i) * 5;
                    
                    ctx.strokeStyle = `rgba(255, 50, 0, ${0.6 + Math.sin(Date.now() / 100 + i) * 0.3})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(rayAngle) * 15, Math.sin(rayAngle) * 15);
                    ctx.lineTo(Math.cos(rayAngle) * rayLength, Math.sin(rayAngle) * rayLength);
                    ctx.stroke();
                }
                
                // Desenha o escudo
                if (usagentShieldImage && usagentShieldImage.complete) {
                    ctx.drawImage(usagentShieldImage, -20, -20, 40, 40);
                } else {
                    // Fallback se a imagem não carregar
                    ctx.fillStyle = 'rgba(192, 192, 192, 0.9)';
                    ctx.beginPath();
                    ctx.arc(0, 0, 20, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
                
                ctx.restore();
            } else {
                // Desenho normal de outros projéteis
                projectile.draw(
                    this.ctx, 
                    this.images.mjolnir, 
                    this.images.capShield, 
                    this.images.usagentShield, 
                    this.images.wandaIllusion
                );
            }
        });
            
    // Desenha projéteis inimigos
// Em main.js - draw(), procure a seção de projéteis inimigos e SUBSTITUA:

// Desenha projéteis inimigos TELEGUIADOS
if (this.enemyProjectiles && this.enemyProjectiles.length > 0) {
    this.enemyProjectiles.forEach((proj, index) => {
        // Rastro de movimento
        const trailAngle = Math.atan2(proj.targetY - proj.y, proj.targetX - proj.x);
        this.ctx.save();
        this.ctx.globalAlpha = 0.5;
        this.ctx.strokeStyle = 'rgba(255, 100, 0, 0.7)';
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(proj.x, proj.y);
        this.ctx.lineTo(proj.x - Math.cos(trailAngle) * 25, proj.y - Math.sin(trailAngle) * 25);
        this.ctx.stroke();
        this.ctx.restore();
        
        // Núcleo super brilhante
        this.ctx.beginPath();
        this.ctx.arc(proj.x, proj.y, proj.radius * 0.6, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        this.ctx.shadowColor = 'rgba(255, 200, 0, 1)';
        this.ctx.shadowBlur = 15;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Camada de energia
        const gradient = this.ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, proj.radius * 2);
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.9)');
        gradient.addColorStop(0.4, 'rgba(255, 150, 0, 0.7)');
        gradient.addColorStop(0.7, 'rgba(255, 50, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.1)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(proj.x, proj.y, proj.radius * 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Anel pulsante
        const pulse = Math.sin(Date.now() / 100 + index) * 0.4 + 0.6;
        this.ctx.strokeStyle = `rgba(255, 200, 0, ${pulse})`;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(proj.x, proj.y, proj.radius * 2.5, 0, Math.PI * 2);
        this.ctx.stroke();
    });
}
// 🧠 DESENHA MINIONS DA JOIA DA ALMA (VISUAL ÉPICO)
this.champions.forEach(champion => {
    if (champion.type === 'infinityultron' && champion.activeMinions) {
        champion.activeMinions.forEach(minion => {
            this.ctx.save();
            
            const minionTime = Date.now() / 1000;
            
            // ===============================
            // AURA LARANJA PULSANTE INTENSA
            // ===============================
            const auraPulse = 30 + Math.sin(minionTime * 5) * 8;
            const auraGradient = this.ctx.createRadialGradient(
                minion.x, minion.y, 0,
                minion.x, minion.y, auraPulse
            );
            auraGradient.addColorStop(0, 'rgba(255, 140, 0, 0.8)');
            auraGradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)');
            auraGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
            
            this.ctx.fillStyle = auraGradient;
            this.ctx.beginPath();
            this.ctx.arc(minion.x, minion.y, auraPulse, 0, Math.PI * 2);
            this.ctx.fill();
            
            // ===============================
            // ANÉIS ORBITAIS LARANJAS
            // ===============================
            for (let r = 1; r <= 2; r++) {
                const ringRadius = minion.radius * (1.5 + r * 0.5);
                const ringRotation = minionTime * (r % 2 === 0 ? 1 : -1);
                
                this.ctx.save();
                this.ctx.translate(minion.x, minion.y);
                this.ctx.rotate(ringRotation);
                
                this.ctx.strokeStyle = `rgba(255, 140, 0, ${0.6 - r * 0.2})`;
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.shadowColor = 'rgba(255, 140, 0, 0.8)';
                this.ctx.shadowBlur = 10;
                
                this.ctx.beginPath();
                this.ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.setLineDash([]);
                this.ctx.restore();
            }
            
            this.ctx.shadowBlur = 0;
            
            // ===============================
            // CORPO DO MINION (ROXO + LARANJA)
            // ===============================
            const bodyGradient = this.ctx.createRadialGradient(
                minion.x, minion.y, 0,
                minion.x, minion.y, minion.radius
            );
            bodyGradient.addColorStop(0, 'rgba(100, 0, 150, 0.9)');
            bodyGradient.addColorStop(0.5, 'rgba(138, 43, 226, 0.8)');
            bodyGradient.addColorStop(1, 'rgba(75, 0, 130, 0.7)');
            
            this.ctx.fillStyle = bodyGradient;
            this.ctx.strokeStyle = 'rgba(255, 140, 0, 1)'; // Contorno laranja
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = 'rgba(255, 140, 0, 0.8)';
            this.ctx.shadowBlur = 15;
            
            this.ctx.beginPath();
            this.ctx.arc(minion.x, minion.y, minion.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
            
            // ===============================
            // SÍMBOLO DA JOIA DA ALMA (LARANJA)
            // ===============================
            this.ctx.fillStyle = `rgba(255, 140, 0, ${0.9 + Math.sin(minionTime * 6) * 0.1})`;
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = 'rgba(255, 140, 0, 1)';
            this.ctx.shadowBlur = 15;
            this.ctx.fillText('🟠', minion.x, minion.y);
            this.ctx.shadowBlur = 0;
            
            // ===============================
            // PARTÍCULAS LARANJAS ORBITANDO
            // ===============================
            for (let p = 0; p < 6; p++) {
                const particleAngle = (Math.PI * 2 / 6) * p + minionTime * 2;
                const particleDist = minion.radius * 1.5;
                const px = minion.x + Math.cos(particleAngle) * particleDist;
                const py = minion.y + Math.sin(particleAngle) * particleDist;
                
                const particleGradient = this.ctx.createRadialGradient(px, py, 0, px, py, 4);
                particleGradient.addColorStop(0, 'rgba(255, 200, 100, 0.9)');
                particleGradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
                
                this.ctx.fillStyle = particleGradient;
                this.ctx.beginPath();
                this.ctx.arc(px, py, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // ===============================
            // BARRA DE HP (LARANJA)
            // ===============================
            const hpBarWidth = minion.radius * 2;
            const hpBarHeight = 4;
            const hpBarX = minion.x - minion.radius;
            const hpBarY = minion.y - minion.radius - 10;
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
            
            const hpPercent = minion.hp / minion.maxHp;
            
            // Gradiente laranja para a barra
            const hpGradient = this.ctx.createLinearGradient(hpBarX, 0, hpBarX + hpBarWidth, 0);
            hpGradient.addColorStop(0, 'rgba(255, 140, 0, 0.9)');
            hpGradient.addColorStop(1, 'rgba(255, 100, 0, 0.9)');
            
            this.ctx.fillStyle = hpGradient;
            this.ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);
            
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
            
            // ===============================
            // TIMER E INDICADOR DE CONTROLE
            // ===============================
            const timeLeft = (minion.expirationTime - Date.now()) / 1000;
            this.ctx.fillStyle = 'rgba(255, 140, 0, 0.9)';
            this.ctx.font = 'bold 11px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(255, 140, 0, 1)';
            this.ctx.shadowBlur = 8;
            this.ctx.fillText(`⏱️${timeLeft.toFixed(0)}s`, minion.x, hpBarY - 5);
            this.ctx.shadowBlur = 0;
            
            // Indicador "CONTROLADO"
            this.ctx.fillStyle = 'rgba(255, 140, 0, 0.8)';
            this.ctx.font = 'bold 8px Arial';
            this.ctx.fillText('CONTROLADO', minion.x, minion.y + minion.radius + 15);
            
            this.ctx.restore();
        });
    }
});

// ⭐ NOVO: Desenha Kate Bishops
if (this.katebishops) {
    this.katebishops.forEach(kate => {
        this.ctx.save();
        this.ctx.translate(kate.x, kate.y);
        
        // Imagem
        if (kate.image.complete && !kate.image.isFallback) {
            this.ctx.drawImage(kate.image, 0, 0, kate.width, kate.height);
        } else {
            this.ctx.fillStyle = 'purple';
            this.ctx.fillRect(0, 0, kate.width, kate.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('KATE', kate.width / 2, kate.height / 2);
        }
        
        // Timer
        const timeLeft = (kate.duration - (Date.now() - kate.spawnTime)) / 1000;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${timeLeft.toFixed(0)}s`, kate.width / 2, -5);
        
        // Indicador de alcance
        this.ctx.strokeStyle = 'rgba(128, 0, 128, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(kate.width / 2, kate.height / 2, kate.range, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    });
}
    
    // Desenha zonas de fumaça
    if (this.smokeZones) {
        this.smokeZones.forEach(zone => {
            const progress = (Date.now() - zone.spawnTime) / zone.duration;
            const alpha = (1 - progress) * 0.7;
            
            // Nuvem escura principal
            const gradient = this.ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, zone.radius);
            gradient.addColorStop(0, `rgba(40, 40, 40, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(20, 20, 20, ${alpha * 0.8})`);
            gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Faíscas vermelhas
            for (let i = 0; i < 5; i++) {
                const sparkAngle = Math.random() * Math.PI * 2;
                const sparkDist = Math.random() * zone.radius * 0.8;
                const sparkX = zone.x + Math.cos(sparkAngle) * sparkDist;
                const sparkY = zone.y + Math.sin(sparkAngle) * sparkDist;
                
                this.ctx.beginPath();
                this.ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha * Math.random()})`;
                this.ctx.fill();
            }
        });
    }
    
  // ⭐ NOVO: Preview da área de Arrow Storm
    if (this.isSelectingArrowStormLocation && this.arrowStormOwner) {
        const data = Champion.championData.hawkeye;
        const x = this.arrowStormPreviewX;
        const y = this.arrowStormPreviewY;
        
        this.ctx.save();
        
        // Círculo da área (pulsante)
        const pulse = Math.sin(Date.now() / 200) * 10;
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, data.arrowStormRadius + pulse);
        gradient.addColorStop(0, 'rgba(139, 69, 19, 0.3)');
        gradient.addColorStop(0.7, 'rgba(139, 69, 19, 0.2)');
        gradient.addColorStop(1, 'rgba(139, 69, 19, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, data.arrowStormRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Contorno
        this.ctx.strokeStyle = 'rgba(200, 150, 0, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = 'rgba(200, 150, 0, 0.6)';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(x, y, data.arrowStormRadius + pulse, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
        
        // Símbolo de alvo
        this.ctx.strokeStyle = 'rgba(200, 150, 0, 0.9)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x + Math.cos(angle) * 15, y + Math.sin(angle) * 15);
            this.ctx.lineTo(x + Math.cos(angle) * 25, y + Math.sin(angle) * 25);
            this.ctx.stroke();
        }
        
        // Texto
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CLIQUE PARA CONFIRMAR', x, y - data.arrowStormRadius - 10);
        
        this.ctx.restore();
    }

// ✅ NOVO: Preview do local de pouso da Karolina
if (this.isSelectingKarolinaFlight && this.karolinaFlightOwner) {
    const x = this.arrowStormPreviewX;
    const y = this.arrowStormPreviewY;
    const data = Champion.championData.karolinadean;
    
    this.ctx.save();
    
    // Círculo de aterrissagem (pulsante)
    const pulse = Math.sin(Date.now() / 200) * 10;
    const hue = (Date.now() / 20) % 360; // Arco-íris rotativo
    
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, data.landingBurstRadius + pulse);
    gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.4)`);
    gradient.addColorStop(0.7, `hsla(${hue + 60}, 100%, 60%, 0.2)`);
    gradient.addColorStop(1, `hsla(${hue + 120}, 100%, 50%, 0)`);
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, data.landingBurstRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Contorno brilhante
    this.ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.arc(x, y, data.landingBurstRadius + pulse, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    
    // Símbolo de aterrissagem (estrela)
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(Date.now() / 500);
    
    this.ctx.strokeStyle = `hsl(${hue}, 100%, 90%)`;
    this.ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    this.ctx.shadowBlur = 20;
    
    // Estrela de 8 pontas
    this.ctx.beginPath();
    for (let i = 0; i < 16; i++) {
        const angle = (Math.PI * 2 / 16) * i;
        const radius = i % 2 === 0 ? 25 : 12;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        
        if (i === 0) {
            this.ctx.moveTo(px, py);
        } else {
            this.ctx.lineTo(px, py);
        }
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    this.ctx.restore();
    this.ctx.shadowBlur = 0;
    
    // Anéis decorativos
    for (let r = 1; r <= 3; r++) {
        const ringHue = (hue + r * 120) % 360;
        this.ctx.strokeStyle = `hsla(${ringHue}, 100%, 70%, ${0.6 - r * 0.15})`;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.beginPath();
        this.ctx.arc(x, y, (data.landingBurstRadius / 3) * r, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    // Texto
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('✨ CLIQUE PARA POUSAR ✨', x, y - data.landingBurstRadius - 15);
    this.ctx.shadowBlur = 0;
    
    this.ctx.restore();
}
// ☀️💥 Preview da Supernova Direcionada
if (this.isSelectingKarolinaSupernova && this.karolinaSupernovaOwner) {
    const owner = this.karolinaSupernovaOwner;
    const mouseX = this.arrowStormPreviewX;
    const mouseY = this.arrowStormPreviewY;
    
    const angle = Math.atan2(mouseY - owner.getCenterY(), mouseX - owner.getCenterX());
    const data = Champion.championData.karolinadean;
    
    this.ctx.save();
    
    const endX = owner.getCenterX() + Math.cos(angle) * data.supernovaLength;
    const endY = owner.getCenterY() + Math.sin(angle) * data.supernovaLength;
    
    // Linha de mira
    const hue = (Date.now() / 20) % 60;
    const pulse = Math.sin(Date.now() / 100) * 10;
    
    const aimGradient = this.ctx.createLinearGradient(
        owner.getCenterX(), owner.getCenterY(),
        endX, endY
    );
    aimGradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.6)`);
    aimGradient.addColorStop(0.5, `hsla(${hue + 10}, 100%, 60%, 0.4)`);
    aimGradient.addColorStop(1, `hsla(${hue + 20}, 100%, 50%, 0.2)`);
    
    this.ctx.strokeStyle = aimGradient;
    this.ctx.lineWidth = data.supernovaWidth + pulse;
    this.ctx.lineCap = 'round';
    this.ctx.setLineDash([20, 10]);
    this.ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    this.ctx.shadowBlur = 20;
    this.ctx.beginPath();
    this.ctx.moveTo(owner.getCenterX(), owner.getCenterY());
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    this.ctx.shadowBlur = 0;
    
    // Círculo na ponta
    const tipGradient = this.ctx.createRadialGradient(endX, endY, 0, endX, endY, data.supernovaWidth * 1.5);
    tipGradient.addColorStop(0, `hsla(${hue}, 100%, 90%, 0.8)`);
    tipGradient.addColorStop(0.5, `hsla(${hue}, 100%, 70%, 0.5)`);
    tipGradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
    
    this.ctx.fillStyle = tipGradient;
    this.ctx.beginPath();
    this.ctx.arc(endX, endY, data.supernovaWidth * 1.5 + pulse, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Texto
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('☀️ CLIQUE PARA DISPARAR ☀️', (owner.getCenterX() + endX) / 2, (owner.getCenterY() + endY) / 2 - 30);
    this.ctx.shadowBlur = 0;
    
    this.ctx.restore();
}

    // Desenha nuvens de enxofre
    if (this.sulfurClouds) {
        this.sulfurClouds.forEach(cloud => {
            const progress = (Date.now() - cloud.spawnTime) / cloud.duration;
            const alpha = (1 - progress) * 0.6;
            
            const gradient = this.ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.radius);
            gradient.addColorStop(0, `rgba(138, 43, 226, ${alpha})`); // Roxo
            gradient.addColorStop(0.5, `rgba(75, 0, 130, ${alpha * 0.7})`); // Índigo
            gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

// ☀️💥 Desenha Supernova Beams
if (this.supernovaBeams) {
    this.supernovaBeams.forEach(beam => {
        beam.draw(this.ctx);
        
        // Desenha chamas solares
        beam.solarFlames.forEach(flame => {
            const elapsed = Date.now() - flame.spawnTime;
            if (elapsed < 0 || elapsed > flame.duration) return;
            
            const progress = elapsed / flame.duration;
            const alpha = (1 - progress) * 0.6;
            
            this.ctx.save();
            
            // Chama principal
            const flameGradient = this.ctx.createRadialGradient(
                flame.x, flame.y, 0,
                flame.x, flame.y, flame.radius
            );
            flameGradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
            flameGradient.addColorStop(0.4, `rgba(255, 150, 0, ${alpha * 0.8})`);
            flameGradient.addColorStop(0.8, `rgba(255, 50, 0, ${alpha * 0.4})`);
            flameGradient.addColorStop(1, 'rgba(100, 0, 0, 0)');
            
            this.ctx.fillStyle = flameGradient;
            this.ctx.beginPath();
            this.ctx.arc(flame.x, flame.y, flame.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Anel de fogo
            this.ctx.strokeStyle = `rgba(255, 100, 0, ${alpha})`;
            this.ctx.lineWidth = 3;
            this.ctx.shadowColor = 'rgba(255, 150, 0, 0.8)';
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.arc(flame.x, flame.y, flame.radius * 0.8, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
            
            this.ctx.restore();
        });
    });
}

// 👻 Desenha Clones de Luz
this.champions.forEach(champion => {
    if (champion.type === 'karolinadean' && champion.lightClones) {
        champion.lightClones.forEach(clone => {
            this.ctx.save();
            this.ctx.globalAlpha = clone.alpha;
            
            // Aura do clone
            const cloneGradient = this.ctx.createRadialGradient(
                clone.getCenterX(), clone.getCenterY(), 0,
                clone.getCenterX(), clone.getCenterY(), 50
            );
            cloneGradient.addColorStop(0, `hsla(${clone.hue}, 100%, 70%, ${clone.alpha * 0.5})`);
            cloneGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = cloneGradient;
            this.ctx.beginPath();
            this.ctx.arc(clone.getCenterX(), clone.getCenterY(), 50, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Imagem do clone
            if (clone.image && clone.image.complete) {
                this.ctx.drawImage(clone.image, clone.x, clone.y, clone.width, clone.height);
            } else {
                this.ctx.fillStyle = `hsla(${clone.hue}, 100%, 70%, ${clone.alpha})`;
                this.ctx.fillRect(clone.x, clone.y, clone.width, clone.height);
            }
            
            // Contorno brilhante
            this.ctx.strokeStyle = `hsla(${clone.hue}, 100%, 90%, ${clone.alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.shadowColor = `hsl(${clone.hue}, 100%, 70%)`;
            this.ctx.shadowBlur = 10;
            this.ctx.strokeRect(clone.x, clone.y, clone.width, clone.height);
            this.ctx.shadowBlur = 0;
            
            // Texto "CLONE"
            this.ctx.fillStyle = `rgba(255, 255, 255, ${clone.alpha})`;
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CLONE', clone.getCenterX(), clone.y - 5);
            
            this.ctx.restore();
        });
    }
});
    
        // Desenha efeitos
        this.effects.forEach(effect => effect.draw(this.ctx));

        // ✅ DESENHA FERRAMENTAS
        if (this.collectorSystem) {
            this.collectorSystem.draw(this.ctx);
        }

        // Desenha dummy towers, drones, etc.
        this.drawDummyTowers();
        this.drawLokiVariantDrones();
        this.drawUltronDrones();

        // Desenha reações (SEMPRE POR ÚLTIMO, COM VERIFICAÇÃO)
    if (this.reactionSystem && typeof this.reactionSystem.draw === 'function') {
        this.reactionSystem.draw(this.ctx);
    }

        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSADO', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Pressione "P" para continuar.', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
    }
    

drawDummyTowers() {
            this.dummyTowers.forEach(dummy => {
                const imageToDraw = (dummy.isWandaIllusion && this.images.wandaIllusion.complete) ? 
                    this.images.wandaIllusion : 
                    (dummy.image && dummy.image.complete ? dummy.image : null);

                if (imageToDraw) {
                    this.ctx.save();
                    const opacity = 0.4 + Math.sin(Date.now() / 100) * 0.1;
                    this.ctx.globalAlpha = opacity;
                    this.ctx.drawImage(imageToDraw, dummy.x - 25, dummy.y - 25, 50, 50);
                    this.ctx.restore();
                } else {
                    this.ctx.fillStyle = 'rgba(128, 0, 128, 0.5)';
                    this.ctx.fillRect(dummy.x - 25, dummy.y - 25, 50, 50);
                }
            });
        }

drawLokiVariantDrones() {
            this.lokiVariantDrones.forEach(variant => {
                if (variant.image && variant.image.complete) {
                    this.ctx.save();
                    const opacity = 0.6 + Math.sin(Date.now() / 80) * 0.1;
                    this.ctx.globalAlpha = opacity;
                    this.ctx.drawImage(variant.image, variant.x - 20, variant.y - 20, 40, 40);
                    this.ctx.restore();
                }
            });
        }

drawUltronDrones() {
    this.drones.forEach(drone => {
        // ⭐ MUDANÇA 3: DRONES TRANSLÚCIDOS durante reconstrução
        const isOwnerReconstructing = drone.isOwnerReconstructing || false;
        
        if (drone.mode === 'sentinel') {
            // Drone Sentinela (Verde, com aura pulsante)
            const hoverOffset = Math.sin(Date.now() / 200) * 2;
            const pulseSize = 2 + Math.sin(Date.now() / 300) * 1;
            
            this.ctx.save();
            this.ctx.translate(drone.x, drone.y + hoverOffset);
            
            // ⭐ NOVO: Translucidez durante reconstrução
            if (isOwnerReconstructing) {
                this.ctx.globalAlpha = 0.3;
                this.ctx.filter = 'hue-rotate(280deg) saturate(2)';
            }
            
            // Aura verde
            this.ctx.fillStyle = 'rgba(0, 200, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 25 + pulseSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Corpo do drone
            if (this.images.drone.complete) {
                this.ctx.drawImage(this.images.drone, -20, -20, 40, 40);
            } else {
                // Fallback: círculo verde
                this.ctx.fillStyle = 'lime';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 15, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Indicador de Sentinela
                this.ctx.fillStyle = 'white';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('S', 0, 3);
            }
            
            this.ctx.restore();
        } 
        else if (drone.mode === 'kamikaze') {
            // Drone Kamikaze (Vermelho, com trilha)
            this.ctx.save();
            this.ctx.translate(drone.x, drone.y);
            
            // ⭐ NOVO: Translucidez durante reconstrução
            if (isOwnerReconstructing) {
                this.ctx.globalAlpha = 0.3;
                this.ctx.filter = 'hue-rotate(280deg) saturate(2)';
            }
            
            // Corpo do drone
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = 'red';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Brilho pulsante
            const glowPulse = Math.sin(Date.now() / 50) * 3 + 5;
            this.ctx.shadowColor = `rgba(255, 0, 0, 0.7)`;
            this.ctx.shadowBlur = glowPulse;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            this.ctx.fill();
            
            this.ctx.restore();
        }
    });
}
    
updateEnemies(deltaTime) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];

        // ⏳ BLOQUEIA ATUALIZAÇÃO SE ESTIVER CONGELADO
        if (enemy.isFrozenByTime) {
            enemy.vel = 0;
            enemy.y = enemy.originalY || enemy.y;
            enemy.canShoot = false;
            enemy.attackCooldown = Infinity;
        } else {
            enemy.update(deltaTime);
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        if (this.attackCooldown <= 0 && !this.isStunned && !this.isConfused) {
            let nearestTarget = null;
            let minDist = this.attackRange;
            let targetType = null;
            
            if (this.gameManager && this.gameManager.champions) {
                // Procura campeões
                this.gameManager.champions.forEach(champion => {
                    const dist = Math.hypot(
                        this.getCenterX() - champion.getCenterX(),
                        this.getCenterY() - champion.getCenterY()
                    );
                    
                    if (dist < minDist) {
                        minDist = dist;
                        nearestTarget = champion;
                        targetType = 'champion';
                    }
                });
                
                // 🔮 Procura pedras rúnicas (prioridade se dentro da área)
                if (this.gameManager.runeStones) {
                    this.gameManager.runeStones.forEach(rune => {
                        const distToRune = Math.hypot(
                            this.getCenterX() - rune.x,
                            this.getCenterY() - rune.y
                        );
                        
                        if (distToRune < rune.radius && distToRune < minDist) {
                            minDist = distToRune;
                            nearestTarget = rune;
                            targetType = 'rune';
                        }
                    });
                }
            }
    
            if (nearestTarget) {
                const projectile = {
                    x: this.getCenterX(),
                    y: this.getCenterY(),
                    targetX: targetType === 'champion' ? nearestTarget.getCenterX() : nearestTarget.x,
                    targetY: targetType === 'champion' ? nearestTarget.getCenterY() : nearestTarget.y,
                    speed: 300,
                    damage: this.data.baseDamage || 5,
                    owner: this,
                    type: 'enemyBullet',
                    radius: 5,
                    color: 'red',
                    spawnTime: Date.now(),
                    lifespan: 3000,
                    targetType: targetType,
                    target: nearestTarget
                };
                
                if (!this.gameManager.enemyProjectiles) {
                    this.gameManager.enemyProjectiles = [];
                }
                
                this.gameManager.enemyProjectiles.push(projectile);
                this.attackCooldown = this.attackSpeed;
            }
        }

        // âœ… REMOVE INIMIGOS MORTOS/PASSADOS
        if (enemy.isDestroyed) {
            const killer = enemy.lastAttacker;
            
            
            // ✅ HOOK: onEnemyKilled
            if (killer && killer.onEnemyKilled) {
                killer.onEnemyKilled(enemy);
            }
            
            // ✅ NOVO: Hook para ferramentas
            if (killer && killer.attachedTool && this.collectorSystem) {
                  this.collectorSystem.onEnemyKilledByChampion(killer, enemy); // ✅ NOME CORRETO
            }
            
            // 💀 Se for executor, notifica o sistema
            if (enemy.isExecutor) {
                enemy.onDeath();
                this.executorSpawnSystem.onExecutorDeath(enemy);
            }
            
            this.money += enemy.data.reward || 10;
            this.enemiesDefeatedThisPhase++;
            this.enemies.splice(i, 1);
            
        } else if (enemy.passedBase) {
            // 💀 Executor que chegou vivo causa 20 de dano
            if (enemy.isExecutor) {
                this.baseHealth -= enemy.baseDamageToBase;
                this.showUI(`💀 EXECUTOR CHEGOU À BASE! -${enemy.baseDamageToBase} HP`, 'error');
            } else {
                this.baseHealth -= enemy.data.baseDamage || 1;
            }
            
            this.enemies.splice(i, 1);
            
            if (this.baseHealth <= 0) {
                this.isGameOver = true;
                this.showUI("GAME OVER! A base foi destruída.", 'error');
                this.isPaused = true;
            }
        }
    }
}

// main.js - dentro de GameManager.updateProjectiles

updateProjectiles(deltaTime) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const projectile = this.projectiles[i];
        
        projectile.update(deltaTime);

        if (projectile.isDestroyed) {
            // ⭐ LOG ESPECIAL PARA ESCUDO
            if (projectile.type === 'capShieldProjectile') {
             //   console.log('🗑️ Removendo escudo do array');
            //    console.log('   Flag do dono:', projectile.owner?.isShieldActive);
             //   console.log('   Dono existe?', !!projectile.owner);
            }
            
            this.projectiles.splice(i, 1);
            continue;
        }
        
        // Colisão com inimigos
        for (const enemy of this.enemies) {
            if (projectile.hitEnemies.includes(enemy.id)) continue;

            const dist = Math.hypot(
                projectile.x - enemy.getCenterX(),
                projectile.y - enemy.getCenterY()
            );

            if (dist < projectile.radiusCollision + enemy.radius) {
                projectile.hitEnemies.push(enemy.id);
                
                enemy.takeDamage(projectile.damage, projectile.owner);
                
                // ⭐ NOVO: Kate Bishop Arrow
                if (projectile.type === 'kateBishopArrow') {
                    projectile.onHit(enemy, this);
                }
                
                if (projectile.type === 'hawkeyeArrow') {
                    projectile.onHit(enemy, this);
                }

                if (!projectile.isPiercing) {
                    projectile.isDestroyed = true;
                    break;
                }
            }
        }
        // ⭐ NOVO: Campos gravitacionais
// ⭐ CAMPOS GRAVITACIONAIS MELHORADOS
if (this.gravityFields) {
    for (let i = this.gravityFields.length - 1; i >= 0; i--) {
        const field = this.gravityFields[i];
        
        if (Date.now() > field.endTime) {
            // Libera inimigos
            field.trappedEnemies.forEach(data => {
                if (data.enemy.hp > 0) {
                    data.enemy.isInGravityField = false;
                    data.enemy.vel = data.originalSpeed;
                }
            });
            this.gravityFields.splice(i, 1);
            continue;
        }
        
        const timeActive = Date.now() - field.spawnTime;
        
        // Atualiza partículas
        field.particles.forEach(p => {
            p.angle += p.speed;
            p.distance -= 20 * (deltaTime / 1000); // Espiral para dentro
            if (p.distance < 0) p.distance = field.radius;
        });
        
        // Atualiza inimigos presos
        field.trappedEnemies.forEach(data => {
            const enemy = data.enemy;
            if (enemy.hp <= 0) return;
            
            const distToCenter = Math.hypot(
                field.x - enemy.getCenterX(),
                field.y - enemy.getCenterY()
            );
            
            // ⭐ ÓRBITA: Inimigos giram em torno do centro
            data.orbitAngle += field.orbitSpeed * (deltaTime / 1000);
            
            // Força gravitacional aumenta perto do centro
            const gravityStrength = 1 - (distToCenter / field.radius);
            const pullAmount = field.force * gravityStrength * (deltaTime / 1000);
            
            // Movimento orbital + puxão para o centro
            const targetX = field.x + Math.cos(data.orbitAngle) * (distToCenter - pullAmount);
            const targetY = field.y + Math.sin(data.orbitAngle) * (distToCenter - pullAmount);
            
            enemy.x = targetX - enemy.radius;
            enemy.y = targetY - enemy.radius;
            
            // Reduz velocidade gradualmente
            enemy.vel = data.originalSpeed * (1 - gravityStrength * 0.8);
            
            // ⭐ CRUSH DAMAGE: Dano no centro
            if (distToCenter < field.crushRadius) {
                const crushMultiplier = 1 - (distToCenter / field.crushRadius);
                enemy.takeDamage(field.crushDamage * crushMultiplier * (deltaTime / 1000), null);
                
                // Efeito de esmagamento
                if (Math.random() < 0.1) {
                    this.effects.push(new this.TextPopEffect(
                        enemy.getCenterX(),
                        enemy.getCenterY() - 20,
                        'CRUSH!',
                        'red',
                        300
                    ));
                }
            }
        });
    }
}

// ⭐ NOVO: Nano-cordas
// ⭐ NANO-CORDAS MELHORADAS
if (this.cordGroups) {
    for (let i = this.cordGroups.length - 1; i >= 0; i--) {
        const group = this.cordGroups[i];
        
        // Remove inimigos mortos
        group.enemies = group.enemies.filter(e => e.hp > 0);
        
        if (Date.now() > group.endTime || group.enemies.length < 2) {
            group.enemies.forEach(e => {
                e.isTrapped = false;
                e.vel = e.data.speed; // Restaura velocidade original
            });
            this.cordGroups.splice(i, 1);
            continue;
        }
        
        // Atualiza animação
        group.wavePhase += deltaTime / 100;
        
        // ⭐ PULSO ELÉTRICO: Dano periódico
        if (Date.now() - group.lastPulseTime > group.pulseInterval) {
            group.enemies.forEach(enemy => {
                enemy.takeDamage(group.pulseDamage, null);
                
                this.effects.push(new this.AuraFireParticleEffect(
                    enemy.getCenterX(),
                    enemy.getCenterY(),
                    20,
                    'purple',
                    300
                ));
            });
            
            group.lastPulseTime = Date.now();
            
            this.effects.push(new this.TextPopEffect(
                group.centerX,
                group.centerY - 30,
                `⚡ PULSO: ${group.pulseDamage}`,
                'purple',
                800
            ));
        }
        
        // ⭐ DANO COMPARTILHADO MELHORADO
        if (group.sharedDamage) {
            group.enemies.forEach(enemy => {
                if (enemy.recentDamage && enemy.recentDamage > 0) {
                    const damagePerEnemy = enemy.recentDamage / (group.enemies.length - 1);
                    let totalShared = 0;
                    
                    group.enemies.forEach(other => {
                        if (other.id !== enemy.id) {
                            other.takeDamage(damagePerEnemy, enemy.lastAttacker);
                            totalShared += damagePerEnemy;
                            
                            // Efeito visual de transferência
                            this.effects.push(new this.LaserEffect(
                                enemy.getCenterX(),
                                enemy.getCenterY(),
                                other.getCenterX(),
                                other.getCenterY(),
                                2,
                                'rgba(147, 112, 219, 0.7)',
                                0.2
                            ));
                        }
                    });
                    
                    group.totalDamageShared += totalShared;
                    enemy.recentDamage = 0;
                }
            });
        }
    }
}
    
        // Lógica especial para Escudo Carregado
        if (projectile.type === 'usagentChargedShield') {
            
            // REMOVA: Verificação de expiração (agora no update() da classe)
            // REMOVA: Rotação visual (agora no update() da classe)
            
            // MANTENHA: Efeito de rastro de faíscas (opcional, pode ficar aqui)
            if (Date.now() % 100 < 50) {
                this.effects.push(new AuraFireParticleEffect(
                    projectile.x,
                    projectile.y,
                    8,
                    'red',
                    200
                ));
            }
            
            // MANTENHA: O código COMPLETO de Colisão e Ricochete!
            for (const enemy of this.enemies) {
                // ... MANTENHA TODO O SEU CÓDIGO DE COLISÃO E RICOCHETE AQUI ...
            }
            
            //continue; // Mantenha o continue;

            // Rotação visual
            projectile.rotation += 0.3 * (deltaTime / 16.67);
            
            // Efeito de rastro de faíscas
            if (Date.now() % 100 < 50) {
                this.effects.push(new AuraFireParticleEffect(
                    projectile.x,
                    projectile.y,
                    8,
                    'red',
                    200
                ));
            }
            
            // Colisão com inimigos
            for (const enemy of this.enemies) {
                if (projectile.hitEnemies.includes(enemy.id)) continue;

                const dist = Math.hypot(
                    projectile.x - enemy.getCenterX(),
                    projectile.y - enemy.getCenterY()
                );

                if (dist < projectile.radiusCollision + enemy.radius) {
                    projectile.hitEnemies.push(enemy.id);
                    
                    let shieldDamage = projectile.damage;
                    
                    // BÔNUS: Se atingir apenas 1 inimigo, dano dobrado
                    if (projectile.bouncesLeft === Champion.championData.usagent.chargedShieldBounces - 1 
                        && projectile.hitEnemies.length === 1) {
                        shieldDamage *= 2;
                        this.effects.push(new TextPopEffect(
                            enemy.getCenterX(),
                            enemy.getCenterY() - 40,
                            'CRÍTICO!',
                            'gold',
                            1000
                        ));
                    }
                    
                    enemy.takeDamage(shieldDamage, projectile.owner);
                    
                    // Empurrão
                    const pushAngle = Math.atan2(
                        enemy.getCenterY() - projectile.y,
                        enemy.getCenterX() - projectile.x
                    );
                    enemy.x += Math.cos(pushAngle) * 25;
                    enemy.y += Math.sin(pushAngle) * 25;
                    
                    // Efeito visual de impacto
                    this.effects.push(new USAgentShockwaveEffect(
                        enemy.getCenterX(),
                        enemy.getCenterY(),
                        40,
                        200
                    ));
                    
                    // Ricochete
                    if (projectile.bouncesLeft > 0) {
                        projectile.bouncesLeft--;
                        
                        // Procura próximo alvo
                        let nextTarget = null;
                        let closestDist = Infinity;
                        
                        for (const nextEnemy of this.enemies) {
                            if (projectile.hitEnemies.includes(nextEnemy.id)) continue;
                            
                            const nextDist = Math.hypot(
                                enemy.getCenterX() - nextEnemy.getCenterX(),
                                enemy.getCenterY() - nextEnemy.getCenterY()
                            );
                            
                            if (nextDist < 150 && nextDist < closestDist) {
                                closestDist = nextDist;
                                nextTarget = nextEnemy;
                            }
                        }
                        
                        if (nextTarget) {
                            projectile.x = enemy.getCenterX();
                            projectile.y = enemy.getCenterY();
                            projectile.targetX = this.getCenterX(nextTarget);
                            projectile.targetY = this.getCenterY(nextTarget);
                            
                            // Efeito de ricochete
                            this.effects.push(new LaserEffect(
                                projectile.x,
                                projectile.y,
                                projectile.targetX,
                                projectile.targetY,
                                4,
                                'red',
                                0.2
                            ));
                        } else {
                            this.projectiles.splice(i, 1);
                        }
                    } else {
                        this.projectiles.splice(i, 1);
                    }
                    
                    break;
                }
            }
            continue;
        }

        // ... resto do código de colisão normal ...
    

        // Colisão com inimigos
        for (const enemy of this.enemies) {
            if (projectile.hitEnemies.includes(enemy.id)) continue;

            const dist = Math.hypot(
                projectile.x - enemy.getCenterX(),
                projectile.y - enemy.getCenterY()
            );

            if (dist < projectile.radiusCollision + enemy.radius) {
                projectile.hitEnemies.push(enemy.id);
                
                // Dano base
                enemy.takeDamage(projectile.damage, projectile.owner);
                
                // Se for HawkeyeArrow, aplica efeitos especiais
                if (projectile.type === 'hawkeyeArrow') {
                    projectile.onHit(enemy, this);
                }

                if (!projectile.isPiercing) {
                    projectile.isDestroyed = true;
                    break;
                }
            }
        }
    }
}

updateChampions(deltaTime) {
    for (let i = this.champions.length - 1; i >= 0; i--) {
        const champion = this.champions[i];

                if (champion.hp <= 0) {
            // ✅ HOOK: onChampionDeath (ANTES de remover)
            if (champion.attachedTool && this.collectorSystem) {
                const revived = this.collectorSystem.onChampionDeath(champion);
                if (revived) {
                    continue; // Não remove o champion
                }
            }
            
        
        // ===== AUTORRECONSTRUÇÃO DO ULTRON =====
            // Verifica se é Ultron e pode se reconstruir
            if (champion.type === 'ultron' && 
                !champion.isReconstructing && 
                !champion.emergencyReplicationUsedThisPhase &&
                (this.currentPhase - champion.lastReplicationPhase >= 1)) {
                
                const data = Champion.championData.ultron;
                
                // Inicia a reconstrução
                champion.isReconstructing = true;
                champion.reconstructionEndTime = Date.now() + data.replicationCoreDuration;
                champion.emergencyReplicationUsedThisPhase = true;
                champion.lastReplicationPhase = this.currentPhase;
                champion.hp = 1; // Mantém vivo temporariamente
                
                // ⭐ MUDANÇA 3: TRANSLÚCIDO + EFEITO + DRONES TRANSLÚCIDOS
                this.effects.push(new this.UltronReconstructionEffect(
                    champion.getCenterX(), 
                    champion.getCenterY(), 
                    data.replicationCoreDuration,
                    champion
                ));
                
                // ⭐ NOVO: Torna drones translúcidos também
                this.drones.forEach(drone => {
                    if (drone.spawnerId === champion.id) {
                        drone.isOwnerReconstructing = true;
                    }
                });
                
                this.showUI('Ultron: Inicializando Protocolo de Reconstrução...', 'special');
                continue; // Não remove o campeão
            }       
            
            

            // ✅ ADICIONE ESTA LINHA (reação de morte):
            if (this.reactionSystem) {
                this.reactionSystem.onChampionDeath(champion);
            }

            // Se não é Ultron ou já usou reconstrução, remove normalmente
            this.destroyedTowers.push(champion);
            this.champions.splice(i, 1);
            if (this.selectedChampion && this.selectedChampion.id === champion.id) {
                this.selectedChampion = null;
            }
            this.showUI(`${champion.type} foi destruído!`, 'warning');
            continue;
        }
        
        champion.update(deltaTime, this.enemies, this.champions, this.projectiles, this.effects);
        champion.attack(this.enemies, this.projectiles, this.effects);
    };
    
      // 🔮 NOVO: Atualiza Pedras Rúnicas
    if (this.runeStones) {
        for (let i = this.runeStones.length - 1; i >= 0; i--) {
            const rune = this.runeStones[i];
            
            // Remove se destruída ou expirada
            if (rune.hp <= 0 || Date.now() > rune.endTime) {
                this.runeStones.splice(i, 1);
                this.effects.push(new this.BamfEffect(rune.x, rune.y, 'purple', 300));
                if (rune.hp <= 0) {
                    this.showUI('Pedra Rúnica destruída!', 'warning');
                }
                continue;
            }
            
            // Cura aliados na área
            if (Date.now() - rune.lastHealTick >= 1000) {
                this.champions.forEach(ally => {
                    const dist = Math.hypot(rune.x - ally.getCenterX(), rune.y - ally.getCenterY());
                    
                    if (dist < rune.radius && ally.hp < ally.maxHp) {
                        const healAmount = rune.healRate;
                        ally.hp = Math.min(ally.maxHp, ally.hp + healAmount);
                        
                        this.effects.push(new this.TextPopEffect(
                            ally.getCenterX(),
                            ally.getCenterY() - 20,
                            `+${healAmount}`,
                            'lime',
                            800
                        ));
                        
                        // 🌟 Proteção da Runa (converte dano em cura)
                        if (rune.damageToHeal) {
                            ally.runeProtection = {
                                endTime: Date.now() + 1500,
                                rune: rune
                            };
                        }
                    }
                });// 🌟 Cria raios de cura visuais
this.champions.forEach(ally => {
    const dist = Math.hypot(rune.x - ally.getCenterX(), rune.y - ally.getCenterY());
    
    if (dist < rune.radius && ally.hp < ally.maxHp) {
        // Cria raio de cura visual (do totem para o campeão)
        this.effects.push(new this.HealingBeamEffect(
            rune.x,
            rune.y - 25, // Sai do topo do totem
            ally.getCenterX(),
            ally.getCenterY(),
            500 // Duração do raio
        ));
    }
});
                
                rune.lastHealTick = Date.now();
            }
            
        }
    }

    
    // 👤 NOVO: Atualiza Clones de Loki
    if (this.lokiClones) {
        for (let i = this.lokiClones.length - 1; i >= 0; i--) {
            const clone = this.lokiClones[i];
            
            if (clone.hp <= 0) {
                clone.master.activeClones = clone.master.activeClones.filter(c => c.id !== clone.id);
                this.lokiClones.splice(i, 1);
                this.effects.push(new this.BamfEffect(clone.getCenterX(), clone.getCenterY(), 'purple', 400));
                continue;
            }
            
            if (clone.lastAttackTime > 0) {
                clone.lastAttackTime -= deltaTime;
            }
            
            // Clone ataca
            if (clone.lastAttackTime <= 0) {
                let targetEnemy = null;
                
                // Se mestre está vivo, ataca o mesmo alvo
                if (clone.master.hp > 0) {
                    targetEnemy = clone.master.findNearestEnemy(this.enemies);
                } else {
                    // Se mestre morreu mas clone persiste, ataca por conta própria
                    let minDist = clone.range;
                    for (const enemy of this.enemies) {
                        const dist = Math.hypot(clone.getCenterX() - enemy.getCenterX(), clone.getCenterY() - enemy.getCenterY());
                        if (dist < minDist) {
                            minDist = dist;
                            targetEnemy = enemy;
                        }
                    }
                }
                
                if (targetEnemy) {
                    this.projectiles.push(new this.LaserProjectile(
                        clone.getCenterX(),
                        clone.getCenterY(),
                        this.getCenterX(targetEnemy),
                        this.getCenterY(targetEnemy),
                        400,
                        clone.damage,
                        clone.master,
                        this
                    ));
                    
                    this.effects.push(new this.LaserEffect(
                        clone.getCenterX(),
                        clone.getCenterY(),
                        this.getCenterX(targetEnemy),
                        this.getCenterY(targetEnemy),
                        12,
                        'purple',
                        1.2
                    ));
                    
                    clone.lastAttackTime = clone.cooldownBase;
                }
            }
        }
    }
    
        
        // ===== ATUALIZA DRONES DE ULTRON =====
        for (let i = this.drones.length - 1; i >= 0; i--) {
            const drone = this.drones[i];

           // ⭐ NOVO: Remove flag se dono terminou reconstrução
        if (drone.isOwnerReconstructing) {
            const owner = this.champions.find(c => c.id === drone.spawnerId);
            if (owner && !owner.isReconstructing) {
                drone.isOwnerReconstructing = false;
            }
        }
        
        // Atualiza cooldown de todos os drones
        if (drone.cooldown > 0) {
            drone.cooldown -= deltaTime;
        }
            
            
            if (drone.mode === 'kamikaze') {
                // Verifica se o alvo ainda existe
                if (!drone.target || !this.enemies.find(e => e.id === drone.target.id)) {
                    this.drones.splice(i, 1);
                    continue;
                }

                const targetX = drone.target.getCenterX();
                const targetY = drone.target.getCenterY();
                const angle = Math.atan2(targetY - drone.y, targetX - drone.x);
                const distanceToTarget = Math.hypot(targetX - drone.x, targetY - drone.y);
                const moveAmount = drone.speed * (deltaTime / 1000);

                if (distanceToTarget <= moveAmount + (drone.radiusCollision || 10)) {
                    // Explode no alvo
                    drone.target.takeDamage(drone.damage, drone.owner);

                    // Dano em área
                    this.enemies.forEach(aoeEnemy => {
                        const aoeDist = Math.hypot(drone.x - aoeEnemy.getCenterX(), drone.y - aoeEnemy.getCenterY());
                        if (aoeDist < drone.explosionRadius && aoeEnemy.id !== drone.target.id) {
                            aoeEnemy.takeDamage(drone.damage * 0.5, drone.owner);
                        }
                    });
                    
                    this.effects.push(new this.RedHulkExplosionEffect(
                        drone.x,
                        drone.y,
                        drone.explosionRadius,
                        200,
                        'gray'
                    ));
                    
                    this.drones.splice(i, 1);
                    continue;
                } else {
                    drone.x += Math.cos(angle) * moveAmount;
                    drone.y += Math.sin(angle) * moveAmount;
                }
            }
            // Drones Sentinela não se movem, apenas atacam (lógica no attack() do Ultron)
        }
         
// 🎯 Atualiza Kate Bishops (COM BALÕES)
if (this.katebishops) {
    for (let i = this.katebishops.length - 1; i >= 0; i--) {
        const kate = this.katebishops[i];
        const elapsed = Date.now() - kate.spawnTime;
        
        // 💬 FRASES ALEATÓRIAS EM BALÕES
        if (Date.now() - kate.lastPhraseTime > kate.phraseCooldown) {
            const phrases = [
                "Alvo identificado! 🎯",
                "Essa foi fácil!",
                "Clint, viu isso?!",
                "Aprendi com os melhores!",
                "Na mosca! 🏹"
            ];
            
            const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
            this.createSpeechBubble(kate.getCenterX(), kate.getCenterY() - 40, randomPhrase, 3000);
            kate.lastPhraseTime = Date.now();
        }
        
        // Verifica duração
        if (elapsed > kate.duration) {
            kate.owner.kateBishopActive = null;
            this.katebishops.splice(i, 1);
            
            this.effects.push(new this.BamfEffect(
                kate.getCenterX(),
                kate.getCenterY(),
                'purple',
                500
            ));
            
            // 💬 FRASE DE SAÍDA EM BALÃO
            this.createSpeechBubble(
                kate.getCenterX(), 
                kate.getCenterY() - 40, 
                "Missão cumprida! ✨", 
                3000
            );
            continue;
        }
        
        // Atualiza cooldown
        if (kate.lastAttackTime > 0) {
            kate.lastAttackTime -= deltaTime;
        }
        
        // Ataca
        if (kate.lastAttackTime <= 0) {
            let nearestEnemy = null;
            let minDist = kate.range;
            
            for (const enemy of this.enemies) {
                const dist = Math.hypot(
                    kate.getCenterX() - enemy.getCenterX(),
                    kate.getCenterY() - enemy.getCenterY()
                );
                if (dist < minDist) {
                    minDist = dist;
                    nearestEnemy = enemy;
                }
            }
            
            if (nearestEnemy) {
                const data = Champion.championData.hawkeye;
                const arrowTypes = data.kateArrowTypes;
                const randomType = arrowTypes[Math.floor(Math.random() * arrowTypes.length)];
                
                const arrow = new KateBishopArrow(
                    kate.getCenterX(),
                    kate.getCenterY(),
                    nearestEnemy.getCenterX(),
                    nearestEnemy.getCenterY(),
                    700,
                    kate.damage,
                    kate.owner,
                    randomType,
                    this
                );
                
                this.projectiles.push(arrow);
                kate.arrowsFired++;
                kate.lastAttackTime = kate.attackSpeed;
                
                // 💬 FRASE A CADA 5 TIROS
                if (kate.arrowsFired % 5 === 0) {
                    this.createSpeechBubble(kate.getCenterX(), kate.getCenterY() - 40, "Isso aí! 🎯", 2000);
                }
            }
        }
    }
}
    // ⭐ NOVO: Atualiza Left Wing Units (Sam/Bucky)
// ⭐ ATUALIZA LEFT WING UNITS (MOVIMENTO CIRCULAR SUAVE)
if (this.leftWingUnits) {
    for (let i = this.leftWingUnits.length - 1; i >= 0; i--) {
        const unit = this.leftWingUnits[i];
        const elapsed = Date.now() - unit.spawnTime;
        const data = Champion.championData.captainamerica;
        
        // Verifica duração
        if (elapsed > unit.duration) {
            // ⭐ Libera inimigos na posição X=900
            unit.capturedEnemies.forEach(captured => {
                const enemy = captured.enemy;
                if (enemy.hp > 0) {
                    enemy.isCapturedByLeftWing = false;
                    enemy.vel = enemy.originalVel;
                    enemy.isStunned = false;
                    enemy.canShoot = true;
                    enemy.attackCooldown = 0;
                    
                    // ⭐ COLOCA NO X=900
                    enemy.x = data.leftWingDropX;
                    enemy.y = Math.min(Math.max(enemy.y, 50), this.canvas.height - 50);
                    enemy.pathIndex = 0; // Reseta caminho
                    
                    this.effects.push(new this.BamfEffect(
                        enemy.getCenterX(),
                        enemy.getCenterY(),
                        'orange',
                        400
                    ));
                }
            });
            
            this.leftWingUnits.splice(i, 1);
            this.showUI(`${unit.displayName}: Missão cumprida!`, 'success');
            continue;
        }
        
        // ⭐ MOVIMENTO CIRCULAR SUAVE
        unit.orbitAngle += unit.orbitSpeed * (deltaTime / 1000);
        
        // Calcula posição na órbita
        unit.x = unit.centerX + Math.cos(unit.orbitAngle) * unit.orbitRadius - unit.width / 2;
        unit.y = unit.centerY + Math.sin(unit.orbitAngle) * unit.orbitRadius - unit.height / 2;
        
        // ⭐ Atualiza direção visual (flip quando muda de lado)
        const velocityX = -Math.sin(unit.orbitAngle) * unit.orbitSpeed;
        unit.facingRight = velocityX > 0;
        
        // ⭐ ATUALIZA POSIÇÃO DOS INIMIGOS CAPTURADOS
        unit.capturedEnemies.forEach(captured => {
            const enemy = captured.enemy;
            if (enemy.hp > 0) {
                enemy.x = unit.getCenterX() + captured.offsetX - enemy.radius;
                enemy.y = unit.getCenterY() + captured.offsetY - enemy.radius;
                
                // ⭐ MANTÉM ATORDOAMENTO E SEM ATAQUE
                enemy.isStunned = true;
                enemy.canShoot = false;
                enemy.attackCooldown = Infinity;
                
                // ⭐ Bônus de dano
                if (!enemy.leftWingDebuffApplied) {
                    enemy.leftWingDebuffApplied = true;
                    enemy.leftWingDamageMultiplier = 1 + data.leftWingDamageBonus;
                }
            } else {
                // Remove inimigo morto da lista
                const index = unit.capturedEnemies.indexOf(captured);
                if (index > -1) {
                    unit.capturedEnemies.splice(index, 1);
                }
            }
        });
        
        // Se todos os inimigos morreram, encerra
        if (unit.capturedEnemies.length === 0) {
            this.leftWingUnits.splice(i, 1);
            this.showUI(`${unit.displayName}: Alvos eliminados!`, 'success');
        }
    }
}
}


/**
 * ✅ Detecta eventos do jogo que devem gerar reações
 */
checkGameEvents() {
    // ✅ Verifica se base está com pouca vida
    if (this.baseHealth <= 30 && this.baseHealth > 0) {
        this.reactionSystem.onBaseUnderAttack(this.selectedChampion);
    }
    
    // ✅ Verifica se algum champion está com HP baixo
    this.champions.forEach(champion => {
        const hpPercent = champion.hp / champion.maxHp;
        
        // Champion quase morrendo (10-25% HP)
        if (hpPercent <= 0.25 && hpPercent > 0.1) {
            if (!champion.hasShownLowHPReaction) {
                this.reactionSystem.onAllyLowHP(champion, this.selectedChampion);
                champion.hasShownLowHPReaction = true;
            }
        }
        // Champion em perigo crítico (<10% HP)
        else if (hpPercent <= 0.1 && hpPercent > 0) {
            if (!champion.hasShownCriticalHPReaction) {
                this.reactionSystem.onAllyCriticalHP(champion, this.selectedChampion);
                champion.hasShownCriticalHPReaction = true;
            }
        }
        // Resetar flags quando HP voltar a subir
        else if (hpPercent > 0.3) {
            champion.hasShownLowHPReaction = false;
            champion.hasShownCriticalHPReaction = false;
        }
    });
    
    // ✅ Verifica se muitos inimigos estão na tela
    if (this.enemies.length >= 15) {
        if (!this.hasShownSwarmReaction) {
            this.reactionSystem.onEnemySwarm(this.selectedChampion);
            this.hasShownSwarmReaction = true;
        }
    } else {
        this.hasShownSwarmReaction = false;
    }
}


   updateEffects(deltaTime) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.update(deltaTime);
            if (effect.isComplete) {
                this.effects.splice(i, 1);
            }
        }
    }

    update(deltaTime) {
        if (this.isPaused || this.isGameOver) return;
        

        this.updateEnemies(deltaTime);
        this.updateProjectiles(deltaTime);
        this.updateChampions(deltaTime);
        this.updateEffects(deltaTime);

         // ✅ ATUALIZA COLLECTOR SYSTEM
        if (this.collectorSystem) {
        }

        // ✅ NOVO: Atualiza sistema de reações
        this.reactionSystem.update(deltaTime);
    
        // ✅ NOVO: Detecta eventos importantes e dispara reações
        this.checkGameEvents();

      //  console.log('📊 Projéteis inimigos ativos:', this.enemyProjectiles?.length || 0);
        this.updateEnemyProjectiles(deltaTime); // NOVo

        // ⚖️ DESENHA PROJÉTEIS DA SENTENÇA FINAL
        if (this.finalSentenceBullets) {
            for (let i = this.finalSentenceBullets.length - 1; i >= 0; i--) {
                const bullet = this.finalSentenceBullets[i];
                
                if (!bullet.target || bullet.target.hp <= 0) {
                    this.finalSentenceBullets.splice(i, 1);
                    continue;
                }
                
                // Movimento teleguiado
                const targetX = bullet.target.getCenterX();
                const targetY = bullet.target.getCenterY();
                const angle = Math.atan2(targetY - bullet.y, targetX - bullet.x);
                const moveAmount = bullet.speed * (deltaTime / 1000);
                
                bullet.x += Math.cos(angle) * moveAmount;
                bullet.y += Math.sin(angle) * moveAmount;
                
                // Desenha bala
                this.ctx.save();
                this.ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
                this.ctx.shadowColor = 'rgba(255, 0, 0, 1)';
                this.ctx.shadowBlur = 15;
                this.ctx.beginPath();
                this.ctx.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
                this.ctx.restore();
                
                // Colisão
                const dist = Math.hypot(bullet.x - targetX, bullet.y - targetY);
                if (dist < 20) {
                    bullet.target.takeDamage(bullet.damage, bullet.owner);
                    this.effects.push(new this.AuraFireParticleEffect(
                        bullet.x, bullet.y, 12, 'red', 300
                    ));
                    this.finalSentenceBullets.splice(i, 1);
                }
            }
        }

        // 🚀 DESENHA MÍSSEIS DA SENTENÇA FINAL
        if (this.finalSentenceMissiles) {
            for (let i = this.finalSentenceMissiles.length - 1; i >= 0; i--) {
                const missile = this.finalSentenceMissiles[i];
                
                if (!missile.target || missile.target.hp <= 0) {
                    this.finalSentenceMissiles.splice(i, 1);
                    continue;
                }
                
                // Movimento teleguiado
                const targetX = missile.target.getCenterX();
                const targetY = missile.target.getCenterY();
                const angle = Math.atan2(targetY - missile.y, targetX - missile.x);
                const moveAmount = missile.speed * (deltaTime / 1000);
                
                missile.x += Math.cos(angle) * moveAmount;
                missile.y += Math.sin(angle) * moveAmount;
                missile.rotation = angle;
                
                // Rastro de fumaça
                missile.trailParticles.push({ x: missile.x, y: missile.y, life: 1 });
                if (missile.trailParticles.length > 15) missile.trailParticles.shift();
                missile.trailParticles.forEach(p => p.life -= 0.05);
                missile.trailParticles = missile.trailParticles.filter(p => p.life > 0);
                
                // Desenha rastro
                missile.trailParticles.forEach(p => {
                    if (p.life > 0) {
                        const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10);
                        gradient.addColorStop(0, `rgba(255, 150, 0, ${p.life})`);
                        gradient.addColorStop(1, 'rgba(100, 50, 0, 0)');
                        
                        this.ctx.fillStyle = gradient;
                        this.ctx.beginPath();
                        this.ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                });
                
                // Desenha míssil
                this.ctx.save();
                this.ctx.translate(missile.x, missile.y);
                this.ctx.rotate(missile.rotation);
                
                // Corpo do míssil
                this.ctx.fillStyle = 'rgba(80, 80, 80, 1)';
                this.ctx.fillRect(-15, -4, 30, 8);
                
                // Ponta vermelha
                this.ctx.fillStyle = 'rgba(255, 0, 0, 1)';
                this.ctx.beginPath();
                this.ctx.moveTo(15, 0);
                this.ctx.lineTo(25, 0);
                this.ctx.lineTo(15, 6);
                this.ctx.lineTo(15, -6);
                this.ctx.closePath();
                this.ctx.fill();
                
                // Chamas de propulsão
                for (let f = 0; f < 3; f++) {
                    const flameSize = 8 + Math.random() * 6;
                    this.ctx.fillStyle = f === 0 ? 'rgba(255, 255, 100, 0.9)' : 'rgba(255, 150, 0, 0.8)';
                    this.ctx.beginPath();
                    this.ctx.arc(-15 - f * 8, 0, flameSize, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                this.ctx.restore();
                
                // Colisão
                const dist = Math.hypot(missile.x - targetX, missile.y - targetY);
                if (dist < 30) {
                    // Explosão
                    missile.target.takeDamage(missile.damage, missile.owner);
                    
                    this.effects.push(new this.RedHulkExplosionEffect(
                        missile.x, missile.y, missile.explosionRadius, 800, 'rgba(255, 100, 0, 0.9)'
                    ));
                    
                    // Dano em área
                    this.champions.forEach(champ => {
                        const aoeDist = Math.hypot(missile.x - champ.getCenterX(), missile.y - champ.getCenterY());
                        if (aoeDist < missile.explosionRadius && champ.hp > 0) {
                            champ.takeDamage(missile.damage * 0.5, missile.owner);
                        }
                    });
                    
                    this.finalSentenceMissiles.splice(i, 1);
                }
            }
        }

           // ===============================
    // 🔥 ATUALIZA CLONES TELEPÁTICOS (MELHORADO)
    // ===============================
    if (this.telepathicIllusions) {
        for (let i = this.telepathicIllusions.length - 1; i >= 0; i--) {
            const clone = this.telepathicIllusions[i];
            
            // 🔥 MOVIMENTO EM DIREÇÃO AO ALVO
            if (clone.target && clone.target.hp > 0) {
                const targetX = clone.target.getCenterX();
                const targetY = clone.target.getCenterY();
                const dist = Math.hypot(targetX - clone.x, targetY - clone.y);
                
                if (dist > 30) {
                    const angle = Math.atan2(targetY - clone.y, targetX - clone.x);
                    const moveAmount = clone.speed * (deltaTime / 1000);
                    
                    clone.x += Math.cos(angle) * moveAmount;
                    clone.y += Math.sin(angle) * moveAmount;
                    
                    // 🔥 PARTÍCULAS DE RASTRO
                    clone.trailParticles.push({
                        x: clone.x,
                        y: clone.y,
                        time: Date.now(),
                        life: 500
                    });
                    
                    // Limpa partículas antigas
                    clone.trailParticles = clone.trailParticles.filter(
                        p => Date.now() - p.time < p.life
                    );
                } else {
                    // Chegou perto, explode imediatamente
                    clone.detonationTime = Date.now();
                }
            } else if (clone.target) {
                // Alvo morreu, busca novo
                let newTarget = this.enemies.reduce((prev, current) => 
                    (prev && prev.hp > current.hp) ? prev : current
                , null);
                clone.target = newTarget;
            }
            
            // Verifica se chegou a hora de detonar
            if (Date.now() >= clone.detonationTime) {
                const data = Champion.championData.jeangrey;
                
                // 🔥 EXPLOSÃO ÉPICA
                this.effects.push(new this.PhoenixExplosionEffect(
                    clone.x,
                    clone.y,
                    clone.radius,
                    1000
                ));
                
                // Ondas de choque
                for (let w = 1; w <= 3; w++) {
                    setTimeout(() => {
                        this.effects.push(new this.USAgentShockwaveEffect(
                            clone.x,
                            clone.y,
                            clone.radius * (0.8 + w * 0.15),
                            400
                        ));
                    }, w * 100);
                }
                
                // Aplica dano e Faíscas
                let hitCount = 0;
                this.enemies.forEach(enemy => {
                    const dist = Math.hypot(
                        clone.x - enemy.getCenterX(),
                        clone.y - enemy.getCenterY()
                    );
                    
                    if (dist < clone.radius) {
                        enemy.takeDamage(data.illusionDamage, clone.owner);
                        hitCount++;
                        
                        // Aplica 1 Faísca
                        if (clone.owner.addSpark) {
                            clone.owner.addSpark(enemy, this.enemies, this.effects);
                        }
                        
                        this.effects.push(new this.TextPopEffect(
                            enemy.getCenterX(),
                            enemy.getCenterY() - 20,
                            `🔥 ${data.illusionDamage}`,
                            'orange',
                            800
                        ));
                    }
                });
                
                // Remove o clone
                this.telepathicIllusions.splice(i, 1);
                
                if (hitCount > 0) {
                    this.showUI(`Clone: ${hitCount} inimigos atingidos!`, 'special');
                }
            }
        }
    }

    // 🔥 NOVO: ATUALIZA RESSURGIMENTO DA FÊNIX
    this.champions.forEach(champion => {
        if (champion.type === 'jeangrey' && champion.isPhoenixRebirthing) {
            const now = Date.now();
            const data = Champion.championData.jeangrey;
            
            // Fase de descida
            if (now < champion.phoenixRebirthLandTime) {
                const progress = (now - champion.phoenixRebirthStartTime) / data.phoenixRebirthDescent;
                
                // Move Jean gradualmente para o alvo
                champion.x = champion.phoenixRebirthOriginalX + 
                    (champion.phoenixRebirthTargetX - champion.phoenixRebirthOriginalX - champion.width/2) * progress;
                champion.y = champion.phoenixRebirthOriginalY + 
                    (champion.phoenixRebirthTargetY - champion.phoenixRebirthOriginalY - champion.height/2) * progress;
                
                // Efeito de descida
                if (now % 100 < 50) {
                    this.effects.push(new this.AuraFireParticleEffect(
                        champion.getCenterX(),
                        champion.getCenterY(),
                        25,
                        'orange',
                        400
                    ));
                }
            }
            // Momento do impacto
            else if (!champion.phoenixRebirthImpacted) {
                champion.phoenixRebirthImpacted = true;
                
                // 🔥 EXPLOSÃO MASSIVA
                this.effects.push(new this.PhoenixRebirthExplosionEffect(
                    champion.phoenixRebirthTargetX,
                    champion.phoenixRebirthTargetY,
                    data.phoenixRebirthRadius,
                    1500
                ));
                
                // Aplica dano, Faíscas e execução
                let enemiesKilled = 0;
                this.enemies.forEach(enemy => {
                    const dist = Math.hypot(
                        champion.phoenixRebirthTargetX - enemy.getCenterX(),
                        champion.phoenixRebirthTargetY - enemy.getCenterY()
                    );
                    
                    if (dist < data.phoenixRebirthRadius) {
                        const hpPercent = enemy.hp / enemy.maxHp;
                        
                        // Execução: mata inimigos abaixo de 30% HP
                        if (hpPercent < data.phoenixRebirthKillThreshold) {
                            enemy.hp = 0;
                            enemy.isDestroyed = true;
                            enemiesKilled++;
                            
                            this.effects.push(new this.TextPopEffect(
                                enemy.getCenterX(),
                                enemy.getCenterY() - 30,
                                '☠️ EXECUTADO!',
                                'red',
                                1200
                            ));
                        } else {
                            enemy.takeDamage(data.phoenixRebirthDamage, champion);
                            
                            this.effects.push(new this.TextPopEffect(
                                enemy.getCenterX(),
                                enemy.getCenterY() - 20,
                                `🔥 ${data.phoenixRebirthDamage}`,
                                'orange',
                                1000
                            ));
                        }
                        
                        // Aplica 1 Faísca
                        if (champion.addSpark && enemy.hp > 0) {
                            champion.addSpark(enemy, this.enemies, this.effects);
                        }
                    }
                });
                
                if (enemiesKilled > 0) {
                    this.showUI(`Fênix: ${enemiesKilled} inimigos executados!`, 'ultimate');
                }
                
                // Retorna Jean para posição original após 1s
                setTimeout(() => {
                    champion.x = champion.phoenixRebirthOriginalX;
                    champion.y = champion.phoenixRebirthOriginalY;
                    
                    // 🔥 CURA TOTAL
                    champion.hp = champion.maxHp;
                    
                    // Remove invulnerabilidade
                    champion.isInvulnerable = false;
                    champion.isPhoenixRebirthing = false;
                    champion.phoenixRebirthImpacted = false;
                    
                    // Efeito de ressurgimento
                    this.effects.push(new this.PhoenixExplosionEffect(
                        champion.getCenterX(),
                        champion.getCenterY(),
                        80,
                        800
                    ));
                    
                    this.showUI('Jean Grey: Ressurgiu completamente curada!', 'success');
                }, 1000);
            }
        }
    });

  // ===============================
    // ⭐ NOVO: ATUALIZA ILUSÕES TELEPÁTICAS
    // ===============================
    if (this.telepathicIllusions) {
        for (let i = this.telepathicIllusions.length - 1; i >= 0; i--) {
            const illusion = this.telepathicIllusions[i];
            
            // Verifica se chegou a hora de detonar
            if (Date.now() >= illusion.detonationTime) {
                const data = Champion.championData.jeangrey;
                
                // Explosão
                this.effects.push(new this.PhoenixExplosionEffect(
                    illusion.x,
                    illusion.y,
                    illusion.radius,
                    800
                ));
                
                // Aplica dano e Faíscas
                this.enemies.forEach(enemy => {
                    const dist = Math.hypot(
                        illusion.x - enemy.getCenterX(),
                        illusion.y - enemy.getCenterY()
                    );
                    
                    if (dist < illusion.radius) {
                        enemy.takeDamage(data.illusionDamage, illusion.owner);
                        
                        // Aplica 1 Faísca
                        if (illusion.owner.addSpark) {
                            illusion.owner.addSpark(enemy, this.enemies, this.effects);
                        }
                        
                        this.effects.push(new this.TextPopEffect(
                            enemy.getCenterX(),
                            enemy.getCenterY() - 20,
                            `🔥 ${data.illusionDamage}`,
                            'orange',
                            800
                        ));
                    }
                });
                
                // Remove a ilusão
                this.telepathicIllusions.splice(i, 1);
                this.showUI('Jean Grey: Ilusão detonada!', 'special');
            }
        }
    }

        if (this.collectorSystem) {
        this.collectorSystem.update(deltaTime);
        }

        // ✅ ATUALIZA PROJÉTEIS DAS SENTINELAS
        if (this.sentinelProjectiles) {
            this.sentinelProjectiles.forEach(proj => {
                if (proj && proj.update) {
                    proj.update(deltaTime);
                }
            });
            this.sentinelProjectiles = this.sentinelProjectiles.filter(p => !p.isDestroyed);
        }
        
        // ✅ ATUALIZA HOLOGRAMAS
        if (this.holograms) {
            this.holograms.forEach(h => {
                if (h && h.update) {
                    h.update(deltaTime);
                }
            });
            this.holograms = this.holograms.filter(h => h.hp > 0);
        }
        
        // Atualiza Cones de Atração Psiônica (Team Up Emma/Wanda)
        if (this.psychicAttractionCones) {
            this.psychicAttractionCones = this.psychicAttractionCones.filter(cone => {
                // O método update retorna false quando o efeito acaba
                return cone.update(deltaTime, this.enemies); 
            });
        }

        // Atualiza Team Up da Wanda (Controle do Caos)
        if (this.teamUpEffects) {
            this.teamUpEffects = this.teamUpEffects.filter(effect => {
                return effect.update(deltaTime, this.enemies); 
            });
        }

        // Atualiza Team Up da Wanda (Feixe de Drenagem do Caos)
        if (this.chaosDrainEffects) {
            this.chaosDrainEffects = this.chaosDrainEffects.filter(effect => {
                // Assume que o método update() retorna false quando o efeito acaba
                return effect.update(deltaTime, this.enemies); 
            });
        }

         // 💬 Atualiza balões de fala
    if (this.speechBubbles) {
        this.speechBubbles = this.speechBubbles.filter(bubble => {
            bubble.update(deltaTime);
            return !bubble.isDestroyed;
        });
    }

    
// 🧠 ATUALIZA ATAQUES DOS MINIONS MENTAIS
this.champions.forEach(champion => {
    if (champion.type === 'infinityultron' && champion.activeMinions) {
        champion.activeMinions.forEach(minion => {
            if (minion.attackCooldown <= 0) {
                // 🎯 PROCURA INIMIGO MAIS PRÓXIMO
                let nearestEnemy = null;
                let minDist = minion.attackRange;
                
                this.enemies.forEach(enemy => {
                    const dist = Math.hypot(
                        minion.x - enemy.getCenterX(),
                        minion.y - enemy.getCenterY()
                    );
                    
                    if (dist < minDist) {
                        minDist = dist;
                        nearestEnemy = enemy;
                    }
                });
                
                if (nearestEnemy) {
                    // 🟠 ATAQUE COM LASER LARANJA
                    nearestEnemy.takeDamage(minion.damage, minion.owner);
                    
                    // Efeito visual laranja épico
                    this.effects.push(new this.LaserEffect(
                        minion.x,
                        minion.y,
                        nearestEnemy.getCenterX(),
                        nearestEnemy.getCenterY(),
                        300, // duration
                        'rgba(255, 140, 0, 1)', // cor laranja
                        5 // width
                    ));
                    
                    // Partículas no impacto
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 / 8) * i;
                        this.effects.push(new this.AuraFireParticleEffect(
                            nearestEnemy.getCenterX() + Math.cos(angle) * 10,
                            nearestEnemy.getCenterY() + Math.sin(angle) * 10,
                            10,
                            'orange',
                            200
                        ));
                    }
                    
                    // Flash no minion
                    this.effects.push(new this.RedHulkExplosionEffect(
                        minion.x,
                        minion.y,
                        15,
                        200,
                        'rgba(255, 140, 0, 0.8)'
                    ));
                    
                    minion.attackCooldown = minion.attackSpeed;
                }
            }
        });
    }
});

  // 🌀 PORTAIS DE ENGANO - SÓ SE LOKI ESTIVER EM CAMPO
    const hasLoki = this.champions.some(c => c.type === 'loki' && c.hp > 0);
    
    if (hasLoki) {
        // Spawn de portais
        if (Math.random() < this.PORTAL_SPAWN_CHANCE && this.portals.length < 4) {
            const canvas = this.canvas;
            const entryX = 50 + Math.random() * (canvas.width - 100);
            const entryY = 50 + Math.random() * (canvas.height - 100);
            
            let exitX = 50 + Math.random() * (canvas.width - 100);
            let exitY = 50 + Math.random() * (canvas.height - 100);
            
            // Garante distância mínima
            while (Math.hypot(exitX - entryX, exitY - entryY) < 150) {
                exitX = 50 + Math.random() * (canvas.width - 100);
                exitY = 50 + Math.random() * (canvas.height - 100);
            }
            
            const exitPortal = new Portal(exitX, exitY, null);
            const entryPortal = new Portal(entryX, entryY, exitPortal);
            exitPortal.exitPortal = entryPortal;
            
            this.portals.push(entryPortal, exitPortal);
            
            console.log('🌀 Par de portais criado!'); // Debug
            
            // Remove após duração
            setTimeout(() => {
                const idx1 = this.portals.indexOf(entryPortal);
                const idx2 = this.portals.indexOf(exitPortal);
                if (idx1 > -1) this.portals.splice(idx1, 1);
                if (idx2 > -1) this.portals.splice(idx2, 1);
                console.log('🌀 Portais removidos'); // Debug
            }, this.PORTAL_DURATION);
        }
        
        // Atualiza cooldowns
        this.portals.forEach(portal => {
            if (portal.cooldown > 0) portal.cooldown -= deltaTime;
        });
        
        // Verifica colisões
        this.enemies.forEach(enemy => {
            this.portals.forEach(portal => {
                if (portal.active && portal.checkCollision(enemy)) {
                    portal.teleport(enemy, this);
                }
            });
        });
         // ⭐ NOVO: BAÚS SÓ COM LOKI
        if (Date.now() - this.lastChestSpawn > this.CHEST_SPAWN_INTERVAL) {
            this.chests.push(new Chest(this.canvas));
            this.lastChestSpawn = Date.now();
            console.log('💰 Baú de Asgard criado! (Loki presente)');
        }

    } else {
        // Remove todos os portais se Loki morrer/não estiver em campo
        if (this.portals.length > 0) {
            this.portals = [];
            console.log('🌀 Loki não está em campo - portais removidos');
        }
         // ⭐ NOVO: Remove baús se Loki não estiver
        if (this.chests.length > 0) {
            this.chests = [];
            console.log('💰 Baús removidos (Loki não está em campo)');
        }
    }
 // Atualiza sistema de reações
    if (this.reactionSystem && typeof this.reactionSystem.update === 'function') {
        this.reactionSystem.update(deltaTime);
    }
    
    // Detecta eventos para reações
    if (this.reactionSystem) {
        this.checkGameEvents();
    }

        // Spawn de inimigos
        const currentTime = Date.now();
        if (this.waveInProgress && this.enemiesSpawned < this.enemiesToSpawn) {
            if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
                this.spawnEnemy();
                this.lastSpawnTime = currentTime;
            }
        
        }
            this.chests = this.chests.filter(chest => !chest.collected);

        
            // NOVO: Atualiza nuvens de enxofre
    if (this.sulfurClouds) {
        for (let i = this.sulfurClouds.length - 1; i >= 0; i--) {
            const cloud = this.sulfurClouds[i];
            
            // Remove se expirou
            if (Date.now() - cloud.spawnTime > cloud.duration) {
                this.sulfurClouds.splice(i, 1);
                continue;
            }
            
            // Aplica efeitos nos inimigos
            if (Date.now() - cloud.lastDamageTick > 500) {
                this.enemies.forEach(enemy => {
                    const dist = Math.hypot(cloud.x - enemy.getCenterX(), cloud.y - enemy.getCenterY());
                    if (dist < cloud.radius) {
                        enemy.takeDamage(cloud.damage, cloud.owner);
                        
                        // Reduz alcance de ataque do inimigo
                        enemy.attackRange = (enemy.attackRange || 150) * 0.7;
                        enemy.sulfurDebuffEnd = Date.now() + 2000;
                    }
                });
                cloud.lastDamageTick = Date.now();
            }
             
        }
        // ⚖️ Atualiza projéteis de divisão
    if (this.splitProjectiles) {
        this.splitProjectiles = this.splitProjectiles.filter(proj => !proj.isDestroyed);
        this.splitProjectiles.forEach(proj => proj.update(deltaTime));
    }
    }
    
    // ... código existente ...
    
    // NOVO: Atualiza zonas de fumaça
    if (this.smokeZones) {
        for (let i = this.smokeZones.length - 1; i >= 0; i--) {
            const zone = this.smokeZones[i];
            
            // Remove se expirou
            if (Date.now() - zone.spawnTime > zone.duration) {
                // Remove debuffs dos inimigos
                this.enemies.forEach(enemy => {
                    if (enemy.inSmokeZone) {
                        enemy.inSmokeZone = false;
                        enemy.smokeSlowFactor = 0;
                        enemy.accuracyReduction = 0;
                    }
                });
                
                this.smokeZones.splice(i, 1);
                continue;
            }
            
            // Mantém debuffs nos inimigos dentro da zona
            this.enemies.forEach(enemy => {
                const dist = Math.hypot(zone.x - enemy.getCenterX(), zone.y - enemy.getCenterY());
                if (dist < zone.radius) {
                    enemy.inSmokeZone = true;
                    enemy.smokeSlowFactor = 0.4; // 40% mais lento
                    enemy.accuracyReduction = 0.3; // 30% menos preciso
                }
            });
        }
    }
    
// ☀️💥 Atualiza Supernova Beams
if (this.supernovaBeams) {
    for (let i = this.supernovaBeams.length - 1; i >= 0; i--) {
        const beam = this.supernovaBeams[i];
        const isActive = beam.update(deltaTime);
        
        if (!isActive) {
            // Efeito final ao desaparecer
            const endX = beam.x + Math.cos(beam.angle) * beam.length;
            const endY = beam.y + Math.sin(beam.angle) * beam.length;
            
            this.effects.push(new this.RedHulkExplosionEffect(
                endX, endY, 120, 600, 'rgba(255, 150, 0, 0.8)'
            ));
            
            this.supernovaBeams.splice(i, 1);
        }
    }
}

// ☀️ Atualiza Chamas Solares
if (this.supernovaBeams) {
    this.supernovaBeams.forEach(beam => {
        beam.solarFlames = beam.solarFlames.filter(flame => {
            const elapsed = Date.now() - flame.spawnTime;
            
            if (elapsed < 0) return true; // Ainda não spawnou
            if (elapsed > flame.duration) return false; // Expirou
            
            // Aplica dano aos inimigos na área
            if (Date.now() % 500 < 50) { // A cada 0.5s
                this.enemies.forEach(enemy => {
                    const dist = Math.hypot(
                        flame.x - enemy.getCenterX(),
                        flame.y - enemy.getCenterY()
                    );
                    
                    if (dist < flame.radius) {
                        enemy.takeDamage(flame.damage, flame.owner);
                    }
                });
            }
            
            return true;
        });
    });
}

// 👻 Atualiza Chamas Solares (efeito visual no draw)
if (this.supernovaBeams) {
    this.supernovaBeams.forEach(beam => {
        beam.solarFlames.forEach(flame => {
            const elapsed = Date.now() - flame.spawnTime;
            if (elapsed < 0 || elapsed > flame.duration) return;
            
            const progress = elapsed / flame.duration;
            const alpha = 1 - progress;
            
            // Partículas de fogo
            if (Math.random() < 0.3) {
                this.effects.push(new this.AuraFireParticleEffect(
                    flame.x + (Math.random() - 0.5) * flame.radius,
                    flame.y + (Math.random() - 0.5) * flame.radius,
                    10 + Math.random() * 10,
                    ['orange', 'red', 'yellow'][Math.floor(Math.random() * 3)],
                    800
                ));
            }
        });
    });
}

        // Verifica fim da onda
        if (this.enemiesSpawned >= this.enemiesToSpawn && this.enemies.length === 0 && this.waveInProgress) {
            this.waveInProgress = false;
            this.showUI(`Fase ${this.currentPhase} completa!`, 'success');
                    
            // ✅ ABRE BAÚ DE FASE
            if (this.collectorSystem) {
                setTimeout(() => {
                    this.collectorSystem.onPhaseComplete(this.currentPhase);
                }, 1000);
            }

            setTimeout(() => this.startWave(), 3000);
             
            this.updateUI();
        }

        // 💀 Atualiza Lasers do Líder
if (this.leaderLasers) {
    for (let i = this.leaderLasers.length - 1; i >= 0; i--) {
        const laser = this.leaderLasers[i];
        laser.update(deltaTime);
        
        if (laser.isDestroyed) {
            this.leaderLasers.splice(i, 1);
        }
    }
}

// 🌫️ Atualiza Gases Venenosos
if (this.poisonGases) {
    for (let i = this.poisonGases.length - 1; i >= 0; i--) {
        const gas = this.poisonGases[i];
        const elapsed = Date.now() - gas.spawnTime;
        
        if (elapsed > gas.duration) {
            this.poisonGases.splice(i, 1);
            continue;
        }
        
        // Aplica dano aos champions na área
        if (Date.now() % 500 < 50) { // A cada 0.5s
            this.champions.forEach(champion => {
                const dist = Math.hypot(
                    gas.x - champion.getCenterX(),
                    gas.y - champion.getCenterY()
                );
                
                if (dist < gas.radius) {
                    champion.takeDamage(gas.damage, gas.owner);
                    
                    this.effects.push(new this.TextPopEffect(
                        champion.getCenterX(),
                        champion.getCenterY() - 20,
                        '☠️ VENENO',
                        'purple',
                        500
                    ));
                }
            });
        }
    }
}
        this.updateUI();
    }
    
    
    /**
 * 🎮 Detecta eventos do jogo para reações
 */
checkGameEvents() {
    if (!this.reactionSystem) return;
    
    // Base com pouca vida
    if (this.baseHealth <= 30 && this.baseHealth > 0) {
        if (!this.hasShownBaseLowHP) {
            this.reactionSystem.onBaseUnderAttack(this.selectedChampion);
            this.hasShownBaseLowHP = true;
        }
    } else if (this.baseHealth > 40) {
        this.hasShownBaseLowHP = false;
    }
    
    // Champions com HP baixo
    this.champions.forEach(champion => {
        const hpPercent = champion.hp / champion.maxHp;
        
        if (hpPercent <= 0.25 && hpPercent > 0.1) {
            if (!champion.hasShownLowHPReaction) {
                this.reactionSystem.onAllyLowHP(champion, this.selectedChampion);
                champion.hasShownLowHPReaction = true;
            }
        } else if (hpPercent > 0.3) {
            champion.hasShownLowHPReaction = false;
        }
    });
    
    // Muitos inimigos
    if (this.enemies.length >= 15) {
        if (!this.hasShownSwarmReaction) {
            this.reactionSystem.onEnemySwarm(this.selectedChampion);
            this.hasShownSwarmReaction = true;
        }
    } else if (this.enemies.length < 10) {
        this.hasShownSwarmReaction = false;
    }
}

    gameLoop = (timestamp) => {
        if (this.isGameOver) return;

        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.gameLoop);
    }

   init() {
    console.log('🎮 GameManager.init() chamado');
    
   // OLHAR this.collectorSystem.loadInventory();

    setTimeout(() => {
        console.log('⏰ setTimeout executado');
        
        if (this.isInitialized) {
            console.log('⚠️ Já inicializado, abortando');
            return;
        }
        
        this.isInitialized = true;
        console.log('✅ Marcado como inicializado');
        
        // 💀 Inicializa Sistema de Executores
        this.executorSpawnSystem = new ExecutorSpawnSystem(this);
        console.log('✅ Sistema de Executores inicializado');

        this.initializeUIElements();
        console.log('✅ UI inicializada');
        
        this.setupEventListeners();
        console.log('✅ Event listeners configurados');
        
        this.populateChampionMenu();
        console.log('✅ Menu de champions populado');

         // ✅ Cria CollectorSystem
        console.log('📦 Criando CollectorSystem...');
        this.collectorSystem = new CollectorSystem(this);

                
        // ✅ Configura drag & drop
        this.setupCanvasDragDrop();
        
        if (this.collectorSystem) {
            this.collectorSystem.loadInventory();
            
         
            setTimeout(() => {
                this.collectorSystem.checkInventoryButton();
            }, 2000);
        }
        
        
        // ✅ VERIFICAÇÃO CRÍTICA
        const overlayElement = document.getElementById('pauseMenuOverlay');
        console.log('🔍 Elemento #pauseMenuOverlay existe?', !!overlayElement);
        console.log('🔍 Elemento:', overlayElement);
        
        if (!overlayElement) {
            console.error('❌ ERRO CRÍTICO: #pauseMenuOverlay não encontrado no DOM!');
            console.error('❌ O menu de pause NÃO será criado!');
            this.pauseMenu = null;
        } else {
            console.log('🎮 Criando PauseMenuSystem...');
            try {
                this.pauseMenu = new PauseMenuSystem(this);
                console.log('✅ PauseMenuSystem criado com sucesso:', this.pauseMenu);
            } catch (error) {
                console.error('❌ ERRO ao criar PauseMenuSystem:', error);
                this.pauseMenu = null;
            }
        }


        // 🎵 Inicializa Music Player
        this.musicPlayer = new MusicPlayer();
        console.log('✅ Music Player inicializado');
        
        // Inicializa sistema de reações DEPOIS do DOM estar pronto
        this.reactionSystem = new CharacterReactionSystem(this);
        this.setupReactionListeners();
        
        this.updateUI();
        console.log('✅ UI atualizada');

        // ✅ Setup Drag & Drop para ferramentas
        if (this.collectorSystem) {
        }

        this.lastFrameTime = performance.now();
        this.gameLoop(this.lastFrameTime);
        this.startWave();
        
        console.log('✅ GameManager.init() COMPLETO');
    }, 100);
}


    updateEffects(deltaTime) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.update(deltaTime);
            if (effect.isComplete) {
                this.effects.splice(i, 1);
            }
        }
    }

    gameLoop = (timestamp) => {
        if (this.isGameOver) return;

        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.gameLoop);
    }
/**
 * ✅ Mostra reações ao completar fase
 */
completeWave() {
    this.waveInProgress = false;
    
    // ✅ NOVO: Mostra reações de vitória
    this.reactionSystem.onWaveComplete(this.currentPhase, this.selectedChampion);
    
    this.showUI(`Fase ${this.currentPhase} completa!`, 'success');
    setTimeout(() => this.startWave(), 3000);

    if (this.gameManager.collectorSystem) {
    this.gameManager.collectorSystem.onPhaseComplete(this.currentPhase);
    }
}

}   
// Fechar modal
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.modal-close')?.addEventListener('click', () => {
        document.getElementById('heroDetailModal').style.display = 'none';
    });
});

// Expõe gameManager globalmente para debug
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.gameManager && window.gameManager.collectorSystem) {
            window.gameManager.collectorSystem.checkInventoryButton();
        }
    }, 3000);
});


document.addEventListener('DOMContentLoaded', () => {
    const gameManager = new GameManager();
    gameManager.init();
});