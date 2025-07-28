// ReelTracker UI Enhancements - Micro-interactions and accessibility improvements

// Add loading states to buttons
function addButtonLoadingStates() {
    document.querySelectorAll('button[type="submit"], .btn').forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.form && this.form.checkValidity()) {
                // Add loading state
                this.style.opacity = '0.7';
                this.style.pointerEvents = 'none';
                
                // Restore after 2 seconds (fallback)
                setTimeout(() => {
                    this.style.opacity = '';
                    this.style.pointerEvents = '';
                }, 2000);
            }
        });
    });
}

// Enhanced form feedback
function addFormEnhancements() {
    document.querySelectorAll('input, textarea, select').forEach(input => {
        // Add focus enhancement
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('form-group-focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('form-group-focused');
            
            // Add validation feedback
            if (this.checkValidity()) {
                this.classList.remove('error');
                this.classList.add('valid');
            } else if (this.value) {
                this.classList.add('error');
                this.classList.remove('valid');
            }
        });
    });
}

// Smooth scroll for anchor links
function addSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Add subtle hover effects to movie cards
function addMovieCardEffects() {
    document.querySelectorAll('.movie').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });
}

// Enhanced keyboard navigation
function enhanceKeyboardNavigation() {
    // Tab trapping for timeline navigation
    const timelineNavs = document.querySelectorAll('.timeline-nav');
    timelineNavs.forEach(nav => {
        const tabs = nav.querySelectorAll('[role="tab"]');
        
        tabs.forEach((tab, index) => {
            tab.addEventListener('keydown', function(e) {
                let targetIndex;
                
                switch(e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        targetIndex = index > 0 ? index - 1 : tabs.length - 1;
                        tabs[targetIndex].focus();
                        tabs[targetIndex].click();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        targetIndex = index < tabs.length - 1 ? index + 1 : 0;
                        tabs[targetIndex].focus();
                        tabs[targetIndex].click();
                        break;
                    case 'Home':
                        e.preventDefault();
                        tabs[0].focus();
                        tabs[0].click();
                        break;
                    case 'End':
                        e.preventDefault();
                        tabs[tabs.length - 1].focus();
                        tabs[tabs.length - 1].click();
                        break;
                }
            });
        });
    });
}

// Add visual feedback for actions
function addActionFeedback() {
    // Success feedback for form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (this.checkValidity()) {
                // Show success state
                const submitButton = this.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.textContent = 'Processing...';
                }
            }
        });
    });
    
    // Rating input feedback
    const ratingInputs = document.querySelectorAll('input[name="rating"]');
    ratingInputs.forEach(input => {
        input.addEventListener('input', function() {
            const value = parseFloat(this.value);
            let emoji = '';
            
            if (value >= 9) emoji = '⭐';
            else if (value >= 7) emoji = '👍';
            else if (value >= 5) emoji = '👌';
            else if (value >= 3) emoji = '👎';
            else emoji = '💩';
            
            // Show feedback
            let feedback = this.parentElement.querySelector('.rating-feedback');
            if (!feedback) {
                feedback = document.createElement('span');
                feedback.className = 'rating-feedback meta';
                this.parentElement.appendChild(feedback);
            }
            feedback.textContent = emoji;
        });
    });
}

// Initialize all enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
        addMovieCardEffects();
    }
    
    addButtonLoadingStates();
    addFormEnhancements();
    addSmoothScrolling();
    enhanceKeyboardNavigation();
    addActionFeedback();
    
    // Add CSS class to enable enhanced interactions
    document.body.classList.add('ui-enhanced');
});

// Export for potential external use
window.ReelTrackerUI = {
    addButtonLoadingStates,
    addFormEnhancements,
    addSmoothScrolling,
    addMovieCardEffects,
    enhanceKeyboardNavigation,
    addActionFeedback
};