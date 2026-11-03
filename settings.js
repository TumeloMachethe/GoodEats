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
const OPENING_HOURS = "Mon to Sat, 8am to 4pm";        // Example: "Mon to Sat, 8am to 8pm". Leave empty to hide hours.
const DELIVERY_FEE = 18;          // In rand. 0 = no delivery fee line.
const WHATSAPP_NUMBER = "083 941 5837";
const WHATSAPP_INTL = "27839415837";
