/* Good Eats: the order page (cart.html)
   Shows the cart, adds up the total, collects the customer's details and
   sends the order (to Make AND Web3Forms, or WhatsApp as a backup).
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
let thanksShowing = false;                           // true after an order was sent

function orderType() {
  return document.querySelector('input[name="orderType"]:checked').value;
}
function cartCount() { let n = 0; cart.forEach((i) => (n += i.qty)); return n; }
function cartSubtotal() { let t = 0; cart.forEach((i) => (t += i.price * i.qty)); return t; }
function deliveryCharge() {
  return cart.size > 0 && orderType() === "delivery" && DELIVERY_FEE > 0 ? DELIVERY_FEE : 0;
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
  $("fee-row").hidden = fee === 0;
  $("fee-amount").textContent = rand(fee);
  $("total-amount").textContent = rand(orderTotal());

  document.querySelector(".site-header .btn-yellow").textContent =
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
function buildPayload() {
  const items = [];
  cart.forEach((i, name) => items.push({ name, price: i.price, qty: i.qty }));
  const type = orderType();
  const data = {
    name: $("name").value.trim(),
    phone: $("phone").value.trim(),
    orderType: type,
    address: type === "delivery" ? $("address").value.trim() : "",
    notes: $("notes").value.trim(),
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
    "Type: " + data.orderType,
    data.address ? "Address: " + data.address : "",
    data.location.mapsLink ? "Map: " + data.location.mapsLink : "",
    "",
    "Items:",
    ...lines,
    data.deliveryFee ? "Delivery: " + rand(data.deliveryFee) : "",
    "Total: " + rand(data.total),
    data.notes ? "Notes: " + data.notes : "",
  ].filter((l, idx, arr) => l !== "" || arr[idx - 1] !== "").join("\n");
  return data;
}

function validate() {
  if (cart.size === 0) return "Your order is empty. Pick something from the menu first.";
  if (!$("name").value.trim()) return "Please enter your name.";
  if ($("phone").value.replace(/\D/g, "").length < 10) return "Please enter a phone number with 10 digits.";
  if (orderType() === "delivery" && !$("address").value.trim()) return "Please enter your delivery address.";
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
  const url = "https://wa.me/" + WHATSAPP_INTL + "?text=" + encodeURIComponent(buildPayload().summaryText);
  window.open(url, "_blank", "noopener");
});

/* ---------- Thank-you screen ---------- */
function showThanks(summary) {
  thanksShowing = true;
  $("thanks-summary").textContent = summary;
  $("order-form").hidden = true;
  $("cart-empty").hidden = true;
  $("thanks").hidden = false;
  $("thanks").scrollIntoView({ behavior: "smooth", block: "start" });
  $("thanks").focus();
}

/* ##################################################################
   >>>>>>>>>>>>>>>>>>>>>>>>>>  FORM SUBMIT  <<<<<<<<<<<<<<<<<<<<<<<<<<
   Runs when the customer taps "Send order".
   It checks the form, then sends the order to BOTH:
   - Make (MAKE_WEBHOOK_URL, in settings.js)
   - Web3Forms (WEB3FORMS_ACCESS_KEY, at the top of this file)
   The customer sees "thank you" if at least one of them accepts it.
   A service that is not set up yet is skipped.
   ################################################################## */
$("order-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = $("form-status");
  const button = $("submit-btn");

  const problem = validate();
  if (problem) {
    status.className = "status error";
    status.textContent = problem;
    return;
  }
  const makeOn = MAKE_WEBHOOK_URL.indexOf("http") === 0;
  const web3On = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(WEB3FORMS_ACCESS_KEY);
  if (!makeOn && !web3On) {
    status.className = "status error";
    status.textContent = "Online ordering is not switched on yet. Please use the WhatsApp button below.";
    console.warn("Paste your Make webhook URL (settings.js) and/or Web3Forms key (top of order.js)");
    return;
  }

  button.disabled = true;
  button.textContent = "Sending...";
  status.className = "status";
  status.textContent = "";
  const payload = buildPayload();

  // Web3Forms wants flat fields. "message" is the readable order the restaurant receives.
  const web3 = {
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: "New Good Eats order from " + payload.name + " (R" + payload.total + ")",
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
    const jobs = [];
    if (makeOn) jobs.push(sendMake());
    if (web3On) jobs.push(sendWeb3());
    const results = await Promise.allSettled(jobs);
    results.forEach((r) => { if (r.status === "rejected") console.error(r.reason); });
    if (!results.some((r) => r.status === "fulfilled")) throw new Error("Every service failed");

    cart.clear();
    $("order-form").reset();
    $("delivery-fields").hidden = false;
    $("location-status").textContent = "";
    geo = { lat: null, lng: null, mapsLink: "" };
    thanksShowing = true;
    renderCart();
    showThanks(payload.summaryText);
  } catch (err) {
    console.error(err);
    status.className = "status error";
    status.textContent = "Your order did not go through. Please try again, or use the WhatsApp button below.";
  } finally {
    button.disabled = false;
    button.textContent = "Send order";
  }
});

renderCart();

/* ---------- Scroll bar and shrinking header (same as the other pages) ---------- */
(function () {
  const header = document.querySelector(".site-header");
  const bar = $("scroll-progress");
  window.addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
    header.classList.toggle("scrolled", window.scrollY > 40);
  }, { passive: true });
})();

/* Coming back with the Back button: reload so the cart is current */
window.addEventListener("pageshow", (e) => { if (e.persisted) window.location.reload(); });
