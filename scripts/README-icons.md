# Icon Generation Script

This script generates properly padded PWA icons for HuggingChat and ChatUI variants.

## Problem Solved

The original icons had minimal padding, causing them to appear too large when installed as Chrome apps on macOS. This script adds 20% padding around the logo to follow Apple's guidelines and best practices for PWA icons.

## Usage

To regenerate all icons with proper padding:

```bash
npx tsx scripts/generateIcons.ts
```

This will:
- Read the source SVG files from `static/huggingchat/icon.svg` and `static/chatui/icon.svg`
- Generate all required icon sizes (36x36, 48x48, 72x72, 96x96, 128x128, 144x144, 192x192, 256x256, 512x512)
- Generate Apple Touch Icons (180x180)
- Add 20% padding around the logo in each icon
- Save the icons to their respective directories

## Icon Sizes Generated

- **36x36** - Small favicon
- **48x48** - Standard favicon
- **72x72** - iPad non-retina
- **96x96** - Android devices
- **128x128** - Chrome Web Store
- **144x144** - Windows 8/10 tile
- **192x192** - Android Chrome (recommended)
- **256x256** - Windows 8/10 tile
- **512x512** - High-resolution displays
- **180x180** - Apple Touch Icon

## Technical Details

- **Padding**: 20% of the icon size on all sides
- **Background**: Black (#000000)
- **Format**: PNG with RGBA channels
- **Library**: Sharp (already in project dependencies)

## Related Files

- `static/huggingchat/manifest.json` - PWA manifest for HuggingChat
- `static/chatui/manifest.json` - PWA manifest for ChatUI
- `src/routes/+layout.svelte` - Links to manifest and icons

## References

- GitHub Issue: #1439
- Apple PWA Guidelines: https://developer.apple.com/design/human-interface-guidelines/app-icons
