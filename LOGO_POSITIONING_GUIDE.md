# Logo Positioning Guide

## Quick Setup for Manual Logo Alignment

If your logos aren't perfectly aligned due to different cropping/padding in the original images, you can manually adjust their positions.

### Step 1: Identify Which Logo Needs Adjustment
Look at your logos and identify which one needs to be moved. Usually one logo appears higher/lower or left/right compared to the other.

### Step 2: Add Positioning to That Logo

Edit `src/config/organizationLogos.ts` and add a `positioning` object to the specific logo that needs adjustment.

**Example - If your second logo needs to move up and left:**

```typescript
export const organizationLogos: OrganizationLogo[] = [
  getLogoFromEnv(
    1,
    'your-first-logo-base64...',
    'First Organization',
    'https://first-org.com'
  ),
  {
    ...getLogoFromEnv(
      2, 
      'your-second-logo-base64...',
      'Second Organization',
      'https://second-org.com'
    ),
    positioning: {
      transform: 'translateY(-5px) translateX(-3px)'  // Move up 5px, left 3px
    }
  }
]
```

### Step 3: Common Positioning Adjustments

**Move logo up:** `transform: 'translateY(-5px)'`
**Move logo down:** `transform: 'translateY(5px)'`
**Move logo left:** `transform: 'translateX(-5px)'`
**Move logo right:** `transform: 'translateX(5px)'`
**Combine movements:** `transform: 'translateY(-3px) translateX(2px)'`

**Using margins (affects spacing between logos):**
```typescript
positioning: {
  marginTop: '5px',    // Moves entire logo container down
  marginLeft: '10px'   // Moves entire logo container right
}
```

**Using padding (adds space inside the logo area):**
```typescript
positioning: {
  paddingTop: '3px',   // Adds space above the logo image
  paddingLeft: '5px'   // Adds space to the left of logo image
}
```

### Step 4: Fine-Tuning

Start with small values (1-3px) and adjust until logos are perfectly aligned:

1. **Save the file**
2. **Check your browser** (it will auto-reload)
3. **Adjust the pixel values** until alignment is perfect
4. **Use your browser's developer tools** to test values in real-time

### Step 5: Real-Time Testing (Advanced)

1. Open browser developer tools (F12)
2. Find the logo image element
3. Add CSS like `transform: translateY(-2px)` in the styles panel
4. When you find the perfect value, copy it to your config file

### Example for Your Current Setup

Since you have 2 logos, here's a template to adjust the second logo:

```typescript
// If your right logo needs to move up to align with the left logo
export const organizationLogos: OrganizationLogo[] = [
  getLogoFromEnv(1, ...), // First logo (leave as-is)
  {
    ...getLogoFromEnv(2, ...),  // Second logo
    positioning: {
      transform: 'translateY(-4px)'  // Adjust this value as needed
    }
  }
]
```

Just change the `-4px` value until the logos are perfectly aligned!
