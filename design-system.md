# Teamo Design System - Gray Cool Foundation

## Color Foundation

### Primary Gray Cool Palette
Based on the Gray Cool palette from /Users/gangjoon5/Downloads/palette.json:

- `#FCFCFD` (gray-cool-25) - Lightest background
- `#F9F9FB` (gray-cool-50) - Light background  
- `#EFF1F5` (gray-cool-100) - Hover states
- `#DCDFEA` (gray-cool-200) - Active states
- `#B9C0D4` (gray-cool-300) - Borders, subtle text
- `#7D89AF` (gray-cool-400) - Muted text
- `#5D6A97` (gray-cool-500) - Primary text
- `#4A5578` (gray-cool-600) - Bold text
- `#404968` (gray-cool-700) - Heading text
- `#30374E` (gray-cool-800) - Selected/active dark
- `#111322` (gray-cool-900) - Darkest text

### Accent Colors

#### Primary Action Blue (Sky palette)
For main action buttons like ADD TASK, Google Sign-in:
- Background: `#e0f2fe` (sky-100)
- Text: `#0369a1` (sky-700)
- Border: `#0284c7` (sky-600)
- Hover Background: `#bae6fd` (sky-200)
- Hover Border: `#0369a1` (sky-700)
- Active Background: `#93c5fd` (blue-300)
- Active Border: `#075985` (sky-900)

#### Status Colors (Muted, harmonious with Gray Cool)

**Not Yet (Pending) - Amber:**
- Background: `#fef3c7` (amber-100)
- Text: `#92400e` (amber-800)
- Border: `#d97706` (amber-600)
- Icon: Clock

**Doing (In Progress) - Blue:**
- Background: `#dbeafe` (blue-100)
- Text: `#1e40af` (blue-800)
- Border: `#2563eb` (blue-600)
- Icon: Play

**Complete - Emerald:**
- Background: `#d1fae5` (emerald-100)
- Text: `#065f46` (emerald-800)
- Border: `#059669` (emerald-600)
- Icon: Check

#### Secondary Controls
For dropdowns, filters, pagination (harmonious with Gray Cool):

**Violet (Cool tone):**
- Background: `#f3f4f6` (gray-100)
- Text: `#374151` (gray-700)
- Border: `#d1d5db` (gray-300)
- Hover: `#e5e7eb` (gray-200)

## Button Hierarchy

### 1. Primary Action Buttons (Colored)
For main actions like "ADD TASK", "Add Memo", "Google Sign-in":
```
Pattern: background + darker text + darker stroke
Colors: Sky palette (#e0f2fe, #0369a1, #7dd3fc)
```

### 2. Functional Buttons (Gray Cool)
For filters, navigation, secondary actions:
```
Pattern: background + darker text + darker stroke
Colors: Gray Cool palette (#F9F9FB, #5D6A97, #B9C0D4)
Selected: Dark Gray Cool (#30374E, white, #111322)
```

### 3. Status Badges
Muted colors that don't overpower the interface:
```
Not Yet: Amber muted (#fef3c7, #92400e, #d97706)
Doing: Blue muted (#dbeafe, #1e40af, #2563eb)  
Complete: Emerald muted (#d1fae5, #065f46, #059669)
```

## Implementation

All interactive elements follow the core pattern:
- Background color
- Darker text color
- Darker border/stroke color
- Progressive darkening on hover/active states

This creates visual depth while maintaining accessibility and consistency across the entire application.