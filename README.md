# Checkout UML Pages

这个项目把三个 Cursor Canvas 文件发布为 GitHub Pages 静态页面：

- `cart-uml.canvas.tsx`
- `quote-checkout-uml.canvas.tsx`
- `payment-uml.canvas.tsx`

## 本地预览

```bash
npm install
npm run dev
```

## 发布到 GitHub Pages

1. 把仓库推送到 GitHub 的 `main` 分支。
2. 打开仓库 `Settings -> Pages`。
3. 在 `Build and deployment` 里选择 `Source: GitHub Actions`。
4. 之后每次 push 到 `main`，`.github/workflows/deploy.yml` 会自动构建并发布。

构建产物会输出到 `dist`，GitHub Pages 会直接发布这个目录。
