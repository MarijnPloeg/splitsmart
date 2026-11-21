// The guest pay page (build 26, board B26Pay): <site root>/pay/?c=<CODE>.
// Reads the code, asks guest_pay_page for this one guest's share and the payer's ways to be paid, shows them best
// first, and I'VE PAID (after one check, 0043) calls guest_says_paid; Undo on the thanks screen calls
// guest_undo_says_paid. Nothing is stored, nothing else is contacted.
// 0044: when the payer takes cards (stripe-pay code_guest quotes), the page leads with Apple Pay / Google Pay and "Pay by
// card" with the service fee shown, and the ways above fold behind "Other ways to pay" (I'VE PAID with them).
// Mock mode for screenshots and local checks: ?c=DEMO1234 (never a real code: D-E-M-O-1 has the O and 1 real codes
// leave out), with &demo=eur|said|paid|none|link|bad|error|nocard for the other states, &open=bank|other and
// &lang=nl|en|es|de. The demo card flow fakes Stripe (no key needed).
(function () {
  'use strict';
  var CONFIG = window.SPLITSMART_PAY_CONFIG || {};
  var PL = window.SplitSmartPayLink;
  var CP = window.SplitSmartCardPay;
  var q = new URLSearchParams(location.search);
  var code = (q.get('c') || '').trim().toUpperCase();
  var isDemo = code === 'DEMO1234';
  var demo = isDemo ? (q.get('demo') || '') : '';

  // ---------------------------------------------------------------- language (nl / en / es / de)
  // Spanish follows design/glossary-es.md (tú, neutral Spanish); German design/glossary-de.md (du, its guest pay page
  // terms word for word).
  var lang = (function () {
    var forced = (q.get('lang') || '').toLowerCase();
    if (forced === 'nl' || forced === 'en' || forced === 'es' || forced === 'de') return forced;
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    for (var i = 0; i < list.length; i++) {
      var l = String(list[i]).toLowerCase();
      if (l.indexOf('nl') === 0) return 'nl';
      if (l.indexOf('es') === 0) return 'es';
      if (l.indexOf('de') === 0) return 'de';
      if (l.indexOf('en') === 0) return 'en';
    }
    return 'en';
  })();
  document.documentElement.lang = lang;

  var T = {
    en: {
      title: 'Your share · SplitSmart',
      noApp: 'No app needed',
      paidAt: '{payer} paid at {merchant}',
      paidBill: '{payer} paid the bill',
      yourShare: 'your share',
      about: 'about {amount}',
      payLabel: 'Pay {payer}',
      bunqTitle: 'iDEAL | Wero, Apple Pay or card',
      fastest: 'Fastest',
      filledIn: '{amount} filled in',
      typeIn: 'Type in {amount}',
      bankTitle: 'Bank transfer',
      bankSub: 'IBAN and reference to copy',
      iban: 'IBAN',
      holder: 'Name',
      amount: 'Amount',
      reference: 'Reference',
      copy: 'Copy',
      copied: 'Copied',
      copyLabel: 'Copy {what}',
      qr: 'Scan with your banking app',
      qrLabel: 'Payment QR code for your banking app',
      paypal: 'PayPal',
      snapscan: 'SnapScan',
      revolut: 'Revolut',
      revolutSub: 'Opens Revolut · amount copied',
      linkTitle: 'Pay link',
      linkSub: '{host} · type in {amount}',
      noMethods: "{payer} hasn't added a way to pay here yet. Ask how they'd like it, then tap I've paid.",
      iPaid: "I've paid",
      sending: 'One moment…',
      sendFailed: "That didn't go through. Try again?",
      thanksTitle: 'Thanks, {guest}!',
      thanksTitleNoName: 'Thanks!',
      thanksSub: "{payer} gets a message and ticks it off when it's in.",
      paidTitle: 'All paid, thanks!',
      paidSub: '{payer} has ticked off your share of {merchant}.',
      paidSubNoMerchant: '{payer} has ticked off your share.',
      paidSubFull: '{payer} ticked off your {amount} for {merchant}',
      paidSubFullNoMerchant: '{payer} ticked off your {amount}',
      guestShare: "{guest}'s share",
      confirmQ: 'Sent {amount} to {payer}?',
      confirmQPlain: 'Paid {payer}?',
      confirmYes: "Yes, I've paid",
      confirmNo: 'Not yet',
      undo: 'Tapped that by mistake? Undo',
      cardBtn: 'Pay by card',
      otherWays: 'Other ways to pay',
      feeLine: '{share} + {fee} service fee · {total} in total',
      cardConfirm: 'Pay {amount}',
      walletShare: 'Your share · {merchant}',
      walletShareNoMerchant: 'Your share',
      walletFee: 'Service fee',
      payingTitle: 'Paying…',
      payingSub: 'Checking with your bank. This page updates by itself.',
      onItsWayTitle: 'Payment on its way',
      onItsWaySub: '{payer} sees it as soon as the bank confirms.',
      cardFailed: "The payment didn't go through. Try again, or pick another way.",
      cardChanged: "Your share changed. It's {amount} now.",
      stripeNote: 'Card payments by Stripe. SplitSmart never sees your card.',
      badTitle: "This link doesn't work",
      badSub: 'Ask the person who paid to send it again.',
      errorTitle: "Couldn't load this",
      errorSub: 'Check your connection and try again.',
      retry: 'Try again',
      never: 'SplitSmart never touches the money.',
      privacy: 'Privacy'
    },
    nl: {
      title: 'Jouw deel · SplitSmart',
      noApp: 'Geen app nodig',
      paidAt: '{payer} betaalde bij {merchant}',
      paidBill: '{payer} betaalde de rekening',
      yourShare: 'jouw deel',
      about: 'ongeveer {amount}',
      payLabel: 'Betaal {payer}',
      bunqTitle: 'iDEAL | Wero, Apple Pay of kaart',
      fastest: 'Snelst',
      filledIn: '{amount} al ingevuld',
      typeIn: 'Vul {amount} in',
      bankTitle: 'Overboeking',
      bankSub: 'IBAN en omschrijving om te kopiëren',
      iban: 'IBAN',
      holder: 'Naam',
      amount: 'Bedrag',
      reference: 'Omschrijving',
      copy: 'Kopieer',
      copied: 'Gekopieerd',
      copyLabel: 'Kopieer {what}',
      qr: 'Scan met je bank-app',
      qrLabel: 'Betaal-QR-code voor je bank-app',
      paypal: 'PayPal',
      snapscan: 'SnapScan',
      revolut: 'Revolut',
      revolutSub: 'Opent Revolut · bedrag gekopieerd',
      linkTitle: 'Betaallink',
      linkSub: '{host} · vul {amount} in',
      noMethods: '{payer} heeft hier nog geen manier om te betalen ingesteld. Vraag hoe het het makkelijkst is en tik daarna op Ik heb betaald.',
      iPaid: 'Ik heb betaald',
      sending: 'Even geduld…',
      sendFailed: 'Dat ging niet goed. Nog een keer?',
      thanksTitle: 'Dank je, {guest}!',
      thanksTitleNoName: 'Dank je!',
      thanksSub: '{payer} krijgt een berichtje en vinkt het af zodra het binnen is.',
      paidTitle: 'Helemaal betaald, dank je!',
      paidSub: '{payer} heeft jouw deel van {merchant} afgevinkt.',
      paidSubNoMerchant: '{payer} heeft jouw deel afgevinkt.',
      paidSubFull: '{payer} heeft je {amount} voor {merchant} afgevinkt',
      paidSubFullNoMerchant: '{payer} heeft je {amount} afgevinkt',
      guestShare: 'deel van {guest}',
      confirmQ: '{amount} naar {payer} gestuurd?',
      confirmQPlain: '{payer} betaald?',
      confirmYes: 'Ja, betaald',
      confirmNo: 'Nog niet',
      undo: 'Per ongeluk getikt? Ongedaan maken',
      cardBtn: 'Betaal met kaart',
      otherWays: 'Andere manieren om te betalen',
      feeLine: '{share} + {fee} servicekosten · {total} totaal',
      cardConfirm: 'Betaal {amount}',
      walletShare: 'Jouw deel · {merchant}',
      walletShareNoMerchant: 'Jouw deel',
      walletFee: 'Servicekosten',
      payingTitle: 'Betalen…',
      payingSub: 'We checken het bij je bank. Deze pagina werkt zichzelf bij.',
      onItsWayTitle: 'Betaling onderweg',
      onItsWaySub: '{payer} ziet het zodra de bank het bevestigt.',
      cardFailed: 'De betaling ging niet door. Probeer het nog eens, of kies een andere manier.',
      cardChanged: 'Je deel is veranderd. Het is nu {amount}.',
      stripeNote: 'Kaartbetalingen via Stripe. SplitSmart ziet je kaart nooit.',
      badTitle: 'Deze link werkt niet',
      badSub: 'Vraag degene die betaalde om hem opnieuw te sturen.',
      errorTitle: 'Dit lukte even niet',
      errorSub: 'Check je verbinding en probeer het opnieuw.',
      retry: 'Opnieuw',
      never: 'SplitSmart komt nooit aan het geld.',
      privacy: 'Privacy'
    },
    es: {
      title: 'Tu parte · SplitSmart',
      noApp: 'Sin app',
      paidAt: '{payer} pagó en {merchant}',
      paidBill: '{payer} pagó la cuenta',
      yourShare: 'tu parte',
      about: 'unos {amount}',
      payLabel: 'Paga a {payer}',
      bunqTitle: 'iDEAL | Wero, Apple Pay o tarjeta',
      fastest: 'Lo más rápido',
      filledIn: '{amount} ya puesto',
      typeIn: 'Escribe {amount}',
      bankTitle: 'Transferencia',
      bankSub: 'IBAN y concepto para copiar',
      iban: 'IBAN',
      holder: 'Titular',
      amount: 'Importe',
      reference: 'Concepto',
      copy: 'Copiar',
      copied: 'Copiado',
      copyLabel: 'Copiar {what}',
      qr: 'Escanéala con la app de tu banco',
      qrLabel: 'Código QR de pago para la app de tu banco',
      paypal: 'PayPal',
      snapscan: 'SnapScan',
      revolut: 'Revolut',
      revolutSub: 'Abre Revolut · importe copiado',
      linkTitle: 'Enlace de pago',
      linkSub: '{host} · escribe {amount}',
      noMethods: '{payer} todavía no tiene aquí una forma de pago. Pregúntale cómo lo prefiere y después toca Ya está pagado.',
      iPaid: 'Ya está pagado',
      sending: 'Un momento…',
      sendFailed: 'No se pudo enviar. ¿Lo intentamos otra vez?',
      thanksTitle: '¡Gracias, {guest}!',
      thanksTitleNoName: '¡Gracias!',
      thanksSub: '{payer} recibe un aviso y lo marca cuando le llegue.',
      paidTitle: 'Todo pagado, ¡gracias!',
      paidSub: '{payer} ya marcó tu parte de {merchant}.',
      paidSubNoMerchant: '{payer} ya marcó tu parte.',
      paidSubFull: '{payer} ya marcó tus {amount} de {merchant}',
      paidSubFullNoMerchant: '{payer} ya marcó tus {amount}',
      guestShare: 'parte de {guest}',
      confirmQ: '¿Enviaste {amount} a {payer}?',
      confirmQPlain: '¿Le pagaste a {payer}?',
      confirmYes: 'Sí, ya pagué',
      confirmNo: 'Todavía no',
      undo: '¿Lo tocaste sin querer? Deshacer',
      cardBtn: 'Pagar con tarjeta',
      otherWays: 'Otras formas de pagar',
      feeLine: '{share} + {fee} de gastos de servicio · {total} en total',
      cardConfirm: 'Pagar {amount}',
      walletShare: 'Tu parte · {merchant}',
      walletShareNoMerchant: 'Tu parte',
      walletFee: 'Gastos de servicio',
      payingTitle: 'Pagando…',
      payingSub: 'Lo estamos comprobando con tu banco. Esta página se actualiza sola.',
      onItsWayTitle: 'Pago en camino',
      onItsWaySub: '{payer} lo verá en cuanto el banco lo confirme.',
      cardFailed: 'El pago no se completó. Inténtalo otra vez o elige otra forma.',
      cardChanged: 'Tu parte cambió. Ahora es {amount}.',
      stripeNote: 'Pagos con tarjeta por Stripe. SplitSmart nunca ve tu tarjeta.',
      badTitle: 'Este enlace no funciona',
      badSub: 'Pide a quien pagó que te lo envíe otra vez.',
      errorTitle: 'No se pudo cargar',
      errorSub: 'Revisa tu conexión y vuelve a intentarlo.',
      retry: 'Reintentar',
      never: 'SplitSmart nunca toca el dinero.',
      privacy: 'Privacidad'
    },
    de: {
      title: 'Dein Anteil · SplitSmart',
      noApp: 'Ohne App',
      paidAt: '{payer} hat bei {merchant} gezahlt',
      paidBill: '{payer} hat die Rechnung gezahlt',
      yourShare: 'dein Anteil',
      about: 'etwa {amount}',
      payLabel: 'An {payer} zahlen',
      bunqTitle: 'iDEAL | Wero, Apple Pay oder Karte',
      fastest: 'Am schnellsten',
      filledIn: '{amount} schon eingetragen',
      typeIn: '{amount} eintippen',
      bankTitle: 'Überweisung',
      bankSub: 'IBAN und Verwendungszweck zum Kopieren',
      iban: 'IBAN',
      holder: 'Name',
      amount: 'Betrag',
      reference: 'Verwendungszweck',
      copy: 'Kopieren',
      copied: 'Kopiert',
      copyLabel: '{what} kopieren',
      qr: 'Scanne ihn mit deiner Banking-App',
      qrLabel: 'QR-Code zum Bezahlen mit deiner Banking-App',
      paypal: 'PayPal',
      snapscan: 'SnapScan',
      revolut: 'Revolut',
      revolutSub: 'Öffnet Revolut · Betrag kopiert',
      linkTitle: 'Zahlungslink',
      linkSub: '{host} · {amount} eintippen',
      noMethods: '{payer} hat hier noch keine Zahlungsart eingerichtet. Frag, wie es am einfachsten geht, und tippe danach auf Ich habe bezahlt.',
      iPaid: 'Ich habe bezahlt',
      sending: 'Einen Moment …',
      sendFailed: 'Das hat nicht geklappt. Noch mal versuchen?',
      thanksTitle: 'Danke, {guest}!',
      thanksTitleNoName: 'Danke!',
      thanksSub: '{payer} bekommt eine Nachricht und hakt es ab, sobald es da ist.',
      paidTitle: 'Alles bezahlt, danke!',
      paidSub: '{payer} hat deinen Anteil an {merchant} abgehakt.',
      paidSubNoMerchant: '{payer} hat deinen Anteil abgehakt.',
      paidSubFull: '{payer} hat deine {amount} für {merchant} abgehakt',
      paidSubFullNoMerchant: '{payer} hat deine {amount} abgehakt',
      guestShare: 'Anteil von {guest}',
      confirmQ: '{amount} an {payer} geschickt?',
      confirmQPlain: '{payer} bezahlt?',
      confirmYes: 'Ja, bezahlt',
      confirmNo: 'Noch nicht',
      undo: 'Aus Versehen getippt? Rückgängig',
      cardBtn: 'Mit Karte zahlen',
      otherWays: 'Andere Zahlungswege',
      feeLine: '{share} + {fee} Servicegebühr · {total} gesamt',
      cardConfirm: '{amount} zahlen',
      walletShare: 'Dein Anteil · {merchant}',
      walletShareNoMerchant: 'Dein Anteil',
      walletFee: 'Servicegebühr',
      payingTitle: 'Wird gezahlt…',
      payingSub: 'Wir prüfen es bei deiner Bank. Diese Seite aktualisiert sich selbst.',
      onItsWayTitle: 'Zahlung unterwegs',
      onItsWaySub: '{payer} sieht es, sobald die Bank bestätigt.',
      cardFailed: 'Die Zahlung hat nicht geklappt. Versuch es noch mal oder wähle einen anderen Weg.',
      cardChanged: 'Dein Anteil hat sich geändert. Jetzt sind es {amount}.',
      stripeNote: 'Kartenzahlungen über Stripe. SplitSmart sieht deine Karte nie.',
      badTitle: 'Dieser Link funktioniert nicht',
      badSub: 'Frag die Person, die gezahlt hat, ob sie ihn noch mal schickt.',
      errorTitle: 'Das ließ sich nicht laden',
      errorSub: 'Prüfe deine Verbindung und versuche es noch mal.',
      retry: 'Erneut versuchen',
      never: 'SplitSmart hat nie Zugriff auf dein Geld.',
      privacy: 'Datenschutz'
    }
  }[lang];

  function t(key, vars) {
    return String(T[key]).replace(/\{(\w+)\}/g, function (_, k) { return vars && vars[k] != null ? vars[k] : ''; });
  }
  document.title = T.title;
  Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (el) { el.textContent = t(el.dataset.t); });

  // ---------------------------------------------------------------- formatting
  var locale = lang === 'nl' ? 'nl-NL' : lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : 'en-GB';
  // Like the app: symbol, a space after a letter symbol ("R 140.00"), the currency's own digits. es, de: "140,00 R",
  // "1.234,56 €" (grouping always, like the app; es-ES leaves four digits ungrouped by default).
  function money(minor, currency) {
    var d = PL.digits(currency);
    var value = minor / Math.pow(10, d);
    var parts;
    try {
      parts = new Intl.NumberFormat(locale, { style: 'currency', currency: currency, currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: lang === 'es' || lang === 'de' ? 'always' : true }).formatToParts(value);
    } catch (e) {
      return currency + ' ' + PL.amount(minor, currency);
    }
    var out = '';
    parts.forEach(function (p, i) {
      out += p.value;
      var next = parts[i + 1];
      if (p.type === 'currency' && /[A-Za-z]$/.test(p.value) && next && next.type !== 'literal') out += ' ';
    });
    return out;
  }
  // A plain amount for a bank app's amount field: "7,25" (nl, es, de) / "7.25" (en), no symbol, no grouping.
  function plainAmount(minor, currency) {
    var s = PL.amount(minor, currency);
    return lang === 'en' ? s : s.replace('.', ',');
  }
  function shortDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    if (!m) return '';
    var dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
    var opts = { day: 'numeric', month: 'short', timeZone: 'UTC' };
    if (+m[1] !== new Date().getFullYear()) opts.year = 'numeric';
    return new Intl.DateTimeFormat(locale, opts).format(dt);
  }
  function ibanGroups(iban) { return String(iban).replace(/\s+/g, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim(); }

  // ---------------------------------------------------------------- data
  var DEMO = {
    payer_name: 'Marijn', merchant: 'Tally ho farm', bill_date: new Date().toISOString().slice(0, 10), guest_name: 'Rens',
    share_minor: 14000, currency: 'ZAR', approx_minor: 725, approx_currency: 'EUR', paid: false, said_paid: false,
    payout: { bunq_me: 'marijnploeg', iban: 'NL91ABNA0417164300', account_holder: 'M. Ploeg', other_link: 'paypal.me/MarijnPloeg', revolut: 'marijn', snapscan: 'C9ufHzUb' }
  };
  var demoCardPaid = false;
  function demoData() {
    var d = JSON.parse(JSON.stringify(DEMO));
    if (demo === 'eur') { d.merchant = 'Café de Zwaan'; d.share_minor = 2450; d.currency = 'EUR'; d.approx_minor = null; d.approx_currency = null; }
    if (demo === 'said') d.said_paid = true;
    if (demo === 'paid') { d.paid = true; d.payout = null; }
    if (demo === 'none') d.payout = null;
    if (demo === 'link') d.payout = { bunq_me: null, iban: null, account_holder: null, other_link: 'https://tikkie.me/pay/SplitSmart/abc123' };
    return d;
  }

  // stripe-pay (0044): POST /functions/v1/stripe-pay; a refusal throws {code, data} (cardpay.js reads code / data).
  function stripePay(body) {
    if (isDemo) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          if (demo === 'nocard' || demo === 'error' || demo === 'bad') { var e = new Error('no_card_account'); e.code = 'no_card_account'; return reject(e); }
          var d = demoData(), fee = d.currency === 'EUR' ? 149 : 1500;
          if (body.quote_only) return resolve({ share_cents: d.share_minor, fee_cents: fee, total_cents: d.share_minor + fee, currency: d.currency,
            payment_method_types: ['card'] });
          resolve({ payment_id: 'demo', client_secret: 'demo_secret', share_cents: d.share_minor, fee_cents: fee,
            total_cents: d.share_minor + fee, currency: d.currency, existing: false, status: 'processing',
            return_url: location.pathname + '?c=DEMO1234&paid=demo' });
        }, 250);
      });
    }
    var base = String(CONFIG.supabaseUrl || '').replace(/\/+$/, '');
    var key = CONFIG.supabaseAnonKey || '';
    if (!base || !key) return Promise.reject(Object.assign(new Error('not configured'), { code: 'not_configured' }));
    return fetch(base + '/functions/v1/stripe-pay', {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer'
    }).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (data) {
        if (r.ok) return data;
        var e = new Error('stripe-pay ' + r.status);
        e.code = data && data.error ? String(data.error) : 'http_' + r.status;
        e.data = data;
        throw e;
      });
    }, function () { throw Object.assign(new Error('network'), { code: 'network' }); });
  }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16); crypto.getRandomValues(b);
    b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  function rpc(name) {
    if (isDemo) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          if (demo === 'error') return reject(new Error('demo'));
          if (demo === 'bad') return resolve(null);
          var d = demoData();
          if (name === 'guest_says_paid') d.said_paid = true;
          if (name === 'guest_undo_says_paid') d.said_paid = false;
          if (name === 'guest_pay_page' && demoCardPaid) { d.paid = true; d.payout = null; }
          resolve(d);
        }, 250);
      });
    }
    var base = String(CONFIG.supabaseUrl || '').replace(/\/+$/, '');
    var key = CONFIG.supabaseAnonKey || '';
    if (!base || !key) return Promise.reject(new Error('not configured'));
    return fetch(base + '/rest/v1/rpc/' + name, {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ p_code: code }),
      credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer'
    }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    });
  }

  // ---------------------------------------------------------------- rendering
  var main = document.getElementById('main');
  var $ = function (id) { return document.getElementById(id); };
  var payParts = [$('pay'), $('payLabel'), $('methods'), $('paid')];
  var current = null;   // the page as last loaded (the check before I'VE PAID names the amount)

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function svgIcon(paths) {
    var ns = 'http://www.w3.org/2000/svg', s = document.createElementNS(ns, 'svg');
    s.setAttribute('width', '18'); s.setAttribute('height', '18'); s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('fill', 'none'); s.setAttribute('stroke-width', '2.2'); s.setAttribute('stroke-linecap', 'round');
    s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
    paths.forEach(function (d) { var p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); s.appendChild(p); });
    return s;
  }
  function methodCard(opts) {
    var card = el(opts.href ? 'a' : 'button', 'method');
    if (opts.href) { card.href = opts.href; card.target = '_blank'; card.rel = 'noopener noreferrer'; } else card.type = 'button';
    var icon = el('div', 'icon');
    if (opts.iconText) icon.textContent = opts.iconText; else icon.appendChild(opts.icon);
    icon.setAttribute('aria-hidden', 'true');
    var body = el('div', 'body'), title = el('div', 'title');
    title.appendChild(el('b', null, opts.title));
    if (opts.badge) title.appendChild(el('span', 'badge', opts.badge));
    body.appendChild(title);
    body.appendChild(el('div', 'sub', opts.sub));
    card.appendChild(icon); card.appendChild(body);
    var chev = el('span', 'chev', '›'); chev.setAttribute('aria-hidden', 'true'); card.appendChild(chev);
    return card;
  }
  function copyRow(label, shown, value) {
    var row = el('div', 'row'), kv = el('div', 'kv');
    kv.appendChild(el('span', 'k', label));
    kv.appendChild(el('span', 'v', shown));
    row.appendChild(kv);
    var btn = el('button', 'copy', T.copy);
    btn.type = 'button';
    btn.setAttribute('aria-label', t('copyLabel', { what: label }));
    btn.addEventListener('click', function () {
      var done = function () {
        btn.textContent = T.copied; btn.classList.add('done');
        setTimeout(function () { btn.textContent = T.copy; btn.classList.remove('done'); }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(done, function () {});
    });
    row.appendChild(btn);
    return row;
  }

  function renderPay(d) {
    var payer = d.payer_name || '';
    var date = shortDate(d.bill_date);
    var who = d.merchant ? t('paidAt', { payer: payer, merchant: d.merchant }) : t('paidBill', { payer: payer });
    $('who').textContent = date ? who + ' · ' + date : who;
    $('amount').textContent = money(d.share_minor, d.currency);
    var hasApprox = d.approx_minor != null && d.approx_currency && d.approx_currency !== d.currency;
    // 0043: whose share this is, so someone holding another person's link notices.
    var whose = d.guest_name ? t('guestShare', { guest: d.guest_name }) : T.yourShare;
    $('share').textContent = hasApprox ? whose + ' · ' + t('about', { amount: money(d.approx_minor, d.approx_currency) }) : whose;
    $('payLabel').textContent = t('payLabel', { payer: payer });

    var box = $('methods');
    box.textContent = '';
    var p = d.payout || {};
    var share = money(d.share_minor, d.currency);
    var eur = PL.euros(d.share_minor, d.currency, d.approx_minor, d.approx_currency);
    var methods = PL.methods(p.bunq_me, p.other_link, { paypal: p.paypal, revolut: p.revolut, snapscan: p.snapscan }, d.currency);
    var bunq = methods.filter(function (m) { return m.kind === 'bunqMe'; })[0];
    var other = methods.filter(function (m) { return m.kind === 'payPalMe' || m.kind === 'link'; })[0];
    var snap = methods.filter(function (m) { return m.kind === 'snapScan'; })[0];
    var revolut = methods.filter(function (m) { return m.kind === 'revolut'; })[0];
    var any = false;

    if (snap) {
      any = true;
      box.appendChild(methodCard({ href: PL.url(snap, d.share_minor, d.currency, d.approx_minor, d.approx_currency, 'SS-' + code),
        iconText: 'SS', title: T.snapscan, sub: t('filledIn', { amount: share }) }));
    }
    if (revolut) {
      any = true;
      var revCard = methodCard({ href: PL.url(revolut, d.share_minor, d.currency), iconText: 'R', title: T.revolut, sub: T.revolutSub });
      // The link can't carry the amount: it is copied when the card is tapped.
      revCard.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(plainAmount(d.share_minor, d.currency)).catch(function () {});
      });
      box.appendChild(revCard);
    }
    if (bunq) {
      any = true;
      var filled = eur != null && eur > 0;
      box.appendChild(methodCard({
        href: PL.url(bunq, d.share_minor, d.currency, d.approx_minor, d.approx_currency),
        iconText: 'bunq', title: T.bunqTitle, badge: T.fastest,
        sub: filled ? t('filledIn', { amount: money(eur, 'EUR') }) : t('typeIn', { amount: share })
      }));
    }
    if (p.iban) {
      any = true;
      var bankCard = methodCard({
        icon: svgIcon(['M3 10l9-6 9 6', 'M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18']), title: T.bankTitle, sub: T.bankSub
      });
      var panel = el('div', 'bank');
      panel.id = 'bankPanel'; panel.hidden = true;
      bankCard.setAttribute('aria-expanded', 'false');
      bankCard.setAttribute('aria-controls', 'bankPanel');
      var iban = String(p.iban).replace(/[\s\x00-\x1f\x7f]+/g, '').toUpperCase();
      var holder = PL.collapse(p.account_holder);
      var amountMinor = eur != null && eur > 0 ? eur : d.share_minor;
      var amountCurrency = eur != null && eur > 0 ? 'EUR' : d.currency;
      var reference = 'SplitSmart ' + code;
      panel.appendChild(copyRow(T.iban, ibanGroups(iban), iban));
      if (holder) panel.appendChild(copyRow(T.holder, holder, holder));
      panel.appendChild(copyRow(T.amount, money(amountMinor, amountCurrency), plainAmount(amountMinor, amountCurrency)));
      panel.appendChild(copyRow(T.reference, reference, reference));
      // EPC069-12 "SEPA credit transfer" QR: EUR only, needs the holder's name; shown on wide screens only (CSS).
      // L9: PL.epcPayload collapses control characters in the name, IBAN and reference (as Domain EPCQR), so no field
      // can add lines; null (no QR) when the name is blank, the IBAN malformed or the amount out of range.
      var payload = amountCurrency === 'EUR' ? PL.epcPayload(holder, iban, amountMinor, reference) : null;
      if (payload && window.SplitSmartQR) {
        var qr = el('div', 'qr ok'), qrCode = el('div', 'code');
        try {
          qrCode.innerHTML = window.SplitSmartQR.svg(payload, T.qrLabel);
          qr.appendChild(qrCode);
          qr.appendChild(el('small', null, T.qr));
          panel.appendChild(qr);
        } catch (e) { /* no QR, the fields are enough */ }
      }
      bankCard.addEventListener('click', function () {
        var open = panel.hidden;
        panel.hidden = !open;
        bankCard.classList.toggle('open', open);
        bankCard.setAttribute('aria-expanded', String(open));
      });
      box.appendChild(bankCard);
      box.appendChild(panel);
      if (isDemo && q.get('open') === 'bank') bankCard.click();
    }
    if (other) {
      any = true;
      var otherUrl = PL.url(other, d.share_minor, d.currency, d.approx_minor, d.approx_currency);
      if (other.kind === 'payPalMe') {
        box.appendChild(methodCard({ href: otherUrl, iconText: 'PP', title: T.paypal,
          sub: d.share_minor > 0 ? t('filledIn', { amount: (PL.payPalCurrencies.indexOf(String(d.currency).toUpperCase()) === -1 && hasApprox ? money(d.approx_minor, d.approx_currency) : share) }) : '' }));
      } else {
        box.appendChild(methodCard({ href: otherUrl,
          icon: svgIcon(['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1']),
          title: T.linkTitle, sub: t('linkSub', { host: other.host.replace(/^www\./, ''), amount: share }) }));
      }
    }
    if (!any) box.appendChild(el('p', 'note', t('noMethods', { payer: payer })));
    $('payLabel').hidden = !any;
  }

  function showState(kind, d) {
    payParts.forEach(function (e) { e.hidden = true; });
    $('paidError').hidden = true;
    $('state').hidden = false;
    var payer = (d && d.payer_name) || '';
    $('confirm').hidden = true;
    $('card').hidden = true;
    $('stateTick').hidden = !(kind === 'thanks' || kind === 'paid' || kind === 'onitsway');
    $('retry').hidden = kind !== 'error';
    $('undo').hidden = kind !== 'thanks';
    if (kind === 'thanks') {
      $('stateTitle').textContent = d.guest_name ? t('thanksTitle', { guest: d.guest_name }) : T.thanksTitleNoName;
      $('stateSub').textContent = t('thanksSub', { payer: payer });
    } else if (kind === 'paid') {
      $('stateTitle').textContent = T.paidTitle;
      // 0043: which share and when, so a guest can tell this is their bill and not another one.
      if (d.share_minor > 0 && d.currency) {
        var vars = { payer: payer, amount: money(d.share_minor, d.currency), merchant: d.merchant };
        var sub = d.merchant ? t('paidSubFull', vars) : t('paidSubFullNoMerchant', vars);
        var day = shortDate(d.bill_date);
        $('stateSub').textContent = day ? sub + ' · ' + day : sub + '.';
      } else {
        $('stateSub').textContent = d.merchant ? t('paidSub', { payer: payer, merchant: d.merchant }) : t('paidSubNoMerchant', { payer: payer });
      }
    } else if (kind === 'paying') {
      $('stateTitle').textContent = T.payingTitle;
      $('stateSub').textContent = T.payingSub;
    } else if (kind === 'onitsway') {
      $('stateTitle').textContent = T.onItsWayTitle;
      $('stateSub').textContent = t('onItsWaySub', { payer: payer });
    } else if (kind === 'bad') {
      $('stateTitle').textContent = T.badTitle;
      $('stateSub').textContent = T.badSub;
    } else {
      $('stateTitle').textContent = T.errorTitle;
      $('stateSub').textContent = T.errorSub;
    }
  }

  function render(d) {
    main.classList.remove('loading');
    main.removeAttribute('aria-busy');
    if (!d || typeof d !== 'object') return showState('bad');
    current = d;
    if (d.paid) return showState('paid', d);
    if (d.said_paid) return showState('thanks', d);
    $('state').hidden = true;
    $('confirm').hidden = true;
    payParts.forEach(function (e) { e.hidden = false; });
    renderPay(d);
    applyCard(d);
  }

  // ---------------------------------------------------------------- card with the service fee (0044)
  var cardOn = !!CP && (!!CONFIG.stripePublishableKey || isDemo);
  var cardPay = cardOn ? CP.create({ code: code, uuid: uuid, post: stripePay }) : null;
  var cardState = 'idle';          // idle | quoting | card | classic
  var cardQuote = null;            // the server's {share_cents, fee_cents, total_cents, currency}
  var cardFor = null;              // the page data the quote was made for
  var showOther = isDemo && q.get('open') === 'other';
  var pendingError = null;
  var stripe = null, elements = null, express = null, paymentEl = null, stripeLoading = null, walletReady = false;

  // The classic page (the other ways + I'VE PAID) and, in card mode, which of it shows.
  function otherParts(visible) {
    $('methods').hidden = !visible;
    $('paid').hidden = !visible;
    $('payLabel').hidden = !visible || !$('methods').children.length;
  }

  function applyCard(d) {
    if (!cardPay || cardState === 'classic') { $('card').hidden = true; otherParts(true); return; }
    cardFor = d;
    if (cardState === 'card' && cardQuote && cardQuote.share_cents === d.share_minor && cardQuote.currency === d.currency) {
      return cardMode();
    }
    cardState = 'quoting';
    $('card').hidden = false;
    $('card').classList.add('loading');
    Array.prototype.forEach.call($('card').children, function (c) { c.hidden = true; });
    otherParts(false);
    var settled = false;
    var giveUp = setTimeout(function () { if (!settled) { settled = true; cardState = 'classic'; applyCard(d); } }, 8000);
    cardPay.quote().then(function (qt) {
      if (settled) return;
      settled = true; clearTimeout(giveUp);
      // Only a quote for exactly the share on the page is shown; anything else: the other ways, as before.
      if (!qt || qt.share_cents !== d.share_minor || qt.currency !== d.currency) { cardState = 'classic'; return applyCard(d); }
      cardQuote = qt;
      cardState = 'card';
      cardMode();
    });
  }

  function cardMode() {
    var qt = cardQuote, card = $('card');
    card.classList.remove('loading');
    card.hidden = false;
    $('ece').hidden = false;
    $('cardBtn').hidden = !$('cardPanel').hidden;
    $('feeLine').hidden = false;
    $('feeLine').textContent = t('feeLine', { share: money(qt.share_cents, qt.currency), fee: money(qt.fee_cents, qt.currency),
      total: money(qt.total_cents, qt.currency) });
    $('cardConfirm').textContent = t('cardConfirm', { amount: money(qt.total_cents, qt.currency) });
    $('cardError').hidden = !pendingError;
    if (pendingError) { $('cardError').textContent = pendingError; pendingError = null; }
    $('otherWays').hidden = showOther;
    otherParts(showOther);
    $('never').textContent = T.stripeNote;
    styleCardButton();
    mountExpress();
  }

  // With Apple Pay / Google Pay on this device the wallet button leads and "Pay by card" is the quieter one.
  function styleCardButton() {
    var b = $('cardBtn');
    b.classList.toggle('primary', !walletReady);
    b.classList.toggle('secondary', walletReady);
  }

  function loadStripe() {
    if (isDemo || !CONFIG.stripePublishableKey) return Promise.reject(new Error('no stripe'));
    if (stripe) return Promise.resolve(stripe);
    if (stripeLoading) return stripeLoading;
    stripeLoading = new Promise(function (resolve, reject) {
      var sc = document.createElement('script');
      sc.src = 'https://js.stripe.com/v3/';
      sc.onload = function () {
        try { stripe = window.Stripe(CONFIG.stripePublishableKey, { locale: lang }); resolve(stripe); } catch (e) { reject(e); }
      };
      sc.onerror = function () { stripeLoading = null; reject(new Error('stripe')); };
      document.head.appendChild(sc);
    });
    return stripeLoading;
  }
  function appearance() {
    var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return { theme: dark ? 'night' : 'stripe', variables: { colorPrimary: dark ? '#3D7BFF' : '#0055D4', borderRadius: '14px' } };
  }
  function ensureElements() {
    var qt = cardQuote;
    return loadStripe().then(function () {
      var currency = String(qt.currency).toLowerCase();
      if (!elements) {
        elements = stripe.elements({ appearance: appearance(), locale: lang, mode: 'payment', amount: qt.total_cents,
          currency: currency, paymentMethodTypes: qt.methods });
      } else {
        elements.update({ amount: qt.total_cents, currency: currency });
      }
      return elements;
    });
  }
  function mountExpress() {
    if (express || isDemo) return;
    ensureElements().then(function () {
      if (express) return;
      express = elements.create('expressCheckout', {
        buttonHeight: 55, buttonType: { applePay: 'plain', googlePay: 'plain' },
        paymentMethods: { applePay: 'auto', googlePay: 'auto', link: 'never', paypal: 'never', amazonPay: 'never', klarna: 'never' }
      });
      express.on('ready', function (ev) {
        var m = ev && ev.availablePaymentMethods;
        walletReady = !!(m && (m.applePay || m.googlePay));
        styleCardButton();
      });
      express.on('click', function (ev) {
        var qt = cardQuote, d = cardFor || {};
        if (!qt) return;
        ev.resolve({ lineItems: [
          { name: d.merchant ? t('walletShare', { merchant: d.merchant }) : T.walletShareNoMerchant, amount: qt.share_cents },
          { name: T.walletFee, amount: qt.fee_cents }] });
      });
      express.on('confirm', function (ev) { confirmFlow(ev); });
      express.mount('#ece');
    }, function () { /* no Stripe: "Pay by card" stays and says so when tapped */ });
  }

  function cardError(msg) {
    $('cardError').textContent = msg;
    $('cardError').hidden = false;
  }

  // One confirm path for the wallet sheet (ev) and the card / iDEAL panel (no ev).
  function confirmFlow(ev) {
    var shown = cardQuote;
    var fail = function (msg) {
      if (ev && ev.paymentFailed) ev.paymentFailed({ reason: 'fail' });
      cardError(msg);
    };
    $('cardError').hidden = true;
    if (isDemo) {
      return cardPay.start(shown).then(function () { demoCardPaid = true; afterPaid(); });
    }
    return elements.submit().then(function (r) {
      if (r && r.error) { if (ev && ev.paymentFailed) ev.paymentFailed({ reason: 'fail' }); return null; }
      return cardPay.start(shown);
    }).then(function (res) {
      if (!res) return;
      if (res.changed) {
        // Never charge an amount that wasn't shown: re-read the page, which asks for a new quote.
        if (ev && ev.paymentFailed) ev.paymentFailed({ reason: 'fail' });
        pendingError = res.share_cents != null ? t('cardChanged', { amount: money(res.share_cents, shown.currency) }) : T.cardFailed;
        cardQuote = null; cardState = 'idle';
        return load();
      }
      if (res.failed) {
        if (res.failed === 'already_paid') { if (ev && ev.paymentFailed) ev.paymentFailed({ reason: 'fail' }); return load(); }
        return fail(T.cardFailed);
      }
      if (res.done) return afterPaid();
      var p = res.payment;
      return stripe.confirmPayment({ elements: elements, clientSecret: p.client_secret,
        confirmParams: { return_url: p.return_url }, redirect: 'if_required' }).then(function (out) {
        if (out.error) return fail(out.error.message || T.cardFailed);
        cardPay.reset();
        afterPaid();
      });
    }).catch(function () { fail(T.cardFailed); });
  }

  // Paid at Stripe: the webhook marks the guest paid in a few seconds. Until then "Paying…", then the page itself.
  function afterPaid() {
    showState('paying');
    var tries = 0;
    (function poll() {
      tries++;
      rpc('guest_pay_page').then(function (d) {
        if (d && d.paid) return render(d);
        if (tries >= 15) return showState('onitsway', d || current);
        setTimeout(poll, 2000);
      }, function () {
        if (tries >= 15) return showState('onitsway', current);
        setTimeout(poll, 2000);
      });
    })();
  }

  function openCardPanel() {
    $('cardError').hidden = true;
    if (isDemo) { $('cardPanel').hidden = false; $('cardBtn').hidden = true; return; }
    ensureElements().then(function () {
      if (!paymentEl) {
        paymentEl = elements.create('payment', { layout: 'tabs',
          paymentMethodOrder: cardQuote.methods.indexOf('ideal') !== -1 ? ['ideal', 'card'] : ['card'],
          wallets: { applePay: 'never', googlePay: 'never' } });
        paymentEl.mount('#pe');
      }
      $('cardPanel').hidden = false;
      $('cardBtn').hidden = true;
    }, function () { cardError(T.cardFailed); });
  }

  function load() {
    main.classList.add('loading');
    rpc('guest_pay_page').then(render, function () {
      main.classList.remove('loading');
      main.removeAttribute('aria-busy');
      showState('error');
    });
  }

  // 0043: I'VE PAID asks once ("Sent R 219.71 to Marijn?"); only YES tells the payer.
  $('paid').addEventListener('click', function () {
    var d = current || {};
    $('confirmQ').textContent = d.share_minor > 0 && d.currency
      ? t('confirmQ', { amount: money(d.share_minor, d.currency), payer: d.payer_name || '' })
      : t('confirmQPlain', { payer: d.payer_name || '' });
    $('paid').hidden = true;
    $('paidError').hidden = true;
    $('confirm').hidden = false;
    $('confirmYes').focus();
  });
  $('confirmNo').addEventListener('click', function () {
    $('confirm').hidden = true;
    $('paid').hidden = false;
    $('paid').focus();
  });
  $('confirmYes').addEventListener('click', function () {
    var yes = $('confirmYes'), no = $('confirmNo');
    yes.disabled = true; no.disabled = true;
    yes.textContent = T.sending;
    $('paidError').hidden = true;
    rpc('guest_says_paid').then(function (d) {
      yes.disabled = false; no.disabled = false; yes.textContent = T.confirmYes;
      render(d);
    }, function () {
      yes.disabled = false; no.disabled = false; yes.textContent = T.confirmYes;
      $('paidError').textContent = T.sendFailed;
      $('paidError').hidden = false;
    });
  });
  // 0043: taking back "I've paid" while the payer hasn't ticked it off.
  $('undo').addEventListener('click', function () {
    var btn = $('undo');
    btn.disabled = true;
    rpc('guest_undo_says_paid').then(function (d) {
      btn.disabled = false;
      render(d);
    }, function () {
      btn.disabled = false;
      $('stateSub').textContent = T.sendFailed;
    });
  });
  $('retry').addEventListener('click', load);
  $('cardBtn').addEventListener('click', function () { if (cardQuote) openCardPanel(); });
  $('cardConfirm').addEventListener('click', function () {
    var b = $('cardConfirm');
    if (b.disabled || !cardQuote) return;
    b.disabled = true;
    var done = function () { b.disabled = false; };
    Promise.resolve(confirmFlow(null)).then(done, done);
  });
  $('otherWays').addEventListener('click', function () {
    showOther = true;
    $('otherWays').hidden = true;
    otherParts(true);
    $('payLabel').scrollIntoView && $('payLabel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  if (!isDemo && !PL.isPayCode(code)) {
    render(null);
    return;
  }
  // Back from iDEAL / 3-D Secure (0044): wait for the webhook unless the bank said no.
  var back = CP ? CP.returnState(location.search) : null;
  if (back && back.status !== 'failed') {
    main.classList.remove('loading');
    main.removeAttribute('aria-busy');
    afterPaid();
    return;
  }
  if (back) pendingError = T.cardFailed;
  load();
})();
