// AcesUpHover.js - Hover-to-click functionality for Aces Up card game
// Implements 500ms countdown timer with visual progress updates

let dotNetRef = null;
let isEnabled = false;
let hoverTimers = {}; // Track active timers by pile index
let progressIntervals = {}; // Track progress update intervals by pile index

/**
 * Initialize hover detection for Aces Up cards
 * @param {any} dotNetReference - DotNet object reference for C# callbacks
 * @param {boolean} enabled - Whether auto-play is enabled
 */
window.initAcesUpHover = function (dotNetReference, enabled) {
    console.log('AcesUpHover: Initializing with enabled =', enabled);
    dotNetRef = dotNetReference;
    isEnabled = enabled;
    
    // Clean up existing listeners and timers
    cleanup();
    
    if (enabled) {
        console.log('AcesUpHover: Attaching listeners because enabled = true');
        attachListeners();
    } else {
        console.log('AcesUpHover: Not attaching listeners because enabled = false');
    }
};

/**
 * Update enabled state and attach/detach listeners accordingly
 * @param {boolean} enabled - Whether auto-play is enabled
 */
window.updateAcesUpHoverEnabled = function (enabled) {
    console.log('AcesUpHover: updateAcesUpHoverEnabled called with enabled =', enabled);
    isEnabled = enabled;
    
    // Cancel all active timers when disabled
    cleanup();
    
    if (enabled) {
        console.log('AcesUpHover: Attaching listeners');
        attachListeners();
    } else {
        console.log('AcesUpHover: Detached listeners');
    }
};

/**
 * Refresh listeners after DOM updates
 * This should be called from Blazor after rendering new cards
 */
window.refreshAcesUpHoverListeners = function () {
    console.log('AcesUpHover: refreshAcesUpHoverListeners called, isEnabled =', isEnabled);
    if (isEnabled) {
        attachListeners();
    }
};

/**
 * Attach mouse event listeners to hoverable cards
 */
function attachListeners() {
    // Remove existing listeners first
    const cards = document.querySelectorAll('[data-hoverable="true"]');
    
    console.log(`AcesUpHover: Found ${cards.length} cards with data-hoverable="true"`);
    
    cards.forEach((card, index) => {
        const pileIndex = card.getAttribute('data-pile-index');
        console.log(`AcesUpHover: Card ${index} has pile-index = ${pileIndex}`);
        
        // Remove old listeners if they exist
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
        
        // Add new listeners
        card.addEventListener('mouseenter', handleMouseEnter);
        card.addEventListener('mouseleave', handleMouseLeave);
    });
    
    console.log(`AcesUpHover: Attached listeners to ${cards.length} cards`);
}

/**
 * Handle mouse entering a card
 * @param {MouseEvent} event - Mouse event
 */
function handleMouseEnter(event) {
    console.log('AcesUpHover: mouseenter event triggered, isEnabled =', isEnabled, 'dotNetRef =', !!dotNetRef);
    
    if (!isEnabled || !dotNetRef) {
        console.log('AcesUpHover: Aborting - not enabled or no dotNetRef');
        return;
    }
    
    const card = event.currentTarget;
    const pileIndexAttr = card.getAttribute('data-pile-index');
    
    // Handle "deal" as pile index -1
    const pileIndex = pileIndexAttr === 'deal' ? -1 : parseInt(pileIndexAttr);
    
    console.log('AcesUpHover: Starting timer for pile', pileIndex);
    
    if (isNaN(pileIndex)) {
        console.error('AcesUpHover: Invalid pile index:', pileIndexAttr);
        return;
    }
    
    // Clear any existing timer for this pile
    clearTimerForPile(pileIndex);
    
    // Start progress updates (every 50ms for 2000ms total = 40 updates)
    let progress = 0;
    const updateInterval = 50; // ms
    const totalDuration = 2000; // ms (2 seconds)
    const progressStep = 100 / (totalDuration / updateInterval);
    
    progressIntervals[pileIndex] = setInterval(() => {
        progress += progressStep;
        
        console.log(`AcesUpHover: Pile ${pileIndex} progress = ${Math.round(progress)}%`);
        
        if (progress >= 100) {
            progress = 100;
            console.log(`AcesUpHover: Pile ${pileIndex} reached 100%, triggering click`);
            clearTimerForPile(pileIndex);
            
            // Trigger click action
            if (dotNetRef && isEnabled) {
                console.log('AcesUpHover: Invoking OnCardHoverClick for pile', pileIndex);
                dotNetRef.invokeMethodAsync('OnCardHoverClick', pileIndex);
            } else {
                console.log('AcesUpHover: Cannot invoke - dotNetRef or isEnabled is false');
            }
        } else {
            // Update progress visual
            if (dotNetRef && isEnabled) {
                dotNetRef.invokeMethodAsync('UpdateHoverProgress', pileIndex, Math.round(progress));
            }
        }
    }, updateInterval);
    
    // Store in hoverTimers for cleanup
    hoverTimers[pileIndex] = progressIntervals[pileIndex];
}

/**
 * Handle mouse leaving a card
 * @param {MouseEvent} event - Mouse event
 */
function handleMouseLeave(event) {
    const card = event.currentTarget;
    const pileIndexAttr = card.getAttribute('data-pile-index');
    const pileIndex = pileIndexAttr === 'deal' ? -1 : parseInt(pileIndexAttr);
    
    console.log('AcesUpHover: mouseleave event for pile', pileIndex, '- clearing timer');
    
    if (isNaN(pileIndex)) return;
    
    // Clear timer and reset progress
    clearTimerForPile(pileIndex);
    
    if (dotNetRef) {
        dotNetRef.invokeMethodAsync('UpdateHoverProgress', pileIndex, 0);
    }
}

/**
 * Clear timer and progress interval for a specific pile
 * @param {number} pileIndex - Pile index to clear
 */
function clearTimerForPile(pileIndex) {
    if (hoverTimers[pileIndex]) {
        clearInterval(hoverTimers[pileIndex]);
        delete hoverTimers[pileIndex];
    }
    
    if (progressIntervals[pileIndex]) {
        clearInterval(progressIntervals[pileIndex]);
        delete progressIntervals[pileIndex];
    }
}

/**
 * Clean up all timers and listeners
 */
function cleanup() {
    // Clear all active timers
    Object.keys(hoverTimers).forEach(pileIndex => {
        clearTimerForPile(parseInt(pileIndex));
    });
    
    // Reset progress for all piles
    if (dotNetRef) {
        for (let i = 0; i < 4; i++) {
            dotNetRef.invokeMethodAsync('UpdateHoverProgress', i, 0);
        }
    }
    
    // Remove event listeners from all cards
    const cards = document.querySelectorAll('[data-hoverable="true"]');
    cards.forEach(card => {
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
    });
}

// Clean up on page unload
window.addEventListener('beforeunload', cleanup);
