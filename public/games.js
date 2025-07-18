// 30 Popular Arcade Games - Chaos Conductor
// Each game lasts 15 seconds, first to finish wins

class GameEngine {
    constructor() {
        this.currentGame = null;
        this.gameStartTime = null;
        this.gameTimer = null;
        this.canvas = null;
        this.ctx = null;
        this.gameData = {};
        this.isGameActive = false;
        this.keys = {};
        this.animationFrame = null;
    }

    initCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            // IMPROVED CANVAS SIZE - Better visuals (smaller for chat visibility)
            this.canvas.width = 640;
            this.canvas.height = 480;
            
            // Add modern styling
            this.canvas.style.border = '2px solid #4CAF50';
            this.canvas.style.borderRadius = '10px';
            this.canvas.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            this.canvas.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
        }
    }

    startGame(gameType, onComplete) {
        this.currentGame = gameType;
        this.gameStartTime = Date.now();
        this.isGameActive = true;
        this.onComplete = onComplete;
        
        this.initCanvas();
        this.clearCanvas();
        this.setupKeyListeners();
        
        // 15 saniyelik otomatik timer başlat
        this.startGameTimer();
        
        // Start game by type
        switch (gameType) {
            case 'asteroid-shooter': this.startAsteroidShooter(); break;
            case 'dxball-breakout': this.startDXBallBreakout(); break;
            case 'snake-classic': this.startSnakeClassic(); break;
            case 'tetris-blocks': this.startTetrisBlocks(); break;
            case 'pac-man-dots': this.startPacManDots(); break;
            case 'space-invaders': this.startSpaceInvaders(); break;
            case 'frogger-cross': this.startFroggerCross(); break;
            case 'centipede-shoot': this.startCentipedeShoot(); break;
            case 'missile-command': this.startMissileCommand(); break;
            case 'defender-ship': this.startDefenderShip(); break;
            case 'galaga-fighter': this.startGalagaFighter(); break;
            case 'dig-dug': this.startDigDug(); break;
            case 'qbert-jump': this.startQBertJump(); break;
            case 'donkey-kong': this.startDonkeyKong(); break;
            case 'mario-jump': this.startMarioJump(); break;
            case 'sonic-run': this.startSonicRun(); break;
            case 'bubble-shooter': this.startBubbleShooter(); break;
            case 'zuma-balls': this.startZumaBalls(); break;
            case 'bejeweled-match': this.startBejeweledMatch(); break;
            case 'candy-crush': this.startCandyCrush(); break;
            case 'fruit-ninja': this.startFruitNinja(); break;
            case 'angry-birds': this.startAngryBirds(); break;
            case 'flappy-bird': this.startFlappyBird(); break;
            case 'doodle-jump': this.startDoodleJump(); break;
            case 'temple-run': this.startTempleRun(); break;
            case 'subway-surfers': this.startSubwaySurfers(); break;
            case 'crossy-road': this.startCrossyRoad(); break;
            case 'piano-tiles': this.startPianoTiles(); break;
            case '2048-merge': this.start2048Merge(); break;
            case 'color-switch': this.startColorSwitch(); break;
            default: this.startSimpleClickTest(); break;
        }
    }

    startGameTimer() {
        // Önceki timer'ı temizle
        if (this.gameTimeoutTimer) {
            clearTimeout(this.gameTimeoutTimer);
            console.log('🧹 Cleared existing game timeout timer');
        }
        
        // ENHANCED 30 saniyelik timer - GÜÇLÜ OTOMATIK GEÇİŞ
        const startTime = Date.now();
        this.gameTimeoutTimer = setTimeout(() => {
            const actualDuration = Date.now() - startTime;
            console.log(`⏰ Game Engine timer fired after ${actualDuration}ms`);
            
            if (this.isGameActive) {
                console.log('⏰ Game timed out after 30 seconds - FORCED AUTO TRANSITION');
                // Otomatik geçiş için success=false, score=current score
                const currentScore = this.gameData.score || 0;
                console.log(`📊 Preserving current score for auto-transition: ${currentScore}`);
                this.completeGame(false, currentScore); // Zaman doldu, mevcut skorla geçiş
            } else {
                console.log('⚠️ Game already inactive, skipping timeout');
            }
        }, 30000); // 30 saniye
        
        console.log(`🎮 Enhanced Game timer started: 30000ms at ${startTime} (auto-transition enabled)`);
    }

    clearCanvas() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // MODERN GRADIENT BACKGROUND
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Add subtle pattern
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            for (let i = 0; i < this.canvas.width; i += 40) {
                for (let j = 0; j < this.canvas.height; j += 40) {
                    this.ctx.fillRect(i, j, 2, 2);
                }
            }
        }
    }

    setupKeyListeners() {
        // Remove existing listeners first
        if (this.keyDownHandler) {
            document.removeEventListener('keydown', this.keyDownHandler);
        }
        if (this.keyUpHandler) {
            document.removeEventListener('keyup', this.keyUpHandler);
        }
        
        // Create new handlers
        this.keyDownHandler = (e) => {
            if (this.isGameActive) {
                this.keys[e.key] = true;
                this.keys[e.code] = true;
                e.preventDefault(); // Prevent default browser behavior
            }
        };
        
        this.keyUpHandler = (e) => {
            if (this.isGameActive) {
                this.keys[e.key] = false;
                this.keys[e.code] = false;
                e.preventDefault();
            }
        };
        
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
    }

    completeGame(success, score) {
        if (!this.isGameActive) return;
        
        this.isGameActive = false;
        const timeElapsed = Date.now() - this.gameStartTime;
        
        console.log(`Game completed: success=${success}, score=${score}, time=${timeElapsed}ms`);
        
        // Stop animation loop
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // Clear all timers
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        
        // Clear 15-second timeout timer
        if (this.gameTimeoutTimer) {
            clearTimeout(this.gameTimeoutTimer);
            this.gameTimeoutTimer = null;
        }
        
        // Add score to leaderboard
        if (success && score > 0) {
            this.updateLeaderboard(score, success);
        }
        
        if (this.onComplete) {
            this.onComplete(success, score, timeElapsed);
        }
        
        this.cleanup();
    }

    updateLeaderboard(score, gameResult) {
        try {
            // Get active user address
            const userAddress = window.userAddress || localStorage.getItem('userAddress');
            
            if (userAddress && window.leaderboardManager) {
                const result = gameResult === true ? 'win' : 'lose';
                window.leaderboardManager.updatePlayerScore(userAddress, score, result);
                
                // Show user's new ranking
                setTimeout(() => {
                    const newRank = window.leaderboardManager.getPlayerRank(userAddress);
                    if (newRank) {
                        this.showRankUpdate(newRank, score);
                    }
                }, 500);
            }
        } catch (error) {
            console.error('Error updating leaderboard:', error);
        }
    }

    showRankUpdate(rank, score) {
        // Show ranking update after game completion
        if (this.ctx) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🏆 Ranking Updated!', this.canvas.width / 2, 250);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Your New Rank: #${rank}`, this.canvas.width / 2, 300);
            this.ctx.fillText(`Points Earned: +${score} CP`, this.canvas.width / 2, 330);
            
            this.ctx.textAlign = 'left';
        }
    }

    cleanup() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        // 15 saniyelik timeout timer'ını temizle
        if (this.gameTimeoutTimer) {
            clearTimeout(this.gameTimeoutTimer);
            this.gameTimeoutTimer = null;
        }
        
        // Clean up key listeners
        if (this.keyDownHandler) {
            document.removeEventListener('keydown', this.keyDownHandler);
            this.keyDownHandler = null;
        }
        if (this.keyUpHandler) {
            document.removeEventListener('keyup', this.keyUpHandler);
            this.keyUpHandler = null;
        }
        
        // Clean up canvas listeners
        if (this.canvas && this.canvasClickHandler) {
            this.canvas.removeEventListener('click', this.canvasClickHandler);
            this.canvasClickHandler = null;
        }
        
        // OPTIMIZED - Reset frame timing
        this.lastFrameTime = null;
        this.gameData = {};
        this.currentGame = null;
        this.keys = {};
        
        console.log('🧹 Game cleanup completed - ready for next game');
    }

    // Helper function to darken colors for gradient effect
    darkenColor(color) {
        // Simple color darkening for gradient effect
        const colorMap = {
            '#FF0000': '#CC0000', // Red -> Dark Red
            '#00FF00': '#00CC00', // Green -> Dark Green
            '#0000FF': '#0000CC', // Blue -> Dark Blue
            '#FFFF00': '#CCCC00', // Yellow -> Dark Yellow
            '#FF00FF': '#CC00CC', // Magenta -> Dark Magenta
            '#00FFFF': '#00CCCC'  // Cyan -> Dark Cyan
        };
        return colorMap[color] || '#666666';
    }

    // GAME 1: ASTEROID SHOOTER
    startAsteroidShooter() {
        this.gameData = {
            ship: { x: 400, y: 500, angle: 0, vx: 0, vy: 0 },
            bullets: [],
            asteroids: [],
            score: 0,
            lives: 3
        };

        // Create asteroids
        for (let i = 0; i < 5; i++) {
            this.gameData.asteroids.push({
                x: Math.random() * 800,
                y: Math.random() * 300,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: 30 + Math.random() * 20,
                angle: 0
            });
        }

        this.setupCanvasListeners();
        this.gameLoop();
    }

    setupCanvasListeners() {
        if (this.canvas) {
            // Remove existing click listener
            if (this.canvasClickHandler) {
                this.canvas.removeEventListener('click', this.canvasClickHandler);
            }
            
            // Add new click listener based on game type
            this.canvasClickHandler = (e) => {
                if (!this.isGameActive) return;
                
                switch (this.currentGame) {
                    case 'asteroid-shooter':
                        // Handle asteroid shooter clicks (for shooting)
                        this.keys[' '] = true;
                        setTimeout(() => { this.keys[' '] = false; }, 100);
                        break;
                    default:
                        // Handle simple click test
                        this.handleSimpleClickTest(e);
                        break;
                }
            };
            
            this.canvas.addEventListener('click', this.canvasClickHandler);
        }
    }

    gameLoop() {
        if (!this.isGameActive) return;

        // OPTIMIZED GAME LOOP - 60 FPS target with frame skipping
        const now = Date.now();
        if (!this.lastFrameTime) this.lastFrameTime = now;
        const deltaTime = now - this.lastFrameTime;
        
        // Target 60 FPS (16.67ms per frame) but allow frame skipping for performance
        if (deltaTime >= 16) {
            this.lastFrameTime = now;
            
            // Update and draw based on current game
            // Update and draw based on current game
            switch (this.currentGame) {
                case 'tetris-blocks':
                    this.updateTetris();
                    this.drawTetris();
                    break;
                case 'snake-classic':
                    // Breakout Classic game
                    this.updateSnake();
                    this.drawSnake();
                    break;
                case 'dxball-breakout':
                    this.updateDXBallBreakout();
                    this.drawDXBallBreakout();
                    break;
                case 'flappy-bird':
                    this.updateFlappyBird();
                    this.drawFlappyBird();
                    break;
                case 'pac-man-dots':
                    this.updatePacManDots();
                    this.drawPacManDots();
                    break;
                case 'space-invaders':
                    this.updateSpaceInvaders();
                    this.drawSpaceInvaders();
                    break;
                case 'bubble-shooter':
                    this.updateBubbleShooter();
                    this.drawBubbleShooter();
                    break;
                default:
                    return;
            }
        }

        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }

    updateAsteroidShooter() {
        const ship = this.gameData.ship;

        // Ship controls
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            ship.angle -= 0.2;
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            ship.angle += 0.2;
        }
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            ship.vx += Math.cos(ship.angle) * 0.5;
            ship.vy += Math.sin(ship.angle) * 0.5;
        }
        if (this.keys[' '] || this.keys['Space']) {
            this.shootBullet();
        }

        // Update ship position
        ship.x += ship.vx;
        ship.y += ship.vy;
        ship.vx *= 0.99;
        ship.vy *= 0.99;

        // Wrap around screen
        if (ship.x < 0) ship.x = 640;
        if (ship.x > 640) ship.x = 0;
        if (ship.y < 0) ship.y = 480;
        if (ship.y > 480) ship.y = 0;

        // Update bullets
        this.gameData.bullets.forEach((bullet, index) => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;

            if (bullet.life <= 0 || bullet.x < 0 || bullet.x > 640 || bullet.y < 0 || bullet.y > 480) {
                this.gameData.bullets.splice(index, 1);
            }
        });

        // Update asteroids
        this.gameData.asteroids.forEach(asteroid => {
            asteroid.x += asteroid.vx;
            asteroid.y += asteroid.vy;
            asteroid.angle += 0.02;

            // Wrap around screen
            if (asteroid.x < 0) asteroid.x = 640;
            if (asteroid.x > 640) asteroid.x = 0;
            if (asteroid.y < 0) asteroid.y = 480;
            if (asteroid.y > 480) asteroid.y = 0;
        });

        // Check collisions
        this.checkAsteroidCollisions();

        // Win condition
        if (this.gameData.asteroids.length === 0) {
            this.completeGame(true, this.gameData.score + 100);
        }
    }

    shootBullet() {
        const ship = this.gameData.ship;
        if (this.gameData.bullets.length < 4) {
            this.gameData.bullets.push({
                x: ship.x,
                y: ship.y,
                vx: Math.cos(ship.angle) * 8,
                vy: Math.sin(ship.angle) * 8,
                life: 60
            });
        }
    }

    checkAsteroidCollisions() {
        // Bullet-asteroid collisions
        this.gameData.bullets.forEach((bullet, bulletIndex) => {
            this.gameData.asteroids.forEach((asteroid, asteroidIndex) => {
                const dx = bullet.x - asteroid.x;
                const dy = bullet.y - asteroid.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < asteroid.size) {
                    this.gameData.bullets.splice(bulletIndex, 1);
                    this.gameData.asteroids.splice(asteroidIndex, 1);
                    this.gameData.score += 10;
                }
            });
        });
    }

    drawAsteroidShooter() {
        this.clearCanvas();

        // Draw ship
        const ship = this.gameData.ship;
        this.ctx.save();
        this.ctx.translate(ship.x, ship.y);
        this.ctx.rotate(ship.angle);
        this.ctx.fillStyle = '#00FF00';
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(-10, -8);
        this.ctx.lineTo(-5, 0);
        this.ctx.lineTo(-10, 8);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();

        // Draw bullets
        this.ctx.fillStyle = '#FFFF00';
        this.gameData.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw asteroids
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.gameData.asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.angle);
            this.ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const radius = asteroid.size * (0.8 + Math.sin(i) * 0.2);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.stroke();
            this.ctx.restore();
        });

        // Draw UI
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.gameData.score}`, 20, 30);
        this.ctx.fillText(`Asteroids: ${this.gameData.asteroids.length}`, 20, 60);
    }

    // GAME 2: DX-BALL BREAKOUT
    startDXBallBreakout() {
        this.gameData = {
            paddle: { x: 350, y: 550, width: 100, height: 20 },
            ball: { x: 400, y: 300, vx: 4, vy: 4, radius: 8 },
            bricks: [],
            score: 0
        };

        // Create bricks
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 10; col++) {
                this.gameData.bricks.push({
                    x: col * 80 + 10,
                    y: row * 30 + 50,
                    width: 70,
                    height: 25,
                    color: `hsl(${row * 60}, 70%, 60%)`
                });
            }
        }

        this.setupCanvasListeners();
        this.gameLoop();
    }

    updateDXBallBreakout() {
        const paddle = this.gameData.paddle;
        const ball = this.gameData.ball;

        // Paddle controls
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            paddle.x = Math.max(0, paddle.x - 8);
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            paddle.x = Math.min(700, paddle.x + 8);
        }

        // Ball movement
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Ball collision with walls
        if (ball.x <= ball.radius || ball.x >= 640 - ball.radius) {
            ball.vx = -ball.vx;
        }
        if (ball.y <= ball.radius) {
            ball.vy = -ball.vy;
        }

        // Ball collision with paddle
        if (ball.y + ball.radius >= paddle.y &&
            ball.x >= paddle.x && ball.x <= paddle.x + paddle.width) {
            ball.vy = -Math.abs(ball.vy);
            ball.vx += (ball.x - (paddle.x + paddle.width / 2)) * 0.1;
        }

        // Ball collision with bricks
        this.gameData.bricks.forEach((brick, index) => {
            if (ball.x >= brick.x && ball.x <= brick.x + brick.width &&
                ball.y >= brick.y && ball.y <= brick.y + brick.height) {
                this.gameData.bricks.splice(index, 1);
                ball.vy = -ball.vy;
                this.gameData.score += 10;
            }
        });

        // Win condition
        if (this.gameData.bricks.length === 0) {
            this.completeGame(true, this.gameData.score + 200);
        }

        // Lose condition
        if (ball.y > 480) {
            this.completeGame(false, 0);
        }
    }

    drawDXBallBreakout() {
        this.clearCanvas();

        // Draw paddle
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(this.gameData.paddle.x, this.gameData.paddle.y, 
                         this.gameData.paddle.width, this.gameData.paddle.height);

        // Draw ball
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(this.gameData.ball.x, this.gameData.ball.y, this.gameData.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw bricks
        this.gameData.bricks.forEach(brick => {
            this.ctx.fillStyle = brick.color;
            this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        });

        // Draw UI
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.gameData.score}`, 20, 30);
        this.ctx.fillText(`Bricks: ${this.gameData.bricks.length}`, 20, 60);
    }

    // GAME 3: BREAKOUT CLASSIC (Snake yerine daha eğlenceli)
    startSnakeClassic() {
        this.gameData = {
            paddle: { x: 300, y: 450, width: 80, height: 15, speed: 8 },
            ball: { x: 320, y: 300, vx: 4, vy: -4, radius: 8 },
            bricks: [],
            score: 0,
            lives: 3,
            bricksDestroyed: 0,
            totalBricks: 0
        };

        // Create colorful bricks - OPTIMIZED for 15-second games
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
        for (let row = 0; row < 4; row++) { // Only 4 rows for faster completion
            for (let col = 0; col < 8; col++) { // 8 columns
                this.gameData.bricks.push({
                    x: col * 80 + 10,
                    y: row * 25 + 50,
                    width: 75,
                    height: 20,
                    color: colors[row % colors.length],
                    destroyed: false
                });
                this.gameData.totalBricks++;
            }
        }

        this.setupCanvasListeners();
        this.gameLoop();
    }

    updateSnake() {
        // BREAKOUT UPDATE LOGIC
        if (!this.gameData || !this.gameData.paddle || !this.gameData.ball) {
            console.warn('Breakout game data not properly initialized');
            return;
        }

        const paddle = this.gameData.paddle;
        const ball = this.gameData.ball;

        // Paddle controls - IMPROVED responsiveness
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            paddle.x = Math.max(0, paddle.x - paddle.speed);
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            paddle.x = Math.min(this.canvas.width - paddle.width, paddle.x + paddle.speed);
        }

        // Ball movement
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Ball collision with walls
        if (ball.x <= ball.radius || ball.x >= this.canvas.width - ball.radius) {
            ball.vx = -ball.vx;
        }
        if (ball.y <= ball.radius) {
            ball.vy = -ball.vy;
        }

        // Ball collision with paddle
        if (ball.y + ball.radius >= paddle.y &&
            ball.x >= paddle.x && ball.x <= paddle.x + paddle.width &&
            ball.vy > 0) {
            ball.vy = -Math.abs(ball.vy);
            // Add spin based on where ball hits paddle
            const hitPos = (ball.x - paddle.x) / paddle.width;
            ball.vx += (hitPos - 0.5) * 3;
            // Limit ball speed
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            if (speed > 8) {
                ball.vx = (ball.vx / speed) * 8;
                ball.vy = (ball.vy / speed) * 8;
            }
        }

        // Ball collision with bricks
        this.gameData.bricks.forEach((brick, index) => {
            if (!brick.destroyed &&
                ball.x + ball.radius >= brick.x && ball.x - ball.radius <= brick.x + brick.width &&
                ball.y + ball.radius >= brick.y && ball.y - ball.radius <= brick.y + brick.height) {
                
                brick.destroyed = true;
                this.gameData.bricksDestroyed++;
                this.gameData.score += 10;
                ball.vy = -ball.vy;
                
                // Win condition: destroy 80% of bricks
                if (this.gameData.bricksDestroyed >= Math.floor(this.gameData.totalBricks * 0.8)) {
                    this.completeGame(true, this.gameData.score + 200);
                    return;
                }
            }
        });

        // Ball falls below paddle - lose condition
        if (ball.y > this.canvas.height) {
            this.gameData.lives--;
            if (this.gameData.lives <= 0) {
                this.completeGame(false, this.gameData.score);
            } else {
                // Reset ball position
                ball.x = 320;
                ball.y = 300;
                ball.vx = 4;
                ball.vy = -4;
            }
        }
    }

    spawnFood() {
        // Not needed for Breakout
    }

    drawSnake() {
        // BREAKOUT DRAW LOGIC
        this.clearCanvas();

        if (!this.gameData || !this.gameData.paddle || !this.gameData.ball) {
            return;
        }

        const paddle = this.gameData.paddle;
        const ball = this.gameData.ball;

        // Draw paddle with gradient
        const paddleGradient = this.ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
        paddleGradient.addColorStop(0, '#00FF00');
        paddleGradient.addColorStop(1, '#008800');
        this.ctx.fillStyle = paddleGradient;
        this.ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

        // Draw ball with glow effect
        const ballGradient = this.ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius);
        ballGradient.addColorStop(0, '#FFFFFF');
        ballGradient.addColorStop(1, '#CCCCCC');
        this.ctx.fillStyle = ballGradient;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw bricks with gradients
        this.gameData.bricks.forEach(brick => {
            if (!brick.destroyed) {
                const brickGradient = this.ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
                brickGradient.addColorStop(0, brick.color);
                brickGradient.addColorStop(1, this.darkenColor(brick.color));
                
                this.ctx.fillStyle = brickGradient;
                this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                
                // Brick border
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
            }
        });

        // Draw UI
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.gameData.score}`, 20, 30);
        this.ctx.fillText(`Lives: ${this.gameData.lives}`, 20, 60);
        this.ctx.fillText(`Bricks: ${this.gameData.bricksDestroyed}/${this.gameData.totalBricks}`, 20, 90);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('← → Move paddle', 450, 450);
        this.ctx.fillText('Destroy 80% of bricks to win!', 450, 470);
    }

    // REAL PLAYABLE GAMES
    startTetrisBlocks() {
        this.gameData = {
            board: Array(20).fill().map(() => Array(10).fill(0)),
            currentPiece: null,
            currentX: 4,
            currentY: 0,
            score: 0,
            lines: 0,
            dropTime: 0,
            dropInterval: 500 // OPTIMIZED - Faster drop for 15-second games
        };
        
        this.createNewPiece();
        this.gameLoop();
    }
    
    createNewPiece() {
        const pieces = [
            [[1,1,1,1]], // I piece
            [[1,1],[1,1]], // O piece
            [[0,1,0],[1,1,1]], // T piece
            [[1,0,0],[1,1,1]], // L piece
            [[0,0,1],[1,1,1]], // J piece
            [[0,1,1],[1,1,0]], // S piece
            [[1,1,0],[0,1,1]]  // Z piece
        ];
        
        this.gameData.currentPiece = pieces[Math.floor(Math.random() * pieces.length)];
        this.gameData.currentX = 4;
        this.gameData.currentY = 0;
        
        // Check game over
        if (this.checkCollision(this.gameData.currentPiece, this.gameData.currentX, this.gameData.currentY)) {
            this.completeGame(false, this.gameData.score);
        }
    }
    
    checkCollision(piece, x, y) {
        for (let py = 0; py < piece.length; py++) {
            for (let px = 0; px < piece[py].length; px++) {
                if (piece[py][px]) {
                    const newX = x + px;
                    const newY = y + py;
                    
                    if (newX < 0 || newX >= 10 || newY >= 20) return true;
                    if (newY >= 0 && this.gameData.board[newY][newX]) return true;
                }
            }
        }
        return false;
    }
    
    placePiece() {
        for (let py = 0; py < this.gameData.currentPiece.length; py++) {
            for (let px = 0; px < this.gameData.currentPiece[py].length; px++) {
                if (this.gameData.currentPiece[py][px]) {
                    const newX = this.gameData.currentX + px;
                    const newY = this.gameData.currentY + py;
                    if (newY >= 0) {
                        this.gameData.board[newY][newX] = 1;
                    }
                }
            }
        }
        
        this.clearLines();
        this.createNewPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        for (let y = 19; y >= 0; y--) {
            if (this.gameData.board[y].every(cell => cell === 1)) {
                this.gameData.board.splice(y, 1);
                this.gameData.board.unshift(Array(10).fill(0));
                linesCleared++;
                y++; // Check same line again
            }
        }
        
        if (linesCleared > 0) {
            this.gameData.lines += linesCleared;
            this.gameData.score += linesCleared * 100;
            
            // Win condition: 10 lines
            if (this.gameData.lines >= 10) {
                this.completeGame(true, this.gameData.score + 500);
            }
        }
    }
    
    updateTetris() {
        // Handle input
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            if (!this.checkCollision(this.gameData.currentPiece, this.gameData.currentX - 1, this.gameData.currentY)) {
                this.gameData.currentX--;
            }
            this.keys['ArrowLeft'] = false;
            this.keys['a'] = false;
            this.keys['A'] = false;
        }
        
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            if (!this.checkCollision(this.gameData.currentPiece, this.gameData.currentX + 1, this.gameData.currentY)) {
                this.gameData.currentX++;
            }
            this.keys['ArrowRight'] = false;
            this.keys['d'] = false;
            this.keys['D'] = false;
        }
        
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            if (!this.checkCollision(this.gameData.currentPiece, this.gameData.currentX, this.gameData.currentY + 1)) {
                this.gameData.currentY++;
                this.gameData.score += 1;
            }
            this.keys['ArrowDown'] = false;
            this.keys['s'] = false;
            this.keys['S'] = false;
        }
        
        // Rotate piece
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W'] || this.keys[' ']) {
            const rotated = this.rotatePiece(this.gameData.currentPiece);
            if (!this.checkCollision(rotated, this.gameData.currentX, this.gameData.currentY)) {
                this.gameData.currentPiece = rotated;
            }
            this.keys['ArrowUp'] = false;
            this.keys['w'] = false;
            this.keys['W'] = false;
            this.keys[' '] = false;
        }
        
        // Auto drop
        this.gameData.dropTime += 16;
        if (this.gameData.dropTime >= this.gameData.dropInterval) {
            if (!this.checkCollision(this.gameData.currentPiece, this.gameData.currentX, this.gameData.currentY + 1)) {
                this.gameData.currentY++;
            } else {
                this.placePiece();
            }
            this.gameData.dropTime = 0;
        }
    }
    
    rotatePiece(piece) {
        const rotated = [];
        for (let x = 0; x < piece[0].length; x++) {
            rotated[x] = [];
            for (let y = piece.length - 1; y >= 0; y--) {
                rotated[x][piece.length - 1 - y] = piece[y][x];
            }
        }
        return rotated;
    }
    
    drawTetris() {
        this.clearCanvas();
        
        const blockSize = 20; // SMALLER blocks to fit better
        const offsetX = 50;   // MOVED LEFT to show more
        const offsetY = 20;   // MOVED UP to show bottom
        
        // Draw board
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                const drawX = offsetX + x * blockSize;
                const drawY = offsetY + y * blockSize;
                
                if (this.gameData.board[y][x]) {
                    this.ctx.fillStyle = '#FF6B6B';
                    this.ctx.fillRect(drawX, drawY, blockSize, blockSize);
                }
                this.ctx.strokeRect(drawX, drawY, blockSize, blockSize);
            }
        }
        
        // Draw current piece
        if (this.gameData.currentPiece) {
            this.ctx.fillStyle = '#FFD700';
            for (let py = 0; py < this.gameData.currentPiece.length; py++) {
                for (let px = 0; px < this.gameData.currentPiece[py].length; px++) {
                    if (this.gameData.currentPiece[py][px]) {
                        const drawX = offsetX + (this.gameData.currentX + px) * blockSize;
                        const drawY = offsetY + (this.gameData.currentY + py) * blockSize;
                        this.ctx.fillRect(drawX, drawY, blockSize, blockSize);
                        this.ctx.strokeRect(drawX, drawY, blockSize, blockSize);
                    }
                }
            }
        }
        
        // Draw UI
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.gameData.score}`, 20, 30);
        this.ctx.fillText(`Lines: ${this.gameData.lines}/10`, 20, 60);
        this.ctx.fillText('Controls:', 450, 100);
        this.ctx.font = '16px Arial';
        this.ctx.fillText('← → Move', 450, 130);
        this.ctx.fillText('↓ Drop', 450, 150);
        this.ctx.fillText('↑ Rotate', 450, 170);
    }

    startPacManDots() {
        this.gameData = {
            pacman: { x: 1, y: 1, direction: { x: 0, y: 0 } },
            dots: [],
            ghosts: [
                { x: 9, y: 9, direction: { x: 1, y: 0 }, color: '#FF0000' },
                { x: 10, y: 9, direction: { x: -1, y: 0 }, color: '#FFB8FF' }
            ],
            score: 0,
            dotsCollected: 0,
            totalDots: 0,
            maze: [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
                [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],
                [1,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0,0,1],
                [1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,1],
                [0,0,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,0,0],
                [1,1,1,1,0,1,0,1,0,0,0,0,1,0,1,0,1,1,1,1],
                [0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0],
                [1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,1,1],
                [0,0,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,0,0],
                [1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,1],
                [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
                [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],
                [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            ],
            cellSize: 25,
            lastMoveTime: 0,
            moveInterval: 100 // OPTIMIZED - Faster movement for better gameplay
        };
        
        // Create dots in empty spaces
        for (let y = 0; y < this.gameData.maze.length; y++) {
            for (let x = 0; x < this.gameData.maze[y].length; x++) {
                if (this.gameData.maze[y][x] === 0 && !(x === 1 && y === 1)) {
                    this.gameData.dots.push({ x, y });
                    this.gameData.totalDots++;
                }
            }
        }
        
        this.setupCanvasListeners();
        this.gameLoop();
    }

    startSpaceInvaders() {
        // ASTRO WAR - Üçgen uzay gemisi rastgele asteroitleri vuruyor
        this.gameData = {
            ship: { x: 400, y: 400, angle: 0, vx: 0, vy: 0, size: 15 },
            bullets: [],
            asteroids: [],
            score: 0,
            lastShot: 0,
            shootCooldown: 300, // Otomatik ateş için daha uzun cooldown
            asteroidSpawnRate: 0.02, // Rastgele asteroid spawn
            maxAsteroids: 8,
            autoShoot: true // Otomatik ateş aktif
        };
        
        // Create initial asteroids
        for (let i = 0; i < 5; i++) {
            this.spawnAsteroid();
        }
        
        this.setupCanvasListeners();
        this.gameLoop();
    }
    
    spawnAsteroid() {
        if (this.gameData.asteroids.length >= this.gameData.maxAsteroids) return;
        
        // Spawn from random edge
        const edge = Math.floor(Math.random() * 4);
        let x, y, vx, vy;
        
        switch (edge) {
            case 0: // Top
                x = Math.random() * this.canvas.width;
                y = -30;
                vx = (Math.random() - 0.5) * 4;
                vy = Math.random() * 3 + 1;
                break;
            case 1: // Right
                x = this.canvas.width + 30;
                y = Math.random() * this.canvas.height;
                vx = -(Math.random() * 3 + 1);
                vy = (Math.random() - 0.5) * 4;
                break;
            case 2: // Bottom
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 30;
                vx = (Math.random() - 0.5) * 4;
                vy = -(Math.random() * 3 + 1);
                break;
            case 3: // Left
                x = -30;
                y = Math.random() * this.canvas.height;
                vx = Math.random() * 3 + 1;
                vy = (Math.random() - 0.5) * 4;
                break;
        }
        
        this.gameData.asteroids.push({
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            size: 15 + Math.random() * 20,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.2
        });
    }

    startFroggerCross() {
        this.showSimpleGame('Frogger Cross', 'Cross safely!', '#00AA00');
        // 15 saniyelik timer otomatik çalışacak
    }

    startCentipedeShoot() {
        this.showSimpleGame('Centipede Shoot', 'Destroy segments!', '#FF00FF');
        // 15 saniyelik timer otomatik çalışacak
    }

    startMissileCommand() {
        this.showSimpleGame('Missile Command', 'Defend cities!', '#FF4444');
        // 15 saniyelik timer otomatik çalışacak
    }

    startDefenderShip() {
        this.showSimpleGame('Defender Ship', 'Protect humanoids!', '#44FF44');
        // 15 saniyelik timer otomatik çalışacak
    }

    startGalagaFighter() {
        this.showSimpleGame('Galaga Fighter', 'Fight the fleet!', '#4444FF');
        // 15 saniyelik timer otomatik çalışacak
    }

    startDigDug() {
        this.showSimpleGame('Dig Dug', 'Pop enemies!', '#FFAA00');
        // 15 saniyelik timer otomatik çalışacak
    }

    startQBertJump() {
        this.showSimpleGame('Q*bert Jump', 'Change cube colors!', '#FF8800');
        // 15 saniyelik timer otomatik çalışacak
    }

    startDonkeyKong() {
        this.showSimpleGame('Donkey Kong', 'Climb and avoid!', '#8B4513');
        // 15 saniyelik timer otomatik çalışacak
    }

    startMarioJump() {
        this.showSimpleGame('Mario Jump', 'Jump over obstacles!', '#FF0000');
        // 15 saniyelik timer otomatik çalışacak
    }

    startSonicRun() {
        this.showSimpleGame('Sonic Run', 'Gotta go fast!', '#0066FF');
        // 15 saniyelik timer otomatik çalışacak
    }

    startBubbleShooter() {
        this.gameData = {
            shooter: { x: 400, y: 550, angle: 0 },
            bubbles: [],
            grid: [],
            currentBubble: null,
            nextBubble: null,
            score: 0,
            colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
            bubbleRadius: 20,
            gridRows: 6, // OPTIMIZED - Fewer rows for 15-second games
            gridCols: 12, // OPTIMIZED - Fewer columns for faster completion
            shootSpeed: 12 // OPTIMIZED - Faster bubble movement
        };
        
        // Initialize grid - OPTIMIZED for faster completion
        for (let row = 0; row < this.gameData.gridRows; row++) {
            this.gameData.grid[row] = [];
            for (let col = 0; col < this.gameData.gridCols; col++) {
                if (row < 3) { // Only fill top 3 rows for faster games
                    this.gameData.grid[row][col] = {
                        color: this.gameData.colors[Math.floor(Math.random() * this.gameData.colors.length)],
                        x: col * (this.gameData.bubbleRadius * 2) + (row % 2 === 1 ? this.gameData.bubbleRadius : 0) + 50,
                        y: row * (this.gameData.bubbleRadius * 1.7) + 50
                    };
                } else {
                    this.gameData.grid[row][col] = null;
                }
            }
        }
        
        this.createNewBubble();
        this.setupCanvasListeners();
        this.gameLoop();
    }

    startZumaBalls() {
        this.showSimpleGame('Zuma Balls', 'Match before end!', '#FF6600');
        // 15 saniyelik timer otomatik çalışacak
    }

    startBejeweledMatch() {
        this.showSimpleGame('Bejeweled Match', 'Match gems!', '#9966FF');
        // 15 saniyelik timer otomatik çalışacak
    }

    startCandyCrush() {
        this.showSimpleGame('Candy Crush', 'Crush candies!', '#FF69B4');
        // 15 saniyelik timer otomatik çalışacak
    }

    startFruitNinja() {
        this.showSimpleGame('Fruit Ninja', 'Slice fruits!', '#FF4500');
        // 15 saniyelik timer otomatik çalışacak
    }

    startAngryBirds() {
        this.showSimpleGame('Angry Birds', 'Destroy pigs!', '#FF0000');
        // 15 saniyelik timer otomatik çalışacak
    }

    startFlappyBird() {
        this.gameData = {
            bird: { x: 100, y: 300, velocity: 0, size: 20 },
            pipes: [],
            score: 0,
            gravity: 0.5,
            jumpPower: -10,
            pipeWidth: 60,
            pipeGap: 150,
            pipeSpeed: 3,
            nextPipeX: 400,
            gameStarted: false // WAIT for first input
        };
        
        this.createPipe();
        this.setupCanvasListeners();
        this.gameLoop();
    }
    
    createPipe() {
        const gapY = Math.random() * (this.canvas.height - this.gameData.pipeGap - 100) + 50;
        this.gameData.pipes.push({
            x: this.gameData.nextPipeX,
            topHeight: gapY,
            bottomY: gapY + this.gameData.pipeGap,
            passed: false
        });
        this.gameData.nextPipeX += 300;
    }
    updateFlappyBird() {
        const bird = this.gameData.bird;
        
        // Handle jump input and start game
        if (this.keys[' '] || this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            if (!this.gameData.gameStarted) {
                this.gameData.gameStarted = true; // START game on first input
                console.log('🐦 Flappy Bird started by user input');
            }
            bird.velocity = this.gameData.jumpPower;
            this.keys[' '] = false;
            this.keys['ArrowUp'] = false;
            this.keys['w'] = false;
            this.keys['W'] = false;
        }
        
        // Only update physics if game started
        if (!this.gameData.gameStarted) {
            return; // WAIT for user input
        }
        
        // Apply gravity
        bird.velocity += this.gameData.gravity;
        bird.y += bird.velocity;
        bird.y += bird.velocity;
        
        // Check ground/ceiling collision
        if (bird.y <= 0 || bird.y >= this.canvas.height - bird.size) {
            this.completeGame(false, this.gameData.score);
            return;
        }
        
        // Update pipes
        this.gameData.pipes.forEach((pipe, index) => {
            pipe.x -= this.gameData.pipeSpeed;
            
            // Check if bird passed pipe
            if (!pipe.passed && bird.x > pipe.x + this.gameData.pipeWidth) {
                pipe.passed = true;
                this.gameData.score += 10;
                
                // Win condition: 5 pipes passed
                if (this.gameData.score >= 50) {
                    this.completeGame(true, this.gameData.score + 100);
                    return;
                }
            }
            
            // Check collision with pipe
            if (bird.x + bird.size > pipe.x && bird.x < pipe.x + this.gameData.pipeWidth) {
                if (bird.y < pipe.topHeight || bird.y + bird.size > pipe.bottomY) {
                    this.completeGame(false, this.gameData.score);
                    return;
                }
            }
            
            // Remove off-screen pipes
            if (pipe.x + this.gameData.pipeWidth < 0) {
                this.gameData.pipes.splice(index, 1);
            }
        });
        // Create new pipes - SAFETY CHECK
        if (!this.gameData.pipes) {
            this.gameData.pipes = [];
        }
        if (this.gameData.pipes.length === 0 || this.gameData.pipes[this.gameData.pipes.length - 1].x < this.canvas.width - 200) {
            this.createPipe();
        }
    }
    
    drawFlappyBird() {
        this.clearCanvas();
        
        const bird = this.gameData.bird;
        
        // SAFETY CHECK
        if (!bird) {
            console.warn('Bird data not initialized');
            return;
        }
        
        // Draw bird
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.arc(bird.x + bird.size/2, bird.y + bird.size/2, bird.size/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw eye
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(bird.x + bird.size/2 + 5, bird.y + bird.size/2 - 3, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw pipes
        this.ctx.fillStyle = '#00AA00';
        this.gameData.pipes.forEach(pipe => {
            // Top pipe
            this.ctx.fillRect(pipe.x, 0, this.gameData.pipeWidth, pipe.topHeight);
            // Bottom pipe
            this.ctx.fillRect(pipe.x, pipe.bottomY, this.gameData.pipeWidth, this.canvas.height - pipe.bottomY);
            
            // Pipe borders
            this.ctx.strokeStyle = '#008800';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(pipe.x, 0, this.gameData.pipeWidth, pipe.topHeight);
            this.ctx.strokeRect(pipe.x, pipe.bottomY, this.gameData.pipeWidth, this.canvas.height - pipe.bottomY);
        });
        
        // Draw UI
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Score: ${this.gameData.score}`, 20, 40);
        this.ctx.font = '16px Arial';
        
        if (!this.gameData.gameStarted) {
            // Show start message
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Press SPACE to Start!', 320, 240);
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
        }
        
        this.ctx.fillText('SPACE or ↑ to jump', 20, 70);
        this.ctx.fillText('Pass 5 pipes to win!', 20, 90);
    }

    updatePacManDots() {
        // OPTIMIZED - Reduce move interval for better responsiveness
        const currentTime = Date.now();
        if (currentTime - this.gameData.lastMoveTime < 100) { // 100ms instead of 200ms
            return;
        }
        this.gameData.lastMoveTime = currentTime;
        
        const pacman = this.gameData.pacman;
        
        // Handle input for direction change
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            const newY = pacman.y - 1;
            if (newY >= 0 && this.gameData.maze[newY][pacman.x] === 0) {
                pacman.direction = { x: 0, y: -1 };
            }
        }
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            const newY = pacman.y + 1;
            if (newY < this.gameData.maze.length && this.gameData.maze[newY][pacman.x] === 0) {
                pacman.direction = { x: 0, y: 1 };
            }
        }
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            const newX = pacman.x - 1;
            if (newX >= 0 && this.gameData.maze[pacman.y][newX] === 0) {
                pacman.direction = { x: -1, y: 0 };
            }
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            const newX = pacman.x + 1;
            if (newX < this.gameData.maze[0].length && this.gameData.maze[pacman.y][newX] === 0) {
                pacman.direction = { x: 1, y: 0 };
            }
        }
        
        // Move Pac-Man
        const newX = pacman.x + pacman.direction.x;
        const newY = pacman.y + pacman.direction.y;
        
        if (newX >= 0 && newX < this.gameData.maze[0].length &&
            newY >= 0 && newY < this.gameData.maze.length &&
            this.gameData.maze[newY][newX] === 0) {
            pacman.x = newX;
            pacman.y = newY;
        }
        
        // Check dot collection
        this.gameData.dots.forEach((dot, index) => {
            if (dot.x === pacman.x && dot.y === pacman.y) {
                this.gameData.dots.splice(index, 1);
                this.gameData.dotsCollected++;
                this.gameData.score += 10;
            }
        });
        
        // Check ghost collision
        this.gameData.ghosts.forEach(ghost => {
            if (ghost.x === pacman.x && ghost.y === pacman.y) {
                this.completeGame(false, this.gameData.score);
                return;
            }
        });
        
        // Move ghosts - SAFETY CHECK
        if (!this.gameData.ghosts) {
            console.warn('Ghosts data not initialized');
            return;
        }
        this.gameData.ghosts.forEach(ghost => {
            const directions = [
                { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
            ];
            
            // Try current direction first
            let newX = ghost.x + ghost.direction.x;
            let newY = ghost.y + ghost.direction.y;
            
            if (newX < 0 || newX >= this.gameData.maze[0].length ||
                newY < 0 || newY >= this.gameData.maze.length ||
                this.gameData.maze[newY][newX] === 1) {
                // Change direction randomly
                const validDirections = directions.filter(dir => {
                    const testX = ghost.x + dir.x;
                    const testY = ghost.y + dir.y;
                    return testX >= 0 && testX < this.gameData.maze[0].length &&
                           testY >= 0 && testY < this.gameData.maze.length &&
                           this.gameData.maze[testY][testX] === 0;
                });
                
                if (validDirections.length > 0) {
                    ghost.direction = validDirections[Math.floor(Math.random() * validDirections.length)];
                    newX = ghost.x + ghost.direction.x;
                    newY = ghost.y + ghost.direction.y;
                }
            }
            
            if (newX >= 0 && newX < this.gameData.maze[0].length &&
                newY >= 0 && newY < this.gameData.maze.length &&
                this.gameData.maze[newY][newX] === 0) {
                ghost.x = newX;
                ghost.y = newY;
            }
        });
        
        // Win condition: collect 80% of dots
        if (this.gameData.dotsCollected >= Math.floor(this.gameData.totalDots * 0.8)) {
            this.completeGame(true, this.gameData.score + 200);
        }
    }
    
    drawPacManDots() {
        this.clearCanvas();
        
        const cellSize = this.gameData.cellSize;
        const offsetX = 50;
        const offsetY = 20;
        
        // Draw maze - SAFETY CHECK
        if (!this.gameData.maze) {
            console.warn('Pac-Man maze not initialized');
            return;
        }
        
        this.ctx.fillStyle = '#0000FF';
        for (let y = 0; y < this.gameData.maze.length; y++) {
            for (let x = 0; x < this.gameData.maze[y].length; x++) {
                if (this.gameData.maze[y][x] === 1) {
                    this.ctx.fillRect(offsetX + x * cellSize, offsetY + y * cellSize, cellSize, cellSize);
                }
            }
        }
        
        // Draw dots
        this.ctx.fillStyle = '#FFFF00';
        this.gameData.dots.forEach(dot => {
            this.ctx.beginPath();
            this.ctx.arc(
                offsetX + dot.x * cellSize + cellSize/2,
                offsetY + dot.y * cellSize + cellSize/2,
                3, 0, Math.PI * 2
            );
            this.ctx.fill();
        });
        
        // Draw Pac-Man
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.arc(
            offsetX + this.gameData.pacman.x * cellSize + cellSize/2,
            offsetY + this.gameData.pacman.y * cellSize + cellSize/2,
            cellSize/2 - 2, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // Draw Pac-Man mouth
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.moveTo(
            offsetX + this.gameData.pacman.x * cellSize + cellSize/2,
            offsetY + this.gameData.pacman.y * cellSize + cellSize/2
        );
        this.ctx.arc(
            offsetX + this.gameData.pacman.x * cellSize + cellSize/2,
            offsetY + this.gameData.pacman.y * cellSize + cellSize/2,
            cellSize/2 - 2, 0.2, -0.2
        );
        this.ctx.fill();
        
        // Draw ghosts
        this.gameData.ghosts.forEach(ghost => {
            this.ctx.fillStyle = ghost.color;
            this.ctx.beginPath();
            this.ctx.arc(
                offsetX + ghost.x * cellSize + cellSize/2,
                offsetY + ghost.y * cellSize + cellSize/2,
                cellSize/2 - 2, 0, Math.PI * 2
            );
            this.ctx.fill();
            
            // Ghost eyes
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(
                offsetX + ghost.x * cellSize + cellSize/2 - 4,
                offsetY + ghost.y * cellSize + cellSize/2 - 3,
                2, 0, Math.PI * 2
            );
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(
                offsetX + ghost.x * cellSize + cellSize/2 + 4,
                offsetY + ghost.y * cellSize + cellSize/2 - 3,
                2, 0, Math.PI * 2
            );
            this.ctx.fill();
        });
        
        // Draw UI
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.gameData.score}`, 20, 30);
        this.ctx.fillText(`Dots: ${this.gameData.dotsCollected}/${this.gameData.totalDots}`, 20, 60);
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Collect 80% of dots to win!', 20, 500);
        this.ctx.fillText('Arrow keys to move', 20, 520);
    }

    updateSpaceInvaders() {
        // ASTRO WAR UPDATE
        const ship = this.gameData.ship;
        const currentTime = Date.now();
        
        // Ship rotation
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            ship.angle -= 0.15;
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            ship.angle += 0.15;
        }
        
        // Ship thrust
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            ship.vx += Math.cos(ship.angle) * 0.5;
            ship.vy += Math.sin(ship.angle) * 0.5;
        }
        
        // Ship shooting - OTOMATIK ATEŞ + Manuel ateş
        if (this.gameData.autoShoot ||
            (this.keys[' '] || this.keys['ArrowDown'] || this.keys['s'] || this.keys['S'])) {
            if (currentTime - this.gameData.lastShot > this.gameData.shootCooldown) {
                this.gameData.bullets.push({
                    x: ship.x,
                    y: ship.y,
                    vx: Math.cos(ship.angle) * 8,
                    vy: Math.sin(ship.angle) * 8,
                    life: 60
                });
                this.gameData.lastShot = currentTime;
            }
        }
        
        // Apply friction and update ship position
        ship.vx *= 0.98;
        ship.vy *= 0.98;
        ship.x += ship.vx;
        ship.y += ship.vy;
        
        // Wrap ship around screen
        if (ship.x < 0) ship.x = this.canvas.width;
        if (ship.x > this.canvas.width) ship.x = 0;
        if (ship.y < 0) ship.y = this.canvas.height;
        if (ship.y > this.canvas.height) ship.y = 0;
        
        // Update bullets
        this.gameData.bullets.forEach((bullet, index) => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            if (bullet.life <= 0 || bullet.x < 0 || bullet.x > this.canvas.width ||
                bullet.y < 0 || bullet.y > this.canvas.height) {
                this.gameData.bullets.splice(index, 1);
            }
        });
        
        // Update asteroids
        this.gameData.asteroids.forEach((asteroid, index) => {
            asteroid.x += asteroid.vx;
            asteroid.y += asteroid.vy;
            asteroid.rotation += asteroid.rotationSpeed;
            
            // Remove asteroids that are far off screen
            if (asteroid.x < -100 || asteroid.x > this.canvas.width + 100 ||
                asteroid.y < -100 || asteroid.y > this.canvas.height + 100) {
                this.gameData.asteroids.splice(index, 1);
            }
        });
        
        // Spawn new asteroids randomly
        if (Math.random() < this.gameData.asteroidSpawnRate) {
            this.spawnAsteroid();
        }
        
        // Check bullet-asteroid collisions
        this.gameData.bullets.forEach((bullet, bulletIndex) => {
            this.gameData.asteroids.forEach((asteroid, asteroidIndex) => {
                const dx = bullet.x - asteroid.x;
                const dy = bullet.y - asteroid.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < asteroid.size) {
                    this.gameData.bullets.splice(bulletIndex, 1);
                    this.gameData.asteroids.splice(asteroidIndex, 1);
                    this.gameData.score += 10;
                }
            });
        });
        
        // Check ship-asteroid collisions
        this.gameData.asteroids.forEach(asteroid => {
            const dx = ship.x - asteroid.x;
            const dy = ship.y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < asteroid.size + ship.size) {
                this.completeGame(false, this.gameData.score);
                return;
            }
        });
        
        // Win condition: survive and get high score
        if (this.gameData.score >= 100) {
            this.completeGame(true, this.gameData.score + 200);
        }
    }
    
    drawSpaceInvaders() {
        this.clearCanvas();
        
        const ship = this.gameData.ship;
        
        // SAFETY CHECK
        if (!ship) {
            console.warn('Ship data not initialized');
            return;
        }
        
        // Draw ship (triangle)
        this.ctx.save();
        this.ctx.translate(ship.x, ship.y);
        this.ctx.rotate(ship.angle);
        this.ctx.fillStyle = '#00FF00';
        this.ctx.beginPath();
        this.ctx.moveTo(ship.size, 0);
        this.ctx.lineTo(-ship.size, -ship.size/2);
        this.ctx.lineTo(-ship.size/2, 0);
        this.ctx.lineTo(-ship.size, ship.size/2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.restore();
        
        // Draw bullets
        this.ctx.fillStyle = '#FFFF00';
        this.gameData.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw asteroids
        this.ctx.strokeStyle = '#AAAAAA';
        this.ctx.fillStyle = '#666666';
        this.ctx.lineWidth = 2;
        this.gameData.asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.rotation);
            
            // Draw irregular asteroid shape
            this.ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const radius = asteroid.size * (0.8 + Math.sin(i * 2) * 0.2);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.restore();
        });
        
        // Draw UI
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.gameData.score}`, 20, 30);
        this.ctx.fillText(`Asteroids: ${this.gameData.asteroids.length}`, 20, 60);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('← → Rotate, ↑ Thrust, SPACE Shoot', 20, 450);
        this.ctx.fillText('Destroy asteroids to score!', 20, 470);
    }

    createNewBubble() {
        this.gameData.currentBubble = {
            x: this.gameData.shooter.x,
            y: this.gameData.shooter.y,
            color: this.gameData.colors[Math.floor(Math.random() * this.gameData.colors.length)],
            vx: 0,
            vy: 0,
            moving: false
        };
        
        this.gameData.nextBubble = {
            color: this.gameData.colors[Math.floor(Math.random() * this.gameData.colors.length)]
        };
    }

    updateBubbleShooter() {
        // Handle aiming
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.gameData.shooter.angle = Math.max(-Math.PI/3, this.gameData.shooter.angle - 0.05);
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.gameData.shooter.angle = Math.min(Math.PI/3, this.gameData.shooter.angle + 0.05);
        }
        
        // Handle shooting
        if ((this.keys[' '] || this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) &&
            this.gameData.currentBubble && !this.gameData.currentBubble.moving) {
            this.gameData.currentBubble.vx = Math.sin(this.gameData.shooter.angle) * this.gameData.shootSpeed;
            this.gameData.currentBubble.vy = -Math.cos(this.gameData.shooter.angle) * this.gameData.shootSpeed;
            this.gameData.currentBubble.moving = true;
        }
        
        // Update moving bubble
        if (this.gameData.currentBubble && this.gameData.currentBubble.moving) {
            this.gameData.currentBubble.x += this.gameData.currentBubble.vx;
            this.gameData.currentBubble.y += this.gameData.currentBubble.vy;
            
            // Wall bouncing
            if (this.gameData.currentBubble.x <= this.gameData.bubbleRadius ||
                this.gameData.currentBubble.x >= this.canvas.width - this.gameData.bubbleRadius) {
                this.gameData.currentBubble.vx = -this.gameData.currentBubble.vx;
            }
            
            // Check collision with grid bubbles
            let collided = false;
            for (let row = 0; row < this.gameData.gridRows && !collided; row++) {
                for (let col = 0; col < this.gameData.gridCols && !collided; col++) {
                    const gridBubble = this.gameData.grid[row][col];
                    if (gridBubble) {
                        const dx = this.gameData.currentBubble.x - gridBubble.x;
                        const dy = this.gameData.currentBubble.y - gridBubble.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < this.gameData.bubbleRadius * 2) {
                            this.attachBubble(row, col);
                            collided = true;
                        }
                    }
                }
            }
            
            // Check if bubble reached top
            if (this.gameData.currentBubble.y <= this.gameData.bubbleRadius + 50) {
                this.attachBubble(0, Math.floor((this.gameData.currentBubble.x - 50) / (this.gameData.bubbleRadius * 2)));
            }
        }
        
        // Check win condition
        let hasActiveBubbles = false;
        for (let row = 0; row < this.gameData.gridRows; row++) {
            for (let col = 0; col < this.gameData.gridCols; col++) {
                if (this.gameData.grid[row][col]) {
                    hasActiveBubbles = true;
                    break;
                }
            }
            if (hasActiveBubbles) break;
        }
        
        if (!hasActiveBubbles) {
            this.completeGame(true, this.gameData.score + 1000);
        }
    }
    
    attachBubble(nearRow, nearCol) {
        // Find empty spot near collision
        let placed = false;
        for (let dr = -1; dr <= 1 && !placed; dr++) {
            for (let dc = -1; dc <= 1 && !placed; dc++) {
                const row = nearRow + dr;
                const col = nearCol + dc;
                
                if (row >= 0 && row < this.gameData.gridRows &&
                    col >= 0 && col < this.gameData.gridCols &&
                    !this.gameData.grid[row][col]) {
                    
                    this.gameData.grid[row][col] = {
                        color: this.gameData.currentBubble.color,
                        x: col * (this.gameData.bubbleRadius * 2) + (row % 2 === 1 ? this.gameData.bubbleRadius : 0) + 50,
                        y: row * (this.gameData.bubbleRadius * 1.7) + 50
                    };
                    
                    // Check for matches
                    this.checkMatches(row, col);
                    placed = true;
                }
            }
        }
        
        this.createNewBubble();
    }
    
    checkMatches(row, col) {
        const color = this.gameData.grid[row][col].color;
        const visited = new Set();
        const matches = [];
        
        const checkCell = (r, c) => {
            const key = `${r},${c}`;
            if (visited.has(key) || r < 0 || r >= this.gameData.gridRows ||
                c < 0 || c >= this.gameData.gridCols || !this.gameData.grid[r][c] ||
                this.gameData.grid[r][c].color !== color) {
                return;
            }
            
            visited.add(key);
            matches.push({row: r, col: c});
            
            // Check neighbors
            const neighbors = [
                [r-1, c], [r+1, c], [r, c-1], [r, c+1],
                [r-1, c-1], [r-1, c+1], [r+1, c-1], [r+1, c+1]
            ];
            
            neighbors.forEach(([nr, nc]) => checkCell(nr, nc));
        };
        
        checkCell(row, col);
        
        // Remove if 3 or more matches
        if (matches.length >= 3) {
            matches.forEach(({row, col}) => {
                this.gameData.grid[row][col] = null;
                this.gameData.score += 10;
            });
        }
    }
    
    drawBubbleShooter() {
        this.clearCanvas();
        
        // Draw grid bubbles - IMPROVED: No stroke, gradient effect
        for (let row = 0; row < this.gameData.gridRows; row++) {
            for (let col = 0; col < this.gameData.gridCols; col++) {
                const bubble = this.gameData.grid[row][col];
                if (bubble) {
                    // Create gradient for 3D effect
                    const gradient = this.ctx.createRadialGradient(
                        bubble.x - 5, bubble.y - 5, 0,
                        bubble.x, bubble.y, this.gameData.bubbleRadius
                    );
                    gradient.addColorStop(0, bubble.color);
                    gradient.addColorStop(1, this.darkenColor(bubble.color));
                    
                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    this.ctx.arc(bubble.x, bubble.y, this.gameData.bubbleRadius, 0, Math.PI * 2);
                    this.ctx.fill();
                    // NO STROKE for cleaner look
                }
            }
        }
        // Draw shooter base - ENHANCED VISIBILITY
        const baseGradient = this.ctx.createRadialGradient(
            this.gameData.shooter.x, this.gameData.shooter.y + 10, 0,
            this.gameData.shooter.x, this.gameData.shooter.y + 10, 40
        );
        baseGradient.addColorStop(0, '#FFD700');
        baseGradient.addColorStop(1, '#B8860B');
        
        this.ctx.fillStyle = baseGradient;
        this.ctx.beginPath();
        this.ctx.arc(this.gameData.shooter.x, this.gameData.shooter.y + 10, 40, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw shooter base border
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(this.gameData.shooter.x, this.gameData.shooter.y + 10, 40, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw shooter cannon - ENHANCED VISIBILITY
        this.ctx.save();
        this.ctx.translate(this.gameData.shooter.x, this.gameData.shooter.y);
        this.ctx.rotate(this.gameData.shooter.angle);
        
        // Cannon barrel
        const cannonGradient = this.ctx.createLinearGradient(-15, 0, 15, 0);
        cannonGradient.addColorStop(0, '#8B4513');
        cannonGradient.addColorStop(0.5, '#CD853F');
        cannonGradient.addColorStop(1, '#8B4513');
        
        this.ctx.fillStyle = cannonGradient;
        this.ctx.fillRect(-15, -60, 30, 60);
        
        // Cannon border
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(-15, -60, 30, 60);
        
        this.ctx.restore();
        this.ctx.stroke();
        
        // Draw aim line - ENHANCED VISIBILITY
        this.ctx.strokeStyle = '#FFFF00';
        this.ctx.lineWidth = 6;
        this.ctx.setLineDash([15, 8]); // Larger dashed line for better visibility
        this.ctx.beginPath();
        this.ctx.moveTo(this.gameData.shooter.x, this.gameData.shooter.y - 20);
        this.ctx.lineTo(
            this.gameData.shooter.x + Math.sin(this.gameData.shooter.angle) * 120,
            this.gameData.shooter.y - 20 - Math.cos(this.gameData.shooter.angle) * 120
        );
        this.ctx.stroke();
        
        // Add aim line shadow for better visibility
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(this.gameData.shooter.x + 2, this.gameData.shooter.y - 18);
        this.ctx.lineTo(
            this.gameData.shooter.x + 2 + Math.sin(this.gameData.shooter.angle) * 120,
            this.gameData.shooter.y - 18 - Math.cos(this.gameData.shooter.angle) * 120
        );
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset line dash
        
        // Draw current bubble - ENHANCED VISIBILITY
        if (this.gameData.currentBubble) {
            const bubbleGradient = this.ctx.createRadialGradient(
                this.gameData.currentBubble.x - 8, this.gameData.currentBubble.y - 8, 0,
                this.gameData.currentBubble.x, this.gameData.currentBubble.y, this.gameData.bubbleRadius + 5
            );
            bubbleGradient.addColorStop(0, '#FFFFFF');
            bubbleGradient.addColorStop(0.3, this.gameData.currentBubble.color);
            bubbleGradient.addColorStop(1, this.darkenColor(this.gameData.currentBubble.color));
            
            this.ctx.fillStyle = bubbleGradient;
            this.ctx.beginPath();
            this.ctx.arc(this.gameData.currentBubble.x, this.gameData.currentBubble.y,
                        this.gameData.bubbleRadius + 2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add bright border for visibility
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.gameData.currentBubble.x, this.gameData.currentBubble.y,
                        this.gameData.bubbleRadius + 2, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Add inner highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(this.gameData.currentBubble.x - 6, this.gameData.currentBubble.y - 6, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw next bubble preview - ENHANCED VISIBILITY
        if (this.gameData.nextBubble) {
            // Preview background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(15, 415, 70, 70);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(15, 415, 70, 70);
            
            const nextGradient = this.ctx.createRadialGradient(45, 445, 0, 50, 450, 25);
            nextGradient.addColorStop(0, '#FFFFFF');
            nextGradient.addColorStop(0.3, this.gameData.nextBubble.color);
            nextGradient.addColorStop(1, this.darkenColor(this.gameData.nextBubble.color));
            
            this.ctx.fillStyle = nextGradient;
            this.ctx.beginPath();
            this.ctx.arc(50, 450, 25, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Next bubble border
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(50, 450, 25, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Next bubble highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(45, 445, 8, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Draw UI - ENHANCED VISIBILITY
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 22px Arial';
        this.ctx.fillText(`Score: ${this.gameData.score}`, 20, 35);
        
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText('← → Aim, SPACE Shoot', 20, 380);
        this.ctx.fillText('Match 3+ bubbles to pop them!', 20, 405);
        this.ctx.fillText('Clear all bubbles to win!', 20, 430);
        
        // Next bubble label with background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(15, 390, 70, 25);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('NEXT', 50, 408);
        this.ctx.textAlign = 'left';
        
        // Draw angle indicator with background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(450, 380, 150, 60);
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(450, 380, 150, 60);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 16px Arial';
        const angleText = `Angle: ${Math.round(this.gameData.shooter.angle * 180 / Math.PI)}°`;
        this.ctx.fillText(angleText, 460, 405);
        
        // Power indicator
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillText('Power: MAX', 460, 425);
    }

    startDoodleJump() {
        this.showSimpleGame('Doodle Jump', 'Jump higher!', '#00FF00');
        // 15 saniyelik timer otomatik çalışacak
    }

    startTempleRun() {
        this.showSimpleGame('Temple Run', 'Run and avoid!', '#8B4513');
        // 15 saniyelik timer otomatik çalışacak
    }

    startSubwaySurfers() {
        this.showSimpleGame('Subway Surfers', 'Surf trains!', '#FF6600');
        // 15 saniyelik timer otomatik çalışacak
    }

    startCrossyRoad() {
        this.showSimpleGame('Crossy Road', 'Cross safely!', '#00AA00');
        // 15 saniyelik timer otomatik çalışacak
    }

    startPianoTiles() {
        this.showSimpleGame('Piano Tiles', 'Tap black tiles!', '#000000');
        // 15 saniyelik timer otomatik çalışacak
    }

    start2048Merge() {
        this.showSimpleGame('2048 Merge', 'Reach 2048!', '#EDC22E');
        // 15 saniyelik timer otomatik çalışacak
    }

    startColorSwitch() {
        this.showSimpleGame('Color Switch', 'Match colors!', '#FF00FF');
        // 15 saniyelik timer otomatik çalışacak
    }

    showSimpleGame(title, instruction, color) {
        this.clearCanvas();
        
        // Game title
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(title, 400, 200);
        
        // Instruction
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText(instruction, 400, 250);
        
        // Animated element
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(400, 350, 30 + Math.sin(Date.now() * 0.01) * 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Progress indicator
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Playing...', 400, 450);
        
        this.ctx.textAlign = 'left';
        
        // Animasyon loop'u başlat
        this.animateSimpleGame(title, instruction, color);
    }
    
    animateSimpleGame(title, instruction, color) {
        if (!this.isGameActive) return;
        
        this.clearCanvas();
        
        // Game title
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(title, 400, 200);
        
        // Instruction
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText(instruction, 400, 250);
        
        // Animated element
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(400, 350, 30 + Math.sin(Date.now() * 0.01) * 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Progress indicator
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('Playing...', 400, 450);
        
        // Kalan süreyi göster
        const elapsed = Date.now() - this.gameStartTime;
        const remaining = Math.max(0, 15000 - elapsed);
        const seconds = (remaining / 1000).toFixed(1);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText(`Time: ${seconds}s`, 400, 500);
        
        this.ctx.textAlign = 'left';
        
        // Devam et
        this.animationFrame = requestAnimationFrame(() => this.animateSimpleGame(title, instruction, color));
    }
        
            // SIMPLE CLICK TEST - Test if games work
            startSimpleClickTest() {
                this.gameData = {
                    clicks: 0,
                    target: { x: 400, y: 300, radius: 50 }
                };
        
                this.drawSimpleClickTest();
                this.setupCanvasListeners();
            }
        
            drawSimpleClickTest() {
                this.clearCanvas();
                
                // Title
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = 'bold 32px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🎯 CLICK TEST GAME', 400, 100);
                
                // Instructions
                this.ctx.font = 'bold 20px Arial';
                this.ctx.fillText('Click the circle to win!', 400, 150);
                this.ctx.fillText(`Clicks: ${this.gameData.clicks}`, 400, 200);
                
                // Target circle
                this.ctx.fillStyle = '#FF4444';
                this.ctx.beginPath();
                this.ctx.arc(this.gameData.target.x, this.gameData.target.y, this.gameData.target.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Border
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                
                this.ctx.textAlign = 'left';
            }
        
            handleSimpleClickTest(e) {
                if (!this.gameData || !this.gameData.target) {
                    console.warn('Click test game data not initialized');
                    return;
                }
                
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const dx = x - this.gameData.target.x;
                const dy = y - this.gameData.target.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= this.gameData.target.radius) {
                    this.gameData.clicks++;
                    
                    if (this.gameData.clicks >= 3) {
                        // Win!
                        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
                        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                        this.ctx.fillStyle = '#FFFFFF';
                        this.ctx.font = 'bold 48px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText('🎉 YOU WIN!', 400, 300);
                        
                        setTimeout(() => this.completeGame(true, 100), 2000);
                    } else {
                        // Move target
                        this.gameData.target.x = Math.random() * 600 + 100;
                        this.gameData.target.y = Math.random() * 400 + 200;
                        this.drawSimpleClickTest();
                    }
                }
            }
        }
        
        // Global game engine instance
        window.gameEngine = new GameEngine();
        
        console.log("30 Popular Arcade Games Engine loaded");