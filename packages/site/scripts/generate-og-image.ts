import sharp from "sharp";
import { join } from "path";

const WIDTH = 1200;
const HEIGHT = 630;
const BG_COLOR = "#f5efe6";
const TEXT_COLOR = "#2d2a26";
const SUBTITLE_COLOR = "#6b5e50";

const LOGO_SIZE = 280;
const LOGO_Y = 80;

const publicDir = join(import.meta.dir, "..", "public");

async function generateOgImage() {
  // Load and resize the logo (icon.webp has transparent background)
  const logo = await sharp(join(publicDir, "icon.webp"))
    .resize(LOGO_SIZE, LOGO_SIZE, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const logoX = Math.round((WIDTH - LOGO_SIZE) / 2);

  // Title and subtitle as SVG text
  const title = "Locanara";
  const subtitle = "On-Device AI SDK for iOS and Android";

  const textY = LOGO_Y + LOGO_SIZE + 30;
  const subtitleY = textY + 55;

  const svgOverlay = Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@600;400');
      </style>
      <text x="${WIDTH / 2}" y="${textY}" text-anchor="middle"
            font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
            font-size="56" font-weight="700" fill="${TEXT_COLOR}">
        ${title}
      </text>
      <text x="${WIDTH / 2}" y="${subtitleY}" text-anchor="middle"
            font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
            font-size="24" font-weight="400" fill="${SUBTITLE_COLOR}">
        ${subtitle}
      </text>
    </svg>
  `);

  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([
      { input: logo, left: logoX, top: LOGO_Y },
      { input: svgOverlay, left: 0, top: 0 },
    ])
    .png({ quality: 90 })
    .toFile(join(publicDir, "og-image.png"));

  console.log(`Generated og-image.png (${WIDTH}x${HEIGHT})`);
}

generateOgImage().catch(console.error);
