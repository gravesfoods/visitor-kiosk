// be/src/kiosk/utils/printnode.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

function toBool(v: any): boolean | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes' || s === 'y') return true;
  if (s === 'false' || s === '0' || s === 'no' || s === 'n') return false;
  return undefined;
}

function toInt(v: any): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

@Injectable()
export class PrintNodeService {
  constructor(private cfg: ConfigService) {}

  async printPdfBuffer(pdf: Buffer, title: string) {
    const apiKey = this.cfg.get<string>('PRINTNODE_API_KEY');
    const printerId = Number(this.cfg.get<string>('PRINTNODE_PRINTER_ID'));

    if (!apiKey) throw new Error('PRINTNODE_API_KEY is not set');
    if (!printerId || Number.isNaN(printerId)) throw new Error('PRINTNODE_PRINTER_ID is not set');

    // Pull optional print settings from env
    const paper = this.cfg.get<string>('PRINTNODE_PAPER'); // e.g. "30256 Shipping"
    const dpi = this.cfg.get<string>('PRINTNODE_DPI');     // e.g. "300x300"
    const rotate = toInt(this.cfg.get<string>('PRINTNODE_ROTATE')); // 90/180/270
    const nup = toInt(this.cfg.get<string>('PRINTNODE_NUP'));       // 1,2,4,6...

    // NOTE: fit_to_page is valid in PrintNode options, but can cause “chuggy” behavior on some label drivers.
    // Keep it undefined unless you absolutely need it.
    const fitToPage = toBool(this.cfg.get<string>('PRINTNODE_FIT_TO_PAGE'));

    // Build options only with defined values
    const options: Record<string, any> = {
      // force sanity defaults that prevent “prints 6 labels” issues
      copies: 1,
      ...(paper ? { paper } : {}),
      ...(dpi ? { dpi } : {}),
      ...(typeof rotate === 'number' ? { rotate } : {}),
      ...(typeof nup === 'number' ? { nup } : {}),
      ...(typeof fitToPage === 'boolean' ? { fit_to_page: fitToPage } : {}),
    };

    try {
      const payload: any = {
        printerId,
        title,
        contentType: 'pdf_base64',
        content: pdf.toString('base64'),
        source: 'visitor-kiosk',
        options, // <<<<<< this is the missing piece
      };

      const res = await axios.post('https://api.printnode.com/printjobs', payload, {
        auth: { username: apiKey, password: '' },
        timeout: 20000,
        maxBodyLength: Infinity,
      });

      return res.data;
    } catch (err: any) {
      const ax = err as AxiosError<any>;
      const status = ax.response?.status;
      const data = ax.response?.data;

      const msg =
        (data && (data.message || data.error || data.detail)) ||
        ax.message ||
        'PrintNode request failed';

      throw new Error(status ? `PrintNode (${status}): ${msg}` : `PrintNode: ${msg}`);
    }
  }
}
