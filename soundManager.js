// soundManager.js
export  class SoundManager {
    constructor() {
        this.sounds = {};
        this.volume = 0.5;
        this.enabled = true;
        this.loadSounds();
    }

    /**
     * 🎵 Carrega todos os sons das habilidades
     */
    loadSounds() {

        // 🎵 MENU PRINCIPAL
        this.sounds.menu = {
            heroSelect: this.createSound('./sounds/menu/hero_select.mp3'), // abertura da info do hero
            mainTheme: this.createSound('./sounds/menu/main_theme.mp3'), // NOVO: Música do menu principal
            heroHover: this.createSound('./sounds/menu/hero_hover.mp3'),  // NOVO: Som ao passar mouse ?
            hallOpen: this.createSound('./sounds/menu/hall_open.mp3')
        };

        // 🎭 SONS INDIVIDUAIS DO HALL OF HEROES (tema/entrada de cada herói)
        this.sounds.heroThemes = {
            captainamerica: this.createSound('./sounds/heroes/captainamerica_theme.mp3'),
            thor: this.createSound('./sounds/heroes/thor_theme.mp3'),
            ironman: this.createSound('./sounds/heroes/ironman_theme.mp3'),
            hawkeye: this.createSound('./sounds/heroes/hawkeye_theme.mp3'),
            loki: this.createSound('./sounds/heroes/loki_theme.mp3'),
            ultron: this.createSound('./sounds/heroes/ultron_theme.mp3'),
            emmafrost: this.createSound('./sounds/heroes/emmafrost_theme.mp3'),
            usagent: this.createSound('./sounds/heroes/usagent_theme.mp3'),
            noturno: this.createSound('./sounds/heroes/noturno_theme.mp3'),
            wanda: this.createSound('./sounds/heroes/wanda_theme.mp3'),
            captainmarvel: this.createSound('./sounds/heroes/captainmarvel_theme.mp3'),
            redhulk: this.createSound('./sounds/heroes/redhulk_theme.mp3'),
            infinityultron: this.createSound('./sounds/heroes/infinityultron_theme.mp3'),
            karolinadean: this.createSound('./sounds/heroes/karolinadean_theme.mp3'),
            gambit: this.createSound('./sounds/heroes/gambit_theme.mp3'),
            jeangrey: this.createSound('./sounds/heroes/jeangrey_theme.mp3')
        };

        // 🛡️ CAPTAIN AMERICA
        this.sounds.captainamerica = {
            ability1: this.createSound('./sounds/captainamerica/assemble.mp3'),
            ability2: this.createSound('./sounds/captainamerica/left_wing.mp3'),
        };
        /*
            ultimate: this.createSound('./sounds/captainamerica/rally_cry.mp3')
        };
        */

        // ⚡ THOR
        this.sounds.thor = {
            ability1: this.createSound('./sounds/thor/lightning_strike.mp3'),
            ability2: this.createSound('./sounds/thor/mjolnir_throw.mp3'),
            ultimate: this.createSound('./sounds/thor/thunder_storm.mp3'),
            thunderKill: this.createSound('./sounds/thor/thunder_kill.mp3'), // NOVO: Som de 8 kills
            mjolnirCombo: this.createSound('./sounds/thor/mjolnir_combo.mp3') // NOVO: Som de 3 arremessos
        };

        // 🔴 IRON MAN
        this.sounds.ironman = {
            ability1: this.createSound('./sounds/ironman/Hall_of_Armors.mp3'),
            ability2: this.createSound('./sounds/ironman/unibeam.mp3'),
            ultimate: this.createSound('./sounds/ironman/flight_mode.mp3'),
            unibeamCombo: this.createSound('./sounds/ironman/unibeam_combo.mp3') // NOVO: 3Âº Unibeam
        };

        // 🏹 HAWKEYE
        this.sounds.hawkeye = {
            ability1: this.createSound('./sounds/hawkeye/special_arrow.mp3'),
            ability2: this.createSound('./sounds/hawkeye/arrow_storm.mp3'),
            ability3: this.createSound('./sounds/hawkeye/kate_bishop.mp3')
        };

        // 🔮 LOKI
        this.sounds.loki = {
            ability1: this.createSound('./sounds/loki/illusion.mp3'),
            ability2: this.createSound('./sounds/loki/split_attack.mp3'),
            teamup: this.createSound('./sounds/loki/asgard_blessing.mp3')
        };

        // 🤖 ULTRON
        this.sounds.ultron = {
            ability1: this.createSound('./sounds/ultron/sentinel_drone.mp3'),
            ability2: this.createSound('./sounds/ultron/kamikaze_drone.mp3'),
            ultimate: this.createSound('./sounds/ultron/reconstruction.mp3')
        };

        // 💎 EMMA FROST
        this.sounds.emmafrost = {
            ability1: this.createSound('./sounds/emmafrost/diamond_form.mp3'),
            ability2: this.createSound('./sounds/emmafrost/psychic_blast.mp3'),
            teamup: this.createSound('./sounds/emmafrost/mind_control.mp3')
        };

        // 🔫 US AGENT
        this.sounds.usagent = {
            ability1: this.createSound('./sounds/usagent/charged_shield.mp3'),
            ability2: this.createSound('./sounds/usagent/defensive_stance.mp3'),
            ability3: this.createSound('./sounds/usagent/combat_call.mp3')
        };

        // 🌀 NOTURNO
        this.sounds.noturno = {
            ability1: this.createSound('./sounds/noturno/teleport.mp3'),
            ability2: this.createSound('./sounds/noturno/sulfur_cloud.mp3'),
            bamf: this.createSound('./sounds/noturno/bamf_effect.mp3')
        };

        // 🔮 WANDA
        this.sounds.wanda = {
            ability1: this.createSound('./sounds/wanda/chaos_magic.mp3'),
            ability2: this.createSound('./sounds/wanda/hex_zone.mp3'),
            ability3: this.createSound('./sounds/wanda/reality_warp.mp3'),
            teamup: this.createSound('./sounds/wanda/chaos_control.mp3')
        };

        // ⭐ CAPTAIN MARVEL
        this.sounds.captainmarvel = {
            ability1: this.createSound('./sounds/captainmarvel/photon_blast.mp3'),
            ability2: this.createSound('./sounds/captainmarvel/binary_mode.mp3'),
            ultimate: this.createSound('./sounds/captainmarvel/orbital_strike.mp3')
        };

        // 💪 RED HULK
        this.sounds.redhulk = {
            ability1: this.createSound('./sounds/redhulk/ground_slam.mp3'),
            ability2: this.createSound('./sounds/redhulk/rage_mode.mp3'),
            ultimate: this.createSound('./sounds/redhulk/nuclear_punch.mp3')
        };

        // 🌌 INFINITY ULTRON
        this.sounds.infinityultron = {
            ability1: this.createSound('./sounds/infinityultron/power_stone.mp3'),
            ability2: this.createSound('./sounds/infinityultron/time_prison.mp3'),
            ability3: this.createSound('./sounds/infinityultron/mind_minions.mp3'),
            ability4: this.createSound('./sounds/infinityultron/reality_barrier.mp3'),
            passive: this.createSound('./sounds/infinityultron/entropy_pulse.mp3')
        };

        // ⭐ KAROLINA DEAN
        this.sounds.karolinadean = {
            ability1: this.createSound('./sounds/karolinadean/light_flight.mp3'),
            ability2: this.createSound('./sounds/karolinadean/solar_shield.mp3'),
            ability3: this.createSound('./sounds/karolinadean/supernova.mp3'),
            ultimate: this.createSound('./sounds/karolinadean/stellar_burst.mp3')
        };

        // 🃏 GAMBIT
        this.sounds.gambit = {
            ability1: this.createSound('./sounds/gambit/cajun_attack.mp3'),
            ability2: this.createSound('./sounds/gambit/healing_hearts.mp3'),
            ability3: this.createSound('./sounds/gambit/sword_break.mp3'),
            cardThrow: this.createSound('./sounds/gambit/card_throw.mp3')
        };

        // 🔥 JEAN GREY
        this.sounds.jeangrey = {
            ability1: this.createSound('./sounds/jeangrey/telekinetic_barrage.mp3'),
            ability2: this.createSound('./sounds/jeangrey/telepathic_illusion.mp3'),
            ability3: this.createSound('./sounds/jeangrey/phoenix_rebirth.mp3'),
            teamup: this.createSound('./sounds/jeangrey/psychic_link.mp3')
        }; 

        console.log('🎵 Sistema de Sons Carregado');
    }

    /**
     * 🔊 Cria um objeto de áudio
     */
    createSound(path) {
        try {
            const audio = new Audio(path);
            audio.volume = this.volume;
            audio.preload = 'none'; // CORREÇÃO: Não tenta carregar imediatamente para evitar erro 404 em loop
            
            // Tratamento silencioso de erro para não poluir o console
            audio.addEventListener('error', (e) => {
                // Comentado para limpar console: console.warn(`⚠️ Som não encontrado: ${path}`);
                audio.hasError = true;
            });
            
            return audio;
        } catch (error) {
            console.warn(`⚠️ Erro ao criar som: ${path}`, error);
            return null;
        }
    }

    /**
     * 🎭 Toca o tema personalizado do herói no Hall of Heroes
     */
    playHeroTheme(heroType) {
        if (!this.enabled) return;
        
        // Para qualquer tema anterior
        this.stopHeroThemes();
        
        const theme = this.sounds.heroThemes?.[heroType];
        if (theme && !theme.hasError) {
            try {
                theme.currentTime = 0;
                theme.volume = this.volume * 0.7; // Volume um pouco menor
                theme.loop = false; // Toca uma vez
                
                const playPromise = theme.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log(`🎭 Tema de ${heroType} tocando`);
                        })
                        .catch(error => {
                            console.warn(`⚠️ Erro ao tocar tema do herói:`, error);
                        });
                }
            } catch (error) {
                console.warn(`⚠️ Erro ao executar tema do herói:`, error);
            }
        }
    }

    /**
     * ⏸️ Para todos os temas de heróis
     */
    stopHeroThemes() {
        if (!this.sounds.heroThemes) return;
        
        Object.values(this.sounds.heroThemes).forEach(theme => {
            if (theme && !theme.paused) {
                theme.pause();
                theme.currentTime = 0;
            }
        });
    }

    //  ⏸️ Para som de tema do hall de herois
    stopHallSound() {
        const sound = this.sounds.menu?.hallOpen;
        if (sound && !sound.paused) {
            sound.pause();
            sound.currentTime = 0; // Reinicia o áudio para o começo
            console.log('🔇 Som do Hall parado');
        }
    }

    /**
     * 🎵 Toca música do menu principal (em loop)
     */
    playMainTheme() {
        if (!this.enabled) return;
        
        const mainTheme = this.sounds.menu?.mainTheme;
        if (mainTheme && !mainTheme.hasError) {
            try {
                mainTheme.currentTime = 0;
                mainTheme.volume = this.volume * 0.5; // Volume ambiente
                mainTheme.loop = true; // Loop infinito
                
                mainTheme.play()
                    .then(() => console.log('🎵 Música do menu principal iniciada'))
                    .catch(err => console.warn('⚠️ Erro ao tocar tema principal:', err));
            } catch (error) {
                console.warn('⚠️ Erro ao executar tema principal:', error);
            }
        }
    }

    /**
     * ⏹️ Para música do menu principal
     */
    stopMainTheme() {
        const mainTheme = this.sounds.menu?.mainTheme;
        if (mainTheme && !mainTheme.paused) {
            mainTheme.pause();
            mainTheme.currentTime = 0;
        }
    }

    /**
     * ▶️ Toca o som de uma habilidade
     */
    playAbilitySound(championType, abilityNumber) {
        if (!this.enabled) return;
        
        const championSounds = this.sounds[championType];
        if (!championSounds) {
            console.log(`ℹ️ ${championType}: Sem sons configurados`);
            return;
        }

        let soundKey;
        
        // Mapeia número da habilidade para chave
        switch(abilityNumber) {
            case 1:
                soundKey = 'ability1';
                break;
            case 2:
                soundKey = 'ability2';
                break;
            case 3:
                soundKey = 'ability3';
                break;
            case 4:
                soundKey = 'teamup';
                break;
            case 'ultimate':
                soundKey = 'ultimate';
                break;
            default:
                soundKey = `ability${abilityNumber}`;
        }

        const sound = championSounds[soundKey];
        
        if (sound) {
            try {
                // Reinicia o som se já estiver tocando
                sound.currentTime = 0;
                sound.volume = this.volume;
                
                const playPromise = sound.play();
                
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log(`🔊 ${championType} - Habilidade ${abilityNumber}`);
                        })
                        .catch(error => {
                            console.warn(`⚠️ Erro ao tocar som:`, error);
                        });
                }
            } catch (error) {
                console.warn(`⚠️ Erro ao executar som:`, error);
            }
        } else {
            console.log(`ℹ️ ${championType}: Sem som para habilidade ${abilityNumber}`);
        }
    }

    /**
     * 🔊 Toca um som especial (efeitos, eventos)
     */
    playSpecialSound(championType, soundName) {
        if (!this.enabled) return;
        
        const championSounds = this.sounds[championType];
        if (!championSounds) return;

        const sound = championSounds[soundName];
        if (sound) {
            try {
                sound.currentTime = 0;
                sound.volume = this.volume;
                sound.play().catch(err => console.warn('⚠️ Erro ao tocar som especial:', err));
            } catch (error) {
                console.warn('⚠️ Erro ao executar som especial:', error);
            }
        }
    }

    /**
     * 🔇 Muda o volume
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        
        // Atualiza volume de todos os sons carregados
        Object.values(this.sounds).forEach(championSounds => {
            Object.values(championSounds).forEach(sound => {
                if (sound) sound.volume = this.volume;
            });
        });
    }

    /**
     * 🔇 Liga/Desliga sons
     */
    toggleSound(enabled) {
        this.enabled = enabled;
        console.log(`🔊 Sons: ${enabled ? 'ATIVADOS' : 'DESATIVADOS'}`);
    }

    /**
     * ⏸️ Para todos os sons
     */
    stopAll() {
        // Para sons de habilidades
        Object.values(this.sounds).forEach(championSounds => {
            if (typeof championSounds === 'object') {
                Object.values(championSounds).forEach(sound => {
                    if (sound && sound.pause) {
                        sound.pause();
                        sound.currentTime = 0;
                    }
                });
            }
        });
        
        // Para temas de heróis especificamente
        this.stopHeroThemes();
        this.stopMainTheme();
    }
}

// 🌐 Exporta para uso global
window.SoundManager = SoundManager;