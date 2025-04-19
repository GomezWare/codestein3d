/**
 * Clase principal que maneja la lógica del juego, incluyendo
 * la actualización del estado y el renderizado.
 */

import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Map } from '../map/Map.js';
import { AudioManager } from '../audio/AudioManager.js';
import { ProjectileManager } from '../entities/ProjectileManager.js';

export class Game {
    /**
     * Constructor de la clase Game
     * @param {HTMLCanvasElement} canvas - Elemento canvas del juego
     * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
     * @param {TextureManager} textureManager - Gestor de texturas
     */
    constructor(canvas, ctx, textureManager) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.textureManager = textureManager;
        this.player = null;
        this.map = null;
        this.enemies = []; // Array de enemigos
        this.keys = {}; // Almacena el estado de las teclas presionadas
        this.lastKeyStates = {}; // Para detectar pulsaciones únicas
        
        // Variables del juego
        this.currentLevel = 1;
        this.currentFloor = 1;
        this.lastUpdateTime = 0;
        
        // Sistema de audio
        this.audioManager = new AudioManager();
        this.audioManager.init();
        
        // Cargar sonidos
        this.shootSound = new Audio();
        this.shootSound.src = 'assets/sounds/shoot.mp3';
        this.shootSound.volume = 0.5;
        this.shootSound.load();
        
        // Sonidos de enemigos
        this.enemyShootSound = new Audio('assets/sounds/enemy_shoot.mp3');
        this.enemyShootSound.volume = 0.3;
        
        // Sonidos de muerte de enemigos
        this.enemyDeathSounds = [
            new Audio('assets/sounds/enemy_death1.mp3'),
            new Audio('assets/sounds/enemy_death2.mp3'),
            new Audio('assets/sounds/enemy_death3.mp3')
        ];
        this.enemyDeathSounds.forEach(sound => sound.volume = 0.5);
        
        // Sonido de daño al jugador
        this.playerHurtSound = new Audio('assets/sounds/player_hurt.mp3');
        this.playerHurtSound.volume = 0.5;
        
        // Sonido de detección del enemigo
        this.enemyDetectSound = new Audio('assets/sounds/enemy_detect.mp3');
        this.enemyDetectSound.volume = 0.4;
        
        // Sistema de proyectiles
        this.projectileManager = new ProjectileManager();
        
        // Configurar controladores de eventos de teclado
        this.setupEventListeners();
    }
    
    /**
     * Configura los event listeners para el control del teclado
     */
    setupEventListeners() {
        // Registrar tecla presionada
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Manejar tecla M para el minimapa
            if (e.key.toLowerCase() === 'm' && !this.lastKeyStates['m']) {
                this.map?.toggleMinimap();
            }
            
            // Manejar tecla P para pausar/reanudar música
            if (e.key.toLowerCase() === 'p' && !this.lastKeyStates['p']) {
                if (this.audioManager.music.paused) {
                    this.audioManager.resumeMusic();
                } else {
                    this.audioManager.pauseMusic();
                }
            }
            
            // Manejar tecla N para silenciar/activar música
            if (e.key.toLowerCase() === 'n' && !this.lastKeyStates['n']) {
                this.audioManager.toggleMute();
            }
            
            // Actualizar estado anterior de las teclas
            this.lastKeyStates[e.key.toLowerCase()] = true;
        });
        
        // Registrar tecla liberada
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            this.lastKeyStates[e.key.toLowerCase()] = false;
        });
    }
    
    /**
     * Carga un nuevo nivel en el juego
     * @param {Object} levelData - Datos del nivel a cargar
     */
    loadLevel(levelData) {
        // Crear nuevo mapa con los datos proporcionados
        this.map = new Map(levelData.map, this.textureManager);
        
        // Crear nuevo jugador en la posición inicial
        this.player = new Player(
            levelData.playerStart.x,
            levelData.playerStart.y,
            levelData.playerStart.angle
        );
        
        // Crear enemigos
        this.enemies = [];
        if (levelData.enemies) {
            levelData.enemies.forEach(enemyData => {
                const enemy = new Enemy(
                    enemyData.x,
                    enemyData.y,
                    enemyData.angle,
                    enemyData.health,
                    enemyData.speed,
                    enemyData.damage
                );
                this.enemies.push(enemy);
            });
        }
        
        // Cargar música del nivel
        if (levelData.music) {
            this.audioManager.playMusic(levelData.music);
        }
    }
    
    /**
     * Actualiza el estado del juego
     */
    update() {
        // Si no hay jugador o mapa, no actualizar
        if (!this.player || !this.map) return;
        
        // Calcular tiempo delta
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
        
        // Actualizar estado del jugador
        const isDead = this.player.update(this.keys, this.map, currentTime);
        
        // Manejar disparo del jugador
        if (this.keys[' '] && this.player.ammo > 0) {
            if (this.player.shoot(currentTime, this.map, this.enemies)) {
                this.shootSound.currentTime = 0;
                this.shootSound.play().catch(error => {
                    console.warn('Error al reproducir sonido de disparo:', error);
                });
            }
        }
        
        // Actualizar enemigos
        this.updateEnemies(currentTime);
        
        // Reproducir sonido de daño si el jugador está dañado
        if (this.player.isFlashing && currentTime - this.player.flashStartTime < 50) {
            this.playerHurtSound.currentTime = 0;
            this.playerHurtSound.play().catch(error => {
                console.warn('Error al reproducir sonido de daño:', error);
            });
        }

        // Verificar si el jugador ha muerto
        if (isDead) {
            this.playerHurtSound.currentTime = 0;
            this.playerHurtSound.play(); // Reproducir sonido de muerte
            this.showGameOver(); // Mostrar pantalla de Game Over
        }
    }
    
    /**
     * Actualiza el estado de los enemigos
     * @param {number} currentTime - Tiempo actual del juego
     */
    updateEnemies(currentTime) {
        // Actualizar cada enemigo
        this.enemies.forEach(enemy => {
            if (enemy.active) {
                const previousState = enemy.state;
                const didAttack = enemy.update(this.player, this.map, currentTime);
                
                // Reproducir sonido de ataque si el enemigo atacó
                if (didAttack) {
                    this.enemyShootSound.currentTime = 0;
                    this.enemyShootSound.play();
                }
                
                // Reproducir sonido de detección si el enemigo acaba de detectar al jugador
                if (previousState !== 'chase' && enemy.state === 'chase') {
                    this.enemyDetectSound.currentTime = 0;
                    this.enemyDetectSound.play();
                }
            } else {
                // Si el enemigo está muerto, solo actualizar su animación
                enemy.updateAnimation(currentTime);
            }
        });
        
        // Reproducir sonido de muerte para enemigos que acaban de morir
        this.enemies.forEach(enemy => {
            if (!enemy.active && !enemy.deathSoundPlayed) {
                const randomSound = this.enemyDeathSounds[Math.floor(Math.random() * this.enemyDeathSounds.length)];
                randomSound.currentTime = 0;
                randomSound.play();
                enemy.deathSoundPlayed = true;
            }
        });
    }
    
    /**
     * Renderiza el estado actual del juego
     */
    render() {
        // Limpiar el canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Si no hay jugador o mapa, no renderizar
        if (!this.player || !this.map) return;
        
        // Renderizar el mapa
        this.map.render(this.ctx, this.player);
        
        // Renderizar enemigos
        this.enemies.forEach(enemy => {
            enemy.render(this.ctx, this.player, this.map);
        });
        
        // Renderizar proyectiles y efectos
        this.projectileManager.render(this.ctx, this.player);
        
        // Renderizar manos y arma
        this.player.renderHands(this.ctx);
        
        // Renderizar efecto de flash rojo si el jugador está dañado
        if (this.player.isFlashing) {
            const currentTime = performance.now();
            const elapsed = currentTime - this.player.flashStartTime;
            
            if (elapsed < this.player.flashDuration) {
                // Calcular la intensidad del flash (se desvanece con el tiempo)
                const alpha = this.player.flashAlpha * (1 - elapsed / this.player.flashDuration);
                
                // Dibujar el flash rojo
                this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            } else {
                this.player.isFlashing = false;
            }
        }
        
        // Renderizar HUD
        this.renderHUD();
    }
    
    /**
     * Renderiza el HUD (Heads-Up Display) del juego
     */
    renderHUD() {
        // Actualizar elementos del HUD
        document.getElementById('floor-value').textContent = `${this.currentFloor}-${this.currentLevel}`;
        document.getElementById('health-value').textContent = this.player.health;
        document.getElementById('ammo-value').textContent = this.player.ammo;
        
        // Actualizar cara según la salud con animación
        const faceImg = document.getElementById('face-img');
        const currentTime = performance.now();
        
        // Determinar el estado base según la salud
        if (this.player.health <= 0) {
            // Cara de muerte
            faceImg.src = 'assets/hud/head_dead.png';
        } else if (this.player.health > 75) {
            // Cara normal con animación
            const frame = Math.floor(currentTime / 1000) % 3; // Cambia cada 1000ms
            faceImg.src = `assets/hud/head_normal${frame}.png`;
        } else if (this.player.health > 25) {
            // Cara con salud crítica con animación rápida
            const frame = Math.floor(currentTime / 1000) % 3; // Cambia cada 1000ms
            faceImg.src = `assets/hud/head_low_health${frame}.png`;
        } else {
            const frame = Math.floor(currentTime / 1000) % 3; // Cambia cada 1000ms
            faceImg.src = `assets/hud/head_critical_health${frame}.png`;
        }
    }

    /**
     * Muestra la pantalla de Game Over y limpia los recursos del juego
     */
    showGameOver() {
        // Reproducir sonido de muerte del jugador
        const deathSound = this.enemyDeathSounds[2]; // enemy_death3.mp3
        deathSound.currentTime = 0;
        deathSound.play().catch(error => {
            console.warn('Error al reproducir sonido de muerte:', error);
        });

        // Detener la música del juego
        this.audioManager.stopMusic();

        // Mostrar pantalla de Game Over
        const gameOverElement = document.getElementById('game-over');
        if (gameOverElement) {
            gameOverElement.style.display = 'flex';
            gameOverElement.style.position = 'absolute';
            gameOverElement.style.top = '0';
            gameOverElement.style.left = '0';
            gameOverElement.style.width = '100%';
            gameOverElement.style.height = '100%';
            gameOverElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            gameOverElement.style.color = '#ff0000';
            gameOverElement.style.fontSize = '48px';
            gameOverElement.style.justifyContent = 'center';
            gameOverElement.style.alignItems = 'center';
            gameOverElement.innerHTML = '<div>GAME OVER</div>';
        }

        // Remover los event listeners usando las referencias guardadas
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);

        // Mantener el flash rojo
        this.player.isFlashing = true;
        this.player.flashAlpha = 0.3; // Reducir la intensidad para el game over
        this.player.flashDuration = Infinity; // Mantener el flash indefinidamente
    }
} 