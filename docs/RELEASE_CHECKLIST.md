# Release Checklist

## Vercel

Deploy the `web/` directory as the Vercel project root. Configure only these
runtime variables in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Do not configure `DATABASE_URL`, a Supabase service-role key, or the retired
Nest JWT secrets in Vercel.

## Pre-Release Verification

1. Run `npm run catalog:validate` and `npm run web:build` from the repository
   root.
2. Open the deployed dashboard in a private browser window. Confirm catalog
   browsing, local watch/unwatch, reload persistence, filters, and the next-up
   result without signing in.
3. Sign in with a Supabase Auth account that has local progress. Confirm the
   merge panel shows both local and account counts, then confirm merge keeps
   the union of watched IDs.
4. Sign in as a second Supabase Auth account. Confirm it cannot read or alter
   the first account's progress.
5. Confirm anonymous API calls can read catalog tables but receive no access
   to `watch_progress`.

## Catalog Maintenance

The normalized seed and tools now live at the repository root:

```sh
npm run catalog:validate
npm run catalog:import
```

`catalog:import` needs an administrator `DATABASE_URL` and is intended for a
local maintenance shell or protected CI job. It is never part of the browser or
Vercel runtime.
