window.AcesUpDebug = {
    logModalRender: function() {
        console.log("[AcesUpDebug] Modal rendered");
    },
    logButtonClick: function(btn) {
        console.log(`[AcesUpDebug] ${btn} button clicked (Blazor handler)`);
    },
    attachButtonDebugListeners: function() {
        setTimeout(() => {
            ["modalNoBtn", "modalYesBtn"].forEach(id => {
                var btn = document.getElementById(id);
                if (btn) {
                    ["mousedown", "mouseup", "click", "pointerdown", "pointerup"].forEach(evt => {
                        btn.addEventListener(evt, function(e) {
                            console.log(`[AcesUpDebug] ${id} ${evt} fired. type=${e.pointerType||e.type}`);
                        });
                    });
                }
            });
        }, 100);
    }
};