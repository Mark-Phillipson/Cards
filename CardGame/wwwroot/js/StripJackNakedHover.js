// StripJackNakedHover.js - Quick Draw hover-to-click functionality for Strip Jack Naked
// Implements fast 50ms countdown (configurable) for the Play Card button

// Use namespace to avoid conflicts with AcesUpHover.js
window.SjnHover = (function() {
    let dotNetRef = null;
    let isEnabled = true; // Enabled by default for quick gameplay
    let hoverTimers = {}; // Track active timers by button index
    let progressIntervals = {}; // Track progress update intervals
    let hoverTotalDuration = 50; // milliseconds - fast 50ms default for quick draw
    const updateInterval = 10; // ms between progress updates (fast for 50ms total)

    // Button ID to index mapping
    const BUTTON_ID_MAP = {
        'play-card': -1,
        'start-game': -2
        // Note: 'home' and 'rules' intentionally omitted to disable hover-to-click for navigation
    };

    /**
     * Attach mouse event listeners to hoverable elements
     */
    function attachListeners() {
        const items = document.querySelectorAll('[data-sjn-hoverable="true"]');
        
        console.log(`StripJackNakedHover: Found ${items.length} hoverable elements`);
        
        items.forEach((el) => {
            const buttonId = el.getAttribute('data-sjn-button-id');
            
            // Skip disabled elements
            if (el.disabled) {
                console.log('StripJackNakedHover: Skipping disabled element', buttonId);
                if (buttonId && BUTTON_ID_MAP[buttonId] !== undefined) {
                    dotNetRef && dotNetRef.invokeMethodAsync('UpdateSjnHoverProgress', BUTTON_ID_MAP[buttonId], 0);
                }
                return;
            }

            // Skip navigation buttons
            if (buttonId === 'home' || buttonId === 'rules') {
                return;
            }

            // Remove old listeners if they exist
            el.removeEventListener('mouseenter', handleMouseEnter);
            el.removeEventListener('mouseleave', handleMouseLeave);
            
            // Add new listeners
            el.addEventListener('mouseenter', handleMouseEnter);
            el.addEventListener('mouseleave', handleMouseLeave);
        });
    }

    /**
     * Handle mouse entering a hoverable element
     */
    function handleMouseEnter(event) {
        if (!dotNetRef || !isEnabled) return;

        const el = event.currentTarget;
        const buttonId = el.getAttribute('data-sjn-button-id');

        // Ignore navigation buttons
        if (buttonId === 'home' || buttonId === 'rules') return;

        // Skip if disabled
        if (el.disabled) return;

        const mappedIndex = BUTTON_ID_MAP[buttonId];
        if (mappedIndex === undefined) {
            console.error('StripJackNakedHover: Unknown button id:', buttonId);
            return;
        }

        console.log('StripJackNakedHover: Starting timer for button', buttonId, 'index', mappedIndex);

        // Clear any existing timer
        clearTimerForIndex(mappedIndex);
        
        // Start progress updates
        let progress = 0;
        const progressStep = 100 / Math.max(1, (hoverTotalDuration / updateInterval));
        
        progressIntervals[mappedIndex] = setInterval(() => {
            progress += progressStep;
            
            if (progress >= 100) {
                progress = 100;
                console.log('StripJackNakedHover: Button', buttonId, 'reached 100%, triggering action');
                clearTimerForIndex(mappedIndex);
                
                // Trigger the button action
                if (dotNetRef) {
                    dotNetRef.invokeMethodAsync('OnSjnButtonHoverClick', buttonId);
                }
            } else {
                // Update progress visual (for slower delays where progress is visible)
                if (dotNetRef) {
                    dotNetRef.invokeMethodAsync('UpdateSjnHoverProgress', mappedIndex, Math.round(progress));
                }
            }
        }, updateInterval);
        
        hoverTimers[mappedIndex] = progressIntervals[mappedIndex];
    }

    /**
     * Handle mouse leaving a hoverable element
     */
    function handleMouseLeave(event) {
        const el = event.currentTarget;
        const buttonId = el.getAttribute('data-sjn-button-id');

        const mappedIndex = BUTTON_ID_MAP[buttonId];
        if (mappedIndex === undefined) return;

        console.log('StripJackNakedHover: mouseleave for button', buttonId, '- clearing timer');

        clearTimerForIndex(mappedIndex);

        if (dotNetRef) {
            dotNetRef.invokeMethodAsync('UpdateSjnHoverProgress', mappedIndex, 0);
        }
    }

    /**
     * Clear timer for a specific index
     */
    function clearTimerForIndex(index) {
        if (hoverTimers[index]) {
            clearInterval(hoverTimers[index]);
            delete hoverTimers[index];
        }
        
        if (progressIntervals[index]) {
            clearInterval(progressIntervals[index]);
            delete progressIntervals[index];
        }
    }

    /**
     * Clean up all timers and listeners
     */
    function cleanup() {
        Object.keys(hoverTimers).forEach(idx => {
            clearTimerForIndex(parseInt(idx));
        });
        
        // Reset progress for all button indices
        if (dotNetRef) {
            [-1, -2].forEach(idx => dotNetRef.invokeMethodAsync('UpdateSjnHoverProgress', idx, 0));
        }
        
        // Remove event listeners
        const items = document.querySelectorAll('[data-sjn-hoverable="true"]');
        items.forEach(item => {
            item.removeEventListener('mouseenter', handleMouseEnter);
            item.removeEventListener('mouseleave', handleMouseLeave);
        });
    }

    // Clean up on page unload
    window.addEventListener('beforeunload', cleanup);

    // Return public API
    return {
        init: function(dotNetReference, enabled, delayMs) {
            console.log('StripJackNakedHover: Initializing with enabled =', enabled, 'delayMs =', delayMs);
            dotNetRef = dotNetReference;
            isEnabled = enabled;
            hoverTotalDuration = (typeof delayMs === 'number' && !isNaN(delayMs)) ? delayMs : hoverTotalDuration;
            
            cleanup();
            attachListeners();
        },
        updateEnabled: function(enabled, delayMs) {
            console.log('StripJackNakedHover: updateEnabled called with enabled =', enabled);
            isEnabled = enabled;
            if (typeof delayMs === 'number' && !isNaN(delayMs)) hoverTotalDuration = delayMs;
            
            cleanup();
            attachListeners();
        },
        updateDelay: function(delayMs) {
            console.log('StripJackNakedHover: updateDelay called with delayMs =', delayMs);
            if (typeof delayMs === 'number' && !isNaN(delayMs)) {
                hoverTotalDuration = delayMs;
            }
        },
        refreshListeners: function() {
            if (isEnabled) {
                attachListeners();
            }
        }
    };
})();

// Global function wrappers for Blazor JS interop
window.initStripJackNakedHover = function(dotNetReference, enabled, delayMs) {
    window.SjnHover.init(dotNetReference, enabled, delayMs);
};

window.updateStripJackNakedHoverEnabled = function(enabled, delayMs) {
    window.SjnHover.updateEnabled(enabled, delayMs);
};

window.updateStripJackNakedHoverDelay = function(delayMs) {
    window.SjnHover.updateDelay(delayMs);
};

window.refreshStripJackNakedHoverListeners = function() {
    window.SjnHover.refreshListeners();
};
