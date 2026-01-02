// projectiles.js
// Define a classe base Projectile e subclasses para cada tipo de projétil.
import { Champion } from './champions.js';
    /**
 * Classe base para todos os projéteis no jogo.
 */
export class Projectile {
    constructor(x, y, targetX, targetY, speed, damage, owner, type, radiusCollision = 10, gameManagerInstance) {
        this.id = Date.now() + Math.random();
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = speed;
        this.damage = damage;
        this.owner = owner;
        this.type = type;
        this.radiusCollision = radiusCollision;
        this.isDestroyed = false;
        this.hitEnemies = [];
        this.gameManager = gameManagerInstance;

        // Propriedades para efeitos e comportamentos específicos
        this.stunDuration = 0;
        this.poisonDamagePerTick = 0;
        this.poisonDuration = 0;
        this.poisonTickRate = 0;
        this.slowFactor = 0;
        this.slowDuration = 0;
        this.bleedDamagePerTick = 0;
        this.bleedDuration = 0;
        this.disarmDuration = 0;
        this.confuseDuration = 0;

        this.explosionRadius = 0;
        this.explosionDamage = 0;

        this.isPiercing = false;
        this.piercingCount = 0;

        this.isReturning = false;
        this.currentTarget = null;

        this.halfHpOnHit = false;
        this.poisonChance = 0;
        this.stunChance = 0;

        this.rotation = Math.random() * Math.PI * 2;
    }

    update(deltaTime) {
        const distanceToTarget = Math.hypot(this.targetX - this.x, this.targetY - this.y);
        const moveAmount = this.speed * (deltaTime / 1000);

        if (distanceToTarget <= moveAmount) {
            this.x = this.targetX;
            this.y = this.targetY;
            
            if (!this.isPiercing && this.type !== 'mjolnirProjectile' && 
                this.type !== 'capShieldProjectile' && this.explosionRadius === 0) {
                this.isDestroyed = true;
            }
        } else {
            const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
            this.x += Math.cos(angle) * moveAmount;
            this.y += Math.sin(angle) * moveAmount;
        }

        if (this.type === 'mjolnirProjectile' || this.type === 'capShieldProjectile') {
            this.rotation += 0.3 * (deltaTime / (1000 / 60));
        }
    }

    draw(ctx, mjolnirImage, capShieldImage, usagentShieldImage, wandaIllusionImage) {
        ctx.save();
        ctx.translate(this.x, this.y);

        switch (this.type) {
            case 'laser':
            case 'droneLaserProjectile':
                ctx.fillStyle = this.color || 'red';
                ctx.beginPath();
                ctx.arc(0, 0, this.radiusCollision, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'mjolnirProjectile':
                if (mjolnirImage && mjolnirImage.complete) {
                    ctx.rotate(this.rotation);
                    ctx.drawImage(mjolnirImage, -this.radiusCollision, -this.radiusCollision, 
                        this.radiusCollision * 2, this.radiusCollision * 2);
                } else {
                    ctx.fillStyle = 'silver';
                    ctx.beginPath();
                    ctx.arc(0, 0, this.radiusCollision, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case 'hawkeyeArrow':
                ctx.strokeStyle = 'brown';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-10, 0);
                ctx.lineTo(10, 0);
                ctx.stroke();
                break;

            case 'capShieldProjectile':
                if (capShieldImage && capShieldImage.complete) {
                    ctx.rotate(this.rotation);
                    ctx.drawImage(capShieldImage, -this.radiusCollision, -this.radiusCollision, 
                        this.radiusCollision * 2, this.radiusCollision * 2);
                } else {
                    ctx.fillStyle = 'red';
                    ctx.beginPath();
                    ctx.arc(0, 0, this.radiusCollision, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.arc(0, 0, this.radiusCollision * 0.7, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'red';
                    ctx.beginPath();
                    ctx.arc(0, 0, this.radiusCollision * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case 'lokiPoisonDagger':
                ctx.fillStyle = this.color || 'purple';
                ctx.beginPath();
                ctx.arc(0, 0, this.radiusCollision, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'usagentBullet':
                if (usagentShieldImage && usagentShieldImage.complete) {
                    ctx.drawImage(usagentShieldImage, -this.radiusCollision, -this.radiusCollision, 
                        this.radiusCollision * 2, this.radiusCollision * 2);
                } else {
                    ctx.fillStyle = 'silver';
                    ctx.beginPath();
                    ctx.arc(0, 0, this.radiusCollision, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                

            case 'wandaIllusionPulse':
                if (wandaIllusionImage && wandaIllusionImage.complete) {
                    ctx.save();
                    const pulseAlpha = 0.6 + Math.sin(Date.now() / 150) * 0.2;
                    ctx.globalAlpha = pulseAlpha;
                    ctx.drawImage(wandaIllusionImage, -this.radiusCollision * 1.5, -this.radiusCollision * 1.5, 
                        this.radiusCollision * 3, this.radiusCollision * 3);
                    ctx.restore();
                } else {
                    ctx.fillStyle = 'fuchsia';
                    ctx.beginPath();
                    ctx.arc(0, 0, this.radiusCollision, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case 'diamondShardProjectile':
                ctx.fillStyle = 'aqua';
                ctx.beginPath();
                ctx.moveTo(0, -this.radiusCollision);
                ctx.lineTo(this.radiusCollision * 0.866, this.radiusCollision * 0.5);
                ctx.lineTo(-this.radiusCollision * 0.866, this.radiusCollision * 0.5);
                ctx.closePath();
                ctx.fill();
                break;

            case 'captainMarvelMissile':
                ctx.fillStyle = 'orange';
                ctx.beginPath();
                ctx.arc(0, 0, this.radiusCollision, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255, 165, 0, 0.7)';
                ctx.beginPath();
                ctx.moveTo(0, this.radiusCollision);
                ctx.lineTo(-this.radiusCollision * 0.8, this.radiusCollision * 2);
                ctx.lineTo(this.radiusCollision * 0.8, this.radiusCollision * 2);
                ctx.closePath();
                ctx.fill();
                break;

            default:
                ctx.fillStyle = 'grey';
                ctx.beginPath();
                ctx.arc(0, 0, this.radiusCollision, 0, Math.PI * 2);
                ctx.fill();
                break;
        }

        ctx.restore();
    }
}

export class LaserProjectile extends Projectile {
    constructor(x, y, targetX, targetY, speed, damage, ownerId, gameManagerInstance, color = 'red') {
        super(x, y, targetX, targetY, speed, damage, ownerId, 'laser', 5, gameManagerInstance);
        this.color = color;
    }
}

export class MjolnirProjectile extends Projectile {
    constructor(x, y, targetX, targetY, speed, damage, owner, gameManagerInstance) {
        super(x, y, targetX, targetY, speed, damage, owner, 'mjolnirProjectile', 15, gameManagerInstance);
        this.isReturning = false;
        this.hasHitOnce = false;
        this.rotationSpeed = 0.3;
    }

// MjolnirProjectile - CORREÇÃO COMPLETA
update(deltaTime) {
    if (this.isReturning) {
        if (this.owner && !this.owner.isDestroyed) {
            this.targetX = this.owner.getCenterX();
            this.targetY = this.owner.getCenterY();
        } else {
            this.isDestroyed = true;
            if (this.owner && this.owner.isMjolnirActive !== undefined) {
                this.owner.isMjolnirActive = false;
            }
            return;
        }

        const distToOwner = Math.hypot(this.targetX - this.x, this.targetY - this.y);
        const moveAmount = this.speed * (deltaTime / 1000);

        // ⭐ CORREÇÃO: Só considera "chegou" se está REALMENTE perto (menos de 30 pixels)
        if (distToOwner <= 70) {
            this.isDestroyed = true;
            if (this.owner && this.owner.isMjolnirActive !== undefined) {
                this.owner.isMjolnirActive = false;
                console.log('✅ Mjolnir retornou');
            }
        } else {
            const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
            this.x += Math.cos(angle) * moveAmount;
            this.y += Math.sin(angle) * moveAmount;
        }
        this.rotation += this.rotationSpeed * (deltaTime / (1000 / 60));
        return;
    }

    // Movimento de IDA
    const distanceToCurrentTarget = Math.hypot(this.targetX - this.x, this.targetY - this.y);
    const moveAmount = this.speed * (deltaTime / 1000);
    //console.log('distanceToCurrentTarget: '+ distanceToCurrentTarget +'\nmoveAmount: ' + moveAmount)
    
    if (distanceToCurrentTarget <= 70) {
        this.x = this.targetX;
        this.y = this.targetY;

        if (!this.hasHitOnce) {
            let closestEnemy = null;
            let minDistance = this.radiusCollision + 20;
            
            for (const enemy of this.gameManager.enemies) {
                const distToEnemy = Math.hypot(this.x - enemy.getCenterX(), this.y - enemy.getCenterY());
                if (distToEnemy < minDistance && !this.hitEnemies.includes(enemy.id)) {
                    minDistance = distToEnemy;
                    closestEnemy = enemy;
                }
            }

            if (closestEnemy) {
                closestEnemy.takeDamage(this.damage, this.owner);
                this.hasHitOnce = true;
                this.hitEnemies.push(closestEnemy.id);
            }
            this.isReturning = true;
        } else {
            this.isReturning = true;
        }
    } else {
        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        this.x += Math.cos(angle) * moveAmount;
        this.y += Math.sin(angle) * moveAmount;
    }
    this.rotation += this.rotationSpeed * (deltaTime / (1000 / 60));
}
}

export class HawkeyeArrow extends Projectile {
    constructor(x, y, targetX, targetY, speed, damage, owner, arrowType, gameManagerInstance) {
        super(x, y, targetX, targetY, speed, damage, owner, 'hawkeyeArrow', 10, gameManagerInstance);
        this.arrowType = arrowType; // 'standard', 'shock', 'ice', 'poison', 'explosive', 'triple'
        this.spawnTime = Date.now();
        this.lifespan = 3000; // 3 segundos antes de desaparecer
        
        // Propriedades específicas por tipo
        if (arrowType === 'shock') {
            this.stunChance = 0.7;
            this.stunDuration = 1000;
            this.color = 'yellow';
        } else if (arrowType === 'ice') {
            this.freezeChance = 0.5;
            this.freezeDuration = 2500;
            this.color = 'lightblue';
        } else if (arrowType === 'poison') {
            this.poisonDuration = 5000;
            this.poisonTickRate = 500;
            this.poisonDamagePerTick = 3;
            this.color = 'lime';
        } else if (arrowType === 'explosive') {
            this.explosionRadius = 60;
            this.explosionDamage = 40;
            this.color = 'orange';
        } else {
            this.color = 'brown';
        }
    }

update(deltaTime) {
    if (this.isReturning) {
        if (this.owner && !this.owner.isDestroyed) {
            this.targetX = this.owner.getCenterX();
            this.targetY = this.owner.getCenterY();
        } else {
            this.isDestroyed = true;
            // Libera o Mjolnir mesmo se o dono foi destruído
            if (this.owner && this.owner.isMjolnirActive !== undefined) {
                this.owner.isMjolnirActive = false;
            }
            return;
        }

        const distToOwner = Math.hypot(this.targetX - this.x, this.targetY - this.y);
        const moveAmount = this.speed * (deltaTime / 1000);

        if (distToOwner <= moveAmount) {
            this.isDestroyed = true;
            // SEMPRE libera o Mjolnir quando retorna
            if (this.owner && this.owner.isMjolnirActive !== undefined) {
                this.owner.isMjolnirActive = false;
            }
        } else {
            const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
            this.x += Math.cos(angle) * moveAmount;
            this.y += Math.sin(angle) * moveAmount;
        }
        this.rotation += this.rotationSpeed * (deltaTime / (1000 / 60));
        return;
    }

    const distanceToCurrentTarget = Math.hypot(this.targetX - this.x, this.targetY - this.y);
    const moveAmount = this.speed * (deltaTime / 1000);

    if (distanceToCurrentTarget <= moveAmount) {
        this.x = this.targetX;
        this.y = this.targetY;

        if (!this.hasHitOnce) {
            let closestEnemy = null;
            let minDistance = this.radiusCollision + 20;
            
            for (const enemy of this.gameManager.enemies) {
                const distToEnemy = Math.hypot(this.x - enemy.getCenterX(), this.y - enemy.getCenterY());
                if (distToEnemy < minDistance && !this.hitEnemies.includes(enemy.id)) {
                    minDistance = distToEnemy;
                    closestEnemy = enemy;
                }
            }

            if (closestEnemy) {
                closestEnemy.takeDamage(this.damage, this.owner);
                this.hasHitOnce = true;
                this.hitEnemies.push(closestEnemy.id);
            }
            this.isReturning = true;
        } else {
            this.isReturning = true;
        }
    } else {
        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        this.x += Math.cos(angle) * moveAmount;
        this.y += Math.sin(angle) * moveAmount;
    }
    this.rotation += this.rotationSpeed * (deltaTime / (1000 / 60));
}

    draw(ctx, mjolnirImage, capShieldImage, usagentShieldImage, wandaIllusionImage) {
        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        // Corpo base da flecha
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Ponta
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(10, -5);
        ctx.moveTo(15, 0);
        ctx.lineTo(10, 5);
        ctx.strokeStyle = '#C0C0C0';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Empenas
        ctx.beginPath();
        ctx.moveTo(-15, -4);
        ctx.lineTo(-18, -6);
        ctx.moveTo(-15, 4);
        ctx.lineTo(-18, 6);
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Efeitos especiais por tipo
        if (this.arrowType === 'explosive') {
            const glowRadius = Math.sin(Date.now() / 50) * 3 + 7;
            ctx.beginPath();
            ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 165, 0, 0.5)';
            ctx.shadowColor = 'rgba(255, 165, 0, 0.8)';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        } 
        else if (this.arrowType === 'shock') {
            const zzzSize = 5 + Math.sin(Date.now() / 70) * 3;
            ctx.fillStyle = 'yellow';
            ctx.font = `${zzzSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
            ctx.shadowBlur = 5;
            ctx.fillText('⚡', 0, -15);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'start';
        } 
        else if (this.arrowType === 'ice') {
            // Cristais de gelo na ponta
            ctx.strokeStyle = 'rgba(173, 216, 230, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(15 + Math.sin(Date.now() / 60) * 3, -5);
            ctx.lineTo(15 + Math.sin(Date.now() / 60) * 3, 5);
            ctx.closePath();
            ctx.fillStyle = 'rgba(173, 216, 230, 0.7)';
            ctx.fill();
            ctx.stroke();
            
            // Partículas de gelo
            for (let i = 0; i < 2; i++) {
                const offset = -8 - i * 4;
                ctx.beginPath();
                ctx.moveTo(offset, -3);
                ctx.lineTo(offset, 3);
                ctx.strokeStyle = 'rgba(200, 230, 255, 0.8)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        } 
        else if (this.arrowType === 'poison') {
            // Gotas de veneno
            ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
            ctx.shadowColor = 'rgba(0, 255, 0, 0.9)';
            ctx.shadowBlur = 5;
            
            ctx.beginPath();
            ctx.arc(-10, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(-5, -5, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(-5, 5, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    onHit(enemy, gameManager) {
        if (this.arrowType === 'explosive') {
            // Dano em área
            gameManager.enemies.forEach(e => {
                const dist = Math.hypot(this.x - e.getCenterX(), this.y - e.getCenterY());
                if (dist < this.explosionRadius) {
                    e.takeDamage(this.explosionDamage, this.owner);
                }
            });
            
            // Efeito visual de explosão
            gameManager.effects.push(new gameManager.RedHulkExplosionEffect(
                this.x, 
                this.y, 
                this.explosionRadius, 
                300, 
                'orange'
            ));
        }
        else if (this.arrowType === 'shock') {
            // Atordoamento
            if (Math.random() < this.stunChance) {
                enemy.applyStun(this.stunDuration);
                gameManager.effects.push(new gameManager.StunEffect(
                    enemy.getCenterX(),
                    enemy.getCenterY(),
                    this.stunDuration
                ));
            }
        }
        else if (this.arrowType === 'ice') {
            // Congelamento
            if (Math.random() < this.freezeChance) {
                enemy.applyStun(this.freezeDuration);
                gameManager.effects.push(new gameManager.StunEffect(
                    enemy.getCenterX(),
                    enemy.getCenterY(),
                    this.freezeDuration
                ));
                gameManager.effects.push(new gameManager.TextPopEffect(
                    enemy.getCenterX(),
                    enemy.getCenterY() - 20,
                    'CONGELADO!',
                    'lightblue',
                    1000
                ));
            }
        }
        else if (this.arrowType === 'poison') {
            // Veneno
            enemy.applyPoison(
                this.poisonDuration,
                this.poisonTickRate,
                this.poisonDamagePerTick
            );
        }
    }
}
export class KateBishopArrow extends Projectile {
    constructor(x, y, targetX, targetY, speed, damage, owner, arrowType, gameManagerInstance) {
        super(x, y, targetX, targetY, speed, damage, owner, 'kateBishopArrow', 10, gameManagerInstance);
        this.arrowType = arrowType;
        this.spawnTime = Date.now();
        this.lifespan = 4000;
        
        // Define propriedades por tipo
        this.setupArrowType();
    }
    
    setupArrowType() {
        const colors = {
            sonic: '#9D00FF',
            magnetic: '#C0C0C0',
            pym: '#4169E1',
            gravity: '#8B008B',
            fragmentation: '#FF4500',
            nanocord: '#9370DB',
            photon: '#F0E68C'
        };
        
        this.color = colors[this.arrowType] || 'brown';
        
        switch(this.arrowType) {
            case 'sonic':
                this.stunRadius = 80;
                this.stunDuration = 2000;
                break;
            case 'magnetic':
                this.pullRadius = 100;
                this.disableDuration = 3000;
                break;
            case 'pym':
                this.sizeMultiplier = 1.5;
                this.sizeDuration = 5000;
                break;
            case 'gravity':
                this.gravityRadius = 120;
                this.gravityDuration = 4000;
                this.pullForce = 50;
                break;
            case 'fragmentation':
                this.fragments = 8;
                this.fragmentRadius = 60;
                break;
            case 'nanocord':
                this.cordRadius = 90;
                this.cordDuration = 4000;
                this.sharedDamage = true;
                break;
            case 'photon':
                this.blindRadius = 100;
                this.blindDuration = 3000;
                this.slowFactor = 0.5;
                break;
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        if (Date.now() - this.spawnTime > this.lifespan) {
            this.isDestroyed = true;
        }
    }
    
    draw(ctx, mjolnirImage, capShieldImage, usagentShieldImage, wandaIllusionImage) {
        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        // Corpo da flecha
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Ponta
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(10, -5);
        ctx.moveTo(15, 0);
        ctx.lineTo(10, 5);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Efeitos especiais
        this.drawArrowEffect(ctx);
        
        ctx.restore();
    }
    
    drawArrowEffect(ctx) {
        const time = Date.now();
        
        switch(this.arrowType) {
            case 'sonic':
                // Ondas sonoras
                const wave1 = Math.sin(time / 100) * 5;
                const wave2 = Math.cos(time / 100) * 5;
                ctx.strokeStyle = 'rgba(157, 0, 255, 0.6)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 10 + wave1, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, 15 + wave2, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'magnetic':
                // Campo magnético
                ctx.fillStyle = 'rgba(192, 192, 192, 0.5)';
                ctx.shadowColor = 'silver';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                break;
                
            case 'pym':
                // Partículas quânticas
                for (let i = 0; i < 4; i++) {
                    const particleAngle = (Math.PI * 2 / 4) * i + time / 200;
                    const px = Math.cos(particleAngle) * 10;
                    const py = Math.sin(particleAngle) * 10;
                    ctx.fillStyle = `rgba(65, 105, 225, ${0.7 + Math.sin(time / 100 + i) * 0.3})`;
                    ctx.beginPath();
                    ctx.arc(px, py, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'gravity':
                // Espiral gravitacional
                ctx.strokeStyle = 'rgba(139, 0, 139, 0.6)';
                ctx.lineWidth = 2;
                for (let r = 5; r < 15; r += 3) {
                    ctx.beginPath();
                    ctx.arc(0, 0, r, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;
                
            case 'fragmentation':
                // Micro cargas
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 / 6) * i + time / 150;
                    const dist = 8 + Math.sin(time / 100 + i) * 2;
                    const px = Math.cos(angle) * dist;
                    const py = Math.sin(angle) * dist;
                    ctx.fillStyle = 'rgba(255, 69, 0, 0.8)';
                    ctx.beginPath();
                    ctx.arc(px, py, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'nanocord':
                // Fios de energia
                ctx.strokeStyle = 'rgba(147, 112, 219, 0.7)';
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    const offset = (i - 1) * 5;
                    ctx.beginPath();
                    ctx.moveTo(-10, offset);
                    ctx.lineTo(-5, offset);
                    ctx.stroke();
                }
                break;
                
            case 'photon':
                // Brilho luminoso
                const glowSize = 12 + Math.sin(time / 80) * 4;
                ctx.fillStyle = `rgba(240, 230, 140, ${0.6 + Math.sin(time / 100) * 0.3})`;
                ctx.shadowColor = 'rgba(240, 230, 140, 0.8)';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                break;
        }
    }
    
    onHit(enemy, gameManager) {
        const hitX = enemy.getCenterX();
        const hitY = enemy.getCenterY();
        
        switch(this.arrowType) {
            case 'sonic':
                // Onda sônica - atordoa área
                gameManager.enemies.forEach(e => {
                    const dist = Math.hypot(hitX - e.getCenterX(), hitY - e.getCenterY());
                    if (dist < this.stunRadius) {
                        e.applyStun(this.stunDuration);
                        e.isShootingInterrupted = true;
                        setTimeout(() => { e.isShootingInterrupted = false; }, this.stunDuration);
                    }
                });
                
                // Efeito visual
                gameManager.effects.push(new gameManager.USAgentShockwaveEffect(
                    hitX, hitY, this.stunRadius, 400
                ));
                break;
                
            case 'magnetic':
                // Atrai e desativa
                gameManager.enemies.forEach(e => {
                    const dist = Math.hypot(hitX - e.getCenterX(), hitY - e.getCenterY());
                    if (dist < this.pullRadius) {
                        const angle = Math.atan2(hitY - e.getCenterY(), hitX - e.getCenterX());
                        e.x += Math.cos(angle) * 30;
                        e.y += Math.sin(angle) * 30;
                        e.isDisarmed = true;
                        e.disarmEndTime = Date.now() + this.disableDuration;
                    }
                });
                
                gameManager.effects.push(new gameManager.AuraFireParticleEffect(
                    hitX, hitY, this.pullRadius, 'silver', 600
                ));
                break;
                
            case 'pym':
                // Aumenta tamanho do inimigo
                enemy.width *= this.sizeMultiplier;
                enemy.height *= this.sizeMultiplier;
                enemy.radius *= this.sizeMultiplier;
                enemy.maxHp *= 1.2;
                enemy.hp *= 1.2;
                
                setTimeout(() => {
                    enemy.width /= this.sizeMultiplier;
                    enemy.height /= this.sizeMultiplier;
                    enemy.radius /= this.sizeMultiplier;
                    enemy.maxHp /= 1.2;
                    enemy.hp = Math.min(enemy.hp, enemy.maxHp);
                }, this.sizeDuration);
                
                gameManager.effects.push(new gameManager.TextPopEffect(
                    hitX, hitY - 30, 'PYM!', 'blue', 1000
                ));
                break;
                
            case 'gravity':
            // ⭐ CAMPO GRAVITACIONAL MELHORADO
            const gravityField = {
                x: hitX,
                y: hitY,
                radius: this.gravityRadius,
                force: this.pullForce,
                endTime: Date.now() + this.gravityDuration,
                spawnTime: Date.now(),
                
                // ⭐ NOVO: Sistema de órbita
                trappedEnemies: [],
                orbitSpeed: 0.5,
                crushDamage: 5, // Dano por segundo no centro
                crushRadius: 30,
                
                // ⭐ Partículas gravitacionais
                particles: []
            };
            
            // Marca inimigos presos
            gameManager.enemies.forEach(e => {
                const dist = Math.hypot(hitX - e.getCenterX(), hitY - e.getCenterY());
                if (dist < this.gravityRadius) {
                    gravityField.trappedEnemies.push({
                        enemy: e,
                        originalSpeed: e.vel,
                        orbitAngle: Math.atan2(e.getCenterY() - hitY, e.getCenterX() - hitX),
                        orbitDistance: dist
                    });
                    e.isInGravityField = true;
                }
            });
            
            // Cria partículas
            for (let i = 0; i < 30; i++) {
                gravityField.particles.push({
                    angle: Math.random() * Math.PI * 2,
                    distance: Math.random() * this.gravityRadius,
                    speed: 0.02 + Math.random() * 0.03,
                    size: 2 + Math.random() * 3,
                    alpha: Math.random()
                });
            }
            
            gameManager.gravityFields = gameManager.gravityFields || [];
            gameManager.gravityFields.push(gravityField);
            
            // Efeito visual inicial
            gameManager.effects.push(new gameManager.USAgentShockwaveEffect(
                hitX, hitY, this.gravityRadius, 800
            ));
            
            gameManager.effects.push(new gameManager.TextPopEffect(
                hitX, hitY - 50, 'SINGULARIDADE!', 'purple', 1500
            ));
            break;
                
            case 'fragmentation':
                // Explosões em série
                for (let i = 0; i < this.fragments; i++) {
                    const angle = (Math.PI * 2 / this.fragments) * i;
                    const fragX = hitX + Math.cos(angle) * this.fragmentRadius;
                    const fragY = hitY + Math.sin(angle) * this.fragmentRadius;
                    
                    setTimeout(() => {
                        gameManager.enemies.forEach(e => {
                            const dist = Math.hypot(fragX - e.getCenterX(), fragY - e.getCenterY());
                            if (dist < 40) {
                                e.takeDamage(this.damage * 0.5, this.owner);
                            }
                        });
                        
                        gameManager.effects.push(new gameManager.RedHulkExplosionEffect(
                            fragX, fragY, 40, 200, 'orange'
                        ));
                    }, i * 150);
                }
                break;
                
           case 'nanocord':
            // ⭐ NANO-CORDAS MELHORADAS
            const trappedEnemies = gameManager.enemies.filter(e => {
                const dist = Math.hypot(hitX - e.getCenterX(), hitY - e.getCenterY());
                return dist < this.cordRadius && e.hp > 0;
            });
            
            if (trappedEnemies.length > 1) {
                const cordGroup = {
                    enemies: trappedEnemies,
                    centerX: hitX,
                    centerY: hitY,
                    endTime: Date.now() + this.cordDuration,
                    spawnTime: Date.now(),
                    sharedDamage: true,
                    
                    // ⭐ NOVO: Sistema de pulso elétrico
                    pulseInterval: 1000,
                    lastPulseTime: Date.now(),
                    pulseDamage: 10,
                    
                    // ⭐ Animação de cordas
                    wavePhase: 0,
                    
                    // ⭐ Contador de dano acumulado
                    totalDamageShared: 0
                };
                
                gameManager.cordGroups = gameManager.cordGroups || [];
                gameManager.cordGroups.push(cordGroup);
                
                trappedEnemies.forEach(e => {
                    e.isTrapped = true;
                    e.trapEndTime = Date.now() + this.cordDuration;
                    e.vel *= 0.3; // Reduz velocidade drasticamente
                    
                    // Marca com efeito visual
                    gameManager.effects.push(new gameManager.BamfEffect(
                        e.getCenterX(),
                        e.getCenterY(),
                        'purple',
                        300
                    ));
                });
                
                gameManager.showUI(`Kate: ${trappedEnemies.length} inimigos conectados!`, 'special');
            }
            break;
            
            case 'photon':
                // Flash cegante
                gameManager.enemies.forEach(e => {
                    const dist = Math.hypot(hitX - e.getCenterX(), hitY - e.getCenterY());
                    if (dist < this.blindRadius) {
                        e.isBlinded = true;
                        e.blindEndTime = Date.now() + this.blindDuration;
                        e.accuracyReduction = 0.7; // 70% menos preciso
                        e.applySlow(this.slowFactor, this.blindDuration);
                    }
                });
                
                // Flash visual
                gameManager.effects.push(new gameManager.AuraFireParticleEffect(
                    hitX, hitY, this.blindRadius, 'white', 800
                ));
                
                gameManager.effects.push(new gameManager.RedHulkExplosionEffect(
                    hitX, hitY, this.blindRadius, 500, 'gold'
                ));
                break;
        }
    }
}

export class CapShieldProjectile extends Projectile {
    constructor(x, y, targetX, targetY, speed, damage, owner, bounces, gameManagerInstance) {
        super(x, y, targetX, targetY, speed, damage, owner, 'capShieldProjectile', 20, gameManagerInstance);
        
        this.bouncesLeft = bounces;
        this.isReturning = false;
        this.currentTarget = null;
        this.rotationSpeed = 0.3;
        
        // Dados de ricochete
        if (gameManagerInstance && gameManagerInstance.Champion && gameManagerInstance.Champion.championData) {
            const capData = gameManagerInstance.Champion.championData.captainamerica;
            this.ricochetChainRadius = capData.ricochetChainRadius || 180;
            this.ricochetDamageReduction = capData.ricochetDamageReduction || 0.1;
        } else {
            this.ricochetChainRadius = 180;
            this.ricochetDamageReduction = 0.1;
        }
        
        console.log('🛡️ Escudo criado com', bounces, 'ricochetes');
    }

    update(deltaTime) {
        // =====================
        // MODO RETORNO
        // =====================
        if (this.isReturning) {
            if (!this.owner || this.owner.isDestroyed) {
                console.log('❌ Escudo: Dono destruído');
                this.isDestroyed = true;
                if (this.owner && this.owner.isShieldActive !== undefined) {
                    this.owner.isShieldActive = false;
                }
                return;
            }

            const ownerX = this.owner.getCenterX();
            const ownerY = this.owner.getCenterY();
            const distToOwner = Math.hypot(ownerX - this.x, ownerY - this.y);
            
            // ⭐ CHEGOU NO DONO
            if (distToOwner < 35) {
                console.log('✅✅✅ ESCUDO RETORNOU! ✅✅✅');
                this.isDestroyed = true;
                this.owner.isShieldActive = false;
                console.log('🎯 Flag resetada para:', this.owner.isShieldActive);
                return;
            }
            
            // Move em direção ao dono
            const angle = Math.atan2(ownerY - this.y, ownerX - this.x);
            const moveAmount = this.speed * (deltaTime / 1000);
            this.x += Math.cos(angle) * moveAmount;
            this.y += Math.sin(angle) * moveAmount;
            this.rotation += this.rotationSpeed * (deltaTime / (1000 / 60));
            return;
        }

        // =====================
        // MODO ATAQUE - TELEGUIADO
        // =====================
        
        // Busca/atualiza alvo A CADA FRAME
        if (!this.currentTarget || this.currentTarget.hp <= 0 || 
            !this.gameManager.enemies.includes(this.currentTarget)) {
            
            console.log('🎯 Buscando novo alvo, ricochetes restantes:', this.bouncesLeft);
            
            this.currentTarget = null;
            let closestDistance = Infinity;
            
            for (const enemy of this.gameManager.enemies) {
                if (!this.hitEnemies.includes(enemy.id) && enemy.hp > 0) {
                    const distToEnemy = Math.hypot(
                        this.x - enemy.getCenterX(), 
                        this.y - enemy.getCenterY()
                    );
                    if (distToEnemy < this.ricochetChainRadius && distToEnemy < closestDistance) {
                        closestDistance = distToEnemy;
                        this.currentTarget = enemy;
                    }
                }
            }
            
            if (!this.currentTarget) {
                console.log('🔙 Sem alvos, RETORNANDO');
                this.isReturning = true;
                return;
            } else {
                console.log('🎯 Alvo:', this.currentTarget.type, 'a', closestDistance.toFixed(0), 'pixels');
            }
        }

        // ⭐ ATUALIZA POSIÇÃO DO ALVO A CADA FRAME (TELEGUIADO)
        if (this.currentTarget && this.currentTarget.hp > 0) {
            this.targetX = this.currentTarget.getCenterX();
            this.targetY = this.currentTarget.getCenterY();
        }

        // Calcula distância até o alvo
        const distanceToTarget = Math.hypot(this.targetX - this.x, this.targetY - this.y);
        
        console.log('📏 Distância até alvo:', distanceToTarget.toFixed(1));

        // ⭐ VERIFICAÇÃO DE IMPACTO - Aumentei para 30 pixels
        if (distanceToTarget <= 70) {
            console.log('💥💥💥 IMPACTO em', this.currentTarget.type, '💥💥💥');
            
            // Aplica dano
            if (!this.hitEnemies.includes(this.currentTarget.id)) {
                this.hitEnemies.push(this.currentTarget.id);
                this.currentTarget.takeDamage(this.damage, this.owner);
                this.damage *= (1 - this.ricochetDamageReduction);
                
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    this.currentTarget.getCenterX(), 
                    this.currentTarget.getCenterY() - 10, 
                    `${this.damage.toFixed(0)}`, 
                    'blue', 
                    500
                ));
                
                console.log('✅ Dano aplicado:', this.damage.toFixed(0));
            }

            // Verifica ricochetes
            if (this.bouncesLeft > 0) {
                this.bouncesLeft--;
                console.log('⚡ Ricochete! Restam:', this.bouncesLeft);
                this.currentTarget = null; // Busca novo alvo
            } else {
                console.log('🔙 Ricochetes esgotados, RETORNANDO');
                this.isReturning = true;
            }
        } else {
            // Move em direção ao alvo
            const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
            const moveAmount = this.speed * (deltaTime / 1000);
            this.x += Math.cos(angle) * moveAmount;
            this.y += Math.sin(angle) * moveAmount;
        }
        
        this.rotation += this.rotationSpeed * (deltaTime / (1000 / 60));
    }/*

## 🎯 MUDANÇAS PRINCIPAIS:

1. **⭐ TELEGUIADO**: Agora atualiza `targetX` e `targetY` **A CADA FRAME** com a posição atual do inimigo
2. **⭐ RAIO DE IMPACTO MAIOR**: Aumentei de 25 para 30 pixels para facilitar o acerto
3. **⭐ LOGS DETALHADOS**: Mostra a distância até o alvo a cada frame

---

## 📊 O QUE DEVE APARECER AGORA:
```
🛡️ Escudo criado com 3 ricochetes
🎯 Buscando novo alvo, ricochetes restantes: 3
🎯 Alvo: fast a 250 pixels
📏 Distância até alvo: 250.0
📏 Distância até alvo: 235.8
📏 Distância até alvo: 220.4
📏 Distância até alvo: 205.1
...
📏 Distância até alvo: 45.2
📏 Distância até alvo: 32.7
📏 Distância até alvo: 18.9  ← Aqui deve atingir!
💥💥💥 IMPACTO em fast 💥💥💥
✅ Dano aplicado: 25
⚡ Ricochete! Restam: 2
*/
}

export class LokiPoisonDagger extends Projectile {
    constructor(x, y, targetX, targetY, speed, damage, ownerId, gameManagerInstance, color = 'green') {
        super(x, y, targetX, targetY, speed, damage, ownerId, 'lokiPoisonDagger', 10, gameManagerInstance);
        this.color = color;
    }
}

export class DroneLaserProjectile extends Projectile {
    constructor(x, y, targetX, targetY, speed, damage, ownerId, color, width, lifespan, gameManagerInstance) {
        super(x, y, targetX, targetY, speed, damage, ownerId, 'droneLaserProjectile', 5, gameManagerInstance);
        this.color = color;
        this.width = width;
        this.lifespan = lifespan;
        this.spawnTime = Date.now();
    }

    update(deltaTime) {
        super.update(deltaTime);
        if (Date.now() - this.spawnTime > this.lifespan) {
            this.isDestroyed = true;
        }
    }
}

export class USAgentBullet extends Projectile {
    constructor(x, y, targetX, targetY, speed, damage, ownerId, gameManagerInstance) {
        super(x, y, targetX, targetY, speed, damage, ownerId, 'usagentBullet', 8, gameManagerInstance);
    }
}

export class USAgentChargedShield extends Projectile {
    constructor(x, y, targetX, targetY, speed, damage, owner, bounces, gameManagerInstance) {
        // Inicializa como um projétil normal
        super(x, y, targetX, targetY, speed, damage, owner, 'usagentChargedShield', 20, gameManagerInstance);

        this.bouncesLeft = bounces;
        this.rotation = 0;
        this.spawnTime = Date.now();
        this.lifespan = 5000;
        this.hitEnemies = []; // Resetamos para a lógica de ricochete
    }

    // Método update que contém toda a lógica especial do escudo.
    update(deltaTime) {
        // Lógica de Movimento:
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.hypot(dx, dy);
        const moveAmount = this.speed * (deltaTime / 1000);

        if (distance > moveAmount) {
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * moveAmount;
            this.y += Math.sin(angle) * moveAmount;
        } else {
            // Se chegou perto do alvo, o escudo fica parado e espera o próximo ricochete
            this.x = this.targetX;
            this.y = this.targetY;
        }
        
        // Rotação visual (já estava no seu código)
        this.rotation += 0.3 * (deltaTime / 16.67);

        // Lógica de expiração (já estava no seu código)
        if (Date.now() - this.spawnTime > this.lifespan) {
            this.isDestroyed = true;
        }

        // NOTA: A lógica de Colisão/Ricochete *precisa* ficar em GameManager.updateProjectiles,
        // pois ela envolve interagir com a lista de inimigos (this.enemies).
        
        // Efeito de rastro de faíscas (você vai movê-lo para GameManager.updateProjectiles)
    }
}

export class WandaIllusionPulse extends Projectile {
    constructor(x, y, targetX, targetY, speed, damage, ownerId, gameManagerInstance) {
        super(x, y, targetX, targetY, speed, damage, ownerId, 'wandaIllusionPulse', 12, gameManagerInstance);
    }
}

export class DiamondShardProjectile extends Projectile {
    constructor(x, y, targetX, targetY, speed, damage, ownerId, gameManagerInstance, angle = null) {
        super(x, y, targetX, targetY, speed, damage, ownerId, 'diamondShardProjectile', 8, gameManagerInstance);
        
        // Se um ângulo foi fornecido, usa ele para movimento direcional
        if (angle !== null) {
            this.angle = angle;
            this.useDirectionalMovement = true;
        } else {
            this.useDirectionalMovement = false;
        }
    }

    // Em projectiles.js, SUBSTITUA o método draw() da classe DiamondShardProjectile:

draw(ctx, mjolnirImage, capShieldImage, usagentShieldImage, wandaIllusionImage) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation || 0);
    
    const time = Date.now() / 1000;
    const pulse = Math.sin(time * 5) * 0.3 + 0.7;
    
    // ===============================
    // BRILHO EXTERNO
    // ===============================
    const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radiusCollision * 2);
    glowGradient.addColorStop(0, `rgba(200, 230, 255, ${0.6 * pulse})`);
    glowGradient.addColorStop(0.5, `rgba(150, 200, 255, ${0.3 * pulse})`);
    glowGradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.radiusCollision * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // ===============================
    // CRISTAL PRINCIPAL (Losango)
    // ===============================
    const size = this.radiusCollision * 1.5;
    
    // Preenchimento com gradiente
    const crystalGradient = ctx.createLinearGradient(-size, -size, size, size);
    crystalGradient.addColorStop(0, `rgba(220, 240, 255, ${0.9 * pulse})`);
    crystalGradient.addColorStop(0.5, `rgba(200, 230, 255, ${0.95 * pulse})`);
    crystalGradient.addColorStop(1, `rgba(180, 220, 255, ${0.85 * pulse})`);
    
    ctx.fillStyle = crystalGradient;
    ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(200, 230, 255, 0.8)';
    ctx.shadowBlur = 15;
    
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.6, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // ===============================
    // FACETAS INTERNAS (Brilho)
    // ===============================
    ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * pulse})`;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.6);
    ctx.lineTo(size * 0.35, -size * 0.3);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size * 0.35, size * 0.3);
    ctx.lineTo(0, size * 0.6);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // ===============================
    // PARTÍCULAS DE RASTRO
    // ===============================
    if (this.useDirectionalMovement && this.angle !== undefined) {
        for (let i = 1; i <= 3; i++) {
            const trailDist = i * 8;
            const trailX = -Math.cos(this.angle) * trailDist;
            const trailY = -Math.sin(this.angle) * trailDist;
            const trailAlpha = (0.4 - i * 0.1) * pulse;
            
            const trailGradient = ctx.createRadialGradient(trailX, trailY, 0, trailX, trailY, 4);
            trailGradient.addColorStop(0, `rgba(200, 230, 255, ${trailAlpha})`);
            trailGradient.addColorStop(1, 'rgba(150, 200, 255, 0)');
            
            ctx.fillStyle = trailGradient;
            ctx.beginPath();
            ctx.arc(trailX, trailY, 4 - i, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // ===============================
    // ESTRELAS DE BRILHO
    // ===============================
    ctx.strokeStyle = `rgba(255, 255, 255, ${pulse * 0.8})`;
    ctx.lineWidth = 1.5;
    
    for (let i = 0; i < 4; i++) {
        const starAngle = (Math.PI / 2) * i + time * 2;
        const starLength = 5 + Math.sin(time * 6 + i) * 2;
        
        ctx.beginPath();
        ctx.moveTo(Math.cos(starAngle) * 2, Math.sin(starAngle) * 2);
        ctx.lineTo(Math.cos(starAngle) * starLength, Math.sin(starAngle) * starLength);
        ctx.stroke();
    }
    
    ctx.restore();
}

    update(deltaTime) {
        if (this.useDirectionalMovement) {
            const moveAmount = this.speed * (deltaTime / 1000);
            this.x += Math.cos(this.angle) * moveAmount;
            this.y += Math.sin(this.angle) * moveAmount;
            
            // Destrói se sair da tela
            if (this.gameManager && this.gameManager.canvas) {
                if (this.x < 0 || this.x > this.gameManager.canvas.width ||
                    this.y < 0 || this.y > this.gameManager.canvas.height) {
                    this.isDestroyed = true;
                }
            }
        } else {
            super.update(deltaTime);
        }
    }
}
export class SplitProjectile extends Projectile {
    constructor(x, y, targetEnemy, gameManagerInstance) {
        super(x, y, targetEnemy.getCenterX(), targetEnemy.getCenterY(), 8, 0, null, 'splitProjectile', 15, gameManagerInstance);
        this.target = targetEnemy;
        this.rotation = 0;
        this.reached = false;
    }
    
    update(deltaTime) {
        if (this.reached || !this.target || this.target.hp <= 0) {
            this.isDestroyed = true;
            return;
        }
        
        // Atualiza posição do alvo
        this.targetX = this.target.getCenterX();
        this.targetY = this.target.getCenterY();
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < this.speed) {
            this.reached = true;
            this.splitEnemy();
            return;
        }
        
        const angle = Math.atan2(dy, dx);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
        this.rotation += 0.2;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Símbolo de divisão
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(-5, -8, 4, 0, Math.PI * 2);
        ctx.arc(5, 8, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#8B4513';
        ctx.fill();
        
        ctx.restore();
        
        // Rastro
        ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    splitEnemy() {
        const enemy = this.target;
        const splitCount = 5;
        const newHealth = enemy.hp / splitCount;
        const newDamage = (enemy.data.baseDamage || 10) / splitCount;
        const originalX = enemy.x;
        const originalY = enemy.y;
        
        // Remove original
        const index = this.gameManager.enemies.indexOf(enemy);
        if (index > -1) {
            this.gameManager.enemies.splice(index, 1);
        }
        
        // Cria 5 cópias menores
        for (let i = 0; i < splitCount; i++) {
            const angle = (Math.PI * 2 / splitCount) * i;
            const spreadDistance = 40;
            
            const newEnemy = new this.gameManager.Enemy(
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
            
            this.gameManager.enemies.push(newEnemy);
        }
        
        // Efeito visual
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                originalX + Math.cos(angle) * 30,
                originalY + Math.sin(angle) * 30,
                20,
                'brown',
                400
            ));
        }
    }
}
// ===============================
// 🌈 KAROLINA PRISM BEAM - LASER ARCO-ÍRIS PERSEGUIDOR (MELHORADO)
// ===============================
export class KarolinaPrismBeam extends Projectile {
    constructor(x, y, targetEnemy, damage, owner, gameManager) {
        super(x, y, 0, 0, 0, damage, owner);
        this.target = targetEnemy;
        this.speed = 400;
        this.radiusCollision = 15;
        this.type = 'karolinaPrismBeam';
        this.gameManager = gameManager;
        this.isPiercing = false;
        this.rotation = 0;
        this.trailParticles = [];
        this.hue = 0; // Para rotação de cor arco-íris
        this.spawnTime = Date.now();
        this.maxLifetime = 8000; // 8 segundos máximo
        
        // ✨ NOVO: Partículas extras
        this.spiralParticles = [];
        this.glowPulse = 0;
    }
    
    update(deltaTime) {
        // Verifica lifetime
        if (Date.now() - this.spawnTime > this.maxLifetime) {
            this.explode();
            this.isDestroyed = true;
            return;
        }
        
        // Verifica se alvo ainda existe
        if (!this.target || this.target.hp <= 0) {
            this.explode();
            this.isDestroyed = true;
            return;
        }
        
        // Persegue o alvo (teleguiado)
        this.targetX = this.target.getCenterX();
        this.targetY = this.target.getCenterY();
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        
        // Movimento
        const moveAmount = this.speed * (deltaTime / 1000);
        this.x += Math.cos(angle) * moveAmount;
        this.y += Math.sin(angle) * moveAmount;
        this.rotation += 0.3;
        this.hue = (this.hue + 3) % 360;
        this.glowPulse += 0.1;
        
        // Adiciona partículas de rastro INTENSAS
        for (let i = 0; i < 3; i++) {
            this.trailParticles.push({
                x: this.x + (Math.random() - 0.5) * 10,
                y: this.y + (Math.random() - 0.5) * 10,
                hue: (this.hue + Math.random() * 60) % 360,
                life: 1,
                size: 8 + Math.random() * 6
            });
        }
        
        if (this.trailParticles.length > 40) {
            this.trailParticles.shift();
        }
        
        // Partículas espirais
        const spiralAngle = this.rotation * 2;
        for (let s = 0; s < 2; s++) {
            const sa = spiralAngle + s * Math.PI;
            this.spiralParticles.push({
                x: this.x + Math.cos(sa) * 20,
                y: this.y + Math.sin(sa) * 20,
                hue: (this.hue + s * 180) % 360,
                life: 1,
                size: 5
            });
        }
        
        if (this.spiralParticles.length > 30) {
            this.spiralParticles.shift();
        }
        
        // Atualiza partículas
        this.trailParticles.forEach(p => {
            p.life -= 0.03;
            p.size -= 0.2;
        });
        
        this.spiralParticles.forEach(p => {
            p.life -= 0.05;
        });
        
        // Colisão
        if (distance < this.radiusCollision + this.target.radius) {
            this.target.takeDamage(this.damage, this.owner);
            this.explode();
            this.isDestroyed = true;
        }
    }
    
    explode() {
        const data = this.gameManager.Champion.championData.karolinadean;
        
        // Explosão em área
        this.gameManager.enemies.forEach(enemy => {
            const dist = Math.hypot(this.x - enemy.getCenterX(), this.y - enemy.getCenterY());
            if (dist < data.beamExplosionRadius) {
                enemy.takeDamage(this.damage * 0.5, this.owner);
            }
        });
        
        // Efeito visual épico
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.x, this.y,
            data.beamExplosionRadius,
            600,
            `hsl(${this.hue}, 100%, 60%)`
        ));
        
        // Múltiplas ondas de cores
        for (let w = 0; w < 3; w++) {
            setTimeout(() => {
                const waveHue = (this.hue + w * 120) % 360;
                this.gameManager.effects.push(new this.gameManager.USAgentShockwaveEffect(
                    this.x, this.y,
                    data.beamExplosionRadius * (0.6 + w * 0.2),
                    300
                ));
            }, w * 100);
        }
        
        // Partículas coloridas em espiral
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 / 40) * i;
            const particleHue = (this.hue + i * 9) % 360;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.x + Math.cos(angle) * 25,
                this.y + Math.sin(angle) * 25,
                14,
                `hsl(${particleHue}, 100%, 60%)`,
                1000
            ));
        }
    }
    
    draw(ctx) {
        ctx.save();
        
        // ===============================
        // RASTRO ARCO-ÍRIS INTENSO
        // ===============================
        this.trailParticles.forEach((p, index) => {
            if (p.life > 0 && p.size > 0) {
                const particleGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                particleGradient.addColorStop(0, `hsla(${p.hue}, 100%, 80%, ${p.life})`);
                particleGradient.addColorStop(0.5, `hsla(${p.hue}, 100%, 60%, ${p.life * 0.7})`);
                particleGradient.addColorStop(1, `hsla(${p.hue}, 100%, 40%, 0)`);
                
                ctx.fillStyle = particleGradient;
                ctx.shadowColor = `hsl(${p.hue}, 100%, 60%)`;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });
        
        // Partículas espirais
        this.spiralParticles.forEach(p => {
            if (p.life > 0) {
                const spiralGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                spiralGradient.addColorStop(0, `hsla(${p.hue}, 100%, 90%, ${p.life})`);
                spiralGradient.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
                
                ctx.fillStyle = spiralGradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // ===============================
        // NÚCLEO DO BEAM - MULTICAMADAS
        // ===============================
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        const pulse = Math.sin(this.glowPulse) * 0.3 + 0.7;
        
        // Camada 1: Brilho externo massivo
        const outerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
        outerGlow.addColorStop(0, `hsla(${this.hue}, 100%, 80%, ${0.6 * pulse})`);
        outerGlow.addColorStop(0.5, `hsla(${(this.hue + 60) % 360}, 100%, 70%, ${0.4 * pulse})`);
        outerGlow.addColorStop(1, `hsla(${(this.hue + 120) % 360}, 100%, 60%, 0)`);
        
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
        ctx.fill();
        
        // Camada 2: Anel arco-íris
        for (let r = 0; r < 3; r++) {
            const ringRadius = 30 - r * 8;
            const ringHue = (this.hue + r * 120) % 360;
            const ringAlpha = (0.7 - r * 0.2) * pulse;
            
            ctx.strokeStyle = `hsla(${ringHue}, 100%, 70%, ${ringAlpha})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = `hsl(${ringHue}, 100%, 60%)`;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        
        // Camada 3: Estrela central giratória MAIOR
        ctx.strokeStyle = `hsl(${this.hue}, 100%, 95%)`;
        ctx.fillStyle = `hsl(${this.hue}, 100%, 80%)`;
        ctx.lineWidth = 4;
        ctx.shadowColor = `hsl(${this.hue}, 100%, 70%)`;
        ctx.shadowBlur = 25;
        
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            const outerRadius = 22;
            const innerRadius = 10;
            
            if (i === 0) {
                ctx.moveTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
            } else {
                ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
            }
            
            const midAngle = angle + Math.PI / 12;
            ctx.lineTo(Math.cos(midAngle) * innerRadius, Math.sin(midAngle) * innerRadius);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        // Camada 4: Anéis orbitais coloridos
        for (let r = 0; r < 5; r++) {
            const ringHue = (this.hue + r * 72) % 360;
            const ringAngle = this.rotation * (r % 2 === 0 ? 1.5 : -1.5);
            const ringRadius = 25 + r * 6;
            const ringAlpha = (0.8 - r * 0.12) * pulse;
            
            ctx.save();
            ctx.rotate(ringAngle);
            ctx.strokeStyle = `hsla(${ringHue}, 100%, 75%, ${ringAlpha})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);
            ctx.shadowColor = `hsl(${ringHue}, 100%, 60%)`;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.shadowBlur = 0;
            ctx.restore();
        }
        
        // Camada 5: Núcleo branco brilhante
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${pulse})`);
        coreGradient.addColorStop(0.5, `hsla(${this.hue}, 100%, 90%, ${pulse * 0.9})`);
        coreGradient.addColorStop(1, `hsla(${this.hue}, 100%, 70%, ${pulse * 0.7})`);
        
        ctx.fillStyle = coreGradient;
        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.restore();
    }
}

// ===============================
// ☀️💥 SUPERNOVA BEAM - LASER GIGANTE DIRECIONADO
// ===============================
export class SupernovaBeam {
    constructor(x, y, angle, damage, length, width, duration, owner, gameManager) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.damage = damage;
        this.length = length;
        this.width = width;
        this.duration = duration;
        this.owner = owner;
        this.gameManager = gameManager;
        this.spawnTime = Date.now();
        this.hitEnemies = new Set();
        this.solarFlames = [];
        this.hue = 30; // Começa em amarelo/laranja
        
        // Cria chamas solares ao longo do beam
        this.createSolarFlames();
        
        // Som/Efeito de disparo
        this.createLaunchEffect();
    }
    
    createLaunchEffect() {
        // Explosão na origem
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.x, this.y, 80, 800, 'rgba(255, 200, 0, 1)'
        ));
        
        // Partículas de energia
        for (let i = 0; i < 30; i++) {
            const particleAngle = this.angle + (Math.random() - 0.5) * 0.5;
            const distance = Math.random() * 50;
            this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                this.x + Math.cos(particleAngle) * distance,
                this.y + Math.sin(particleAngle) * distance,
                15,
                ['yellow', 'orange', 'white'][Math.floor(Math.random() * 3)],
                1000
            ));
        }
    }
    
    createSolarFlames() {
        const numFlames = Math.floor(this.length / 30);
        for (let i = 0; i < numFlames; i++) {
            const dist = (i / numFlames) * this.length;
            const flameX = this.x + Math.cos(this.angle) * dist;
            const flameY = this.y + Math.sin(this.angle) * dist;
            
            this.solarFlames.push({
                x: flameX,
                y: flameY,
                radius: 40,
                duration: 3000,
                spawnTime: Date.now() + i * 50,
                damage: this.damage * 0.3,
                owner: this.owner
            });
        }
    }
    
    update(deltaTime) {
        const elapsed = Date.now() - this.spawnTime;
        
        // Verifica se expirou
        if (elapsed > this.duration) {
            return false; // Será removido
        }
        
        // Atualiza cor (rotação de matiz)
        this.hue = (30 + (elapsed / this.duration) * 30) % 60; // Varia entre amarelo e laranja
        
        // Verifica colisão com inimigos
        this.gameManager.enemies.forEach(enemy => {
            if (this.hitEnemies.has(enemy.id)) return;
            
            // Calcula distância do inimigo ao raio
            const ex = enemy.getCenterX();
            const ey = enemy.getCenterY();
            
            const dx = ex - this.x;
            const dy = ey - this.y;
            const dot = dx * Math.cos(this.angle) + dy * Math.sin(this.angle);
            
            if (dot < 0 || dot > this.length) return;
            
            const closestX = this.x + Math.cos(this.angle) * dot;
            const closestY = this.y + Math.sin(this.angle) * dot;
            
            const dist = Math.hypot(ex - closestX, ey - closestY);
            
            if (dist < this.width / 2 + enemy.radius) {
                this.hitEnemies.add(enemy.id);
                enemy.takeDamage(this.damage, this.owner);
                
                // Efeito de impacto
                this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                    ex, ey, 50, 400, 'rgba(255, 150, 0, 0.8)'
                ));
                
                // Partículas
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                        ex + Math.cos(angle) * 15,
                        ey + Math.sin(angle) * 15,
                        10,
                        ['yellow', 'orange', 'red'][Math.floor(Math.random() * 3)],
                        500
                    ));
                }
                
                // Chance de cegar
                if (Math.random() < 0.5) {
                    enemy.isBlinded = true;
                    enemy.blindEndTime = Date.now() + 3000;
                    enemy.damageMultiplier = (enemy.damageMultiplier || 1) * 0.5;
                }
            }
        });
        
        return true; // Continua ativo
    }
    
    draw(ctx) {
        const elapsed = Date.now() - this.spawnTime;
        const progress = elapsed / this.duration;
        const alpha = 1 - progress;
        
        if (alpha <= 0) return;
        
        ctx.save();
        
        // ===============================
        // NÚCLEO DO LASER
        // ===============================
        const endX = this.x + Math.cos(this.angle) * this.length;
        const endY = this.y + Math.sin(this.angle) * this.length;
        
        // Brilho externo pulsante
        const pulse = Math.sin(elapsed / 50) * 10;
        const outerGradient = ctx.createLinearGradient(
            this.x, this.y,
            this.x + Math.cos(this.angle) * 100,
            this.y + Math.sin(this.angle) * 100
        );
        outerGradient.addColorStop(0, `hsla(${this.hue}, 100%, 80%, ${alpha * 0.4})`);
        outerGradient.addColorStop(0.5, `hsla(${this.hue}, 100%, 60%, ${alpha * 0.3})`);
        outerGradient.addColorStop(1, `hsla(${this.hue}, 100%, 40%, 0)`);
        
        ctx.strokeStyle = outerGradient;
        ctx.lineWidth = this.width + pulse * 2;
        ctx.lineCap = 'round';
        ctx.shadowColor = `hsl(${this.hue}, 100%, 60%)`;
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Laser principal
        const mainGradient = ctx.createLinearGradient(
            this.x, this.y,
            this.x + Math.cos(this.angle) * 100,
            this.y + Math.sin(this.angle) * 100
        );
        mainGradient.addColorStop(0, `hsla(${this.hue + 10}, 100%, 90%, ${alpha})`);
        mainGradient.addColorStop(0.5, `hsla(${this.hue}, 100%, 70%, ${alpha * 0.9})`);
        mainGradient.addColorStop(1, `hsla(${this.hue - 10}, 100%, 50%, ${alpha * 0.6})`);
        
        ctx.strokeStyle = mainGradient;
        ctx.lineWidth = this.width * 0.7;
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Núcleo branco brilhante
        const coreGradient = ctx.createLinearGradient(
            this.x, this.y,
            this.x + Math.cos(this.angle) * 100,
            this.y + Math.sin(this.angle) * 100
        );
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        coreGradient.addColorStop(0.5, `rgba(255, 255, 200, ${alpha * 0.8})`);
        coreGradient.addColorStop(1, `rgba(255, 200, 100, ${alpha * 0.6})`);
        
        ctx.strokeStyle = coreGradient;
        ctx.lineWidth = this.width * 0.3;
        ctx.shadowBlur = 50;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        // ===============================
        // ONDAS DE CHOQUE AO LONGO DO BEAM
        // ===============================
        const numWaves = 8;
        for (let i = 0; i < numWaves; i++) {
            const waveProgress = ((elapsed / 100 + i * 0.2) % 1);
            const waveDist = this.length * waveProgress;
            const waveX = this.x + Math.cos(this.angle) * waveDist;
            const waveY = this.y + Math.sin(this.angle) * waveDist;
            
            const waveGradient = ctx.createRadialGradient(waveX, waveY, 0, waveX, waveY, this.width);
            waveGradient.addColorStop(0, `hsla(${this.hue}, 100%, 90%, ${alpha * (1 - waveProgress)})`);
            waveGradient.addColorStop(1, `hsla(${this.hue}, 100%, 50%, 0)`);
            
            ctx.fillStyle = waveGradient;
            ctx.beginPath();
            ctx.arc(waveX, waveY, this.width * (0.5 + waveProgress * 0.5), 0, Math.PI * 2);
            ctx.fill();
        }
        
        // ===============================
        // PARTÍCULAS SOLARES ORBITANDO
        // ===============================
        const numParticles = 20;
        for (let i = 0; i < numParticles; i++) {
            const particleProgress = (i / numParticles + elapsed / 500) % 1;
            const particleDist = this.length * particleProgress;
            const particleX = this.x + Math.cos(this.angle) * particleDist;
            const particleY = this.y + Math.sin(this.angle) * particleDist;
            
            // Órbita ao redor do beam
            const orbitAngle = elapsed / 100 + i * 0.5;
            const orbitRadius = this.width * 0.4;
            const px = particleX + Math.cos(orbitAngle) * orbitRadius;
            const py = particleY + Math.sin(orbitAngle) * orbitRadius;
            
            const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, 8);
            particleGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            particleGradient.addColorStop(1, `hsla(${this.hue}, 100%, 60%, 0)`);
            
            ctx.fillStyle = particleGradient;
            ctx.beginPath();
            ctx.arc(px, py, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // ===============================
        // EXPLOSÃO NA PONTA
        // ===============================
        const tipGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, this.width * 1.5);
        tipGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        tipGradient.addColorStop(0.3, `hsla(${this.hue + 10}, 100%, 80%, ${alpha * 0.8})`);
        tipGradient.addColorStop(0.7, `hsla(${this.hue}, 100%, 60%, ${alpha * 0.5})`);
        tipGradient.addColorStop(1, `hsla(${this.hue - 10}, 100%, 40%, 0)`);
        
        ctx.fillStyle = tipGradient;
        ctx.shadowColor = `hsl(${this.hue}, 100%, 60%)`;
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(endX, endY, this.width * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.restore();
    }
}

// ==============================================
// 🃏 CARTA CINÉTICA DO GAMBIT
// ==============================================
export class GambitCard extends Projectile {
    constructor(x, y, vx, vy, damage, heal, owner, gameManager) {
        super(x, y, 0, 0, 600, damage, owner);
        
        this.vx = vx;
        this.vy = vy;
        this.heal = heal;
        this.gameManager = gameManager;
        this.rotation = 0;
        this.hitEnemies = [];
        this.hitAllies = [];
        this.type = 'gambitCard';
        this.radiusCollision = 15;
        this.trailParticles = [];
        this.isPiercing = false;
    }
    
    update(deltaTime) {
        this.x += this.vx * (deltaTime / 1000);
        this.y += this.vy * (deltaTime / 1000);
        this.rotation += 0.3;
        
        // Rastro de partículas
        this.trailParticles.push({
            x: this.x,
            y: this.y,
            life: 1
        });
        
        if (this.trailParticles.length > 8) {
            this.trailParticles.shift();
        }
        
        this.trailParticles.forEach(p => p.life -= 0.1);
        
        // Sai da tela
        const canvas = this.gameManager.canvas;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.isDestroyed = true;
        }
        
        // Colisão com inimigos (DANO)
        this.gameManager.enemies.forEach(enemy => {
            if (this.hitEnemies.includes(enemy.id)) return;
            
            const dist = Math.hypot(this.x - enemy.getCenterX(), this.y - enemy.getCenterY());
            if (dist < this.radiusCollision + enemy.radius) {
                enemy.takeDamage(this.damage, this.owner);
                this.hitEnemies.push(enemy.id);
                
                this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                    this.x, this.y, 30, 300, 'magenta'
                ));
                
                this.isDestroyed = true;
            }
        });
        
        // Colisão com aliados (CURA)
        this.gameManager.champions.forEach(ally => {
            if (this.hitAllies.includes(ally.id) || ally.hp >= ally.maxHp) return;
            
            const dist = Math.hypot(this.x - ally.getCenterX(), this.y - ally.getCenterY());
            if (dist < this.radiusCollision + 25) {
                ally.hp = Math.min(ally.maxHp, ally.hp + this.heal);
                this.hitAllies.push(ally.id);
                
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    ally.getCenterX(),
                    ally.getCenterY() - 20,
                    `+${this.heal}`,
                    'lime',
                    600
                ));
                
                this.isDestroyed = true;
            }
        });
    }
    
draw(ctx) {
    // ✨ Rastro de partículas mais intenso
    this.trailParticles.forEach(p => {
        if (p.life > 0) {
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10);
            gradient.addColorStop(0, `rgba(255, 0, 255, ${p.life * 0.8})`);
            gradient.addColorStop(0.5, `rgba(200, 0, 200, ${p.life * 0.5})`);
            gradient.addColorStop(1, 'rgba(150, 0, 150, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // ✨ Partículas adicionais menores
            ctx.fillStyle = `rgba(255, 100, 255, ${p.life * 0.6})`;
            ctx.beginPath();
            ctx.arc(p.x + Math.random() * 4 - 2, p.y + Math.random() * 4 - 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    // 🎴 Carta (retângulo com gradiente roxo/magenta)
    const gradient = ctx.createLinearGradient(-10, -14, 10, 14);
    gradient.addColorStop(0, 'rgba(255, 0, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(220, 0, 220, 1)');
    gradient.addColorStop(0.7, 'rgba(200, 0, 200, 1)');
    gradient.addColorStop(1, 'rgba(150, 0, 150, 1)');
    
    ctx.fillStyle = gradient;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    
    // ✨ Brilho externo pulsante
    const pulseIntensity = 15 + Math.sin(Date.now() / 100) * 5;
    ctx.shadowColor = 'magenta';
    ctx.shadowBlur = pulseIntensity;
    
    ctx.beginPath();
    ctx.roundRect(-10, -14, 20, 28, 3);
    ctx.fill();
    ctx.stroke();
    
    // 💎 Símbolo de diamante
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'white';
    ctx.fillText('♦', 0, 0);
    
    // ✨ Aura interna
    const innerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
    innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    innerGlow.addColorStop(1, 'rgba(255, 0, 255, 0)');
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.restore();
}
}

// ==============================================
// 💚 CARTA DE CURA RICOCHETEANTE (Boost Bridge)
// ==============================================
export class GambitHealingCard extends Projectile {
    constructor(x, y, target, heal, bounces, healBonus, buffDuration, owner, gameManager) {
        super(x, y, 0, 0, 800, 0, owner);
        
        this.target = target;
        this.heal = heal;
        this.bouncesLeft = bounces;
        this.healBonus = healBonus;
        this.buffDuration = buffDuration;
        this.gameManager = gameManager;
        this.hitAllies = [];
        this.type = 'healingCard';
        this.radiusCollision = 20;
        this.trailParticles = [];
        this.rotation = 0;
    }
    
    update(deltaTime) {
        if (!this.target || this.target.hp <= 0) {
            this.findNextTarget();
            if (!this.target) {
                this.isDestroyed = true;
                return;
            }
        }
        
        // Move em direção ao alvo
        const angle = Math.atan2(this.target.getCenterY() - this.y, this.target.getCenterX() - this.x);
        this.x += Math.cos(angle) * this.vel * (deltaTime / 1000);
        this.y += Math.sin(angle) * this.vel * (deltaTime / 1000);
        this.rotation += 0.25;
        
        // Rastro
        this.trailParticles.push({ x: this.x, y: this.y, life: 1 });
        if (this.trailParticles.length > 12) this.trailParticles.shift();
        this.trailParticles.forEach(p => p.life -= 0.06);
        
        // Colisão com alvo
        const dist = Math.hypot(this.x - this.target.getCenterX(), this.y - this.target.getCenterY());
        if (dist < this.radiusCollision + 25) {
            // Cura
            this.target.hp = Math.min(this.target.maxHp, this.target.hp + this.heal);
            this.hitAllies.push(this.target.id);
            
            // Aplica buff de cura aumentada
            this.target.healBoostBuff = this.healBonus;
            this.target.healBoostEnd = Date.now() + this.buffDuration;
            
            // Efeito visual épico
            this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                this.target.getCenterX(),
                this.target.getCenterY() - 25,
                `+${this.heal} 💚 (+15%)`,
                'lime',
                1000
            ));
            
            this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                this.target.getCenterX(),
                this.target.getCenterY(),
                40,
                400,
                'rgba(0, 255, 100, 0.7)'
            ));
            
            // Partículas de cura
            for (let i = 0; i < 10; i++) {
                const pAngle = (Math.PI * 2 / 10) * i;
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.target.getCenterX() + Math.cos(pAngle) * 20,
                    this.target.getCenterY() + Math.sin(pAngle) * 20,
                    10,
                    'lime',
                    600
                ));
            }
            
            // Busca próximo alvo
            this.bouncesLeft--;
            if (this.bouncesLeft > 0) {
                this.findNextTarget();
            } else {
                this.isDestroyed = true;
            }
        }
    }
    
    findNextTarget() {
        let nextTarget = null;
        let closestDist = 250;
        
        this.gameManager.champions.forEach(ally => {
            if (!this.hitAllies.includes(ally.id) && ally.hp > 0 && ally.hp < ally.maxHp) {
                const dist = Math.hypot(this.x - ally.getCenterX(), this.y - ally.getCenterY());
                if (dist < closestDist) {
                    closestDist = dist;
                    nextTarget = ally;
                }
            }
        });
        
        if (nextTarget) {
            this.target = nextTarget;
        } else {
            this.isDestroyed = true;
        }
    }
    
    draw(ctx) {
        // Rastro rosa brilhante
        this.trailParticles.forEach(p => {
            if (p.life > 0) {
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
                gradient.addColorStop(0, `rgba(255, 100, 200, ${p.life * 0.8})`);
                gradient.addColorStop(0.5, `rgba(255, 150, 200, ${p.life * 0.5})`);
                gradient.addColorStop(1, 'rgba(255, 100, 200, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Carta (copas)
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        const gradient = ctx.createLinearGradient(-14, -18, 14, 18);
        gradient.addColorStop(0, 'rgba(255, 100, 200, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 150, 200, 1)');
        gradient.addColorStop(1, 'rgba(255, 50, 150, 1)');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'pink';
        ctx.shadowBlur = 20;
        
        ctx.beginPath();
        ctx.roundRect(-14, -18, 28, 36, 4);
        ctx.fill();
        ctx.stroke();
        
        // Símbolo de coração brilhante
        ctx.fillStyle = 'white';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'white';
        ctx.fillText('♥', 0, 0);
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// ==============================================
// 💚 CARTA PURIFICADORA (Visual apenas)
// ==============================================
export class GambitPurifyCard extends Projectile {
    constructor(x, y, vx, vy, heal, owner, gameManager) {
        super(x, y, 0, 0, 700, 0, owner);
        
        this.vx = vx;
        this.vy = vy;
        this.heal = heal;
        this.gameManager = gameManager;
        this.hitAllies = [];
        this.type = 'purifyCard';
        this.radiusCollision = 15;
        this.trailParticles = [];
        this.rotation = 0;
        this.lifeTime = 1200; // 1.2 segundos
        this.spawnTime = Date.now();
    }
    
    update(deltaTime) {
        // Verifica tempo de vida
        if (Date.now() - this.spawnTime > this.lifeTime) {
            this.isDestroyed = true;
            return;
        }
        
        this.x += this.vx * (deltaTime / 1000);
        this.y += this.vy * (deltaTime / 1000);
        this.rotation += 0.3;
        
        // Rastro
        this.trailParticles.push({ x: this.x, y: this.y, life: 1 });
        if (this.trailParticles.length > 10) this.trailParticles.shift();
        this.trailParticles.forEach(p => p.life -= 0.08);
        
        // Sai da tela
        const canvas = this.gameManager.canvas;
        if (this.x < -50 || this.x > canvas.width + 50 || this.y < -50 || this.y > canvas.height + 50) {
            this.isDestroyed = true;
        }
    }
    
    draw(ctx) {
        // Rastro cyan brilhante
        this.trailParticles.forEach(p => {
            if (p.life > 0) {
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10);
                gradient.addColorStop(0, `rgba(0, 255, 255, ${p.life})`);
                gradient.addColorStop(0.5, `rgba(0, 220, 220, ${p.life * 0.6})`);
                gradient.addColorStop(1, 'rgba(0, 200, 200, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        const gradient = ctx.createLinearGradient(-12, -16, 12, 16);
        gradient.addColorStop(0, 'rgba(0, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(0, 220, 220, 1)');
        gradient.addColorStop(1, 'rgba(0, 200, 200, 1)');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'cyan';
        ctx.shadowBlur = 18;
        
        ctx.beginPath();
        ctx.roundRect(-12, -16, 24, 32, 3);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 12;
        ctx.fillText('✨', 0, 0);
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// ⚡️ Projétil Reality Erasure (Feixe de Distorção)
export class RealityErasureProjectile extends Projectile {
    constructor(x, y, targetX, targetY, speed, damage, ownerId, gameManager) {
        super(x, y, targetX, targetY, speed, damage, ownerId, gameManager);
        this.width = 15; // Largura do feixe
        this.height = 15;
        this.color = 'red';
        this.lifeTime = 300; // Dura um pouco mais para dar tempo de ver o feixe
        this.maxLifeTime = this.lifeTime;
        this.angle = Math.atan2(this.vy, this.vx); // Ângulo para desenhar
    }

    // ⭐ NOVO: Método de Impacto
    onHit(target) {
        // Aciona o efeito visual de "colapso da realidade" no alvo
        if (this.gameManager.RealityEraseImpactEffect) {
            this.gameManager.effects.push(new this.gameManager.RealityEraseImpactEffect(
                target.getCenterX(), 
                target.getCenterY(), 
                30, // Raio pequeno
                300 // Duração curta
            ));
        }
    }

    update(deltaTime) {
        super.update(deltaTime);

        // Cria rastro de calor tremulante (partículas de fumaça/plasma)
        if (this.gameManager && this.gameManager.effects && this.gameManager.AuraFireParticleEffect) {
            if (Math.random() < 0.6) { // Gera bastante rastro
                this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                    this.x, 
                    this.y, 
                    3, // Tamanho pequeno
                    100, // Duração bem curta (efeito de fumaça rápida)
                    'rgba(255, 0, 100, 0.6)', // Cor do Caos
                    true, // Flutua
                    'rgba(255, 0, 0, 0.1)' // Cor do miolo (plasma)
                ));
            }
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Foco no brilho e cor do Caos
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'magenta';
        
        // Calcula a borda do "feixe torcido"
        const travelDistance = (this.maxLifeTime - this.lifeTime) * this.speed;
        const wave = Math.sin(travelDistance / 20) * 5; // Simula a oscilação/torção
        
        // Desenha a "rachadura brilhante" (o feixe principal)
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle); // Rotaciona para alinhar com a direção de movimento
        
        // Desenha o corpo do feixe (retângulo que some e balança)
        ctx.fillStyle = `rgba(255, 105, 180, ${this.lifeTime / this.maxLifeTime})`; // Rosa quente
        ctx.fillRect(-this.width / 2, -this.width / 4 + wave, this.width, this.height / 2);

        // Desenha o núcleo de energia (vermelho denso)
        ctx.fillStyle = `rgba(255, 0, 0, ${this.lifeTime / this.maxLifeTime})`;
        ctx.fillRect(-this.width / 2, -this.width / 8, this.width, this.height / 4);
        
        ctx.restore();
    }
}

// 🔫 PROJÉTIL DA PISTOLA DO NICK FURY
export class NickFuryBullet extends Projectile {
    constructor(x, y, targetX, targetY, speed, damage, owner, gameManager) {
        super(x, y, targetX, targetY, speed, damage, owner, 'nickfurybullet', 4, gameManager);
        this.color = 'rgba(100, 200, 255, 0.9)';
    }
    
    draw(ctx) {
        ctx.save();
        
        // Núcleo branco
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.shadowColor = 'cyan';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Halo azul
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// 🔫 RAJADA DO QUINJET
export class QuinjetBullet extends Projectile {
    constructor(x, y, targetX, targetY, speed, damage, owner, gameManager) {
        super(x, y, targetX, targetY, speed, damage, owner, 'quinjetbullet', 3, gameManager);
        this.color = 'rgba(255, 200, 50, 0.9)';
    }
    
    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowColor = 'orange';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

// 🚀 MÍSSIL DO QUINJET
export class QuinjetMissile extends Projectile {
    constructor(x, y, targetX, targetY, speed, damage, explosionRadius, owner, gameManager) {
        super(x, y, targetX, targetY, speed, damage, owner, 'quinjetmissile', 6, gameManager);
        this.explosionRadius = explosionRadius;
        this.rotation = Math.atan2(targetY - y, targetX - x);
        this.trailParticles = [];
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Trail de fumaça
        if (Math.random() < 0.3) {
            this.trailParticles.push({
                x: this.x,
                y: this.y,
                life: 1,
                size: 4 + Math.random() * 3
            });
        }
        
        this.trailParticles = this.trailParticles.filter(p => {
            p.life -= 0.03;
            return p.life > 0;
        });
    }
    
    onHit(target) {
        // Dano em área
        this.gameManager.enemies.forEach(enemy => {
            const dist = Math.hypot(this.x - enemy.getCenterX(), this.y - enemy.getCenterY());
            if (dist < this.explosionRadius) {
                enemy.takeDamage(this.damage, this.owner);
            }
        });
        
        // Explosão
        this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
            this.x, this.y, this.explosionRadius, 500, 'rgba(255, 150, 0, 0.9)'
        ));
    }
    
    draw(ctx) {
        ctx.save();
        
        // Trail
        this.trailParticles.forEach(p => {
            ctx.fillStyle = `rgba(150, 150, 150, ${p.life * 0.6})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Míssil
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Corpo
        ctx.fillStyle = 'rgba(80, 80, 80, 0.9)';
        ctx.fillRect(-8, -3, 16, 6);
        
        // Ponta
        ctx.fillStyle = 'rgba(255, 100, 0, 0.9)';
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(12, -4);
        ctx.lineTo(12, 4);
        ctx.closePath();
        ctx.fill();
        
        // Chama
        const flameSize = 6 + Math.sin(Date.now() / 50) * 2;
        ctx.fillStyle = 'rgba(255, 200, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(-8, 0, flameSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}