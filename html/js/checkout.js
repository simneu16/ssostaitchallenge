// Checkout page functionality
(function() {
    'use strict';

    // Check if user is logged in
    if (!CartManager.isLoggedIn()) {
        alert('Musíte sa prihlásiť pre pokračovanie objednávky.');
        window.location.href = 'login.html';
        return;
    }

    // Get user data and cart
    const userData = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user'));
    const cart = CartManager.getCart();
    const installationRequired = sessionStorage.getItem('installationRequired') === 'true';

    // Check if cart is empty
    if (cart.length === 0) {
        alert('Váš košík je prázdny.');
        window.location.href = 'cart.html';
        return;
    }

    // Auto-fill user data
    function autoFillUserData() {
        if (userData) {
            document.getElementById('billingFirstName').value = userData.firstname || '';
            document.getElementById('billingLastName').value = userData.lastname || '';
            document.getElementById('billingEmail').value = userData.email || '';
            document.getElementById('billingPhone').value = userData.telephone || '';
            
            // Parse address if available
            if (userData.address) {
                const addressParts = userData.address.split(',');
                document.getElementById('billingAddress').value = addressParts[0]?.trim() || '';
                if (addressParts.length > 1) {
                    const cityZip = addressParts[1]?.trim().split(' ');
                    document.getElementById('billingCity').value = cityZip[0] || '';
                    document.getElementById('billingZip').value = cityZip[1] || '';
                }
            }
        }
    }

    // Display order summary
    function displayOrderSummary() {
        const orderItemsContainer = document.getElementById('orderItems');
        const total = CartManager.getCartTotal();
        const installationFee = installationRequired ? 50 : 0;
        const finalTotal = total + installationFee;

        let itemsHTML = cart.map(item => `
            <div class="summary-item">
                <span>${item.name} (${item.quantity}x)</span>
                <span>${(item.price * item.quantity).toFixed(2)}€</span>
            </div>
        `).join('');

        if (installationRequired) {
            itemsHTML += `
                <div class="summary-item">
                    <span>🔧 Montáž</span>
                    <span>50.00€</span>
                </div>
            `;
        }

        itemsHTML += `
            <div class="summary-item">
                <span>🚚 Doprava</span>
                <span style="color: var(--success);">Zadarmo</span>
            </div>
        `;

        orderItemsContainer.innerHTML = itemsHTML;
        document.getElementById('orderTotal').textContent = finalTotal.toFixed(2) + '€';
    }

    // Toggle shipping address fields
    window.toggleShippingAddress = function() {
        const checkbox = document.getElementById('sameAsBilling');
        const shippingFields = document.getElementById('shippingFields');
        
        if (checkbox.checked) {
            shippingFields.style.display = 'none';
            document.getElementById('shippingAddress').required = false;
            document.getElementById('shippingCity').required = false;
            document.getElementById('shippingZip').required = false;
        } else {
            shippingFields.style.display = 'block';
            document.getElementById('shippingAddress').required = true;
            document.getElementById('shippingCity').required = true;
            document.getElementById('shippingZip').required = true;
        }
    };

    // Format card number input
    document.getElementById('cardNumber')?.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
    });

    // Format expiry date
    document.getElementById('cardExpiry')?.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        e.target.value = value;
    });

    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    document.getElementById('preferredDate').min = minDate;

    // Submit order
    window.submitOrder = async function() {
        const form = document.getElementById('checkoutForm');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Collect form data
        const sameAsBilling = document.getElementById('sameAsBilling').checked;
        
        const billingInfo = {
            firstName: document.getElementById('billingFirstName').value,
            lastName: document.getElementById('billingLastName').value,
            email: document.getElementById('billingEmail').value,
            phone: document.getElementById('billingPhone').value,
            address: document.getElementById('billingAddress').value,
            city: document.getElementById('billingCity').value,
            zip: document.getElementById('billingZip').value
        };

        const shippingAddress = sameAsBilling 
            ? `${billingInfo.address}, ${billingInfo.city} ${billingInfo.zip}`
            : `${document.getElementById('shippingAddress').value}, ${document.getElementById('shippingCity').value} ${document.getElementById('shippingZip').value}`;

        const orderData = {
            user_id: userData.id || userData.ID,
            delivery_address: shippingAddress,
            preferred_date: document.getElementById('preferredDate').value,
            install_package: installationRequired,
            billing_information: billingInfo,
            items: cart.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            payment: {
                cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''),
                cardName: document.getElementById('cardName').value,
                cardExpiry: document.getElementById('cardExpiry').value,
                cardCVV: document.getElementById('cardCVV').value
            }
        };

        try {
            // Submit order to backend
            const response = await fetch('../php/create_order.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (result.success) {
                // Generate PDF
                await generateOrderPDF(orderData, result.order_id);
                
                // Clear cart
                CartManager.clearCart();
                
                // Clear installation flag
                sessionStorage.removeItem('installationRequired');
                
                // Redirect to success page
                alert('Objednávka bola úspešne vytvorená! PDF faktúra bola stiahnutá.');
                window.location.href = 'objednavky.html';
            } else {
                alert('Chyba pri vytváraní objednávky: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Chyba pri vytváraní objednávky. Skúste to prosím znova.');
        }
    };

    // Generate PDF invoice
    async function generateOrderPDF(orderData, orderId) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Set up unicode support for Slovak characters
        // Use helvetica font which has better unicode support
        doc.setFont("helvetica");

        // Helper function to handle Slovak characters
        function cleanText(text) {
            // jsPDF has limited support for Slovak characters in standard fonts
            // We'll ensure proper encoding
            return String(text);
        }

        // Define colors matching website
        const primaryColor = [15, 37, 87];      // #0f2557
        const accentColor = [59, 130, 246];     // #3b82f6
        const lightGray = [241, 245, 249];      // #f1f5f9
        const darkGray = [100, 116, 139];       // #64748b
        const white = [255, 255, 255];

        // Add header background
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 210, 45, 'F');

        // Add company info on the left
        doc.setTextColor(...white);
        doc.setFontSize(24);
        doc.setFont("helvetica", 'bold');
        doc.text('UnitMate a.s.', 15, 20);
        
        doc.setFontSize(11);
        doc.setFont("helvetica", 'normal');
        doc.text('Pokoj v kazdom vchode', 15, 28);
        
        doc.setFontSize(9);
        doc.text('info@unitmate.sk', 15, 35);
        doc.text('+421 900 123 456', 15, 40);

        // Add logo in upper-right corner
        const logoImg = new Image();
        logoImg.src = '../resources/img/unitmate_logo_wb.png';
        
        await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve;
        });

        try {
            doc.addImage(logoImg, 'PNG', 155, 10, 25, 25);
        } catch (e) {
            console.warn('Could not add logo to PDF');
        }

        // Invoice title and number
        doc.setTextColor(...primaryColor);
        doc.setFontSize(28);
        doc.setFont("helvetica", 'bold');
        doc.text('FAKTURA', 15, 60);
        
        // Invoice details box
        doc.setFillColor(...lightGray);
        doc.roundedRect(120, 50, 65, 25, 3, 3, 'F');
        
        doc.setFontSize(10);
        doc.setFont("helvetica", 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('Cislo:', 125, 58);
        doc.text('Datum:', 125, 65);
        doc.text('Splatnost:', 125, 72);
        
        doc.setFont("helvetica", 'normal');
        doc.setTextColor(...darkGray);
        doc.text(`ORD-${String(orderId).padStart(3, '0')}`, 160, 58);
        doc.text(new Date().toLocaleDateString('sk-SK'), 160, 65);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        doc.text(dueDate.toLocaleDateString('sk-SK'), 160, 72);

        // Billing and Shipping information side by side
        let yPos = 85;

        // Left column - Billing Info
        doc.setFillColor(...accentColor);
        doc.rect(15, yPos, 85, 8, 'F');
        doc.setTextColor(...white);
        doc.setFontSize(11);
        doc.setFont("helvetica", 'bold');
        doc.text('FAKTURACNE UDAJE', 17, yPos + 5.5);

        yPos += 12;
        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", 'bold');
        doc.setFontSize(10);
        doc.text(cleanText(`${orderData.billing_information.firstName} ${orderData.billing_information.lastName}`), 17, yPos);
        
        yPos += 6;
        doc.setFont("helvetica", 'normal');
        doc.setTextColor(...darkGray);
        doc.setFontSize(9);
        doc.text(cleanText(orderData.billing_information.email), 17, yPos);
        yPos += 5;
        doc.text(cleanText(orderData.billing_information.phone), 17, yPos);
        yPos += 5;
        doc.text(cleanText(orderData.billing_information.address), 17, yPos);
        yPos += 5;
        doc.text(cleanText(`${orderData.billing_information.city} ${orderData.billing_information.zip}`), 17, yPos);

        // Right column - Shipping Info
        yPos = 85;
        doc.setFillColor(...accentColor);
        doc.rect(110, yPos, 85, 8, 'F');
        doc.setTextColor(...white);
        doc.setFontSize(11);
        doc.setFont("helvetica", 'bold');
        doc.text('DODACIE UDAJE', 112, yPos + 5.5);

        yPos += 12;
        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", 'bold');
        doc.setFontSize(10);
        doc.text('Dodacia adresa:', 112, yPos);
        
        yPos += 6;
        doc.setFont("helvetica", 'normal');
        doc.setTextColor(...darkGray);
        doc.setFontSize(9);
        const deliveryLines = doc.splitTextToSize(cleanText(orderData.delivery_address), 80);
        doc.text(deliveryLines, 112, yPos);
        yPos += deliveryLines.length * 5;
        
        yPos += 5;
        doc.setFont("helvetica", 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('Preferovany datum:', 112, yPos);
        yPos += 5;
        doc.setFont("helvetica", 'normal');
        doc.setTextColor(...darkGray);
        doc.text(new Date(orderData.preferred_date).toLocaleDateString('sk-SK'), 112, yPos);

        // Items table
        yPos = 145;
        
        // Table header
        doc.setFillColor(...primaryColor);
        doc.rect(15, yPos, 180, 10, 'F');
        
        doc.setTextColor(...white);
        doc.setFontSize(10);
        doc.setFont("helvetica", 'bold');
        doc.text('Produkt', 20, yPos + 6.5);
        doc.text('Mn.', 120, yPos + 6.5);
        doc.text('Cena/ks', 145, yPos + 6.5);
        doc.text('Spolu', 175, yPos + 6.5);

        yPos += 10;

        // Table rows
        doc.setFont("helvetica", 'normal');
        doc.setFontSize(9);
        let subtotal = 0;
        let rowColor = true;

        orderData.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            // Alternating row colors
            if (rowColor) {
                doc.setFillColor(...lightGray);
                doc.rect(15, yPos, 180, 8, 'F');
            }
            rowColor = !rowColor;

            doc.setTextColor(...primaryColor);
            
            // Wrap long product names
            const productName = doc.splitTextToSize(cleanText(item.name), 95);
            doc.text(productName[0], 20, yPos + 5.5);
            
            doc.text(String(item.quantity), 125, yPos + 5.5);
            doc.text(`${item.price.toFixed(2)}€`, 145, yPos + 5.5);
            doc.text(`${itemTotal.toFixed(2)}€`, 175, yPos + 5.5);
            
            yPos += 8;
        });

        // Add installation if required
        if (orderData.install_package) {
            if (rowColor) {
                doc.setFillColor(...lightGray);
                doc.rect(15, yPos, 180, 8, 'F');
            }
            
            doc.setTextColor(...accentColor);
            doc.setFont("helvetica", 'bold');
            doc.text('Profesionalna montaz', 20, yPos + 5.5);
            doc.setFont("helvetica", 'normal');
            doc.text('1', 125, yPos + 5.5);
            doc.text('50.00€', 145, yPos + 5.5);
            doc.text('50.00€', 175, yPos + 5.5);
            
            yPos += 8;
            subtotal += 50;
        }

        // Shipping row
        if (rowColor) {
            doc.setFillColor(...lightGray);
            doc.rect(15, yPos, 180, 8, 'F');
        }
        
        doc.setTextColor(...primaryColor);
        doc.text('Doprava', 20, yPos + 5.5);
        doc.text('-', 125, yPos + 5.5);
        doc.setTextColor(34, 197, 94); // Green color
        doc.text('Zadarmo', 145, yPos + 5.5);
        doc.text('0.00€', 175, yPos + 5.5);
        
        yPos += 15;

        // Total section
        doc.setFillColor(...primaryColor);
        doc.rect(120, yPos, 75, 15, 'F');
        
        doc.setTextColor(...white);
        doc.setFontSize(14);
        doc.setFont("helvetica", 'bold');
        doc.text('CELKOM:', 125, yPos + 10);
        doc.setFontSize(16);
        doc.text(`${subtotal.toFixed(2)}€ `, 170, yPos + 10);

        // Payment information note
        yPos += 25;
        doc.setFillColor(254, 243, 199); // Light yellow
        doc.roundedRect(15, yPos, 180, 15, 2, 2, 'F');
        doc.setTextColor(...darkGray);
        doc.setFontSize(9);
        doc.setFont("helvetica", 'normal');
        doc.text('Platba bola spracovana platobnou kartou pri objednavke.', 20, yPos + 6);
        doc.text('Dakujeme za Vas nakup!', 20, yPos + 11);

        // Footer with accent line
        doc.setDrawColor(...accentColor);
        doc.setLineWidth(1);
        doc.line(15, 275, 195, 275);
        
        doc.setFontSize(8);
        doc.setTextColor(...darkGray);
        doc.setFont("helvetica", 'normal');
        doc.text('UnitMate a.s. | ICO: 12345678 | DIC: SK1234567890', 105, 282, { align: 'center' });
        doc.text('Bratislava, Slovensko | info@unitmate.sk | +421 900 123 456', 105, 287, { align: 'center' });

        // Save PDF
        doc.save(`UnitMate_Faktura_ORD-${String(orderId).padStart(3, '0')}.pdf`);
    }

    // Initialize page
    autoFillUserData();
    displayOrderSummary();
})();