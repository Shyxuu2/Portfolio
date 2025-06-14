const currentYear = new Date().getFullYear();
document.getElementById("currentyear").textContent = currentYear;
document.addEventListener('DOMContentLoaded', () => {

    // ========== GESTION DU PRELOADER ==========
    const preloader = document.getElementById('preloader');
    
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (preloader) {
                preloader.classList.add('preloader-hidden');
            }
        }, 10); // Petit délai pour que l'animation soit visible
        
        // Supprimer le preloader du DOM après la transition
        preloader.addEventListener('transitionend', () => {
            preloader.remove();
        });
    });

    // ========== HEADER QUI CHANGE AU SCROLL ==========
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('bg-gray-950/80', 'backdrop-blur-sm', 'shadow-lg');
        } else {
            header.classList.remove('bg-gray-950/80', 'backdrop-blur-sm', 'shadow-lg');
        }
    });

    // ========== MENU MOBILE (HAMBURGER) ==========
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = menuBtn.querySelector('i');
    const mobileLinks = mobileMenu.querySelectorAll('a');

    const toggleMenu = () => {
        mobileMenu.classList.toggle('hidden');
        if (mobileMenu.classList.contains('hidden')) {
            menuIcon.className = 'ri-menu-3-line';
        } else {
            menuIcon.className = 'ri-close-line';
        }
    };

    menuBtn.addEventListener('click', toggleMenu);
    
    // Fermer le menu en cliquant sur un lien
    mobileLinks.forEach(link => {
        link.addEventListener('click', toggleMenu);
    });

    // ========== ANIMATIONS AU SCROLL (INTERSECTION OBSERVER) ==========
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Optionnel: arrêter d'observer une fois l'animation jouée
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1 // L'élément devient visible quand 10% est à l'écran
    });

    animatedElements.forEach(element => {
        observer.observe(element);
    });
    
    // ========== NAVIGATION ACTIVE AU SCROLL ==========
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, { 
        rootMargin: '-30% 0px -70% 0px' // Active le lien quand la section est au milieu de l'écran
    });

    sections.forEach(section => {
        navObserver.observe(section);
    });
});
