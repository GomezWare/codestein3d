/**
 * Archivo principal del juego que inicializa todos los componentes
 * y maneja el bucle principal del juego.
 */

import { Game } from './game/Game.js';
import { Player } from './entities/Player.js';
import { Map } from './map/Map.js';
import { TextureManager } from './textures/TextureManager.js';

class Main {
    constructor() {
        // Obtener elementos del DOM
        this.startScreen = document.getElementById('start-screen');
        this.gameContainer = document.getElementById('game-container');
        
        // Obtener el canvas y su contexto 2D
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Inicializar el gestor de texturas
        this.textureManager = new TextureManager();
        
        // Configurar dimensiones del canvas
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Crear instancia del juego
        this.game = new Game(this.canvas, this.ctx, this.textureManager);
        
        // Configurar el evento de inicio
        this.setupStartEvent();
    }
    
    /**
     * Configura el evento para iniciar el juego
     */
    setupStartEvent() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.startScreen.style.display !== 'none') {
                this.startGame();
            }
        });
    }
    
    /**
     * Inicia el juego
     */
    async startGame() {
        // Ocultar pantalla de inicio
        this.startScreen.style.display = 'none';
        this.gameContainer.classList.remove('hidden');
        
        // Cargar el primer nivel
        await this.loadLevel('level1');
        
        // Iniciar el bucle del juego
        this.gameLoop();
    }
    
    /**
     * Carga un nivel desde un archivo JSON
     * @param {string} levelName - Nombre del archivo del nivel (sin extensión)
     */
    async loadLevel(levelName) {
        try {
            const response = await fetch(`assets/levels/${levelName}.json`);
            const levelData = await response.json();
            this.game.loadLevel(levelData);
        } catch (error) {
            console.error('Error al cargar el nivel:', error);
        }
    }
    
    /**
     * Bucle principal del juego que actualiza y renderiza el estado
     * del juego en cada frame
     */
    gameLoop() {
        // Actualizar lógica del juego
        this.game.update();
        
        // Renderizar el estado actual
        this.game.render();
        
        // Solicitar el siguiente frame
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Iniciar el juego cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    new Main();
}); 