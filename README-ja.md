# MCP Server Manager

MCPサーバーの起動・停止・監視・ログ取得・公開(ngrok)を行うElectronベースのGUIアプリケーション。

## 機能

- **プロセス管理**: 任意のMCPサーバーコマンドを登録し、起動/停止、状態監視、エラーハンドリングを実施
- **自動起動/自動再起動**: アプリ起動時の自動起動、異常終了時の条件付き自動再起動
- **WSL対応 (Windows)**: `platform: "wsl"` 指定でWSL内実行、ディストリ選択に対応
- **ログ管理**: プロセスごとに `stdout`/`stderr` を日別ファイルへ記録、保持日数で自動削除、定期ローテーション
- **ngrok連携**: 複数ポートを同時にトンネリング、URL表示・コピー、ログ閲覧/クリア
- **Auth Proxy連携 (任意)**: `mcp-auth-proxy` を中継としてOIDC認証を付与可能
- **多言語対応/テーマ**: 日本語/英語、ライト/ダーク

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

開発時のDevTools:

- DevTools はデタッチ表示で自動的に開きます
- F12 または Ctrl+Shift+I（macOSは Cmd+Option+I）でトグル可能

## ビルド/配布

- 全プラットフォーム: `yarn dist`
- Windows: `yarn dist:win`
- macOS: `yarn dist:mac`
- Linux: `yarn dist:linux`

開発時は BrowserRouter で `<http://localhost:3001>` を、配布ビルドでは HashRouter で `dist/renderer/index.html` を読み込みます。

### Windows 事前準備: 開発者モード

Windows で署名なしのローカルビルド/配布物を実行・テストする場合は、OSの開発者モードを有効にしてください。

1. 設定 → プライバシーとセキュリティ → 開発者向け
2. 「開発者モード」をオンにする
3. 必要に応じて再起動

注記: 本プロジェクトは Windows ではコード署名を行っていません（無料を維持するため）。SmartScreen が警告を表示する場合は「詳細情報」→「実行」を選択してください。

## プロジェクト構造 (抜粋)

```text
src/
├── main/                  # Electron メイン: IPC/各種マネージャ
│   ├── index.ts           # 起動・ウィンドウ生成・サービス初期化
│   ├── ipc/               # IPCハンドラ
│   ├── services/          # Process/Config/Log/ngrok 各マネージャ
│   └── utils/             # SystemUtils (WSL/実行ユーティリティ)
├── preload/               # renderer へ安全にAPIをブリッジ
├── renderer/              # React + MUI UI (Processes/Logs/Settings/Ngrok)
├── shared/                # 型定義・定数(Default設定/保存パス)
└── public/                # アイコン等
```

## 使用技術

- **Electron**
- **React (MUI v7)**
- **TypeScript**
- **Zustand**
- **i18next**
- **Vite**

## ライセンス

MIT

## 開発者向け情報

### 実行モード

- 開発: `yarn dev`（Vite: <http://localhost:3001>, BrowserRouter）
- 本番: `yarn build && yarn start`（HashRouter で `dist/renderer/index.html` を読み込み）

### データファイルの保存場所

すべてのデータは `~/.mcpm` ディレクトリに保存されます：

- **設定ファイル**: `~/.mcpm/config.json`
- **ログファイル**: `~/.mcpm/logs/`

#### ファイル構造

```text
~/.mcpm/
├── config.json      # 設定とMCPサーバー定義
└── logs/            # ログファイル
    ├── {server_id}_YYYYMMDD_stdout.log
    └── {server_id}_YYYYMMDD_stderr.log
```

#### config.json の形式

アプリ既定の `DEFAULT_CONFIG` を基に生成される設定ファイル：

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
      "autoStart": true,
      "autoRestartOnError": true,
      "useAuthProxy": false
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
    "logRetentionDays": 7,
    "restartDelayMs": 5000,
    "successfulStartThresholdMs": 10000,
    "showWindowOnStartup": true,
    "ngrokAuthToken": "",
    "ngrokMetadataName": "MCP Server Manager",
    "ngrokPorts": "3000,4000",
    "ngrokAutoStart": false,
    "oidcProviderName": "Auth0",
    "oidcConfigurationUrl": "",
    "oidcClientId": "",
    "oidcClientSecret": "",
    "oidcAllowedUsers": "",
    "oidcAllowedUsersGlob": ""
  }
}
```

#### MCPサーバー設定項目

- **command**: 実行コマンド
- **args**: 引数配列
- **env**: 環境変数
- **displayName**: 表示名
- **platform**: 実行環境 ("host" | "wsl")
- **wslDistribution**: WSLディストリ名（WSL時）
- **autoStart**: アプリ起動時の自動実行
- **autoRestartOnError**: 異常終了時の自動再起動(条件付き)
- **useAuthProxy**: mcp-auth-proxyでラップ実行
- **authProxyListenPort** / **authProxyExternalUrl**: Auth Proxy利用時の必須項目

### WSL について（Windows）

- 起動時にWSLの有無を検出し、`wsl.exe -l -q/-v` を用いてディストリ一覧/既定/稼働状態を取得します

### Windows用アイコンの作成

```exec
magick public/icon.png -define icon:auto-resize=256,128,96,64,48,32,24,16 public/icon.ico
```

## 補足

- ngrokの同時セッション上限に達すると起動に失敗します。CLI/デスクトップ、またはダッシュボードの Agents で不要なセッションを切断してください。
- 「×」で閉じるとアプリは終了せずトレイへ格納されます。終了はトレイメニューの「終了」から行ってください。
