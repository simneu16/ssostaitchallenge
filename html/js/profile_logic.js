// Profile page logic
(function() {
    'use strict';

    console.log('Profile page script loaded');

    // Check if user is logged in
    function isLoggedIn() {
        const userSession = sessionStorage.getItem('user');
        const userLocal = localStorage.getItem('user');
        console.log('Session user:', userSession);
        console.log('Local user:', userLocal);
        return !!(userSession || userLocal);
    }

    // Get user data
    function getUserData() {
        const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
        if (!userStr) return null;
        try {
            const userData = JSON.parse(userStr);
            console.log('Parsed user data:', userData);
            return userData;
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }

    // Check login status
    if (!isLoggedIn()) {
        console.log('User not logged in, showing prompt');
        // Show login prompt
        const mainContent = document.querySelector('.profile-container');
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="background: white; padding: 3rem; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); text-align: center; max-width: 500px; margin: 0 auto;">
                    <div style="width: 100px; height: 100px; margin: 0 auto 2rem; background: linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem;">
                        🔐
                    </div>
                    <h1 style="color: #0f2557; font-size: 2rem; margin-bottom: 1rem;">Musíte sa prihlásiť</h1>
                    <p style="color: #64748b; font-size: 1.1rem; margin-bottom: 2rem;">Pre zobrazenie vášho profilu sa musíte najprv prihlásiť do svojho účtu.</p>
                    <a href="login.html" style="display: inline-block; padding: 1rem 2.5rem; background: #0f2557; color: white; text-decoration: none; border-radius: 50px; font-weight: 600; transition: all 0.3s;">
                        🔐 Prihlásiť sa
                    </a>
                    <p style="margin-top: 1.5rem; color: #64748b;">
                        Nemáte účet? <a href="register.html" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Zaregistrujte sa</a>
                    </p>
                </div>
            `;
        }
        return;
    }

    // Load user data and populate profile
    const userData = getUserData();
    if (!userData) {
        console.error('No user data found');
        window.location.href = 'login.html';
        return;
    }

    console.log('User data loaded, populating profile...');

    // Get user initials
    function getInitials(firstName, lastName) {
        const first = (firstName || '').charAt(0).toUpperCase();
        const last = (lastName || '').charAt(0).toUpperCase();
        return first + last || 'U';
    }

    // Populate profile header
    const initials = getInitials(userData.firstname, userData.lastname);
    const fullName = `${userData.firstname || ''} ${userData.lastname || ''}`.trim() || 'Používateľ';
    const username = userData.login || 'user';
    const role = userData.role === 'a' ? 'Administrátor' : (userData.role === 'z' ? 'Zákazník' : 'Používateľ');
    const roleIcon = userData.role === 'a' ? '👨‍💼' : '👤';
    console.log('Profile info:', { initials, fullName, username, role });

    // Update profile header
    const avatarEl = document.querySelector('.profile-avatar');
    const nameEl = document.querySelector('.profile-name');
    const usernameEl = document.querySelector('.profile-username');
    const roleEl = document.querySelector('.profile-role');

    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl) nameEl.textContent = fullName;
    if (usernameEl) usernameEl.textContent = `@${username}`;
    if (roleEl) roleEl.innerHTML = `${roleIcon} ${role}`;

    console.log('Profile header updated');

    // Populate personal information tab
    const infoSelectors = [
        '#info .info-grid .info-card:nth-child(1) .info-item:nth-child(2) .info-value',
        '#info .info-grid .info-card:nth-child(1) .info-item:nth-child(3) .info-value',
        '#info .info-grid .info-card:nth-child(1) .info-item:nth-child(4) .info-value',
        '#info .info-grid .info-card:nth-child(1) .info-item:nth-child(5) .info-value'
    ];

    const personalValues = [
        userData.firstname || '-',
        userData.lastname || '-',
        username,
        role
    ];

    infoSelectors.forEach((selector, index) => {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = personalValues[index];
            console.log(`Set ${selector} to ${personalValues[index]}`);
        } else {
            console.warn(`Element not found: ${selector}`);
        }
    });

    // Populate contact information tab
    const contactSelectors = [
        '#info .info-card:nth-child(2) .info-item:nth-child(2) .info-value',
        '#info .info-card:nth-child(2) .info-item:nth-child(3) .info-value',
        '#info .info-card:nth-child(2) .info-item:nth-child(4) .info-value'
    ];

    const contactValues = [
        userData.email || '-',
        userData.telephone || '-',
        userData.address || '-'
    ];

    contactSelectors.forEach((selector, index) => {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = contactValues[index];
            console.log(`Set ${selector} to ${contactValues[index]}`);
        } else {
            console.warn(`Element not found: ${selector}`);
        }
    });

    // Populate edit form
    const editForm = document.getElementById('editForm');
    if (editForm) {
        const inputs = editForm.querySelectorAll('input');
        if (inputs.length >= 5) {
            inputs[0].value = userData.firstname || '';
            inputs[1].value = userData.lastname || '';
            inputs[2].value = userData.email || '';
            inputs[3].value = userData.telephone || '';
            inputs[4].value = userData.address || '';
            console.log('Edit form populated');
        }
    }

    // Fetch and display user orders
    async function fetchUserOrders() {
        console.log('Fetching user orders...');
        try {
            const response = await fetch('../php/orders_json_api.php', {
                method: 'POST',
                credentials: 'same-origin'
            });

            if (!response.ok) {
                console.error('Failed to fetch orders:', response.status);
                throw new Error('Failed to fetch orders');
            }
            
            const orders = await response.json();
            console.log('Orders fetched:', orders);
            
            // Update statistics
            const totalOrders = orders.length;
            const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
            const activeOrders = orders.filter(o => o.status === 'shipped' || o.status === 'pending' || o.status === 'processing').length;
            
            // Calculate total spent
            let totalSpent = 0;
            orders.forEach(order => {
                const priceStr = order.price.replace('€', '').trim();
                totalSpent += parseFloat(priceStr) || 0;
            });

            console.log('Stats:', { totalOrders, deliveredOrders, activeOrders, totalSpent });

            // Update stat cards
            const statCards = document.querySelectorAll('.stat-value');
            if (statCards.length >= 4) {
                statCards[0].textContent = totalOrders;
                statCards[1].textContent = deliveredOrders;
                statCards[2].textContent = activeOrders;
                statCards[3].textContent = totalSpent.toFixed(0) + '€';
                console.log('Stat cards updated');
            }

            // Display recent orders in overview tab
            const recentOrders = orders.slice(0, 3);
            const recentOrdersContainer = document.querySelector('#overview .orders-list');
            
            if (recentOrdersContainer) {
                if (recentOrders.length > 0) {
                    recentOrdersContainer.innerHTML = recentOrders.map(order => {
                        const statusClass = getStatusClass(order.status);
                        const statusText = getStatusText(order.status);
                        
                        return `
                            <div class="order-item">
                                <div class="order-details">
                                    <div class="order-id">${order.id}</div>
                                    <div class="order-products">${order.products}</div>
                                </div>
                                <span class="order-status ${statusClass}">${statusText}</span>
                                <div class="order-price">${order.price}</div>
                            </div>
                        `;
                    }).join('');
                } else {
                    recentOrdersContainer.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">Zatiaľ žiadne objednávky</p>';
                }
                console.log('Recent orders displayed');
            }

            // Display all orders in orders tab
            const allOrdersContainer = document.querySelector('#orders .orders-list');
            
            if (allOrdersContainer) {
                if (orders.length > 0) {
                    allOrdersContainer.innerHTML = orders.map(order => {
                        const statusClass = getStatusClass(order.status);
                        const statusText = getStatusText(order.status);
                        
                        return `
                            <div class="order-item">
                                <div class="order-details">
                                    <div class="order-id">${order.id} • ${order.deliveryDate}</div>
                                    <div class="order-products">${order.products}</div>
                                </div>
                                <span class="order-status ${statusClass}">${statusText}</span>
                                <div class="order-price">${order.price}</div>
                            </div>
                        `;
                    }).join('');
                } else {
                    allOrdersContainer.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">Zatiaľ žiadne objednávky</p>';
                }
                console.log('All orders displayed');
            }

        } catch (error) {
            console.error('Error fetching orders:', error);
            const statCards = document.querySelectorAll('.stat-value');
            if (statCards.length >= 4) {
                statCards[0].textContent = '0';
                statCards[1].textContent = '0';
                statCards[2].textContent = '0';
                statCards[3].textContent = '0€';
            }
        }
    }

    function getStatusClass(status) {
        switch (status) {
            case 'pending':
            case 'processing':
                return 'status-processing';
            case 'shipped':
                return 'status-shipped';
            case 'delivered':
                return 'status-delivered';
            case 'cancelled':
                return 'status-cancelled';
            default:
                return 'status-processing';
        }
    }

    function getStatusText(status) {
        switch (status) {
            case 'pending':
            case 'processing':
                return 'V spracovaní';
            case 'shipped':
                return 'Odoslané';
            case 'delivered':
                return 'Doručené';
            case 'cancelled':
                return 'Zrušené';
            default:
                return 'Neznámy';
        }
    }

    // Handle edit form submission
    const editFormElement = document.getElementById('editForm');
    if (editFormElement) {
        editFormElement.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const inputs = this.querySelectorAll('input');
            const formData = {
                firstname: inputs[0].value,
                lastname: inputs[1].value,
                email: inputs[2].value,
                telephone: inputs[3].value,
                address: inputs[4].value
            };

            console.log('Submitting form data:', formData);

            try {
                const response = await fetch('../php/update_user.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify(formData)
                });

                const result = await response.json();
                console.log('Update result:', result);

                if (result.success) {
                    // Update stored user data
                    const updatedUser = { ...userData, ...formData };
                    sessionStorage.setItem('user', JSON.stringify(updatedUser));
                    if (localStorage.getItem('user')) {
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                    }

                    alert('Profil bol úspešne aktualizovaný!');
                    window.location.reload();
                } else {
                    alert('Chyba pri aktualizácii profilu: ' + result.message);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert('Chyba pri aktualizácii profilu.');
            }
        });
    }

    // Load user orders
    fetchUserOrders();

    console.log('Profile page initialization complete');
})();