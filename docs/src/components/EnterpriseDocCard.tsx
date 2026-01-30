/**
 * EnterpriseDocCard 组件
 * 用于文档中展示企业级信息卡片
 */
import React, { useState, type ReactNode } from 'react';
import { Server, Info, Check, Shield, Network, Code, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * 图标类型映射
 */
const iconMap = {
  server: Server,
  info: Info,
  check: Check,
  security: Shield,
  network: Network,
  code: Code,
};

interface EnterpriseDocCardProps {
  /** 图标类型 */
  icon?: keyof typeof iconMap;
  /** 卡片标题 */
  title: string;
  /** 状态标签 */
  status?: ReactNode;
  /** 子内容 */
  children: ReactNode;
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 默认是否展开 */
  defaultOpen?: boolean;
}

/**
 * 企业文档卡片组件
 * @param icon - 图标类型
 * @param title - 卡片标题
 * @param status - 状态标签（可选）
 * @param children - 卡片内容
 * @param collapsible - 是否可折叠
 * @param defaultOpen - 默认是否展开
 */
export default function EnterpriseDocCard({
  icon = 'info',
  title,
  status,
  children,
  collapsible = false,
  defaultOpen = true,
}: EnterpriseDocCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const IconComponent = iconMap[icon] || Info;

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {/* 卡片头部 */}
      <div
        className={`flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900 ${
          collapsible ? 'cursor-pointer' : ''
        }`}
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <IconComponent className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          <h4 className="m-0 text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {status && <div className="text-sm">{status}</div>}
          {collapsible && (
            <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* 卡片内容 */}
      {(!collapsible || isOpen) && (
        <div className="p-4 text-gray-600 dark:text-gray-300">{children}</div>
      )}
    </div>
  );
}
