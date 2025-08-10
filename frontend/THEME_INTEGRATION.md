# Tailwind CSS + Material-UI Integration

This project successfully integrates Tailwind CSS with Material-UI for a hybrid modern UI approach.

## Features Implemented

### 1. Material-UI Components Installed
- `@mui/material` - Core Material-UI components
- `@mui/icons-material` - Material Design icons
- `@emotion/react` - Emotion CSS-in-JS library (required by MUI)
- `@emotion/styled` - Styled components with Emotion

### 2. Tailwind CSS Configuration
- Extended `tailwind.config.ts` to include Roboto font family from MUI
- Configured dark mode using `class` strategy for integration with MUI ThemeProvider
- Added content paths for proper Tailwind compilation

### 3. Theme System
- **ThemeContextProvider** (`src/contexts/ThemeContext.tsx`): 
  - Manages both MUI theme and Tailwind dark mode classes
  - Persists theme preference in localStorage
  - Respects system color scheme preference
  - Provides `useTheme` hook for components

- **Theme Toggle Component** (`src/components/ThemeToggle.tsx`):
  - Material-UI IconButton with Tailwind styling
  - Uses MUI icons (Brightness4/Brightness7)
  - Smooth transitions and hover effects

### 4. Hybrid Styling Approach

#### Material-UI for Components
```jsx
import { Button, Card, Typography } from '@mui/material'

<Button variant="contained" size="large">
  MUI Button
</Button>
```

#### Tailwind for Layout & Utilities
```jsx
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
  <Container className="pt-20 pb-10">
    // Content
  </Container>
</div>
```

#### Combined Approach
```jsx
<Card className="flex-1 shadow-lg hover:shadow-xl transition-shadow">
  <CardContent className="p-6">
    <Typography variant="h5" className="font-semibold mb-3">
      Title with MUI variant and Tailwind utilities
    </Typography>
  </CardContent>
</Card>
```

## How It Works

1. **Layout Level**: The `ThemeContextProvider` wraps the entire app in `layout.tsx`
2. **Theme Sync**: When theme changes:
   - MUI ThemeProvider updates Material-UI component colors
   - Document class toggles between light/dark for Tailwind utilities
   - Changes persist in localStorage

3. **Font Integration**: 
   - Roboto font loaded from Google Fonts
   - Configured in both Tailwind config and MUI theme
   - Fallbacks to Geist fonts and system fonts

## Benefits

- **Best of Both Worlds**: MUI's robust components + Tailwind's utility-first approach
- **Consistent Theming**: Synchronized light/dark modes across both systems
- **Developer Experience**: Fast styling with Tailwind utilities, polished components from MUI
- **Performance**: Tree-shaking and optimized builds from both libraries

## Usage Examples

### Using the Theme Hook
```jsx
import { useTheme } from '../contexts/ThemeContext'

function MyComponent() {
  const { mode, toggleTheme } = useTheme()
  
  return (
    <div className={`p-4 ${mode === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      <Button onClick={toggleTheme}>
        Switch to {mode === 'light' ? 'dark' : 'light'} mode
      </Button>
    </div>
  )
}
```

### Responsive Design with Both Systems
```jsx
<Stack 
  direction={{ xs: 'column', md: 'row' }} // MUI responsive props
  className="gap-4 p-6 sm:p-8 lg:p-12" // Tailwind responsive classes
>
  <Card className="flex-1 hover:shadow-xl transition-shadow">
    <CardContent>
      <Typography variant="h6" className="text-gray-800 dark:text-gray-200">
        Hybrid styling approach
      </Typography>
    </CardContent>
  </Card>
</Stack>
```
