window.AcesUpFocus = {
    focusTrapHandler: null,

    setFocus: function (element) {
        if (element && element instanceof HTMLElement) {
            element.focus();
        } else if (element && element.focus) {
            element.focus();
        }
    },

    // Focus trapping for modals
    trapFocusInModal: function (modalSelector) {
        const modal = document.querySelector(modalSelector);
        if (!modal) return;

        // Remove any existing focus trap
        this.removeFocusTrap();

        // Get all focusable elements within the modal
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        // Focus the first element
        firstFocusable.focus();

        // Trap focus within modal
        this.focusTrapHandler = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    // Shift+Tab: if on first element, go to last
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    // Tab: if on last element, go to first
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            } else if (e.key === 'Escape') {
                // Allow Escape to close modal - click the No button
                const noButton = modal.querySelector('button');
                if (noButton) {
                    noButton.click();
                }
            }
        };

        document.addEventListener('keydown', this.focusTrapHandler);
    },

    // Remove focus trap
    removeFocusTrap: function () {
        if (this.focusTrapHandler) {
            document.removeEventListener('keydown', this.focusTrapHandler);
            this.focusTrapHandler = null;
        }
    }
};


