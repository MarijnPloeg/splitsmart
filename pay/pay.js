// The guest pay page (build 26, board B26Pay): <site root>/pay/?c=<CODE>.
// Reads the code, asks guest_pay_page for this one guest's share and the payer's ways to be paid, shows them best
// first, and I'VE PAID calls guest_says_paid. Nothing is stored, nothing else is contacted.
// Mock mode for screenshots and local checks: ?c=DEMO1234 (never a real code: D-E-M-O-1 has the O and 1 real codes
// leave out), with &demo=eur|said|paid|none|link|bad|error for the other states, &open=bank and &lang=nl|en.
(function () {
  'use strict';
  var CONFIG = window.SPLITSMART_PAY_CONFIG || {};
  var PL = window.SplitSmartPayLink;
  var q = new URLSearchParams(location.search);
  var code = (q.get('c') || '').trim().toUpperCase();
  var isDemo = code === 'DEMO1234';
  var demo = isDemo ? (q.get('demo') || '') : '';

  // ---------------------------------------------------------------- language (nl / en)
  var lang = (function () {
    var forced = (q.get('lang') || '').toLowerCase();
    if (forced === 'nl' || forced === 'en') return forced;
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    for (var i = 0; i < list.length; i++) {
      var l = String(list[i]).toLowerCase();
      if (l.indexOf('nl') === 0) return 'nl';
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
      badTitle: 'Deze link werkt niet',
      badSub: 'Vraag degene die betaalde om hem opnieuw te sturen.',
      errorTitle: 'Dit lukte even niet',
      errorSub: 'Check je verbinding en probeer het opnieuw.',
      retry: 'Opnieuw',
      never: 'SplitSmart komt nooit aan het geld.',
      privacy: 'Privacy'
    }
  }[lang];

  function t(key, vars) {
    return String(T[key]).replace(/\{(\w+)\}/g, function (_, k) { return vars && vars[k] != null ? vars[k] : ''; });
  }
  document.title = T.title;
  Array.prototype.forEach.call(document.querySelectorAll('[data-t]'), function (el) { el.textContent = t(el.dataset.t); });

  // ---------------------------------------------------------------- formatting
  var locale = lang === 'nl' ? 'nl-NL' : 'en-GB';
  // Like the app: symbol, a space after a letter symbol ("R 140.00"), the currency's own digits.
  function money(minor, currency) {
    var d = PL.digits(currency);
    var value = minor / Math.pow(10, d);
    var parts;
    try {
      parts = new Intl.NumberFormat(locale, { style: 'currency', currency: currency, currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: d, maximumFractionDigits: d }).formatToParts(value);
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
  // A plain amount for a bank app's amount field: "7,25" (nl) / "7.25" (en), no symbol, no grouping.
  function plainAmount(minor, currency) {
    var s = PL.amount(minor, currency);
    return lang === 'nl' ? s.replace('.', ',') : s;
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
    payout: { bunq_me: 'marijnploeg', iban: 'NL91ABNA0417164300', account_holder: 'M. Ploeg', other_link: 'paypal.me/MarijnPloeg' }
  };
  function demoData() {
    var d = JSON.parse(JSON.stringify(DEMO));
    if (demo === 'eur') { d.merchant = 'Café de Zwaan'; d.share_minor = 2450; d.currency = 'EUR'; d.approx_minor = null; d.approx_currency = null; }
    if (demo === 'said') d.said_paid = true;
    if (demo === 'paid') { d.paid = true; d.payout = null; }
    if (demo === 'none') d.payout = null;
    if (demo === 'link') d.payout = { bunq_me: null, iban: null, account_holder: null, other_link: 'https://tikkie.me/pay/SplitSmart/abc123' };
    return d;
  }

  function rpc(name) {
    if (isDemo) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          if (demo === 'error') return reject(new Error('demo'));
          if (demo === 'bad') return resolve(null);
          var d = demoData();
          if (name === 'guest_says_paid') d.said_paid = true;
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
    $('share').textContent = hasApprox ? T.yourShare + ' · ' + t('about', { amount: money(d.approx_minor, d.approx_currency) }) : T.yourShare;
    $('payLabel').textContent = t('payLabel', { payer: payer });

    var box = $('methods');
    box.textContent = '';
    var p = d.payout || {};
    var share = money(d.share_minor, d.currency);
    var eur = PL.euros(d.share_minor, d.currency, d.approx_minor, d.approx_currency);
    var methods = PL.methods(p.bunq_me, p.other_link);
    var bunq = methods.filter(function (m) { return m.kind === 'bunqMe'; })[0];
    var other = methods.filter(function (m) { return m.kind !== 'bunqMe'; })[0];
    var any = false;

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
      var iban = String(p.iban).replace(/\s+/g, '').toUpperCase();
      var amountMinor = eur != null && eur > 0 ? eur : d.share_minor;
      var amountCurrency = eur != null && eur > 0 ? 'EUR' : d.currency;
      var reference = 'SplitSmart ' + code;
      panel.appendChild(copyRow(T.iban, ibanGroups(iban), iban));
      if (p.account_holder) panel.appendChild(copyRow(T.holder, p.account_holder, p.account_holder));
      panel.appendChild(copyRow(T.amount, money(amountMinor, amountCurrency), plainAmount(amountMinor, amountCurrency)));
      panel.appendChild(copyRow(T.reference, reference, reference));
      // EPC069-12 "SEPA credit transfer" QR: EUR only, needs the holder's name; shown on wide screens only (CSS).
      if (amountCurrency === 'EUR' && p.account_holder && window.SplitSmartQR) {
        var payload = ['BCD', '002', '1', 'SCT', '', String(p.account_holder).slice(0, 70), iban,
          'EUR' + PL.amount(amountMinor, 'EUR'), '', '', reference].join('\n');
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
          sub: d.share_minor > 0 ? t('filledIn', { amount: share }) : '' }));
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
    $('stateTick').hidden = !(kind === 'thanks' || kind === 'paid');
    $('retry').hidden = kind !== 'error';
    if (kind === 'thanks') {
      $('stateTitle').textContent = d.guest_name ? t('thanksTitle', { guest: d.guest_name }) : T.thanksTitleNoName;
      $('stateSub').textContent = t('thanksSub', { payer: payer });
    } else if (kind === 'paid') {
      $('stateTitle').textContent = T.paidTitle;
      $('stateSub').textContent = d.merchant ? t('paidSub', { payer: payer, merchant: d.merchant }) : t('paidSubNoMerchant', { payer: payer });
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
    if (d.paid) return showState('paid', d);
    if (d.said_paid) return showState('thanks', d);
    $('state').hidden = true;
    payParts.forEach(function (e) { e.hidden = false; });
    renderPay(d);
  }

  function load() {
    main.classList.add('loading');
    rpc('guest_pay_page').then(render, function () {
      main.classList.remove('loading');
      main.removeAttribute('aria-busy');
      showState('error');
    });
  }

  $('paid').addEventListener('click', function () {
    var btn = $('paid');
    btn.disabled = true;
    btn.textContent = T.sending;
    $('paidError').hidden = true;
    rpc('guest_says_paid').then(function (d) {
      btn.disabled = false; btn.textContent = T.iPaid;
      render(d);
    }, function () {
      btn.disabled = false; btn.textContent = T.iPaid;
      $('paidError').textContent = T.sendFailed;
      $('paidError').hidden = false;
    });
  });
  $('retry').addEventListener('click', load);

  if (!isDemo && !/^[A-HJ-NP-Z2-9]{8}$/.test(code)) {
    render(null);
    return;
  }
  load();
})();
