window.AcesUpFocus = {
    setFocus: function (element) {
        if (element && element instanceof HTMLElement) {
            element.focus();
        } else if (element && element.focus) {
            element.focus();
        }
    }
};
