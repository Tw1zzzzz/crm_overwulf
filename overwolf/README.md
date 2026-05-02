# Overwolf desktop package

This folder contains the Overwolf Native wrapper configuration. The CRM server remains an external backend/API layer; the packaged Overwolf app is only the desktop client.

## Local build

Run a local Overwolf build against the default local API:

```bash
npm run build:overwolf
```

This writes `dist-overwolf` and is useful for unpacked development.

## QA submission build

Build and package the OPK with a production or staging HTTPS API URL:

```bash
OVERWOLF_API_BASE_URL="https://your-crm-api.example.com" npm run build:overwolf:qa
```

The QA build refuses `localhost`, `127.0.0.1`, and non-HTTPS API URLs. It creates:

- `overwolf/release/crm-atlant-desktop-0.1.0-qa.opk`
- `overwolf/release/crm-atlant-desktop-0.1.0-qa-report.md`

## Manual config fallback

For one-off local checks, `public/desktop-config.js` can still be edited before packaging:

```js
window.CRMATLANT_DESKTOP_CONFIG = {
  apiBaseUrl: "https://your-crm-api.example.com"
};
```

## Validation

```bash
npm run overwolf:validate
```

For sendable QA validation, run:

```bash
npm run overwolf:package
```

This validates the root OPK structure, `desktop-config.js`, manifest metadata, referenced windows, and icon files before creating the archive.
