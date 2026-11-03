/* ====================================================================
   Good Eats: menu builder
   ====================================================================
   You do NOT need to edit this file. To change the menu, edit
   menu-data.js. This file reads that list and draws the menu on the
   page, then script.js / cart-lite.js make the Add buttons work.

   It must be loaded AFTER menu-data.js and BEFORE script.js and
   cart-lite.js (the order of the <script> tags at the bottom of each
   page already does this).
   ==================================================================== */
(function () {
  "use strict";

  /* ---------- Small helpers ---------- */

  // Make an element: el("li", "items-row", "text")
  // Text goes in through textContent, so characters like & and < are always safe.
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  const money = (n) => "R" + n;                       // 45 -> "R45"
  const cartName = (item) => item.cart || item.name;  // the name used in the cart and the order email
  const onCategoryPage = document.body.classList.contains("cat-page");
  const homePrefix = onCategoryPage ? "index.html" : ""; // links back to sections of the home page
  const pageOf = (cat) => cat.page || cat.id + ".html";

  /* ---------- Safety net: menu-data.js is missing or has a typo ---------- */
  // If menu-data.js has a mistake (a missing comma or quote), the browser
  // stops reading it and MENU does not exist. Show a clear message instead of a blank page.
  if (typeof MENU === "undefined" || !Array.isArray(MENU)) {
    const msg = "The menu could not load. Open the browser console (F12) to see the mistake in menu-data.js.";
    console.error("menu-data.js did not load properly. Check for a missing comma, quote or bracket.");
    document.querySelectorAll("[data-menu-root], #cat-grid, #special-grid").forEach((box) => {
      box.replaceChildren(el("p", "sub", msg));
    });
    return;
  }

  /* ---------- Check the data and warn (in the console) about mistakes ---------- */
  const seen = new Map(); // cart name -> price, to catch two products with the same name but different prices
  MENU.forEach((cat) => {
    (cat.items || []).forEach((item) => {
      if (typeof item.price !== "number" || !(item.price >= 0)) {
        console.warn('Menu: "' + item.name + '" has no valid price. Use a number like price: 25');
      }
      const key = cartName(item);
      if (seen.has(key) && seen.get(key) !== item.price) {
        console.warn('Menu: two products are called "' + key + '" with different prices. Give one a different "cart" name.');
      }
      seen.set(key, item.price);
    });
  });

  // Find a product by its cart name (used by the Specials)
  function findItem(name) {
    for (const cat of MENU) {
      for (const item of cat.items || []) {
        if (cartName(item) === name) return item;
      }
    }
    return null;
  }

  // The "Add" button. script.js and cart-lite.js look for class "add" with
  // data-name and data-price, so this is the only thing the cart needs.
  function addButton(item) {
    const btn = el("button", "add", "Add");
    btn.type = "button";
    btn.dataset.name = cartName(item);
    btn.dataset.price = String(item.price);
    return btn;
  }

  // The text on a home page card: "From R20", or "R45" / "All R45" when the prices are the same.
  function cardPrice(cat) {
    if (cat.cardPrice) return cat.cardPrice;
    const prices = (cat.items || []).map((i) => i.price);
    if (prices.length === 0) return "";
    const low = Math.min(...prices);
    const high = Math.max(...prices);
    if (low !== high) return "From " + money(low);
    return prices.length > 1 ? "All " + money(low) : money(low);
  }

  // A food photo. If the file does not exist yet, it hides itself
  // (script.js / cart-lite.js hide any ".photo" that fails to load).
  function photo(cat) {
    const img = el("img", "photo");
    img.src = cat.photo;
    img.alt = cat.alt || cat.title;
    img.loading = "lazy";
    return img;
  }

  /* ---------- 1. Navigation links in the header ---------- */
  document.querySelectorAll("[data-menu-nav]").forEach((nav) => {
    const current = document.body.dataset.category;
    const spec = el("a", "", "Specials");
    spec.href = homePrefix + "#specials";
    nav.appendChild(spec);
    MENU.forEach((cat) => {
      const a = el("a", "", cat.title);
      a.href = pageOf(cat);
      if (cat.id === current) a.setAttribute("aria-current", "page");
      nav.appendChild(a);
    });
    const visit = el("a", "", "Find us");
    visit.href = homePrefix + "#visit";
    nav.appendChild(visit);
  });

  /* ---------- 2. A category page (burgers.html and so on) ---------- */
  document.querySelectorAll("[data-menu-root]").forEach((root) => {
    const cat = MENU.find((c) => c.id === root.dataset.menuRoot);
    if (!cat) {
      root.appendChild(el("p", "sub", "This menu page is not set up. Check the id in menu-data.js."));
      return;
    }
    document.title = cat.title + " | Good Eats | Gqeberha";
    root.setAttribute("aria-label", cat.title);

    const block = el("article", "menu-block");
    const text = el("div", "menu-text");
    text.appendChild(el("h1", "brush brush-lg", cat.title));
    if (cat.note) text.appendChild(el("p", "sub", cat.note));

    const list = el("ul", "items");
    (cat.items || []).forEach((item) => {
      const li = el("li");
      li.append(
        el("span", "name", item.name),
        el("span", "dots"),
        el("span", "price", money(item.price)),
        addButton(item)
      );
      list.appendChild(li);
    });
    text.appendChild(list);

    block.appendChild(text);
    if (cat.photo) block.appendChild(photo(cat));
    root.replaceChildren(block);
  });

  /* ---------- 3. "Hungry for something else?" buttons ---------- */
  document.querySelectorAll("[data-menu-more]").forEach((box) => {
    MENU.filter((c) => c.id !== box.dataset.menuMore).forEach((cat) => {
      const a = el("a", "btn btn-outline", cat.title);
      a.href = pageOf(cat);
      box.appendChild(a);
    });
  });

  /* ---------- 4. The category cards on the home page ---------- */
  const grid = document.getElementById("cat-grid");
  if (grid) {
    grid.replaceChildren(...MENU.map((cat) => {
      const a = el("a", "cat-card");
      a.href = pageOf(cat);
      if (cat.photo) a.appendChild(photo(cat));
      const body = el("span", "cat-card-body");
      body.append(el("strong", "cat-name", cat.title), el("span", "from", cardPrice(cat)));
      a.appendChild(body);
      return a;
    }));
  }

  /* ---------- 5. "Start here" specials ---------- */
  const specials = document.getElementById("special-grid");
  if (specials) {
    const cards = [];
    SPECIALS.forEach((s) => {
      const item = findItem(s.item);
      if (!item) {
        // The product was removed from the menu, so its special is skipped
        console.warn('Specials: "' + s.item + '" is not on the menu any more, so that special is hidden.');
        return;
      }
      const card = el("article", "special");
      card.append(
        el("p", "special-price", money(item.price)),
        el("h3", "", s.title || item.name),
        el("p", "", s.text || ""),
        addButton(item)
      );
      cards.push(card);
    });
    specials.replaceChildren(...cards);
    // Hide the whole "Start here" section if there are no specials
    const section = document.getElementById("specials");
    if (section) section.hidden = cards.length === 0;
  }

  /* ---------- 6. The scrolling ticker ---------- */
  const track = document.querySelector(".ticker-track");
  if (track && typeof TICKER !== "undefined") {
    const spans = [];
    // Two copies make the scroll loop without a gap. The second copy is hidden from screen readers.
    [false, true].forEach((isCopy) => {
      TICKER.forEach((phrase) => {
        const s = el("span", "", phrase);
        if (isCopy) s.setAttribute("aria-hidden", "true");
        spans.push(s);
      });
    });
    track.replaceChildren(...spans);
    const ticker = track.closest(".ticker");
    if (ticker) ticker.hidden = TICKER.length === 0;
  }
})();
