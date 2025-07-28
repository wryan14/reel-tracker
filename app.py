"""ReelTracker - Minimal movie tracking application.

Core Flask application with SQLite database for tracking movies,
watchlist, ratings, and viewing history.
"""

import os
import json
import sqlite3
import time
from datetime import datetime
from functools import wraps
from pathlib import Path

from flask import Flask, render_template, request, jsonify, g, url_for, redirect, flash

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Note: python-dotenv not installed. Using system environment variables only.")

try:
    from api_service import get_tmdb_service
    from data_visualizations import (
        get_rating_distribution, get_genre_breakdown, get_viewing_timeline,
        get_rating_vs_popularity, get_watchlist_priority_breakdown,
        get_monthly_stats, CHART_CONFIGS
    )
    from time_series_service import get_time_series_service
    FEATURES_ENABLED = True
except ImportError as e:
    print(f"Warning: Advanced features disabled - {e}")
    FEATURES_ENABLED = False

# Initialize Flask app
app = Flask(__name__)
app.config['DATABASE'] = 'reeltracker.db'
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')

# Simple cache decorator
def cache_response(duration=300):
    """Cache function results for specified duration in seconds."""
    cache = {}
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Check if cached and not expired
            if key in cache:
                result, timestamp = cache[key]
                if time.time() - timestamp < duration:
                    return result
            
            # Generate new result and cache it
            result = func(*args, **kwargs)
            cache[key] = (result, time.time())
            return result
        
        return wrapper
    return decorator


# Database connection management
def get_db():
    """Get database connection for current request."""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(app.config['DATABASE'])
        db.row_factory = sqlite3.Row
    return db


@app.teardown_appcontext
def close_connection(exception):
    """Close database connection at end of request."""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def init_db():
    """Initialize database with schema."""
    db = get_db()
    db.executescript('''
        CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            year INTEGER,
            director TEXT,
            genre TEXT,
            plot TEXT,
            poster_url TEXT,
            imdb_id TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS watchlist (
            id INTEGER PRIMARY KEY,
            movie_id INTEGER NOT NULL,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            priority INTEGER DEFAULT 0,
            notes TEXT,
            FOREIGN KEY (movie_id) REFERENCES movies(id),
            UNIQUE(movie_id)
        );
        
        CREATE TABLE IF NOT EXISTS user_ratings (
            id INTEGER PRIMARY KEY,
            movie_id INTEGER NOT NULL,
            rating REAL NOT NULL CHECK(rating >= 0 AND rating <= 10),
            review TEXT,
            rated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (movie_id) REFERENCES movies(id),
            UNIQUE(movie_id)
        );
        
        CREATE TABLE IF NOT EXISTS viewing_history (
            id INTEGER PRIMARY KEY,
            movie_id INTEGER NOT NULL,
            watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            FOREIGN KEY (movie_id) REFERENCES movies(id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
        CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year);
        CREATE INDEX IF NOT EXISTS idx_watchlist_priority ON watchlist(priority DESC);
        CREATE INDEX IF NOT EXISTS idx_ratings_rating ON user_ratings(rating DESC);
    ''')
    db.commit()


# Template rendering with proper template files
def render_page(template_name, title=None, **context):
    """Render page using template files."""
    return render_template(template_name, title=title, **context)


@app.route('/')
def index():
    """Home page showing recent activity."""
    db = get_db()
    
    # Get recent ratings
    recent_ratings = db.execute('''
        SELECT m.*, r.rating, r.rated_at
        FROM user_ratings r
        JOIN movies m ON r.movie_id = m.id
        ORDER BY r.rated_at DESC
        LIMIT 5
    ''').fetchall()
    
    # Get recent watches
    recent_watches = db.execute('''
        SELECT m.*, v.watched_at
        FROM viewing_history v
        JOIN movies m ON v.movie_id = m.id
        ORDER BY v.watched_at DESC
        LIMIT 5
    ''').fetchall()
    
    return render_page('index.html', title='Home',
                      recent_ratings=recent_ratings,
                      recent_watches=recent_watches)


@app.route('/search')
def search():
    """Search for movies using TMDB API with local database fallback."""
    query = request.args.get('q', '').strip()
    source = request.args.get('source', 'api')  # 'api' or 'local'
    
    movies = []
    
    if query and FEATURES_ENABLED and source == 'api':
        # Search TMDB API first
        try:
            tmdb = get_tmdb_service()
            api_results = tmdb.search_movies(query)
            
            if api_results and api_results.get('results'):
                # Get genre mapping from TMDB
                genre_map = tmdb.get_genre_mapping()
                
                for movie in api_results['results'][:20]:  # Limit to 20 results
                    # Convert genre IDs to names
                    genre_ids = movie.get('genre_ids', [])
                    genre_names = [genre_map.get(gid, f'Genre {gid}') for gid in genre_ids[:3]]  # Limit to 3 genres
                    genre_text = ', '.join(genre_names) if genre_names else 'Unknown Genre'
                    
                    movies.append({
                        'id': movie.get('id'),
                        'title': movie.get('title', 'Unknown Title'),
                        'year': movie.get('release_date', '')[:4] if movie.get('release_date') else 'Unknown',
                        'genre': genre_text,
                        'plot': movie.get('overview', 'No plot available'),
                        'poster_url': tmdb.get_poster_url(movie.get('poster_path', '')),
                        'vote_average': movie.get('vote_average', 0),
                        'tmdb_id': movie.get('id'),
                        'source': 'tmdb'
                    })
        except Exception as e:
            print(f"TMDB search error: {e}")
            # Fall through to local search
    
    # Local database search (fallback or when source='local')
    if not movies and query:
        db = get_db()
        local_movies = db.execute('''
            SELECT * FROM movies 
            WHERE title LIKE ?
            ORDER BY year DESC
            LIMIT 20
        ''', (f'%{query}%',)).fetchall()
        
        for movie in local_movies:
            movies.append({
                'id': movie['id'],
                'title': movie['title'],
                'year': movie['year'],
                'director': movie['director'],
                'genre': movie['genre'],
                'plot': movie['plot'],
                'poster_url': movie['poster_url'],
                'source': 'local'
            })
    
    return render_page('search.html', title='Search',
                      query=query, movies=movies, source=source)


@app.route('/movie/<int:movie_id>')
def movie_detail(movie_id):
    """Show movie details with rating and watchlist options."""
    db = get_db()
    source = request.args.get('source', 'local')
    
    # Get today's date for the date picker
    from datetime import date
    today_date = date.today().strftime('%Y-%m-%d')
    
    movie = None
    
    # Try local database first
    local_movie = db.execute('SELECT * FROM movies WHERE id = ?', (movie_id,)).fetchone()
    
    if local_movie:
        movie = dict(local_movie)
        movie['source'] = 'local'
    elif FEATURES_ENABLED and source != 'local':
        # Try TMDB API for movie details
        try:
            tmdb = get_tmdb_service()
            tmdb_movie = tmdb.get_movie_details(movie_id)
            
            if tmdb_movie:
                movie = {
                    'id': tmdb_movie['id'],
                    'title': tmdb_movie.get('title', 'Unknown Title'),
                    'year': tmdb_movie.get('release_date', '')[:4] if tmdb_movie.get('release_date') else 'Unknown',
                    'director': 'Unknown Director',  # TMDB doesn't include director in basic details
                    'genre': ', '.join([g['name'] for g in tmdb_movie.get('genres', [])]),
                    'plot': tmdb_movie.get('overview', 'No plot available'),
                    'poster_url': tmdb.get_poster_url(tmdb_movie.get('poster_path', '')),
                    'runtime': tmdb_movie.get('runtime'),
                    'vote_average': tmdb_movie.get('vote_average', 0),
                    'tmdb_id': tmdb_movie['id'],
                    'source': 'tmdb'
                }
        except Exception as e:
            print(f"Error fetching TMDB movie {movie_id}: {e}")
    
    if not movie:
        return "Movie not found", 404
    
    # Get user data (use TMDB ID for TMDB movies)
    search_id = movie['tmdb_id'] if movie.get('source') == 'tmdb' else movie_id
    
    rating = db.execute('SELECT * FROM user_ratings WHERE movie_id = ?', (search_id,)).fetchone()
    in_watchlist = db.execute('SELECT * FROM watchlist WHERE movie_id = ?', (search_id,)).fetchone()
    watch_count = db.execute('SELECT COUNT(*) as count FROM viewing_history WHERE movie_id = ?', (search_id,)).fetchone()
    
    return render_page('movie_detail.html', title=movie['title'],
                      movie=movie,
                      rating=rating,
                      in_watchlist=in_watchlist,
                      watch_count=watch_count,
                      today_date=today_date)


@app.route('/movie/<int:movie_id>/rate', methods=['POST'])
def rate_movie(movie_id):
    """Add or update movie rating."""
    db = get_db()
    rating = float(request.form.get('rating', 0))
    review = request.form.get('review', '').strip()
    source = request.form.get('source', 'local')
    
    # Use the correct ID for database operations
    db_movie_id = movie_id
    
    try:
        db.execute('''
            INSERT OR REPLACE INTO user_ratings (movie_id, rating, review)
            VALUES (?, ?, ?)
        ''', (db_movie_id, rating, review))
        db.commit()
    except Exception as e:
        return f"Error: {e}", 400
    
    redirect_url = f'/movie/{movie_id}'
    if source == 'tmdb':
        redirect_url += '?source=tmdb'
    
    return f'<meta http-equiv="refresh" content="0;url={redirect_url}">'


@app.route('/movie/<int:movie_id>/add-watchlist', methods=['POST'])
def add_to_watchlist(movie_id):
    """Add movie to watchlist."""
    db = get_db()
    
    try:
        db.execute('INSERT INTO watchlist (movie_id) VALUES (?)', (movie_id,))
        db.commit()
    except sqlite3.IntegrityError:
        pass  # Already in watchlist
    
    return f'<meta http-equiv="refresh" content="0;url=/movie/{movie_id}">'


@app.route('/movie/<int:movie_id>/remove-watchlist', methods=['POST'])
def remove_from_watchlist(movie_id):
    """Remove movie from watchlist."""
    db = get_db()
    db.execute('DELETE FROM watchlist WHERE movie_id = ?', (movie_id,))
    db.commit()
    
    return f'<meta http-equiv="refresh" content="0;url=/movie/{movie_id}">'


@app.route('/movie/<int:movie_id>/watched', methods=['POST'])
def mark_watched(movie_id):
    """Mark movie as watched with optional custom date."""
    db = get_db()
    
    # Get watched date from form, default to current timestamp
    watched_date = request.form.get('watched_date')
    notes = request.form.get('notes', '').strip()
    
    if watched_date:
        # Convert date to timestamp format
        try:
            from datetime import datetime
            date_obj = datetime.strptime(watched_date, '%Y-%m-%d')
            watched_timestamp = date_obj.strftime('%Y-%m-%d %H:%M:%S')
        except ValueError:
            watched_timestamp = None
    else:
        watched_timestamp = None
    
    if watched_timestamp:
        db.execute('INSERT INTO viewing_history (movie_id, watched_at, notes) VALUES (?, ?, ?)', 
                  (movie_id, watched_timestamp, notes))
    else:
        db.execute('INSERT INTO viewing_history (movie_id, notes) VALUES (?, ?)', 
                  (movie_id, notes))
    
    db.commit()
    
    return f'<meta http-equiv="refresh" content="0;url=/movie/{movie_id}">'


@app.route('/watchlist')
def watchlist():
    """Show user's watchlist."""
    db = get_db()
    
    movies = db.execute('''
        SELECT m.*, w.added_at, w.priority
        FROM watchlist w
        JOIN movies m ON w.movie_id = m.id
        ORDER BY w.priority DESC, w.added_at DESC
    ''').fetchall()
    
    return render_page('watchlist.html', title='Watchlist', movies=movies)


@app.route('/stats')
@cache_response(duration=60)  # Cache stats for 1 minute
def stats():
    """Show viewing statistics with time series analysis."""
    db = get_db()
    
    # Total movies
    total_movies = db.execute('SELECT COUNT(*) as count FROM movies').fetchone()
    
    # Total ratings
    total_ratings = db.execute('SELECT COUNT(*) as count FROM user_ratings').fetchone()
    avg_rating = db.execute('SELECT AVG(rating) as avg FROM user_ratings').fetchone()
    
    # Watchlist size
    watchlist_size = db.execute('SELECT COUNT(*) as count FROM watchlist').fetchone()
    
    # Watch count  
    total_watches = db.execute('SELECT COUNT(*) as count FROM viewing_history').fetchone()
    
    # Unique genres count
    unique_genres = db.execute('''
        SELECT COUNT(DISTINCT genre) as count 
        FROM movies m 
        JOIN user_ratings r ON m.id = r.movie_id 
        WHERE m.genre IS NOT NULL AND m.genre != ''
    ''').fetchone()
    
    # Current viewing streak (simplified - days with movie watches)
    current_streak = db.execute('''
        SELECT COUNT(DISTINCT DATE(watched_at)) as count 
        FROM viewing_history 
        WHERE watched_at >= date('now', '-30 days')
    ''').fetchone()
    
    # Weekly movie count (last 7 days)
    weekly_movies = db.execute('''
        SELECT COUNT(*) as count 
        FROM viewing_history 
        WHERE watched_at >= date('now', '-7 days')
    ''').fetchone()
    
    # Unique decades
    unique_decades = db.execute('''
        SELECT COUNT(DISTINCT (year/10)*10) as count 
        FROM movies m 
        JOIN user_ratings r ON m.id = r.movie_id 
        WHERE m.year IS NOT NULL
    ''').fetchone()
    
    # Watchlist completion percentage
    watchlist_completion = db.execute('''
        SELECT 
            CASE 
                WHEN COUNT(w.id) = 0 THEN 0
                ELSE ROUND((COUNT(vh.id) * 100.0) / COUNT(w.id))
            END as completion
        FROM watchlist w
        LEFT JOIN viewing_history vh ON w.movie_id = vh.movie_id
    ''').fetchone()
    
    # Top rated movies
    top_rated = db.execute('''
        SELECT m.*, r.rating
        FROM user_ratings r
        JOIN movies m ON r.movie_id = m.id
        ORDER BY r.rating DESC
        LIMIT 10
    ''').fetchall()
    
    # Most watched
    most_watched = db.execute('''
        SELECT m.*, COUNT(v.id) as watch_count
        FROM viewing_history v
        JOIN movies m ON v.movie_id = m.id
        GROUP BY m.id
        ORDER BY watch_count DESC
        LIMIT 10
    ''').fetchall()
    
    # Rating distribution for chart
    all_ratings = db.execute('SELECT rating FROM user_ratings').fetchall()
    rating_distribution = [0, 0, 0, 0, 0]  # 0-1, 2-3, 4-5, 6-7, 8-10
    
    for rating in all_ratings:
        r = float(rating['rating'])
        if r <= 1:
            rating_distribution[0] += 1
        elif r <= 3:
            rating_distribution[1] += 1
        elif r <= 5:
            rating_distribution[2] += 1
        elif r <= 7:
            rating_distribution[3] += 1
        else:
            rating_distribution[4] += 1
    
    # Time series data for viewing habits
    time_series_data = None
    viewing_streaks = None
    
    if FEATURES_ENABLED:
        try:
            ts_service = get_time_series_service()
            time_series_data = ts_service.get_viewing_timeline_extended()
            viewing_streaks = ts_service.get_viewing_streaks()
        except Exception as e:
            print(f"Error getting time series data: {e}")
    
    return render_page('stats.html', title='Statistics',
                      total_movies=total_movies,
                      total_ratings=total_ratings,
                      avg_rating=avg_rating,
                      watchlist_size=watchlist_size,
                      total_watches=total_watches,
                      unique_genres=unique_genres,
                      current_streak=current_streak,
                      weekly_movies=weekly_movies,
                      unique_decades=unique_decades,
                      watchlist_completion=watchlist_completion,
                      top_rated=top_rated,
                      most_watched=most_watched,
                      rating_distribution=rating_distribution,
                      time_series_data=time_series_data,
                      viewing_streaks=viewing_streaks)


@app.route('/timeline')
def timeline():
    """Show time series viewing habits analysis."""
    try:
        from time_series_service import TimeSeriesService
        
        ts_service = TimeSeriesService()
        time_series_data = ts_service.get_viewing_timeline_extended()
        viewing_streaks = ts_service.get_viewing_streaks()
        
        return render_page('time_series.html', title='Viewing Timeline',
                          time_series_data=time_series_data,
                          viewing_streaks=viewing_streaks)
    except Exception as e:
        print(f"Error loading timeline: {e}")
        import traceback
        traceback.print_exc()
        
        # Return a basic timeline page with error message
        return render_page('time_series.html', title='Viewing Timeline',
                          time_series_data=None,
                          viewing_streaks=None,
                          error="Unable to load timeline data. Please make sure you have some viewing history by marking movies as watched.")


@app.route('/api/stats')
def api_stats():
    """Get current statistics as JSON for real-time updates."""
    db = get_db()
    
    # Get all the stats
    total_movies = db.execute('SELECT COUNT(*) as count FROM movies').fetchone()
    total_ratings = db.execute('SELECT COUNT(*) as count FROM user_ratings').fetchone()
    total_watches = db.execute('SELECT COUNT(*) as count FROM viewing_history').fetchone()
    
    unique_genres = db.execute('''
        SELECT COUNT(DISTINCT genre) as count 
        FROM movies m 
        JOIN user_ratings r ON m.id = r.movie_id 
        WHERE m.genre IS NOT NULL AND m.genre != ''
    ''').fetchone()
    
    current_streak = db.execute('''
        SELECT COUNT(DISTINCT DATE(watched_at)) as count 
        FROM viewing_history 
        WHERE watched_at >= date('now', '-30 days')
    ''').fetchone()
    
    weekly_movies = db.execute('''
        SELECT COUNT(*) as count 
        FROM viewing_history 
        WHERE watched_at >= date('now', '-7 days')
    ''').fetchone()
    
    unique_decades = db.execute('''
        SELECT COUNT(DISTINCT (year/10)*10) as count 
        FROM movies m 
        JOIN user_ratings r ON m.id = r.movie_id 
        WHERE m.year IS NOT NULL
    ''').fetchone()
    
    watchlist_completion = db.execute('''
        SELECT 
            CASE 
                WHEN COUNT(w.id) = 0 THEN 0
                ELSE ROUND((COUNT(vh.id) * 100.0) / COUNT(w.id))
            END as completion
        FROM watchlist w
        LEFT JOIN viewing_history vh ON w.movie_id = vh.movie_id
    ''').fetchone()
    
    # Rating distribution for chart
    all_ratings = db.execute('SELECT rating FROM user_ratings').fetchall()
    rating_distribution = [0, 0, 0, 0, 0]  # 0-1, 2-3, 4-5, 6-7, 8-10
    
    for rating in all_ratings:
        r = float(rating['rating'])
        if r <= 1:
            rating_distribution[0] += 1
        elif r <= 3:
            rating_distribution[1] += 1
        elif r <= 5:
            rating_distribution[2] += 1
        elif r <= 7:
            rating_distribution[3] += 1
        else:
            rating_distribution[4] += 1
    
    return jsonify({
        'totalMovies': total_watches['count'],
        'uniqueGenres': unique_genres['count'],
        'currentStreak': current_streak['count'],
        'totalRatings': total_ratings['count'],
        'weeklyMovies': weekly_movies['count'],
        'uniqueDecades': unique_decades['count'],
        'watchlistCompletion': watchlist_completion['completion'],
        'ratingDistribution': rating_distribution
    })


@app.route('/movie/<int:movie_id>/save-from-api', methods=['POST'])
def save_movie_from_api(movie_id):
    """Save movie from TMDB API to local database."""
    if not FEATURES_ENABLED:
        return "API features not available", 404
    
    try:
        tmdb = get_tmdb_service()
        movie_data = tmdb.get_movie_details(movie_id)
        
        if not movie_data:
            return "Movie not found in API", 404
        
        db = get_db()
        
        # Get additional details including director
        credits = tmdb._make_request(f"movie/{movie_id}/credits")
        director = 'Unknown Director'
        if credits and 'crew' in credits:
            directors = [person['name'] for person in credits['crew'] if person.get('job') == 'Director']
            director = ', '.join(directors[:2]) if directors else 'Unknown Director'
        
        # Insert movie into local database
        db.execute('''
            INSERT OR REPLACE INTO movies (id, title, year, director, genre, plot, poster_url, imdb_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            movie_data['id'],
            movie_data.get('title', 'Unknown Title'),
            movie_data.get('release_date', '')[:4] if movie_data.get('release_date') else None,
            director,
            ', '.join([g['name'] for g in movie_data.get('genres', [])]),
            movie_data.get('overview', ''),
            tmdb.get_poster_url(movie_data.get('poster_path', '')),
            movie_data.get('imdb_id', '')
        ))
        
        db.commit()
        
        return f'<meta http-equiv="refresh" content="0;url=/movie/{movie_id}">'
        
    except Exception as e:
        print(f"Error saving movie from API: {e}")
        return f"Error saving movie: {e}", 500


if __name__ == '__main__':
    # Initialize database on first run
    with app.app_context():
        init_db()
    
    # Run the development server
    app.run(debug=True, host='0.0.0.0', port=5000)