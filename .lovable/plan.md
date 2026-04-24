## Plan to simplify table occupancy during signup (and fix related issues)

1. **Redesign onboarding to remove per-table occupancy typing**
   - Replace the current “enter Min/Max for every table row” flow with a faster setup model:
     - Select a **layout preset** (Small / Standard / Large), or
     - Use **table-type counters** (2-seater, 4-seater, 6-seater, 8+ seater).
   - Keep manual editing optional behind an **“Advanced customize”** toggle, so most users can finish onboarding in under a minute.
   - Keep table naming auto-generated (`Table 1`, `Table 2`, …) unless advanced mode is opened.

2. **Generate occupancy automatically from the simplified inputs**
   - Convert selected preset/counters into the `tables` payload expected by `restaurant-onboarding`.
   - Map each generated table to valid occupancy ranges (e.g., 2-seater => min 1, max 2; 4-seater => min 2, max 4).
   - Continue enforcing backend limits (1–50 guests, min <= max, max 200 tables).

3. **Fix current table-management inconsistencies discovered during review**
   - Align settings-side table management with the actual schema and onboarding model:
     - `restaurant_tables` requires `restaurant_id`, `name`, `min_occupancy`, `max_occupancy` (not just `capacity`).
   - Update `manage-restaurant-tables` contract and client calls so create/update operations remain valid and don’t break after onboarding.
   - Remove/replace the globally shared table passcode path so it matches the per-restaurant passcode security model already used by onboarding.

4. **Improve UX details and guardrails**
   - Add onboarding summary before submit (total tables + seat mix).
   - Add helpful defaults and one-click reset to preset.
   - Keep “edit later in Settings” clearly visible so users aren’t forced into detailed setup.

5. **Spot-fix nearby issues while implementing**
   - Correct guest-range display edge case in table cards (currently can show `1–X` when min=max).
   - Remove/avoid exposing internal UUIDs in Settings table list (show friendly table labels/numbers).
   - Ensure query invalidation and UI refresh still work after onboarding and table edits.

6. **Validation and regression checks**
   - Verify end-to-end flow: signup → onboarding → dashboard load → create reservation.
   - Verify edited table definitions still produce correct availability matching.
   - Verify edge-function errors surface cleanly in toast messages.

## Technical details

- **Frontend files likely touched**
  - `src/features/onboarding/RestaurantOnboardingDialog.tsx`
  - `src/features/reservations/components/SettingsTab.tsx`
  - `src/features/reservations/tablesApi.ts`
  - `src/features/reservations/components/TableGrid.tsx`

- **Backend file likely touched**
  - `supabase/functions/manage-restaurant-tables/index.ts`

- **Data model impact**
  - No new table required for the simplified onboarding UX.
  - Existing `restaurant_tables` fields (`name`, `min_occupancy`, `max_occupancy`, `capacity`) will be populated consistently from generated table types.

If you approve, I’ll implement this simplified onboarding flow first, then immediately apply the related table-management/security fixes in the same pass.