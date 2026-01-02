    // effects.js
    // Define a classe base Effect e subclasses para cada tipo de efeito visual.

    import { Projectile } from './projectiles.js'; // <-- NOVA LINHA
    /**
     * Classe base para todos os efeitos visuais no jogo.
     */
    
    export class Effect {
        constructor(type, x, y, duration, startTime = Date.now()) {
            this.id = Date.now() + Math.random();
            this.type = type;
            this.x = x;
            this.y = y;
            this.duration = duration;
            this.startTime = startTime;
            this.isComplete = false;
        }

        update(deltaTime) {
            const elapsedTime = Date.now() - this.startTime;
            if (elapsedTime > this.duration) {
                this.isComplete = true;
            }
        }

        draw(ctx) {
            // Implementação vazia, subclasses devem sobrescrever
        }

        getProgress() {
            return Math.min((Date.now() - this.startTime) / this.duration, 1);
        }
    }

    export class ChainLightningEffect extends Effect {
        constructor(source, target, duration = 200, segments = 10, spread = 25) {
            super('chainLightning', source.x, source.y, duration);
            this.targetX = target.x;
            this.targetY = target.y;
            this.color = 'cyan';
            this.thickness = 3;
            this.segments = segments;
            this.spread = spread;
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 1 - progress;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.thickness * alpha;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);

            for (let i = 1; i <= this.segments; i++) {
                const ratio = i / this.segments;
                const midX = this.x + (this.targetX - this.x) * ratio;
                const midY = this.y + (this.targetY - this.y) * ratio;
                const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
                const perpAngle = angle + Math.PI / 2;
                const offset = (i % 2 === 0 ? 1 : -1) * this.spread * (Math.random() * 0.5 + 0.5);
                
                const nextX = midX + Math.cos(perpAngle) * offset;
                const nextY = midY + Math.sin(perpAngle) * offset;
                
                if (i === this.segments) {
                    ctx.lineTo(this.targetX, this.targetY);
                } else {
                    ctx.lineTo(nextX, nextY);
                }
            }

            ctx.stroke();
            ctx.restore();
        }
    }

    export class ExplosionEffect extends Effect {
        constructor(x, y, radius, duration, color = 'orange') {
            super('explosion', x, y, duration);
            this.radius = radius;
            this.color = color;
        }

        draw(ctx) {
            const progress = this.getProgress();
            const currentRadius = this.radius * progress;
            const alpha = 1 - progress;

            let r, g, b;
            if (this.color.startsWith('rgba(')) {
                const matches = this.color.match(/\d+/g);
                if (matches && matches.length >= 3) {
                    [r, g, b] = matches.slice(0, 3).map(Number);
                } else {
                    r = 255; g = 165; b = 0;
                }
            } else {
                const colorMap = {
                    red: [255, 0, 0],
                    orange: [255, 165, 0],
                    purple: [128, 0, 128],
                    gray: [128, 128, 128],
                    darkred: [139, 0, 0],
                    gold: [255, 215, 0]
                };
                [r, g, b] = colorMap[this.color] || [255, 165, 0];
            }

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    export class RedHulkExplosionEffect extends ExplosionEffect {
        constructor(x, y, radius, duration, color = 'red') {
            super(x, y, radius, duration, color);
            this.type = 'redHulkExplosion';
        }

        draw(ctx) {
            const progress = this.getProgress();
            const currentRadius = this.radius * progress;
            const alpha = 1 - progress;

            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, currentRadius);
            grad.addColorStop(0, `rgba(255, 255, 0, ${alpha * 0.9})`);
            grad.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.7})`);
            grad.addColorStop(1, `rgba(255, 0, 0, ${alpha * 0.1})`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();

            for (let i = 0; i < 5; i++) {
                const particleRadius = 2 + Math.random() * 5;
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * currentRadius;
                const pX = this.x + Math.cos(angle) * distance;
                const pY = this.y + Math.sin(angle) * distance;
                ctx.fillStyle = `rgba(255, 255, 0, ${alpha * Math.random()})`;
                ctx.beginPath();
                ctx.arc(pX, pY, particleRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    export class LaserEffect extends Effect {
        constructor(sourceX, sourceY, targetX, targetY, duration, color = 'red', width = 2, isUnibeam = false) {
            super('laser', sourceX, sourceY, duration);
            this.targetX = targetX;
            this.targetY = targetY;
            this.color = color;
            this.width = width;
            this.isUnibeam = isUnibeam;
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 1 - progress;
            const currentWidth = this.width * (0.5 + progress * 0.5);

            let r, g, b;
            if (this.color.startsWith('rgba(')) {
                const matches = this.color.match(/\d+/g);
                if (matches && matches.length >= 3) {
                    [r, g, b] = matches.slice(0, 3).map(Number);
                } else {
                    r = 255; g = 0; b = 0;
                }
            } else {
                const colorMap = {
                    red: [255, 0, 0],
                    blue: [0, 0, 255],
                    cyan: [0, 255, 255],
                    orange: [255, 165, 0],
                    purple: [128, 0, 128],
                    gold: [255, 215, 0],
                    lime: [0, 255, 0],
                    brown: [139, 69, 19],
                    silver: [192, 192, 192],
                    fuchsia: [255, 0, 255]
                };
                [r, g, b] = colorMap[this.color] || [255, 0, 0];
            }

            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.lineWidth = currentWidth;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.targetX, this.targetY);
            ctx.stroke();

            if (this.isUnibeam) {
                ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`;
                ctx.shadowBlur = 10 + progress * 10;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }
    }

    export class TextPopEffect extends Effect {
        constructor(x, y, text, color, duration) {
            super('textPop', x, y, duration);
            this.text = text;
            this.color = color;
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 1 - progress;
            const yOffset = -5 - (progress * 20);

            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha;
            ctx.textAlign = 'center';
            ctx.fillText(this.text, this.x, this.y + yOffset);
            ctx.globalAlpha = 1;
        }
    }

    export class BamfEffect extends Effect {
        constructor(x, y, color, duration) {
            super('bamf', x, y, duration);
            this.color = color;
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 1 - progress;
            const size = 20 + progress * 30;
            
            let r, g, b;
            const colorMap = {
                blue: [0, 0, 255],
                purple: [128, 0, 128],
                black: [0, 0, 0]
            };
            [r, g, b] = colorMap[this.color] || [255, 165, 0];

            ctx.strokeStyle = `rgba(${r},${g},${b}, ${alpha})`;
            ctx.lineWidth = 3 * (1 - progress);
            ctx.save();
            ctx.translate(this.x, this.y);
            for (let j = 0; j < 6; j++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                const angle = (Math.PI * 2 / 6) * j;
                ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    export class SwordCutEffect extends Effect {
        constructor(x, y, targetX, targetY, color, duration) {
            super('swordCut', x, y, duration);
            this.angle = Math.atan2(targetY - y, targetX - x);
            this.color = color;
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 1 - progress;
            const length = 30 + progress * 20;
            const width = 5 * (1 - progress);

            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.moveTo(-length / 2, 0);
            ctx.lineTo(length / 2, 0);
            ctx.stroke();
            ctx.restore();
        }
    }

    export class StunEffect extends Effect {
        constructor(x, y, duration) {
            super('stun', x, y, duration);
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 1 - progress;
            const angle = (Date.now() / 100) % (Math.PI * 2);
            const radius = 20 + Math.sin(Date.now() / 50) * 5;
            const starSize = 8;

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(angle);

            ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
            for (let i = 0; i < 4; i++) {
                const starAngle = (Math.PI * 2 / 4) * i;
                const starX = Math.cos(starAngle) * radius;
                const starY = Math.sin(starAngle) * radius;
                ctx.beginPath();
                for (let j = 0; j < 5; j++) {
                    const outerRadius = starSize;
                    const innerRadius = starSize / 2;
                    const pAngle = (Math.PI / 5) * j;
                    ctx.lineTo(starX + Math.cos(pAngle * 2) * outerRadius, starY + Math.sin(pAngle * 2) * outerRadius);
                    ctx.lineTo(starX + Math.cos(pAngle * 2 + Math.PI / 5) * innerRadius, starY + Math.sin(pAngle * 2 + Math.PI / 5) * innerRadius);
                }
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }
    }

    export class SlowEffect extends Effect {
        constructor(x, y, duration) {
            super('slow', x, y, duration);
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 1 - progress;
            ctx.strokeStyle = `rgba(100, 100, 255, ${alpha})`;
            ctx.lineWidth = 3 * (1 - progress);
            ctx.beginPath();
            ctx.arc(this.x, this.y, 15 + progress * 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    export class ConfuseEffect extends Effect {
        constructor(x, y, duration, color = 'pink') {
            super('confuse', x, y, duration);
            this.color = color;
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 1 - progress;
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha;
            ctx.textAlign = 'center';
            ctx.fillText('?', this.x, this.y - 10 - progress * 20);
            ctx.globalAlpha = 1;
        }
    }

export class HexZoneVisualEffect extends Effect {
    constructor(x, y, radius, duration) {
        super('hexZoneVisual', x, y, duration);
        this.radius = radius;
        this.hexagons = [];
        this.spirals = [];
        this.energyBolts = [];
        
        // Hexágonos concêntricos
        for (let layer = 1; layer <= 4; layer++) {
            this.hexagons.push({
                radius: (this.radius / 4) * layer,
                rotation: 0,
                speed: 0.02 * (5 - layer),
                points: []
            });
        }
        
        // Espirais de energia
        for (let i = 0; i < 3; i++) {
            this.spirals.push({
                startAngle: (Math.PI * 2 / 3) * i,
                turns: 3,
                progress: 0,
                speed: 0.01
            });
        }
        
        // Raios de energia
        for (let i = 0; i < 12; i++) {
            this.energyBolts.push({
                angle: (Math.PI * 2 / 12) * i,
                length: 0,
                maxLength: this.radius * 0.7,
                speed: 2,
                active: Math.random() > 0.5
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Atualiza hexágonos
        this.hexagons.forEach(hex => {
            hex.rotation += hex.speed * (deltaTime / 1000);
        });
        
        // Atualiza espirais
        this.spirals.forEach(spiral => {
            spiral.progress += spiral.speed;
            if (spiral.progress > 1) spiral.progress = 0;
        });
        
        // Atualiza raios
        this.energyBolts.forEach(bolt => {
            if (bolt.active) {
                bolt.length += bolt.speed;
                if (bolt.length >= bolt.maxLength) {
                    bolt.active = false;
                    bolt.length = 0;
                }
            } else if (Math.random() < 0.02) {
                bolt.active = true;
            }
        });
    }

    draw(ctx) {
        const progress = this.getProgress();
        const alpha = 0.7 - progress * 0.5;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // ===============================
        // CÍRCULO DE BASE CAÓTICO
        // ===============================
        const baseGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        baseGradient.addColorStop(0, `rgba(150, 0, 150, ${alpha * 0.3})`);
        baseGradient.addColorStop(0.7, `rgba(200, 0, 200, ${alpha * 0.2})`);
        baseGradient.addColorStop(1, `rgba(255, 0, 255, 0)`);
        
        ctx.fillStyle = baseGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // ===============================
        // HEXÁGONOS CONCÊNTRICOS
        // ===============================
        this.hexagons.forEach((hex, index) => {
            ctx.save();
            ctx.rotate(hex.rotation);
            
            const hexAlpha = alpha * (0.8 - index * 0.15);
            
            // Hexágono preenchido
            ctx.fillStyle = `rgba(200, 0, 200, ${hexAlpha * 0.2})`;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 / 6) * i;
                const px = Math.cos(angle) * hex.radius;
                const py = Math.sin(angle) * hex.radius;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            
            // Contorno do hexágono
            ctx.strokeStyle = `rgba(255, 0, 255, ${hexAlpha})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = `rgba(255, 0, 255, ${hexAlpha * 0.8})`;
            ctx.shadowBlur = 10;
            ctx.stroke();
            
            // Pontos de energia nos vértices
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 / 6) * i;
                const px = Math.cos(angle) * hex.radius;
                const py = Math.sin(angle) * hex.radius;
                const pulse = Math.sin(Date.now() / 200 + i) * 0.3 + 0.7;
                
                ctx.fillStyle = `rgba(255, 100, 255, ${hexAlpha * pulse})`;
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
        
        ctx.shadowBlur = 0;
        
        // ===============================
        // ESPIRAIS DE ENERGIA CAÓTICA
        // ===============================
        this.spirals.forEach(spiral => {
            ctx.strokeStyle = `rgba(255, 0, 255, ${alpha * 0.6})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(255, 0, 255, 0.8)';
            ctx.shadowBlur = 8;
            
            ctx.beginPath();
            for (let t = 0; t <= spiral.progress; t += 0.01) {
                const angle = spiral.startAngle + t * Math.PI * 2 * spiral.turns;
                const dist = t * this.radius * 0.8;
                const px = Math.cos(angle) * dist;
                const py = Math.sin(angle) * dist;
                
                if (t === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
        });
        
        ctx.shadowBlur = 0;
        
        // ===============================
        // RAIOS DE ENERGIA
        // ===============================
        this.energyBolts.forEach(bolt => {
            if (bolt.active && bolt.length > 0) {
                const endX = Math.cos(bolt.angle) * bolt.length;
                const endY = Math.sin(bolt.angle) * bolt.length;
                
                // Raio principal
                ctx.strokeStyle = `rgba(255, 200, 255, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.shadowColor = 'rgba(255, 0, 255, 0.8)';
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                
                // Brilho no final do raio
                const endGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, 8);
                endGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                endGradient.addColorStop(1, `rgba(255, 0, 255, 0)`);
                
                ctx.fillStyle = endGradient;
                ctx.beginPath();
                ctx.arc(endX, endY, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        ctx.shadowBlur = 0;
        
        // ===============================
        // PARTÍCULAS CAÓTICAS
        // ===============================
        for (let i = 0; i < 20; i++) {
            const particleAngle = Math.random() * Math.PI * 2;
            const particleDist = Math.random() * this.radius * 0.9;
            const px = Math.cos(particleAngle) * particleDist;
            const py = Math.sin(particleAngle) * particleDist;
            const particleSize = 2 + Math.random() * 3;
            
            const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, particleSize);
            particleGradient.addColorStop(0, `rgba(255, 100, 255, ${alpha * Math.random()})`);
            particleGradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
            
            ctx.fillStyle = particleGradient;
            ctx.beginPath();
            ctx.arc(px, py, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // ===============================
        // SÍMBOLO DE CAOS NO CENTRO
        // ===============================
        const symbolSize = 30 + Math.sin(Date.now() / 200) * 5;
        ctx.save();
        ctx.rotate(Date.now() / 500);
        
        ctx.strokeStyle = `rgba(255, 0, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(255, 0, 255, 1)';
        ctx.shadowBlur = 20;
        
        // Símbolo de caos (8 raios)
        for (let i = 0; i < 8; i++) {
            const symbolAngle = (Math.PI * 2 / 8) * i;
            const length = (i % 2 === 0) ? symbolSize : symbolSize * 0.6;
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(symbolAngle) * length, Math.sin(symbolAngle) * length);
            ctx.stroke();
            
            // Círculo no final de cada raio
            const cx = Math.cos(symbolAngle) * length;
            const cy = Math.sin(symbolAngle) * length;
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 0, 255, ${alpha})`;
            ctx.fill();
        }
        
        ctx.restore();
        ctx.shadowBlur = 0;
        
        // ===============================
        // TEXTO
        // ===============================
        if (progress < 0.25) {
            ctx.fillStyle = `rgba(255, 0, 255, ${alpha * (1 - progress * 4)})`;
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 0, 255, 1)';
            ctx.shadowBlur = 15;
            ctx.fillText('MAGIA DO CAOS', 0, -this.radius - 30);
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }
}

    export class RuneVisualEffect extends Effect {
    constructor(x, y, radius, duration) {
        super('runeVisual', x, y, duration);
        this.radius = radius;
        this.particles = [];
        this.symbols = [];
        this.rings = [];
        
        // Carrega a imagem das runas
        this.runeImage = new Image();
        this.runeImage.src = './assets_img/pngwing.com (7).png';
        this.imageLoaded = false;
        this.runeImage.onload = () => {
            this.imageLoaded = true;
        };
        this.runeImage.onerror = () => {
            console.warn('Imagem das runas não carregou, usando fallback');
            this.imageLoaded = false;
        };
        
        // Partículas místicas
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                angle: Math.random() * Math.PI * 2,
                distance: this.radius * 0.5 + Math.random() * this.radius * 0.5,
                speed: 0.01 + Math.random() * 0.02,
                size: 2 + Math.random() * 3,
                alpha: Math.random(),
                orbitSpeed: (Math.random() - 0.5) * 0.03
            });
        }
        
        // Símbolos rúnicos flutuantes
        const runeSymbols = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ'];
        for (let i = 0; i < 8; i++) {
            this.symbols.push({
                text: runeSymbols[i],
                angle: (Math.PI * 2 / 8) * i,
                distance: this.radius * 0.8,
                floatOffset: Math.random() * Math.PI * 2
            });
        }
        
        // Anéis concêntricos
        for (let i = 1; i <= 3; i++) {
            this.rings.push({
                radius: this.radius * (i / 3),
                speed: 0.02 * i,
                rotation: 0
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Atualiza partículas
        this.particles.forEach(p => {
            p.angle += p.orbitSpeed;
            p.distance += Math.sin(Date.now() / 500 + p.angle) * 0.5;
        });
        
        // Atualiza anéis
        this.rings.forEach(ring => {
            ring.rotation += ring.speed * (deltaTime / 1000);
        });
    }

    draw(ctx) {
        const progress = this.getProgress();
        const alpha = 0.8 - progress * 0.6;
        const scale = 0.8 + Math.sin(Date.now() / 300) * 0.1;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // ===============================
        // IMAGEM DAS RUNAS NO FUNDO
        // ===============================
        if (this.imageLoaded && this.runeImage.complete) {
            ctx.save();
            ctx.globalAlpha = alpha * 0.4;
            
            // Rotação suave
            ctx.rotate(progress * Math.PI * 2);
            
            // Escala pulsante
            const imageScale = scale * 1.2;
            const imageSize = this.radius * 2.5;
            
            ctx.drawImage(
                this.runeImage,
                -imageSize / 2,
                -imageSize / 2,
                imageSize,
                imageSize
            );
            
            ctx.restore();
            
            // Segunda camada da imagem (rotação inversa)
            ctx.save();
            ctx.globalAlpha = alpha * 0.3;
            ctx.rotate(-progress * Math.PI * 2 * 0.7);
            
            const imageSize2 = this.radius * 2;
            ctx.drawImage(
                this.runeImage,
                -imageSize2 / 2,
                -imageSize2 / 2,
                imageSize2,
                imageSize2
            );
            
            ctx.restore();
        }
        
        // ===============================
        // ANÉIS CONCÊNTRICOS MÁGICOS
        // ===============================
        this.rings.forEach((ring, index) => {
            ctx.save();
            ctx.rotate(ring.rotation);
            
            const ringAlpha = alpha * (0.6 - index * 0.15);
            
            // Gradiente do anel
            const gradient = ctx.createRadialGradient(0, 0, ring.radius - 5, 0, 0, ring.radius + 5);
            gradient.addColorStop(0, `rgba(255, 0, 255, 0)`);
            gradient.addColorStop(0.5, `rgba(255, 0, 255, ${ringAlpha})`);
            gradient.addColorStop(1, `rgba(255, 0, 255, 0)`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.shadowColor = `rgba(255, 0, 255, ${ringAlpha * 0.8})`;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // Pontos de energia nos anéis
            for (let i = 0; i < 6; i++) {
                const pointAngle = (Math.PI * 2 / 6) * i;
                const px = Math.cos(pointAngle) * ring.radius;
                const py = Math.sin(pointAngle) * ring.radius;
                
                ctx.fillStyle = `rgba(255, 100, 255, ${ringAlpha})`;
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
        
        ctx.shadowBlur = 0;
        
        // ===============================
        // SÍMBOLOS RÚNICOS FLUTUANTES
        // ===============================
        this.symbols.forEach((symbol, index) => {
            const floatY = Math.sin(Date.now() / 400 + symbol.floatOffset) * 5;
            const sx = Math.cos(symbol.angle) * symbol.distance;
            const sy = Math.sin(symbol.angle) * symbol.distance + floatY;
            
            const symbolAlpha = alpha * (0.7 + Math.sin(Date.now() / 300 + index) * 0.3);
            
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(progress * Math.PI * 2 + symbol.angle);
            
            ctx.fillStyle = `rgba(255, 0, 255, ${symbolAlpha})`;
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = `rgba(255, 0, 255, ${symbolAlpha})`;
            ctx.shadowBlur = 10;
            ctx.fillText(symbol.text, 0, 0);
            
            ctx.restore();
        });
        
        ctx.shadowBlur = 0;
        
        // ===============================
        // PARTÍCULAS MÍSTICAS
        // ===============================
        this.particles.forEach(p => {
            const px = Math.cos(p.angle) * p.distance;
            const py = Math.sin(p.angle) * p.distance;
            const particleAlpha = alpha * p.alpha;
            
            // Partícula com trilha
            const gradient = ctx.createRadialGradient(px, py, 0, px, py, p.size);
            gradient.addColorStop(0, `rgba(255, 100, 255, ${particleAlpha})`);
            gradient.addColorStop(1, `rgba(200, 0, 200, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // ===============================
        // NÚCLEO CENTRAL PULSANTE
        // ===============================
        const coreSize = 20 + Math.sin(Date.now() / 200) * 5;
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        coreGradient.addColorStop(0.4, `rgba(255, 0, 255, ${alpha * 0.8})`);
        coreGradient.addColorStop(1, `rgba(200, 0, 200, 0)`);
        
        ctx.fillStyle = coreGradient;
        ctx.shadowColor = 'rgba(255, 0, 255, 0.8)';
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // ===============================
        // ESTRELA MÁGICA NO CENTRO
        // ===============================
        ctx.save();
        ctx.rotate(Date.now() / 1000);
        ctx.strokeStyle = `rgba(255, 200, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(255, 0, 255, 0.8)';
        ctx.shadowBlur = 10;
        
        for (let i = 0; i < 8; i++) {
            const starAngle = (Math.PI * 2 / 8) * i;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(starAngle) * 15, Math.sin(starAngle) * 15);
            ctx.stroke();
        }
        
        ctx.restore();
        ctx.shadowBlur = 0;
        
        // ===============================
        // TEXTO INFORMATIVO
        // ===============================
        if (progress < 0.3) {
            ctx.fillStyle = `rgba(255, 0, 255, ${alpha * (1 - progress * 3)})`;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 0, 255, 0.8)';
            ctx.shadowBlur = 10;
            ctx.fillText('RUNAS PROTETORAS', 0, -this.radius - 25);
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }
}

    export class ReviveEffect extends Effect {
        constructor(x, y, duration) {
            super('revive', x, y, duration);
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 1 - progress;
            const radius = 20 + progress * 20;

            ctx.save();
            ctx.translate(this.x, this.y);

            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 0, ${alpha * 0.3})`;
            ctx.shadowColor = `rgba(0, 255, 0, ${alpha})`;
            ctx.shadowBlur = 20;
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.strokeStyle = `rgba(0, 255, 0, ${alpha * 0.7})`;
            ctx.lineWidth = 3 * (1 - progress);
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                const angle = (Math.PI * 2 / 6) * i + progress * Math.PI;
                ctx.lineTo(Math.cos(angle) * radius * 0.8, Math.sin(angle) * radius * 0.8 - progress * 40);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    export class DefensiveStanceEffect extends Effect {
        constructor(x, y, duration, radius) {
            super('defensiveStanceVisual', x, y, duration);
            this.radius = radius;
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 0.3 + Math.sin(Date.now() / 150) * 0.1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 0, 255, ${alpha})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(0, 0, 255, ${alpha + 0.2})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }

export class EmmaDiamondImpactEffect extends Effect {
    constructor(x, y, radius, duration) {
        super('emmaDiamondImpact', x, y, duration);
        this.radius = radius;
        this.shards = [];
        this.waves = [];
        this.particles = [];
        
        // Estilhaços de diamante
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            this.shards.push({
                angle: angle,
                distance: 0,
                maxDistance: radius * 1.2,
                speed: 200,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 4,
                size: 10 + Math.random() * 8
            });
        }
        
        // Ondas de impacto
        for (let i = 0; i < 4; i++) {
            this.waves.push({
                radius: 0,
                maxRadius: radius * 1.5,
                speed: 300,
                delay: i * 100,
                alpha: 1
            });
        }
        
        // Partículas cristalinas
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.particles.push({
                x: 0,
                y: 0,
                vx: Math.cos(angle) * (100 + Math.random() * 200),
                vy: Math.sin(angle) * (100 + Math.random() * 200) - 50,
                size: 2 + Math.random() * 4,
                life: 0,
                maxLife: 1 + Math.random()
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        const dt = deltaTime / 1000;
        
        // Atualiza estilhaços
        this.shards.forEach(shard => {
            if (shard.distance < shard.maxDistance) {
                shard.distance += shard.speed * dt;
                shard.rotation += shard.rotationSpeed * dt;
            }
        });
        
        // Atualiza ondas
        const elapsed = Date.now() - this.startTime;
        this.waves.forEach(wave => {
            if (elapsed >= wave.delay && wave.radius < wave.maxRadius) {
                wave.radius += wave.speed * dt;
                wave.alpha = 1 - (wave.radius / wave.maxRadius);
            }
        });
        
        // Atualiza partículas
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt; // Gravidade
            p.life += dt;
        });
    }

    draw(ctx) {
        const progress = this.getProgress();
        const alpha = 1 - progress;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // ===============================
        // FLASH CENTRAL
        // ===============================
        if (progress < 0.2) {
            const flashSize = 40 * (1 - progress * 5);
            const flashGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, flashSize);
            flashGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            flashGradient.addColorStop(0.5, 'rgba(200, 230, 255, 0.8)');
            flashGradient.addColorStop(1, 'rgba(150, 200, 255, 0)');
            
            ctx.fillStyle = flashGradient;
            ctx.shadowColor = 'rgba(200, 230, 255, 1)';
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(0, 0, flashSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // ===============================
        // ONDAS DE IMPACTO
        // ===============================
        this.waves.forEach(wave => {
            if (wave.radius > 0) {
                const waveAlpha = alpha * wave.alpha;
                
                // Onda preenchida
                const waveGradient = ctx.createRadialGradient(0, 0, wave.radius * 0.8, 0, 0, wave.radius);
                waveGradient.addColorStop(0, `rgba(200, 230, 255, 0)`);
                waveGradient.addColorStop(0.5, `rgba(200, 230, 255, ${waveAlpha * 0.3})`);
                waveGradient.addColorStop(1, `rgba(150, 200, 255, 0)`);
                
                ctx.fillStyle = waveGradient;
                ctx.beginPath();
                ctx.arc(0, 0, wave.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Contorno da onda
                ctx.strokeStyle = `rgba(220, 240, 255, ${waveAlpha})`;
                ctx.lineWidth = 3;
                ctx.shadowColor = `rgba(200, 230, 255, ${waveAlpha * 0.8})`;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(0, 0, wave.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
        
        ctx.shadowBlur = 0;
        
        // ===============================
        // ESTILHAÇOS DE DIAMANTE
        // ===============================
        this.shards.forEach(shard => {
            if (shard.distance > 0) {
                const sx = Math.cos(shard.angle) * shard.distance;
                const sy = Math.sin(shard.angle) * shard.distance;
                
                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(shard.rotation);
                
                const shardAlpha = alpha * (1 - shard.distance / shard.maxDistance);
                
                // Diamante (losango)
                ctx.fillStyle = `rgba(200, 230, 255, ${shardAlpha * 0.8})`;
                ctx.strokeStyle = `rgba(255, 255, 255, ${shardAlpha})`;
                ctx.lineWidth = 2;
                ctx.shadowColor = `rgba(200, 230, 255, ${shardAlpha})`;
                ctx.shadowBlur = 10;
                
                ctx.beginPath();
                ctx.moveTo(0, -shard.size);
                ctx.lineTo(shard.size * 0.6, 0);
                ctx.lineTo(0, shard.size);
                ctx.lineTo(-shard.size * 0.6, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                
                // Brilho interno
                ctx.fillStyle = `rgba(255, 255, 255, ${shardAlpha * 0.6})`;
                ctx.beginPath();
                ctx.moveTo(0, -shard.size * 0.5);
                ctx.lineTo(shard.size * 0.3, 0);
                ctx.lineTo(0, shard.size * 0.5);
                ctx.lineTo(-shard.size * 0.3, 0);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            }
        });
        
        ctx.shadowBlur = 0;
        
        // ===============================
        // PARTÍCULAS CRISTALINAS
        // ===============================
        this.particles.forEach(p => {
            if (p.life < p.maxLife) {
                const particleAlpha = alpha * (1 - p.life / p.maxLife);
                
                const particleGradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                particleGradient.addColorStop(0, `rgba(220, 240, 255, ${particleAlpha})`);
                particleGradient.addColorStop(1, `rgba(200, 230, 255, 0)`);
                
                ctx.fillStyle = particleGradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // ===============================
        // RAIOS DE LUZ
        // ===============================
        if (progress < 0.5) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(200, 230, 255, 0.8)';
            ctx.shadowBlur = 10;
            
            for (let i = 0; i < 12; i++) {
                const rayAngle = (Math.PI * 2 / 12) * i;
                const rayLength = this.radius * 1.3 * (progress * 2);
                
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(rayAngle) * rayLength, Math.sin(rayAngle) * rayLength);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
}

export class EmmaPsychicPulseEffect extends Effect {
    constructor(sourceX, sourceY, targetX, targetY, duration) {
        super('emmaPsychicPulse', sourceX, sourceY, duration);
        this.targetX = targetX;
        this.targetY = targetY;
        this.waves = [];
        
        for (let i = 0; i < 3; i++) {
            this.waves.push({
                progress: i * 0.3,
                speed: 2
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        const dt = deltaTime / 1000;
        
        this.waves.forEach(wave => {
            wave.progress += wave.speed * dt;
        });
    }

    draw(ctx) {
        const progress = this.getProgress();
        const alpha = 1 - progress;
        
        ctx.save();
        
        this.waves.forEach((wave, index) => {
            if (wave.progress <= 1) {
                const currentX = this.x + (this.targetX - this.x) * wave.progress;
                const currentY = this.y + (this.targetY - this.y) * wave.progress;
                const waveAlpha = alpha * (1 - wave.progress);
                
                // Onda psíquica
                const gradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, 20);
                gradient.addColorStop(0, `rgba(255, 105, 180, ${waveAlpha * 0.8})`);
                gradient.addColorStop(1, `rgba(200, 0, 150, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.shadowColor = 'rgba(255, 105, 180, 0.8)';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(currentX, currentY, 20, 0, Math.PI * 2);
                ctx.fill();
                
                // Símbolo Psi
                ctx.fillStyle = `rgba(255, 150, 200, ${waveAlpha})`;
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Ψ', currentX, currentY);
            }
        });
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

export class PsychicChainEffect extends Effect {
    constructor(sourceX, sourceY, targetX, targetY, duration) {
        super('psychicChain', sourceX, sourceY, duration);
        this.targetX = targetX;
        this.targetY = targetY;
        this.segments = 8;
    }

    draw(ctx) {
        const progress = this.getProgress();
        const alpha = 0.7 - progress * 0.5;
        
        ctx.save();
        
        // Linha principal
        ctx.strokeStyle = `rgba(255, 105, 180, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(255, 105, 180, 0.8)';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        
        // Linha ondulada
        for (let i = 0; i <= this.segments; i++) {
            const t = i / this.segments;
            const x = this.x + (this.targetX - this.x) * t;
            const y = this.y + (this.targetY - this.y) * t;
            const wave = Math.sin(t * Math.PI * 4 + Date.now() / 200) * 10;
            
            const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
            const perpX = x + Math.cos(angle + Math.PI / 2) * wave;
            const perpY = y + Math.sin(angle + Math.PI / 2) * wave;
            
            ctx.lineTo(perpX, perpY);
        }
        
        ctx.stroke();
        
        // Partículas ao longo da corrente
        for (let i = 0; i < 5; i++) {
            const t = (i / 5 + progress) % 1;
            const px = this.x + (this.targetX - this.x) * t;
            const py = this.y + (this.targetY - this.y) * t;
            
            const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, 5);
            particleGradient.addColorStop(0, `rgba(255, 150, 200, ${alpha})`);
            particleGradient.addColorStop(1, 'rgba(255, 105, 180, 0)');
            
            ctx.fillStyle = particleGradient;
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

    export class EmmaWaveEffect extends Effect {
        constructor(x, y, radius, duration, mode = 'psychic') {
            super('emmaWave', x, y, duration);
            this.radius = radius;
            this.mode = mode;
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 1 - progress;
            const currentRadius = this.radius * progress;
            
            const color = this.mode === 'diamond' ? 'rgba(200, 230, 255' : 'rgba(200, 200, 255';
            ctx.strokeStyle = `${color}, ${alpha * 0.8})`;
            ctx.lineWidth = 4 + (1 - progress) * 4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
export class EmmaFormChangeEffect extends Effect {
    constructor(x, y, duration, toDiamond) {
        super('emmaFormChange', x, y, duration);
        this.toDiamond = toDiamond;
        this.particles = [];
        
        // Cria partículas
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 / 40) * i;
            this.particles.push({
                angle: angle,
                distance: 0,
                targetDistance: 50 + Math.random() * 30,
                speed: 2 + Math.random() * 2,
                size: 3 + Math.random() * 4,
                alpha: 1
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        this.particles.forEach(p => {
            if (p.distance < p.targetDistance) {
                p.distance += p.speed;
            }
            p.alpha = 1 - (p.distance / p.targetDistance);
        });
    }

    draw(ctx) {
        const progress = this.getProgress();
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Cor baseada no modo
        const color = this.toDiamond ? 
            { r: 200, g: 230, b: 255, name: 'DIAMANTE' } : 
            { r: 255, g: 105, b: 180, name: 'PSÍQUICO' };
        
        // Onda expansiva
        const waveRadius = 80 * progress;
        const waveAlpha = (1 - progress) * 0.7;
        
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${waveAlpha})`;
        ctx.lineWidth = 5 * (1 - progress);
        ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Partículas explodindo
        this.particles.forEach(p => {
            const px = Math.cos(p.angle) * p.distance;
            const py = Math.sin(p.angle) * p.distance;
            
            const gradient = ctx.createRadialGradient(px, py, 0, px, py, p.size);
            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${p.alpha})`);
            gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Se é diamante, desenha cristais
            if (this.toDiamond) {
                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(p.angle);
                ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${p.alpha * 0.7})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -p.size);
                ctx.lineTo(p.size * 0.866, p.size * 0.5);
                ctx.lineTo(-p.size * 0.866, p.size * 0.5);
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            }
        });
        
        // Texto
        if (progress < 0.5) {
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${(1 - progress * 2)})`;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
            ctx.shadowBlur = 10;
            ctx.fillText(color.name, 0, -60);
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }
}

export class EmmaMentalBlastEffect extends Effect {
    constructor(x, y, targetX, targetY, angle, range, duration) {
        super('emmaMentalBlast', x, y, duration);
        this.targetX = targetX;
        this.targetY = targetY;
        this.angle = angle;
        this.range = range;
        this.coneAngle = Math.PI / 3; // 60 graus
        this.waves = [];
        
        // Cria ondas psíquicas
        for (let i = 0; i < 5; i++) {
            this.waves.push({
                distance: i * 20,
                speed: 400,
                alpha: 1 - (i * 0.15)
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        this.waves.forEach(w => {
            w.distance += w.speed * (deltaTime / 1000);
        });
    }

    draw(ctx) {
        const progress = this.getProgress();
        const alpha = 1 - progress;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Desenha cone psíquico
        this.waves.forEach(w => {
            const waveAlpha = alpha * w.alpha;
            const waveRadius = Math.min(w.distance, this.range);
            
            // Gradiente radial roxo
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, waveRadius);
            gradient.addColorStop(0, `rgba(200, 0, 255, ${waveAlpha * 0.6})`);
            gradient.addColorStop(0.5, `rgba(150, 0, 200, ${waveAlpha * 0.4})`);
            gradient.addColorStop(1, `rgba(100, 0, 150, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, waveRadius, -this.coneAngle / 2, this.coneAngle / 2);
            ctx.closePath();
            ctx.fill();
            
            // Contornos do cone
            ctx.strokeStyle = `rgba(200, 0, 255, ${waveAlpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(-this.coneAngle / 2) * waveRadius, Math.sin(-this.coneAngle / 2) * waveRadius);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(this.coneAngle / 2) * waveRadius, Math.sin(this.coneAngle / 2) * waveRadius);
            ctx.stroke();
        });
        
        // Símbolos psíquicos
        const symbolCount = 8;
        for (let i = 0; i < symbolCount; i++) {
            const symbolAngle = ((this.coneAngle / symbolCount) * i) - (this.coneAngle / 2);
            const symbolDist = this.range * (0.5 + (progress * 0.5));
            const sx = Math.cos(symbolAngle) * symbolDist;
            const sy = Math.sin(symbolAngle) * symbolDist;
            
            ctx.save();
            ctx.translate(sx, sy);
            ctx.globalAlpha = alpha * (1 - progress);
            ctx.fillStyle = 'rgba(200, 0, 255, 1)';
            ctx.font = `${16 + Math.sin(Date.now() / 100 + i) * 4}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('Ψ', 0, 0); // Símbolo Psi
            ctx.restore();
        }
        
        ctx.restore();
    }
}

    export class PsiEffect extends Effect {
        constructor(x, y, targetX, targetY, duration) {
            super('psi', x, y, duration);
            this.targetX = targetX;
            this.targetY = targetY;
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 1 - progress;
            const progressoPsi = Math.sin(progress * Math.PI);
            ctx.beginPath();
            ctx.arc(this.targetX, this.targetY - 10, 10 * progressoPsi, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 105, 180, ${alpha * 0.7})`;
            ctx.lineWidth = 2 + progressoPsi * 2;
            ctx.stroke();
        }
    }

    export class LevelUpEffect extends Effect {
        constructor(x, y, level) {
            super('levelUp', x, y, 1500);
            this.level = level;
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 1 - progress;
            ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.5})`;
            ctx.font = `bold ${16 + 10 * progress}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(`Nível ${this.level}!`, this.x, this.y - 30 - 10 * progress);
            ctx.textAlign = 'start';
        }
    }

    export class AuraFireParticleEffect extends Effect {
        constructor(x, y, radius, color, duration) {
            super('auraFireParticle', x, y, duration);
            this.radius = radius;
            this.color = color;
            this.particles = [];
            
            for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 20 + Math.random() * 30;
                this.particles.push({
                    x: 0,
                    y: 0,
                    dx: Math.cos(angle) * speed,
                    dy: Math.sin(angle) * speed,
                    size: 3 + Math.random() * 5,
                    life: 0
                });
            }
        }

        update(deltaTime) {
            super.update(deltaTime);
            const dt = deltaTime / 1000;
            this.particles.forEach(p => {
                p.x += p.dx * dt;
                p.y += p.dy * dt;
                p.life += deltaTime / this.duration;
            });
        }

        draw(ctx) {
            const progress = this.getProgress();
            
            let r, g, b;
            const colorMap = {
                red: [255, 100, 0],
                orange: [255, 165, 0],
                gold: [255, 215, 0]
            };
            [r, g, b] = colorMap[this.color] || [255, 100, 0];

            ctx.save();
            ctx.translate(this.x, this.y);
            
            this.particles.forEach(p => {
                const alpha = 1 - p.life;
                if (alpha > 0) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * (1 - p.life), 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                    ctx.fill();
                }
            });
            
            ctx.restore();
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

export class USAgentShockwaveEffect extends Effect {
    constructor(x, y, radius, duration) {
        super('usagentShockwave', x, y, duration);
        this.radius = radius;
        this.maxRadius = radius;
        this.color = 'rgba(255, 0, 0, 1)'; // Vermelho para representar a energia de impacto
    }

    draw(ctx) {
        if (this.isComplete) return;

        const progress = this.getProgress();
        const currentRadius = this.maxRadius * progress;
        const alpha = 1 - progress; // Fade out

        // Desenha o círculo de choque
        ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Desenha faíscas ou linhas de energia
        const numLines = 10;
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        for (let i = 0; i < numLines; i++) {
            const angle = (Math.PI * 2 / numLines) * i + progress * Math.PI;
            const startX = this.x + Math.cos(angle) * (currentRadius * 0.5);
            const startY = this.y + Math.sin(angle) * (currentRadius * 0.5);
            const endX = this.x + Math.cos(angle) * currentRadius;
            const endY = this.y + Math.sin(angle) * currentRadius;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }
}

    export class USAgentCombatCallEffect extends Effect {
        constructor(x, y, duration, color = 'blue') {
            super('usagentCombatCall', x, y, duration);
            this.radius = 50;
            this.color = color;
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 0.5 - progress * 0.3;
            const currentRadius = this.radius * (0.8 + progress * 0.2);
            const pulse = Math.sin(Date.now() / 100) * 5;

            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius + pulse, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.lineWidth = 3 + (pulse / 2);
            ctx.shadowColor = `rgba(255, 215, 0, ${alpha * 0.8})`;
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    export class NanobotCloudEffect extends Effect {
        constructor(x, y, duration, radius = 50) {
            super('nanobotCloud', x, y, duration);
            this.radius = radius;
            this.particles = [];
            for (let i = 0; i < 50; i++) {
                this.particles.push({
                    x: (Math.random() - 0.5) * this.radius * 2,
                    y: (Math.random() - 0.5) * this.radius * 2,
                    size: 2 + Math.random() * 3,
                    speedX: (Math.random() - 0.5) * 5,
                    speedY: (Math.random() - 0.5) * 5,
                    lifetime: 500 + Math.random() * 1000,
                    spawnTime: Date.now()
                });
            }
        }

        update(deltaTime) {
            super.update(deltaTime);
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.speedX * (deltaTime / 1000);
                p.y += p.speedY * (deltaTime / 1000);
                if (Date.now() - p.spawnTime > p.lifetime) {
                    p.x = (Math.random() - 0.5) * this.radius * 2;
                    p.y = (Math.random() - 0.5) * this.radius * 2;
                    p.size = 2 + Math.random() * 3;
                    p.speedX = (Math.random() - 0.5) * 5;
                    p.speedY = (Math.random() - 0.5) * 5;
                    p.lifetime = 500 + Math.random() * 1000;
                    p.spawnTime = Date.now();
                }
            }
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 0.5 - progress * 0.4;

            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
            for (const p of this.particles) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    export class NanobotParticleEffect extends Effect {
        constructor(x, y, color, duration) {
            super('nanobotParticle', x, y, duration);
            this.color = color;
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 1 - progress;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3 * (1 - progress), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180, 180, 180, ${alpha * 0.8})`;
            ctx.fill();
        }
    }

    export class SatelliteStrikeEffect extends Effect {
        constructor(x, y, radius, damage, owner, hackChance, hackDuration, gameManagerInstance) {
            super('satelliteStrike', x, y, 1000);
            this.radius = radius;
            this.damage = damage;
            this.owner = owner;
            this.hackChance = hackChance;
            this.hackDuration = hackDuration;
            this.hasDealtDamage = false;
            this.gameManager = gameManagerInstance;
        }

        update(deltaTime) {
            super.update(deltaTime);
            if (!this.hasDealtDamage && this.getProgress() >= 0.5) {
                this.hasDealtDamage = true;
                const enemies = this.gameManager.enemies;
                for (const enemy of enemies) {
                    const dist = Math.hypot(this.x - enemy.getCenterX(), this.y - enemy.getCenterY());
                    if (dist <= this.radius) {
                        enemy.takeDamage(this.damage, this.owner);
                        if (Math.random() < this.hackChance) {
                            enemy.applyHack(this.hackDuration);
                            this.gameManager.effects.push(new TextPopEffect(enemy.getCenterX(), enemy.getCenterY() - 50, 'Hack!', 'cyan', 1000));
                        }
                    }
                }
            }
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 1 - progress;
            const currentRadius = this.radius * progress * 1.2;

            if (progress < 0.5) {
                ctx.strokeStyle = `rgba(0, 255, 255, ${1 - progress * 2})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x - 50, this.y);
                ctx.lineTo(this.x + 50, this.y);
                ctx.moveTo(this.x, this.y - 50);
                ctx.lineTo(this.x, this.y + 50);
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.5})`;
            ctx.shadowColor = `rgba(0, 255, 255, ${alpha * 0.8})`;
            ctx.shadowBlur = 20 * alpha;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    export class UltronCoreEffect extends Effect {
        constructor(x, y, duration) {
            super('ultronCore', x, y, duration);
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 1 - progress;
            const pulse = Math.sin(Date.now() / 50) * 5;
            const radius = 20 + pulse + progress * 20;

            ctx.save();
            ctx.translate(this.x, this.y);

            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(128, 0, 128, ${alpha * 0.7})`;
            ctx.shadowColor = `rgba(128, 0, 128, ${alpha})`;
            ctx.shadowBlur = 25 * alpha;
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.strokeStyle = `rgba(150, 0, 150, ${alpha * 0.9})`;
            ctx.lineWidth = 5 * (1 - progress);
            ctx.rotate(progress * Math.PI * 4);
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                const angle = (Math.PI * 2 / 4) * i;
                ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

export class UltronReconstructionEffect extends Effect {
    constructor(x, y, duration, champion) {
        super('ultronReconstruction', x, y, duration);
        this.champion = champion;
        this.particles = [];
        this.hexagons = [];
        
        // Cria partículas orbitando
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                angle: (Math.PI * 2 / 30) * i,
                distance: 40 + Math.random() * 30,
                speed: 0.02 + Math.random() * 0.02,
                size: 2 + Math.random() * 3,
                alpha: Math.random()
            });
        }
        
        // Cria hexágonos de energia
        for (let i = 0; i < 6; i++) {
            this.hexagons.push({
                angle: (Math.PI * 2 / 6) * i,
                distance: 60,
                size: 10,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Atualiza partículas
        this.particles.forEach(p => {
            p.angle += p.speed;
        });
    }

    draw(ctx) {
        const progress = this.getProgress();
        const alpha = 0.7 - progress * 0.4;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Núcleo central pulsante
        const coreSize = 15 + Math.sin(Date.now() / 100) * 5;
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);
        coreGradient.addColorStop(0, `rgba(200, 0, 200, ${alpha})`);
        coreGradient.addColorStop(0.5, `rgba(150, 0, 150, ${alpha * 0.7})`);
        coreGradient.addColorStop(1, `rgba(100, 0, 100, ${alpha * 0.3})`);
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Anéis de energia
        for (let r = 1; r <= 3; r++) {
            const radius = 30 * r + Math.sin(Date.now() / 200 + r) * 10;
            ctx.strokeStyle = `rgba(200, 0, 200, ${alpha * 0.4 / r})`;
            ctx.lineWidth = 3 / r;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Hexágonos de energia
        this.hexagons.forEach(hex => {
            const hexX = Math.cos(hex.angle + progress * Math.PI * 2) * hex.distance;
            const hexY = Math.sin(hex.angle + progress * Math.PI * 2) * hex.distance;
            const pulse = Math.sin(Date.now() / 150 + hex.pulsePhase) * 0.3 + 0.7;
            
            ctx.save();
            ctx.translate(hexX, hexY);
            ctx.rotate(progress * Math.PI * 4);
            
            ctx.strokeStyle = `rgba(200, 0, 200, ${alpha * pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const hexAngle = (Math.PI * 2 / 6) * i;
                const px = Math.cos(hexAngle) * hex.size;
                const py = Math.sin(hexAngle) * hex.size;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Partículas orbitando
        this.particles.forEach(p => {
            const px = Math.cos(p.angle) * p.distance * (1 - progress * 0.3);
            const py = Math.sin(p.angle) * p.distance * (1 - progress * 0.3);
            const particleAlpha = alpha * p.alpha;
            
            ctx.fillStyle = `rgba(150, 0, 200, ${particleAlpha})`;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Rastro
            ctx.strokeStyle = `rgba(200, 0, 255, ${particleAlpha * 0.5})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px, py);
            const trailX = Math.cos(p.angle - 0.3) * p.distance * (1 - progress * 0.3);
            const trailY = Math.sin(p.angle - 0.3) * p.distance * (1 - progress * 0.3);
            ctx.lineTo(trailX, trailY);
            ctx.stroke();
        });
        
        // Texto de progresso
        if (progress < 0.9) {
            const percentage = Math.floor((1 - progress) * 100);
            ctx.fillStyle = `rgba(200, 0, 255, ${alpha})`;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${percentage}%`, 0, 60);
            ctx.font = '12px Arial';
            ctx.fillText('RECONSTRUINDO', 0, 75);
        }
        
        ctx.restore();
        
        // Desenha o champion translúcido durante reconstrução
        if (this.champion && progress < 1) {
            ctx.save();
            ctx.globalAlpha = 0.3 + progress * 0.7; // Vai ficando mais opaco
            
            // Filtro de cor roxa
            ctx.filter = `hue-rotate(280deg) saturate(2)`;
            
            if (this.champion.image && this.champion.image.complete) {
                ctx.drawImage(
                    this.champion.image,
                    this.champion.x,
                    this.champion.y,
                    this.champion.width,
                    this.champion.height
                );
            }
            
            ctx.restore();
        }
    }
}

export class CaptainMarvelMissileExplosionEffect extends Effect {
    constructor(x, y, radius, duration, color = 'gold') {
        super('captainMarvelMissileExplosion', x, y, duration);
        this.radius = radius;
        this.color = color;
    }

    draw(ctx) {
        // 'progress' é o equivalente a 'progresso' no primeiro trecho
        const progress = this.getProgress();
        // 'currentRadius' é o raio da explosão em expansão
        const currentRadius = this.radius * progress;
        // 'alpha' é a taxa de desvanecimento (1 ao 0)
        const fade = 1 - progress;

        // Determina as cores RGB para 'gold' ou 'orange' (cor alternativa)
        const baseColorRGB = this.color === 'gold' ? '255,215,0' : '255,100,0';

        // 1. Desenha o Círculo de Preenchimento (Fill)
        ctx.fillStyle = `rgba(${baseColorRGB}, ${0.7 * fade})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // 2. Desenha o Contorno (Stroke)
        ctx.strokeStyle = `rgba(${baseColorRGB}, ${0.9 * fade})`;
        ctx.lineWidth = 5 * fade;
        ctx.stroke();
    }
}

    export class ThunderStrikeEffect extends Effect {
        constructor(x, y, duration, radius, color = 'yellow') {
            super('thunderStrike', x, y, duration);
            this.radius = radius;
            this.color = color;
        }

        draw(ctx) {
            const progress = this.getProgress();
            const alpha = 1 - progress;
            const currentRadius = this.radius * progress;

            ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
            ctx.lineWidth = 5 * (1 - progress);
            ctx.shadowColor = `rgba(255, 255, 0, ${alpha})`;
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.shadowBlur = 0;
        }
    }

export class HawkeyeArrowEffect extends Effect {
    constructor(x, y, angle, arrowType = 'normal', duration = 100) {
        super('hawkeyeArrow', x, y, duration);
        this.angle = angle;
        this.arrowType = arrowType; // 'normal', 'explosive', 'shock', 'ice', 'poison'
        this.animationTime = 0;
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.animationTime += deltaTime;
    }

    draw(ctx) {
        const progress = this.getProgress();
        const alpha = 1 - progress;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = alpha;

        // Corpo da flecha
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.strokeStyle = '#8B4513'; // Marrom
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Ponta da flecha
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(10, -5);
        ctx.moveTo(15, 0);
        ctx.lineTo(10, 5);
        ctx.strokeStyle = '#C0C0C0'; // Prata
        ctx.lineWidth = 2;
        ctx.stroke();

        // Empenas (penas traseiras)
        ctx.beginPath();
        ctx.moveTo(-15, -4);
        ctx.lineTo(-18, -6);
        ctx.moveTo(-15, 4);
        ctx.lineTo(-18, 6);
        ctx.strokeStyle = '#8B0000'; // Vermelho escuro
        ctx.lineWidth = 2;
        ctx.stroke();

        // Efeitos especiais baseados no tipo
        if (this.arrowType === 'explosive') {
            const glowRadius = Math.sin(this.animationTime / 50) * 3 + 7;
            ctx.beginPath();
            ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 165, 0, 0.5)';
            ctx.shadowColor = 'rgba(255, 165, 0, 0.8)';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        } 
        else if (this.arrowType === 'shock') {
            const zzzSize = 5 + Math.sin(this.animationTime / 70) * 3;
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
            // Cristais de gelo
            ctx.strokeStyle = 'rgba(173, 216, 230, 0.9)';
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                const offset = i * 8 - 8;
                ctx.beginPath();
                ctx.moveTo(offset, -5);
                ctx.lineTo(offset, 5);
                ctx.moveTo(offset - 3, -2);
                ctx.lineTo(offset + 3, 2);
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
        else if (this.arrowType === 'piercing') {
            // Efeito de perfuração - linhas aerodinâmicas
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-20 - i * 5, 0);
                ctx.lineTo(-15 - i * 5, 0);
                ctx.stroke();
            }
        }

        ctx.restore();
    }
}

export class ArrowTrailEffect extends Effect {
    constructor(x, y, color = 'brown', duration = 200) {
        super('arrowTrail', x, y, duration);
        this.color = color;
    }

    draw(ctx) {
        const progress = this.getProgress();
        const alpha = (1 - progress) * 0.3;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
        ctx.fill();
    }
}

export class ArrowStormEffect extends Effect {
    constructor(x, y, radius, duration, arrowCount, damage, owner, gameManagerInstance) {
        super('arrowStorm', x, y, duration);
        this.radius = radius;
        this.arrowCount = arrowCount;
        this.damage = damage;
        this.owner = owner;
        this.gameManager = gameManagerInstance;
        this.arrows = [];
        this.damageDealt = new Set();
        
        // Cria as flechas que cairão
        for (let i = 0; i < arrowCount; i++) {
            const delay = (duration / arrowCount) * i;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            const targetX = x + Math.cos(angle) * distance;
            const targetY = y + Math.sin(angle) * distance;
            
            const arrowTypes = ['standard', 'explosive', 'shock', 'ice', 'poison'];
            const randomType = arrowTypes[Math.floor(Math.random() * arrowTypes.length)];
            
            this.arrows.push({
                targetX: targetX,
                targetY: targetY,
                currentY: -100, // Começa acima da tela
                fallSpeed: 800 + Math.random() * 400,
                delay: delay,
                spawned: false,
                rotation: Math.random() * Math.PI * 2,
                type: randomType,
                hasHit: false
            });
        }
        
        // Marcador visual no chão
        this.groundMarkerAlpha = 1;
    }

    update(deltaTime) {
        super.update(deltaTime);
        const elapsed = Date.now() - this.startTime;
        
        // Atualiza flechas
        this.arrows.forEach(arrow => {
            if (elapsed >= arrow.delay) {
                arrow.spawned = true;
                
                if (!arrow.hasHit) {
                    arrow.currentY += arrow.fallSpeed * (deltaTime / 1000);
                    arrow.rotation += 0.2 * (deltaTime / 1000);
                    
                    // Verifica se atingiu o chão
                    if (arrow.currentY >= arrow.targetY) {
                        arrow.currentY = arrow.targetY;
                        arrow.hasHit = true;
                        
                        // Aplica dano aos inimigos na área
                        this.gameManager.enemies.forEach(enemy => {
                            const dist = Math.hypot(
                                arrow.targetX - enemy.getCenterX(),
                                arrow.targetY - enemy.getCenterY()
                            );
                            
                            if (dist < 30 && !this.damageDealt.has(`${enemy.id}-${arrow.targetX}-${arrow.targetY}`)) {
                                this.damageDealt.add(`${enemy.id}-${arrow.targetX}-${arrow.targetY}`);
                                
                                // Aplica dano
                                enemy.takeDamage(this.damage, this.owner);
                                
                                // Efeitos específicos por tipo
                                if (arrow.type === 'explosive') {
                                    this.gameManager.effects.push(new this.gameManager.RedHulkExplosionEffect(
                                        arrow.targetX, arrow.targetY, 40, 200, 'orange'
                                    ));
                                } else if (arrow.type === 'shock') {
                                    if (Math.random() < 0.7) {
                                        enemy.applyStun(1000);
                                        this.gameManager.effects.push(new this.gameManager.StunEffect(
                                            enemy.getCenterX(), enemy.getCenterY(), 1000
                                        ));
                                    }
                                } else if (arrow.type === 'ice') {
                                    if (Math.random() < 0.5) {
                                        enemy.applyStun(2000);
                                    }
                                } else if (arrow.type === 'poison') {
                                    enemy.applyPoison(3, 4000, 500);
                                }
                            }
                        });
                        
                        // Efeito visual de impacto
                        this.gameManager.effects.push(new this.gameManager.AuraFireParticleEffect(
                            arrow.targetX, arrow.targetY, 15, this.getArrowColor(arrow.type), 300
                        ));
                    }
                }
            }
        });
        
        // Fade out do marcador
        this.groundMarkerAlpha = 1 - (this.getProgress() * 0.5);
    }

    getArrowColor(type) {
        const colors = {
            'standard': 'brown',
            'explosive': 'orange',
            'shock': 'yellow',
            'ice': 'lightblue',
            'poison': 'lime'
        };
        return colors[type] || 'brown';
    }

    draw(ctx) {
        const progress = this.getProgress();
        
        // ===============================
        // MARCADOR NO CHÃO
        // ===============================
        ctx.save();
        ctx.globalAlpha = this.groundMarkerAlpha;
        
        // Círculo da área
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, 'rgba(139, 69, 19, 0.3)');
        gradient.addColorStop(0.7, 'rgba(139, 69, 19, 0.2)');
        gradient.addColorStop(1, 'rgba(139, 69, 19, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Contorno pulsante
        const pulse = Math.sin(Date.now() / 200) * 5;
        ctx.strokeStyle = `rgba(200, 150, 0, ${this.groundMarkerAlpha * 0.8})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(200, 150, 0, 0.6)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Símbolo de alvo
        ctx.strokeStyle = `rgba(200, 150, 0, ${this.groundMarkerAlpha})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            ctx.beginPath();
            ctx.moveTo(this.x + Math.cos(angle) * 10, this.y + Math.sin(angle) * 10);
            ctx.lineTo(this.x + Math.cos(angle) * 20, this.y + Math.sin(angle) * 20);
            ctx.stroke();
        }
        
        ctx.restore();
        
        // ===============================
        // FLECHAS CAINDO
        // ===============================
        this.arrows.forEach(arrow => {
            if (arrow.spawned && !arrow.hasHit) {
                ctx.save();
                ctx.translate(arrow.targetX, arrow.currentY);
                ctx.rotate(arrow.rotation);
                
                const arrowColor = this.getArrowColor(arrow.type);
                
                // Corpo da flecha
                ctx.strokeStyle = arrowColor === 'brown' ? '#8B4513' : arrowColor;
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-12, 0);
                ctx.lineTo(12, 0);
                ctx.stroke();
                
                // Ponta
                ctx.strokeStyle = '#C0C0C0';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(12, 0);
                ctx.lineTo(8, -4);
                ctx.moveTo(12, 0);
                ctx.lineTo(8, 4);
                ctx.stroke();
                
                // Empenas
                ctx.strokeStyle = '#8B0000';
                ctx.beginPath();
                ctx.moveTo(-12, -3);
                ctx.lineTo(-15, -5);
                ctx.moveTo(-12, 3);
                ctx.lineTo(-15, 5);
                ctx.stroke();
                
                // Efeito visual por tipo
                if (arrow.type === 'explosive') {
                    ctx.fillStyle = `rgba(255, 165, 0, ${0.6 + Math.sin(Date.now() / 100) * 0.4})`;
                    ctx.shadowColor = 'rgba(255, 165, 0, 0.8)';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(0, 0, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else if (arrow.type === 'shock') {
                    ctx.fillStyle = 'yellow';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('⚡', 0, -10);
                } else if (arrow.type === 'ice') {
                    ctx.strokeStyle = 'rgba(173, 216, 230, 0.9)';
                    ctx.lineWidth = 2;
                    for (let i = -8; i <= 8; i += 4) {
                        ctx.beginPath();
                        ctx.moveTo(i, -4);
                        ctx.lineTo(i, 4);
                        ctx.stroke();
                    }
                } else if (arrow.type === 'poison') {
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.arc(-8 + i * 4, 0, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                
                // Rastro de queda
                ctx.strokeStyle = `rgba(200, 200, 200, 0.3)`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -20);
                ctx.stroke();
                
                ctx.restore();
            }
        });
        
        // ===============================
        // TEXTO INFORMATIVO
        // ===============================
        if (progress < 0.2) {
            ctx.fillStyle = `rgba(200, 150, 0, ${1 - progress * 5})`;
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(200, 150, 0, 0.8)';
            ctx.shadowBlur = 10;
            ctx.fillText('TEMPESTADE DE FLECHAS', this.x, this.y - this.radius - 20);
            ctx.shadowBlur = 0;
        }
    }
}

// ===============================
// 🔮 PEDRA DE ASGARD - TOTEM DE CURA
// ===============================
export class AsgardStoneEffect extends Effect {
    constructor(x, y, radius, duration, particleCount = 20) { // <--- CORREÇÃO: Adicionado 'particleCount' com valor padrão
        super('AsgardStoneEffect', x, y, duration);
        this.radius = radius;
        this.particles = [];
        this.healingBeams = []; // Array para armazenar feixes de cura temporários
        this.runeSymbols = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ'];
        this.orbitingRunes = [];
        this.innerRadius = 10;
        
        // Cria 6 runas orbitantes
        for (let i = 0; i < 6; i++) {
            this.orbitingRunes.push({
                angle: (Math.PI * 2 / 6) * i,
                speed: 0.02 + Math.random() * 0.01,
                symbol: this.runeSymbols[i],
                distance: 35,
                floatOffset: Math.random() * Math.PI * 2
            });
        }
        
        // Partículas de cura flutuantes
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                // Posição angular e radial dentro do raio
                angle: Math.random() * Math.PI * 2,
                distance: Math.random() * (radius - this.innerRadius) + this.innerRadius,
                
                speed: 0.001 + Math.random() * 0.003, // Velocidade orbital lenta
                size: 2 + Math.random() * 3,
                alpha: 0.5 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2, // Para pulsação de alpha
                // Não precisa de 'offset' para flutuadores, mas 'phase' é essencial
            });
        }
    }
    
    // -------------------------------
    // 🔄 UPDATE
    // -------------------------------
    update(deltaTime) {
        super.update(deltaTime);

        const normalizedDelta = deltaTime / 16; // Normaliza a atualização para 60fps

        // Atualiza a rotação e flutuação das runas
        this.orbitingRunes.forEach(rune => {
            rune.angle += rune.speed * normalizedDelta;
            // Flutuação sutil das runas
            rune.distance = 35 + Math.sin(rune.floatOffset + this.getProgress() * Math.PI * 4) * 3;
        });

        // Atualiza as partículas de cura (pulsação e movimento lento)
        this.particles.forEach(p => {
            p.phase += p.speed * 10 * normalizedDelta; // Pulsação rápida
            p.angle += p.speed * normalizedDelta; // Movimento orbital lento
        });
        
        // Feixes de cura são geralmente adicionados por outra classe (ex: GameManager) 
        // mas esta linha garante que eles podem ser processados se existirem
    }

    // -------------------------------
    // 🎨 DRAW
    // -------------------------------
    draw(ctx) {
        if (this.isComplete) return;

        const progress = this.getProgress();
        // A transparência do efeito aumenta e depois diminui (pulsar no meio)
        const alpha = 0.5 + 0.5 * Math.sin(progress * Math.PI * 4); // Pulsação visual
        
        // 1. Aura Central (Base do Totem)
        ctx.save();
        ctx.globalAlpha = 0.4 * alpha;
        
        // Gradiente radial do centro
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, 'rgba(150, 255, 200, 1)'); // Centro claro
        gradient.addColorStop(0.7, 'rgba(0, 255, 100, 0.4)'); // Meio verde-água
        gradient.addColorStop(1, 'rgba(0, 255, 100, 0)'); // Borda transparente
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();

        // 2. Partículas Flutuantes de Cura
        this.particles.forEach(p => {
            // Pulsação de alpha individual da partícula
            const currentAlpha = p.alpha * alpha * (0.5 + Math.sin(p.phase) * 0.5); 
            if (currentAlpha <= 0.01) return;

            // Converte coordenadas polares para cartesianas
            const px = this.x + Math.cos(p.angle) * p.distance;
            const py = this.y + Math.sin(p.angle) * p.distance;

            ctx.save();
            ctx.globalAlpha = currentAlpha;
            ctx.fillStyle = 'rgba(0, 255, 150, 1)'; 

            // Desenha a partícula
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // 3. Runas Orbitantes
        this.orbitingRunes.forEach(rune => {
            const runeX = this.x + Math.cos(rune.angle) * rune.distance;
            const runeY = this.y + Math.sin(rune.angle) * rune.distance;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial'; 
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(rune.symbol, runeX, runeY);
            ctx.restore();
        });

        // 4. Desenha Feixes de Cura (se houver)
        this.healingBeams.forEach(beam => {
            // Desenha um feixe ondulado entre a pedra e o alvo
            // Você precisará definir o objeto 'beam' (ex: { target: Champion, offset: number })
            
            ctx.save();
            ctx.strokeStyle = `rgba(0, 255, 100, ${0.8 * alpha})`;
            ctx.lineWidth = 2 + Math.sin(Date.now() / 100) * 0.5; // Linha pulsante
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            // Simples feixe reto para demonstração
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(beam.target.x, beam.target.y);
            ctx.stroke();
            ctx.restore();
        });

        // 5. Brilho central para a 'pedra'
        ctx.save();
        ctx.globalAlpha = 1 * alpha;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.innerRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ===============================
// 🌟 RAIO DE CURA (Do Totem para Campeão)
// ===============================


export class HealingBeamEffect extends Effect {
    constructor(fromX, fromY, toX, toY, duration) {
        super(fromX, fromY, duration);
        // coordenadas finais já passadas
        this.toX = toX;
        this.toY = toY;

        // ✅ inicializa explicitamente as coordenadas usadas no draw()
        this.x1 = fromX;
        this.y1 = fromY;
        this.x2 = toX;
        this.y2 = toY;

        this.spawnTime = Date.now(); // ← ADICIONE ESTA LINHA

        this.particles = [];

        // Cria partículas ao longo do raio
        const numParticles = 15;
        for (let i = 0; i < numParticles; i++) {
            this.particles.push({
                progress: i / numParticles,
                size: 2 + Math.random() * 3,
                offset: Math.random() * 10 - 5,
                speed: 0.02 + Math.random() * 0.03,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);

        this.particles.forEach(p => {
            p.progress += p.speed;
            if (p.progress > 1) p.progress = 0;
            p.phase += 0.1;
        });

        // Opcional: atualiza endpoints se o efeito for ligado a entidades móveis
        if (this.target && typeof this.target.getCenterX === 'function') {
            this.x2 = this.target.getCenterX();
            this.y2 = this.target.getCenterY();
        }
    }

    draw(ctx) {
        const elapsed = Date.now() - this.spawnTime;
        const progress = Math.min(1, elapsed / this.duration); // ← CORRIJA AQUI
        const alpha = 0.8 * (1 - progress); // ← Agora não será NaN

        // valida alpha e progress
        const baseAlpha = Math.max(0, Math.min(1, 1 - progress));
        if (baseAlpha <= 0 || progress >= 1) {
            this.isComplete = true;
            return;
        }

        // Use valores seguros para gradient — fallback para coordenadas originais
        const x1 = isFinite(this.x1) ? this.x1 : (isFinite(this.x) ? this.x : 0);
        const y1 = isFinite(this.y1) ? this.y1 : (isFinite(this.y) ? this.y : 0);
        const x2 = isFinite(this.x2) ? this.x2 : (isFinite(this.toX) ? this.toX : x1);
        const y2 = isFinite(this.y2) ? this.y2 : (isFinite(this.toY) ? this.toY : y1);

        // Se ainda não temos números válidos, aborta o desenho (evita crash)
        if (![x1, y1, x2, y2].every(Number.isFinite)) {
            this.isComplete = true;
            return;
        }

        ctx.save();

        // RAIO PRINCIPAL (VERDE CURA)
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, `rgba(100, 255, 150, 1)`);
        gradient.addColorStop(0.5, `rgba(50, 255, 100, 1)`);
        gradient.addColorStop(1, `rgba(100, 255, 150, 1)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 8;
        ctx.shadowColor = 'rgba(50, 255, 100, 0.8)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // PARTÍCULAS DE CURA
        const numParticles = 8;
        for (let i = 0; i < numParticles; i++) {
            const t = (i / numParticles + progress) % 1;
            const px = x1 + (x2 - x1) * t;
            const py = y1 + (y2 - y1) * t;

            const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, 6);
            particleGradient.addColorStop(0, `rgba(200, 255, 200, ${baseAlpha})`);
            particleGradient.addColorStop(1, `rgba(50, 255, 100, 0)`);

            ctx.fillStyle = particleGradient;
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // SÍMBOLOS DE CURA (+)
        ctx.fillStyle = `rgba(255, 255, 255, ${baseAlpha * 0.9})`;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(100, 255, 150, 1)';
        ctx.shadowBlur = 10;
        ctx.fillText('+', x2, y2 - 5);
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}



/**
 * 🌀 EFEITO DE CORRENTE AZUL DA JOIA DO ESPAÇO
 * Corrente animada que puxa o inimigo gradualmente
 */
export class SpaceStonePullChainEffect extends Effect {
constructor(startX, startY, endX, endY, targetEnemy, duration) {
    // ✅ VALIDAÇÃO DO DURATION PRIMEIRO
    const validDuration = (isFinite(duration) && duration > 0) ? duration : 2000;
    
    super('spaceStonePullChain', startX, startY, validDuration);
    
    // ✅ VALIDAÇÃO EXPANDIDA DAS COORDENADAS
    if (!isFinite(startX) || !isFinite(startY) || !isFinite(endX) || !isFinite(endY)) {
        console.error('❌ SpaceStonePullChainEffect: Coordenadas inválidas');
        console.log('Valores:', { startX, startY, endX, endY });
        this.isComplete = true;
        this.chainLinks = [];
        this.energyParticles = [];
        return;
    }
    
    // ✅ VALIDAÇÃO DO INIMIGO
    if (!targetEnemy || typeof targetEnemy.getCenterX !== 'function') {
        console.error('❌ SpaceStonePullChainEffect: targetEnemy inválido');
        this.isComplete = true;
        this.chainLinks = [];
        this.energyParticles = [];
        return;
    }
    
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.targetEnemy = targetEnemy;
    this.spawnTime = Date.now();
    
    // ✅ INICIALIZAÇÃO GARANTIDA DOS ARRAYS
    this.chainLinks = [];
    this.energyParticles = [];
    
    // ===============================
    // CONFIGURAÇÃO DA CORRENTE
    // ===============================
    this.numLinks = 15;
    this.linkSize = 12;
    
    // Inicializa elos ao longo da linha
    for (let i = 0; i < this.numLinks; i++) {
        const t = i / (this.numLinks - 1);
        this.chainLinks.push({
            x: startX + (endX - startX) * t,
            y: startY + (endY - startY) * t,
            rotation: 0,
            pulsePhase: Math.random() * Math.PI * 2
        });
    }
    
    // Partículas de energia ao redor
    for (let i = 0; i < 20; i++) {
        this.energyParticles.push({
            angle: Math.random() * Math.PI * 2,
            distance: 20 + Math.random() * 30,
            speed: 0.02 + Math.random() * 0.03,
            size: 3 + Math.random() * 4,
            alpha: 0.5 + Math.random() * 0.5
        });
    }
}
    
update(deltaTime) {
    // ✅ VALIDAÇÃO CRÍTICA: Arrays devem existir
    if (!this.chainLinks || !this.energyParticles) {
        console.warn('⚠️ Arrays não inicializados, completando efeito');
        this.isComplete = true;
        return;
    }
    
    const elapsed = Date.now() - this.spawnTime;
    
    if (elapsed >= this.duration) {
        this.isComplete = true;
        return;
    }
    
    // Atualiza posição final se o inimigo ainda existe
    if (this.targetEnemy && this.targetEnemy.hp > 0) {
        this.startX = this.targetEnemy.getCenterX();
        this.startY = this.targetEnemy.getCenterY();
    }
    
    // Atualiza elos da corrente (movimento ondulatório)
    const time = Date.now() / 1000;
    this.chainLinks.forEach((link, i) => {
        const t = i / (this.numLinks - 1);
        
        // Posição base ao longo da linha
        const baseX = this.startX + (this.endX - this.startX) * t;
        const baseY = this.startY + (this.endY - this.startY) * t;
        
        // Onda perpendicular
        const angle = Math.atan2(this.endY - this.startY, this.endX - this.startX);
        const waveOffset = Math.sin(time * 4 + t * Math.PI * 2) * 15;
        
        link.x = baseX + Math.cos(angle + Math.PI / 2) * waveOffset;
        link.y = baseY + Math.sin(angle + Math.PI / 2) * waveOffset;
        
        // Rotação dos elos
        link.rotation += 0.1 * (deltaTime / 16.67);
    });
    
    // Atualiza partículas orbitais
    this.energyParticles.forEach(p => {
        p.angle += p.speed;
    });
}
    
draw(ctx) {
    if (this.isComplete) return;
    
    const elapsed = Date.now() - this.spawnTime;
    const progress = Math.min(elapsed / this.duration, 1);
    
    // ✅ VALIDAÇÃO CRÍTICA: Garante que alpha é um número válido
    let alpha = 1 - progress * 0.3;
    if (!isFinite(alpha) || isNaN(alpha)) {
        alpha = 0.7; // Fallback seguro
    }
    alpha = Math.max(0, Math.min(1, alpha)); // Clamp entre 0 e 1
    
    const time = Date.now() / 1000;
    
    ctx.save();
    
    // ===============================
    // LINHA DE ENERGIA BASE (BRILHO)
    // ===============================
    const baseGradient = ctx.createLinearGradient(
        this.startX, this.startY, 
        this.endX, this.endY
    );
    baseGradient.addColorStop(0, `rgba(100, 200, 255, ${alpha * 0.6})`);
    baseGradient.addColorStop(0.5, `rgba(0, 150, 255, ${alpha * 0.8})`);
    baseGradient.addColorStop(1, `rgba(100, 200, 255, ${alpha * 0.6})`);
    
    ctx.strokeStyle = baseGradient;
    ctx.lineWidth = 15;
    ctx.shadowColor = 'rgba(0, 150, 255, 0.8)';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(this.endX, this.endY);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // ===============================
    // CORRENTE DE ELOS METÁLICOS
    // ===============================
    for (let i = 0; i < this.numLinks; i++) {
        const link = this.chainLinks[i];
        let linkAlpha = alpha * (0.9 + Math.sin(time * 5 + link.pulsePhase) * 0.1);
        linkAlpha = Math.max(0, Math.min(1, linkAlpha)); // ✅ Clamp
        
        ctx.save();
        ctx.translate(link.x, link.y);
        ctx.rotate(link.rotation);
        
        // Elo da corrente (formato oval/elipse)
        const linkGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.linkSize);
        linkGradient.addColorStop(0, `rgba(150, 220, 255, ${linkAlpha})`);
        linkGradient.addColorStop(0.6, `rgba(100, 180, 255, ${linkAlpha * 0.8})`);
        linkGradient.addColorStop(1, `rgba(50, 150, 255, ${linkAlpha * 0.5})`);
        
        ctx.fillStyle = linkGradient;
        ctx.strokeStyle = `rgba(200, 240, 255, ${linkAlpha})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(100, 200, 255, 0.8)';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.ellipse(0, 0, this.linkSize, this.linkSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Brilho interno
        ctx.fillStyle = `rgba(255, 255, 255, ${linkAlpha * 0.6})`;
        ctx.beginPath();
        ctx.ellipse(-this.linkSize * 0.3, -this.linkSize * 0.2, 
                   this.linkSize * 0.3, this.linkSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    ctx.shadowBlur = 0;
    
    // ===============================
    // LINHAS CONECTANDO OS ELOS
    // ===============================
    ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.7})`;
    ctx.lineWidth = 4;
    
    for (let i = 0; i < this.numLinks - 1; i++) {
        const link1 = this.chainLinks[i];
        const link2 = this.chainLinks[i + 1];
        
        ctx.beginPath();
        ctx.moveTo(link1.x, link1.y);
        ctx.lineTo(link2.x, link2.y);
        ctx.stroke();
    }
    
    // ===============================
    // PARTÍCULAS DE ENERGIA ORBITAL (INÍCIO)
    // ===============================
    this.energyParticles.forEach(p => {
        const px = this.startX + Math.cos(p.angle) * p.distance;
        const py = this.startY + Math.sin(p.angle) * p.distance;
        let particleAlpha = alpha * p.alpha;
        particleAlpha = Math.max(0, Math.min(1, particleAlpha)); // ✅ Clamp
        
        const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, p.size);
        particleGradient.addColorStop(0, `rgba(150, 220, 255, ${particleAlpha})`);
        particleGradient.addColorStop(1, `rgba(100, 200, 255, 0)`);
        
        ctx.fillStyle = particleGradient;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // ===============================
    // PORTAL DE ORIGEM (AZUL BRILHANTE)
    // ===============================
    const originSize = 30 + Math.sin(time * 6) * 8;
    const originGradient = ctx.createRadialGradient(
        this.startX, this.startY, 0,
        this.startX, this.startY, originSize
    );
    originGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    originGradient.addColorStop(0.4, `rgba(150, 220, 255, ${alpha * 0.8})`);
    originGradient.addColorStop(1, `rgba(100, 200, 255, 0)`);
    
    ctx.fillStyle = originGradient;
    ctx.shadowColor = 'rgba(100, 200, 255, 1)';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(this.startX, this.startY, originSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // ===============================
    // PORTAL DE DESTINO (INFINITY ULTRON)
    // ===============================
    const destSize = 25 + Math.sin(time * 6 + Math.PI) * 6;
    const destGradient = ctx.createRadialGradient(
        this.endX, this.endY, 0,
        this.endX, this.endY, destSize
    );
    destGradient.addColorStop(0, `rgba(100, 150, 255, ${alpha})`);
    destGradient.addColorStop(1, `rgba(50, 100, 200, 0)`);
    
    ctx.fillStyle = destGradient;
    ctx.shadowColor = 'rgba(0, 100, 255, 0.8)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(this.endX, this.endY, destSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // ===============================
    // PULSOS VIAJANDO PELA CORRENTE
    // ===============================
    for (let p = 0; p < 3; p++) {
        const pulseProgress = ((time * 2 + p * 0.33) % 1);
        const pulseX = this.startX + (this.endX - this.startX) * pulseProgress;
        const pulseY = this.startY + (this.endY - this.startY) * pulseProgress;
        const pulseSize = 8 + Math.sin(time * 8 + p) * 3;
        
        const pulseGradient = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, pulseSize);
        pulseGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        pulseGradient.addColorStop(1, `rgba(150, 220, 255, 0)`);
        
        ctx.fillStyle = pulseGradient;
        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    // ===============================
    // TEXTO DE AVISO (INÍCIO DO EFEITO)
    // ===============================
    if (progress < 0.3) {
        let textAlpha = alpha * (1 - progress * 3);
        textAlpha = Math.max(0, Math.min(1, textAlpha)); // ✅ Clamp
        
        ctx.fillStyle = `rgba(100, 200, 255, ${textAlpha})`;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(100, 200, 255, 1)';
        ctx.shadowBlur = 12;
        ctx.fillText('💠 PUXÃO ESPACIAL 💠', 
                    this.startX + (this.endX - this.startX) / 2,
                    this.startY + (this.endY - this.startY) / 2 - 30);
        ctx.shadowBlur = 0;
    }
    
    ctx.restore();
}
}

// 💥 Efeito de Impacto: Colapso da Realidade
export class RealityEraseImpactEffect extends Effect {
    constructor(x, y, radius, duration) {
        super(x, y, duration);
        this.radius = radius;
        this.maxRadius = radius * 3; // O raio máximo de distorção
        this.shards = []; // Fragmentos de luz

        // Inicializa os fragmentos de luz (cacos de energia)
        for (let i = 0; i < 10; i++) {
            this.shards.push({
                angle: Math.random() * Math.PI * 2,
                speed: 1 + Math.random() * 2,
                life: 1.0,
                x: x,
                y: y
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        const ratio = this.lifeTime / this.duration; // 1.0 no início, 0.0 no fim

        // O raio colapsa para dentro (inverso da expansão normal)
        this.currentRadius = this.maxRadius * (1 - ratio); 
        
        // Atualiza fragmentos: eles voam para fora
        this.shards.forEach(shard => {
            shard.x += Math.cos(shard.angle) * shard.speed;
            shard.y += Math.sin(shard.angle) * shard.speed;
            shard.life -= 0.05;
        });

        this.shards = this.shards.filter(s => s.life > 0);

        return this.lifeTime > 0;
    }

    draw(ctx) {
        const ratio = this.lifeTime / this.duration;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 1. Distorção Circular / Glitch Físico (Ruptura)
        ctx.strokeStyle = `rgba(255, 0, 255, ${ratio * 0.8})`; // Roxo brilhante
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]); // Linha tracejada para o "glitch"
        ctx.beginPath();
        ctx.arc(0, 0, this.currentRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 2. Fragmentos de Luz (Cacos de Energia)
        this.shards.forEach(shard => {
            ctx.globalAlpha = shard.life;
            ctx.fillStyle = '#FF4500'; // Vermelho-alaranjado
            ctx.beginPath();
            ctx.arc(shard.x - this.x, shard.y - this.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}

// ==============================================
// 🤯 TEAM UP: FEIXE DE DRENAGEM DO CAOS (Wanda + Emma)
// ==============================================
export class ChaosDrainBeamTeamUpEffect {
    constructor(wanda, emma, gameManager) { 
        this.wanda = wanda;
        this.emma = emma;
        this.gameManager = gameManager;
        
        // Configurações
        this.duration = 5000;      // 5 segundos de duração
        this.drainAmount = 15;     // Dano base por tick
        this.drainInterval = 150;  // Tick rápido (0.15s)
        this.lastDrainTime = 0;    
        
        this.spawnTime = Date.now();
        this.endTime = this.spawnTime + this.duration;
        this.targetEnemy = null; 
        
        // Sistemas de Partículas Visuais
        this.particles = [];       // Partículas de drenagem (Inimigo -> Núcleo)
        this.sparkles = [];        // Faíscas de conexão (Wanda <-> Emma)
        this.corePulse = 0;        // Fase de pulsação do núcleo
        this.glitchLines = [];     // Linhas de distorção de realidade
    }

    update(deltaTime, enemies) {
        // Verifica condições de término
        if (Date.now() > this.endTime || this.wanda.hp <= 0 || this.emma.hp <= 0) { 
            if (this.targetEnemy) this.targetEnemy.isDrained = false;
            return false; 
        }

        // 1. Gerenciamento de Alvo
        if (!this.targetEnemy || this.targetEnemy.hp <= 0 || !this.targetEnemy.isDrained) {
            // Prioriza inimigos com mais HP
            const validEnemies = enemies.filter(e => !e.isDrained && e.hp > 0);
            if (validEnemies.length > 0) {
                this.targetEnemy = validEnemies.sort((a, b) => b.hp - a.hp)[0];
                this.targetEnemy.isDrained = true;
            } else {
                 return false; // Sem alvos, encerra
            }
        }
        
        // 2. Lógica de Dano e Cura
        if (Date.now() > this.lastDrainTime + this.drainInterval) {
            this.lastDrainTime = Date.now();
            
            if (this.targetEnemy && this.targetEnemy.hp > 0) {
                // Dano aumenta com o nível da Wanda
                const finalDrainDamage = this.drainAmount + (this.wanda.level * 3); 
                
                // Aplica dano REAL (ignora armadura - magia do caos)
                this.targetEnemy.takeDamage(finalDrainDamage, this.wanda);
                
                // Cura Wanda e Emma
                const healPerTick = finalDrainDamage * 0.6; 
                this.wanda.heal(healPerTick); 
                this.emma.heal(healPerTick);
                
                // Popups de texto (menos frequentes para não poluir)
                if (Math.random() < 0.3) {
                    this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                        this.targetEnemy.getCenterX(), this.targetEnemy.getCenterY() - 20, 
                        `-${finalDrainDamage.toFixed(0)}`, 'red', 400
                    ));
                }
                
                // Gera partículas de sangue/energia no inimigo
                for(let i=0; i<3; i++) {
                    this.particles.push({
                        x: this.targetEnemy.getCenterX() + (Math.random()-0.5)*30,
                        y: this.targetEnemy.getCenterY() + (Math.random()-0.5)*30,
                        size: 4 + Math.random() * 4,
                        speed: 400 + Math.random() * 200,
                        life: 1.0,
                        type: 'drain' // Tipo drenagem
                    });
                }
            }
        }
        
        // 3. Atualização Visual
        this.corePulse += deltaTime / 200;
        const midX = (this.wanda.getCenterX() + this.emma.getCenterX()) / 2;
        const midY = (this.wanda.getCenterY() + this.emma.getCenterY()) / 2;

        // Atualiza Partículas de Drenagem (Inimigo -> Meio)
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => {
            const dx = midX - p.x;
            const dy = midY - p.y;
            const dist = Math.hypot(dx, dy);
            
            // Movimento acelerado em direção ao núcleo
            const move = p.speed * (deltaTime / 1000);
            p.x += (dx / dist) * move;
            p.y += (dy / dist) * move;
            
            p.life -= 0.02; // Decaimento
            p.size *= 0.95; // Encolhe ao chegar perto
        });

        // Gera Faíscas de Conexão (Wanda <-> Emma)
        if (Math.random() < 0.4) {
            const t = Math.random(); // Posição na linha (0 a 1)
            this.sparkles.push({
                x: this.wanda.getCenterX() + (this.emma.getCenterX() - this.wanda.getCenterX()) * t,
                y: this.wanda.getCenterY() + (this.emma.getCenterY() - this.wanda.getCenterY()) * t,
                vx: (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 50,
                life: 0.5,
                color: Math.random() > 0.5 ? '#ff0000' : '#800080' // Vermelho ou Roxo
            });
        }

        // Atualiza Faíscas
        this.sparkles = this.sparkles.filter(s => s.life > 0);
        this.sparkles.forEach(s => {
            s.x += s.vx * (deltaTime/1000);
            s.y += s.vy * (deltaTime/1000);
            s.life -= deltaTime/1000;
        });

        // Gera Linhas de Glitch (Realidade Quebrada)
        if (Math.random() < 0.1) {
            this.glitchLines.push({
                x: midX + (Math.random() - 0.5) * 200,
                y: midY + (Math.random() - 0.5) * 200,
                width: 50 + Math.random() * 100,
                life: 0.1
            });
        }
        this.glitchLines = this.glitchLines.filter(g => g.life > 0);
        this.glitchLines.forEach(g => g.life -= deltaTime/1000);

        return true; 
    }

    draw(ctx) {
        if (!this.wanda || !this.emma) return;

        const wx = this.wanda.getCenterX();
        const wy = this.wanda.getCenterY();
        const ex = this.emma.getCenterX();
        const ey = this.emma.getCenterY();
        const midX = (wx + ex) / 2;
        const midY = (wy + ey) / 2;
        const time = Date.now() / 1000;

        ctx.save();
        
        // Modo de mistura para brilho intenso
        ctx.globalCompositeOperation = 'lighter';

        // 1. VÍNCULO CAÓTICO (Wanda <-> Emma)
        // Cria um raio elétrico vermelho escuro
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        
        const distance = Math.hypot(ex - wx, ey - wy);
        const steps = 20;
        
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const baseX = wx + (ex - wx) * t;
            const baseY = wy + (ey - wy) * t;
            
            // Ruído aleatório para parecer eletricidade instável
            const noise = (Math.sin(time * 20 + i) * 10) * Math.sin(t * Math.PI); 
            
            ctx.lineTo(baseX + noise, baseY + noise);
        }
        ctx.lineTo(ex, ey);
        
        ctx.strokeStyle = 'rgba(255, 0, 50, 0.8)'; // Vermelho Neon
        ctx.lineWidth = 6 + Math.sin(time * 10) * 2;
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 20;
        ctx.stroke();
        
        // Núcleo branco interno do raio
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.stroke();

        // 2. NÚCLEO DE DRENAGEM (Centro)
        // Uma esfera negra com bordas vermelhas girando
        const coreSize = 30 + Math.sin(time * 5) * 5;
        
        const coreGrad = ctx.createRadialGradient(midX, midY, 0, midX, midY, coreSize);
        coreGrad.addColorStop(0, 'black'); // Buraco negro no centro
        coreGrad.addColorStop(0.6, 'rgba(139, 0, 0, 1)'); // Vermelho sangue
        coreGrad.addColorStop(1, 'rgba(255, 0, 255, 0)'); // Transparente
        
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(midX, midY, coreSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Anéis de energia orbitando o núcleo
        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(time * 3);
        ctx.strokeStyle = 'rgba(255, 0, 100, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, coreSize * 1.5, coreSize * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.rotate(Math.PI / 2); // Segundo anel perpendicular
        ctx.beginPath();
        ctx.ellipse(0, 0, coreSize * 1.5, coreSize * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 3. TENTÁCULOS DE DRENAGEM (Inimigo -> Núcleo)
        // Desenha as partículas sendo sugadas
        this.particles.forEach(p => {
            const alpha = p.life;
            ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Rastro
            ctx.strokeStyle = `rgba(100, 0, 0, ${alpha * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            // Desenha um pequeno rastro apontando para longe do centro
            const angle = Math.atan2(midY - p.y, midX - p.x);
            ctx.lineTo(p.x - Math.cos(angle) * 20, p.y - Math.sin(angle) * 20);
            ctx.stroke();
        });

        // 4. EFEITOS DE GLITCH (Realidade Instável)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.glitchLines.forEach(g => {
            ctx.fillRect(g.x - g.width/2, g.y, g.width, 2);
        });

        // 5. RESTAURAÇÃO E TEXTO
        ctx.globalCompositeOperation = 'source-over';
        
        // Timer e Nome
        const timeLeft = Math.ceil((this.endTime - Date.now()) / 1000);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 10;
        ctx.fillText(`☠️ CHAOS DRAIN: ${timeLeft}s`, midX, midY - coreSize - 20);

        ctx.restore();
    }
}

// ============================================
// 🔥 JEAN GREY - PHOENIX EFFECTS
// ============================================

// Efeito de Chama Cósmica (Ataque Principal)
export class PhoenixFlameEffect extends Effect {
    constructor(sourceX, sourceY, targetX, targetY, duration) {
        super('phoenixFlame', sourceX, sourceY, duration);
        this.targetX = targetX;
        this.targetY = targetY;
        this.particles = [];
        
        // Cria partículas de fogo
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                progress: i / 15,
                speed: 1.5 + Math.random() * 0.5,
                offsetX: (Math.random() - 0.5) * 20,
                offsetY: (Math.random() - 0.5) * 20,
                size: 3 + Math.random() * 4
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.particles.forEach(p => {
            p.progress += p.speed * (deltaTime / this.duration);
        });
    }

    draw(ctx) {
        const progress = this.getProgress();
        const alpha = 1 - progress;
        
        ctx.save();
        
        // Linha principal de fogo
        const gradient = ctx.createLinearGradient(this.x, this.y, this.targetX, this.targetY);
        gradient.addColorStop(0, `rgba(255, 255, 100, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 150, 0, ${alpha * 0.8})`);
        gradient.addColorStop(1, `rgba(255, 69, 0, ${alpha * 0.6})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 15 * (1 - progress * 0.5);
        ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.targetX, this.targetY);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Partículas de fogo
        this.particles.forEach(p => {
            if (p.progress <= 1) {
                const px = this.x + (this.targetX - this.x) * p.progress + p.offsetX;
                const py = this.y + (this.targetY - this.y) * p.progress + p.offsetY;
                const particleAlpha = alpha * (1 - p.progress);
                
                const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, p.size);
                particleGradient.addColorStop(0, `rgba(255, 255, 200, ${particleAlpha})`);
                particleGradient.addColorStop(0.5, `rgba(255, 150, 0, ${particleAlpha * 0.7})`);
                particleGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
                
                ctx.fillStyle = particleGradient;
                ctx.beginPath();
                ctx.arc(px, py, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        ctx.restore();
    }
}

// Indicador Visual de Faíscas no Inimigo
export class PhoenixSparkEffect extends Effect {
    constructor(x, y, sparkCount, duration) {
        super('phoenixSpark', x, y, duration);
        this.sparkCount = sparkCount;
    }

    draw(ctx) {
        const progress = this.getProgress();
        const alpha = 1 - progress;
        const time = Date.now() / 1000;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Desenha Faíscas orbitando
        for (let i = 0; i < this.sparkCount; i++) {
            const angle = (Math.PI * 2 / 3) * i + time * 2;
            const radius = 25 + Math.sin(time * 4 + i) * 5;
            const sx = Math.cos(angle) * radius;
            const sy = Math.sin(angle) * radius;
            
            // Faísca individual
            const sparkGradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8);
            sparkGradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
            sparkGradient.addColorStop(0.6, `rgba(255, 150, 0, ${alpha * 0.8})`);
            sparkGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
            
            ctx.fillStyle = sparkGradient;
            ctx.shadowColor = 'rgba(255, 150, 0, 0.8)';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(sx, sy, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Texto do contador
        if (progress < 0.5) {
            ctx.fillStyle = `rgba(255, 200, 0, ${alpha * (1 - progress * 2)})`;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
            ctx.shadowBlur = 10;
            ctx.fillText(`🔥 ${this.sparkCount}`, 0, -35);
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }
}

// Explosão de Faíscas
export class PhoenixExplosionEffect extends Effect {
    constructor(x, y, radius, duration) {
        super('phoenixExplosion', x, y, duration);
        this.radius = radius;
        this.flames = [];
        
        // Cria chamas explodindo
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            this.flames.push({
                angle: angle,
                distance: 0,
                maxDistance: radius * (0.8 + Math.random() * 0.4),
                speed: 300 + Math.random() * 200,
                size: 8 + Math.random() * 8
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.flames.forEach(f => {
            f.distance += f.speed * (deltaTime / 1000);
        });
    }

    draw(ctx) {
        const progress = this.getProgress();
        const alpha = 1 - progress;
        
        ctx.save();
        
        // Núcleo da explosão
        const coreSize = 30 + progress * 50;
        const coreGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, coreSize);
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        coreGradient.addColorStop(0.3, `rgba(255, 255, 100, ${alpha * 0.9})`);
        coreGradient.addColorStop(0.6, `rgba(255, 150, 0, ${alpha * 0.6})`);
        coreGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        
        ctx.fillStyle = coreGradient;
        ctx.shadowColor = 'rgba(255, 150, 0, 1)';
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(this.x, this.y, coreSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Chamas explodindo
        this.flames.forEach(f => {
            if (f.distance <= f.maxDistance) {
                const fx = this.x + Math.cos(f.angle) * f.distance;
                const fy = this.y + Math.sin(f.angle) * f.distance;
                const flameAlpha = alpha * (1 - f.distance / f.maxDistance);
                
                const flameGradient = ctx.createRadialGradient(fx, fy, 0, fx, fy, f.size);
                flameGradient.addColorStop(0, `rgba(255, 255, 200, ${flameAlpha})`);
                flameGradient.addColorStop(0.5, `rgba(255, 150, 0, ${flameAlpha * 0.8})`);
                flameGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
                
                ctx.fillStyle = flameGradient;
                ctx.beginPath();
                ctx.arc(fx, fy, f.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Onda de choque flamejante
        const waveRadius = this.radius * progress * 1.2;
        ctx.strokeStyle = `rgba(255, 150, 0, ${alpha * 0.8})`;
        ctx.lineWidth = 5;
        ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(this.x, this.y, waveRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.restore();
    }
}

// ============================================
// RAJADA TELECINÉTICA - 3 EXPLOSÕES EM SEQUÊNCIA
// ============================================
export class TelekineticBarrageEffect extends Effect {
    constructor(x, y, radius, damage, explosionCount, delay, stunDuration, slowFactor, slowDuration, owner, gameManager) {
        super('telekineticBarrage', x, y, explosionCount * delay + 1000);
        
        this.radius = radius;
        this.damage = damage;
        this.explosionCount = explosionCount;
        this.delay = delay;
        this.stunDuration = stunDuration;
        this.slowFactor = slowFactor;
        this.slowDuration = slowDuration;
        this.owner = owner;
        this.gameManager = gameManager;
        
        this.currentExplosion = 0;
        this.lastExplosionTime = Date.now();
        this.explosionsTriggered = [];
        
        // Partículas psíquicas
        this.particles = [];
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                angle: Math.random() * Math.PI * 2,
                distance: Math.random() * radius,
                speed: 0.02 + Math.random() * 0.03,
                size: 2 + Math.random() * 4,
                alpha: Math.random()
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Atualiza partículas
        this.particles.forEach(p => {
            p.angle += p.speed;
            p.distance += Math.sin(Date.now() / 200 + p.angle) * 0.5;
        });
        
        // Trigger explosões em sequência
        const now = Date.now();
        if (this.currentExplosion < this.explosionCount && 
            now - this.lastExplosionTime >= this.delay) {
            
            this.triggerExplosion();
            this.currentExplosion++;
            this.lastExplosionTime = now;
        }
    }

    triggerExplosion() {
        const isFirstExplosion = this.currentExplosion === 0;
        
        // Efeito visual
        this.gameManager.effects.push(new this.gameManager.PhoenixExplosionEffect(
            this.x,
            this.y,
            this.radius,
            800
        ));
        
        // Aplica dano e efeitos
        this.gameManager.enemies.forEach(enemy => {
            const dist = Math.hypot(
                this.x - enemy.getCenterX(),
                this.y - enemy.getCenterY()
            );
            
            if (dist < this.radius) {
                enemy.takeDamage(this.damage, this.owner);
                
                // Aplica 1 Faísca
                if (this.owner.addSpark) {
                    this.owner.addSpark(enemy, this.gameManager.enemies, this.gameManager.effects);
                }
                
                // Primeira explosão: STUN
                if (isFirstExplosion) {
                    enemy.applyStun(this.stunDuration);
                    this.gameManager.effects.push(new this.gameManager.StunEffect(
                        enemy.getCenterX(),
                        enemy.getCenterY(),
                        this.stunDuration
                    ));
                }
                // Segunda e terceira: SLOW
                else {
                    enemy.applySlow(this.slowFactor, this.slowDuration);
                    this.gameManager.effects.push(new this.gameManager.SlowEffect(
                        enemy.getCenterX(),
                        enemy.getCenterY(),
                        this.slowDuration
                    ));
                }
                
                const effectText = isFirstExplosion ? '⚡ STUN!' : '❄️ SLOW!';
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    enemy.getCenterX(),
                    enemy.getCenterY() - 25,
                    effectText,
                    isFirstExplosion ? 'yellow' : 'cyan',
                    1000
                ));
            }
        });
        
        this.explosionsTriggered.push(Date.now());
    }

    draw(ctx) {
        const progress = this.getProgress();
        const alpha = 0.6 - progress * 0.4;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Área marcada (círculo pulsante)
        const pulse = Math.sin(Date.now() / 100) * 5;
        const areaGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius + pulse);
        areaGradient.addColorStop(0, `rgba(255, 150, 0, ${alpha * 0.3})`);
        areaGradient.addColorStop(0.7, `rgba(255, 100, 0, ${alpha * 0.2})`);
        areaGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        
        ctx.fillStyle = areaGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Contorno
        ctx.strokeStyle = `rgba(255, 150, 0, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // Partículas psíquicas
        this.particles.forEach(p => {
            const px = Math.cos(p.angle) * p.distance;
            const py = Math.sin(p.angle) * p.distance;
            const particleAlpha = alpha * p.alpha;
            
            const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, p.size);
            particleGradient.addColorStop(0, `rgba(255, 200, 100, ${particleAlpha})`);
            particleGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
            
            ctx.fillStyle = particleGradient;
            ctx.beginPath();
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Contador de explosões
        if (this.currentExplosion < this.explosionCount) {
            ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 100, 0, 0.8)';
            ctx.shadowBlur = 10;
            ctx.fillText(`${this.currentExplosion + 1}/${this.explosionCount}`, 0, -this.radius - 20);
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }
}

// ===============================
// ⭐ NOVO: EXPLOSÃO DE RENASCIMENTO DA FÊNIX
// ===============================
export class PhoenixRebirthExplosionEffect extends Effect {
    constructor(x, y, radius, duration) {
        super('phoenixRebirthExplosion', x, y, duration);
        this.radius = radius;
        
        // ===== SISTEMA DE CHAMAS DA FÊNIX =====
        this.flames = [];
        for (let i = 0; i < 40; i++) {
            const angle = (Math.PI * 2 / 40) * i;
            this.flames.push({
                angle: angle,
                distance: 0,
                targetDistance: radius * 1.2,
                speed: 300 + Math.random() * 200,
                size: 15 + Math.random() * 20,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                lifetime: 0,
                maxLifetime: 0.7 + Math.random() * 0.3
            });
        }
        
        // ===== ONDAS DE FOGO =====
        this.fireWaves = [];
        for (let i = 0; i < 5; i++) {
            this.fireWaves.push({
                radius: 0,
                maxRadius: radius * (1.5 + i * 0.2),
                speed: 400 + i * 50,
                alpha: 1,
                delay: i * 100
            });
        }
        
        // ===== PARTÍCULAS DE CINZAS =====
        this.ashes = [];
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            this.ashes.push({
                x: 0,
                y: 0,
                vx: Math.cos(angle) * (50 + Math.random() * 150),
                vy: Math.sin(angle) * (50 + Math.random() * 150) - 100, // Bias para cima
                size: 2 + Math.random() * 4,
                life: 0,
                maxLife: 1 + Math.random() * 0.5,
                color: Math.random() > 0.5 ? 'orange' : 'red'
            });
        }
        
        // ===== ASAS DA FÊNIX =====
        this.wings = {
            left: [],
            right: []
        };
        
        // Cria pontos das asas
        for (let i = 0; i < 12; i++) {
            const t = i / 12;
            const wingAngle = Math.PI / 3; // 60 graus
            
            this.wings.left.push({
                angle: Math.PI + wingAngle * t,
                distance: radius * 0.8 * (1 - t * 0.5),
                size: 25 - t * 15,
                featherOffset: Math.random() * Math.PI * 2
            });
            
            this.wings.right.push({
                angle: -wingAngle * t,
                distance: radius * 0.8 * (1 - t * 0.5),
                size: 25 - t * 15,
                featherOffset: Math.random() * Math.PI * 2
            });
        }
        
        // ===== RAIOS DE ENERGIA CÓSMICA =====
        this.cosmicRays = [];
        for (let i = 0; i < 24; i++) {
            this.cosmicRays.push({
                angle: (Math.PI * 2 / 24) * i,
                length: 0,
                targetLength: radius * 1.5,
                width: 3 + Math.random() * 5
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        const dt = deltaTime / 1000;
        const progress = this.getProgress();
        
        // ===== ATUALIZA CHAMAS =====
        this.flames.forEach(flame => {
            if (flame.distance < flame.targetDistance) {
                flame.distance += flame.speed * dt;
            }
            flame.rotation += flame.rotationSpeed;
            flame.lifetime += dt;
        });
        
        // ===== ATUALIZA ONDAS DE FOGO =====
        const elapsed = Date.now() - this.startTime;
        this.fireWaves.forEach(wave => {
            if (elapsed >= wave.delay && wave.radius < wave.maxRadius) {
                wave.radius += wave.speed * dt;
                wave.alpha = 1 - (wave.radius / wave.maxRadius);
            }
        });
        
        // ===== ATUALIZA CINZAS =====
        this.ashes.forEach(ash => {
            ash.x += ash.vx * dt;
            ash.y += ash.vy * dt;
            ash.vy += 100 * dt; // Gravidade
            ash.life += dt;
        });
        
        // ===== ATUALIZA RAIOS CÓSMICOS =====
        this.cosmicRays.forEach(ray => {
            if (ray.length < ray.targetLength) {
                ray.length += (ray.targetLength / this.duration) * deltaTime;
            }
        });
    }

    draw(ctx) {
        const progress = this.getProgress();
        const alpha = 1 - progress;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // ===============================
        // FASE 1: FLASH INICIAL (0-0.1s)
        // ===============================
        if (progress < 0.1) {
            const flashAlpha = (1 - progress * 10) * 0.9;
            const flashSize = this.radius * 0.5 * (progress * 10);
            
            const flashGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, flashSize);
            flashGradient.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
            flashGradient.addColorStop(0.5, `rgba(255, 200, 0, ${flashAlpha * 0.8})`);
            flashGradient.addColorStop(1, `rgba(255, 100, 0, 0)`);
            
            ctx.fillStyle = flashGradient;
            ctx.shadowColor = 'rgba(255, 255, 255, 1)';
            ctx.shadowBlur = 40;
            ctx.beginPath();
            ctx.arc(0, 0, flashSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // ===============================
        // FASE 2: NÚCLEO DA FÊNIX
        // ===============================
        const coreSize = 30 + Math.sin(Date.now() / 80) * 10;
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        coreGradient.addColorStop(0.3, `rgba(255, 200, 0, ${alpha * 0.9})`);
        coreGradient.addColorStop(0.6, `rgba(255, 100, 0, ${alpha * 0.7})`);
        coreGradient.addColorStop(1, `rgba(200, 0, 0, ${alpha * 0.3})`);
        
        ctx.fillStyle = coreGradient;
        ctx.shadowColor = 'rgba(255, 150, 0, 1)';
        ctx.shadowBlur = 50;
        ctx.beginPath();
        ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // ===============================
        // FASE 3: ONDAS DE FOGO
        // ===============================
        this.fireWaves.forEach((wave, index) => {
            if (wave.radius > 0) {
                const waveAlpha = alpha * wave.alpha;
                
                // Onda preenchida
                const waveGradient = ctx.createRadialGradient(0, 0, wave.radius * 0.7, 0, 0, wave.radius);
                waveGradient.addColorStop(0, `rgba(255, 200, 0, 0)`);
                waveGradient.addColorStop(0.5, `rgba(255, 100, 0, ${waveAlpha * 0.4})`);
                waveGradient.addColorStop(1, `rgba(200, 0, 0, 0)`);
                
                ctx.fillStyle = waveGradient;
                ctx.beginPath();
                ctx.arc(0, 0, wave.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Contorno flamejante
                ctx.strokeStyle = `rgba(255, ${150 - index * 20}, 0, ${waveAlpha})`;
                ctx.lineWidth = 4;
                ctx.shadowColor = `rgba(255, 100, 0, ${waveAlpha})`;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(0, 0, wave.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        });
        
        // ===============================
        // FASE 4: ASAS DA FÊNIX
        // ===============================
        if (progress > 0.2 && progress < 0.8) {
            const wingAlpha = alpha * (1 - Math.abs(progress - 0.5) * 2);
            const wingFlap = Math.sin(Date.now() / 150) * 0.2;
            
            // Desenha asa esquerda
            this.wings.left.forEach((feather, i) => {
                const featherAlpha = wingAlpha * (1 - i / 12);
                const angle = feather.angle + wingFlap;
                const fx = Math.cos(angle) * feather.distance;
                const fy = Math.sin(angle) * feather.distance;
                
                const featherGradient = ctx.createRadialGradient(fx, fy, 0, fx, fy, feather.size);
                featherGradient.addColorStop(0, `rgba(255, 200, 0, ${featherAlpha})`);
                featherGradient.addColorStop(0.5, `rgba(255, 100, 0, ${featherAlpha * 0.7})`);
                featherGradient.addColorStop(1, `rgba(200, 0, 0, 0)`);
                
                ctx.fillStyle = featherGradient;
                ctx.beginPath();
                ctx.arc(fx, fy, feather.size, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Desenha asa direita
            this.wings.right.forEach((feather, i) => {
                const featherAlpha = wingAlpha * (1 - i / 12);
                const angle = feather.angle - wingFlap;
                const fx = Math.cos(angle) * feather.distance;
                const fy = Math.sin(angle) * feather.distance;
                
                const featherGradient = ctx.createRadialGradient(fx, fy, 0, fx, fy, feather.size);
                featherGradient.addColorStop(0, `rgba(255, 200, 0, ${featherAlpha})`);
                featherGradient.addColorStop(0.5, `rgba(255, 100, 0, ${featherAlpha * 0.7})`);
                featherGradient.addColorStop(1, `rgba(200, 0, 0, 0)`);
                
                ctx.fillStyle = featherGradient;
                ctx.beginPath();
                ctx.arc(fx, fy, feather.size, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        // ===============================
        // FASE 5: CHAMAS DA FÊNIX
        // ===============================
        this.flames.forEach(flame => {
            if (flame.lifetime < flame.maxLifetime) {
                const flameAlpha = alpha * (1 - flame.lifetime / flame.maxLifetime);
                const fx = Math.cos(flame.angle) * flame.distance;
                const fy = Math.sin(flame.angle) * flame.distance;
                
                ctx.save();
                ctx.translate(fx, fy);
                ctx.rotate(flame.rotation);
                
                // Chama (forma de lágrima)
                const flameGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, flame.size);
                flameGradient.addColorStop(0, `rgba(255, 255, 200, ${flameAlpha})`);
                flameGradient.addColorStop(0.4, `rgba(255, 150, 0, ${flameAlpha * 0.8})`);
                flameGradient.addColorStop(0.7, `rgba(255, 50, 0, ${flameAlpha * 0.5})`);
                flameGradient.addColorStop(1, `rgba(150, 0, 0, 0)`);
                
                ctx.fillStyle = flameGradient;
                ctx.beginPath();
                ctx.moveTo(0, -flame.size);
                ctx.bezierCurveTo(
                    flame.size * 0.5, -flame.size * 0.5,
                    flame.size * 0.5, flame.size * 0.5,
                    0, flame.size
                );
                ctx.bezierCurveTo(
                    -flame.size * 0.5, flame.size * 0.5,
                    -flame.size * 0.5, -flame.size * 0.5,
                    0, -flame.size
                );
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
            }
        });
        
        // ===============================
        // FASE 6: RAIOS CÓSMICOS
        // ===============================
        this.cosmicRays.forEach(ray => {
            if (ray.length > 0) {
                const rayAlpha = alpha * 0.7;
                const endX = Math.cos(ray.angle) * ray.length;
                const endY = Math.sin(ray.angle) * ray.length;
                
                ctx.strokeStyle = `rgba(255, 200, 0, ${rayAlpha})`;
                ctx.lineWidth = ray.width;
                ctx.shadowColor = 'rgba(255, 150, 0, 0.8)';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        });
        
        // ===============================
        // FASE 7: PARTÍCULAS DE CINZAS
        // ===============================
        this.ashes.forEach(ash => {
            if (ash.life < ash.maxLife) {
                const ashAlpha = alpha * (1 - ash.life / ash.maxLife);
                
                const ashGradient = ctx.createRadialGradient(ash.x, ash.y, 0, ash.x, ash.y, ash.size);
                if (ash.color === 'orange') {
                    ashGradient.addColorStop(0, `rgba(255, 150, 0, ${ashAlpha})`);
                    ashGradient.addColorStop(1, `rgba(255, 100, 0, 0)`);
                } else {
                    ashGradient.addColorStop(0, `rgba(255, 50, 0, ${ashAlpha})`);
                    ashGradient.addColorStop(1, `rgba(200, 0, 0, 0)`);
                }
                
                ctx.fillStyle = ashGradient;
                ctx.beginPath();
                ctx.arc(ash.x, ash.y, ash.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // ===============================
        // FASE 8: SÍMBOLO DA FÊNIX (CENTRO)
        // ===============================
        if (progress > 0.15 && progress < 0.7) {
            const symbolAlpha = alpha * Math.sin(progress * Math.PI);
            
            ctx.fillStyle = `rgba(255, 200, 0, ${symbolAlpha})`;
            ctx.font = 'bold 60px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(255, 150, 0, 1)';
            ctx.shadowBlur = 30;
            ctx.fillText('🔥', 0, 0);
            ctx.shadowBlur = 0;
        }
        
        // ===============================
        // FASE 9: TEXTO
        // ===============================
        if (progress < 0.3) {
            ctx.fillStyle = `rgba(255, 200, 0, ${alpha * (1 - progress * 3)})`;
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(255, 150, 0, 1)';
            ctx.shadowBlur = 20;
            ctx.fillText('⚡ RENASCIMENTO DA FÊNIX ⚡', 0, -this.radius - 30);
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
    }
}

// ===============================
// ⭐ ONDA PSÍQUICA (ROSA ELEGANTE)
// ===============================
export class PsychicWaveEffect extends Effect {
    constructor(x, y, radius, duration) {
        super('psychicWave', x, y, duration);
        this.radius = radius;
        this.waves = [];
        this.particles = [];
        
        // ===== ONDAS CONCÊNTRICAS ELEGANTES =====
        for (let i = 0; i < 4; i++) {
            this.waves.push({
                radius: 0,
                maxRadius: radius * (1 + i * 0.2),
                speed: 350 + i * 30,
                alpha: 1,
                delay: i * 80
            });
        }
        
        // ===== PARTÍCULAS PSÍQUICAS FLUTUANTES =====
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 / 30) * i;
            this.particles.push({
                angle: angle,
                distance: 0,
                targetDistance: radius * 0.9,
                speed: 200 + Math.random() * 100,
                size: 3 + Math.random() * 5,
                alpha: 0.8 + Math.random() * 0.2,
                rotation: Math.random() * Math.PI * 2
            });
        }
        
        // ===== SÍMBOLOS PSI ORBITANDO =====
        this.psiSymbols = ['Ψ', 'Ω', 'Φ', 'Δ'];
        this.symbolPositions = [];
        for (let i = 0; i < 4; i++) {
            this.symbolPositions.push({
                angle: (Math.PI * 2 / 4) * i,
                distance: 0,
                targetDistance: radius * 0.7,
                speed: 250
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        const dt = deltaTime / 1000;
        const elapsed = Date.now() - this.startTime;
        
        // ===== ATUALIZA ONDAS =====
        this.waves.forEach(wave => {
            if (elapsed >= wave.delay && wave.radius < wave.maxRadius) {
                wave.radius += wave.speed * dt;
                wave.alpha = 1 - (wave.radius / wave.maxRadius);
            }
        });
        
        // ===== ATUALIZA PARTÍCULAS =====
        this.particles.forEach(p => {
            if (p.distance < p.targetDistance) {
                p.distance += p.speed * dt;
            }
            p.rotation += 0.05;
        });
        
        // ===== ATUALIZA SÍMBOLOS =====
        this.symbolPositions.forEach(s => {
            if (s.distance < s.targetDistance) {
                s.distance += s.speed * dt;
            }
        });
    }

    draw(ctx) {
        const progress = this.getProgress();
        const alpha = 1 - progress;
        const time = Date.now() / 1000;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // ===============================
        // NÚCLEO PSÍQUICO CENTRAL
        // ===============================
        const coreSize = 20 + Math.sin(time * 5) * 5;
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
        coreGradient.addColorStop(0.4, `rgba(255, 150, 200, ${alpha * 0.7})`);
        coreGradient.addColorStop(1, `rgba(255, 105, 180, 0)`);
        
        ctx.fillStyle = coreGradient;
        ctx.shadowColor = 'rgba(255, 105, 180, 0.8)';
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // ===============================
        // ONDAS ELEGANTES ROSA
        // ===============================
        this.waves.forEach((wave, index) => {
            if (wave.radius > 0) {
                const waveAlpha = alpha * wave.alpha;
                
                // Onda preenchida com gradiente suave
                const waveGradient = ctx.createRadialGradient(
                    0, 0, wave.radius * 0.8,
                    0, 0, wave.radius
                );
                waveGradient.addColorStop(0, `rgba(255, 192, 203, 0)`);
                waveGradient.addColorStop(0.5, `rgba(255, 150, 200, ${waveAlpha * 0.3})`);
                waveGradient.addColorStop(1, `rgba(255, 105, 180, 0)`);
                
                ctx.fillStyle = waveGradient;
                ctx.beginPath();
                ctx.arc(0, 0, wave.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Contorno brilhante
                ctx.strokeStyle = `rgba(255, 182, 193, ${waveAlpha * 0.8})`;
                ctx.lineWidth = 3 - index * 0.5;
                ctx.shadowColor = 'rgba(255, 105, 180, 0.6)';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(0, 0, wave.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        });
        
        // ===============================
        // PARTÍCULAS PSÍQUICAS FLUTUANTES
        // ===============================
        this.particles.forEach(p => {
            if (p.distance > 0) {
                const px = Math.cos(p.angle + time) * p.distance;
                const py = Math.sin(p.angle + time) * p.distance;
                const particleAlpha = alpha * p.alpha * (1 - p.distance / p.targetDistance);
                
                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(p.rotation);
                
                // Partícula com glow
                const particleGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
                particleGradient.addColorStop(0, `rgba(255, 200, 220, ${particleAlpha})`);
                particleGradient.addColorStop(0.6, `rgba(255, 150, 200, ${particleAlpha * 0.6})`);
                particleGradient.addColorStop(1, 'rgba(255, 105, 180, 0)');
                
                ctx.fillStyle = particleGradient;
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        });
        
        // ===============================
        // SÍMBOLOS PSI ORBITANDO
        // ===============================
        this.symbolPositions.forEach((pos, index) => {
            if (pos.distance > 0) {
                const sx = Math.cos(pos.angle + time * 0.5) * pos.distance;
                const sy = Math.sin(pos.angle + time * 0.5) * pos.distance;
                const floatY = Math.sin(time * 3 + index) * 5;
                const symbolAlpha = alpha * (1 - pos.distance / pos.targetDistance);
                
                ctx.save();
                ctx.translate(sx, sy + floatY);
                ctx.rotate(time * 2);
                
                ctx.fillStyle = `rgba(255, 150, 200, ${symbolAlpha})`;
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(255, 105, 180, 0.8)';
                ctx.shadowBlur = 15;
                ctx.fillText(this.psiSymbols[index], 0, 0);
                ctx.shadowBlur = 0;
                
                ctx.restore();
            }
        });
        
        // ===============================
        // LINHAS DE ENERGIA CONECTANDO
        // ===============================
        ctx.strokeStyle = `rgba(255, 192, 203, ${alpha * 0.3})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 12; i++) {
            const lineAngle = (Math.PI * 2 / 12) * i + time;
            const innerR = 15;
            const outerR = this.radius * 0.8;
            
            ctx.beginPath();
            ctx.moveTo(Math.cos(lineAngle) * innerR, Math.sin(lineAngle) * innerR);
            ctx.lineTo(Math.cos(lineAngle) * outerR, Math.sin(lineAngle) * outerR);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// ===============================
// ⭐ VÓRTICE DE IMPACTO (AZUL BRUTAL)
// ===============================
export class VortexImpactEffect extends Effect {
    constructor(sourceX, sourceY, targetX, targetY, duration) {
        super('vortexImpact', sourceX, sourceY, duration);
        this.targetX = targetX;
        this.targetY = targetY;
        this.spirals = [];
        this.lightningBolts = [];
        this.shockwaves = [];
        
        // ===== ESPIRAIS DE SUCÇÃO =====
        for (let i = 0; i < 3; i++) {
            this.spirals.push({
                turns: 4,
                startRadius: 100,
                endRadius: 0,
                progress: 0,
                speed: 2 + i * 0.3,
                offset: i * (Math.PI * 2 / 3)
            });
        }
        
        // ===== RAIOS DE ENERGIA =====
        for (let i = 0; i < 8; i++) {
            this.lightningBolts.push({
                angle: (Math.PI * 2 / 8) * i,
                segments: 6,
                jagged: true
            });
        }
        
        // ===== ONDAS DE CHOQUE NO IMPACTO =====
        for (let i = 0; i < 3; i++) {
            this.shockwaves.push({
                radius: 0,
                maxRadius: 150,
                speed: 400,
                delay: 500 + i * 100 // Só aparecem após 0.5s (no impacto)
            });
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        const dt = deltaTime / 1000;
        const elapsed = Date.now() - this.startTime;
        
        // ===== ATUALIZA ESPIRAIS =====
        this.spirals.forEach(spiral => {
            spiral.progress += spiral.speed * dt;
            if (spiral.progress > 1) spiral.progress = 1;
        });
        
        // ===== ATUALIZA ONDAS DE CHOQUE =====
        this.shockwaves.forEach(wave => {
            if (elapsed >= wave.delay && wave.radius < wave.maxRadius) {
                wave.radius += wave.speed * dt;
            }
        });
    }

    draw(ctx) {
        const progress = this.getProgress();
        const alpha = 1 - progress;
        const time = Date.now() / 1000;
        
        // ===============================
        // FASE 1: SUCÇÃO (0-0.5s) - NA ORIGEM
        // ===============================
        if (progress < 0.5) {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            const pullProgress = progress * 2; // 0 a 1 nos primeiros 0.5s
            
            // Vórtice central
            const vortexSize = 40 * (1 - pullProgress);
            const vortexGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, vortexSize);
            vortexGradient.addColorStop(0, `rgba(0, 150, 255, ${alpha * 0.9})`);
            vortexGradient.addColorStop(0.5, `rgba(0, 100, 200, ${alpha * 0.6})`);
            vortexGradient.addColorStop(1, `rgba(0, 50, 150, 0)`);
            
            ctx.fillStyle = vortexGradient;
            ctx.shadowColor = 'rgba(0, 150, 255, 0.8)';
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(0, 0, vortexSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Espirais de sucção
            this.spirals.forEach((spiral, index) => {
                ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * (1 - spiral.progress)})`;
                ctx.lineWidth = 4;
                ctx.shadowColor = 'rgba(0, 150, 255, 0.6)';
                ctx.shadowBlur = 15;
                
                ctx.beginPath();
                for (let t = 0; t <= spiral.progress; t += 0.02) {
                    const angle = spiral.offset + t * Math.PI * 2 * spiral.turns;
                    const radius = spiral.startRadius * (1 - t);
                    const px = Math.cos(angle) * radius;
                    const py = Math.sin(angle) * radius;
                    
                    if (t === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            });
            
            // Partículas sendo sugadas
            for (let i = 0; i < 20; i++) {
                const particleAngle = (Math.PI * 2 / 20) * i + time * 3;
                const particleDist = 80 * (1 - pullProgress) + Math.sin(time * 5 + i) * 10;
                const px = Math.cos(particleAngle) * particleDist;
                const py = Math.sin(particleAngle) * particleDist;
                
                ctx.fillStyle = `rgba(150, 220, 255, ${alpha * (1 - pullProgress)})`;
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        // ===============================
        // FASE 2: TRAJETÓRIA (0.5-0.7s) - LINHA DE ENERGIA
        // ===============================
        if (progress >= 0.5 && progress < 0.7) {
            const trajectProgress = (progress - 0.5) / 0.2; // 0 a 1 nessa fase
            
            ctx.save();
            
            // Linha de energia conectando origem ao alvo
            ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`;
            ctx.lineWidth = 8;
            ctx.shadowColor = 'rgba(0, 150, 255, 1)';
            ctx.shadowBlur = 25;
            
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            
            // Linha com zigzag
            const segments = 10;
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const midX = this.x + (this.targetX - this.x) * t * trajectProgress;
                const midY = this.y + (this.targetY - this.y) * t * trajectProgress;
                const offset = Math.sin(t * Math.PI * 4 + time * 10) * 8;
                
                const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
                const perpX = midX + Math.cos(angle + Math.PI / 2) * offset;
                const perpY = midY + Math.sin(angle + Math.PI / 2) * offset;
                
                ctx.lineTo(perpX, perpY);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            ctx.restore();
        }
        
        // ===============================
        // FASE 3: IMPACTO (0.7-1s) - NO ALVO
        // ===============================
        if (progress >= 0.7) {
            ctx.save();
            ctx.translate(this.targetX, this.targetY);
            
            const impactProgress = (progress - 0.7) / 0.3;
            
            // Explosão central
            const explosionSize = 50 * impactProgress;
            const explosionGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, explosionSize);
            explosionGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * (1 - impactProgress)})`);
            explosionGradient.addColorStop(0.4, `rgba(100, 200, 255, ${alpha * 0.7})`);
            explosionGradient.addColorStop(1, `rgba(0, 100, 200, 0)`);
            
            ctx.fillStyle = explosionGradient;
            ctx.shadowColor = 'rgba(0, 200, 255, 1)';
            ctx.shadowBlur = 40;
            ctx.beginPath();
            ctx.arc(0, 0, explosionSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Raios de impacto
            this.lightningBolts.forEach(bolt => {
                const boltLength = 80 * impactProgress;
                
                ctx.strokeStyle = `rgba(150, 220, 255, ${alpha})`;
                ctx.lineWidth = 4;
                ctx.shadowColor = 'rgba(0, 150, 255, 0.8)';
                ctx.shadowBlur = 20;
                
                ctx.beginPath();
                ctx.moveTo(0, 0);
                
                // Raio com segmentos irregulares
                for (let i = 1; i <= bolt.segments; i++) {
                    const t = i / bolt.segments;
                    const baseX = Math.cos(bolt.angle) * boltLength * t;
                    const baseY = Math.sin(bolt.angle) * boltLength * t;
                    const jaggedness = (Math.random() - 0.5) * 15;
                    
                    ctx.lineTo(
                        baseX + Math.cos(bolt.angle + Math.PI / 2) * jaggedness,
                        baseY + Math.sin(bolt.angle + Math.PI / 2) * jaggedness
                    );
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            });
            
            // Ondas de choque
            this.shockwaves.forEach(wave => {
                if (wave.radius > 0) {
                    const waveAlpha = alpha * (1 - wave.radius / wave.maxRadius);
                    
                    ctx.strokeStyle = `rgba(0, 150, 255, ${waveAlpha})`;
                    ctx.lineWidth = 6;
                    ctx.shadowColor = 'rgba(0, 200, 255, 0.6)';
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(0, 0, wave.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            });
            
            ctx.restore();
        }
    }
}

// 🎯 LASER DE MARCAÇÃO ORBITAL
export class TargetLaserEffect extends Effect {
    constructor(x, y, duration, color) {
        super(x, y, duration);
        this.color = color;
        this.pulsePhase = 0;
        this.rings = [];
        
        // Cria anéis concêntricos
        for (let i = 0; i < 5; i++) {
            this.rings.push({
                radius: 20 + i * 25,
                speed: 0.02 + i * 0.01,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        this.pulsePhase += 0.05;
        
        this.rings.forEach(ring => {
            ring.phase += ring.speed;
        });
        
        return this.lifetime > 0;
    }
    
    draw(ctx) {
        const alpha = Math.min(1, this.lifetime / 500);
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Cruz de mira central
        ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = 'cyan';
        ctx.shadowBlur = 15;
        
        const crossSize = 30;
        ctx.beginPath();
        ctx.moveTo(-crossSize, 0);
        ctx.lineTo(crossSize, 0);
        ctx.moveTo(0, -crossSize);
        ctx.lineTo(0, crossSize);
        ctx.stroke();
        
        // Anéis rotativos
        this.rings.forEach((ring, i) => {
            const ringAlpha = alpha * (1 - i * 0.15);
            ctx.strokeStyle = `rgba(100, 200, 255, ${ringAlpha})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.lineDashOffset = -ring.phase * 50;
            
            ctx.beginPath();
            ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;
        
        // Texto de alerta
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎯 ALVO MARCADO', 0, -60);
        
        ctx.restore();
    }
}

// 🚀 MÍSSIL ORBITAL (VISUAL)
export class OrbitalMissileEffect extends Effect {
    constructor(startX, startY, targetX, targetY, duration) {
        super(targetX, targetY, duration);
        this.startX = startX;
        this.startY = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.progress = 0;
        this.trailParticles = [];
    }
    
    update(deltaTime) {

        const dt = isFinite(deltaTime) ? deltaTime / 1000 : 0.016; // Fallback para ~60fps
    
        this.trailParticles = this.trailParticles.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= 0.03; // Redução fixa de vida
            return p.life > 0;
        });

        this.lifetime -= deltaTime;
        this.progress = 1 - (this.lifetime / this.duration);
        
        // Adiciona partículas de trail
        const currentX = this.startX + (this.targetX - this.startX) * this.progress;
        const currentY = this.startY + (this.targetY - this.startY) * this.progress;
        
        this.trailParticles.push({
            x: currentX + (Math.random() - 0.5) * 15,
            y: currentY + (Math.random() - 0.5) * 15,
            life: 1,
            size: 4 + Math.random() * 4,
            vx: (Math.random() - 0.5) * 30,
            vy: Math.random() * 50
        });
        
        // Atualiza partículas
        this.trailParticles = this.trailParticles.filter(p => {
            p.x += p.vx * (deltaTime / 1000);
            p.y += p.vy * (deltaTime / 1000);
            p.life -= 0.03;
            return p.life > 0;
        });
        
        return this.lifetime > 0;
    }
    
    draw(ctx) {
        const currentX = this.startX + (this.targetX - this.startX) * this.progress;
        const currentY = this.startY + (this.targetY - this.startY) * this.progress;
        
        ctx.save();
        
        this.trailParticles.forEach(p => {
        // CORREÇÃO: Validar se as coordenadas e tamanho são números válidos antes de criar o gradiente
        if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.size) || p.size <= 0) {
            return; // Pula esta partícula se os dados estiverem corrompidos
        }

        try {
            const particleGradient = ctx.createRadialGradient(
                p.x, p.y, 0, 
                p.x, p.y, p.size
            );
            
            // Garante que o alpha (p.life) também seja válido
            const alpha = isFinite(p.life) ? Math.max(0, p.life) : 0;
            
            particleGradient.addColorStop(0, `rgba(255, 150, 0, ${alpha})`);
            particleGradient.addColorStop(1, `rgba(255, 100, 0, 0)`);
            
            ctx.fillStyle = particleGradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        } catch (e) {
            // Silencia erros de gradiente para evitar crash do game loop
        }
    });
        
        // Míssil (corpo branco brilhante)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowColor = 'orange';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(currentX, currentY, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Núcleo interno
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}