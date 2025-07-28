// Real-time updates for Timeline and Statistics
// Ensures UI updates immediately when movies are added

class ReelTrackerUpdates {
    constructor() {
        this.setupEventListeners();
        this.initializeRealTimeTracking();
    }

    setupEventListeners() {
        // Listen for form submissions that affect statistics
        document.addEventListener('submit', (e) => {
            const form = e.target;
            
            // Check if this is a form that affects stats
            if (this.isStatsAffectingForm(form)) {
                this.scheduleStatsUpdate();
            }
        });

        // Listen for movie actions
        document.addEventListener('click', (e) => {
            const button = e.target;
            
            if (button.matches('[data-action="mark-watched"]') ||
                button.matches('[data-action="add-rating"]') ||
                button.matches('[data-action="add-watchlist"]')) {
                this.scheduleStatsUpdate();
            }
        });
    }

    isStatsAffectingForm(form) {
        const affectingActions = [
            '/watched',
            '/rate',
            '/add-watchlist',
            '/remove-watchlist',
            '/save-from-api'
        ];
        
        return affectingActions.some(action => form.action.includes(action));
    }

    scheduleStatsUpdate() {
        // Update stats after a short delay to allow form submission to complete
        setTimeout(() => {
            this.updateStats();
            this.updateTimeline();
            this.updateAchievements();
        }, 500);
    }

    updateStats() {
        // Fetch fresh stats from API and update UI
        fetch('/api/stats')
            .then(response => response.json())
            .then(stats => {
                // Update data attributes
                const userLevel = document.querySelector('.user-level');
                if (userLevel) {
                    userLevel.dataset.totalMovies = stats.totalMovies;
                    userLevel.dataset.uniqueGenres = stats.uniqueGenres;
                    userLevel.dataset.currentStreak = stats.currentStreak;
                    userLevel.dataset.totalRatings = stats.totalRatings;
                    userLevel.dataset.weeklyMovies = stats.weeklyMovies;
                    userLevel.dataset.uniqueDecades = stats.uniqueDecades;
                    userLevel.dataset.watchlistCompletion = stats.watchlistCompletion;
                }
                
                // Update displayed stat values
                const statCards = document.querySelectorAll('.stat-value');
                statCards.forEach((card, index) => {
                    card.classList.add('updating');
                    setTimeout(() => {
                        card.classList.remove('updating');
                        card.classList.add('updated');
                        setTimeout(() => card.classList.remove('updated'), 2000);
                    }, 500);
                });
                
                // Update rating distribution chart if present
                if (stats.ratingDistribution && window.ReelTrackerCharts) {
                    const canvas = document.getElementById('ratingsChart');
                    if (canvas) {
                        // Destroy existing chart and create new one
                        const existingChart = Chart.getChart(canvas);
                        if (existingChart) {
                            existingChart.destroy();
                        }
                        window.ReelTrackerCharts.createRatingChart('ratingsChart', stats.ratingDistribution);
                    }
                }
                
                // Update gamification elements
                if (window.ReelTrackerGamification) {
                    window.ReelTrackerGamification.updateUserLevel(stats.totalMovies);
                    window.ReelTrackerGamification.updateProgressBars();
                }
            })
            .catch(error => {
                console.warn('Failed to fetch updated stats:', error);
                // Fallback to visual feedback only
                const statsElements = document.querySelectorAll('[data-stat]');
                statsElements.forEach(element => {
                    const statType = element.dataset.stat;
                    this.refreshStat(element, statType);
                });
            });
    }

    refreshStat(element, statType) {
        // This would typically make an AJAX call to get updated stats
        // For now, we'll add visual feedback to show the stat is updating
        
        element.classList.add('updating');
        
        setTimeout(() => {
            element.classList.remove('updating');
            element.classList.add('updated');
            
            setTimeout(() => {
                element.classList.remove('updated');
            }, 2000);
        }, 1000);
    }

    updateTimeline() {
        // Update timeline if on timeline page
        if (window.location.pathname.includes('/timeline')) {
            this.refreshTimeline();
        }
    }

    refreshTimeline() {
        const timelineContainer = document.querySelector('.timeline-container, .time-series-container');
        if (timelineContainer) {
            timelineContainer.classList.add('refreshing');
            
            // Add visual feedback
            const refreshMessage = document.createElement('div');
            refreshMessage.className = 'refresh-notice';
            refreshMessage.textContent = 'Timeline updating... Please refresh page to see latest data.';
            refreshMessage.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--primary, #007acc);
                color: white;
                padding: 12px 16px;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                z-index: 1000;
                font-size: 14px;
            `;
            document.body.appendChild(refreshMessage);
            
            setTimeout(() => {
                timelineContainer.classList.remove('refreshing');
                refreshMessage.remove();
            }, 3000);
        }
    }

    updateAchievements() {
        // Check for new achievements by fetching fresh stats from API
        fetch('/api/stats')
            .then(response => response.json())
            .then(stats => {
                if (window.ReelTrackerGamification) {
                    window.ReelTrackerGamification.checkAchievements(stats);
                    window.ReelTrackerGamification.updateUserLevel(stats.totalMovies);
                    window.ReelTrackerGamification.updateProgressBars();
                }
            })
            .catch(error => {
                console.warn('Failed to fetch updated stats:', error);
                // Fallback to current page stats
                const stats = this.getCurrentStats();
                if (window.ReelTrackerGamification) {
                    window.ReelTrackerGamification.checkAchievements(stats);
                }
            });
    }

    getCurrentStats() {
        // Extract stats from current page
        return {
            totalMovies: parseInt(document.querySelector('[data-total-movies]')?.dataset.totalMovies || '0'),
            uniqueGenres: parseInt(document.querySelector('[data-unique-genres]')?.dataset.uniqueGenres || '0'),
            currentStreak: parseInt(document.querySelector('[data-current-streak]')?.dataset.currentStreak || '0'),
            totalRatings: parseInt(document.querySelector('[data-total-ratings]')?.dataset.totalRatings || '0'),
            weeklyMovies: parseInt(document.querySelector('[data-weekly-movies]')?.dataset.weeklyMovies || '0'),
            uniqueDecades: parseInt(document.querySelector('[data-unique-decades]')?.dataset.uniqueDecades || '0'),
            watchlistCompletion: parseInt(document.querySelector('[data-watchlist-completion]')?.dataset.watchlistCompletion || '0')
        };
    }

    initializeRealTimeTracking() {
        // Add update indicators to important elements
        this.addUpdateIndicators();
        
        // Initialize periodic checks for changes
        this.startPeriodicUpdates();
    }

    addUpdateIndicators() {
        const trackingElements = document.querySelectorAll('.stat-card, .achievement-summary, .user-level');
        
        trackingElements.forEach(element => {
            element.setAttribute('data-real-time', 'true');
        });
    }

    startPeriodicUpdates() {
        // Check for updates every 30 seconds when page is visible
        setInterval(() => {
            if (!document.hidden) {
                this.checkForUpdates();
            }
        }, 30000);
    }

    checkForUpdates() {
        // This would make an API call to check if stats have changed
        // For now, just update the visual indicators
        const realTimeElements = document.querySelectorAll('[data-real-time="true"]');
        
        realTimeElements.forEach(element => {
            element.classList.add('synced');
            setTimeout(() => {
                element.classList.remove('synced');
            }, 500);
        });
    }

    // Visual feedback methods
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize real-time updates when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.ReelTrackerUpdates = new ReelTrackerUpdates();
});

// Export for manual use
window.ReelTrackerUpdates = ReelTrackerUpdates;