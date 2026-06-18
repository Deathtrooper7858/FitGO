import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getLocalDateString } from '../../utils/date';

interface DateNavigatorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  colors: any;
  t: any;
  language: string;
}

export function DateNavigator({ selectedDate, onDateChange, colors, t, language }: DateNavigatorProps) {
  const days = useMemo(() => {
    const arr = [];
    const base = new Date(selectedDate + 'T12:00:00');
    for (let i = 3; i >= -3; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      arr.push({
        label: d.toLocaleDateString(language, { weekday: 'narrow' }).toUpperCase(),
        dayNum: d.getDate(),
        full: getLocalDateString(d),
      });
    }
    return arr;
  }, [language, selectedDate]);

  return (
    <View style={s.datePicker}>
      {days.map((d) => (
        <TouchableOpacity
          key={d.full}
          style={s.dateItem}
          onPress={() => onDateChange(d.full)}
        >
          <Text style={[s.dateLabel, { color: colors.textSecondary }]}>{d.label}</Text>
          <View style={[s.dateNumWrap, selectedDate === d.full && { backgroundColor: colors.primary }]}>
            <Text style={[s.dateNum, { color: selectedDate === d.full ? '#fff' : colors.textPrimary }]}>{d.dayNum}</Text>
          </View>
          {selectedDate === d.full && <View style={[s.dateDot, { backgroundColor: colors.primary }]} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  datePicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  dateItem: { alignItems: 'center', gap: 8 },
  dateLabel: { fontSize: 12, fontWeight: '600' },
  dateNumWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dateNum: { fontSize: 14, fontWeight: '700' },
  dateDot: { width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: -8 },
});
