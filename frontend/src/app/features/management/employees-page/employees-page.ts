import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { EmployeeApiService } from '../employee-api.service';
import { StaffSessionService } from '../../kitchen/staff-session.service';
import { LanguageService } from '../../../core/i18n/language.service';
import { EmployeeManagementDto, EmployeeRole } from '../employee.models';
import { EmployeeFormDrawer } from '../employee-form-drawer/employee-form-drawer';

type ViewState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-employees-page',
  standalone: true,
  imports: [CommonModule, RouterModule, EmployeeFormDrawer, FormsModule],
  templateUrl: './employees-page.html',
  styleUrl: './employees-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeesPage implements OnInit {
  private readonly employeeApi = inject(EmployeeApiService);
  private readonly session = inject(StaffSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly language = inject(LanguageService);

  readonly copy = this.language.copy;
  readonly state = signal<ViewState>('loading');
  readonly employees = signal<EmployeeManagementDto[]>([]);

  readonly searchQuery = signal('');
  readonly roleFilter = signal<EmployeeRole | 'All'>('All');
  readonly statusFilter = signal<'All' | 'Active' | 'Disabled'>('All');

  readonly isDrawerOpen = signal(false);
  readonly drawerMode = signal<'create' | 'edit'>('create');
  readonly selectedEmployee = signal<EmployeeManagementDto | undefined>(undefined);

  readonly totalCount = computed(() => this.employees().length);
  readonly activeCount = computed(() => this.employees().filter((e) => e.isActive).length);
  readonly disabledCount = computed(() => this.employees().filter((e) => !e.isActive).length);

  readonly filteredEmployees = computed(() => {
    let list = this.employees();

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      list = list.filter(
        (e) => e.displayName.toLowerCase().includes(query) || e.email.toLowerCase().includes(query),
      );
    }

    const role = this.roleFilter();
    if (role !== 'All') {
      list = list.filter((e) => e.role === role);
    }

    const status = this.statusFilter();
    if (status !== 'All') {
      const isActive = status === 'Active';
      list = list.filter((e) => e.isActive === isActive);
    }

    return list;
  });

  readonly filteredCount = computed(() => this.filteredEmployees().length);

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.state.set('loading');
    this.employeeApi.getEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.state.set('ready');
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          void this.router.navigate(['/management/sign-in']);
        } else {
          this.state.set('error');
        }
      },
    });
  }

  setRoleFilter(role: EmployeeRole | 'All'): void {
    this.roleFilter.set(role);
  }

  setStatusFilter(status: 'All' | 'Active' | 'Disabled'): void {
    this.statusFilter.set(status);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.roleFilter.set('All');
    this.statusFilter.set('All');
  }

  openCreateDrawer(): void {
    this.drawerMode.set('create');
    this.selectedEmployee.set(undefined);
    this.isDrawerOpen.set(true);
  }

  openEditDrawer(employee: EmployeeManagementDto): void {
    this.drawerMode.set('edit');
    this.selectedEmployee.set(employee);
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  onDrawerSaved(): void {
    this.closeDrawer();
    this.loadEmployees();
  }

  setLanguage(lang: 'ar' | 'en'): void {
    this.language.setLanguage(lang);
  }

  signOut(): void {
    this.session
      .signOutManagement()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => void this.router.navigate(['/management/sign-in']),
        error: () => void this.router.navigate(['/management/sign-in']),
      });
  }
}
