class WeatherApp {
    constructor() {
        // Get API key from environment or use placeholder
        this.API_KEY = this.getAPIKey();
        this.BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
        
        // Cache DOM elements
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.retryBtn = document.getElementById('retryBtn');
        this.themeToggle = document.getElementById('themeToggle');
        
        // State elements
        this.loadingState = document.getElementById('loadingState');
        this.errorState = document.getElementById('errorState');
        this.placeholderState = document.getElementById('placeholderState');
        this.weatherResults = document.getElementById('weatherResults');
        
        // Error elements
        this.errorTitle = document.getElementById('errorTitle');
        this.errorMessage = document.getElementById('errorMessage');
        
        // Weather data elements
        this.locationName = document.getElementById('locationName');
        this.locationCountry = document.getElementById('locationCountry');
        this.weatherIcon = document.getElementById('weatherIcon');
        this.temperature = document.getElementById('temperature');
        this.weatherCondition = document.getElementById('weatherCondition');
        this.feelsLike = document.getElementById('feelsLike');
        this.humidity = document.getElementById('humidity');
        this.windSpeed = document.getElementById('windSpeed');
        
        // Current search query for retry functionality
        this.currentQuery = '';
        
        // Theme management
        this.isDarkMode = this.loadThemePreference();
        
        this.init();
    }
    
    /**
     * Get API configuration
     */
    getAPIKey() {
        // Use the provided API key
        return "fcc8de7015bbb202209bbf0261babf4c";
    }
    
    /**
     * Load theme preference from localStorage
     */
    loadThemePreference() {
        return localStorage.getItem('weatherAppTheme') === 'dark';
    }
    
    /**
     * Save theme preference to localStorage
     */
    saveThemePreference() {
        localStorage.setItem('weatherAppTheme', this.isDarkMode ? 'dark' : 'light');
    }
    
    /**
     * Initialize the application
     */
    init() {
        this.bindEvents();
        this.applyTheme();
        this.showPlaceholder();
    }
    
    /**
     * Apply current theme
     */
    applyTheme() {
        const body = document.body;
        if (this.isDarkMode) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
        }
    }
    
    /**
     * Toggle theme mode
     */
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        this.saveThemePreference();
    }
    
    /**
     * Set background based on weather condition
     */
    setWeatherBackground(weatherMain) {
        const body = document.body;
        const weatherType = weatherMain.toLowerCase();
        
        // Remove previous weather data attributes
        body.removeAttribute('data-weather');
        
        // Set new weather background
        if (weatherType.includes('clear')) {
            body.setAttribute('data-weather', 'clear');
        } else if (weatherType.includes('cloud')) {
            body.setAttribute('data-weather', 'clouds');
        } else if (weatherType.includes('rain') || weatherType.includes('drizzle')) {
            body.setAttribute('data-weather', 'rain');
        } else if (weatherType.includes('snow')) {
            body.setAttribute('data-weather', 'snow');
        } else if (weatherType.includes('thunder')) {
            body.setAttribute('data-weather', 'thunderstorm');
        } else {
            body.setAttribute('data-weather', 'default');
        }
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Search button click
        this.searchBtn.addEventListener('click', () => {
            this.handleSearch();
        });
        
        // Enter key on search input
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        
        // Theme toggle click
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Retry button click
        this.retryBtn.addEventListener('click', () => {
            if (this.currentQuery) {
                this.searchWeather(this.currentQuery);
            }
        });
        
        // Input focus behavior
        this.searchInput.addEventListener('focus', () => {
            this.searchInput.select();
        });
    }
    
    /**
     * Handle search action
     */
    handleSearch() {
        const query = this.searchInput.value.trim();
        
        if (!query) {
            this.showError('Please enter a city name', 'Empty search query');
            return;
        }
        
        this.currentQuery = query;
        this.searchWeather(query);
    }
    
    /**
     * Search for weather data
     */
    async searchWeather(query) {
        this.showLoading();
        
        try {
            const url = `${this.BASE_URL}?q=${encodeURIComponent(query)}&appid=${this.API_KEY}&units=metric`;
            console.log('Making API request to:', url.replace(this.API_KEY, 'API_KEY_HIDDEN'));
            
            const response = await fetch(url);
            console.log('API Response status:', response.status);
            
            const data = await response.json();
            console.log('API Response data:', data);
            
            if (!response.ok) {
                this.handleAPIError(data, response.status);
                return;
            }
            
            // Validate that we have the expected data structure
            if (!data.main || !data.weather || !data.weather[0]) {
                throw new Error('Invalid weather data structure received from API');
            }
            
            this.displayWeatherData(data);
            
        } catch (error) {
            console.error('Weather API Error:', error);
            this.handleFetchError(error);
        }
    }
    
    /**
     * Handle API errors
     */
    handleAPIError(data, status) {
        let message = 'Something went wrong. Please try again.';
        
        switch (status) {
            case 401:
                message = 'Invalid API key. Please check your OpenWeatherMap API key configuration.';
                break;
            case 404:
                message = `We couldn't find weather data for "${this.currentQuery}". Please check the spelling and try again.`;
                break;
            case 429:
                message = 'Too many requests. Please wait a moment and try again.';
                break;
            case 500:
            case 502:
            case 503:
                message = 'The weather service is temporarily unavailable. Please try again later.';
                break;
            default:
                if (data.message) {
                    message = data.message;
                }
        }
        
        this.showToast(message, 'error');
        this.showPlaceholder();
    }
    
    /**
     * Handle fetch/network errors
     */
    handleFetchError(error) {
        let message = 'Please check your internet connection and try again.';
        
        if (error.message.includes('API key')) {
            message = error.message;
        } else if (error.name === 'TypeError') {
            message = 'Unable to connect to the weather service. Please check your internet connection.';
        }
        
        this.showToast(message, 'error');
        this.showPlaceholder();
    }
    
    /**
     * Display weather data with enhanced animations
     */
    displayWeatherData(data) {
        try {
            // Set dynamic background based on weather
            this.setWeatherBackground(data.weather[0].main);
            
            // Add smooth transition delay between updates
            setTimeout(() => {
                // Location information with animation
                this.animateTextUpdate(this.locationName, data.name);
                this.animateTextUpdate(this.locationCountry, data.sys.country);
                
                // Weather icon with enhanced animation
                const iconCode = data.weather[0].icon;
                this.weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
                this.weatherIcon.alt = data.weather[0].description;
                
                // Temperature with counting animation
                this.animateTemperature(Math.round(data.main.temp));
                this.animateTextUpdate(this.feelsLike, `Feels like ${Math.round(data.main.feels_like)}°C`);
                
                // Weather condition
                this.animateTextUpdate(this.weatherCondition, data.weather[0].description);
                
                // Weather details with staggered animation
                setTimeout(() => {
                    this.animateTextUpdate(this.humidity, `${data.main.humidity}%`);
                }, 100);
                
                setTimeout(() => {
                    this.animateTextUpdate(this.windSpeed, `${Math.round(data.wind.speed * 3.6)} km/h`);
                }, 200);
                
                // Show results with smooth transition
                this.showWeatherResults();
            }, 300);
            
        } catch (error) {
            console.error('Error displaying weather data:', error);
            this.showToast('Error displaying weather information. Please try again.', 'error');
        }
    }
    
    /**
     * Animate text updates
     */
    animateTextUpdate(element, newText) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            element.textContent = newText;
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 150);
    }
    
    /**
     * Animate temperature with counting effect
     */
    animateTemperature(targetTemp) {
        const currentTemp = parseInt(this.temperature.textContent) || 0;
        const increment = targetTemp > currentTemp ? 1 : -1;
        let currentValue = currentTemp;
        
        const countingInterval = setInterval(() => {
            if (currentValue === targetTemp) {
                clearInterval(countingInterval);
                return;
            }
            
            currentValue += increment;
            this.temperature.textContent = currentValue;
        }, 50);
    }
    
    /**
     * Show toast notification for errors
     */
    showToast(message, type = 'error') {
        // Remove existing toasts
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        this.hideAllStates();
        this.loadingState.classList.remove('hidden');
    }
    
    /**
     * Show error state
     */
    showError(message, title = 'Error') {
        this.hideAllStates();
        this.errorTitle.textContent = title;
        this.errorMessage.textContent = message;
        this.errorState.classList.remove('hidden');
    }
    
    /**
     * Show placeholder state
     */
    showPlaceholder() {
        this.hideAllStates();
        this.placeholderState.classList.remove('hidden');
    }
    
    /**
     * Show weather results
     */
    showWeatherResults() {
        this.hideAllStates();
        this.weatherResults.classList.remove('hidden');
    }
    
    /**
     * Hide all state elements
     */
    hideAllStates() {
        this.loadingState.classList.add('hidden');
        this.errorState.classList.add('hidden');
        this.placeholderState.classList.add('hidden');
        this.weatherResults.classList.add('hidden');
    }
}

// Initialize the weather app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set API key from environment if available
    if (typeof process !== 'undefined' && process.env && process.env.OPENWEATHER_API_KEY) {
        window.OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
    }
    
    new WeatherApp();
});

// Handle API key from server-side if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherApp;
}
