"""TMDB API integration service for MovieHive.

Implements rate limiting, caching, and error handling for movie data.
"""

import os
import json
import time
import requests
from functools import wraps
from typing import Dict, List, Optional, Any


class TMDBService:
    """Service for interacting with The Movie Database API."""
    
    BASE_URL = "https://api.themoviedb.org/3"
    IMAGE_BASE_URL = "https://image.tmdb.org/t/p"
    
    def __init__(self):
        self.api_key = os.environ.get('TMDB_API_KEY')
        self.access_token = os.environ.get('TMDB_ACCESS_TOKEN')
        
        if not self.api_key and not self.access_token:
            raise ValueError("TMDB_API_KEY or TMDB_ACCESS_TOKEN environment variable required")
        
        # Rate limiting configuration
        self.rate_limit = 35  # Conservative limit (TMDB allows ~40/sec)
        self.last_request_time = 0
        self.request_count = 0
        self.rate_window_start = time.time()
        
        # Simple in-memory cache
        self.cache = {}
        self.cache_durations = {
            'search': 300,      # 5 minutes
            'movie': 3600,      # 1 hour
            'popular': 1800,    # 30 minutes
            'config': 86400     # 24 hours
        }
    
    def _enforce_rate_limit(self):
        """Enforce rate limiting to prevent API quota exhaustion."""
        current_time = time.time()
        
        # Reset counter every minute
        if current_time - self.rate_window_start > 60:
            self.request_count = 0
            self.rate_window_start = current_time
        
        # Check if we need to wait
        if self.request_count >= self.rate_limit:
            sleep_time = 60 - (current_time - self.rate_window_start)
            if sleep_time > 0:
                time.sleep(sleep_time)
                self.request_count = 0
                self.rate_window_start = time.time()
        
        # Ensure minimum time between requests
        time_since_last = current_time - self.last_request_time
        if time_since_last < 0.03:  # 30ms minimum
            time.sleep(0.03 - time_since_last)
        
        self.last_request_time = time.time()
        self.request_count += 1
    
    def _get_cached_or_fetch(self, cache_key: str, cache_type: str, fetch_func) -> Any:
        """Get data from cache or fetch if expired."""
        # Check cache
        if cache_key in self.cache:
            data, timestamp = self.cache[cache_key]
            if time.time() - timestamp < self.cache_durations[cache_type]:
                return data
        
        # Fetch new data
        data = fetch_func()
        if data:
            self.cache[cache_key] = (data, time.time())
        
        return data
    
    def _make_request(self, endpoint: str, params: Dict = None) -> Optional[Dict]:
        """Make API request with rate limiting and error handling."""
        self._enforce_rate_limit()
        
        url = f"{self.BASE_URL}/{endpoint}"
        headers = {}
        request_params = {}
        
        # Use API key (preferred for v3 API), fall back to Bearer token
        if self.api_key:
            request_params["api_key"] = self.api_key
        elif self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        if params:
            request_params.update(params)
        
        try:
            response = requests.get(url, params=request_params, headers=headers, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"TMDB API error for {endpoint}: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response status: {e.response.status_code}")
                print(f"Response text: {e.response.text[:200]}")
            return None
    
    def search_movies(self, query: str, page: int = 1) -> Dict:
        """Search for movies by title."""
        cache_key = f"search:{query}:{page}"
        
        def fetch():
            return self._make_request("search/movie", {
                "query": query,
                "page": page,
                "include_adult": False
            })
        
        result = self._get_cached_or_fetch(cache_key, 'search', fetch)
        return result or {"results": [], "total_results": 0}
    
    def get_movie_details(self, movie_id: int) -> Optional[Dict]:
        """Get detailed information for a specific movie."""
        cache_key = f"movie:{movie_id}"
        
        def fetch():
            return self._make_request(f"movie/{movie_id}")
        
        return self._get_cached_or_fetch(cache_key, 'movie', fetch)
    
    def get_popular_movies(self, page: int = 1) -> Dict:
        """Get list of popular movies."""
        cache_key = f"popular:{page}"
        
        def fetch():
            return self._make_request("movie/popular", {"page": page})
        
        result = self._get_cached_or_fetch(cache_key, 'popular', fetch)
        return result or {"results": []}
    
    def get_configuration(self) -> Dict:
        """Get API configuration for image URLs."""
        cache_key = "config"
        
        def fetch():
            return self._make_request("configuration")
        
        result = self._get_cached_or_fetch(cache_key, 'config', fetch)
        return result or {"images": {"base_url": self.IMAGE_BASE_URL}}
    
    def get_poster_url(self, poster_path: str, size: str = "w500") -> str:
        """Generate full poster URL from poster path."""
        if not poster_path:
            return ""
        
        config = self.get_configuration()
        base_url = config.get("images", {}).get("base_url", self.IMAGE_BASE_URL)
        return f"{base_url}/{size}{poster_path}"
    
    def enrich_movie_data(self, movie_data: Dict) -> Dict:
        """Enrich basic movie data with additional details."""
        if not movie_data or 'id' not in movie_data:
            return movie_data
        
        details = self.get_movie_details(movie_data['id'])
        if not details:
            return movie_data
        
        # Merge data, preserving original structure
        enriched = movie_data.copy()
        enriched.update({
            'runtime': details.get('runtime'),
            'genres': [g['name'] for g in details.get('genres', [])],
            'director': self._extract_director(details.get('credits', {})),
            'budget': details.get('budget'),
            'revenue': details.get('revenue'),
            'imdb_id': details.get('imdb_id'),
            'tagline': details.get('tagline'),
            'homepage': details.get('homepage')
        })
        
        return enriched
    
    def _extract_director(self, credits: Dict) -> str:
        """Extract director name from credits."""
        crew = credits.get('crew', [])
        directors = [person['name'] for person in crew if person.get('job') == 'Director']
        return ', '.join(directors[:2])  # Maximum 2 directors


# Global service instance
tmdb_service = None

def get_tmdb_service() -> TMDBService:
    """Get or create TMDB service instance."""
    global tmdb_service
    if tmdb_service is None:
        try:
            tmdb_service = TMDBService()
        except ValueError as e:
            print(f"Warning: {e}. TMDB features disabled.")
            tmdb_service = MockTMDBService()
    
    return tmdb_service


class MockTMDBService:
    """Mock service for development when API key not available."""
    
    def search_movies(self, query: str, page: int = 1) -> Dict:
        """Return mock search results."""
        return {
            "results": [
                {
                    "id": 1,
                    "title": f"Mock Movie for '{query}'",
                    "release_date": "2024-01-01",
                    "overview": "This is a mock movie for development purposes.",
                    "poster_path": None,
                    "vote_average": 7.5
                }
            ],
            "total_results": 1
        }
    
    def get_movie_details(self, movie_id: int) -> Dict:
        """Return mock movie details."""
        return {
            "id": movie_id,
            "title": f"Mock Movie {movie_id}",
            "release_date": "2024-01-01",
            "overview": "Mock movie for development.",
            "runtime": 120,
            "genres": ["Drama", "Comedy"],
            "vote_average": 7.5,
            "poster_path": None
        }
    
    def get_popular_movies(self, page: int = 1) -> Dict:
        """Return mock popular movies."""
        return {
            "results": [
                {
                    "id": i,
                    "title": f"Popular Movie {i}",
                    "release_date": "2024-01-01",
                    "overview": f"Popular mock movie {i}",
                    "vote_average": 8.0 - i * 0.1
                }
                for i in range(1, 21)
            ]
        }
    
    def get_poster_url(self, poster_path: str, size: str = "w500") -> str:
        """Return placeholder poster URL."""
        return ""
    
    def enrich_movie_data(self, movie_data: Dict) -> Dict:
        """Return data as-is for mock service."""
        return movie_data
    
    def get_configuration(self) -> Dict:
        """Return mock configuration."""
        return {"images": {"base_url": "https://via.placeholder.com"}}