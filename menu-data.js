/* ====================================================================
   GOOD EATS: THE MENU (edit this file to change the menu)
   ====================================================================
   This is the ONLY file you need to touch to add or remove a product,
   change a price, or change the scrolling banner. The website builds
   the category pages, the menu cards, the "Start here" specials, the
   nav links and the scrolling ticker from the lists below.

   HOW TO ADD A PRODUCT
     1. Find the category it belongs to (Chips, Burgers, ...).
     2. Copy one line inside that category's  items: [ ... ]  list.
     3. Paste it under the others and change the name and price.
        Example:   { name: "Cheese Burger", price: 40 },
     4. Save, upload the folder again. Done.

   HOW TO REMOVE A PRODUCT
     Delete that product's line (or put // at the start of the line to
     hide it for now and bring it back later).

   HOW TO CHANGE A PRICE
     Change the number after  price:  (rand, no "R", no quotes).

   RULES (a mistake here can stop the whole menu showing)
     - Every product line ends with a comma.
     - Keep quotes around words:  name: "Kota"   Numbers have no quotes.
     - Use plain straight quotes " and not curly ones.
     - Write & as normal (&). Write accents normally (Jalapeño).
   ==================================================================== */

/* --------------------------------------------------------------------
   THE CATEGORIES AND THEIR PRODUCTS
   Each category is one block { ... },
     id     : the page name. "burgers" means the page burgers.html
     title  : the heading shown on the page and menu card
     note   : (optional) small yellow line under the heading. Use "" for none.
     photo  : (optional) picture in the images folder. If it is missing, it hides itself.
     alt    : short description of the photo (for blind visitors and Google)
     cardPrice : (optional) the text on the home page card. If you leave it out,
                 it is worked out for you ("From R20", or "All R45" if all same).
     items  : the products. For each product:
        name  : what the customer sees on the menu
        price : price in rand (number)
        cart  : (optional) the name that appears in the cart and the order
                email. If you leave it out, "name" is used.
                ⚠ Leave existing "cart" names alone, the Specials below use them.
   -------------------------------------------------------------------- */
const MENU = [
  {
    id: "chips",
    title: "Chips",
    note: "",
    photo: "images/Chips.jpg",
    alt: "Loaded fries with cheese sauce and bacon",
    items: [
      { name: "Small",        price: 20, cart: "Chips (Small)" },
      { name: "Medium",       price: 25, cart: "Chips (Medium)" },
      { name: "Large",        price: 30, cart: "Chips (Large)" },
      { name: "Loaded Fries", price: 40 },
    ],
  },
  {
    id: "savoury",
    title: "Savoury",
    note: "",
    photo: "images/savoury.jpg",
    alt: "Sticky wings and chips",
    items: [
      { name: "Russian",         price: 15 },
      { name: "Russian & Chips", price: 25 },
      { name: "Fish & Chips",    price: 50 },
      { name: "Wings & Chips",   price: 50 },
      { name: "Kota",            price: 50 },
    ],
  },
  {
    id: "burgers",
    title: "Burgers",
    note: "All burgers R45",
    photo: "images/burger.jpg",
    alt: "Burger with pink sauce, bacon and cheese",
    items: [
      { name: "Special Pink Sauce", price: 45, cart: "Burger: Special Pink Sauce" },
      { name: "Bacon & Cheese",     price: 45, cart: "Burger: Bacon & Cheese" },
      { name: "Jalapeño Burger",    price: 45, cart: "Burger: Jalapeño" },
    ],
  },
  {
    id: "croissants",
    title: "Croissants",
    note: "",
    photo: "images/croissants.jpg",
    alt: "Croissant with ham, cheese and lettuce",
    items: [
      { name: "Cheese & Ham",      price: 30, cart: "Croissant: Cheese & Ham" },
      { name: "Bacon, Feta & Avo", price: 35, cart: "Croissant: Bacon, Feta & Avo" },
      { name: "Cheese & Egg",      price: 30, cart: "Croissant: Cheese & Egg" },
    ],
  },
  {
    id: "toasties",
    title: "Toasties",
    note: "Brown or white bread",
    photo: "images/Toasties.jpg",
    alt: "Stacked cheese toasties",
    items: [
      { name: "Chicken Mayo",    price: 25, cart: "Toastie: Chicken Mayo" },
      { name: "Cheese & Tomato", price: 25, cart: "Toastie: Cheese & Tomato" },
      { name: "Cheesy Toastie",  price: 20, cart: "Toastie: Cheesy" },
      { name: "Bacon & Cheese",  price: 30, cart: "Toastie: Bacon & Cheese" },
      { name: "Vegan Toastie",   price: 30, cart: "Toastie: Vegan" },
    ],
  },
  {
    id: "schnitzel",
    title: "Schnitzel",
    note: "",
    photo: "images/schnitzel.jpg",
    alt: "Crumbed schnitzel with chips and lemon",
    items: [
      { name: "Schnitzel & Chips", price: 45 },
    ],
  },
  {
    id: "magwinya",
    title: "Magwinya",
    note: "",
    photo: "images/magwinya.jpg",
    alt: "Magwinya in a basket",
    items: [
      { name: "Magwinya, each", price: 2, cart: "Magwinya (each)" },
    ],
  },
];

/* --------------------------------------------------------------------
   "START HERE" SPECIALS (the four cards under the video on the home page)
   Each one points at a product above by its CART name (the "cart" value,
   or the "name" if the product has no "cart"). The price comes from the
   product automatically, so it can never disagree with the menu.
     item  : the cart name of the product (copy it exactly)
     title : (optional) the heading on the card. Default = the product name.
     text  : the small line under the heading
   To remove a special, delete its line. To add one, copy a line.
   -------------------------------------------------------------------- */
const SPECIALS = [
  { item: "Magwinya (each)",         title: "Magwinya",              text: "Each" },
  { item: "Toastie: Cheesy",         title: "Cheesy Toastie",        text: "Brown or white bread" },
  { item: "Russian & Chips",         title: "Russian & Chips",       text: "Hot and filling" },
  { item: "Burger: Bacon & Cheese",  title: "Bacon & Cheese Burger", text: "Every burger is R45" },
];

/* --------------------------------------------------------------------
   THE SCROLLING BANNER (under the video on the home page)
   Just write the phrases. The copy that makes it loop is added for you.
   -------------------------------------------------------------------- */
const TICKER = [
  "Opening specials",
  "All burgers R45",
  "Magwinya R2 each",
  "Loaded fries R40",
  "Cheesy toastie R20",
  "Kota R50",
];
