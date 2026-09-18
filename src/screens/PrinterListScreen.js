import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { scanForDevices, connectToDevice, disconnectDevice } from '../services/PrinterService';
import { usePrinterStore } from '../store/usePrinterStore';

export default function PrinterListScreen({ navigation }) {
  const [paired, setPaired] = useState([]);
  const [loading, setLoading] = useState(false);
  const { connected, device, connecting, setConnecting, setConnected, setDisconnected, setError } = usePrinterStore();

  const refreshPairedPrinters = useCallback(async () => {
    setLoading(true);
    try {
      const { paired: devices } = await scanForDevices();
      setPaired(devices);
      if (devices.length === 0) {
        Alert.alert('Aucune imprimante appairée', "Appairez l'imprimante dans les réglages Bluetooth Android, puis actualisez cette liste.");
      }
    } catch (error) {
      const message = error?.message || String(error);
      if (message === 'PERMISSION_DENIED') Alert.alert('Permission refusée', "L'autorisation Bluetooth est nécessaire.");
      else if (message === 'BLUETOOTH_DISABLED') Alert.alert('Bluetooth désactivé', 'Activez le Bluetooth, puis réessayez.');
      else Alert.alert('Erreur Bluetooth', message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConnect = async (printer) => {
    setConnecting(true);
    try {
      await connectToDevice(printer.address);
      setConnected(printer);
      navigation.goBack();
    } catch (error) {
      setError(error?.message || String(error));
      Alert.alert('Connexion échouée', `Impossible de se connecter à ${printer.name}.`);
    }
  };

  const handleDisconnect = async () => {
    if (!device) return;
    await disconnectDevice(device.address);
    setDisconnected();
  };

  return (
    <View style={styles.container}>
      {connected && device ? (
        <View style={styles.currentDevice}>
          <Text style={styles.currentLabel}>Connectée à</Text>
          <Text style={styles.currentName}>{device.name}</Text>
          <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
            <Text style={styles.disconnectText}>Déconnecter</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity style={styles.scanBtn} onPress={refreshPairedPrinters} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.scanText}>Afficher les imprimantes appairées</Text>}
      </TouchableOpacity>
      <Text style={styles.hint}>L'appairage se fait une fois dans les réglages Android.</Text>

      <FlatList
        data={paired}
        keyExtractor={(printer) => printer.address}
        contentContainerStyle={paired.length === 0 ? styles.emptyList : undefined}
        renderItem={({ item: printer }) => (
          <TouchableOpacity style={styles.deviceRow} onPress={() => handleConnect(printer)} disabled={connecting}>
            <View>
              <Text style={styles.deviceName}>{printer.name}</Text>
              <Text style={styles.deviceAddress}>{printer.address}</Text>
            </View>
            {connecting ? <ActivityIndicator /> : <Text style={styles.arrow}>›</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>Aucune imprimante listée.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  currentDevice: { backgroundColor: '#F0F7EF', borderRadius: 10, padding: 14, marginBottom: 16 },
  currentLabel: { fontSize: 11, color: '#6B7A66' },
  currentName: { fontSize: 16, fontWeight: '600', marginTop: 2, marginBottom: 8 },
  disconnectBtn: { alignSelf: 'flex-start' },
  disconnectText: { color: '#B8431A', fontSize: 13, fontWeight: '600' },
  scanBtn: { backgroundColor: '#2B2420', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  scanText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  hint: { color: '#777', fontSize: 12, lineHeight: 18, marginTop: 10, marginBottom: 6 },
  deviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  deviceName: { fontSize: 15, fontWeight: '600' },
  deviceAddress: { fontSize: 12, color: '#888', marginTop: 2 },
  arrow: { fontSize: 28, color: '#999', fontWeight: '300' },
  emptyList: { flexGrow: 1 },
  empty: { textAlign: 'center', color: '#999', marginTop: 30, fontSize: 13 },
});
