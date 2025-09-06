using System;

namespace CardGame.Models;

public class Card
{
    public required string Suit { get; set; }
    public required string Rank { get; set; }
    public int Value { get; set; }
    public required string ImageUrl { get; set; }
     public  bool IsFaceUp { get; set; } = false;
}
