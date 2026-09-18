import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import menuConfig from '../data/menu.json';
import { useCartStore } from '../store/useCartStore';
import { usePrinterStore } from '../store/usePrinterStore';
import { sendToPrinter } from '../services/PrinterService';
import { buildReceipt } from '../utils/receiptFormatter';
import { formatPrice } from '../utils/money';

const { restaurant, categories } = menuConfig;

export default function OrderScreen({ navigation }) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0].id);
  const [printing, setPrinting] = useState(false);
  const { lines, addItem, decrementLine, clearCart, getTotal } = useCartStore();
  const { connected, device } = usePrinterStore();
  const total = getTotal();
  const activeCategory = categories.find((category) => category.id === activeCategoryId) || categories[0];

  const addAsMenu = (item) => {
    addItem({
      ...item,
      id: `${item.id}-menu`,
      name: `${item.name} · Menu`,
      description: `${item.description} + frites et boisson`,
      price: item.price + restaurant.menuSupplement,
    });
  };

  const handlePrint = async () => {
    if (!connected) {
      Alert.alert('Imprimante non connectée', 'Connectez l’imprimante avant de valider la commande.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Connecter', onPress: () => navigation.navigate('PrinterList') },
      ]);
      return;
    }
    if (lines.length === 0) return;

    setPrinting(true);
    try {
      await sendToPrinter(
        buildReceipt({
          lines,
          total,
          orderNumber: Date.now().toString().slice(-6),
          storeName: restaurant.name,
          currency: restaurant.currency,
          footer: restaurant.ticketFooter,
        })
      );
      clearCart();
      Alert.alert('Commande envoyée', `Ticket imprimé sur ${device?.name || "l’imprimante"}.`);
    } catch (error) {
      Alert.alert('Échec impression', error?.message || 'La commande n’a pas pu être envoyée à l’imprimante.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#171412" />
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>PRISE DE COMMANDE</Text>
          <Text style={styles.title}>{restaurant.name}</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.printerButton, connected && styles.printerButtonConnected]}
          onPress={() => navigation.navigate('PrinterList')}
        >
          <View style={[styles.statusDot, connected && styles.statusDotConnected]} />
          <Text numberOfLines={1} style={styles.printerText}>
            {connected ? device?.name : 'Imprimante'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuLabelRow}>
        <Text style={styles.menuLabel}>CARTE</Text>
        <Text style={styles.menuHint}>Menu + {formatPrice(restaurant.menuSupplement, restaurant.currency)}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {categories.map((category) => {
          const selected = activeCategoryId === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => setActiveCategoryId(category.id)}
              style={[styles.tab, selected && styles.tabActive]}
            >
              <Text style={[styles.tabText, selected && styles.tabTextActive]}>{category.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.productList} contentContainerStyle={styles.productListContent}>
        {activeCategory.items.map((item) => (
          <View key={item.id} style={styles.productCard}>
            <View style={styles.productCopy}>
              <Text style={styles.productName}>{item.name}</Text>
              {item.description ? <Text style={styles.productDescription}>{item.description}</Text> : null}
              <Text style={styles.productPrice}>{formatPrice(item.price, restaurant.currency)}</Text>
            </View>
            <View style={styles.productActions}>
              <TouchableOpacity style={styles.addButton} onPress={() => addItem(item)}>
                <Text style={styles.addButtonText}>Ajouter</Text>
              </TouchableOpacity>
              {item.menuEligible ? (
                <TouchableOpacity style={styles.menuButton} onPress={() => addAsMenu(item)}>
                  <Text style={styles.menuButtonText}>En menu</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.cart}>
        <View style={styles.cartHeader}>
          <Text style={styles.cartTitle}>COMMANDE</Text>
          {lines.length > 0 ? <Text style={styles.cartCount}>{lines.length} article{lines.length > 1 ? 's' : ''}</Text> : null}
        </View>
        <ScrollView style={styles.cartLines} nestedScrollEnabled>
          {lines.length === 0 ? (
            <Text style={styles.emptyCart}>Sélectionnez des produits dans la carte.</Text>
          ) : (
            lines.map((line) => (
              <TouchableOpacity key={line.id} onPress={() => decrementLine(line.id)} style={styles.cartLine}>
                <Text numberOfLines={1} style={styles.cartLineName}>{line.qty}× {line.name}</Text>
                <Text style={styles.cartLinePrice}>{formatPrice(line.qty * line.price, restaurant.currency)}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{formatPrice(total, restaurant.currency)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.printButton, (lines.length === 0 || printing) && styles.printButtonDisabled]}
          onPress={handlePrint}
          disabled={lines.length === 0 || printing}
        >
          {printing ? <ActivityIndicator color="#16120E" /> : <Text style={styles.printButtonText}>VALIDER ET IMPRIMER</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#171412' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  kicker: { color: '#F2A900', fontSize: 10, fontWeight: '800', letterSpacing: 1.7 },
  title: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', letterSpacing: 0.7, marginTop: 2 },
  printerButton: { maxWidth: 148, flexDirection: 'row', alignItems: 'center', backgroundColor: '#322A26', borderWidth: 1, borderColor: '#51443D', paddingHorizontal: 11, paddingVertical: 9, borderRadius: 8 },
  printerButtonConnected: { borderColor: '#F2A900', backgroundColor: '#3A3021' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#A5392A', marginRight: 7 },
  statusDotConnected: { backgroundColor: '#63BD67' },
  printerText: { flexShrink: 1, color: '#FFF8E9', fontSize: 12, fontWeight: '700' },
  menuLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 6 },
  menuLabel: { color: '#F7F0E3', fontSize: 13, fontWeight: '900', letterSpacing: 1.6 },
  menuHint: { color: '#F2A900', fontSize: 12, fontWeight: '800' },
  tabs: {  paddingHorizontal: 16, paddingBottom: 12, gap: 8, borderWidth: 5, borderColor: '#fff'  },
  tab: {  height: 40, borderRadius: 6, backgroundColor: '#29221E', paddingHorizontal: 13, paddingVertical: 9, borderWidth: 1, borderColor: '#3E342E' },
  tabActive: { backgroundColor: '#B5121B', borderColor: '#E3392E' },
  tabText: { color: '#D6CCC0', fontSize: 12, fontWeight: '800' },
  tabTextActive: { color: '#FFFFFF' },
  productList: { flex: 1, marginTop:-300 },
  productListContent: { paddingHorizontal: 16, paddingBottom: 12 },
  productCard: { flexDirection: 'row', backgroundColor: '#231D19', borderLeftWidth: 4, borderLeftColor: '#F2A900', borderRadius: 8, padding: 13, marginBottom: 9 },
  productCopy: { flex: 1, paddingRight: 10 },
  productName: { color: '#FFF9ED', fontSize: 16, fontWeight: '900' },
  productDescription: { color: '#BFB2A6', fontSize: 11, lineHeight: 15, marginTop: 4 },
  productPrice: { color: '#F2A900', fontSize: 16, fontWeight: '900', marginTop: 9 },
  productActions: { justifyContent: 'center', gap: 7 },
  addButton: { alignItems: 'center', backgroundColor: '#B5121B', borderRadius: 5, paddingVertical: 9, paddingHorizontal: 10 },
  addButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  menuButton: { alignItems: 'center', borderWidth: 1, borderColor: '#F2A900', borderRadius: 5, paddingVertical: 8, paddingHorizontal: 10 },
  menuButtonText: { color: '#F2A900', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  cart: { backgroundColor: '#F4EEE3', borderTopWidth: 4, borderTopColor: '#B5121B', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 18 },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartTitle: { color: '#261A15', fontSize: 13, fontWeight: '900', letterSpacing: 1.3 },
  cartCount: { color: '#8A3328', fontSize: 11, fontWeight: '800' },
  cartLines: { maxHeight: 110, marginTop: 5 },
  emptyCart: { color: '#897D72', fontSize: 12, paddingVertical: 10 },
  cartLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  cartLineName: { color: '#261A15', flex: 1, fontSize: 13, fontWeight: '700', marginRight: 8 },
  cartLinePrice: { color: '#261A15', fontSize: 13, fontWeight: '900' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#D4C7B8', marginTop: 6, paddingTop: 9, paddingBottom: 10 },
  totalLabel: { color: '#261A15', fontSize: 14, fontWeight: '900', letterSpacing: 1.2 },
  totalValue: { color: '#B5121B', fontSize: 21, fontWeight: '900' },
  printButton: { backgroundColor: '#F2A900', borderRadius: 6, alignItems: 'center', paddingVertical: 15 },
  printButtonDisabled: { backgroundColor: '#CFC5B8' },
  printButtonText: { color: '#16120E', fontSize: 13, fontWeight: '900', letterSpacing: 0.7 },
});
