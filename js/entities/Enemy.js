import { Projectile } from './Projectile.js';

/**
 * Clase que maneja la lógica de los enemigos
 */
export class Enemy {
    /**
     * Constructor de la clase Enemy
     * @param {number} x - Posición inicial en el eje X
     * @param {number} y - Posición inicial en el eje Y
     * @param {number} angle - Ángulo inicial de rotación
     * @param {number} health - Salud inicial del enemigo
     * @param {number} speed - Velocidad de movimiento
     * @param {number} damage - Daño que causa el enemigo
     */
    constructor(x, y, angle, health = 100, speed = 0.02, damage = 10) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.health = health;
        this.speed = speed;
        this.damage = damage;
        this.active = true;
        this.deathSoundPlayed = false;
        
        // Estado del enemigo
        this.state = 'patrol'; // patrol, chase, attack
        this.lastStateChange = 0;
        this.stateCooldown = 1000; // ms
        
        // Sistema de disparo
        this.fireRate = 1.5; // Tiempo entre disparos en segundos
        this.lastShotTime = 0;
        this.canShoot = true;
        
        // Detección del jugador
        this.detectionRange = 5;
        this.attackRange = 3;
        
        // Animaciones
        this.animationFrames = [];
        this.currentFrame = 0;
        this.frameCount = 4;
        this.walkFrames = [0, 1]; // Frames para caminar
        this.attackFrame = 2; // Frame para atacar
        this.deathFrame = 3; // Frame para muerte
        this.animationSpeed = 0.1;
        this.lastAnimationUpdate = 0;
        this.animationTime = 0;
        this.baseAnimationSpeed = 0.1;
        
        // Cargar sprites de animación
        this.loadSprites();
    }
    
    /**
     * Carga los sprites de animación del enemigo
     */
    loadSprites() {
        for (let i = 0; i < this.frameCount; i++) {
            const img = new Image();
            img.src = `assets/sprites/enemy${i}.png`;
            this.animationFrames.push(img);
        }
    }
    
    /**
     * Actualiza el estado del enemigo
     * @param {Player} player - Instancia del jugador
     * @param {Map} map - Instancia del mapa
     * @param {number} currentTime - Tiempo actual del juego
     * @returns {Projectile|null} - El proyectil disparado o null si no disparó
     */
    update(player, map, currentTime) {
        // Si el enemigo está muerto, solo actualizar la animación para mantener el frame de muerte
        if (!this.active) {
            this.updateAnimation(currentTime);
            return null;
        }
        
        // Actualizar estado según la distancia al jugador y línea de visión
        const distanceToPlayer = this.calculateDistance(player);
        const hasSight = this.hasLineOfSight(player, map);
        
        if (distanceToPlayer <= this.attackRange && hasSight) {
            this.setState('attack', currentTime);
        } else if (distanceToPlayer <= this.detectionRange && hasSight) {
            this.setState('chase', currentTime);
        } else {
            this.setState('patrol', currentTime);
        }
        
        // Ejecutar comportamiento según el estado
        let projectile = null;
        switch (this.state) {
            case 'patrol':
                this.patrol(map, currentTime);
                break;
            case 'chase':
                this.chase(player, map);
                break;
            case 'attack':
                projectile = this.attack(player, map, currentTime);
                break;
        }
        
        // Actualizar animación
        this.updateAnimation(currentTime);
        
        return projectile;
    }
    
    /**
     * Calcula la distancia al jugador
     * @param {Player} player - Instancia del jugador
     * @returns {number} - Distancia al jugador
     */
    calculateDistance(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Verifica si hay línea de visión directa con el jugador
     * @param {Player} player - Instancia del jugador
     * @param {Map} map - Instancia del mapa
     * @returns {boolean} - True si hay línea de visión directa
     */
    hasLineOfSight(player, map) {
        const ray = map.castRay(this.x, this.y, Math.atan2(player.y - this.y, player.x - this.x));
        return !ray.hit || ray.distance >= this.calculateDistance(player);
    }
    
    /**
     * Cambia el estado del enemigo
     * @param {string} newState - Nuevo estado
     * @param {number} currentTime - Tiempo actual
     */
    setState(newState, currentTime) {
        if (this.state !== newState && currentTime - this.lastStateChange >= this.stateCooldown) {
            this.state = newState;
            this.lastStateChange = currentTime;
        }
    }
    
    /**
     * Comportamiento de patrulla
     * @param {Map} map - Instancia del mapa
     * @param {number} currentTime - Tiempo actual
     */
    patrol(map, currentTime) {
        // Cambiar dirección cada cierto tiempo
        if (currentTime % 5000 < 100) {
            this.angle = Math.random() * Math.PI * 2;
        }
        
        // Mover en la dirección actual
        const newX = this.x + Math.cos(this.angle) * this.speed;
        const newY = this.y + Math.sin(this.angle) * this.speed;
        
        // Verificar colisiones en ambas direcciones
        const canMoveX = !map.isWall(Math.floor(newX), Math.floor(this.y));
        const canMoveY = !map.isWall(Math.floor(this.x), Math.floor(newY));
        
        if (canMoveX && canMoveY) {
            // Si no hay colisión en ninguna dirección, mover en ambas
            this.x = newX;
            this.y = newY;
        } else if (canMoveX) {
            // Si solo se puede mover en X
            this.x = newX;
        } else if (canMoveY) {
            // Si solo se puede mover en Y
            this.y = newY;
        } else {
            // Si hay colisión en ambas direcciones, cambiar de dirección
            this.angle = Math.random() * Math.PI * 2;
        }
    }
    
    /**
     * Comportamiento de persecución
     * @param {Player} player - Instancia del jugador
     * @param {Map} map - Instancia del mapa
     */
    chase(player, map) {
        // Calcular ángulo hacia el jugador
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.angle = Math.atan2(dy, dx);
        
        // Intentar moverse directamente hacia el jugador
        const newX = this.x + Math.cos(this.angle) * this.speed;
        const newY = this.y + Math.sin(this.angle) * this.speed;
        
        // Verificar colisiones en ambas direcciones
        const canMoveX = !map.isWall(Math.floor(newX), Math.floor(this.y));
        const canMoveY = !map.isWall(Math.floor(this.x), Math.floor(newY));
        
        if (canMoveX && canMoveY) {
            // Si no hay colisión en ninguna dirección, mover en ambas
            this.x = newX;
            this.y = newY;
        } else if (canMoveX) {
            // Si solo se puede mover en X
            this.x = newX;
        } else if (canMoveY) {
            // Si solo se puede mover en Y
            this.y = newY;
        }
    }
    
    /**
     * Comportamiento de ataque
     * @param {Player} player - Instancia del jugador
     * @param {Map} map - Instancia del mapa
     * @param {number} currentTime - Tiempo actual
     */
    attack(player, map, currentTime) {
        // Calcular ángulo hacia el jugador
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.angle = Math.atan2(dy, dx);
        
        // Solo atacar si hay línea de visión directa y ha pasado el tiempo suficiente
        if (this.hasLineOfSight(player, map)) {
            const timeSinceLastShot = currentTime - this.lastShotTime;
            if (timeSinceLastShot >= this.fireRate * 1000) {
                player.takeDamage(this.damage);
                this.lastShotTime = currentTime;
                this.currentFrame = this.attackFrame; // Cambiar al frame de ataque inmediatamente
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Actualiza la animación del enemigo
     * @param {number} currentTime - Tiempo actual
     */
    updateAnimation(currentTime) {
        const deltaTime = (currentTime - this.lastAnimationUpdate) / 1000; // Convertir a segundos
        this.lastAnimationUpdate = currentTime;
        
        // Si el enemigo está muerto, mostrar frame de muerte
        if (!this.active) {
            this.currentFrame = this.deathFrame;
            return;
        }
        
        // Ajustar velocidad y frames según el estado
        switch (this.state) {
            case 'attack':
                // Mostrar frame de ataque solo durante 100ms después del disparo
                const timeSinceLastShot = currentTime - this.lastShotTime;
                if (timeSinceLastShot > 100) { // 100ms para mostrar el frame de ataque
                    this.currentFrame = 0; // Volver al frame de reposo
                }
                break;
            case 'chase':
            case 'patrol':
                this.animationSpeed = this.state === 'chase' ? 
                    this.baseAnimationSpeed * 1.5 : // Más rápido cuando persigue
                    this.baseAnimationSpeed;        // Velocidad normal en patrulla
                
                this.animationTime += deltaTime;
                
                if (this.animationTime >= this.animationSpeed) {
                    // Alternar entre los frames de caminar (0 y 1)
                    this.currentFrame = this.walkFrames[
                        (this.walkFrames.indexOf(this.currentFrame) + 1) % this.walkFrames.length
                    ];
                    this.animationTime = 0;
                }
                break;
        }
    }
    
    /**
     * Recibe daño de un proyectil
     * @param {number} damage - Cantidad de daño recibido
     */
    takeDamage(damage) {
        console.log('=== ENEMIGO RECIBIÓ DAÑO ===');
        console.log('Daño recibido:', damage);
        console.log('Salud antes del daño:', this.health);
        console.log('Posición del enemigo:', this.x.toFixed(2), this.y.toFixed(2));
        
        this.health -= damage;
        
        console.log('Nueva salud:', this.health);
        if (this.health <= 0) {
            console.log('¡ENEMIGO DERROTADO!');
            this.active = false;
        }
        console.log('===========================');
    }
    
    /**
     * Renderiza el enemigo en el canvas 3D
     * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
     * @param {Player} player - Instancia del jugador
     * @param {Map} map - Instancia del mapa
     */
    render(ctx, player, map) {
        // Calcular la posición relativa del enemigo respecto al jugador
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        
        // Calcular la distancia euclidiana
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calcular el ángulo entre el jugador y el enemigo
        const angleToPlayer = Math.atan2(dy, dx);
        
        // Calcular el ángulo relativo a la dirección de vista del jugador
        let relativeAngle = angleToPlayer - player.angle;
        
        // Normalizar el ángulo entre -PI y PI
        while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
        while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;
        
        // Campo de visión (FOV) de 60 grados en radianes
        const fov = Math.PI / 3;
        
        // Verificar si el enemigo está dentro del campo de visión
        if (Math.abs(relativeAngle) < fov / 2) {
            // Verificar si hay paredes entre el jugador y el enemigo
            const rayToEnemy = map.castRay(player.x, player.y, angleToPlayer);
            
            if (distance < rayToEnemy.distance || !rayToEnemy.hit) {
                const width = ctx.canvas.width;
                const height = ctx.canvas.height;
                
                // Calcular la posición en pantalla
                const screenX = width / 2 + Math.tan(relativeAngle) * (width / 2);
                
                // Calcular el tamaño del sprite
                const spriteSize = Math.min(height, (height / distance) * 0.8);
                
                // Calcular las coordenadas de dibujo
                const drawX = screenX - spriteSize / 2;
                const drawY = (height - spriteSize) / 2;
                
                // Renderizar el sprite
                const sprite = this.animationFrames[this.currentFrame];
                if (sprite && sprite.complete) {
                    // Aplicar efecto de oscurecimiento basado en la distancia
                    ctx.save();
                    const darkness = Math.min(distance / 8, 0.7);
                    ctx.globalAlpha = 1 - darkness;
                    
                    // Dibujar el sprite
                    ctx.drawImage(
                        sprite,
                        drawX, drawY,
                        spriteSize, spriteSize
                    );
                    
                    ctx.restore();
                }
            }
        }
    }
} 