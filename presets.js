import { showScreen, hideScreen } from './ui.js';

const LOCAL_STORAGE_KEY = 'lemonade_tycoon_presets';

export class PresetManager {
    constructor(elements, applyPresetCallback) {
        this.elements = elements;
        this.applyPresetCallback = applyPresetCallback;
        this.room = new WebsimSocket();
        this.currentUser = null;
        this.init();
    }

    async init() {
        this.currentUser = await window.websim.getCurrentUser();
    }

    // --- Local Storage ---
    getLocalPresets() {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || [];
    }

    savePresetLocally(preset) {
        const presets = this.getLocalPresets();
        presets.unshift(preset); // Add to the beginning
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(presets));
    }

    updateLocalPresets(allPresets) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allPresets));
    }

    // --- Database (WebsimSocket) ---
    async getPublicPresets() {
        return this.room.collection('character_presets').getList();
    }

    async publishUserPresets() {
        const localPresets = this.getLocalPresets();
        const publicPresets = localPresets.filter(p => p.isPublic);

        if (publicPresets.length === 0) return;

        const userPresetRecord = this.room.collection('character_presets').filter({ username: this.currentUser.username }).getList()[0];

        if (userPresetRecord) {
            // Update existing record
            await this.room.collection('character_presets').update(userPresetRecord.id, {
                presets: publicPresets
            });
        } else {
            // Create new record
            await this.room.collection('character_presets').create({
                presets: publicPresets
            });
        }
        alert('Your public presets have been updated!');
    }

    // --- Rendering ---
    async renderGalleries() {
        this.elements.presetsGallery.innerHTML = '<p>Loading presets...</p>';
        const localPresets = this.getLocalPresets();
        const allPublicRecords = await this.getPublicPresets();

        let galleryHTML = '';

        // Render User's own presets first
        if (localPresets.length > 0) {
            galleryHTML += `<h3>My Presets</h3>`;
            const myPresetsContainer = `<div class="preset-row">${localPresets.map(p => this.createPresetCard(p, true)).join('')}</div>`;
            galleryHTML += myPresetsContainer;
        }

        // Render public presets from other users
        if (allPublicRecords.length > 0) {
            galleryHTML += `<h3>Public Presets</h3>`;
            allPublicRecords.forEach(record => {
                if (record.username !== this.currentUser.username) {
                     galleryHTML += `<h4>From ${record.username}</h4>`;
                     const publicPresetsContainer = `<div class="preset-row">${record.presets.map(p => this.createPresetCard(p, false)).join('')}</div>`;
                     galleryHTML += publicPresetsContainer;
                }
            });
        }
        
        this.elements.presetsGallery.innerHTML = galleryHTML || '<p>No presets found. Generate a character to create one!</p>';
        this.attachCardListeners();
    }

    createPresetCard(preset, isOwner) {
        const publicButton = isOwner ?
            `<button class="toggle-public-btn" data-preset-id="${preset.id}">${preset.isPublic ? 'Make Private' : 'Make Public'}</button>` : '';
        
        return `
            <div class="preset-card" data-preset-id="${preset.id}" data-is-owner="${isOwner}">
                <img src="${preset.previewImageUrl}" alt="${preset.name}">
                <div class="preset-card-buttons">
                    <button class="apply-preset-btn" data-preset-id="${preset.id}">Use</button>
                    ${publicButton}
                </div>
            </div>`;
    }

    attachCardListeners() {
        this.elements.presetsGallery.querySelectorAll('.apply-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const presetId = e.target.dataset.presetId;
                this.handleApplyPreset(presetId);
            });
        });

        this.elements.presetsGallery.querySelectorAll('.toggle-public-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const presetId = e.target.dataset.presetId;
                this.handleTogglePublic(presetId);
            });
        });
    }

    async handleApplyPreset(presetId) {
        let allPresets = [...this.getLocalPresets()];
        let targetPreset = allPresets.find(p => p.id === presetId);

        if (!targetPreset) {
            const allPublicRecords = await this.getPublicPresets();
            for (const record of allPublicRecords) {
                targetPreset = record.presets.find(p => p.id === presetId);
                if (targetPreset) break;
            }
        }
        
        if (targetPreset) {
            // Apply preset to the editor in the background
            this.applyPresetCallback(targetPreset, this.elements);
            
            // Set the image on the result screen
            this.elements.generatedCharacterImage.src = targetPreset.previewImageUrl;
            
            // Hide presets screen and show result screen
            hideScreen(this.elements.presetsScreen);
            showScreen(this.elements.generationResultScreen);
        } else {
            console.error('Preset not found:', presetId);
        }
    }

    handleTogglePublic(presetId) {
        const localPresets = this.getLocalPresets();
        const preset = localPresets.find(p => p.id === presetId);
        if (preset) {
            preset.isPublic = !preset.isPublic;
            this.updateLocalPresets(localPresets);
            this.publishUserPresets();
            this.renderGalleries(); // Re-render to show updated state
        }
    }
}