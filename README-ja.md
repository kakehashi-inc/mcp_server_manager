# MCP Server Manager

MCPサーバーの起動・停止・監視・ログ取得・公開(ngrok)を行うElectronベースのGUIアプリケーション。

## 機能

- **プロセス管理**: 任意のMCPサーバーコマンドを登録し、起動/停止、状態監視、エラーハンドリングを実施
- **自動起動/自動再起動**: アプリ起動時の自動起動、異常終了時の条件付き自動再起動
- **WSL対応 (Windows)**: `platform: "wsl"` 指定でWSL内実行、ディストリ選択に対応
- **ログ管理**: プロセスごとに `stdout`/`stderr` を日別ファイルへ記録、保持日数で自動削除、定期ローテーション
- **ngrok連携**: 複数ポートを同時にトンネリング、URL表示・コピー、ログ閲覧/クリア
- **HTTPSプロキシ管理**: ローカルでTLS終端しローカルHTTPへ転送、日次ログ、自己署名証明書の自動(再)生成
- **Auth Proxy連携 (任意)**: `mcp-auth-proxy` を中継としてOIDC認証を付与可能
- **多言語対応/テーマ**: 日本語/英語、ライト/ダーク

## 対応OS

- Windows 10/11
- macOS 10.15+
- Linux (Debian系/RHEL系)

注記: 本プロジェクトは Windows ではコード署名を行っていません。SmartScreen が警告を表示する場合は「詳細情報」→「実行」を選択してください。

## データファイルの保存場所

すべてのデータは `~/.mcpm` ディレクトリに保存されます：

- **設定ファイル**: `~/.mcpm/config.json`
- **ログファイル**: `~/.mcpm/logs/`
  - プロセスログ: `{server_id}_YYYYMMDD_stdout.log`, `{server_id}_YYYYMMDD_stderr.log`
  - ngrokログ: `ngrok_YYYYMMDD.log`
  - HTTPSプロキシログ: `https_proxy_YYYYMMDD.log`

### ファイル構造

```text
~/.mcpm/
├── config.json      # 設定とMCPサーバー定義
├── certs/           # HTTPSプロキシ用のホスト名ごとの自己署名証明書
│   └── <hostname>/
│       ├── cert.pem
│       └── key.pem
└── logs/            # ログファイル
    ├── {server_id}_YYYYMMDD_stdout.log
    ├── {server_id}_YYYYMMDD_stderr.log
    ├── ngrok_YYYYMMDD.log
    └── https_proxy_YYYYMMDD.log
```

### config.json の形式

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
    "httpsProxies": {
      "example.local": {
        "forwardPort": 8080,
        "listenPort": 8443,
        "autoStart": true
      }
    },
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

## 開発者向けリファレンス

### 開発ルール

- 開発者の参照するドキュメントは`README.md`、`README-ja.md`を除き`Documents`に配置すること。
- 対応後は必ずリンターで確認を行い適切な修正を行うこと。故意にリンターエラーを許容する際は、その旨をコメントで明記すること。 **ビルドはリリース時に行うものでデバックには不要なのでリンターまでで十分**
- モデルの実装時は、テーブル単位でファイルを配置すること。
- 部品化するものは`modules`にファイルを作成して実装すること。
- 一時的なスクリプトなど（例:調査用スクリプト）は`scripts`ディレクトリに配置すること。
- モデルを作成および変更を加えた場合は、`Documents/テーブル定義.md`を更新すること。テーブル定義はテーブルごとに表で表現し、カラム名や型およびリレーションを表内で表現すること。
- システムの動作などに変更があった場合は、`Documents/システム仕様.md`を更新すること。

### 必要要件

- Node.js 22.x以上
- yarn 4
- Git

### インストール

```bash
# リポジトリのクローン
git clone <repository-url>
cd <repository-name>

# 依存関係のインストール
yarn install

# 開発起動
yarn dev
```

開発時のDevTools:

- DevTools はデタッチ表示で自動的に開きます
- F12 または Ctrl+Shift+I（macOSは Cmd+Option+I）でトグル可能

### ビルド/配布

- 全プラットフォーム: `yarn dist`
- Windows: `yarn dist:win`
- macOS: `yarn dist:mac`
- Linux: `yarn dist:linux`

開発時は BrowserRouter で `<http://localhost:3001>` を、配布ビルドでは HashRouter で `dist/renderer/index.html` を読み込みます。

### Windows 事前準備: 開発者モード

Windows で署名なしのローカルビルド/配布物を実行・テストする場合は、OSの開発者モードを有効にしてください。

1. 設定 → プライバシーとセキュリティ → 開発者向け
2. 「開発者モード」をオンにする
3. OSを再起動

### プロジェクト構造 (抜粋)

```text
src/
├── main/                  # Electron メイン: IPC/各種マネージャ
│   ├── index.ts           # 起動・ウィンドウ生成・サービス初期化
│   ├── ipc/               # IPCハンドラ
│   ├── services/          # 各種サービス
│   └── utils/             # 各種ユーティリティ
├── preload/               # renderer へ安全にAPIをブリッジ
├── renderer/              # React + MUI UI
├── shared/                # 型定義・定数(Default設定/保存パス)
└── public/                # アイコン等
```

### 使用技術

- **Electron**
- **React (MUI v7)**
- **TypeScript**
- **Zustand**
- **i18next**
- **Vite**

### Windows用アイコンの作成

```exec
magick public/icon.png -define icon:auto-resize=256,128,96,64,48,32,24,16 public/icon.ico
```

### WSL について（Windows）

- 起動時にWSLの有無を検出し、`wsl.exe -l -q/-v` を用いてディストリ一覧/既定/稼働状態を取得します

### 補足

- ngrokの同時セッション上限に達すると起動に失敗します。CLI/デスクトップ、またはダッシュボードの Agents で不要なセッションを切断してください。
- 「×」で閉じるとアプリは終了せずトレイへ格納されます。終了はトレイメニューの「終了」から行ってください。
