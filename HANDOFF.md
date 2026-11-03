# Good Eats website: handoff

## Project
Ordering website for **Good Eats** ("Good food, good mood"), single store at 21 Chapel Street, Central, Gqeberha, South Africa. WhatsApp 083 941 5837 (wa.me/27839415837).
Plain HTML, CSS and JavaScript. No frameworks, no build step.

## Status: built and browser-tested (phone-size screen, mock webhook)
Customers add menu items to a cart, fill in a form, and send. The order goes to the restaurant's email through a Make.com webhook.

## Files
- `index.html`: header (sticky "Order now" button), hero, full menu with prices, order section (cart, totals, form, thank-you panel), floating cart bar, footer
- `styles.css`: chalkboard look
- `script.js`: cart, totals, location, form submit, Make webhook, WhatsApp backup, thank-you screen
- `images/logo.jpeg` (original, kept as the master), `images/logo.png` (transparent, cropped, used on the site)
- Food photos still to add in `images/`: `chips.jpg`, `savoury.jpg`, `burger.jpg`, `croissants.jpg`, `toasties.jpg`, `schnitzel.jpg` (clean photos, no prices; under about 300 KB each). A missing photo hides itself.

## What the owner must still do
1. Add the six food photos.
2. In `settings.js`, replace `PASTE_MAKE_WEBHOOK_URL_HERE` (search "MAKE WEBHOOK") with the Make webhook URL.
3. In `settings.js`, set `OPENING_HOURS` (empty = hidden) and `DELIVERY_FEE` (0 = no fee line).
4. Deploy (Netlify drop: app.netlify.com/drop, drag the whole folder). Location sharing needs https.
5. Place one real test order from a phone and check the email arrives.

## Key spots in the code
- **MAKE WEBHOOK**: `settings.js`, constant `MAKE_WEBHOOK_URL`, called inside the submit handler's `fetch` in `order.js`.
- **FORM SUBMIT**: big banner comment in `order.js` (search "FORM SUBMIT"); the form is `#order-form` in `cart.html`.
- Settings block under the webhook in `settings.js`: `OPENING_HOURS`, `DELIVERY_FEE`, `WHATSAPP_NUMBER`, `WHATSAPP_INTL`.
- Menu items are `<button class="add" data-name="..." data-price="...">`; the cart reads those attributes.

## Make setup
Scenario: Webhooks > Custom webhook, then an email module (Gmail or similar). Use `summaryText` as the email body. Send one test order so Make learns the fields.

Payload:
```json
{
  "name": "", "phone": "", "orderType": "delivery|collection",
  "address": "", "notes": "",
  "location": { "lat": null, "lng": null, "mapsLink": "" },
  "items": [{ "name": "", "price": 0, "qty": 1 }],
  "subtotal": 0, "deliveryFee": 0, "total": 0,
  "submittedAt": "", "summaryText": ""
}
```

## Design tokens
Background `#141414`, cards `#1d1d1c`, accent yellow `#ffc72c`, text `#f6f2e8`. Fonts: Oswald (headings, items, prices), Caveat (handwritten notes). Headings use the yellow brush label (`.brush`).

## Notes
- The webhook URL is visible in the page source (normal for this setup). Do not share it; regenerate it in Make if abused.
- Code gotcha: do not name a global variable `location` in script.js (clashes with `window.location`); the code uses `geo`.

## Part 5 additions
- Hero is now a video hero: put a short loop at `videos/promo.mp4` (under about 8 MB). Missing video = the chalkboard hero shows instead. Muted autoplay; Pause button appears once it loads.
- New sections: promo ticker (edit the spans in `.ticker-track`, keep both copies the same), "Start here" specials (Add buttons share names with the menu so the cart merges), "How it works", "Find us" (map, directions, large-order WhatsApp link).
- Scroll effects live at the bottom of `script.js`: progress bar, shrinking header, video parallax, reveal on scroll, active nav link. All switch off for visitors who prefer reduced motion.
- Hours show in two more places automatically once `OPENING_HOURS` is set.

## Part 6: one page per category
- Pages: `chips.html`, `savoury.html`, `burgers.html`, `croissants.html`, `toasties.html`, `schnitzel.html`, `magwinya.html`. `index.html` now shows category cards (the "Our menu" section) instead of the long menu.
- The cart is saved in the browser (`localStorage`, key `goodeats-cart`), so it carries across pages. `script.js` runs on index.html (cart, order form); `cart-lite.js` runs on the category pages.
- To change a price or add an item, edit `menu-data.js` (see Part 9). The old advice to edit each category page no longer applies.
- Photos: add `images/magwinya.jpg` as well (a seventh photo). Missing photos hide themselves.

## Part 7: launch prep
- Icons: `favicon.ico`, `images/icons/` (favicon 16/32/48, `apple-touch-icon.png`, `icon-192/512.png`, `maskable-512.png`), all made from the chef hat. `site.webmanifest` lets phones "Add to Home Screen" with the Good Eats icon.
- `images/og-image.jpg` (1200x630) is the picture shown when the link is shared on WhatsApp, Facebook and so on.
- `404.html` (Netlify serves it automatically for wrong links), `robots.txt`, and Restaurant structured data on `index.html` for Google.
- Bigger tap targets on touch screens, small-phone (320px) layout fixes, iPhone safe-area for the cart bar.
- After deploying, make the share image address absolute: in every page, change `content="images/og-image.jpg"` to `content="https://YOUR-DOMAIN/images/og-image.jpg"`. Also add a `sitemap.xml` once the domain is known.

## Part 8: owner, team and reviews (index.html, between the order form and "Find us")
- Sections `#owner`, `#team`, `#reviews`. Every card has the class `placeholder`, which shows a dashed outline and a yellow "EDIT ME" badge. Fill the card in, then delete the word `placeholder` from its class.
- Photos: `images/owner.jpg`, `images/staff-1.jpg`, `images/staff-2.jpg`, `images/staff-3.jpg` (square-ish, under about 300 KB). A missing photo hides itself and the chef hat shows instead.
- Add a person: copy one whole `<article class="staff-card">` block. Add a review: copy one whole `<figure class="review">` block. Use real reviews only.
- "Leave us a review" links to a Google Maps search for the shop. Once the Google Business Profile has its own review link, swap it into that button.
- On phones the reviews swipe sideways; on desktop they sit in a row.

## Part 9: menu is now driven by JavaScript (menu-data.js)
- **`menu-data.js` is the one file to edit** to add or remove a product, change a price, change the Start-here specials, or change the scrolling ticker. Comments inside the file explain each step.
- `menu-render.js` (do not edit) reads it and builds the category pages, home-page cards ("From R.." is worked out from the prices), nav links, "Hungry for something else?" buttons, specials and ticker. It must load after `menu-data.js` and before `script.js` / `cart-lite.js`.
- Category pages (`burgers.html` etc.) are now thin shells with `data-menu-root="<id>"`. To add a whole new category: add a block to `MENU`, copy any category page to `<id>.html`, and change the `data-category` on `<body>`, the `data-menu-root` and the `data-menu-more` to the new id.
- A special whose product is removed from the menu hides itself and logs a console warning. A typo in `menu-data.js` shows "The menu could not load" instead of a blank page.
- Cart names are kept the same as before (the `cart` field), so saved carts and order emails are unaffected.

## Part 10: the order page (cart.html)
- **Ordering now happens on `cart.html`**, not on the home page. The order section was removed from `index.html`.
- `cart.html` shows the cart (- / + / x per line, Clear cart), the totals (with the delivery fee line), the order form, and the thank-you message. The form only shows when the cart has something in it.
- Files: `order.js` (cart page, form, Make webhook, WhatsApp backup, thank-you), `settings.js` (MAKE_WEBHOOK_URL, OPENING_HOURS, DELIVERY_FEE, WhatsApp numbers; loaded by index.html and cart.html). `script.js` is now only the home page effects (hours, scroll, video). `cart.js` no longer exists.
- Every "Order now" button, the header button and the floating cart bar now go to `cart.html`. The home page and category pages use `cart-lite.js` for the Add buttons, the cart count and the cart bar.
- "Order again" on the thank-you message goes back to the menu.
- Same saved cart as before (`localStorage` key `goodeats-cart`), so carts carry across pages.
