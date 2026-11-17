const products = {
  "caramel-latte": { name: "Caramel Latte", price: 18000, image: "assets/images/Caramel Latte.png" },
  mocha: { name: "Mocha", price: 20000, image: "assets/images/Kopi Kita Mocha.png" },
  americano: { name: "Americano", price: 15000, image: "assets/images/Americano.png" },
  cappuccino: { name: "Cappuccino", price: 18000, image: "assets/images/Cappucino.jpeg" },
  "taro-latte": { name: "Taro Latte", price: 20000, image: "assets/images/Taro Latte.jpeg" },
  "matcha-latte": { name: "Matcha Latte", price: 22000, image: "assets/images/Matcha.jpeg" },
  "roti-bakar-cokelat-keju": { name: "Roti Bakar Cokelat Keju", price: 10000, image: "assets/images/roti-bakar-cokelat-keju.jpeg", unit: "porsi" },
  "kentang-goreng": { name: "Kentang Goreng", price: 10000, image: "assets/images/kentang-goreng.jpeg", unit: "porsi" },
  "donat-cokelat": { name: "Donat Cokelat", price: 10000, image: "assets/images/donat-cokelat.jpeg", unit: "porsi" }
};

const storageKey = "kopi-kita-cart";
const cart = loadCart();
const cartDrawer = document.querySelector(".cart-drawer");
const drawerBackdrop = document.querySelector(".drawer-backdrop");
const cartItems = document.querySelector(".cart-items");
const cartEmpty = document.querySelector(".cart-empty");
const cartTotal = document.querySelector(".cart-total");
const cartCounts = [...document.querySelectorAll(".cart-count")];
const cartTriggers = [...document.querySelectorAll(".cart-trigger")];
const menuCartSummary = document.querySelector(".menu-cart-summary");
const cartTrigger = document.querySelector(".cart-trigger");
const checkoutButton = document.querySelector(".checkout-button");
const toast = document.querySelector(".toast");
const lightbox = document.querySelector(".image-lightbox");
let toastTimer;

function loadCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem("kopi-kita-cart") || "{}");
    if (!savedCart || typeof savedCart !== "object" || Array.isArray(savedCart)) return {};

    return Object.fromEntries(
      Object.entries(savedCart)
        .filter(([id, quantity]) => products[id] && Number.isInteger(quantity) && quantity > 0)
        .map(([id, quantity]) => [id, Math.min(quantity, 99)])
    );
  } catch (error) {
    console.warn("Keranjang tersimpan tidak dapat dibaca; keranjang dimulai dari kosong.", error);
    return {};
  }
}

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(amount);
}

function saveCart() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  } catch (error) {
    console.error("Keranjang tidak dapat disimpan ke penyimpanan lokal.", error);
    showToast("Keranjang gagal disimpan di perangkat ini.");
  }
}

function renderCart() {
  const entries = Object.entries(cart);
  const totalItems = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
  const totalPrice = entries.reduce((sum, [id, quantity]) => sum + products[id].price * quantity, 0);

  cartItems.innerHTML = entries.length ? `
    <div class="cart-items-heading"><span>Pesanan kamu</span><span>${totalItems} item</span></div>
    ${entries.map(([id, quantity]) => {
      const product = products[id];
      return `
        <article class="cart-line">
          <img class="cart-thumb" src="${product.image}" alt="${product.name}" loading="lazy">
          <div class="cart-line-content">
            <div class="cart-line-top">
              <div><h3>${product.name}</h3><p>${formatRupiah(product.price)} <span>/ ${product.unit || "gelas"}</span></p></div>
              <strong class="cart-line-total">${formatRupiah(product.price * quantity)}</strong>
            </div>
            <div class="cart-line-bottom">
              <div class="quantity-control" aria-label="Jumlah ${product.name}">
                <button type="button" data-action="decrease" data-id="${id}" aria-label="Kurangi ${product.name}">−</button>
                <span>${quantity}</span>
                <button type="button" data-action="increase" data-id="${id}" aria-label="Tambah ${product.name}">+</button>
              </div>
              <button class="remove-item" type="button" data-action="remove" data-id="${id}" aria-label="Hapus ${product.name} dari keranjang"><span aria-hidden="true">×</span> Hapus</button>
            </div>
          </div>
        </article>`;
    }).join("")}` : "";

  cartCounts.forEach((count) => { count.textContent = totalItems; });
  if (menuCartSummary) {
    menuCartSummary.textContent = `${totalItems} item · ${formatRupiah(totalPrice)}`;
  }
  document.querySelector(".drawer-count").textContent = `${totalItems} ${totalItems === 1 ? "item" : "item"}`;
  cartTriggers.forEach((trigger) => trigger.setAttribute("aria-label", `Buka keranjang, ${totalItems} produk`));
  cartEmpty.classList.toggle("is-visible", entries.length === 0);
  cartItems.hidden = entries.length === 0;
  cartTotal.textContent = formatRupiah(totalPrice);
  checkoutButton.classList.toggle("is-disabled", entries.length === 0);
  checkoutButton.setAttribute("aria-disabled", String(entries.length === 0));
  checkoutButton.href = entries.length ? createCheckoutUrl(entries, totalPrice) : "#";
}

function createCheckoutUrl(entries, totalPrice) {
  const lines = entries.map(([id, quantity]) => {
    const product = products[id];
    return `- ${product.name} x${quantity} — ${formatRupiah(product.price * quantity)}`;
  });
  const message = [
    "Halo Kopi Kita! Saya ingin memesan:",
    "",
    ...lines,
    "",
    `Total: ${formatRupiah(totalPrice)}`,
    "Mohon info ketersediaan dan biaya pengantaran. Terima kasih!"
  ].join("\n");
  return `https://wa.me/6289527907852?text=${encodeURIComponent(message)}`;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function openCart() {
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  drawerBackdrop.hidden = false;
  requestAnimationFrame(() => drawerBackdrop.classList.add("is-visible"));
  document.body.classList.add("drawer-open");
  document.querySelector(".drawer-close").focus();
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  drawerBackdrop.classList.remove("is-visible");
  document.body.classList.remove("drawer-open");
  window.setTimeout(() => {
    if (!cartDrawer.classList.contains("is-open")) drawerBackdrop.hidden = true;
  }, 300);
  cartTrigger.focus();
}

function addToCart(id) {
  if (!products[id]) return;
  cart[id] = Math.min((cart[id] || 0) + 1, 99);
  saveCart();
  renderCart();
  cartCounts.forEach((count) => count.classList.remove("bump"));
  cartTriggers.forEach((trigger) => trigger.classList.remove("cart-glow"));
  requestAnimationFrame(() => {
    cartCounts.forEach((count) => count.classList.add("bump"));
    cartTriggers.forEach((trigger) => trigger.classList.add("cart-glow"));
  });
  const card = document.querySelector(`[data-product-card] .add-to-cart[data-id="${id}"]`)?.closest(".product-card");
  if (card) {
    card.classList.add("is-pressed");
    window.setTimeout(() => card.classList.remove("is-pressed"), 500);
  }
  showToast("Berhasil ditambahkan ke keranjang!");
}

function closeMobileNav() {
  const nav = document.querySelector(".main-nav");
  const toggle = document.querySelector(".menu-toggle");
  nav.classList.remove("is-open");
  toggle.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");
}

function addRipple(button, event) {
  const rect = button.getBoundingClientRect();
  const ripple = document.createElement("span");
  const size = Math.max(rect.width, rect.height);
  ripple.className = "ripple";
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
  button.append(ripple);
  button.classList.add("is-rippling");
  window.setTimeout(() => {
    ripple.remove();
    button.classList.remove("is-rippling");
  }, 700);
}

function openLightbox(button) {
  const image = button.querySelector("img");
  if (!image) return;
  const lightboxImage = lightbox.querySelector("img");
  lightboxImage.src = image.currentSrc || image.src;
  lightboxImage.alt = image.alt;
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
  lightbox.querySelector(".lightbox-close").focus();
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button, .button, .nav-link, .hero-text-link, .text-link, .footer-column > a:not(.button), .footer-bottom a");
  if (button) addRipple(button, event);

  const addButton = event.target.closest(".add-to-cart");
  if (addButton) addToCart(addButton.dataset.id);

  if (event.target.closest(".cart-trigger")) openCart();
  if (event.target.closest(".drawer-close") || event.target === drawerBackdrop) closeCart();
  if (event.target.closest(".continue-shopping")) {
    closeCart();
    document.querySelector("#menu").scrollIntoView({ behavior: "smooth" });
  }

  const quantityButton = event.target.closest("[data-action]");
  if (quantityButton) {
    const { action, id } = quantityButton.dataset;
    if (!products[id]) return;
    if (action === "increase") cart[id] = Math.min(cart[id] + 1, 99);
    if (action === "decrease") {
      cart[id] -= 1;
      if (cart[id] <= 0) delete cart[id];
    }
    if (action === "remove") delete cart[id];
    saveCart();
    renderCart();
  }

  const imageButton = event.target.closest(".image-zoom");
  if (imageButton) openLightbox(imageButton);
  if (event.target === lightbox || event.target.closest(".lightbox-close")) closeLightbox();

  if (event.target.closest(".menu-toggle")) {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".main-nav");
    const isOpen = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", isOpen);
    toggle.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  }

  const clickedNavLink = event.target.closest(".main-nav .nav-link");
  if (clickedNavLink) {
    navLinks.forEach((link) => link.classList.toggle("is-active", link === clickedNavLink));
    closeMobileNav();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (cartDrawer.classList.contains("is-open")) closeCart();
    if (lightbox.classList.contains("is-open")) closeLightbox();
    closeMobileNav();
  }
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const navLinks = [...document.querySelectorAll(".nav-link")];
const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
const activeSectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`));
  });
}, { rootMargin: "-30% 0px -60% 0px" });
sections.forEach((section) => activeSectionObserver.observe(section));

const header = document.querySelector(".site-header");
window.addEventListener("scroll", () => header.classList.toggle("is-scrolled", window.scrollY > 8), { passive: true });
document.querySelector("#current-year").textContent = new Date().getFullYear();
renderCart();
