/**
 * Clase que maneja el mapa del juego y el sistema de raycasting
 * para renderizar las paredes en 3D.
 */

export class Map {
    /**
     * Constructor de la clase Map
     * @param {Array<Array<number>>} mapData - Matriz que representa el mapa
     * @param {TextureManager} textureManager - Gestor de texturas
     */
    constructor(mapData, textureManager) {
        this.data = mapData;
        this.textureManager = textureManager;
        this.wallHeight = 1; // Altura base de las paredes
        this.showMinimap = false; // Estado del minimapa
        this.minimapSize = 150; // Tamaño del minimapa en píxeles
        this.minimapScale = 15; // Escala de cada celda del minimapa
    }
    
    /**
     * Verifica si hay una pared en la posición especificada
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @returns {boolean} - true si hay una pared, false en caso contrario
     */
    isWall(x, y) {
        // Verificar límites del mapa
        if (x < 0 || y < 0 || x >= this.data[0].length || y >= this.data.length) {
            return true;
        }
        // Verificar si la celda contiene una pared (valor > 0)
        return this.data[y][x] > 0;
    }
    
    /**
     * Renderiza el mapa usando raycasting
     * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
     * @param {Player} player - Instancia del jugador
     */
    render(ctx, player) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        // Renderizar vista 3D
        this.render3DView(ctx, player);
        
        // Renderizar minimapa si está activado
        if (this.showMinimap) {
            this.renderMinimap(ctx, player);
        }
    }
    
    /**
     * Renderiza la vista 3D del mapa
     */
    render3DView(ctx, player) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const fov = Math.PI / 3; // 60 grados
        const halfFov = fov / 2;
        const numRays = width;
        const rayAngleStep = fov / numRays;
        
        // Renderizar cielo
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, width, height / 2);
        
        // Renderizar suelo
        ctx.fillStyle = '#444';
        ctx.fillRect(0, height / 2, width, height / 2);
        
        // Desactivar suavizado para mantener píxeles nítidos
        ctx.imageSmoothingEnabled = false;
        
        // Raycasting
        for (let i = 0; i < numRays; i++) {
            const rayAngle = player.angle - halfFov + i * rayAngleStep;
            const ray = this.castRay(player.x, player.y, rayAngle);
            
            // Calcular altura de la pared
            const lineHeight = Math.floor(height / ray.distance);
            
            // Calcular posición vertical de la pared
            const drawStart = Math.floor(-lineHeight / 2 + height / 2);
            const drawEnd = Math.floor(lineHeight / 2 + height / 2);
            
            if (ray.texture) {
                const texture = this.textureManager.getTexture(ray.texture);
                if (texture) {
                    // Calcular la coordenada X de la textura
                    const textureX = Math.floor(ray.textureX * texture.width);
                    
                    try {
                        // Dibujar la columna de textura
                        ctx.drawImage(
                            texture,
                            textureX, 0, 1, texture.height,
                            i, drawStart, 1, drawEnd - drawStart
                        );
                        
                        // Aplicar sombreado según el lado y la distancia
                        const shade = ray.side === 1 ? 0.7 : 1;
                        const distance = Math.min((ray.distance - 1) / 7, 0.6);
                        
                        ctx.fillStyle = `rgba(0, 0, 0, ${distance * shade})`;
                        ctx.fillRect(i, drawStart, 1, drawEnd - drawStart);
                    } catch (error) {
                        ctx.fillStyle = ray.color;
                        ctx.fillRect(i, drawStart, 1, drawEnd - drawStart);
                    }
                } else {
                    ctx.fillStyle = ray.color;
                    ctx.fillRect(i, drawStart, 1, drawEnd - drawStart);
                }
            } else {
                ctx.fillStyle = ray.color;
                ctx.fillRect(i, drawStart, 1, drawEnd - drawStart);
            }
        }
    }

    /**
     * Renderiza el minimapa
     */
    renderMinimap(ctx, player) {
        const padding = 10;
        const mapWidth = this.data[0].length * this.minimapScale;
        const mapHeight = this.data.length * this.minimapScale;
        
        // Fondo del minimapa
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(
            padding,
            padding,
            mapWidth,
            mapHeight
        );
        
        // Dibujar celdas del mapa
        for (let y = 0; y < this.data.length; y++) {
            for (let x = 0; x < this.data[y].length; x++) {
                if (this.data[y][x] > 0) {
                    ctx.fillStyle = this.getMinimapColor(this.data[y][x]);
                    ctx.fillRect(
                        padding + x * this.minimapScale,
                        padding + y * this.minimapScale,
                        this.minimapScale - 1,
                        this.minimapScale - 1
                    );
                }
            }
        }
        
        // Dibujar jugador
        ctx.fillStyle = '#FF0';
        ctx.beginPath();
        ctx.arc(
            padding + player.x * this.minimapScale,
            padding + player.y * this.minimapScale,
            3,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Dibujar dirección del jugador
        ctx.strokeStyle = '#FF0';
        ctx.beginPath();
        ctx.moveTo(
            padding + player.x * this.minimapScale,
            padding + player.y * this.minimapScale
        );
        ctx.lineTo(
            padding + (player.x + Math.cos(player.angle) * 0.5) * this.minimapScale,
            padding + (player.y + Math.sin(player.angle) * 0.5) * this.minimapScale
        );
        ctx.stroke();
    }

    /**
     * Obtiene el color para el minimapa según el tipo de pared
     */
    getMinimapColor(wallType) {
        const colors = {
            1: '#F00',  // Rojo
            2: '#0F0',  // Verde
            3: '#00F',  // Azul
            4: '#FF0'   // Amarillo
        };
        return colors[wallType] || '#FFF';
    }

    /**
     * Alterna la visibilidad del minimapa
     */
    toggleMinimap() {
        this.showMinimap = !this.showMinimap;
    }
    
    /**
     * Lanza un rayo y devuelve información sobre la colisión
     * @param {number} x - Posición X inicial
     * @param {number} y - Posición Y inicial
     * @param {number} angle - Ángulo del rayo
     * @returns {Object} Información sobre la colisión
     */
    castRay(x, y, angle) {
        const rayDirX = Math.cos(angle);
        const rayDirY = Math.sin(angle);
        
        // Posición actual en el mapa
        let mapX = Math.floor(x);
        let mapY = Math.floor(y);
        
        // Longitud del rayo desde una posición x o y al siguiente x o y
        const deltaDistX = Math.abs(1 / rayDirX);
        const deltaDistY = Math.abs(1 / rayDirY);
        
        // Distancia que el rayo tiene que viajar para ir desde la posición inicial hasta el primer x-side o y-side
        let sideDistX;
        let sideDistY;
        
        // Dirección a dar el paso en x o y (-1 o +1)
        const stepX = rayDirX < 0 ? -1 : 1;
        const stepY = rayDirY < 0 ? -1 : 1;
        
        if (rayDirX < 0) {
            sideDistX = (x - mapX) * deltaDistX;
        } else {
            sideDistX = (mapX + 1.0 - x) * deltaDistX;
        }
        
        if (rayDirY < 0) {
            sideDistY = (y - mapY) * deltaDistY;
        } else {
            sideDistY = (mapY + 1.0 - y) * deltaDistY;
        }
        
        // Realizar DDA (Digital Differential Analysis)
        let side; // 0 para x-side, 1 para y-side
        let hit = false;
        let maxDistance = 20; // Distancia máxima de búsqueda
        let distance = 0;
        
        while (!hit && distance < maxDistance) {
            // Saltar al siguiente cuadro del mapa
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
                distance = sideDistX;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
                distance = sideDistY;
            }
            
            // Verificar si el rayo golpeó una pared
            if (mapY >= 0 && mapY < this.data.length && mapX >= 0 && mapX < this.data[0].length) {
                if (this.data[mapY][mapX] > 0) {
                    hit = true;
                }
            }
        }
        
        // Calcular la distancia perpendicular a la pared
        let perpWallDist;
        if (side === 0) {
            perpWallDist = (mapX - x + (1 - stepX) / 2) / rayDirX;
        } else {
            perpWallDist = (mapY - y + (1 - stepY) / 2) / rayDirY;
        }
        
        // Calcular el punto exacto donde el rayo golpea la pared
        let wallX;
        if (side === 0) {
            wallX = y + perpWallDist * rayDirY;
        } else {
            wallX = x + perpWallDist * rayDirX;
        }
        wallX -= Math.floor(wallX);
        
        // Obtener el tipo de pared
        const wallType = hit ? this.data[mapY][mapX] : 0;
        
        return {
            distance: perpWallDist,
            texture: `wall${wallType}`,
            textureX: wallX,
            color: this.getWallColor(wallType),
            side: side,
            hit: hit
        };
    }
    
    /**
     * Obtiene el color de una pared según su tipo
     * @param {number} wallType - Tipo de pared
     * @returns {string} - Color en formato hexadecimal
     */
    getWallColor(wallType) {
        const colors = {
            1: '#FF0000', // Rojo
            2: '#00FF00', // Verde
            3: '#0000FF', // Azul
            4: '#FFFF00'  // Amarillo
        };
        return colors[wallType] || '#FFFFFF'; // Blanco por defecto
    }
} 