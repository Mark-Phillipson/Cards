window.AcesUpBackground = {
    backgrounds: [
        // English countryside summer scenes
        'https://images.unsplash.com/photo-1500835556837-99ac94a94552?q=80&w=2000', // Rolling green hills
        'https://images.unsplash.com/photo-1560008581-09826d1de69e?q=80&w=2000', // Countryside meadow
        'https://images.unsplash.com/photo-1599906504409-e07ce791a1e4?q=80&w=2000', // English rural landscape
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=2000', // Pastoral hills
        'https://images.unsplash.com/photo-1464093515883-ec948246accb?q=80&w=2000', // Green countryside
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000'  // Summer landscape
    ],

    setRandomBackground: function() {
        const wrapper = document.querySelector('.acesup-background-wrapper');
        if (wrapper) {
            const randomIndex = Math.floor(Math.random() * this.backgrounds.length);
            const selectedImage = this.backgrounds[randomIndex];
            wrapper.style.backgroundImage = `url('${selectedImage}')`;
            console.log(`Selected background ${randomIndex + 1} of ${this.backgrounds.length}`);
        }
    }
};
