import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { CameraView } from 'expo-camera';
import { Spacing, Radius } from '../../constants';

interface BarcodeScannerProps {
  onBarcodeScanned: (code: string) => void;
  onClose: () => void;
  colors: any;
}

export default function BarcodeScanner({ onBarcodeScanned, onClose, colors }: BarcodeScannerProps) {
  const [scanned, setScanned] = useState(false);
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const cameraRef = useRef<any>(null);

  const handleBarcode = async ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    onBarcodeScanned(data);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onBarcodeScanned(manualCode.trim());
    }
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flash}
        enableTorch={flash === 'on'}
        onBarcodeScanned={!scanned ? handleBarcode : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr', 'code128'] }}
      />

      <View style={s.overlay}>
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={[s.title, { color: '#fff' }]}>{'Barcode'}</Text>
          <TouchableOpacity style={s.closeBtn} onPress={() => setFlash(f => f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off')}>
            <Text style={{ fontSize: 18 }}>{flash === 'off' ? '🌑' : flash === 'on' ? '💡' : 'A💡'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.viewfinderWrap}>
          <View style={s.viewfinder}>
            <View style={[s.corner, s.tl, { borderColor: colors.tabActive }]} />
            <View style={[s.corner, s.tr, { borderColor: colors.tabActive }]} />
            <View style={[s.corner, s.bl, { borderColor: colors.tabActive }]} />
            <View style={[s.corner, s.br, { borderColor: colors.tabActive }]} />
          </View>
          <Text style={s.scanHint}>
            {scanned ? '✅ Scanned!' : 'Align barcode within frame'}
          </Text>
        </View>

        <View style={s.bottomArea}>
          <TouchableOpacity
            style={[s.manualToggle, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => setShowManualInput(!showManualInput)}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
              {showManualInput ? 'Hide' : 'Enter code manually'}
            </Text>
          </TouchableOpacity>

          {showManualInput && (
            <View style={[s.manualRow, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
              <TextInput
                style={[s.manualInput, { color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }]}
                placeholder="e.g. 7501055300503"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={manualCode}
                onChangeText={setManualCode}
                keyboardType="number-pad"
              />
              <TouchableOpacity style={[s.manualSubmit, { backgroundColor: colors.primary }]} onPress={handleManualSubmit}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>OK</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const s = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingTop: 56, paddingBottom: 16,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  closeText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  viewfinderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  viewfinder: { width: 280, height: 200 },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderWidth: CORNER_THICKNESS },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 16 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 16 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 16 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 16 },
  scanHint: { marginTop: 24, fontSize: 15, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  bottomArea: { padding: Spacing.base, paddingBottom: 60, alignItems: 'center', gap: 12 },
  manualToggle: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1 },
  manualRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: Radius.lg, padding: 12, width: '100%' },
  manualInput: { flex: 1, height: 44, borderRadius: Radius.md, borderWidth: 1, paddingHorizontal: 14, fontSize: 16, fontWeight: '600' },
  manualSubmit: { height: 44, paddingHorizontal: 20, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
});
