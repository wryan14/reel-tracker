// MovieHive Gamification System - Subtle progress tracking and achievements

// Achievement definitions
const achievements = {
    firstMovie: {
        id: 'first-movie',
        name: 'First Steps',
        description: 'Watched your first movie',
        threshold: 1,
        type: 'movies'
    },
    tenMovies: {
        id: 'ten-movies',
        name: 'Movie Buff',
        description: 'Watched 10 movies',
        threshold: 10,
        type: 'movies'
    },
    fiftyMovies: {
        id: 'fifty-movies',
        name: 'Cinephile',
        description: 'Watched 50 movies',
        threshold: 50,
        type: 'movies'
    },
    hundredMovies: {
        id: 'hundred-movies',
        name: 'Film Scholar',
        description: 'Watched 100 movies',
        threshold: 100,
        type: 'movies'
    },
    genreExplorer: {
        id: 'genre-explorer',
        name: 'Genre Explorer',
        description: 'Watched movies from 5 different genres',
        threshold: 5,
        type: 'genres'
    },
    weekStreak: {
        id: 'week-streak',
        name: 'Consistent Viewer',
        description: 'Maintained a 7-day viewing streak',
        threshold: 7,
        type: 'streak'
    },
    monthStreak: {
        id: 'month-streak',
        name: 'Dedicated Watcher',
        description: 'Maintained a 30-day viewing streak',
        threshold: 30,
        type: 'streak'
    },
    ratingConsistency: {
        id: 'rating-consistency',
        name: 'Critical Eye',
        description: 'Rated 20 movies',
        threshold: 20,
        type: 'ratings'
    }
};

// User level calculation
function calculateUserLevel(totalMovies) {
    if (totalMovies < 10) return { level: 1, name: 'Newcomer' };
    if (totalMovies < 25) return { level: 2, name: 'Regular' };
    if (totalMovies < 50) return { level: 3, name: 'Enthusiast' };
    if (totalMovies < 100) return { level: 4, name: 'Aficionado' };
    if (totalMovies < 250) return { level: 5, name: 'Expert' };
    return { level: 6, name: 'Master' };
}

// Show achievement toast
function showAchievement(achievement) {
    const existingToast = document.querySelector('.achievement-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
        <div class="achievement-content">
            <strong>${achievement.name}</strong>
            <p>${achievement.description}</p>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// Check for new achievements
function checkAchievements(stats) {
    const unlockedAchievements = JSON.parse(localStorage.getItem('moviehive_achievements') || '[]');
    const newAchievements = [];
    
    // Check movie count achievements
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
        }
        
        if (unlocked) {
            newAchievements.push(achievement);
            unlockedAchievements.push(achievement.id);
        }
    });
    
    // Save updated achievements
    if (newAchievements.length > 0) {
        localStorage.setItem('moviehive_achievements', JSON.stringify(unlockedAchievements));
        
        // Show achievement notifications
        newAchievements.forEach((achievement, index) => {
            setTimeout(() => {
                showAchievement(achievement);
            }, index * 1000);
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

// Update user level display
function updateUserLevel(totalMovies) {
    const levelDisplay = document.querySelector('.user-level');
    if (!levelDisplay) return;
    
    const userLevel = calculateUserLevel(totalMovies);
    const nextLevelThreshold = userLevel.level < 6 ? [10, 25, 50, 100, 250][userLevel.level - 1] : null;
    
    levelDisplay.innerHTML = `
        <span class="level-badge">Level ${userLevel.level}: ${userLevel.name}</span>
        ${nextLevelThreshold ? `
            <div class="level-progress">
                <span class="meta">${totalMovies} / ${nextLevelThreshold} movies to next level</span>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(totalMovies / nextLevelThreshold) * 100}%"></div>
                </div>
            </div>
        ` : '<span class="meta">Maximum level reached!</span>'}
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
window.MovieHiveGamification = {
    showAchievement,
    checkAchievements,
    updateProgressBars,
    updateUserLevel,
    calculateUserLevel
};