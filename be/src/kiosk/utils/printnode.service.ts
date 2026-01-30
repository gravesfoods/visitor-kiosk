// be/src/kiosk/utils/printnode.service.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

@Injectable()
export class PrintNodeService {
  constructor(private cfg: ConfigService) {}

  async printPdfBuffer(pdf: Buffer, title: string) {
    const apiKey = this.cfg.get<string>('PRINTNODE_API_KEY');
    const printerId = Number(this.cfg.get<string>('PRINTNODE_PRINTER_ID'));

    if (!apiKey) throw new Error('PRINTNODE_API_KEY is not set');
    if (!printerId || Number.isNaN(printerId)) throw new Error('PRINTNODE_PRINTER_ID is not set');

    try {
      const payload = {
        printerId,
        title,
        contentType: 'pdf_base64',
        content: pdf.toString('base64'),
        source: 'visitor-kiosk',
      };

      const res = await axios.post('https://api.printnode.com/printjobs', payload, {
        auth: { username: apiKey, password: '' },
        timeout: 15000,
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
