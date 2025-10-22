// Claude Timestamp Extension - Content Script
// Recentsページの相対時間をタイムスタンプに変換 + チャットページにタイムスタンプ追加

// ========================================
// ユーティリティ関数
// ========================================

// タイムスタンプをフォーマットする関数
// 形式: YYYY/MM/DD - HH:MM:SS
function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  return `${year}/${month}/${day} - ${hours}:${minutes}:${seconds}`;
}

// ========================================
// 相対時間のパース（Recentsページ用）
// ========================================

// 相対時間表示を解析して、タイムスタンプに変換
function parseRelativeTime(text) {
  const now = new Date();
  
  // 日本語パターン（数字と単位の間にスペースがある場合も対応）
  const jpPatterns = [
    { regex: /(\d+)\s*秒前/, unit: 'seconds' },
    { regex: /(\d+)\s*分前/, unit: 'minutes' },
    { regex: /(\d+)\s*時間前/, unit: 'hours' },
    { regex: /(\d+)\s*日前/, unit: 'days' },
    { regex: /(\d+)\s*週間前/, unit: 'weeks' },
    { regex: /(\d+)\s*ヶ月前/, unit: 'months' },
    { regex: /(\d+)\s*か月前/, unit: 'months' } // 「ヶ」の代わりに「か」も対応
  ];
  
  // 英語パターン
  const enPatterns = [
    { regex: /(\d+)\s*seconds?\s*ago/, unit: 'seconds' },
    { regex: /(\d+)\s*minutes?\s*ago/, unit: 'minutes' },
    { regex: /(\d+)\s*hours?\s*ago/, unit: 'hours' },
    { regex: /(\d+)\s*days?\s*ago/, unit: 'days' },
    { regex: /(\d+)\s*weeks?\s*ago/, unit: 'weeks' },
    { regex: /(\d+)\s*months?\s*ago/, unit: 'months' }
  ];
  
  const allPatterns = [...jpPatterns, ...enPatterns];
  
  for (const pattern of allPatterns) {
    const match = text.match(pattern.regex);
    if (match) {
      const value = parseInt(match[1]);
      const targetDate = new Date(now);
      
      switch (pattern.unit) {
        case 'seconds':
          targetDate.setSeconds(targetDate.getSeconds() - value);
          break;
        case 'minutes':
          targetDate.setMinutes(targetDate.getMinutes() - value);
          break;
        case 'hours':
          targetDate.setHours(targetDate.getHours() - value);
          break;
        case 'days':
          targetDate.setDate(targetDate.getDate() - value);
          break;
        case 'weeks':
          targetDate.setDate(targetDate.getDate() - (value * 7));
          break;
        case 'months':
          targetDate.setMonth(targetDate.getMonth() - value);
          break;
      }
      
      return formatTimestamp(targetDate);
    }
  }
  
  return null;
}

// ========================================
// Recentsページの時刻変換
// ========================================

// Recentsページの相対時間を変換
function convertRecentsTimestamps() {
  // 様々なセレクタで要素を検索
  const selectors = [
    'span', 'div', 'p', 'time',
    '[class*="time"]', '[class*="date"]', '[class*="ago"]',
    '[data-testid*="time"]', '[data-testid*="date"]'
  ];
  
  const processedElements = new Set();
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      // 既に処理済みの要素はスキップ
      if (processedElements.has(element)) return;
      
      // 子要素がない（テキストノードのみ）要素のみ処理
      if (element.children.length > 0) return;
      
      const text = element.textContent?.trim() || '';
      
      // 空文字や長すぎるテキストはスキップ
      if (!text || text.length > 50) return;
      
      // 相対時間パターンにマッチするか確認
      const timestamp = parseRelativeTime(text);
      
      if (timestamp) {
        // 元のテキストをtitle属性に保存（ホバーで確認可能）
        element.title = `元の表示: ${text}`;
        
        // テキストを置換
        element.textContent = timestamp;
        
        processedElements.add(element);
      }
    });
  }
}

// ========================================
// チャットページのタイムスタンプ追加
// ========================================

// チャットページにタイムスタンプを追加する関数
function addTimestampToMessage(messageElement) {
  // 既にタイムスタンプが追加されている場合はスキップ
  if (messageElement.querySelector('.claude-timestamp')) {
    return;
  }

  // タイムスタンプ要素を作成
  const timestamp = document.createElement('div');
  timestamp.className = 'claude-timestamp';
  timestamp.textContent = formatTimestamp(new Date());

  // メッセージ要素の最初に挿入
  messageElement.insertBefore(timestamp, messageElement.firstChild);
}

// 既存のメッセージを処理
function processExistingMessages() {
  // 様々なセレクタでユーザーメッセージを検索
  const selectors = [
    '[data-is-user-message="true"]',
    '[data-testid="user-message"]',
    '.user-message',
    '[class*="UserMessage"]',
    '[class*="user-message"]'
  ];
  
  let foundMessages = [];
  
  for (const selector of selectors) {
    const messages = document.querySelectorAll(selector);
    if (messages.length > 0) {
      foundMessages = Array.from(messages);
      console.log(`[Timestamp] チャットページ: ${selector} で ${messages.length}個のメッセージを発見`);
      break;
    }
  }
  
  foundMessages.forEach(message => {
    addTimestampToMessage(message);
  });
  
  if (foundMessages.length === 0) {
    console.log('[Timestamp] チャットページ: ユーザーメッセージが見つかりませんでした');
  }
}

// 新しいメッセージを監視
function observeNewMessages() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // 要素ノードのみ
          // 様々なセレクタでチェック
          const selectors = [
            '[data-is-user-message="true"]',
            '[data-testid="user-message"]',
            '.user-message',
            '[class*="UserMessage"]',
            '[class*="user-message"]'
          ];
          
          for (const selector of selectors) {
            // ノード自体がユーザーメッセージかチェック
            if (node.matches && node.matches(selector)) {
              addTimestampToMessage(node);
              break;
            }
            
            // 子要素の中にユーザーメッセージがあるかチェック
            const userMessages = node.querySelectorAll?.(selector);
            if (userMessages && userMessages.length > 0) {
              userMessages.forEach(message => {
                addTimestampToMessage(message);
              });
              break;
            }
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('[Timestamp] チャットページ: 新しいメッセージの監視を開始');
}

// ========================================
// Recentsページの監視
// ========================================

// Recentsページの変更を監視
function observeRecentsPage() {
  const observer = new MutationObserver(() => {
    // DOMが変更されたら再度変換を試みる
    convertRecentsTimestamps();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// ========================================
// 初期化
// ========================================

function init() {
  // 現在のページを判定
  const currentPath = window.location.pathname;
  console.log('[Timestamp] 現在のURL:', currentPath);
  
  // 少し待ってからページが読み込まれるのを確認
  setTimeout(() => {
    if (currentPath === '/recents') {
      // Recentsページの処理
      console.log('[Timestamp] Recentsページを検出');
      convertRecentsTimestamps();
      observeRecentsPage();
    } else if (currentPath.startsWith('/chat/') || currentPath === '/chat' || currentPath === '/new') {
      // チャットページの処理
      console.log('[Timestamp] チャットページを検出');
      processExistingMessages();
      observeNewMessages();
    } else {
      // その他のページでもチャット要素があれば処理
      console.log('[Timestamp] その他のページ:', currentPath);
      processExistingMessages();
      observeNewMessages();
    }
  }, 1000);
}

// ページ読み込み時に実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ページ遷移を監視（SPAの場合）
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    init();
  }
}).observe(document, { subtree: true, childList: true });
