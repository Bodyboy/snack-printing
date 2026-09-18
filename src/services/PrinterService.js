import { PermissionsAndroid, Platform } from 'react-native';
import {
  BluetoothManager,
  BluetoothEscposPrinter,
} from '@vardrz/react-native-bluetooth-escpos-printer';

/**
 * This POC only connects to printers previously paired in Android settings.
 * The printer library still calls cancelDiscovery() while connecting, which
 * requires both CONNECT and SCAN on Android 12+.
 */
export async function requestBluetoothPermissions() {
  if (Platform.OS !== 'android' || Platform.Version < 31) return true;
  const results = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
  ]);
  return (
    results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
    results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED
  );
}

export async function ensureBluetoothEnabled() {
  const enabled = await BluetoothManager.isBluetoothEnabled();
  if (enabled) return true;
  try {
    await BluetoothManager.enableBluetooth();
    return true;
  } catch {
    return false;
  }
}

export async function listAvailableDevices() {
  const permitted = await requestBluetoothPermissions();
  if (!permitted) throw new Error('PERMISSION_DENIED');

  const bluetoothOn = await ensureBluetoothEnabled();
  if (!bluetoothOn) throw new Error('BLUETOOTH_DISABLED');

  const rawPaired = await BluetoothManager.enableBluetooth();
  return (rawPaired || []).map((entry) => {
    const printer = typeof entry === 'string' ? JSON.parse(entry) : entry;
    return { name: printer.name || 'Imprimante inconnue', address: printer.address };
  });
}

// Kept as the screen-level API name. It deliberately does not discover nearby devices.
export async function scanForDevices() {
  return { paired: await listAvailableDevices(), found: [] };
}

export async function connectToDevice(address) {
  const permitted = await requestBluetoothPermissions();
  if (!permitted) throw new Error('PERMISSION_DENIED');
  await BluetoothManager.connect(address);
}

export async function disconnectDevice(address) {
  try {
    await BluetoothManager.disconnect(address);
  } catch {
    // Safe: it may already be disconnected.
  }
}

export async function sendToPrinter(printSteps) {
  await BluetoothEscposPrinter.printerInit();

  for (const step of printSteps) {
    switch (step.type) {
      case 'text':
        await BluetoothEscposPrinter.printText(step.value, step.options || {});
        break;
      case 'column':
        await BluetoothEscposPrinter.printColumn(
          step.widths,
          step.aligns,
          step.values,
          step.options || {}
        );
        break;
      case 'divider':
        await BluetoothEscposPrinter.printText('--------------------------------\n', {});
        break;
      case 'feed':
        await BluetoothEscposPrinter.printText('\n'.repeat(step.lines || 1), {});
        break;
      case 'cut':
        await BluetoothEscposPrinter.cutOnePoint();
        break;
      default:
        break;
    }
  }
}
