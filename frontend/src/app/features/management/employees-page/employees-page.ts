import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { EmployeeApiService } from '../employee-api.service';
import { LanguageService } from '../../../core/i18n/language.service';
import { EmployeeManagementDto, EmployeeRole } from '../employee.models';
import { EmployeeFormDrawer } from '../employee-form-drawer/employee-form-drawer';
import { FormsModule } from '@angular/forms';

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
  readonly language = inject(LanguageService);
  private readonly router = inject(Router);

  readonly copy = this.language.copy;
  readonly state = signal<ViewState>('loading');
  readonly employees = signal<EmployeeManagementDto[]>([]);

  readonly searchQuery = signal('');
  readonly roleFilter = signal<EmployeeRole | 'All'>('All');
  readonly statusFilter = signal<'All' | 'Active' | 'Disabled'>('All');

  readonly isDrawerOpen = signal(false);
  readonly drawerMode = signal<'create' | 'edit'>('create');
  readonly selectedEmployee = signal<EmployeeManagementDto | undefined>(undefined);

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

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.state.set('loading');
    this.employeeApi.getEmployees().subscribe({
      next: (data) => {
        this.employees.set(data);
        this.state.set('ready');
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/management/sign-in']);
        } else {
          this.state.set('error');
        }
      },
    });
  }

  openCreateDrawer() {
    this.drawerMode.set('create');
    this.selectedEmployee.set(undefined);
    this.isDrawerOpen.set(true);
  }

  openEditDrawer(employee: EmployeeManagementDto) {
    this.drawerMode.set('edit');
    this.selectedEmployee.set(employee);
    this.isDrawerOpen.set(true);
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
  }

  onDrawerSaved() {
    this.closeDrawer();
    this.loadEmployees();
  }
}
