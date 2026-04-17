const AUTH_KEY = "sabbyshopp-auth";
const CART_KEY = "sabbyshopp-cart";

const elements = {
    userName: document.getElementById("userName"),
    cartCount: document.getElementById("cartCount"),
    heroProducts: document.getElementById("heroProducts"),
    heroCategories: document.getElementById("heroCategories"),
    results: document.getElementById("results"),
    statusMessage: document.getElementById("statusMessage"),
    search: document.getElementById("search"),
    category: document.getElementById("category"),
    openCart: document.getElementById("openCart"),
    closeCart: document.getElementById("closeCart"),
    cartDrawer: document.getElementById("cartDrawer"),
    cartOverlay: document.getElementById("cartOverlay"),
    cartItems: document.getElementById("cartItems"),
    cartTotal: document.getElementById("cartTotal"),
    logoutButton: document.getElementById("logoutButton"),
    pagosButton: document.getElementById("pagosButton"),
    productCards: Array.from(document.querySelectorAll(".product-grid .card"))
};

const auth = getAuth();

if (!auth?.isLoggedIn) {
    window.location.href = "login.html";
}

let products = [];
let cart = getCart();

init();

function init() {
    if (elements.userName) {
        elements.userName.textContent = auth.user || "Usuario";
    }

    bindUi();
    products = getProductsFromMarkup();
    populateCategories(products);
    enhanceProductCards();
    updateHeroStats(products);
    updateResults(products.length);
    updateCart();
    setStatus("Catalogo listo. Puedes agregar productos al carrito.");
}

function bindUi() {
    if (elements.search) {
        elements.search.addEventListener("input", filterProducts);
    }

    if (elements.category) {
        elements.category.addEventListener("change", filterProducts);
    }

    if (elements.openCart) {
        elements.openCart.addEventListener("click", () => toggleCart(true));
    }

    if (elements.closeCart) {
        elements.closeCart.addEventListener("click", () => toggleCart(false));
    }

    if (elements.cartOverlay) {
        elements.cartOverlay.addEventListener("click", () => toggleCart(false));
    }

    if (elements.logoutButton) {
        elements.logoutButton.addEventListener("click", logout);
    }

    if (elements.pagosButton) {
        elements.pagosButton.addEventListener("click", goToPagos);
    }

    document.addEventListener("keydown", handleEscapeKey);
}

function getProductsFromMarkup() {
    const categoryMap = [
        "men's clothing",
        "men's clothing",
        "men's clothing",
        "men's clothing",
        "jewelery",
        "jewelery",
        "jewelery",
        "jewelery",
        "electronics",
        "electronics",
        "electronics",
        "electronics",
        "electronics",
        "electronics",
        "women's clothing",
        "women's clothing",
        "women's clothing",
        "women's clothing",
        "women's clothing",
        "women's clothing"
    ];

    return elements.productCards.map((card, index) => {
        const title = card.querySelector(".card-title")?.textContent.trim() || `Producto ${index + 1}`;
        const image = card.querySelector("img")?.getAttribute("src") || "";
        const rawPrice = card.querySelector(".card-price")?.value || "";
        const category = categoryMap[index] || "general";

        return {
            id: index + 1,
            title,
            image,
            category,
            price: parsePrice(rawPrice),
            card
        };
    });
}

function populateCategories(items) {
    if (!elements.category) {
        return;
    }

    const categories = [...new Set(items.map((item) => item.category))].sort((a, b) => a.localeCompare(b));
    elements.category.innerHTML = '<option value="all">Todas</option>';

    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = capitalize(category);
        elements.category.appendChild(option);
    });
}

function enhanceProductCards() {
    products.forEach((product) => {
        const button = product.card.querySelector(".btn-agregar-carrito");
        if (!button) return;

        button.addEventListener("click", () => addToCart(product.id));
    });
}

function parsePrice(value) {
    const normalized = String(value).trim().replace(/\./g, "").replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function filterProducts() {
    const searchValue = elements.search ? elements.search.value.trim().toLowerCase() : "";
    const categoryValue = elements.category ? elements.category.value : "all";

    const filtered = products.filter((product) => {
        const matchesText = product.title.toLowerCase().includes(searchValue);
        const matchesCategory = categoryValue === "all" || product.category === categoryValue;
        const isVisible = matchesText && matchesCategory;

        product.card.style.display = isVisible ? "" : "none";
        return isVisible;
    });

    updateResults(filtered.length);
    setStatus(
        filtered.length
            ? "Resultados actualizados segun tu busqueda."
            : "No encontramos coincidencias para los filtros actuales."
    );
}

function getAuth() {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
}

function getCart() {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
}

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function setStatus(message) {
    if (elements.statusMessage) {
        elements.statusMessage.textContent = message;
    }
}

function updateHeroStats(items) {
    const categories = new Set(items.map((item) => item.category));

    if (elements.heroProducts) {
        elements.heroProducts.textContent = String(items.length);
    }

    if (elements.heroCategories) {
        elements.heroCategories.textContent = String(categories.size);
    }
}

function updateResults(total) {
    if (elements.results) {
        elements.results.textContent = `${total} productos disponibles.`;
    }
}

function addToCart(productId) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    const existingItem = cart.find((item) => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            image: product.image,
            price: product.price,
            quantity: 1
        });
    }

    saveCart();
    updateCart();
    setStatus(`"${product.title}" fue agregado al carrito.`);
    toggleCart(true);
}

function removeFromCart(productId) {
    cart = cart.filter((item) => item.id !== productId);
    saveCart();
    updateCart();
}

function updateCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (elements.cartCount) {
        elements.cartCount.textContent = String(totalItems);
    }

    if (elements.cartTotal) {
        elements.cartTotal.textContent = formatCurrency(totalPrice);
    }

    if (!elements.cartItems) {
        return;
    }

    elements.cartItems.innerHTML = "";

    if (!cart.length) {
        elements.cartItems.innerHTML = `
            <article class="empty-state">
                <h3>Tu carrito esta vacio</h3>
                <p>Agrega productos desde el catalogo para verlos aqui.</p>
            </article>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();

    cart.forEach((item) => {
        const article = document.createElement("article");
        article.className = "cart-item";
        article.innerHTML = `
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
            <div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>Cantidad: ${item.quantity}</p>
                <p>Subtotal: ${formatCurrency(item.price * item.quantity)}</p>
            </div>
            <button type="button" class="text-button">Eliminar</button>
        `;

        article.querySelector("button").addEventListener("click", () => removeFromCart(item.id));
        fragment.appendChild(article);
    });

    elements.cartItems.appendChild(fragment);
}

function toggleCart(isOpen) {
    if (!elements.cartDrawer || !elements.openCart) {
        return;
    }

    elements.cartDrawer.classList.toggle("is-open", isOpen);
    elements.cartDrawer.setAttribute("aria-hidden", String(!isOpen));
    elements.openCart.setAttribute("aria-expanded", String(isOpen));
}

function handleEscapeKey(event) {
    if (event.key === "Escape") {
        toggleCart(false);
    }
}

function goToPagos() {
    if (!cart.length) {
        setStatus("Agrega productos al carrito antes de continuar.");
        toggleCart(false);
        return;
    }

    window.location.href = "pagos.html";
}

function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(CART_KEY);
    window.location.href = "login.html";
}

function formatCurrency(value) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(value);
}

function escapeHtml(value) {
    const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };

    return String(value).replace(/[&<>"']/g, (character) => replacements[character]);
}

function capitalize(value) {
    return String(value)
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
