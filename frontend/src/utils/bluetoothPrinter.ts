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

  // Customer Name directly under date
  const customerName = transaction.customer_name || 'Pelanggan';
  pushText(customerName + '\n');

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

  // 5. Footer (Maturnuwun & Doa Berkah)
  pushBytes(0x1B, 0x61, 0x01); // Center
  pushBytes(0x1B, 0x45, 0x01); // Bold on
  pushText('Maturnuwun\n');
  pushBytes(0x1B, 0x45, 0x00); // Bold off
  pushText('Semoga Kita Selalu Diberi\nKesehatan, Rejekinya Lancar\nDan Umur Yang Barokah\n\n\n\n');

  // Feed lines
  pushBytes(0x1D, 0x56, 0x01); // Feed

  return new Uint8Array(buffer);
}

// Global cached connection so user only pairs once
let cachedDevice: any = null;
let cachedWriteChar: any = null;

const SUPPORTED_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000e0ff-0000-1000-8000-00805f9b34fb',
  '0000ae00-0000-1000-8000-00805f9b34fb',
  '00001800-0000-1000-8000-00805f9b34fb',
  '00001801-0000-1000-8000-00805f9b34fb'
];

/**
 * Get current connected/remembered printer name
 */
export function getSavedPrinterName(): string | null {
  if (cachedDevice && cachedDevice.name) {
    return cachedDevice.name;
  }
  return localStorage.getItem('last_paired_printer_name');
}

/**
 * Forget remembered printer (Ganti Printer)
 */
export function forgetPrinter(): void {
  try {
    if (cachedDevice && cachedDevice.gatt && cachedDevice.gatt.connected) {
      cachedDevice.gatt.disconnect();
    }
  } catch {}
  cachedDevice = null;
  cachedWriteChar = null;
  localStorage.removeItem('last_paired_printer_name');
}

/**
 * Find writable characteristic in GATT Server
 */
async function findWritableCharacteristic(server: any): Promise<any> {
  const services = await server.getPrimaryServices();
  for (const service of services) {
    try {
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          return char;
        }
      }
    } catch {
      // continue checking other services
    }
  }
  return null;
}

/**
 * Connect to device and get write characteristic
 */
async function connectToDevice(device: any): Promise<any> {
  let server = device.gatt;
  if (!server.connected) {
    server = await device.gatt.connect();
  }
  const char = await findWritableCharacteristic(server);
  if (char) {
    cachedDevice = device;
    cachedWriteChar = char;
    if (device.name) {
      localStorage.setItem('last_paired_printer_name', device.name);
    }
    return char;
  }
  return null;
}

/**
 * Print directly to Bluetooth Thermal Printer using Web Bluetooth API.
 * Automatically remembers and reconnects to previously paired printer without prompting again!
 */
export async function printDirectBluetooth(
  transaction: Transaction,
  forceNewPairing = false
): Promise<{ success: boolean; message: string; printerName?: string }> {
  if (!navigator || !(navigator as any).bluetooth) {
    return {
      success: false,
      message: 'Browser ini belum mendukung Web Bluetooth. Gunakan Google Chrome di Android/PC.'
    };
  }

  const bluetooth = (navigator as any).bluetooth;

  try {
    let writeChar = cachedWriteChar;

    // 1. Try reusing active cached connection
    if (!forceNewPairing && cachedDevice && cachedDevice.gatt) {
      try {
        if (cachedDevice.gatt.connected && writeChar) {
          // Connection is active and ready
        } else {
          // Reconnect to remembered device silently (no popup!)
          writeChar = await connectToDevice(cachedDevice);
        }
      } catch {
        writeChar = null;
      }
    }

    // 2. Try retrieving already permitted devices from browser (Chrome getDevices)
    if (!writeChar && !forceNewPairing && bluetooth.getDevices) {
      try {
        const permittedDevices = await bluetooth.getDevices();
        if (permittedDevices && permittedDevices.length > 0) {
          const lastUsedName = localStorage.getItem('last_paired_printer_name');
          const targetDevice = (lastUsedName && permittedDevices.find((d: any) => d.name === lastUsedName)) || permittedDevices[0];
          if (targetDevice) {
            writeChar = await connectToDevice(targetDevice);
          }
        }
      } catch {
        writeChar = null;
      }
    }

    // 3. If no active connection or user explicitly clicked "Ganti Printer", request pairing dialog
    if (!writeChar || forceNewPairing) {
      const device = await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: SUPPORTED_SERVICES
      });

      if (!device || !device.gatt) {
        return { success: false, message: 'Printer Bluetooth tidak dipilih.' };
      }

      writeChar = await connectToDevice(device);
    }

    if (!writeChar) {
      return {
        success: false,
        message: 'Tidak dapat menemukan jalur kirim data ke printer Bluetooth.'
      };
    }

    // 4. Generate binary ESC/POS data and send
    const data = generateEscPosReceipt(transaction);
    const CHUNK_SIZE = 128; // safe packet size for Bluetooth LE

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      if (writeChar.writeValueWithResponse) {
        await writeChar.writeValueWithResponse(chunk);
      } else {
        await writeChar.writeValue(chunk);
      }
    }

    // Keep connection alive for instant next print!
    const printerName = cachedDevice?.name || 'Printer Bluetooth';
    return {
      success: true,
      message: `Struk berhasil dicetak ke ${printerName}!`,
      printerName
    };
  } catch (err: any) {
    if (err.name === 'NotFoundError' || err.message?.includes('User cancelled')) {
      return { success: false, message: 'Pemilihan printer Bluetooth dibatalkan.' };
    }
    // If error, reset cached writeChar so next attempt can recover
    cachedWriteChar = null;
    return {
      success: false,
      message: err.message || 'Gagal mengirim data ke printer Bluetooth.'
    };
  }
}
