import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { LanguageService } from '../../core/i18n/language.service';
import { FeedbackState, Language } from '../../core/i18n/translations';

@Component({
  selector: 'app-foundation-page',
  imports: [ReactiveFormsModule],
  templateUrl: './foundation-page.html',
  styleUrl: './foundation-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundationPage {
  protected readonly language = inject(LanguageService);
  protected readonly copy = this.language.copy;
  protected readonly sampleName = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly submitted = signal(false);
  protected readonly feedbackState = signal<FeedbackState>('ready');
  protected readonly feedbackMessage = computed(() => this.copy().feedback[this.feedbackState()]);

  protected setLanguage(language: Language): void {
    this.language.setLanguage(language);
  }

  protected saveExample(): void {
    this.submitted.set(true);
    this.sampleName.markAsTouched();

    if (this.sampleName.invalid) {
      this.feedbackState.set('error');
      return;
    }

    this.feedbackState.set('success');
  }

  protected resetExample(): void {
    this.sampleName.reset();
    this.submitted.set(false);
    this.feedbackState.set('ready');
  }

  protected clearExample(): void {
    this.sampleName.setValue('');
    this.sampleName.markAsTouched();
    this.submitted.set(false);
    this.feedbackState.set('cleared');
  }

  protected showHelp(): void {
    this.feedbackState.set('help');
  }
}
