/**
 * Clase que maneja el sistema de audio del juego
 */
export class AudioManager {
    constructor() {
        this.music = null;
        this.currentTrack = null;
        this.volume = 0.5;
        this.isMuted = false;
    }

    /**
     * Inicializa el sistema de audio
     */
    init() {
        this.music = new Audio();
        this.music.loop = true;
        this.music.volume = this.volume;
    }

    /**
     * Carga y reproduce una pista de música
     * @param {string} trackPath - Ruta al archivo de audio
     */
    playMusic(trackPath) {
        if (this.currentTrack === trackPath) return;
        
        this.currentTrack = trackPath;
        this.music.src = trackPath;
        
        // Intentar reproducir la música
        this.music.play().catch(error => {
            console.warn('No se pudo reproducir la música automáticamente:', error);
        });
    }

    /**
     * Detiene la música actual
     */
    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }
    }

    /**
     * Pausa la música actual
     */
    pauseMusic() {
        if (this.music) {
            this.music.pause();
        }
    }

    /**
     * Reanuda la música pausada
     */
    resumeMusic() {
        if (this.music) {
            this.music.play().catch(error => {
                console.warn('No se pudo reanudar la música:', error);
            });
        }
    }

    /**
     * Ajusta el volumen de la música
     * @param {number} value - Valor entre 0 y 1
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.music) {
            this.music.volume = this.volume;
        }
    }

    /**
     * Alterna el estado de silencio
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.music) {
            this.music.volume = this.isMuted ? 0 : this.volume;
        }
    }
} 