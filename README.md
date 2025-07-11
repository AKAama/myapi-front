# MyAPI Frontend

一个基于 Tailwind CSS 和 DaisyUI 的现代化前端项目。

## 🚀 项目简介

这是一个使用 Tailwind CSS v4 和 DaisyUI 构建的前端项目，提供了现代化的UI组件和响应式设计。

## 🛠️ 技术栈

- **HTML5** - 页面结构
- **Tailwind CSS v4** - 实用优先的CSS框架
- **DaisyUI** - Tailwind CSS 组件库
- **Node.js** - 运行环境

## 📦 安装

1. 克隆项目到本地：
```bash
git clone <your-repository-url>
cd myapi-front
```

2. 安装依赖：
```bash
npm install
```

## 🎯 使用方法

### 开发模式

启动开发服务器：
```bash
npm run dev
```

### 构建生产版本

构建项目：
```bash
npm run build
```

### 预览构建结果

预览构建后的文件：
```bash
npm run preview
```

## 📁 项目结构

```
myapi-front/
├── src/
│   ├── index.html          # 主页面
│   ├── input.css           # Tailwind CSS 输入文件
│   └── output.css          # 编译后的CSS文件
├── package.json            # 项目配置
├── package-lock.json       # 依赖锁定文件
└── README.md              # 项目说明文档
```

## 🎨 特性

- ✨ 现代化的UI设计
- 📱 响应式布局
- 🎭 多主题支持（light、dark、cupcake）
- 🧩 DaisyUI 组件库
- ⚡ Tailwind CSS v4 快速开发

## 🎨 主题

项目支持多种主题：
- **Light** - 默认亮色主题
- **Dark** - 暗色主题（跟随系统偏好）
- **Cupcake** - 可爱风格主题

## 📝 开发说明

### CSS 配置

项目使用 Tailwind CSS v4 的新语法：

```css
@import "tailwindcss";

@plugin "daisyui" {
    themes: light --default, dark --prefersdark, cupcake;
}
```

### 组件使用

项目集成了 DaisyUI 组件库，可以直接使用其提供的组件类名：

```html
<div class="card w-96 bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Card Title</h2>
    <p>Card content</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Action</button>
    </div>
  </div>
</div>
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目采用 MIT 许可证。

## 📞 联系方式

如有问题，请通过以下方式联系：
- 邮箱：[your-email@example.com]
- GitHub：[your-github-username]

---

**注意**: 请根据实际情况修改仓库URL、联系方式和许可证信息。 