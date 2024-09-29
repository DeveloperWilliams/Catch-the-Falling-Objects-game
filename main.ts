// Setup canvas and variables
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
canvas.width = 500;
canvas.height = 600;

let scoreElement = document.getElementById("score")!;
let missesElement = document.getElementById("misses")!;
let highScoreElement = document.getElementById("high-score")!;
let finalHighScoreElement = document.getElementById("final-high-score")!;

const playerWidth = 80;
const playerHeight = 20;
const objectWidth = 30;
const objectHeight = 30;

const maxMisses = 5;
let gameSpeed = 1;  // Multiplier for difficulty levels

// Sound effects
const goldenSound = document.getElementById("golden-sound") as HTMLAudioElement;
const bombSound = document.getElementById("bomb-sound") as HTMLAudioElement;
const catchSound = document.getElementById("catch-sound") as HTMLAudioElement;
const missSound = document.getElementById("miss-sound") as HTMLAudioElement;
const gameOverSound = document.getElementById("game-over-sound") as HTMLAudioElement;

// Player class
class Player implements IGameObject {
    x: number;
    y: number;
    speed: number;

    constructor() {
        this.x = canvas.width / 2 - playerWidth / 2;
        this.y = canvas.height - playerHeight - 10;
        this.speed = 5 * gameSpeed;
    }

    moveLeft() {
        this.x = Math.max(0, this.x - this.speed);
    }

    moveRight() {
        this.x = Math.min(canvas.width - playerWidth, this.x + this.speed);
    }

    draw() {
        ctx.fillStyle = "green";
        ctx.fillRect(this.x, this.y, playerWidth, playerHeight);
    }
}

// Base class for falling objects
class FallingObject implements IGameObject {
    x: number;
    y: number;
    speed: number;
    points: number;

    constructor(initialSpeed: number, points: number = 1) {
        this.x = Math.random() * (canvas.width - objectWidth);
        this.y = -objectHeight;
        this.speed = initialSpeed * gameSpeed;
        this.points = points;
    }

    fall() {
        this.y += this.speed;
    }

    draw() {
        ctx.fillStyle = "red";
        ctx.fillRect(this.x, this.y, objectWidth, objectHeight);
    }

    isCaught(player: Player): boolean {
        return (
            this.y + objectHeight > player.y &&
            this.x < player.x + playerWidth &&
            this.x + objectWidth > player.x
        );
    }

    isOutOfBounds(): boolean {
        return this.y > canvas.height;
    }

    applyEffect(game: Game) {
        game.score += this.points;
        catchSound.play();  // Play catch sound for normal objects
    }
}

// Special object classes: GoldenObject and BombObject
class GoldenObject extends FallingObject {
    constructor() {
        super(Math.random() * 2 + 2, 5); // 5 points for GoldenObject
    }

    draw() {
        ctx.fillStyle = "gold";
        ctx.fillRect(this.x, this.y, objectWidth, objectHeight);
    }

    applyEffect(game: Game) {
        game.score += this.points;
        goldenSound.play();  // Play golden sound
    }
}

class BombObject extends FallingObject {
    constructor() {
        super(Math.random() * 2 + 2, -3); // -3 points for BombObject
    }

    draw() {
        ctx.fillStyle = "black";
        ctx.fillRect(this.x, this.y, objectWidth, objectHeight);
    }

    applyEffect(game: Game) {
        game.score += this.points;
        game.misses++; // Increment misses
        bombSound.play();  // Play bomb sound
    }
}

// Game class with high score, sound effects, and difficulty
class Game {
    player: Player;
    fallingObjects: FallingObject[];
    score: number;
    misses: number;
    gameOver: boolean;
    difficultyMultiplier: number;
    highScore: number;

    constructor() {
        this.player = new Player();
        this.fallingObjects = [];
        this.score = 0;
        this.misses = 0;
        this.gameOver = false;
        this.difficultyMultiplier = 1;
        this.highScore = this.loadHighScore();
        this.initEventListeners();
        this.displayHighScore();
    }

    initEventListeners() {
        window.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft") this.player.moveLeft();
            if (event.key === "ArrowRight") this.player.moveRight();
        });
    }

    createObject() {
        if (Math.random() < 0.03) {
            const rand = Math.random();
            if (rand < 0.1) {
                this.fallingObjects.push(new GoldenObject());
            } else if (rand < 0.2) {
                this.fallingObjects.push(new BombObject());
            } else {
                const objectSpeed = this.difficultyMultiplier * (Math.random() * 2 + 2);
                this.fallingObjects.push(new FallingObject(objectSpeed));
            }
        }
    }

    increaseDifficulty() {
        if (this.score % 5 === 0 && this.score !== 0) {
            this.difficultyMultiplier += 0.2;
        }
    }

    update() {
        if (this.misses >= maxMisses) {
            this.gameOver = true;
            this.checkHighScore();
            gameOverSound.play();  // Play game over sound
            return;
        }

        this.fallingObjects.forEach((obj, index) => {
            obj.fall();

            if (obj.isCaught(this.player)) {
                obj.applyEffect(this);
                this.fallingObjects.splice(index, 1);
                scoreElement.textContent = this.score.toString();
                this.increaseDifficulty();
            } else if (obj.isOutOfBounds()) {
                this.fallingObjects.splice(index, 1);
                this.misses++;
                missesElement.textContent = this.misses.toString();
                missSound.play();  // Play miss sound
            }
        });

        this.createObject();
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.player.draw();

        this.fallingObjects.forEach((obj) => {
            obj.draw();
        });
    }

    run() {
        if (!this.gameOver) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.run());
        } else {
            this.showGameOverScreen();
        }
    }

    loadHighScore(): number {
        return parseInt(localStorage.getItem("highScore") || "0", 10);
    }

    saveHighScore() {
        localStorage.setItem("highScore", this.highScore.toString());
    }

    checkHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
        this.displayHighScore();
    }

    displayHighScore() {
        highScoreElement.textContent = this.highScore.toString();
        finalHighScoreElement.textContent = this.highScore.toString();
    }

    showGameOverScreen() {
        document.getElementById("game-over-screen")!.style.display = "block";
    }
}

// Difficulty Selection and Game Initialization
document.getElementById("easy-button")!.addEventListener("click", () => startGame(1));
document.getElementById("medium-button")!.addEventListener("click", () => startGame(1.5));
document.getElementById("hard-button")!.addEventListener("click", () => startGame(2));

function startGame(speed: number) {
    gameSpeed = speed;  // Set the game speed based on difficulty
    document.getElementById("difficulty-selection")!.style.display = "none";
    const game = new Game();
    game.run();
}

document.getElementById("restart-button")!.addEventListener("click", () => {
    document.getElementById("game-over-screen")!.style.display = "none";
    startGame(gameSpeed);  // Restart with the same difficulty level
});
