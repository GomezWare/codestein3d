/**
 * Clase que maneja la lógica del jugador, incluyendo
 * movimiento, rotación y colisiones.
 */

import { Projectile } from './Projectile.js';

export class Player {
    /**
     * Constructor de la clase Player
     * @param {number} x - Posición inicial en el eje X
     * @param {number} y - Posición inicial en el eje Y
     * @param {number} angle - Ángulo inicial de rotación (en radianes)
     */
    constructor(x, y, angle) {
        // Posición y orientación
        this.x = x;
        this.y = y;
        this.angle = angle;
        
        // Atributos del jugador
        this.health = 100;
        this.ammo = 30;
        
        // Velocidades de movimiento y rotación
        this.baseSpeed = 0.04;
        this.speed = this.baseSpeed;
        this.rotationSpeed = 0.05;

        // Sistema de disparo
        this.fireRate = 0.5; // Tiempo entre disparos en segundos
        this.lastShotTime = 0;
        this.canShoot = true;
        this.shootDebounce = 100; // Tiempo de debounce en ms

        // Animación de manos
        this.handsImages = [];
        for (let i = 0; i < 4; i++) {
            const img = new Image();
            img.src = `assets/sprites/hands${i}.png`;
            this.handsImages.push(img);
        }
        this.handsFrame = 0;
        this.handsFrameCount = 4;
        this.handsWidth = 512;
        this.handsHeight = 512;
        this.handsAnimationSpeed = 0.1;
        this.handsAnimationTime = 0;
        this.isShooting = false;
        this.lastAnimationUpdate = 0;

        // Efecto de flash rojo al recibir daño
        this.isFlashing = false;
        this.flashStartTime = 0;
        this.flashDuration = 200; // Duración del flash en ms
        this.flashAlpha = 0.5; // Intensidad del flash
    }
    
    /**
     * Actualiza el estado del jugador basado en las teclas presionadas
     * @param {Object} keys - Objeto con el estado de las teclas
     * @param {Map} map - Instancia del mapa para verificar colisiones
     * @param {number} currentTime - Tiempo actual del juego
     * @returns {boolean} - True si el jugador está muerto
     */
    update(keys, map, currentTime) {
        // Si el jugador está muerto, no procesar inputs
        if (this.health <= 0) {
            return true;
        }

        ///////////
        // Rotación
        ///////////

        if (keys['ArrowLeft']) {
            this.angle -= this.rotationSpeed;
        }
        if (keys['ArrowRight']) {
            this.angle += this.rotationSpeed;
        }
        
        ///////////
        // Movimiento
        ///////////
        
        // Resetear la velocidad a su valor base
        this.speed = this.baseSpeed;
        
        // Aplicar velocidad de correr si se mantiene Shift presionado
        if (keys['Shift']) {
            this.speed = this.baseSpeed * 2;
        }
        
        // Calcular nueva posición basada en el movimiento
        let newX = this.x;
        let newY = this.y;
        
        // Movimiento hacia adelante
        if (keys['ArrowUp']) {
            newX += Math.cos(this.angle) * this.speed;
            newY += Math.sin(this.angle) * this.speed;
        }
        
        // Movimiento hacia atrás
        if (keys['ArrowDown']) {
            newX -= Math.cos(this.angle) * this.speed;
            newY -= Math.sin(this.angle) * this.speed;
        }

        ///////////
        // Colisiones
        ///////////
        // Verificar colisiones en el eje X
        if (!map.isWall(Math.floor(newX), Math.floor(this.y))) {
            this.x = newX;
        }
        
        // Verificar colisiones en el eje Y
        if (!map.isWall(Math.floor(this.x), Math.floor(newY))) {
            this.y = newY;
        }

        // Actualizar animación de manos
        this.updateHandsAnimation(currentTime);

        return false;
    }

    /**
     * Actualiza la animación de las manos
     * @param {number} currentTime - Tiempo actual del juego
     */
    updateHandsAnimation(currentTime) {
        if (this.isShooting) {
            const deltaTime = currentTime - this.lastAnimationUpdate;
            this.lastAnimationUpdate = currentTime;
            
            this.handsAnimationTime += deltaTime;
            
            if (this.handsAnimationTime >= this.handsAnimationSpeed * 1000) {
                this.handsFrame++;
                this.handsAnimationTime = 0;
                
                if (this.handsFrame >= this.handsFrameCount) {
                    this.handsFrame = 0;
                    this.isShooting = false;
                }
            }
        }
    }

    /**
     * Dispara en la dirección que mira el jugador
     * @param {number} currentTime - Tiempo actual
     * @param {Map} map - Mapa actual
     * @param {Enemy[]} enemies - Array de enemigos
     * @returns {boolean} - True si se realizó el disparo
     */
    shoot(currentTime, map, enemies) {
        // Verificar cadencia de disparo
        if (currentTime - this.lastShotTime < this.fireRate * 1000) {
            return false;
        }
        if (this.ammo <= 0) {
            return false;
        }

        console.log('=== DISPARO DEL JUGADOR ===');
        console.log('Posición jugador:', this.x.toFixed(2), this.y.toFixed(2));
        console.log('Ángulo jugador:', (this.angle * 180 / Math.PI).toFixed(2), 'grados');
        console.log('Número de enemigos:', enemies.length);

        // Buscar el enemigo más cercano en la línea de visión
        const ray = map.castRay(this.x, this.y, this.angle);
        let hitEnemy = null;
        let closestDistance = ray.distance;

        console.log('Distancia a pared más cercana:', ray.distance.toFixed(2));

        for (const enemy of enemies) {
            if (!enemy.active) {
                console.log('Enemigo inactivo, saltando...');
                continue;
            }

            // Calcular ángulo al enemigo
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distanceToEnemy = Math.sqrt(dx * dx + dy * dy);
            const angleToEnemy = Math.atan2(dy, dx);
            
            console.log('Enemigo encontrado:');
            console.log('- Posición:', enemy.x.toFixed(2), enemy.y.toFixed(2));
            console.log('- Distancia:', distanceToEnemy.toFixed(2));
            
            // Verificar si el enemigo está en el campo de visión (+-15 grados)
            let angleDiff = angleToEnemy - this.angle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            console.log('- Ángulo diferencia:', (angleDiff * 180 / Math.PI).toFixed(2), 'grados');
            
            if (Math.abs(angleDiff) < Math.PI / 12 && distanceToEnemy < closestDistance) {
                // Verificar si hay pared entre el jugador y el enemigo
                const rayToEnemy = map.castRay(this.x, this.y, angleToEnemy);
                console.log('- Distancia a pared en dirección al enemigo:', rayToEnemy.distance.toFixed(2));
                
                if (rayToEnemy.distance >= distanceToEnemy) {
                    hitEnemy = enemy;
                    closestDistance = distanceToEnemy;
                    console.log('¡Enemigo en línea de visión!');
                } else {
                    console.log('Pared bloqueando al enemigo');
                }
            } else {
                console.log('Enemigo fuera del campo de visión');
            }
        }

        // Si golpeamos a un enemigo, hacerle daño
        if (hitEnemy) {
            console.log('¡Impacto! Haciendo daño:', this.damage);
            hitEnemy.takeDamage(25);
        } else {
            console.log('Disparo fallido - No hay enemigos en línea de visión');
        }

        // Actualizar estado del disparo
        this.ammo--;
        this.lastShotTime = currentTime;
        this.isShooting = true;
        this.handsFrame = 0;
        this.handsAnimationTime = 0;
        this.lastAnimationUpdate = currentTime;

        console.log('===========================');
        return true;
    }

    /**
     * Aplica daño al jugador
     * @param {number} damage - Cantidad de daño a aplicar
     */
    takeDamage(damage) {
        // Si ya está muerto, no procesar más daño
        if (this.health <= 0) return true;

        this.health -= damage;
        if (this.health < 0) {
            this.health = 0;
        }

        // Efecto de flash rojo al recibir daño
        this.isFlashing = true;
        this.flashStartTime = performance.now();

        // Retornar true si el jugador murió con este daño
        return this.health <= 0;
    }

    /**
     * Renderiza las manos y el arma del jugador
     * @param {CanvasRenderingContext2D} ctx - Contexto 2D del canvas
     */
    renderHands(ctx) {
        const handsImg = this.handsImages[this.handsFrame];
        if (handsImg && handsImg.complete) {
            const width = this.handsWidth;
            const height = this.handsHeight;
            const x = (ctx.canvas.width - width) / 2;
            const y = ctx.canvas.height - height;
            
            ctx.drawImage(handsImg, x, y, width, height);
        }
    }
} 