## Purpose
This file helps AI coding agents get productive in the CardGame Blazor WebAssembly repo quickly. It focuses on the concrete, discoverable patterns, run/build steps, and the small domain model used by the app.

## Big picture (what this app is)
- Blazor WebAssembly single-page app (WASM) that implements a two-player card game (Strip Jack Naked) in `CardGame/`.
- UI pages live in `CardGame/Pages` (notably `Game.razor`). Business logic for dealing/shuffling lives in `CardGame/Services/DeckService.cs`. Models are in `CardGame/Models`.
- Static assets (card SVGs) are under `CardGame/wwwroot/cards` and are referenced by `Card.ImageUrl` using the pattern: `/cards/Cards-{Rank}-{Suit}.svg`.

## Key files to read first
- `CardGame/Pages/Game.razor` — main gameplay logic and UI. Contains turn loop, penalty handling, pile transfers, and UI state (CurrentPlayerIndex, Pile, PenaltyActive, etc.).
- `CardGame/Services/DeckService.cs` — deck creation, shuffle, DealToPlayers(playerCount) returns List<List<Card>>. DeckService is registered as a Singleton in `Program.cs`.
- `CardGame/Models/Card.cs` and `CardGame/Models/Player.cs` — Card uses required properties (Rank, Suit, ImageUrl, Value); Player holds a `Queue<Card> Deck`.
- `Program.cs` — Blazor WebAssembly host and DI registrations (DeckService singleton, HttpClient scoped).

## Concrete patterns & conventions (use these exactly)
- Decks are modeled as `Queue<Card>` (FIFO). When transferring pile to a player, code enqueues cards to the player's `Queue<Card>`.
- The center pile is a `Stack<Card>` and `Stack.ToArray()` is used to read top card (`arr[0]` is top because ToArray is LIFO).
- Court card ranks: `J`, `Q`, `K`, `A`. Penalty mapping is implemented in `CourtPenaltyForRank` in `Game.razor`.
- UI pacing: async Task delays and a `CanPlay` boolean enforce cooldowns. CPU moves are executed with `ContinueTurnsIfNeeded()` which loops until human turn returns.
- Use `StateHasChanged()` after mutating UI state so Blazor re-renders. Many handlers call it explicitly.

## How to build & run (Windows / PowerShell)
- From repository root: `cd CardGame` then:
  - Development live reload: `dotnet watch run` (this is the recommended dev flow). This runs the WASM dev server and reloads on changes.
  - Build once: `dotnet build CardGame.csproj` or `dotnet build CardGame.sln` from the solution root.
- VS Code tasks are available (look in the workspace Tasks quick pick). If a change touches DI or `DeckService`, restart the dev server.

## Editing & extending tips (examples)
- Changing dealing logic: edit `DealToPlayers(int playerCount)` in `DeckService.cs`. Note callers in `Game.razor` wrap the returned List<Card> into `new Queue<Card>(dealt[0])`.
- Changing penalty rules: edit `CourtPenaltyForRank` and `IsCourt` in `Game.razor`. The penalty flow relies on `PenaltyActive`, `PenaltyPlayerIndex`, and `LastCourtPlayer` — update all three if you change behavior.
- Adding new card imagery: follow the `Cards-{Rank}-{Suit}.svg` filename pattern and update `DeckService.InitializeDeck()` if you introduce new ranks/suits.

## Debugging notes
- If the UI doesn't update, check for missing `StateHasChanged()` calls after state mutation (common on server-side timing changes).
- Watch for off-by-one in `Stack/Queue` usage: `Stack.ToArray()` returns top as index 0; `Queue` enumerates in dequeue order.

## Tests and CI
- There are no automated tests present. Focus PRs on small, well-scoped changes and validate locally with `dotnet watch run`.

## Quick TODOs for future agent work (discoverable-scope only)
- Add unit tests for `DeckService.DealToPlayers` and penalty flows in `Game.razor`.
- Add an integration/smoke test that uses Playwright (a `PlaywrightTests` project exists in the workspace root and has a build task).

If any section is unclear or you want more examples (e.g., exact lines to change in `Game.razor`), tell me which area to expand.
