/**
 * Midnight Express - Visual Renderer (HTML5 Canvas 2D)
 * Renders night sky gradients, starry background, aurora borealis, falling snow particles,
 * mountain & tree silhouettes, animated train with glowing windows & steam, and rhythm notes.
 */

class VisualRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Theme palette configurations
        this.currentTheme = 'midnight';
        this.themes = {
            midnight: {
                skyTop: '#070914',
                skyMid: '#121833',
                skyBottom: '#22284b',
                auroraColor: 'rgba(167, 139, 250, 0.15)',
                windowGlow: '#fbbf24',
                laneGlow: 'rgba(192, 132, 252, 0.4)'
            },
            aurora: {
                skyTop: '#031417',
                skyMid: '#0a2c2b',
                skyBottom: '#14463d',
                auroraColor: 'rgba(52, 211, 153, 0.28)',
                windowGlow: '#fef08a',
                laneGlow: 'rgba(52, 211, 153, 0.4)'
            },
            starlight: {
                skyTop: '#050b1a',
                skyMid: '#0d1d42',
                skyBottom: '#1a3365',
                auroraColor: 'rgba(96, 165, 250, 0.2)',
                windowGlow: '#fde047',
                laneGlow: 'rgba(96, 165, 250, 0.4)'
            },
            cozy: {
                skyTop: '#130a1c',
                skyMid: '#2d1531',
                skyBottom: '#48203c',
                auroraColor: 'rgba(251, 146, 60, 0.2)',
                windowGlow: '#f97316',
                laneGlow: 'rgba(251, 146, 60, 0.4)'
            }
        };

        // Snow particles
        this.snowCount = 200;
        this.snowflakes = [];

        // Stars background
        this.stars = [];

        // Smoke particles from train engine
        this.smokePuffs = [];

        // Hit Sparkle particles
        this.hitParticles = [];

        // Train animation properties
        this.trainX = 0;
        this.trainSpeed = 2.5;

        // Rhythm hit zones (4 lanes: D, F, J, K)
        this.lanes = [0, 1, 2, 3];
        this.lanePressedState = [false, false, false, false];

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.createStars();
        this.createSnowflakes();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Re-align track position
        this.trackY = this.height * 0.72;
    }

    setTheme(themeKey) {
        if (this.themes[themeKey]) {
            this.currentTheme = themeKey;
        }
    }

    setSnowDensity(count) {
        this.snowCount = parseInt(count);
        this.createSnowflakes();
    }

    createStars() {
        this.stars = [];
        for (let i = 0; i < 180; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height * 0.6),
                radius: Math.random() * 1.4 + 0.3,
                alpha: Math.random(),
                speed: Math.random() * 0.015 + 0.005
            });
        }
    }

    createSnowflakes() {
        this.snowflakes = [];
        for (let i = 0; i < this.snowCount; i++) {
            this.snowflakes.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 2.8 + 0.8,
                speedY: Math.random() * 1.2 + 0.6,
                speedX: Math.random() * 0.8 - 0.4,
                opacity: Math.random() * 0.7 + 0.3,
                swayTime: Math.random() * 100
            });
        }
    }

    // Spawn sparkle explosion when a note is hit
    spawnHitEffect(laneIndex, text = "PERFECT") {
        const laneX = this.getLaneX(laneIndex);
        const hitY = this.trackY - 20;
        const color = this.themes[this.currentTheme].windowGlow;

        // Spawn particles
        for (let i = 0; i < 18; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.hitParticles.push({
                x: laneX,
                y: hitY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.5,
                radius: Math.random() * 3 + 1.5,
                color: color,
                alpha: 1.0,
                life: 1.0,
                decay: Math.random() * 0.03 + 0.02
            });
        }
    }

    getLaneX(laneIndex) {
        // 2 ADOFAI-style dual target circles centered over track
        const spacing = Math.min(this.width * 0.35, 260);
        const centerX = this.width / 2;
        if (laneIndex === 0) return centerX - spacing / 2;
        return centerX + spacing / 2;
    }

    update(deltaTime) {
        const time = Date.now() * 0.001;

        // Update train position (infinite wrapping across screen)
        this.trainX += this.trainSpeed;
        if (this.trainX > this.width + 500) {
            this.trainX = -600;
        }

        // Spawn engine smoke puffs from classic chimney stack
        if (Math.random() < 0.35) {
            const smokeX = this.trainX + 135; // Chimney stack location
            const smokeY = this.trackY - 72;
            this.smokePuffs.push({
                x: smokeX,
                y: smokeY,
                radius: Math.random() * 7 + 7,
                vx: -this.trainSpeed * 0.45 + (Math.random() * 0.5 - 0.25),
                vy: -Math.random() * 0.9 - 0.5,
                alpha: 0.75
            });
        }

        // Update smoke puffs
        for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
            const p = this.smokePuffs[i];
            p.x += p.vx;
            p.y += p.vy;
            p.radius += 0.3;
            p.alpha -= 0.01;
            if (p.alpha <= 0) {
                this.smokePuffs.splice(i, 1);
            }
        }

        // Update hit particles
        for (let i = this.hitParticles.length - 1; i >= 0; i--) {
            const p = this.hitParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.hitParticles.splice(i, 1);
            }
        }

        // Update snowflakes
        for (let flake of this.snowflakes) {
            flake.swayTime += 0.02;
            flake.y += flake.speedY;
            flake.x += flake.speedX + Math.sin(flake.swayTime) * 0.3;

            if (flake.y > this.height) {
                flake.y = -10;
                flake.x = Math.random() * this.width;
            }
            if (flake.x > this.width) flake.x = 0;
            if (flake.x < 0) flake.x = this.width;
        }

        // Update star twinkling
        for (let star of this.stars) {
            star.alpha += star.speed;
            if (star.alpha > 1 || star.alpha < 0.2) {
                star.speed = -star.speed;
            }
        }
    }

    render(notes = [], key1Label = 'F', key2Label = 'J') {
        const theme = this.themes[this.currentTheme];

        // 1. Clear & Render Sky Gradient
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        skyGrad.addColorStop(0, theme.skyTop);
        skyGrad.addColorStop(0.55, theme.skyMid);
        skyGrad.addColorStop(1, theme.skyBottom);
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 2. Render Twinkling Stars
        this.ctx.fillStyle = '#ffffff';
        for (let star of this.stars) {
            this.ctx.globalAlpha = star.alpha;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1.0;

        // 3. Render Moon
        this.drawMoon();

        // 4. Render Aurora Borealis
        this.drawAurora(theme.auroraColor);

        // 5. Render Mountain Silhouettes
        this.drawMountains();

        // 6. Render Pine Trees
        this.drawTrees();

        // 7. Render Railway Bridge & Track
        this.drawRailwayBridge();

        // 8. Render Animated Train
        this.drawTrain(theme);

        // 9. Render Train Engine Smoke
        this.drawSmoke();

        // 10. Render Rhythm Note Lanes & Targets
        this.drawRhythmTargets(theme, key1Label, key2Label);

        // 11. Render Moving Notes
        this.drawNotes(notes, theme);

        // 12. Render Hit Sparkle Effects
        this.drawHitParticles();

        // 13. Render Snowfall (Top Layer)
        this.drawSnow();
    }

    drawMoon() {
        const moonX = this.width * 0.8;
        const moonY = this.height * 0.2;
        const radius = 38;

        // Soft Moon Glow
        const glow = this.ctx.createRadialGradient(moonX, moonY, radius * 0.5, moonX, moonY, radius * 3);
        glow.addColorStop(0, 'rgba(255, 255, 240, 0.4)');
        glow.addColorStop(1, 'rgba(255, 255, 240, 0)');
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(moonX, moonY, radius * 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Crescent Moon
        this.ctx.fillStyle = '#fffdf0';
        this.ctx.beginPath();
        this.ctx.arc(moonX, moonY, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawAurora(colorStr) {
        const time = Date.now() * 0.0008;
        this.ctx.fillStyle = colorStr;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height * 0.35);

        for (let x = 0; x <= this.width; x += 40) {
            const y = Math.sin(x * 0.003 + time) * 35 + Math.cos(x * 0.005 - time) * 20 + this.height * 0.28;
            this.ctx.lineTo(x, y);
        }

        this.ctx.lineTo(this.width, this.height * 0.55);
        this.ctx.lineTo(0, this.height * 0.55);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawMountains() {
        // Back mountain silhouette
        this.ctx.fillStyle = 'rgba(10, 14, 28, 0.7)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.trackY);
        this.ctx.lineTo(0, this.height * 0.5);
        this.ctx.lineTo(this.width * 0.25, this.height * 0.38);
        this.ctx.lineTo(this.width * 0.5, this.height * 0.52);
        this.ctx.lineTo(this.width * 0.75, this.height * 0.35);
        this.ctx.lineTo(this.width, this.height * 0.48);
        this.ctx.lineTo(this.width, this.trackY);
        this.ctx.closePath();
        this.ctx.fill();

        // Front snowy mountain peak silhouette
        this.ctx.fillStyle = 'rgba(15, 21, 40, 0.95)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.trackY);
        this.ctx.lineTo(0, this.height * 0.58);
        this.ctx.lineTo(this.width * 0.18, this.height * 0.45);
        this.ctx.lineTo(this.width * 0.35, this.height * 0.6);
        this.ctx.lineTo(this.width * 0.6, this.height * 0.42);
        this.ctx.lineTo(this.width * 0.85, this.height * 0.58);
        this.ctx.lineTo(this.width, this.height * 0.5);
        this.ctx.lineTo(this.width, this.trackY);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawTrees() {
        this.ctx.fillStyle = '#060a14';
        const startY = this.trackY + 5;
        for (let x = 10; x < this.width; x += 35) {
            const h = 25 + Math.sin(x) * 12;
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x - 10, startY);
            this.ctx.lineTo(x, startY - h);
            this.ctx.lineTo(x + 10, startY);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    drawRailwayBridge() {
        const y = this.trackY;

        // Bridge pillars
        this.ctx.fillStyle = '#080c19';
        for (let x = 40; x < this.width; x += 140) {
            this.ctx.fillRect(x, y, 24, this.height - y);
            // Cross beams
            this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            this.ctx.strokeRect(x - 10, y + 20, 44, 40);
        }

        // Rail track base line
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(0, y, this.width, 10);

        // Steel rail lines
        this.ctx.fillStyle = '#64748b';
        this.ctx.fillRect(0, y + 2, this.width, 3);

        // Ties / Sleepers along track
        this.ctx.fillStyle = '#0f172a';
        for (let x = 0; x < this.width; x += 16) {
            this.ctx.fillRect(x, y + 7, 10, 5);
        }
    }

    drawTrain(theme) {
        const y = this.trackY - 48;
        const x = this.trainX;
        const rodAngle = (Date.now() * 0.008 * (this.trainSpeed / 2.5));

        this.ctx.save();

        // 1. Train Car Passenger Windows Glow onto Snow & Ground
        const windowGlowGrad = this.ctx.createLinearGradient(0, y + 30, 0, y + 110);
        windowGlowGrad.addColorStop(0, theme.windowGlow);
        windowGlowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = windowGlowGrad;
        this.ctx.globalAlpha = 0.38;
        this.ctx.fillRect(x - 520, y + 30, 780, 80);
        this.ctx.globalAlpha = 1.0;

        const carWidth = 145;
        const carHeight = 44;
        const carGap = 16;
        const wheelRadius = 8;
        const wheelY = y + carHeight + 3;

        // 2. Draw Passenger Cars (3 Vintage Passenger Coaches)
        for (let c = 0; c < 3; c++) {
            const carX = x - (c + 1) * (carWidth + carGap);

            // Coupler connecting bars
            this.ctx.fillStyle = '#475569';
            this.ctx.fillRect(carX + carWidth, y + carHeight - 14, carGap, 6);

            // Coach Body (Wood / Dark Metal Shell)
            this.ctx.fillStyle = '#0f172a';
            this.ctx.fillRect(carX, y, carWidth, carHeight);

            // Roof Overhang
            this.ctx.fillStyle = '#1e293b';
            this.ctx.fillRect(carX - 2, y - 4, carWidth + 4, 6);

            // Brass Trim Stripes
            this.ctx.fillStyle = '#d97706';
            this.ctx.fillRect(carX, y + 4, carWidth, 2);
            this.ctx.fillRect(carX, y + carHeight - 6, carWidth, 2);

            // Arched Cozy Glowing Windows
            this.ctx.fillStyle = theme.windowGlow;
            this.ctx.shadowColor = theme.windowGlow;
            this.ctx.shadowBlur = 12;

            for (let w = 0; w < 4; w++) {
                const winX = carX + 16 + w * 30;
                const winY = y + 10;
                const winW = 18;
                const winH = 18;

                // Compatible rounded window path
                this.ctx.fillRect(winX, winY, winW, winH);

                // Window pane divider frame
                this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.moveTo(winX + winW / 2, winY);
                this.ctx.lineTo(winX + winW / 2, winY + winH);
                this.ctx.stroke();
            }
            this.ctx.shadowBlur = 0;

            // Coach Wheels (Double Bogies with Rotating Spokes)
            this.drawWheelBogie(carX + 26, wheelY, rodAngle * 1.5);
            this.drawWheelBogie(carX + carWidth - 26, wheelY, rodAngle * 1.5);
        }

        // 3. Draw Steam Locomotive Engine (앞쪽 클래식 증기기관차)
        const engX = x;
        const engHeight = 46;

        // Coupler to first coach
        this.ctx.fillStyle = '#334155';
        this.ctx.fillRect(engX - carGap, y + carHeight - 14, carGap, 6);

        // Driver's Cab (운전실 뒤쪽 캡)
        const cabW = 55;
        const cabH = 54;
        const cabX = engX;
        const cabY = y - 10;

        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(cabX, cabY, cabW, cabH);

        // Curved Cab Roof
        this.ctx.fillStyle = '#0f172a';
        this.ctx.beginPath();
        this.ctx.ellipse(cabX + cabW / 2, cabY, cabW / 2 + 4, 8, 0, Math.PI, 0);
        this.ctx.fill();

        // Cab Arched Window with Warm Light & Driver Silhouette
        this.ctx.fillStyle = theme.windowGlow;
        this.ctx.shadowColor = theme.windowGlow;
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(cabX + 14, cabY + 12, 26, 22);
        this.ctx.shadowBlur = 0;

        // Driver Silhouette inside window
        this.ctx.fillStyle = '#0f172a';
        this.ctx.beginPath();
        this.ctx.arc(cabX + 28, cabY + 22, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Steam Boiler Cylinder (중앙 보일러 몸통)
        const boilerX = cabX + cabW;
        const boilerY = y - 2;
        const boilerW = 105;
        const boilerH = 40;

        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(boilerX, boilerY, boilerW, boilerH);

        // Boiler Front Rounded Cap
        this.ctx.fillStyle = '#334155';
        this.ctx.beginPath();
        this.ctx.ellipse(boilerX + boilerW, boilerY + boilerH / 2, 10, boilerH / 2, 0, -Math.PI / 2, Math.PI / 2);
        this.ctx.fill();

        // Brass Boiler Straps (황동 밴드 테두리)
        this.ctx.fillStyle = '#f59e0b';
        for (let b = 15; b < boilerW - 10; b += 24) {
            this.ctx.fillRect(boilerX + b, boilerY - 1, 3, boilerH + 2);
        }

        // Steam Dome (보일러 상단 스팀 돔)
        this.ctx.fillStyle = '#b45309';
        this.ctx.beginPath();
        this.ctx.arc(boilerX + 32, boilerY - 4, 9, Math.PI, 0);
        this.ctx.fill();

        // Classic Flanged Steam Chimney Stack (굴뚝)
        const stackX = boilerX + 80;
        const stackY = boilerY - 24;

        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(stackX, stackY, 14, 24);
        // Chimney Top Flange
        this.ctx.fillStyle = '#d97706';
        this.ctx.fillRect(stackX - 4, stackY - 3, 22, 5);

        // Front Triangular Cowcatcher / Pilot Grill (배장기)
        const pilotX = boilerX + boilerW + 2;
        const pilotY = y + carHeight - 12;

        this.ctx.fillStyle = '#991b1b'; // Classic Crimson Red Pilot
        this.ctx.beginPath();
        this.ctx.moveTo(pilotX, pilotY);
        this.ctx.lineTo(pilotX + 28, pilotY + 16);
        this.ctx.lineTo(pilotX - 10, pilotY + 16);
        this.ctx.closePath();
        this.ctx.fill();

        // Cowcatcher Grill Bars
        this.ctx.strokeStyle = '#f87171';
        this.ctx.lineWidth = 2;
        for (let g = 0; g <= 20; g += 5) {
            this.ctx.beginPath();
            this.ctx.moveTo(pilotX + g * 0.4, pilotY);
            this.ctx.lineTo(pilotX + g, pilotY + 16);
            this.ctx.stroke();
        }

        // Animated Drivers & Connecting Piston Rods (기관차 대형 바퀴 & 피스톤 연결봉)
        const driverY = y + carHeight + 2;

        // 3 Large Driving Wheels
        const driveWheelR = 14;
        const wheelCenterX1 = engX + 28;
        const wheelCenterX2 = engX + 68;
        const wheelCenterX3 = engX + 108;

        this.drawLargeDriverWheel(wheelCenterX1, driverY - 2, driveWheelR, rodAngle);
        this.drawLargeDriverWheel(wheelCenterX2, driverY - 2, driveWheelR, rodAngle);
        this.drawLargeDriverWheel(wheelCenterX3, driverY - 2, driveWheelR, rodAngle);

        // Connecting Side Rod (동력 연결봉)
        const pinX1 = wheelCenterX1 + Math.cos(rodAngle) * 8;
        const pinY1 = (driverY - 2) + Math.sin(rodAngle) * 8;
        const pinX3 = wheelCenterX3 + Math.cos(rodAngle) * 8;
        const pinY3 = (driverY - 2) + Math.sin(rodAngle) * 8;

        this.ctx.strokeStyle = '#f8fafc';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(pinX1, pinY1);
        this.ctx.lineTo(pinX3, pinY3);
        this.ctx.stroke();

        // Piston Cylinder & Crosshead Link
        this.ctx.fillStyle = '#475569';
        this.ctx.fillRect(engX + 124, driverY - 8, 22, 12);
        this.ctx.strokeStyle = '#cbd5e1';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(engX + 130, driverY - 2);
        this.ctx.lineTo(pinX3, pinY3);
        this.ctx.stroke();

        // Headlight Lantern (클래식 황동 헤드라이트)
        const headLanternX = boilerX + boilerW - 4;
        const headLanternY = boilerY + 6;

        this.ctx.fillStyle = '#d97706';
        this.ctx.fillRect(headLanternX, headLanternY, 14, 16);

        // Headlight Beam Cone illuminating snow ahead
        const beamX = headLanternX + 14;
        const beamY = headLanternY + 8;

        const beam = this.ctx.createRadialGradient(beamX, beamY, 6, beamX + 260, beamY, 140);
        beam.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
        beam.addColorStop(0.3, 'rgba(253, 224, 71, 0.4)');
        beam.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = beam;
        this.ctx.beginPath();
        this.ctx.moveTo(beamX, beamY - 4);
        this.ctx.lineTo(beamX + 320, beamY - 60);
        this.ctx.lineTo(beamX + 320, beamY + 75);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    drawWheelBogie(cx, cy, angle = 0) {
        // Render 2 passenger wheels with rotating spokes
        const renderWheel = (wx) => {
            // Wheel Rim Base
            this.ctx.fillStyle = '#1e293b';
            this.ctx.beginPath();
            this.ctx.arc(wx, cy, 7, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = '#94a3b8';
            this.ctx.lineWidth = 1.8;
            this.ctx.beginPath();
            this.ctx.arc(wx, cy, 7, 0, Math.PI * 2);
            this.ctx.stroke();

            // Rotating Spokes
            this.ctx.strokeStyle = '#f1f5f9';
            this.ctx.lineWidth = 1.2;
            for (let i = 0; i < 4; i++) {
                const a = angle + (i * Math.PI / 2);
                this.ctx.beginPath();
                this.ctx.moveTo(wx, cy);
                this.ctx.lineTo(wx + Math.cos(a) * 5, cy + Math.sin(a) * 5);
                this.ctx.stroke();
            }

            // Center Pin
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.beginPath();
            this.ctx.arc(wx, cy, 2, 0, Math.PI * 2);
            this.ctx.fill();
        };

        renderWheel(cx - 10);
        renderWheel(cx + 10);
    }

    drawLargeDriverWheel(cx, cy, radius, angle) {
        // Driver Wheel Rim Base
        this.ctx.fillStyle = '#0f172a';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Silver Outer Rim
        this.ctx.strokeStyle = '#f8fafc';
        this.ctx.lineWidth = 2.8;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.stroke();

        // Rotating Spokes (6 High-Contrast Spokes)
        this.ctx.strokeStyle = '#94a3b8';
        this.ctx.lineWidth = 2.0;
        for (let i = 0; i < 6; i++) {
            const a = angle + (i * Math.PI / 3);
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.lineTo(cx + Math.cos(a) * (radius - 2), cy + Math.sin(a) * (radius - 2));
            this.ctx.stroke();
        }

        // Counterbalance Weight Wedge
        this.ctx.fillStyle = '#475569';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius - 3, angle, angle + Math.PI / 2);
        this.ctx.lineTo(cx, cy);
        this.ctx.closePath();
        this.ctx.fill();

        // Rotating Connecting Pin Hub
        const pinX = cx + Math.cos(angle) * 8;
        const pinY = cy + Math.sin(angle) * 8;

        this.ctx.fillStyle = '#fbbf24';
        this.ctx.beginPath();
        this.ctx.arc(pinX, pinY, 3.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Center Cap
        this.ctx.fillStyle = '#e2e8f0';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawSmoke() {
        this.ctx.fillStyle = 'rgba(248, 250, 252, 0.75)';
        for (let p of this.smokePuffs) {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1.0;
    }

    drawRhythmTargets(theme, key1Label = 'F', key2Label = 'J') {
        const hitY = this.trackY - 20;

        // Render 2 ADOFAI-style glowing target circles
        for (let i = 0; i < 2; i++) {
            const laneX = this.getLaneX(i);
            const isPressed = this.lanePressedState[i];
            const currentKeyLabel = (i === 0 ? key1Label : key2Label).toUpperCase();

            this.ctx.save();
            
            // Outer glowing aura ring
            this.ctx.beginPath();
            this.ctx.arc(laneX, hitY, isPressed ? 32 : 26, 0, Math.PI * 2);
            this.ctx.strokeStyle = isPressed ? '#ffffff' : theme.windowGlow;
            this.ctx.lineWidth = isPressed ? 4 : 2;
            this.ctx.stroke();

            // Inner target circle
            this.ctx.beginPath();
            this.ctx.arc(laneX, hitY, isPressed ? 20 : 16, 0, Math.PI * 2);
            this.ctx.fillStyle = isPressed ? 'rgba(255, 255, 255, 0.4)' : theme.laneGlow;
            this.ctx.fill();

            // Center core dot
            this.ctx.beginPath();
            this.ctx.arc(laneX, hitY, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fill();

            // Labels & Assigned Keys below target
            this.ctx.fillStyle = isPressed ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
            this.ctx.font = '700 14px Outfit, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Target ${i + 1} [ ${currentKeyLabel} ]`, laneX, hitY + 44);

            this.ctx.restore();
        }

        // Floating hint text centered between circles
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        this.ctx.font = '500 12px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Target 1: [ ${key1Label.toUpperCase()} ] | Target 2: [ ${key2Label.toUpperCase()} ]`, this.width / 2, hitY + 68);
        this.ctx.restore();
    }

    drawNotes(notes, theme) {
        const hitY = this.trackY - 20;

        for (let note of notes) {
            if (note.hit || note.missed) continue;

            const laneX = this.getLaneX(note.lane);
            // Calculate Y based on target time
            const now = Date.now();
            const timeDiff = note.targetTime - now;
            const travelDistance = 500; // pixels to travel
            const noteY = hitY - (timeDiff * 0.45);

            if (noteY > -50 && noteY < this.height) {
                this.ctx.save();
                this.ctx.shadowColor = theme.windowGlow;
                this.ctx.shadowBlur = 12;

                // Glowing musical star note
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(laneX, noteY, 14, 0, Math.PI * 2);
                this.ctx.fill();

                // Inner core
                this.ctx.fillStyle = theme.windowGlow;
                this.ctx.beginPath();
                this.ctx.arc(laneX, noteY, 8, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.restore();
            }
        }
    }

    drawHitParticles() {
        for (let p of this.hitParticles) {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    drawSnow() {
        this.ctx.fillStyle = '#ffffff';
        for (let flake of this.snowflakes) {
            this.ctx.globalAlpha = flake.opacity;
            this.ctx.beginPath();
            this.ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1.0;
    }
}
