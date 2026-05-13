# Loading And Skeleton States

Created: May 13, 2026.

## Purpose

Use skeleton states to avoid showing temporary, stale, or default values while backend data is loading.

This matters especially for settings and HR forms where showing the wrong value for a second can make the user think data was not saved.

## Recommended Pattern

For data loaded from the API:

```text
Initial load with no data -> show skeletons.
Data loaded -> show real UI.
Background refetch with existing data -> keep UI visible and optionally show a small refreshing state.
Mutation in progress -> disable relevant actions and show saving state.
Mutation success -> update RTK Query cache through invalidation/response and reset form with saved values.
```

## Forms

For edit forms backed by database values:

- Do not render inputs with placeholder/default values as if they were real data.
- Use field-level skeletons until the record exists.
- Initialize/reset the form only after the API response arrives.
- Keep the save button disabled while initial data is missing.
- After save, reset the form with the API response.

Good examples:

- Company Settings.
- Tenant access settings.
- Leave policy detail.
- Document category detail.
- Employee profile edit.

## Tables

For tables:

- Show skeleton rows during initial load.
- Show empty state only after loading finishes and data is empty.
- Keep pagination controls hidden until data exists or total count is known.

## Informational Cards

For cards and summary panels:

- Use skeleton lines for labels and values.
- Avoid global spinners unless the whole page cannot be displayed.

## RTK Query Guidance

Use RTK Query states intentionally:

- `isLoading`: first load for this query.
- `isFetching`: any fetch, including background refetch.
- `data`: last available successful data.

Recommended UI logic:

```ts
const showInitialSkeleton = isLoading || (!data && isFetching);
const showRefreshing = Boolean(data && isFetching);
```

This prevents a visual flash of fake values while still keeping the UI stable during later refetches.

