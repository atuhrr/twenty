import { COLOR_LIGHT } from '@ui/theme/constants/ColorsLight';
import { FONT_COMMON } from './FontCommon';
import { GRAY_SCALE_LIGHT } from './GrayScaleLight';

export const FONT_LIGHT = {
  color: {
    primary: 'color(display-p3 0.063 0.094 0.157)', // Kommo #101828
    secondary: 'color(display-p3 0.400 0.439 0.522)', // Kommo #667085
    tertiary: GRAY_SCALE_LIGHT.gray9,
    light: GRAY_SCALE_LIGHT.gray8,
    extraLight: GRAY_SCALE_LIGHT.gray7,
    inverted: GRAY_SCALE_LIGHT.gray1,
    danger: COLOR_LIGHT.red,
  },
  ...FONT_COMMON,
};
