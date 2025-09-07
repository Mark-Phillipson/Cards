window.soundHelper = (function () {
    const sounds = {};

    function load(id, src) {
        try {
            const audio = new Audio(src);
            audio.preload = 'auto';
            sounds[id] = audio;
        } catch (e) {
            console.warn('Failed to load sound', id, src, e);
        }
    }

    // pre-register expected ids if files exist under /sounds/
    // callers can still call play with any id.
    load('round-win', '/sounds/round-win.mp3');
    load('game-win', '/sounds/game-win.mp3');
    load('game-lose', '/sounds/game-lose.mp3');

    return {
        play: function (id) {
            const a = sounds[id];
            if (a) {
                // clone to allow overlapping plays
                const clone = a.cloneNode(true);
                clone.play().catch(e => {
                    // play can fail if not user-initiated; swallow
                    // console.debug('sound play failed', id, e);
                });
            } else {
                // try dynamic fallback to /sounds/{id}.mp3
                const fallback = new Audio(`/sounds/${id}.mp3`);
                fallback.play().catch(() => { });
            }
        }
    };
})();
