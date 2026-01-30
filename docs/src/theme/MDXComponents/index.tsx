/**
 * MDX 自定义组件
 * 扩展默认 MDX 组件，提供更好的样式和交互
 */
import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import { Check, X } from 'lucide-react';

/**
 * 高亮文本组件
 */
interface HighlightProps {
  children: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

function Highlight({ children, color = 'blue' }: HighlightProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  };

  return (
    <span className={`rounded px-1.5 py-0.5 font-medium ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

/**
 * 功能对比表格组件
 */
interface FeatureComparisonProps {
  title?: string;
  features: Array<{
    name: string;
    basic?: boolean;
    pro?: boolean;
    enterprise?: boolean;
  }>;
}

function FeatureComparison({ title, features }: FeatureComparisonProps) {
  return (
    <div className="my-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      {title && (
        <div className="bg-gray-50 px-4 py-3 font-semibold dark:bg-gray-800">
          {title}
        </div>
      )}
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">功能</th>
            <th className="px-4 py-3 text-center text-sm font-semibold">基础版</th>
            <th className="px-4 py-3 text-center text-sm font-semibold">专业版</th>
            <th className="px-4 py-3 text-center text-sm font-semibold">企业版</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, idx) => (
            <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
              <td className="px-4 py-3 text-sm">{feature.name}</td>
              <td className="px-4 py-3 text-center">
                {feature.basic ? (
                  <Check className="mx-auto h-5 w-5 text-green-500" />
                ) : (
                  <X className="mx-auto h-5 w-5 text-gray-300" />
                )}
              </td>
              <td className="px-4 py-3 text-center">
                {feature.pro ? (
                  <Check className="mx-auto h-5 w-5 text-green-500" />
                ) : (
                  <X className="mx-auto h-5 w-5 text-gray-300" />
                )}
              </td>
              <td className="px-4 py-3 text-center">
                {feature.enterprise ? (
                  <Check className="mx-auto h-5 w-5 text-green-500" />
                ) : (
                  <X className="mx-auto h-5 w-5 text-gray-300" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 步骤指南组件
 */
interface StepProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

function Step({ number, title, children }: StepProps) {
  return (
    <div className="relative mb-8 pl-12">
      <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
        {number}
      </div>
      <h4 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{title}</h4>
      <div className="text-gray-600 dark:text-gray-300">{children}</div>
    </div>
  );
}

/**
 * 徽章组件
 */
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

function Badge({ children, variant = 'default' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}

/**
 * 键盘按键组件
 */
interface KbdProps {
  children: React.ReactNode;
}

function Kbd({ children }: KbdProps) {
  return (
    <kbd className="inline-flex items-center rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
      {children}
    </kbd>
  );
}

/**
 * 导出扩展的 MDX 组件
 */
export default {
  ...MDXComponents,
  Highlight,
  FeatureComparison,
  Step,
  Badge,
  Kbd,
};
