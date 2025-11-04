
// Mobile menu toggle
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.getElementById('nav-links');

mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Close menu when clicking on a link
const menuLinks = navLinks.querySelectorAll('a');
menuLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !navLinks.contains(e.target)) {
        mobileMenu.classList.remove('active');
        navLinks.classList.remove('active');
    }
});
