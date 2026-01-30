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

export async function buildBadgePdf(input: BadgePdfInput): Promise<Buffer> {
  // Defaults for "2x4" rolls in DYMO-world are often 2.125" x 4"
  const widthIn = Number(process.env.BADGE_WIDTH_IN ?? 2.125);
  const heightIn = Number(process.env.BADGE_HEIGHT_IN ?? 4.0);
  const W = widthIn * 72;
  const H = heightIn * 72;

  const doc = new PDFDocument({ size: [W, H], margin: 0 });
  const chunks: Buffer[] = [];

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  // Background
  doc.rect(0, 0, W, H).fill('#FFFFFF');

  // Top bar: VISITOR
  doc.rect(0, 0, W, 26).fill('#000000');
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(14).text('VISITOR', 0, 6, {
    width: W,
    align: 'center',
  });

  // Name
  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(16).text(input.full_name ?? '', 8, 32, {
    width: W - 16,
    align: 'center',
    ellipsis: true,
  });

  // Timestamp (small)
  doc.font('Helvetica').fontSize(9).text(input.timestamp ?? '', 8, 52, {
    width: W - 16,
    align: 'center',
    ellipsis: true,
  });

  // Photo box + QR box
  const topY = 66;
  const box = 86;
  const margin = 8;

  const photoX = margin;
  const qrX = W - margin - box;

  // Photo
  doc.rect(photoX - 1, topY - 1, box + 2, box + 2).stroke('#000000');

  if (input.photo_data_url) {
    const raw = dataUrlToBuffer(input.photo_data_url);

    // thermal-friendly: grayscale + normalize contrast
    const photoPng = await sharp(raw)
      .resize(360, 360, { fit: 'cover' })
      .grayscale()
      .normalize()
      .png()
      .toBuffer();

    doc.image(photoPng, photoX, topY, { width: box, height: box });
  } else {
    doc.font('Helvetica').fontSize(8).text('NO PHOTO', photoX, topY + box / 2 - 4, {
      width: box,
      align: 'center',
    });
  }

  // QR (badge_code)
  doc.rect(qrX - 1, topY - 1, box + 2, box + 2).stroke('#000000');
  const qrPng = await QRCode.toBuffer(input.badge_code, {
    type: 'png',
    margin: 1,
    errorCorrectionLevel: 'M',
    scale: 6,
  });
  doc.image(qrPng, qrX, topY, { width: box, height: box });

  // Middle text: host + reason
  const textY = topY + box + 8;

  doc.font('Helvetica-Bold').fontSize(10).text('Visiting:', 10, textY, {
    width: W - 20,
    align: 'left',
  });
  doc.font('Helvetica').fontSize(11).text(input.host_name || 'WALK-IN', 10, textY + 12, {
    width: W - 20,
    align: 'left',
    ellipsis: true,
  });

  doc.font('Helvetica-Bold').fontSize(10).text('Reason:', 10, textY + 28, {
    width: W - 20,
    align: 'left',
  });
  doc.font('Helvetica').fontSize(10).text(input.reason_for_visit ?? '', 10, textY + 40, {
    width: W - 20,
    align: 'left',
    ellipsis: true,
  });

  // Bottom: badge code (tiny)
  doc.font('Helvetica').fontSize(7).fillColor('#000000');
  doc.text(`Badge: ${input.badge_code}`, 10, H - 12, { width: W - 20, align: 'right' });

  doc.end();
  return done;
}
