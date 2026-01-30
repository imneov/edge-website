/**
 * Tailwind CSS 插件
 * 为 Docusaurus 配置 PostCSS 处理器以支持 Tailwind CSS v4
 */
module.exports = function tailwindPlugin(context, options) {
  return {
    name: 'tailwind-plugin',
    configurePostCss(postcssOptions) {
      postcssOptions.plugins = [require('@tailwindcss/postcss')]
      return postcssOptions
    }
  }
}
