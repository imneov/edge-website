/**
 * Webpack Alias 插件
 * 配置路径别名以便于组件导入
 * @example import { cn } from '@/lib/utils'
 */
const path = require('path')

module.exports = function () {
  return {
    name: 'webpack-alias-plugin',
    configureWebpack() {
      return {
        resolve: {
          alias: {
            '@': path.resolve(__dirname, '../'),
            '@components': path.resolve(__dirname, '../components'),
            '@css': path.resolve(__dirname, '../css'),
            '@lib': path.resolve(__dirname, '../lib'),
            '@pages': path.resolve(__dirname, '../pages'),
            '@plugins': path.resolve(__dirname, '../plugins'),
            '@theme': path.resolve(__dirname, '../theme')
          }
        }
      }
    }
  }
}
