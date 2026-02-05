// be/src/kiosk/utils/badge-pdf.ts

/* eslint-disable @typescript-eslint/no-var-requires */
import * as QRCode from 'qrcode';

const PDFDocument = require('pdfkit');
const sharp = require('sharp');

export type BadgePdfInput = {
  badge_code: string;
  full_name: string;
  host_name: string;
  reason_for_visit: string;
  timestamp: string;
  photo_data_url?: string; // data:image/...;base64,...
};

function dataUrlToBuffer(dataUrl: string): Buffer {
  const m = dataUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
  if (!m) throw new Error('photo must be a base64 data URL (data:image/...;base64,...)');
  return Buffer.from(m[2], 'base64');
}

/**
 * Landscape badge PDF intended for DYMO 2x4 rolls.
 *
 * Env overrides:
 * - BADGE_WIDTH_IN  (default 4.0)
 * - BADGE_HEIGHT_IN (default 2.125)  // you can try 2.25 if your stock is that
 * - BADGE_OFFSET_X_PT (default 0)
 * - BADGE_OFFSET_Y_PT (default 0)
 * - BADGE_DEBUG_BORDER=true  // draws an outline of the PDF page for calibration
 */
export async function buildBadgePdf(input: BadgePdfInput): Promise<Buffer> {
  const widthIn = Number(process.env.BADGE_WIDTH_IN ?? 4.0);
  const heightIn = Number(process.env.BADGE_HEIGHT_IN ?? 2.125);

  const W = widthIn * 72;
  const H = heightIn * 72;

  const offX = Number(process.env.BADGE_OFFSET_X_PT ?? 0);
  const offY = Number(process.env.BADGE_OFFSET_Y_PT ?? 0);
  const debugBorder = String(process.env.BADGE_DEBUG_BORDER ?? '').toLowerCase() === 'true';

  const ox = (x: number) => x + offX;
  const oy = (y: number) => y + offY;

  const doc = new PDFDocument({ size: [W, H], margin: 0 });
  const chunks: Buffer[] = [];

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // Background
  doc.rect(ox(0), oy(0), W, H).fill('#FFFFFF');

  // Optional: show the REAL PDF boundary (helps prove driver paper-size issues)
  if (debugBorder) {
    doc.save();
    doc.lineWidth(0.5).dash(2, { space: 2 }).rect(ox(1), oy(1), W - 2, H - 2).stroke('#999999');
    doc.undash();
    doc.restore();
  }

  // Top bar
  const barH = 18;
  doc.rect(ox(0), oy(0), W, barH).fill('#000000');
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(12).text('VISITOR', ox(0), oy(3), {
    width: W,
    align: 'center',
  });

  // Layout
  const margin = 6;
  const gap = 8;

  const contentTop = barH + 4;
  const contentBottom = H - 6;
  const contentH = contentBottom - contentTop;

  // Ensure the middle text column NEVER becomes tiny:
  // we enforce a minimum mid column width and shrink boxes if needed.
  const minMidW = 130; // ~1.8"
  const maxBoxByHeight = Math.min(contentH, 90); // good size for 2x4 without choking
  const maxBoxByWidth = Math.floor((W - (margin * 2) - (gap * 2) - minMidW) / 2);
  const box = Math.max(64, Math.min(maxBoxByHeight, maxBoxByWidth)); // clamp

  const boxY = contentTop + Math.max(0, (contentH - box) / 2);
  const photoX = margin;
  const qrX = W - margin - box;
  const midX = photoX + box + gap;
  const midW = Math.max(minMidW, qrX - gap - midX);

  // Photo frame
  doc.lineWidth(1).rect(ox(photoX - 1), oy(boxY - 1), box + 2, box + 2).stroke('#000000');

  if (input.photo_data_url) {
    const raw = dataUrlToBuffer(input.photo_data_url);

    // Thermal-friendly image processing (crisper than plain grayscale)
    const photoPng = await sharp(raw)
      .resize(520, 520, { fit: 'cover' })
      .grayscale()
      .normalize()
      .sharpen(1.2)
      .threshold(175) // makes faces/text pop on thermal
      .png()
      .toBuffer();

    doc.image(photoPng, ox(photoX), oy(boxY), { width: box, height: box });
  } else {
    doc.fillColor('#000000').font('Helvetica').fontSize(9).text('NO PHOTO', ox(photoX), oy(boxY + box / 2 - 5), {
      width: box,
      align: 'center',
    });
  }

  // QR frame
  doc.lineWidth(1).rect(ox(qrX - 1), oy(boxY - 1), box + 2, box + 2).stroke('#000000');

  const qrPng = await QRCode.toBuffer(input.badge_code, {
    type: 'png',
    margin: 0,
    errorCorrectionLevel: 'M',
    width: 520,
  });

  doc.image(qrPng, ox(qrX), oy(boxY), { width: box, height: box });

  // Text block
  let y = contentTop + 2;

  doc.fillColor('#000000')
    .font('Helvetica-Bold')
    .fontSize(18)
    .text(input.full_name ?? '', ox(midX), oy(y), { width: midW, ellipsis: true });
  y += 22;

  doc.font('Helvetica').fontSize(10).text(input.timestamp ?? '', ox(midX), oy(y), { width: midW, ellipsis: true });
  y += 14;

  doc.font('Helvetica-Bold').fontSize(10).text('Visiting:', ox(midX), oy(y), { width: midW });
  y += 12;

  doc.font('Helvetica').fontSize(12).text(input.host_name || 'WALK-IN', ox(midX), oy(y), {
    width: midW,
    ellipsis: true,
  });
  y += 16;

  doc.font('Helvetica-Bold').fontSize(10).text('Reason:', ox(midX), oy(y), { width: midW });
  y += 12;

  doc.font('Helvetica').fontSize(10).text(input.reason_for_visit ?? '', ox(midX), oy(y), {
    width: midW,
    height: Math.max(0, contentBottom - y - 10),
    ellipsis: true,
  });

  // Badge code bottom-right
  doc.font('Helvetica').fontSize(8).fillColor('#000000');
  doc.text(`Badge: ${input.badge_code}`, ox(margin), oy(H - 12), { width: W - margin * 2, align: 'right' });

  doc.end();
  return done;
}
