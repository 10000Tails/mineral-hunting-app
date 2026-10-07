/** Mineral Hunter branding: artwork, fonts and the gold/navy palette from the logo. */

export const brandImages = {
  welcomeBackground: require('../../assets/images/welcome-bg.jpg'),
  logo: require('../../assets/images/mineral-hunter-logo.png'),
};

/** Logo artwork aspect ratio (width / height) after trimming. */
export const LOGO_ASPECT = 703 / 852;

export const brandFonts = {
  semiBold: 'Cinzel_600SemiBold',
  bold: 'Cinzel_700Bold',
};

export const brandColors = {
  navy: '#021F46',
  ink: '#0A1428',
  gold: '#E8BE58',
  goldGradient: ['#F8DD84', '#DDAE40', '#A97A1F'] as const,
  goldText: '#2A1A05',
  white: '#FFFFFF',
  mist: 'rgba(255,255,255,0.75)',
};
