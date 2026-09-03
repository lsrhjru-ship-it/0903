/**
 * Midnight Express - Rhythm Engine
 * Manages beatmap generation, hit judgements, combo scoring, and Zen Auto-play mode.
 */

class RhythmEngine {
    constructor(audioEngine, visualRenderer) {
        this.audio = audioEngine;
        this.visuals = visualRenderer;

        this.notes = [];
        this.combo = 0;
        this.maxCombo = 0;
        this.score = 0;

        this.isZenMode = false;
        this.tempo = 1.0;

        this.nextNoteTime = Date.now() + 1500;
        this.noteInterval = 650; // ms between notes
        this.pitchSequence = [0, 2, 4, 5, 7, 9, 7, 5, 4, 2, 0, 3, 5, 7, 9, 11];
        this.pitchIndex = 0;

        // 2 Target Keys (Default: F for Target 1, J for Target 2)
        this.key1 = 'f';
        this.key2 = 'j';
        this.lastLane = 0;

        // Callbacks for UI updates
        this.onJudgement = null;
        this.onComboUpdate = null;
    }

    setKeys(k1, k2) {
        if (k1) this.key1 = k1.toLowerCase();
        if (k2) this.key2 = k2.toLowerCase();
    }

    setZenMode(enabled) {
        this.isZenMode = enabled;
    }

    setTempo(speed) {
        this.tempo = parseFloat(speed);
        this.noteInterval = 650 / this.tempo;
    }

    update() {
        const now = Date.now();

        // 1. Procedural Beat Map Generator
        if (now >= this.nextNoteTime) {
            this.spawnNote(now);
            this.nextNoteTime = now + (this.noteInterval * (Math.random() < 0.25 ? 0.5 : 1.0));
        }

        // 2. Process Notes & Miss Cleanup (No Fail - Pure Healing)
        for (let note of this.notes) {
            if (note.hit || note.missed) continue;

            const diff = now - note.targetTime;

            // Zen Mode Auto-play hit
            if (this.isZenMode && Math.abs(diff) < 25) {
                this.triggerHit(note, "PERFECT");
                continue;
            }

            // Missed note soft fadeout (relaxed tolerance: over 380ms late)
            if (diff > 380) {
                note.missed = true;
                this.combo = Math.max(0, this.combo - 1);
                if (this.onComboUpdate) this.onComboUpdate(this.combo);
            }
        }

        // Clean up old notes
        this.notes = this.notes.filter(n => !(n.hit || n.missed) || (now - n.targetTime < 800));
    }

    spawnNote(now) {
        // Alternate rhythm between 2 Target Circles (0 and 1)
        this.lastLane = (this.lastLane === 0) ? 1 : 0;
        const lane = this.lastLane;

        const pitch = this.pitchSequence[this.pitchIndex % this.pitchSequence.length];
        this.pitchIndex++;

        // Lead time: note takes 1400ms to travel down comfortably
        const targetTime = now + (1400 / this.tempo);

        this.notes.push({
            id: Math.random().toString(36).substring(2, 9),
            lane: lane,
            pitch: pitch,
            targetTime: targetTime,
            hit: false,
            missed: false
        });
    }

    handleKeyPress(targetIndex = 0) {
        const target = (targetIndex === 1) ? 1 : 0;

        // Visual feedback for specific target circle
        this.visuals.lanePressedState[target] = true;
        setTimeout(() => {
            this.visuals.lanePressedState[target] = false;
        }, 130);

        const now = Date.now();
        
        // Find closest active note assigned to this target circle
        let candidate = null;
        let minDiff = Infinity;

        for (let note of this.notes) {
            if (!note.hit && !note.missed && note.lane === target) {
                const diff = Math.abs(now - note.targetTime);
                if (diff < minDiff) {
                    minDiff = diff;
                    candidate = note;
                }
            }
        }

        // Trigger hit with generous timing window (up to 380ms)
        if (candidate && minDiff <= 380) {
            let judgement = "CHILL";
            if (minDiff <= 140) {
                judgement = "PERFECT";
            } else if (minDiff <= 260) {
                judgement = "GOOD";
            }
            this.triggerHit(candidate, judgement);
        } else {
            // Freestyle Tap: Play warm pentatonic chime note
            const softPitch = (target * 3) + 2;
            if (!this.chartMode) this.audio.playNote(softPitch, 0.5);
        }
    }

    handleKeyRelease(targetIndex) {
        if (targetIndex >= 0 && targetIndex <= 1) {
            this.visuals.lanePressedState[targetIndex] = false;
        }
    }

    triggerHit(note, judgement) {
        note.hit = true;

        // Play Synthesized Pentatonic Piano/Bell note
        if (!this.chartMode) this.audio.playNote(note.pitch, 0.85);

        // Visual Sparkles & Explosion
        this.visuals.spawnHitEffect(note.lane, judgement);

        // Combo & Score
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        if (this.onJudgement) this.onJudgement(judgement);
        if (this.onComboUpdate) this.onComboUpdate(this.combo);
    }
}

// Custom audio chart support
RhythmEngine.prototype.loadAutoChart = function(chart) {
    this.notes = chart.map((n, i) => ({
        id: `chart_${i}`,
        lane: n.lane,
        pitch: n.pitch || 4,
        songTime: n.time,
        targetTime: 0,
        hit: false,
        missed: false
    }));
    this.chartMode = true;
    this.chartStarted = false;
};

RhythmEngine.prototype.startAutoChart = function(startTimestamp) {
    if (!this.chartMode) return;
    this.combo = 0;
    this.maxCombo = 0;
    this.score = 0;
    this.notes.forEach(n => {
        n.hit = false;
        n.missed = false;
        n.targetTime = startTimestamp + n.songTime * 1000;
    });
    this.chartStarted = true;
};

// Override procedural spawning when an uploaded-song chart is active.
const __originalRhythmUpdate = RhythmEngine.prototype.update;
RhythmEngine.prototype.update = function() {
    if (!this.chartMode || !this.chartStarted) return __originalRhythmUpdate.call(this);
    const now = Date.now();
    for (const note of this.notes) {
        if (note.hit || note.missed) continue;
        const diff = now - note.targetTime;
        if (this.isZenMode && Math.abs(diff) < 25) {
            this.triggerHit(note, 'PERFECT');
            continue;
        }
        if (diff > 380) {
            note.missed = true;
            this.combo = Math.max(0, this.combo - 1);
            if (this.onComboUpdate) this.onComboUpdate(this.combo);
        }
    }
    this.notes = this.notes.filter(n => !(n.hit || n.missed) || (now - n.targetTime < 800));
};
