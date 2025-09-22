using CardGame.Models;
using CardGame.Services;
using Microsoft.AspNetCore.Components;
using System.Collections.Generic;
using System.Linq;

namespace CardGame.Pages;

public partial class AcesUp : ComponentBase
{
    [Inject] public DeckService DeckService { get; set; } = null!;

    public List<Stack<Card>> Tableau { get; set; } = new() { new(), new(), new(), new() };
    public Queue<Card> Stock { get; set; } = new();
    public int Discarded { get; set; } = 0;
    public bool GameOver { get; set; } = false;
    public bool Won { get; set; } = false;
    public string Message { get; set; } = "";
    public string ToastMessage { get; set; } = "";
    public bool ShowToast { get; set; } = false;
    private System.Timers.Timer? toastTimer;

    protected override void OnInitialized()
    {
        NewGame();
    }

    public void NewGame()
    {
        DeckService.ResetDeck();
        Tableau = new List<Stack<Card>> { new(), new(), new(), new() };
        var allCards = DeckService.DealCards(52);
        Stock = new Queue<Card>(allCards.Skip(4));
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
        StateHasChanged();
    }

    public void DealNext()
    {
        if (!CanDeal) return;
        for (int i = 0; i < 4; i++)
        {
            if (Stock.Count > 0 && Tableau != null && i < Tableau.Count && Tableau[i] != null)
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
            Console.WriteLine($"DiscardCard called with invalid pileIndex: {pileIndex}");
            ShowToastMessage($"Internal error: invalid pile index {pileIndex}");
            return;
        }
        var discardableList = GetDiscardableCards();
        var card = (Tableau[pileIndex] != null && Tableau[pileIndex].Count > 0) ? Tableau[pileIndex].Peek() : null;
        foreach (var x in discardableList)
        {
            Console.WriteLine($"Comparing: pileIndex {x.pileIndex} == {pileIndex}, Rank {x.card.Rank} == {card?.Rank}, Suit {x.card.Suit} == {card?.Suit}, Value {x.card.Value} == {card?.Value}");
        }
        var discardable = discardableList.Any(x => x.pileIndex == pileIndex && x.card.Rank == card?.Rank && x.card.Suit == card?.Suit && x.card.Value == card?.Value);
        Console.WriteLine($"Discardable: {discardable}");
        Console.WriteLine($"Clicked: {pileIndex} ({card?.Rank} of {card?.Suit}), Discardable: [{string.Join(", ", discardableList)}]");
        if (discardable)
        {
            Tableau[pileIndex].Pop();
            Discarded++;
            CheckGameEnd();
            StateHasChanged();
        }
        else
        {
            var discardableCards = discardableList.Select(x => $"{x.pileIndex}:{x.card.Rank} of {x.card.Suit}");
            var debug = $"Clicked: {pileIndex} ({card?.Rank} of {card?.Suit}), Discardable: [{string.Join(", ", discardableCards)}]";
            ShowToastMessage($"This card cannot be discarded. {debug}");
        }
    }

    public bool IsCardDiscardable(int pileIndex)
    {
        return GetDiscardableCards().Any(x => x.pileIndex == pileIndex);
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

    public void TryMoveToEmpty(int pileIndex)
    {
        if (Tableau == null || pileIndex < 0 || pileIndex >= Tableau.Count || Tableau[pileIndex] == null || Tableau[pileIndex].Count == 0) return;
        var emptyIndex = Tableau.FindIndex(p => p != null && p.Count == 0);
        if (emptyIndex == -1) return;
        var card = Tableau[pileIndex].Pop();
        Tableau[emptyIndex].Push(card);
        CheckGameEnd();
        StateHasChanged();
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

    public bool CanDeal => !GameOver && Stock.Count >= 4 && !HasMoves();

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
