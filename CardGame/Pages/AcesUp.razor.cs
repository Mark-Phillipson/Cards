using CardGame.Models;
using CardGame.Services;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using System.Collections.Generic;
using System.Linq;

namespace CardGame.Pages;

public partial class AcesUp : ComponentBase, IDisposable
{
    [Inject] public DeckService DeckService { get; set; } = null!;
    [Inject] public IJSRuntime JSRuntime { get; set; } = null!;

    public List<Stack<Card>> Tableau { get; set; } = new() { new(), new(), new(), new() };
    public Queue<Card> Stock { get; set; } = new();
    public int Discarded { get; set; } = 0;
    public bool GameOver { get; set; } = false;
    public bool Won { get; set; } = false;
    public string Message { get; set; } = "";
    public string ToastMessage { get; set; } = "";
    public bool ShowToast { get; set; } = false;
    private System.Timers.Timer? toastTimer;

    // Undo state tracking
    private enum MoveType { Discard, MoveToEmpty }
    private class UndoState
    {
        public MoveType Type { get; set; }
        public int FromPile { get; set; }
        public int ToPile { get; set; }
        public Card Card { get; set; } = null!;
    }
    private UndoState? lastMove = null;

    protected override void OnInitialized()
    {
        NewGame();
    }

    public void NewGame()
    {
        DeckService.ResetDeck();
        Tableau = new List<Stack<Card>> { new(), new(), new(), new() };
        var allCards = DeckService.DealCards(52);
        Stock = new Queue<Card>(allCards.
        Skip(4));
        var initial = allCards.Take(4).ToList();
        for (int i = 0; i < 4; i++)
        {
            initial[i].IsFaceUp = true;
            Tableau[i].Push(initial[i]);
        }
        Discarded = 0;
        GameOver = false;
        Won = false;
        Message = "";
        lastMove = null; // Clear undo state on new game
        StateHasChanged();
    }

    public void DealNext()
    {
        if (Stock.Count == 0 || Tableau == null || Tableau.Count < 1) return;
        // Clear undo state when dealing (we don't undo deals)
        lastMove = null;
        for (int i = 0; i < 4; i++)
        {
            if (Stock.Count > 0 && i < Tableau.Count && Tableau[i] != null)
            {
                var card = Stock.Dequeue();
                card.IsFaceUp = true;
                Tableau[i].Push(card);
            }
        }
        CheckGameEnd();
        StateHasChanged();
    }

    public void Discard()
    {
        var toDiscard = GetDiscardableCards();
        foreach (var (pileIndex, card) in toDiscard)
        {
            if (Tableau != null && pileIndex >= 0 && pileIndex < Tableau.Count && Tableau[pileIndex] != null)
            {
                Tableau[pileIndex].Pop();
                Discarded++;
            }
        }
        CheckGameEnd();
        StateHasChanged();
    }

    public void DiscardCard(int pileIndex)
    {
        if (Tableau == null || pileIndex < 0 || pileIndex >= Tableau.Count)
        {
            ShowToastMessage($"Internal error: invalid pile index {pileIndex}");
            return;
        }
        var discardableList = GetDiscardableCards();
        var card = (Tableau[pileIndex] != null && Tableau[pileIndex].Count > 0) ? Tableau[pileIndex].Peek() : null;
        var discardable = discardableList.Any(x => x.pileIndex == pileIndex && x.card.Rank == card?.Rank && x.card.Suit == card?.Suit && x.card.Value == card?.Value);
        if (discardable)
        {
            var cardToDiscard = Tableau[pileIndex].Pop();
            Discarded++;
            
            // Record the move for undo
            lastMove = new UndoState
            {
                Type = MoveType.Discard,
                FromPile = pileIndex,
                ToPile = -1, // Not applicable for discard
                Card = cardToDiscard
            };
            
            CheckGameEnd();
            StateHasChanged();
        }
        else
        {
            var discardableCards = discardableList.Select(x => $"{x.pileIndex}:{x.card.Rank} of {x.card.Suit}");
            var debug = $"Clicked: {pileIndex} ({card?.Rank} of {card?.Suit}), Discardable: [{string.Join(", ", discardableCards)}]";
            ShowToastMessage($"This card cannot be discarded.");
        }
    }

    public bool IsCardDiscardable(int pileIndex)
    {
        return GetDiscardableCards().Any(x => x.pileIndex == pileIndex);
    }

    public bool CanUndo => lastMove != null;

    public void Undo()
    {
        if (lastMove == null || Tableau == null) return;

        try
        {
            if (lastMove.Type == MoveType.Discard)
            {
                // Restore the discarded card back to its original pile
                Tableau[lastMove.FromPile].Push(lastMove.Card);
                Discarded--;
            }
            else if (lastMove.Type == MoveType.MoveToEmpty)
            {
                // Move the card back from the empty pile to its original pile
                if (Tableau[lastMove.ToPile].Count > 0 && Tableau[lastMove.ToPile].Peek() == lastMove.Card)
                {
                    Tableau[lastMove.ToPile].Pop();
                    Tableau[lastMove.FromPile].Push(lastMove.Card);
                }
            }

            // Clear the undo state after using it
            lastMove = null;
            
            // Reset game over state since we've undone a move
            if (GameOver)
            {
                GameOver = false;
                Won = false;
                Message = "";
            }

            StateHasChanged();
        }
        catch
        {
            // If something goes wrong, clear the undo state
            lastMove = null;
            ShowToastMessage("Unable to undo that move.");
        }
    }

    private void ShowToastMessage(string message)
    {
        ToastMessage = message;
        ShowToast = true;
        StateHasChanged();
        toastTimer?.Dispose();
        toastTimer = new System.Timers.Timer(2000);
        toastTimer.Elapsed += (s, e) =>
        {
            ShowToast = false;
            ToastMessage = "";
            toastTimer?.Dispose();
            InvokeAsync(StateHasChanged);
        };
        toastTimer.AutoReset = false;
        toastTimer.Start();
    }

    // Accessibility: announce and show a brief toast when hover-to-click is intentionally disabled
    private string hoverDisabledStatusMessage = "";
    private System.Timers.Timer? hoverDisabledTimer;

    private void ShowHoverDisabledToast(string which)
    {
        var text = $"Hover-to-click is intentionally disabled for the {which} button.";
        hoverDisabledStatusMessage = text;
        // Also show the visible toast for sighted users
        ShowToastMessage(text);

        hoverDisabledTimer?.Dispose();
        hoverDisabledTimer = new System.Timers.Timer(2000);
        hoverDisabledTimer.Elapsed += (s, e) =>
        {
            hoverDisabledStatusMessage = "";
            hoverDisabledTimer?.Dispose();
            InvokeAsync(StateHasChanged);
        };
        hoverDisabledTimer.AutoReset = false;
        hoverDisabledTimer.Start();

        StateHasChanged();
    }

    private void ShowHoverDisabledToastHome() => ShowHoverDisabledToast("Home");
    private void ShowHoverDisabledToastRules() => ShowHoverDisabledToast("Rules");
    private void ShowHoverDisabledToastBackground() => ShowHoverDisabledToast("Background");

    public void TryMoveToEmpty(int pileIndex)
    {
        if (Tableau == null || pileIndex < 0 || pileIndex >= Tableau.Count || Tableau[pileIndex] == null || Tableau[pileIndex].Count == 0) return;
        var emptyIndex = Tableau.FindIndex(p => p != null && p.Count == 0);
        if (emptyIndex == -1) return;
        var card = Tableau[pileIndex].Pop();
        Tableau[emptyIndex].Push(card);
        
        // Record the move for undo
        lastMove = new UndoState
        {
            Type = MoveType.MoveToEmpty,
            FromPile = pileIndex,
            ToPile = emptyIndex,
            Card = card
        };
        
        CheckGameEnd();
        StateHasChanged();
    }

    public void OnCardClick(int pileIndex)
    {
        var discardableList = GetDiscardableCards();
        var card = (Tableau != null && pileIndex >= 0 && pileIndex < Tableau.Count && Tableau[pileIndex] != null && Tableau[pileIndex].Count > 0) ? Tableau[pileIndex].Peek() : null;
        var discardable = discardableList.Any(x => x.pileIndex == pileIndex && x.card.Rank == card?.Rank && x.card.Suit == card?.Suit && x.card.Value == card?.Value);
        var canMoveToEmpty = Tableau != null && Tableau[pileIndex] != null && Tableau[pileIndex].Count > 0 && Tableau.Any(p => p != null && p.Count == 0) && !discardable;
        if (discardable)
        {
            DiscardCard(pileIndex);
        }
        else if (canMoveToEmpty)
        {
            TryMoveToEmpty(pileIndex);
        }
        // else do nothing
    }

    private void CheckGameEnd()
    {
        if (Tableau == null) return;
        if (Stock.Count == 0 && !HasMoves())
        {
            GameOver = true;
            Won = Tableau.Count(p => p != null && p.Count == 1 && p.Peek().Rank == "A") == 4;
            Message = Won ? "You Win!" : "Game Over";
        }
    }

    private bool HasMoves() => CanDiscard() || CanMoveToEmpty();

    public bool CanDiscard() => Tableau != null && GetDiscardableCards().Any();

    private bool CanMoveToEmpty() => Tableau != null && Tableau.Any(p => p != null && p.Count == 0) && Tableau.Any(p => p != null && p.Count > 0);

    public bool CanDeal => !GameOver && Stock.Count >= 4;

    // Hover-to-click functionality
    [JSInvokable]
    public void UpdateHoverProgress(int pileIndex, int percent)
    {
        if (percent == 0)
        {
            hoverProgress.Remove(pileIndex);
        }
        else
        {
            hoverProgress[pileIndex] = percent;
        }
        StateHasChanged();
    }

    [JSInvokable]
    public void OnCardHoverClick(int pileIndex)
    {
        if (!autoPlayEnabled) return;
        
        // Clear hover progress
        hoverProgress.Remove(pileIndex);
        
        // Handle Deal button (pile index -1)
        if (pileIndex == -1)
        {
            DealNext();
        }
        else
        {
            // Trigger the existing card click handler
            OnCardClick(pileIndex);
        }
    }

    [JSInvokable]
    public async Task OnButtonHoverClick(string buttonId)
    {
        // Do not allow hover-to-click for navigation buttons (Home and Rules)
        if (buttonId == "home" || buttonId == "rules")
        {
            Console.WriteLine($"OnButtonHoverClick: Ignoring hover action for {buttonId}");
            return;
        }

        // Allow the autoplay-toggle to be activated even when autoPlayEnabled is currently false
        if (buttonId != "autoplay-toggle" && !autoPlayEnabled) return;

        // When a button hover completes, invoke the mapped action and show a brief toast for accessibility feedback
        switch (buttonId)
        {
            case "autoplay-toggle":
                // Toggle the checkbox programmatically and run the same after-bind logic
                autoPlayEnabled = !autoPlayEnabled;
                await OnToggleAutoPlay();
                ShowToastMessage(autoPlayEnabled ? "Auto-play enabled via hover" : "Auto-play disabled via hover");
                break;
            case "new-game":
                ShowNewGameConfirmButtons();
                ShowToastMessage("New game confirmation shown via hover");
                break;
            case "confirm-new-yes":
                ConfirmNewGame();
                ShowToastMessage("New game started via hover");
                break;
            case "confirm-new-no":
                HideNewGameConfirmButtons();
                ShowToastMessage("New game cancelled via hover");
                break;
            case "undo":
                if (CanUndo)
                {
                    Undo();
                    ShowToastMessage("Undo triggered via hover");
                }
                break;
            case "home":
                GoHome();
                break;
            case "rules":
                ShowRulesModal();
                break;
        }

        StateHasChanged();
    }

    private int hoverDelayMs = 1000;
    private string hoverDelayError = "";

    private async Task OnHoverDelayInput(ChangeEventArgs e)
    {
        // Validate input and update JS with new delay when valid
        if (e?.Value == null)
        {
            hoverDelayError = "Please enter a value between 50 and 10000 ms.";
            StateHasChanged();
            return;
        }

        if (!int.TryParse(e.Value.ToString(), out var v))
        {
            hoverDelayError = "Please enter a valid number.";
            StateHasChanged();
            return;
        }

        hoverDelayMs = v;
        if (hoverDelayMs < 50 || hoverDelayMs > 10000)
        {
            hoverDelayError = "Please enter a value between 50 and 10000 ms.";
        }
        else
        {
            hoverDelayError = "";
            // Inform JS of the updated delay
            if (dotNetRef != null)
            {
                await JSRuntime.InvokeVoidAsync("updateAcesUpHoverDelay", hoverDelayMs);
            }
        }

        StateHasChanged();
    }

    private async Task OnToggleAutoPlay()
    {
        // autoPlayEnabled has already been updated by @bind:after
        Console.WriteLine($"OnToggleAutoPlay: autoPlayEnabled = {autoPlayEnabled}");
        
        // Update accessibility message
        autoPlayStatusMessage = autoPlayEnabled ? "Auto-play enabled" : "Auto-play disabled";
        
        // Update JavaScript listener state
        if (dotNetRef != null)
        {
            await JSRuntime.InvokeVoidAsync("updateAcesUpHoverEnabled", autoPlayEnabled, hoverDelayMs);
        }
        
        StateHasChanged();
    }

    public void Dispose()
    {
        toastTimer?.Dispose();
        hoverDisabledTimer?.Dispose();
    }

    /// <summary>
    /// Returns a list of all cards (by pile index and card) that are currently discardable according to Aces Up rules.
    /// A card is discardable if:
    ///   - It is the top card of a tableau pile
    ///   - There is at least one other tableau top card of the same suit
    ///   - It is NOT the highest value among those top cards of its suit (Aces high)
    /// </summary>
    private List<(int pileIndex, Card card)> GetDiscardableCards()
    {
        if (Tableau == null) return new List<(int, Card)>();
        var tops = new List<(int, Card)>();
        // Gather the top card of each tableau pile (if any)
        for (int i = 0; i < Tableau.Count; i++)
        {
            var p = Tableau[i];
            if (p != null && p.Count > 0)
            {
                tops.Add((i, p.Peek()));
            }
        }
        // Group the top cards by suit, but only consider suits that appear more than once
        var groups = tops.GroupBy(t => t.Item2.Suit).Where(g => g.Count() > 1);
        var discardable = new List<(int, Card)>();
        foreach (var group in groups)
        {
            // Find the highest value among the top cards of this suit
            var maxValue = group.Max(t => t.Item2.Value);
            // All cards of this suit with value less than the max are discardable
            discardable.AddRange(group.Where(t => t.Item2.Value < maxValue).Select(t => (t.Item1, t.Item2)));
        }
        return discardable;
    }
}
