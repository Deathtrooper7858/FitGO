/**
 * widget-task-handler.tsx
 *
 * Android Home Screen Widgets for FitGO.
 * This file runs as a Headless Task (even when the app is closed).
 * It reads from AsyncStorage and renders native widget views.
 *
 * Widgets included:
 *  1. FitGoMainWidget  – Calorías restantes + Proteína + Racha (grande)
 *  2. FitGoStreakWidget – Solo la Llama de Racha (pequeño)
 *  3. FitGoWaterWidget  – Agua consumida vs meta (mediano)
 */
import React from 'react';
import { WidgetTaskHandlerProps, FlexWidget, TextWidget } from 'react-native-android-widget';

import { loadWidgetData, WidgetData } from './utils/widgetData';

// ─────────────────────────────────────────────────────────
// Widget 1: Main (Calorías + Proteína + Racha)  – 4×2 cells
// ─────────────────────────────────────────────────────────
function FitGoMainWidget({ data }: { data: WidgetData }) {
  const calsRemaining = Math.max(0, (data.calsTarget || 2000) - (data.calsConsumed || 0));
  const calsPercent = data.calsTarget > 0 ? Math.min(100, Math.round(((data.calsConsumed || 0) / data.calsTarget) * 100)) : 0;
  const protPercent = data.proteinTarget > 0 ? Math.min(100, Math.round(((data.protein || 0) / data.proteinTarget) * 100)) : 0;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0D1117',
        borderRadius: 20,
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Header */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextWidget
          text="FitGO"
          style={{ fontSize: 15, color: '#7C5CFC', fontWeight: 'bold' }}
        />
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget text="🔥 " style={{ fontSize: 14 }} />
          <TextWidget
            text={`${data.streak} días`}
            style={{ fontSize: 14, color: '#FBBF24', fontWeight: 'bold' }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Calories */}
      <FlexWidget style={{ flexDirection: 'column', marginTop: 8 }}>
        <TextWidget
          text="QUEDAN HOY"
          style={{ fontSize: 9, color: '#64748B', fontWeight: 'bold', letterSpacing: 1 }}
        />
        <TextWidget
          text={`${calsRemaining} kcal`}
          style={{ fontSize: 26, color: '#38BDF8', fontWeight: 'bold' }}
        />
        <TextWidget
          text={`${calsPercent}% consumido`}
          style={{ fontSize: 10, color: '#475569' }}
        />
      </FlexWidget>

      {/* Protein */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text="PROTEÍNA"
            style={{ fontSize: 9, color: '#64748B', fontWeight: 'bold', letterSpacing: 1 }}
          />
          <TextWidget
            text={`${Math.round(data.protein)}g / ${data.proteinTarget}g`}
            style={{ fontSize: 14, color: '#10B981', fontWeight: 'bold' }}
          />
        </FlexWidget>
        <TextWidget
          text={`${protPercent}%`}
          style={{ fontSize: 18, color: protPercent >= 100 ? '#10B981' : '#94A3B8', fontWeight: 'bold' }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

// ─────────────────────────────────────────────────────────
// Widget 2: Streak (Solo Racha) – 2×1 cells
// ─────────────────────────────────────────────────────────
function FitGoStreakWidget({ streak, name }: { streak: number; name: string }) {
  const flameColor = streak === 0 ? '#475569' : streak >= 30 ? '#FBBF24' : '#F97316';

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0D1117',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TextWidget text={streak === 0 ? '🩶' : '🔥'} style={{ fontSize: 30 }} />
      <TextWidget
        text={`${streak}`}
        style={{ fontSize: 28, color: flameColor, fontWeight: 'bold', marginTop: 2 }}
      />
      <TextWidget
        text={streak === 1 ? 'día' : 'días'}
        style={{ fontSize: 11, color: '#64748B', fontWeight: 'bold' }}
      />
    </FlexWidget>
  );
}

// ─────────────────────────────────────────────────────────
// Widget 3: Agua – 2×2 cells
// ─────────────────────────────────────────────────────────
function FitGoWaterWidget({ waterMl, waterTarget }: { waterMl: number; waterTarget: number }) {
  const glasses = Math.round((waterMl || 0) / 250); // 1 vaso = 250ml
  const targetGlasses = Math.round((waterTarget || 2000) / 250);
  const percent = waterTarget > 0 ? Math.min(100, Math.round(((waterMl || 0) / waterTarget) * 100)) : 0;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0D1117',
        borderRadius: 16,
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextWidget text="💧" style={{ fontSize: 20 }} />
        <TextWidget
          text={`${percent}%`}
          style={{ fontSize: 16, color: percent >= 100 ? '#22D3EE' : '#64748B', fontWeight: 'bold' }}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'column' }}>
        <TextWidget
          text={`${waterMl} ml`}
          style={{ fontSize: 24, color: '#38BDF8', fontWeight: 'bold' }}
        />
        <TextWidget
          text={`${glasses} / ${targetGlasses} vasos`}
          style={{ fontSize: 11, color: '#475569' }}
        />
      </FlexWidget>

      <TextWidget
        text="HIDRATACIÓN"
        style={{ fontSize: 9, color: '#64748B', fontWeight: 'bold', letterSpacing: 1 }}
      />
    </FlexWidget>
  );
}

// ─────────────────────────────────────────────────────────
// Task Handler — Android calls this even when app is closed
// ─────────────────────────────────────────────────────────
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const data = await loadWidgetData();

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const widgetName = props.widgetInfo.widgetName;

      if (widgetName === 'FitGoStreakWidget') {
        props.renderWidget(<FitGoStreakWidget streak={data.streak} name={data.userName} />);
      } else if (widgetName === 'FitGoWaterWidget') {
        props.renderWidget(<FitGoWaterWidget waterMl={data.waterMl} waterTarget={data.waterTarget} />);
      } else {
        // Default: FitGoMainWidget
        props.renderWidget(<FitGoMainWidget data={data} />);
      }
      break;
    }

    case 'WIDGET_CLICK':
      // All clicks open the app at the dashboard
      break;

    default:
      break;
  }
}
