import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Spacing, Radius } from '../../constants';

interface BarcodeScannerProps {
  onBarcodeScanned: (code: string) => void;
  onClose?: () => void;
  colors: any;
  showHeader?: boolean;
}

export default function BarcodeScanner({
  onBarcodeScanned,
  onClose,
  colors,
  showHeader = false,
}: BarcodeScannerProps) {
  const { t } = useTranslation();
  const [scanned, setScanned] = useState(false);
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      setScanned(true);
      onBarcodeScanned(manualCode.trim());
    }
  };

  return (
    <View style={s.container}>
      {showHeader && (
        <View style={s.header}>
          {onClose && (
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Text style={s.closeText}>✕</Text>
            </TouchableOpacity>
          )}
          <Text style={[s.title, { color: '#fff' }]}>{t('scan.barcodeTitle', 'Escanear Código')}</Text>
          <TouchableOpacity
            style={s.closeBtn}
            onPress={() => setFlash(f => (f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off'))}
          >
            <Text style={{ fontSize: 18 }}>{flash === 'off' ? '🌑' : flash === 'on' ? '💡' : 'A💡'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={s.viewfinderWrap}>
        <View style={s.viewfinder}>
          <View style={[s.corner, s.tl, { borderColor: colors.primary || colors.tabActive || '#7C5CFC' }]} />
          <View style={[s.corner, s.tr, { borderColor: colors.primary || colors.tabActive || '#7C5CFC' }]} />
          <View style={[s.corner, s.bl, { borderColor: colors.primary || colors.tabActive || '#7C5CFC' }]} />
          <View style={[s.corner, s.br, { borderColor: colors.primary || colors.tabActive || '#7C5CFC' }]} />
        </View>
        <Text style={s.scanHint}>
          {scanned
            ? `✅ ${t('scan.scanned', '¡Escaneado!')}`
            : t('scan.alignBarcode', 'Centra el código de barras dentro del marco')}
        </Text>
      </View>

      <View style={s.bottomArea}>
        <TouchableOpacity
          style={[
            s.manualToggle,
            {
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderColor: 'rgba(255,255,255,0.22)',
            },
          ]}
          onPress={() => setShowManualInput(!showManualInput)}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
            {showManualInput
              ? t('common.hide', 'Ocultar')
              : t('scan.enterCodeManually', 'Ingresar código manualmente')}
          </Text>
        </TouchableOpacity>

        {showManualInput && (
          <View style={[s.manualRow, { backgroundColor: 'rgba(15, 23, 42, 0.85)', borderColor: colors.border }]}>
            <TextInput
              style={[
                s.manualInput,
                { color: '#fff', borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.06)' },
              ]}
              placeholder={t('scan.manualCodePlaceholder', 'ej. 7501055300503')}
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={manualCode}
              onChangeText={setManualCode}
              keyboardType="number-pad"
              autoFocus
            />
            <TouchableOpacity
              style={[s.manualSubmit, { backgroundColor: colors.primary || '#7C5CFC' }]}
              onPress={handleManualSubmit}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                {t('common.confirm', 'OK')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const CORNER_SIZE = 26;
const CORNER_THICKNESS = 3.5;

const s = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: 56,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  viewfinderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 240,
  },
  viewfinder: {
    width: 280,
    height: 190,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderWidth: CORNER_THICKNESS,
  },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 18 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 18 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 18 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 18 },
  scanHint: {
    marginTop: 22,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bottomArea: {
    padding: Spacing.base,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  manualToggle: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radius.lg,
    padding: 10,
    borderWidth: 1,
    width: '100%',
  },
  manualInput: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  manualSubmit: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
