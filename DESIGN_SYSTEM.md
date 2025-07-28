# MovieHive Design System

## Overview
MovieHive follows Edward Tufte's information design principles with a focus on maximizing data-ink ratio and eliminating chartjunk. The design prioritizes accessibility, mobile-first responsive design, and cognitive load reduction.

## Design Philosophy

### Core Principles
1. **Data-Ink Ratio Maximization** - Every visual element serves a functional purpose
2. **Information Density** - Efficient use of space with strategic grouping
3. **Academic Neutrality** - Professional, scannable content without marketing language
4. **Accessibility First** - WCAG 2.1 AA compliance throughout
5. **Mobile-First** - Touch-friendly design with 44px+ touch targets

## Color System

### Primary Palette
- **Primary**: `#64748b` (slate-500) - Links, actions, interactive elements
- **Accent**: `#f97316` (orange-500) - Warnings, highlights (use sparingly)
- **Text Primary**: `#111827` - Main content text
- **Text Secondary**: `#6b7280` - Meta information, captions
- **Background Primary**: `#ffffff` - Main background
- **Background Subtle**: `#f3f4f6` - Cards, sections
- **Border**: `#e5e7eb` - Minimal separation lines
- **Error**: `#dc2626` - Error states
- **Success**: `#059669` - Success states

### Usage Guidelines
- Maximum 3 colors per interface
- Use primary color for all interactive elements
- Accent color only for warnings and secondary actions
- Semantic colors (error/success) used sparingly

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Scale
- **Small**: 14px - Meta information, captions
- **Base**: 16px - Body text, form inputs
- **Large**: 18px (desktop) - Emphasized text
- **Heading**: 24px - Section headings (H2, H3)
- **Title**: 28px (mobile), 32px (desktop) - Page titles (H1)

### Weights
- **Normal**: 400 - All body text
- **Semibold**: 600 - Headings, emphasis

### Line Heights
- **Text**: 1.5 - Optimal readability
- **Headings**: 1.2 - Compact for hierarchy

## Spacing System

Mathematical progression using 4px base unit:
- **XS**: 4px
- **S**: 8px
- **M**: 12px
- **L**: 16px
- **XL**: 24px
- **2XL**: 32px
- **3XL**: 48px

## Components

### Navigation
- **Mobile**: Vertical stacked with touch-friendly targets
- **Desktop**: Horizontal with minimal styling
- Clear current page indication
- Focus indicators for accessibility

### Forms
- Labels above inputs (never beside)
- Essential fields only
- 44px minimum touch targets on mobile
- Clear focus indicators
- Progressive disclosure for complex forms

### Tables
- **Mobile**: Stacked layout with data labels
- **Desktop**: Traditional table with zebra striping
- Tabular numerals for numbers
- Right-aligned numeric data

### Buttons
- Primary actions use brand color
- Secondary actions use subtle styling
- 44px minimum touch targets
- Clear focus states

### Cards/Movies
- Minimal borders
- Strategic whitespace for grouping
- Essential information only
- Clear hierarchy

## Responsive Design

### Breakpoints
- **Mobile**: < 768px (design baseline)
- **Desktop**: ≥ 768px
- **Large**: ≥ 1024px

### Mobile-First Approach
1. Design for mobile constraints first
2. Progressive enhancement for larger screens
3. Touch-friendly interactions
4. No horizontal scrolling (except tables)

### Touch Targets
- **Minimum**: 44px (WCAG requirement)
- **Preferred**: 48px
- Adequate spacing between targets
- Clear visual feedback

## Accessibility

### WCAG 2.1 AA Compliance
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible
- **Screen Readers**: Semantic HTML, ARIA labels
- **Focus Management**: Clear indicators, logical order

### Features
- Skip links for main content
- Proper heading hierarchy
- Alt text for images
- Form labels and descriptions
- Error identification and suggestions

### JavaScript Enhancements
- Progressive enhancement
- Graceful degradation
- Reduced motion support
- Announcement regions for dynamic content

## Data Visualization

### Chart.js Configuration
Following Tufte's principles:
- No decorative legends
- Minimal grid lines
- Subtle colors from brand palette
- Clear data-to-ink ratio
- Accessible alternatives (data tables)

### Chart Types
- **Bar Charts**: Rating distributions
- **Line Charts**: Timeline data
- **Minimal styling**: Function over form

## Performance

### Optimization
- Minimal CSS (< 20KB)
- System fonts (no web fonts)
- Efficient JavaScript
- Optimized images
- Critical CSS inlined

### Metrics Targets
- **Page Load**: < 3 seconds
- **First Contentful Paint**: < 1.5 seconds
- **Lighthouse Score**: > 90 all categories

## Browser Support

### Modern Browsers
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with CSS Grid support

### Graceful Degradation
- CSS Grid with flexbox fallback
- Progressive enhancement for advanced features
- Core functionality without JavaScript

## File Structure

```
static/
├── css/
│   └── moviehive.css          # Main stylesheet
└── js/
    ├── accessibility.js       # WCAG enhancements
    └── chart-config.js        # Visualization config

templates/
├── base.html                  # Base template
├── index.html                 # Home page
├── search.html                # Search interface
├── movie_detail.html          # Movie details
├── watchlist.html             # User watchlist
└── stats.html                 # Statistics page
```

## Usage Guidelines

### CSS Custom Properties
Use the defined custom properties for consistency:
```css
color: var(--text-primary);
background: var(--bg-subtle);
padding: var(--space-l);
```

### Component Classes
- `.movie` - Movie card styling
- `.meta` - Secondary information
- `.rating` - Rating display
- `.stats-grid` - Statistics layout
- `.sr-only` - Screen reader only content

### Anti-Patterns to Avoid
- Centered text blocks
- Decorative icons without purpose
- Multiple font families
- Colorful buttons for navigation
- Small touch targets on mobile
- Horizontal scrolling on mobile

## Testing

### Accessibility Testing
- axe-core automated scans
- Manual keyboard navigation
- Screen reader testing (NVDA, VoiceOver)
- Color contrast validation

### Responsive Testing
- Chrome DevTools device simulation
- Real device testing matrix
- Touch interaction validation
- Performance on mobile devices

### Visual Testing
- Cross-browser compatibility
- High contrast mode
- Dark mode (system preference)
- Print styles

## Future Enhancements

### Potential Additions
- Dark mode toggle (user preference)
- Reduced motion toggle
- Font size preferences
- High contrast mode override
- Internationalization support

### Performance Monitoring
- Core Web Vitals tracking
- Accessibility regression testing
- Mobile performance monitoring
- User experience metrics

---

This design system ensures MovieHive maintains consistency, accessibility, and performance while following established design principles and modern web standards.