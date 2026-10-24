// Pay links with the amount filled in: the page's copy of Domain `PayLink` (ios/Packages/Domain/.../PayLink.swift).
// Both are checked against contracts/vectors/pay_links.json (site/pay/paylink.test.js here, a Domain test there), so
// the guest's page and the members' Pay screen always open the same link.
//   bunq.me  → https://bunq.me/<handle>/<12.34> with euros only: the share when the bill is EUR, else approx_minor when
//              approx_currency is EUR; nothing above 0 to ask → https://bunq.me/<handle>
//   PayPal.me (in the other link) → https://paypal.me/<name>/<amount><CUR> in the bill's currency
//   any other http(s) link → as typed (https:// added when there is no scheme)
(function (root) {
  'use strict';
  var ZERO = ['BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG', 'RWF', 'UGX', 'UYI', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'];
  var THREE = ['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'];

  function digits(currency) {
    var c = String(currency || '').toUpperCase();
    if (ZERO.indexOf(c) !== -1) return 0;
    if (THREE.indexOf(c) !== -1) return 3;
    return 2;
  }

  // 1234 EUR → "12.34", 1500 JPY → "1500", 1234 KWD → "1.234", 5 EUR → "0.05", -5 EUR → "-0.05".
  function amount(minor, currency) {
    var d = digits(currency), sign = minor < 0 ? '-' : '', mag = Math.abs(Math.trunc(minor));
    if (d === 0) return sign + String(mag);
    var scale = Math.pow(10, d), frac = String(mag % scale);
    while (frac.length < d) frac = '0' + frac;
    return sign + String(Math.floor(mag / scale)) + '.' + frac;
  }

  function bunqHandle(raw) {
    if (raw == null) return null;
    var s = String(raw).trim().toLowerCase();
    ['https://', 'http://', 'www.', 'bunq.me/', '@'].forEach(function (p) {
      if (s.indexOf(p) === 0) s = s.slice(p.length);
    });
    var slash = s.indexOf('/');
    if (slash !== -1) s = s.slice(0, slash);
    return /^[a-z0-9._-]{2,32}$/.test(s) ? s : null;
  }

  function isPayPalName(name) { return /^[A-Za-z0-9]{1,20}$/.test(name); }

  // {kind:'payPalMe', name} | {kind:'link', url} | null
  function linkMethod(raw) {
    if (raw == null) return null;
    var trimmed = String(raw).trim();
    var hasScheme = trimmed.indexOf('://') !== -1;
    var beforeSlash = trimmed.split('/')[0];
    if (!hasScheme && beforeSlash.indexOf(':') !== -1) return null;   // mailto:, javascript:
    var text = hasScheme ? trimmed : 'https://' + trimmed;
    var url;
    try { url = new URL(text); } catch (e) { return null; }
    var scheme = url.protocol.replace(':', '').toLowerCase();
    if (scheme !== 'https' && scheme !== 'http') return null;
    var host = url.hostname.toLowerCase();
    if (!host) return null;
    var name = url.pathname.split('/').filter(function (p) { return p.length > 0; })[0] || '';
    try { name = decodeURIComponent(name); } catch (e) { name = ''; }
    if ((host === 'paypal.me' || host === 'www.paypal.me') && isPayPalName(name)) return { kind: 'payPalMe', name: name };
    return { kind: 'link', url: text, host: host };
  }

  // The payer's methods, best first: bunq.me, then the other link. Blank or invalid entries are left out.
  function methods(bunqMe, otherLink) {
    var out = [], h = bunqHandle(bunqMe), l = linkMethod(otherLink);
    if (h) out.push({ kind: 'bunqMe', handle: h });
    if (l) out.push(l);
    return out;
  }

  // The euros bunq.me can ask for, or null.
  function euros(amountMinor, currency, approxMinor, approxCurrency) {
    if (String(currency).toUpperCase() === 'EUR') return amountMinor;
    if (approxCurrency && String(approxCurrency).toUpperCase() === 'EUR' && approxMinor != null) return approxMinor;
    return null;
  }

  function url(method, amountMinor, currency, approxMinor, approxCurrency) {
    switch (method.kind) {
      case 'bunqMe': {
        var h = bunqHandle(method.handle);
        if (!h) return null;
        var e = euros(amountMinor, currency, approxMinor, approxCurrency);
        if (e == null || e <= 0) return 'https://bunq.me/' + h;
        return 'https://bunq.me/' + h + '/' + amount(e, 'EUR');
      }
      case 'payPalMe':
        if (!isPayPalName(method.name)) return null;
        if (!(amountMinor > 0)) return 'https://paypal.me/' + method.name;
        return 'https://paypal.me/' + method.name + '/' + amount(amountMinor, currency) + String(currency).toUpperCase();
      case 'link':
        return method.url;
      default:
        return null;
    }
  }

  var api = { digits: digits, amount: amount, bunqHandle: bunqHandle, linkMethod: linkMethod, methods: methods,
    euros: euros, url: url };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SplitSmartPayLink = api;
})(typeof window !== 'undefined' ? window : this);
