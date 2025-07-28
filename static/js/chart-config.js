/**
 * Chart.js configuration for MovieHive statistics
 * Minimalist design following Tufte's principles
 */

(function() {
    'use strict';
    
    // Chart.js default configuration
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    Chart.defaults.font.size = 14;
    Chart.defaults.color = '#6b7280';
    Chart.defaults.borderColor = '#e5e7eb';
    Chart.defaults.backgroundColor = 'rgba(100, 116, 139, 0.1)';
    
    // Global chart options following Tufte principles
    const tufteChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false // Remove decorative legends
            },
            tooltip: {
                backgroundColor: '#111827',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderWidth: 0,
                cornerRadius: 4,
                displayColors: false, // Remove color boxes
                titleFont: {
                    weight: 600
                }
            }
        },
        elements: {
            bar: {
                borderRadius: 4,
                borderWidth: 0
            },
            line: {
                borderWidth: 2,
                tension: 0 // Sharp lines, no unnecessary curves
            },
            point: {
                radius: 4,
                hoverRadius: 6,
                borderWidth: 0
            }
        },
        scales: {
            x: {
                grid: {
                    display: false // Remove vertical grid lines (chartjunk)
                },
                ticks: {
                    color: '#6b7280',
                    font: {
                        size: 14
                    }
                },
                border: {
                    color: '#e5e7eb'
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: '#e5e7eb',
                    lineWidth: 1
                },
                ticks: {
                    color: '#6b7280',
                    font: {
                        size: 14
                    },
                    precision: 0 // Whole numbers only
                },
                border: {
                    color: '#e5e7eb'
                }
            }
        },
        interaction: {
            intersect: false,
            mode: 'index'
        },
        animation: {
            duration: 300 // Quick, subtle animations
        }
    };
    
    /**
     * Create rating distribution chart
     */
    function createRatingChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['0-1', '2-3', '4-5', '6-7', '8-10'],
                datasets: [{
                    label: 'Movies',
                    data: data || [0, 0, 0, 0, 0],
                    backgroundColor: '#64748b',
                    borderColor: '#64748b',
                    borderWidth: 0
                }]
            },
            options: {
                ...tufteChartOptions,
                plugins: {
                    ...tufteChartOptions.plugins,
                    title: {
                        display: false // Title in HTML, not chart
                    }
                },
                scales: {
                    ...tufteChartOptions.scales,
                    y: {
                        ...tufteChartOptions.scales.y,
                        title: {
                            display: true,
                            text: 'Number of Movies',
                            color: '#6b7280',
                            font: {
                                size: 14,
                                weight: 600
                            }
                        }
                    },
                    x: {
                        ...tufteChartOptions.scales.x,
                        title: {
                            display: true,
                            text: 'Rating Range',
                            color: '#6b7280',
                            font: {
                                size: 14,
                                weight: 600
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create genre distribution chart
     */
    function createGenreChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        return new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels || [],
                datasets: [{
                    data: data.values || [],
                    backgroundColor: [
                        '#64748b',
                        '#94a3b8',
                        '#cbd5e1',
                        '#e2e8f0',
                        '#f1f5f9'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                ...tufteChartOptions,
                cutout: '50%', // Doughnut hole
                plugins: {
                    ...tufteChartOptions.plugins,
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 16,
                            font: {
                                size: 14
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Create watch history timeline
     */
    function createTimelineChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'Movies Watched',
                    data: data.values || [],
                    borderColor: '#64748b',
                    backgroundColor: 'rgba(100, 116, 139, 0.1)',
                    fill: true,
                    tension: 0
                }]
            },
            options: {
                ...tufteChartOptions,
                scales: {
                    ...tufteChartOptions.scales,
                    x: {
                        ...tufteChartOptions.scales.x,
                        type: 'time',
                        time: {
                            unit: 'month'
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Utility function to generate rating distribution from raw data
     */
    function processRatingData(ratings) {
        const bins = [0, 0, 0, 0, 0]; // 0-1, 2-3, 4-5, 6-7, 8-10
        
        ratings.forEach(rating => {
            const r = parseFloat(rating);
            if (r <= 1) bins[0]++;
            else if (r <= 3) bins[1]++;
            else if (r <= 5) bins[2]++;
            else if (r <= 7) bins[3]++;
            else bins[4]++;
        });
        
        return bins;
    }
    
    /**
     * Responsive chart handling
     */
    function handleResponsiveCharts() {
        const charts = Chart.instances;
        
        window.addEventListener('resize', debounce(() => {
            Object.values(charts).forEach(chart => {
                chart.resize();
            });
        }, 250));
    }
    
    /**
     * Debounce utility function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Accessibility enhancements for charts
     */
    function enhanceChartAccessibility() {
        const charts = document.querySelectorAll('canvas[role="img"]');
        
        charts.forEach(canvas => {
            // Add keyboard navigation
            canvas.setAttribute('tabindex', '0');
            
            // Add data table alternative
            const dataTable = createDataTable(canvas);
            if (dataTable) {
                canvas.parentNode.appendChild(dataTable);
            }
        });
    }
    
    /**
     * Create accessible data table for chart
     */
    function createDataTable(canvas) {
        const chartInstance = Chart.getChart(canvas);
        if (!chartInstance) return null;
        
        const data = chartInstance.data;
        const table = document.createElement('table');
        table.className = 'chart-data-table sr-only';
        table.setAttribute('aria-label', 'Chart data in table format');
        
        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const labelHeader = document.createElement('th');
        labelHeader.textContent = 'Category';
        headerRow.appendChild(labelHeader);
        
        data.datasets.forEach(dataset => {
            const th = document.createElement('th');
            th.textContent = dataset.label || 'Value';
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        
        data.labels.forEach((label, index) => {
            const row = document.createElement('tr');
            
            const labelCell = document.createElement('td');
            labelCell.textContent = label;
            row.appendChild(labelCell);
            
            data.datasets.forEach(dataset => {
                const cell = document.createElement('td');
                cell.textContent = dataset.data[index] || 0;
                row.appendChild(cell);
            });
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        return table;
    }
    
    // Expose functions globally for use in templates
    window.MovieHiveCharts = {
        createRatingChart,
        createGenreChart,
        createTimelineChart,
        processRatingData,
        tufteChartOptions
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            handleResponsiveCharts();
            enhanceChartAccessibility();
        });
    } else {
        handleResponsiveCharts();
        enhanceChartAccessibility();
    }
    
})();