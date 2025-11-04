// Cart Management System
// This file handles all cart operations across the website

// Cart utility functions
const CartManager = {
    // Check if user is logged in
    isLoggedIn: function() {
        const userSession = sessionStorage.getItem('user');
        const userLocal = localStorage.getItem('user');
        return !!(userSession || userLocal);
    },

    // Get cart from localStorage
    getCart: function() {
        if (!this.isLoggedIn()) {
            return [];
        }
        const cart = localStorage.getItem('unitmate_cart');
        return cart ? JSON.parse(cart) : [];
    },

    // Save cart to localStorage
    saveCart: function(cart) {
        localStorage.setItem('unitmate_cart', JSON.stringify(cart));
        this.updateCartBadge();
    },

    // Add item to cart
    addToCart: function(product, quantity = 1) {
        // Check if user is logged in
        if (!this.isLoggedIn()) {
            alert('Pre pridanie produktov do košíka sa musíte najprv prihlásiť.');
            window.location.href = 'login.html';
            return false;
        }

        // Check if product is in stock
        const stock = parseInt(product.status);
        if (stock <= 0) {
            alert('Tento produkt je vypredaný a nemôže byť pridaný do košíka.');
            return false;
        }

        const cart = this.getCart();
        
        // Check if product already exists in cart
        const existingItemIndex = cart.findIndex(item => item.name === product.name);
        
        if (existingItemIndex > -1) {
            // Check if adding more would exceed stock
            const newQuantity = cart[existingItemIndex].quantity + quantity;
            if (newQuantity > stock) {
                alert(`Nemôžete pridať viac kusov. Dostupné množstvo: ${stock} ks (v košíku už máte ${cart[existingItemIndex].quantity} ks)`);
                return false;
            }
            // Update quantity if product exists
            cart[existingItemIndex].quantity = newQuantity;
        } else {
            // Check if requested quantity exceeds stock
            if (quantity > stock) {
                alert(`Nemôžete pridať ${quantity} ks. Dostupné množstvo: ${stock} ks`);
                return false;
            }
            // Add new product to cart
            cart.push({
                name: product.name,
                price: parseFloat(product.base_price),
                quantity: quantity,
                photo_link: product.photo_link,
                description: product.description,
                stock: stock
            });
        }
        
        this.saveCart(cart);
        return true;
    },

    // Remove item from cart
    removeFromCart: function(productName) {
        if (!this.isLoggedIn()) {
            return;
        }
        let cart = this.getCart();
        cart = cart.filter(item => item.name !== productName);
        this.saveCart(cart);
    },

    // Update item quantity
    updateQuantity: function(productName, quantity) {
        if (!this.isLoggedIn()) {
            return;
        }
        const cart = this.getCart();
        const item = cart.find(item => item.name === productName);
        
        if (item) {
            if (quantity < 1) {
                quantity = 1;
            }
            item.quantity = quantity;
            this.saveCart(cart);
        }
    },

    // Clear cart
    clearCart: function() {
        localStorage.removeItem('unitmate_cart');
        this.updateCartBadge();
    },

    // Get cart total
    getCartTotal: function() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    // Get cart item count
    getCartItemCount: function() {
        const cart = this.getCart();
        return cart.reduce((count, item) => count + item.quantity, 0);
    },

    // Update cart badge in navigation
    updateCartBadge: function() {
        const cartLinks = document.querySelectorAll('a[href*="cart.html"]');
        const itemCount = this.getCartItemCount();
        
        cartLinks.forEach(link => {
            if (itemCount > 0) {
                link.innerHTML = `🛒 Košík (${itemCount})`;
            } else {
                link.innerHTML = '🛒 Košík';
            }
        });
    }
};

// Initialize cart badge on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        CartManager.updateCartBadge();
    });
} else {
    CartManager.updateCartBadge();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartManager;
}