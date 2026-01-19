import { TECHNICAL_CONSTANTS } from './constants';

/**
 * 特定の機能が有効かどうかを判定する
 * 将来的にはユーザー権限や環境変数での切り替えに対応可能
 */
export const isFeatureEnabled = (featureKey: keyof typeof TECHNICAL_CONSTANTS.FEATURES): boolean => {
  return TECHNICAL_CONSTANTS.FEATURES[featureKey] ?? false;
};