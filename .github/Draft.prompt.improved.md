# Extend hover-to-click (auto-play on hover) to buttons

## Summary
Extend the existing hover-to-click feature (currently used on cards and the deal pile) to also support UI buttons and confirmation dialogs. Example: hovering over the "New" button (or the "Yes" button on the new-game confirmation) should behave the same as hovering over a card: show the countdown progress and trigger the same action when the countdown completes.

## Acceptance criteria ✅
- When **Auto-play on hover** is enabled, any element annotated with `data-hoverable="true"` should support the hover countdown behavior (cards, deal pile, and buttons).
- Buttons to include initially: **New**, **Undo** (when enabled), **Home**, **Rules**, **Deal**, and the **Confirm** modal buttons (Yes / No) when visible.
- Disabled buttons should NOT be hover-activated.
- Visual progress UI (circular progress + percentage) should display the same way as for cards while hovering a button.
- On completion of the hover countdown, the element's existing click handler should be invoked (i.e., no new handler logic duplicated — reuse current Blazor methods such as `ConfirmNewGame`, `DealNext`, `Undo`, `GoHome`, etc.).
- Hover is cancelled on mouseleave and the progress resets.
- Works correctly after DOM updates (modal show/hide, new cards dealt) — i.e., listeners are refreshed after render.
- Accessibility: announce enabling/disabling of Auto-play via existing aria-live message; announce when an automatic action is triggered (e.g., "New game started via hover").

## Implementation notes 🔧
- Markup changes (in `AcesUp.razor`): add attributes to the relevant buttons, e.g.:
  - `<button ... data-hoverable="true" data-button-id="new-game">New</button>`
  - `<button ... data-hoverable="true" data-button-id="confirm-new-yes">Yes</button>`
  - `<button ... data-hoverable="true" data-button-id="confirm-new-no">No</button>`
  - For the deal pile you can keep `data-pile-index="deal"` as is (already supported).
  - Ensure disabled buttons do not include `data-hoverable="true"` or are ignored by the JS when disabled.
- JS changes (`AcesUpHover.js`): the current script attaches to elements with `data-hoverable="true"` — extend/verify it handles generic elements (not only cards) and reads either `data-pile-index` or `data-button-id`. When the hover completes, call the appropriate DotNet callback:
  - For pile-based actions: `dotNetRef.invokeMethodAsync('OnCardHoverClick', pileIndex)` (already exists)
  - For button actions: `dotNetRef.invokeMethodAsync('OnButtonHoverClick', buttonId)` (add this new C#-invokable handler)
- C# changes (`AcesUp.razor.cs`): add a `[JSInvokable] public void OnButtonHoverClick(string buttonId)` that maps `buttonId` to existing methods (e.g., `"new-game" => ConfirmNewGame()` or `ShowNewGameConfirmButtons()` depending on desired behavior). Make sure to check `autoPlayEnabled` before performing actions.
- Ensure `OnAfterRenderAsync` calls `refreshAcesUpHoverListeners()` when `autoPlayEnabled` is true so newly rendered buttons (like confirmation modal buttons) get listeners.
- Keep the same delay (2s) for buttons to avoid accidental activation; consider making it configurable later.

## Tests / Manual verification ✅
1. Enable `Auto-play on hover` and hover the **New** button for the full countdown: confirm the confirmation modal appears (or the new game starts if skipping confirmation) and an aria announcement is made.
2. Hover **Yes** on the confirmation dialog for full countdown: confirm the `ConfirmNewGame` handler is invoked.
3. Hover **Undo** when enabled: confirm it triggers `Undo()` after countdown.
4. Hover **Deal** (stock) for full countdown: confirm `DealNext()` runs.
5. Hover a disabled button: nothing should happen.
6. Verify progress resets on mouseleave and no duplicate handlers are attached after DOM updates.

## Notes / Concerns ⚠️
- Be mindful of accidentally triggering destructive actions (e.g., new game) — confirmation modal remains important. The 2s delay mitigates accidental triggers.
- Keep the JS/C# mapping simple and reuse existing handlers instead of duplicating logic.

If this looks good I can prepare a small patch (HTML attributes, a JS tweak to pass button ids, and the `[JSInvokable] OnButtonHoverClick` handler) and include tests/verification steps. Let me know if you want the hover delay changed or the feature limited to a smaller set of buttons.