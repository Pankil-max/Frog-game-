# 🐸 FROG RUSH 2 — Full Overhaul Spec

## Concept & Vision
An addictive 2D endless runner with exceptional "game feel" — every jump, dodge, and collect should *feel* satisfying. The game rewards skill with visual feedback, sound, and progression. The aesthetic is neon-arcade meets natural wildness: a frog surviving in a dangerous but beautiful world.

## Design Language

### Aesthetic Direction
**Neon Survival** — Dark atmospheric backgrounds with vibrant neon accents. The frog is a bright focal point in a dangerous, glowing world. CRT-style scanlines and bloom effects create arcade nostalgia.

### Color Palette
- **Primary (Frog):** #22c55e (vibrant green)
- **Secondary (UI/Accents):** #22d3ee (cyan neon)
- **Danger:** #ef4444 (red), #f97316 (orange)
- **Rewards:** #fbbf24 (gold), #dc2626 (berries)
- **Background:** #020b18 → #0c1830 (deep space blue)
- **Fever Mode:** #f472b6 (hot pink glow)

### Typography
- **Primary:** Orbitron (bold, futuristic headings)
- **Secondary:** Share Tech Mono (stats, technical info)

### Motion Philosophy
- **Jumps:** Squash on takeoff, stretch at apex, squash on land
- **Impacts:** Screen shake scaled to importance
- **Collectibles:** Pop + trail + particles
- **Danger:** Red flash, camera shake
- **Fever:** Screen pulses, rainbow trails

## Game Feel Priorities

### Responsive Controls
- **Jump buffering:** 150ms window before landing
- **Coyote time:** 120ms grace period after leaving platform
- **Variable jump:** Hold longer = higher jump (max 400ms)
- **Double jump:** Air control, smooth arc

### Forgiving Hitboxes
- Player hitbox 70% of visual sprite
- Obstacles have smaller-than-visual hitboxes
- "Near miss" rewards for close dodges

### Feedback Systems
- Every action has visual + audio response
- Combo multipliers for consecutive near misses
- Screen effects (shake, flash, pulse) scaled to event importance

## Progression & Addiction Systems

### Berry Economy
- Collected in runs, spent on permanent upgrades
- Displayed prominently in HUD and menus
- "Berry rush" milestones at 50, 100, 250, 500, 1000

### Upgrades (5 levels each)
| Upgrade | Effect | Costs (Berry) |
|---------|--------|---------------|
| **JUMP** | Higher jumps, better air control | 100, 250, 500, 1000, 2500 |
| **MAGNET** | Auto-collect radius (200→800px) | 150, 400, 800, 1500, 3000 |
| **FEVER** | Fever meter fills faster, lasts longer | 200, 500, 1000, 2000, 4000 |
| **SHIELD** | Start with shield, takes more hits | 300, 600, 1200, 2400, 5000 |
| **DASH** | Lower cooldown, faster speed | 250, 600, 1200, 2400, 5000 |

### Achievements
- "First Jump" — Complete first jump
- "Survivor" — Reach score 100
- "Century" — Reach score 1000
- "Millennium" — Reach score 10000
- "Collector" — Collect 100 total berries
- "Streak Master" — 10 near misses in one run
- "Fever Dream" — Fill fever 5 times in one run
- "Untouchable" — Complete a run with shield never breaking
- "Speed Demon" — Complete a run over 500 score
- "Night Owl" — Play 10 runs

### Statistics Tracking
- Total runs played
- Total distance traveled
- Total berries collected
- Best score
- Best fever chain
- Total near misses
- Wasp kills
- Highest combo

## Visual Systems

### Parallax Backgrounds (3 layers)
- **Layer 0:** Deep space gradient (slowest)
- **Layer 1:** Distant hills (medium)
- **Layer 2:** Near buildings (fastest)
- Ground has glowing cyan edge

### Particle Effects
- **Jump:** Dust puff from feet
- **Land:** Squash + dust particles
- **Collect:** Sparkle burst + trail
- **Near Miss:** Cyan streak
- **Fever:** Pink heart particles
- **Dash:** Speed lines behind frog
- **Death:** Explosion particles

### Screen Effects
- **Fever Active:** Screen edges pulse pink, slight color shift
- **Near Miss:** Quick cyan flash
- **Hit:** Red vignette + heavy shake
- **Milestone:** Screen flash + "LEVEL UP" text
- **Berry Milestone:** Gold burst + chime

### Animations
- Frog: Idle bob, jump stretch, land squash, fear when near hazards
- Obstacles: Subtle pulsing, warning indicators
- Collectibles: Gentle float/bob, glow pulse
- UI: Smooth transitions, scale on hover

## Audio Design

### Dynamic Music
- BPM increases with score
- Intensity rises in Fever mode
- Victory stinger on milestones

### Sound Effects
- **Jump:** Percussive "boing" with pitch variation
- **Land:** Soft thud, pitch based on fall height
- **Collect:** Bright chime, pitch rises with combo
- **Near Miss:** Whoosh + combo counter sound
- **Death:** Descending failure tone + crunch
- **Fever Start:** Ascending fanfare
- **Fever End:** Cool-down chime
- **Milestone:** Triumphant burst
- **Dash:** Quick swoosh

## Obstacle Variety

### Ground Hazards
- **Spikes (Up):** Spring up from ground, telegraphed
- **Spikes (Down):** Fall from ceiling, warning laser

### Flying Enemies
- **Wasp:** Latches on, requires timing to avoid
- **Drone:** Shoots laser beams, predictable pattern

### Ground Enemies
- **Snake:** Fast horizontal movement
- **Toad:** Occasional big jump

### Environmental
- **Lava Pool:** Continuous danger zone
- **Void Pits:** Gaps requiring precise jumps

## Power-Up System

### Dragonfly (Blue)
- 5-second speed boost
- Glowing trail effect

### Snail (Brown)
- 3-second slowdown
- Visual "slow motion" effect

### Fly (Gray)
- Shield for one hit
- Visual shield bubble

### Firefly (Yellow)
- Berry magnet for 8 seconds
- Attracts all nearby berries

### Beetle (Red)
- Fever meter fills 2x faster for 10 seconds

## UI Layout

### HUD (During Gameplay)
```
[BERRIES: 🫐 42]              [🫐 156]           [SCORE: 1250]
                 [FEVER ████░░░░░]
```

### Start Screen
- Logo with animated frog
- "START" button (pulsing)
- "UPGRADES" button
- "STATS" button
- Current berry count

### Game Over Screen
- Score with animated count-up
- "NEW BEST!" celebration if applicable
- Run statistics
- "CONTINUE (Watch Ad)" option
- "RETRY" button

### Upgrades Screen
- Grid of upgrade cards
- Visual representation of upgrade level
- Cost display
- Buy confirmation

## Mobile Optimization

### Touch Controls
- **Jump:** Tap anywhere / swipe up
- **Dash:** Double tap / swipe left
- **Stomp:** Swipe down

### Responsive Design
- Scales to any screen size
- Touch-friendly hit areas (min 44px)
- No accidental inputs (tap zones)

### Performance
- Object pooling for particles
- Efficient sprite batching
- LOD for distant objects

## Technical Requirements

### Performance Targets
- 60 FPS on mobile devices
- < 2 second load time
- < 50MB memory usage

### Browser Support
- Chrome, Firefox, Safari, Edge
- Mobile Safari, Chrome Android
- Fallback for WebGL issues

### Data Persistence
- LocalStorage for progress
- Cloud sync option (stretch goal)

## Success Metrics

### Engagement
- Average session: 5+ minutes
- Daily active users: increasing
- Runs per session: 3+
- Return rate: 40%+

### Monetization Readiness (Design Only)
- "Continue" button for respawn (simulated)
- Skins system hooks in place
- Achievement rewards track

## Implementation Phases

### Phase 1: Core Polish
- Improve game feel (jump, land, physics)
- Add visual juice (particles, screen effects)
- Sound design implementation

### Phase 2: Progression Systems
- Berry economy
- Upgrade system
- Achievement system

### Phase 3: Content Polish
- Obstacle variety tuning
- Power-up balancing
- Difficulty progression

### Phase 4: UI/UX
- Start screen redesign
- Game over screen
- Upgrades interface
- Stats display

### Phase 5: Mobile & Polish
- Touch controls
- Responsive layout
- Performance optimization
- Final balancing