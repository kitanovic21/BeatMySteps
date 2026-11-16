// Home screen widgets exist on Android only (index.android.ts); elsewhere these do nothing.
// Keep both files on the same extension: Metro checks .ts before .tsx, so an
// index.android.tsx would lose to this index.ts and widgets would never register.

export function registerWidgets() {}

export async function refreshWidgets() {}
