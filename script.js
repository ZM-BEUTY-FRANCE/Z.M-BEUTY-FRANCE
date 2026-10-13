const productStorageKey = "zmProducts";
const productsFromStorage = () => JSON.parse(localStorage.getItem(productStorageKey) || "[]");
let products = productsFromStorage();
const heroFilm = document.getElementById("heroFilm");
const fallbackHeroItems = [
    { name: "Sac Élégance", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700&auto=format&fit=crop&q=85" },
    { name: "Lunettes Chic", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=700&auto=format&fit=crop&q=85" },
    { name: "Sac à main", image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=700&auto=format&fit=crop&q=85" },
    { name: "Montre Élégante", image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=700&auto=format&fit=crop&q=85" },
    { name: "Style Féminin", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&auto=format&fit=crop&q=85" },
    { name: "Collection Mode", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=700&auto=format&fit=crop&q=85" }
];

function refreshHeroFilm() {
    if (!heroFilm) return;

    const canvas = heroFilm.querySelector("canvas");
    const catalogImages = products.filter(product => product.image);
    const galleryItems = (catalogImages.length ? catalogImages : fallbackHeroItems).slice(0, 12);
    heroFilm.replaceChildren();

    for (let columnIndex = 0; columnIndex < 3; columnIndex++) {
        let columnItems = galleryItems.filter((_, index) => index % 3 === columnIndex);
        if (columnItems.length < 2) {
            columnItems = galleryItems.length > 1 ? galleryItems : [...galleryItems, ...galleryItems];
        }

        const column = document.createElement("div");
        column.className = "hero-film-column";
        const track = document.createElement("div");
        track.className = "hero-film-track";

        [...columnItems, ...columnItems].forEach(product => {
            const image = document.createElement("img");
            image.crossOrigin = "anonymous";
            image.src = product.image;
            image.alt = product.name ? `Article : ${product.name}` : "Trouvaille ZM BEAUTY FRANCE";
            image.loading = "eager";
            image.decoding = "async";
            track.appendChild(image);
        });

        column.appendChild(track);
        heroFilm.appendChild(column);
    }
    if (canvas) heroFilm.appendChild(canvas);

    const heroCaption = document.getElementById("hero-image-caption");
    if (heroCaption) heroCaption.textContent = catalogImages.length ? "La sélection du moment." : "Inspiration mode.";
    const heroLabel = document.getElementById("hero-film-label");
    if (heroLabel) heroLabel.textContent = catalogImages.length ? "NOS PRODUITS" : "INSPIRATION";
    heroFilm.setAttribute("aria-label", catalogImages.length
        ? "Montage animé des produits ZM BEAUTY FRANCE"
        : "Montage animé d’inspiration ZM BEAUTY FRANCE");
}

refreshHeroFilm();

const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.dataset.revealState = "visible";
            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" })
    : null;

function observeScrollReveals(root = document) {
    if (!revealObserver) return;
    root.querySelectorAll(".scroll-reveal:not([data-reveal-state])").forEach(element => {
        element.dataset.revealState = "waiting";
        revealObserver.observe(element);
    });
}

observeScrollReveals();

let cart = [];
const deliveryFee = 8;
let feedbackTimer;

const productList = document.getElementById("product-list");
const searchInput = document.getElementById("search");
const sortInput = document.getElementById("sort");

function normalizeText(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function showFeedback(message) {
    const feedback = document.getElementById("cart-feedback");
    feedback.textContent = message;
    feedback.hidden = false;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => { feedback.hidden = true; }, 3000);
}

function getSubtotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function scrollToSection(section) {
    section.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
}

function formatPrice(price) {
    return price.toFixed(2).replace(".", ",") + " DT";
}

function renderFilters(activeCategory = "Tous") {
    const filters = document.querySelector(".filters");
    const categories = [...new Set(products.map(product => product.category).filter(Boolean))];
    filters.replaceChildren();

    ["Tous", ...categories].forEach(category => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `filter${category === activeCategory ? " active" : ""}`;
        button.dataset.category = category;
        button.setAttribute("aria-pressed", String(category === activeCategory));
        button.textContent = category === "Tous" ? "Tout" : category;
        filters.appendChild(button);
    });
}

function renderProducts() {
    const query = normalizeText(searchInput.value);
    const selectedCategory = document.querySelector(".filter.active")?.dataset.category || "Tous";
    const activeCategory = products.some(product => product.category === selectedCategory) ? selectedCategory : "Tous";
    const catalogToolbar = document.querySelector(".catalog-toolbar");
    const filters = document.querySelector(".filters");

    renderFilters(activeCategory);
    catalogToolbar.hidden = products.length === 0;
    filters.hidden = products.length === 0;

    const filtered = products.filter(product => {
        const searchableText = normalizeText(`${product.name} ${product.description || ""}`);
        return searchableText.includes(query) &&
            (activeCategory === "Tous" || product.category === activeCategory);
    });

    if (sortInput.value === "price-asc") filtered.sort((first, second) => first.price - second.price);
    if (sortInput.value === "price-desc") filtered.sort((first, second) => second.price - first.price);
    if (sortInput.value === "name") filtered.sort((first, second) => first.name.localeCompare(second.name, "fr"));

    const productCount = document.getElementById("product-count");
    productCount.textContent = products.length
        ? `${filtered.length} pièce${filtered.length !== 1 ? "s" : ""} dans la sélection`
        : "Une sélection pensée avec soin, bientôt disponible.";
    productList.replaceChildren();

    if (!filtered.length) {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state scroll-reveal";
        emptyState.innerHTML = products.length
            ? '<h3>Ma l9itech elli tlawej 3lih ?</h3><p>Essayez un autre mot, ou envoyez-nous une photo du produit.</p><a href="#sur-demande">Demander un produit par photo ↗</a><br><button type="button" data-reset>Voir tous les produits</button>'
            : '<p class="eyebrow">ZM BEAUTY FRANCE · EL FAHS</p><h3>Les premières trouvailles arrivent bientôt.</h3><p>Notre prochaine sélection se prépare. En attendant, dites-nous ce que vous cherchez.</p><a href="https://wa.me/21650689730" target="_blank" rel="noopener noreferrer">Nous écrire sur WhatsApp ↗</a>';
        productList.appendChild(emptyState);
        observeScrollReveals(productList);
        return;
    }

    filtered.forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card scroll-reveal";
        const stock = Math.max(0, Number(product.stock) || 0);
        const status = stock > 0 ? `Disponible · ${stock} en stock` : "En arrivage";
        const unavailable = stock === 0;

        card.innerHTML = `
            <img class="product-image" src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" loading="lazy" decoding="async" width="600" height="700">
            <div class="product-info">
                <p class="category">${escapeHTML(product.category)}</p>
                <h3>${escapeHTML(product.name)}</h3>
                <p class="price">${formatPrice(Number(product.price))}</p>
                <p class="catalog-status${unavailable ? " unavailable" : ""}">${escapeHTML(status)}</p>
                <button data-add="${escapeHTML(product.id)}" aria-label="Ajouter ${escapeHTML(product.name)} au panier" ${unavailable ? "disabled" : ""}>
                    ${unavailable ? "En arrivage" : "Ajouter au panier"} <span aria-hidden="true">+</span>
                </button>
            </div>
        `;

        productList.appendChild(card);
    });

    observeScrollReveals(productList);
}

function renderCart() {
    const container = document.getElementById("cart-items");
    const checkoutLayout = document.querySelector(".checkout-layout");
    checkoutLayout.hidden = cart.length === 0;

    container.innerHTML = "";

    let total = 0;
    let count = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        count += item.quantity;

        container.innerHTML += `
            <div class="cart-row">
                <div class="cart-product"><img src="${escapeHTML(item.image)}" alt="" width="56" height="68" loading="lazy"><div><strong>${escapeHTML(item.name)}</strong><span>${formatPrice(item.price)} / pièce</span></div></div>
                <div class="cart-actions"><div class="quantity-control"><button type="button" data-quantity="${escapeHTML(item.id)}" data-change="-1" aria-label="Diminuer la quantité de ${escapeHTML(item.name)}">−</button><span aria-label="Quantité">${item.quantity}</span><button type="button" data-quantity="${escapeHTML(item.id)}" data-change="1" aria-label="Augmenter la quantité de ${escapeHTML(item.name)}" ${item.quantity >= Number(item.stock) ? "disabled" : ""}>+</button></div><span>${formatPrice(item.price * item.quantity)}</span>
                <button class="remove-button" data-remove="${escapeHTML(item.id)}" aria-label="Supprimer ${escapeHTML(item.name)} du panier">
                    Supprimer
                </button>
                </div>
            </div>
        `;
    });

    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-cart"><p>Votre sélection commence ici.</p><a href="#produits">Découvrir les produits ↗</a></div>';
        document.getElementById("commande").hidden = true;
    }

    document.getElementById("cart-count").textContent = count;
    document.getElementById("floatingCartCount").textContent = count;
    document.getElementById("floatingCartButton").setAttribute("aria-label", `Afficher le panier · ${count} article${count !== 1 ? "s" : ""}`);
    const shipping = cart.length ? deliveryFee : 0;
    document.getElementById("cart-subtotal").textContent = formatPrice(total);
    document.getElementById("cart-shipping").textContent = formatPrice(shipping);
    document.getElementById("cart-total").textContent = formatPrice(total + shipping);
    document.getElementById("checkout-button").disabled = cart.length === 0;
    document.getElementById("order-message").textContent = "";
}

productList.addEventListener("click", event => {
    if (event.target.closest("[data-reset]")) {
        searchInput.value = "";
        document.querySelector('[data-category="Tous"]').click();
        searchInput.focus();
        return;
    }
    const button = event.target.closest("[data-add]");

    if (!button) return;

    const id = button.dataset.add;
    const product = products.find(item => item.id === id);
    if (!product) return;
    const existing = cart.find(item => item.id === id);
    const availableStock = Math.max(0, Number(product.stock) || 0);

    if (!availableStock || (existing && existing.quantity >= availableStock)) {
        showFeedback(availableStock ? "Vous avez ajouté tout le stock disponible." : "Ce produit est en arrivage.");
        return;
    }

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    renderCart();
    showFeedback(`${product.name} ajouté · Tzed lel panier !`);
});

document.getElementById("cart-items").addEventListener("click", event => {
    const quantityButton = event.target.closest("[data-quantity]");
    if (quantityButton) {
        const item = cart.find(product => String(product.id) === quantityButton.dataset.quantity);
        if (!item) return;
        const change = Number(quantityButton.dataset.change);
        if (change > 0 && item.quantity >= Number(item.stock)) {
            showFeedback("Vous avez ajouté tout le stock disponible.");
            return;
        }
        item.quantity += change;
        if (!item.quantity) cart = cart.filter(product => product.id !== item.id);
        renderCart();
        const replacement = document.querySelector(`[data-quantity="${item.id}"][data-change="${quantityButton.dataset.change}"]`);
        (replacement || document.getElementById("cart-button")).focus({ preventScroll: true });
        showFeedback("Panier mis à jour");
        return;
    }
    const button = event.target.closest("[data-remove]");

    if (!button) return;

    const id = button.dataset.remove;

    cart = cart.filter(item => item.id !== id);

    renderCart();
    document.getElementById("cart-button").focus({ preventScroll: true });
    showFeedback("Article retiré du panier");
});

searchInput.addEventListener("input", renderProducts);
sortInput.addEventListener("change", renderProducts);

document.querySelector(".filters").addEventListener("click", event => {
    const button = event.target.closest("[data-category]");

    if (!button) return;

    document.querySelectorAll(".filter").forEach(item => {
        item.classList.remove("active");
        item.setAttribute("aria-pressed", "false");
    });

    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");

    renderProducts();
});

document.getElementById("cart-button").addEventListener("click", () => {
    if (!cart.length) {
        showFeedback("Votre panier est vide · Ekhtar produit mel boutique.");
        return;
    }
    scrollToSection(document.getElementById("panier"));
});

document.getElementById("floatingCartButton").addEventListener("click", () => {
    if (!cart.length) {
        showFeedback("Votre panier est vide · Ekhtar produit mel boutique.");
        return;
    }
    scrollToSection(document.getElementById("panier"));
});

document.getElementById("checkout-button").addEventListener("click", () => {
    if (cart.length === 0) {
        showFeedback("Ajoutez un article pour préparer votre commande.");
        return;
    }

    const section = document.getElementById("commande");
    section.hidden = false;
    scrollToSection(section);
    document.querySelector('[name="name"]').focus({ preventScroll: true });
});

renderProducts();
renderCart();

window.addEventListener("storage", event => {
    if (event.key !== productStorageKey) return;

    products = productsFromStorage();
    cart = cart.flatMap(item => {
        const updatedProduct = products.find(product => String(product.id) === String(item.id));
        return updatedProduct ? [{ ...updatedProduct, quantity: item.quantity }] : [];
    });
    refreshHeroFilm();
    renderProducts();
    renderCart();
});
const orderForm = document.getElementById("order-form");

orderForm.addEventListener("submit", function(event) {
    event.preventDefault();

    if (cart.length === 0) {
        showFeedback("Ajoutez un article pour préparer votre commande.");
        return;
    }

    const unavailableItem = cart.find(item => {
        const currentProduct = products.find(product => String(product.id) === String(item.id));
        return !currentProduct || Number(currentProduct.stock) < item.quantity;
    });
    if (unavailableItem) {
        document.getElementById("order-message").textContent = `Stock insuffisant pour ${unavailableItem.name}. Ajustez votre panier avant de continuer.`;
        return;
    }

    if (!orderForm.reportValidity()) return;

    const formData = new FormData(orderForm);

    const name = formData.get("name").trim();
    const phone = formData.get("phone").trim();
    const address = formData.get("address").trim();
    const city = formData.get("city").trim();

    if (![name, phone, address, city].every(Boolean)) {
        document.getElementById("order-message").textContent = "Veuillez compléter chaque champ avec vos coordonnées.";
        return;
    }

    let message = "*DEMANDE DE COMMANDE - ZM BEAUTY FRANCE*\nAslema, nheb ncommandi :\n\n";

    message += "👤 Nom : " + name + "\n";
    message += "📞 Téléphone : " + phone + "\n";
    message += "📍 Adresse : " + address + "\n";
    message += "🏙️ Ville : " + city + "\n\n";

    message += "🛍️ *Produits commandés :*\n";

    cart.forEach(function(item) {
        message += "- " + item.name +
            " x " + item.quantity +
            " = " + formatPrice(item.price * item.quantity) + "\n";
    });

    const total = getSubtotal();
    message += "\nSous-total : " + formatPrice(total);
    message += "\nLivraison : " + formatPrice(deliveryFee);
    message += "\nTotal à payer : " + formatPrice(total + deliveryFee);
    message += "\nPaiement à la livraison\nMerci de confirmer la disponibilité et les modalités de livraison.";

    const whatsappNumber = "21650689730";

    const whatsappURL =
        "https://wa.me/" + whatsappNumber +
        "?text=" + encodeURIComponent(message);

    window.open(whatsappURL, "_blank", "noopener,noreferrer");

    products = products.map(product => {
        const orderedItem = cart.find(item => String(item.id) === String(product.id));
        return orderedItem ? { ...product, stock: Number(product.stock) - orderedItem.quantity } : product;
    });
    localStorage.setItem(productStorageKey, JSON.stringify(products));
    cart = [];
    refreshHeroFilm();
    renderProducts();
    renderCart();
    document.querySelector(".checkout-layout").hidden = false;
    document.getElementById("commande").hidden = false;
    document.getElementById("order-message").textContent = "Votre message est prêt. Envoyez-le dans WhatsApp pour transmettre votre demande à la boutique.";
    const fallback = document.createElement("a");
    fallback.href = whatsappURL;
    fallback.target = "_blank";
    fallback.rel = "noopener noreferrer";
    fallback.textContent = " Ouvrir WhatsApp si la fenêtre ne s’affiche pas ↗";
    document.getElementById("order-message").appendChild(fallback);
});

const requestForm = document.getElementById("request-form");
const photoInput = document.getElementById("request-photo");
const photoPreview = document.getElementById("photo-preview");
const photoStatus = document.getElementById("photo-status");
const requestStatus = document.getElementById("request-status");
const requestSubmit = document.getElementById("request-submit");
let previewUrl;

function validatePhoto() {
    const photo = photoInput.files[0];
    let error = "";
    if (photo && !["image/jpeg", "image/png", "image/webp"].includes(photo.type)) {
        error = "Choisissez une photo JPG, PNG ou WebP · Hot taswira bel format s7i7.";
    } else if (photo && photo.size > 7 * 1024 * 1024) {
        error = "Photo trop grande · Taswira lezem a9al men 7 Mo.";
    } else if (photo && !photo.size) {
        error = "Cette photo est vide · Ekhtar taswira okhra.";
    }
    photoInput.setCustomValidity(error);
    photoStatus.textContent = error || (photo ? `${photo.name} · Photo prête à envoyer` : "");
    return Boolean(photo) && !error;
}

photoInput.addEventListener("change", () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = undefined;
    photoPreview.hidden = true;
    photoPreview.removeAttribute("src");
    requestStatus.textContent = "";
    if (validatePhoto()) {
        previewUrl = URL.createObjectURL(photoInput.files[0]);
        photoPreview.src = previewUrl;
        photoPreview.hidden = false;
    }
});

requestForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (requestSubmit.disabled) return;
    const validPhoto = validatePhoto();
    if (!requestForm.reportValidity() || !validPhoto) return;
    const formData = new FormData(requestForm);
    const customerName = String(formData.get("customer-name")).trim();
    const phone = String(formData.get("phone")).trim();
    const details = String(formData.get("details") || "").trim();
    if (!customerName || !phone) {
        requestStatus.textContent = "Hot esmek w noumrouk · Complétez votre nom et téléphone.";
        return;
    }
    requestSubmit.disabled = true;
    requestSubmit.textContent = "Préparation du message…";
    requestForm.setAttribute("aria-busy", "true");

    const whatsappMessage = [
        "*DEMANDE PRODUIT - ZM BEAUTY FRANCE*",
        "Aslema, nheb n7ajbek 3la produit :",
        "",
        "👤 Nom : " + customerName,
        "📞 Téléphone : " + phone,
        details ? "📝 Détails : " + details : "",
        "",
        "Merci de me recontacter pour confirmer le produit, le prix et la disponibilité."
    ].filter(Boolean).join("\n");

    const whatsappURL = "https://wa.me/21650689730?text=" + encodeURIComponent(whatsappMessage);

    requestStatus.textContent = "Votre demande est prête. Ouvrez WhatsApp pour l’envoyer à la boutique.";
    requestForm.reset();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = undefined;
    photoPreview.hidden = true;
    photoPreview.removeAttribute("src");
    photoStatus.textContent = "";
    photoInput.setCustomValidity("");
    window.open(whatsappURL, "_blank", "noopener,noreferrer");

    const fallback = document.createElement("a");
    fallback.href = whatsappURL;
    fallback.target = "_blank";
    fallback.rel = "noopener noreferrer";
    fallback.textContent = " Ouvrir WhatsApp ↗";
    requestStatus.appendChild(fallback);

    requestSubmit.disabled = false;
    requestSubmit.textContent = "Envoyer ma demande · Ab3ath ↗";
    requestForm.removeAttribute("aria-busy");
});