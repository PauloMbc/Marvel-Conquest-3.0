// musicPlayer.js
export class MusicPlayer {
    constructor() {
        console.log('🎵 MusicPlayer inicializando...');
        
        this.audio = document.getElementById('gameAudio');
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffle = false;
        this.isRepeat = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadFromLocalStorage();
        
        console.log('✅ MusicPlayer inicializado');
    }
    
    initializeElements() {
        this.elements = {
            playPauseBtn: document.getElementById('playPauseBtn'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            shuffleBtn: document.getElementById('shuffleBtn'),
            repeatBtn: document.getElementById('repeatBtn'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            musicProgress: document.getElementById('musicProgress'),
            currentTime: document.getElementById('currentTime'),
            totalTime: document.getElementById('totalTime'),
            currentTrackName: document.getElementById('currentTrackName'),
            musicPlaylist: document.getElementById('musicPlaylist'),
            addMusicBtn: document.getElementById('addMusicBtn'),
            musicFileInput: document.getElementById('musicFileInput')
        };
    }
    
    setupEventListeners() {
        // Play/Pause
        this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        
        // Prev/Next
        this.elements.prevBtn.addEventListener('click', () => this.previousTrack());
        this.elements.nextBtn.addEventListener('click', () => this.nextTrack());
        
        // Shuffle/Repeat
        this.elements.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        this.elements.repeatBtn.addEventListener('click', () => this.toggleRepeat());
        
        // Volume
        this.elements.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        
        // Progress
        this.elements.musicProgress.addEventListener('input', (e) => this.seek(e.target.value));
        
        // Adicionar músicas
        this.elements.addMusicBtn.addEventListener('click', () => {
            this.elements.musicFileInput.click();
        });
        
        this.elements.musicFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.onTrackEnded());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        
        // Atalhos do teclado
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    handleFileUpload(event) {
        const files = Array.from(event.target.files);
        
        files.forEach(file => {
            if (file.type.startsWith('audio/')) {
                const url = URL.createObjectURL(file);
                const track = {
                    name: file.name.replace(/\.[^/.]+$/, ""), // Remove extensão
                    url: url,
                    duration: null
                };
                
                this.playlist.push(track);
            }
        });
        
        this.updatePlaylistUI();
        this.saveToLocalStorage();
        
        // Auto-play primeira música se não estiver tocando
        if (this.playlist.length === files.length && !this.isPlaying) {
            this.loadTrack(0);
        }
    }
    
    updatePlaylistUI() {
        this.elements.musicPlaylist.innerHTML = '';
        
        if (this.playlist.length === 0) {
            this.elements.musicPlaylist.innerHTML = '<p style="text-align: center; opacity: 0.6;">Nenhuma música adicionada</p>';
            return;
        }
        
        this.playlist.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = 'playlist-item' + (index === this.currentIndex ? ' active' : '');
            
            item.innerHTML = `
                <span class="playlist-item-name">${index + 1}. ${track.name}</span>
                ${track.duration ? `<span class="playlist-item-duration">${this.formatTime(track.duration)}</span>` : ''}
                <button class="playlist-item-remove" data-index="${index}">🗑️</button>
            `;
            
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('playlist-item-remove')) {
                    this.loadTrack(index);
                    this.play();
                }
            });
            
            const removeBtn = item.querySelector('.playlist-item-remove');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeTrack(index);
            });
            
            this.elements.musicPlaylist.appendChild(item);
        });
    }
    
    removeTrack(index) {
        URL.revokeObjectURL(this.playlist[index].url);
        this.playlist.splice(index, 1);
        
        if (index === this.currentIndex) {
            this.stop();
            if (this.playlist.length > 0) {
                this.loadTrack(Math.min(index, this.playlist.length - 1));
            }
        } else if (index < this.currentIndex) {
            this.currentIndex--;
        }
        
        this.updatePlaylistUI();
        this.saveToLocalStorage();
    }
    
    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        this.currentIndex = index;
        const track = this.playlist[index];
        
        this.audio.src = track.url;
        this.elements.currentTrackName.textContent = track.name;
        this.updatePlaylistUI();
        
        // ✅ ADICIONE ESTAS LINHAS:
        // Atualiza o label da fita cassete
        const cassetteLabel = document.getElementById('cassetteLabel');
        if (cassetteLabel) {
            cassetteLabel.textContent = `🎵 ${track.name.toUpperCase()} 🎵`;
        }
    }
        
    togglePlayPause() {
        if (this.playlist.length === 0) {
            alert('Adicione músicas primeiro!');
            return;
        }
        
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    play() {
        if (this.playlist.length === 0) return;
        
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.elements.playPauseBtn.textContent = '⏸️';
            
            // ✅ ANIMA OS ROLOS DA FITA
            document.getElementById('leftReel').classList.add('playing');
            document.getElementById('rightReel').classList.add('playing');
        }).catch(err => {
            console.error('Erro ao tocar:', err);
        });
    }
    
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.elements.playPauseBtn.textContent = '▶️';
        
        // ✅ PARA OS ROLOS DA FITA
        document.getElementById('leftReel').classList.remove('playing');
        document.getElementById('rightReel').classList.remove('playing');
    }
    
    stop() {
        this.pause();
        this.audio.currentTime = 0;
    }
    
    nextTrack() {
        if (this.playlist.length === 0) return;
        
        if (this.isShuffle) {
            const newIndex = Math.floor(Math.random() * this.playlist.length);
            this.loadTrack(newIndex);
        } else {
            const newIndex = (this.currentIndex + 1) % this.playlist.length;
            this.loadTrack(newIndex);
        }
        
        if (this.isPlaying) {
            this.play();
        }
    }
    
    previousTrack() {
        if (this.playlist.length === 0) return;
        
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
        } else {
            const newIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
            this.loadTrack(newIndex);
            
            if (this.isPlaying) {
                this.play();
            }
        }
    }
    
    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        this.elements.shuffleBtn.classList.toggle('active', this.isShuffle);
    }
    
    toggleRepeat() {
        this.isRepeat = !this.isRepeat;
        this.elements.repeatBtn.classList.toggle('active', this.isRepeat);
    }
    
    setVolume(value) {
        this.audio.volume = value / 100;
        this.elements.volumeValue.textContent = value + '%';
    }
    
    seek(value) {
        const time = (value / 100) * this.audio.duration;
        if (!isNaN(time)) {
            this.audio.currentTime = time;
        }
    }
    
    updateProgress() {
        if (this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.elements.musicProgress.value = progress;
            this.elements.currentTime.textContent = this.formatTime(this.audio.currentTime);
        }
    }
    
    updateDuration() {
        this.elements.totalTime.textContent = this.formatTime(this.audio.duration);
        
        // Atualiza duração no playlist
        if (this.playlist[this.currentIndex]) {
            this.playlist[this.currentIndex].duration = this.audio.duration;
            this.updatePlaylistUI();
        }
    }
    
    onTrackEnded() {
        if (this.isRepeat) {
            this.audio.currentTime = 0;
            this.play();
        } else {
            this.nextTrack();
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    handleKeyboard(e) {
        // Ignora se estiver digitando
        if (e.target.tagName === 'INPUT') return;
        
        switch(e.key.toLowerCase()) {
            case 'n':
                this.togglePlayPause();
                break;
            case 'm':
                this.nextTrack();
                break;
            case 'b':
                this.previousTrack();
                break;
        }
    }
    
    saveToLocalStorage() {
        // Salva apenas metadados, não os arquivos
        const data = {
            currentIndex: this.currentIndex,
            volume: this.audio.volume,
            isShuffle: this.isShuffle,
            isRepeat: this.isRepeat
        };
        
        localStorage.setItem('musicPlayerSettings', JSON.stringify(data));
    }
    
    loadFromLocalStorage() {
        const saved = localStorage.getItem('musicPlayerSettings');
        if (saved) {
            const data = JSON.parse(saved);
            this.currentIndex = data.currentIndex || 0;
            this.isShuffle = data.isShuffle || false;
            this.isRepeat = data.isRepeat || false;
            
            if (data.volume !== undefined) {
                this.elements.volumeSlider.value = data.volume * 100;
                this.setVolume(data.volume * 100);
            }
            
            this.elements.shuffleBtn.classList.toggle('active', this.isShuffle);
            this.elements.repeatBtn.classList.toggle('active', this.isRepeat);
        }
    }
}