/* ====================================================================
   Good Eats: SOLD OUT sync
   ====================================================================
   When staff mark a dish "sold out" in the staff app, the staff app
   saves the list at  soldoutPublic  in the Firebase database. This file
   reads that list (about once a minute) and:
     - greys out the Add button and shows "Sold out"
     - stops a customer sending an order that still has a sold-out dish
   If the list cannot be loaded (no signal, Firebase down), nothing is
   blocked: the menu works exactly as before.

   You do NOT need to edit this file. Load it AFTER menu-render.js.
   ==================================================================== */
(function () {
  "use strict";

  const SOLD_URL = "https://restaurant-order-a7eaf-default-rtdb.europe-west1.firebasedatabase.app/soldoutPublic.json";
  const REFRESH_MS = 60000;

  // Turns a dish name into a key. MUST give the same answer as the staff
  // app does for the same dish ("Chips (Small)" and "Small Chips" match).
  const SKIP = new Set(["toastie", "toasties", "toasty", "toasts", "croissant", "croissants",
    "savoury", "savory", "and", "the", "a", "with", "each"]);
  const key = (name) => String(name)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/).filter((w) => w && !SKIP.has(w))
    .sort().join(" ");

  let sold = {};

  const isSoldOut = (name) => sold[key(name)] === true;

  function applyToButtons() {
    document.querySelectorAll(".add").forEach((btn) => {
      const out = isSoldOut(btn.dataset.name);
      if (out) {
        btn.disabled = true;
        btn.classList.add("sold-out");
        btn.textContent = "Sold out";
      } else if (btn.classList.contains("sold-out")) {
        btn.disabled = false;
        btn.classList.remove("sold-out");
        btn.textContent = "Add";
      }
    });
  }

  // Returns "" when everything is fine, or a message naming what sold out.
  window.GE_soldOutProblem = function (names) {
    const out = [...names].filter(isSoldOut);
    if (!out.length) return "";
    return "Sorry, " + out.join(", ") + (out.length === 1 ? " has" : " have") +
      " just sold out. Please remove it from your order.";
  };

  // Loads the latest list. Never throws; gives up after 3 seconds.
  window.GE_refreshSoldOut = async function () {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 3000);
      const r = await fetch(SOLD_URL, { cache: "no-store", signal: ctl.signal });
      clearTimeout(timer);
      if (!r.ok) return;
      const data = await r.json();
      sold = data && typeof data === "object" ? data : {};
      applyToButtons();
    } catch (e) { /* keep the last known list */ }
  };

  window.GE_refreshSoldOut();
  setInterval(window.GE_refreshSoldOut, REFRESH_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") window.GE_refreshSoldOut();
  });
})();
