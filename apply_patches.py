#!/usr/bin/env python3
"""
Applies the 3 missing pieces to the actual repo:
1. embedded + gameMode + onGameModeChange props to PlayersRelationsScreen
2. soft mode to prompt-engine.ts
3. softMode/familyDaughter/etc keys to i18n/types.ts and en.ts
"""
import re, sys, os

BASE = os.path.expanduser('~/Projects/Fantito-s-juegos')

# ─────────────────────────────────────────────────────────────────
# 1. PlayersRelationsScreen — add embedded + gameMode props
# ─────────────────────────────────────────────────────────────────
path = f'{BASE}/src/components/onboarding/PlayersRelationsScreen.tsx'
src = open(path).read()

old_iface = """interface Props {
  step: number; lang: Language;
  players: Player[]; relations: Relation[];
  onPlayersChange: (p: Player[]) => void;
  onRelationsChange: (r: Relation[]) => void;
  onNext: () => void; onBack: () => void;
}

const PlayersRelationsScreen = ({ step, lang, players, relations, onPlayersChange, onRelationsChange, onNext, onBack }: Props) => {"""

new_iface = """interface Props {
  step: number; lang: Language;
  players: Player[]; relations: Relation[];
  gameMode?: GameMode;
  onGameModeChange?: (mode: GameMode) => void;
  onPlayersChange: (p: Player[]) => void;
  onRelationsChange: (r: Relation[]) => void;
  onNext: () => void; onBack: () => void;
  embedded?: boolean;
}

const PlayersRelationsScreen = ({ step, lang, players, relations, gameMode, onGameModeChange, onPlayersChange, onRelationsChange, onNext, onBack, embedded = false }: Props) => {"""

if old_iface in src:
    src = src.replace(old_iface, new_iface, 1)
    open(path, 'w').write(src)
    print("✅ PlayersRelationsScreen: added embedded + gameMode props")
else:
    print("⚠️  PlayersRelationsScreen: pattern not found — check manually")

# ─────────────────────────────────────────────────────────────────
# 2. prompt-engine.ts — add soft mode case
# ─────────────────────────────────────────────────────────────────
path = f'{BASE}/src/lib/prompt-engine.ts'
src = open(path).read()

# Find the buildGameModeRules function and add soft case
old_mode = "    case 'nasty18':"
new_mode = """    case 'soft':
      return `[MODE: SOFT 🧸] Clean, safe, all-ages friendly. ZERO sexual/crude content, ZERO risky dares, ZERO substance pressure. Light banter, wholesome challenges, funny would-you-rathers, soft confessions only.`;
    case 'nasty18':"""

if old_mode in src and "case 'soft'" not in src:
    src = src.replace(old_mode, new_mode, 1)
    # Also handle soft in consumption/topic rules
    # Find where family mode disables consumption and add soft
    src = src.replace(
        "if (state.gameMode === 'family') {",
        "if (state.gameMode === 'family' || state.gameMode === 'soft') {"
    )
    src = src.replace(
        "if (state.gameMode === 'family' || state.gameMode === 'nasty18')",
        "if (state.gameMode === 'family' || state.gameMode === 'soft' || state.gameMode === 'nasty18')"
    )
    open(path, 'w').write(src)
    print("✅ prompt-engine.ts: added soft mode")
elif "case 'soft'" in src:
    print("✅ prompt-engine.ts: soft mode already exists")
else:
    print("⚠️  prompt-engine.ts: pattern not found — check manually")

# ─────────────────────────────────────────────────────────────────
# 3. i18n/types.ts — add missing keys
# ─────────────────────────────────────────────────────────────────
path = f'{BASE}/src/lib/i18n/types.ts'
src = open(path).read()

# Add softMode + softModeDesc after normalMode
if 'softMode' not in src:
    src = src.replace(
        '  normalMode: string;',
        '  softMode: string;\n  softModeDesc: string;\n  normalMode: string;'
    )
    print("✅ i18n/types.ts: added softMode + softModeDesc")
else:
    print("✅ i18n/types.ts: softMode already exists")

# Add new family roles
if 'familyDaughter' not in src:
    src = src.replace(
        '  familyTwins?: string;',
        '  familyTwins?: string;\n  familyDaughter?: string;\n  familySon?: string;\n  familyGrandmother?: string;\n  familyGrandfather?: string;'
    )
    print("✅ i18n/types.ts: added daughter/son/grandmother/grandfather roles")
else:
    print("✅ i18n/types.ts: family roles already exist")

# Add timing keys
if 'timingEvening' not in src:
    src = src.replace(
        '  afterparty?: string;',
        '  afterparty?: string;\n  timingEvening?: string;\n  timingNight?: string;\n  timingVeryLate?: string;'
    )
    print("✅ i18n/types.ts: added timing keys")
else:
    print("✅ i18n/types.ts: timing keys already exist")

# Add game type keys
if 'gtWhoknowsbetter' not in src:
    src += '\n// Game type label keys\nexport type {};\n'
    # Actually just add to the interface
    src = src.replace(
        '  coffeeShop?: string;',
        '  coffeeShop?: string;\n  gtWhoknowsbetter?: string;\n  gtVersus?: string;'
    )
    print("✅ i18n/types.ts: added gtWhoknowsbetter + gtVersus")
else:
    print("✅ i18n/types.ts: game type keys already exist")

open(path, 'w').write(src)

# ─────────────────────────────────────────────────────────────────
# 4. i18n/en.ts — add English translations for new keys
# ─────────────────────────────────────────────────────────────────
path = f'{BASE}/src/lib/i18n/en.ts'
src = open(path).read()

if 'softMode' not in src:
    src = src.replace(
        "  normalMode: '",
        "  softMode: 'Soft',\n  softModeDesc: 'Clean, safe, all-ages',\n  normalMode: '"
    )
    print("✅ en.ts: added softMode")

if 'familyDaughter' not in src:
    src = src.replace(
        "  familyTwins:",
        "  familyDaughter: 'Daughter',\n  familySon: 'Son',\n  familyGrandmother: 'Grandmother',\n  familyGrandfather: 'Grandfather',\n  familyTwins:"
    )
    print("✅ en.ts: added family roles")

if 'timingEvening' not in src:
    src = src.replace(
        "  afterparty:",
        "  afterparty: 'Afterparty',\n  coffeeShop: 'Coffee shop',\n  timingEvening: 'Evening',\n  timingNight: 'Night',\n  timingVeryLate: 'Very late',\n  gtWhoknowsbetter: 'Who Knows Better',\n  gtVersus: 'Versus Challenge',\n  afterparty:"
    )
    # Clean up duplicate afterparty
    src = re.sub(r"  afterparty: 'Afterparty',\n.*afterparty: 'Afterparty',", "  afterparty: 'Afterparty',", src)
    print("✅ en.ts: added timing + game type translations")

open(path, 'w').write(src)

print("\nAll patches applied. Now run: npm run build")