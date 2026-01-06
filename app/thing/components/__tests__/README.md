# Thing Components 单元测试文档

## 测试覆盖概况

本目录包含了 `app/thing/components` 目录下所有组件的单元测试。

### 已完成测试的组件 ✅

#### 核心组件

1. **ImageUploader.test.tsx** - 图片上传组件测试
   - 渲染测试
   - 图片上传交互
   - 删除和设置主图功能
   - 文件数量和大小验证

2. **ImageSection.test.tsx** - 图片区域组件测试
   - 布局和标题渲染
   - 与 ImageUploader 的集成

3. **ItemFormLayout.test.tsx** - 表单布局组件测试
   - 标签页切换
   - 自动保存状态显示
   - 子组件渲染

4. **ItemCard.test.tsx** - 物品卡片组件测试（已存在）
   - 物品信息展示
   - 加载状态
   - 点击交互

5. **ItemCardImage.test.tsx** - 卡片图片组件测试（已存在）

6. **ItemGallery.test.tsx** - 画廊视图组件测试（已存在）

7. **ItemDetailDialog.test.tsx** - 物品详情对话框测试
   - 对话框打开/关闭
   - 物品详细信息展示
   - 图片显示
   - 标签、位置等信息展示

#### 导航和布局组件

8. **ThingNavigation.test.tsx** - 导航组件测试
   - 导航项渲染
   - 当前路径高亮
   - 路由链接

9. **ThingHeader.test.tsx** - 头部组件测试
   - 分类和标签下拉菜单
   - 视图切换
   - 筛选器交互

10. **ThingContent.test.tsx** - 内容组件测试
    - 列表和画廊视图
    - 加载/错误/空状态
    - 分页功能

#### 位置相关组件

11. **LocationDisplay.test.tsx** - 位置显示组件测试（已存在）

12. **LocationComboboxSelect.test.tsx** - 位置下拉选择器测试
    - 区域/房间/位置级联选择
    - 默认区域自动选择
    - API 加载和错误处理

13. **LocationComboboxSelectSimple.test.tsx** - 简化版位置选择器测试
    - 预留空间布局
    - 级联选择
    - 加载状态

14. **LocationTreeSelect.test.tsx** - 位置树形选择器测试
    - 树形结构渲染
    - 搜索功能
    - 展开/折叠操作
    - 过滤模式

#### 分类相关组件

15. **CategoryTreeSelect.test.tsx** - 分类树形选择器测试
    - 父子分类级联
    - 创建新分类
    - 未分类选项

16. **CreatableCategorySelect.test.tsx** - 可创建分类选择器测试
    - 搜索分类
    - 创建新分类
    - 未分类选项

#### 标签相关组件

17. **CreateTagDialog.test.tsx** - 创建标签对话框测试
    - 表单输入
    - 颜色选择
    - 提交和验证

18. **TagList.test.tsx** - 标签列表组件测试（已存在）

19. **TagCard.test.tsx** - 标签卡片组件测试（已存在）

20. **TagsSection.test.tsx** - 标签区域组件测试（已存在）

#### 筛选相关组件

21. **ItemFilters.test.tsx** - 物品筛选器测试
    - 基础和详细筛选
    - 名称、描述、分类、标签筛选
    - 日期、价格、位置筛选
    - 重置和应用功能

22. **SearchInput.test.tsx** - 搜索输入组件测试（已存在）

#### 其他UI组件

23. **QuantityEditor.test.tsx** - 数量编辑器测试（已存在）

24. **ImageSizeControl.test.tsx** - 图片大小控制测试（已存在）

25. **FolderIcon.test.tsx** - 文件夹图标测试（已存在）

26. **AutoSaveStatus.test.tsx** - 自动保存状态测试（已存在）

27. **DarkModeToggle.test.tsx** - 暗黑模式切换测试（已存在）

28. **LoadingState.test.tsx** - 加载状态测试（已存在）

29. **DetailsSection.test.tsx** - 详情区域组件测试（已存在）

30. **GalleryItem.test.tsx** - 画廊项目组件测试（已存在）

31. **SpeedDial.test.tsx** - 快速拨号组件测试（已存在）

### 子目录组件

#### forms 目录

- `UnifiedBasicInfoForm.tsx` - 统一基础信息表单（未测试）
- `ItemFormWrapper.tsx` - 表单包装器（未测试）
- `DetailInfoForm.tsx` - 详细信息表单（未测试）
- `UnifiedDetailInfoForm.tsx` - 统一详细信息表单（未测试）

#### filters 目录

- `BasicFilters.tsx` - 基础筛选器（未测试）
- `DateRangePicker.tsx` - 日期范围选择器（未测试）

## 测试技术栈

- **测试框架**: Vitest
- **测试工具**: @testing-library/react, @testing-library/user-event
- **Mock 工具**: vi (Vitest 内置)

## 测试模式和最佳实践

### 1. 组件渲染测试

- 验证组件正确渲染
- 检查必要的 UI 元素存在
- 测试不同 props 下的渲染结果

### 2. 用户交互测试

- 使用 userEvent 模拟用户操作
- 验证点击、输入等交互
- 检查回调函数被正确调用

### 3. 状态管理测试

- 测试加载状态
- 测试错误状态
- 测试空状态

### 4. Mock 策略

- Mock 外部依赖（API、Router 等）
- Mock 子组件以隔离测试
- Mock 第三方库（sonner、next/image 等）

## 运行测试

```bash
# 运行所有测试
npm test

# 运行特定组件测试
npm test ImageUploader

# 以 watch 模式运行
npm test -- --watch

# 生成覆盖率报告
npm test -- --coverage
```

## 待完成

- [ ] forms 目录下的组件测试
- [ ] filters 目录下的组件测试
- [ ] 提高测试覆盖率到 90% 以上
- [ ] 添加集成测试
- [ ] 添加 E2E 测试

## 贡献指南

编写新的测试时，请遵循以下规范：

1. 测试文件命名：`ComponentName.test.tsx`
2. 测试结构：使用 `describe` 和 `it` 组织测试用例
3. Mock 位置：在文件顶部统一声明
4. 清理：使用 `beforeEach` 清理 mock
5. 断言：使用清晰、具体的断言
6. 注释：为复杂的测试逻辑添加注释

## 更新日期

2024-01-06
