# FitGO i18n Translation Audit Report

## Executive Summary

| File | Total Keys | Missing | Spanish Contaminated | Extra Keys |
|------|-----------|---------|---------------------|------------|
| en.json | 3956 | 0 | 0 | 0 |
| es.json | 3956 | 0 | N/A (reference) | 0 |
| fr.json | 3770 | 221 | 36 (brand names) | 35 |
| de.json | 3770 | 223 | 41 (brand names) | 37 |
| it.json | 3777 | 214 | 690 | 35 |
| pt.json | 3777 | 214 | 2130 | 35 |
| ru.json | 3777 | 214 | 1935 | 35 |

---

## Critical Issues

### 1. SPANISH CONTAMINATION (HIGH SEVERITY)

**pt.json** - 56% of file is Spanish (2130 values identical to es.json)
- The entire file appears to be a copy of es.json with only partial Portuguese translations applied
- Most UI strings, food names, and exercise names are in Spanish

**ru.json** - 51% of file is Spanish (1935 values identical to es.json)
- The entire file appears to be a copy of es.json with only partial Russian translations applied
- Most UI strings, food names, and exercise names are in Spanish

**it.json** - 18% of file is Spanish (690 values identical to es.json)
- Italian translations break to Spanish in several sections
- Particularly affected: foods section, exercise names

**fr.json** - Clean (36 matches are brand names like Instagram, TikTok)
**de.json** - Clean (41 matches are brand names)

### 2. MISSING KEYS (All non-English files)

The following sections are missing from ALL non-English files:

| Section | Missing Keys |
|---------|-------------|
| onboarding | 114 |
| paywall | 89 |
| activities | 10 |
| common | 1 |
| achievements | 7 (fr, de only) |
| profile | 1 (fr, de only) |
| reminders | 2 (de only) |

### 3. HARDCODED STRINGS IN COMPONENTS

Found hardcoded strings that bypass i18n:

**Spanish hardcoded (should use i18n):**
| File | Line | Hardcoded String |
|------|------|------------------|
| progress-evaluation.tsx | 148 | title="Analisis Fisico IA" |
| progress-evaluation.tsx | 149 | subtitle="Ve un breve video y obtiene tu evaluacion de IA" |
| progress-evaluation.tsx | 150 | watchLabel="Ver video - Analizar mi cuerpo" |
| recipes.tsx | 123 | title="Recetas Premium" |
| recipes.tsx | 124 | subtitle="Ve un breve video y accede a recetas de IA personalizadas" |
| recipes.tsx | 125 | watchLabel="Ver video - Desbloquear recetas" |

**English hardcoded (should use i18n):**
| File | Line | Hardcoded String |
|------|------|------------------|
| reminders.tsx | 115-128 | Default reminder titles and bodies (Walk, Cardio, Vitamins, Sleep, Log, League, etc.) |

### 4. EXTRA KEYS (Not in en.json)

All non-English files have extra paywall keys that are NOT in en.json. These appear to be properly translated paywall keys that should be added to en.json:
- paywall.unlock, paywall.heroSub, paywall.monthly, paywall.annual, paywall.lifetime
- paywall.bestValue, paywall.priceNote, paywall.once, paywall.month, paywall.year
- paywall.features.coach, paywall.features.photo, paywall.features.voice, etc.
- paywall.trial, paywall.startTrial, paywall.legal, paywall.fullAccess
- paywall.titleUnlock, paywall.titlePro, paywall.feature1-6
- paywall.specialOffer, paywall.perMonth, paywall.restorePurchases

**Recommendation**: Add these keys to en.json and use them in the paywall component.

---

## Detailed Analysis

### pt.json Issues
The Portuguese file is fundamentally broken. It was likely copied from es.json and only partially translated. The following sections need complete retranslation:
- All UI strings (common, profile, onboarding, etc.)
- All food names (foods section)
- All exercise names (exerciseNames section)
- All meal names (meals section)

### ru.json Issues
Same as pt.json - the Russian file is a partial copy of es.json. Needs complete retranslation.

### it.json Issues
The Italian file has Spanish contamination in:
- foods section (food names in Spanish)
- exerciseNames section (exercise names in Spanish)
- Some UI strings

### Missing Keys Analysis
The 114 missing onboarding keys and 89 missing paywall keys suggest these sections were added to en.json but never propagated to other languages.

---

## Recommended Actions

1. **Immediate**: Fix hardcoded strings in progress-evaluation.tsx and recipes.tsx to use i18n
2. **High Priority**: Retranslate pt.json and ru.json completely (they are Spanish, not Portuguese/Russian)
3. **High Priority**: Fix Spanish contamination in it.json foods and exercises sections
4. **Medium Priority**: Add missing onboarding, paywall, and activities keys to all files
5. **Low Priority**: Remove extra paywall keys from non-English files or add them to en.json
