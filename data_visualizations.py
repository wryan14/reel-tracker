"""Data visualization components for MovieHive.

Generates Chart.js compatible data following minimalist design principles.
"""

import sqlite3
from collections import defaultdict, Counter
from datetime import datetime, timedelta
from typing import Dict, List, Any


def get_rating_distribution(db_path: str = 'moviehive.db') -> Dict[str, Any]:
    """Generate rating distribution data for visualization."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    # Get all user ratings
    ratings = conn.execute("""
        SELECT rating FROM user_ratings 
        WHERE rating IS NOT NULL
        ORDER BY rating
    """).fetchall()
    
    conn.close()
    
    if not ratings:
        return {
            'labels': ['0-2', '2-4', '4-6', '6-8', '8-10'],
            'data': [0, 0, 0, 0, 0],
            'total': 0
        }
    
    # Group ratings into ranges
    ranges = {
        '0-2': 0, '2-4': 0, '4-6': 0, '6-8': 0, '8-10': 0
    }
    
    for rating_row in ratings:
        rating = rating_row['rating']
        if rating <= 2:
            ranges['0-2'] += 1
        elif rating <= 4:
            ranges['2-4'] += 1
        elif rating <= 6:
            ranges['4-6'] += 1
        elif rating <= 8:
            ranges['6-8'] += 1
        else:
            ranges['8-10'] += 1
    
    return {
        'labels': list(ranges.keys()),
        'data': list(ranges.values()),
        'total': len(ratings)
    }


def get_genre_breakdown(db_path: str = 'moviehive.db') -> Dict[str, Any]:
    """Generate genre distribution from watched movies."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    # Get genres from rated movies
    movies = conn.execute("""
        SELECT m.genre FROM movies m
        JOIN user_ratings ur ON m.id = ur.movie_id
        WHERE m.genre IS NOT NULL AND m.genre != ''
    """).fetchall()
    
    conn.close()
    
    if not movies:
        return {
            'labels': ['No Data'],
            'data': [1],
            'total': 0
        }
    
    # Parse and count genres
    genre_counter = Counter()
    for movie_row in movies:
        genres = movie_row['genre'].split(', ')
        for genre in genres:
            genre = genre.strip()
            if genre:
                genre_counter[genre] += 1
    
    # Get top 10 genres
    top_genres = genre_counter.most_common(10)
    
    return {
        'labels': [genre for genre, _ in top_genres],
        'data': [count for _, count in top_genres],
        'total': sum(genre_counter.values())
    }


def get_viewing_timeline(db_path: str = 'moviehive.db', days: int = 30) -> Dict[str, Any]:
    """Generate viewing activity over time."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    # Get viewing history for last N days
    cutoff_date = datetime.now() - timedelta(days=days)
    
    views = conn.execute("""
        SELECT date(watched_at) as day, COUNT(*) as count
        FROM viewing_history 
        WHERE watched_at >= ?
        GROUP BY date(watched_at)
        ORDER BY day
    """, (cutoff_date.strftime('%Y-%m-%d'),)).fetchall()
    
    conn.close()
    
    # Fill in missing days with zero
    viewing_data = {}
    current_date = cutoff_date.date()
    end_date = datetime.now().date()
    
    while current_date <= end_date:
        viewing_data[current_date.strftime('%Y-%m-%d')] = 0
        current_date += timedelta(days=1)
    
    # Add actual viewing counts
    for view in views:
        viewing_data[view['day']] = view['count']
    
    # Format for Chart.js
    sorted_dates = sorted(viewing_data.keys())
    
    return {
        'labels': [datetime.strptime(date, '%Y-%m-%d').strftime('%m/%d') for date in sorted_dates],
        'data': [viewing_data[date] for date in sorted_dates],
        'total': sum(viewing_data.values())
    }


def get_rating_vs_popularity(db_path: str = 'moviehive.db') -> Dict[str, Any]:
    """Compare personal ratings with movie popularity (if available)."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    # Get ratings with movie details
    ratings = conn.execute("""
        SELECT 
            ur.rating as personal_rating,
            m.title,
            m.year,
            COALESCE(m.imdb_rating, 7.0) as popularity_score
        FROM user_ratings ur
        JOIN movies m ON ur.movie_id = m.id
        WHERE ur.rating IS NOT NULL
        ORDER BY ur.rating DESC
    """).fetchall()
    
    conn.close()
    
    if not ratings:
        return {
            'datasets': [],
            'total': 0
        }
    
    # Format for scatter plot
    scatter_data = []
    for rating in ratings:
        scatter_data.append({
            'x': rating['popularity_score'],
            'y': rating['personal_rating'],
            'title': rating['title'],
            'year': rating['year']
        })
    
    return {
        'datasets': [{
            'label': 'My Ratings vs Popularity',
            'data': scatter_data,
            'backgroundColor': '#64748b',
            'borderColor': '#64748b'
        }],
        'total': len(scatter_data)
    }


def get_watchlist_priority_breakdown(db_path: str = 'moviehive.db') -> Dict[str, Any]:
    """Analyze watchlist by priority levels."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    priorities = conn.execute("""
        SELECT priority, COUNT(*) as count
        FROM watchlist
        GROUP BY priority
        ORDER BY 
            CASE priority 
                WHEN 'high' THEN 1 
                WHEN 'medium' THEN 2 
                WHEN 'low' THEN 3 
                ELSE 4 
            END
    """).fetchall()
    
    conn.close()
    
    if not priorities:
        return {
            'labels': ['Empty Watchlist'],
            'data': [1],
            'total': 0
        }
    
    return {
        'labels': [p['priority'].title() for p in priorities],
        'data': [p['count'] for p in priorities],
        'total': sum(p['count'] for p in priorities)
    }


def get_monthly_stats(db_path: str = 'moviehive.db') -> Dict[str, Any]:
    """Get monthly viewing statistics."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    # Get monthly data for the last 12 months
    monthly_data = conn.execute("""
        SELECT 
            strftime('%Y-%m', watched_at) as month,
            COUNT(*) as movies_watched,
            AVG(ur.rating) as avg_rating
        FROM viewing_history vh
        LEFT JOIN user_ratings ur ON vh.movie_id = ur.movie_id
        WHERE watched_at >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', watched_at)
        ORDER BY month
    """).fetchall()
    
    conn.close()
    
    if not monthly_data:
        return {
            'labels': [],
            'movies_data': [],
            'rating_data': [],
            'total': 0
        }
    
    return {
        'labels': [datetime.strptime(row['month'], '%Y-%m').strftime('%b %Y') for row in monthly_data],
        'movies_data': [row['movies_watched'] for row in monthly_data],
        'rating_data': [round(row['avg_rating'] or 0, 1) for row in monthly_data],
        'total': sum(row['movies_watched'] for row in monthly_data)
    }


# Chart.js configuration templates following minimalist design
CHART_CONFIGS = {
    'bar': {
        'type': 'bar',
        'options': {
            'responsive': True,
            'maintainAspectRatio': False,
            'plugins': {
                'legend': {
                    'display': False
                },
                'title': {
                    'display': False
                }
            },
            'scales': {
                'x': {
                    'grid': {
                        'display': False
                    },
                    'ticks': {
                        'color': '#6b7280'
                    }
                },
                'y': {
                    'grid': {
                        'color': '#e5e7eb',
                        'drawBorder': False
                    },
                    'ticks': {
                        'color': '#6b7280'
                    }
                }
            }
        }
    },
    'line': {
        'type': 'line',
        'options': {
            'responsive': True,
            'maintainAspectRatio': False,
            'elements': {
                'point': {
                    'radius': 3,
                    'hoverRadius': 5
                },
                'line': {
                    'tension': 0.2
                }
            },
            'plugins': {
                'legend': {
                    'display': False
                }
            },
            'scales': {
                'x': {
                    'grid': {
                        'display': False
                    },
                    'ticks': {
                        'color': '#6b7280'
                    }
                },
                'y': {
                    'grid': {
                        'color': '#e5e7eb',
                        'drawBorder': False
                    },
                    'ticks': {
                        'color': '#6b7280'
                    }
                }
            }
        }
    },
    'scatter': {
        'type': 'scatter',
        'options': {
            'responsive': True,
            'maintainAspectRatio': False,
            'plugins': {
                'legend': {
                    'display': False
                }
            },
            'scales': {
                'x': {
                    'title': {
                        'display': True,
                        'text': 'Popularity Score',
                        'color': '#6b7280'
                    },
                    'grid': {
                        'color': '#e5e7eb'
                    },
                    'ticks': {
                        'color': '#6b7280'
                    }
                },
                'y': {
                    'title': {
                        'display': True,
                        'text': 'My Rating',
                        'color': '#6b7280'
                    },
                    'grid': {
                        'color': '#e5e7eb'
                    },
                    'ticks': {
                        'color': '#6b7280'
                    }
                }
            }
        }
    }
}