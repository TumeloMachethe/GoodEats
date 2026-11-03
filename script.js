/* Good Eats: cart, location, order form, Make webhook */

/* ##################################################################
   >>>>>>>>>>>>>>>>>>>>>>>>  MAKE WEBHOOK  <<<<<<<<<<<<<<<<<<<<<<<<<<
   Paste your Make webhook URL between the quotes on the next line.
   Make: Create scenario > Webhooks > Custom webhook > copy the URL.
   ################################################################## */
const MAKE_WEBHOOK_URL = "PASTE_MAKE_WEBHOOK_URL_HERE";

/* ---------- Shop settings (edit these) ---------- */
const OPENING_HOURS = "Mon to Sat, 8am to 4pm";        // Example: "Mon to Sat, 8am to 8pm". Leave empty to hide hours.
const DELIVERY_FEE = 30;          // In rand. 0 = no delivery fee line.
const WHATSAPP_NUMBER = "083 941 5837";
const WHATSAPP_INTL = "27839415837";

/* ---------- Helpers ---------- */
const $ = (id) => document.getElementById(id);
const rand = (n) => "R" + n;
const CART_KEY = "goodeats-cart";   // shared with cart-lite.js (the category pages)
const cart = new Map();          // name -> { price, qty }
try {
  JSON.parse(localStorage.getItem(CART_KEY) || "[]").forEach(([n, i]) => {
    if (i && Number(i.price) >= 0 && Number(i.qty) > 0) cart.set(n, { price: Number(i.price), qty: Number(i.qty) });
  });
} catch (e) {}
function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify([...cart])); } catch (e) {} }
let geo = { lat: null, lng: null, mapsLink: "" };
let orderInView = false;

function orderType() {
  return document.querySelector('input[name="orderType"]:checked').value;
}
function cartCount() { let n = 0; cart.forEach((i) => (n += i.qty)); return n; }
function cartSubtotal() { let t = 0; cart.forEach((i) => (t += i.price * i.qty)); return t; }
function deliveryCharge() {
  return cart.size > 0 && orderType() === "delivery" && DELIVERY_FEE > 0 ? DELIVERY_FEE : 0;
}
function orderTotal() { return cartSubtotal() + deliveryCharge(); }

/* ---------- Opening hours ---------- */
document.querySelectorAll("[data-hours]").forEach((el) => {
  if (OPENING_HOURS) { el.textContent = "Open: " + OPENING_HOURS; el.hidden = false; }
});

/* ---------- Cart display ---------- */
function renderCart() {
  const list = $("cart-items");
  list.innerHTML = "";

  cart.forEach((item, name) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.className = "cart-name";
    label.textContent = name;

    const qty = document.createElement("span");
    qty.className = "qty";
    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "\u2212";
    minus.setAttribute("aria-label", "Remove one " + name);
    minus.addEventListener("click", () => changeQty(name, -1));
    const num = document.createElement("span");
    num.textContent = item.qty;
    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", "Add one " + name);
    plus.addEventListener("click", () => changeQty(name, 1));
    qty.append(minus, num, plus);

    const line = document.createElement("span");
    line.className = "cart-line";
    line.textContent = rand(item.price * item.qty);

    li.append(label, qty, line);
    list.appendChild(li);
  });

  const empty = cart.size === 0;
  const fee = deliveryCharge();
  $("cart-empty").hidden = !empty;
  $("cart-totals").hidden = empty;
  $("subtotal-amount").textContent = rand(cartSubtotal());
  $("fee-row").hidden = fee === 0;
  $("fee-amount").textContent = rand(fee);
  $("total-amount").textContent = rand(orderTotal());

  document.querySelector(".site-header .btn-yellow").textContent =
    empty ? "Order now" : "Order now (" + cartCount() + ")";
  saveCart();
  updateBar();
}

function changeQty(name, delta) {
  const item = cart.get(name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart.delete(name);
  renderCart();
}

document.querySelectorAll(".add").forEach((btn) => {
  btn.addEventListener("click", () => {
    const name = btn.dataset.name;
    const item = cart.get(name);
    if (item) item.qty += 1;
    else cart.set(name, { price: Number(btn.dataset.price), qty: 1 });
    renderCart();
    const original = btn.textContent;
    btn.textContent = "Added";
    setTimeout(() => (btn.textContent = original), 900);
  });
});

/* ---------- Floating cart bar (phones) ---------- */
function updateBar() {
  const n = cartCount();
  $("cart-bar").hidden = n === 0 || orderInView;
  $("bar-count").textContent = n + (n === 1 ? " item" : " items");
  $("bar-total").textContent = rand(orderTotal());
}
if ("IntersectionObserver" in window) {
  new IntersectionObserver((entries) => {
    orderInView = entries[0].isIntersecting;
    updateBar();
  }, { threshold: 0.15 }).observe($("order"));
}

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
  if (cart.size === 0) return "Your order is empty. Tap Add on a menu item first.";
  if (!$("name").value.trim()) return "Please enter your name.";
  if ($("phone").value.replace(/\D/g, "").length < 10) return "Please enter a phone number with 10 digits.";
  if (orderType() === "delivery" && !$("address").value.trim()) return "Please enter your delivery address.";
  return "";
}

/* ---------- WhatsApp backup ---------- */
$("wa-btn").addEventListener("click", () => {
  const status = $("form-status");
  if (cart.size === 0) {
    status.className = "status error";
    status.textContent = "Your order is empty. Tap Add on a menu item first.";
    return;
  }
  const url = "https://wa.me/" + WHATSAPP_INTL + "?text=" + encodeURIComponent(buildPayload().summaryText);
  window.open(url, "_blank", "noopener");
});

/* ---------- Thank-you screen ---------- */
function showThanks(summary) {
  $("thanks-summary").textContent = summary;
  $("order-form").hidden = true;
  $("thanks").hidden = false;
  $("thanks").scrollIntoView({ behavior: "smooth", block: "start" });
  $("thanks").focus();
}
$("order-again").addEventListener("click", () => {
  $("thanks").hidden = true;
  $("order-form").hidden = false;
  document.getElementById("top").scrollIntoView({ behavior: "smooth" });
});

/* ##################################################################
   >>>>>>>>>>>>>>>>>>>>>>>>>>  FORM SUBMIT  <<<<<<<<<<<<<<<<<<<<<<<<<<
   Runs when the customer taps "Send order".
   It checks the form, then POSTs the order to MAKE_WEBHOOK_URL (top
   of this file). Make then emails the order to the restaurant.
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
  if (MAKE_WEBHOOK_URL.indexOf("http") !== 0) {
    status.className = "status error";
    status.textContent = "Online ordering is not switched on yet. Please use the WhatsApp button below.";
    console.warn("Paste your Make webhook URL into MAKE_WEBHOOK_URL at the top of script.js");
    return;
  }

  button.disabled = true;
  button.textContent = "Sending...";
  status.className = "status";
  status.textContent = "";
  const payload = buildPayload();

  try {
    const response = await fetch(MAKE_WEBHOOK_URL, {            // <<< MAKE WEBHOOK is called here
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Webhook answered " + response.status);

    cart.clear();
    $("order-form").reset();
    $("delivery-fields").hidden = false;
    $("location-status").textContent = "";
    geo = { lat: null, lng: null, mapsLink: "" };
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

/* ---------- Hide a food photo that has not been added yet ---------- */
document.querySelectorAll(".photo").forEach((img) => {
  const hide = () => (img.hidden = true);
  img.addEventListener("error", hide);
  if (img.complete && img.naturalWidth === 0) hide();
});

/* ##################################################################
   Part 5: scroll effects and promo video
   ################################################################## */
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector(".site-header");
  const bar = $("scroll-progress");
  const video = $("promo-video");
  const toggle = $("video-toggle");

  /* Scroll progress bar, shrinking header, video parallax */
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    header.classList.toggle("scrolled", y > 40);
    if (video && !reduce && y < window.innerHeight) video.style.transform = "translateY(" + y * 0.25 + "px)";
    ticking = false;
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* Reveal sections as they scroll into view */
  document.documentElement.classList.add("js");
  const targets = document.querySelectorAll(".cat-card, .special, .step-list li, .visit-grid, .order > *:not(form), .owner-card, .staff-card, .review, .review-cta");
  targets.forEach((el) => el.classList.add("reveal"));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    targets.forEach((el) => io.observe(el));
  } else {
    targets.forEach((el) => el.classList.add("in"));
  }

  /* Highlight the nav link for the section on screen */
  const links = new Map();
  document.querySelectorAll(".nav a").forEach((a) => links.set(a.getAttribute("href").slice(1), a));
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.classList.remove("active"));
        const a = links.get(e.target.id);
        if (a) a.classList.add("active");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    links.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* Promo video: hide it if the file is missing, offer pause, respect reduced motion */
  if (video) {
    const source = video.querySelector("source");
    const noVideo = () => { video.hidden = true; if (toggle) toggle.hidden = true; };
    source.addEventListener("error", noVideo);
    video.addEventListener("error", noVideo);
    video.addEventListener("loadeddata", () => { if (toggle) toggle.hidden = false; });
    if (reduce) video.removeAttribute("autoplay");
    if (toggle) toggle.addEventListener("click", () => {
      if (video.paused) { video.play(); toggle.textContent = "Pause video"; toggle.setAttribute("aria-label", "Pause promo video"); }
      else { video.pause(); toggle.textContent = "Play video"; toggle.setAttribute("aria-label", "Play promo video"); }
    });
  }
})();

/* Coming back with the Back button: reload so the cart is current */
window.addEventListener("pageshow", (e) => { if (e.persisted) window.location.reload(); });
