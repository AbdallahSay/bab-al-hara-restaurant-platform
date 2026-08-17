import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StaffSessionService } from '../../kitchen/staff-session.service';
import { ManagementSignInPage } from './management-sign-in-page';

describe('ManagementSignInPage', () => {
  let component: ManagementSignInPage;
  let fixture: ComponentFixture<ManagementSignInPage>;
  let sessionMock: {
    signIn: ReturnType<typeof vi.fn>;
    signInManagement: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(async () => {
    sessionMock = {
      signIn: vi.fn().mockReturnValue(of({ isAuthenticated: true, displayName: 'Manager' })),
      signInManagement: vi
        .fn()
        .mockReturnValue(of({ isAuthenticated: true, displayName: 'Manager' })),
    };

    await TestBed.configureTestingModule({
      imports: [ManagementSignInPage],
      providers: [provideRouter([]), { provide: StaffSessionService, useValue: sessionMock }],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockReturnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(ManagementSignInPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should validate form and call signIn with valid credentials', () => {
    component['form'].setValue({
      email: 'manager@babalhara.com',
      password: 'Password123!',
    });

    component.signIn();

    expect(sessionMock.signInManagement).toHaveBeenCalledWith(
      'manager@babalhara.com',
      'Password123!',
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/management');
  });

  it('should handle unauthorized error (401)', () => {
    sessionMock.signInManagement.mockReturnValue(throwError(() => ({ status: 401 })));

    component['form'].setValue({
      email: 'manager@babalhara.com',
      password: 'WrongPassword',
    });

    component.signIn();

    expect(component['error']()).toBeTruthy();
    expect(component['loading']()).toBe(false);
  });
});
