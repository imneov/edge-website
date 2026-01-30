/**
 * RequirementChecklist 组件
 * 用于展示可勾选的需求检查清单
 */
import React, { useState } from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

interface ChecklistItem {
  /** 检查项标签 */
  label: string;
  /** 默认是否勾选 */
  defaultChecked?: boolean;
  /** 是否为可选项 */
  optional?: boolean;
}

interface RequirementChecklistProps {
  /** 清单标题 */
  title: string;
  /** 清单描述 */
  description?: string;
  /** 检查项列表 */
  items: ChecklistItem[];
}

/**
 * 需求检查清单组件
 * @param title - 清单标题
 * @param description - 清单描述
 * @param items - 检查项列表
 */
export default function RequirementChecklist({
  title,
  description,
  items,
}: RequirementChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>(
    items.reduce((acc, item, index) => {
      acc[index] = item.defaultChecked || false;
      return acc;
    }, {} as Record<number, boolean>)
  );

  const toggleItem = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const requiredItems = items.filter((item) => !item.optional);
  const checkedRequiredCount = requiredItems.filter(
    (_, index) => checkedItems[items.indexOf(requiredItems[index])]
  ).length;
  const allRequiredChecked = checkedRequiredCount === requiredItems.length;

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* 头部 */}
      <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 dark:border-gray-700 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <h4 className="m-0 text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h4>
          <div className="flex items-center gap-2">
            {allRequiredChecked ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                就绪
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5" />
                待完成
              </span>
            )}
          </div>
        </div>
        {description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
        )}
      </div>

      {/* 检查项列表 */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
            onClick={() => toggleItem(index)}
          >
            {checkedItems[index] ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-gray-300 dark:text-gray-600" />
            )}
            <span
              className={`flex-1 text-sm ${
                checkedItems[index]
                  ? 'text-gray-500 line-through dark:text-gray-400'
                  : 'text-gray-700 dark:text-gray-200'
              }`}
            >
              {item.label}
            </span>
            {item.optional && (
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                可选
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 底部统计 */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
        已完成 {Object.values(checkedItems).filter(Boolean).length} / {items.length} 项
      </div>
    </div>
  );
}
