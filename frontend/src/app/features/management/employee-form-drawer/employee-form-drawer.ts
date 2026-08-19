import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { EmployeeApiService } from '../employee-api.service';
import { LanguageService } from '../../../core/i18n/language.service';
import { EmployeeManagementDto, EmployeeRole } from '../employee.models';

@Component({
  selector: 'app-employee-form-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './employee-form-drawer.html',
  styleUrl: './employee-form-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeFormDrawer {
  private readonly fb = inject(FormBuilder);
  private readonly employeeApi = inject(EmployeeApiService);
  readonly language = inject(LanguageService);

  @Input({ required: true }) mode!: 'create' | 'edit';
  @Input() employee?: EmployeeManagementDto;
  @Input() callerRole: string = 'Admin';
  
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  readonly copy = this.language.copy;
  
  readonly form = this.fb.group({
    displayName: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['' as EmployeeRole, [Validators.required]],
    temporaryPassword: ['']
  });

  readonly isSaving = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly passwordCopied = signal(false);
  
  readonly availableRoles = computed(() => {
    if (this.callerRole === 'Admin') return ['Kitchen', 'Cashier', 'Driver', 'Manager', 'Admin'];
    if (this.callerRole === 'Manager') return ['Kitchen', 'Cashier', 'Driver'];
    return [];
  });

  ngOnInit() {
    if (this.mode === 'edit' && this.employee) {
      this.form.patchValue({
        displayName: this.employee.displayName,
        email: this.employee.email,
        role: this.employee.role,
      });
      this.form.get('email')?.disable();
      this.form.get('temporaryPassword')?.clearValidators();
    } else {
      this.form.get('temporaryPassword')?.setValidators([Validators.required]);
    }
    this.form.get('temporaryPassword')?.updateValueAndValidity();
  }

  generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    const randomArray = new Uint32Array(16);
    crypto.getRandomValues(randomArray);
    let pass = '';
    for (let i = 0; i < 16; i++) {
      pass += chars[randomArray[i]! % chars.length];
    }
    this.form.patchValue({ temporaryPassword: pass });
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  async copyPassword() {
    const pass = this.form.get('temporaryPassword')?.value;
    if (pass) {
      await navigator.clipboard.writeText(pass);
      this.passwordCopied.set(true);
      setTimeout(() => this.passwordCopied.set(false), 2000);
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    this.errorMsg.set(null);

    const val = this.form.getRawValue();
    
    if (this.mode === 'create') {
      this.employeeApi.createEmployee({
        displayName: val.displayName!,
        email: val.email!,
        role: val.role as EmployeeRole,
        temporaryPassword: val.temporaryPassword!
      }).subscribe({
        next: () => this.onSuccess(),
        error: (err) => this.handleError(err)
      });
    } else if (this.employee) {
      this.employeeApi.updateEmployee(this.employee.id, {
        displayName: val.displayName!,
        role: val.role as EmployeeRole,
        concurrencyToken: this.employee.concurrencyToken
      }).subscribe({
        next: () => this.onSuccess(),
        error: (err) => this.handleError(err)
      });
    }
  }

  onSuccess() {
    this.isSaving.set(false);
    this.form.reset();
    this.saved.emit();
  }

  handleError(err: any) {
    this.isSaving.set(false);
    if (err.status === 409) {
      this.errorMsg.set(this.copy().employees.conflictError);
    } else if (err.status === 422) {
      this.errorMsg.set(this.copy().employees.validationError);
    } else {
      this.errorMsg.set(this.copy().employees.errorBody);
    }
  }
}

