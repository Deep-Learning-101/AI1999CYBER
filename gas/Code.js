/**
 * Deep Learning 101 線上聚會平台 — GAS Webhook
 *
 * 部署步驟：
 * 1. 前往 https://script.google.com → 新增專案
 * 2. 把此檔案內容貼入編輯器
 * 3. 「部署」→「新增部署作業」→ 類型：網頁應用程式
 *      執行身分：我、誰可以存取：所有人
 * 5. 複製部署 URL 填入專案 .env 的 GAS_WEBHOOK_URL
 *
 * 若要更新程式碼：「部署」→「管理部署作業」→「編輯（鉛筆圖示）」→
 * 版本選「建立新版本」→ 部署（URL 不變）
 */

// ── 主入口 ──────────────────────────────────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.event === 'topic_submitted') {
      sendSubmissionEmail(data);
    } else if (data.event === 'status_updated') {
      sendStatusUpdateEmail(data);
      // 排程時另行通知訂閱者
      if (data.status === 'SCHEDULED' && data.subscriberEmails && data.subscriberEmails.length > 0) {
        sendSubscriberNotifications(data);
      }
    }

    return ok();
  } catch (err) {
    console.error('Webhook 錯誤：' + err.message);
    return error(err.message);
  }
}

// ── 議題提交確認信 ───────────────────────────────────────────────────
function sendSubmissionEmail(data) {
  var subject = '[Deep Learning 101] 議題申請已收到：' + data.topicTitle;
  var body = [
    '您好 ' + data.nickname + '，',
    '',
    '感謝您向 Deep Learning 101 提交議題！',
    '',
    '議題標題：' + data.topicTitle,
    '目前狀態：等待審核',
    '',
    '我們的核心成員將在近期審核您的申請，審核結果會另行通知。',
    '',
    '修改申請：',
    data.editUrl,
    '',
    '查看進度：',
    data.trackUrl,
    '',
    '請妥善保存此信件，連結包含您的專屬 Access Token，請勿轉發給他人。',
    '',
    '──────────────────────────',
    'Deep Learning 101',
    'https://deep-learning-101.github.io/',
  ].join('\n');

  GmailApp.sendEmail(data.companyEmail, subject, body, { name: 'Deep Learning 101' });
  console.log('提交確認信已寄出至 ' + data.companyEmail);
}

// ── 狀態更新通知信 ───────────────────────────────────────────────────
function sendStatusUpdateEmail(data) {
  var subject = '[Deep Learning 101] 議題進度更新：' + data.statusLabel;
  var body = [
    '您好 ' + data.nickname + '，',
    '',
    '您提交的議題狀態已更新！',
    '',
    '議題標題：' + data.topicTitle,
    '最新狀態：' + data.statusLabel,
    '',
    buildStatusNote(data),
    '',
    '查看完整進度時程：',
    data.trackUrl || '（請至平台查詢）',
    '',
    '──────────────────────────',
    'Deep Learning 101',
    'https://deep-learning-101.github.io/',
  ].join('\n');

  GmailApp.sendEmail(data.companyEmail, subject, body, { name: 'Deep Learning 101' });
  console.log('狀態更新信已寄出至 ' + data.companyEmail + '（' + data.statusLabel + '）');
}

// ── 訂閱者排程通知（多位訪客訂閱，一封一封寄出） ─────────────────────
function sendSubscriberNotifications(data) {
  var emails = data.subscriberEmails || [];
  if (!emails.length) return;

  var lines = [
    '您好，',
    '',
    '您追蹤的 Deep Learning 101 候選議題已正式排入聚會！',
    '',
    '議題標題：' + data.topicTitle,
    '主講者：' + data.nickname,
    '',
    buildStatusNote(data),
    '',
    '歡迎報名參加，一起交流學習 🎉',
    '',
    '──────────────────────────',
    'Deep Learning 101',
    'https://deep-learning-101.github.io/',
  ];
  var subject = '[Deep Learning 101] 您追蹤的議題已排程：' + data.topicTitle;
  var body    = lines.join('\n');

  for (var i = 0; i < emails.length; i++) {
    try {
      GmailApp.sendEmail(emails[i], subject, body, { name: 'Deep Learning 101' });
      console.log('訂閱通知已寄出至 ' + emails[i]);
    } catch (err) {
      console.error('訂閱通知寄送失敗 ' + emails[i] + '：' + err.message);
    }
  }
}

// ── 依狀態給予不同提示文字（SCHEDULED 補入聚會資訊） ────────────────
function buildStatusNote(data) {
  if (data.status === 'SCHEDULED') {
    var lines = ['已排程！以下是本次線上聚會資訊：', ''];
    if (data.meetingDate) {
      var d = new Date(data.meetingDate);
      lines.push('聚會時間：' + d.toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }));
    }
    if (data.meetingUrl) {
      lines.push('加入連結：' + data.meetingUrl);
    }
    lines.push('', '請準時參加，期待與您交流！');
    return lines.join('\n');
  }

  var notes = {
    REVIEWING: '核心成員正在審查您的議題，感謝耐心等候。',
    APPROVED:  '恭喜！您的議題已通過審核，我們正在安排聚會細節，確認後會再通知您。',
    COMPLETED: '聚會已順利完成，感謝您的參與與分享！',
    REJECTED:  '很遺憾，此次議題未能通過審核。歡迎修改後重新提交，或聯繫社群核心成員了解詳情。',
  };
  return notes[data.status] || '';
}

// ── 回應工具函式 ─────────────────────────────────────────────────────
function ok() {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function error(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── 本機測試用（在 GAS 編輯器直接執行） ────────────────────────────
function testSubmission() {
  sendSubmissionEmail({
    topicTitle:   'Transformer 在生產環境的記憶體優化',
    nickname:     '測試用戶',
    companyEmail: Session.getActiveUser().getEmail(),
    editUrl:      'https://example.com/edit?token=test-uuid',
    trackUrl:     'https://example.com/track?token=test-uuid',
  });
}

function testStatusUpdate() {
  sendStatusUpdateEmail({
    topicTitle:   'Transformer 在生產環境的記憶體優化',
    nickname:     '測試用戶',
    companyEmail: Session.getActiveUser().getEmail(),
    status:       'APPROVED',
    statusLabel:  '已核准',
    trackUrl:     'https://example.com/track?token=test-uuid',
  });
}
