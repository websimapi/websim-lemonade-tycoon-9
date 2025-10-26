import { drawCompositeImageToCanvas } from './character-generator.js';

let editorElements;

function updatePreview() {
    if (!editorElements) return;
    const { aiPreviewCanvas, dollImage, dollContainer } = editorElements;
    drawCompositeImageToCanvas(aiPreviewCanvas, dollImage, dollContainer);
}

function makeInteractive(element, dollContainer) {
    let activeTouches = new Map();
    let initialDist = 1;
    let initialWidth = element.offsetWidth;

    // For handle resizing
    let resizing = false;
    let currentHandle;
    let startX, startY, startWidth, startHeight, startLeft, startTop;

    const pointerDown = (e) => {
        e.stopPropagation(); // Prevent doll container from getting event
        
        if (e.target.classList.contains('resize-handle')) {
            resizing = true;
            currentHandle = e.target;
            const rect = element.getBoundingClientRect();
            const parentRect = dollContainer.getBoundingClientRect();

            startWidth = rect.width;
            startHeight = rect.height;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = element.offsetLeft;
            startTop = element.offsetTop;

            element.setPointerCapture(e.pointerId);
            return;
        }

        element.setPointerCapture(e.pointerId);
        activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (activeTouches.size === 2) {
            const touches = Array.from(activeTouches.values());
            initialDist = Math.hypot(touches[0].x - touches[1].x, touches[0].y - touches[1].y);
            initialWidth = element.offsetWidth;
        }
    };

    const pointerMove = (e) => {
        if (resizing) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;

            if (currentHandle.classList.contains('resize-handle-br')) {
                newWidth = startWidth + dx;
            } else if (currentHandle.classList.contains('resize-handle-bl')) {
                newWidth = startWidth - dx;
                newLeft = startLeft + dx;
            } else if (currentHandle.classList.contains('resize-handle-tr')) {
                newWidth = startWidth + dx;
                newHeight = startHeight - dy;
                newTop = startTop + dy;
            } else if (currentHandle.classList.contains('resize-handle-tl')) {
                newWidth = startWidth - dx;
                newLeft = startLeft + dx;
                newTop = startTop + dy;
            }
            
            const aspectRatio = startWidth / startHeight;
            if (newWidth / aspectRatio > 0) {
                 newHeight = newWidth / aspectRatio;
            }
            
            if (newWidth > 20 && newHeight > 20) { // Minimum size
                element.style.width = `${newWidth}px`;
                element.style.height = `${newHeight}px`;
                element.style.left = `${newLeft}px`;
                element.style.top = `${newTop}px`;
                updatePreview();
            }

            return;
        }

        if (!activeTouches.has(e.pointerId)) return;

        activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const touches = Array.from(activeTouches.values());
        const dollRect = dollContainer.getBoundingClientRect();

        if (touches.length === 1) { // Move
            element.style.left = `${e.clientX - dollRect.left - element.offsetWidth / 2}px`;
            element.style.top = `${e.clientY - dollRect.top - element.offsetHeight / 2}px`;
            updatePreview();
        } else if (touches.length === 2) { // Scale
            const currentDist = Math.hypot(touches[0].x - touches[1].x, touches[0].y - touches[1].y);
            const scale = currentDist / initialDist;
            const newWidth = initialWidth * scale;
            if (newWidth > 20) { // Minimum size
                element.style.width = `${newWidth}px`;
                element.style.height = 'auto'; // Maintain aspect ratio
                updatePreview();
            }
        }
    };

    const pointerUp = (e) => {
        if (resizing) {
            resizing = false;
        }
        activeTouches.delete(e.pointerId);
        if (activeTouches.size < 2) {
            initialDist = 1; // Reset for next interaction
        }
    };

    element.addEventListener('pointerdown', pointerDown);
    element.addEventListener('pointermove', pointerMove);
    element.addEventListener('pointerup', pointerUp);
    element.addEventListener('pointercancel', pointerUp);
    element.addEventListener('pointerleave', pointerUp);
}


function createWornItem(src, itemType, alt, x, y, dollContainer, style = {}) {
    const existingItemWrapper = dollContainer.querySelector(`.worn-item-wrapper[data-item-type="${itemType}"]`);
    if (existingItemWrapper) {
        existingItemWrapper.remove();
    }
    
    // De-select any other items
    dollContainer.querySelectorAll('.worn-item-wrapper').forEach(w => w.classList.remove('selected'));

    const wrapper = document.createElement('div');
    wrapper.classList.add('worn-item-wrapper', 'selected');
    wrapper.dataset.itemType = itemType;

    const wornItem = document.createElement('img');
    
    // Use a CORS proxy for all images to prevent canvas tainting
    const proxiedSrc = `https://images.weserv.nl/?url=${encodeURIComponent(src)}`;
    wornItem.crossOrigin = "anonymous";
    wornItem.src = proxiedSrc;
    
    wornItem.alt = alt;
    wornItem.classList.add('worn-item');
    wornItem.dataset.itemType = itemType; // Keep for generator compatibility
    wrapper.appendChild(wornItem);

    // Add resize handles
    const handles = ['tl', 'tr', 'bl', 'br'];
    handles.forEach(pos => {
        const handle = document.createElement('div');
        handle.classList.add('resize-handle', `resize-handle-${pos}`);
        wrapper.appendChild(handle);
    });

    // This was on wrapper.onload before, but it should be on the image itself.
    dollContainer.appendChild(wrapper);
    

    wornItem.onload = () => {
        updatePreview(); // Update preview once image is loaded
        if (style.left && style.top) {
            wrapper.style.left = style.left;
            wrapper.style.top = style.top;
            wrapper.style.width = style.width;
            wrapper.style.height = style.height;
        } else {
            const dollContainerWidth = dollContainer.offsetWidth;
            let itemWidth;

            // Set initial size based on item type and doll container width
            switch(itemType) {
                case 'hair':
                case 'hat':
                    itemWidth = dollContainerWidth * 0.4;
                    break;
                case 'shirt':
                    itemWidth = dollContainerWidth * 0.6;
                    break;
                case 'pants':
                    itemWidth = dollContainerWidth * 0.55;
                    break;
                case 'shoes':
                    itemWidth = dollContainerWidth * 0.5;
                    break;
                default:
                    itemWidth = dollContainerWidth * 0.5;
            }

            const aspectRatio = wornItem.naturalWidth / wornItem.naturalHeight;
            const itemHeight = aspectRatio > 0 ? itemWidth / aspectRatio : itemWidth;

            wrapper.style.width = `${itemWidth}px`;
            wrapper.style.height = `${itemHeight}px`;
            wrapper.style.left = `${x - itemWidth / 2}px`;
            wrapper.style.top = `${y - itemHeight / 2}px`;
        }

        makeInteractive(wrapper, dollContainer);
        updatePreview();
    };

     // Add a click listener to the doll container to handle selection
    dollContainer.addEventListener('click', (e) => {
        const clickedWrapper = e.target.closest('.worn-item-wrapper');
        dollContainer.querySelectorAll('.worn-item-wrapper').forEach(w => {
            w.classList.toggle('selected', w === clickedWrapper);
        });
    });
}

// Drag and drop handler functions to be exported
export const dragHandlers = {
    dragStart: null,
    touchStart: null,
};

export function initializeEditor(elements) {
    editorElements = elements;
    const { dollContainer, clothingItems, genderBtns, dollImage } = elements;

    // Gender Selection
    genderBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            genderBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const gender = btn.dataset.gender;
            dollImage.src = `${gender}_doll.png`;
            dollContainer.querySelectorAll('.worn-item-wrapper').forEach(item => item.remove());
            updatePreview();
        });
    });

    // --- Desktop Drag and Drop ---
    dragHandlers.dragStart = (e) => {
        e.dataTransfer.setData('text/plain', e.target.src);
        e.dataTransfer.setData('text/item-type', e.target.dataset.itemType);
        e.dataTransfer.setData('text/alt', e.target.alt);
    };

    clothingItems.forEach(item => {
        item.addEventListener('dragstart', dragHandlers.dragStart);
    });

    dollContainer.addEventListener('dragover', (e) => e.preventDefault());

    dollContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        const src = e.dataTransfer.getData('text/plain');
        const itemType = e.dataTransfer.getData('text/item-type');
        const alt = e.dataTransfer.getData('text/alt');

        const dollRect = dollContainer.getBoundingClientRect();
        const x = e.clientX - dollRect.left;
        const y = e.clientY - dollRect.top;

        createWornItem(src, itemType, alt, x, y, dollContainer);
    });

    // --- Mobile Drag and Drop ---
    let draggedItem = null;
    let draggedItemClone = null;

    dragHandlers.touchStart = (e) => {
        e.preventDefault();
        draggedItem = e.target;
        draggedItemClone = draggedItem.cloneNode(true);
        draggedItemClone.classList.add('dragging-clone');
        document.body.appendChild(draggedItemClone);
        moveClone(e.touches[0].clientX, e.touches[0].clientY);
    };

    clothingItems.forEach(item => {
        item.addEventListener('touchstart', dragHandlers.touchStart, { passive: false });
    });

    document.addEventListener('touchmove', (e) => {
        if (!draggedItemClone) return;
        e.preventDefault();
        moveClone(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        if (!draggedItem || !draggedItemClone) {
            if (draggedItemClone) draggedItemClone.remove();
            draggedItem = null;
            draggedItemClone = null;
            return;
        }

        const touch = e.changedTouches[0];
        draggedItemClone.style.display = 'none';
        const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        draggedItemClone.style.display = '';

        if (dollContainer.contains(dropTarget)) {
            const { src, dataset: { itemType }, alt } = draggedItem;
            const dollRect = dollContainer.getBoundingClientRect();
            const x = touch.clientX - dollRect.left;
            const y = touch.clientY - dollRect.top;
            createWornItem(src, itemType, alt, x, y, dollContainer);
        }

        draggedItemClone.remove();
        draggedItem = null;
        draggedItemClone = null;
    });

    function moveClone(x, y) {
        if (draggedItemClone) {
            draggedItemClone.style.left = `${x - draggedItemClone.width / 2}px`;
            draggedItemClone.style.top = `${y - draggedItemClone.height / 2}px`;
        }
    }
}


export function applyPreset(preset, elements) {
    const { dollImage, dollContainer, genderBtns } = elements;

    // Set gender
    genderBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.gender === preset.gender);
    });
    dollImage.src = `${preset.gender}_doll.png`;

    // Clear existing items
    dollContainer.querySelectorAll('.worn-item').forEach(item => item.remove());

    // Add items from preset
    preset.items.forEach(item => {
        // We pass the style object to createWornItem, but it now expects the wrapper's style
        const wrapperStyle = {
            left: item.style.left,
            top: item.style.top,
            width: item.style.width,
            height: item.style.height,
        };
        createWornItem(item.src, item.itemType, item.alt, 0, 0, dollContainer, wrapperStyle);
    });
    updatePreview();
}