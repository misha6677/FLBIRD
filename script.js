class Game {
    constructor() {
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.frames = 0;
        this.gamePaused = false;
        this.mute = false;
        this.night = false;
        this.state = {
            current: 0,
            home: 0,
            getReady: 1,
            game: 2,
            gameOver: 3
        };
        this.spriteSheet = new Image();
        this.spriteSheet.src = "img/sprite_sheet.png";
        this.soundManager = new SoundManager(this);
        this.bird = new Bird(this);
        this.pipes = new Pipes(this);
        this.background = new Background(this);
        this.foreground = new Foreground(this);
        this.gameButtons = new GameButtons(this);
        this.score = new Score(this);
        this.medal = new Medal(this);
        this.home = new Home(this);
        this.getReady = new GetReady(this);
        this.gameOver = new GameOver(this);
        this.setupEventListeners();
        this.canvasScale();
        this.loop();
    }

    canvasScale() {
        this.canvas.height = window.innerHeight - 2;
        this.canvas.width = this.canvas.height * 0.72 - 2;
        this.background.resize();
        this.foreground.resize();
        this.bird.resize();
        this.pipes.resize();
        this.home.resize();
        this.getReady.resize();
        this.gameButtons.resize();
        this.gameOver.resize();
        this.score.resize();
        this.medal.resize();
    }

    setupEventListeners() {
        this.canvas.addEventListener("click", (event) => this.handleClick(event));
        document.addEventListener("keydown", (event) => this.handleKeyDown(event));
        document.addEventListener("keyup", (event) => this.handleKeyUp(event));
        window.addEventListener("resize", () => this.canvasScale());
    }

    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        switch (this.state.current) {
            case this.state.home:
                this.handleHomeClick(clickX, clickY);
                break;
            case this.state.getReady:
                this.startGame();
                break;
            case this.state.game:
                this.handleGameClick(clickX, clickY);
                break;
            case this.state.gameOver:
                this.handleGameOverClick(clickX, clickY);
                break;
        }
    }

    handleHomeClick(x, y) {
        if (this.gameButtons.isMuteButtonClicked(x, y)) {
            this.mute = !this.mute;
            this.soundManager.playSwoosh();
        } else if (this.gameButtons.isNightButtonClicked(x, y)) {
            this.night = !this.night;
            this.soundManager.playSwoosh();
        } else if (this.gameButtons.isStartButtonClicked(x, y)) {
            this.state.current = this.state.getReady;
            this.soundManager.playSwoosh();
        }
    }

    startGame() {
        this.bird.flap();
        this.soundManager.playFlap();
        this.state.current = this.state.game;
    }

    handleGameClick(x, y) {
        if (this.gameButtons.isPauseButtonClicked(x, y)) {
            this.gamePaused = !this.gamePaused;
        } else if (!this.gamePaused) {
            this.bird.flap();
            this.soundManager.playFlap();
        }
    }

    handleGameOverClick(x, y) {
        if (this.gameButtons.isRestartButtonClicked(x, y)) {
            this.resetGame();
            this.state.current = this.state.getReady;
            this.soundManager.playSwoosh();
        } else if (this.gameButtons.isHomeButtonClicked(x, y)) {
            this.resetGame();
            this.state.current = this.state.home;
            this.soundManager.playSwoosh();
        }
    }

    resetGame() {
        this.pipes.reset();
        this.bird.reset();
        this.score.reset();
    }

    handleKeyDown(event) {
        if (event.key === " ") {
            if (this.state.current === this.state.getReady) {
                this.startGame();
            } else if (this.state.current === this.state.game && !this.gamePaused) {
                this.bird.flap();
                this.soundManager.playFlap();
            }
        } else if (event.key === "p" || event.key === "P") {
            this.gamePaused = !this.gamePaused;
        } else if (event.key === "n" || event.key === "N") {
            this.night = !this.night;
        }
    }

    handleKeyUp(event) {
        if (event.key === " ") {
            this.bird.resetFlap();
        }
    }

    update() {
        if (!this.gamePaused) {
            this.bird.update();
            this.foreground.update();
            this.pipes.update();
        }
        this.home.update();
        this.medal.update();
    }

    draw() {
        this.ctx.fillStyle = this.night ? "#12284C" : "#7BC5CD";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.background.draw();
        this.pipes.draw();
        this.foreground.draw();
        this.bird.draw();
        this.home.draw();
        this.getReady.draw();
        this.gameButtons.draw();
        this.gameOver.draw();
        this.medal.draw();
        this.score.draw();
    }

    loop() {
        setTimeout(() => {
            this.update();
            this.draw();
            if (!this.gamePaused) {
                this.frames++;
            }
            requestAnimationFrame(() => this.loop());
        }, 1000 / 75);
    }
}

class SoundManager {
    constructor(game) {
        this.game = game;
        this.DIE = new Audio("audio/die.wav");
        this.FLAP = new Audio("audio/flap.wav");
        this.HIT = new Audio("audio/hit.wav");
        this.POINT = new Audio("audio/point.wav");
        this.SWOOSH = new Audio("audio/swooshing.wav");
    }

    playSwoosh() {
        if (!this.game.mute) {
            this.SWOOSH.currentTime = 0;
            this.SWOOSH.play();
        }
    }

    playFlap() {
        if (!this.game.mute) {
            this.FLAP.currentTime = 0;
            this.FLAP.play();
        }
    }

    playHit() {
        if (!this.game.mute) {
            this.HIT.currentTime = 0;
            this.HIT.play();
        }
    }

    playDie() {
        if (!this.game.mute) {
            this.DIE.currentTime = 0;
            this.DIE.play();
        }
    }

    playPoint() {
        if (!this.game.mute) {
            this.POINT.currentTime = 0;
            this.POINT.play();
        }
    }
}

class Bird {
    constructor(game) {
        this.game = game;
        this.animation = [
            { spriteX: 932, spriteY: 429 },
            { spriteX: 932, spriteY: 478 },
            { spriteX: 932, spriteY: 527 }
        ];
        this.frame = 0;
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.gravity = 0;
        this.jump = 0;
        this.speed = 0;
        this.rotation = 0;
        this.radius_x = 0;
        this.radius_y = 0;
        this.resize();
    }

    reset() {
        this.x = this.game.canvas.width * 0.290;
        this.y = this.game.canvas.height * 0.395;
        this.speed = 0;
        this.rotation = 0;
        this.frame = 0;
    }


    resize() {
        this.x = this.game.canvas.width * 0.290;
        this.y = this.game.canvas.height * 0.395;
        this.w = this.game.canvas.width * 0.117;
        this.h = this.game.canvas.height * 0.059;
        this.gravity = this.game.canvas.height * 0.0006;
        this.jump = this.game.canvas.height * 0.01;
        this.radius_x = this.game.canvas.width * 0.052;
        this.radius_y = this.game.canvas.height * 0.026;
    }

    flap() {
        this.speed = -this.jump;
    }

    resetFlap() {
        this.speed = 0;
    }

    update() {
        this.period = this.game.state.current === this.game.state.getReady ? 6 : 4;
        this.frame += this.game.frames % this.period === 0 ? 1 : 0;
        this.frame = this.frame % this.animation.length;

        if (this.game.state.current === this.game.state.getReady) {
            this.y = this.game.canvas.height * 0.395;
            this.rotation = 0;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;

            if (this.y + this.h / 2 >= this.game.foreground.y) {
                this.y = this.game.foreground.y - this.h / 2;
                if (this.game.state.current === this.game.state.game) {
                    this.game.state.current = this.game.state.gameOver;
                    this.game.soundManager.playHit();
                    setTimeout(() => {
                        this.game.soundManager.playDie();
                    }, 500);
                }
            }

            if (this.speed >= this.jump) {
                this.rotation = 90 * (Math.PI / 180);
                this.frame = 0;
            } else {
                this.rotation = -25 * (Math.PI / 180);
            }
        }
    }

    draw() {
        const birdFrame = this.animation[this.frame];
        this.game.ctx.save();
        this.game.ctx.translate(this.x, this.y);
        this.game.ctx.rotate(this.rotation);
        this.game.ctx.drawImage(
            this.game.spriteSheet,
            birdFrame.spriteX, birdFrame.spriteY,
            68, 48,
            -this.w / 2, -this.h / 2,
            this.w, this.h
        );
        this.game.ctx.restore();
    }
}

class Pipes {
    constructor(game) {
        this.game = game;
        this.position = [];
        this.top = { spriteX: 1001, spriteY: 0, spriteW: 104, spriteH: 800 };
        this.bottom = { spriteX: 1105, spriteY: 0, spriteW: 104, spriteH: 800 };
        this.dx = 0;
        this.gap = 0;
        this.maxYPos = 0;
        this.w = 0;
        this.h = 0;
        this.resize();
    }

    resize() {
        this.w = this.game.canvas.width * 0.164;
        this.h = this.game.canvas.height * 0.888;
        this.gap = this.game.canvas.height * 0.177;
        this.maxYPos = -(this.game.canvas.height * 0.350);
        this.dx = this.game.canvas.width * 0.007;
    }

    reset() {
        this.position = [];
    }

    update() {
        if (this.game.state.current !== this.game.state.game) return;

        if (this.game.frames % 80 === 0) {
            this.position.push({
                x: this.game.canvas.width,
                y: this.maxYPos * (Math.random() + 1),
                scored: false
            });
        }

        for (let i = 0; i < this.position.length; i++) {
            const p = this.position[i];
            const bottomYPos = p.y + this.h + this.gap;

            // Collision detection
            if (this.game.bird.x + this.game.bird.radius_x > p.x &&
                this.game.bird.x - this.game.bird.radius_x < p.x + this.w &&
                this.game.bird.y + this.game.bird.radius_y > p.y &&
                this.game.bird.y - this.game.bird.radius_y < p.y + this.h) {
                this.game.state.current = this.game.state.gameOver;
                this.game.soundManager.playHit();
                setTimeout(() => {
                    if (this.game.state.current === this.game.state.gameOver) {
                        this.game.soundManager.playDie();
                    }
                }, 500);
            }

            if (this.game.bird.x + this.game.bird.radius_x > p.x &&
                this.game.bird.x - this.game.bird.radius_x < p.x + this.w &&
                this.game.bird.y + this.game.bird.radius_y > bottomYPos &&
                this.game.bird.y - this.game.bird.radius_y < bottomYPos + this.h) {
                this.game.state.current = this.game.state.gameOver;
                this.game.soundManager.playHit();
                setTimeout(() => {
                    if (this.game.state.current === this.game.state.gameOver) {
                        this.game.soundManager.playDie();
                    }
                }, 500);
            }

            if (this.game.bird.x + this.game.bird.radius_x > p.x &&
                this.game.bird.x - this.game.bird.radius_x < p.x + this.w &&
                this.game.bird.y <= 0) {
                this.game.state.current = this.game.state.gameOver;
                this.game.soundManager.playHit();
                setTimeout(() => {
                    if (this.game.state.current === this.game.state.gameOver) {
                        this.game.soundManager.playDie();
                    }
                }, 500);
            }

            p.x -= this.dx;

            if (this.position.length === 6) {
                this.position.splice(0, 2);
            }

            if (p.x + this.w < this.game.bird.x - this.game.bird.radius_x && !p.scored) {
                this.game.score.game_score++;
                if (!this.game.mute) {
                    this.game.soundManager.playPoint();
                }
                if (this.game.score.game_score > this.game.score.best_score) {
                    this.game.score.best_score = this.game.score.game_score;
                    this.game.score.new_best_score = true;
                }
                localStorage.setItem("best_score", this.game.score.best_score);
                p.scored = true;
            }
        }
    }

    draw() {
        if (this.game.state.current === this.game.state.game || this.game.state.current === this.game.state.gameOver) {
            for (let i = 0; i < this.position.length; i++) {
                const p = this.position[i];
                const bottomYPos = p.y + this.h + this.gap;

                this.game.ctx.drawImage(
                    this.game.spriteSheet,
                    this.top.spriteX, this.top.spriteY,
                    this.top.spriteW, this.top.spriteH,
                    p.x, p.y,
                    this.w, this.h
                );

                this.game.ctx.drawImage(
                    this.game.spriteSheet,
                    this.bottom.spriteX, this.bottom.spriteY,
                    this.bottom.spriteW, this.bottom.spriteH,
                    p.x, bottomYPos,
                    this.w, this.h
                );
            }
        }
    }
}

class Background {
    constructor(game) {
        this.game = game;
        this.day_spriteX = 0;
        this.night_spriteX = 1211;
        this.spriteY = 392;
        this.spriteW = 552;
        this.spriteH = 408;
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.stars = {
            spriteX: 1211,
            spriteY: 0,
            spriteW: 552,
            spriteH: 392,
            y: 0,
            h: 0
        };
        this.resize();
    }

    resize() {
        this.x = 0;
        this.y = this.game.canvas.height * 0.631;
        this.w = this.game.canvas.width;
        this.h = this.w * 0.74;
        this.stars.y = this.y * 0.167;
        this.stars.h = this.game.canvas.height - this.h;
    }

    draw() {
        const spriteX = this.game.night ? this.night_spriteX : this.day_spriteX;
        this.game.ctx.drawImage(
            this.game.spriteSheet,
            spriteX, this.spriteY,
            this.spriteW, this.spriteH,
            this.x, this.y,
            this.w, this.h
        );

        if (this.game.night) {
            this.game.ctx.drawImage(
                this.game.spriteSheet,
                this.stars.spriteX, this.stars.spriteY,
                this.stars.spriteW, this.stars.spriteH,
                this.x, this.stars.y,
                this.w, this.stars.h
            );
        }
    }
}

class Foreground {
    constructor(game) {
        this.game = game;
        this.spriteX = 553;
        this.spriteY = 576;
        this.spriteW = 447;
        this.spriteH = 224;
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.dx = 0;
        this.resize();
    }

    resize() {
        this.x = 0;
        this.y = this.game.canvas.height * 0.861;
        this.w = this.game.canvas.width * 0.7;
        this.h = this.w * 0.46;
        this.dx = this.game.canvas.width * 0.007;
    }

    update() {
        if (this.game.state.current !== this.game.state.gameOver) {
            this.x = (this.x - this.dx) % (this.w / 2);
        }
    }

    draw() {
        this.game.ctx.drawImage(
            this.game.spriteSheet,
            this.spriteX, this.spriteY,
            this.spriteW, this.spriteH,
            this.x, this.y,
            this.w, this.h
        );

        this.game.ctx.drawImage(
            this.game.spriteSheet,
            this.spriteX, this.spriteY,
            this.spriteW, this.spriteH,
            (this.x + this.w) - 0.7, this.y,
            this.w, this.h
        );
    }
}

class GameButtons {
    constructor(game) {
        this.game = game;
        this.mute_button = { spriteX: 171, spriteY: 63, spriteW: 55, spriteH: 62 };
        this.unmute_button = { spriteX: 171, spriteY: 0, spriteW: 55, spriteH: 62 };
        this.start_button = { spriteX: 227, spriteY: 0, spriteW: 160, spriteH: 56, x: 0, y: 0, w: 0, h: 0 };
        this.pause_button = { spriteX: 280, spriteY: 114, spriteW: 52, spriteH: 56 };
        this.resume_button = { spriteX: 227, spriteY: 114, spriteW: 52, spriteH: 56 };
        this.home_button = { spriteX: 388, spriteY: 171, spriteW: 160, spriteH: 56, x: 0, y: 0, w: 0, h: 0 };
        this.restart_button = { spriteX: 227, spriteY: 57, spriteW: 160, spriteH: 56, x: 0, y: 0, w: 0, h: 0 };
        this.night_button = { spriteX: 280, spriteY: 171, spriteW: 56, spriteH: 60, x: 0 };
        this.day_button = { spriteX: 223, spriteY: 171, spriteW: 56, spriteH: 60, x: 0 };
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.resize();
    }

    resize() {
        this.x = this.game.canvas.width * 0.087;
        this.y = this.game.canvas.height * 0.045;
        this.w = this.game.canvas.width * 0.088;
        this.h = this.game.canvas.height * 0.069;
        this.night_button.x = this.game.canvas.width * 0.189;
        this.start_button.x = this.game.canvas.width * 0.359;
        this.start_button.y = this.game.canvas.height * 0.759;
        this.start_button.w = this.game.canvas.width * 0.276;
        this.start_button.h = this.game.canvas.height * 0.068;
        this.restart_button.x = this.game.canvas.width * 0.147;
        this.restart_button.y = this.game.canvas.height * 0.759;
        this.restart_button.w = this.game.canvas.width * 0.276;
        this.restart_button.h = this.game.canvas.height * 0.068;
        this.home_button.x = this.game.canvas.width * 0.576;
        this.home_button.y = this.game.canvas.height * 0.759;
        this.home_button.w = this.game.canvas.width * 0.276;
        this.home_button.h = this.game.canvas.height * 0.068;
    }

    isMuteButtonClicked(x, y) {
        return x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h;
    }

    isNightButtonClicked(x, y) {
        return x >= this.night_button.x && x <= this.night_button.x + this.w && y >= this.y && y <= this.y + this.h;
    }

    isStartButtonClicked(x, y) {
        return x >= this.start_button.x && x <= this.start_button.x + this.start_button.w &&
            y >= this.start_button.y && y <= this.start_button.y + this.start_button.h;
    }

    isPauseButtonClicked(x, y) {
        return x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h;
    }

    isRestartButtonClicked(x, y) {
        return x >= this.restart_button.x && x <= this.restart_button.x + this.restart_button.w &&
            y >= this.restart_button.y && y <= this.restart_button.y + this.restart_button.h;
    }

    isHomeButtonClicked(x, y) {
        return x >= this.home_button.x && x <= this.home_button.x + this.home_button.w &&
            y >= this.home_button.y && y <= this.home_button.y + this.home_button.h;
    }

    draw() {
        if (this.game.state.current === this.game.state.home) {
            if (!this.game.mute) {
                this.game.ctx.drawImage(
                    this.game.spriteSheet,
                    this.unmute_button.spriteX, this.unmute_button.spriteY,
                    this.unmute_button.spriteW, this.unmute_button.spriteH,
                    this.x, this.y,
                    this.w, this.h
                );
            } else {
                this.game.ctx.drawImage(
                    this.game.spriteSheet,
                    this.mute_button.spriteX, this.mute_button.spriteY,
                    this.mute_button.spriteW, this.mute_button.spriteH,
                    this.x, this.y,
                    this.w, this.h
                );
            }

            if (!this.game.night) {
                this.game.ctx.drawImage(
                    this.game.spriteSheet,
                    this.day_button.spriteX, this.day_button.spriteY,
                    this.day_button.spriteW, this.day_button.spriteH,
                    this.night_button.x, this.y,
                    this.w, this.h
                );
            } else {
                this.game.ctx.drawImage(
                    this.game.spriteSheet,
                    this.night_button.spriteX, this.night_button.spriteY,
                    this.night_button.spriteW, this.night_button.spriteH,
                    this.night_button.x, this.y,
                    this.w, this.h
                );
            }

            this.game.ctx.drawImage(
                this.game.spriteSheet,
                this.start_button.spriteX, this.start_button.spriteY,
                this.start_button.spriteW, this.start_button.spriteH,
                this.start_button.x, this.start_button.y,
                this.start_button.w, this.start_button.h
            );
        } else if (this.game.state.current === this.game.state.game) {
            if (!this.game.gamePaused) {
                this.game.ctx.drawImage(
                    this.game.spriteSheet,
                    this.pause_button.spriteX, this.pause_button.spriteY,
                    this.pause_button.spriteW, this.pause_button.spriteH,
                    this.x, this.y,
                    this.w, this.h
                );
            } else {
                this.game.ctx.drawImage(
                    this.game.spriteSheet,
                    this.resume_button.spriteX, this.resume_button.spriteY,
                    this.resume_button.spriteW, this.resume_button.spriteH,
                    this.x, this.y,
                    this.w, this.h
                );
            }
        } else if (this.game.state.current === this.game.state.gameOver) {
            this.game.ctx.drawImage(
                this.game.spriteSheet,
                this.restart_button.spriteX, this.restart_button.spriteY,
                this.restart_button.spriteW, this.restart_button.spriteH,
                this.restart_button.x, this.restart_button.y,
                this.restart_button.w, this.restart_button.h
            );

            this.game.ctx.drawImage(
                this.game.spriteSheet,
                this.home_button.spriteX, this.home_button.spriteY,
                this.home_button.spriteW, this.home_button.spriteH,
                this.home_button.x, this.home_button.y,
                this.home_button.w, this.home_button.h
            );
        }
    }
}

class Score {
    constructor(game) {
        this.game = game;
        this.number = [
            { spriteX: 98 }, { spriteX: 127 }, { spriteX: 156 }, { spriteX: 185 },
            { spriteX: 214 }, { spriteX: 243 }, { spriteX: 272 }, { spriteX: 301 },
            { spriteX: 330 }, { spriteX: 359 }
        ];
        this.spriteY = 243;
        this.spriteW = 28;
        this.spriteH = 40;
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.one_w = 0;
        this.space = 0;
        this.score = { x: 0, y: 0, w: 0, h: 0 };
        this.best = { x: 0, y: 0, w: 0, h: 0 };
        this.best_score = parseInt(localStorage.getItem("best_score")) || 0;
        this.game_score = 0;
        this.new_best_score = false;
        this.resize();
    }

    resize() {
        this.w = this.game.canvas.width * 0.048;
        this.h = this.game.canvas.height * 0.046;
        this.one_w = this.game.canvas.width * 0.032;
        this.space = this.game.canvas.width * 0.016;
        this.x = this.game.canvas.width * 0.476;
        this.y = this.game.canvas.height * 0.045;
        this.score.x = this.game.canvas.width * 0.769;
        this.score.y = this.game.canvas.height * 0.441;
        this.best.x = this.game.canvas.width * 0.769;
        this.best.y = this.game.canvas.height * 0.545;
    }

    reset() {
        this.game_score = 0;
        this.new_best_score = false;
    }

    draw() {
        const game_score_s = this.game_score.toString();
        const best_score_s = this.best_score.toString();

        if (this.game.state.current === this.game.state.game) {
            let total_width = 0;
            for (let i = 0; i < game_score_s.length; i++) {
                if (game_score_s[i] === "1") {
                    total_width += this.one_w + this.space;
                } else {
                    total_width += this.w + this.space;
                }
            }
            total_width -= this.space;

            let offset = this.x - total_width / 2 + (this.w / 2);

            for (let i = 0; i < game_score_s.length; i++) {
                if (i < game_score_s.length - 1 && game_score_s[i + 1] === "1") {
                    this.game.ctx.drawImage(
                        this.game.spriteSheet,
                        this.number[parseInt(game_score_s[i])].spriteX, this.spriteY,
                        this.spriteW, this.spriteH,
                        offset, this.y,
                        this.w, this.h
                    );
                    offset += this.one_w + this.space;
                } else {
                    this.game.ctx.drawImage(
                        this.game.spriteSheet,
                        this.number[parseInt(game_score_s[i])].spriteX, this.spriteY,
                        this.spriteW, this.spriteH,
                        offset, this.y,
                        this.w, this.h
                    );
                    offset += this.w + this.space;
                }
            }
        } else if (this.game.state.current === this.game.state.gameOver) {
            let offset_1 = 0;
            for (let i = game_score_s.length - 1; i >= 0; i--) {
                this.game.ctx.drawImage(
                    this.game.spriteSheet,
                    this.number[parseInt(game_score_s[i])].spriteX, this.spriteY,
                    this.spriteW, this.spriteH,
                    this.score.x + offset_1, this.score.y,
                    this.w, this.h
                );
                if (game_score_s[i] === "1") {
                    offset_1 -= this.one_w + this.space;
                } else {
                    offset_1 -= this.w + this.space;
                }
            }

            let offset_2 = 0;
            for (let i = best_score_s.length - 1; i >= 0; i--) {
                this.game.ctx.drawImage(
                    this.game.spriteSheet,
                    this.number[parseInt(best_score_s[i])].spriteX, this.spriteY,
                    this.spriteW, this.spriteH,
                    this.best.x + offset_2, this.best.y,
                    this.w, this.h
                );
                if (best_score_s[i] === "1") {
                    offset_2 -= this.one_w + this.space;
                } else {
                    offset_2 -= this.w + this.space;
                }
            }

            if (this.new_best_score) {
                this.game.ctx.drawImage(
                    this.game.spriteSheet,
                    921, 349,
                    64, 28,
                    this.game.canvas.width * 0.577, this.game.canvas.height * 0.500,
                    this.game.canvas.width * 0.112, this.game.canvas.height * 0.035
                );
            }
        }
    }
}

class Medal {
    constructor(game) {
        this.game = game;
        this.bronze = { spriteX: 554 };
        this.silver = { spriteX: 642 };
        this.gold = { spriteX: 731 };
        this.platinum = { spriteX: 820 };
        this.spriteY = 487;
        this.spriteW = 88;
        this.spriteH = 87;
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.animation = [
            { spriteX: 922, spriteY: 386, spriteW: 20, spriteH: 20 },
            { spriteX: 943, spriteY: 386, spriteW: 20, spriteH: 20 },
            { spriteX: 964, spriteY: 386, spriteW: 20, spriteH: 20 },
            { spriteX: 943, spriteY: 386, spriteW: 20, spriteH: 20 },
            { spriteX: 922, spriteY: 386, spriteW: 20, spriteH: 20 }
        ];
        this.animation_w = 0;
        this.animation_h = 0;
        this.shine_position = [];
        this.frame = 0;
        this.radius = 0;
        this.centerX = 0;
        this.centerY = 0;
        this.resize();
    }

    resize() {
        this.x = this.game.canvas.width * 0.197;
        this.y = this.game.canvas.height * 0.461;
        this.w = this.game.canvas.width * 0.152;
        this.h = this.game.canvas.height * 0.108;
        this.radius = this.game.canvas.width * 0.061;
        this.centerX = this.game.canvas.width * 0.257;
        this.centerY = this.game.canvas.height * 0.506;
        this.animation_w = this.game.canvas.width * 0.034;
        this.animation_h = this.game.canvas.height * 0.023;
    }

    update() {
        this.period = 7;
        this.frame += this.game.frames % this.period === 0 ? 1 : 0;
        this.frame = this.frame % this.animation.length;

        if (this.frame === this.animation.length - 1) {
            this.shine_position = [];
        }

        if (this.game.frames % (this.period * this.animation.length) === 0) {
            const limit = 0.9 * this.radius;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * limit;

            this.shine_position.push({
                x: this.centerX + Math.cos(angle) * distance,
                y: this.centerY + Math.sin(angle) * distance
            });
        }
    }

    draw() {
        let medalSpriteX;
        if (this.game.score.game_score >= 10 && this.game.score.game_score < 20) {
            medalSpriteX = this.bronze;
        } else if (this.game.score.game_score >= 20 && this.game.score.game_score < 30) {
            medalSpriteX = this.silver;
        } else if (this.game.score.game_score >= 30 && this.game.score.game_score < 40) {
            medalSpriteX = this.gold;
        } else if (this.game.score.game_score >= 40) {
            medalSpriteX = this.platinum;
        }

        if (this.game.state.current === this.game.state.gameOver && this.game.score.game_score >= 10) {
            this.game.ctx.drawImage(
                this.game.spriteSheet,
                medalSpriteX.spriteX, this.spriteY,
                this.spriteW, this.spriteH,
                this.x, this.y,
                this.w, this.h
            );

            const shine = this.animation[this.frame];
            for (let i = 0; i < this.shine_position.length; i++) {
                const position = this.shine_position[i];
                this.game.ctx.drawImage(
                    this.game.spriteSheet,
                    shine.spriteX, shine.spriteY,
                    shine.spriteW, shine.spriteH,
                    position.x, position.y,
                    this.animation_w, this.animation_h
                );
            }
        }
    }
}

class Home {
    constructor(game) {
        this.game = game;
        this.logo = { spriteX: 552, spriteY: 233, spriteW: 384, spriteH: 87, x: 0, y: 0, w: 0, h: 0, MAXY: 0, MINY: 0, dy: 0 };
        this.animation = [
            { spriteX: 931, spriteY: 429 },
            { spriteX: 931, spriteY: 478 },
            { spriteX: 931, spriteY: 527 }
        ];
        this.bird = { x: 0, y: 0, w: 0, h: 0 };
        this.studio_name = { spriteX: 172, spriteY: 284, spriteW: 380, spriteH: 28, x: 0, y: 0, w: 0, h: 0 };
        this.frame = 0;
        this.logoGoUp = true;
        this.resize();
    }

    resize() {
        this.logo.x = this.game.canvas.width * 0.098;
        this.logo.y = this.game.canvas.height * 0.279;
        this.logo.w = this.game.canvas.width * 0.665;
        this.logo.h = this.game.canvas.height * 0.109;
        this.logo.MAXY = this.logo.y - this.logo.h / 7;
        this.logo.MINY = this.logo.y + this.logo.h / 7;
        this.logo.dy = this.game.canvas.width * 0.0012;
        this.bird.x = this.game.canvas.width * 0.803;
        this.bird.y = this.game.canvas.height * 0.294;
        this.bird.w = this.game.canvas.width * 0.117;
        this.bird.h = this.game.canvas.height * 0.059;
        this.studio_name.x = this.game.canvas.width * 0.171;
        this.studio_name.y = this.game.canvas.height * 0.897;
        this.studio_name.w = this.game.canvas.width * 0.659;
        this.studio_name.h = this.game.canvas.height * 0.034;
    }

    update() {
        if (this.game.state.current === this.game.state.home) {
            if (this.logoGoUp) {
                this.logo.y -= this.logo.dy;
                this.bird.y -= this.logo.dy;
                if (this.logo.y <= this.logo.MAXY) {
                    this.logoGoUp = false;
                }
            } else {
                this.logo.y += this.logo.dy;
                this.bird.y += this.logo.dy;
                if (this.logo.y >= this.logo.MINY) {
                    this.logoGoUp = true;
                }
            }

            this.period = 6;
            this.frame += this.game.frames % this.period === 0 ? 1 : 0;
            this.frame = this.frame % this.animation.length;
        }
    }

    draw() {
        if (this.game.state.current === this.game.state.home) {
            const birdFrame = this.animation[this.frame];
            this.game.ctx.drawImage(
                this.game.spriteSheet,
                this.logo.spriteX, this.logo.spriteY,
                this.logo.spriteW, this.logo.spriteH,
                this.logo.x, this.logo.y,
                this.logo.w, this.logo.h
            );
            this.game.ctx.drawImage(
                this.game.spriteSheet,
                birdFrame.spriteX, birdFrame.spriteY,
                68, 48,
                this.bird.x, this.bird.y,
                this.bird.w, this.bird.h
            );
            this.game.ctx.drawImage(
                this.game.spriteSheet,
                this.studio_name.spriteX, this.studio_name.spriteY,
                this.studio_name.spriteW, this.studio_name.spriteH,
                this.studio_name.x, this.studio_name.y,
                this.studio_name.w, this.studio_name.h
            );
        }
    }
}

class GetReady {
    constructor(game) {
        this.game = game;
        this.get_ready = { spriteX: 552, spriteY: 321, spriteW: 349, spriteH: 87, x: 0, y: 0, w: 0, h: 0 };
        this.tap = { spriteX: 0, spriteY: 0, spriteW: 155, spriteH: 196, x: 0, y: 0, w: 0, h: 0 };
        this.resize();
    }

    resize() {
        this.get_ready.x = this.game.canvas.width * 0.197;
        this.get_ready.y = this.game.canvas.height * 0.206;
        this.get_ready.w = this.game.canvas.width * 0.602;
        this.get_ready.h = this.game.canvas.height * 0.109;
        this.tap.x = this.game.canvas.width * 0.433;
        this.tap.y = this.game.canvas.height * 0.435;
        this.tap.w = this.game.canvas.width * 0.270;
        this.tap.h = this.game.canvas.height * 0.244;
    }

    draw() {
        if (this.game.state.current === this.game.state.getReady) {
            this.game.ctx.drawImage(
                this.game.spriteSheet,
                this.get_ready.spriteX, this.get_ready.spriteY,
                this.get_ready.spriteW, this.get_ready.spriteH,
                this.get_ready.x, this.get_ready.y,
                this.get_ready.w, this.get_ready.h
            );
            this.game.ctx.drawImage(
                this.game.spriteSheet,
                this.tap.spriteX, this.tap.spriteY,
                this.tap.spriteW, this.tap.spriteH,
                this.tap.x, this.tap.y,
                this.tap.w, this.tap.h
            );
        }
    }
}

class GameOver {
    constructor(game) {
        this.game = game;
        this.game_over = { spriteX: 553, spriteY: 410, spriteW: 376, spriteH: 75, x: 0, y: 0, w: 0, h: 0 };
        this.scoreboard = { spriteX: 548, spriteY: 0, spriteW: 452, spriteH: 232, x: 0, y: 0, w: 0, h: 0 };
        this.resize();
    }

    resize() {
        this.game_over.x = this.game.canvas.width * 0.182;
        this.game_over.y = this.game.canvas.height * 0.243;
        this.game_over.w = this.game.canvas.width * 0.645;
        this.game_over.h = this.game.canvas.height * 0.095;
        this.scoreboard.x = this.game.canvas.width * 0.107;
        this.scoreboard.y = this.game.canvas.height * 0.355;
        this.scoreboard.w = this.game.canvas.width * 0.782;
        this.scoreboard.h = this.game.canvas.height * 0.289;
    }

    draw() {
        if (this.game.state.current === this.game.state.gameOver) {
            this.game.ctx.drawImage(
                this.game.spriteSheet,
                this.game_over.spriteX, this.game_over.spriteY,
                this.game_over.spriteW, this.game_over.spriteH,
                this.game_over.x, this.game_over.y,
                this.game_over.w, this.game_over.h
            );
            this.game.ctx.drawImage(
                this.game.spriteSheet,
                this.scoreboard.spriteX, this.scoreboard.spriteY,
                this.scoreboard.spriteW, this.scoreboard.spriteH,
                this.scoreboard.x, this.scoreboard.y,
                this.scoreboard.w, this.scoreboard.h
            );
        }
    }
}

// Инициализация игры
const game = new Game();