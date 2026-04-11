# Patient Dashboard Theming - Quick Reference

## What Changed?

### ✅ Automatic Theming (No Action Required)
All patient pages now automatically use the themed layout with:
- Aurora animated background (blue/purple gradient)
- PillNav navigation with smooth animations
- Glass morphism container effects
- Dark theme color scheme

**Affected Pages** (automatically themed):
- Patient Dashboard
- Appointments
- Prescriptions
- Medications
- Medical Records
- Orders
- Find Doctors
- Profile
- Medication Schedule
- Pharmacy Order

### 🎨 How It Works

The `DashboardLayout` component now detects the user role:

```jsx
// In DashboardLayout.jsx
if (user?.role === 'patient') {
  return <PatientLayout>{children}</PatientLayout>;
}
// Otherwise, use traditional sidebar layout
```

This means **zero changes needed** to existing patient pages!

## Color Scheme Reference

### Before (Light Theme)
```jsx
// Text
text-gray-900  // Primary text
text-gray-700  // Secondary text
text-gray-600  // Muted text

// Backgrounds
bg-gray-50     // Card background
bg-gray-100    // Hover state
bg-white       // Main background

// Borders
border-gray-200
```

### After (Dark Theme with Glass)
```jsx
// Text
text-white     // Primary text
text-gray-300  // Secondary text
text-gray-400  // Muted text

// Backgrounds
bg-white/5     // Card background (glass effect)
bg-white/10    // Hover state
bg-transparent // Main background (Aurora shows through)

// Borders
border-white/10
```

## Component Mapping

### Standard Card → BorderGlow

**Before:**
```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

**After:**
```jsx
<BorderGlow glowColor="220 60 40">
  <div className="p-6">
    <h3 className="text-xl font-semibold text-white mb-4">
      Title
    </h3>
    <div>
      Content here
    </div>
  </div>
</BorderGlow>
```

### Using ThemedCard (Adaptive)

**Recommended for new components:**
```jsx
import { ThemedCard, ThemedCardHeader, ThemedCardTitle, ThemedCardContent } from '@/components/ui/ThemedCard';

<ThemedCard glowColor="220 60 40">
  <ThemedCardHeader>
    <ThemedCardTitle>Title</ThemedCardTitle>
  </ThemedCardHeader>
  <ThemedCardContent>
    Content here
  </ThemedCardContent>
</ThemedCard>
```

This automatically uses BorderGlow for patients and Card for other roles!

## BorderGlow Colors

Different hue values for variety:

```jsx
<BorderGlow glowColor="220 80 80">  // Blue
<BorderGlow glowColor="160 80 80">  // Emerald/Green
<BorderGlow glowColor="280 80 80">  // Purple
<BorderGlow glowColor="45 80 80">   // Yellow/Orange
<BorderGlow glowColor="0 80 80">    // Red
<BorderGlow glowColor="200 60 40">  // Softer blue
```

Format: `"hue saturation lightness"` (HSL without the `hsl()` wrapper)

## Button Styling

### Outline Buttons (for dark theme)
```jsx
<Button 
  variant="outline" 
  size="sm" 
  className="bg-white/5 border-white/20 text-white hover:bg-white/20"
>
  View All
</Button>
```

### Primary Buttons
```jsx
<Button className="bg-blue-500 hover:bg-blue-600">
  Submit
</Button>
```

## Icon Colors

Match icons to the theme:

```jsx
// Patient theme icons
<Calendar className="h-6 w-6 text-blue-400" />
<FileText className="h-6 w-6 text-emerald-400" />
<Pill className="h-6 w-6 text-purple-400" />
<Bell className="h-6 w-6 text-yellow-400" />
<Activity className="h-5 w-5 text-blue-400" />
<AlertCircle className="h-12 w-12 text-rose-400" />
```

## Common Patterns

### Metric Card
```jsx
<BorderGlow glowColor="220 80 80">
  <div className="p-6 h-full flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-400">Label</p>
        <p className="text-3xl font-bold text-white mt-1">123</p>
      </div>
      <div className="p-3 bg-white/5 rounded-full ring-1 ring-white/10">
        <Icon className="h-6 w-6 text-blue-400" />
      </div>
    </div>
  </div>
</BorderGlow>
```

### List Item
```jsx
<div className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
  <div className="flex items-center justify-between">
    <div>
      <p className="font-medium text-white">Title</p>
      <p className="text-sm text-gray-300">Subtitle</p>
    </div>
    <Icon className="h-5 w-5 text-blue-400" />
  </div>
</div>
```

### Section with Header
```jsx
<BorderGlow glowColor="200 80 80" className="w-full">
  <div className="p-6">
    <h3 className="flex items-center gap-2 text-xl font-semibold text-white mb-4">
      <Icon className="h-5 w-5 text-blue-400" />
      Section Title
    </h3>
    <p className="text-gray-300 leading-relaxed">
      Content here
    </p>
  </div>
</BorderGlow>
```

### Empty State
```jsx
<div className="h-full flex items-center justify-center p-8">
  <p className="text-gray-400">No items found</p>
</div>
```

## Loading States

```jsx
<PatientLayout>
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
  </div>
</PatientLayout>
```

## Error States

```jsx
<PatientLayout>
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
      <p className="text-gray-300">{error}</p>
      <Button onClick={retry} className="mt-4 bg-blue-500 hover:bg-blue-600">
        Retry
      </Button>
    </div>
  </div>
</PatientLayout>
```

## Navigation Links

```jsx
import { Link } from 'react-router-dom';

<Link to="/patient/appointments">
  <Button variant="outline" size="sm" className="bg-white/5 border-white/20 text-white hover:bg-white/20">
    View All
  </Button>
</Link>
```

## Responsive Grid

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Cards here */}
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Two-column layout */}
</div>
```

## Animation Classes

```jsx
// Fade in on mount
<div className="space-y-6 animate-in fade-in duration-500">

// Transition on hover
<div className="transition hover:bg-white/10">

// Smooth transitions
<div className="transition-all duration-200">
```

## Status Colors (from utils)

The `getStatusColor()` function returns appropriate classes:

```jsx
<span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
  {status}
</span>
```

Works with: pending, confirmed, completed, cancelled, etc.

## Testing Your Changes

1. **Visual Check**: Does it match the pharmacy dashboard style?
2. **Functionality Check**: Do all buttons and links work?
3. **Responsive Check**: Test on mobile, tablet, desktop
4. **Dark Theme Check**: All text readable on dark background?
5. **Glass Effects Check**: Backdrop blur working?
6. **Animation Check**: Smooth transitions and hover effects?

## Common Issues & Solutions

### Issue: Text not visible
**Solution**: Change `text-gray-900` to `text-white`

### Issue: Card looks flat
**Solution**: Use `BorderGlow` instead of `Card`

### Issue: Button hard to see
**Solution**: Add `bg-white/5 border-white/20 text-white hover:bg-white/20`

### Issue: Icons blend into background
**Solution**: Use bright colors like `text-blue-400`, `text-emerald-400`

### Issue: Layout broken
**Solution**: Check that you're using `PatientLayout` not `DashboardLayout`

## Need Help?

Check these files for examples:
- `Web/src/pages/patient/PatientDashboard.jsx` - Fully themed example
- `Web/src/pages/pharmacy/PharmacyDashboard.jsx` - Reference implementation
- `Web/src/components/layout/PatientLayout.jsx` - Layout structure
- `Web/src/components/ui/ThemedCard.jsx` - Adaptive component

## Summary

**For existing pages**: No changes needed! Theming is automatic.

**For new features**: Use `ThemedCard` components or follow the patterns above.

**For full theming**: Replace `Card` with `BorderGlow` and update colors.

The key principle: **Separation of styling from logic**. All business logic remains unchanged, only visual presentation is enhanced.
