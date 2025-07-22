// 游戏常量
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

// 方块形状定义
const PIECES = {
    I: [
        [1, 1, 1, 1]
    ],
    O: [
        [1, 1],
        [1, 1]
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1]
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0]
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1]
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1]
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1]
    ]
};

// 方块颜色
const COLORS = {
    I: '#00f5ff',
    O: '#ffd700',
    T: '#9400d3',
    S: '#00ff00',
    Z: '#ff0000',
    J: '#0000ff',
    L: '#ff8c00'
};

// 游戏状态
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        this.gameRunning = false;
        this.isPaused = false;
        
        this.currentPiece = null;
        this.nextPiece = null;
        
        this.init();
    }
    
    createBoard() {
        return Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    }
    
    init() {
        this.setupEventListeners();
        this.spawnPiece();
        this.spawnNextPiece();
        this.updateDisplay();
        this.draw();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.newGame());
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning || this.isPaused) return;
        
        switch(e.code) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotatePiece();
                break;
            case 'Space':
                e.preventDefault();
                this.togglePause();
                break;
        }
    }
    
    spawnPiece() {
        const pieceTypes = Object.keys(PIECES);
        const randomType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
        
        this.currentPiece = {
            type: randomType,
            shape: JSON.parse(JSON.stringify(PIECES[randomType])),
            x: Math.floor(BOARD_WIDTH / 2) - Math.floor(PIECES[randomType][0].length / 2),
            y: 0,
            color: COLORS[randomType]
        };
        
        // 检查游戏是否结束
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.gameOver();
        }
    }
    
    spawnNextPiece() {
        const pieceTypes = Object.keys(PIECES);
        const randomType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
        
        this.nextPiece = {
            type: randomType,
            shape: JSON.parse(JSON.stringify(PIECES[randomType])),
            color: COLORS[randomType]
        };
        
        this.drawNextPiece();
    }
    
    movePiece(dx, dy) {
        if (this.checkCollision(this.currentPiece, dx, dy)) {
            if (dy > 0) {
                this.lockPiece();
            }
            return false;
        }
        
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        return true;
    }
    
    rotatePiece() {
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        
        this.currentPiece.shape = rotated;
        
        if (this.checkCollision(this.currentPiece, 0, 0)) {
            this.currentPiece.shape = originalShape;
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    checkCollision(piece, dx, dy) {
        const newX = piece.x + dx;
        const newY = piece.y + dy;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const boardX = newX + x;
                    const boardY = newY + y;
                    
                    if (boardX < 0 || boardX >= BOARD_WIDTH || 
                        boardY >= BOARD_HEIGHT || 
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;
                    
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.currentPiece = this.nextPiece;
        this.spawnNextPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // 重新检查同一行
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 100);
            this.updateDisplay();
        }
    }
    
    update(deltaTime) {
        if (!this.gameRunning || this.isPaused) return;
        
        this.dropCounter += deltaTime;
        
        if (this.dropCounter > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropCounter = 0;
        }
    }
    
    draw() {
        this.ctx.fillStyle = '#1a202c';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制游戏板
        this.drawBoard();
        
        // 绘制当前方块
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece, this.ctx);
        }
        
        // 绘制网格线
        this.drawGrid();
    }
    
    drawBoard() {
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                if (this.board[y][x]) {
                    this.ctx.fillStyle = this.board[y][x];
                    this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
    }
    
    drawPiece(piece, context) {
        context.fillStyle = piece.color;
        
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const drawX = (piece.x + x) * BLOCK_SIZE;
                    const drawY = (piece.y + y) * BLOCK_SIZE;
                    
                    context.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
                    context.strokeStyle = '#fff';
                    context.lineWidth = 1;
                    context.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
                }
            }
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        
        for (let x = 0; x <= BOARD_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * BLOCK_SIZE, 0);
            this.ctx.lineTo(x * BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= BOARD_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, y * BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawNextPiece() {
        this.nextCtx.fillStyle = '#f7fafc';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * 20) / 2;
            const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * 20) / 2;
            
            this.nextCtx.fillStyle = this.nextPiece.color;
            
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        this.nextCtx.fillRect(
                            offsetX + x * 20,
                            offsetY + y * 20,
                            20, 20
                        );
                        this.nextCtx.strokeStyle = '#fff';
                        this.nextCtx.lineWidth = 1;
                        this.nextCtx.strokeRect(
                            offsetX + x * 20,
                            offsetY + y * 20,
                            20, 20
                        );
                    }
                }
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    gameLoop(time) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    start() {
        this.gameRunning = true;
        this.isPaused = false;
        document.getElementById('pause-btn').textContent = '暂停';
        this.gameLoop(0);
    }
    
    togglePause() {
        if (!this.gameRunning) return;
        
        this.isPaused = !this.isPaused;
        document.getElementById('pause-btn').textContent = this.isPaused ? '继续' : '暂停';
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('game-over').classList.remove('hidden');
    }
    
    newGame() {
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.gameRunning = false;
        this.isPaused = false;
        
        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('pause-btn').textContent = '暂停';
        
        this.spawnPiece();
        this.spawnNextPiece();
        this.updateDisplay();
        this.start();
    }
}

// 初始化游戏
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new TetrisGame();
    game.start();
});