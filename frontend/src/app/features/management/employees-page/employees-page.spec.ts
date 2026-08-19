import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmployeesPage } from './employees-page';
import { EmployeeApiService } from '../employee-api.service';
import { StaffSessionService } from '../../kitchen/staff-session.service';
import { APP_ENVIRONMENT } from '../../../core/config/app-environment';
import { EmployeeManagementDto } from '../employee.models';

const mockEmployees: EmployeeManagementDto[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    displayName: 'Admin User',
    email: 'admin@bab-al-hara.com',
    role: 'Admin',
    isActive: true,
    isCurrentUser: true,
    concurrencyToken: 'token1',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    displayName: 'Chef Ahmed',
    email: 'kitchen@bab-al-hara.com',
    role: 'Kitchen',
    isActive: true,
    isCurrentUser: false,
    concurrencyToken: 'token2',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    displayName: 'Driver Tarek',
    email: 'driver@bab-al-hara.com',
    role: 'Driver',
    isActive: false,
    isCurrentUser: false,
    concurrencyToken: 'token3',
  },
];

describe('EmployeesPage', () => {
  let component: EmployeesPage;
  let fixture: ComponentFixture<EmployeesPage>;
  let apiMock: {
    getEmployees: ReturnType<typeof vi.fn>;
  };
  let sessionMock: {
    signOutManagement: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    apiMock = {
      getEmployees: vi.fn().mockReturnValue(of(mockEmployees)),
    };
    sessionMock = {
      signOutManagement: vi.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [EmployeesPage],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: EmployeeApiService, useValue: apiMock },
        { provide: StaffSessionService, useValue: sessionMock },
        { provide: APP_ENVIRONMENT, useValue: { apiBaseUrl: '' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load employees on init', () => {
    expect(component).toBeTruthy();
    expect(apiMock.getEmployees).toHaveBeenCalled();
    expect(component.employees().length).toBe(3);
    expect(component.state()).toBe('ready');
  });

  it('should render page title, management header and employee table', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.page-title')?.textContent).toContain(
      component.copy().employees.title,
    );
    expect(compiled.querySelector('.employees-table')).toBeTruthy();
    expect(compiled.querySelectorAll('.employee-row').length).toBe(3);
  });

  it('should filter employees by search query', () => {
    component.searchQuery.set('Ahmed');
    fixture.detectChanges();
    const filtered = component.filteredEmployees();
    expect(filtered.length).toBe(1);
    expect(filtered[0]?.displayName).toBe('Chef Ahmed');
  });

  it('should filter employees by role', () => {
    component.setRoleFilter('Driver');
    fixture.detectChanges();
    const filtered = component.filteredEmployees();
    expect(filtered.length).toBe(1);
    expect(filtered[0]?.role).toBe('Driver');
  });

  it('should filter employees by status', () => {
    component.setStatusFilter('Disabled');
    fixture.detectChanges();
    const filtered = component.filteredEmployees();
    expect(filtered.length).toBe(1);
    expect(filtered[0]?.isActive).toBe(false);
  });

  it('should clear all filters on clearFilters()', () => {
    component.searchQuery.set('Ahmed');
    component.setRoleFilter('Kitchen');
    component.setStatusFilter('Active');
    expect(component.filteredEmployees().length).toBe(1);

    component.clearFilters();
    expect(component.searchQuery()).toBe('');
    expect(component.roleFilter()).toBe('All');
    expect(component.statusFilter()).toBe('All');
    expect(component.filteredEmployees().length).toBe(3);
  });

  it('should open and close create/edit drawer', () => {
    component.openCreateDrawer();
    expect(component.isDrawerOpen()).toBe(true);
    expect(component.drawerMode()).toBe('create');

    const targetEmp = mockEmployees[0]!;
    component.openEditDrawer(targetEmp);
    expect(component.isDrawerOpen()).toBe(true);
    expect(component.drawerMode()).toBe('edit');
    expect(component.selectedEmployee()?.id).toBe(targetEmp.id);

    component.closeDrawer();
    expect(component.isDrawerOpen()).toBe(false);
  });
});
