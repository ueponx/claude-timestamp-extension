# Claude Timestamp Extension

Claudeのチャット画面とRecentsページにタイムスタンプを表示するChrome拡張機能です。
※ドキュメントはLLMによって生成されました。

## 機能

### 1. チャット画面
ユーザーの質問にタイムスタンプを追加します。

**表示形式**: `2025/10/22 - 13:47:35`

### 2. Recentsページ
会話一覧の「○分前」などの相対時間表示を、タイムスタンプ形式に変換します。

**変換例**:
- `1 時間前` → `2025/10/22 - 12:47:35`
- `3日前` → `2025/10/19 - 13:47:35`

元の相対時間表示は、要素にマウスをホバーすると確認できます。

## インストール方法

### 1. ファイルの準備
以下のファイルを同じフォルダに配置します：
```
claude-timestamp-extension/
├── manifest.json
├── content.js
├── styles.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 2. Chrome拡張機能として読み込む
1. Chromeで `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」をONにする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `claude-timestamp-extension` フォルダを選択

### 3. 動作確認
1. `https://claude.ai/` にアクセス
2. チャットページでタイムスタンプが表示されることを確認
3. Recentsページ(`https://claude.ai/recents`)で相対時間が変換されることを確認

## 対応している相対時間パターン

### 日本語
- `○秒前` / `○ 秒前`
- `○分前` / `○ 分前`
- `○時間前` / `○ 時間前`
- `○日前` / `○ 日前`
- `○週間前` / `○ 週間前`
- `○ヶ月前` / `○ ヶ月前` / `○か月前`

### 英語
- `○ seconds ago` / `○ second ago`
- `○ minutes ago` / `○ minute ago`
- `○ hours ago` / `○ hour ago`
- `○ days ago` / `○ day ago`
- `○ weeks ago` / `○ week ago`
- `○ months ago` / `○ month ago`

## タイムスタンプの形式

**形式**: `YYYY/MM/DD - HH:MM:SS`（24時間表記）

- `YYYY`: 年（4桁）
- `MM`: 月（2桁、ゼロ埋め）
- `DD`: 日（2桁、ゼロ埋め）
- `HH`: 時（2桁、24時間表記、ゼロ埋め）
- `MM`: 分（2桁、ゼロ埋め）
- `SS`: 秒（2桁、ゼロ埋め）

**例**: `2025/10/22 - 13:47:35` = 2025年10月22日 13時47分35秒

## タイムゾーンについて

この拡張機能は、ユーザーのブラウザのタイムゾーン設定に従って時刻を表示します。
特別な設定は不要です。

## カスタマイズ

### タイムスタンプの形式を変更する

`content.js` の `formatTimestamp()` 関数を編集してください。

**例1: ハイフン区切り（YYYY-MM-DD形式）**
```javascript
function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${year}-${month}-${day} - ${hours}:${minutes}:${seconds}`;
}
```

**例2: 日本語形式**
```javascript
function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
}
```

### スタイルを変更する

`styles.css` を編集してください。

## トラブルシューティング

### チャット画面でタイムスタンプが表示されない

1. **開発者ツールでログを確認**
   - F12キーで開発者ツールを開く
   - Consoleタブで `[Timestamp]` で始まるログを確認
   - 「ユーザーメッセージが見つかりませんでした」と表示される場合は、DOM構造が変更されている可能性があります

2. **診断スクリプトを実行**
   - チャット画面で F12 → Consoleタブ
   - 診断スクリプト（chat-diagnose.js）を実行
   - 「使用すべきセレクタ」が表示されます

3. **手動でセレクタを確認**
   - ユーザーメッセージを右クリック → 「検証」
   - 要素のdata属性やクラス名を確認
   - `content.js` のセレクタ配列に追加

### Recentsページで時刻が変換されない

1. URLが `https://claude.ai/recents` であることを確認
2. ページをリロードしてみる
3. 開発者ツール（F12）のコンソールでエラーがないか確認

## 注意事項

### Recentsページの時刻精度

- 相対時間表示から逆算するため、ページを開いた時刻が基準になります
- より正確な時刻が必要な場合は、ClaudeのAPIレスポンスから実際のタイムスタンプを取得する実装が推奨されます
- 元の相対時間表示は、要素にマウスをホバーすると確認できます

## ライセンス

このコードは自由に使用・改変できます。

## 更新履歴

- **v1.1.0** (2025-10-22)
  - タイムスタンプ形式を変更: `20251022 - 12:47:35` → `2025/10/22 - 12:47:35`
  - チャットページのメッセージ検出を改善（複数のセレクタに対応）
  - デバッグログの追加
  
- **v1.0.0** (2025-10-22)
  - 初回リリース
  - チャットページのタイムスタンプ追加機能
  - Recentsページの相対時間変換機能
  - 日本語と英語の両方に対応
  - スペース付き相対時間表示に対応
