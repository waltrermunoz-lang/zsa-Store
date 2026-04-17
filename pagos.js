const CART_KEY = "sabbyshopp-cart";

const orderItems = document.getElementById("orderItems");
const subtotalValue = document.getElementById("subtotalValue");
const shippingValue = document.getElementById("shippingValue");
const totalValue = document.getElementById("totalValue");
const paymentForm = document.getElementById("paymentForm");
const paymentMessage = document.getElementById("paymentMessage");
const cardFields = document.getElementById("cardFields");
const walletFields = document.getElementById("walletFields");
const paymentMethodInputs = document.querySelectorAll('input[name="paymentMethod"]');

const cart = getCart();
const shippingCost = 12.00;

if (!cart.length) {
    window.location.href = "index.html";
}

renderOrderSummary();
updatePaymentFields();

paymentMethodInputs.forEach((input) => {
    input.addEventListener("change", updatePaymentFields);
});

paymentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const method = getSelectedMethod();

    if (!validatePayment(method)) {
        return;
    }

    localStorage.removeItem(CART_KEY);
    paymentMessage.textContent = "Pago aprobado en modo demo. Tu pedido fue registrado correctamente.";
    paymentMessage.className = "payment-message success";

    setTimeout(() => {
        window.location.href = "index.html";
    }, 1800);
});

function getCart() {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
}

function renderOrderSummary() {
    orderItems.innerHTML = "";

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal + shippingCost;

    cart.forEach((item) => {
        const article = document.createElement("article");
        article.className = "order-item";
        article.innerHTML = `
            <img src="${item.image}" alt="${escapeHtml(item.title)}">
            <div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>Cantidad: ${item.quantity}</p>
            </div>
            <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
        `;
        orderItems.appendChild(article);
    });

    subtotalValue.textContent = `$${subtotal.toFixed(2)}`;
    shippingValue.textContent = `$${shippingCost.toFixed(2)}`;
    totalValue.textContent = `$${total.toFixed(2)}`;
}

function getSelectedMethod() {
    const selected = document.querySelector('input[name="paymentMethod"]:checked');
    return selected ? selected.value : "mastercard";
}

function updatePaymentFields() {
    const method = getSelectedMethod();
    const isWallet = method === "nequi";

    cardFields.classList.toggle("hidden", isWallet);
    walletFields.classList.toggle("hidden", !isWallet);

    paymentMessage.textContent = "";
    paymentMessage.className = "payment-message";
}

function validatePayment(method) {
    if (method === "nequi") {
        const phone = document.getElementById("walletPhone").value.trim();
        const documentValue = document.getElementById("walletDocument").value.trim();

        if (!phone || !documentValue) {
            showError("Completa los datos de Nequi para continuar.");
            return false;
        }

        return true;
    }

    const cardName = document.getElementById("cardName").value.trim();
    const cardNumber = document.getElementById("cardNumber").value.trim();
    const cardExpiry = document.getElementById("cardExpiry").value.trim();
    const cardCvv = document.getElementById("cardCvv").value.trim();

    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
        showError("Completa todos los datos de la tarjeta.");
        return false;
    }

    if (cardNumber.replace(/\s/g, "").length < 16) {
        showError("El numero de tarjeta debe tener al menos 16 digitos.");
        return false;
    }

    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        showError("Usa el formato MM/AA en el vencimiento.");
        return false;
    }

    if (cardCvv.length < 3) {
        showError("El CVV debe tener al menos 3 digitos.");
        return false;
    }

    return true;
}

function showError(message) {
    paymentMessage.textContent = message;
    paymentMessage.className = "payment-message error";
}

function escapeHtml(value) {
    const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };

    return value.replace(/[&<>"']/g, (character) => replacements[character]);
}
