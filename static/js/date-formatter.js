// ReelTracker Date Formatting Utilities

(function() {
    'use strict';

    // Format datetime to date only
    function formatDateOnly(datetime) {
        if (!datetime) return '';
        
        // Handle both string and Date objects
        const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
        
        if (isNaN(date.getTime())) {
            // If it's already a date string, try to extract just the date part
            if (typeof datetime === 'string' && datetime.includes(' ')) {
                return datetime.split(' ')[0];
            }
            return datetime;
        }
        
        // Format as YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }
    
    // Format date with relative time (e.g., "2 days ago")
    function formatRelativeDate(datetime) {
        if (!datetime) return '';
        
        const date = typeof datetime === 'string' ? new Date(datetime) : datetime;
        const now = new Date();
        const diff = now - date;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days === 0) {
            return 'Today';
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else if (days < 30) {
            const weeks = Math.floor(days / 7);
            return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
        } else if (days < 365) {
            const months = Math.floor(days / 30);
            return months === 1 ? '1 month ago' : `${months} months ago`;
        } else {
            return formatDateOnly(date);
        }
    }
    
    // Apply date formatting to all elements with date-display class
    function applyDateFormatting() {
        const dateElements = document.querySelectorAll('.date-display');
        
        dateElements.forEach(element => {
            const datetime = element.getAttribute('data-datetime') || element.textContent;
            const format = element.getAttribute('data-format') || 'date-only';
            
            if (datetime) {
                let formattedDate;
                
                switch(format) {
                    case 'relative':
                        formattedDate = formatRelativeDate(datetime);
                        break;
                    case 'date-only':
                    default:
                        formattedDate = formatDateOnly(datetime);
                        break;
                }
                
                // Update the display
                if (element.tagName === 'TIME') {
                    element.textContent = formattedDate;
                } else {
                    // Preserve any prefix text
                    const text = element.textContent;
                    const colonIndex = text.indexOf(':');
                    if (colonIndex > -1) {
                        element.textContent = text.substring(0, colonIndex + 1) + ' ' + formattedDate;
                    } else {
                        element.textContent = formattedDate;
                    }
                }
            }
        });
    }
    
    // Export functions
    window.ReelTrackerDateFormatter = {
        formatDateOnly,
        formatRelativeDate,
        applyDateFormatting
    };
    
    // Auto-apply formatting on DOM load
    document.addEventListener('DOMContentLoaded', applyDateFormatting);
    
})();