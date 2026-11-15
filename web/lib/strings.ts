// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * All user-facing strings for the chat UI.
 * Arabic is the default; "en" exists for future locale switching.
 * Components read from t() — never hardcode display text.
 */

const strings = {
  ar: {
    // Thread
    loadingConversation: "جارٍ تحميل المحادثة",
    scrollToBottom: "انتقل للأسفل",
    welcomeMessage: "كيف أساعدك اليوم؟",
    composerPlaceholder: "اكتب سؤالك…",
    messageInput: "أدخل رسالتك",

    // Composer actions
    addAttachment: "إرفاق ملف",
    voiceInput: "إدخال صوتي",
    startVoiceInput: "إدخال صوتي",
    stopDictation: "إيقاف الإدخال الصوتي",
    stopVoiceInput: "إيقاف الإدخال الصوتي",
    sendMessage: "إرسال",
    cancelSending: "إلغاء الإرسال",
    stopGenerating: "إيقاف التوليد",
    assistantIsWorking: "المساعد يعمل",

    // Action bar
    copy: "نسخ",
    refresh: "إعادة التوليد",
    more: "المزيد",
    exportAsMarkdown: "تصدير كـ Markdown",
    edit: "تعديل",
    cancel: "إلغاء",
    update: "تحديث",
    previous: "السابق",
    next: "التالي",

    // Attachments (templates use {name} and {typeLabel} placeholders)
    previewOf: (name: string) => `معاينة ${name}`,
    preview: (name: string) => `معاينة ${name}`,
    attachmentAriaLabel: (src: string | undefined, name: string, typeLabel: string) =>
      src ? `معاينة ${name}` : `مرفق ${typeLabel}: ${name}`,
    uploadFailed: "، فشل الرفع",
    uploading: "، جارٍ الرفع",
    remove: (name: string) => `إزالة ${name}`,

    // Tool approval
    approvalTitle: "إجراء يتطلب موافقتك",
    draftTitle: "العنوان",
    draftBody: "النص",
    approve: "موافقة",
    reject: "رفض",
    approved: "تمت الموافقة",
    rejected: "تم الرفض",
    approvalPending: "في انتظار قرارك…",
    errorOccurred: "حدث خطأ",
    connectionError: "خطأ في الاتصال",
  },
  en: {
    loadingConversation: "Loading conversation",
    scrollToBottom: "Scroll to bottom",
    welcomeMessage: "How can I help you today?",
    composerPlaceholder: "Type your question…",
    messageInput: "Message input",

    addAttachment: "Add Attachment",
    voiceInput: "Voice input",
    startVoiceInput: "Start voice input",
    stopDictation: "Stop dictation",
    stopVoiceInput: "Stop voice input",
    sendMessage: "Send message",
    cancelSending: "Cancel sending",
    stopGenerating: "Stop generating",
    assistantIsWorking: "Assistant is working",

    copy: "Copy",
    refresh: "Refresh",
    more: "More",
    exportAsMarkdown: "Export as Markdown",
    edit: "Edit",
    cancel: "Cancel",
    update: "Update",
    previous: "Previous",
    next: "Next",

    previewOf: (name: string) => `Preview of ${name}`,
    preview: (name: string) => `Preview ${name}`,
    attachmentAriaLabel: (src: string | undefined, name: string, typeLabel: string) =>
      src ? `Preview ${name}` : `${typeLabel} attachment ${name}`,
    uploadFailed: ", upload failed",
    uploading: ", uploading",
    remove: (name: string) => `Remove ${name}`,

    // Tool approval
    approvalTitle: "Action requires your approval",
    draftTitle: "Title",
    draftBody: "Body",
    approve: "Approve",
    reject: "Reject",
    approved: "Approved",
    rejected: "Rejected",
    approvalPending: "Awaiting your decision…",
    errorOccurred: "An error occurred",
    connectionError: "Connection error",
  },
} as const;

type Locale = keyof typeof strings;

// Default locale — change this one line to switch the UI language
const currentLocale: Locale = "ar";

export const t = strings[currentLocale];
