/* ====================================================================
   GOOD EATS: THE MENU (edit this file to change the menu)
   ====================================================================
   This is the ONLY file you need to touch to add or remove a product,
   change a price. The website builds the category pages, the menu cards
   and the nav links from the lists below.

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
     note   : (optional) small line under the heading. Use "" for none.
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
      { name: "Chips", price: 20, img: "images/items/chip2.jpeg", sizes: [
        { label: "Small",  price: 20, cart: "Chips (Small)" },
        { label: "Medium", price: 25, cart: "Chips (Medium)" },
        { label: "Large",  price: 30, cart: "Chips (Large)" },
      ] },
      { name: "Loaded Fries", price: 40, img: "images/items/loaded fries.jpeg" },
    ],
  },
  {
    id: "savoury",
    title: "Savoury",
    note: "",
    photo: "images/savoury.jpg",
    alt: "Sticky wings and chips",
    items: [
      { name: "Russian",         price: 15, img: "images/items/savoury-russian.jpg" },
      { name: "Russian & Chips", price: 25, img: "images/items/savoury-russian-and-chips.jpg" },
      { name: "Fish & Chips",    price: 50, img: "images/items/savoury-fish-and-chips.jpg" },
      { name: "Wings & Chips",   price: 50, img: "images/items/wings.jpeg" },
      { name: "Kota",            price: 50, img: "images/items/Kota.jpeg" },
    ],
  },
  {
    id: "burgers",
    title: "Burgers",
    note: "All burgers R45",
    photo: "images/burger.jpg",
    alt: "Burger with pink sauce, bacon and cheese",
    items: [
      { name: "Special Pink Sauce", price: 45, cart: "Burger: Special Pink Sauce", img: "images/items/burgers-special-pink-sauce.jpg" },
      { name: "Bacon & Cheese",     price: 45, cart: "Burger: Bacon & Cheese", img: "images/items/burgers-bacon-and-cheese.jpg" },
      { name: "Jalapeño Burger",    price: 45, cart: "Burger: Jalapeño", img: "images/items/burgers-jalapeno-burger.jpg" },
    ],
  },
  {
    id: "croissants",
    title: "Croissants",
    note: "",
    photo: "images/croissants.jpg",
    alt: "Croissant with ham, cheese and lettuce",
    items: [
      { name: "Cheese & Ham",      price: 30, cart: "Croissant: Cheese & Ham", img: "images/items/toaslt.jpeg" },
      { name: "Bacon, Feta & Avo", price: 35, cart: "Croissant: Bacon, Feta & Avo", img: "images/items/croissants-bacon-feta-and-avo.jpg" },
      { name: "Cheese & Egg",      price: 30, cart: "Croissant: Cheese & Egg", img: "images/items/croissants-cheese-and-egg.jpg" },
    ],
  },
  {
    id: "toasties",
    title: "Toasties",
    note: "Brown or white bread",
    photo: "images/Toasties.jpg",
    alt: "Stacked cheese toasties",
    items: [
      { name: "Chicken Mayo",    price: 25, cart: "Toastie: Chicken Mayo", img: "images/items/toasties-chicken-mayo.jpg" },
      { name: "Cheese & Tomato", price: 25, cart: "Toastie: Cheese & Tomato", img: "images/items/toasties-cheese-and-tomato.jpg" },
      { name: "Cheesy Toastie",  price: 20, cart: "Toastie: Cheesy", img: "images/items/toasties-cheesy-toastie.jpg" },
      { name: "Bacon & Cheese",  price: 30, cart: "Toastie: Bacon & Cheese", img: "images/items/toasties-bacon-and-cheese.jpg" },
      { name: "Vegan Toastie",   price: 30, cart: "Toastie: Vegan", img: "images/items/toasties-vegan-toastie.jpg" },
    ],
  },
  {
    id: "schnitzel",
    title: "Schnitzel",
    note: "",
    photo: "images/schnitzel.jpg",
    alt: "Crumbed schnitzel with chips and lemon",
    items: [
      { name: "Schnitzel & Chips", price: 45, img: "images/items/schnitzel-schnitzel-and-chips.jpg" },
    ],
  },
  {
    id: "magwinya",
    title: "Magwinya",
    note: "",
    photo: "images/magwinya.jpg",
    alt: "Magwinya in a basket",
    items: [
      { name: "Magwinya, each", price: 2, cart: "Magwinya (each)", img: "images/items/magwinya-magwinya-each.jpg" },
    ],
  },
  {
    id: "drinks",
    title: "Drinks",
    note: "Ice cold. Pick your size.",
    photo: "images/drinks.jpg",
    alt: "Cold drinks",
    items: [
      { name: "Coke", price: 15, img: "images/items/coke.jpg", sizes: [
        { label: "330ml", price: 15, cart: "Drink: Coke 330ml" },
        { label: "500ml", price: 20, cart: "Drink: Coke 500ml" },
        { label: "1 litre", price: 28, cart: "Drink: Coke 1L" },
        { label: "2 litre", price: 38, cart: "Drink: Coke 2L" },
      ] },
      { name: "Fanta Orange", price: 15, img: "images/items/fanta.jpg", sizes: [
        { label: "330ml", price: 15, cart: "Drink: Fanta Orange 330ml" },
        { label: "500ml", price: 20, cart: "Drink: Fanta Orange 500ml" },
        { label: "1 litre", price: 28, cart: "Drink: Fanta Orange 1L" },
        { label: "2 litre", price: 38, cart: "Drink: Fanta Orange 2L" },
      ] },
      { name: "Sprite", price: 15, img: "images/items/sprite.jpg", sizes: [
        { label: "330ml", price: 15, cart: "Drink: Sprite 330ml" },
        { label: "500ml", price: 20, cart: "Drink: Sprite 500ml" },
        { label: "1 litre", price: 28, cart: "Drink: Sprite 1L" },
        { label: "2 litre", price: 38, cart: "Drink: Sprite 2L" },
      ] },
      
      { name: "Water 500ml", price: 10, cart: "Drink: Water", img: "images/items/water.jpg" },
    ],
  },
  {
    id: "smoothies",
    title: "Smoothies",
    note: "Fresh and blended. 350ml or 500ml.",
    photo: "images/smoothies.jpg",
    alt: "Smoothies",
    items: [
      { name: "Strawberry smoothie", price: 45, sizes: [
        { label: "350ml", price: 45, cart: "Smoothie: Strawberry smoothie 350ml" },
        { label: "500ml", price: 55, cart: "Smoothie: Strawberry smoothie 500ml" },
      ] },
      { name: "Peanut butter & banana", price: 50, sizes: [
        { label: "350ml", price: 50, cart: "Smoothie: Peanut butter & banana 350ml" },
        { label: "500ml", price: 60, cart: "Smoothie: Peanut butter & banana 500ml" },
      ] },
      { name: "Blueberry smoothie", price: 55, sizes: [
        { label: "350ml", price: 55, cart: "Smoothie: Blueberry smoothie 350ml" },
        { label: "500ml", price: 65, cart: "Smoothie: Blueberry smoothie 500ml" },
      ] },
      { name: "Strawberry & banana", price: 45, sizes: [
        { label: "350ml", price: 45, cart: "Smoothie: Strawberry & banana 350ml" },
        { label: "500ml", price: 55, cart: "Smoothie: Strawberry & banana 500ml" },
      ] },
      { name: "Mixed berry smoothie", price: 55, sizes: [
        { label: "350ml", price: 55, cart: "Smoothie: Mixed berry smoothie 350ml" },
        { label: "500ml", price: 65, cart: "Smoothie: Mixed berry smoothie 500ml" },
      ] },
      { name: "Mango & apple smoothie", price: 45, sizes: [
        { label: "350ml", price: 45, cart: "Smoothie: Mango & apple smoothie 350ml" },
        { label: "500ml", price: 55, cart: "Smoothie: Mango & apple smoothie 500ml" },
      ] },
      { name: "Coconut butter smoothie", price: 50, sizes: [
        { label: "350ml", price: 50, cart: "Smoothie: Coconut butter smoothie 350ml" },
        { label: "500ml", price: 55, cart: "Smoothie: Coconut butter smoothie 500ml" },
      ] },
    ],
  },
  {
    id: "milkshakes",
    title: "Milkshakes",
    cardPrice: "From R40",
    note: "Thick and creamy. 350ml or 500ml.",
    photo: "images/milkshakes.jpg",
    alt: "Milkshakes",
    items: [
      { name: "Blueberry", price: 40, sizes: [
        { label: "350ml", price: 40, cart: "Milkshake: Blueberry 350ml" },
        { label: "500ml", price: 50, cart: "Milkshake: Blueberry 500ml" },
      ] },
      { name: "Strawberry", price: 40, sizes: [
        { label: "350ml", price: 40, cart: "Milkshake: Strawberry 350ml" },
        { label: "500ml", price: 50, cart: "Milkshake: Strawberry 500ml" },
      ] },
      { name: "Lime", price: 40, sizes: [
        { label: "350ml", price: 40, cart: "Milkshake: Lime 350ml" },
        { label: "500ml", price: 50, cart: "Milkshake: Lime 500ml" },
      ] },
      { name: "Chocolate", price: 40, sizes: [
        { label: "350ml", price: 40, cart: "Milkshake: Chocolate 350ml" },
        { label: "500ml", price: 50, cart: "Milkshake: Chocolate 500ml" },
      ] },
      { name: "Bubblegum", price: 40, sizes: [
        { label: "350ml", price: 40, cart: "Milkshake: Bubblegum 350ml" },
        { label: "500ml", price: 50, cart: "Milkshake: Bubblegum 500ml" },
      ] },
    ],
  },
  {
    id: "coolers",
    title: "Coolers",
    cardPrice: "From R35",
    note: "Ice cold and fruity. 350ml or 500ml.",
    photo: "images/coolers.jpg",
    alt: "Coolers",
    items: [
      { name: "Lemonade & mint", price: 35, sizes: [
        { label: "350ml", price: 35, cart: "Cooler: Lemonade & mint 350ml" },
        { label: "500ml", price: 45, cart: "Cooler: Lemonade & mint 500ml" },
      ] },
      { name: "Granadilla", price: 35, sizes: [
        { label: "350ml", price: 35, cart: "Cooler: Granadilla 350ml" },
        { label: "500ml", price: 45, cart: "Cooler: Granadilla 500ml" },
      ] },
      { name: "Raspberry", price: 35, sizes: [
        { label: "350ml", price: 35, cart: "Cooler: Raspberry 350ml" },
        { label: "500ml", price: 45, cart: "Cooler: Raspberry 500ml" },
      ] },
      { name: "Strawberry", price: 35, sizes: [
        { label: "350ml", price: 35, cart: "Cooler: Strawberry 350ml" },
        { label: "500ml", price: 45, cart: "Cooler: Strawberry 500ml" },
      ] },
      { name: "Passion fruit", price: 35, sizes: [
        { label: "350ml", price: 35, cart: "Cooler: Passion fruit 350ml" },
        { label: "500ml", price: 45, cart: "Cooler: Passion fruit 500ml" },
      ] },
    ],
  },
];

/* --------------------------------------------------------------------
   DRINK UPSELL ("Would you like to add a drink?" after any food is added)
   One box per drink category. id must match a category id in MENU above.
   The "from" price is the cheapest item in that category (worked out for you,
   so it always matches the menu). img is the box background (a plain colour
   shows if the photo is missing). To hide a box, delete its line.
   -------------------------------------------------------------------- */
const UPSELL_BOXES = [
  { id: "drinks",     label: "Cold drinks", img: "images/drinks.jpg" },
  { id: "smoothies",  label: "Smoothies",   img: "images/smoothies.jpg" },
  { id: "milkshakes", label: "Milkshakes",  img: "images/milkshakes.jpg" },
  { id: "coolers",    label: "Coolers",     img: "images/coolers.jpg" },
];

/* --------------------------------------------------------------------
   "ADD A SIDE" EXTRAS shown in the item pop-up (optional, tick any).
     price 0 = free option.   Only shown for the categories listed.
   -------------------------------------------------------------------- */
const EXTRAS = {
  burgers:    [{ name: "Add cheese", price: 5 }, { name: "Add bacon", price: 10 }, { name: "Add egg", price: 6 }],
  toasties:   [{ name: "Add egg", price: 6 }, { name: "Add cheese", price: 5 }],
  croissants: [{ name: "Add egg", price: 6 }],
  chips:      [{ name: "Add cheese sauce", price: 8 }],
};
/* "Choose one" required options shown in the pop-up for these categories. */
const CHOICES = {
  toasties: { label: "Which bread?", options: ["Brown bread", "White bread"] },
};

/* --------------------------------------------------------------------
   COMBOS (the "Combos" section on the home page)
   PLACEHOLDERS: the combos and prices below are examples. Change them to the
   real ones. Each line is one card:
     title : the name on the card (also the name in the cart)
     text  : what is in the combo
     price : the combo price in rand (no "R", no quotes)
     img   : the photo shown behind the card (put the file in images/combos/; a missing photo shows a plain colour)
     items : the list shown in the pop-up when someone taps the card
   To remove a combo, delete its line. To add one, copy a line.
   -------------------------------------------------------------------- */
const COMBOS = [
  { title: "Burger Combo",    price: 70, img: "images/combos/burger-combo.jpg",
    text: "Any burger + chips + a cold drink",
    items: ["Any burger from the menu", "Small chips", "A cold drink (330ml)"] },
  { title: "Toastie Combo",   price: 50, img: "images/combos/toastie-combo.jpg",
    text: "Any toastie + chips + a cold drink",
    items: ["Any toastie from the menu", "Small chips", "A cold drink (300ml)"] },
  { title: "Kota Combo",      price: 60, img: "images/kota-combo-popup.png",
    text: "Kota + a cold drink",
    items: ["Kota", "A cold drink (330ml)"] },
  { title: "Schnitzel Combo", price: 55, img: "images/combos/schnitzel-combo.jpg",
    text: "Schnitzel & chips + a cold drink",
    items: ["Schnitzel & chips", "A cold drink (330ml)"] },
];
