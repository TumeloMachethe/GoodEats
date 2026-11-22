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
     2. Menu builder (reads menu-data.js: nav, category pages, cards, combos)
     3. Easy-order layer (photo cards, pop-up sheet, search, "add a drink?")
     4. Cart on menu pages (Add buttons, cart bar, shrinking header)
     5. Home page effects (scroll reveal, nav highlight, opening hours)
     6. Hero video, page loader
     7. Google review strip under the logo (+ Featurable back-up)
     8. Cookie banner (Accept / Reject) + "Cookie settings" footer link
     9. Kota Combo pop-up when a visitor reaches the menu (home page only)
   ==================================================================== */

/* ---------- 1. LIGHT / DARK SWITCH (light is the default; the choice is remembered) ---------- */
(function () {
  var KEY = "goodeats-theme", root = document.documentElement;
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function apply(t) {
    root.setAttribute("data-theme", t);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", t === "dark" ? "#181613" : "#faf8f4");
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
  if (!document.querySelector("[data-menu-root], [data-menu-nav], [data-menu-more], #cat-grid, #special-grid, #combo-grid")) return;

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
    text.appendChild(el("h1", "page-title", cat.title));
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
      const add = el("button", "btn btn-primary btn-block", "Add combo \u00b7 " + money(c.price)); add.type = "button";
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
    const addBtn = el("button", "btn btn-primary btn-block"); addBtn.type = "button";
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
      if (typeof UPSELL_BOXES !== "undefined" && !UPSELL_BOXES.some((u) => u.id === cat.id)) upsell(sh, close); else close();
    };
    document.body.appendChild(back);
  }

  /* ---- "Would you like to add a drink?" after adding any item ----
     Small category boxes (photo, name, "from" price). Tap one to see its flavours and sizes. ---- */
  function upsell(sh, close) {
    const x = el("button", "sheet-x", "×"); x.type = "button"; x.setAttribute("aria-label", "Close"); x.onclick = close;
    const added = new Set();                       // drinks added in this pop-up (so the button shows Added)
    const fromPrice = (c) => Math.min(...c.items.map((i) => i.price));

    function showBoxes() {
      sh.replaceChildren();
      const grid = el("div", "ugrid");
      UPSELL_BOXES.forEach((u) => {
        const c = MENU.find((m) => m.id === u.id);
        if (!c || !c.items.length) return;
        const b = el("button", "ubox"); b.type = "button";
        b.setAttribute("aria-label", u.label + ", from " + R(fromPrice(c)));
        if (u.img) { const im = el("img", "ubox-bg"); im.src = u.img; im.alt = ""; im.loading = "lazy"; im.addEventListener("error", () => im.remove()); b.appendChild(im); }
        b.append(el("strong", "ubox-name", u.label), el("span", "ubox-from", "from " + R(fromPrice(c))));
        b.onclick = () => showCategory(u, c);
        grid.appendChild(b);
      });
      const done = el("button", "btn btn-primary btn-block", "No thanks, continue"); done.type = "button"; done.onclick = close;
      sh.append(x, el("div", "tick", "✓"), el("h3", "", "Added to your order"), el("p", "sub", "Would you like to add a drink?"), grid, done);
    }

    function showCategory(u, c) {
      sh.replaceChildren();
      const back = el("button", "ubackbtn", "← All drinks"); back.type = "button"; back.onclick = showBoxes;
      const list = el("div", "ulist");
      c.items.forEach((item) => {
        const row = el("div", "urow");
        row.appendChild(el("span", "uname", item.name));
        const sizes = el("div", "usizes");
        (item.sizes || [{ label: "", price: item.price, cart: cartOf(item) }]).forEach((s) => {
          const name = s.cart || item.name + " (" + s.label + ")";
          const b = el("button", "pill", (s.label ? s.label + " " : "") + R(s.price)); b.type = "button";
          if (added.has(name)) { b.textContent = "Added ✓"; }
          b.onclick = () => {
            const bad = window.GE_soldOutProblem ? window.GE_soldOutProblem([name]) : "";
            if (bad) { msg.className = "status error"; msg.textContent = bad; return; }
            msg.textContent = "";
            if (window.GE_addToCart) window.GE_addToCart(name, s.price, 1);
            added.add(name); b.textContent = "Added ✓";
          };
          sizes.appendChild(b);
        });
        row.appendChild(sizes); list.appendChild(row);
      });
      const msg = el("p", "status");
      const done = el("button", "btn btn-primary btn-block", "Done"); done.type = "button"; done.onclick = close;
      sh.append(x, el("h3", "", u.label), back, list, msg, done);
    }
    showBoxes();
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
    document.querySelector(".site-header .btn-primary").textContent = n ? "Order now (" + n + ")" : "Order now";
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

  /* Reveal sections as they scroll into view */
  document.documentElement.classList.add("js");
  const targets = document.querySelectorAll(".cat-card, .combo-card, .visit-grid, .staff-card");
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
})();

/* Opening hours and free delivery on the home page (set OPENING_HOURS and FREE_DELIVERY_AREAS in settings.js) */
(function () {
  if (typeof OPENING_HOURS !== "undefined" && OPENING_HOURS) {
    document.querySelectorAll("[data-hours]").forEach((el) => { el.textContent = "Open: " + OPENING_HOURS; el.hidden = false; });
  }
  if (typeof FREE_DELIVERY_AREAS !== "undefined" && FREE_DELIVERY_AREAS.length) {
    const list = FREE_DELIVERY_AREAS.length > 1
      ? FREE_DELIVERY_AREAS.slice(0, -1).join(", ") + " and " + FREE_DELIVERY_AREAS[FREE_DELIVERY_AREAS.length - 1]
      : FREE_DELIVERY_AREAS[0];
    document.querySelectorAll("[data-free-delivery]").forEach((el) => { el.textContent = "Free delivery to " + list; el.hidden = false; });
  }
})();


/* ---------- 6. HERO VIDEO AND PAGE LOADER (home page only) ----------
   The hero shows a still photo; a short silent video fades in on top once it can play.
   The video is skipped for visitors who asked for reduced motion or Data Saver, or are on a very slow
   connection. The loader hides the moment the page, the hero photo and the first video frame are ready,
   or after 3.5 seconds at most (a 4.5 s failsafe in the page head covers the case where this file fails). */
(function () {
  const root = document.documentElement;
  const hero = document.querySelector(".hero-media");
  const loader = document.getElementById("page-loader");
  if (!hero) { root.classList.remove("is-loading"); return; }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const conn = navigator.connection || {};
  const lite = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || "");
  const video = hero.querySelector("video");
  const still = hero.querySelector("img");

  let done = false;
  function finish() {
    if (done) return;
    done = true;
    if (loader) {
      loader.classList.add("is-done");
      setTimeout(() => root.classList.remove("is-loading"), 320);
    } else {
      root.classList.remove("is-loading");
    }
  }
  const ready = [];

  // 1. the page itself
  ready.push(new Promise((res) => {
    if (document.readyState === "complete") res(); else window.addEventListener("load", res, { once: true });
  }));

  // 2. the hero photo
  if (still) ready.push(new Promise((res) => {
    if (still.complete) res(); else { still.addEventListener("load", res, { once: true }); still.addEventListener("error", res, { once: true }); }
  }));

  // 3. the hero video (first frame), unless we are skipping it
  if (video && (reduce || lite)) {
    video.remove();
  } else if (video) {
    ready.push(new Promise((res) => {
      const sources = video.querySelectorAll("source");
      const last = sources[sources.length - 1];
      video.addEventListener("loadeddata", res, { once: true });
      video.addEventListener("error", res, { once: true });
      if (last) last.addEventListener("error", res, { once: true });   // no video file at all: do not wait for it
      if (video.readyState >= 2) res();
    }));
    const start = () => {
      const p = video.play();
      if (p && p.then) p.then(() => video.classList.add("is-playing")).catch(() => {});
    };
    if (video.readyState >= 2) start(); else video.addEventListener("loadeddata", start, { once: true });
    // Save battery and data: pause when the hero is off screen or the tab is hidden.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (video.readyState >= 2) { if (e.isIntersecting) video.play().catch(() => {}); else video.pause(); } });
      }).observe(hero.parentElement);
    }
  }

  Promise.all(ready).then(finish);
  setTimeout(finish, 3500);
})();


/* ---------- 7. GOOGLE REVIEW STRIP (under the hero logo) ----------
   Reads your real Google reviews from Featurable (settings.js > FEATURABLE_WIDGET_ID) and slides them sideways.
   Nothing is made up: if the reviews cannot be loaded, the strip stays hidden and the page falls back to your
   Featurable widget in the "What people say" section (hidden until it is needed). */
(function () {
  const strip = document.getElementById("review-strip");
  if (!strip) return;
  const widgetId = typeof FEATURABLE_WIDGET_ID !== "undefined" ? FEATURABLE_WIDGET_ID : "";
  const CACHE_KEY = "goodeats-reviews-v2";
  const CACHE_MS = 6 * 60 * 60 * 1000;               // reuse for 6 hours (kind to Featurable's rate limit)
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Accept the shapes Featurable's API is documented to return (and the older shape too). */
  function normalise(data) {
    const list = (data && (data.reviews || (data.widget && data.widget.reviews))) || [];
    const words = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
    return list.map((r) => {
      const who = (r.author && r.author.name) || (r.reviewer && r.reviewer.displayName) || "";
      const raw = r.rating && typeof r.rating === "object" ? r.rating.value : (r.starRating !== undefined ? r.starRating : r.rating);
      const stars = typeof raw === "string" ? (words[raw.toUpperCase()] || Number(raw)) : Number(raw);
      const a = r.author || r.reviewer || {};
      const photo = a.profilePhotoUrl || a.photoUrl || a.profile_photo_url || a.photo || r.profilePhotoUrl || r.photoUrl || "";
      return { photo: /^https:\/\//.test(String(photo)) ? String(photo) : "", who: String(who).trim(), stars: Math.max(1, Math.min(5, Math.round(stars) || 0)), text: String(r.text || r.comment || "").replace(/\s+/g, " ").trim(), when: r.publishedAt || r.createTime || "" };
    }).filter((r) => r.stars >= 1 && r.text.length > 0 && r.who);
  }

  function endpoints() {
    const custom = typeof FEATURABLE_API_URL !== "undefined" && FEATURABLE_API_URL ? [FEATURABLE_API_URL] : [];
    return custom.concat(["https://api.featurable.com/api/v2/widgets/" + widgetId, "https://featurable.com/api/v2/widgets/" + widgetId]);
  }

  async function fetchReviews() {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (c && c.id === widgetId && Date.now() - c.at < CACHE_MS && c.reviews.length) return c.reviews;
    } catch (e) {}
    for (const url of endpoints()) {
      try {
        const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 5000);
        const r = await fetch(url, { signal: ctl.signal }); clearTimeout(t);
        if (!r.ok) continue;
        const list = normalise(await r.json());
        if (list.length) {
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ id: widgetId, at: Date.now(), reviews: list })); } catch (e) {}
          return list;
        }
      } catch (e) { /* try the next address */ }
    }
    return [];
  }

  function draw(list) {
    const track = strip.querySelector(".review-track");
    const G = '<svg viewBox="0 0 48 48" width="16" height="16" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.1 5.5c4.3-4 6.8-9.9 6.8-16.9z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.6 2.3-8.8 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
    const mk = (r, hidden) => {
      const item = document.createElement("span"); item.className = "rv";
      if (hidden) item.setAttribute("aria-hidden", "true");
      const pic = document.createElement("span"); pic.className = "rv-pic";
      const initial = document.createElement("span"); initial.className = "rv-initial"; initial.textContent = (r.who[0] || "?").toUpperCase();
      pic.appendChild(initial);
      if (r.photo) {
        const img = document.createElement("img"); img.alt = ""; img.loading = "lazy"; img.referrerPolicy = "no-referrer"; img.src = r.photo;
        img.addEventListener("error", () => img.remove());
        pic.appendChild(img);
      }
      const g = document.createElement("span"); g.className = "rv-g"; g.innerHTML = G; g.title = "Google review";
      pic.appendChild(g);
      const stars = document.createElement("span"); stars.className = "rv-stars";
      stars.textContent = "\u2605".repeat(r.stars) + "\u2606".repeat(5 - r.stars);
      stars.setAttribute("aria-label", r.stars + " out of 5 stars on Google");
      const q = document.createElement("span"); q.className = "rv-text"; q.textContent = "\u201c" + r.text + "\u201d";
      const w = document.createElement("span"); w.className = "rv-who"; w.textContent = r.who;
      const body = document.createElement("span"); body.className = "rv-body";
      const top = document.createElement("span"); top.className = "rv-top"; top.append(w, stars);
      body.append(top, q);
      item.append(pic, body);
      return item;
    };
    const shown = list.slice(0, 12);
    // A second copy makes the slide loop without a gap (hidden from screen readers). Not needed when it does not move.
    const nodes = shown.map((r) => mk(r, false));
    if (!reduce) shown.forEach((r) => nodes.push(mk(r, true)));
    track.replaceChildren(...nodes);
    strip.style.setProperty("--rv-dur", Math.max(30, shown.length * 9) + "s");
    strip.hidden = false;
  }

  function showFallback() {
    const box = document.getElementById("featurable-box"), sec = document.getElementById("reviews");
    if (!box || !sec || !widgetId) return;
    box.id = "featurable-" + widgetId; box.setAttribute("data-featurable-async", "");
    sec.hidden = false;
    const s = document.createElement("script");
    s.src = "https://featurable.com/assets/bundle.js"; s.defer = true; s.charset = "UTF-8";
    document.body.appendChild(s);
  }

  // Pause / play button (people must be able to stop moving text)
  const pause = document.getElementById("review-pause");
  if (pause) pause.addEventListener("click", () => {
    const on = strip.classList.toggle("is-paused");
    pause.setAttribute("aria-pressed", String(on));
    pause.setAttribute("aria-label", on ? "Play reviews" : "Pause reviews");
    pause.innerHTML = on
      ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>'
      : '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  });

  if (!widgetId) { console.warn("Review strip: set FEATURABLE_WIDGET_ID in settings.js."); return; }
  fetchReviews().then((list) => { if (list.length) draw(list); else { console.warn("Review strip: Featurable did not return reviews, showing the Featurable widget instead."); showFallback(); } });
})();


/* ---------- 8. COOKIE BANNER (every page) ----------
   Choice is saved in localStorage "goodeats-consent" as {choice: "all" | "essential", at: time}.
   "Reject" switches off optional extras only: the cart, light/dark mode and order saving
   always work because the site cannot run without them.
   Other code can ask:  GE_consent.get()  -> "all" | "essential" | null
   and listen:          window.addEventListener("goodeats:consent", e => e.detail.choice)
   Put any future analytics or Facebook pixel behind  GE_consent.get() === "all". */
(function () {
  var KEY = "goodeats-consent";
  function read() { try { var r = JSON.parse(localStorage.getItem(KEY) || "null"); return r && (r.choice === "all" || r.choice === "essential") ? r.choice : null; } catch (e) { return null; } }
  function write(c) { try { localStorage.setItem(KEY, JSON.stringify({ choice: c, at: Date.now() })); } catch (e) {} }
  window.GE_consent = { get: read };

  var bar = null, opener = null;
  function mk(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }

  function hide() {
    if (!bar) return;
    bar.classList.remove("is-in");
    var b = bar; bar = null;
    setTimeout(function () { b.remove(); }, 250);
    if (opener && opener.focus) { try { opener.focus(); } catch (e) {} }
    opener = null;
  }
  function choose(c) {
    write(c); hide();
    try { window.dispatchEvent(new CustomEvent("goodeats:consent", { detail: { choice: c } })); } catch (e) {}
  }
  function show(fromLink) {
    if (bar) return;
    opener = fromLink ? document.activeElement : null;
    bar = mk("div", "consent");
    bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Cookie consent");
    var text = mk("div", "consent-text");
    var h = mk("strong", "", "We use cookies");
    var p = mk("p", "", "Essential storage keeps your cart and order working. With your OK we may also use optional cookies to improve the site. ");
    var a = mk("a", "", "Privacy Policy"); a.href = "privacy.html"; p.appendChild(a);
    text.append(h, p);
    var row = mk("div", "consent-actions");
    var rej = mk("button", "btn btn-primary", "Reject non-essential"); rej.type = "button";
    var acc = mk("button", "btn btn-primary", "Accept all"); acc.type = "button";
    rej.onclick = function () { choose("essential"); };
    acc.onclick = function () { choose("all"); };
    row.append(rej, acc);
    bar.append(text, row);
    document.body.appendChild(bar);
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (bar) bar.classList.add("is-in"); }); });
    if (fromLink) acc.focus();
  }

  function addFooterLink() {
    document.querySelectorAll(".footer-legal").forEach(function (box) {
      if (box.querySelector("[data-cookie-settings]")) return;
      var b = mk("button", "footer-linkbtn", "Cookie settings"); b.type = "button";
      b.setAttribute("data-cookie-settings", "");
      b.onclick = function () { show(true); };
      box.appendChild(b);
    });
  }

  function start() {
    addFooterLink();
    if (!read()) setTimeout(function () { if (!read()) show(false); }, 900);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

/* ---------- 9. KOTA COMBO POP-UP (home page only) ----------
   Shows once when the visitor scrolls to "Our menu" (#menu), after the cookie choice is made.
   Name and price come from the Kota Combo line in COMBOS (menu-data.js).
   Closing it (X, "No thanks", Esc or a tap outside) hides it for 7 days. Picture: images/kota-combo-popup.png */
(function () {
  var menu = document.getElementById("menu");
  if (!menu || typeof COMBOS === "undefined") return;
  var combo = null;
  for (var i = 0; i < COMBOS.length; i++) if (/kota/i.test(COMBOS[i].title)) { combo = COMBOS[i]; break; }
  if (!combo) return;

  var KEY = "goodeats-promo-kota", HIDE_MS = 7 * 24 * 3600 * 1000, IMG = "images/kota-combo-popup.png";
  function hiddenNow() { try { var t = +localStorage.getItem(KEY); return t && Date.now() - t < HIDE_MS; } catch (e) { return false; } }
  function remember() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }
  if (hiddenNow()) return;

  function mk(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
  var shown = false, pre = new Image();

  function open() {
    if (shown || hiddenNow() || document.querySelector(".sheet-back") || document.documentElement.classList.contains("is-loading")) return;
    shown = true;
    var back = mk("div", "promo-back"), card = mk("div", "promo");
    card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.setAttribute("aria-labelledby", "promo-title");
    back.appendChild(card);
    var previous = document.activeElement;

    var pic = mk("div", "promo-pic");
    var img = mk("img"); img.src = IMG; img.alt = "A Kota with a cold Coke 300ml"; img.addEventListener("error", function () { img.remove(); });
    var x = mk("button", "promo-x"); x.type = "button"; x.setAttribute("aria-label", "Close");
    x.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    pic.append(img, x);

    var body = mk("div", "promo-body");
    var tag = mk("span", "promo-tag", "Combo deal");
    var h = mk("h3", "", combo.title); h.id = "promo-title";
    var t = mk("p", "promo-text", "Kota + an ice-cold Coke 300ml");
    var price = mk("p", "promo-price", "R" + combo.price);
    var add = mk("button", "btn btn-primary btn-block", "Add to my order"); add.type = "button";
    var no = mk("button", "btn btn-outline btn-block", "No thanks"); no.type = "button";
    body.append(tag, h, t, price, add, no);
    card.append(pic, body);

    function close() {
      remember();
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("promo-open");
      back.classList.remove("is-in");
      setTimeout(function () { back.remove(); }, 220);
      if (previous && previous.focus) { try { previous.focus(); } catch (e) {} }
    }
    function onKey(e) {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      var f = card.querySelectorAll("button"), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    x.onclick = close; no.onclick = close;
    back.addEventListener("click", function (e) { if (e.target === back) close(); });
    add.onclick = function () {
      if (window.GE_addToCart) window.GE_addToCart("Combo: " + combo.title, combo.price, 1);
      add.textContent = "Added \u2713"; add.disabled = true;
      setTimeout(close, 800);
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("promo-open");
    document.body.appendChild(back);
    requestAnimationFrame(function () { requestAnimationFrame(function () { back.classList.add("is-in"); add.focus(); }); });
  }

  var armed = false;
  function whenReady(fn) {
    if (window.GE_consent && window.GE_consent.get()) return fn();
    window.addEventListener("goodeats:consent", function once() { window.removeEventListener("goodeats:consent", once); setTimeout(fn, 600); });
  }
  function arm() {
    if (armed) return; armed = true;
    if (!("IntersectionObserver" in window)) return;
    pre.src = IMG;
    var timer = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && en.intersectionRatio >= 0.15) {
          clearTimeout(timer);
          timer = setTimeout(function () { open(); if (shown) io.disconnect(); }, 500);
        } else clearTimeout(timer);
      });
    }, { threshold: [0, 0.15, 0.3] });
    io.observe(menu);
  }
  whenReady(arm);
})();
