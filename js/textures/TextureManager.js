/**
 * Clase que maneja la carga y gestión de texturas del juego.
 * Utiliza un sistema de caché para evitar cargar las mismas
 * texturas múltiples veces.
 */

export class TextureManager {
    /**
     * Constructor de la clase TextureManager
     */

    // Directorio de texturas
    texturesDir = 'assets/textures/';

    constructor() {
        // Mapa para almacenar las texturas cargadas
        this.textures = new Map();

        // Cargar todas las texturas al inicializar
        this.loadTextures();
    }
    
    /**
     * Carga todas las texturas definidas en el juego
     */
    async loadTextures() {
        // Definir las texturas a cargar
        const textureFiles = [
            { name: 'wall1', path: 'wall1.png' },
            { name: 'wall2', path: 'wall2.png' },
            { name: 'wall3', path: 'wall3.png' },
            { name: 'wall4', path: 'wall4.png' },
            { name: 'notex', path: 'notex.png' } // Textura por defecto
        ];
        
        // Cargar cada textura
        for (const texture of textureFiles) {
            try {
                await this.loadTexture(texture.name, this.texturesDir + texture.path);
            } catch (error) {};
        }
        
        // Verificar que la textura por defecto se cargó correctamente
        if (!this.textures.has('notex')) {
            console.error('Error crítico: No se pudo cargar la textura por defecto (notex.png)');
        }
    }
    
    /**
     * Carga una textura individual
     * @param {string} name - Nombre identificador de la textura
     * @param {string} path - Ruta al archivo de la textura
     * @returns {Promise} - Promesa que se resuelve cuando la textura se carga
     */
    async loadTexture(name, path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            // Configurar manejadores de eventos
            img.onload = () => {
                // Almacenar la textura en el caché
                this.textures.set(name, img);
                resolve();
            };
            
            img.onerror = () => {
                reject(new Error(`Error al cargar la textura: ${path}`));
            };
            
            // Iniciar la carga de la imagen
            img.src = path;
        });
    }
    
    /**
     * Obtiene una textura del caché. Si la textura no existe,
     * devuelve la textura por defecto (notex.png)
     * @param {string} name - Nombre de la textura a obtener
     * @returns {HTMLImageElement} - Elemento de imagen de la textura
     */
    getTexture(name) {
        // Si la textura existe, devolverla
        if (this.textures.has(name)) {
            return this.textures.get(name);
        }
        
        // Si no existe, usar la textura por defecto
        return this.textures.get('notex');
    }
} 