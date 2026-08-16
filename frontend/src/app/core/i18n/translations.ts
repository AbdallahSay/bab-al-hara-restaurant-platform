export type Language = 'ar' | 'en';

export interface UiCopy {
  readonly brand: {
    readonly name: string;
    readonly tagline: string;
    readonly homeLabel: string;
    readonly languageLabel: string;
    readonly arabic: string;
    readonly english: string;
    readonly cart: string;
  };
  readonly common: {
    readonly retry: string;
    readonly backToMenu: string;
    readonly currency: string;
    readonly loading: string;
    readonly remove: string;
    readonly quantity: string;
    readonly subtotal: string;
    readonly deliveryFee: string;
    readonly total: string;
    readonly unavailable: string;
    readonly takeaway: string;
    readonly delivery: string;
    readonly cash: string;
  };
  readonly menu: {
    readonly eyebrow: string;
    readonly title: string;
    readonly introduction: string;
    readonly categoriesLabel: string;
    readonly allCategories: string;
    readonly add: string;
    readonly added: string;
    readonly preparation: string;
    readonly minutes: string;
    readonly loading: string;
    readonly empty: string;
    readonly errorTitle: string;
    readonly errorBody: string;
    readonly viewCart: string;
  };
  readonly cart: {
    readonly title: string;
    readonly itemCount: string;
    readonly itemsLabel: string;
    readonly emptyTitle: string;
    readonly emptyBody: string;
    readonly browseMenu: string;
    readonly increase: string;
    readonly decrease: string;
    readonly deliveryAtCheckout: string;
    readonly checkout: string;
    readonly totalsNotice: string;
  };
  readonly checkout: {
    readonly title: string;
    readonly contactTitle: string;
    readonly name: string;
    readonly namePlaceholder: string;
    readonly phone: string;
    readonly phonePlaceholder: string;
    readonly phoneHint: string;
    readonly orderType: string;
    readonly takeawayDescription: string;
    readonly deliveryDescription: string;
    readonly area: string;
    readonly chooseArea: string;
    readonly address: string;
    readonly addressPlaceholder: string;
    readonly note: string;
    readonly notePlaceholder: string;
    readonly payment: string;
    readonly cashDescription: string;
    readonly summary: string;
    readonly submit: string;
    readonly submitting: string;
    readonly required: string;
    readonly invalidPhone: string;
    readonly chooseDeliveryArea: string;
    readonly addressRequired: string;
    readonly areasError: string;
    readonly orderError: string;
    readonly unavailableError: string;
    readonly areaError: string;
    readonly emptyCart: string;
    readonly authoritativeNotice: string;
    readonly stepDetails: string;
    readonly stepFulfillment: string;
    readonly stepPayment: string;
    readonly free: string;
    readonly items: string;
    readonly orderTypeTakeaway: string;
    readonly orderTypeDelivery: string;
  };
  readonly success: {
    readonly eyebrow: string;
    readonly title: string;
    readonly message: string;
    readonly orderCode: string;
    readonly pickupMessage: string;
    readonly deliveryMessage: string;
    readonly priceUpdated: string;
    readonly newOrder: string;
    readonly missing: string;
  };
  readonly staff: {
    readonly title: string;
    readonly description: string;
    readonly email: string;
    readonly password: string;
    readonly signIn: string;
    readonly signingIn: string;
    readonly error: string;
    readonly customerMenu: string;
  };
  readonly kitchen: {
    readonly title: string;
    readonly currentOrders: string;
    readonly connectionLabel: string;
    readonly queueLabel: string;
    readonly signOut: string;
    readonly loading: string;
    readonly emptyTitle: string;
    readonly emptyBody: string;
    readonly queueError: string;
    readonly connected: string;
    readonly connecting: string;
    readonly reconnecting: string;
    readonly disconnected: string;
    readonly soundEnable: string;
    readonly soundEnabled: string;
    readonly newOrder: string;
    readonly received: string;
    readonly elapsed: string;
    readonly minute: string;
    readonly minutes: string;
    readonly customer: string;
    readonly address: string;
    readonly note: string;
    readonly items: string;
    readonly status: Readonly<Record<string, string>>;
  };
}

export const UI_COPY: Readonly<Record<Language, UiCopy>> = {
  ar: {
    brand: {
      name: 'باب الحارة',
      tagline: 'مشاوي شامية على الفحم',
      homeLabel: 'العودة إلى قائمة الطعام',
      languageLabel: 'لغة الواجهة',
      arabic: 'العربية',
      english: 'English',
      cart: 'السلة',
    },
    common: {
      retry: 'حاول مرة أخرى',
      backToMenu: 'العودة إلى القائمة',
      currency: 'ج.م',
      loading: 'جاري التحميل',
      remove: 'حذف',
      quantity: 'الكمية',
      subtotal: 'المجموع الفرعي',
      deliveryFee: 'رسوم التوصيل',
      total: 'الإجمالي',
      unavailable: 'غير متاح حالياً',
      takeaway: 'استلام من الفرع',
      delivery: 'توصيل',
      cash: 'الدفع عند الاستلام',
    },
    menu: {
      eyebrow: 'اطلب مباشرة',
      title: 'اختر طلبك',
      introduction: 'وجباتنا تُحضّر عند الطلب. اختر ما تحب وأكمل الطلب كضيف.',
      categoriesLabel: 'أقسام القائمة',
      allCategories: 'كل الأصناف',
      add: 'أضف للسلة',
      added: 'تمت الإضافة للسلة',
      preparation: 'وقت التحضير',
      minutes: 'دقيقة',
      loading: 'جاري تجهيز القائمة…',
      empty: 'لا توجد أصناف متاحة في القائمة الآن.',
      errorTitle: 'تعذر تحميل القائمة',
      errorBody: 'تحقق من اتصالك ثم حاول مرة أخرى.',
      viewCart: 'عرض السلة',
    },
    cart: {
      title: 'سلة الطلب',
      itemCount: 'صنف في السلة',
      itemsLabel: 'أصناف السلة',
      emptyTitle: 'السلة فارغة',
      emptyBody: 'أضف وجبتك المفضلة من القائمة للبدء.',
      browseMenu: 'تصفح القائمة',
      increase: 'زيادة الكمية',
      decrease: 'تقليل الكمية',
      deliveryAtCheckout: 'تُحسب عند اختيار منطقة التوصيل',
      checkout: 'إكمال الطلب',
      totalsNotice: 'الأسعار الظاهرة تقديرية ويؤكدها الخادم عند إرسال الطلب.',
    },
    checkout: {
      title: 'إتمام الطلب',
      contactTitle: 'بيانات التواصل',
      name: 'الاسم',
      namePlaceholder: 'اكتب اسمك',
      phone: 'رقم الموبايل',
      phonePlaceholder: '01xxxxxxxxx',
      phoneHint: 'اكتب رقم موبايل مصري صحيح.',
      orderType: 'طريقة الاستلام',
      takeawayDescription: 'استلم طلبك من المطعم بدون رسوم توصيل.',
      deliveryDescription: 'نوصل طلبك إلى منطقة متاحة.',
      area: 'منطقة التوصيل',
      chooseArea: 'اختر المنطقة',
      address: 'العنوان بالتفصيل',
      addressPlaceholder: 'الشارع، رقم المبنى، الدور وعلامة مميزة',
      note: 'ملاحظات للمطبخ',
      notePlaceholder: 'مثال: بدون بصل (اختياري)',
      payment: 'طريقة الدفع',
      cashDescription: 'ادفع نقداً عند استلام الطلب.',
      summary: 'ملخص الطلب',
      submit: 'تأكيد الطلب',
      submitting: 'جاري إرسال الطلب…',
      required: 'هذا الحقل مطلوب.',
      invalidPhone: 'أدخل رقم موبايل مصري صحيح.',
      chooseDeliveryArea: 'اختر منطقة توصيل.',
      addressRequired: 'اكتب عنوان التوصيل بالتفصيل.',
      areasError: 'تعذر تحميل مناطق التوصيل. حاول مرة أخرى.',
      orderError: 'تعذر إنشاء الطلب. لم يتم خصم أو تسجيل أي دفعة.',
      unavailableError: 'أحد الأصناف لم يعد متاحاً. ارجع إلى السلة وراجع طلبك.',
      areaError: 'منطقة التوصيل المختارة لم تعد متاحة.',
      emptyCart: 'السلة فارغة. أضف أصنافاً قبل إتمام الطلب.',
      authoritativeNotice: 'يحسب الخادم الأسعار ورسوم التوصيل والإجمالي النهائي.',
      stepDetails: 'بياناتك',
      stepFulfillment: 'الاستلام',
      stepPayment: 'الدفع',
      free: 'مجاناً',
      items: 'أصناف',
      orderTypeTakeaway: 'استلام من الفرع',
      orderTypeDelivery: 'توصيل للمنزل',
    },
    success: {
      eyebrow: 'تم استلام الطلب',
      title: 'طلبك وصل للمطبخ',
      message: 'احتفظ برقم الطلب عند الاستلام.',
      orderCode: 'رقم الطلب',
      pickupMessage: 'استلم طلبك من الفرع بعد تجهيزه.',
      deliveryMessage: 'سيُجهز طلبك للتوصيل إلى العنوان المسجل.',
      priceUpdated: 'تم تحديث السعر إلى القيمة الحالية قبل تأكيد الطلب.',
      newOrder: 'اطلب مرة أخرى',
      missing: 'لا يوجد طلب مؤكد لعرضه.',
    },
    staff: {
      title: 'دخول المطبخ',
      description: 'هذه الشاشة مخصصة لفريق المطبخ المصرح له.',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      signIn: 'دخول',
      signingIn: 'جاري الدخول…',
      error: 'تعذر الدخول. راجع البريد وكلمة المرور.',
      customerMenu: 'فتح قائمة العملاء',
    },
    kitchen: {
      title: 'شاشة المطبخ',
      currentOrders: 'الطلبات الحالية',
      connectionLabel: 'حالة اتصال شاشة المطبخ',
      queueLabel: 'قائمة طلبات المطبخ الحالية',
      signOut: 'تسجيل الخروج',
      loading: 'جاري تحميل الطلبات…',
      emptyTitle: 'لا توجد طلبات حالية',
      emptyBody: 'ستظهر الطلبات الجديدة هنا فور تأكيدها.',
      queueError: 'تعذر تحميل الطلبات المحفوظة. أعد المحاولة.',
      connected: 'متصل بالتحديثات المباشرة',
      connecting: 'جاري الاتصال',
      reconnecting: 'انقطع الاتصال، جاري إعادة الاتصال',
      disconnected: 'التحديث المباشر متوقف',
      soundEnable: 'تشغيل تنبيه الصوت',
      soundEnabled: 'تنبيه الصوت يعمل',
      newOrder: 'طلب جديد',
      received: 'وصل الساعة',
      elapsed: 'منذ',
      minute: 'دقيقة',
      minutes: 'دقائق',
      customer: 'العميل',
      address: 'العنوان',
      note: 'ملاحظة',
      items: 'الأصناف',
      status: {
        Pending: 'جديد',
        Confirmed: 'مؤكد',
        Preparing: 'قيد التحضير',
        Ready: 'جاهز',
        OnTheWay: 'في الطريق',
        Delivered: 'تم التسليم',
      },
    },
  },
  en: {
    brand: {
      name: 'Bab Al Hara',
      tagline: 'Levantine charcoal grill',
      homeLabel: 'Return to the menu',
      languageLabel: 'Interface language',
      arabic: 'العربية',
      english: 'English',
      cart: 'Cart',
    },
    common: {
      retry: 'Try again',
      backToMenu: 'Back to menu',
      currency: 'EGP',
      loading: 'Loading',
      remove: 'Remove',
      quantity: 'Quantity',
      subtotal: 'Subtotal',
      deliveryFee: 'Delivery fee',
      total: 'Total',
      unavailable: 'Currently unavailable',
      takeaway: 'Takeaway',
      delivery: 'Delivery',
      cash: 'Cash',
    },
    menu: {
      eyebrow: 'Order directly',
      title: 'Choose your meal',
      introduction:
        'Every meal is prepared to order. Choose your favourites and check out as a guest.',
      categoriesLabel: 'Menu categories',
      allCategories: 'All items',
      add: 'Add to cart',
      added: 'Added to cart',
      preparation: 'Preparation',
      minutes: 'min',
      loading: 'Preparing the menu…',
      empty: 'There are no menu items available right now.',
      errorTitle: 'The menu could not be loaded',
      errorBody: 'Check your connection and try again.',
      viewCart: 'View cart',
    },
    cart: {
      title: 'Your cart',
      itemCount: 'items in cart',
      itemsLabel: 'Cart items',
      emptyTitle: 'Your cart is empty',
      emptyBody: 'Add a favourite from the menu to get started.',
      browseMenu: 'Browse the menu',
      increase: 'Increase quantity',
      decrease: 'Decrease quantity',
      deliveryAtCheckout: 'Calculated after you choose a delivery area',
      checkout: 'Continue to checkout',
      totalsNotice: 'Displayed prices are estimates and are confirmed by the server on submission.',
    },
    checkout: {
      title: 'Checkout',
      contactTitle: 'Contact details',
      name: 'Name',
      namePlaceholder: 'Enter your name',
      phone: 'Mobile number',
      phonePlaceholder: '01xxxxxxxxx',
      phoneHint: 'Enter a valid Egyptian mobile number.',
      orderType: 'Order type',
      takeawayDescription: 'Collect from the restaurant with no delivery fee.',
      deliveryDescription: 'Delivery to one of our active areas.',
      area: 'Delivery area',
      chooseArea: 'Choose an area',
      address: 'Full address',
      addressPlaceholder: 'Street, building, floor, and a nearby landmark',
      note: 'Kitchen note',
      notePlaceholder: 'For example: no onion (optional)',
      payment: 'Payment method',
      cashDescription: 'Pay cash when you receive the order.',
      summary: 'Order summary',
      submit: 'Place cash order',
      submitting: 'Placing your order…',
      required: 'This field is required.',
      invalidPhone: 'Enter a valid Egyptian mobile number.',
      chooseDeliveryArea: 'Choose a delivery area.',
      addressRequired: 'Enter the full delivery address.',
      areasError: 'Delivery areas could not be loaded. Try again.',
      orderError: 'The order could not be created. No payment was taken or recorded.',
      unavailableError: 'An item is no longer available. Return to your cart and review the order.',
      areaError: 'The selected delivery area is no longer available.',
      emptyCart: 'Your cart is empty. Add items before checkout.',
      authoritativeNotice: 'The server calculates current prices, delivery fee, and final total.',
      stepDetails: 'Details',
      stepFulfillment: 'Fulfillment',
      stepPayment: 'Payment',
      free: 'Free',
      items: 'items',
      orderTypeTakeaway: 'Pick up from restaurant',
      orderTypeDelivery: 'Delivery to address',
    },
    success: {
      eyebrow: 'Order received',
      title: 'Your order reached the kitchen',
      message: 'Keep the order number for collection or delivery.',
      orderCode: 'Order number',
      pickupMessage: 'Collect your order from the restaurant when it is ready.',
      deliveryMessage: 'Your order will be prepared for delivery to the saved address.',
      priceUpdated: 'The total was updated to current prices before confirmation.',
      newOrder: 'Start another order',
      missing: 'There is no confirmed order to display.',
    },
    staff: {
      title: 'Kitchen sign in',
      description: 'This screen is restricted to authorised kitchen staff.',
      email: 'Email',
      password: 'Password',
      signIn: 'Sign in',
      signingIn: 'Signing in…',
      error: 'Sign-in failed. Check the email and password.',
      customerMenu: 'Open customer menu',
    },
    kitchen: {
      title: 'Kitchen screen',
      currentOrders: 'Current orders',
      connectionLabel: 'Kitchen connection status',
      queueLabel: 'Current kitchen orders',
      signOut: 'Sign out',
      loading: 'Loading current orders…',
      emptyTitle: 'No current orders',
      emptyBody: 'New confirmed orders will appear here immediately.',
      queueError: 'Saved orders could not be loaded. Try again.',
      connected: 'Live updates connected',
      connecting: 'Connecting to live updates',
      reconnecting: 'Connection lost, reconnecting',
      disconnected: 'Live updates disconnected',
      soundEnable: 'Enable sound alert',
      soundEnabled: 'Sound alert enabled',
      newOrder: 'New order',
      received: 'Received at',
      elapsed: 'Waiting',
      minute: 'minute',
      minutes: 'minutes',
      customer: 'Customer',
      address: 'Address',
      note: 'Note',
      items: 'Items',
      status: {
        Pending: 'New',
        Confirmed: 'Confirmed',
        Preparing: 'Preparing',
        Ready: 'Ready',
        OnTheWay: 'On the way',
        Delivered: 'Delivered',
      },
    },
  },
};
