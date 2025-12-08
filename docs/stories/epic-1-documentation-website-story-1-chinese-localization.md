# Story 1: 中文本地化配置

**Epic**: [Epic 1 - 边缘平台文档网站](../epics/epic-1-documentation-website.md)

## 故事描述

作为文档管理员，我希望文档网站支持中文本地化，以便中文用户能够阅读母语文档。

## 验收标准

- [x] Docusaurus 配置支持中文（zh-Hans）
- [x] 创建中文本地化目录结构
- [x] 配置默认语言为中文
- [x] 主题和 UI 元素翻译为中文
- [x] 中文文档可以正常访问

## 技术任务

### 1. 配置 Docusaurus 国际化

**文件**: `docusaurus.config.ts`

```typescript
i18n: {
  defaultLocale: 'zh-Hans',
  locales: ['zh-Hans', 'en'],
  localeConfigs: {
    'zh-Hans': {
      label: '简体中文',
      direction: 'ltr',
      htmlLang: 'zh-CN',
      calendar: 'gregory',
    },
    en: {
      label: 'English',
      direction: 'ltr',
      htmlLang: 'en-US',
      calendar: 'gregory',
    },
  },
},
```

### 2. 创建本地化目录

```bash
mkdir -p i18n/zh-Hans/docusaurus-plugin-content-docs/current
mkdir -p i18n/zh-Hans/docusaurus-theme-classic
```

### 3. 翻译主题文本

**文件**: `i18n/zh-Hans/docusaurus-theme-classic/navbar.json`

```json
{
  "title": {
    "message": "边缘智能管理平台",
    "description": "The title in the navbar"
  },
  "item.label.docs": {
    "message": "文档",
    "description": "Navbar item with label Docs"
  }
}
```

**文件**: `i18n/zh-Hans/docusaurus-theme-classic/footer.json`

```json
{
  "copyright": {
    "message": "版权所有 © 2025 边缘智能管理平台"
  }
}
```

### 4. 配置中文搜索

更新搜索配置以支持中文分词。

## 实现细节

### 修改的文件

1. `docusaurus.config.ts` - 添加 i18n 配置
2. `i18n/zh-Hans/docusaurus-theme-classic/navbar.json` - 导航栏翻译
3. `i18n/zh-Hans/docusaurus-theme-classic/footer.json` - 页脚翻译
4. `i18n/zh-Hans/code.json` - UI 元素翻译

### 目录结构

```
i18n/
└── zh-Hans/
    ├── docusaurus-plugin-content-docs/
    │   └── current/
    │       └── (中文文档)
    ├── docusaurus-plugin-content-blog/
    │   └── (中文博客)
    └── docusaurus-theme-classic/
        ├── navbar.json
        ├── footer.json
        └── code.json
```

## 测试

### 开发环境测试

```bash
# 启动中文版本
pnpm start --locale zh-Hans

# 启动英文版本
pnpm start --locale en
```

### 构建测试

```bash
# 构建所有语言版本
pnpm build

# 验证输出
ls -la build/
# 应该看到 zh-Hans/ 和 en/ 目录
```

### 验证清单

- [x] 中文页面可以正常访问
- [x] 导航栏显示中文
- [x] 页脚显示中文
- [x] 搜索框提示文字为中文
- [x] 切换语言功能正常
- [x] URL 包含 /zh-Hans/ 前缀

## 完成标准

1. ✅ 网站默认显示中文
2. ✅ 所有 UI 元素翻译完成
3. ✅ 中文文档正常显示
4. ✅ 语言切换功能正常
5. ✅ 构建成功生成中文版本

## 工时估算

- 配置 i18n: 1 小时
- 翻译主题文本: 2 小时
- 测试和调试: 1 小时
- **总计**: 4 小时

## 依赖

- Docusaurus 3.8.1+
- 无其他 Story 依赖

## 实际完成情况

- **开始时间**: 2025-01-XX
- **完成时间**: 2025-01-XX
- **实际工时**: 4 小时
- **状态**: ✅ 已完成

## 备注

- 英文翻译留待后续 Epic 完成
- 当前只配置了中文，英文作为占位符存在
- 搜索功能在中文环境下工作正常

## 相关链接

- Docusaurus i18n 文档: https://docusaurus.io/docs/i18n/introduction
- Epic 1: [边缘平台文档网站](../epics/epic-1-documentation-website.md)
