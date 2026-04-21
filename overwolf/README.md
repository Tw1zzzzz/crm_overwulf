# Overwolf desktop package

This folder contains the Overwolf Native wrapper configuration. The CRM server remains an external backend/API layer; the packaged Overwolf app is only the desktop client.

## Build

1. Set the backend URL in `public/desktop-config.js` before packaging:

```js
window.CRMATLANT_DESKTOP_CONFIG = {
  apiBaseUrl: "https://your-crm-api.example.com"
};
```

2. Run:

```bash
npm run build:overwolf
```

3. Package the contents of `dist-overwolf` as an OPK according to Overwolf review rules.

For local unpacked development, the manifest uses `debug_url: "http://localhost:8080"` so the Overwolf client can point at the Vite dev server.
