using CardGame.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace CardGame.Services;
    public class DeckService
    {
        private List<Card> _deck;

        public DeckService()
        {
            _deck = new List<Card>();
            InitializeDeck();
        }

        private void InitializeDeck()
        {
            _deck = new List<Card>();
            var suits = new[] { "Heart", "Diamond", "Club", "Spade" };
            var ranks = new[] { "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A" };
            var values = new Dictionary<string, int>
                {
                    { "2", 2 }, { "3", 3 }, { "4", 4 }, { "5", 5 }, { "6", 6 }, { "7", 7 }, { "8", 8 }, { "9", 9 }, { "10", 10 },
                    { "J", 11 }, { "Q", 12 }, { "K", 13 }, { "A", 14 }
                };

            foreach (var suit in suits)
            {
                foreach (var rank in ranks)
                {
                    _deck.Add(new Card
                    {
                        Suit = suit,
                        Rank = rank,
                        Value = values[rank],
                        ImageUrl = $"/cards/Cards-{rank}-{suit}.svg"
                    });
                }
            }
        }

        public void ShuffleDeck()
        {
            var rng = new Random();
            _deck = _deck.OrderBy(card => rng.Next()).ToList();
        }

        public List<Card> DealCards(int numberOfCards)
        {
            if (numberOfCards > _deck.Count)
            {
                throw new ArgumentException("Not enough cards in the deck to deal.");
            }
            if (numberOfCards <= 0)
            {
                throw new ArgumentException("Number of cards to deal must be greater than zero.");
            }
            var dealtCards = _deck.Take(numberOfCards).ToList();
            _deck.RemoveRange(0, numberOfCards);
            return dealtCards;
        }

        public void ResetDeck()
        {
            InitializeDeck();
            ShuffleDeck();
        }

            /// <summary>
            /// Deal the shuffled deck evenly to the given number of players.
            /// Returns a list of lists where each inner list is the cards for a player.
            /// </summary>
            public List<List<Card>> DealToPlayers(int playerCount)
            {
                if (playerCount <= 0) throw new ArgumentException("playerCount must be > 0");
                ResetDeck();
                ShuffleDeck();

                var hands = new List<List<Card>>();
                for (int i = 0; i < playerCount; i++) hands.Add(new List<Card>());

                int index = 0;
                while (_deck.Count > 0)
                {
                    hands[index % playerCount].Add(_deck[0]);
                    _deck.RemoveAt(0);
                    index++;
                }

                return hands;
            }
    }