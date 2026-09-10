import { Transaction } from '../types';

/**
 * ESC/POS Helper to format a two-column line for 58mm printer (32 characters per line)
 */
function formatTwoColumns(left: string, right: string, maxLen = 32): string {
  const leftTrimmed = left.slice(0, maxLen - right.length - 1);
  const spaceCount = Math.max(1, maxLen - leftTrimmed.length - right.length);
  return leftTrimmed + ' '.repeat(spaceCount) + right + '\n';
}

function formatRupiahSimple(num: number): string {
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

/**
 * Generate binary ESC/POS commands for 58mm thermal receipt
 */
export function generateEscPosReceipt(transaction: Transaction): Uint8Array {
  const encoder = new TextEncoder();
  const buffer: number[] = [];

  // Helper to push bytes
  const pushBytes = (...bytes: number[]) => buffer.push(...bytes);
  const pushText = (text: string) => {
    const encoded = encoder.encode(text);
    for (let i = 0; i < encoded.length; i++) {
      buffer.push(encoded[i]);
    }
  };

  // 1. Initialize printer
  pushBytes(0x1B, 0x40); // ESC @ (Initialize)

  // 2. Center Align & Header "Ino Yummy" (Double Size)
  pushBytes(0x1B, 0x61, 0x01); // ESC a 1 (Center)
  pushBytes(0x1B, 0x21, 0x30); // Double height & width
  pushText('Ino Yummy\n');

  // Reset font size
  pushBytes(0x1B, 0x21, 0x00); // Normal font
  const dateStr = transaction.created_at
    ? new Date(transaction.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
    : new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
  pushText(dateStr + '\n');

  // Dotted divider (32 chars for 58mm)
  pushText('--------------------------------\n');

  // 3. Items list (Left Align)
  pushBytes(0x1B, 0x61, 0x00); // ESC a 0 (Left align)
  if (transaction.items && transaction.items.length > 0) {
    for (const item of transaction.items) {
      const priceStr = formatRupiahSimple(item.subtotal);
      pushBytes(0x1B, 0x45, 0x01); // Bold on
      pushText(formatTwoColumns(item.product_name, priceStr, 32));
      pushBytes(0x1B, 0x45, 0x00); // Bold off
      pushText(`  ${item.quantity} x ${formatRupiahSimple(item.price)}\n`);
    }
  }

  // Divider
  pushText('--------------------------------\n');

  // 4. Totals
  pushBytes(0x1B, 0x45, 0x01); // Bold on
  pushText(formatTwoColumns('TOTAL', formatRupiahSimple(transaction.total_amount), 32));
  pushBytes(0x1B, 0x45, 0x00); // Bold off

  pushText(formatTwoColumns('Tunai', formatRupiahSimple(transaction.cash_paid), 32));

  pushBytes(0x1B, 0x45, 0x01); // Bold on
  pushText(formatTwoColumns('Kembalian', formatRupiahSimple(transaction.change_amount), 32));
  pushBytes(0x1B, 0x45, 0x00); // Bold off

  // Divider
  pushText('--------------------------------\n');

  // 5. Footer & Paper Feed
  pushBytes(0x1B, 0x61, 0x01); // Center
  pushText('Terima kasih atas\nkunjungan Anda!\n\n\n\n');

  // Optional cut command
  pushBytes(0x1D, 0x56, 0x01); // GS V 1 (Partial cut / feed)

  return new Uint8Array(buffer);
}

/**
 * Print directly to Bluetooth Thermal Printer using Web Bluetooth API
 */
export async function printDirectBluetooth(transaction: Transaction): Promise<{ success: boolean; message: string }> {
  if (!navigator || !(navigator as any).bluetooth) {
    return {
      success: false,
      message: 'Browser ini belum mendukung Web Bluetooth. Gunakan Google Chrome di Android/PC atau gunakan tombol Cetak Browser.'
    };
  }

  try {
    const bluetooth = (navigator as any).bluetooth;

    // Common standard services for 58mm / 80mm Bluetooth ESC/POS printers
    const device = await bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        '0000ff00-0000-1000-8000-00805f9b34fb',
        '0000e0ff-0000-1000-8000-00805f9b34fb',
        '0000ae00-0000-1000-8000-00805f9b34fb',
        '00001800-0000-1000-8000-00805f9b34fb',
        '00001801-0000-1000-8000-00805f9b34fb'
      ]
    });

    if (!device || !device.gatt) {
      return { success: false, message: 'Printer Bluetooth tidak dipilih.' };
    }

    const server = await device.gatt.connect();

    // Generate binary ESC/POS data
    const data = generateEscPosReceipt(transaction);

    // Find writable characteristic in all available services
    const services = await server.getPrimaryServices();
    let writeChar: any = null;

    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeChar = char;
            break;
          }
        }
        if (writeChar) break;
      } catch {
        // continue search
      }
    }

    if (!writeChar) {
      return {
        success: false,
        message: 'Karakteristik cetak printer tidak ditemukan pada perangkat Bluetooth ini.'
      };
    }

    // Send in chunks (max 128-512 bytes per packet for Bluetooth LE reliability)
    const CHUNK_SIZE = 128;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      if (writeChar.writeValueWithResponse) {
        await writeChar.writeValueWithResponse(chunk);
      } else {
        await writeChar.writeValue(chunk);
      }
    }

    // Disconnect cleanly after print
    setTimeout(() => {
      try {
        if (device.gatt.connected) device.gatt.disconnect();
      } catch {}
    }, 1000);

    return { success: true, message: 'Struk berhasil dicetak ke printer Bluetooth!' };
  } catch (err: any) {
    if (err.name === 'NotFoundError' || err.message?.includes('User cancelled')) {
      return { success: false, message: 'Pemilihan printer Bluetooth dibatalkan.' };
    }
    return {
      success: false,
      message: err.message || 'Gagal mengirim data ke printer Bluetooth.'
    };
  }
}
