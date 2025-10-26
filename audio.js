export class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.ambientSources = {};
        console.log("AudioManager initialized.");
    }

    async loadSound(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error(`Error loading sound: ${url}`, error);
            return null;
        }
    }

    async playAmbientSound(url) {
        if (this.ambientSources[url]) {
            // Sound is already playing
            return;
        }

        // Resume context on user gesture
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const buffer = await this.loadSound(url);
        if (!buffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const gainNode = this.audioContext.createGain();
        if (url.includes('wind')) {
            gainNode.gain.value = 0.3; // Make wind quieter
        } else {
            gainNode.gain.value = 0.5;
        }

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start(0);

        this.ambientSources[url] = { source, gainNode };
    }

    stopAmbientSound(url) {
        if (this.ambientSources[url]) {
            this.ambientSources[url].source.stop();
            delete this.ambientSources[url];
        }
    }
}

