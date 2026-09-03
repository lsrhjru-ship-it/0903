/**
 * Midnight Express - Audio Engine (Web Audio API Synthesizer)
 * Generates chill lo-fi pentatonic tones, warm bell chimes, train track noise & ambient wind.
 */

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.isInitialized = false;

        // Gain Nodes
        this.masterGain = null;
        this.melodyGain = null;
        this.trainGain = null;
        this.windGain = null;

        // Volumes (0.0 to 1.0)
        this.melodyVol = 0.8;
        this.trainVol = 0.22;
        this.windVol = 0.2;

        // Ambient Sound Nodes
        this.trainNoiseNode = null;
        this.windNoiseNode = null;
        this.trainTimer = null;
        this.customMusic = null;

        // Harmonious Pentatonic Scales (Frequencies in Hz)
        // Scale: Eb Major Pentatonic / C Minor Pentatonic (Chill Lo-fi Vibe)
        // Eb3, F3, G3, Bb3, C4, Eb4, F4, G4, Bb4, C5, Eb5, F5
        this.scaleNotes = [
            155.56, 174.61, 196.00, 233.08, 261.63,
            311.13, 349.23, 392.00, 466.16, 523.25,
            622.25, 698.46
        ];
    }

    init() {
        if (this.isInitialized) return;

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();

        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Sub Gains
        this.melodyGain = this.ctx.createGain();
        this.melodyGain.gain.setValueAtTime(this.melodyVol, this.ctx.currentTime);
        this.melodyGain.connect(this.masterGain);

        this.trainGain = this.ctx.createGain();
        this.trainGain.gain.setValueAtTime(this.trainVol, this.ctx.currentTime);
        this.trainGain.connect(this.masterGain);

        this.windGain = this.ctx.createGain();
        this.windGain.gain.setValueAtTime(this.windVol, this.ctx.currentTime);
        this.windGain.connect(this.masterGain);

        // Simple Delay / Reverb Effect for spatial chill feeling
        this.delayNode = this.ctx.createDelay();
        this.delayNode.delayTime.value = 0.28; // 280ms echo
        this.delayFeedback = this.ctx.createGain();
        this.delayFeedback.gain.value = 0.25;

        this.delayNode.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delayNode);
        this.delayNode.connect(this.masterGain);

        this.isInitialized = true;
        this.startAmbientSounds();
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Plays a soothing piano/bell chime note
     * @param {number} pitchIndex Index of scale or direct pitch (0-11)
     * @param {number} velocity Volume multiplier (0.5 - 1.0)
     */
    playNote(pitchIndex = 4, velocity = 0.8) {
        if (!this.isInitialized || !this.ctx) return;
        this.resume();

        const freq = this.scaleNotes[pitchIndex % this.scaleNotes.length] || 311.13;
        const now = this.ctx.currentTime;

        // Primary Oscillator (Warm Sine/Triangle blend)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        // Sine for pure fundamental tone, Triangle for gentle harmonics
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, now);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2, now); // 1 Octave higher subtle harmonic

        // Note Envelope
        const attackTime = 0.015;
        const releaseTime = 1.6;
        const noteVolume = velocity * this.melodyVol;

        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(noteVolume, now + attackTime);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);

        // Connections
        osc1.connect(noteGain);

        const osc2Gain = this.ctx.createGain();
        osc2Gain.gain.value = 0.15; // Soft overtone
        osc2.connect(osc2Gain);
        osc2Gain.connect(noteGain);

        noteGain.connect(this.melodyGain);
        noteGain.connect(this.delayNode); // Add spatial echo

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + releaseTime);
        osc2.stop(now + releaseTime);
    }

    /**
     * Synthesizes ambient background sounds:
     * - Rhythmic Train Track Clatter (Subtle low-pass noise clicks)
     * - Soft Wind / Snow Ambience
     */
    startAmbientSounds() {
        if (!this.ctx) return;

        // 1. Wind Ambience Generator (Filtered Brown Noise)
        const bufferSize = this.ctx.sampleRate * 2;
        const windBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = windBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02; // Brown noise formula
            lastOut = data[i];
            data[i] *= 3.5; // Gain adjustment
        }

        const windSource = this.ctx.createBufferSource();
        windSource.buffer = windBuffer;
        windSource.loop = true;

        const windFilter = this.ctx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

        windSource.connect(windFilter);
        windFilter.connect(this.windGain);
        windSource.start();
        this.windNoiseNode = windSource;

        // LFO for wind gusting effect
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 0.12; // slow wind pulse
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 120;
        lfo.connect(lfoGain);
        lfoGain.connect(windFilter.frequency);
        lfo.start();

        // 2. Train Track Clatter (Rhythmic gentle 'clack-clack... clack-clack')
        this.scheduleTrainTrackClack();
    }

    scheduleTrainTrackClack() {
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const tempoInterval = 0.55; // rhythm of train wheels

        // Double click: clack-clack
        this.playTrackClick(now, 0.4);
        this.playTrackClick(now + 0.1, 0.25);

        this.playTrackClick(now + tempoInterval, 0.35);
        this.playTrackClick(now + tempoInterval + 0.1, 0.2);

        this.trainTimer = setTimeout(() => {
            this.scheduleTrainTrackClack();
        }, tempoInterval * 2000);
    }

    playTrackClick(time, gainVal) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.05);

        filter.type = 'lowpass';
        filter.frequency.value = 180;

        gain.gain.setValueAtTime(gainVal * this.trainVol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.trainGain);

        osc.start(time);
        osc.stop(time + 0.07);
    }

    /**
     * Uploaded/served MP3 playlist support (song1.mp3, song2.mp3, song3.mp3 ...)
     * files: array of filenames, folder: folder they live in (relative to index.html)
     */
    initPlaylist(files, folder) {
        if (!files || !files.length) {
            this.playlist = [];
            return false;
        }
        const cleanFolder = (folder || '').replace(/\/+$/, '');
        this.playlist = files.map(f => (cleanFolder ? `${cleanFolder}/${f}` : f));
        this.playlistIndex = 0;
        return true;
    }

    startPlaylist() {
        if (!this.playlist || !this.playlist.length) return false;
        this.stopPlaylist();
        this.playlistIndex = 0;
        this._playPlaylistTrack(this.playlistIndex);
        return true;
    }

    _playPlaylistTrack(i) {
        if (!this.playlist || !this.playlist.length) return;
        const url = this.playlist[i % this.playlist.length];
        const el = new Audio(url);
        el.volume = this.melodyVol;
        el.addEventListener('ended', () => {
            this.playlistIndex = (this.playlistIndex + 1) % this.playlist.length;
            this._playPlaylistTrack(this.playlistIndex);
        });
        el.addEventListener('error', () => {
            console.warn('음악 파일을 재생할 수 없습니다:', url);
            if (this.playlist.length > 1) {
                this.playlistIndex = (this.playlistIndex + 1) % this.playlist.length;
                if (this.playlistIndex !== 0) this._playPlaylistTrack(this.playlistIndex);
            }
        });
        el.play().catch(err => console.warn('MP3 재생 실패 (자동재생 정책일 수 있음):', err));
        this.playlistAudio = el;
    }

    stopPlaylist() {
        if (this.playlistAudio) {
            this.playlistAudio.pause();
            this.playlistAudio.currentTime = 0;
            this.playlistAudio.src = '';
            this.playlistAudio = null;
        }
    }

    setPlaylistVolume(vol) {
        this.melodyVol = parseFloat(vol);
        if (this.playlistAudio) this.playlistAudio.volume = this.melodyVol;
    }

    setMelodyVolume(vol) {
        this.melodyVol = parseFloat(vol);
        if (this.melodyGain && this.ctx) {
            this.melodyGain.gain.setValueAtTime(this.melodyVol, this.ctx.currentTime);
        }
    }

    setTrainVolume(vol) {
        this.trainVol = parseFloat(vol);
        if (this.trainGain && this.ctx) {
            this.trainGain.gain.setValueAtTime(this.trainVol, this.ctx.currentTime);
        }
    }

    setWindVolume(vol) {
        this.windVol = parseFloat(vol);
        if (this.windGain && this.ctx) {
            this.windGain.gain.setValueAtTime(this.windVol, this.ctx.currentTime);
        }
    }
    // Custom uploaded music. HTMLAudioElement is deliberately used for reliable
    // playback under browser autoplay policies (play is called directly from click).
    setCustomMusic(file) {
        this.stopCustomMusic();
        this.customMusic = new Audio();
        this.customMusic.preload = 'auto';
        this.customMusic.src = URL.createObjectURL(file);
        this.customMusic.volume = 1;
        this.customMusic.loop = false;
        this.customMusic.load();
        return new Promise((resolve, reject) => {
            this.customMusic.addEventListener('canplaythrough', () => resolve(this.customMusic.duration), { once: true });
            this.customMusic.addEventListener('error', () => reject(new Error('음악 파일을 읽을 수 없습니다.')), { once: true });
        });
    }

    async playCustomMusic() {
        if (!this.customMusic) return false;
        try {
            this.customMusic.currentTime = 0;
            await this.customMusic.play();
            return true;
        } catch (err) {
            console.error('Custom music play failed', err);
            throw err;
        }
    }

    stopCustomMusic() {
        if (this.customMusic) {
            this.customMusic.pause();
            this.customMusic.currentTime = 0;
        }
    }

    // Gentle original ambient melody for the journey (not a fixed/copyrighted song file)
    startCalmJourneyMusic() {
        if (!this.isInitialized || this.calmMusicStarted) return;
        this.calmMusicStarted = true;
        const ctx = this.ctx;

        // Warm sustained pad chords (harmonic bed)
        const padGain = ctx.createGain();
        padGain.gain.value = 0.16;
        padGain.connect(this.masterGain);
        padGain.connect(this.delayNode);

        // Soft plucked arpeggio melody floating on top of the pad
        const topGain = ctx.createGain();
        topGain.gain.value = 0.13;
        topGain.connect(this.masterGain);
        topGain.connect(this.delayNode);

        // Each chord paired with a gentle rising/falling arpeggio pattern
        // drawn from the same harmony, using the class pentatonic scale for extra notes.
        const chords = [
            { notes: [220, 277.18, 329.63], arp: [329.63, 392.00, 440.00, 392.00] },
            { notes: [196, 246.94, 293.66], arp: [293.66, 349.23, 392.00, 349.23] },
            { notes: [174.61, 220, 261.63], arp: [261.63, 311.13, 349.23, 311.13] },
            { notes: [196, 246.94, 329.63], arp: [329.63, 392.00, 466.16, 392.00] }
        ];
        let step = 0;

        const playChord = () => {
            if (!this.calmMusicStarted) return;
            const now = ctx.currentTime;
            const chord = chords[step % chords.length];

            // Sustained pad notes
            chord.notes.forEach(f => {
                const o = ctx.createOscillator(), g = ctx.createGain();
                o.type = 'sine';
                o.frequency.value = f;
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.55, now + 1.2);
                g.gain.exponentialRampToValueAtTime(0.001, now + 5.8);
                o.connect(g);
                g.connect(padGain);
                o.start(now);
                o.stop(now + 6);
            });

            // Gentle arpeggio melody line, one soft note at a time
            chord.arp.forEach((f, i) => {
                const noteStart = now + 0.6 + i * 1.15;
                const o = ctx.createOscillator(), g = ctx.createGain();
                o.type = 'triangle';
                o.frequency.value = f;
                g.gain.setValueAtTime(0, noteStart);
                g.gain.linearRampToValueAtTime(0.45, noteStart + 0.25);
                g.gain.exponentialRampToValueAtTime(0.001, noteStart + 1.7);
                o.connect(g);
                g.connect(topGain);
                o.start(noteStart);
                o.stop(noteStart + 1.8);
            });

            step++;
            this.calmMusicTimer = setTimeout(playChord, 5200);
        };
        playChord();
    }


}

// Global Audio Engine Instance
const audioEngine = new AudioEngine();
