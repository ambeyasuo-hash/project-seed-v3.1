import { isFeatureEnabled } from './features';
import { TECHNICAL_CONSTANTS } from './constants';

type FeatureKey = keyof typeof TECHNICAL_CONSTANTS.FEATURES;

/**
 * プロキシ・ゲートウェイ
 * 全ての主要な機能実行はこの関数を経由し、機能フラグの検証を受ける
 */
export const gatewayProxy = async <T>(
  featureKey: FeatureKey,
  action: () => Promise<T>
): Promise<T> => {
  // 1. 機能フラグの確認
  if (!isFeatureEnabled(featureKey)) {
    throw new Error(`機能「${featureKey}」は現在無効化されています。`);
  }

  // 2. アクションの実行
  try {
    return await action();
  } catch (error) {
    console.error(`[Proxy Gateway Error] ${featureKey}:`, error);
    throw error;
  }
};