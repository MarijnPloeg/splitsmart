// Paying the pay link by card (0044): stripe-pay kind code_guest. The fee comes from stripe-pay's quote and is shown
// before anything opens ("R 219.71 + R 15.00 service fee"); a start sends the share the page showed, and a 409
// amount_changed means the share moved meanwhile: show the new amount, never charge it unseen. No arithmetic here:
// share, fee and total are the server's numbers. Stripe.js lives in pay.js; this is the testable part (cardpay.test.js).
(function (root) {
  'use strict';

  // The PaymentIntent's methods as the quote says (stripe-pay codeMethods: card always, Apple Pay and Google Pay ride on
  // it; iDEAL for EUR once the platform has it on). Stripe's deferred-intent Elements must be created with the same list.
  var KNOWN = ['card', 'ideal'];
  function methodsOf(q) {
    var m = q && Array.isArray(q.payment_method_types) ? q.payment_method_types.filter(function (x) { return KNOWN.indexOf(x) !== -1; }) : [];
    return m.indexOf('card') === -1 ? ['card'] : m;
  }

  // A quote that can be shown: the server's three numbers in one currency.
  function validQuote(q) {
    return !!q && typeof q === 'object' && q.share_cents > 0 && q.fee_cents >= 0 &&
      q.total_cents === q.share_cents + q.fee_cents && typeof q.currency === 'string' && /^[A-Z]{3}$/.test(q.currency);
  }

  // create({post(body) → Promise(json | throws {code, data}), code, uuid()})
  function create(opts) {
    var post = opts.post, code = opts.code, uuid = opts.uuid;
    // One client key per attempt until it's settled: a retry after a declined card reuses the same PaymentIntent.
    var key = null;

    // → the quote, or null: no card here (the payer takes no cards, no final share, a currency without a fee, …);
    // the page then shows the other ways to pay as before.
    function quote() {
      return post({ kind: 'code_guest', code: code, client_key: uuid(), quote_only: true }).then(function (q) {
        return validQuote(q) ? { share_cents: q.share_cents, fee_cents: q.fee_cents, total_cents: q.total_cents, currency: q.currency,
          methods: methodsOf(q) } : null;
      }, function () { return null; });
    }

    // Start the payment for exactly what was shown. Answers one of
    //   {ok: true, payment}            → confirm with Stripe (payment.client_secret, payment.return_url)
    //   {done: true}                   → already paid with this key (a retried start)
    //   {changed: true, share_cents}   → the share is different now: show it and wait for another tap
    //   {failed: code}                 → say so; ask again with a fresh key
    function start(shown) {
      if (!validQuote(shown)) return Promise.resolve({ failed: 'invalid_input' });
      if (!key) key = uuid();
      return post({ kind: 'code_guest', code: code, client_key: key, amount_minor: shown.share_cents }).then(function (p) {
        if (p && p.status === 'succeeded') return { done: true, payment: p };
        if (!p || !p.client_secret || p.status === 'failed') { key = null; return { failed: (p && p.status) || 'start_failed' }; }
        return { ok: true, payment: p };
      }, function (e) {
        var c = (e && e.code) || 'start_failed';
        if (c === 'amount_changed') {
          key = null;
          var s = e.data && typeof e.data.share_cents === 'number' ? e.data.share_cents : null;
          return { changed: true, share_cents: s };
        }
        if (c !== 'network') key = null;
        return { failed: c };
      });
    }

    // After a payment is final (or the page reloads) the next attempt is a new one.
    function reset() { key = null; }

    return { quote: quote, start: start, reset: reset };
  }

  // iDEAL and 3-D Secure come back to /pay/?c=<code>&paid=<payment_id>&payment_intent=…&redirect_status=…
  function returnState(search) {
    var q;
    try { q = new URLSearchParams(search || ''); } catch (e) { return null; }
    var status = q.get('redirect_status');
    if (!q.get('paid') && !status) return null;
    return { paymentId: q.get('paid'), status: status === 'succeeded' || status === 'processing' || status === 'failed' ? status : 'unknown' };
  }

  var api = { create: create, methodsOf: methodsOf, validQuote: validQuote, returnState: returnState };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SplitSmartCardPay = api;
})(typeof window !== 'undefined' ? window : this);
