# ChatGPT MCP setup

The custom server exposes the release catalog and each signed-in user's watch progress at:

`https://<project-ref>.supabase.co/functions/v1/mcp`

## Activate Supabase Auth

In the Supabase dashboard:

1. Switch JWT signing to an asymmetric key (`ES256` or `RS256`).
2. Enable **Authentication → OAuth Server**.
3. Set the authorization path to `/oauth/consent` and enable dynamic client registration.
4. Set the Auth Site URL to the deployed Next.js origin.
5. Deploy the Next.js app, then deploy the function with `npm run supabase -- functions deploy mcp --project-ref <project-ref>`.

## Connect ChatGPT

In ChatGPT on the web, open **Plugins**, select **Add custom MCP server**, choose OAuth authentication, and enter the server URL above. Install the resulting personal plugin, then invoke it with `@MCU Watch Order`.

Available tools:

- `search_catalog`
- `get_title_progress`
- `get_progress_summary`
- `get_next_unwatched`
- `set_watch_status`

The first tool call opens the existing account sign-in and consent flow. Supabase RLS restricts progress reads and writes to that signed-in account.
