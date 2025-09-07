Got it, Mark — let's turn your memory of **Strip Jack Naked** into a proper game spec you can use for your Blazor project.
Here’s a solid first draft of a **functional specification** that works well with your existing JPEG card assets and keeps things simple to implement.

---

## **Strip Jack Naked – Game Specification**

### **Overview**

This is a two-player (or N-player) card game. The game uses a standard 52-card deck. Cards are dealt equally among all players. Players take turns laying cards in the center pile. Certain cards (J, Q, K, A) require the next player to play a specific number of penalty cards. If they fail to play a "court card" (J, Q, K, A) during the penalty, the pile goes to the player who played the last court card.

The goal is to win all cards.

---

### **Rules**

#### **1. Setup**

* Shuffle the deck.
* Deal cards evenly between all players.
* Each player’s cards form a face-down stack.
* The player to the dealer’s left starts.

---

#### **2. Player Turn**

1. Player flips the **top card** from their stack and places it face-up in the center pile.
2. If the card is:

   * **2–10:** Nothing special happens. Play moves to next player.
   * **Jack:** Next player must play **1 card**.
   * **Queen:** Next player must play **2 cards**.
   * **King:** Next player must play **3 cards**.
   * **Ace:** Next player must play **4 cards**.

---

#### **3. Penalty Resolution**

* When a penalty card (J, Q, K, A) is played:

  * The next player must play the required number of cards **one by one**.
  * If they play another court card during their penalty, the obligation passes to the following player (with the new number of cards required).
  * If they fail to play a court card during their penalty, the player who played the last court card **takes the entire pile** and places it at the bottom of their stack.
  * That player then plays the next card to restart play.

---

#### **4. Winning**

* Play continues until one player has all the cards.
* That player is declared the winner.

---

### **Blazor Implementation Notes**

#### **Data Structures**

* **Player**:

  ```csharp
  class Player {
      public string Name { get; set; }
      public Queue<Card> Deck { get; set; } = new Queue<Card>();
  }
  ```

* **Card**:

  ```csharp
  class Card {
      public string Suit { get; set; } // Hearts, Clubs, etc.
      public string Rank { get; set; } // 2–10, J, Q, K, A
      public string ImagePath { get; set; } // Path to JPEG
  }
  ```

* **Game State**:

  ```csharp
  class GameState {
      public List<Player> Players { get; set; }
      public Stack<Card> Pile { get; set; } = new Stack<Card>();
      public int CurrentPlayerIndex { get; set; }
      public int PenaltyCount { get; set; } = 0;
      public Player LastCourtCardPlayer { get; set; }
  }
  ```

---

#### **UI / UX**

* Show each player’s card count, but not their cards.
* Show the current center pile (only the top card face-up).
* Have a **"Play Card"** button for the current player.
* Animate card movement (optional).
* Display messages:

  * “Player X must play 3 cards.”
  * “Player 1 wins the pile!” (UI now displays "Player 1" or "Player 2" depending on who won)
  * “Player Z has won the game!”

---

#### **Gameplay Flow**

1. On "Play Card", draw from player’s deck and reveal.
2. Add card to pile, check if it’s a court card.
3. If court card → set penalty and store last court card player.
4. If penalty in effect → decrement penalty count each card.
5. If penalty count reaches 0 without a court card → award pile.
6. Rotate to next player.

---

### **Additional Features (Optional)**

Note player two should be played by the computer and player 1 would be played by a human player.

Note the cards are stored in the cards directory in the route: wwwroot/cards
 And they are SVG format.

  Please remove all Blazor components that are currently in the project and start from scratch including the weather and counter but keep the home page.