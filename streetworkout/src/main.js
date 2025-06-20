changeLanguage('en');
$(document).ready(function () {
    // Preloader
    const preloader = $('#preloader');
    if (preloader.length) {
        function hidePreloader() {
            setTimeout(function () {
                preloader.css('opacity', '0');
                setTimeout(function () {
                    preloader.hide();
                    animateOnEntry();
                }, 300); // Durée du fade out
            }, 1);
        }

        if (document.readyState === 'complete') {
            hidePreloader();
        } else {
            $(window).on('load', function () {
                hidePreloader();
            });
        }
    } else {
        animateOnEntry(); // Si pas de preloader
    }

    // Function to trigger initial page load animations (header elements)
    function animateOnEntry() {
        $('.animate-fadeInLeft, .animate-fadeInDown, .animate-fadeInUp, .animate-popIn').each(function () {
            const delay = $(this).data('delay') || 0;
            $(this).css('animation-delay', delay + 'ms').addClass('animated');
        });
    }

    // Navbar scroll effect
    const header = $('#main-header');
    $(window).on('scroll', function () {
        if ($(this).scrollTop() > 50) {
            header.addClass('bg-neutral-900/95 shadow-lg backdrop-blur-sm py-2').removeClass('py-3');
        } else {
            header.removeClass('bg-neutral-900/95 shadow-lg backdrop-blur-sm py-2').addClass('py-3');
        }
    });

    // Mobile menu toggle
    const mobileMenuButton = $('#mobile-menu-button');
    const mobileMenu = $('#mobile-menu');
    const menuIcon = mobileMenuButton.find('i');

    mobileMenuButton.on('click', function () {
        mobileMenu.slideToggle(300);
        if (menuIcon.hasClass('fa-bars')) {
            menuIcon.removeClass('fa-bars').addClass('fa-times');
        } else {
            menuIcon.removeClass('fa-times').addClass('fa-bars');
        }
    });

    // Close mobile menu when a link is clicked
    $('#mobile-menu a').on('click', function () {
        if (mobileMenu.is(':visible')) {
            mobileMenu.slideUp(300);
            menuIcon.removeClass('fa-times').addClass('fa-bars');
        }
    });

    // Smooth scrolling for navigation links
    $('a.nav-link, a[href^="#hero"], a[href^="#features"], a[href^="#how-it-works"], a[href^="#workouts"], a[href^="#stats"], a[href^="#testimonials"], a[href^="#pricing"], a[href^="#contact"], footer a[href^="#"]').on('click', function (event) {
        const hash = this.hash;
        if (hash !== "") {
            event.preventDefault();
            const targetOffset = $(hash).offset().top - header.outerHeight();
            $('html, body').animate({
                scrollTop: targetOffset
            }, 0, 'swing');
        }
    });

    // Back to Top Button
    const backToTopBtn = $('#backToTopBtn');
    $(window).on('scroll', function () {
        if ($(this).scrollTop() > 300) {
            backToTopBtn.removeClass('opacity-0 invisible').addClass('opacity-100 visible');
        } else {
            backToTopBtn.removeClass('opacity-100 visible').addClass('opacity-0 invisible');
        }
    });

    backToTopBtn.on('click', function () {
        $('html, body').animate({ scrollTop: 0 }, 0, 'swing');
    });

    // Intersection Observer for scroll animations
    const revealElements = document.querySelectorAll('.reveal-on-scroll, .reveal-on-scroll-left, .reveal-on-scroll-right, .reveal-on-scroll-pop');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = parseInt(entry.target.dataset.revealDelay) || 0;
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // Number Animation Logic
    function setAnimatedNumber(counterElement, value) {
        const counter = $(counterElement);
        counter.empty();

        const valStr = String(value);
        const neu = $("<div/>").addClass("counter-value").appendTo(counter);
        $("<div/>").addClass("counter-value-mask").appendTo(neu).text(valStr);
    }

    const numberContainers = document.querySelectorAll('.number-anim-container');
    const numberObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetElement = entry.target;
                const targetValue = parseInt(targetElement.dataset.targetValue);

                let currentValue = 0;
                const initialDelay = 300;

                setTimeout(() => {
                    setAnimatedNumber(targetElement, currentValue);
                }, initialDelay);

                const animationDuration = 1500;
                const steps = Math.min(targetValue, 100);
                const increment = Math.max(1, Math.floor(targetValue / steps));
                const intervalTime = animationDuration / steps;

                let stepCount = 0;
                const intervalId = setInterval(() => {
                    currentValue += increment;
                    stepCount++;
                    if (currentValue >= targetValue || stepCount >= steps) {
                        currentValue = targetValue;
                        setAnimatedNumber(targetElement, currentValue);
                        clearInterval(intervalId);
                    } else {
                        setAnimatedNumber(targetElement, currentValue);
                    }
                }, intervalTime);

                observer.unobserve(targetElement);
            }
        });
    }, { threshold: 0.5 });

    numberContainers.forEach(container => {
        numberObserver.observe(container);
    });

    // Set current year in footer
    $('#currentYear').text(new Date().getFullYear());
});

// Traductions
async function loadTranslations(lang) {
    const response = await fetch(`translations/${lang}.json`);
    if (!response.ok) {
        console.error('Impossible de charger la traduction', lang);
        return {};
    }
    return await response.json();
}

function applyTranslations(translations) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[key]) {
            el.textContent = translations[key];
        }
    });
}

async function changeLanguage(lang) {
    const translations = await loadTranslations(lang);
    applyTranslations(translations);
}
