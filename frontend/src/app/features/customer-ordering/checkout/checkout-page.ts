import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { formatMoney, localizedText } from '../../../core/i18n/formatters';
import { LanguageService } from '../../../core/i18n/language.service';
import { CustomerFooter } from '../../../shared/customer-footer/customer-footer';
import { CustomerHeader } from '../../../shared/customer-header/customer-header';
import { RestaurantPausedBanner } from '../../../shared/restaurant-paused-banner/restaurant-paused-banner';
import { CartService } from '../cart/cart.service';
import { CustomerApiService } from '../customer-api.service';
import { CustomerContactProfileService } from '../customer-contact-profile.service';
import { CustomerPreferencesService } from '../customer-preferences.service';
import { CreateOrderRequest, DeliveryArea, OrderType, ProblemDetails } from '../order.models';
import { RecentOrdersService } from '../recent-orders.service';
import { RestaurantStatusService } from '../restaurant-status.service';
import { OrderReceiptService } from '../success/order-receipt.service';

type AreaState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-checkout-page',
  imports: [
    CustomerHeader,
    CustomerFooter,
    ReactiveFormsModule,
    RestaurantPausedBanner,
    RouterLink,
  ],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPage implements OnInit {
  private readonly api = inject(CustomerApiService);
  private readonly router = inject(Router);
  private readonly receipt = inject(OrderReceiptService);
  private readonly contactProfile = inject(CustomerContactProfileService);
  private readonly preferencesService = inject(CustomerPreferencesService);
  private readonly recentOrders = inject(RecentOrdersService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly cart = inject(CartService);
  protected readonly statusService = inject(RestaurantStatusService);
  protected readonly areaState = signal<AreaState>('loading');
  protected readonly deliveryAreas = signal<readonly DeliveryArea[]>([]);
  protected readonly submitted = signal(false);
  protected readonly sending = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly hasPrefilledContact = signal(false);
  protected readonly hasSavedAddress = signal(false);
  protected readonly staleAreaWarning = signal(false);
  protected readonly form = new FormGroup({
    customerName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    customerPhone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^(?:\+20|0020|0)?1[0125]\d{8}$/)],
    }),
    orderType: new FormControl<OrderType>('Takeaway', { nonNullable: true }),
    deliveryAreaId: new FormControl({ value: '', disabled: true }, { nonNullable: true }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
    customerNote: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
  });
  private readonly nameValue = toSignal(this.form.controls.customerName.valueChanges, {
    initialValue: this.form.controls.customerName.value,
  });
  private readonly phoneStatus = toSignal(this.form.controls.customerPhone.statusChanges, {
    initialValue: this.form.controls.customerPhone.status,
  });
  private readonly phoneValue = toSignal(this.form.controls.customerPhone.valueChanges, {
    initialValue: this.form.controls.customerPhone.value,
  });
  private readonly addressValue = toSignal(this.form.controls.address.valueChanges, {
    initialValue: this.form.controls.address.value,
  });

  protected readonly orderType = toSignal(this.form.controls.orderType.valueChanges, {
    initialValue: this.form.controls.orderType.value,
  });
  protected readonly selectedAreaId = toSignal(this.form.controls.deliveryAreaId.valueChanges, {
    initialValue: this.form.controls.deliveryAreaId.value,
  });
  protected readonly selectedArea = computed(() =>
    this.deliveryAreas().find((area) => area.id === this.selectedAreaId()),
  );
  protected readonly displayedDeliveryFee = computed(() =>
    this.orderType() === 'Delivery' ? (this.selectedArea()?.deliveryFee ?? 0) : 0,
  );
  protected readonly displayedTotal = computed(
    () => this.cart.subtotal() + this.displayedDeliveryFee(),
  );
  protected readonly isStep1Complete = computed(() => {
    const name = this.nameValue().trim();
    const phone = this.phoneValue().trim();
    const phoneValid = this.phoneStatus() === 'VALID';
    return Boolean(name && phone && phoneValid);
  });
  protected readonly isStep2Complete = computed(() => {
    if (this.orderType() === 'Takeaway') {
      return true;
    }
    return Boolean(this.selectedAreaId() && this.addressValue().trim());
  });
  protected readonly isStep3Complete = computed(
    () => this.isStep1Complete() && this.isStep2Complete(),
  );
  protected readonly activeStep = computed<1 | 2 | 3>(() => {
    if (!this.isStep1Complete()) return 1;
    if (!this.isStep2Complete()) return 2;
    return 3;
  });
  protected readonly deliveryDetailsInvalid = computed(
    () =>
      this.submitted() &&
      this.orderType() === 'Delivery' &&
      (!this.selectedAreaId() || !this.form.controls.address.value.trim()),
  );

  ngOnInit(): void {
    if (this.cart.items().length === 0) {
      this.errorMessage.set(this.copy().checkout.emptyCart);
    }
    const savedContact = this.contactProfile.profile();
    if (savedContact) {
      this.form.controls.customerName.setValue(savedContact.name);
      this.form.controls.customerPhone.setValue(savedContact.phone);
      this.hasPrefilledContact.set(true);
    }

    const savedPrefs = this.preferencesService.getPreferences();
    if (savedPrefs) {
      if (savedPrefs.orderType === 'Delivery') {
        this.form.controls.orderType.setValue('Delivery');
      } else {
        this.form.controls.orderType.setValue('Takeaway');
      }

      if (savedPrefs.address) {
        this.form.controls.address.setValue(savedPrefs.address);
      }

      if (savedPrefs.address || savedPrefs.deliveryAreaId) {
        this.hasSavedAddress.set(true);
      }
    }

    this.form.controls.deliveryAreaId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.staleAreaWarning()) {
          this.staleAreaWarning.set(false);
        }
      });

    this.statusService.loadStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.loadDeliveryAreas();
  }

  protected clearSavedContact(): void {
    this.contactProfile.clear();
    this.hasPrefilledContact.set(false);
    this.form.controls.customerName.setValue('');
    this.form.controls.customerPhone.setValue('');
  }

  protected clearSavedAddress(): void {
    this.preferencesService.clearSavedAddress();
    this.hasSavedAddress.set(false);
    this.staleAreaWarning.set(false);
    this.form.controls.deliveryAreaId.setValue('');
    this.form.controls.address.setValue('');
  }

  protected loadDeliveryAreas(): void {
    this.areaState.set('loading');
    this.form.controls.deliveryAreaId.disable({ emitEvent: false });
    this.api
      .getDeliveryAreas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (areas) => {
          this.deliveryAreas.set(areas);
          this.areaState.set('ready');
          this.form.controls.deliveryAreaId.enable({ emitEvent: false });

          const savedPrefs = this.preferencesService.getPreferences();
          if (savedPrefs?.deliveryAreaId) {
            const areaExists = areas.some((a) => a.id === savedPrefs.deliveryAreaId);
            if (areaExists) {
              this.form.controls.deliveryAreaId.setValue(savedPrefs.deliveryAreaId);
            } else {
              this.staleAreaWarning.set(true);
            }
          }
        },
        error: () => {
          this.areaState.set('error');
          this.form.controls.deliveryAreaId.enable({ emitEvent: false });
        },
      });
  }

  protected submit(): void {
    if (this.sending() || this.statusService.isPaused()) {
      return;
    }

    this.submitted.set(true);
    this.errorMessage.set('');
    this.form.markAllAsTouched();

    if (this.cart.items().length === 0) {
      this.errorMessage.set(this.copy().checkout.emptyCart);
      return;
    }

    if (
      this.form.invalid ||
      (this.orderType() === 'Delivery' &&
        (!this.selectedAreaId() || !this.form.controls.address.value.trim()))
    ) {
      return;
    }

    const displayedTotal = this.displayedTotal();
    const orderType = this.orderType();
    const request: CreateOrderRequest = {
      customerName: this.form.controls.customerName.value.trim(),
      customerPhone: this.form.controls.customerPhone.value.trim(),
      orderType,
      deliveryAreaId: orderType === 'Delivery' ? this.selectedAreaId() : null,
      address: orderType === 'Delivery' ? this.form.controls.address.value.trim() : null,
      customerNote: this.form.controls.customerNote.value.trim() || null,
      items: this.cart.items().map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      })),
    };

    this.sending.set(true);
    this.api
      .createOrder(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.contactProfile.save({
            name: request.customerName,
            phone: request.customerPhone,
          });

          if (orderType === 'Delivery') {
            const selected = this.selectedArea();
            this.preferencesService.savePreferences({
              orderType: 'Delivery',
              deliveryAreaId: this.selectedAreaId() || null,
              deliveryAreaNameAr: selected?.nameAr ?? null,
              deliveryAreaNameEn: selected?.nameEn ?? null,
              address: this.form.controls.address.value.trim() || null,
            });
          } else {
            const existing = this.preferencesService.getPreferences();
            this.preferencesService.savePreferences({
              orderType: 'Takeaway',
              deliveryAreaId: existing?.deliveryAreaId ?? null,
              deliveryAreaNameAr: existing?.deliveryAreaNameAr ?? null,
              deliveryAreaNameEn: existing?.deliveryAreaNameEn ?? null,
              address: existing?.address ?? null,
            });
          }

          this.recentOrders.registerOrder(order.publicCode);
          this.recentOrders.setActiveOrderCode(order.publicCode);

          this.receipt.save({
            order,
            displayedTotalChanged: Math.abs(order.total - displayedTotal) > 0.001,
          });
          this.cart.clear();
          void this.router.navigate(['/order-confirmed']);
        },
        error: (error: HttpErrorResponse) => {
          this.sending.set(false);
          const problem = error.error as ProblemDetails | undefined;
          const code =
            problem?.code ?? (error.status === 409 ? 'restaurant_not_accepting_orders' : undefined);
          if (code === 'restaurant_not_accepting_orders' || error.status === 409) {
            this.statusService.setPausedManually(problem?.detail, null);
          }
          this.errorMessage.set(this.problemMessage(code, problem?.detail));
        },
      });
  }

  protected areaName(area: DeliveryArea): string {
    return localizedText(this.language.current(), area.nameAr, area.nameEn);
  }

  protected itemName(item: { nameAr: string; nameEn: string }): string {
    return localizedText(this.language.current(), item.nameAr, item.nameEn);
  }

  protected selectOrderType(type: OrderType): void {
    if (this.form.controls.orderType.value !== type) {
      this.form.controls.orderType.setValue(type);
    }
  }

  protected money(value: number): string {
    return formatMoney(value, this.language.current());
  }

  private problemMessage(code?: string, detail?: string): string {
    if (code === 'restaurant_not_accepting_orders') {
      return this.copy().checkout.restaurantNotAcceptingOrdersError;
    }
    if (code === 'unavailable_menu_item' || code === 'inactive_menu_item') {
      return this.copy().checkout.unavailableError;
    }
    if (code === 'inactive_delivery_area' || code === 'invalid_delivery_area') {
      return this.copy().checkout.areaError;
    }
    return detail || this.copy().checkout.orderError;
  }
}
