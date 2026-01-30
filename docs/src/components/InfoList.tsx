/**
 * InfoList 组件
 * 用于展示标签-值对的列表
 */
import React from 'react';

interface InfoItem {
  /** 标签名称 */
  label: string;
  /** 对应的值 */
  value: string;
}

interface InfoListProps {
  /** 列表项数据 */
  items: InfoItem[];
  /** 是否使用紧凑模式 */
  compact?: boolean;
  /** 标签宽度 */
  labelWidth?: string;
}

/**
 * 信息列表组件
 * @param items - 列表项数组
 * @param compact - 是否紧凑模式
 * @param labelWidth - 标签宽度
 */
export default function InfoList({
  items,
  compact = false,
  labelWidth = '100px',
}: InfoListProps) {
  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-3'}`}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`flex items-start ${compact ? 'text-sm' : 'text-base'}`}
        >
          <span
            className="shrink-0 font-medium text-gray-600 dark:text-gray-400"
            style={{ width: labelWidth }}
          >
            {item.label}
          </span>
          <span className="text-gray-800 dark:text-gray-200">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
