import sharp from "sharp";
import { readFileSync } from "fs";
import { join } from "path";

const ICON_SIZES = [36, 48, 72, 96, 128, 144, 192, 256, 512];
const APPLE_TOUCH_ICON_SIZE = 180;
const PADDING_PERCENTAGE = 0.2; // 20% padding

async function generateIconWithPadding(
	svgContent: string,
	size: number,
	outputPath: string
): Promise<void> {
	// Calculate the actual logo size with padding
	const logoSize = Math.round(size * (1 - PADDING_PERCENTAGE * 2));
	const padding = Math.round((size - logoSize) / 2);

	// Create a canvas with the full size and black background
	const canvas = sharp({
		create: {
			width: size,
			height: size,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 1 },
		},
	});

	// Resize the SVG to the logo size
	const resizedLogo = await sharp(Buffer.from(svgContent))
		.resize(logoSize, logoSize, {
			fit: "contain",
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		})
		.png()
		.toBuffer();

	// Composite the logo onto the canvas with padding
	await canvas
		.composite([
			{
				input: resizedLogo,
				top: padding,
				left: padding,
			},
		])
		.png()
		.toFile(outputPath);

	console.log(`Generated: ${outputPath} (${size}x${size})`);
}

async function generateIconsForVariant(variant: string) {
	const svgPath = join(process.cwd(), "static", variant, "icon.svg");
	const outputDir = join(process.cwd(), "static", variant);

	console.log(`\n📁 Processing ${variant}...`);
	console.log("Reading source SVG...");
	const svgContent = readFileSync(svgPath, "utf-8");

	console.log("Generating icons with proper padding...");

	// Generate all standard icon sizes
	for (const size of ICON_SIZES) {
		const outputPath = join(outputDir, `icon-${size}x${size}.png`);
		await generateIconWithPadding(svgContent, size, outputPath);
	}

	// Generate Apple Touch Icon
	const appleTouchIconPath = join(outputDir, "apple-touch-icon.png");
	await generateIconWithPadding(svgContent, APPLE_TOUCH_ICON_SIZE, appleTouchIconPath);

	console.log(`✅ ${variant}: Generated ${ICON_SIZES.length + 1} icon files`);
}

async function main() {
	console.log("🎨 Generating icons with proper padding (20% margin)...");

	// Generate icons for both variants
	await generateIconsForVariant("huggingchat");
	await generateIconsForVariant("chatui");

	console.log("\n✅ All icons generated successfully!");
	console.log(`📦 Total: ${(ICON_SIZES.length + 1) * 2} icon files with 20% padding`);
}

main().catch((error) => {
	console.error("Error generating icons:", error);
	process.exit(1);
});
