const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game states
const GAME_PLAYING = 0;
const GAME_OVER = 1;
const GAME_WON = 2;

// Maze layout (1 = wall, 0 = path) - 27 wide, 15 tall
const MAZE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,0,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,0,1,0,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,0,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Game constants
const COLS = 27;
const ROWS = 15;

function getTileSize() {
    return Math.floor(Math.min(canvas.width / COLS, canvas.height / ROWS));
}

// Resize canvas to fit screen
function resizeCanvas() {
    const maxWidth = Math.min(window.innerWidth - 60, 900);
    const maxHeight = window.innerHeight - 300;
    
    // Calculate tile size
    const tileSize = Math.floor(Math.min(maxWidth / COLS, maxHeight / ROWS, 40));
    
    canvas.width = COLS * tileSize;
    canvas.height = ROWS * tileSize;
}

// Game objects
let player = {
    x: 1.5,
    y: 1.5,
    speed: 1,
    velocityX: 0,
    velocityY: 0
};

let gems = [];
let enemies = [];
let gameState = GAME_PLAYING;
let lives = 3;
let score = 0;
let level = 1;
let invulnerable = 0;

// Keyboard handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        if (gameState !== GAME_PLAYING) {
            location.reload();
        }
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Initialize game
function init() {
    player.x = 1.5;
    player.y = 1.5;
    generateGems();
    spawnEnemies();
}

function generateGems() {
    gems = [];
    const gemCount = 5 + level;
    for (let i = 0; i < gemCount; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * (COLS - 2)) + 1;
            y = Math.floor(Math.random() * (ROWS - 2)) + 1;
        } while (MAZE[y][x] === 1);
        
        gems.push({
            x: x,
            y: y,
            collected: false
        });
    }
}

function spawnEnemies() {
    enemies = [];
    const enemyCount = 2 + Math.floor(level / 2);
    
    for (let i = 0; i < enemyCount; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * (COLS - 2)) + 1;
            y = Math.floor(Math.random() * (ROWS - 2)) + 1;
        } while (MAZE[y][x] === 1 || (Math.abs(x - player.x) < 5 && Math.abs(y - player.y) < 5));
        
        enemies.push({
            x: x + 0.5,
            y: y + 0.5,
            speed: 0.3 + level * 0.05
        });
    }
}

// Check if position is walkable
function isWalkable(x, y) {
    const col = Math.floor(x);
    const row = Math.floor(y);
    
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
    return MAZE[row][col] === 0;
}

// Update player movement
function updatePlayer() {
    let newVelX = 0;
    let newVelY = 0;
    
    if (keys['ArrowUp'] || keys['w'] || keys['W']) newVelY = -player.speed;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) newVelY = player.speed;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) newVelX = -player.speed;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) newVelX = player.speed;
    
    // Move player with collision
    const newX = player.x + newVelX;
    const newY = player.y + newVelY;
    
    if (isWalkable(newX, newY)) {
        player.x = newX;
    }
    if (isWalkable(player.x, newY)) {
        player.y = newY;
    }
    
    // Clamp to bounds
    player.x = Math.max(0.2, Math.min(COLS - 0.2, player.x));
    player.y = Math.max(0.2, Math.min(ROWS - 0.2, player.y));
}

// Update enemies with simple AI
function updateEnemies() {
    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const vx = (dx / distance) * enemy.speed;
            const vy = (dy / distance) * enemy.speed;
            
            const newX = enemy.x + vx;
            const newY = enemy.y + vy;
            
            if (isWalkable(newX, newY)) {
                enemy.x = newX;
            }
            if (isWalkable(enemy.x, newY)) {
                enemy.y = newY;
            }
        }
    });
}

// Check collisions with gems
function checkGemCollisions() {
    gems.forEach(gem => {
        if (!gem.collected) {
            const dx = Math.abs(player.x - (gem.x + 0.5));
            const dy = Math.abs(player.y - (gem.y + 0.5));
            
            if (dx < 0.4 && dy < 0.4) {
                gem.collected = true;
                score += 10;
                document.getElementById('score').textContent = score;
            }
        }
    });
    
    // Check if all gems collected
    if (gems.every(gem => gem.collected)) {
        nextLevel();
    }
}

// Check collisions with enemies
function checkEnemyCollisions() {
    if (invulnerable > 0) {
        invulnerable--;
        return;
    }
    
    enemies.forEach(enemy => {
        const dx = Math.abs(player.x - enemy.x);
        const dy = Math.abs(player.y - enemy.y);
        
        if (dx < 0.4 && dy < 0.4) {
            lives--;
            document.getElementById('lives').textContent = lives;
            invulnerable = 120;
            
            if (lives <= 0) {
                endGame(false);
            } else {
                player.x = 1.5;
                player.y = 1.5;
            }
        }
    });
}

function nextLevel() {
    level++;
    score += 50 * level;
    document.getElementById('level').textContent = level;
    document.getElementById('score').textContent = score;
    
    generateGems();
    spawnEnemies();
}

function endGame(won) {
    gameState = won ? GAME_WON : GAME_OVER;
    const modal = document.getElementById('gameOver');
    const title = document.getElementById('gameOverTitle');
    const message = document.getElementById('gameOverMessage');
    
    if (won) {
        title.textContent = '🎉 Вы победили!';
        message.textContent = `Отличная работа! Вы прошли ${level} уровней и заработали ${score} очков!`;
    } else {
        title.textContent = '💀 Игра окончена!';
        message.textContent = `Вы достигли уровня ${level} и набрали ${score} очков.`;
    }
    
    modal.classList.remove('hidden');
}

// Draw functions
function drawMaze() {
    const tileSize = getTileSize();
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (MAZE[row][col] === 1) {
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
                
                ctx.strokeStyle = '#1a252f';
                ctx.lineWidth = 1;
                ctx.strokeRect(col * tileSize, row * tileSize, tileSize, tileSize);
            }
        }
    }
}

function drawGems() {
    const tileSize = getTileSize();
    gems.forEach(gem => {
        if (!gem.collected) {
            const x = (gem.x + 0.5) * tileSize;
            const y = (gem.y + 0.5) * tileSize;
            const radius = tileSize * 0.2;
            
            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawPlayer() {
    const tileSize = getTileSize();
    const x = player.x * tileSize;
    const y = player.y * tileSize;
    const size = tileSize * 0.7;
    
    const alpha = invulnerable > 0 && Math.floor(invulnerable / 10) % 2 === 0 ? 0.5 : 1;
    ctx.globalAlpha = alpha;
    
    ctx.fillStyle = '#3498db';
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.fillRect(x - size / 3, y - size / 4, size / 6, size / 6);
    ctx.fillRect(x + size / 6, y - size / 4, size / 6, size / 6);
    
    ctx.fillStyle = 'black';
    ctx.fillRect(x - size / 3 + 1, y - size / 4 + 1, 2, 2);
    ctx.fillRect(x + size / 6 + 1, y - size / 4 + 1, 2, 2);
    
    ctx.globalAlpha = 1;
}

function drawEnemies() {
    const tileSize = getTileSize();
    enemies.forEach(enemy => {
        const x = enemy.x * tileSize;
        const y = enemy.y * tileSize;
        const size = tileSize * 0.7;
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
        
        ctx.fillStyle = 'white';
        ctx.fillRect(x - size / 3, y - size / 4, size / 6, size / 6);
        ctx.fillRect(x + size / 6, y - size / 4, size / 6, size / 6);
        
        ctx.fillStyle = 'black';
        ctx.fillRect(x - size / 3 + 1, y - size / 4 + 1, 2, 2);
        ctx.fillRect(x + size / 6 + 1, y - size / 4 + 1, 2, 2);
    });
}

function draw() {
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMaze();
    drawGems();
    drawEnemies();
    drawPlayer();
}

function update() {
    if (gameState !== GAME_PLAYING) return;
    
    updatePlayer();
    updateEnemies();
    checkGemCollisions();
    checkEnemyCollisions();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        resizeCanvas();
        init();
        gameLoop();
    });
} else {
    resizeCanvas();
    init();
    gameLoop();
}

window.addEventListener('resize', resizeCanvas);
