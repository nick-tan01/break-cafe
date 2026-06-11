import { TextStyle, ViewStyle } from 'react-native';

// Daybreak design tokens — the single source of truth for BREAK's visual
// language. Reference mockup: design-mockups/direction-6.html ("Daybreak":
// After Hours composition relit with Cloud Cover's morning palette).

export const colors = {
  ink: '#232B3A', // Slate Ink — primary text
  inkSoft: '#5A6478', // secondary text
  inkMuted: '#8B94A8', // tertiary text / placeholders
  sage: '#4F8268', // the one accent — buttons, links, active states
  sky: '#A9C6E8',
  lavender: '#CDC3EC',
  gold: '#E5A94F', // rating stars; in admin also the "dawn" new-order attention tint
  dawnInk: '#A8742B', // readable text on gold/dawn tinted fills (admin attention moments)
  white: '#FFFFFF',
  // Morning Mist background gradient, top-left → bottom-right
  gradient: ['#E7EFF8', '#EFEAF6', '#E9F2ED'] as [string, string, string],
  // Frosted glass (slightly more opaque than the mockup's 62% since plain
  // Views have no backdrop blur)
  glass: 'rgba(255,255,255,0.75)',
  glassSoft: 'rgba(255,255,255,0.5)',
  glassBorder: 'rgba(255,255,255,0.9)',
  hairline: 'rgba(79,130,104,0.3)', // sage hairline rules
  hairlineFaint: 'rgba(35,43,58,0.08)', // neutral row dividers
  sageBorder: 'rgba(79,130,104,0.4)', // outlined controls
  sageTint: 'rgba(79,130,104,0.08)', // sage-tinted fills
  tabInactive: '#9AA3B5',
};

export const fonts = {
  display: 'Marcellus_400Regular', // headlines, names, totals — letterspaced
  light: 'Jost_300Light', // body & metadata
  regular: 'Jost_400Regular',
  medium: 'Jost_500Medium',
  semibold: 'Jost_600SemiBold', // buttons, badges — uppercase
};

export const radius = {
  card: 14,
  control: 10,
  chip: 8,
  round: 999,
};

// Frosted-glass card base
export const glassCard: ViewStyle = {
  backgroundColor: colors.glass,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  borderRadius: radius.card,
  shadowColor: '#3F506E',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.14,
  shadowRadius: 14,
  elevation: 3,
};

// Marcellus display text at a given size (letterspacing scales with size)
export const display = (size: number): TextStyle => ({
  fontFamily: fonts.display,
  fontSize: size,
  letterSpacing: size * 0.05,
  color: colors.ink,
});

// Small uppercase label (kickers, section links, badges)
export const overline = (size = 11): TextStyle => ({
  fontFamily: fonts.semibold,
  fontSize: size,
  letterSpacing: size * 0.22,
  textTransform: 'uppercase',
  color: colors.sage,
});

// Solid sage primary button + its label
export const primaryButton: ViewStyle = {
  backgroundColor: colors.sage,
  borderRadius: radius.control,
  paddingVertical: 16,
  alignItems: 'center',
  shadowColor: colors.sage,
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.35,
  shadowRadius: 18,
  elevation: 4,
};

export const primaryButtonText: TextStyle = {
  color: colors.white,
  fontFamily: fonts.semibold,
  fontSize: 14,
  letterSpacing: 2.2,
  textTransform: 'uppercase',
};
