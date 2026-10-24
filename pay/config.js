// The Supabase project the pay page reads from: its URL and the PUBLIC anon key (the same pair the app ships with,
// .env.staging SUPABASE_URL / SUPABASE_ANON_KEY). Never a service key: the page only calls the two anonymous RPCs
// guest_pay_page and guest_says_paid, which return one guest's share for a valid code and nothing else.
// Left empty in git, like every key in this repo; fill both in when publishing site/ (HANDOFF). Empty = the page says
// it can't load (the mock `?c=DEMO1234` works without them).
window.SPLITSMART_PAY_CONFIG = {
  supabaseUrl: "https://sttiiysynsdlwhfspmpa.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0dGlpeXN5bnNkbHdoZnNwbXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNDc0OTIsImV4cCI6MjEwNzYyMzQ5Mn0.0rOdTaWLM82vG2Nf5GMNBEiijS3T-KrN7yRCW4HnpXg"
};
