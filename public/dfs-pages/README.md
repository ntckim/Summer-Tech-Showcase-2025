# Algorithm Concept Pages Layout System

This directory contains HTML concept pages for algorithm visualization. All pages use a shared layout system for consistency and maintainability.

## File Structure

- `shared-styles.css` - Common styles for all concept pages
- `*.html` - Individual concept pages using the shared layout

## Creating New Concept Pages

To create a new concept page:

1. **Start with the basic structure:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Algorithm Name</title>
    <link rel="stylesheet" href="shared-styles.css">
</head>
<body>
    <h1>Your Algorithm Title</h1>
    
    <!-- Content sections here -->
    
</body>
</html>
```

2. **Use semantic sections with CSS classes:**

- `.section` - Basic content section
- `.key-points` - Key characteristics (green accent)
- `.applications` - Common applications (blue accent)  
- `.algorithm-steps` - Step-by-step algorithms (orange accent)
- `.complexity-table` - Time/space complexity (gray background)

3. **Example section structure:**
```html
<div class="section key-points">
    <h2>Key Characteristics</h2>
    <ul>
        <li><strong>Feature:</strong> Description</li>
    </ul>
</div>
```

## Styling Features

- Responsive design for mobile devices
- Consistent typography and spacing
- Color-coded sections for different content types
- Syntax highlighting for code blocks
- Professional color scheme matching the app

## Adding to React App

Update `src/pages/AlgorithmVis/AlgorithmVis.jsx` concepts array:

```javascript
const concepts = [
    { id: "your-id", name: "Display Name", file: "your-file.html" },
    // ...
];
```
