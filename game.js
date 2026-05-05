// ============================================================
//  FROG RUSH — Arcade Edition v3.0 (Addiction Overhaul)
// ============================================================

const GW = 800;
const GH = 450;
const BEST_KEY = "frogRush_best_v2";
const META_KEY  = "frogRush_meta_v2";

const AudioFX = (() => {
  let ctx = null;
  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, type, vol, duration, decay) {
    const c = getCtx(); if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * (decay || 1), c.currentTime + duration);
    gain.gain.setValueAtTime(vol || 0.12, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  }
  return {
    jump:    () => tone(320, 'square',   0.09, 0.12, 1.8),
    land:    () => tone(120, 'triangle', 0.08, 0.08, 0.6),
    collect: () => tone(880, 'sine',     0.10, 0.14, 1.2),
    coin:    () => tone(660, 'sine',     0.08, 0.10, 1.4),
    die:     () => { tone(200, 'sawtooth', 0.14, 0.3, 0.3); setTimeout(()=>tone(100,'sawtooth',0.12,0.4,0.2),200); },
    shield:  () => tone(440, 'sine',     0.10, 0.25, 1.1),
    fever:   () => { [880,1047,1175].forEach((f,i)=>setTimeout(()=>tone(f,'sine',0.1,0.2),i*80)); },
    dash:    () => tone(550, 'sawtooth', 0.08, 0.1,  2.0),
    stomp:   () => tone(180, 'sawtooth', 0.12, 0.15, 0.4),
    unlock:  () => { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,'sine',0.1,0.18),i*90)); },
    nearMiss:() => tone(280, 'triangle',0.07, 0.1,  1.4),
    beat:    (tick) => {
      const f = [60, 60, 80, 60][tick % 4];
      tone(f, 'triangle', 0.05, 0.1, 0.8);
      if (tick % 8 === 4) tone(1200, 'sine', 0.02, 0.05, 0.5);
    }
  };
})();

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }
  create() {
    const txt = this.add.text(GW/2, GH/2, '🐸 FROG RUSH', {
      fontSize: '48px', color: '#22d3ee', fontFamily: 'Orbitron', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets:txt, alpha:1, duration:400, ease:'Sine.Out' });
    this.time.delayedCall(1100, () => this.scene.start('GameScene'));
  }
}

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.createTextures();
    this.setupWorld();
    this.setupPlayer();
    this.setupInput();
    this.setupGroups();
    this.setupCollisions();
    this.setupState();
    this.setupHUD();
    this.setupParticles();
    this.setupStartScreen();
    this.setupGhostRunner();
    this.setupDrones();
    this.physics.pause();
  }

  createTextures() {
    const g = this.make.graphics({ add: false });
    // Backgrounds
    g.fillGradientStyle(0x010612, 0x010612, 0x0c1830, 0x0c1830, 1);
    g.fillRect(0, 0, 128, GH);
    g.generateTexture('bgSky', 128, GH); g.clear();
    g.fillStyle(0x0c213a, 0.9); g.fillRect(0, 0, 256, 300);
    g.generateTexture('bgHills', 256, 300); g.clear();
    g.fillStyle(0x0a1f33, 1); g.fillRect(0, 0, 320, 260);
    g.generateTexture('bgBuildings', 320, 260); g.clear();
    // Ground
    g.fillStyle(0x172235, 1); g.fillRect(0, 0, 64, 80);
    g.fillStyle(0x22d3ee, 1); g.fillRect(0, 0, 64, 2);
    g.generateTexture('ground', 64, 80); g.clear();
    // Player & Hazards
    this.createFrogFrames(g);
    this.createObstacleTextures(g);
    this.createCollectibleTextures(g);
    // Particles
    g.fillStyle(0x22d3ee, 1); g.fillCircle(4, 4, 4); g.generateTexture('ptDust', 8, 8); g.clear();
    g.fillStyle(0xfde047, 1); g.fillCircle(3, 3, 3); g.generateTexture('ptSpark', 6, 6); g.clear();
    g.fillStyle(0xfb7185, 1); g.fillCircle(3, 3, 3); g.generateTexture('ptFever', 6, 6); g.clear();
    g.fillStyle(0xa78bfa, 1); g.fillCircle(3, 3, 3); g.generateTexture('ptMagnet', 6, 6); g.clear();
    g.fillStyle(0xffffff, 1); g.fillCircle(2, 2, 2); g.generateTexture('ptCoin', 4, 4); g.clear();
    g.destroy();
  }

  createFrogFrames(g) {
    g.fillStyle(0x22c55e, 1); g.fillRoundedRect(2, 4, 32, 26, 8);
    g.fillStyle(0xffffff, 1); g.fillCircle(10, 6, 5); g.fillCircle(26, 6, 5);
    g.fillStyle(0x111827, 1); g.fillCircle(11, 6, 2.5); g.fillCircle(27, 6, 2.5);
    g.generateTexture('frogJump', 36, 36); g.clear();
  }

  createObstacleTextures(g) {
    // trapUp
    g.fillStyle(0xf97316, 0.2); g.fillCircle(16, 16, 24);
    g.fillStyle(0x0f172a, 1); g.fillRect(0, 32, 32, 8);
    g.fillGradientStyle(0xff4500, 0xff4500, 0x9a3412, 0x9a3412, 1);
    g.fillTriangle(4, 32, 16, 2, 28, 32);
    g.generateTexture('trapUp', 32, 40); g.clear();
    // trapDown
    g.fillStyle(0x0ea5e9, 0.2); g.fillCircle(16, 24, 24);
    g.fillStyle(0x0f172a, 1); g.fillRect(0, 0, 32, 10);
    g.fillGradientStyle(0x0ea5e9, 0x0ea5e9, 0x1e40af, 0x1e40af, 1);
    g.fillTriangle(8, 20, 16, 38, 24, 20);
    g.generateTexture('trapDown', 32, 40); g.clear();
    // trapTall
    g.fillStyle(0x7c3aed, 0.15); g.fillRect(0, 0, 28, 64);
    g.fillStyle(0x020617, 1); g.fillRect(2, 0, 24, 64);
    g.fillStyle(0xa855f7, 1); g.strokeRect(2, 0, 24, 64);
    g.generateTexture('trapTall', 28, 64); g.clear();
    // Drone
    g.fillStyle(0x334155, 1); g.fillRoundedRect(0, 4, 32, 12, 4);
    g.fillStyle(0xef4444, 1); g.fillCircle(16, 10, 4);
    g.generateTexture('drone', 32, 20); g.clear();
    // Snake
    g.fillStyle(0x064e3b, 1); g.fillRoundedRect(0, 0, 24, 16, 4);
    g.generateTexture('snakeBody', 24, 16); g.clear();
    g.fillStyle(0x064e3b, 1); g.fillRoundedRect(0, 0, 28, 20, 6);
    g.fillStyle(0xef4444, 1); g.fillRect(16, 6, 10, 4);
    g.generateTexture('snakeHead', 28, 28); g.clear();
    // Lava - Realistic molten texture
    g.fillGradientStyle(0x8b0000, 0x8b0000, 0xff4500, 0xff4500, 1);
    g.fillRect(0, 0, 64, 40);
    // Dark molten core
    g.fillStyle(0x660000, 1); g.fillCircle(12, 18, 12); g.fillCircle(52, 22, 14);
    // Bright lava bubbles with glow
    g.fillStyle(0xffaa00, 1); g.fillCircle(12, 18, 8); g.fillCircle(52, 22, 9);
    g.fillStyle(0xffdd55, 0.7); g.fillCircle(8, 12, 6); g.fillCircle(28, 16, 7); g.fillCircle(48, 28, 5);
    // Highlights for shiny molten effect
    g.fillStyle(0xffff99, 0.5); g.fillCircle(10, 14, 3); g.fillCircle(50, 20, 3);
    g.generateTexture('lava', 64, 40); g.clear();
  }

  createCollectibleTextures(g) {
    // BERRY (replaces coin) - Red berry cluster
    g.fillStyle(0xdc2626, 1); g.fillCircle(8, 10, 4); g.fillCircle(12, 9, 4); g.fillCircle(15, 11, 4);
    g.fillStyle(0x991b1b, 1); g.fillCircle(10, 12, 3.5); g.fillCircle(13, 12, 3.5);
    g.fillStyle(0x7f1d1d, 0.8); g.fillCircle(8, 10, 1.5); g.fillCircle(12, 9, 1.5); g.fillCircle(15, 11, 1.5);
    g.fillStyle(0x16a34a, 1); g.fillRect(8, 6, 2, 2);
    g.generateTexture('coin', 20, 20); g.clear();
    
    g.fillStyle(0xfde047, 1); g.fillCircle(10, 11, 8); g.generateTexture('note', 20, 20); g.clear();
    g.fillStyle(0x22d3ee, 1); g.fillRoundedRect(4, 0, 16, 26, 8); g.generateTexture('medicine', 24, 28); g.clear();
    g.fillStyle(0xef4444, 1); g.fillCircle(12, 12, 10); g.generateTexture('magnet', 24, 24); g.clear();
    // DRAGONFLY - Fast boost (Blue/Cyan, long wings)
    g.fillStyle(0x22d3ee, 1); g.fillEllipse(12, 12, 22, 6);
    g.fillStyle(0x06b6d4, 1); g.fillEllipse(10, 12, 6, 20); g.fillEllipse(14, 12, 6, 20);
    g.fillStyle(0xffffff, 0.6); g.fillEllipse(12, 8, 20, 4); g.fillEllipse(12, 16, 20, 4);
    g.generateTexture('dragonfly', 24, 24); g.clear();
    // SNAIL - Slow down (Brown shell, green body)
    g.fillStyle(0x8b4513, 1); g.fillCircle(14, 14, 8);
    g.fillStyle(0x4b2a10, 1); g.strokeCircle(14, 14, 6);
    g.fillStyle(0x4ade80, 1); g.fillRoundedRect(4, 16, 16, 6, 3);
    g.fillStyle(0x22c55e, 1); g.fillRect(18, 12, 2, 6);
    g.generateTexture('snail', 24, 24); g.clear();
    // WASP - Enhanced aggressive look
    g.fillStyle(0xfde047, 1); g.fillEllipse(12, 12, 12, 18);
    g.fillStyle(0x1f2937, 1); g.fillRect(7, 9, 10, 3); g.fillRect(7, 13, 10, 3); g.fillRect(7, 17, 10, 3);
    g.fillStyle(0x000000, 1); g.fillTriangle(12, 24, 10, 20, 14, 20); // Big stinger
    g.fillStyle(0xef4444, 1); g.fillCircle(9, 6, 3); g.fillCircle(15, 6, 3); // Angry red eyes
    g.generateTexture('wasp', 24, 24); g.clear();
  }

  setupWorld() {
    this.bg0 = this.add.tileSprite(0, 0, GW, GH, 'bgSky').setOrigin(0);
    this.bg1 = this.add.tileSprite(0, GH-300, GW, 300, 'bgHills').setOrigin(0);
    this.bg2 = this.add.tileSprite(0, GH-260, GW, 260, 'bgBuildings').setOrigin(0);
    this.groundTopY = GH - 80;
    this.groundVisual = this.add.tileSprite(0, this.groundTopY, GW, 80, 'ground').setOrigin(0).setDepth(3);
    this.ground = this.physics.add.staticImage(GW/2, GH-40, 'ground').setDisplaySize(GW, 80).refreshBody().setAlpha(0);
  }

  setupPlayer() {
    this.frog = this.physics.add.sprite(160, GH-110, 'frogJump').setDepth(10);
    // More forgiving hitbox: smaller than the sprite
    this.frog.setSize(18, 20).setOffset(9, 12);
    this.physics.add.collider(this.frog, this.ground);
    this.shieldVisual = this.add.circle(0, 0, 22).setStrokeStyle(3, 0x93c5fd, 0.8).setDepth(11).setVisible(false);
    
    // Fever glow
    this.feverGlow = this.add.circle(0, 0, 30, 0xfb7185, 0.3).setVisible(false).setDepth(9);
  }

  setupInput() {
    this.spaceKey = this.input.keyboard.addKey('SPACE');
    this.upKey = this.input.keyboard.addKey('UP');
    this.downKey = this.input.keyboard.addKey('DOWN');
    this.shiftKey = this.input.keyboard.addKey('SHIFT');
    this.debugKey = this.input.keyboard.addKey('D');
    this.mode1Key = this.input.keyboard.addKey('ONE');
    this.mode2Key = this.input.keyboard.addKey('TWO');
    this.mode3Key = this.input.keyboard.addKey('THREE');
    this.input.on('pointerdown', () => this.handlePrimaryInput(this.time.now));
  }

  setupGroups() {
    this.obstacles = this.physics.add.group({ allowGravity:false, immovable:true });
    this.bugs = this.physics.add.group({ allowGravity:false });
    this.notes = this.physics.add.group({ allowGravity:false });
    this.coins = this.physics.add.group({ allowGravity:false });
    this.snakes = this.physics.add.group({ allowGravity:false });
    this.drones = this.physics.add.group({ allowGravity:false });
    this.lava = this.physics.add.group({ allowGravity:false, immovable:true });
    this.wasps = this.physics.add.group({ allowGravity:false });
  }

  setupCollisions() {
    this.physics.add.collider(this.frog, this.obstacles, (_,o) => this.handleHazardHit(o));
    this.physics.add.overlap(this.frog, this.bugs, (_,b) => this.collectBug(b));
    this.physics.add.overlap(this.frog, this.notes, (_,n) => this.collectNote(n));
    this.physics.add.overlap(this.frog, this.coins, (_,c) => this.collectCoin(c));
    this.physics.add.overlap(this.frog, this.snakes, (_,s) => this.handleHazardHit(s));
    this.physics.add.overlap(this.frog, this.drones, (_,d) => this.handleHazardHit(d));
    this.physics.add.overlap(this.frog, this.lava, (_,l) => this.handleLavaDeath(l));
    this.physics.add.overlap(this.frog, this.wasps, (_,w) => this.handleWaspHit(w));
  }

  setupState() {
    this.score = 0; this.distanceTraveled = 0;
    this.isGameOver = false; this.hasStarted = false;
    this.jumpCount = 0; this.maxJumps = 2;
    this.lastGroundedAt = 0;
    this.lastJumpTime = 0;
    this.flow = 0; this.isFever = false;
    this.hasShield = false; this.hasMagnet = false;
    this.totalCoins = 0; this.upgrades = { magnet:0, dash:0, fever:0, shield:0 };
    this.metaProgress = this.getMetaProgress();
    this.ensureMetaDefaults();
    this.bestScore = this.getStoredBestScore();
    this.runStats = { notes:0, coins:0, nearMiss:0, fever:0, insectsKilled:0 };
    this.nextBeatAt = 0; this.musicTick = 0;
    // Speed modifier state
    this.speedMultiplier = 1.0;
    this.speedBuffEndTime = 0;
    this.speedDebuffEndTime = 0;
    // Shop enabled after first run
    this.shopEnabled = this.bestScore > 0;
  }

  setupHUD() {
    this.scoreText = this.add.text(GW/2, 20, 'SCORE 0', { fontSize:'24px', color:'#fff', fontFamily:'Orbitron' }).setOrigin(0.5).setDepth(20);
    this.flowBar = this.add.rectangle(10, 10, 0, 10, 0x22d3ee).setOrigin(0).setDepth(20);
  }

  setupParticles() {
    this.sparkEmitter = this.add.particles(0, 0, 'ptSpark', { speed:100, scale:{start:1, end:0}, lifespan:400, quantity:0 });
    this.magnetEmitter = this.add.particles(0, 0, 'ptMagnet', { speed:50, scale:{start:0.8, end:0}, lifespan:300, quantity:0 });
  }

  setupStartScreen() {
    this.startBtn = this.add.text(GW/2, GH/2, 'START RUN', { fontSize:'32px', color:'#22d3ee', backgroundColor:'#0f172a', padding:10 })
      .setOrigin(0.5).setInteractive({useHandCursor:true}).setDepth(30);
    this.startBtn.on('pointerup', () => this.beginRun(this.time.now));
    
    this.coinText = this.add.text(GW/2, GH/2 + 60, `BERRIES: ${this.totalCoins}`, { fontSize:'16px', color:'#dc2626' }).setOrigin(0.5).setDepth(30);
    this.upgradeButtons = [];
  }

  setupGhostRunner() {
    this.ghostFrog = this.add.image(160, GH-110, 'frogJump').setAlpha(0.3).setDepth(9).setVisible(false);
  }

  setupDrones() {
    this.laserGraphics = this.add.graphics().setDepth(11);
  }

  handleUpgrade(key, btn) {
    if (!this.shopEnabled) return;
    const cost = [200, 500, 1000, 2000, 5000][this.upgrades[key]] || 99999;
    if (this.totalCoins >= cost && this.upgrades[key] < 5) {
      this.totalCoins -= cost;
      this.upgrades[key]++;
      this.saveMetaProgress();
      btn.setText(`${key.toUpperCase()}\nLv ${this.upgrades[key]}`);
      this.coinText.setText(`BERRIES: ${this.totalCoins}`);
      AudioFX.unlock();
    }
  }

  beginRun(time) {
    this.hasStarted = true;
    this.startTime = time;
    this.startBtn.setVisible(false);
    this.coinText.setVisible(false);
    this.upgradeButtons.forEach(btn => btn.setVisible(false));
    if (this.upgrades.shield >= 5) this.setShield(true);
    this.physics.resume();
  }

  update(time, delta) {
    if (this.isGameOver || !this.hasStarted) return;

    if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
      this.physics.world.drawDebug = !this.physics.world.drawDebug;
      if (!this.physics.world.drawDebug) this.physics.world.debugGraphic.clear();
    }

    if (Phaser.Input.Keyboard.JustDown(this.mode1Key)) this.timeScale = 1;
    if (Phaser.Input.Keyboard.JustDown(this.mode2Key)) this.timeScale = 1.5;
    if (Phaser.Input.Keyboard.JustDown(this.mode3Key)) this.timeScale = 0.7;
    const ts = this.timeScale || 1;

    // Coyote Time & Grounding
    const isGrounded = this.frog.body.blocked.down || this.frog.body.touching.down;
    if (isGrounded) {
      if (this.frog.body.velocity.y >= 0) {
        if (this.lastGroundedAt === 0) {
          // Just landed
          this.frog.setScale(1.2, 0.8); // Squash
          this.tweens.add({ targets: this.frog, scaleX: 1, scaleY: 1, duration: 100 });
          AudioFX.land();
          this.cameras.main.shake(100, 0.002);
        }
        this.lastGroundedAt = time;
        this.jumpCount = 0;
      }
    } else {
      if (this.lastGroundedAt !== 0 && time - this.lastGroundedAt > 150) {
        this.lastGroundedAt = 0; // End coyote window
      }
    }

    // Jump Buffering
    if (this.jumpBufferedUntil && time < this.jumpBufferedUntil) {
      const canJumpBuffer = (isGrounded && this.frog.body.velocity.y >= 0) || (this.lastGroundedAt > 0 && time - this.lastGroundedAt < 150);
      if (canJumpBuffer) {
        this.executeJump();
        this.jumpBufferedUntil = 0;
      }
    }

    // Music
    if (time > this.nextBeatAt) {
      this.nextBeatAt = time + Math.max(200, 500 - (this.score/5));
      AudioFX.beat(this.musicTick++);
    }

    // Update speed multipliers
    if (time > this.speedBuffEndTime) this.speedMultiplier = 1.0;
    else this.speedMultiplier = 1.25; // Boost active (reduced from 1.5x for balance)
    if (time < this.speedDebuffEndTime) this.speedMultiplier = Math.min(this.speedMultiplier, 0.6); // Debuff overrides boost

    const baseSpeed = 400 + (this.score / 2);
    const speed = baseSpeed * this.speedMultiplier * ts;
    this.distanceTraveled += (speed * delta) / 1000;
    
    // Ghost
    if (this.bestScore > 0) {
      const ghostX = 160 + (this.bestScore * 12 - (this.distanceTraveled * 12));
      this.ghostFrog.setPosition(ghostX, GH-110 + Math.sin(time*0.005)*10).setVisible(ghostX > -50 && ghostX < GW+50);
    }

    // Parallax
    this.bg0.tilePositionX += speed * 0.02 * delta / 1000;
    this.bg1.tilePositionX += speed * 0.05 * delta / 1000;
    this.bg2.tilePositionX += speed * 0.1 * delta / 1000;
    this.groundVisual.tilePositionX += speed * delta / 1000;

    // Input
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.upKey)) this.tryJump(time);
    if (Phaser.Input.Keyboard.JustDown(this.downKey)) this.tryStomp();
    if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) this.tryDash(time);

    // Spawning
    if (this.time.now > (this.nextSpawn || 0)) {
      this.nextSpawn = this.time.now + (2000 - Math.min(1500, this.score*2)) / ts;
      
      // Check if any wasps are attacking - if so, skip obstacles
      let anyWaspAttacking = false;
      this.wasps.children.iterate(w => {
        if (w && w.getData('state') === 'attacking') anyWaspAttacking = true;
      });
      
      if (!anyWaspAttacking) {
        if (this.score > 100 && Math.random() < 0.08) this.spawnLava(speed);
        else if (this.score > 300 && Math.random() < 0.15) this.spawnSnake(speed);
        else if (this.score > 200 && Math.random() < 0.2) this.spawnDrone(speed);
        else this.spawnObstacle(speed);
      }
    }
    if (this.time.now > (this.nextCoin || 0)) {
      this.nextCoin = this.time.now + 600 / ts;
      if (Math.random() < 0.12) this.spawnBug(speed);
      else if (Math.random() < 0.06) this.spawnWasp(speed); // Reduced frequency for easier gameplay
      else this.spawnCoin(speed);
    }

    this.updateDrones(time);
    this.updateWasps(time);
    this.updateProjectiles(speed);
    this.checkNearMisses();
    
    if (this.hasMagnet) this.updateMagnet();
    if (this.hasShield) this.shieldVisual.setPosition(this.frog.x, this.frog.y);
    if (this.isFever) {
      this.feverGlow.setVisible(true).setPosition(this.frog.x, this.frog.y);
      this.feverGlow.setAlpha(0.2 + Math.sin(time*0.01)*0.1);
    } else {
      this.feverGlow.setVisible(false);
    }

    this.score = Math.floor(this.distanceTraveled / 10);
    this.scoreText.setText(`SCORE ${this.score}`);
    this.flowBar.width = (this.flow / 100) * 200;
  }

  handlePrimaryInput(time) {
    if (!this.hasStarted || this.isGameOver) return;
    this.tryJump(time);
  }

  tryJump(time) {
    if (time < this.lastJumpTime + 100) return; // Debounce

    const isGrounded = (this.frog.body.blocked.down || this.frog.body.touching.down) && this.frog.body.velocity.y >= 0;
    const canCoyote = this.lastGroundedAt > 0 && (time - this.lastGroundedAt < 150);
    
    if (isGrounded || canCoyote || this.jumpCount < this.maxJumps) {
      this.executeJump();
      this.lastJumpTime = time;
    } else {
      this.jumpBufferedUntil = time + 200; // Buffer for 200ms
    }
  }

  executeJump() {
    this.frog.setVelocityY(-450);
    this.jumpCount++;
    this.lastGroundedAt = 0;
    AudioFX.jump();
    
    // Stretch
    this.frog.setScale(0.8, 1.2);
    this.tweens.add({ targets: this.frog, scaleX: 1, scaleY: 1, duration: 200 });
  }

  tryStomp() {
    if (!(this.frog.body.blocked.down || this.frog.body.touching.down)) {
      this.frog.setVelocityY(900);
      this.frog.setScale(1.1, 0.9);
      AudioFX.stomp();
    }
  }

  checkNearMisses() {
    this.obstacles.children.iterate(o => {
      if (!o || o.getData('missed')) return;
      const dist = Phaser.Math.Distance.Between(this.frog.x, this.frog.y, o.x, o.y);
      if (dist < 60 && o.x < this.frog.x) {
        o.setData('missed', true);
        this.addFlow(10);
        AudioFX.nearMiss();
        this.showFloatText('NEAR MISS!', 0x22d3ee);
      }
    });
  }

  showFloatText(txt, color) {
    const t = this.add.text(this.frog.x, this.frog.y - 40, txt, { fontSize:'14px', color: Phaser.Display.Color.IntegerToColor(color).rgba, fontFamily:'Orbitron' }).setOrigin(0.5);
    this.tweens.add({ targets:t, y:t.y-50, alpha:0, duration:800, onComplete:()=>t.destroy() });
  }

  tryDash(time) {
    const cd = [1400, 1200, 1000, 800, 600, 400][this.upgrades.dash];
    if (time > (this.lastDash || 0) + cd) {
      this.lastDash = time;
      this.frog.setVelocityX(600);
      
      // Kill wasps in path during dash - especially attacking ones
      this.wasps.children.iterate(w => {
        if (w && Math.abs(w.y - this.frog.y) < 50) { // Increased hit range
          w.destroy();
          this.runStats.insectsKilled++;
          this.addFlow(20);
          this.showFloatText('WASP KILLED!', 0xfde047);
          AudioFX.dash();
        }
      });
      
      this.time.delayedCall(200, () => this.frog.setVelocityX(0));
      AudioFX.dash();
    }
  }

  spawnObstacle(speed) {
    // Increase gap when moving fast to prevent frustration
    const baseGap = 250 + (speed / 2);
    const speedAdjustment = this.speedMultiplier > 1.0 ? 150 : 0; // Extra gap during speed boost
    const minGap = baseGap + speedAdjustment;
    const lastObs = this.obstacles.getChildren()[this.obstacles.getLength() - 1];
    if (lastObs && lastObs.x > GW - minGap) return;

    const kind = Math.random() < 0.5 ? 'trapUp' : 'trapDown';
    const obs = this.obstacles.create(GW+50, kind==='trapUp'?this.groundTopY-10:this.groundTopY-50, kind);
    obs.setVelocityX(-speed);
    if (kind === 'trapUp') obs.setSize(24, 32).setOffset(4, 8);
    else obs.setSize(24, 32).setOffset(4, 0);
  }

  spawnSnake(speed) {
    const s = this.snakes.create(GW+50, this.groundTopY-15, 'snakeHead');
    s.setVelocityX(-speed * 1.2);
    s.setSize(24, 16);
  }

  spawnDrone(speed) {
    const d = this.drones.create(GW+50, 150, 'drone');
    d.setVelocityX(-speed * 0.7);
    d.setData('state', 'warning');
    d.setData('time', this.time.now + 1000);
  }

  spawnCoin(speed) {
    const c = this.coins.create(GW+50, GH-150-Math.random()*100, 'coin');
    c.setVelocityX(-speed);
  }

  spawnBug(speed) {
    const types = ['dragonfly', 'snail', 'special', 'fly'];
    const type = types[Math.floor(Math.random()*types.length)];
    const b = this.bugs.create(GW+50, GH-200-Math.random()*100, type);
    
    if (type === 'dragonfly') {
      b.setVelocityX(-speed * 1.5); // Moves fast!
      b.setTint(0x00ffff);
    } else if (type === 'snail') {
      b.setVelocityX(-speed * 0.4); // Moves slow...
    } else {
      b.setVelocityX(-speed * 0.8);
    }
  }

  spawnLava(speed) {
    const minGap = 300 + (speed / 2);
    const lastLava = this.lava.getChildren()[this.lava.getLength() - 1];
    if (lastLava && lastLava.x > GW - minGap) return;

    const lava = this.lava.create(GW+50, this.groundTopY-20, 'lava');
    lava.setVelocityX(-speed);
    lava.setSize(64, 40);
  }

  spawnWasp(speed) {
    // Spawn only on the downside lane, stay still first, then charge forward
    const laneY = this.groundTopY - 20;
    const wasp = this.wasps.create(GW + 50, laneY, 'wasp');
    const straySpeed = Math.max(90, speed * 0.22);
    const attackSpeed = Math.max(460, speed * 1.1);
    wasp.setVelocityX(0);
    wasp.setVelocityY(0);
    wasp.setData('laneY', laneY);
    wasp.setData('state', 'straying');
    wasp.setData('straySpeed', straySpeed);
    wasp.setData('attackSpeed', attackSpeed);
    wasp.setData('holdX', this.frog.x + Phaser.Math.Between(150, 240));
    wasp.setData('holdStartedAt', 0);
    wasp.setSize(20, 20);
  }

  updateWasps(time) {
    this.wasps.children.iterate(w => {
      if (!w) return;
      
      if (w.x < this.frog.x - 100) {
        w.destroy();
        return;
      }

      const laneY = w.getData('laneY');
      const state = w.getData('state');
      w.setVelocityY(0);
      if (state !== 'attacking') w.y = laneY;

      if (state === 'straying') {
        const holdX = w.getData('holdX');
        if (w.x <= holdX) {
          w.setVelocityX(0);
          if (!w.getData('holdStartedAt')) w.setData('holdStartedAt', time);
          if (time - w.getData('holdStartedAt') > 500) {
            w.setData('state', 'attacking');
            this.showFloatText('WASP ATTACK!', 0xef4444);
          }
        } else {
          w.setVelocityX(0);
          w.setScale(1);
          w.clearTint();
        }
        return;
      }

      if (state === 'attacking') {
        // Attack moves down-forward instead of staying flat in one lane
        w.setVelocityX(-w.getData('attackSpeed'));
        w.setVelocityY(90);
        const pulse = 1 + Math.sin(time * 0.02) * 0.2;
        w.setScale(pulse);
        w.setTint(0xff0000);
      }
    });
  }

  updateDrones(time) {
    this.laserGraphics.clear();
    this.drones.children.iterate(d => {
      if (!d) return;
      if (d.getData('state') === 'warning') {
        this.laserGraphics.lineStyle(1, 0xef4444, 0.5).lineBetween(d.x, d.y, 0, d.y);
        if (time > d.getData('time')) { d.setData('state', 'firing'); d.setData('time', time + 500); }
      } else {
        this.laserGraphics.lineStyle(4, 0xffffff, 1).lineBetween(d.x, d.y, 0, d.y);
        if (Math.abs(this.frog.y - d.y) < 20 && this.frog.x < d.x) this.handleHazardHit(d);
        if (time > d.getData('time')) d.setData('state', 'cooldown');
      }
    });
  }

  updateProjectiles(speed) {
    [this.obstacles, this.coins, this.bugs, this.drones, this.lava, this.wasps].forEach(g => {
      g.children.iterate(c => { if(c && c.x < -100) c.destroy(); });
    });
  }

  updateMagnet() {
    const range = [300, 350, 400, 500, 650, 900][this.upgrades.magnet];
    this.coins.children.iterate(c => {
      if (!c) return;
      const dist = Phaser.Math.Distance.Between(this.frog.x, this.frog.y, c.x, c.y);
      if (dist < range) {
        this.physics.moveToObject(c, this.frog, 700);
      }
    });
  }

  collectCoin(c) {
    c.destroy(); this.totalCoins++; this.runStats.coins++; AudioFX.coin();
    this.addFlow(5);
  }

  collectNote(n) { n.destroy(); this.score += 50; AudioFX.collect(); this.addFlow(10); }

  collectBug(b) {
    const type = b.texture.key;
    b.destroy();
    if (type === 'special') {
      this.triggerHallucination();
    } else if (type === 'dragonfly') {
      this.speedBuffEndTime = this.time.now + 5000;
      this.showFloatText('DRAGONFLY BOOST!', 0x22d3ee);
      AudioFX.coin();
      this.addFlow(15);
    } else if (type === 'snail') {
      this.speedDebuffEndTime = this.time.now + 3000;
      this.showFloatText('SNAIL SLOW...', 0x8b4513);
      AudioFX.coin();
    } else if (type === 'fly') {
      this.setShield(true);
      this.showFloatText('FLY SHIELD!', 0x94a3b8);
      AudioFX.shield();
    }
  }

  triggerHallucination() {
    AudioFX.fever();
    this.showFloatText('HALLUCINATION!', 0xd946ef);
    this.cameras.main.shake(5000, 0.005);
  }

  addFlow(v) {
    this.flow = Math.min(100, this.flow + v);
    if (this.flow >= 100 && !this.isFever) {
      this.isFever = true;
      const dur = [5000, 6000, 7000, 8000, 10000, 15000][this.upgrades.fever];
      this.time.delayedCall(dur, () => { this.isFever = false; this.flow = 0; });
      AudioFX.fever();
    }
  }

  setShield(on) { this.hasShield = on; this.shieldVisual.setVisible(on); }

  handleLavaDeath(l) {
    if (this.hasShield) { this.setShield(false); l.destroy(); return; }
    // Screen shake for impact
    this.cameras.main.shake(300, 0.01);
    AudioFX.hit();
    // Dramatic melting animation with multiple effects
    this.tweens.add({
      targets: this.frog,
      scaleX: 0.2, scaleY: 0.25,
      rotation: 0.3,
      duration: 350,
      ease: 'Power2.easeIn'
    });
    this.tweens.add({
      targets: this.frog,
      tint: 0xffffff,
      duration: 150,
      onComplete: () => {
        this.tweens.add({
          targets: this.frog,
          tint: 0xff6600,
          duration: 100
        });
        this.tweens.add({
          targets: this.frog,
          tint: 0x660000,
          duration: 100,
          delay: 100,
          onComplete: () => this.handleHazardHit(l)
        });
      }
    });
    // Frog dissolves downward
    this.tweens.add({
      targets: this.frog,
      y: this.frog.y + 15,
      duration: 350,
      ease: 'Power1.easeIn'
    });
  }

  handleWaspHit(w) {
    if (this.hasShield) { this.setShield(false); w.destroy(); return; }
    this.handleHazardHit(w);
  }

  handleHazardHit(h) {
    if (this.hasShield) { this.setShield(false); h.destroy(); return; }
    this.isGameOver = true;
    this.physics.pause();
    this.ghostFrog.setVisible(false);
    this.bestScore = Math.max(this.bestScore, this.score);
    this.shopEnabled = true; // Enable shop after first run
    this.saveMetaProgress();
    
    const panel = this.add.rectangle(GW/2, GH/2, 400, 250, 0x0f172a, 0.9).setOrigin(0.5).setDepth(100);
    this.add.text(GW/2, GH/2 - 80, 'GAME OVER', { fontSize:'40px', color:'#ef4444', fontFamily:'Orbitron' }).setOrigin(0.5).setDepth(101);
    this.add.text(GW/2, GH/2 - 20, `SCORE: ${this.score}`, { fontSize:'20px', color:'#fff' }).setOrigin(0.5).setDepth(101);
    this.add.text(GW/2, GH/2 + 10, `BEST: ${this.bestScore}`, { fontSize:'16px', color:'#94a3b8' }).setOrigin(0.5).setDepth(101);
    this.add.text(GW/2, GH/2 + 40, `BERRIES: ${this.runStats.coins} | KILLS: ${this.runStats.insectsKilled}`, { fontSize:'14px', color:'#dc2626' }).setOrigin(0.5).setDepth(101);
    
    const retry = this.add.text(GW/2, GH/2 + 90, 'TAP TO RETRY', { fontSize:'24px', color:'#22d3ee', backgroundColor:'#1e293b', padding:10 })
      .setOrigin(0.5).setDepth(101).setInteractive({useHandCursor:true}).on('pointerdown', () => this.scene.restart());
    
    AudioFX.die();
  }

  getMetaProgress() { try { const r=localStorage.getItem(META_KEY); return r?JSON.parse(r):{};} catch { return {}; } }
  saveMetaProgress() {
    this.metaProgress.totalCoins = this.totalCoins;
    this.metaProgress.upgrades = this.upgrades;
    this.metaProgress.bestScore = this.bestScore;
    localStorage.setItem(META_KEY, JSON.stringify(this.metaProgress));
    localStorage.setItem(BEST_KEY, String(this.bestScore));
  }
  ensureMetaDefaults() {
    this.totalCoins = this.metaProgress.totalCoins || 0;
    this.upgrades = this.metaProgress.upgrades || { magnet:0, dash:0, fever:0, shield:0 };
  }
  getStoredBestScore() { return Number(localStorage.getItem(BEST_KEY)) || 0; }
}

const config = {
  type: Phaser.AUTO, width: GW, height: GH, parent: 'game', backgroundColor: '#020b18',
  physics: { default: 'arcade', arcade: { gravity: { y: 900 }, debug: false } },
  scene: [BootScene, GameScene]
};
new Phaser.Game(config);
