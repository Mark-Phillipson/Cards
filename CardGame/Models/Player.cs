using System.Collections.Generic;

namespace CardGame.Models;

public class Player
{
    public string Name { get; set; } = "";
    public Queue<Card> Deck { get; set; } = new Queue<Card>();
}
