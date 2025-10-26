export class AssetManager {
    constructor(elements, addNewItemCallback, dragHandlers) {
        this.elements = elements;
        this.addNewItemCallback = addNewItemCallback;
        this.dragHandlers = dragHandlers;
        this.room = new WebsimSocket();
        this.currentUser = null;
        this.LOCAL_STORAGE_KEY = 'lemonade_tycoon_assets';
        this.init();
    }

    async init() {
        this.currentUser = await window.websim.getCurrentUser();
        this.loadLocalAssetsIntoInventory();
    }

    // --- Local Storage ---
    getLocalAssets() {
        return JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_KEY)) || [];
    }

    saveAssetLocally(asset) {
        const assets = this.getLocalAssets();
        // Check for duplicates before adding
        if (!assets.some(a => a.id === asset.id || a.url === asset.url)) {
            assets.unshift(asset);
            localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(assets));
        }
    }

    updateLocalAssets(allAssets) {
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(allAssets));
        this.publishUserAssets();
    }

    loadLocalAssetsIntoInventory() {
        const localAssets = this.getLocalAssets();
        localAssets.forEach(asset => {
            this.addNewItemCallback(asset, this.dragHandlers);
        });
    }

    // --- Database (WebsimSocket) ---
    async getPublicAssets() {
        return this.room.collection('clothing_assets').getList();
    }

    async publishUserAssets() {
        const localAssets = this.getLocalAssets();
        const publicAssets = localAssets.filter(p => p.isPublic);

        if (publicAssets.length === 0) return;

        const userAssetRecord = this.room.collection('clothing_assets').filter({ username: this.currentUser.username }).getList()[0];

        if (userAssetRecord) {
            await this.room.collection('clothing_assets').update(userAssetRecord.id, { assets: publicAssets });
        } else {
            await this.room.collection('clothing_assets').create({ assets: publicAssets });
        }
    }

    // --- Rendering ---
    async renderGallery() {
        this.elements.assetGallery.innerHTML = '<div class="loading-spinner"></div><p>Loading assets...</p>';
        const localAssets = this.getLocalAssets();
        const allPublicRecords = await this.getPublicAssets();

        let galleryHTML = '<div>';

        // Render User's own creations
        galleryHTML += `<h4>My Creations (${localAssets.length})</h4>`;
        if (localAssets.length > 0) {
            galleryHTML += `<div class="asset-row">${localAssets.map(p => this.createAssetCard(p, true)).join('')}</div>`;
        } else {
            galleryHTML += `<p>You haven't created any items yet. Use the &#10024; button to generate some!</p>`;
        }

        // Render public assets
        galleryHTML += `<h4>Public Items</h4>`;
        let publicItemsCount = 0;
        allPublicRecords.forEach(record => {
            const userAssets = record.assets || [];
            if (record.username !== this.currentUser.username && userAssets.length > 0) {
                galleryHTML += `<h5>From ${record.username}</h5>`;
                galleryHTML += `<div class="asset-row">${userAssets.map(p => this.createAssetCard(p, false)).join('')}</div>`;
                publicItemsCount += userAssets.length;
            }
        });

        if (publicItemsCount === 0) {
            galleryHTML += `<p>No public items from other users yet.</p>`;
        }

        galleryHTML += '</div>';
        this.elements.assetGallery.innerHTML = galleryHTML;
        this.attachCardListeners();
    }

    createAssetCard(asset, isOwner) {
        const buttons = isOwner ?
            `<button class="toggle-public-asset-btn" data-asset-id="${asset.id}">${asset.isPublic ? 'Make Private' : 'Make Public'}</button>
             <button class="delete-asset-btn" data-asset-id="${asset.id}">Delete</button>` :
            `<button class="import-asset-btn" data-asset-url="${asset.url}" data-asset-prompt="${asset.prompt}" data-asset-type="${asset.type}">Add to My Items</button>`;

        return `
            <div class="asset-card" data-asset-id="${asset.id}">
                <img src="${asset.url}" alt="${asset.prompt}">
                <div class="asset-card-buttons">${buttons}</div>
            </div>`;
    }

    attachCardListeners() {
        this.elements.assetGallery.querySelectorAll('.toggle-public-asset-btn').forEach(btn => {
            btn.addEventListener('click', e => this.handleTogglePublic(e.target.dataset.assetId));
        });
        this.elements.assetGallery.querySelectorAll('.delete-asset-btn').forEach(btn => {
            btn.addEventListener('click', e => this.handleDelete(e.target.dataset.assetId));
        });
        this.elements.assetGallery.querySelectorAll('.import-asset-btn').forEach(btn => {
            btn.addEventListener('click', e => this.handleImport(e.target.dataset));
        });
    }

    // --- Event Handlers ---
    handleTogglePublic(assetId) {
        const localAssets = this.getLocalAssets();
        const asset = localAssets.find(a => a.id === assetId);
        if (asset) {
            asset.isPublic = !asset.isPublic;
            this.updateLocalAssets(localAssets);
            this.renderGallery(); // Re-render to show updated state
        }
    }

    handleDelete(assetId) {
        if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) return;

        let localAssets = this.getLocalAssets();
        localAssets = localAssets.filter(a => a.id !== assetId);
        this.updateLocalAssets(localAssets);
        // Also remove from the DOM
        const itemInPalette = this.elements.clothingPalette.querySelector(`img[src*="${assetId.split('_')[1]}"]`);
        if (itemInPalette) itemInPalette.remove();

        this.renderGallery();
    }

    handleImport(assetData) {
        const newAsset = {
            id: `asset_${Date.now()}`,
            url: assetData.assetUrl,
            prompt: assetData.assetPrompt,
            type: assetData.assetType,
            creator: this.currentUser.username,
            isPublic: false, // Imported items are private by default
        };

        this.saveAssetLocally(newAsset);
        this.addNewItemCallback(newAsset, this.dragHandlers);
        alert(`'${newAsset.prompt}' has been added to your items!`);
        // btn.disabled = true;
        // btn.textContent = 'Added';
    }
}