import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { LanguageService } from '../../../core/i18n/language.service';
import { ManagementApiService } from '../management-api.service';
import { RestaurantControlDto, UpdateRestaurantControlRequest } from '../management.models';

@Component({
  selector: 'app-restaurant-status-card',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './restaurant-status-card.component.html',
  styleUrl: './restaurant-status-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantStatusCardComponent implements OnInit {
  private readonly api = inject(ManagementApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly currentStatus = signal<RestaurantControlDto | null>(null);

  protected readonly form = new FormGroup({
    acceptingOrders: new FormControl<boolean>(true, { nonNullable: true }),
    pauseMessageAr: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(300)],
    }),
    pauseMessageEn: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(300)],
    }),
  });

  ngOnInit(): void {
    this.loadStatus();
  }

  loadStatus(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .getRestaurantControlStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status) => {
          this.currentStatus.set(status);
          this.form.patchValue({
            acceptingOrders: status.acceptingOrders,
            pauseMessageAr: status.pauseMessageAr ?? '',
            pauseMessageEn: status.pauseMessageEn ?? '',
          });
          this.loading.set(false);
        },
        error: () => {
          this.error.set(this.copy().management.errors.loadFailed);
          this.loading.set(false);
        },
      });
  }

  save(): void {
    if (this.saving() || this.form.invalid) return;

    this.saving.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const formVal = this.form.getRawValue();
    const req: UpdateRestaurantControlRequest = {
      acceptingOrders: formVal.acceptingOrders,
      pauseMessageAr: formVal.pauseMessageAr.trim() || null,
      pauseMessageEn: formVal.pauseMessageEn.trim() || null,
      rowVersion: this.currentStatus()?.rowVersion ?? null,
    };

    this.api
      .updateRestaurantControlStatus(req)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.currentStatus.set(updated);
          this.form.patchValue({
            acceptingOrders: updated.acceptingOrders,
            pauseMessageAr: updated.pauseMessageAr ?? '',
            pauseMessageEn: updated.pauseMessageEn ?? '',
          });
          this.saving.set(false);
          this.successMessage.set(this.copy().management.restaurantControl.savedSuccess);
        },
        error: (err) => {
          this.saving.set(false);
          if (err.status === 409) {
            this.error.set(this.copy().management.restaurantControl.staleError);
          } else {
            this.error.set(this.copy().management.restaurantControl.saveError);
          }
        },
      });
  }
}
