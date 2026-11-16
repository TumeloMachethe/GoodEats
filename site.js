/* ====================================================================
   GOOD EATS: site.js  (the ONE script for the whole website)
   ====================================================================
   Load order at the bottom of every page:
     settings.js   (home + order page only)   shop settings
     menu-data.js  (menu pages only)           THE MENU, edit this to change products
     site.js       (every page)                this file
     soldout.js    (menu pages)                sold-out sync with the staff app
     order.js      (cart.html only)            the order form
   Each section below only runs on the pages that need it, so one file is safe everywhere.
   Sections:
     1. Light / dark switch
     2. Menu builder (reads menu-data.js: nav, category pages, cards, specials, combos, ticker)
     3. Easy-order layer (photo cards, pop-up sheet, search, "add a drink?")
     4. Cart on menu pages (Add buttons, cart bar, shrinking header)
     5. Home page effects (video, scroll reveal, nav highlight, opening hours)
   ==================================================================== */

/* ---------- 1. LIGHT / DARK SWITCH (light is the default; the choice is remembered) ---------- */
(function () {
  var KEY = "goodeats-theme", root = document.documentElement;
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function apply(t) {
    root.setAttribute("data-theme", t);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "dark" ? "#141414" : "#faf6ec");
  }
  apply(saved() === "dark" ? "dark" : "light");

  document.addEventListener("DOMContentLoaded", function () {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "theme-toggle";
    var sun = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3L7 7M17 17l1.7 1.7M5.3 18.7L7 17M17 7l1.7-1.7"/></svg>';
    var moon = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/></svg>';
    function paint() {
      var light = root.getAttribute("data-theme") === "light";
      btn.innerHTML = light ? moon : sun;               /* shows what you will switch to */
      btn.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
    }
    paint();
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.classList.add("theme-anim");                  /* smooth colour fade */
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) {}
      paint();
      setTimeout(function () { root.classList.remove("theme-anim"); }, 500);
    });
    var order = header.querySelector(".btn");
    if (order) header.insertBefore(btn, order); else header.appendChild(btn);
  });
})();


/* ---------- 2. MENU BUILDER ---------- */
(function () {
  "use strict";
  if (!document.querySelector("[data-menu-root], [data-menu-nav], [data-menu-more], #cat-grid, #special-grid, #combo-grid, .ticker-track")) return;

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

  // The "Add" button. section 4 (the cart) looks for class "add" with
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
  // (section 4 hides any ".photo" that fails to load).
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
    const spec = el("a", "", "Popular");
    spec.href = homePrefix + "#specials";
    nav.appendChild(spec);
    if (typeof COMBOS !== "undefined" && COMBOS.length) { const cb = el("a", "", "Combos"); cb.href = homePrefix + "#combos"; nav.appendChild(cb); }
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

  /* ---------- 5. "Popular right now" specials ---------- */
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
    // Hide the whole "Popular right now" section if there are no specials
    const section = document.getElementById("specials");
    if (section) section.hidden = cards.length === 0;
  }

  /* ---------- 5b. Combos: photo cards that open a pop-up ---------- */
  const comboGrid = document.getElementById("combo-grid");
  if (comboGrid && typeof COMBOS !== "undefined") {
    const openCombo = (c) => {
      const back = el("div", "sheet-back"); const sh = el("div", "sheet"); back.appendChild(sh);
      const close = () => { back.remove(); document.removeEventListener("keydown", onKey); };
      const onKey = (e) => { if (e.key === "Escape") close(); };
      document.addEventListener("keydown", onKey);
      back.addEventListener("click", (e) => { if (e.target === back) close(); });
      const x = el("button", "sheet-x", "\u00d7"); x.type = "button"; x.setAttribute("aria-label", "Close"); x.onclick = close;
      const pic = el("div", "sheet-pic combo-pic");
      if (c.img) { const im = el("img"); im.src = c.img; im.alt = c.title; im.addEventListener("error", () => im.remove()); pic.appendChild(im); }
      pic.appendChild(el("span", "pfallback", c.title.charAt(0)));
      sh.append(x, pic, el("h3", "", c.title), el("p", "special-price", money(c.price)));
      if (c.items && c.items.length) {
        const ul = el("ul", "combo-list");
        c.items.forEach((t) => ul.appendChild(el("li", "", t)));
        sh.appendChild(ul);
      } else if (c.text) sh.appendChild(el("p", "", c.text));
      const add = el("button", "btn btn-yellow btn-block", "Add combo \u00b7 " + money(c.price)); add.type = "button";
      add.onclick = () => {
        if (window.GE_addToCart) window.GE_addToCart("Combo: " + c.title, c.price, 1);
        add.textContent = "Added \u2713"; setTimeout(close, 700);
      };
      sh.appendChild(add);
      document.body.appendChild(back);
    };
    const cards = COMBOS.map((c) => {
      const card = el("article", "combo-card"); card.tabIndex = 0; card.setAttribute("role", "button");
      card.setAttribute("aria-label", c.title + ", " + money(c.price) + ". Tap to see what is in it.");
      if (c.img) { const im = el("img", "combo-bg"); im.src = c.img; im.alt = ""; im.loading = "lazy"; im.addEventListener("error", () => im.remove()); card.appendChild(im); }
      const body = el("div", "combo-body");
      body.append(el("h3", "", c.title), el("p", "combo-text", c.text || ""), el("p", "special-price", money(c.price)));
      card.appendChild(body);
      card.addEventListener("click", () => openCombo(c));
      card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCombo(c); } });
      return card;
    });
    comboGrid.replaceChildren(...cards);
    const cs = document.getElementById("combos");
    if (cs) cs.hidden = cards.length === 0;
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


/* ---------- 3. EASY-ORDER LAYER ---------- */
(function () {
  "use strict";
  if (typeof MENU === "undefined") return;
  if (!document.querySelector("[data-menu-root], #cat-grid")) return;
  const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x !== undefined) n.textContent = x; return n; };
  const R = (n) => "R" + n;
  const page = (c) => c.page || c.id + ".html";
  const cartOf = (i) => i.cart || i.name;
  const onCat = document.body.classList.contains("cat-page");

  /* ---- Card ---- */
  function card(item, cat) {
    const b = el("button", "pcard"); b.type = "button";
    const ph = el("span", "pimg");
    const img = el("img"); img.src = item.img || ""; img.alt = item.name; img.loading = "lazy";
    img.addEventListener("error", () => img.remove());
    ph.append(img, el("span", "pfallback", item.name.charAt(0)));
    const body = el("span", "pbody");
    body.append(el("strong", "pname", item.name), el("span", "pprice", (item.sizes ? "From " : "") + R(item.price)));
    b.append(ph, body, el("span", "pplus", "+"));
    b.addEventListener("click", () => openSheet(item, cat));
    return b;
  }

  /* ---- Replace the plain list on category pages with cards ---- */
  document.querySelectorAll("[data-menu-root]").forEach((root) => {
    const cat = MENU.find((c) => c.id === root.dataset.menuRoot); if (!cat) return;
    const list = root.querySelector(".items"); if (!list) return;
    const grid = el("div", "pgrid");
    cat.items.forEach((i) => grid.appendChild(card(i, cat)));
    list.replaceWith(grid);
    const ph = root.querySelector("img.photo"); if (ph) ph.remove();
    const blk = root.querySelector(".menu-block"); if (blk) blk.classList.add("cards-block");
  });

  /* ---- Search: a magnifying glass in the header. The category chips bar is gone (the header menu already has them). ---- */
  const header = document.querySelector(".site-header");
  if (header) {
    const icon = el("button", "psearch-btn"); icon.type = "button"; icon.setAttribute("aria-label", "Search the menu"); icon.setAttribute("aria-expanded", "false");
    icon.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>';
    const order = header.querySelector(".btn"); if (order) header.insertBefore(icon, order); else header.appendChild(icon);
    const drop = el("div", "searchdrop");
    const s = el("input", "psearch"); s.type = "search"; s.placeholder = "Search the menu"; s.setAttribute("aria-label", "Search the menu"); s.tabIndex = -1;
    drop.appendChild(s); header.after(drop);
    const res = el("div", "pgrid psearch-res"); res.hidden = true; drop.after(res);
    const main = document.querySelector("main");
    const setOpen = (open) => {
      drop.classList.toggle("open", open); icon.classList.toggle("on", open); icon.setAttribute("aria-expanded", String(open)); s.tabIndex = open ? 0 : -1;
      if (open) s.focus(); else { s.value = ""; s.dispatchEvent(new Event("input")); }
    };
    icon.addEventListener("click", () => setOpen(!drop.classList.contains("open")));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && drop.classList.contains("open")) setOpen(false); });
    s.addEventListener("input", () => {
      const q = s.value.trim().toLowerCase(); res.replaceChildren();
      if (!q) { res.hidden = true; if (main) main.hidden = false; return; }
      MENU.forEach((c) => c.items.forEach((i) => { if ((i.name + " " + c.title).toLowerCase().includes(q)) res.appendChild(card(i, c)); }));
      if (!res.children.length) res.appendChild(el("p", "sub", "Nothing found. Try another word."));
      res.hidden = false; if (main) main.hidden = true;
    });
  }

  /* ---- Pop-up sheet ---- */
  function openSheet(item, cat) {
    const back = el("div", "sheet-back"); const sh = el("div", "sheet"); back.appendChild(sh);
    const close = () => back.remove();
    back.addEventListener("click", (e) => { if (e.target === back) close(); });
    const x = el("button", "sheet-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Close"); x.onclick = close;
    const pic = el("div", "sheet-pic"); const im = el("img"); im.src = item.img || ""; im.alt = item.name; im.addEventListener("error", () => im.remove());
    pic.appendChild(im); pic.appendChild(el("span", "pfallback", item.name.charAt(0)));
    sh.append(x, pic, el("h3", "", item.name));
    let size = item.sizes ? item.sizes[0] : null, choice = null, qty = 1; const extras = new Set();
    const body = el("div", "sheet-body"); sh.appendChild(body);
    const total = () => ((size ? size.price : item.price) + [...extras].reduce((a, e) => a + e.price, 0)) * qty;
    const addBtn = el("button", "btn btn-yellow btn-block"); addBtn.type = "button";
    const refresh = () => (addBtn.textContent = "Add to order · " + R(total()));
    const group = (title, req) => { const g = el("fieldset", "sgroup"); g.appendChild(el("legend", "", title + (req ? "  (required)" : ""))); body.appendChild(g); return g; };
    if (item.sizes) {
      const g = group("Choose a size", true);
      item.sizes.forEach((s, k) => { const l = el("label", "sopt"); const r = el("input"); r.type = "radio"; r.name = "sz"; r.checked = k === 0;
        r.onchange = () => { size = s; refresh(); }; l.append(r, el("span", "", s.label), el("em", "", R(s.price))); g.appendChild(l); });
    }
    const ch = typeof CHOICES !== "undefined" && CHOICES[cat.id];
    if (ch) { choice = ch.options[0]; const g = group(ch.label, true);
      ch.options.forEach((o, k) => { const l = el("label", "sopt"); const r = el("input"); r.type = "radio"; r.name = "ch"; r.checked = k === 0; r.onchange = () => (choice = o); l.append(r, el("span", "", o), el("em", "", "")); g.appendChild(l); }); }
    const ex = typeof EXTRAS !== "undefined" && EXTRAS[cat.id];
    if (ex) { const g = group("Extras (optional)");
      ex.forEach((e) => { const l = el("label", "sopt"); const c = el("input"); c.type = "checkbox"; c.onchange = () => { c.checked ? extras.add(e) : extras.delete(e); refresh(); }; l.append(c, el("span", "", e.name), el("em", "", "+" + R(e.price))); g.appendChild(l); }); }
    const q = el("div", "sqty"); const mi = el("button", "", "−"), pl = el("button", "", "+"), n = el("span", "", "1"); mi.type = pl.type = "button";
    mi.onclick = () => { if (qty > 1) { qty--; n.textContent = qty; refresh(); } }; pl.onclick = () => { if (qty < 20) { qty++; n.textContent = qty; refresh(); } };
    q.append(mi, n, pl); sh.append(q, addBtn); refresh();
    const status = el("p", "status"); sh.appendChild(status);
    addBtn.onclick = () => {
      let name = size ? size.cart || item.name + " (" + size.label + ")" : cartOf(item);
      const bad = window.GE_soldOutProblem ? window.GE_soldOutProblem([name]) : "";
      if (bad) { status.className = "status error"; status.textContent = bad; return; }
      const opts = [choice, ...[...extras].map((e) => e.name)].filter(Boolean);
      const unit = total() / qty; if (opts.length) name += " (" + opts.join(", ") + ")";
      if (window.GE_addToCart) window.GE_addToCart(name, unit, qty);
      if (cat.id !== "drinks" && typeof UPSELL_DRINKS !== "undefined") upsell(sh, close); else close();
    };
    document.body.appendChild(back);
  }

  /* ---- "Add a drink?" after adding food ---- */
  function upsell(sh, close) {
    sh.replaceChildren(); const x = el("button", "sheet-x", "×"); x.type = "button"; x.onclick = close;
    sh.append(x, el("div", "tick", "✓"), el("h3", "", "Added to your order"), el("p", "sub", "Add a cold drink?"));
    const row = el("div", "upsell");
    UPSELL_DRINKS.forEach((d) => { const b = el("button", "pill", d.label + " " + R(d.price)); b.type = "button";
      b.onclick = () => { window.GE_addToCart && window.GE_addToCart(d.cart, d.price, 1); b.textContent = "Added ✓"; b.disabled = true; }; row.appendChild(b); });
    const done = el("button", "btn btn-yellow btn-block", "Done"); done.type = "button"; done.onclick = close;
    sh.append(row, done);
  }
})();


/* ---------- 4. CART ON MENU PAGES ---------- */
(function () {
  if (!document.getElementById("cart-bar")) return;
  const KEY = "goodeats-cart";
  const $ = (id) => document.getElementById(id);
  const cart = new Map();
  try {
    JSON.parse(localStorage.getItem(KEY) || "[]").forEach(([n, i]) => {
      if (i && Number(i.price) >= 0 && Number(i.qty) > 0) cart.set(n, { price: Number(i.price), qty: Number(i.qty) });
    });
  } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...cart])); } catch (e) {} };

  function render() {
    let n = 0, t = 0;
    cart.forEach((i) => { n += i.qty; t += i.price * i.qty; });
    document.querySelector(".site-header .btn-yellow").textContent = n ? "Order now (" + n + ")" : "Order now";
    $("cart-bar").hidden = n === 0;
    $("bar-count").textContent = n + (n === 1 ? " item" : " items");
    $("bar-total").textContent = "R" + t;
  }

  document.querySelectorAll(".add").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.dataset.name;
      const item = cart.get(name);
      if (item) item.qty += 1; else cart.set(name, { price: Number(btn.dataset.price), qty: 1 });
      save(); render();
      const original = btn.textContent;
      btn.textContent = "Added";
      setTimeout(() => (btn.textContent = original), 900);
    });
  });
  window.GE_addToCart = function (name, price, qty) {
    const item = cart.get(name);
    if (item) item.qty += qty; else cart.set(name, { price: Number(price), qty: qty });
    save(); render();
  };
  render();

  document.querySelectorAll(".photo").forEach((img) => {
    const hide = () => (img.hidden = true);
    img.addEventListener("error", hide);
    if (img.complete && img.naturalWidth === 0) hide();
  });

  const header = document.querySelector(".site-header");
  let ticking = false;
  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 40);
    ticking = false;
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  window.addEventListener("pageshow", (e) => { if (e.persisted) window.location.reload(); });
})();


/* ---------- 5. HOME PAGE EFFECTS ---------- */
(function () {
  if (!document.getElementById("cat-grid")) return;   // home page only
  const $ = (id) => document.getElementById(id);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const video = $("promo-video");
  const toggle = $("video-toggle");

  /* Video parallax (the shrinking header is in section 4) */
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
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
    /* Text comes in a few seconds after the video starts, so people see the food first */
    const hero = video.closest(".hero-video");
    const TEXT_DELAY = 4000; /* milliseconds: change this to show the text sooner or later */
    let textTimer = null, backupTimer = null;
    const showText = () => { clearTimeout(textTimer); clearTimeout(backupTimer); hero.classList.add("text-in"); };
    if (reduce) showText();
    else {
      video.addEventListener("playing", () => { if (!textTimer) textTimer = setTimeout(showText, TEXT_DELAY); }, { once: true });
      backupTimer = setTimeout(showText, TEXT_DELAY + 3000); /* backup if the video never starts */
    }
    source.addEventListener("error", showText);
    video.addEventListener("error", showText);
    if (toggle) toggle.addEventListener("click", () => {
      if (video.paused) { video.play(); toggle.textContent = "Pause video"; toggle.setAttribute("aria-label", "Pause promo video"); }
      else { video.pause(); toggle.textContent = "Play video"; toggle.setAttribute("aria-label", "Play promo video"); }
    });
  }
})();

/* Opening hours on the home page (set OPENING_HOURS in settings.js) */
(function () {
  if (typeof OPENING_HOURS === "undefined" || !OPENING_HOURS) return;
  document.querySelectorAll("[data-hours]").forEach((el) => { el.textContent = "Open: " + OPENING_HOURS; el.hidden = false; });
})();

