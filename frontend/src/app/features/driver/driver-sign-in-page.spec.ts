import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { StaffSessionService } from '../kitchen/staff-session.service';
import { DriverSignInPage } from './driver-sign-in-page';

describe('DriverSignInPage', () => {
  let fixture: ComponentFixture<DriverSignInPage>;
  let sessionServiceSpy: {
    signIn: ReturnType<typeof vi.fn>;
  };

  async function setup(queryParams: Record<string, string> = {}) {
    sessionServiceSpy = {
      signIn: vi.fn().mockReturnValue(of({ isAuthenticated: true })),
    };

    await TestBed.configureTestingModule({
      imports: [DriverSignInPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParams },
          },
        },
        {
          provide: StaffSessionService,
          useValue: sessionServiceSpy,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverSignInPage);
    fixture.detectChanges();
  }

  it('renders driver sign-in form cleanly', async () => {
    await setup();
    expect(fixture.nativeElement.textContent).toContain('دخول السائقين');
    expect(fixture.nativeElement.querySelector('input[type="email"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('input[type="password"]')).toBeTruthy();
  });

  it('displays session expired warning banner when expired query parameter is present', async () => {
    await setup({ expired: '1' });
    const warning = fixture.nativeElement.querySelector('.sign-in-warning');
    expect(warning).toBeTruthy();
    expect(warning?.textContent).toContain('انتهت جلسة السائق. سجّل الدخول مرة أخرى للمتابعة');
  });

  it('shows error banner when sign in fails', async () => {
    await setup();
    sessionServiceSpy.signIn.mockReturnValue(throwError(() => new Error('Invalid credentials')));

    fixture.componentInstance['form'].controls.email.setValue('driver@test.local');
    fixture.componentInstance['form'].controls.password.setValue('WrongPassword123!');
    fixture.componentInstance['signIn']();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('.sign-in-error');
    expect(error).toBeTruthy();
  });
});
