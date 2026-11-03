/* Good Eats: category pages. Shares the cart with index.html through localStorage. */
(function () {
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
  render();

  document.querySelectorAll(".photo").forEach((img) => {
    const hide = () => (img.hidden = true);
    img.addEventListener("error", hide);
    if (img.complete && img.naturalWidth === 0) hide();
  });

  const header = document.querySelector(".site-header");
  const bar = $("scroll-progress");
  let ticking = false;
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
    header.classList.toggle("scrolled", window.scrollY > 40);
    ticking = false;
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  window.addEventListener("pageshow", (e) => { if (e.persisted) window.location.reload(); });
})();
