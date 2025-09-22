# Aces Up - Rules and Application Specification
## Document 1: Rules for *Aces Up*

---

### Aces Up — Rules

**Goal:**
Have only the four Aces remaining in the tableau. Discard all other cards. ([BVS Solitaire Collection][1])

---

### Setup

1. Use a standard 52-card deck (no jokers). ([BVS Solitaire Collection][1])
2. Shuffle the deck.
3. Deal **4 cards face-up**, one into each of 4 tableau piles/columns. ([BVS Solitaire Collection][1])
4. The remaining cards form the **stock** (face-down). ([BVS Solitaire Collection][1])

---

### Play

Repeat the following steps while possible:

1. **Discarding:**

   * Look at the top (face-up) card of each tableau pile. ([BVS Solitaire Collection][1])
   * If two or more of these face-up cards share the **same suit**, you *may* discard all but the highest-ranked of that suit. Aces are high. ([BVS Solitaire Collection][1])

2. **Filling Spaces:**

   * If any tableau pile becomes empty, you may move any top (face-up) card from another tableau pile into that empty space. ([Wikipedia][2])

3. Once no further discards or moves are possible with the current tableau + filled spaces, **deal** 4 more cards from the stock — one onto each tableau pile. ([BVS Solitaire Collection][1])

4. Repeat from step 1. ([BVS Solitaire Collection][1])

---

### End / Win Condition

* When the stock is empty *and* there are no more possible discards or moves, the game ends. ([BVS Solitaire Collection][1])
* You **win** if only the four Aces remain in the tableau. All other cards have been discarded. ([BVS Solitaire Collection][1])
* Score (optional): the number of discarded cards. Maximum possible is 48 (52 total minus the 4 Aces). ([Wikipedia][2])

---

### Variations (optional)

* Restrictive version: only Aces are allowed to move into an empty tableau pile. This makes the game much harder. ([Wikipedia][2])
* Some implementations force dealing immediately when no plays remain; others allow user to delay dealing until no more discards or moves.

---

## Document 2: Application Specification for *Aces Up*

---

### Overview

This spec is to guide the implementation of *Aces Up* as a feature/game within your Blazor card games application. It covers required behavior, data model, UI, and possible variants/settings.

---

### Functional Requirements

| Feature               | Description                                                                                                             |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Game Start            | Ability to start a new game: shuffle deck, deal initial tableau of 4 cards, set up stock.                               |
| Tableau               | Four piles, with only top (face-up) cards accessible for discard or move.                                               |
| Stock                 | Remaining cards held face-down; deals in blocks of 4 (one per tableau column) when needed.                              |
| Discard Move          | If two or more tableau top cards share a suit, allow user to discard the lower ones. Respect rank ordering (A high).    |
| Move Into Empty Space | If a tableau pile is empty, allow moving any other tableau top card into that space.                                    |
| Deal from Stock       | When no discard or move actions are possible (or user triggers it), deal next set of four cards (one per tableau).      |
| End Game Detection    | Detect when stock is empty *and* no more moves/discards are possible.                                                   |
| Winning Detection     | Detect win when only the four Aces remain in tableau.                                                                   |
| Scoring               | Count number of cards discarded; possibly show remaining “waste” in tableau if not won.                                 |
| Variation Settings    | Option(s) for variant rules: --- e.g. “Only Aces may fill empty spaces”, “auto-deal when no moves”, “manual deal”, etc. |

---

### Data Model / State

* **Card** class/entity

  * Suit (♠, ♥, ♦, ♣)
  * Rank (A, K, Q, J, 10…2)
  * FaceUp/FaceDown flag

* **Deck / Stock**

  * A collection/stack of cards face-down (except when dealing)
  * Method to draw next four into tableau

* **Tableau Piles** (4 piles)

  * Each is a stack/collection; only the top card is actionable

* **Discard / Waste** (optional)

  * Count / collection of discarded cards (for scoring)

* **Empty Slots**

  * Representation of empty tableau piles

* **Game State**

  * InProgress, Won, Lost
  * Score (cards discarded)
  * Variation options (settings)

---

### UI / UX Requirements

* Display 4 tableau piles prominently; show top cards; show empty piles clearly.
* Show stock pile; possibly a button or area for dealing next four when allowed.
* Discard action: either by clicking card(s) or some UI affordance. Should clearly show which discards are legal.
* Move to empty slot: allow dragging or click-to-move of a top card into an empty pile.
* Show score/discarded count.
* Show whether game over; if win or lose. Display outcome.
* Settings menu to choose variants before starting game.

---

### Non-Functional / Constraints

* Must work with voice interaction / accessibility (since you do voice coding). Identify clickable/tappable areas; ensure UI elements have labels.
* Performance: shuffling, dealing, discard logic should be fast; deck size is small so no heavy performance concerns.
* Responsiveness: works on different screen sizes if your app supports e.g. mobile.

---

### APIs / Blazor Components Proposal

* **GameService** (state management)

  * Methods: NewGame(settings), DealNext(), Discard(card), MoveToEmpty(card, targetPile), CheckEnd() etc.

* **CardComponent**

  * Displays a single card; knows suit, rank, face up/down; click or gesture to select/discard or move.

* **PileComponent**

  * For tableau pile: shows stack visually, top card face up.

* **StockComponent**

  * Shows face-down stack; user can click/tap to deal if allowed.

* **SettingsComponent**

  * To pick variant rules.

* **ScoreComponent / StatusComponent**

  * Displays score, game state, etc.

---

### Variant Rule Support

* Boolean setting: **Only Aces fill empty piles** vs **Any top card may fill empty**.
* Automatic vs manual dealing: "deal when no moves exist" vs user triggers.
* Possibly difficulty levels: e.g. limit the number of deals, or show hints.

---

### Testing & Edge Cases

* Ensure correct behavior when tableau pile becomes empty.

* Ensure handling when multiple suits match among top cards (discard only lower).

* Ensure when stock runs out, dealer cannot deal further, and detecting game over.

* Win detection only when exactly the 4 Aces remain, with no other card in tableau.

* UI should not allow illegal moves (e.g. discarding from non-top, moving non-top cards).

---

Please ensure that there is a code behind file called AcesUp.razor.cs

 and also please try to use the services and assets from the strip jack naked game as much as possible.