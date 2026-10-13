const productStorageKey = "zmProducts";
const adminPasswordValue = "zm5050";
const loginForm = document.getElementById("loginForm");
const adminLogin = document.getElementById("adminLogin");
const adminDashboard = document.getElementById("adminDashboard");
const productForm = document.getElementById("productForm");
const productList = document.getElementById("adminProducts");
const imageFileInput = document.getElementById("productImageFile");
const imageUrlInput = document.getElementById("productImageUrl");
const imagePreview = document.getElementById("productImagePreview");
let products = readProducts();
let editingProductId = null;
let previewObjectUrl;

function readProducts() {
    try {
        const savedProducts = JSON.parse(localStorage.getItem(productStorageKey) || "[]");
        return Array.isArray(savedProducts) ? savedProducts : [];
    } catch {
        return [];
    }
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

function saveProducts() {
    try {
        localStorage.setItem(productStorageKey, JSON.stringify(products));
        return true;
    } catch {
        document.getElementById("productFeedback").textContent = "Le stockage est plein. Choisissez une photo plus légère.";
        return false;
    }
}

function renderProducts() {
    productList.replaceChildren();
    document.getElementById("inventoryCount").textContent = `${products.length} produit${products.length !== 1 ? "s" : ""} dans votre sélection`;

    if (!products.length) {
        const emptyState = document.createElement("div");
        emptyState.className = "inventory-empty";
        emptyState.innerHTML = "<p class='eyebrow'>PRÊTE À COMMENCER</p><h3>Votre sélection commence ici.</h3><p>Ajoutez votre premier produit pour le faire apparaître dans la boutique.</p>";
        productList.appendChild(emptyState);
        return;
    }

    products.forEach(product => {
        const card = document.createElement("article");
        card.className = "admin-product-card";
        const stock = Math.max(0, Number(product.stock) || 0);
        const status = stock > 0 ? `${stock} pièce${stock !== 1 ? "s" : ""} en stock` : "En arrivage";
        const statusClass = stock === 0 ? "unavailable" : "";
        card.innerHTML = `
            <img src="${escapeHTML(product.image)}" alt="" loading="lazy">
            <div class="admin-product-info">
                <p class="category">${escapeHTML(product.category)}</p>
                <h3>${escapeHTML(product.name)}</h3>
                <p class="admin-product-price">${Number(product.price).toFixed(2).replace(".", ",")} DT</p>
                <p class="admin-product-status ${statusClass}">${escapeHTML(status)}</p>
                <div class="admin-product-actions">
                    <button type="button" data-edit-product="${escapeHTML(product.id)}">Modifier</button>
                    <button type="button" data-delete-product="${escapeHTML(product.id)}">Supprimer</button>
                </div>
            </div>
        `;
        productList.appendChild(card);
    });
}

function clearPreview() {
    if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = undefined;
    imagePreview.removeAttribute("src");
    imagePreview.hidden = true;
    document.getElementById("productImageHint").hidden = false;
}

function showProductForm(product = null) {
    editingProductId = product?.id ?? null;
    productForm.reset();
    clearPreview();

    if (product) {
        document.getElementById("productName").value = product.name;
        document.getElementById("productPrice").value = product.price;
        document.getElementById("productCategory").value = product.category;
        document.getElementById("productStock").value = Math.max(0, Number(product.stock) || 0);
        document.getElementById("productDescription").value = product.description;
        if (product.image.startsWith("http://") || product.image.startsWith("https://")) {
            imageUrlInput.value = product.image;
        }
        imagePreview.src = product.image;
        imagePreview.hidden = false;
        document.getElementById("productImageHint").hidden = true;
        document.getElementById("productFormTitle").textContent = "Modifier le produit";
        document.getElementById("saveProductButton").textContent = "Enregistrer les modifications";
    } else {
        document.getElementById("productFormTitle").textContent = "Ajouter un produit";
        document.getElementById("saveProductButton").textContent = "Publier le produit";
    }

    document.getElementById("productFeedback").textContent = "";
    productForm.hidden = false;
    productForm.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("productName").focus({ preventScroll: true });
}

function compressImage(file) {
    return new Promise((resolve, reject) => {
        if (file.size > 12 * 1024 * 1024) {
            reject(new Error("La photo dépasse 12 Mo."));
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Impossible de lire cette photo."));
        reader.onload = () => {
            const image = new Image();
            image.onerror = () => reject(new Error("Le fichier choisi n'est pas une image valide."));
            image.onload = () => {
                const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(image.width * scale);
                canvas.height = Math.round(image.height * scale);
                canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.8));
            };
            image.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

loginForm.addEventListener("submit", event => {
    event.preventDefault();
    const passwordInput = document.getElementById("adminPassword");

    if (passwordInput.value.trim() !== adminPasswordValue) {
        document.getElementById("loginFeedback").textContent = "Mot de passe incorrect.";
        passwordInput.select();
        return;
    }

    adminLogin.hidden = true;
    adminDashboard.hidden = false;
    document.getElementById("adminNotice").textContent = "Catalogue enregistré dans ce navigateur.";
    renderProducts();
});

document.getElementById("newProductButton").addEventListener("click", () => showProductForm());
document.getElementById("closeProductForm").addEventListener("click", () => {
    editingProductId = null;
    productForm.reset();
    productForm.hidden = true;
    clearPreview();
});
document.getElementById("cancelProductButton").addEventListener("click", () => {
    editingProductId = null;
    productForm.reset();
    productForm.hidden = true;
    clearPreview();
});

imageFileInput.addEventListener("change", () => {
    clearPreview();
    imageUrlInput.value = "";
    const file = imageFileInput.files[0];
    if (!file) return;
    previewObjectUrl = URL.createObjectURL(file);
    imagePreview.src = previewObjectUrl;
    imagePreview.hidden = false;
    document.getElementById("productImageHint").hidden = true;
});

imageUrlInput.addEventListener("input", () => {
    if (!imageUrlInput.value.trim()) return;
    imageFileInput.value = "";
    clearPreview();
    imagePreview.src = imageUrlInput.value.trim();
    imagePreview.hidden = false;
    document.getElementById("productImageHint").hidden = true;
});

productForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!productForm.reportValidity()) return;

    const existingProduct = products.find(product => product.id === editingProductId);
    const selectedFile = imageFileInput.files[0];
    let image = imageUrlInput.value.trim() || existingProduct?.image || "";

    if (selectedFile) {
        try {
            image = await compressImage(selectedFile);
        } catch (error) {
            document.getElementById("productFeedback").textContent = error.message;
            return;
        }
    }

    if (!image) {
        document.getElementById("productFeedback").textContent = "Ajoutez une photo ou un lien d'image pour ce produit.";
        return;
    }

    if (image.startsWith("http")) {
        try {
            const imageUrl = new URL(image);
            if (!['http:', 'https:'].includes(imageUrl.protocol)) throw new Error();
        } catch {
            document.getElementById("productFeedback").textContent = "Le lien de la photo n'est pas valide.";
            return;
        }
    }

    const product = {
        id: editingProductId || (window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`),
        name: document.getElementById("productName").value.trim(),
        price: Number(document.getElementById("productPrice").value),
        category: document.getElementById("productCategory").value,
        stock: Math.floor(Number(document.getElementById("productStock").value)),
        image,
        description: document.getElementById("productDescription").value.trim()
    };

    if (editingProductId) {
        products = products.map(item => item.id === editingProductId ? product : item);
    } else {
        products.unshift(product);
    }

    if (!saveProducts()) return;
    renderProducts();
    productForm.reset();
    productForm.hidden = true;
    editingProductId = null;
    clearPreview();
    document.getElementById("adminNotice").textContent = "Produit enregistré dans ce navigateur.";
});

productList.addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-product]");
    if (editButton) {
        const product = products.find(item => item.id === editButton.dataset.editProduct);
        if (product) showProductForm(product);
        return;
    }

    const deleteButton = event.target.closest("[data-delete-product]");
    if (!deleteButton) return;
    const product = products.find(item => item.id === deleteButton.dataset.deleteProduct);
    if (!product || !window.confirm(`Supprimer « ${product.name} » du catalogue ?`)) return;

    products = products.filter(item => item.id !== product.id);
    if (saveProducts()) {
        renderProducts();
        document.getElementById("adminNotice").textContent = "Produit supprimé du catalogue.";
    }
});

window.addEventListener("storage", event => {
    if (event.key !== productStorageKey) return;
    products = readProducts();
    renderProducts();
});
