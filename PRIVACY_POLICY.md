# Privacy Policy

**Qwik DevTools** does not collect, store, transmit, or share any user data.

## What the extension does

- Reads the DOM of the currently inspected page to extract Qwik component data (attributes, serialized state, routes, assets)
- Executes read-only scripts in the inspected page context via `chrome.devtools.inspectedWindow.eval()` to display live DOM values
- All processing happens locally in your browser

## What the extension does NOT do

- No data is sent to any external server or third-party service
- No analytics, telemetry, or tracking of any kind
- No cookies, local storage, or persistent data beyond the current DevTools session
- No user accounts or authentication
- No network requests other than those made by the inspected page itself

## Permissions

- **`tabs`** — Required to detect page navigation and relay messages between the content script and the DevTools panel

## Contact

If you have questions about this privacy policy, open an issue on the [GitHub repository](https://github.com/Aejkatappaja/qwik-devtools).
