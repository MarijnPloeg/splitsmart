// The Supabase project the pay page reads from: its URL and the PUBLIC anon key (the same pair the app ships with,
// .env.staging SUPABASE_URL / SUPABASE_ANON_KEY). Never a service key: the page only calls the anonymous RPCs guest_pay_page,
// guest_says_paid and guest_undo_says_paid and stripe-pay kind code_guest, which act on one guest's share for a valid code.
// Left empty in git, like every key in this repo; fill both in when publishing site/ (HANDOFF). Empty = the page says
// it can't load (the mock `?c=DEMO1234` works without them).
// 0044: Stripe's PUBLISHABLE key (pk_live_… / pk_test_…, the one in the app's Info.plist), for paying by card with the
// service fee. Empty = no card payments: the page shows the other ways to pay, as before.
window.SPLITSMART_PAY_CONFIG = {
  supabaseUrl: "https://sttiiysynsdlwhfspmpa.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0dGlpeXN5bnNkbHdoZnNwbXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNDc0OTIsImV4cCI6MjEwNzYyMzQ5Mn0.0rOdTaWLM82vG2Nf5GMNBEiijS3T-KrN7yRCW4HnpXg",
  stripePublishableKey: "pk_live_51UZ3QCAOgsXUzcUVVh4muyhiWMGzAZdKQ7uqDWv3lOnoXzw8vaUh38G8W9W2vikI9scLN7QNxNDcPlllnFvut9uV00dAqqL02j"
};
