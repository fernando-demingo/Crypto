
import React from 'react';
import { RecommendationType } from '../types';

interface Props {
  type: RecommendationType;
}

const RecommendationBadge: React.FC<Props> = ({ type }) => {
  const config = {
    [RecommendationType.STRONG_BUY]: {
      label: 'STRONG BUY',
      color: 'bg-emerald-500',
      icon: 'fa-angles-up',
      border: 'border-emerald-400'
    },
    [RecommendationType.BUY]: {
      label: 'BUY',
      color: 'bg-green-500',
      icon: 'fa-angle-up',
      border: 'border-green-400'
    },
    [RecommendationType.HOLD]: {
      label: 'HOLD',
      color: 'bg-amber-500',
      icon: 'fa-arrows-left-right',
      border: 'border-amber-400'
    },
    [RecommendationType.SELL]: {
      label: 'SELL',
      color: 'bg-rose-500',
      icon: 'fa-angle-down',
      border: 'border-rose-400'
    },
    [RecommendationType.STRONG_SELL]: {
      label: 'STRONG SELL',
      color: 'bg-red-600',
      icon: 'fa-angles-down',
      border: 'border-red-500'
    },
  };

  const { label, color, icon, border } = config[type];

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${border} ${color} bg-opacity-20 text-white font-bold tracking-wider`}>
      <i className={`fas ${icon}`}></i>
      <span>{label}</span>
    </div>
  );
};

export default RecommendationBadge;
