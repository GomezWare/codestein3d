/**
 * Clase simple para proyectiles
 */
export class Projectile {
    /**
     * Constructor de la clase Projectile
     * @param {number} x - Posición inicial en el eje X
     * @param {number} y - Posición inicial en el eje Y
     * @param {number} angle - Ángulo de disparo
     * @param {boolean} isEnemyProjectile - Si el proyectil es de un enemigo
     */
    constructor(x, y, angle, isEnemyProjectile = false) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = isEnemyProjectile ? 0.5 : 1.0; // Jugador más rápido que enemigos
        this.damage = isEnemyProjectile ? 10 : 25; // Jugador hace más daño
        this.active = true;
        this.isEnemyProjectile = isEnemyProjectile;
        
        // Color del proyectil
        this.color = isEnemyProjectile ? '#ff0000' : '#ffff00';
        this.glowColor = isEnemyProjectile ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 255, 0, 0.5)';
    }

    /**
     * Actualiza la posición del proyectil
     * @param {number} deltaTime - Tiempo transcurrido desde la última actualización
     * @returns {boolean} - True si el proyectil sigue activo, false si debe ser eliminado
     */
    update(deltaTime) {
        if (!this.active) return false;
        
        // Movimiento simple
        const moveDistance = this.speed * (deltaTime / 16); // Normalizado a 60fps
        this.x += Math.cos(this.angle) * moveDistance;
        this.y += Math.sin(this.angle) * moveDistance;
        
        return true;
    }

    /**
     * Renderiza el proyectil en el canvas 3D
     * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
     * @param {number} screenX - Posición X en la pantalla
     * @param {number} screenY - Posición Y en la pantalla
     * @param {number} height - Altura del proyectil en la pantalla
     */
    render(ctx, screenX, screenY, height) {
        // Tamaño base del proyectil
        const baseSize = height / 8;
        const size = this.isEnemyProjectile ? baseSize : baseSize * 1.5;
        
        // Efecto de brillo
        const gradient = ctx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, size
        );
        
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.6, this.glowColor);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        // Dibujar el brillo
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Dibujar el núcleo del proyectil
        ctx.fillStyle = this.color;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
} 