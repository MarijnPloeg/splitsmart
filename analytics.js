// Cookieless visit counts with TelemetryDeck's web script (build 21, TELEMETRY.md §2; privacy page §3). The ONE place
// the App ID lives for the site. Loaded only on the static pages (home, privacy, terms, support): never on join/ or
// table/, whose URLs carry invite codes, group names and bill tokens (the web script sends the page URL).
// The same App ID as TELEMETRYDECK_APP_ID in scripts/app-config.env (not a secret). Empty = nothing is loaded or sent.
// The web script (WebSDK 1.1.0) takes no namespace (only data-app-id, data-is-test-mode, data-api): the app's
// TELEMETRYDECK_NAMESPACE applies to the iOS SDK only.
(function () {
  var TELEMETRYDECK_APP_ID = "8AAB1033-0F5A-41C4-B5CD-FB8B17435B30"; // data-app-id
  if (!TELEMETRYDECK_APP_ID) return;
  var script = document.createElement("script");
  script.src = "https://cdn.telemetrydeck.com/websdk/telemetrydeck.min.js";
  script.dataset.appId = TELEMETRYDECK_APP_ID;
  script.defer = true;
  document.head.appendChild(script);
})();
