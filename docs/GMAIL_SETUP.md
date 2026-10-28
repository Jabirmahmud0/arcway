# Connect Gmail

1. Open https://console.cloud.google.com/ and create or select a project.
2. In APIs & Services > Library, enable Gmail API.
3. Open Google Auth Platform. Configure Branding and Audience. For personal Gmail, choose External, leave the app in Testing, and add your Gmail address as a test user.
4. In Data Access, add `https://www.googleapis.com/auth/gmail.readonly`.
5. In Clients, create an OAuth client with type **Web application**. Add the exact authorized redirect URI:

```text
http://localhost:3001/api/integrations/gmail/callback
```

6. Add the client credentials to the server `.env`:

```dotenv
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:3001/api/integrations/gmail/callback
INTEGRATION_ENCRYPTION_KEY=64-hexadecimal-characters
INTEGRATION_TOKEN_DIR=.data/integrations
```

A random integration encryption key has already been saved in this workspace. Keep it. For a new installation, generate a key with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Changing the key requires reconnecting Gmail. Never expose these variables through VITE_.

7. Restart `npm run dev`. Sign in to ARCWAY, open **Integrations > Connect Gmail**, and complete Google's consent flow yourself. Clerk Google sign-in and Gmail mailbox access are separate permissions.
8. Select a destination Trade Twin and review the search. It defaults to the trade reference within the last 30 days. Click **Import matching emails**. Use **Import next batch** for additional matches.
9. Check **Trade Inbox**, source downloads, and the trade activity history. Repeat the import to verify duplicate skipping. Supported attachments are PDF, JPG, PNG, TXT, CSV, and XLSX up to 10 MB each (20 attachments and 30 MB total per batch). Download and upload an attachment into the correct document slot for AI extraction and required-document review.
10. Use **Disconnect** to remove local credentials and revoke the Google token. If Google is unavailable, ARCWAY removes local access and asks you to finish revocation in your Google Account's third-party connections.

Gmail access is read-only. Google's External apps in Testing generally receive refresh tokens lasting seven days for Gmail scopes, so reconnect when required. Public production apps using Gmail scopes may require Google verification. Set the callback to your exact HTTPS application URL before production use.

Official references:
- https://developers.google.com/workspace/gmail/api/quickstart/nodejs
- https://developers.google.com/identity/protocols/oauth2/web-server
