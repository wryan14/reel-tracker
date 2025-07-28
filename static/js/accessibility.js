/**
 * Accessibility enhancements for MovieHive
 * Following WCAG 2.1 AA guidelines
 */

(function() {
    'use strict';
    
    // Initialize accessibility features when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccessibility);
    } else {
        initAccessibility();
    }
    
    function initAccessibility() {
        enhanceFocus();
        addKeyboardNavigation();
        improveAnnouncements();
        addSkipLinks();
        handleReducedMotion();
    }
    
    /**
     * Enhance focus management for better keyboard navigation
     */
    function enhanceFocus() {
        // Focus management for forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const firstInput = form.querySelector('input, textarea, select');
            if (firstInput) {
                // Auto-focus first input when form becomes visible
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !firstInput.value) {
                            firstInput.focus();
                        }
                    });
                }, { threshold: 0.5 });
                observer.observe(form);
            }
        });
        
        // Trap focus in modal-like content (details elements)
        const detailsElements = document.querySelectorAll('details');
        detailsElements.forEach(details => {
            details.addEventListener('toggle', function() {
                if (this.open) {
                    trapFocus(this);
                }
            });
        });
    }
    
    /**
     * Add keyboard navigation enhancements
     */
    function addKeyboardNavigation() {
        // Arrow key navigation for movie lists
        const movieLists = document.querySelectorAll('.movie');
        if (movieLists.length > 1) {
            movieLists.forEach((movie, index) => {
                const link = movie.querySelector('a');
                if (link) {
                    link.addEventListener('keydown', function(e) {
                        handleArrowNavigation(e, movieLists, index);
                    });
                }
            });
        }
        
        // Escape key to close details elements
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const openDetails = document.querySelector('details[open]');
                if (openDetails) {
                    openDetails.removeAttribute('open');
                    openDetails.querySelector('summary').focus();
                }
            }
        });
    }
    
    /**
     * Handle arrow key navigation in lists
     */
    function handleArrowNavigation(e, items, currentIndex) {
        let newIndex;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                newIndex = (currentIndex + 1) % items.length;
                break;
            case 'ArrowUp':
                e.preventDefault();
                newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
                break;
            default:
                return;
        }
        
        const newItem = items[newIndex];
        const newLink = newItem.querySelector('a');
        if (newLink) {
            newLink.focus();
        }
    }
    
    /**
     * Improve screen reader announcements
     */
    function improveAnnouncements() {
        // Announce page changes for single-page-like navigation
        let lastTitle = document.title;
        const observer = new MutationObserver(() => {
            if (document.title !== lastTitle) {
                announceToScreenReader(`Page changed to ${document.title}`);
                lastTitle = document.title;
            }
        });
        observer.observe(document.querySelector('title'), { childList: true });
        
        // Announce form submission results
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', function() {
                announceToScreenReader('Form submitted. Please wait...');
            });
        });
        
        // Announce rating changes
        const ratingInputs = document.querySelectorAll('input[name="rating"]');
        ratingInputs.forEach(input => {
            input.addEventListener('change', function() {
                announceToScreenReader(`Rating set to ${this.value} out of 10`);
            });
        });
    }
    
    /**
     * Add dynamic skip links
     */
    function addSkipLinks() {
        // Add skip to search results if search form exists
        const searchForm = document.querySelector('form[role="search"]');
        const searchResults = document.querySelector('#search-results');
        
        if (searchForm && searchResults) {
            const skipLink = document.createElement('a');
            skipLink.href = '#search-results';
            skipLink.textContent = 'Skip to search results';
            skipLink.className = 'skip-link';
            skipLink.style.left = '200px'; // Position after main skip link
            
            searchForm.parentNode.insertBefore(skipLink, searchForm);
        }
    }
    
    /**
     * Handle reduced motion preferences
     */
    function handleReducedMotion() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // Remove any transitions or animations
            const style = document.createElement('style');
            style.innerHTML = `
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Trap focus within an element
     */
    function trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'a[href], area[href], input:not([disabled]), select:not([disabled]), ' +
            'textarea:not([disabled]), button:not([disabled]), iframe, object, embed, ' +
            '[tabindex="0"], [contenteditable]'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
        
        // Focus first element
        firstElement.focus();
    }
    
    /**
     * Announce message to screen readers
     */
    function announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    /**
     * Validate color contrast on the fly (development helper)
     */
    function validateContrast() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Only run in development
            const elements = document.querySelectorAll('*');
            elements.forEach(element => {
                const styles = window.getComputedStyle(element);
                const bgColor = styles.backgroundColor;
                const textColor = styles.color;
                
                if (bgColor !== 'rgba(0, 0, 0, 0)' && textColor !== 'rgba(0, 0, 0, 0)') {
                    const contrast = calculateContrast(textColor, bgColor);
                    if (contrast < 4.5) {
                        console.warn(`Low contrast detected:`, element, `Contrast ratio: ${contrast.toFixed(2)}`);
                    }
                }
            });
        }
    }
    
    /**
     * Calculate color contrast ratio
     */
    function calculateContrast(color1, color2) {
        // Simplified contrast calculation - would need full implementation for production
        const rgb1 = parseRGB(color1);
        const rgb2 = parseRGB(color2);
        
        const l1 = getLuminance(rgb1);
        const l2 = getLuminance(rgb2);
        
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        
        return (lighter + 0.05) / (darker + 0.05);
    }
    
    function parseRGB(color) {
        // Simple RGB parser - would need improvement for production
        const match = color.match(/\d+/g);
        return match ? match.map(Number) : [0, 0, 0];
    }
    
    function getLuminance([r, g, b]) {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }
    
    // Run contrast validation in development
    if (document.readyState === 'complete') {
        validateContrast();
    } else {
        window.addEventListener('load', validateContrast);
    }
    
})();