using System.Threading.Tasks;
using Microsoft.JSInterop;

namespace CardGame.Services
{
    /// <summary>
    /// Lightweight service to play named sounds via a small JS helper.
    /// Exposes PlayAsync(soundId) where soundId maps to an audio element id in JS.
    /// </summary>
    public class SoundService
    {
        private readonly IJSRuntime _js;

        public SoundService(IJSRuntime js)
        {
            _js = js;
        }

        public ValueTask PlayAsync(string id)
        {
            // JS handles missing ids gracefully
            return _js.InvokeVoidAsync("soundHelper.play", id);
        }
    }
}
