
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
const INITIAL_ROWS = 16;
//const INITIAL_GRID = 25; 
const INITIAL_SPEED = 300;
/*---------------------------- Variables (state) ----------------------------*/
let gridSize, tileCount, p1, p2, foods, obstacles, totalEaten, gameLoop;
let currentRows = 16;
let gameRunning = false;
let highScore = 0;
let showGameOver = false;
let gameOverMessage = "";
let p1MovedThisFrame = false;
let p2MovedThisFrame = false;
let gameSpeed = INITIAL_SPEED;

/*-------------------------------- Functions --------------------------------*/
function resetGame() {
    currentRows = INITIAL_ROWS; 
    gameSpeed = INITIAL_SPEED; 
    gridSize = CANVAS_SIZE / currentRows;
    tileCount = INITIAL_ROWS;
    totalEaten = 0;
    foods = [];
    obstacles = [];
    showGameOver = false;
    p1 = { body: [{x: 5, y: 5}, {x: 4, y: 5}], dx: 1, dy: 0, color: 'lime', score: 0 };
    p2 = { body: [{x: tileCount-6, y: tileCount-6}, {x: tileCount-5, y: tileCount-6}], dx: -1, dy: 0, color: 'dodgerblue', score: 0 };
    spawnFood(3);
    updateScoreboard();
}

function startNewGame() {
    resetGame();
    if (gameLoop) clearInterval(gameLoop);
    gameRunning = true;
    gameLoop = setInterval(gameStep, gameSpeed); 
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

function advanceSnake(snake) {
    if (!gameRunning) return;
    let newX = snake.body[0].x + snake.dx;
    let newY = snake.body[0].y + snake.dy;

    if (newX < 0 || newX >= tileCount || newY < 0 || newY >= tileCount) {
        return endGame(snake === p1 ? "P1 hit the wall!" : "P2 hit the wall!");
    }
    const head = { x: newX, y: newY };
    const foodIndex = foods.findIndex(f => f.x === head.x && f.y === head.y);
    snake.body.unshift(head);

    if (foodIndex !== -1) {
        totalEaten++;
        snake.score += 10;
        foods.splice(foodIndex, 1);
        spawnFood(1);
        // if (totalEaten % 5 === 0 && foods.length < 8) {
        //     spawnFood(2); 
        // } else {
        //     spawnFood(1);
        // }
        if (totalEaten % 5 === 0) {
            increaseSpeed();
            triggerEvent();
        }

        updateScoreboard();
    } else {
        snake.body.pop();
    }
}

//create a bomb an increase grid size
function triggerEvent() {
    obstacles.push({
        x: Math.floor(Math.random() * tileCount), 
        y: Math.floor(Math.random() * tileCount), 
        type: 'bomb'

});

    currentRows += 2;  
    gridSize = CANVAS_SIZE / currentRows;  
    tileCount = currentRows;
}

function increaseSpeed() {
    gameSpeed = Math.max(60, gameSpeed - 20);
    clearInterval(gameLoop);
    gameLoop = setInterval(gameStep, gameSpeed);
    console.log("Speed Up! New Interval: " + gameSpeed + "ms");
    updateScoreboard(); 
}

function checkCollisions() {
    if (!gameRunning) return;
    const h1 = p1.body[0];
    const h2 = p2.body[0];

    // Check hit opponent
    if (p2.body.some(s => s.x === h1.x && s.y === h1.y)) return endGame("Collision between snakes!");
    if (p1.body.some(s => s.x === h2.x && s.y === h2.y)) return endGame("Collision between snakes!");
    
    // Check hit self
    if (p1.body.slice(1).some(s => s.x === h1.x && s.y === h1.y)) return endGame("P1 bit itself!");
    if (p2.body.slice(1).some(s => s.x === h2.x && s.y === h2.y)) return endGame("P2 bit itself!");

    // Check bombs
    obstacles.forEach(ob => {
        if ((h1.x === ob.x && h1.y === ob.y) || (h2.x === ob.x && h2.y === ob.y)) endGame("BOOM! Hit a bomb.");
    });
}

function spawnFood(count) {
    for(let i=0; i<count; i++) {
        foods.push({ x: Math.floor(Math.random()*tileCount), y: Math.floor(Math.random()*tileCount) });
    }

}

function draw() {
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    foods.forEach(f => { ctx.fillStyle = "#ffffff"; ctx.fillRect(f.x*gridSize, f.y*gridSize, gridSize-2, gridSize-2); });
    obstacles.forEach(o => { ctx.fillStyle = "red"; ctx.fillRect(o.x*gridSize, o.y*gridSize, gridSize-2, gridSize-2); });

    [p1, p2].forEach(s => {
        ctx.fillStyle = s.color;
        s.body.forEach(seg => ctx.fillRect(seg.x*gridSize, seg.y*gridSize, gridSize-2, gridSize-2));
    });

   if (showGameOver) {
        // Dark Overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.textAlign = "center";
        // Header
        ctx.fillStyle = "#ff4d4d";
        ctx.font = "bold 28px Arial";
        ctx.fillText("GAME OVER", CANVAS_SIZE / 2, 140);
        // Current Speed
        ctx.fillStyle = "#ffcc00";
        ctx.font = "16px Arial";
        let finalSpeed = Math.round((INITIAL_SPEED / gameSpeed) * 100);
        ctx.fillText("Max Speed Reached: " + finalSpeed + "%", CANVAS_SIZE / 2, 280);
        // Reason for death
        ctx.fillStyle = "#cccccc";
        ctx.font = "16px Arial";
        ctx.fillText(gameOverMessage, CANVAS_SIZE / 2, 170);
        // FINAL SCORE (Combined)
        ctx.fillStyle = "white";
        ctx.font = "bold 22px Arial";
        ctx.fillText("Final Score: " + (p1.score + p2.score), CANVAS_SIZE / 2, 220);
        // BEST SCORE
        ctx.fillStyle = "#bb86fc";
        ctx.font = "18px Arial";
        ctx.fillText("Best Score: " + highScore, CANVAS_SIZE / 2, 250);
        // Restart Instruction
        ctx.fillStyle = "#00eee6";
        ctx.font = "14px Arial";
        ctx.fillText("Press 'START SURVIVAL' to play again", CANVAS_SIZE / 2, 310);
    }
}

function updateScoreboard() {
    document.getElementById('p1-score').innerText = p1.score;
    document.getElementById('p2-score').innerText = p2.score;
    document.getElementById('best-score').innerText = highScore;
    let currentInterval = gameSpeed;
    let speedPercent = Math.round((INITIAL_SPEED / currentInterval) * 100);
    document.getElementById('speed-display').innerText = speedPercent + "%";
}

function endGame(msg) {
    gameRunning = false;
    showGameOver = true;
    gameOverMessage = msg;
    clearInterval(gameLoop);
    const currentTotal = p1.score + p2.score;
    if (currentTotal > highScore) {
        highScore = currentTotal;
    }
    updateScoreboard();
    draw();
}
/*----------------------------- Event Listeners -----------------------------*/
window.addEventListener('keydown', (e) => {

    const scrollingKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];
    
    if (scrollingKeys.includes(e.key)) {
        e.preventDefault(); 
    }

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

resetGame();