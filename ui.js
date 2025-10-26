export const elements = {
    mainContainer: document.querySelector('.main-container'),
    characterCreationScreen: document.getElementById('character-creation-screen'),
    loadingOverlay: document.getElementById('loading-overlay'),
    generationResultScreen: document.getElementById('generation-result-screen'),
    newGameBtn: document.getElementById('new-game-btn'),
    continueGameBtn: document.getElementById('continue-game-btn'),
    backToMenuBtn: document.getElementById('back-to-menu-btn'),
    startGameBtn: document.getElementById('start-game-btn'),
    presetsBtn: document.getElementById('presets-btn'),
    presetsScreen: document.getElementById('presets-screen'),
    presetsGallery: document.getElementById('presets-gallery'),
    backToEditorFromPresetsBtn: document.getElementById('back-to-editor-from-presets-btn'),
    genderBtns: document.querySelectorAll('.gender-btn'),
    dollImage: document.getElementById('doll-image'),
    dollContainer: document.getElementById('doll-container'),
    clothingItems: document.querySelectorAll('.clothing-item'),
    backToEditorBtn: document.getElementById('back-to-editor-btn'),
    confirmCharacterBtn: document.getElementById('confirm-character-btn'),
    generatedCharacterImage: document.getElementById('generated-character-image'),
    categoryBtns: document.querySelectorAll('.category-btn'),
    prevItemBtn: document.getElementById('prev-item-btn'),
    nextItemBtn: document.getElementById('next-item-btn'),
    clothingPalette: document.getElementById('clothing-palette'),
    // Generator Modal Elements
    assetGeneratorModal: document.getElementById('asset-generator-modal'),
    openGeneratorBtn: document.getElementById('open-generator-btn'),
    closeGeneratorBtn: document.getElementById('close-generator-btn'),
    generateAssetBtn: document.getElementById('generate-asset-btn'),
    itemTypeSelect: document.getElementById('item-type-select'),
    itemPromptInput: document.getElementById('item-prompt-input'),
    generatorLoadingOverlay: document.getElementById('generator-loading-overlay'),
    // Asset Browser Modal Elements
    assetBrowserModal: document.getElementById('asset-browser-modal'),
    browseAssetsBtn: document.getElementById('browse-assets-btn'),
    closeBrowserBtn: document.getElementById('close-browser-btn'),
    assetGallery: document.getElementById('asset-gallery'),
    // AI Preview
    aiPreviewCanvas: document.getElementById('ai-preview-canvas'),
};

export function showScreen(screen) {
    screen.classList.remove('hidden');
}

export function hideScreen(screen) {
    screen.classList.add('hidden');
}

export function setupScreenTransitions() {
    elements.newGameBtn.addEventListener('click', () => {
        hideScreen(elements.mainContainer);
        showScreen(elements.characterCreationScreen);
    });

    elements.backToMenuBtn.addEventListener('click', () => {
        hideScreen(elements.characterCreationScreen);
        hideScreen(elements.generationResultScreen);
        hideScreen(elements.presetsScreen);
        showScreen(elements.mainContainer);
    });

    elements.backToEditorBtn.addEventListener('click', () => {
        hideScreen(elements.generationResultScreen);
        showScreen(elements.characterCreationScreen);
    });

    elements.presetsBtn.addEventListener('click', () => {
        hideScreen(elements.characterCreationScreen);
        showScreen(elements.presetsScreen);
    });

    elements.backToEditorFromPresetsBtn.addEventListener('click', () => {
        hideScreen(elements.presetsScreen);
        showScreen(elements.characterCreationScreen);
    });
}