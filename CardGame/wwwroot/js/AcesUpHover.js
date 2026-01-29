// AcesUpHover.js - Hover-to-click functionality for Aces Up card game
// Implements 500ms countdown timer with visual progress updates

let dotNetRef = null;
let isEnabled = false;
let hoverTimers = {}; // Track active timers by pile index
let progressIntervals = {}; // Track progress update intervals by pile index
let hoverTotalDuration = 500; // milliseconds, updated from Blazor (default 500ms)
const updateInterval = 50; // ms between progress updates

/**
 * Initialize hover detection for Aces Up cards
 * @param {any} dotNetReference - DotNet object reference for C# callbacks
 * @param {boolean} enabled - Whether auto-play is enabled
 */
window.initAcesUpHover = function (dotNetReference, enabled, delayMs) {
    console.log('AcesUpHover: Initializing with enabled =', enabled, 'delayMs =', delayMs);
    dotNetRef = dotNetReference;
    isEnabled = enabled;
    hoverTotalDuration = (typeof delayMs === 'number' && !isNaN(delayMs)) ? delayMs : hoverTotalDuration;
    
    // Clean up existing listeners and timers
    cleanup();
    
    // Always attach listeners so the autoplay-toggle control can be hovered even when auto-play is disabled
    console.log('AcesUpHover: Attaching listeners (note: some actions respect global enabled state)');
    attachListeners();
};

/**
 * Update enabled state and attach/detach listeners accordingly
 * @param {boolean} enabled - Whether auto-play is enabled
 */
window.updateAcesUpHoverEnabled = function (enabled, delayMs) {
    console.log('AcesUpHover: updateAcesUpHoverEnabled called with enabled =', enabled, 'delayMs =', delayMs);
    isEnabled = enabled;
    if (typeof delayMs === 'number' && !isNaN(delayMs)) hoverTotalDuration = delayMs;
    
    // Cancel all active timers when toggling
    cleanup();
    
    // Re-attach listeners (autoplay-toggle will work regardless of enabled state)
    console.log('AcesUpHover: Re-attaching listeners after enabled change');
    attachListeners();
};

// Allow updating delay independently
window.updateAcesUpHoverDelay = function (delayMs) {
    console.log('AcesUpHover: updateAcesUpHoverDelay called with delayMs =', delayMs);
    if (typeof delayMs === 'number' && !isNaN(delayMs)) {
        hoverTotalDuration = delayMs;
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
const BUTTON_ID_MAP = {
    'new-game': -2,
    'confirm-new-yes': -3,
    'confirm-new-no': -4,
    'undo': -5,
    'home': -6,
    'rules': -7,
    'autoplay-toggle': -8
};

function attachListeners() {
    // Remove existing listeners first
    const items = document.querySelectorAll('[data-hoverable="true"]');
    
    console.log(`AcesUpHover: Found ${items.length} hoverable elements`);
    
    items.forEach((el, index) => {
        const pileIndexAttr = el.getAttribute('data-pile-index');
        const buttonId = el.getAttribute('data-button-id');
        console.log(`AcesUpHover: Element ${index} pile-index = ${pileIndexAttr}, button-id = ${buttonId}`);
        
        // Skip disabled elements
        if (el.disabled) {
            console.log('AcesUpHover: Skipping disabled element', el);
            // Make sure progress is cleared for disabled elements
            if (pileIndexAttr === 'deal') {
                dotNetRef && dotNetRef.invokeMethodAsync('UpdateHoverProgress', -1, 0);
            } else if (buttonId && BUTTON_ID_MAP[buttonId] !== undefined) {
                dotNetRef && dotNetRef.invokeMethodAsync('UpdateHoverProgress', BUTTON_ID_MAP[buttonId], 0);
            }
            return;
        }

        // Remove old listeners if they exist
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
        
        // Add new listeners
        el.addEventListener('mouseenter', handleMouseEnter);
        el.addEventListener('mouseleave', handleMouseLeave);
    });
    
    console.log(`AcesUpHover: Attached listeners to ${items.length} elements`);
}

/**
 * Handle mouse entering a card
 * @param {MouseEvent} event - Mouse event
 */
function handleMouseEnter(event) {
    const el = event.currentTarget;
    const buttonId = el.getAttribute('data-button-id');

    // Allow the autoplay-toggle control to be hovered even when global auto-play is disabled
    if (!dotNetRef) {
        console.log('AcesUpHover: Aborting - no dotNetRef');
        return;
    }
    if (!isEnabled && buttonId !== 'autoplay-toggle') {
        console.log('AcesUpHover: Aborting - global auto-play disabled and element is not autoplay-toggle');
        return;
    }

    const pileIndexAttr = el.getAttribute('data-pile-index');

    let mappedIndex = null;
    let isButton = false;

    if (pileIndexAttr !== null) {
        mappedIndex = (pileIndexAttr === 'deal') ? -1 : parseInt(pileIndexAttr);
    }
    else if (buttonId !== null) {
        isButton = true;
        if (BUTTON_ID_MAP[buttonId] === undefined) {
            console.error('AcesUpHover: Unknown button id:', buttonId);
            return;
        }
        mappedIndex = BUTTON_ID_MAP[buttonId];
    }

    console.log('AcesUpHover: Starting timer for', isButton ? `button ${buttonId}` : `pile ${mappedIndex}`);

    if (mappedIndex === null || isNaN(mappedIndex)) {
        console.error('AcesUpHover: Invalid mapped index:', mappedIndex);
        return;
    }

    // Clear any existing timer for this mapped index
    clearTimerForPile(mappedIndex);
    
    // Start progress updates
    let progress = 0;
    const progressStep = 100 / Math.max(1, (hoverTotalDuration / updateInterval));
    
    progressIntervals[mappedIndex] = setInterval(() => {
        progress += progressStep;
        
        console.log(`AcesUpHover: Index ${mappedIndex} progress = ${Math.round(progress)}%`);
        
        if (progress >= 100) {
            progress = 100;
            console.log(`AcesUpHover: Index ${mappedIndex} reached 100%, triggering action`);
            clearTimerForPile(mappedIndex);
            
            // Trigger click/action
            if (dotNetRef) {
                if (isButton) {
                    console.log('AcesUpHover: Invoking OnButtonHoverClick for', buttonId);
                    dotNetRef.invokeMethodAsync('OnButtonHoverClick', buttonId);
                } else {
                    console.log('AcesUpHover: Invoking OnCardHoverClick for pile', mappedIndex);
                    dotNetRef.invokeMethodAsync('OnCardHoverClick', mappedIndex);
                }
            } else {
                console.log('AcesUpHover: Cannot invoke - no dotNetRef');
            }
        } else {
            // Update progress visual
            if (dotNetRef) {
                dotNetRef.invokeMethodAsync('UpdateHoverProgress', mappedIndex, Math.round(progress));
            }
        }
    }, updateInterval);
    
    // Store in hoverTimers for cleanup
    hoverTimers[mappedIndex] = progressIntervals[mappedIndex];
}

/**
 * Handle mouse leaving a card
 * @param {MouseEvent} event - Mouse event
 */
function handleMouseLeave(event) {
    const el = event.currentTarget;
    const pileIndexAttr = el.getAttribute('data-pile-index');
    const buttonId = el.getAttribute('data-button-id');

    let mappedIndex = null;
    if (pileIndexAttr !== null) mappedIndex = (pileIndexAttr === 'deal') ? -1 : parseInt(pileIndexAttr);
    else if (buttonId !== null && BUTTON_ID_MAP[buttonId] !== undefined) mappedIndex = BUTTON_ID_MAP[buttonId];

    console.log('AcesUpHover: mouseleave event for index', mappedIndex, '- clearing timer');

    if (mappedIndex === null || isNaN(mappedIndex)) return;

    // Clear timer and reset progress
    clearTimerForPile(mappedIndex);

    if (dotNetRef) {
        dotNetRef.invokeMethodAsync('UpdateHoverProgress', mappedIndex, 0);
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
    
    // Reset progress for all piles and button indices
    if (dotNetRef) {
        for (let i = 0; i < 4; i++) {
            dotNetRef.invokeMethodAsync('UpdateHoverProgress', i, 0);
        }
        // Reset deal and button indexes
        [-1, -2, -3, -4, -5, -6, -7, -8].forEach(idx => dotNetRef.invokeMethodAsync('UpdateHoverProgress', idx, 0));
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
