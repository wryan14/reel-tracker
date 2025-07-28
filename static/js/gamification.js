// ReelTracker Gamification System - Subtle progress tracking and achievements

// Achievement definitions - Enhanced for power users
const achievements = {
    // Movie Count Achievements - Higher thresholds
    firstMovie: {
        id: 'first-movie',
        name: 'First Steps',
        description: 'Watched your first movie',
        threshold: 1,
        type: 'movies',
        icon: ''
    },
    tenMovies: {
        id: 'ten-movies',
        name: 'Movie Buff',
        description: 'Watched 10 movies',
        threshold: 10,
        type: 'movies',
        icon: ''
    },
    fiftyMovies: {
        id: 'fifty-movies',
        name: 'Cinephile',
        description: 'Watched 50 movies',
        threshold: 50,
        type: 'movies',
        icon: ''
    },
    hundredMovies: {
        id: 'hundred-movies',  
        name: 'Film Scholar',
        description: 'Watched 100 movies',
        threshold: 100,
        type: 'movies',
        icon: ''
    },
    twoFiftyMovies: {
        id: 'two-fifty-movies',
        name: 'Movie Connoisseur',
        description: 'Watched 250 movies',
        threshold: 250,
        type: 'movies',
        icon: ''
    },
    fiveHundredMovies: {
        id: 'five-hundred-movies',
        name: 'Cinema Devotee',
        description: 'Watched 500 movies',
        threshold: 500,
        type: 'movies',
        icon: ''
    },
    thousandMovies: {
        id: 'thousand-movies',
        name: 'Film Legend',
        description: 'Watched 1,000 movies - Incredible achievement!',
        threshold: 1000,
        type: 'movies',
        icon: ''
    },
    fifteenHundredMovies: {
        id: 'fifteen-hundred-movies',
        name: 'Cinema Master',
        description: 'Watched 1,500 movies',
        threshold: 1500,
        type: 'movies',
        icon: ''
    },
    twoThousandMovies: {
        id: 'two-thousand-movies',
        name: 'Movie God',
        description: 'Watched 2,000 movies - You are legendary!',
        threshold: 2000,
        type: 'movies',
        icon: ''
    },
    
    // Genre Achievements
    genreExplorer: {
        id: 'genre-explorer',
        name: 'Genre Explorer',
        description: 'Watched movies from 5 different genres',
        threshold: 5,
        type: 'genres',
        icon: ''
    },
    genreSpecialist: {
        id: 'genre-specialist',
        name: 'Genre Specialist',
        description: 'Watched movies from 10 different genres',
        threshold: 10,
        type: 'genres',
        icon: ''
    },
    genreMaster: {
        id: 'genre-master',
        name: 'Genre Master',
        description: 'Watched movies from 15 different genres',
        threshold: 15,
        type: 'genres',
        icon: ''
    },
    
    // Streak Achievements - Weekly Focus
    weekStreak: {
        id: 'week-streak',
        name: 'Weekly Warrior',
        description: 'Watched movies 7 days in a row',
        threshold: 7,
        type: 'streak',
        icon: ''
    },
    twoWeekStreak: {
        id: 'two-week-streak',
        name: 'Fortnight Fighter',
        description: 'Watched movies 14 days in a row',
        threshold: 14,
        type: 'streak',
        icon: ''
    },
    monthStreak: {
        id: 'month-streak',
        name: 'Monthly Master',
        description: 'Watched movies 30 days in a row',
        threshold: 30,
        type: 'streak',
        icon: ''
    },
    
    // Weekly Viewing Badges
    weeklyMarathon: {
        id: 'weekly-marathon',
        name: 'Weekend Warrior',
        description: 'Watched 7+ movies in one week',
        threshold: 7,
        type: 'weekly',
        icon: ''
    },
    weeklyBinge: {
        id: 'weekly-binge',
        name: 'Binge Master',
        description: 'Watched 10+ movies in one week',
        threshold: 10,
        type: 'weekly',
        icon: ''
    },
    
    // Rating Achievements
    ratingConsistency: {
        id: 'rating-consistency',
        name: 'Critical Eye',
        description: 'Rated 20 movies',
        threshold: 20,
        type: 'ratings',
        icon: ''
    },
    ratingPrecision: {
        id: 'rating-precision',
        name: 'Precise Critic',
        description: 'Rated 100 movies',
        threshold: 100,
        type: 'ratings',
        icon: ''
    },
    ratingMaster: {
        id: 'rating-master',
        name: 'Master Critic',
        description: 'Rated 500 movies',
        threshold: 500,
        type: 'ratings',
        icon: ''
    },
    
    // Decade Explorer
    decadeExplorer: {
        id: 'decade-explorer',
        name: 'Time Traveler',
        description: 'Watched movies from 5 different decades',
        threshold: 5,
        type: 'decades',
        icon: ''
    },
    
    // Special Achievements
    completionist: {
        id: 'completionist',
        name: 'The Completionist',
        description: 'Watched everything on your watchlist',
        threshold: 1,
        type: 'special',
        icon: ''
    }
};

// User level calculation - Enhanced for power users
function calculateUserLevel(totalMovies) {
    if (totalMovies < 10) return { level: 1, name: 'Newcomer', nextThreshold: 10 };
    if (totalMovies < 25) return { level: 2, name: 'Regular', nextThreshold: 25 };
    if (totalMovies < 50) return { level: 3, name: 'Enthusiast', nextThreshold: 50 };
    if (totalMovies < 100) return { level: 4, name: 'Aficionado', nextThreshold: 100 };
    if (totalMovies < 250) return { level: 5, name: 'Expert', nextThreshold: 250 };
    if (totalMovies < 500) return { level: 6, name: 'Connoisseur', nextThreshold: 500 };
    if (totalMovies < 750) return { level: 7, name: 'Devotee', nextThreshold: 750 };
    if (totalMovies < 1000) return { level: 8, name: 'Scholar', nextThreshold: 1000 };
    if (totalMovies < 1500) return { level: 9, name: 'Legend', nextThreshold: 1500 };
    if (totalMovies < 2000) return { level: 10, name: 'Master', nextThreshold: 2000 };
    if (totalMovies < 3000) return { level: 11, name: 'Grandmaster', nextThreshold: 3000 };
    if (totalMovies < 5000) return { level: 12, name: 'Cinema God', nextThreshold: 5000 };
    return { level: 13, name: 'Transcendent', nextThreshold: null };
}

// Show achievement toast with enhanced styling
function showAchievement(achievement) {
    const existingToast = document.querySelector('.achievement-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
        <div class="achievement-content">
            <div class="achievement-icon">${achievement.icon || ''}</div>
            <div class="achievement-text">
                <strong>Achievement Unlocked!</strong>
                <h3>${achievement.name}</h3>
                <p>${achievement.description}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Auto-hide after 6 seconds for more complex achievements
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 6000);
}

// Check for new achievements - Enhanced with weekly and decade tracking
function checkAchievements(stats) {
    const unlockedAchievements = JSON.parse(localStorage.getItem('reeltracker_achievements') || '[]');
    const newAchievements = [];
    
    // Check all achievement types
    Object.values(achievements).forEach(achievement => {
        if (unlockedAchievements.includes(achievement.id)) return;
        
        let unlocked = false;
        
        switch (achievement.type) {
            case 'movies':
                if (stats.totalMovies >= achievement.threshold) {
                    unlocked = true;
                }
                break;
            case 'genres':
                if (stats.uniqueGenres >= achievement.threshold) {
                    unlocked = true;
                }
                break;
            case 'streak':
                if (stats.currentStreak >= achievement.threshold) {
                    unlocked = true;
                }
                break;
            case 'ratings':
                if (stats.totalRatings >= achievement.threshold) {
                    unlocked = true;
                }
                break;
            case 'weekly':
                if (stats.weeklyMovies >= achievement.threshold) {
                    unlocked = true;
                }
                break;
            case 'decades':
                if (stats.uniqueDecades >= achievement.threshold) {
                    unlocked = true;
                }
                break;
            case 'special':
                if (achievement.id === 'completionist' && stats.watchlistCompletion === 100) {
                    unlocked = true;
                }
                break;
        }
        
        if (unlocked) {
            newAchievements.push(achievement);
            unlockedAchievements.push(achievement.id);
        }
    });
    
    // Save updated achievements
    if (newAchievements.length > 0) {
        localStorage.setItem('reeltracker_achievements', JSON.stringify(unlockedAchievements));
        
        // Show achievement notifications with staggered timing
        newAchievements.forEach((achievement, index) => {
            setTimeout(() => {
                showAchievement(achievement);
            }, index * 1500); // Increased delay for better UX
        });
    }
    
    return unlockedAchievements.length;
}

// Update progress bars
function updateProgressBars() {
    // Update watchlist progress
    const watchlistProgress = document.querySelector('.watchlist-progress');
    if (watchlistProgress) {
        const watched = parseInt(watchlistProgress.dataset.watched || '0');
        const total = parseInt(watchlistProgress.dataset.total || '0');
        const percentage = total > 0 ? (watched / total) * 100 : 0;
        
        const progressBar = watchlistProgress.querySelector('.progress-fill');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }
    
    // Update genre diversity progress
    const genreProgress = document.querySelector('.genre-progress');
    if (genreProgress) {
        const current = parseInt(genreProgress.dataset.current || '0');
        const target = 10; // Target 10 genres for diversity
        const percentage = Math.min((current / target) * 100, 100);
        
        const progressBar = genreProgress.querySelector('.progress-fill');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }
}

// Update user level display - Enhanced for higher levels
function updateUserLevel(totalMovies) {
    const levelDisplay = document.querySelector('.user-level');
    if (!levelDisplay) return;
    
    const userLevel = calculateUserLevel(totalMovies);
    const progress = userLevel.nextThreshold ? (totalMovies / userLevel.nextThreshold) * 100 : 100;
    
    levelDisplay.innerHTML = `
        <div class="level-info">
            <span class="level-badge level-${userLevel.level}">Level ${userLevel.level}: ${userLevel.name}</span>
            ${userLevel.nextThreshold ? `
                <div class="level-progress">
                    <div class="progress-text">
                        <span class="current">${totalMovies.toLocaleString()}</span>
                        <span class="separator">/</span>
                        <span class="target">${userLevel.nextThreshold.toLocaleString()}</span>
                        <span class="label">movies to next level</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                </div>
            ` : `
                <div class="max-level">
                    <span class="meta">Transcendent Level Achieved! ${totalMovies.toLocaleString()} movies watched</span>
                </div>
            `}
        </div>
    `;
}

// Initialize gamification
document.addEventListener('DOMContentLoaded', function() {
    // Get stats from page (would normally come from API)
    const stats = {
        totalMovies: parseInt(document.querySelector('[data-total-movies]')?.dataset.totalMovies || '0'),
        uniqueGenres: parseInt(document.querySelector('[data-unique-genres]')?.dataset.uniqueGenres || '0'),
        currentStreak: parseInt(document.querySelector('[data-current-streak]')?.dataset.currentStreak || '0'),
        totalRatings: parseInt(document.querySelector('[data-total-ratings]')?.dataset.totalRatings || '0')
    };
    
    // Check achievements
    const achievementCount = checkAchievements(stats);
    
    // Update UI elements
    updateProgressBars();
    updateUserLevel(stats.totalMovies);
    
    // Update achievement count display
    const achievementDisplay = document.querySelector('.achievement-count');
    if (achievementDisplay) {
        achievementDisplay.textContent = `${achievementCount} / ${Object.keys(achievements).length}`;
    }
});

// Export for use in other scripts
window.ReelTrackerGamification = {
    showAchievement,
    checkAchievements,
    updateProgressBars,
    updateUserLevel,
    calculateUserLevel
};