"""Time series analysis service for viewing habits in ReelTracker.

Provides comprehensive time series data for viewing patterns, habits analysis,
and trend visualization with multiple time granularities.
"""

import sqlite3
import json
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass


@dataclass
class ViewingTrend:
    """Data class for viewing trend analysis."""
    period: str
    count: int
    rating_avg: Optional[float]
    genres: List[str]
    date: datetime


class TimeSeriesService:
    """Service for time series analysis of viewing habits."""
    
    def __init__(self, db_path: str = 'reeltracker.db'):
        self.db_path = db_path
    
    def get_viewing_timeline_extended(self, days: int = 365) -> Dict[str, Any]:
        """Get extended viewing timeline with multiple granularities."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Get detailed viewing data
        views = conn.execute("""
            SELECT 
                vh.watched_at,
                m.title,
                m.genre,
                m.year,
                ur.rating,
                strftime('%Y-%m-%d', vh.watched_at) as day,
                strftime('%Y-%m', vh.watched_at) as month,
                strftime('%Y-W%W', vh.watched_at) as week,
                strftime('%w', vh.watched_at) as day_of_week
            FROM viewing_history vh
            JOIN movies m ON vh.movie_id = m.id
            LEFT JOIN user_ratings ur ON vh.movie_id = ur.movie_id
            WHERE vh.watched_at >= ?
            ORDER BY vh.watched_at
        """, (cutoff_date.strftime('%Y-%m-%d %H:%M:%S'),)).fetchall()
        
        conn.close()
        
        if not views:
            return self._empty_timeline_response()
        
        # Process data for different time granularities
        daily_data = self._process_daily_data(views, cutoff_date, days)
        weekly_data = self._process_weekly_data(views)
        monthly_data = self._process_monthly_data(views)
        day_of_week_data = self._process_day_of_week_data(views)
        
        return {
            'daily': daily_data,
            'weekly': weekly_data,
            'monthly': monthly_data,
            'day_patterns': day_of_week_data,
            'summary': self._generate_viewing_summary(views),
            'trends': self._analyze_trends(views)
        }
    
    def _process_daily_data(self, views: List, cutoff_date: datetime, days: int) -> Dict[str, Any]:
        """Process daily viewing data."""
        daily_counts = defaultdict(int)
        daily_ratings = defaultdict(list)
        daily_genres = defaultdict(list)
        
        # Initialize all days with zero
        current_date = cutoff_date.date()
        end_date = datetime.now().date()
        
        while current_date <= end_date:
            daily_counts[current_date.strftime('%Y-%m-%d')] = 0
            current_date += timedelta(days=1)
        
        # Add actual data
        for view in views:
            day = view['day']
            daily_counts[day] += 1
            
            if view['rating']:
                daily_ratings[day].append(view['rating'])
            
            if view['genre']:
                daily_genres[day].extend([g.strip() for g in view['genre'].split(',')])
        
        # Format for charts
        sorted_dates = sorted(daily_counts.keys())
        
        return {
            'labels': [datetime.strptime(date, '%Y-%m-%d').strftime('%m/%d') for date in sorted_dates],
            'counts': [daily_counts[date] for date in sorted_dates],
            'ratings': [
                round(sum(daily_ratings[date]) / len(daily_ratings[date]), 1) 
                if daily_ratings[date] else None 
                for date in sorted_dates
            ],
            'total': sum(daily_counts.values()),
            'max_day': max(daily_counts.values()) if daily_counts else 0
        }
    
    def _process_weekly_data(self, views: List) -> Dict[str, Any]:
        """Process weekly viewing patterns."""
        weekly_counts = defaultdict(int)
        weekly_ratings = defaultdict(list)
        
        for view in views:
            week = view['week']
            weekly_counts[week] += 1
            
            if view['rating']:
                weekly_ratings[week].append(view['rating'])
        
        sorted_weeks = sorted(weekly_counts.keys())
        
        return {
            'labels': [f"Week {week.split('-W')[1]}" for week in sorted_weeks],
            'counts': [weekly_counts[week] for week in sorted_weeks],
            'ratings': [
                round(sum(weekly_ratings[week]) / len(weekly_ratings[week]), 1)
                if weekly_ratings[week] else None
                for week in sorted_weeks
            ],
            'total': sum(weekly_counts.values())
        }
    
    def _process_monthly_data(self, views: List) -> Dict[str, Any]:
        """Process monthly viewing patterns."""
        monthly_counts = defaultdict(int)
        monthly_ratings = defaultdict(list)
        monthly_genres = defaultdict(list)
        
        for view in views:
            month = view['month']
            monthly_counts[month] += 1
            
            if view['rating']:
                monthly_ratings[month].append(view['rating'])
            
            if view['genre']:
                monthly_genres[month].extend([g.strip() for g in view['genre'].split(',')])
        
        sorted_months = sorted(monthly_counts.keys())
        
        return {
            'labels': [datetime.strptime(month, '%Y-%m').strftime('%b %Y') for month in sorted_months],
            'counts': [monthly_counts[month] for month in sorted_months],
            'ratings': [
                round(sum(monthly_ratings[month]) / len(monthly_ratings[month]), 1)
                if monthly_ratings[month] else None
                for month in sorted_months
            ],
            'genres': [
                Counter(monthly_genres[month]).most_common(3) if monthly_genres[month] else []
                for month in sorted_months
            ],
            'total': sum(monthly_counts.values())
        }
    
    def _process_day_of_week_data(self, views: List) -> Dict[str, Any]:
        """Analyze viewing patterns by day of week."""
        day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        day_counts = [0] * 7
        day_ratings = [[] for _ in range(7)]
        
        for view in views:
            day_num = int(view['day_of_week'])
            day_counts[day_num] += 1
            
            if view['rating']:
                day_ratings[day_num].append(view['rating'])
        
        return {
            'labels': day_names,
            'counts': day_counts,
            'ratings': [
                round(sum(ratings) / len(ratings), 1) if ratings else None
                for ratings in day_ratings
            ],
            'total': sum(day_counts)
        }
    
    def _generate_viewing_summary(self, views: List) -> Dict[str, Any]:
        """Generate viewing habit summary statistics."""
        if not views:
            return {}
        
        # Basic stats
        total_views = len(views)
        unique_movies = len(set(view['title'] for view in views))
        
        # Rating stats
        ratings = [view['rating'] for view in views if view['rating']]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else None
        
        # Genre analysis
        all_genres = []
        for view in views:
            if view['genre']:
                all_genres.extend([g.strip() for g in view['genre'].split(',')])
        
        top_genres = Counter(all_genres).most_common(5)
        
        # Year analysis
        years = [view['year'] for view in views if view['year']]
        year_range = (min(years), max(years)) if years else None
        
        # Viewing frequency
        dates = [datetime.strptime(view['watched_at'], '%Y-%m-%d %H:%M:%S').date() 
                for view in views]
        date_range = (min(dates), max(dates)) if dates else None
        days_span = (date_range[1] - date_range[0]).days if date_range else 0
        avg_per_week = round((total_views / days_span) * 7, 1) if days_span > 0 else 0
        
        return {
            'total_views': total_views,
            'unique_movies': unique_movies,
            'avg_rating': avg_rating,
            'top_genres': top_genres,
            'year_range': year_range,
            'date_range': date_range,
            'avg_per_week': avg_per_week,
            'viewing_span_days': days_span
        }
    
    def _analyze_trends(self, views: List) -> Dict[str, Any]:
        """Analyze viewing trends and patterns."""
        if len(views) < 2:
            return {}
        
        # Sort by date
        sorted_views = sorted(views, key=lambda x: x['watched_at'])
        
        # Calculate trends (comparing first and second half)
        mid_point = len(sorted_views) // 2
        first_half = sorted_views[:mid_point]
        second_half = sorted_views[mid_point:]
        
        # Rating trend
        first_ratings = [v['rating'] for v in first_half if v['rating']]
        second_ratings = [v['rating'] for v in second_half if v['rating']]
        
        rating_trend = None
        if first_ratings and second_ratings:
            first_avg = sum(first_ratings) / len(first_ratings)
            second_avg = sum(second_ratings) / len(second_ratings)
            rating_trend = round(second_avg - first_avg, 1)
        
        # Viewing frequency trend
        first_days = (datetime.strptime(first_half[-1]['watched_at'], '%Y-%m-%d %H:%M:%S') - 
                     datetime.strptime(first_half[0]['watched_at'], '%Y-%m-%d %H:%M:%S')).days
        second_days = (datetime.strptime(second_half[-1]['watched_at'], '%Y-%m-%d %H:%M:%S') - 
                      datetime.strptime(second_half[0]['watched_at'], '%Y-%m-%d %H:%M:%S')).days
        
        first_freq = len(first_half) / max(first_days, 1)
        second_freq = len(second_half) / max(second_days, 1)
        frequency_trend = round(second_freq - first_freq, 2)
        
        return {
            'rating_trend': rating_trend,
            'frequency_trend': frequency_trend,
            'trend_direction': 'increasing' if frequency_trend > 0 else 'decreasing' if frequency_trend < 0 else 'stable'
        }
    
    def _empty_timeline_response(self) -> Dict[str, Any]:
        """Return empty response structure."""
        return {
            'daily': {'labels': [], 'counts': [], 'ratings': [], 'total': 0, 'max_day': 0},
            'weekly': {'labels': [], 'counts': [], 'ratings': [], 'total': 0},
            'monthly': {'labels': [], 'counts': [], 'ratings': [], 'total': 0},
            'day_patterns': {'labels': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], 
                           'counts': [0]*7, 'ratings': [None]*7, 'total': 0},
            'summary': {},
            'trends': {}
        }
    
    def get_viewing_streaks(self) -> Dict[str, Any]:
        """Analyze viewing streaks and consistency."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        
        views = conn.execute("""
            SELECT DISTINCT date(watched_at) as view_date
            FROM viewing_history 
            ORDER BY view_date
        """).fetchall()
        
        conn.close()
        
        if not views:
            return {'current_streak': 0, 'longest_streak': 0, 'total_days': 0}
        
        dates = [datetime.strptime(view['view_date'], '%Y-%m-%d').date() for view in views]
        
        # Calculate streaks
        current_streak = 0
        longest_streak = 0
        temp_streak = 1
        
        today = datetime.now().date()
        
        # Check for current streak
        if dates and (today - dates[-1]).days <= 1:
            current_streak = 1
            for i in range(len(dates) - 2, -1, -1):
                if (dates[i + 1] - dates[i]).days == 1:
                    current_streak += 1
                else:
                    break
        
        # Find longest streak
        for i in range(1, len(dates)):
            if (dates[i] - dates[i - 1]).days == 1:
                temp_streak += 1
                longest_streak = max(longest_streak, temp_streak)
            else:
                temp_streak = 1
        
        longest_streak = max(longest_streak, temp_streak)
        
        return {
            'current_streak': current_streak,
            'longest_streak': longest_streak,
            'total_viewing_days': len(dates),
            'consistency_score': round((len(dates) / ((dates[-1] - dates[0]).days + 1)) * 100, 1) if len(dates) > 1 else 0
        }


def get_time_series_service(db_path: str = 'reeltracker.db') -> TimeSeriesService:
    """Get time series service instance."""
    return TimeSeriesService(db_path)