# Organization Logos Configuration

This guide explains how to replace the placeholder organization logos with your actual organization logos using base64 encoded images.

## Quick Start

1. Navigate to `src/config/organizationLogos.ts`
2. Replace the `image` property with your base64 encoded logo
3. Update the `name`, `alt`, and `website` properties as needed

## How to Convert Your Logo to Base64

### Option 1: Online Converter (Recommended)
1. Go to [base64-image.de](https://www.base64-image.de/) or [base64encode.org](https://www.base64encode.org/)
2. Upload your logo image (PNG, JPG, SVG recommended)
3. Copy the generated base64 string
4. Paste it into the configuration file

### Option 2: Command Line (Advanced)
```bash
# For macOS/Linux
base64 -i your-logo.png

# For Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("your-logo.png"))
```

## Configuration Format

```typescript
{
  id: 'unique-id',           // Unique identifier for the organization
  name: 'Organization Name', // Display name (used for tooltips)
  image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...', // Base64 string
  alt: 'Logo Alt Text',      // Alt text for accessibility
  website: 'https://org.com' // Optional: website URL (makes logo clickable)
}
```

## Example Replacement

Replace this placeholder:
```typescript
{
  id: 'org1',
  name: 'TechCorp Solutions',
  image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIw...',
  alt: 'TechCorp Solutions Logo',
  website: 'https://techcorp.example.com'
}
```

With your actual organization:
```typescript
{
  id: 'university1',
  name: 'Caraga State University',
  image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEA...',
  alt: 'Caraga State University Logo',
  website: 'https://carsu.edu.ph'
}
```

## Adding More Organizations

To add more than 2 organizations, simply add more objects to the array:

```typescript
export const organizationLogos: OrganizationLogo[] = [
  // ... existing organizations
  {
    id: 'org3',
    name: 'Third Organization',
    image: 'data:image/png;base64,YOUR_BASE64_HERE',
    alt: 'Third Organization Logo',
    website: 'https://thirdorg.com'
  },
  {
    id: 'org4',
    name: 'Fourth Organization',
    image: 'data:image/png;base64,YOUR_BASE64_HERE',
    alt: 'Fourth Organization Logo'
    // website is optional - omit if you don't want a clickable logo
  }
]
```

## Best Practices

### Image Specifications
- **Format**: PNG or SVG preferred for transparency
- **Size**: Optimal width: 120-200px, height: 40-60px
- **File Size**: Keep under 50KB for best performance
- **Background**: Transparent background recommended

### Design Considerations
- Logos should work well on light backgrounds
- Ensure good contrast and readability
- Test logos at different screen sizes
- Consider how logos look when grayed out (opacity: 0.6)

## Responsive Behavior

The logos automatically adapt to different screen sizes:
- **Desktop**: Full size with hover effects
- **Tablet**: Slightly smaller with maintained spacing
- **Mobile**: Stacked vertically if needed

## Troubleshooting

### Logo not showing?
- Check that the base64 string is complete and properly formatted
- Ensure the string starts with `data:image/[type];base64,`
- Verify there are no line breaks in the base64 string

### Logo too large/small?
- The CSS automatically sizes logos to `h-12` (48px height)
- Width adjusts proportionally
- For different sizes, modify the `className` in `LandingPage.tsx`

### Performance issues?
- Compress images before converting to base64
- Consider using WebP format for better compression
- Limit to 2-4 organization logos for optimal loading

## File Location

- Configuration: `src/config/organizationLogos.ts`
- Component: `src/components/LandingPage.tsx` (line ~320)
- This guide: `LOGO_MANAGEMENT.md`
