# 项目上下文

## 技术栈

- **核心**: Vite 7, TypeScript 5, React 19, Express
- **3D**: Three.js + @react-three/fiber 9 + @react-three/drei 10，地形噪声 simplex-noise
- **UI**: Tailwind CSS 3（设计令牌见 `src/ui/tokens.css`，设计规范见 `DESIGN.md`）

## 项目概览：永夜战区

3D 上帝视角大战略防守游戏。超大随机地形 → 区域规划 → 建筑部署 → 昼夜循环与多方向诡物进攻，分阶段开发。

## 目录结构

```
├── scripts/                  # 构建与启动脚本（dev/build/start 由 .coze 调用，勿手改）
├── server/                   # Express 服务（集成 Vite 中间件）
│   ├── routes/               # API 路由
│   ├── server.ts             # 服务入口
│   └── vite.ts               # Vite dev 中间件 / 生产静态托管
├── shared/
│   └── types.ts              # 前后端共享类型（区域/地形/昼夜枚举）
├── src/
│   ├── main.tsx              # React 入口
│   ├── App.tsx               # 页面根（GameScene + Hud）
│   ├── index.css             # Tailwind + 全局基础样式
│   ├── ui/tokens.css         # 全局 CSS 变量（色彩/字体/圆角/间距/动效）
│   ├── components/
│   │   ├── GameScene.tsx     # R3F Canvas、相机、雾光、星点
│   │   ├── Hud.tsx           # HUD 总装
│   │   └── hud/              # TopBar/LeftPanel/RightPanel/BottomBar/Minimap
│   └── game/
│       ├── cameraBus.ts      # HUD→3D 相机指令（聚焦/复位/全局）
│       ├── terrain/          # 地形：heightfield.ts(生成) / Terrain.tsx(呈现) / Trees.tsx
│       ├── buildings/        # 建筑系统（阶段二）
│       ├── enemies/          # 诡物与波次（阶段三）
│       └── regions/          # 区域规划（阶段一）
├── index.html                # 入口 HTML（加载 /src/main.tsx）
├── vite.config.ts            # Vite + @vitejs/plugin-react
└── tsconfig.json             # TS 配置（jsx: react-jsx, strict）
```

## 常用命令

- 开发：`pnpm run dev`（Express + Vite，端口由 `DEPLOY_RUN_PORT` 注入，默认 5000）
- 构建：`pnpm run build`（vite build + tsup 打包 server）
- 类型检查：`pnpm ts-check`；Lint：`pnpm lint:build`；样式：`pnpm lint:style`
- 3D 性能约定：大面积同类物体（树、诡物、箭矢）用 InstancedMesh/对象池，避免逐物体 Mesh。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

- 使用 Tailwind CSS 进行样式开发

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、Express `req`/`res`、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。
