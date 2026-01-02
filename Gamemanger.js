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