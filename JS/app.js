/*-------------------------------- Constants --------------------------------*/
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CANVAS_SIZE = 400;
const LEVEL_CONFIG = {
    1: { 
        name: "Easy", 
        grid: 50, 
        speed: 500, 
        canWrap: true, 
        selfDamage: "none", 
        opponentDamage: false 
    },
    2: { 
        name: "Medium", 
        grid: 25, 
        speed: 300, 
        canWrap: false, 
        selfDamage: "shrink", 
        opponentDamage: true 
    },
    3: { 
        name: "Hard", 
        grid: 20, 
        speed: 200, 
        canWrap: false, 
        selfDamage: "kill", 
        opponentDamage: true 
    }
};

/*---------------------------- Variables (state) ----------------------------*/
let currentLevel = 1;
let gridSize = LEVEL_CONFIG[currentLevel].grid;
let tileCount = CANVAS_SIZE / gridSize;

let p1, p2; // We will initialize these in a reset function
let food = { x: 10, y: 5 }; 
let gameRunning = false;    
let gameLoop; 

let p1MovedThisFrame = false;
let p2MovedThisFrame = false;

/*-------------------------------- Functions --------------------------------*/

// Initialize or Reset players
function resetGame() {
    // 1. Update the grid math based on the current level
    gridSize = LEVEL_CONFIG[currentLevel].grid;
    tileCount = Math.floor(CANVAS_SIZE / gridSize);

    // 2. RE-INITIALIZE Player 1 (Top Left)
    p1 = {
        body: [{x: 3, y: 2}, {x: 2, y: 2}, {x: 1, y: 2}],
        dx: 1,
        dy: 0,
        color: 'lime',
        score: 0
    };

    // 3. RE-INITIALIZE Player 2 (Bottom Right)
    // We use tileCount-4 to make sure they aren't touching the wall
    p2 = {
        body: [
            {x: tileCount - 4, y: tileCount - 3}, 
            {x: tileCount - 3, y: tileCount - 3}, 
            {x: tileCount - 2, y: tileCount - 3}
        ],
        dx: -1,
        dy: 0,
        color: 'dodgerblue',
        score: 0
    };

    // 4. Update the UI and Food
    spawnFood();
    updateScoreboard();
    
    // 5. CRITICAL: Draw the frame so the screen isn't blank
    draw();
}

function draw() {
    // 1. Clear background
    ctx.fillStyle = "#333333";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Food
    ctx.fillStyle = "#ff4d4d";
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);

    // 3. Draw Player 1
    ctx.fillStyle = p1.color;
    p1.body.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });

    // 4. Draw Player 2
    ctx.fillStyle = p2.color;
    p2.body.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

function spawnFood() {
    // Math.random() gives a number between 0 and 1
    // We multiply by tileCount and use floor to get a whole number
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);

    // Optional: Check if food spawned on a snake body (if so, spawn again)
    // We can add this logic once your movement is working!
}
function setLevel(levelNumber) {
    currentLevel = levelNumber;
    
    // 1. Update grid and tileCount based on the 400px canvas
    gridSize = LEVEL_CONFIG[currentLevel].grid;
    tileCount = Math.floor(CANVAS_SIZE / gridSize); 

    // 2. Stop current game loop
    gameRunning = false;
    if (gameLoop) clearInterval(gameLoop);

    // 3. Reset snakes and food for the new grid
    resetGame();
    
    console.log(`Switched to ${LEVEL_CONFIG[currentLevel].name}. Grid: ${tileCount}x${tileCount}`);
}
function advanceSnake(snake) {
    let newX = snake.body[0].x + snake.dx;
    let newY = snake.body[0].y + snake.dy;

    // --- BOUNDARY LOGIC ---
    if (newX < 0 || newX >= tileCount || newY < 0 || newY >= tileCount) {
        if (LEVEL_CONFIG[currentLevel].canWrap) {
            // EASY: Teleport (Wrap Around)
            if (newX < 0) newX = tileCount - 1;
            else if (newX >= tileCount) newX = 0;
            if (newY < 0) newY = tileCount - 1;
            else if (newY >= tileCount) newY = 0;
        } else {
            // MEDIUM & HARD: Death
            endGame("Hit the wall!");
            return; // Stop moving
        }
    }

    const head = { x: newX, y: newY };
    snake.body.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        snake.score += 10;
        updateScoreboard();
        spawnFood();
    } else {
        snake.body.pop();
    }
}
function gameStep() {
    if (!gameRunning) return;

    // --- THE FIX: UNLOCK THE KEYS ---
    p1MovedThisFrame = false;
    p2MovedThisFrame = false;

    advanceSnake(p1);
    advanceSnake(p2);
    
    checkCollisions(); 
    draw();
}

function startNewGame() {
    // Clear any existing timer
    if (gameLoop) clearInterval(gameLoop);
    
    resetGame();
    gameRunning = true;

    // Set the speed based on the level config
    const speed = LEVEL_CONFIG[currentLevel].speed;
    
    // Start the loop
    gameLoop = setInterval(gameStep, speed);
}

function updateScoreboard() {
    document.getElementById('p1-score').innerText = p1.score;
    document.getElementById('p2-score').innerText = p2.score;
}

function checkCollisions() {
    const head1 = p1.body[0];
    const head2 = p2.body[0];

    // --- SELF COLLISION (Player 1) ---
    for (let i = 1; i < p1.body.length; i++) {
        if (head1.x === p1.body[i].x && head1.y === p1.body[i].y) {
            handleSelfHit(p1);
        }
    }

    // --- SELF COLLISION (Player 2) ---
    for (let i = 1; i < p2.body.length; i++) {
        if (head2.x === p2.body[i].x && head2.y === p2.body[i].y) {
            handleSelfHit(p2);
        }
    }

    // --- OPPONENT COLLISION ---
    if (currentLevel > 1) { // Medium and Hard only
        // Does P1 head hit P2 body?
        if (p2.body.some(seg => seg.x === head1.x && seg.y === head1.y)) {
            endGame("Player 2 Wins! Player 1 crashed.");
        }
        // Does P2 head hit P1 body?
        if (p1.body.some(seg => seg.x === head2.x && seg.y === head2.y)) {
            endGame("Player 1 Wins! Player 2 crashed.");
        }
    }
}

function handleSelfHit(snake) {
    if (currentLevel === 2) {
        // MEDIUM: Penalty - Snake loses its tail segments until it moves away
        if (snake.body.length > 2) {
            snake.body.pop(); 
        }
    } else if (currentLevel === 3) {
        // HARD: Instant Death
        endGame("Snake bit itself!");
    }
}


function endGame(message) {
    gameRunning = false;
    clearInterval(gameLoop);
    alert("Game Over! " + message);
}


/*----------------------------- Event Listeners -----------------------------*/
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

   // Player 1: WASD
    if (!p1MovedThisFrame) {
        if (key === 'w' && p1.dy === 0) { p1.dx = 0; p1.dy = -1; p1MovedThisFrame = true; }
        else if (key === 's' && p1.dy === 0) { p1.dx = 0; p1.dy = 1; p1MovedThisFrame = true; }
        else if (key === 'a' && p1.dx === 0) { p1.dx = -1; p1.dy = 0; p1MovedThisFrame = true; }
        else if (key === 'd' && p1.dx === 0) { p1.dx = 1; p1.dy = 0; p1MovedThisFrame = true; }
    }

    // Player 2: Arrow Keys
    if (!p2MovedThisFrame) {
        if (e.key === 'ArrowUp' && p2.dy === 0) { p2.dx = 0; p2.dy = -1; p2MovedThisFrame = true; }
        else if (e.key === 'ArrowDown' && p2.dy === 0) { p2.dx = 0; p2.dy = 1; p2MovedThisFrame = true; }
        else if (e.key === 'ArrowLeft' && p2.dx === 0) { p2.dx = -1; p2.dy = 0; p2MovedThisFrame = true; }
        else if (e.key === 'ArrowRight' && p2.dx === 0) { p2.dx = 1; p2.dy = 0; p2MovedThisFrame = true; }
    }
});