/**
 * AnimatedGradientText 组件
 * 带有动画渐变效果的文字组件
 */
import { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/lib/utils'

export interface AnimatedGradientTextProps extends ComponentPropsWithoutRef<'span'> {
  /** 动画速度，默认为 1 */
  speed?: number
  /** 渐变起始颜色 */
  colorFrom?: string
  /** 渐变结束颜色 */
  colorTo?: string
}

/**
 * 动画渐变文字组件
 * @param speed - 动画速度系数
 * @param colorFrom - 渐变起始颜色
 * @param colorTo - 渐变结束颜色
 */
export function AnimatedGradientText({
  children,
  className,
  speed = 1,
  colorFrom = '#ffaa40',
  colorTo = '#9c40ff',
  ...props
}: AnimatedGradientTextProps) {
  return (
    <span
      style={
        {
          '--bg-size': `${speed * 300}%`,
          '--color-from': colorFrom,
          '--color-to': colorTo
        } as React.CSSProperties
      }
      className={cn(
        `animate-gradient inline bg-linear-to-r from-(--color-from) via-(--color-to) to-(--color-from) bg-size-[var(--bg-size)_100%] bg-clip-text text-transparent`,
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
