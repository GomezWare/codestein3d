/**
 * Sistema simple de proyectiles
 */
export class ProjectileManager {
    constructor() {
        this.projectiles = [];
        this.effects = [];
    }

    /**
     * Añade un nuevo proyectil al sistema
     * @param {Projectile} projectile - Proyectil a añadir
     */
    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }

    /**
     * Actualiza todos los proyectiles y sus efectos
     * @param {Map} map - Instancia del mapa para verificar colisiones
     * @param {Player} player - Instancia del jugador
     * @param {Enemy[]} enemies - Array de enemigos
     * @param {number} deltaTime - Tiempo transcurrido desde la última actualización
     */
    update(map, player, enemies, deltaTime) {
        // Actualizar proyectiles
        this.projectiles = this.projectiles.filter(projectile => {
            // Si está inactivo, eliminar
            if (!projectile.active) return false;

            // Actualizar posición
            projectile.update(deltaTime);

            // Verificar colisión con paredes
            if (map.isWall(Math.floor(projectile.x), Math.floor(projectile.y))) {
                this.createImpactEffect(projectile);
                return false;
            }

            // Verificar colisión con jugador
            if (projectile.isEnemyProjectile) {
                const dx = projectile.x - player.x;
                const dy = projectile.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 1.5) {
                    player.takeDamage(projectile.damage);
                    this.createImpactEffect(projectile);
                    return false;
                }
            }

            // Verificar colisión con enemigos
            if (!projectile.isEnemyProjectile) {
                for (const enemy of enemies) {
                    if (!enemy.active) continue;
                    
                    const dx = projectile.x - enemy.x;
                    const dy = projectile.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 1.5) {
                        console.log('¡Impacto! Distancia:', distance, 'Daño:', projectile.damage);
                        enemy.takeDamage(projectile.damage);
                        this.createImpactEffect(projectile);
                        return false;
                    }
                }
            }

            return true;
        });

        // Actualizar efectos
        this.effects = this.effects.filter(effect => {
            effect.currentTime += deltaTime;
            return effect.currentTime < effect.lifetime;
        });
    }

    /**
     * Crea un efecto de impacto
     * @param {Projectile} projectile - Proyectil que impactó
     */
    createImpactEffect(projectile) {
        this.effects.push({
            x: projectile.x,
            y: projectile.y,
            angle: projectile.angle,
            lifetime: 300, // 300ms
            currentTime: 0
        });
    }

    /**
     * Renderiza todos los proyectiles y efectos
     * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
     * @param {Player} player - Instancia del jugador
     */
    render(ctx, player) {
        // Renderizar proyectiles
        this.projectiles.forEach(projectile => {
            const dx = projectile.x - player.x;
            const dy = projectile.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) - player.angle;
            
            let normalizedAngle = angle;
            while (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
            while (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;
            
            if (Math.abs(normalizedAngle) < Math.PI / 2) {
                const screenX = (normalizedAngle / (Math.PI / 2)) * (ctx.canvas.width / 2) + ctx.canvas.width / 2;
                const height = ctx.canvas.height / distance;
                const screenY = (ctx.canvas.height - height) / 2;
                
                projectile.render(ctx, screenX, screenY, height);
            }
        });

        // Renderizar efectos de impacto
        this.effects.forEach(effect => {
            const dx = effect.x - player.x;
            const dy = effect.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) - player.angle;
            
            let normalizedAngle = angle;
            while (normalizedAngle > Math.PI) normalizedAngle -= 2 * Math.PI;
            while (normalizedAngle < -Math.PI) normalizedAngle += 2 * Math.PI;
            
            if (Math.abs(normalizedAngle) < Math.PI / 2) {
                const screenX = (normalizedAngle / (Math.PI / 2)) * (ctx.canvas.width / 2) + ctx.canvas.width / 2;
                const height = ctx.canvas.height / distance;
                const screenY = (ctx.canvas.height - height) / 2;
                
                // Efecto de impacto más grande y visible
                const alpha = 1 - (effect.currentTime / effect.lifetime);
                ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenX, screenY, height / 5, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
} 