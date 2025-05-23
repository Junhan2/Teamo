// Gray Cool color palette
export const grayCool = {
  25: '#FCFCFD',
  50: '#F9F9FB',
  100: '#EFF1F5',
  200: '#DCDFEA',
  300: '#B9C0D4',
  400: '#7D89AF',
  500: '#5D6A97',
  600: '#4A5578',
  700: '#404968',
  800: '#30374E',
  900: '#111322',
} as const;

// 클래스명을 CSS 변수로 변환하는 헬퍼 함수
export const grayClass = (level: keyof typeof grayCool, type: 'bg' | 'text' | 'border') => {
  return `var(--gray-cool-${level})`;
};

// 스타일 객체 생성 헬퍼
export const grayStyle = (level: keyof typeof grayCool, type: 'background' | 'color' | 'borderColor') => {
  return { [type]: grayCool[level] };
};