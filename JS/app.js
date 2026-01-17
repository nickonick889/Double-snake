
//1) Define the required variables used to track the state of the game.
// Declare p1, p2, food, gameRunning, and gameLoop

//2) Store cached element references.
//Grab the canvas, ctx, and score spans (document.getElementById).

//3) Run resetGame() to set starting positions and spawn the first food.

//4) The state of the game should be rendered to the user.
// The draw() function clears the screen and paints the snakes/food.

//5) Define the required constants.
// Set CANVAS_SIZE and your LEVEL_CONFIG object.

//6) Handle a player input for snake direction by Keydown Listeners and Button Clicks for levels.

//7) Create Reset functionality.
// Function that stops the timer, clears scores, and puts snakes back at start.


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

let p1, p2; 
let food = { x: 10, y: 5 }; 
let gameRunning = false;    
let gameLoop; 

let p1MovedThisFrame = false;
let p2MovedThisFrame = false;

/*-------------------------------- Functions --------------------------------*/

function resetGame() {
    gridSize = LEVEL_CONFIG[currentLevel].grid;
    tileCount = Math.floor(CANVAS_SIZE / gridSize);
    p1 = {
        body: [{x: 3, y: 2}, {x: 2, y: 2}, {x: 1, y: 2}],
        dx: 1,
        dy: 0,
        color: 'lime',
        score: 0
    };
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
    spawnFood();
    updateScoreboard();
    
    draw();
}

function draw() {
    ctx.fillStyle = "#333333";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ff4d4d";
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
    ctx.fillStyle = p1.color;
    p1.body.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });
    ctx.fillStyle = p2.color;
    p2.body.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

function spawnFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);

    // If food lands on P1 or P2, try again (Recursion)
    const onP1 = p1.body.some(seg => seg.x === food.x && seg.y === food.y);
    const onP2 = p2.body.some(seg => seg.x === food.x && seg.y === food.y);
    
    if (onP1 || onP2) {
        spawnFood(); 
    }
}

function setLevel(levelNumber) {
    currentLevel = levelNumber;
        gridSize = LEVEL_CONFIG[currentLevel].grid;
    tileCount = Math.floor(CANVAS_SIZE / gridSize); 
    gameRunning = false;
    if (gameLoop) clearInterval(gameLoop);
    resetGame();
    
    console.log(`Switched to ${LEVEL_CONFIG[currentLevel].name}. Grid: ${tileCount}x${tileCount}`);
}
function advanceSnake(snake) {
    let newX = snake.body[0].x + snake.dx;
    let newY = snake.body[0].y + snake.dy;
    if (newX < 0 || newX >= tileCount || newY < 0 || newY >= tileCount) {
        if (LEVEL_CONFIG[currentLevel].canWrap) {
            if (newX < 0) newX = tileCount - 1;
            else if (newX >= tileCount) newX = 0;
            if (newY < 0) newY = tileCount - 1;
            else if (newY >= tileCount) newY = 0;
        } else {
            endGame("Hit the wall!");
            return; 
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

    p1MovedThisFrame = false;
    p2MovedThisFrame = false;

    advanceSnake(p1);
    advanceSnake(p2);
    
    checkCollisions(); 
    draw();
}

function startNewGame() {
    if (gameLoop) clearInterval(gameLoop);
    resetGame();
    gameRunning = true;
    const speed = LEVEL_CONFIG[currentLevel].speed;
    gameLoop = setInterval(gameStep, speed);
}

function updateScoreboard() {
    document.getElementById('p1-score').innerText = p1.score;
    document.getElementById('p2-score').innerText = p2.score;
}

function checkCollisions() {
    const head1 = p1.body[0];
    const head2 = p2.body[0];
    for (let i = 1; i < p1.body.length; i++) {
        if (head1.x === p1.body[i].x && head1.y === p1.body[i].y) {
            handleSelfHit(p1);
        }
    }

    for (let i = 1; i < p2.body.length; i++) {
        if (head2.x === p2.body[i].x && head2.y === p2.body[i].y) {
            handleSelfHit(p2);
        }
    }

    if (currentLevel > 1) { 
        if (p2.body.some(seg => seg.x === head1.x && seg.y === head1.y)) {
            endGame("Player 2 Wins! Player 1 crashed.");
        }
        if (p1.body.some(seg => seg.x === head2.x && seg.y === head2.y)) {
            endGame("Player 1 Wins! Player 2 crashed.");
        }
    }
}

function handleSelfHit(snake) {
    if (currentLevel === 2) {
        if (snake.body.length > 2) {
            snake.body.pop(); 
        }
    } else if (currentLevel === 3) {
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
    if (!p1MovedThisFrame) {
        if (key === 'w' && p1.dy === 0) { p1.dx = 0; p1.dy = -1; p1MovedThisFrame = true; }
        else if (key === 's' && p1.dy === 0) { p1.dx = 0; p1.dy = 1; p1MovedThisFrame = true; }
        else if (key === 'a' && p1.dx === 0) { p1.dx = -1; p1.dy = 0; p1MovedThisFrame = true; }
        else if (key === 'd' && p1.dx === 0) { p1.dx = 1; p1.dy = 0; p1MovedThisFrame = true; }
    }
    if (!p2MovedThisFrame) {
        if (e.key === 'ArrowUp' && p2.dy === 0) { p2.dx = 0; p2.dy = -1; p2MovedThisFrame = true; }
        else if (e.key === 'ArrowDown' && p2.dy === 0) { p2.dx = 0; p2.dy = 1; p2MovedThisFrame = true; }
        else if (e.key === 'ArrowLeft' && p2.dx === 0) { p2.dx = -1; p2.dy = 0; p2MovedThisFrame = true; }
        else if (e.key === 'ArrowRight' && p2.dx === 0) { p2.dx = 1; p2.dy = 0; p2MovedThisFrame = true; }
    }
});