'use client';

import React, { useState, useTransition } from 'react';
import { updateFeatureFlag } from './actions';

interface FeatureToggleFormProps {
  featureKey: string;
  title: string;
  initialState: boolean;
}

export default function FeatureToggleForm({ featureKey, title, initialState }: FeatureToggleFormProps) {
  const [isEnabled, setIsEnabled] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // トグル変更時のハンドラ
  const handleToggle = (newStatus: boolean) => {
    // UIを先に更新して楽観的なフィードバックを提供
    setIsEnabled(newStatus); 
    setMessage('');

    startTransition(async () => {
      const { success, message: responseMessage } = await updateFeatureFlag(featureKey, newStatus);
      
      // 実際の結果で状態を更新
      if (success) {
        setIsSuccess(true);
        // Server Actionからのメッセージを表示
        setMessage(responseMessage); 
      } else {
        setIsSuccess(false);
        // エラーの場合はUIを元の状態に戻す（悲観的な更新）
        setIsEnabled(!newStatus);
        setMessage(responseMessage);
      }
    });
  };
  
  // スイッチの見た目（簡易的なトグルボタン）
  const buttonStyle = isEnabled
    ? 'bg-green-600 hover:bg-green-700 text-white'
    : 'bg-gray-300 hover:bg-gray-400 text-gray-800';
    
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
          ステータス: {isEnabled ? 'ON' : 'OFF'}
        </span>
        
        {/* 簡易トグルスイッチ */}
        <button
          onClick={() => handleToggle(!isEnabled)}
          disabled={isPending}
          className={`px-4 py-2 rounded-lg transition-colors duration-200 ease-in-out ${buttonStyle} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isPending ? '処理中...' : isEnabled ? 'OFFにする' : 'ONにする'}
        </button>
      </div>
      
      {/* メッセージ表示エリア */}
      {message && (
        <p className={`text-xs ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
}