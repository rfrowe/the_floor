# Task 12: Random Selection Integration

## Objective
Integrate the random selection hook into the Dashboard's DuelSetup component with a "Random Select" button.

## Status
**NOT STARTED**: DuelSetup component exists but lacks random selection button.

## Acceptance Criteria
- [ ] "Random Select" button added to DuelSetup component
- [ ] Button calls useRandomSelect hook
- [ ] Randomly selected contestant fills first empty slot (contestant1 or contestant2)
- [ ] Button disabled when no eligible contestants available
- [ ] Visual feedback shows the randomly selected contestant
- [ ] Tests verify random selection integration

## Dependencies
- Task 11: useRandomSelect hook (must be completed first)
- Task 10: Dashboard with DuelSetup (✅ complete)

## Implementation Guidance

1. **Update DuelSetup Component**:
   ```typescript
   // src/components/duel/DuelSetup.tsx
   import { useRandomSelect } from '@hooks/useRandomSelect';

   export function DuelSetup({
     contestant1,
     contestant2,
     onClear,
     onStartDuel,
     availableContestants // NEW PROP
   }: DuelSetupProps) {
     const { randomSelect } = useRandomSelect();

     const handleRandomSelect = () => {
       const selected = randomSelect(availableContestants);
       if (selected) {
         // Call new prop: onRandomSelect(selected)
       }
     };

     // ... rest of component
   }
   ```

2. **Add Prop Interface**:
   ```typescript
   export interface DuelSetupProps {
     contestant1: Contestant | null;
     contestant2: Contestant | null;
     availableContestants: Contestant[]; // NEW: for random selection
     onClear: () => void;
     onStartDuel: (duelConfig: DuelConfig) => void;
     onRandomSelect: (contestant: Contestant) => void; // NEW: callback
   }
   ```

3. **Button Placement**:
   - Add button near "Clear" button
   - Label: "Random Select"
   - Disable if no eligible contestants
   - Style similar to secondary button

4. **Dashboard Integration**:
   - Pass `contestants` array to DuelSetup
   - Implement `onRandomSelect` handler:
     ```typescript
     const handleRandomSelect = (contestant: Contestant) => {
       if (!selectedContestant1) {
         setSelectedContestant1(contestant);
       } else if (!selectedContestant2) {
         setSelectedContestant2(contestant);
       }
       // If both full, optionally replace contestant1
     };
     ```

5. **Visual Feedback** (Optional):
   - Brief highlight animation on selected card
   - Toast message: "Randomly selected [Name]"

6. **Testing**:
   - Random button selects eligible contestant
   - Button disabled with no eligible contestants
   - Selected contestant appears in correct slot
   - Works with 0, 1, or 2 existing selections

## Success Criteria
- Random Select button works and feels intuitive
- Only selects non-eliminated contestants
- Fills first available slot (contestant1 then contestant2)
- Disabled state is clear and correct
- No bugs or edge case errors
- All tests passing

## Out of Scope
- Multiple random selections at once
- Random selection for both slots
- Animation or fancy transitions
- "Shuffle" or "Reroll" functionality
- Random category selection

## Notes
- **This task is about integration** - the hook logic is in Task 11
- Keep the UX simple and predictable
- The random button is a convenience feature, not core workflow
- Consider placement: should it be in DuelSetup or Dashboard header?
- DuelSetup placement makes more sense contextually
