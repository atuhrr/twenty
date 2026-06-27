import { COLOR_LIGHT } from '@ui/theme/constants/ColorsLight';
import { BORDER_COMMON } from './BorderCommon';
import { GRAY_SCALE_LIGHT } from './GrayScaleLight';
import { TRANSPARENT_COLORS_LIGHT } from './TransparentColorsLight';

export const BORDER_LIGHT = {
  color: {
    strong: GRAY_SCALE_LIGHT.gray6,
    medium: GRAY_SCALE_LIGHT.gray5,
    light: 'color(display-p3 0.918 0.925 0.941)', // Kommo #EAECF0
    secondaryInverted: GRAY_SCALE_LIGHT.gray11,
    inverted: GRAY_SCALE_LIGHT.gray12,
    danger: COLOR_LIGHT.red5,
    blue: COLOR_LIGHT.blue7,
    transparentStrong: TRANSPARENT_COLORS_LIGHT.gray4,
  },
  ...BORDER_COMMON,
};
