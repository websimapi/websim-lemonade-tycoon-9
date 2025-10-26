import { elements } from './ui.js';

export async function drawCompositeImageToCanvas(canvas, dollImage, dollContainer) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Use a fixed high-res size for the offscreen canvas to ensure quality,
    // then scale it down for display.
    const internalCanvas = document.createElement('canvas');
    const internalCtx = internalCanvas.getContext('2d');

    const dollNaturalWidth = dollImage.naturalWidth || 500;
    const dollNaturalHeight = dollImage.naturalHeight || 1000;
    
    internalCanvas.width = dollNaturalWidth;
    internalCanvas.height = dollNaturalHeight;
    
    const dollRect = dollContainer.getBoundingClientRect();

    const dollImgToDraw = new Image();
    dollImgToDraw.crossOrigin = 'anonymous';
    dollImgToDraw.src = dollImage.src;

    await new Promise(resolve => {
        if (dollImgToDraw.complete && dollImgToDraw.naturalHeight !== 0) resolve();
        else dollImgToDraw.onload = resolve;
    });
    
    internalCtx.drawImage(dollImgToDraw, 0, 0, dollNaturalWidth, dollNaturalHeight);
    
    const wornItemWrappers = Array.from(dollContainer.querySelectorAll('.worn-item-wrapper'));
    for (const wrapper of wornItemWrappers) {
        const item = wrapper.querySelector('.worn-item');
        if (!item) continue;

        const itemImgToDraw = new Image();
        itemImgToDraw.crossOrigin = 'anonymous';
        itemImgToDraw.src = item.src;

        await new Promise(resolve => {
            if (itemImgToDraw.complete && itemImgToDraw.naturalHeight !== 0) resolve();
            else itemImgToDraw.onload = resolve;
        });
        
        // Calculate position and size relative to the natural doll dimensions
        const targetX = (parseFloat(wrapper.style.left) / dollRect.width) * dollNaturalWidth;
        const targetY = (parseFloat(wrapper.style.top) / dollRect.height) * dollNaturalHeight;
        const targetWidth = (wrapper.offsetWidth / dollRect.width) * dollNaturalWidth;
        const targetHeight = (wrapper.offsetHeight / dollRect.height) * dollNaturalHeight;

        internalCtx.drawImage(itemImgToDraw, targetX, targetY, targetWidth, targetHeight);
    }

    // Draw the high-res internal canvas to the visible preview canvas
    ctx.drawImage(internalCanvas, 0, 0, canvas.width, canvas.height);

    return internalCanvas; // Return internal canvas for dataURL generation
}

async function getCompositeImageAsDataURL(dollImage, dollContainer) {
    const internalCanvas = await drawCompositeImageToCanvas(elements.aiPreviewCanvas, dollImage, dollContainer);
    return internalCanvas.toDataURL('image/png');
}

function buildPrompt(dollImage, dollContainer) {
    const gender = dollImage.src.includes('female') ? 'female' : 'male';
    const wornItems = Array.from(dollContainer.querySelectorAll('.worn-item'));
    const clothingDescriptions = {};
    
    wornItems.forEach(item => {
        if (item.dataset.itemType) {
            clothingDescriptions[item.dataset.itemType] = item.alt;
        }
    });

    const categories = ['hair', 'hat', 'shirt', 'pants', 'shoes'];
    const clothingList = categories.map(category => {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        if (clothingDescriptions[category]) {
            return `${categoryName}: ${clothingDescriptions[category]}`;
        }
        
        switch (category) {
            case 'shirt':
                return `${categoryName}: a plain, form-fitting t-shirt the same color as their skin`;
            case 'pants':
                return `${categoryName}: plain shorts the same color as their skin`;
            case 'hair':
                return `${categoryName}: bald`;
            case 'shoes':
                return `${categoryName}: barefoot`;
            default:
                return `${categoryName}: none`;
        }
    }).join('. ');
    
    return `Generate a full-body character portrait based on the provided paper doll image. The character is a ${gender}. The final image should be in a friendly, cartoon art style suitable for a game. Keep the character in a similar T-pose. Character details: ${clothingList}.`;
}

export async function generateCharacter(dollImage, dollContainer) {
    const imageDataUrl = await getCompositeImageAsDataURL(dollImage, dollContainer);
    const promptText = buildPrompt(dollImage, dollContainer);
    
    const result = await websim.imageGen({
        prompt: promptText,
        image_inputs: [{ url: imageDataUrl }],
        aspect_ratio: "2:3",
    });
    
    return result.url;
}