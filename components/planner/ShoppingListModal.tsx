import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingCart, Download, X } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, Radius } from '../../constants';
import { generateShoppingListJSON } from '../../services/groq';
import { getLocalDateString } from '../../utils/date';
import type { PlanItem } from '../../store/plannerStore';

interface ShoppingListModalProps {
  visible: boolean;
  onClose: () => void;
  mealPlans: Record<string, PlanItem[]>;
  language: string;
}

interface Category {
  category: string;
  items: { name: string; quantity: string; price: number }[];
}

export default function ShoppingListModal({ visible, onClose, mealPlans, language }: ShoppingListModalProps) {
  const colors = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      generateShoppingListJSON(mealPlans, language)
        .then((cats) => setCategories(cats))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const today = getLocalDateString();
      const totalItems = categories.reduce((acc, c) => acc + (c.items?.length ?? 0), 0);

      const CAT_COLORS: Record<string, string> = {
        default: '#7C5CFC', frutas: '#F59E0B', verduras: '#10B981', carnes: '#EF4444',
        lácteos: '#3B82F6', proteínas: '#F59E0B', granos: '#8B5CF6', cereales: '#8B5CF6',
        produce: '#10B981', meat: '#EF4444', dairy: '#3B82F6', pantry: '#8B5CF6',
        snacks: '#F97316', bebidas: '#06B6D4',
      };
      const CAT_EMOJI: Record<string, string> = {
        frutas: '🍎', verduras: '🥦', carnes: '🥩', lácteos: '🥛',
        proteínas: '🥚', granos: '🌾', cereales: '🌾', snacks: '🍿',
        produce: '🥦', meat: '🥩', dairy: '🥛', pantry: '🥫', bebidas: '🥤',
      };

      let html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>FitGO Lista de Compras</title><style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', 'Helvetica Neue', sans-serif; background: #F0F4FF; color: #1E1B4B; -webkit-print-color-adjust: exact; }
        .page { max-width: 800px; margin: 0 auto; padding: 32px 24px; }
        .header { background: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%); border-radius: 20px; padding: 32px; margin-bottom: 24px; color: white; display: flex; align-items: center; justify-content: space-between; }
        .header-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .header-sub { font-size: 14px; opacity: 0.85; margin-top: 4px; }
        .logo-badge { background: rgba(255,255,255,0.2); border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
        .summary-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
        .summary-card { background: white; border-radius: 14px; padding: 16px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .summary-card .val { font-size: 22px; font-weight: 800; color: #F59E0B; }
        .summary-card .lbl { font-size: 11px; color: #6B7280; margin-top: 2px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .cat-card { background: white; border-radius: 16px; margin-bottom: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); page-break-inside: avoid; }
        .cat-header { padding: 14px 20px; display: flex; align-items: center; gap: 10px; }
        .cat-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
        .cat-name { font-size: 17px; font-weight: 700; color: #1E1B4B; }
        .cat-count { margin-left: auto; font-size: 12px; color: #9CA3AF; font-weight: 600; background: #F3F4F6; padding: 3px 10px; border-radius: 20px; }
        .item-row { display: flex; align-items: center; gap: 14px; padding: 12px 20px; border-top: 1px solid #F3F4F6; }
        .checkbox { width: 18px; height: 18px; border: 2px solid #D1D5DB; border-radius: 4px; flex-shrink: 0; }
        .item-name { font-size: 14px; color: #374151; font-weight: 500; }
        .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #9CA3AF; }
        .price-badge { background: #F0F4FF; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; color: #4F46E5; }
      </style></head><body><div class="page">`;

      html += `<div class="header"><div><div class="header-title">🛒 Lista de Compras</div><div class="header-sub">FitGO</div></div><div class="logo-badge">🥗</div></div>`;
      html += `<div class="summary-row"><div class="summary-card"><div class="val">${categories.length}</div><div class="lbl">Categorías</div></div><div class="summary-card"><div class="val">${totalItems}</div><div class="lbl">Productos totales</div></div></div>`;

      categories.forEach((cat) => {
        const key = (cat.category || '').toLowerCase();
        const color = CAT_COLORS[key] || CAT_COLORS['default'];
        const emoji = CAT_EMOJI[key] || '🛍️';
        html += `<div class="cat-card"><div class="cat-header"><div class="cat-dot" style="background:${color}"></div><span class="cat-name">${emoji} ${cat.category}</span><span class="cat-count">${cat.items?.length ?? 0} productos</span></div>`;
        (cat.items || []).forEach((item: any) => {
          const priceStr = item.price ? `<span class="price-badge">$${Number(item.price).toFixed(2)}</span>` : '';
          html += `<div class="item-row"><div class="checkbox"></div><span class="item-name">${item.name}${item.quantity ? ` (${item.quantity})` : ''}</span>${priceStr}</div>`;
        });
        html += `</div>`;
      });

      html += `<div class="footer">Generado por FitGO · ${today} · Marca los productos conforme los compras ✅</div></div></body></html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'fitgo_lista_compras.pdf' });
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const totalItems = categories.reduce((acc, c) => acc + (c.items?.length ?? 0), 0);
  const totalPrice = categories.reduce((acc, c) => acc + (c.items || []).reduce((s, i) => s + (i.price || 0), 0), 0);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[sl.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={sl.closeBtn}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[sl.title, { color: colors.textPrimary }]}>Lista de Compras</Text>
          <TouchableOpacity onPress={handleExportPDF} disabled={loading || exporting}>
            {exporting ? <ActivityIndicator size="small" color={colors.primary} /> : <Download size={24} color={colors.primary} />}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Generando lista de compras...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={sl.summaryRow}>
              <View style={[sl.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[sl.summaryVal, { color: '#F59E0B' }]}>{categories.length}</Text>
                <Text style={[sl.summaryLbl, { color: colors.textMuted }]}>Categorías</Text>
              </View>
              <View style={[sl.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[sl.summaryVal, { color: '#F59E0B' }]}>{totalItems}</Text>
                <Text style={[sl.summaryLbl, { color: colors.textMuted }]}>Productos</Text>
              </View>
              {totalPrice > 0 && (
                <View style={[sl.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[sl.summaryVal, { color: '#F59E0B' }]}>${totalPrice.toFixed(2)}</Text>
                  <Text style={[sl.summaryLbl, { color: colors.textMuted }]}>Total estimado</Text>
                </View>
              )}
            </View>

            {categories.map((cat, idx) => {
              const key = (cat.category || '').toLowerCase();
              const emoji = ({ frutas: '🍎', verduras: '🥦', carnes: '🥩', lácteos: '🥛', proteínas: '🥚', granos: '🌾', cereales: '🌾', snacks: '🍿', produce: '🥦', meat: '🥩', dairy: '🥛', pantry: '🥫', bebidas: '🥤' })[key] || '🛍️';
              return (
                <View key={idx} style={[sl.catCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[sl.catHeader, { borderBottomColor: colors.border + '50' }]}>
                    <Text style={[sl.catName, { color: colors.textPrimary }]}>{emoji} {cat.category}</Text>
                    <Text style={[sl.catCount, { color: colors.textMuted, backgroundColor: colors.surfaceAlt }]}>{cat.items?.length ?? 0}</Text>
                  </View>
                  {(cat.items || []).map((item, iIdx) => (
                    <View key={iIdx} style={[sl.itemRow, { borderTopColor: colors.border + '30' }]}>
                      <View style={[sl.checkbox, { borderColor: colors.border }]} />
                      <Text style={[sl.itemName, { color: colors.textPrimary }]}>{item.name}{item.quantity ? ` (${item.quantity})` : ''}</Text>
                      {item.price > 0 && (
                        <Text style={[sl.price, { color: colors.primary }]}>${Number(item.price).toFixed(2)}</Text>
                      )}
                    </View>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        )}

        {!loading && (
          <TouchableOpacity
            style={{ margin: 16, borderRadius: Radius.full, overflow: 'hidden' }}
            activeOpacity={0.8}
            onPress={handleExportPDF}
            disabled={exporting}
          >
            <LinearGradient colors={['#F59E0B', '#D97706']} style={sl.exportGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
              <ShoppingCart size={20} color="#fff" />
              <Text style={sl.exportText}>Compartir PDF</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const sl = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: 16, borderBottomWidth: 1 },
  closeBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '900' },
  summaryRow: { flexDirection: 'row', gap: 12, padding: 16, flexWrap: 'wrap' },
  summaryCard: { flex: 1, minWidth: 100, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', minHeight: 70 },
  summaryVal: { fontSize: 24, fontWeight: '900' },
  summaryLbl: { fontSize: 11, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  catCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  catHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  catName: { fontSize: 17, fontWeight: '700' },
  catCount: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: 1 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2 },
  itemName: { flex: 1, fontSize: 14, fontWeight: '500' },
  price: { fontSize: 14, fontWeight: '800' },
  exportGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  exportText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
