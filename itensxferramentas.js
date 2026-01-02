// ========================================
// SISTEMA DE ITENS E FERRAMENTAS
// ========================================

class CollectorSystem {
    constructor(gameManager) {
        this.gameManager = gameManager;
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
        
        const overlay = document.getElementById('collectorChestOverlay');
        const canvas = document.getElementById('chestCanvas');
        const ctx = canvas.getContext('2d');
        const rewardDiv = document.getElementById('chestReward');
        
        overlay.style.display = 'flex';
        rewardDiv.style.display = 'none';
        
        // Animação do baú
        this.animateChestOpening(ctx, canvas, () => {
            // Após animação, gera recompensa
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
    
    // ✅ Adiciona ao inventário
    if (reward.type === 'item') {
        this.inventory.items.push(reward);
        this.applyItemEffect(reward);
    } else {
        this.inventory.tools.push(reward);
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
    
    this.saveInventory();
    
    const typeText = reward.type === 'item' ? 'Item' : 'Ferramenta';
    this.gameManager.showUI(`🎁 Novo ${typeText}: ${reward.name}!`, 'special');
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
            
            <!-- TABS -->
            <div style="display: flex; gap: 20px; margin-bottom: 30px;">
                <button class="inventory-tab active" data-tab="tools" style="
                    flex: 1;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.2);
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 10px;
                    color: white;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                ">⚙️ FERRAMENTAS</button>
                <button class="inventory-tab" data-tab="items" style="
                    flex: 1;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 2px solid transparent;
                    border-radius: 10px;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                ">📦 ITENS</button>
            </div>
            
            <!-- SEÇÃO DE FERRAMENTAS -->
            <div id="toolsSection" class="inventory-section" style="display: block;">
                <div style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 15px;
                    border-radius: 10px;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    margin-bottom: 20px;
                ">
                    <p style="
                        color: rgba(255, 255, 255, 0.9);
                        margin: 0;
                        font-size: 14px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    ">
                        <span style="font-size: 20px;">💡</span>
                        <span>Arraste uma ferramenta até um Champion no campo para equipá-la. Apenas uma ferramenta por Champion!</span>
                    </p>
                </div>
                
                <!-- ✅ FERRAMENTAS EQUIPADAS -->
                <div id="equippedToolsContainer" style="margin-bottom: 30px;">
                    <h3 style="
                        color: #4CAF50;
                        font-size: 20px;
                        margin-bottom: 15px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    ">
                        <span>✅</span>
                        <span>EQUIPADAS</span>
                    </h3>
                    <div id="equippedToolsGrid" style="
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                        gap: 15px;
                        margin-bottom: 20px;
                    "></div>
                </div>
                
                <!-- ✅ FERRAMENTAS DISPONÍVEIS -->
                <div id="availableToolsContainer">
                    <h3 style="
                        color: rgba(255, 255, 255, 0.7);
                        font-size: 20px;
                        margin-bottom: 15px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    ">
                        <span>📦</span>
                        <span>DISPONÍVEIS</span>
                    </h3>
                    <div id="availableToolsGrid" style="
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                        gap: 15px;
                    "></div>
                </div>
            </div>
            
            <!-- SEÇÃO DE ITENS -->
            <div id="itemsSection" class="inventory-section" style="display: none;">
                <div style="
                    background: rgba(255, 255, 255, 0.05);
                    padding: 15px;
                    border-radius: 10px;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    margin-bottom: 20px;
                ">
                    <p style="
                        color: rgba(255, 255, 255, 0.9);
                        margin: 0;
                        font-size: 14px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    ">
                        <span style="font-size: 20px;">📊</span>
                        <span>Itens aplicam buffs globais permanentes automaticamente em todos os Champions!</span>
                    </p>
                </div>
                
                <div id="itemsGrid" style="
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 15px;
                "></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // ✅ Botão fechar
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
    
    // ✅ Tabs
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
    
    // ✅ Fechar clicando fora
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'inventoryModal') {
            this.closeInventory();
        }
    });
    
    // ✅ Fechar com ESC
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
    
    // ✅ PAUSA O JOGO
    this.gameManager.isPaused = true;
    
    const modal = document.getElementById('inventoryModal');
    modal.style.display = 'flex';
    
    this.populateInventory();
}

closeInventory() {
    console.log('🎒 Fechando inventário...');
    
    const modal = document.getElementById('inventoryModal');
    modal.style.display = 'none';
    
    // ✅ DESPAUSA O JOGO
    this.gameManager.isPaused = false;
}

switchInventoryTab(tabName) {
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
document.querySelectorAll('.inventory-section').forEach(section => {
    section.style.display = 'none';
});

if (tabName === 'tools') {
    document.getElementById('toolsSection').style.display = 'block';
} else {
    document.getElementById('itemsSection').style.display = 'block';
}
}

populateInventory() {
this.populateTools();
this.populateItems();
}
// ========================================
// POPULAR FERRAMENTAS: EQUIPADAS VS DISPONÍVEIS
// ========================================

populateTools() {
    const equippedGrid = document.getElementById('equippedToolsGrid');
    const availableGrid = document.getElementById('availableToolsGrid');
    
    equippedGrid.innerHTML = '';
    availableGrid.innerHTML = '';
    
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
        return;
    }
    
    // ✅ Separa ferramentas equipadas e disponíveis
    const equipped = [];
    const available = [];
    
    this.inventory.tools.forEach((tool, index) => {
        const isEquipped = this.gameManager.champions.some(c => c.attachedTool === tool);
        
        if (isEquipped) {
            equipped.push({ tool, index });
        } else {
            available.push({ tool, index });
        }
    });
    
    // ✅ Mostra equipadas primeiro
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
        equipped.forEach(({ tool, index }) => {
            const champion = this.gameManager.champions.find(c => c.attachedTool === tool);
            const card = this.createToolCard(tool, index, true, champion);
            equippedGrid.appendChild(card);
        });
    }
    
    // ✅ Depois mostra disponíveis
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
        available.forEach(({ tool, index }) => {
            const card = this.createToolCard(tool, index, false);
            availableGrid.appendChild(card);
        });
    }
}
// ========================================
// CORREÇÃO: NÃO FECHAR MODAL DURANTE DRAG
// ========================================

createToolCard(tool, index, isEquipped = false, champion = null) {
    const card = document.createElement('div');
    const color = this.rarityColors[tool.rarity];
    
    card.className = 'tool-card';
    
    if (!isEquipped) {
        card.draggable = true;
        card.dataset.toolIndex = index;
       // console.log(`🏷️ Card criado: ${tool.name}, index: ${index}`);
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
                    ">↗️ Arraste para o campo</span>
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
            console.log(`🚀 DRAGSTART: ${tool.name}, index: ${index}`);
            
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', String(index));
            e.dataTransfer.setData('toolIndex', String(index));
            
            window.__draggedToolIndex = index;
            window.__draggedTool = tool;
            
            card.style.opacity = '0.3';
            card.style.cursor = 'grabbing';
            
            // ✅ NÃO FECHA O MODAL - só minimiza
            const modal = document.getElementById('inventoryModal');
            if (modal) {
                modal.style.opacity = '0.3';
                modal.style.pointerEvents = 'none'; // Permite drop no canvas
            }
            
            console.log('✅ DataTransfer configurado, modal minimizado');
        });
        
        card.addEventListener('dragend', (e) => {
            console.log('🏁 DRAGEND');
            card.style.opacity = '1';
            card.style.cursor = 'grab';
            
            // ✅ Restaura modal
            const modal = document.getElementById('inventoryModal');
            if (modal) {
                modal.style.opacity = '1';
                modal.style.pointerEvents = 'auto';
            }
            
            // Limpa após um delay (espera o drop processar)
            setTimeout(() => {
                delete window.__draggedToolIndex;
                delete window.__draggedTool;
            }, 100);
        });
    }
    
    return card;
}
populateItems() {
const grid = document.getElementById('itemsGrid');
grid.innerHTML = '';
if (this.inventory.items.length === 0) {
    grid.innerHTML = '<p style="color: rgba(255, 255, 255, 0.5); grid-column: 1 / -1; text-align: center; padding: 40px;">Nenhum item ainda. Complete fases para obter!</p>';
    return;
}

this.inventory.items.forEach(item => {
    const card = this.createItemCard(item);
    grid.appendChild(card);
});
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
        // Decide se é item ou ferramenta (50/50)
        //const type = Math.random() < 0.5 ? 'item' : 'tool';
        
        // Para testes será 100% ferramentas
        const type = 'tool';

        // Decide raridade
        const rarity = this.rollRarity();
        
        // Lista de possíveis recompensas (você vai expandir isso)
        const possibleRewards = this.getPossibleRewards(type, rarity);
        
        // Escolhe aleatoriamente
        const reward = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
        
        return { ...reward, type, rarity };
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
    
    getItems(rarity) {
        const items = {
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
                }
            ],
            rare: [
                {
                    name: 'Stormbreaker Fragmento',
                    icon: '⚡',
                    description: 'Um pedaço do machado de Thor',
                    effect: '+2% de dano contra bosses',
                    stat: 'bossDamage',
                    value: 0.02
                },
                {
                    name: 'Soro Experimental',
                    icon: '💉',
                    description: 'Versão diluída do soro do super-soldado',
                    effect: '+5% de HP em todas as torres',
                    stat: 'globalHP',
                    value: 0.05
                }
            ],
            epic: [
                {
                    name: 'Stormbreaker',
                    icon: '🔨',
                    description: 'O machado forjado em Nidavellir',
                    effect: '+5% de dano contra bosses e +3% de velocidade de ataque',
                    stat: ['bossDamage', 'attackSpeed'],
                    value: [0.05, 0.03]
                },
                {
                    name: 'Armadura de Wakanda',
                    icon: '🛡️',
                    description: 'Vibranium puro de Wakanda',
                    effect: '+10% de HP e +5% de resistência',
                    stat: ['globalHP', 'resistance'],
                    value: [0.10, 0.05]
                }
            ],
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
                    name: 'Gema do Infinito (Réplica)',
                    icon: '💎',
                    description: 'Uma réplica perfeita de uma Joia do Infinito',
                    effect: '+15% de dano, +10% de velocidade, +5% de alcance',
                    stat: ['globalDamage', 'attackSpeed', 'range'],
                    value: [0.15, 0.10, 0.05]
                }
            ]
        };
        
        return items[rarity] || items.basic;
    }
    
// ========================================
// LISTA COMPLETA DE FERRAMENTAS
// ========================================

getTools(rarity) {
    const tools = {
        // ========================================
        // BÁSICO
        // ========================================
        basic: [
            {
                name: 'Flecha do Yondu',
                icon: '🎯',
                description: 'A icônica flecha controlada por assobio',
                effect: 'Orbita o Champion causando dano por segundo',
                mechanic: 'orbit',
                damage: 25,
                dps: 40, // Dano por segundo
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
            }
        ],
        
        // ========================================
        // RARO
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
                bounceDamage: 0.75, // 75% do dano original
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
            }
        ],
        
        // ========================================
        // ÉPICO
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
                dashDamage: 40, // Dano aos inimigos no caminho
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
                name: 'Prisma Místico',
                icon: '🔮',
                description: 'Cristal dimensional de Agamotto',
                effect: 'Amplifica efeitos elementais em 20%',
                mechanic: 'stat',
                stat: 'elementalPower',
                value: 0.20,
                aura: true,
                particleEffect: true,
                color: '#FF1493'
            },
            {
                name: 'Viúva Escarlate',
                icon: '🕷️',
                description: 'Protocolo de sobrevivência de Natasha',
                effect: 'Ao morrer, revive com 30% da vida',
                mechanic: 'revive',
                reviveHP: 0.30,
                reviveCooldown: 0, // Uma vez por fase
                usedThisPhase: false,
                color: '#DC143C'
            }
        ],
        
        // ========================================
        // LENDÁRIO
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
                orbitalCount: 4, // 4 lasers orbitando
                orbitalDamage: 80,
                orbitalRadius: 150,
                orbitalSpeed: 2,
                color: '#FF0000'
            },
            {
                name: 'Manopla do Infinito',
                icon: '💎',
                description: 'A arma definitiva de Thanos',
                effect: 'Causa explosão devastadora após 50 kills',
                mechanic: 'ultimateKill',
                killsRequired: 50,
                explosionDamage: 500,
                explosionRadius: 250,
                currentKills: 0,
                color: '#FFD700'
            },
            {
                name: 'Armadura Godbuster',
                icon: '⚡',
                description: 'A maior criação de Tony Stark',
                effect: 'Reduz todo dano recebido em 25% por 10s após usar ultimate',
                mechanic: 'onUltimate',
                damageReduction: 0.25,
                buffDuration: 10000,
                color: '#4169E1'
            },
            {
                name: 'Martelo Mjolnir',
                icon: '🔨',
                description: 'O martelo digno de Thor',
                effect: 'Cada ataque tem chance de invocar um raio',
                mechanic: 'lightning',
                lightningChance: 0.15, // 15%
                lightningDamage: 150,
                lightningStunDuration: 1500,
                lightningChainCount: 3,
                color: '#00BFFF'
            },
            {
                name: 'Coração de Arishem',
                icon: '🌟',
                description: 'Fragmento do poder de um Celestial',
                effect: 'Dobra o efeito das habilidades de energia',
                mechanic: 'stat',
                stat: 'energyPower',
                value: 1.0, // +100%
                aura: true,
                celestialEffect: true,
                color: '#FF69B4'
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
    
    // ========================================
    // SISTEMA DE LEVEL UP
    // ========================================


    
    onPhaseComplete(phase) {
        console.log(`🎉 Fase ${phase} completa! Abrindo baú...`);
        
        // Pausa o jogo e abre baú
        this.gameManager.isPaused = true;
        setTimeout(() => {
            this.openChest('phase');
        }, 1000);
    }
    
attachToolToChampion(tool, champion) {
    console.log(`🔧 attachToolToChampion chamado:`, {
        tool: tool.name,
        champion: champion.type,
        hasToolAlready: !!champion.attachedTool
    });
    
    // ✅ Verifica se champion já tem ferramenta
    if (champion.attachedTool) {
        this.gameManager.showUI(`⚠️ ${champion.type} já possui ${champion.attachedTool.name} equipada!`, 'warning');
        
        // Mostra efeito visual de erro
        this.gameManager.effects.push(new this.gameManager.TextPopEffect(
            champion.getCenterX(),
            champion.getCenterY() - 50,
            '❌ JÁ EQUIPADO',
            'red',
            1500
        ));
        
        // Reabre inventário
        setTimeout(() => {
            this.openInventory();
        }, 800);
        
        return false;
    }
    
    // ✅ Equipa ferramenta
    champion.attachedTool = tool;
    
    // ✅ Inicializa dados específicos da ferramenta
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
            this.updateStatTool(champion, tool, 0); // Aplica imediatamente
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
    }
    
    // ✅ Efeitos visuais épicos
    this.gameManager.effects.push(new this.gameManager.LevelUpEffect(
        champion.getCenterX(),
        champion.getCenterY(),
        1500
    ));
    
    // Partículas coloridas
    const color = this.rarityColors[tool.rarity];
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
    
    // Texto de sucesso
    this.gameManager.effects.push(new this.gameManager.TextPopEffect(
        champion.getCenterX(),
        champion.getCenterY() - 60,
        `✨ ${tool.name}`,
        color,
        2000
    ));
    
    this.gameManager.showUI(`⚙️ ${tool.name} equipado em ${champion.type}!`, 'success');
    console.log(`✅ Ferramenta ${tool.name} equipada com sucesso em ${champion.type}`);
    
    return true;
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
        // Rotaciona
        champion.toolOrbitAngle += tool.speed * (deltaTime / 1000);
        
        const orbitX = champion.getCenterX() + Math.cos(champion.toolOrbitAngle) * tool.radius;
        const orbitY = champion.getCenterY() + Math.sin(champion.toolOrbitAngle) * tool.radius;
        
        // Checa colisão com inimigos
        this.gameManager.enemies.forEach(enemy => {
            const dist = Math.hypot(orbitX - enemy.getCenterX(), orbitY - enemy.getCenterY());
            
            if (dist < 20 + enemy.radius) {
                enemy.takeDamage(tool.damage, champion);
                // Efeito visual
                this.gameManager.effects.push(new this.gameManager.TextPopEffect(
                    enemy.getCenterX(),
                    enemy.getCenterY() - 20,
                    tool.damage.toFixed(0),
                    'orange',
                    500
                ));
            }
        });
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
        const orbitX = champion.getCenterX() + Math.cos(champion.toolOrbitAngle) * tool.radius;
        const orbitY = champion.getCenterY() + Math.sin(champion.toolOrbitAngle) * tool.radius;
        
        // Rastro (se tiver)
        if (tool.trail) {
            const trailLength = 30;
            for (let i = 0; i < trailLength; i++) {
                const trailAngle = champion.toolOrbitAngle - (i * 0.1);
                const tx = champion.getCenterX() + Math.cos(trailAngle) * tool.radius;
                const ty = champion.getCenterY() + Math.sin(trailAngle) * tool.radius;
                const alpha = (trailLength - i) / trailLength;
                
                ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.3})`;
                ctx.beginPath();
                ctx.arc(tx, ty, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Projétil orbitando
        ctx.save();
        ctx.translate(orbitX, orbitY);
        ctx.rotate(champion.toolOrbitAngle + Math.PI / 2);
        
        // Flecha
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(5,10);
        ctx.lineTo(-5, 10);
        ctx.closePath();
        ctx.fill();
        // Brilho
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
        gradient.addColorStop(0, 'rgba(255, 200, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
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
// SALVAR/CARREGAR
// ========================================
saveInventory() {
    localStorage.setItem('collectorInventory', JSON.stringify(this.inventory));
}

loadInventory() {
    const saved = localStorage.getItem('collectorInventory');
    if (saved) {
        this.inventory = JSON.parse(saved);
        
        // Reaplica efeitos de itens
        this.inventory.items.forEach(item => {
            this.applyItemEffect(item);
        });
    }
}
}