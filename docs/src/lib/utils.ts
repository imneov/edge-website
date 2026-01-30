/**
 * 工具函数模块
 * 提供 shadcn/ui 组件所需的 className 合并工具
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 className，处理 Tailwind CSS 类名冲突
 * @param inputs - 可变数量的类名参数
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
