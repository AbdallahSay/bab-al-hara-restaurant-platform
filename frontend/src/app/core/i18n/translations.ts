export type Language = 'ar' | 'en';
export type FeedbackState = 'ready' | 'success' | 'error' | 'cleared' | 'help';

export interface UiCopy {
  readonly brandName: string;
  readonly brandTagline: string;
  readonly homeLabel: string;
  readonly languageLabel: string;
  readonly eyebrow: string;
  readonly heading: string;
  readonly introduction: string;
  readonly componentTitle: string;
  readonly componentDescription: string;
  readonly buttonGroupLabel: string;
  readonly fieldLabel: string;
  readonly fieldPlaceholder: string;
  readonly fieldHint: string;
  readonly fieldRequired: string;
  readonly primaryAction: string;
  readonly secondaryAction: string;
  readonly dangerAction: string;
  readonly quietAction: string;
  readonly statusTitle: string;
  readonly statusValue: string;
  readonly statusDescription: string;
  readonly feedbackTitle: string;
  readonly feedback: Readonly<Record<FeedbackState, string>>;
  readonly foundationNote: string;
}

export const UI_COPY: Readonly<Record<Language, UiCopy>> = {
  ar: {
    brandName: 'باب الحارة',
    brandTagline: 'منصة المطعم',
    homeLabel: 'العودة إلى الصفحة الرئيسية',
    languageLabel: 'لغة الواجهة',
    eyebrow: 'أساس واجهة موحّدة',
    heading: 'وضوح يعمل بالعربية والإنجليزية',
    introduction:
      'هذه الصفحة تتحقق من الاتجاه والطباعة وعناصر التفاعل الأساسية قبل بناء مسارات المنتج.',
    componentTitle: 'عناصر الواجهة الأساسية',
    componentDescription: 'جرّب الحقل والأزرار لمراجعة الحالات والتغذية الراجعة.',
    buttonGroupLabel: 'تسلسل الأزرار',
    fieldLabel: 'اسم العرض التجريبي',
    fieldPlaceholder: 'اكتب اسماً قصيراً',
    fieldHint: 'مثال لحقل واضح مع مساعدة وخطأ مرتبطين به.',
    fieldRequired: 'أدخل اسماً قبل الحفظ.',
    primaryAction: 'حفظ المثال',
    secondaryAction: 'إعادة التعيين',
    dangerAction: 'مسح الحقل',
    quietAction: 'عرض المساعدة',
    statusTitle: 'شارة حالة',
    statusValue: 'متصل',
    statusDescription: 'النص يوضّح الحالة، لذلك لا يعتمد المعنى على اللون وحده.',
    feedbackTitle: 'التغذية الراجعة',
    feedback: {
      ready: 'استخدم عناصر المثال لمراجعة الاستجابة.',
      success: 'تم حفظ المثال بنجاح.',
      error: 'تعذّر الحفظ لأن الحقل المطلوب فارغ.',
      cleared: 'تم مسح الحقل. يمكنك التراجع بإعادة الكتابة.',
      help: 'اكتب اسماً قصيراً، ثم اختر حفظ المثال لمراجعة حالة النجاح.',
    },
    foundationNote: 'لا تحتوي هذه الواجهة على بيانات تشغيلية أو ميزات مطعم وهمية.',
  },
  en: {
    brandName: 'Bab Al Hara',
    brandTagline: 'Restaurant platform',
    homeLabel: 'Return to the home page',
    languageLabel: 'Interface language',
    eyebrow: 'Shared interface foundation',
    heading: 'Clarity that works in Arabic and English',
    introduction:
      'This page validates direction, typography, and core interactions before product flows are built.',
    componentTitle: 'Core interface elements',
    componentDescription: 'Try the field and buttons to review states and feedback.',
    buttonGroupLabel: 'Button hierarchy',
    fieldLabel: 'Sample display name',
    fieldPlaceholder: 'Enter a short name',
    fieldHint: 'An example of a clear field with linked help and error text.',
    fieldRequired: 'Enter a name before saving.',
    primaryAction: 'Save example',
    secondaryAction: 'Reset',
    dangerAction: 'Clear field',
    quietAction: 'Show help',
    statusTitle: 'Status badge',
    statusValue: 'Connected',
    statusDescription: 'Text names the state, so meaning never depends on color alone.',
    feedbackTitle: 'Feedback',
    feedback: {
      ready: 'Use the sample controls to review the response.',
      success: 'The example was saved successfully.',
      error: 'The example could not be saved because the required field is empty.',
      cleared: 'The field was cleared. Re-entering text reverses this action.',
      help: 'Enter a short name, then choose Save example to review the success state.',
    },
    foundationNote: 'This shell contains no operational data or invented restaurant features.',
  },
};
