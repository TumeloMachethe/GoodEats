/* ####################################################################
   GOOD EATS: SHOP SETTINGS (the few things the owner may need to edit)
   ####################################################################
   This file is loaded by index.html (opening hours) and cart.html (the
   order page: delivery fee, webhook, WhatsApp). */

/* ##################################################################
   >>>>>>>>>>>>>>>>>>>>>>>>  MAKE WEBHOOK  <<<<<<<<<<<<<<<<<<<<<<<<<<
   Paste your Make webhook URL between the quotes on the next line.
   Make: Create scenario > Webhooks > Custom webhook > copy the URL.
   ################################################################## */
const MAKE_WEBHOOK_URL = "PASTE_MAKE_WEBHOOK_URL_HERE";

/* ---------- Shop settings (edit these) ---------- */
const OPENING_HOURS = "Mon to Fri, 7:30am to 5pm";     // Example: "Mon to Sat, 8am to 8pm". Leave empty to hide hours.
                                                       // Closed on Saturday and Sunday (confirmed by the owner).
                                                       // The same line is written in privacy.html, terms.html and refunds.html ("Opening hours:"); change it there too.
const DELIVERY_FEE = 18;          // In rand. Charged for areas that are NOT in FREE_DELIVERY_AREAS. 0 = no delivery fee line.
const FREE_DELIVERY_AREAS = ["Central", "Town"];   // Delivery is free when the customer picks one of these.
const DELIVERY_AREAS = ["Central", "Town", "Other area"];   // The choices in the "Delivery area" dropdown.
const WHATSAPP_NUMBER = "083 941 5837";
const WHATSAPP_INTL = "27839415837";

/* ##################################################################
   >>>>>>>>>>>>>>>>>>>>>>>>  GOOGLE REVIEWS  <<<<<<<<<<<<<<<<<<<<<<<<<
   The review strip under the logo shows your real Google reviews from Featurable.
   FEATURABLE_WIDGET_ID is the code from your Featurable widget (it is the long code after "featurable-" in
   the old embed). In Featurable: your widget > Embed > API shows it.
   FEATURABLE_API_URL is optional: only fill it in if the Embed > API page gives a different web address.
   ################################################################## */
const FEATURABLE_WIDGET_ID = "469e3e24-c258-4a81-8a6f-4ca5673642ed";
const FEATURABLE_API_URL = "https://api.featurable.com/v1/widgets/469e3e24-c258-4a81-8a6f-4ca5673642ed";

/* ##################################################################
   >>>>>>>>>>>>>>>>>>>>>>>>  PAYMENT WAITING SCREEN  <<<<<<<<<<<<<<<<<
   After paying on PayFast the customer sees "Checking your payment". After this many seconds without a
   confirmation, a pop-up asks them to message the shop on WhatsApp. The page keeps checking in the background.
   This is only when the pop-up appears; it is NOT a promise of how long confirmation takes.
   ################################################################## */
const PAY_WAIT_SECONDS = 60;

/* ##################################################################
   >>>>>>>>>>>>>>>>>>>>>>>>  PAYFAST  <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
   "sandbox" = TEST MODE (demo). No real money moves. Uses PayFast's public
   test merchant, so there is no secret in this file.
   "live"    = real payments. ONLY switch after PayFast has verified the account
               AND the Cloud Function is deployed (see CHANGES.md). In live mode the
               merchant key and signature are added by the Cloud Function and are
               never in this website's code.
   ################################################################## */
const PAYFAST_MODE = "sandbox";
const PAYFAST_SANDBOX_URL = "https://sandbox.payfast.co.za/eng/process";
const PAYFAST_LIVE_URL = "https://www.payfast.co.za/eng/process";
const PAYFAST_SANDBOX_MERCHANT = { merchant_id: "10000100", merchant_key: "46f0cd694581a" };   // PayFast's public test account
const PAYFAST_START_URL = "";    // live only: Cloud Function that returns the signed payment fields
const PAYFAST_NOTIFY_URL = "";   // live only: Cloud Function that PayFast calls to confirm payment
