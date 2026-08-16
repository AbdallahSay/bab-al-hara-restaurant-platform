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
    readonly addedToast: string;
    readonly updatedToast: string;
    readonly addedToastSubtitle: string;
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
    readonly emptyFilterTitle: string;
    readonly emptyFilterBody: string;
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
    readonly takeawayBadge: string;
    readonly deliveryBadge: string;
    readonly orderCode: string;
    readonly allOrders: string;
    readonly pendingFilter: string;
    readonly confirmedFilter: string;
    readonly preparingFilter: string;
    readonly readyFilter: string;
    readonly confirmOrder: string;
    readonly startPreparing: string;
    readonly markReady: string;
    readonly readyForPickup: string;
    readonly updating: string;
    readonly refresh: string;
    readonly orderUpdatedByOther: string;
    readonly actionError: string;
    readonly manageAvailability: string;
    readonly availabilityTitle: string;
    readonly availabilitySubtitle: string;
    readonly available: string;
    readonly unavailable: string;
    readonly markAsAvailable: string;
    readonly markAsUnavailable: string;
    readonly toggleConfirmTitle: string;
    readonly toggleConfirmMessage: string;
    readonly confirm: string;
    readonly cancel: string;
    readonly close: string;
    readonly saving: string;
    readonly availabilityUpdated: string;
    readonly availabilityError: string;
    readonly searchItems: string;
    readonly allItems: string;
    readonly unavailableCount: string;
    readonly status: Readonly<Record<string, string>>;
  };
  readonly cashier: {
    readonly title: string;
    readonly signIn: string;
    readonly readyOrders: string;
    readonly noReadyOrders: string;
    readonly takeaway: string;
    readonly delivery: string;
    readonly waitingForDriver: string;
    readonly orderCode: string;
    readonly customer: string;
    readonly items: string;
    readonly total: string;
    readonly payment: string;
    readonly elapsed: string;
    readonly minute: string;
    readonly minutes: string;
    readonly handoff: string;
    readonly handoffConfirmTitle: string;
    readonly handoffConfirmBody: string;
    readonly handoffConfirmYes: string;
    readonly handoffConfirmNo: string;
    readonly handoffSuccess: string;
    readonly handoffStaleError: string;
    readonly handoffError: string;
    readonly loading: string;
    readonly loadError: string;
    readonly connected: string;
    readonly connecting: string;
    readonly reconnecting: string;
    readonly disconnected: string;
    readonly note: string;
    readonly address: string;
    readonly area: string;
    readonly signOut: string;
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
      addedToast: 'تمت الإضافة للسلة',
      updatedToast: 'تم تحديث الكمية في السلة',
      addedToastSubtitle: '{{itemName}} أضيف بنجاح',
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
      emptyFilterTitle: 'لا توجد طلبات في هذا القسم',
      emptyFilterBody: 'لا توجد طلبات تطابق التصفية المحددة حالياً.',
      queueError: 'تعذر تحميل الطلبات المحفوظة. أعد المحاولة.',
      connected: 'متصل بالتحديثات المباشرة',
      connecting: 'جاري الاتصال…',
      reconnecting: 'انقطع الاتصال، جاري إعادة الاتصال…',
      disconnected: 'التحديث المباشر متوقف',
      soundEnable: 'تشغيل تنبيه الصوت',
      soundEnabled: 'تنبيه الصوت يعمل',
      newOrder: 'طلب جديد!',
      received: 'وصل الساعة',
      elapsed: 'الانتظار',
      minute: 'دقيقة',
      minutes: 'دقائق',
      customer: 'العميل',
      address: 'العنوان',
      note: 'ملاحظة خاصة',
      items: 'الأصناف',
      takeawayBadge: 'استلام فرع',
      deliveryBadge: 'توصيل',
      orderCode: 'طلب #',
      allOrders: 'كل الطلبات',
      pendingFilter: 'جديد',
      confirmedFilter: 'مؤكد',
      preparingFilter: 'قيد التحضير',
      readyFilter: 'جاهز',
      confirmOrder: 'تأكيد الطلب',
      startPreparing: 'بدء التحضير',
      markReady: 'جاهز للتسليم',
      readyForPickup: 'جاهز للتسليم',
      updating: 'جاري التحديث…',
      refresh: 'تحديث البيانات',
      orderUpdatedByOther: 'تم تحديث هذا الطلب من قبل مستخدم آخر، تم تحديث الشاشة.',
      actionError: 'تعذر تحديث حالة الطلب. حاول مرة أخرى.',
      manageAvailability: 'توفر الأصناف',
      availabilityTitle: 'إدارة توفر أصناف القائمة',
      availabilitySubtitle: 'تحديث حالة الأصناف المتوفرة والنافذة فورياً لجميع العملاء.',
      available: 'متوفر',
      unavailable: 'غير متاح (نفذ)',
      markAsAvailable: 'تعيين كمتوفر',
      markAsUnavailable: 'تعيين كغير متاح (نافذ)',
      toggleConfirmTitle: 'تأكيد تغيير حالة الصنف',
      toggleConfirmMessage: 'هل أنت متأكد من تغيير حالة الصنف إلى',
      confirm: 'تأكيد التغيير',
      cancel: 'إلغاء',
      close: 'إغلاق',
      saving: 'جاري الحفظ…',
      availabilityUpdated: 'تم تحديث حالة الصنف بنجاح.',
      availabilityError: 'تعذر تحديث حالة الصنف. حاول مرة أخرى.',
      searchItems: 'بحث عن صنف…',
      allItems: 'كل الأقسام',
      unavailableCount: 'صنف غير متاح',
      status: {
        Pending: 'جديد',
        Confirmed: 'مؤكد',
        Preparing: 'قيد التحضير',
        Ready: 'جاهز',
        OnTheWay: 'في الطريق',
        Delivered: 'تم التسليم',
      },
    },
    cashier: {
      title: 'الكاشير',
      signIn: 'تسجيل الدخول',
      readyOrders: 'الطلبات الجاهزة',
      noReadyOrders: 'لا توجد طلبات جاهزة',
      takeaway: 'استلام',
      delivery: 'توصيل',
      waitingForDriver: 'بانتظار السائق',
      orderCode: 'رقم الطلب',
      customer: 'العميل',
      items: 'الأصناف',
      total: 'الإجمالي',
      payment: 'الدفع',
      elapsed: 'منذ',
      minute: 'دقيقة',
      minutes: 'دقائق',
      handoff: 'تسليم وإنهاء الطلب',
      handoffConfirmTitle: 'تأكيد التسليم',
      handoffConfirmBody: 'هل تم استلام المبلغ وتسليم الطلب للعميل؟',
      handoffConfirmYes: 'نعم، تسليم الطلب',
      handoffConfirmNo: 'إلغاء',
      handoffSuccess: 'تم تسليم الطلب بنجاح',
      handoffStaleError: 'تم تحديث البيانات، يرجى المحاولة مرة أخرى',
      handoffError: 'حدث خطأ، يرجى المحاولة مرة أخرى',
      loading: 'جاري التحميل...',
      loadError: 'حدث خطأ في تحميل الطلبات',
      connected: 'متصل',
      connecting: 'جاري الاتصال...',
      reconnecting: 'جاري إعادة الاتصال...',
      disconnected: 'غير متصل',
      note: 'ملاحظة',
      address: 'العنوان',
      area: 'المنطقة',
      signOut: 'تسجيل الخروج',
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
      addedToast: 'Added to cart',
      updatedToast: 'Cart quantity updated',
      addedToastSubtitle: '{{itemName}} was added successfully',
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
      title: 'Kitchen Screen',
      currentOrders: 'Active Orders',
      connectionLabel: 'Kitchen connection status',
      queueLabel: 'Current kitchen orders',
      signOut: 'Sign out',
      loading: 'Loading orders…',
      emptyTitle: 'No active orders',
      emptyBody: 'New confirmed orders will appear here immediately.',
      emptyFilterTitle: 'No orders in this section',
      emptyFilterBody: 'There are no orders matching the selected filter right now.',
      queueError: 'Saved orders could not be loaded. Try again.',
      connected: 'Live updates connected',
      connecting: 'Connecting…',
      reconnecting: 'Connection lost, reconnecting…',
      disconnected: 'Live updates disconnected',
      soundEnable: 'Enable sound alert',
      soundEnabled: 'Sound alert enabled',
      newOrder: 'New order!',
      received: 'Received at',
      elapsed: 'Waiting',
      minute: 'min',
      minutes: 'mins',
      customer: 'Customer',
      address: 'Address',
      note: 'Special Note',
      items: 'Items',
      takeawayBadge: 'Takeaway',
      deliveryBadge: 'Delivery',
      orderCode: 'Order #',
      allOrders: 'All Orders',
      pendingFilter: 'Pending',
      confirmedFilter: 'Confirmed',
      preparingFilter: 'Preparing',
      readyFilter: 'Ready',
      confirmOrder: 'Confirm Order',
      startPreparing: 'Start Preparing',
      markReady: 'Mark Ready',
      readyForPickup: 'Ready for Collection',
      updating: 'Updating…',
      refresh: 'Refresh data',
      orderUpdatedByOther: 'This order was updated by another user. Display refreshed.',
      actionError: 'Failed to update order status. Try again.',
      manageAvailability: 'Item Availability',
      availabilityTitle: 'Menu Item Availability',
      availabilitySubtitle: 'Update available and sold-out items across all ordering channels.',
      available: 'Available',
      unavailable: 'Unavailable (Sold Out)',
      markAsAvailable: 'Mark as Available',
      markAsUnavailable: 'Mark as Unavailable (Sold Out)',
      toggleConfirmTitle: 'Confirm Status Change',
      toggleConfirmMessage: 'Are you sure you want to change this item status to',
      confirm: 'Confirm Change',
      cancel: 'Cancel',
      close: 'Close',
      saving: 'Saving…',
      availabilityUpdated: 'Item availability updated successfully.',
      availabilityError: 'Failed to update item availability. Try again.',
      searchItems: 'Search items…',
      allItems: 'All Categories',
      unavailableCount: 'unavailable items',
      status: {
        Pending: 'New',
        Confirmed: 'Confirmed',
        Preparing: 'Preparing',
        Ready: 'Ready',
        OnTheWay: 'On the way',
        Delivered: 'Delivered',
      },
    },
    cashier: {
      title: 'Cashier',
      signIn: 'Sign in',
      readyOrders: 'Ready orders',
      noReadyOrders: 'No ready orders',
      takeaway: 'Takeaway',
      delivery: 'Delivery',
      waitingForDriver: 'Waiting for driver',
      orderCode: 'Order number',
      customer: 'Customer',
      items: 'Items',
      total: 'Total',
      payment: 'Payment',
      elapsed: 'Waiting',
      minute: 'minute',
      minutes: 'minutes',
      handoff: 'Complete & Hand Off',
      handoffConfirmTitle: 'Confirm Handoff',
      handoffConfirmBody: 'Has payment been collected and the order handed off to the customer?',
      handoffConfirmYes: 'Yes, hand off order',
      handoffConfirmNo: 'Cancel',
      handoffSuccess: 'Order handed off successfully',
      handoffStaleError: 'Order data was updated, please try again',
      handoffError: 'An error occurred, please try again',
      loading: 'Loading...',
      loadError: 'Failed to load orders',
      connected: 'Connected',
      connecting: 'Connecting...',
      reconnecting: 'Reconnecting...',
      disconnected: 'Disconnected',
      note: 'Note',
      address: 'Address',
      area: 'Area',
      signOut: 'Sign out',
    },
  },
};
