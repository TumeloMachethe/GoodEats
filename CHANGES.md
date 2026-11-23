# Good Eats: redesign update (latest)

**Look:** calm light theme, Source Serif 4 + Source Sans 3, no brush headings, no emojis, no yellow slabs. Dark mode kept (toned down). Header menu drops to its own row below 1360px.
1. Floating food emojis removed. 2. Scrolling ticker removed (and TICKER in menu-data.js).
3. Review strip now sits under the hero logo, is small, has a pause button, and loads your real Google reviews from Featurable (settings.js > FEATURABLE_WIDGET_ID). Sample reviews and the "Sample reviews" tag are gone. If Featurable does not answer, the strip stays hidden and your old Featurable widget appears in a back-up "What people say" section.
4. Hero: still photo + silent looping video (images/hero/, see README.txt there). Video skipped for reduced motion / Data Saver.
5. Loader on the home page, gone when ready or after 3.5 s at most.
6. Hours: "Mon to Sat, 7:30am to 5pm" in settings.js and the three policy pages. Weekends still need your confirmation.
7. "Meet our staff" is kept but hidden (remove the word hidden in index.html when you fill it in).
8. Facebook videos: options given in chat, nothing built.
**Payment waiting screen** (order.js, cart.html): calm ring + 4 steps, pop-up after PAY_WAIT_SECONDS (settings.js, 60) with WhatsApp button + order ref, background checking continues, order saved on the device (restored after reload/reopen; kept 7 days unpaid, 24 h once paid). Checkout, PayFast, delivery and slip PDF code untouched.
Not tested live: Featurable endpoint, real Paystack payment, real video. The payment screen was not browser-tested before delivery: please do one small real payment and refund it.

---
# Good Eats: what changed (all 9 parts)

Open `index.html` through any local web server, or upload the folder as usual. New files: `smoothies.html`, `milkshakes.html`, `coolers.html`, `refunds.html`, three drink photos in `images/`, and `docs/`.

## 1. Menu check
Smoothies (7), Milkshakes (5) and Coolers (5) were missing from the site. They are now in `menu-data.js` with the 350ml/500ml prices from the menu image, each with its own page. Coke, Fanta, Sprite and Water stay as "Cold drinks".

## 2. "Popular Right Now" removed
Section, nav link, builder code and the `SPECIALS` list are gone. Combos are untouched.

## 3. Video replaced
No video file or video code any more. The hero now has floating food emojis (pure CSS, 16 tiny elements, no downloads). It switches off for people who set "reduce motion".

## 4. Review strip
Slides sideways right under the header (pauses on hover). It reads `REVIEWS` in `menu-data.js`.
**The 4 reviews are SAMPLES** so you can demo it. A small "Sample reviews" tag shows until you replace them with real ones and delete `sample: true`.

## 5. Drink upsell
After adding any food item: "Would you like to add a drink?" with four boxes (Cold drinks, Smoothies, Milkshakes, Coolers), each with a photo and a "from" price worked out from the menu. Tap a box for its flavours and sizes; one tap adds. It is skipped when the item added is itself a drink, and combos are untouched (they already include a drink). The Cold drinks box has no photo (the menu image has none), so it shows a coloured box; add a photo path in `UPSELL_BOXES`.

## 6. Free delivery
New "Delivery area" dropdown (Central, Town, Other area). Central/Town show "Free delivery to Central/Town" and the Delivery line reads FREE. **Other area still uses the existing R18 fee in `settings.js`**: please confirm that is right.

## 7. Paystack (live popup)
"Pay R90 with Paystack" saves the order first, then opens Paystack's payment window over the page. Only the PUBLIC key (`PAYSTACK_PUBLIC_KEY` in `settings.js`) is on the site. The secret key (sk_live) must never be put on the site. The popup's "success" only moves the customer to the waiting screen; it never unlocks the slip. There is no test mode: your first order is a real payment (suggestion: pay a small one yourself, then refund it).
New required **Email address** field (Paystack needs one). New flat **R10 service fee** (`SERVICE_FEE` in `settings.js`): online delivery orders only, not collection, not WhatsApp orders. It shows as its own line, on the slip, and in the order sent to the staff app (`serviceFee`, `email`, `payment: "paystack"` are extra fields; the site saves without them if the database rules refuse them, so add them to the `onlineOrders` validation).
Later, when volume grows, a small server function can confirm payments automatically using the secret key. Not needed now.

## 8. Policies
`terms.html` and `privacy.html` updated for Paystack; new `refunds.html`; contact details on all three; footer links on every page. Checkout has the tick box and the pay button stays off until it is ticked. **The wording is a draft** (it is marked in the page source): check it matches how Good Eats really handles refunds. Not legal advice.

## 9. Slip
- Unlocks only when payment is confirmed. Until then the button is greyed out.
- The page now opens at the very top (the old smooth-scroll was landing mid-page).
- The slip shows the order reference and PAID, plus the service fee line.

---
## How "confirmed" works right now (your safety net)
1. Customer pays in the Paystack popup and sees a screen saying "Checking your payment".
2. The order is already in the staff app. Its notes start with **AWAITING PAYMENT CHECK ... Ref GE-XXXX-XXXX-XXXX**, so staff see it with no staff-app change.
3. You check the payment in your Paystack dashboard (the payment reference is the order ref). If it is good, in the Firebase console open Realtime Database, add `paymentStatus` > `GE-XXXX-XXXX-XXXX` = `paid`.
4. The customer's page checks every few seconds and unlocks the slip by itself.

**Before this works:** add the `paymentStatus` rules from `docs/firebase-rules-additions.json` (otherwise the page cannot read the status and the slip stays locked). Add `ref`, `payment`, `payStatus` to your `onlineOrders` validation too (the site saves without them if they are refused).

## Not done (needs the staff app, which was not in the zip)
A proper "awaiting payment check" badge and a "Payment confirmed" button in the staff app. The site already sends `payStatus: "awaiting_check"` and `ref`; the button should write `paymentStatus/<ref> = "paid"`.

## Honest limits
- The slip lock is a convenience, not security: a technical person could unlock their own slip on their own screen. The real check is you (or later the Cloud Function) confirming payment before preparing food.
- I could not run a real browser here. Logic was tested (area, free delivery, terms, Paystack popup, waiting screen, locked/unlocked slip, scroll) in a DOM simulator, but animations and layout were not seen. Please open it on your phone before 21 Nov.

## Open questions
- Normal delivery fee for other areas (currently R18).
- The "matrimony section" is still unexplained. I assumed milkshakes, which are now added.
- Contact email: the policies list address, WhatsApp and hours only.

---
# Good Eats: personality pass (latest)
1. **Colour and character, lightly:** yellow header line, yellow primary buttons, short yellow underline under headings, hand-written Caveat font for small notes, yellow footer line. All in section 13 of styles.css (change `--brand` to adjust).
2. **Home link** added first in the top menu on every page (menu-render.js).
3. **Reviews:** each review now shows the reviewer's photo (initial letter if no photo), a Google badge, name and stars (site.js, section 13 of styles.css).
4. **Slip:** the confirmation screen is a white paper receipt again (Courier, torn edge, prints in), with confetti when payment is confirmed. The PDF slip was already a receipt and is unchanged.
5. **Waiting screen:** bouncing burger, changing friendly lines every 4 s, bouncing dots (cart.html, order.js `PAY_TIPS`). Checkout, payment, polling and delivery code untouched.
6. **Staff section:** still hidden until names and photos are added (see comment in index.html).
Not browser-tested: please check on your phone, and do one sandbox payment.
