window.AcesUpKeyboard = {
    handler: null,
    dotNetRef: null,
    init: function(dotNetRef) {
        this.dotNetRef = dotNetRef;
        this.handler = (e) => {
            // Don't intercept keyboard events from input fields, textareas, editable content, or buttons
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON' || e.target.isContentEditable) return;
            if (e.key === 'n' || e.key === 'N' || e.key === 'd' || e.key === 'D' || e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') {
                e.preventDefault();
                this.dotNetRef.invokeMethodAsync('OnKeyShortcut', e.key);
            }
        };
        window.addEventListener('keydown', this.handler, true);
    },
    dispose: function() {
        if (this.handler) {
            window.removeEventListener('keydown', this.handler, true);
            this.handler = null;
        }
        this.dotNetRef = null;
    }
};
