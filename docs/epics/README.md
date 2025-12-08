# Epics 管理

这个目录包含文档网站项目的所有 Epic 文档。

## 命名规范

Epic 文件遵循命名模式：`epic-{n}-{name}.md`

- `{n}`: Epic 编号（从 1 开始）
- `{name}`: Epic 的简短描述性名称

**示例**:
- `epic-1-documentation-website.md`
- `epic-2-english-translation.md`
- `epic-3-documentation-enhancement.md`

## Epic 列表

### 已完成的 Epics

| Epic | 标题 | 状态 | Stories | 完成日期 |
|------|------|------|---------|----------|
| [Epic 1](./epic-1-documentation-website.md) | 边缘平台文档网站 | ✅ 已完成 | 4 | 2025-01-XX |

### 计划中的 Epics

| Epic | 标题 | 状态 | 预计Stories |
|------|------|------|------------|
| Epic 2 | 英文文档翻译 | 📋 计划中 | 3-4 |
| Epic 3 | 文档增强 | 📋 计划中 | 5-6 |
| Epic 4 | API 文档自动化 | 📋 计划中 | 4-5 |

## Epic 结构

每个 Epic 文档应包含以下章节：

1. **概述** - Epic 的目标和范围
2. **目标** - 具体要达成的目标
3. **范围** - 包含和不包含的内容
4. **成功标准** - 如何衡量 Epic 是否成功
5. **Stories** - 包含的 Story 列表
6. **时间线** - 开始和结束日期
7. **依赖** - 技术依赖和前置条件
8. **风险和缓解措施** - 潜在风险和应对方案
9. **产出物** - Epic 完成后的交付物
10. **后续工作** - 完成后可以开展的工作
11. **相关链接** - 相关文档和资源
12. **变更历史** - Epic 的变更记录

## 与 Stories 的关系

每个 Epic 包含多个 Stories：

```
Epic 1: 边缘平台文档网站
├── Story 1: 中文本地化配置
├── Story 2: 开发者文档
├── Story 3: 用户文档
└── Story 4: 修复链接和构建问题
```

Story 文件位于 `../stories/` 目录，遵循命名模式：
`epic-{epic-n}-{epic-name}-story-{story-n}-{story-name}.md`

## 创建新 Epic

创建新 Epic 时：

1. 确定 Epic 编号（当前最大编号 + 1）
2. 选择简短的描述性名称
3. 创建 Epic 文件：`epic-{n}-{name}.md`
4. 填写所有必需章节
5. 更新本 README 的 Epic 列表
6. 为 Epic 创建对应的 Stories

## 示例模板

参考 [Epic 1](./epic-1-documentation-website.md) 作为创建新 Epic 的模板。

## 最佳实践

1. **保持 Epic 规模适中**
   - 每个 Epic 包含 3-6 个 Stories
   - 持续时间 2-4 周

2. **明确范围**
   - 清楚定义包含和不包含的内容
   - 避免范围蔓延

3. **可衡量的成功标准**
   - 使用具体的、可验证的标准
   - 避免模糊的描述

4. **追踪进度**
   - 定期更新 Epic 状态
   - 记录变更历史
   - 维护 Story 列表

5. **文档链接**
   - 保持与 Stories 的双向链接
   - 链接相关的 Epics
   - 引用外部资源

## 维护指南

### 更新 Epic 状态

Epic 状态包括：
- 📋 **计划中** - Epic 已规划但未开始
- 🚧 **进行中** - Epic 正在执行
- ✅ **已完成** - Epic 所有 Stories 已完成
- ❌ **已取消** - Epic 被取消
- ⏸️ **暂停** - Epic 暂时搁置

### 变更管理

所有重要变更都应记录在 Epic 的"变更历史"章节：

```markdown
## 变更历史

| 日期 | 变更内容 | 负责人 |
|------|----------|--------|
| 2025-01-15 | Epic 创建 | Claude |
| 2025-01-20 | 添加 Story 4 | Claude |
| 2025-01-25 | Epic 完成 | Claude |
```

## 相关资源

- [Stories 目录](../stories/)
- [文档网站项目](../)
- [Docusaurus 官方文档](https://docusaurus.io)
