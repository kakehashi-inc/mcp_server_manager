# MCP Server Manager

MCPサーバープロセスを管理するためのElectronベースのGUIアプリケーション

## 機能

- **プロセス管理**: Windows/macOS/Linuxでのプロセス起動・停止
- **WSL対応**: Windows WSL内でのプロセス実行
- **ログ管理**: 標準出力/エラー出力の分離記録とローテーション
- **多言語対応**: 日本語/英語
- **ダークモード**: UIテーマの切り替え
- **自動起動**: アプリ起動時の自動プロセス起動

## 対応OS

- Windows 10/11 (WSL対応)
- macOS 10.15+
- Linux (Ubuntu/Debian, RHEL/CentOS/Fedora)

## 開発環境のセットアップ

### 必要要件

- Node.js 22.x以上
- yarn 4
- Git

### インストール

```bash
# リポジトリのクローン
git clone <repository-url>
cd mcp_server_manager

# 依存関係のインストール
yarn install

# 開発起動
yarn dev
```

## ビルド

### 全プラットフォーム向けビルド
```bash
yarn dist
```

### プラットフォーム別ビルド
```bash
# Windows
yarn dist:win

# macOS
yarn dist:mac

# Linux
yarn dist:linux
```

## プロジェクト構造

```
mcp_server_manager/
├── src/
│   ├── main/              # Electronメインプロセス
│   │   ├── index.ts        # エントリポイント
│   │   ├── ipc/            # IPCハンドラー
│   │   ├── services/       # サービス層
│   │   └── utils/          # ユーティリティ
│   ├── renderer/           # Reactレンダラープロセス
│   │   ├── App.tsx         # メインコンポーネント
│   │   ├── components/     # UIコンポーネント
│   │   ├── pages/          # ページコンポーネント
│   │   ├── store/          # 状態管理
│   │   └── i18n/           # 多言語対応
│   ├── shared/             # 共通型定義
│   └── preload/            # プリロードスクリプト
├── public/                 # 静的ファイル
└── dist/                   # ビルド出力
```

## 使用技術

- **Electron**: デスクトップアプリケーションフレームワーク
- **React**: UIフレームワーク
- **TypeScript**: 型安全な開発
- **Material-UI**: UIコンポーネント
- **Zustand**: 状態管理
- **i18next**: 多言語対応
- **Vite**: ビルドツール

## ライセンス

MIT

## 開発者向け情報

### 実行モード

- 開発: `yarn dev`（Vite: http://localhost:3001, BrowserRouter）
- 本番: `yarn build && yarn start`（HashRouter で `dist/renderer/index.html` を読み込み）

### データファイルの保存場所

すべてのデータは `~/.mcpm` ディレクトリに保存されます：

- **設定ファイル**: `~/.mcpm/config.json`
- **ログファイル**: `~/.mcpm/logs/`

#### ファイル構造
```
~/.mcpm/
├── config.json      # 設定とMCPサーバー定義
└── logs/            # ログファイル
    ├── {server_id}_YYYYMMDD_stdout.log
    └── {server_id}_YYYYMMDD_stderr.log
```

#### config.json の形式

MCP Client標準形式に準拠した設定ファイル：

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {
        "NODE_ENV": "production"
      },
      "displayName": "Sequential Thinking Server",
      "platform": "host",
      "autoStart": true
    },
    "file-server": {
      "command": "python",
      "args": ["mcp_server.py"],
      "displayName": "File Server",
      "platform": "wsl",
      "wslDistribution": "Ubuntu",
      "autoStart": false
    }
  },
  "settings": {
    "language": "ja",
    "darkMode": false,
    "logDirectory": "~/.mcpm/logs",
    "wslLogDirectories": {
      "Ubuntu": "~/.mcpm/logs"
    },
    "logRetentionDays": 7
  }
}
```

#### MCPサーバー設定項目

- **command**: 実行コマンド（必須）
- **args**: コマンド引数の配列（必須）
- **env**: 環境変数（オプション）
- **displayName**: 表示名（オプション）
- **platform**: 実行環境 ("host" | "wsl")
- **wslDistribution**: WSLディストリビューション名（WSL利用時）
- **autoStart**: アプリ起動時の自動実行

### WSL について（Windows）
- アプリ起動時にWSLの有無を検出します（`wsl.exe -l -v` を使用）
- ディストリビューション一覧は名前・状態・バージョンを抽出し、既定のものは `(既定)` と表示
- 表示が想定と異なる場合は `wsl.exe -l -v` の結果に依存します
