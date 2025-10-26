let currentCategory = 'shirt';
let currentCategoryItems = [];
let currentItemIndex = 0;
let uiElements = null;

function updateInventoryDisplay() {
    // Re-query all items in case new ones were added
    const allClothingItems = Array.from(uiElements.clothingPalette.querySelectorAll('.clothing-item'));
    allClothingItems.forEach(item => item.classList.remove('active'));

    currentCategoryItems = allClothingItems.filter(item => item.dataset.itemType === currentCategory);

    if (currentCategoryItems.length > 0) {
        currentItemIndex = Math.max(0, Math.min(currentItemIndex, currentCategoryItems.length - 1));
        const currentItem = currentCategoryItems[currentItemIndex];
        if (currentItem) {
            currentItem.classList.add('active');
        }
    }

    uiElements.prevItemBtn.disabled = currentItemIndex === 0 || currentCategoryItems.length <= 1;
    uiElements.nextItemBtn.disabled = currentItemIndex >= currentCategoryItems.length - 1;
}

function handleSwipe(touchStartX, touchEndX) {
    if (touchEndX < touchStartX - 50) { // Swiped left
        uiElements.nextItemBtn.click();
    }
    if (touchEndX > touchStartX + 50) { // Swiped right
        uiElements.prevItemBtn.click();
    }
}

export function initializeInventory(elements) {
    uiElements = elements;
    let touchStartX = 0;
    let touchEndX = 0;

    elements.categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            currentItemIndex = 0;
            updateInventoryDisplay();
        });
    });

    elements.prevItemBtn.addEventListener('click', () => {
        if (currentItemIndex > 0) {
            currentItemIndex--;
            updateInventoryDisplay();
        }
    });

    elements.nextItemBtn.addEventListener('click', () => {
        if (currentItemIndex < currentCategoryItems.length - 1) {
            currentItemIndex++;
            updateInventoryDisplay();
        }
    });

    elements.clothingPalette.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    elements.clothingPalette.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe(touchStartX, touchEndX);
    }, { passive: true });

    updateInventoryDisplay(); // Initial call
}

export function addNewClothingItem(itemData, dragHandlers) {
    const newItem = document.createElement('img');
    newItem.src = itemData.url;
    newItem.alt = itemData.prompt;
    newItem.dataset.itemType = itemData.type;
    newItem.classList.add('clothing-item');
    newItem.draggable = true;

    // Attach the same drag-and-drop listeners as the initial items
    newItem.addEventListener('dragstart', dragHandlers.dragStart);
    newItem.addEventListener('touchstart', dragHandlers.touchStart, { passive: false });

    uiElements.clothingPalette.appendChild(newItem);

    // Switch to the new item's category and show it
    const categoryBtn = document.querySelector(`.category-btn[data-category="${itemData.type}"]`);
    if (categoryBtn) {
        categoryBtn.click();
        currentItemIndex = currentCategoryItems.length - 1; // Go to the last item (the new one)
        updateInventoryDisplay();
    }
}