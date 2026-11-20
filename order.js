/* Good Eats: the order page (cart.html)
   Shows the cart, adds up the total, collects the customer's details and
   records the order (Firebase for the staff app, Make, Web3Forms), then sends the
   customer to PayFast to pay. The slip unlocks only when payment is confirmed.
   The Make webhook, delivery fee and WhatsApp number are in settings.js.
   The Web3Forms key is just below.
   The cart is saved in the browser (localStorage key "goodeats-cart"), the
   same cart the menu pages fill. */

/* ##################################################################
   >>>>>>>>>>>>>>>>>>>>>>>>  WEB3FORMS KEY  <<<<<<<<<<<<<<<<<<<<<<<<<<
   Paste your Web3Forms access key between the quotes below.
   Get it free at web3forms.com (enter the email that gets the orders).
   The key is safe to be public; it can only send to that email address.
   ################################################################## */
const WEB3FORMS_ACCESS_KEY = "334d3ae4-df06-4190-879c-748eb6d3878c";
const WEB3FORMS_URL = "https://api.web3forms.com/submit";

/* ##################################################################
   >>>>>>>>>>>>>>>>>>>>>>>>  FIREBASE DATABASE  <<<<<<<<<<<<<<<<<<<<<<
   Orders are saved here so the staff app can show them (Online orders tab).
   ################################################################## */
const FIREBASE_DB_URL = "https://restaurant-order-a7eaf-default-rtdb.europe-west1.firebasedatabase.app";

/* ---------- Helpers ---------- */
const $ = (id) => document.getElementById(id);
const rand = (n) => "R" + n;
const CART_KEY = "goodeats-cart";   // must match cart-lite.js and script.js
const cart = new Map();             // name -> { price, qty }
try {
  JSON.parse(localStorage.getItem(CART_KEY) || "[]").forEach(([n, i]) => {
    if (i && Number(i.price) >= 0 && Number(i.qty) > 0) cart.set(n, { price: Number(i.price), qty: Number(i.qty) });
  });
} catch (e) {}
function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify([...cart])); } catch (e) {} }
let geo = { lat: null, lng: null, mapsLink: "" };   // (not named "location": that clashes with window.location)
let thanksShowing = false;
let submitting = false;
let lastOrder = null;                           // the order shown on the thank-you / slip screen
let paidConfirmed = false;                      // true only when /paymentStatus/<ref> says "paid"
let pollTimer = null;
const PENDING_KEY = "goodeats-pending";         // the order we sent to PayFast (kept so the slip still works after PayFast brings the customer back)
try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}

function orderType() {
  return document.querySelector('input[name="orderType"]:checked').value;
}
function cartCount() { let n = 0; cart.forEach((i) => (n += i.qty)); return n; }
function cartSubtotal() { let t = 0; cart.forEach((i) => (t += i.price * i.qty)); return t; }
function area() { const a = $("area"); return a ? a.value : ""; }
function isFreeArea() { return orderType() === "delivery" && FREE_DELIVERY_AREAS.indexOf(area()) !== -1; }
function deliveryCharge() {
  return cart.size > 0 && orderType() === "delivery" && !isFreeArea() && DELIVERY_FEE > 0 ? DELIVERY_FEE : 0;
}
function orderTotal() { return cartSubtotal() + deliveryCharge(); }

function makeButton(text, label, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  b.setAttribute("aria-label", label);
  b.addEventListener("click", onClick);
  return b;
}

/* ---------- Draw the cart ---------- */
function renderCart() {
  const list = $("cart-items");
  list.replaceChildren();

  cart.forEach((item, name) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.className = "cart-name";
    label.textContent = name;

    // - 1 + buttons
    const qty = document.createElement("span");
    qty.className = "qty";
    const num = document.createElement("span");
    num.textContent = item.qty;
    qty.append(
      makeButton("−", "Remove one " + name, () => changeQty(name, -1)),
      num,
      makeButton("+", "Add one " + name, () => changeQty(name, 1))
    );

    const line = document.createElement("span");
    line.className = "cart-line";
    line.textContent = rand(item.price * item.qty);

    // x removes the whole line
    const remove = makeButton("×", "Remove " + name + " from the cart", () => { cart.delete(name); renderCart(); });
    remove.classList.add("cart-remove");

    li.append(label, qty, line, remove);
    list.appendChild(li);
  });

  const empty = cart.size === 0;
  const fee = deliveryCharge();
  $("cart-empty").hidden = !empty || thanksShowing;     // "Your cart is empty" (not shown under the thank-you)
  $("cart-totals").hidden = empty;
  $("clear-btn").hidden = empty;
  $("order-form").hidden = empty;                        // the form only shows when there is something to order
  $("subtotal-amount").textContent = rand(cartSubtotal());
  const free = !empty && isFreeArea();
  $("fee-row").hidden = fee === 0 && !free;                // shows "FREE" for Central/Town
  $("fee-amount").textContent = free ? "FREE" : rand(fee);
  $("fee-amount").classList.toggle("fee-free", free);
  $("free-note").hidden = !free;
  $("total-amount").textContent = rand(orderTotal());
  if (!submitting) $("submit-btn").textContent = empty ? "Pay with PayFast" : "Pay " + rand(orderTotal()) + " with PayFast";

  document.querySelector(".site-header .btn-primary").textContent =
    empty ? "Order now" : "Order now (" + cartCount() + ")";
  saveCart();
}

function changeQty(name, delta) {
  const item = cart.get(name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart.delete(name);
  renderCart();
}

$("clear-btn").addEventListener("click", () => { cart.clear(); renderCart(); });

/* ---------- Delivery or collection ---------- */
document.querySelectorAll('input[name="orderType"]').forEach((r) =>
  r.addEventListener("change", () => {
    $("delivery-fields").hidden = orderType() === "collection";
    renderCart();
  })
);

/* ---------- Delivery area (Central and Town are free) ---------- */
DELIVERY_AREAS.forEach((a) => { const o = document.createElement("option"); o.value = a; o.textContent = FREE_DELIVERY_AREAS.indexOf(a) !== -1 ? a + " (free delivery)" : a; $("area").appendChild(o); });
$("area").addEventListener("change", renderCart);

/* ---------- Terms tick box: the pay button stays off until it is ticked ---------- */
$("terms-ok").addEventListener("change", () => { $("submit-btn").disabled = !$("terms-ok").checked || submitting; });

/* ---------- Demo banner (PayFast test mode) ---------- */
if (PAYFAST_MODE !== "live") { $("demo-banner").hidden = false; $("demo-note").hidden = false; }

/* ---------- Share my location ---------- */
$("locate-btn").addEventListener("click", () => {
  const status = $("location-status");
  status.className = "status";
  if (!navigator.geolocation) {
    status.textContent = "Your browser cannot share location. Please type your address.";
    return;
  }
  status.textContent = "Finding your location...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      geo.lat = pos.coords.latitude;
      geo.lng = pos.coords.longitude;
      geo.mapsLink = "https://www.google.com/maps?q=" + geo.lat + "," + geo.lng;
      status.className = "status ok";
      status.textContent = "Location saved. Please still type your address above.";
    },
    () => {
      status.className = "status error";
      status.textContent = "We could not get your location. Please type your address.";
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
});

/* ---------- Build the order ---------- */
function buildPayload(opts) {
  opts = opts || {};
  const items = [];
  cart.forEach((i, name) => items.push({ name, price: i.price, qty: i.qty }));
  const type = orderType();
  const data = {
    name: $("name").value.trim(),
    phone: $("phone").value.trim(),
    orderType: type,
    area: type === "delivery" ? area() : "",
    address: type === "delivery" ? area() + ": " + $("address").value.trim() : "",
    notes: $("notes").value.trim(),
    ref: opts.ref || "",
    payment: opts.ref ? "PayFast (" + (PAYFAST_MODE === "live" ? "live" : "SANDBOX TEST") + "), awaiting payment check" : "Pay on delivery or collection (WhatsApp order)",
    location: type === "delivery" ? geo : { lat: null, lng: null, mapsLink: "" },
    items,
    subtotal: cartSubtotal(),
    deliveryFee: deliveryCharge(),
    total: orderTotal(),
    submittedAt: new Date().toISOString(),
  };
  const lines = items.map((i) => "- " + i.qty + " x " + i.name + " = " + rand(i.price * i.qty));
  data.summaryText = [
    "New Good Eats order",
    "Name: " + data.name,
    "Phone: " + data.phone,
    data.ref ? "Ref: " + data.ref : "",
    "Payment: " + data.payment,
    "Type: " + data.orderType,
    data.address ? "Address: " + data.address : "",
    data.location.mapsLink ? "Map: " + data.location.mapsLink : "",
    "",
    "Items:",
    ...lines,
    data.deliveryFee ? "Delivery: " + rand(data.deliveryFee) : (data.orderType === "delivery" ? "Delivery: FREE" : ""),
    "Total: " + rand(data.total),
    data.notes ? "Notes: " + data.notes : "",
  ].filter((l, idx, arr) => l !== "" || arr[idx - 1] !== "").join("\n");
  return data;
}

function validate(needTerms) {
  if (cart.size === 0) return "Your order is empty. Pick something from the menu first.";
  const soldProblem = window.GE_soldOutProblem ? window.GE_soldOutProblem(cart.keys()) : "";   // sold-out check (soldout.js)
  if (soldProblem) return soldProblem;
  if (!$("name").value.trim()) return "Please enter your name.";
  if ($("phone").value.replace(/\D/g, "").length < 10) return "Please enter a phone number with 10 digits.";
  if (orderType() === "delivery" && !area()) return "Please choose your delivery area.";
  if (orderType() === "delivery" && !$("address").value.trim()) return "Please enter your delivery address.";
  if (needTerms && !$("terms-ok").checked) return "Please tick the box to accept the terms and policies.";
  return "";
}

/* ---------- WhatsApp backup ---------- */
$("wa-btn").addEventListener("click", () => {
  const status = $("form-status");
  const problem = validate();
  if (problem) {
    status.className = "status error";
    status.textContent = problem;
    return;
  }
  const url = "https://wa.me/" + WHATSAPP_INTL + "?text=" + encodeURIComponent(buildPayload({}).summaryText);
  window.open(url, "_blank", "noopener");
});

/* ---------- Scroll to the very top (instant, so the page never lands in the middle) ---------- */
function toTop() { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }

/* ---------- Thank-you / awaiting-payment screen (also the slip screen) ---------- */
function showReceipt(p, summary) {
  thanksShowing = true;
  lastOrder = p || null;
  if (p && $("thanks-title")) $("thanks-title").textContent = "Thank you, " + p.name.split(" ")[0] + "!";
  $("thanks-ref").textContent = p && p.ref ? "Order ref: " + p.ref : "";
  $("thanks-summary").textContent = summary || (p ? p.summaryText.split("\n").filter((l) => !/^Payment:/.test(l)).join("\n").replace("New Good Eats order", "Your Good Eats order") : "");
  $("order-form").hidden = true;
  $("cart-empty").hidden = true;
  $("thanks").hidden = false;
  $("thanks").focus({ preventScroll: true });
  toTop(); requestAnimationFrame(toTop); setTimeout(toTop, 150); setTimeout(toTop, 700);   // again after the receipt animation settles
}

/* unlockSlip() is defined with the payment waiting screen below. */

/* Ask the database whether the payment is confirmed. Staff (or later the Cloud Function) write
   "paid" at /paymentStatus/<ref>. The website can only READ it (see firebase-rules.json). */
async function checkPaid(ref) {
  try {
    const r = await fetch(FIREBASE_DB_URL + "/paymentStatus/" + encodeURIComponent(ref) + ".json", { cache: "no-store" });
    if (!r.ok) return false;
    const v = await r.json();
    return v === "paid" || !!(v && v.status === "paid");
  } catch (e) { return false; }
}
/* ##################################################################
   >>>>>>>>>>>>>>>>>>>>>>>>  PAYMENT WAITING SCREEN  <<<<<<<<<<<<<<<<<
   What the customer sees after paying on PayFast.
   - A calm animation and four plain steps. No promise of how long it takes: you confirm payments by hand.
   - After PAY_WAIT_SECONDS (settings.js, 60) without a confirmation, a pop-up asks them to message the shop on
     WhatsApp (pre-written message with their order reference). It shows once; after that the same button
     stays on the page.
   - The page keeps checking in the background, so the slip still unlocks when you confirm payment.
   - The order is saved on the device (localStorage "goodeats-active-order"), so a reload, or closing and
     reopening the page, brings back the waiting screen or the unlocked slip. The time is counted from when
     the customer first landed here, not from when the page was opened.
   The check itself (checkPaid) and the slip (below) are unchanged.
   ################################################################## */
const ACTIVE_KEY = "goodeats-active-order";
const AWAIT_KEEP_MS = 7 * 24 * 60 * 60 * 1000;     // an unconfirmed order is remembered for 7 days
const PAID_KEEP_MS = 24 * 60 * 60 * 1000;          // a confirmed order (slip) is remembered for 24 hours
const WAIT_MS = (typeof PAY_WAIT_SECONDS === "number" && PAY_WAIT_SECONDS > 0 ? PAY_WAIT_SECONDS : 60) * 1000;
const REF_RE = /^GE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
let active = null;          // { ref, startedAt, paid, paidAt, popupShown, order }
let lateTimer = null;
let pollRun = 0;            // each new polling run cancels the previous one

function loadActive() {
  try {
    const r = JSON.parse(localStorage.getItem(ACTIVE_KEY) || "null");
    if (!r || !REF_RE.test(r.ref || "") || typeof r.startedAt !== "number") return null;
    const age = Date.now() - (r.paid && r.paidAt ? r.paidAt : r.startedAt);
    if (age > (r.paid ? PAID_KEEP_MS : AWAIT_KEEP_MS)) { localStorage.removeItem(ACTIVE_KEY); return null; }
    return r;
  } catch (e) { return null; }
}
function saveActive() {
  try { if (active && REF_RE.test(active.ref)) localStorage.setItem(ACTIVE_KEY, JSON.stringify(active)); } catch (e) {}
}

function waLink() {
  const name = active && active.order && active.order.name ? " My name is " + active.order.name + "." : "";
  const msg = "Hi Good Eats, I've paid and am still waiting for confirmation. Order reference: " + active.ref + "." + name;
  return "https://wa.me/" + WHATSAPP_INTL + "?text=" + encodeURIComponent(msg);
}

/* The four steps: "done", "active" or "todo" */
function paintSteps(confirm, slip, confirmText) {
  const state = { paid: "done", received: "done", confirm, slip };
  document.querySelectorAll("#pay-wait .pay-steps li").forEach((li) => {
    const st = state[li.dataset.step];
    li.className = st === "todo" ? "" : st;
    if (st === "active") li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    li.querySelector(".step-state").textContent = st === "done" ? "Done: " : st === "active" ? "In progress: " : "Not yet: ";
    if (li.dataset.step === "confirm" && confirmText) li.querySelector(".step-name").textContent = confirmText;
  });
}
function paintWaiting(late) {
  $("pay-wait").dataset.state = late ? "late" : "waiting";
  $("pay-title").textContent = late ? "Still waiting for confirmation" : "Checking your payment";
  $("pay-text").textContent = late
    ? "We have not been able to confirm your payment yet. The shop checks payments by hand, so it can take a little while."
    : "Your order is with the shop. We confirm payments by hand, so this can take a little while. Your slip unlocks here when we confirm. You can close this page and come back: your order is saved on this device.";
  paintSteps("active", "todo", late ? "Shop is still confirming your payment" : "Shop confirming your payment");
  $("pay-late").hidden = !late;
  if (late) $("pay-wa-inline").href = waLink();
}

function openPayDialog() {
  const d = $("pay-dialog");
  if (!d || d.open || !active) return;
  $("pay-dialog-ref").textContent = "Order ref: " + active.ref;
  $("pay-wa-dialog").href = waLink();
  try { d.showModal(); } catch (e) { d.setAttribute("open", ""); }
}
function closePayDialog() {
  const d = $("pay-dialog");
  if (d && d.open) { try { d.close(); } catch (e) { d.removeAttribute("open"); } }
}
$("pay-dialog-close").addEventListener("click", closePayDialog);
$("pay-dialog").addEventListener("click", (e) => { if (e.target === e.currentTarget) closePayDialog(); });   // tap outside the box

/* The waiting time is up and still nothing confirmed */
function enterLate() {
  if (paidConfirmed || !active) return;
  paintWaiting(true);
  if (!active.popupShown) { active.popupShown = true; saveActive(); openPayDialog(); }
}
function scheduleLate() {
  clearTimeout(lateTimer);
  if (!active || paidConfirmed) return;
  const left = active.startedAt + WAIT_MS - Date.now();
  if (left <= 0) enterLate(); else lateTimer = setTimeout(enterLate, left + 50);
}

/* Payment confirmed: unlock the slip (this is the only place that does it) */
function unlockSlip() {
  const firstTime = !paidConfirmed;
  paidConfirmed = true;
  clearInterval(tipTimer);
  if (firstTime && active && !active.paid) popConfetti();
  pollRun++; clearTimeout(pollTimer); clearTimeout(lateTimer);   // stop checking
  if (active && !active.paid) { active.paid = true; active.paidAt = Date.now(); saveActive(); }
  closePayDialog();
  $("slip-btn").disabled = false;
  $("slip-btn").textContent = "Download order slip (PDF)";
  $("pay-wait").dataset.state = "paid";
  $("pay-title").textContent = "Payment confirmed";
  $("pay-text").textContent = "Thank you! We are preparing your order. Your slip is ready below.";
  paintSteps("done", "done", "Payment confirmed by the shop");
  $("pay-late").hidden = true;
}

/* Keep asking in the background: every 5 s for 2 minutes, then every 15 s (about 2.5 hours in all). A new call cancels the old one. */
function startPolling(ref) {
  const run = ++pollRun;
  clearTimeout(pollTimer);
  let n = 0;
  const tick = async () => {
    if (run !== pollRun || paidConfirmed) return;
    const ok = await checkPaid(ref);
    if (run !== pollRun || paidConfirmed) return;
    if (ok) { unlockSlip(); return; }
    n++;
    if (n < 600) pollTimer = setTimeout(tick, n < 24 ? 5000 : 15000);
  };
  tick();
}

/* Friendly lines that change every few seconds while we wait, so the screen never feels stuck */
const PAY_TIPS = ["We have your order and your reference.", "Someone at the shop is checking your payment.", "No need to refresh: this page updates by itself.", "You can close this page and come back. Your order is saved.", "Good food, good mood."];
let tipTimer = null, tipN = 0;
function startTips() {
  const el = $("pay-tip"); if (!el) return;
  clearInterval(tipTimer); tipN = 0; el.textContent = PAY_TIPS[0];
  tipTimer = setInterval(() => {
    tipN = (tipN + 1) % PAY_TIPS.length;
    el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
    el.textContent = PAY_TIPS[tipN];
  }, 4000);
}
function popConfetti() {
  const box = $("confetti"); if (!box) return;
  box.replaceChildren();
  for (let i = 0; i < 22; i++) {
    const c = document.createElement("i");
    c.style.setProperty("--x", (Math.random() * 280 - 140) + "px");
    c.style.setProperty("--y", (Math.random() * 140 + 20) + "px");
    c.style.animationDelay = (Math.random() * .25) + "s";
    box.appendChild(c);
  }
}

/* Start (or resume) waiting for one order */
function beginWaiting(rec) {
  active = rec; saveActive();
  paidConfirmed = false;
  paintWaiting(false);
  startTips();
  startPolling(rec.ref);
  scheduleLate();
}

/* Back to the tab, or the phone is back online: check straight away and re-check the clock */
function recheck() {
  if (!active || paidConfirmed) return;
  startPolling(active.ref);
  scheduleLate();
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") recheck(); });
window.addEventListener("online", recheck);

/* "Order again" ends a confirmed order, so the old slip is not shown on the next visit */
$("order-again").addEventListener("click", () => { if (active && active.paid) { try { localStorage.removeItem(ACTIVE_KEY); } catch (e) {} } });

/* ---------- Order reference: long and random so nobody can guess another customer's ---------- */
function newRef() {
  const letters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";   // no look-alike characters
  const bytes = new Uint8Array(12);
  (window.crypto || window.msCrypto).getRandomValues(bytes);
  let t = ""; bytes.forEach((b) => (t += letters[b % letters.length]));
  return "GE-" + t.slice(0, 4) + "-" + t.slice(4, 8) + "-" + t.slice(8, 12);
}

/* ---------- PayFast ---------- */
/* The ONE place that differs between test and live. Sandbox: build the fields here with PayFast's public
   test merchant. Live: ask the Cloud Function, which adds the merchant key and the signature (never in this
   website's code) and works out the amount itself. Everything else below stays the same. */
async function getPayfastFields(p) {
  if (PAYFAST_MODE === "live") {
    const r = await fetch(PAYFAST_START_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: p.ref }) });
    if (!r.ok) throw new Error("Payment start answered " + r.status);
    const j = await r.json();
    return { action: j.action || PAYFAST_LIVE_URL, fields: j.fields };
  }
  const back = location.href.split("#")[0].split("?")[0];
  const fields = Object.assign({}, PAYFAST_SANDBOX_MERCHANT, {
    return_url: back + "?status=return&ref=" + encodeURIComponent(p.ref),
    cancel_url: back + "?status=cancel",
    name_first: p.name.split(" ")[0].slice(0, 100),
    m_payment_id: p.ref,
    amount: Number(p.total).toFixed(2),
    item_name: "Good Eats order " + p.ref,
  });
  if (PAYFAST_NOTIFY_URL) fields.notify_url = PAYFAST_NOTIFY_URL;
  return { action: PAYFAST_SANDBOX_URL, fields };
}
function postToPayfast(job) {
  const f = document.createElement("form");
  f.method = "post"; f.action = job.action; f.hidden = true;
  Object.keys(job.fields).forEach((k) => { const i = document.createElement("input"); i.type = "hidden"; i.name = k; i.value = job.fields[k]; f.appendChild(i); });
  document.body.appendChild(f);
  f.submit();
}

/* ##################################################################
   >>>>>>>>>>>>>>>>>>>>>>>>>>  FORM SUBMIT  <<<<<<<<<<<<<<<<<<<<<<<<<<
   Runs when the customer taps "Pay with PayFast".
   1. checks the form (including the terms tick box)
   2. records the order as "awaiting payment check" in Firebase (staff app), Make and Web3Forms
   3. sends the customer to PayFast's own secure page to pay
   Card or bank details never touch this website.
   ################################################################## */
$("order-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = $("form-status");
  const button = $("submit-btn");
  if (submitting) return;
  if (window.GE_refreshSoldOut) await window.GE_refreshSoldOut();   // get the newest sold-out list first

  const problem = validate(true);
  if (problem) {
    status.className = "status error";
    status.textContent = problem;
    return;
  }
  const makeOn = MAKE_WEBHOOK_URL.indexOf("http") === 0;
  const web3On = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(WEB3FORMS_ACCESS_KEY);

  submitting = true;
  button.disabled = true;
  button.textContent = "Taking you to PayFast...";
  status.className = "status";
  status.textContent = "";
  const ref = newRef();
  const payload = buildPayload({ ref });

  // Web3Forms wants flat fields. "message" is the readable order the restaurant receives.
  const web3 = {
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: "AWAITING PAYMENT CHECK: Good Eats order from " + payload.name + " (R" + payload.total + ") " + ref,
    from_name: "Good Eats website",
    name: payload.name,
    phone: payload.phone,
    order_type: payload.orderType,
    address: payload.address,
    map_link: payload.location.mapsLink,
    total: "R" + payload.total,
    message: payload.summaryText,
  };

  const sendMake = async () => {                                // <<< MAKE WEBHOOK is called here
    const r = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error("Make answered " + r.status);
  };
  const sendFirebase = async () => {                            // <<< FIREBASE (staff app) is written here
    // status stays "new" (the database rules require it). The payment note goes at the start of the notes,
    // so the staff app shows it even before it is updated to read the extra fields below.
    const base = {
      name: payload.name.slice(0, 99),
      phone: payload.phone.slice(0, 29),
      orderType: payload.orderType,
      address: payload.address.slice(0, 299),
      notes: ("AWAITING PAYMENT CHECK (PayFast" + (PAYFAST_MODE === "live" ? "" : " SANDBOX TEST") + ") Ref " + ref + ". " + payload.notes).slice(0, 499),
      mapsLink: String(payload.location.mapsLink || "").slice(0, 299),
      deliveryFee: Number(payload.deliveryFee) || 0,
      total: Number(payload.total) || 0,
      items: payload.items.map((i) => ({ name: String(i.name).slice(0, 99), price: Number(i.price), qty: Number(i.qty) })),
      status: "new",
      createdAt: Date.now(),
    };
    // Extra fields for the staff app's "awaiting payment check" badge. If the database rules do not
    // allow them yet (401), save the order without them so no order is ever lost.
    const rich = Object.assign({}, base, { ref, payment: "payfast", payStatus: "awaiting_check" });
    let r = await fetch(FIREBASE_DB_URL + "/onlineOrders.json", { method: "POST", body: JSON.stringify(rich) });
    if (!r.ok && r.status === 401) r = await fetch(FIREBASE_DB_URL + "/onlineOrders.json", { method: "POST", body: JSON.stringify(base) });
    if (!r.ok) throw new Error("Firebase answered " + r.status + ": " + (await r.text()).slice(0, 200));
  };
  const sendWeb3 = async () => {                                // <<< WEB3FORMS is called here
    const r = await fetch(WEB3FORMS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(web3),
    });
    const result = await r.json().catch(() => ({}));
    if (!r.ok || !result.success) throw new Error("Web3Forms answered " + r.status + ": " + (result.message || ""));
  };

  try {
    // Step 1: the shop MUST have the order before the customer pays. Firebase is the one the staff app reads.
    const jobs = [sendFirebase()];
    if (makeOn) jobs.push(sendMake());
    if (web3On) jobs.push(sendWeb3());
    const results = await Promise.allSettled(jobs);
    results.forEach((r) => { if (r.status === "rejected") console.error(r.reason); });
    if (results[0].status !== "fulfilled" && !results.some((r) => r.status === "fulfilled")) throw new Error("Order not recorded");

    // Step 2: remember the order (for the slip), then go to PayFast.
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(payload)); } catch (e) {}
    const job = await getPayfastFields(payload);
    postToPayfast(job);   // the browser leaves the site here
  } catch (err) {
    console.error(err);
    status.className = "status error";
    status.textContent = "We could not start the payment. Please try again, or use the WhatsApp button below.";
    submitting = false;
    button.disabled = !$("terms-ok").checked;
    renderCart();
  }
});

/* ---------- Coming back from PayFast ---------- */
/* Show the receipt screen for a saved or returning order. "mine" is the order we kept on this device (it is
   missing if the customer came back in another browser: then they only see the reference, as before). */
function openReceiptFor(rec) {
  cart.clear();                        // the order is with PayFast now
  thanksShowing = true;
  renderCart();
  const mine = rec.order && rec.order.ref === rec.ref ? rec.order : null;
  showReceipt(mine || { name: "", ref: rec.ref, items: [] }, mine ? "" : "Order ref: " + rec.ref + "\nPlease keep this reference.");
  if (!mine) { $("thanks-title").textContent = "Thank you!"; $("slip-btn").hidden = true; }
  active = rec;
  if (rec.paid) { paintWaiting(false); unlockSlip(); } else beginWaiting(rec);
}

(function () {
  const qs = new URLSearchParams(location.search);
  const st = qs.get("status"), ref = qs.get("ref");
  if (st === "cancel") {
    const status = $("form-status");
    status.className = "status error";
    status.textContent = "Payment was cancelled, so your order has not been paid. Your cart is still here if you want to try again.";
    return;
  }
  if (st === "return" && ref) {
    let pending = null;
    try { pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "null"); } catch (e) {}
    const mine = pending && pending.ref === ref ? pending : null;
    // A reload of this page keeps the same record (and the same start time), so the minute is not restarted.
    const saved = loadActive();
    const rec = saved && saved.ref === ref ? saved : { ref, startedAt: Date.now(), paid: false, popupShown: false, order: mine };
    if (!rec.order && mine) rec.order = mine;
    openReceiptFor(rec);
    return;
  }
  /* Opened again without the PayFast address (closed the tab, came back later): bring the order back. */
  const rec = loadActive();
  if (!rec) return;
  if (cart.size > 0) {                 // already building a new order: do not take over the page, just mention it
    $("last-order-ref").textContent = rec.ref;
    $("last-order-note").hidden = false;
    return;
  }
  openReceiptFor(rec);
})();

renderCart();

/* ---------- Shrinking header (same as the other pages) ---------- */
(function () {
  const header = document.querySelector(".site-header");
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 40);
  }, { passive: true });
})();

/* Coming back with the Back button: reload so the cart is current */
window.addEventListener("pageshow", (e) => { if (e.persisted) window.location.reload(); });


/* ---------- Download the order slip (PDF with the order reference; only for confirmed payments) ---------- */
async function logoData() {
  try {
    const b = await (await fetch("images/logo.png")).blob();
    return await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
  } catch (e) { return null; }
}
$("slip-btn").addEventListener("click", async () => {
  const p = lastOrder;
  if (!paidConfirmed) return;            // the slip is only for confirmed payments
  if (!p || !window.jspdf) { alert("The slip could not be made. Please take a screenshot of this screen instead."); return; }
  const lines = p.items.length, h = 165 + lines * 7 + (p.address ? 14 : 0);
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: [80, h] });
  const mid = 40; let y = 8;
  const logo = await logoData();
  if (logo) { try { doc.addImage(logo, "PNG", 25, y, 30, 30); y += 34; } catch (e) { y += 4; } }
  doc.setFont("courier", "bold"); doc.setFontSize(14); doc.text("GOOD EATS", mid, y, { align: "center" }); y += 5;
  doc.setFont("courier", "normal"); doc.setFontSize(8);
  doc.text("21 Chapel Street, Central, Gqeberha", mid, y, { align: "center" }); y += 4;
  doc.text("WhatsApp " + WHATSAPP_NUMBER, mid, y, { align: "center" }); y += 5;
  const dash = () => { doc.text("-".repeat(38), mid, y, { align: "center" }); y += 5; };
  dash();
  doc.setFont("courier", "bold"); doc.setFontSize(9); doc.text("ORDER FOR", mid, y, { align: "center" }); y += 6;
  doc.setFontSize(15); doc.text(p.name.toUpperCase().slice(0, 22), mid, y, { align: "center" }); y += 6;
  doc.setFont("courier", "normal"); doc.setFontSize(8);
  doc.text(new Date(p.submittedAt).toLocaleString("en-ZA"), mid, y, { align: "center" }); y += 4;
  doc.text(p.orderType === "delivery" ? "DELIVERY" : "COLLECTION", mid, y, { align: "center" }); y += 4;
  if (p.ref) { doc.setFont("courier", "bold"); doc.text("REF " + p.ref, mid, y, { align: "center" }); doc.setFont("courier", "normal"); y += 5; } else y += 1;
  dash();
  p.items.forEach((i) => {
    const t = i.qty + " x " + i.name; const wrapped = doc.splitTextToSize(t, 52);
    doc.text(wrapped, 6, y); doc.text(rand(i.price * i.qty), 74, y, { align: "right" }); y += 4 * wrapped.length + 1;
  });
  dash();
  doc.text("Subtotal", 6, y); doc.text(rand(p.subtotal), 74, y, { align: "right" }); y += 4;
  if (p.deliveryFee) { doc.text("Delivery", 6, y); doc.text(rand(p.deliveryFee), 74, y, { align: "right" }); y += 4; }
  doc.setFont("courier", "bold"); doc.setFontSize(11);
  doc.text("TOTAL", 6, y + 2); doc.text(rand(p.total), 74, y + 2, { align: "right" }); y += 8;
  doc.setFont("courier", "normal"); doc.setFontSize(8);
  if (p.address) { const a = doc.splitTextToSize("Address: " + p.address, 68); doc.text(a, 6, y); y += 4 * a.length + 2; }
  if (p.notes) { const n = doc.splitTextToSize("Notes: " + p.notes, 68); doc.text(n, 6, y); y += 4 * n.length + 2; }
  dash();
  doc.setFont("courier", "bold"); doc.setFontSize(12); doc.text("PAID" + (PAYFAST_MODE === "live" ? "" : " (TEST)"), mid, y + 1, { align: "center" }); y += 7;
  doc.setFont("courier", "normal"); doc.setFontSize(8);
  doc.text("Thank you for ordering!", mid, y, { align: "center" }); y += 4;
  doc.text("Good food, good mood.", mid, y, { align: "center" });
  doc.save("Good-Eats-slip-" + (p.ref || p.name.replace(/[^a-z0-9]+/gi, "-")) + ".pdf");
});
