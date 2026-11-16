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
    readonly orders: string;
    readonly trackActiveOrder: string;
    readonly menu: string;
    readonly about: string;
    readonly contact: string;
    readonly search: string;
    readonly wishlist: string;
    readonly profile: string;
    readonly accountSettings: string;
    readonly signIn: string;
    readonly signUp: string;
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
    readonly restaurantPausedFallback: string;
    readonly restaurantPausedBrowsingNotice: string;
    readonly restaurantPausedSubmitTooltip: string;
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
    readonly stepDetails: string;
    readonly stepFulfillment: string;
    readonly stepPayment: string;
    readonly free: string;
    readonly items: string;
    readonly orderTypeTakeaway: string;
    readonly orderTypeDelivery: string;
    readonly savedContactNotice: string;
    readonly clearSavedContact: string;
    readonly savedAddressNotice: string;
    readonly clearSavedAddress: string;
    readonly staleDeliveryAreaWarning: string;
    readonly restaurantNotAcceptingOrdersError: string;
    readonly restaurantPausedButtonNotice: string;
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
    readonly trackOrder: string;
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
    readonly subtitle: string;
    readonly currentOrders: string;
    readonly filtersLabel: string;
    readonly searchOrders: string;
    readonly staffFallback: string;
    readonly refreshing: string;
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
    readonly selectDriver: string;
    readonly selectDriverPlaceholder: string;
    readonly assignDriver: string;
    readonly assignedDriver: string;
    readonly assignConfirmTitle: string;
    readonly assignConfirmBody: string;
    readonly assignConfirmYes: string;
    readonly assignConfirmNo: string;
    readonly assignDriverSuccess: string;
    readonly assignDriverStaleError: string;
    readonly assignDriverError: string;
    readonly driverStatus: string;
    readonly statusReady: string;
    readonly statusOnTheWay: string;
    readonly statusDelivered: string;
    readonly all: string;
    readonly takeawayQueue: string;
    readonly deliveryQueue: string;
    readonly filterAll: string;
    readonly searchPlaceholder: string;
    readonly noFilteredOrders: string;
    readonly clearSearch: string;
    readonly totalToCollect: string;
    readonly collect: string;
    readonly paid: string;
    readonly showDetails: string;
    readonly hideDetails: string;
    readonly expandAll: string;
    readonly collapseAll: string;
    readonly refresh: string;
    readonly soundEnable: string;
    readonly soundEnabled: string;
    readonly newOrder: string;
    readonly subtotal: string;
    readonly deliveryFee: string;
    readonly completing: string;
    readonly deliveryWaitingNotice: string;
  };
  readonly driver: {
    readonly title: string;
    readonly signIn: string;
    readonly signInTitle: string;
    readonly signInDescription: string;
    readonly assignedOrders: string;
    readonly activeDeliveries: string;
    readonly completedDeliveries: string;
    readonly noActiveOrders: string;
    readonly noActiveOrdersSub: string;
    readonly noCompletedOrders: string;
    readonly connectionLabel: string;
    readonly ordersLabel: string;
    readonly signOut: string;
    readonly loading: string;
    readonly loadError: string;
    readonly emptyTitle: string;
    readonly emptyBody: string;
    readonly emptyFilterTitle: string;
    readonly emptyFilterBody: string;
    readonly queueError: string;
    readonly connected: string;
    readonly connecting: string;
    readonly reconnecting: string;
    readonly disconnected: string;
    readonly newAssignment: string;
    readonly orderCode: string;
    readonly customer: string;
    readonly phone: string;
    readonly callCustomer: string;
    readonly deliveryDestination: string;
    readonly area: string;
    readonly address: string;
    readonly deliveryArea: string;
    readonly deliveryNote: string;
    readonly note: string;
    readonly items: string;
    readonly showItems: string;
    readonly hideItems: string;
    readonly itemCount: string;
    readonly payment: string;
    readonly codAmount: string;
    readonly paidOnline: string;
    readonly cashOnDelivery: string;
    readonly subtotal: string;
    readonly deliveryFee: string;
    readonly total: string;
    readonly paymentMethod: string;
    readonly paymentStatus: string;
    readonly paid: string;
    readonly unpaid: string;
    readonly allFilter: string;
    readonly readyFilter: string;
    readonly onTheWayFilter: string;
    readonly deliveredFilter: string;
    readonly startDelivery: string;
    readonly markDelivered: string;
    readonly startDeliveryAction: string;
    readonly markDeliveredAction: string;
    readonly startingDelivery: string;
    readonly markingDelivered: string;
    readonly startDeliveryConfirmTitle: string;
    readonly startDeliveryConfirmBody: string;
    readonly startDeliveryConfirmYes: string;
    readonly markDeliveredConfirmTitle: string;
    readonly markDeliveredConfirmBody: string;
    readonly markDeliveredConfirmYes: string;
    readonly confirmStartDeliveryTitle: string;
    readonly confirmStartDeliveryMessage: string;
    readonly confirmMarkDeliveredTitle: string;
    readonly confirmMarkDeliveredMessage: string;
    readonly confirm: string;
    readonly cancel: string;
    readonly actionInProgress: string;
    readonly actionSuccess: string;
    readonly staleError: string;
    readonly actionError: string;
    readonly refresh: string;
    readonly orderUpdatedByOther: string;
    readonly deliveryStartedSuccess: string;
    readonly orderDeliveredSuccess: string;
    readonly receivedAt: string;
    readonly elapsed: string;
    readonly minute: string;
    readonly minutes: string;
    readonly searchOrders: string;
    readonly sessionExpired: string;
    readonly statusReady: string;
    readonly statusOnTheWay: string;
    readonly statusDelivered: string;
    readonly status: Readonly<Record<string, string>>;
  };
  readonly orderTracking: {
    readonly title: string;
    readonly orderCode: string;
    readonly status: string;
    readonly lastUpdated: string;
    readonly orderSummary: string;
    readonly orderItems: string;
    readonly deliveryAddress: string;
    readonly payment: string;
    readonly orderTotal: string;
    readonly showDetails: string;
    readonly hideDetails: string;
    readonly loading: string;
    readonly error: string;
    readonly retry: string;
    readonly reconnecting: string;
    readonly connected: string;
    readonly noCredential: string;
    readonly steps: {
      readonly pending: string;
      readonly confirmed: string;
      readonly preparing: string;
      readonly readyDelivery: string;
      readonly readyTakeaway: string;
      readonly onTheWay: string;
      readonly delivered: string;
    };
    readonly reorder: {
      readonly orderAgain: string;
      readonly loadingPreview: string;
      readonly previewTitle: string;
      readonly previewDescription: string;
      readonly mergeConfirmTitle: string;
      readonly mergeConfirmQuestion: string;
      readonly mergeAction: string;
      readonly replaceAction: string;
      readonly cancelAction: string;
      readonly partialSuccessNotice: string;
      readonly allUnavailableNotice: string;
      readonly priceChangeNotice: string;
      readonly successToast: string;
      readonly viewCart: string;
      readonly unavailableReasons: {
        readonly soldOut: string;
        readonly unavailable: string;
      };
      readonly errorToast: string;
    };
  };
  readonly myOrders: {
    readonly title: string;
    readonly subtitle: string;
    readonly privacyNotice: string;
    readonly activeSectionTitle: string;
    readonly previousSectionTitle: string;
    readonly noOrdersTitle: string;
    readonly noOrdersBody: string;
    readonly browseMenu: string;
    readonly trackOrder: string;
    readonly viewDetails: string;
    readonly orderAgain: string;
    readonly removeFromList: string;
    readonly loading: string;
    readonly error: string;
    readonly retry: string;
    readonly orderCode: string;
    readonly elapsed: string;
    readonly minute: string;
    readonly minutes: string;
    readonly items: string;
    readonly takeaway: string;
    readonly delivery: string;
    readonly cash: string;
    readonly activeBadge: string;
    readonly previousBadge: string;
  };
  readonly management: {
    readonly title: string;
    readonly menuTitle: string;
    readonly hubTitle: string;
    readonly signInTitle: string;
    readonly signInSubtitle: string;
    readonly signIn: string;
    readonly signingIn: string;
    readonly email: string;
    readonly invalidEmail: string;
    readonly password: string;
    readonly signOut: string;
    readonly overview: string;
    readonly navHub: string;
    readonly navMenu: string;
    readonly navOperations: string;
    readonly navEmployees: string;
    readonly navReports: string;
    readonly viewCustomerMenu: string;
    readonly operations: {
      readonly title: string;
      readonly subtitle: string;
      readonly refresh: string;
      readonly realtimeConnected: string;
      readonly realtimeReconnecting: string;
      readonly realtimeDisconnected: string;
      readonly lastUpdated: string;
      readonly summary: {
        readonly activeOrders: string;
        readonly pending: string;
        readonly confirmed: string;
        readonly preparing: string;
        readonly ready: string;
        readonly onTheWay: string;
        readonly waitingDriver: string;
      };
      readonly attention: {
        readonly title: string;
        readonly noAttention: string;
        readonly unassignedDelivery: string;
        readonly unacknowledgedPending: string;
        readonly inspectAction: string;
      };
      readonly activeQueue: {
        readonly title: string;
        readonly emptyActive: string;
        readonly searchPlaceholder: string;
        readonly filterAll: string;
        readonly filterPending: string;
        readonly filterPreparing: string;
        readonly filterReady: string;
        readonly filterOnTheWay: string;
        readonly filterDelivery: string;
        readonly filterTakeaway: string;
        readonly colCode: string;
        readonly colCustomer: string;
        readonly colType: string;
        readonly colStatus: string;
        readonly colElapsedCreated: string;
        readonly colElapsedStatus: string;
        readonly colDriver: string;
        readonly colTotal: string;
        readonly colActions: string;
        readonly viewOrder: string;
        readonly noSearchResults: string;
      };
      readonly drawer: {
        readonly title: string;
        readonly close: string;
        readonly orderCode: string;
        readonly customerName: string;
        readonly customerPhone: string;
        readonly orderType: string;
        readonly status: string;
        readonly createdAt: string;
        readonly address: string;
        readonly deliveryArea: string;
        readonly customerNote: string;
        readonly noNote: string;
        readonly itemsTitle: string;
        readonly qty: string;
        readonly subtotal: string;
        readonly deliveryFee: string;
        readonly total: string;
        readonly paymentMethod: string;
        readonly paymentStatus: string;
        readonly cashOnDelivery: string;
        readonly cashTakeaway: string;
        readonly paid: string;
        readonly pendingPayment: string;
        readonly driverInfo: string;
        readonly driverNotAssigned: string;
        readonly assignedAt: string;
        readonly historyTitle: string;
        readonly noHistory: string;
      };
      readonly errors: {
        readonly loadFailed: string;
        readonly retry: string;
      };
      readonly time: {
        readonly justNow: string;
        readonly minutesAgo: string;
        readonly hoursAgo: string;
        readonly inStateForMinutes: string;
        readonly inStateForHours: string;
      };
    };
    readonly restaurantControl: {
      readonly title: string;
      readonly subtitle: string;
      readonly acceptingOrders: string;
      readonly openBadge: string;
      readonly pausedBadge: string;
      readonly pauseMessageAr: string;
      readonly pauseMessageEn: string;
      readonly pauseMessageArPlaceholder: string;
      readonly pauseMessageEnPlaceholder: string;
      readonly charCount: string;
      readonly lastUpdated: string;
      readonly updatedBy: string;
      readonly saveButton: string;
      readonly saving: string;
      readonly savedSuccess: string;
      readonly saveError: string;
      readonly staleError: string;
      readonly refreshPrompt: string;
    };
    readonly stats: {
      readonly title: string;
      readonly totalCategories: string;
      readonly activeCategories: string;
      readonly totalMenuItems: string;
      readonly availableItems: string;
      readonly soldOutItems: string;
      readonly archivedItems: string;
    };
    readonly categories: {
      readonly title: string;
      readonly subtitle: string;
      readonly newCategory: string;
      readonly editCategory: string;
      readonly nameAr: string;
      readonly nameEn: string;
      readonly displayOrder: string;
      readonly status: string;
      readonly active: string;
      readonly archived: string;
      readonly itemCount: string;
      readonly actions: string;
      readonly edit: string;
      readonly activate: string;
      readonly archive: string;
      readonly save: string;
      readonly saving: string;
      readonly cancel: string;
      readonly createSuccess: string;
      readonly updateSuccess: string;
      readonly toggleSuccess: string;
      readonly error: string;
      readonly staleError: string;
      readonly emptyTitle: string;
      readonly emptyBody: string;
      readonly nameArRequired: string;
      readonly nameEnRequired: string;
      readonly displayOrderInvalid: string;
    };
    readonly menuItems: {
      readonly title: string;
      readonly subtitle: string;
      readonly newItem: string;
      readonly editItem: string;
      readonly filterCategory: string;
      readonly allCategories: string;
      readonly searchPlaceholder: string;
      readonly image: string;
      readonly nameAr: string;
      readonly nameEn: string;
      readonly descriptionAr: string;
      readonly descriptionEn: string;
      readonly category: string;
      readonly selectCategory: string;
      readonly price: string;
      readonly preparationMinutes: string;
      readonly displayOrder: string;
      readonly availability: string;
      readonly available: string;
      readonly unavailable: string;
      readonly status: string;
      readonly active: string;
      readonly archived: string;
      readonly actions: string;
      readonly edit: string;
      readonly toggleAvailability: string;
      readonly toggleStatus: string;
      readonly save: string;
      readonly saving: string;
      readonly cancel: string;
      readonly createSuccess: string;
      readonly updateSuccess: string;
      readonly availabilitySuccess: string;
      readonly statusSuccess: string;
      readonly error: string;
      readonly staleError: string;
      readonly emptyTitle: string;
      readonly emptyBody: string;
      readonly noFilteredItems: string;
      readonly selectImage: string;
      readonly customImage: string;
      readonly imageRequired: string;
      readonly nameArRequired: string;
      readonly nameEnRequired: string;
      readonly priceInvalid: string;
      readonly prepTimeInvalid: string;
      readonly displayOrderInvalid: string;
      readonly categoryRequired: string;
      readonly sectionBasic: string;
      readonly sectionSelling: string;
      readonly sectionOrdering: string;
      readonly sectionImage: string;
      readonly chooseImage: string;
      readonly changeImage: string;
      readonly removeImage: string;
      readonly imageCardHint: string;
      readonly dropImageHint: string;
      readonly uploadingImage: string;
      readonly imageUploadFailed: string;
      readonly imageUploadError: string;
      readonly imageTooLarge: string;
      readonly imageFormatUnsupported: string;
      readonly removeImageConfirmTitle: string;
      readonly removeImageConfirmBody: string;
      readonly removeImageConfirmYes: string;
      readonly removeImageConfirmNo: string;
      readonly noImagePlaceholder: string;
      readonly retryUpload: string;
    };
    readonly tabs: {
      readonly categories: string;
      readonly menuItems: string;
    };
    readonly errors: {
      readonly loadFailed: string;
      readonly retry: string;
      readonly unauthorized: string;
      readonly forbidden: string;
    };
  };
  readonly employees: {
    readonly title: string;
    readonly addEmployee: string;
    readonly searchPlaceholder: string;
    readonly filterAll: string;
    readonly displayName: string;
    readonly email: string;
    readonly role: string;
    readonly status: string;
    readonly active: string;
    readonly disabled: string;
    readonly you: string;
    readonly actions: string;
    readonly edit: string;
    readonly enable: string;
    readonly disable: string;
    readonly resetPassword: string;
    readonly loading: string;
    readonly emptyTitle: string;
    readonly emptyBody: string;
    readonly noResults: string;
    readonly errorTitle: string;
    readonly errorBody: string;
    readonly createTitle: string;
    readonly editTitle: string;
    readonly basicInfo: string;
    readonly roleSection: string;
    readonly passwordSection: string;
    readonly displayNameLabel: string;
    readonly emailLabel: string;
    readonly temporaryPasswordLabel: string;
    readonly newPasswordLabel: string;
    readonly showPassword: string;
    readonly hidePassword: string;
    readonly generatePassword: string;
    readonly copyPassword: string;
    readonly copiedPassword: string;
    readonly save: string;
    readonly saving: string;
    readonly cancel: string;
    readonly roleKitchen: string;
    readonly roleCashier: string;
    readonly roleDriver: string;
    readonly roleManager: string;
    readonly roleAdmin: string;
    readonly disableTitle: string;
    readonly disableBody: string;
    readonly enableTitle: string;
    readonly enableBody: string;
    readonly roleChangeTitle: string;
    readonly roleChangeBody: string;
    readonly resetPasswordTitle: string;
    readonly resetPasswordBody: string;
    readonly confirmAction: string;
    readonly conflictError: string;
    readonly forbiddenError: string;
    readonly validationError: string;
    readonly sessionExpired: string;
  };
  readonly reports: {
    readonly title: string;
    readonly subtitle: string;
    readonly datePresetLabel: string;
    readonly presetToday: string;
    readonly presetYesterday: string;
    readonly presetLast7Days: string;
    readonly presetLast30Days: string;
    readonly presetCustom: string;
    readonly fromDate: string;
    readonly toDate: string;
    readonly invalidDateRange: string;
    readonly applyFilter: string;
    readonly fulfillmentFilterLabel: string;
    readonly fulfillmentAll: string;
    readonly fulfillmentDelivery: string;
    readonly fulfillmentTakeaway: string;
    readonly refresh: string;
    readonly refreshing: string;
    readonly lastUpdated: string;
    readonly summary: {
      readonly completedSales: string;
      readonly completedSalesHint: string;
      readonly completedOrders: string;
      readonly completedOrdersHint: string;
      readonly averageOrderValue: string;
      readonly averageOrderValueHint: string;
      readonly totalOrdersPlaced: string;
      readonly totalOrdersPlacedHint: string;
    };
    readonly trends: {
      readonly title: string;
      readonly subtitle: string;
      readonly revenueLegend: string;
      readonly ordersLegend: string;
      readonly viewTableToggle: string;
      readonly viewChartToggle: string;
      readonly tableAccessibleTitle: string;
      readonly tableDate: string;
      readonly tableRevenue: string;
      readonly tableCompletedOrders: string;
      readonly tableTotalOrders: string;
      readonly noTrendData: string;
    };
    readonly fulfillment: {
      readonly title: string;
      readonly subtitle: string;
      readonly deliveryTitle: string;
      readonly takeawayTitle: string;
      readonly orderCount: string;
      readonly revenue: string;
      readonly deliveryFees: string;
      readonly share: string;
      readonly totalVolume: string;
    };
    readonly bestSelling: {
      readonly title: string;
      readonly subtitle: string;
      readonly rank: string;
      readonly itemName: string;
      readonly quantitySold: string;
      readonly totalRevenue: string;
      readonly emptyNotice: string;
    };
    readonly timing: {
      readonly title: string;
      readonly subtitle: string;
      readonly avgPrepTime: string;
      readonly avgPrepTimeHint: string;
      readonly avgDeliveryTime: string;
      readonly avgDeliveryTimeHint: string;
      readonly avgTotalTime: string;
      readonly avgTotalTimeHint: string;
      readonly minutesUnit: string;
      readonly notAvailable: string;
      readonly hourlyTitle: string;
      readonly hourlySubtitle: string;
      readonly hourlyTableTitle: string;
      readonly hourlyHour: string;
      readonly hourlyOrders: string;
      readonly hourlyRevenue: string;
      readonly noTimingData: string;
    };
    readonly empty: {
      readonly title: string;
      readonly message: string;
      readonly resetFilter: string;
    };
    readonly errors: {
      readonly loadFailed: string;
      readonly retry: string;
    };
  };
  readonly home: {
    readonly heroEyebrow: string;
    readonly heroTitle: string;
    readonly heroSubtitle: string;
    readonly orderNow: string;
    readonly exploreMenu: string;
    readonly badgeFresh: string;
    readonly highlightsTitle: string;
    readonly feature1Title: string;
    readonly feature1Desc: string;
    readonly feature2Title: string;
    readonly feature2Desc: string;
    readonly feature3Title: string;
    readonly feature3Desc: string;
    readonly feature4Title: string;
    readonly feature4Desc: string;
    readonly specialsTitle: string;
    readonly specialsSubtitle: string;
    readonly aboutStoryTitle: string;
    readonly aboutStoryBody: string;
    readonly readMore: string;
    readonly reviewsTitle: string;
    readonly review1Text: string;
    readonly review1Author: string;
    readonly review2Text: string;
    readonly review2Author: string;
    readonly review3Text: string;
    readonly review3Author: string;
  };
  readonly about: {
    readonly eyebrow: string;
    readonly title: string;
    readonly subtitle: string;
    readonly storyTitle: string;
    readonly storyParagraph1: string;
    readonly storyParagraph2: string;
    readonly valuesTitle: string;
    readonly value1Title: string;
    readonly value1Desc: string;
    readonly value2Title: string;
    readonly value2Desc: string;
    readonly value3Title: string;
    readonly value3Desc: string;
    readonly statYears: string;
    readonly statYearsLabel: string;
    readonly statCustomers: string;
    readonly statCustomersLabel: string;
    readonly statDishes: string;
    readonly statDishesLabel: string;
    readonly ctaTitle: string;
    readonly ctaButton: string;
  };
  readonly contact: {
    readonly eyebrow: string;
    readonly title: string;
    readonly subtitle: string;
    readonly phoneTitle: string;
    readonly phoneValue: string;
    readonly whatsappTitle: string;
    readonly whatsappValue: string;
    readonly addressTitle: string;
    readonly addressValue: string;
    readonly hoursTitle: string;
    readonly hoursValue: string;
    readonly formTitle: string;
    readonly nameLabel: string;
    readonly phoneOrEmailLabel: string;
    readonly subjectLabel: string;
    readonly messageLabel: string;
    readonly submitButton: string;
    readonly successMessage: string;
    readonly validationError: string;
  };
  readonly search: {
    readonly title: string;
    readonly subtitle: string;
    readonly placeholder: string;
    readonly clear: string;
    readonly quickTags: string;
    readonly tagAll: string;
    readonly tagGrills: string;
    readonly tagShawarma: string;
    readonly tagSandwiches: string;
    readonly tagAppetizers: string;
    readonly tagDrinks: string;
    readonly resultsCount: string;
    readonly emptyTitle: string;
    readonly emptySubtitle: string;
    readonly browseAll: string;
  };
  readonly wishlist: {
    readonly title: string;
    readonly subtitle: string;
    readonly itemsCount: string;
    readonly addAllToCart: string;
    readonly addAllSuccess: string;
    readonly emptyTitle: string;
    readonly emptySubtitle: string;
    readonly browseMenu: string;
    readonly remove: string;
  };
  readonly profile: {
    readonly title: string;
    readonly greeting: string;
    readonly guestBadge: string;
    readonly personalInfoTitle: string;
    readonly nameLabel: string;
    readonly phoneLabel: string;
    readonly defaultAddressTitle: string;
    readonly noSavedAddress: string;
    readonly totalOrdersLabel: string;
    readonly wishlistLabel: string;
    readonly quickActionsTitle: string;
    readonly viewOrders: string;
    readonly viewWishlist: string;
    readonly accountSettings: string;
    readonly startOrder: string;
  };
  readonly accountSettings: {
    readonly title: string;
    readonly subtitle: string;
    readonly personalDetails: string;
    readonly name: string;
    readonly phone: string;
    readonly savedDeliveryAddress: string;
    readonly addressStreet: string;
    readonly addressBuilding: string;
    readonly addressFloor: string;
    readonly addressNotes: string;
    readonly saveChanges: string;
    readonly savedSuccess: string;
    readonly clearData: string;
    readonly clearConfirm: string;
    readonly clearedSuccess: string;
  };
  readonly auth: {
    readonly signInTab: string;
    readonly signUpTab: string;
    readonly signInTitle: string;
    readonly signUpTitle: string;
    readonly phoneOrEmail: string;
    readonly password: string;
    readonly name: string;
    readonly rememberMe: string;
    readonly forgotPassword: string;
    readonly signInSubmit: string;
    readonly signUpSubmit: string;
    readonly continueAsGuest: string;
    readonly guestNotice: string;
    readonly successNotice: string;
    readonly validationError: string;
  };
  readonly orderDetails: {
    readonly title: string;
    readonly orderNumber: string;
    readonly orderDate: string;
    readonly fulfillmentType: string;
    readonly deliveryAddress: string;
    readonly customerName: string;
    readonly customerPhone: string;
    readonly assignedDriver: string;
    readonly itemsTitle: string;
    readonly itemPrice: string;
    readonly itemQuantity: string;
    readonly itemTotal: string;
    readonly liveTrackButton: string;
    readonly reorderButton: string;
    readonly backToOrders: string;
  };
  readonly footer: {
    readonly description: string;
    readonly quickLinksTitle: string;
    readonly workingHoursTitle: string;
    readonly workingHoursValue: string;
    readonly contactTitle: string;
    readonly branchesTitle: string;
    readonly branchesValue: string;
    readonly copyright: string;
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
      orders: 'طلباتي',
      trackActiveOrder: 'متابعة طلبك',
      menu: 'القائمة',
      about: 'من نحن',
      contact: 'اتصل بنا',
      search: 'بحث',
      wishlist: 'المفضلة',
      profile: 'حسابي',
      accountSettings: 'إعدادات الحساب',
      signIn: 'تسجيل الدخول',
      signUp: 'إنشاء حساب',
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
      restaurantPausedFallback: 'المطعم لا يستقبل طلبات جديدة مؤقتًا',
      restaurantPausedBrowsingNotice: 'يمكنك تصفح القائمة وإضافة الأصناف إلى السلة للطلب لاحقًا.',
      restaurantPausedSubmitTooltip: 'المطعم متوقف مؤقتًا عن استقبال الطلبات',
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
      stepDetails: 'بياناتك',
      stepFulfillment: 'الاستلام',
      stepPayment: 'الدفع',
      free: 'مجاناً',
      items: 'أصناف',
      orderTypeTakeaway: 'استلام من الفرع',
      orderTypeDelivery: 'توصيل للمنزل',
      savedContactNotice: 'استخدمنا بياناتك المحفوظة على هذا الجهاز',
      clearSavedContact: 'مسح البيانات المحفوظة',
      savedAddressNotice: 'محفوظ على هذا الجهاز لتسهيل طلبك القادم.',
      clearSavedAddress: 'مسح العنوان المحفوظ',
      staleDeliveryAreaWarning: 'منطقة التوصيل المحفوظة لم تعد متاحة. اختر منطقة أخرى.',
      restaurantNotAcceptingOrdersError:
        'المطعم متوقف مؤقتًا عن استقبال طلبات جديدة. تم الاحتفاظ بسلتك ويمكنك إرسال الطلب فور استئناف العمل.',
      restaurantPausedButtonNotice: 'المطعم متوقف مؤقتًا عن استقبال الطلبات',
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
      trackOrder: 'تتبع طلبك',
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
      title: 'إدارة طلبات المطبخ',
      subtitle: 'راقب الطلبات وحضّرها وحدّث حالتها لحظياً.',
      currentOrders: 'الطلبات الحالية',
      filtersLabel: 'تصفية طلبات المطبخ',
      searchOrders: 'ابحث برقم الطلب أو اسم العميل…',
      staffFallback: 'فريق المطبخ',
      refreshing: 'جاري تحديث الطلبات…',
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
      handoffConfirmTitle: 'تأكيد تسليم الطلب',
      handoffConfirmBody: 'هل تم استلام المبلغ وتسليم الطلب للعميل؟',
      handoffConfirmYes: 'تأكيد وإنهاء',
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
      selectDriver: 'اختر السائق',
      selectDriverPlaceholder: '-- اختر سائقاً للتوصيل --',
      assignDriver: 'تعيين سائق',
      assignedDriver: 'السائق',
      assignConfirmTitle: 'تأكيد تعيين السائق',
      assignConfirmBody: 'هل أنت متأكد من تعيين السائق لهذا الطلب؟',
      assignConfirmYes: 'نعم، تعيين السائق',
      assignConfirmNo: 'إلغاء',
      assignDriverSuccess: 'تم تعيين السائق بنجاح',
      assignDriverStaleError: 'تم تعديل الطلب من قبل مستخدم آخر، يرجى إعادة المحاولة',
      assignDriverError: 'حدث خطأ أثناء تعيين السائق، يرجى المحاولة مرة أخرى',
      driverStatus: 'حالة التوصيل',
      statusReady: 'جاهز للتوصيل',
      statusOnTheWay: 'في الطريق',
      statusDelivered: 'تم التسليم',
      all: 'الكل',
      takeawayQueue: 'جاهز للاستلام',
      deliveryQueue: 'بانتظار سائق',
      filterAll: 'الكل',
      searchPlaceholder: 'بحث برقم الطلب أو اسم العميل...',
      noFilteredOrders: 'لا توجد طلبات تطابق التصفية أو البحث المحدد حالياً.',
      clearSearch: 'مسح البحث',
      totalToCollect: 'إجمالي المطلوب تحصيله',
      collect: 'تحصيل',
      paid: 'مدفوع',
      showDetails: 'عرض الأصناف',
      hideDetails: 'إخفاء الأصناف',
      expandAll: 'توسيع الكل',
      collapseAll: 'طي الكل',
      refresh: 'تحديث',
      soundEnable: 'تشغيل الصوت',
      soundEnabled: 'الصوت مفعّل',
      newOrder: 'طلب جاهز جديد!',
      subtotal: 'المجموع الفرعي',
      deliveryFee: 'رسوم التوصيل',
      completing: 'جاري الإنهاء...',
      deliveryWaitingNotice: 'الطلب جاهز بالمطعم بانتظار استلام السائق للتوصيل',
    },
    driver: {
      title: 'توصيل الطلبات',
      signIn: 'تسجيل دخول السائق',
      signInTitle: 'دخول السائقين',
      signInDescription: 'هذه الشاشة مخصصة لكباتن وسائقي التوصيل المصرح لهم.',
      assignedOrders: 'طلبات التوصيل المسندة',
      activeDeliveries: 'الطلبات الجارية',
      completedDeliveries: 'الطلبات المسلّمة',
      noActiveOrders: 'لا توجد طلبات جارية للتوصيل',
      noActiveOrdersSub: 'ستظهر الطلبات المعيّنة لك هنا فور تجهيزها بالمطعم.',
      noCompletedOrders: 'لا توجد طلبات مسلّمة اليوم',
      connectionLabel: 'حالة اتصال شاشة التوصيل',
      ordersLabel: 'قائمة طلبات التوصيل',
      signOut: 'تسجيل الخروج',
      loading: 'جاري تحميل طلبات التوصيل…',
      loadError: 'حدث خطأ في تحميل طلبات التوصيل',
      emptyTitle: 'لا توجد طلبات توصيل مسندة',
      emptyBody: 'ستظهر الطلبات المسندة إليك هنا فور تعيينها.',
      emptyFilterTitle: 'لا توجد طلبات في هذا القسم',
      emptyFilterBody: 'لا توجد طلبات مسندة تطابق التصفية المحددة حالياً.',
      queueError: 'تعذر تحميل طلبات التوصيل. أعد المحاولة.',
      connected: 'متصل بالتحديثات المباشرة',
      connecting: 'جاري الاتصال…',
      reconnecting: 'انقطع الاتصال، جاري إعادة الاتصال…',
      disconnected: 'التحديث المباشر متوقف',
      newAssignment: 'تم إسناد طلب توصيل جديد!',
      orderCode: 'طلب #',
      customer: 'بيانات العميل',
      phone: 'رقم الهاتف',
      callCustomer: 'اتصال بالعميل',
      deliveryDestination: 'عنوان التوصيل',
      area: 'المنطقة',
      address: 'العنوان بالتفصيل',
      deliveryArea: 'منطقة التوصيل',
      deliveryNote: 'ملاحظات التوصيل',
      note: 'ملاحظات العميل',
      items: 'محتويات الطلب',
      showItems: 'عرض الأصناف',
      hideItems: 'إخفاء الأصناف',
      itemCount: 'أصناف',
      payment: 'الدفع والتحصيل',
      codAmount: 'المطلوب تحصيله',
      paidOnline: 'مدفوع مسبقاً',
      cashOnDelivery: 'الدفع عند الاستلام (كاش)',
      subtotal: 'المجموع الفرعي',
      deliveryFee: 'رسوم التوصيل',
      total: 'الإجمالي المطلوب تحصيله',
      paymentMethod: 'طريقة الدفع',
      paymentStatus: 'حالة الدفع',
      paid: 'مدفوع',
      unpaid: 'غير مدفوع (مطلوب تحصيله)',
      allFilter: 'كل المسند',
      readyFilter: 'جاهز للاستلام',
      onTheWayFilter: 'في الطريق',
      deliveredFilter: 'تم التسليم',
      startDelivery: 'بدء التوصيل',
      markDelivered: 'تم التسليم',
      startDeliveryAction: 'بدء التوصيل',
      markDeliveredAction: 'تم التسليم',
      startingDelivery: 'جاري بدء التوصيل…',
      markingDelivered: 'جاري تأكيد التسليم…',
      startDeliveryConfirmTitle: 'تأكيد استلام الطلب وبدء التحرك',
      startDeliveryConfirmBody: 'هل استلمت وجبة الطلب من المطبخ وبدأت التوجه لعنوان العميل؟',
      startDeliveryConfirmYes: 'نعم، ابدأ التوصيل',
      markDeliveredConfirmTitle: 'تأكيد تسليم الطلب والتحصيل',
      markDeliveredConfirmBody: 'هل قمت بتسليم الطلب للعميل واستلام المبلغ المطلوب بالكامل؟',
      markDeliveredConfirmYes: 'نعم، تم التسليم',
      confirmStartDeliveryTitle: 'تأكيد استلام وبدء التوصيل',
      confirmStartDeliveryMessage: 'هل استلمت الطلب من المطعم وجاهز للبدء بالتوصيل إلى العنوان؟',
      confirmMarkDeliveredTitle: 'تأكيد تسليم الطلب',
      confirmMarkDeliveredMessage: 'هل تم تسليم الطلب للعميل واستلام المبلغ المطلوب بالكامل؟',
      confirm: 'تأكيد',
      cancel: 'تراجع',
      actionInProgress: 'جاري التحديث…',
      actionSuccess: 'تم تحديث حالة الطلب بنجاح',
      staleError: 'تم تعديل بيانات هذا الطلب من عملية أخرى. جاري تحديث الشاشة…',
      actionError: 'حدث خطأ أثناء تحديث الطلب. يرجى المحاولة مرة أخرى.',
      refresh: 'تحديث البيانات',
      orderUpdatedByOther: 'تم تحديث حالة هذا الطلب من جهة أخرى، تم تحديث الشاشة.',
      deliveryStartedSuccess: 'تم بدء التوصيل بنجاح.',
      orderDeliveredSuccess: 'تم تأكيد تسليم الطلب بنجاح.',
      receivedAt: 'وقت الطلب',
      elapsed: 'الوقت المنقضي',
      minute: 'دقيقة',
      minutes: 'دقائق',
      searchOrders: 'بحث برقم الطلب أو الاسم أو العنوان…',
      sessionExpired: 'انتهت جلسة السائق. سجّل الدخول مرة أخرى للمتابعة',
      statusReady: 'جاهز للاستلام بالمطعم',
      statusOnTheWay: 'في الطريق للعميل',
      statusDelivered: 'تم التسليم',
      status: {
        Pending: 'قيد الانتظار',
        Confirmed: 'مؤكد',
        Preparing: 'قيد التجهيز',
        Ready: 'جاهز للاستلام',
        OnTheWay: 'في الطريق للتوصيل',
        Delivered: 'تم التسليم',
      },
    },
    orderTracking: {
      title: 'تتبع طلبك',
      orderCode: 'رقم الطلب',
      status: 'الحالة',
      lastUpdated: 'آخر تحديث',
      orderSummary: 'ملخص الطلب',
      orderItems: 'عناصر الطلب',
      deliveryAddress: 'عنوان التوصيل',
      payment: 'الدفع',
      orderTotal: 'إجمالي الطلب',
      showDetails: 'عرض التفاصيل',
      hideDetails: 'إخفاء التفاصيل',
      loading: 'جاري التحميل…',
      error: 'تعذر تحميل بيانات التتبع. يرجى المحاولة مرة أخرى.',
      retry: 'إعادة المحاولة',
      reconnecting: 'جاري إعادة الاتصال…',
      connected: 'متصل',
      noCredential: 'التتبع متاح فقط من الجهاز والمتصفح الذي تم إجراء الطلب منه.',
      steps: {
        pending: 'استلمنا طلبك',
        confirmed: 'تم تأكيد طلبك',
        preparing: 'المطبخ بيجهز طلبك',
        readyDelivery: 'طلبك جاهز وينتظر بدء التوصيل',
        readyTakeaway: 'طلبك جاهز للاستلام',
        onTheWay: 'طلبك في الطريق',
        delivered: 'تم تسليم طلبك',
      },
      reorder: {
        orderAgain: 'اطلب نفس الطلب مرة أخرى',
        loadingPreview: 'جاري مراجعة الأصناف…',
        previewTitle: 'إعادة الطلب',
        previewDescription: 'مراجعة أصناف الطلب وإضافتها للسلة',
        mergeConfirmTitle: 'تحديث السلة',
        mergeConfirmQuestion:
          'لديك أصناف بالفعل في السلة. هل تريد إضافة أصناف الطلب السابق إليها أم استبدال السلة؟',
        mergeAction: 'إضافة إلى السلة',
        replaceAction: 'استبدال السلة',
        cancelAction: 'إلغاء',
        partialSuccessNotice:
          'تمت إضافة الأصناف المتاحة إلى السلة. بعض أصناف طلبك السابق لم تعد متاحة.',
        allUnavailableNotice:
          'أصناف هذا الطلب لم تعد متاحة حاليًا. يمكنك تصفح المنيو واختيار بدائل.',
        priceChangeNotice: 'قد تكون الأسعار قد تغيرت منذ طلبك السابق.',
        successToast: 'تمت إضافة أصناف الطلب إلى السلة بنجاح',
        viewCart: 'عرض السلة',
        unavailableReasons: {
          soldOut: 'غير متوفر حاليًا',
          unavailable: 'غير متاح',
        },
        errorToast: 'تعذر تجهيز إعادة الطلب. يرجى المحاولة مرة أخرى.',
      },
    },
    myOrders: {
      title: 'طلباتي',
      subtitle: 'متابعة وإعادة طلب الوجبات التي طلبتها على هذا الجهاز',
      privacyNotice: 'تظهر هنا الطلبات التي أنشأتها أو تابعتها على هذا الجهاز.',
      activeSectionTitle: 'الطلبات النشطة',
      previousSectionTitle: 'الطلبات السابقة',
      noOrdersTitle: 'لا توجد طلبات محفوظة',
      noOrdersBody: 'تظهر هنا الطلبات التي أنشأتها أو تابعتها على هذا الجهاز.',
      browseMenu: 'تصفح القائمة',
      trackOrder: 'متابعة الطلب',
      viewDetails: 'عرض التفاصيل',
      orderAgain: 'اطلب مرة أخرى',
      removeFromList: 'إزالة من القائمة',
      loading: 'جاري تحميل تفاصيل طلباتك...',
      error: 'تعذر تحميل بعض تفاصيل الطلبات',
      retry: 'إعادة المحاولة',
      orderCode: 'رقم الطلب',
      elapsed: 'منذ',
      minute: 'دقيقة',
      minutes: 'دقائق',
      items: 'أصناف',
      takeaway: 'استلام من المطعم',
      delivery: 'توصيل طلبات',
      cash: 'كاش عند الاستلام',
      activeBadge: 'نشط',
      previousBadge: 'سابق',
    },
    management: {
      title: 'لوحة تحكم الإدارة',
      menuTitle: 'إدارة قائمة الطعام والأصناف',
      hubTitle: 'مركز العمليات والإدارة',
      signInTitle: 'تسجيل دخول الإدارة',
      signInSubtitle: 'لوحة تحكم المشرفين والمديرين لمتابعة وتشغيل باب الحارة',
      signIn: 'تسجيل الدخول',
      signingIn: 'جاري تسجيل الدخول…',
      email: 'البريد الإلكتروني',
      invalidEmail: 'أدخل بريدًا إلكترونيًا صحيحًا.',
      password: 'كلمة المرور',
      signOut: 'تسجيل الخروج',
      overview: 'نظرة عامة',
      navHub: 'مركز الإدارة',
      navMenu: 'إدارة القائمة والأصناف',
      navOperations: 'مركز العمليات',
      navEmployees: 'إدارة الموظفين',
      navReports: 'التقارير والإحصائيات',
      viewCustomerMenu: 'عرض قائمة العملاء',
      operations: {
        title: 'مركز قيادة العمليات',
        subtitle: 'المتابعة المباشرة والتدخل الفوري لطلبات المطعم',
        refresh: 'تحديث البيانات',
        realtimeConnected: 'متصل بالتحديثات المباشرة',
        realtimeReconnecting: 'جارٍ إعادة الاتصال...',
        realtimeDisconnected: 'غير متصل',
        lastUpdated: 'آخر تحديث',
        summary: {
          activeOrders: 'الطلبات النشطة',
          pending: 'بانتظار التأكيد',
          confirmed: 'تم التأكيد',
          preparing: 'قيد التحضير',
          ready: 'جاهز للتسليم',
          onTheWay: 'في الطريق',
          waitingDriver: 'توصيل بانتظار سائق',
        },
        attention: {
          title: 'طلبات تحتاج تدخلاً فوريًا',
          noAttention: 'لا توجد طلبات تحتاج تدخل الآن',
          unassignedDelivery: 'طلب جاهز للتوصيل بانتظار تعيين سائق',
          unacknowledgedPending: 'طلب جديد بانتظار التأكيد من المطبخ',
          inspectAction: 'معاينة الطلب',
        },
        activeQueue: {
          title: 'تدفق الطلبات النشطة',
          emptyActive: 'لا توجد طلبات نشطة حاليًا',
          searchPlaceholder: 'بحث برقم الطلب (مثال: BH-)...',
          filterAll: 'الكل',
          filterPending: 'بانتظار التأكيد',
          filterPreparing: 'قيد التحضير',
          filterReady: 'جاهز',
          filterOnTheWay: 'في الطريق',
          filterDelivery: 'توصيل',
          filterTakeaway: 'استلام',
          colCode: 'رقم الطلب',
          colCustomer: 'العميل',
          colType: 'نوع الطلب',
          colStatus: 'الحالة',
          colElapsedCreated: 'منذ الإنشاء',
          colElapsedStatus: 'في الحالة الحالية',
          colDriver: 'السائق',
          colTotal: 'الإجمالي',
          colActions: 'الإجراءات',
          viewOrder: 'معاينة',
          noSearchResults: 'لا توجد طلبات مطابقة للبحث',
        },
        drawer: {
          title: 'تفاصيل الطلب التشغيلية',
          close: 'إغلاق',
          orderCode: 'رمز الطلب',
          customerName: 'اسم العميل',
          customerPhone: 'رقم الهاتف',
          orderType: 'نوع الاستلام',
          status: 'الحالة التشغيلية',
          createdAt: 'وقت الطلب',
          address: 'عنوان التوصيل',
          deliveryArea: 'منطقة التوصيل',
          customerNote: 'ملاحظة العميل',
          noNote: 'لا توجد ملاحظات',
          itemsTitle: 'أصناف الطلب',
          qty: 'الكمية',
          subtotal: 'المجموع الفرعي',
          deliveryFee: 'رسوم التوصيل',
          total: 'الإجمالي النهائي',
          paymentMethod: 'طريقة الدفع',
          paymentStatus: 'حالة الدفع',
          cashOnDelivery: 'نقدًا عند الاستلام',
          cashTakeaway: 'نقدًا عند الاستلام من المطعم',
          paid: 'تم الدفع',
          pendingPayment: 'بانتظار الدفع',
          driverInfo: 'بيانات السائق',
          driverNotAssigned: 'لم يتم تعيين سائق بعد',
          assignedAt: 'تم التعيين في',
          historyTitle: 'سجل التغييرات التشغيلية',
          noHistory: 'لا يوجد سجل سابق',
        },
        errors: {
          loadFailed: 'تعذر تحديث العمليات. حاول مرة أخرى.',
          retry: 'إعادة المحاولة',
        },
        time: {
          justNow: 'الآن',
          minutesAgo: 'منذ {m} دقيقة',
          hoursAgo: 'منذ {h} ساعة',
          inStateForMinutes: 'في الحالة الحالية منذ {m} د',
          inStateForHours: 'في الحالة الحالية منذ {h} س',
        },
      },
      restaurantControl: {
        title: 'حالة استقبال الطلبات',
        subtitle: 'التحكم في فتح المطعم أو إيقاف استقبال الطلبات مؤقتاً مع رسالة توضيحية للعملاء',
        acceptingOrders: 'استقبال الطلبات الآن',
        openBadge: 'مفتوح ويستقبل الطلبات',
        pausedBadge: 'متوقف مؤقتاً',
        pauseMessageAr: 'رسالة الإيقاف المؤقت (بالعربية)',
        pauseMessageEn: 'رسالة الإيقاف المؤقت (بالإنجليزية)',
        pauseMessageArPlaceholder: 'مثال: نعتذر، نستقبل طلباتكم بعد ساعة بسبب ضغط العمل.',
        pauseMessageEnPlaceholder: 'e.g. Sorry, we are temporarily paused due to high rush.',
        charCount: 'حرف',
        lastUpdated: 'آخر تحديث',
        updatedBy: 'بواسطة',
        saveButton: 'حفظ حالة المطعم',
        saving: 'جاري الحفظ…',
        savedSuccess: 'تم تحديث حالة المطعم بنجاح.',
        saveError: 'حدث خطأ أثناء حفظ حالة المطعم. يرجى المحاولة مرة أخرى.',
        staleError: 'تم تعديل حالة المطعم بواسطة مدير آخر. تم تحديث البيانات المعروضة.',
        refreshPrompt: 'تحديث البيانات',
      },
      stats: {
        title: 'إحصائيات القائمة',
        totalCategories: 'إجمالي الأقسام',
        activeCategories: 'الأقسام النشطة',
        totalMenuItems: 'إجمالي الأصناف',
        availableItems: 'الأصناف المتوفرة',
        soldOutItems: 'أصناف غير متوفرة (نفدت)',
        archivedItems: 'أصناف مؤرشفة',
      },
      categories: {
        title: 'أقسام القائمة',
        subtitle: 'إدارة وتصنيف أقسام المنيو وترتيب ظهورها',
        newCategory: 'إضافة قسم جديد',
        editCategory: 'تعديل القسم',
        nameAr: 'اسم القسم (عربي)',
        nameEn: 'اسم القسم (إنجليزي)',
        displayOrder: 'ترتيب العرض',
        status: 'الحالة',
        active: 'نشط',
        archived: 'مؤرشف',
        itemCount: 'عدد الأصناف',
        actions: 'إجراءات',
        edit: 'تعديل',
        activate: 'تنشيط',
        archive: 'أرشفة',
        save: 'حفظ القسم',
        saving: 'جاري الحفظ…',
        cancel: 'إلغاء',
        createSuccess: 'تمت إضافة القسم بنجاح.',
        updateSuccess: 'تم تحديث بيانات القسم بنجاح.',
        toggleSuccess: 'تم تغيير حالة القسم بنجاح.',
        error: 'حدث خطأ أثناء معالجة بيانات القسم.',
        staleError: 'تم تعديل بيانات القسم بواسطة مستخدم آخر. يرجى إعادة المحاولة.',
        emptyTitle: 'لا توجد أقسام مسجلة',
        emptyBody: 'ابدأ بإضافة أول قسم لتنظيم قائمة الطعام.',
        nameArRequired: 'الاسم بالعربية مطلوب.',
        nameEnRequired: 'الاسم بالإنجليزية مطلوب.',
        displayOrderInvalid: 'ترتيب العرض يجب أن يكون 0 أو أكثر.',
      },
      menuItems: {
        title: 'أصناف القائمة',
        subtitle: 'إدارة تفاصيل الأصناف، الأسعار، التوفر، وحالة النشر',
        newItem: 'إضافة صنف جديد',
        editItem: 'تعديل الصنف',
        filterCategory: 'تصفية حسب القسم',
        allCategories: 'جميع الأقسام',
        searchPlaceholder: 'بحث عن صنف بالاسم أو الوصف…',
        image: 'الصورة',
        nameAr: 'اسم الصنف (عربي)',
        nameEn: 'اسم الصنف (إنجليزي)',
        descriptionAr: 'الوصف (عربي)',
        descriptionEn: 'الوصف (إنجليزي)',
        category: 'القسم',
        selectCategory: 'اختر القسم',
        price: 'السعر (ج.م)',
        preparationMinutes: 'وقت التحضير (بالدقائق)',
        displayOrder: 'ترتيب العرض',
        availability: 'التوفر للطلب',
        available: 'متوفر',
        unavailable: 'غير متوفر (نفد)',
        status: 'حالة النشر',
        active: 'نشط في القائمة',
        archived: 'مؤرشف (مخفي)',
        actions: 'إجراءات',
        edit: 'تعديل',
        toggleAvailability: 'تغيير التوفر',
        toggleStatus: 'تغيير حالة النشر',
        save: 'حفظ الصنف',
        saving: 'جاري الحفظ…',
        cancel: 'إلغاء',
        createSuccess: 'تمت إضافة الصنف بنجاح.',
        updateSuccess: 'تم تحديث بيانات الصنف بنجاح.',
        availabilitySuccess: 'تم تحديث توفر الصنف بنجاح.',
        statusSuccess: 'تم تحديث حالة الصنف بنجاح.',
        error: 'حدث خطأ أثناء معالجة بيانات الصنف.',
        staleError: 'تم تعديل بيانات الصنف بواسطة مستخدم آخر. يرجى إعادة المحاولة.',
        emptyTitle: 'لا توجد أصناف في هذا القسم',
        emptyBody: 'أضف أصناف جديدة لتظهر للعملاء في قائمة الطعام.',
        noFilteredItems: 'لا توجد أصناف مطابقة لبحثك',
        selectImage: 'اختر صورة من القائمة',
        customImage: 'رابط أو مسار صورة مخصص',
        imageRequired: 'صورة الصنف مطلوبة.',
        nameArRequired: 'اسم الصنف بالعربية مطلوب.',
        nameEnRequired: 'اسم الصنف بالإنجليزية مطلوب.',
        priceInvalid: 'السعر يجب أن يكون أكبر من 0.',
        prepTimeInvalid: 'وقت التحضير يجب أن يكون بين 1 و 240 دقيقة.',
        displayOrderInvalid: 'ترتيب العرض يجب أن يكون 0 أو أكثر.',
        categoryRequired: 'يجب اختيار قسم للصنف.',
        sectionBasic: 'البيانات الأساسية',
        sectionSelling: 'البيع والأسعار',
        sectionOrdering: 'التحضير والترتيب',
        sectionImage: 'صورة الصنف',
        chooseImage: 'اختر صورة',
        changeImage: 'تغيير الصورة',
        removeImage: 'إزالة الصورة',
        imageCardHint: 'JPG أو PNG أو WEBP (حتى 5 ميجابايت)',
        dropImageHint: 'اسحب الصورة هنا أو اضغط للاختيار',
        uploadingImage: 'جارٍ رفع الصورة…',
        imageUploadFailed: 'تم حفظ الصنف، لكن تعذر رفع الصورة. حاول رفعها مرة أخرى.',
        imageUploadError: 'حدث خطأ أثناء رفع الصورة.',
        imageTooLarge: 'حجم الصورة كبير جدًا. اختر صورة أصغر من 5 ميجابايت.',
        imageFormatUnsupported: 'صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WEBP.',
        removeImageConfirmTitle: 'تأكيد إزالة الصورة',
        removeImageConfirmBody: 'هل أنت متأكد من رغبتك في إزالة صورة هذا الصنف؟',
        removeImageConfirmYes: 'نعم، أزل الصورة',
        removeImageConfirmNo: 'إلغاء',
        noImagePlaceholder: 'لا توجد صورة',
        retryUpload: 'إعادة محاولة رفع الصورة',
      },
      tabs: {
        categories: 'الأقسام',
        menuItems: 'الأصناف',
      },
      errors: {
        loadFailed: 'تعذر تحميل البيانات. يرجى إعادة المحاولة.',
        retry: 'إعادة المحاولة',
        unauthorized: 'يرجى تسجيل الدخول بحساب مدير للمتابعة.',
        forbidden: 'غير مصرح لك بالوصول إلى لوحة الإدارة.',
      },
    },
    employees: {
      title: 'الموظفون',
      addEmployee: 'إضافة موظف',
      searchPlaceholder: 'ابحث بالاسم أو البريد',
      filterAll: 'الكل',
      displayName: 'الاسم',
      email: 'البريد الإلكتروني',
      role: 'الدور',
      status: 'الحالة',
      active: 'نشط',
      disabled: 'موقوف',
      you: 'أنت',
      actions: 'الإجراءات',
      edit: 'تعديل',
      enable: 'تفعيل',
      disable: 'إيقاف',
      resetPassword: 'إعادة تعيين كلمة المرور',
      loading: 'جاري التحميل…',
      emptyTitle: 'لا يوجد موظفون',
      emptyBody: 'أضف أول موظف للبدء.',
      noResults: 'لا توجد نتائج مطابقة',
      errorTitle: 'تعذر تحميل الموظفين',
      errorBody: 'تحقق من الاتصال وأعد المحاولة.',
      createTitle: 'إضافة موظف جديد',
      editTitle: 'تعديل الموظف',
      basicInfo: 'البيانات الأساسية',
      roleSection: 'الدور الوظيفي',
      passwordSection: 'كلمة المرور المؤقتة',
      displayNameLabel: 'الاسم الكامل',
      emailLabel: 'البريد الإلكتروني',
      temporaryPasswordLabel: 'كلمة المرور المؤقتة',
      newPasswordLabel: 'كلمة المرور الجديدة',
      showPassword: 'إظهار',
      hidePassword: 'إخفاء',
      generatePassword: 'توليد كلمة مرور',
      copyPassword: 'نسخ',
      copiedPassword: 'تم النسخ',
      save: 'حفظ',
      saving: 'جاري الحفظ…',
      cancel: 'إلغاء',
      roleKitchen: 'المطبخ',
      roleCashier: 'الكاشير',
      roleDriver: 'السائق',
      roleManager: 'المدير',
      roleAdmin: 'المشرف',
      disableTitle: 'إيقاف حساب {name}؟',
      disableBody:
        'لن يتمكن الموظف من تسجيل الدخول أو استخدام الشاشات الخاصة بدوره حتى يتم إعادة تفعيل الحساب.',
      enableTitle: 'تفعيل حساب {name}؟',
      enableBody: 'سيتمكن الموظف من تسجيل الدخول واستخدام النظام مجدداً.',
      roleChangeTitle: 'تغيير دور الموظف؟',
      roleChangeBody:
        'تغيير الدور سيؤدي إلى إنهاء الجلسة النشطة للموظف ليتم تطبيق الصلاحيات الجديدة.',
      resetPasswordTitle: 'إعادة تعيين كلمة مرور {name}',
      resetPasswordBody: 'قم بإدخال كلمة مرور جديدة. يجب إرسالها للموظف ليتمكن من تسجيل الدخول.',
      confirmAction: 'تأكيد',
      conflictError: 'تم تعديل بيانات الموظف بواسطة مستخدم آخر. حدّث البيانات وأعد المحاولة.',
      forbiddenError: 'لا تملك صلاحية لهذا الإجراء.',
      validationError: 'تحقق من البيانات المدخلة.',
      sessionExpired: 'انتهت الجلسة. سجّل الدخول مجدداً.',
    },
    reports: {
      title: 'تقارير المبيعات والأداء التشغيلي',
      subtitle: 'مؤشرات دقيقة لأداء المبيعات، قنوات التوصيل، وسرعة التنفيذ بالمطعم',
      datePresetLabel: 'الفترة الزمنية',
      presetToday: 'اليوم',
      presetYesterday: 'أمس',
      presetLast7Days: 'آخر 7 أيام',
      presetLast30Days: 'آخر 30 يوماً',
      presetCustom: 'نطاق مخصص',
      fromDate: 'من تاريخ',
      toDate: 'إلى تاريخ',
      invalidDateRange: 'تاريخ البدء يجب أن يكون قبل أو يساوي تاريخ الانتهاء',
      applyFilter: 'تطبيق الفلتر',
      fulfillmentFilterLabel: 'نوع الطلب',
      fulfillmentAll: 'جميع القنوات',
      fulfillmentDelivery: 'توصيل فقط',
      fulfillmentTakeaway: 'استلام فقط',
      refresh: 'تحديث البيانات',
      refreshing: 'جارٍ التحديث...',
      lastUpdated: 'آخر تحديث',
      summary: {
        completedSales: 'إجمالي المبيعات المكتملة',
        completedSalesHint: 'صافي مبيعات الطلبات المسلمة بنجاح',
        completedOrders: 'الطلبات المكتملة',
        completedOrdersHint: 'عدد الطلبات التي تم تسليمها للعميل',
        averageOrderValue: 'متوسط قيمة الطلب (AOV)',
        averageOrderValueHint: 'متوسط إيراد كل طلب مكتمل',
        totalOrdersPlaced: 'إجمالي الطلبات المستلمة',
        totalOrdersPlacedHint: 'يشمل جميع الطلبات المنشأة في هذه الفترة',
      },
      trends: {
        title: 'مؤشر المبيعات وحجم الطلبات اليومي',
        subtitle: 'توزيع الإيرادات وأعداد الطلبات على مدار الفترة المحددة',
        revenueLegend: 'الإيرادات اليومية (ج.م)',
        ordersLegend: 'عدد الطلبات المكتملة',
        viewTableToggle: 'عرض الجدول',
        viewChartToggle: 'عرض الرسم البياني',
        tableAccessibleTitle: 'جدول بيانات المبيعات اليومية التفصيلية',
        tableDate: 'التاريخ',
        tableRevenue: 'الإيرادات',
        tableCompletedOrders: 'الطلبات المكتملة',
        tableTotalOrders: 'إجمالي الطلبات',
        noTrendData: 'لا توجد بيانات حركة مبيعات كافية في هذا النطاق',
      },
      fulfillment: {
        title: 'توزيع قنوات التنفيذ',
        subtitle: 'مقارنة الأداء وحصة المبيعات بين طلبات التوصيل والاستلام',
        deliveryTitle: 'طلبات التوصيل',
        takeawayTitle: 'طلبات الاستلام من الفرع',
        orderCount: 'عدد الطلبات',
        revenue: 'إيراد المبيعات',
        deliveryFees: 'رسوم التوصيل المحصلة',
        share: 'النسبة من الإجمالي',
        totalVolume: 'إجمالي حجم المبيعات',
      },
      bestSelling: {
        title: 'الأصناف الأكثر مبيعاً',
        subtitle: 'ترتيب الأصناف حسب الكميات المباعة وإجمالي مساهمتها المالية',
        rank: '#',
        itemName: 'اسم الصنف',
        quantitySold: 'الكمية المباعة',
        totalRevenue: 'إجمالي الإيرادات',
        emptyNotice: 'لا توجد مبيعات أصناف مسجلة في هذا النطاق الزمني',
      },
      timing: {
        title: 'أوقات التشغيل وساعات الذروة',
        subtitle: 'المعدلات الفعلية للتحضير والتوصيل وتوزيع أوقات الذروة اليومية',
        avgPrepTime: 'متوسط وقت التحضير',
        avgPrepTimeHint: 'من وقت التأكيد حتى اكتمال التحضير في المطبخ',
        avgDeliveryTime: 'متوسط وقت التوصيل',
        avgDeliveryTimeHint: 'من بدء التوصيل حتى التسليم للعميل',
        avgTotalTime: 'متوسط دورة الطلب الكاملة',
        avgTotalTimeHint: 'من إنشاء الطلب حتى التسليم النهائي',
        minutesUnit: 'دقيقة',
        notAvailable: 'غير متوفر',
        hourlyTitle: 'توزيع الطلبات حسب ساعات اليوم',
        hourlySubtitle: 'كثافة الطلبات والإيراد التراكمي على مدار الـ 24 ساعة',
        hourlyTableTitle: 'جدول توزيع ساعات الذروة',
        hourlyHour: 'الساعة',
        hourlyOrders: 'عدد الطلبات',
        hourlyRevenue: 'الإيرادات',
        noTimingData: 'لا توجد بيانات تشغيل كافية لحساب أوقات التنفيذ',
      },
      empty: {
        title: 'لا توجد بيانات مسجلة في هذه الفترة',
        message:
          'لم تسجل أي طلبات أو مبيعات تطابق الفلاتر المحددة. جرب تغيير النطاق الزمني أو فلاتر التوصيل.',
        resetFilter: 'إعادة ضبط الفلاتر',
      },
      errors: {
        loadFailed: 'تعذر تحميل بيانات التقارير والإحصائيات.',
        retry: 'إعادة المحاولة',
      },
    },
    home: {
      heroEyebrow: 'أصالة المذاق الشامي العريق',
      heroTitle: 'مشاوي وأكلات شامية على أصولها',
      heroSubtitle:
        'نقدم لكم أشهى المشاوي المحضرة على الفحم بتتبيلاتنا الخاصة ولحومنا الطازجة يومياً مع كرم الضيافة الشامية.',
      orderNow: 'اطلب طعامك الآن',
      exploreMenu: 'تصفح القائمة الكاملة',
      badgeFresh: 'لحوم طازجة 100% يومياً',
      highlightsTitle: 'لماذا يختار زبائننا باب الحارة؟',
      feature1Title: 'لحوم طازجة يومياً',
      feature1Desc: 'نعتمد أجود قطع اللحوم البلدية المذبوحة محلياً يومياً بعناية فائقة.',
      feature2Title: 'شواء على الفحم الطبيعي',
      feature2Desc: 'نطهو كل طبق بنكهة الشواء الشامي الأصيل على الجمر بدون مساومات.',
      feature3Title: 'توصيل فوري ساخن',
      feature3Desc: 'أسطول توصيل مجهز بحقائب حرارية لضمان وصول طلبك ساخناً كأنه خرج من الفرن للتو.',
      feature4Title: 'تتبيلات عائلية سرية',
      feature4Desc: 'خلطات بهارات سورية توارثتها أجيال الطهاة لتمنحك مذاقاً فريداً لا ينسى.',
      specialsTitle: 'أطباقنا المميزة الأكثر طلباً',
      specialsSubtitle: 'تشكيلة مختارة من أشهى أطباق المشاوي والسندوتشات والمقبلات التي حازت ثقة زبائننا.',
      aboutStoryTitle: 'قصة باب الحارة',
      aboutStoryBody:
        'بدأت رحلتنا من حب المطبخ الشامي الغني وتقاليده الأصيلة. في باب الحارة، نحرص على تقديم تجربة طعام استثنائية تجمع بين عبق دمشق القديمة وأعلى معايير الجودة والنظافة والخدمة الراقية.',
      readMore: 'تعرف أكثر علينا',
      reviewsTitle: 'آراء زبائننا الكرام',
      review1Text:
        'أفضل مشكل مشاوي ذقته على الإطلاق! اللحم طري للغاية والتتبيلة موزونة بدقة فائقة، والتوصيل سريع جداً.',
      review1Author: 'أحمد محمود — عميل مخلص',
      review2Text:
        'شاورما لحم ومقبلات سورية أصلية تذكرني بدمشق. نظافة واهتمام رائع بالتفاصيل وتغليف محكم وساخن.',
      review2Author: 'سارة عبد الرحمن — ناقدة طعام',
      review3Text:
        'الخدمة ممتازة وفريق العمل محترم وودود. وجبة عائلية متكاملة وسعر عادل مقابل الجودة العالية.',
      review3Author: 'محمد إبراهيم — زائر متكرر',
    },
    about: {
      eyebrow: 'تاريخنا ورؤيتنا',
      title: 'من نحن — مطعم باب الحارة',
      subtitle:
        'رحلة شغف في فنون الشواء والضيافة الشامية، تأسست لنقدم لكم المذاق الشامي الأصيل بجودة لا تضاهى.',
      storyTitle: 'عبق الشام وتراث المشاوي الأصيلة',
      storyParagraph1:
        'تأسس مطعم باب الحارة ليجسد روح كرم الضيافة السورية العريقة ونكهات أسواق دمشق التاريخية. انطلقنا برؤية واضحة: إحياء فنون الشواء التقليدي على الحطب والفحم الطبيعي، مستخدمين أفضل المكونات المحلية والبهارات الشامية المستوردة.',
      storyParagraph2:
        'نحن لا نقدم مجرد وجبات، بل نصنع ذكريات دافئة حول المائدة. طهاتنا من ذوي الخبرة الطويلة يعملون بشغف وإتقان لتقديم الكباب، الشيش طاووق، الريش، وسندوتشات الشاورما المصنوعة من لحوم بلدي طازجة بنسبة 100%.',
      valuesTitle: 'قيمنا ومبادئنا الثابتة',
      value1Title: 'الجودة المطلقة',
      value1Desc: 'لا مساومة على جودة وطزاجة المكونات؛ فحص دقيق واختيار يومي صارم.',
      value2Title: 'الأصالة والأمانة',
      value2Desc: 'وصفات متوارثة وتتبيلات طبيعية دون أية محسنات صناعية أو إضافات ضارة.',
      value3Title: 'كرم الضيافة والاهتمام',
      value3Desc: 'خدمة راقية وسرعة استجابة تجعل كل عميل يشعر بأنه ضيف في بيتنا.',
      statYears: '+12',
      statYearsLabel: 'عاماً من الخبرة والتميز',
      statCustomers: '+50,000',
      statCustomersLabel: 'وجبة قُدمت بحب وسعادة',
      statDishes: '+35',
      statDishesLabel: 'صنفاً شامياً أصيلاً',
      ctaTitle: 'هل أنت جاهز لتجربة طعم الشام الحقيقي؟',
      ctaButton: 'تصفح القائمة واطلب الآن',
    },
    contact: {
      eyebrow: 'يسعدنا تواصلكم',
      title: 'اتصل بنا — باب الحارة',
      subtitle: 'نحن هنا للإجابة على استفساراتكم وتلقي مقترحاتكم وطلباتكم الخاصة على مدار الساعة.',
      phoneTitle: 'الهاتف المباشر',
      phoneValue: '+20 100 234 5678',
      whatsappTitle: 'خدمة العملاء عبر واتساب',
      whatsappValue: '+20 100 234 5678',
      addressTitle: 'عنوان المطعم',
      addressValue: 'شارع الجمهورية الرئيسي، وسط البلد — القاهرة، مصر',
      hoursTitle: 'ساعات العمل الرسمية',
      hoursValue: 'يومياً من الساعة 11:00 صباحاً وحتى 02:00 بعد منتصف الليل',
      formTitle: 'أرسل لنا رسالة مباشرة',
      nameLabel: 'الاسم الكامل',
      phoneOrEmailLabel: 'رقم الهاتف أو البريد الإلكتروني',
      subjectLabel: 'موضوع الرسالة',
      messageLabel: 'نص الرسالة أو الاستفسار',
      submitButton: 'إرسال الرسالة الآن',
      successMessage: 'تم إرسال رسالتك بنجاح! سيتواصل معك فريق خدمة العملاء في أقرب وقت ممكن.',
      validationError: 'يرجى ملء جميع الحقول المطلوبة والتأكد من صحة بيانات الاتصال.',
    },
    search: {
      title: 'البحث في القائمة',
      subtitle: 'ابحث عن وجبتك المفضلة بالاسم أو المكونات وتصفح خياراتنا الشهية بسهولة.',
      placeholder: 'ابحث عن وجبة، مشاوي، سندوتش، شاورما...',
      clear: 'مسح البحث',
      quickTags: 'كلمات بحث شائعة:',
      tagAll: 'الكل',
      tagGrills: 'مشاوي',
      tagShawarma: 'شاورما',
      tagSandwiches: 'سندوتشات',
      tagAppetizers: 'مقبلات',
      tagDrinks: 'مشروبات',
      resultsCount: 'تم العثور على {count} وجبة مطابقة',
      emptyTitle: 'لم نجد أي وجبة تطابق بحثك',
      emptySubtitle: 'جرب البحث بكلمات مختلفة أو تصفح الأقسام الكاملة من القائمة الرئيسية.',
      browseAll: 'عرض كل الوجبات المتاحة',
    },
    wishlist: {
      title: 'قائمتي المفضلة',
      subtitle: 'الوجبات التي أحببتها ومحفوظة للوصول السريع إليها في أي وقت.',
      itemsCount: '{count} وجبات محفوظة في المفضلة',
      addAllToCart: 'إضافة الكل إلى السلة',
      addAllSuccess: 'تمت إضافة جميع الأصناف المتوفرة إلى سلتك بنجاح!',
      emptyTitle: 'قائمتك المفضلة فارغة حالياً',
      emptySubtitle: 'انقر على رمز القلب الموجود بجانب أي وجبة في القائمة لحفظها هنا والوصول إليها بسرعة.',
      browseMenu: 'استكشف القائمة وأضف وجباتك المفضلة',
      remove: 'إزالة من المفضلة',
    },
    profile: {
      title: 'حسابي وبياناتي',
      greeting: 'أهلاً بك في باب الحارة',
      guestBadge: 'حساب محلي آمن',
      personalInfoTitle: 'البيانات الشخصية المحفوظة',
      nameLabel: 'الاسم',
      phoneLabel: 'رقم الهاتف',
      defaultAddressTitle: 'عنوان التوصيل الافتراضي',
      noSavedAddress: 'لم يتم حفظ عنوان توصيل بعد. يمكنك حفظ عنوانك لتسهيل عملية الطلب القادمة.',
      totalOrdersLabel: 'إجمالي الطلبات المسجلة',
      wishlistLabel: 'الوجبات المفضلة',
      quickActionsTitle: 'روابط سريعة',
      viewOrders: 'سجل طلباتي ومتابعتها',
      viewWishlist: 'قائمتي المفضلة',
      accountSettings: 'تعديل الإعدادات والعنوان',
      startOrder: 'بدء طلب جديد الآن',
    },
    accountSettings: {
      title: 'إعدادات الحساب',
      subtitle: 'تعديل بيانات الاتصال وعنوان التوصيل المحفوظ على جهازك بكل سهولة.',
      personalDetails: 'تعديل البيانات الشخصية',
      name: 'الاسم الكامل',
      phone: 'رقم الهاتف (صيغة مصرية +20)',
      savedDeliveryAddress: 'عنوان التوصيل الافتراضي',
      addressStreet: 'الشارع والمنطقة',
      addressBuilding: 'رقم المبنى / العمارة',
      addressFloor: 'رقم الطابق والشقة',
      addressNotes: 'ملاحظات إضافية لتسهيل الوصول',
      saveChanges: 'حفظ التعديلات',
      savedSuccess: 'تم حفظ بياناتك بنجاح على جهازك!',
      clearData: 'مسح البيانات المحفوظة محلياً',
      clearConfirm: 'هل أنت متأكد من رغبتك في مسح كافة البيانات المحفوظة على هذا الجهاز؟',
      clearedSuccess: 'تم مسح البيانات المحفوظة بنجاح.',
    },
    auth: {
      signInTab: 'تسجيل الدخول',
      signUpTab: 'إنشاء حساب جديد',
      signInTitle: 'تسجيل الدخول إلى حسابك',
      signUpTitle: 'إنشاء حساب مستخدم جديد',
      phoneOrEmail: 'رقم الهاتف أو البريد الإلكتروني',
      password: 'كلمة المرور',
      name: 'الاسم الكامل',
      rememberMe: 'تذكر بياناتي على هذا الجهاز',
      forgotPassword: 'نسيت كلمة المرور؟',
      signInSubmit: 'دخول إلى الحساب',
      signUpSubmit: 'إنشاء الحساب ومتابعة الطلب',
      continueAsGuest: 'المتابعة كضيف (بدون تسجيل)',
      guestNotice: 'يمكنك إتمام أي طلب مباشرة كضيف دون الحاجة لإنشاء حساب.',
      successNotice: 'تم تسجيل الدخول بنجاح! مرحباً بك في باب الحارة.',
      validationError: 'يرجى التأكد من ملء كافة البيانات المطلوبة بشكل صحيح.',
    },
    orderDetails: {
      title: 'تفاصيل وإيصال الطلب',
      orderNumber: 'رقم الطلب',
      orderDate: 'تاريخ وساعة الطلب',
      fulfillmentType: 'نوع الاستلام والتوصيل',
      deliveryAddress: 'عنوان التوصيل',
      customerName: 'اسم العميل',
      customerPhone: 'هاتف العميل',
      assignedDriver: 'مندوب التوصيل المسؤول',
      itemsTitle: 'الوجبات المطلوبة',
      itemPrice: 'سعر الوحدة',
      itemQuantity: 'الكمية',
      itemTotal: 'الإجمالي',
      liveTrackButton: 'متابعة حركة الطلب مباشرة',
      reorderButton: 'إعادة طلب نفس الوجبات',
      backToOrders: 'العودة لقائمة طلباتي',
    },
    footer: {
      description:
        'مطعم باب الحارة — عنوان الأصالة والجودة العالية في المشاوي والمأكولات الشامية على الفحم.',
      quickLinksTitle: 'روابط هامة',
      workingHoursTitle: 'ساعات العمل',
      workingHoursValue: 'يومياً: 11:00 صباحاً – 02:00 بعد منتصف الليل',
      contactTitle: 'اتصل بنا',
      branchesTitle: 'فروعنا وتوصيلنا',
      branchesValue: 'توصيل سريع لكافة المناطق المحيطة ووسط البلد',
      copyright: 'جميع الحقوق محفوظة © مطعم باب الحارة. الطعم الشامي الأصيل.',
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
      orders: 'My Orders',
      trackActiveOrder: 'Track your order',
      menu: 'Menu',
      about: 'About Us',
      contact: 'Contact Us',
      search: 'Search',
      wishlist: 'Wishlist',
      profile: 'My Profile',
      accountSettings: 'Account Settings',
      signIn: 'Sign In',
      signUp: 'Sign Up',
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
      restaurantPausedFallback: 'The restaurant is temporarily paused for new orders',
      restaurantPausedBrowsingNotice:
        'You can still browse the menu and add items to your cart for later.',
      restaurantPausedSubmitTooltip: 'The restaurant is temporarily paused for orders',
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
      stepDetails: 'Details',
      stepFulfillment: 'Fulfillment',
      stepPayment: 'Payment',
      free: 'Free',
      items: 'items',
      orderTypeTakeaway: 'Pick up from restaurant',
      orderTypeDelivery: 'Delivery to address',
      savedContactNotice: 'We filled in your saved details on this device',
      clearSavedContact: 'Clear saved details',
      savedAddressNotice: 'Saved on this device for faster checkout next time.',
      clearSavedAddress: 'Clear saved address',
      staleDeliveryAreaWarning:
        'The saved delivery area is no longer available. Please select another area.',
      restaurantNotAcceptingOrdersError:
        'The restaurant is temporarily paused for new orders. Your cart has been saved and you can submit once orders resume.',
      restaurantPausedButtonNotice: 'The restaurant is temporarily paused for orders',
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
      trackOrder: 'Track your order',
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
      title: 'Manage Kitchen Orders',
      subtitle: 'Monitor, prepare, and manage incoming kitchen orders in real time.',
      currentOrders: 'Active Orders',
      filtersLabel: 'Filter kitchen orders',
      searchOrders: 'Search by order code or customer…',
      staffFallback: 'Kitchen team',
      refreshing: 'Refreshing orders…',
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
      handoffConfirmTitle: 'Confirm Order Handoff',
      handoffConfirmBody: 'Has payment been collected and the order handed off to the customer?',
      handoffConfirmYes: 'Confirm & Hand Off',
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
      selectDriver: 'Select Driver',
      selectDriverPlaceholder: '-- Select delivery driver --',
      assignDriver: 'Assign Driver',
      assignedDriver: 'Driver',
      assignConfirmTitle: 'Confirm Driver Assignment',
      assignConfirmBody: 'Are you sure you want to assign the driver to this order?',
      assignConfirmYes: 'Yes, assign driver',
      assignConfirmNo: 'Cancel',
      assignDriverSuccess: 'Driver assigned successfully',
      assignDriverStaleError: 'Order was updated by another user, please try again',
      assignDriverError: 'Failed to assign driver, please try again',
      driverStatus: 'Delivery Status',
      statusReady: 'Ready for Delivery',
      statusOnTheWay: 'On the way',
      statusDelivered: 'Delivered',
      all: 'All',
      takeawayQueue: 'Ready for Pickup',
      deliveryQueue: 'Waiting for Driver',
      filterAll: 'All',
      searchPlaceholder: 'Search by order # or customer name...',
      noFilteredOrders: 'There are no orders matching the selected filter or search right now.',
      clearSearch: 'Clear search',
      totalToCollect: 'Total to collect',
      collect: 'Collect',
      paid: 'Paid',
      showDetails: 'Show items',
      hideDetails: 'Hide items',
      expandAll: 'Expand all',
      collapseAll: 'Collapse all',
      refresh: 'Refresh',
      soundEnable: 'Enable sound',
      soundEnabled: 'Sound enabled',
      newOrder: 'New ready order!',
      subtotal: 'Subtotal',
      deliveryFee: 'Delivery fee',
      completing: 'Completing...',
      deliveryWaitingNotice:
        'Order is ready at the restaurant, awaiting driver pickup for delivery',
    },

    driver: {
      title: 'Driver Deliveries',
      signIn: 'Driver Sign In',
      signInTitle: 'Driver sign in',
      signInDescription: 'This screen is restricted to authorised delivery drivers.',
      assignedOrders: 'Assigned Deliveries',
      activeDeliveries: 'Active Deliveries',
      completedDeliveries: 'Delivered Orders',
      noActiveOrders: 'No active deliveries',
      noActiveOrdersSub: 'Assigned orders ready for pickup will appear here.',
      noCompletedOrders: 'No delivered orders today',
      connectionLabel: 'Driver connection status',
      ordersLabel: 'Assigned deliveries list',
      signOut: 'Sign out',
      loading: 'Loading delivery orders…',
      loadError: 'Failed to load delivery orders',
      emptyTitle: 'No assigned deliveries',
      emptyBody: 'Orders assigned to you for delivery will appear here.',
      emptyFilterTitle: 'No orders in this section',
      emptyFilterBody: 'There are no orders matching this filter.',
      queueError: 'Failed to load assigned deliveries. Try again.',
      connected: 'Live updates connected',
      connecting: 'Connecting…',
      reconnecting: 'Reconnecting…',
      disconnected: 'Live updates disconnected',
      newAssignment: 'New delivery assigned!',
      orderCode: 'Order #',
      customer: 'Customer Info',
      phone: 'Phone Number',
      callCustomer: 'Call Customer',
      deliveryDestination: 'Delivery Address',
      area: 'Area',
      address: 'Full Address',
      deliveryArea: 'Delivery area',
      deliveryNote: 'Delivery Note',
      note: 'Customer note',
      items: 'Order Items',
      showItems: 'Show items',
      hideItems: 'Hide items',
      itemCount: 'items',
      payment: 'Payment & Collection',
      codAmount: 'Amount to collect',
      paidOnline: 'Prepaid',
      cashOnDelivery: 'Cash on Delivery',
      subtotal: 'Subtotal',
      deliveryFee: 'Delivery fee',
      total: 'Total to collect',
      paymentMethod: 'Payment method',
      paymentStatus: 'Payment status',
      paid: 'Paid',
      unpaid: 'Unpaid (Collect cash)',
      allFilter: 'All Assigned',
      readyFilter: 'Ready for Pickup',
      onTheWayFilter: 'On The Way',
      deliveredFilter: 'Delivered',
      startDelivery: 'Start delivery',
      markDelivered: 'Mark delivered',
      startDeliveryAction: 'Start Delivery',
      markDeliveredAction: 'Mark Delivered',
      startingDelivery: 'Starting delivery…',
      markingDelivered: 'Marking delivered…',
      startDeliveryConfirmTitle: 'Start Delivery Confirmation',
      startDeliveryConfirmBody:
        'Have you collected the order from the kitchen and started heading to the customer?',
      startDeliveryConfirmYes: 'Yes, start delivery',
      markDeliveredConfirmTitle: 'Confirm Delivery & Collection',
      markDeliveredConfirmBody:
        'Have you handed over the order to the customer and collected the required amount?',
      markDeliveredConfirmYes: 'Yes, mark delivered',
      confirmStartDeliveryTitle: 'Confirm Delivery Pickup',
      confirmStartDeliveryMessage:
        'Have you collected this order and are starting delivery to the customer?',
      confirmMarkDeliveredTitle: 'Confirm Delivery Completion',
      confirmMarkDeliveredMessage:
        'Has this order been delivered to the customer and total cash collected?',
      confirm: 'Confirm',
      cancel: 'Cancel',
      actionInProgress: 'Updating…',
      actionSuccess: 'Order updated successfully',
      staleError: 'Order data was updated by another action. Refreshing…',
      actionError: 'An error occurred while updating the order. Please try again.',
      refresh: 'Refresh data',
      orderUpdatedByOther: 'This order was updated by another user. Display refreshed.',
      deliveryStartedSuccess: 'Delivery started successfully.',
      orderDeliveredSuccess: 'Order marked as delivered successfully.',
      receivedAt: 'Order time',
      elapsed: 'Waiting',
      minute: 'min',
      minutes: 'mins',
      searchOrders: 'Search by order number, name, or address…',
      sessionExpired: 'Driver session expired. Please sign in again.',
      statusReady: 'Ready for Pickup',
      statusOnTheWay: 'On the Way',
      statusDelivered: 'Delivered',
      status: {
        Pending: 'Pending',
        Confirmed: 'Confirmed',
        Preparing: 'Preparing',
        Ready: 'Ready for pickup',
        OnTheWay: 'On the way',
        Delivered: 'Delivered',
      },
    },
    orderTracking: {
      title: 'Track Your Order',
      orderCode: 'Order Code',
      status: 'Status',
      lastUpdated: 'Last updated',
      orderSummary: 'Order Summary',
      orderItems: 'Order Items',
      deliveryAddress: 'Delivery Address',
      payment: 'Payment',
      orderTotal: 'Order Total',
      showDetails: 'Show Details',
      hideDetails: 'Hide Details',
      loading: 'Loading...',
      error: 'Failed to load order details',
      retry: 'Retry',
      reconnecting: 'Reconnecting...',
      connected: 'Connected',
      noCredential:
        'Tracking is only available from the device and browser that placed this order.',
      steps: {
        pending: 'We received your order',
        confirmed: 'Your order is confirmed',
        preparing: 'The kitchen is preparing your order',
        readyDelivery: 'Your order is ready, awaiting delivery',
        readyTakeaway: 'Your order is ready for pickup',
        onTheWay: 'Your order is on the way',
        delivered: 'Your order has been delivered',
      },
      reorder: {
        orderAgain: 'Order again',
        loadingPreview: 'Checking items…',
        previewTitle: 'Reorder',
        previewDescription: 'Review items from this order and add them to your cart',
        mergeConfirmTitle: 'Cart already has items',
        mergeConfirmQuestion:
          'You already have items in your cart. Would you like to add these items or replace your cart?',
        mergeAction: 'Add to cart',
        replaceAction: 'Replace cart',
        cancelAction: 'Cancel',
        partialSuccessNotice:
          'Available items were added to your cart. Some items from your previous order are no longer available.',
        allUnavailableNotice:
          'Items from this order are no longer available. You can browse the menu for alternatives.',
        priceChangeNotice: 'Prices may have changed since your previous order.',
        successToast: 'Items from this order have been added to your cart',
        viewCart: 'View Cart',
        unavailableReasons: {
          soldOut: 'Sold out',
          unavailable: 'Unavailable',
        },
        errorToast: 'Could not prepare reorder. Please try again.',
      },
    },
    myOrders: {
      title: 'My Orders',
      subtitle: 'Track and reorder meals you placed on this device',
      privacyNotice: 'Orders created or tracked on this device appear here.',
      activeSectionTitle: 'Active Orders',
      previousSectionTitle: 'Previous Orders',
      noOrdersTitle: 'No saved orders',
      noOrdersBody: 'Orders created or tracked on this device appear here.',
      browseMenu: 'Browse Menu',
      trackOrder: 'Track Order',
      viewDetails: 'View Details',
      orderAgain: 'Order again',
      removeFromList: 'Remove from list',
      loading: 'Loading your orders…',
      error: 'Unable to load some order details',
      retry: 'Retry',
      orderCode: 'Order Code',
      elapsed: 'ago',
      minute: 'min',
      minutes: 'mins',
      items: 'items',
      takeaway: 'Takeaway',
      delivery: 'Delivery',
      cash: 'Cash on Delivery',
      activeBadge: 'Active',
      previousBadge: 'Delivered',
    },
    management: {
      title: 'Management Dashboard',
      menuTitle: 'Menu & Catalog Management',
      hubTitle: 'Operations & Management Hub',
      signInTitle: 'Management Sign In',
      signInSubtitle: 'Operations and catalog control for Bab Al Hara supervisors and managers',
      signIn: 'Sign In',
      signingIn: 'Signing in…',
      email: 'Email',
      invalidEmail: 'Enter a valid email address.',
      password: 'Password',
      signOut: 'Sign Out',
      overview: 'Overview',
      navHub: 'Management Hub',
      navMenu: 'Menu & Catalog',
      navOperations: 'Operations Center',
      navEmployees: 'Employees',
      navReports: 'Reports & Analytics',
      viewCustomerMenu: 'View Customer Menu',
      operations: {
        title: 'Operations Command Center',
        subtitle: 'Live operational monitoring and order intervention',
        refresh: 'Refresh Data',
        realtimeConnected: 'Connected to live updates',
        realtimeReconnecting: 'Reconnecting...',
        realtimeDisconnected: 'Disconnected',
        lastUpdated: 'Last updated',
        summary: {
          activeOrders: 'Active Orders',
          pending: 'Pending',
          confirmed: 'Confirmed',
          preparing: 'Preparing',
          ready: 'Ready',
          onTheWay: 'On The Way',
          waitingDriver: 'Waiting for Driver',
        },
        attention: {
          title: 'Needs Attention',
          noAttention: 'No orders need attention right now',
          unassignedDelivery: 'Ready delivery order waiting for driver assignment',
          unacknowledgedPending: 'New order waiting for kitchen confirmation',
          inspectAction: 'Inspect Order',
        },
        activeQueue: {
          title: 'Active Order Flow',
          emptyActive: 'No active orders right now',
          searchPlaceholder: 'Search by order code (e.g. BH-)...',
          filterAll: 'All Active',
          filterPending: 'Pending',
          filterPreparing: 'Preparing',
          filterReady: 'Ready',
          filterOnTheWay: 'On The Way',
          filterDelivery: 'Delivery',
          filterTakeaway: 'Pickup',
          colCode: 'Order Code',
          colCustomer: 'Customer',
          colType: 'Type',
          colStatus: 'Status',
          colElapsedCreated: 'Created',
          colElapsedStatus: 'In State',
          colDriver: 'Driver',
          colTotal: 'Total',
          colActions: 'Actions',
          viewOrder: 'View',
          noSearchResults: 'No matching orders found',
        },
        drawer: {
          title: 'Operational Order Details',
          close: 'Close',
          orderCode: 'Public Code',
          customerName: 'Customer Name',
          customerPhone: 'Phone Number',
          orderType: 'Fulfillment',
          status: 'Operational Status',
          createdAt: 'Placed At',
          address: 'Delivery Address',
          deliveryArea: 'Delivery Area',
          customerNote: 'Customer Note',
          noNote: 'No customer note',
          itemsTitle: 'Order Items',
          qty: 'Qty',
          subtotal: 'Subtotal',
          deliveryFee: 'Delivery Fee',
          total: 'Grand Total',
          paymentMethod: 'Payment Method',
          paymentStatus: 'Payment Status',
          cashOnDelivery: 'Cash on Delivery',
          cashTakeaway: 'Cash at Pickup',
          paid: 'Paid',
          pendingPayment: 'Pending Payment',
          driverInfo: 'Driver Information',
          driverNotAssigned: 'No driver assigned yet',
          assignedAt: 'Assigned at',
          historyTitle: 'Status History Timeline',
          noHistory: 'No history records',
        },
        errors: {
          loadFailed: 'Failed to load operations. Please try again.',
          retry: 'Retry',
        },
        time: {
          justNow: 'Just now',
          minutesAgo: '{m} min ago',
          hoursAgo: '{h} hr ago',
          inStateForMinutes: 'In state for {m}m',
          inStateForHours: 'In state for {h}h',
        },
      },
      restaurantControl: {
        title: 'Order Acceptance Status',
        subtitle:
          'Control online order acceptance or temporarily pause the restaurant with a customer notice',
        acceptingOrders: 'Accepting Orders Now',
        openBadge: 'Open & Accepting Orders',
        pausedBadge: 'Temporarily Paused',
        pauseMessageAr: 'Pause Notice (Arabic)',
        pauseMessageEn: 'Pause Notice (English)',
        pauseMessageArPlaceholder: 'e.g. نعتذر، نستقبل طلباتكم بعد ساعة بسبب ضغط العمل.',
        pauseMessageEnPlaceholder: 'e.g. Sorry, we are temporarily paused due to kitchen rush.',
        charCount: 'chars',
        lastUpdated: 'Last updated',
        updatedBy: 'By',
        saveButton: 'Save Status',
        saving: 'Saving…',
        savedSuccess: 'Restaurant status updated successfully.',
        saveError: 'Failed to update restaurant status. Please try again.',
        staleError: 'Restaurant status was updated by another manager. Data refreshed.',
        refreshPrompt: 'Refresh Data',
      },
      stats: {
        title: 'Catalog Statistics',
        totalCategories: 'Total Categories',
        activeCategories: 'Active Categories',
        totalMenuItems: 'Total Menu Items',
        availableItems: 'Available Items',
        soldOutItems: 'Sold Out Items',
        archivedItems: 'Archived Items',
      },
      categories: {
        title: 'Menu Categories',
        subtitle: 'Manage categories and display ordering',
        newCategory: 'Add New Category',
        editCategory: 'Edit Category',
        nameAr: 'Category Name (Arabic)',
        nameEn: 'Category Name (English)',
        displayOrder: 'Display Order',
        status: 'Status',
        active: 'Active',
        archived: 'Archived',
        itemCount: 'Item Count',
        actions: 'Actions',
        edit: 'Edit',
        activate: 'Activate',
        archive: 'Archive',
        save: 'Save Category',
        saving: 'Saving…',
        cancel: 'Cancel',
        createSuccess: 'Category created successfully.',
        updateSuccess: 'Category updated successfully.',
        toggleSuccess: 'Category status changed successfully.',
        error: 'Failed to save category. Please try again.',
        staleError: 'Category was modified by another user. Please retry.',
        emptyTitle: 'No categories found',
        emptyBody: 'Create your first category to organize the menu.',
        nameArRequired: 'Arabic name is required.',
        nameEnRequired: 'English name is required.',
        displayOrderInvalid: 'Display order must be 0 or higher.',
      },
      menuItems: {
        title: 'Menu Items',
        subtitle: 'Manage item details, pricing, availability, and active status',
        newItem: 'Add New Item',
        editItem: 'Edit Item',
        filterCategory: 'Filter by Category',
        allCategories: 'All Categories',
        searchPlaceholder: 'Search items by name or description…',
        image: 'Image',
        nameAr: 'Item Name (Arabic)',
        nameEn: 'Item Name (English)',
        descriptionAr: 'Description (Arabic)',
        descriptionEn: 'Description (English)',
        category: 'Category',
        selectCategory: 'Select Category',
        price: 'Price (EGP)',
        preparationMinutes: 'Prep Time (mins)',
        displayOrder: 'Display Order',
        availability: 'Ordering Availability',
        available: 'Available',
        unavailable: 'Sold Out',
        status: 'Catalog Status',
        active: 'Active in Menu',
        archived: 'Archived (Hidden)',
        actions: 'Actions',
        edit: 'Edit',
        toggleAvailability: 'Toggle Availability',
        toggleStatus: 'Toggle Status',
        save: 'Save Item',
        saving: 'Saving…',
        cancel: 'Cancel',
        createSuccess: 'Menu item created successfully.',
        updateSuccess: 'Menu item updated successfully.',
        availabilitySuccess: 'Item availability updated successfully.',
        statusSuccess: 'Item catalog status updated successfully.',
        error: 'Failed to save menu item. Please try again.',
        staleError: 'Menu item was modified by another user. Please retry.',
        emptyTitle: 'No items in this category',
        emptyBody: 'Add new items to show them in the customer menu.',
        noFilteredItems: 'No items match your search',
        selectImage: 'Select Preset Image',
        customImage: 'Custom Image URL/Path',
        imageRequired: 'Item image is required.',
        nameArRequired: 'Arabic item name is required.',
        nameEnRequired: 'English item name is required.',
        priceInvalid: 'Price must be greater than 0.',
        prepTimeInvalid: 'Preparation time must be between 1 and 240 minutes.',
        displayOrderInvalid: 'Display order must be 0 or higher.',
        categoryRequired: 'Category is required.',
        sectionBasic: 'Basic Information',
        sectionSelling: 'Pricing & Availability',
        sectionOrdering: 'Preparation & Ordering',
        sectionImage: 'Menu Item Image',
        chooseImage: 'Choose image',
        changeImage: 'Change image',
        removeImage: 'Remove image',
        imageCardHint: 'JPG, PNG, or WEBP (up to 5 MB)',
        dropImageHint: 'Drag and drop an image here, or browse',
        uploadingImage: 'Uploading image…',
        imageUploadFailed: 'Item was saved, but image upload failed. Please try uploading again.',
        imageUploadError: 'An error occurred while uploading the image.',
        imageTooLarge: 'Image file is too large. Please select an image under 5 MB.',
        imageFormatUnsupported: 'Unsupported image format. Please use JPG, PNG, or WEBP.',
        removeImageConfirmTitle: 'Confirm Image Removal',
        removeImageConfirmBody: 'Are you sure you want to remove the image for this menu item?',
        removeImageConfirmYes: 'Yes, Remove Image',
        removeImageConfirmNo: 'Cancel',
        noImagePlaceholder: 'No image',
        retryUpload: 'Retry image upload',
      },
      tabs: {
        categories: 'Categories',
        menuItems: 'Menu Items',
      },
      errors: {
        loadFailed: 'Failed to load data. Please retry.',
        retry: 'Retry',
        unauthorized: 'Please sign in with a manager account to proceed.',
        forbidden: 'You do not have permission to access management.',
      },
    },
    employees: {
      title: 'Employees',
      addEmployee: 'Add employee',
      searchPlaceholder: 'Search by name or email',
      filterAll: 'All',
      displayName: 'Name',
      email: 'Email',
      role: 'Role',
      status: 'Status',
      active: 'Active',
      disabled: 'Disabled',
      you: 'You',
      actions: 'Actions',
      edit: 'Edit',
      enable: 'Enable',
      disable: 'Disable',
      resetPassword: 'Reset password',
      loading: 'Loading…',
      emptyTitle: 'No employees',
      emptyBody: 'Add the first employee to get started.',
      noResults: 'No matching results',
      errorTitle: 'Could not load employees',
      errorBody: 'Check your connection and try again.',
      createTitle: 'Add new employee',
      editTitle: 'Edit employee',
      basicInfo: 'Basic information',
      roleSection: 'Role',
      passwordSection: 'Temporary password',
      displayNameLabel: 'Full name',
      emailLabel: 'Email',
      temporaryPasswordLabel: 'Temporary password',
      newPasswordLabel: 'New password',
      showPassword: 'Show',
      hidePassword: 'Hide',
      generatePassword: 'Generate password',
      copyPassword: 'Copy',
      copiedPassword: 'Copied',
      save: 'Save',
      saving: 'Saving…',
      cancel: 'Cancel',
      roleKitchen: 'Kitchen',
      roleCashier: 'Cashier',
      roleDriver: 'Driver',
      roleManager: 'Manager',
      roleAdmin: 'Admin',
      disableTitle: 'Disable {name}?',
      disableBody:
        'This employee will not be able to sign in or use their role screens until the account is reactivated.',
      enableTitle: 'Enable {name}?',
      enableBody: 'This employee will be able to sign in and use the system again.',
      roleChangeTitle: 'Change employee role?',
      roleChangeBody:
        "Changing the role will end the employee's active session so new permissions can be applied.",
      resetPasswordTitle: 'Reset password for {name}',
      resetPasswordBody:
        'Enter a new password. You must provide it to the employee so they can sign in.',
      confirmAction: 'Confirm',
      conflictError: 'The employee data was modified by another user. Refresh and try again.',
      forbiddenError: 'You are not authorized for this action.',
      validationError: 'Check the entered data.',
      sessionExpired: 'Session expired. Sign in again.',
    },
    reports: {
      title: 'Sales & Operational Reports',
      subtitle: 'Accurate metrics for sales revenue, fulfillment channels, and kitchen timing',
      datePresetLabel: 'Time Period',
      presetToday: 'Today',
      presetYesterday: 'Yesterday',
      presetLast7Days: 'Last 7 Days',
      presetLast30Days: 'Last 30 Days',
      presetCustom: 'Custom Range',
      fromDate: 'From Date',
      toDate: 'To Date',
      invalidDateRange: 'Start date must be before or equal to end date',
      applyFilter: 'Apply Filter',
      fulfillmentFilterLabel: 'Fulfillment Type',
      fulfillmentAll: 'All Channels',
      fulfillmentDelivery: 'Delivery Only',
      fulfillmentTakeaway: 'Takeaway Only',
      refresh: 'Refresh Data',
      refreshing: 'Updating...',
      lastUpdated: 'Last Updated',
      summary: {
        completedSales: 'Completed Sales Revenue',
        completedSalesHint: 'Net sales from successfully delivered orders',
        completedOrders: 'Completed Orders',
        completedOrdersHint: 'Number of orders successfully delivered',
        averageOrderValue: 'Average Order Value (AOV)',
        averageOrderValueHint: 'Average revenue per completed order',
        totalOrdersPlaced: 'Total Orders Placed',
        totalOrdersPlacedHint: 'Includes all orders created in this timeframe',
      },
      trends: {
        title: 'Daily Sales & Order Volume Trend',
        subtitle: 'Revenue distribution and order counts over the selected timeframe',
        revenueLegend: 'Daily Revenue (EGP)',
        ordersLegend: 'Completed Orders',
        viewTableToggle: 'View Table',
        viewChartToggle: 'View Chart',
        tableAccessibleTitle: 'Daily Sales & Orders Breakdown Table',
        tableDate: 'Date',
        tableRevenue: 'Revenue',
        tableCompletedOrders: 'Completed Orders',
        tableTotalOrders: 'Total Orders Placed',
        noTrendData: 'No sales activity recorded in this date range',
      },
      fulfillment: {
        title: 'Fulfillment Channel Breakdown',
        subtitle: 'Sales volume and revenue share between delivery and takeaway',
        deliveryTitle: 'Delivery Orders',
        takeawayTitle: 'Takeaway Orders',
        orderCount: 'Orders Count',
        revenue: 'Sales Revenue',
        deliveryFees: 'Delivery Fees Collected',
        share: 'Share of Total',
        totalVolume: 'Total Sales Volume',
      },
      bestSelling: {
        title: 'Best-Selling Items',
        subtitle: 'Menu items ranked by quantity sold and revenue contribution',
        rank: '#',
        itemName: 'Item Name',
        quantitySold: 'Qty Sold',
        totalRevenue: 'Revenue Contribution',
        emptyNotice: 'No item sales recorded in this date range',
      },
      timing: {
        title: 'Operational Timing & Peak Hours',
        subtitle: 'Factual kitchen preparation, delivery transit, and hourly order distribution',
        avgPrepTime: 'Avg Prep Time',
        avgPrepTimeHint: 'From confirmation to ready for pickup in kitchen',
        avgDeliveryTime: 'Avg Delivery Time',
        avgDeliveryTimeHint: 'From dispatch to delivered by driver',
        avgTotalTime: 'Avg Total Fulfillment Time',
        avgTotalTimeHint: 'From order placement to final delivery',
        minutesUnit: 'min',
        notAvailable: 'N/A',
        hourlyTitle: 'Hourly Order Distribution',
        hourlySubtitle: 'Order volume and revenue distribution across 24 hours',
        hourlyTableTitle: 'Hourly Peak Distribution Table',
        hourlyHour: 'Hour',
        hourlyOrders: 'Orders Count',
        hourlyRevenue: 'Revenue',
        noTimingData: 'Not enough order timing records for fulfillment calculations',
      },
      empty: {
        title: 'No Data for Selected Period',
        message:
          'No orders or sales were found matching the selected timeframe and fulfillment filter.',
        resetFilter: 'Reset Filters',
      },
      errors: {
        loadFailed: 'Failed to load reporting and analytics data.',
        retry: 'Retry',
      },
    },
    home: {
      heroEyebrow: 'Authentic Levantine Heritage',
      heroTitle: 'Traditional Charcoal Grills & Specialties',
      heroSubtitle:
        'Savor authentic Levantine grilled dishes seasoned with traditional family marinades and 100% fresh daily meats, served with genuine hospitality.',
      orderNow: 'Order Food Now',
      exploreMenu: 'Explore Full Menu',
      badgeFresh: '100% Fresh Daily Halal Meat',
      highlightsTitle: 'Why Bab Al Hara?',
      feature1Title: 'Fresh Meats Daily',
      feature1Desc: 'We carefully source premium fresh local meats slaughtered daily under rigorous standards.',
      feature2Title: 'Natural Charcoal Grilling',
      feature2Desc: 'Every kebab and cut is slowly flame-grilled over natural charcoal embers for unmatched aroma.',
      feature3Title: 'Express Hot Delivery',
      feature3Desc: 'Delivered in specialized thermal containers ensuring your food arrives piping hot.',
      feature4Title: 'Secret Family Marinades',
      feature4Desc: 'Syrian spice blends perfected over generations giving an unforgettable taste.',
      specialsTitle: 'Popular Signature Dishes',
      specialsSubtitle: 'A curated selection of our most loved grills, sandwiches, and hot Levantine appetizers.',
      aboutStoryTitle: 'The Bab Al Hara Story',
      aboutStoryBody:
        'Our journey started from a profound love for traditional Levantine gastronomy. At Bab Al Hara, we bring the culinary spirit of Old Damascus to your table with uncompromising quality and warm hospitality.',
      readMore: 'Learn More About Us',
      reviewsTitle: 'Guest Testimonials',
      review1Text:
        'The best mixed grill I have ever tasted! The meat is exceptionally tender, spices are balanced, and delivery was remarkably fast.',
      review1Author: 'Ahmed M. — Loyal Customer',
      review2Text:
        'Authentic Syrian shawarma and appetizers that remind me of Damascus. Clean, hot, and professionally packaged.',
      review2Author: 'Sara A. — Food Critic',
      review3Text:
        'Outstanding food and warm, attentive service. Generous family portions at very reasonable prices.',
      review3Author: 'Mohamed I. — Frequent Guest',
    },
    about: {
      eyebrow: 'Heritage & Vision',
      title: 'About Us — Bab Al Hara',
      subtitle:
        'A passionate journey in Levantine culinary traditions, dedicated to serving authentic taste and generous hospitality.',
      storyTitle: 'Levantine Charcoal Heritage',
      storyParagraph1:
        'Bab Al Hara was founded to embody the warm spirit of Syrian hospitality and the iconic flavors of Damascus historic quarters. We embarked with a clear mission: reviving the art of natural wood-charcoal grilling using the finest fresh meats and authentic spices.',
      storyParagraph2:
        'We do not simply prepare food; we create warm memories around your table. Our veteran master chefs craft tender kebabs, shish tawook, lamb chops, and shawarma sandwiches using 100% fresh daily local meats.',
      valuesTitle: 'Our Core Principles',
      value1Title: 'Uncompromising Quality',
      value1Desc: 'Zero tolerance for substandard ingredients; rigorous daily inspection and selection.',
      value2Title: 'Authenticity & Honesty',
      value2Desc: 'Heritage recipes and natural spices without artificial flavor enhancers or additives.',
      value3Title: 'Genuine Hospitality',
      value3Desc: 'Attentive, swift service that makes every customer feel like a treasured family guest.',
      statYears: '12+',
      statYearsLabel: 'Years of Culinary Mastery',
      statCustomers: '50,000+',
      statCustomersLabel: 'Satisfied Meals Served',
      statDishes: '35+',
      statDishesLabel: 'Authentic Levantine Specialties',
      ctaTitle: 'Ready to Experience Authentic Levantine Flavors?',
      ctaButton: 'Browse Menu & Order Now',
    },
    contact: {
      eyebrow: 'Get in Touch',
      title: 'Contact Us — Bab Al Hara',
      subtitle: 'We are here to answer your questions, handle custom inquiries, and assist you around the clock.',
      phoneTitle: 'Direct Hotline',
      phoneValue: '+20 100 234 5678',
      whatsappTitle: 'WhatsApp Support',
      whatsappValue: '+20 100 234 5678',
      addressTitle: 'Restaurant Location',
      addressValue: 'Main El-Gomhoureya St., Downtown — Cairo, Egypt',
      hoursTitle: 'Opening Hours',
      hoursValue: 'Daily: 11:00 AM – 02:00 AM (Midnight)',
      formTitle: 'Send Us a Direct Message',
      nameLabel: 'Full Name',
      phoneOrEmailLabel: 'Phone Number or Email',
      subjectLabel: 'Subject',
      messageLabel: 'Your Message or Inquiry',
      submitButton: 'Send Message Now',
      successMessage: 'Your message has been sent successfully! Our team will respond shortly.',
      validationError: 'Please complete all required fields with valid contact information.',
    },
    search: {
      title: 'Search Our Menu',
      subtitle: 'Find your favorite dishes by name or ingredients and explore delicious Levantine options.',
      placeholder: 'Search for kebabs, grills, shawarma, sandwiches...',
      clear: 'Clear search',
      quickTags: 'Popular Searches:',
      tagAll: 'All',
      tagGrills: 'Grills',
      tagShawarma: 'Shawarma',
      tagSandwiches: 'Sandwiches',
      tagAppetizers: 'Appetizers',
      tagDrinks: 'Beverages',
      resultsCount: 'Found {count} matching dishes',
      emptyTitle: 'No dishes match your search',
      emptySubtitle: 'Try using different keywords or browse our full categories on the main menu.',
      browseAll: 'View All Available Dishes',
    },
    wishlist: {
      title: 'My Wishlist',
      subtitle: 'Your favorite dishes saved for quick and convenient ordering.',
      itemsCount: '{count} saved favorite items',
      addAllToCart: 'Add All to Cart',
      addAllSuccess: 'All available favorites have been added to your cart!',
      emptyTitle: 'Your wishlist is currently empty',
      emptySubtitle: 'Click the heart icon on any menu item card to save your favorites here.',
      browseMenu: 'Explore Menu & Add Favorites',
      remove: 'Remove from Wishlist',
    },
    profile: {
      title: 'My Profile & Details',
      greeting: 'Welcome to Bab Al Hara',
      guestBadge: 'Secure Local Profile',
      personalInfoTitle: 'Saved Personal Details',
      nameLabel: 'Full Name',
      phoneLabel: 'Phone Number',
      defaultAddressTitle: 'Default Delivery Address',
      noSavedAddress: 'No default address saved yet. Save your address to expedite future orders.',
      totalOrdersLabel: 'Total Recorded Orders',
      wishlistLabel: 'Saved Favorites',
      quickActionsTitle: 'Quick Links',
      viewOrders: 'Order History & Live Tracking',
      viewWishlist: 'My Wishlist',
      accountSettings: 'Edit Profile & Settings',
      startOrder: 'Start a New Order Now',
    },
    accountSettings: {
      title: 'Account Settings',
      subtitle: 'Update your contact details and default delivery address stored on this device.',
      personalDetails: 'Edit Personal Information',
      name: 'Full Name',
      phone: 'Phone Number (+20 Egyptian format)',
      savedDeliveryAddress: 'Default Delivery Address',
      addressStreet: 'Street & District',
      addressBuilding: 'Building / House Number',
      addressFloor: 'Floor & Apartment',
      addressNotes: 'Delivery Landmark / Notes',
      saveChanges: 'Save Changes',
      savedSuccess: 'Your details have been saved successfully on this device!',
      clearData: 'Clear Locally Saved Data',
      clearConfirm: 'Are you sure you want to clear all data saved locally on this browser?',
      clearedSuccess: 'Locally saved data cleared successfully.',
    },
    auth: {
      signInTab: 'Sign In',
      signUpTab: 'Sign Up',
      signInTitle: 'Sign In to Your Account',
      signUpTitle: 'Create a New Account',
      phoneOrEmail: 'Phone Number or Email',
      password: 'Password',
      name: 'Full Name',
      rememberMe: 'Remember me on this device',
      forgotPassword: 'Forgot password?',
      signInSubmit: 'Sign In',
      signUpSubmit: 'Sign Up & Continue',
      continueAsGuest: 'Continue as Guest (No Registration)',
      guestNotice: 'You can order immediately as a guest with no mandatory account creation.',
      successNotice: 'Signed in successfully! Welcome to Bab Al Hara.',
      validationError: 'Please ensure all required fields are filled out correctly.',
    },
    orderDetails: {
      title: 'Order Details & Receipt',
      orderNumber: 'Order Number',
      orderDate: 'Date & Time',
      fulfillmentType: 'Fulfillment Type',
      deliveryAddress: 'Delivery Address',
      customerName: 'Customer Name',
      customerPhone: 'Customer Phone',
      assignedDriver: 'Assigned Courier',
      itemsTitle: 'Ordered Items',
      itemPrice: 'Unit Price',
      itemQuantity: 'Quantity',
      itemTotal: 'Item Total',
      liveTrackButton: 'Live Track Order Status',
      reorderButton: 'Reorder These Items',
      backToOrders: 'Back to My Orders',
    },
    footer: {
      description:
        'Bab Al Hara Restaurant — Premium authentic Levantine charcoal grills and heritage specialties.',
      quickLinksTitle: 'Quick Links',
      workingHoursTitle: 'Working Hours',
      workingHoursValue: 'Daily: 11:00 AM – 02:00 AM',
      contactTitle: 'Contact Us',
      branchesTitle: 'Branches & Delivery',
      branchesValue: 'Express delivery covering all nearby downtown zones',
      copyright: 'All rights reserved © Bab Al Hara Restaurant. Authentic Levantine Taste.',
    },
  },
};
