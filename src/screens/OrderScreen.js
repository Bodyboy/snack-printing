// src/screens/OrderScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import menuConfig from '../data/menu.json';
import { useCartStore } from '../store/useCartStore';
import { usePrinterStore } from '../store/usePrinterStore';
import { sendToPrinter } from '../services/PrinterService';
import { buildReceipt } from '../utils/receiptFormatter';

const { restaurant, categories } = menuConfig;

export default function OrderScreen({ navigation }) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0].id);
  const [printing, setPrinting] = useState(false);

  const { lines, addItem, decrementLine, clearCart, getTotal } = useCartStore();
  const { connected, device } = usePrinterStore();

  const total = getTotal();

  const handlePrint = async () => {
    if (!connected) {
      Alert.alert(
        'Imprimante non connectée',
        'Connectez une imprimante avant de valider la commande.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Connecter', onPress: () => navigation.navigate('PrinterList') },
        ]
      );
      return;
    }
    if (lines.length === 0) return;

    setPrinting(true);
    try {
      const steps = buildReceipt({
        lines,
        total,
        orderNumber: Date.now().toString().slice(-6),
        storeName: restaurant.name,
        currency: restaurant.currency,
        footer: restaurant.ticketFooter,
      });
      await sendToPrinter(steps);
      clearCart();
      Alert.alert('Commande envoyée', `Ticket imprimé sur ${device?.name || "l'imprimante"}.`);
    } catch (err) {
      Alert.alert('Échec impression', "La commande n'a pas pu être envoyée à l'imprimante.");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{restaurant.name}</Text>
        <TouchableOpacity
          style={[styles.printerPill, connected && styles.printerPillConnected]}
          onPress={() => navigation.navigate('PrinterList')}
        >
          <View style={[styles.dot, connected && styles.dotConnected]} />
          <Text style={styles.printerPillText}>
            {connected ? device?.name : 'Connecter imprimante'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => setActiveCategoryId(category.id)}
            style={styles.tab}
          >
            <Text style={[styles.tabText, activeCategoryId === category.id && styles.tabTextActive]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.menuList}>
        {categories.find((category) => category.id === activeCategoryId).items.map((item) => (
          <View key={item.id} style={styles.menuItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc}>{item.description}</Text>
              <Text style={styles.itemPrice}>{item.price} {restaurant.currency}</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => addItem(item)}>
              <Text style={styles.addBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.ticket}>
        <ScrollView style={{ maxHeight: 140 }}>
          {lines.length === 0 ? (
            <Text style={styles.emptyTicket}>Aucun article sélectionné</Text>
          ) : (
            lines.map((l) => (
              <TouchableOpacity
                key={l.id}
                style={styles.ticketLine}
                onPress={() => decrementLine(l.id)}
              >
                <Text style={styles.ticketLineText}>
                  {l.qty}x {l.name}
                </Text>
                <Text style={styles.ticketLineValue}>{l.qty * l.price} {restaurant.currency}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{total} {restaurant.currency}</Text>
        </View>

        <TouchableOpacity
          style={[styles.printBtn, (lines.length === 0 || printing) && styles.printBtnDisabled]}
          onPress={handlePrint}
          disabled={lines.length === 0 || printing}
        >
          {printing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.printBtnText}>Valider & imprimer</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFE7D4' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#2B2420' },
  printerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F1E3',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  printerPillConnected: { backgroundColor: '#EAF3E9' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#A99A7C', marginRight: 6 },
  dotConnected: { backgroundColor: '#4C7A4A' },
  printerPillText: { fontSize: 12, color: '#2B2420', fontWeight: '600' },
  tabs: { paddingHorizontal: 16, marginBottom: 8, flexGrow: 0 },
  tab: { marginRight: 18, paddingVertical: 8 },
  tabText: { fontSize: 14, color: '#6B6152', fontWeight: '600' },
  tabTextActive: { color: '#2B2420' },
  menuList: { flex: 1, paddingHorizontal: 16 },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#F7F1E3',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  itemName: { fontSize: 15, fontWeight: '600', color: '#2B2420' },
  itemDesc: { fontSize: 11.5, color: '#6B6152', marginTop: 2, marginBottom: 6 },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#2B2420' },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#D9531E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 18, lineHeight: 20 },
  ticket: {
    backgroundColor: '#FBFAF6',
    borderTopWidth: 1,
    borderTopColor: '#E3DCC9',
    padding: 16,
  },
  emptyTicket: { fontSize: 12, color: '#6B6152', textAlign: 'center', paddingVertical: 12 },
  ticketLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  ticketLineText: { fontSize: 13, color: '#2B2420' },
  ticketLineValue: { fontSize: 13, fontWeight: '600', color: '#2B2420' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E3DCC9',
    borderStyle: 'dashed',
    paddingTop: 10,
    marginTop: 6,
    marginBottom: 12,
  },
  totalLabel: { fontSize: 13, fontWeight: '700', color: '#2B2420' },
  totalValue: { fontSize: 17, fontWeight: '700', color: '#2B2420' },
  printBtn: {
    backgroundColor: '#D9531E',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  printBtnDisabled: { backgroundColor: '#D8CCAF' },
  printBtnText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
});
