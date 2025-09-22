window.AcesUpKeyboard = {
    handler: null,
    dotNetRef: null,
    init: function(dotNetRef) {
        this.dotNetRef = dotNetRef;
        this.handler = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
            if (e.key === 'n' || e.key === 'N' || e.key === 'd' || e.key === 'D') {
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
