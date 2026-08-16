import { Injectable } from '@angular/core';
import Swal, { SweetAlertOptions } from 'sweetalert2';
import { UI_COPY } from '../../../core/i18n/translations';

@Injectable({
  providedIn: 'root',
})
export class CartToastService {
  showAddedToast(itemName: string, wasUpdated: boolean, lang: 'ar' | 'en'): void {
    const copy = UI_COPY[lang].menu;
    const isRtl = document.documentElement.dir === 'rtl';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const title = wasUpdated ? copy.updatedToast : copy.addedToast;
    const text = wasUpdated ? null : copy.addedToastSubtitle.replace('{{itemName}}', itemName);

    const swalOptions: SweetAlertOptions = {
      toast: true,
      position: 'top-end',
      timer: prefersReducedMotion ? 0 : 2000,
      timerProgressBar: !prefersReducedMotion,
      showConfirmButton: false,
      icon: 'success',
      backdrop: false,
      title: title,
      text: text || undefined,
      showClass: prefersReducedMotion ? { popup: 'swal2-noanimation' } : undefined,
      hideClass: prefersReducedMotion ? { popup: 'swal2-noanimation' } : undefined,
    };

    // Some implementations or wrappers check this.
    // SweetAlert2 respects the document dir, but we explicitly set it on the popup if needed
    swalOptions.didOpen = (popup: HTMLElement) => {
      popup.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    };

    Swal.fire(swalOptions);
  }
}
