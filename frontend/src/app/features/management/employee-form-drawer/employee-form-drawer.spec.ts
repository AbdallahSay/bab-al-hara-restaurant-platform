import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmployeeFormDrawer } from './employee-form-drawer';
import { provideHttpClient } from '@angular/common/http';
import { APP_ENVIRONMENT } from '../../../core/config/app-environment';

describe('EmployeeFormDrawer', () => {
  let component: EmployeeFormDrawer;
  let fixture: ComponentFixture<EmployeeFormDrawer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeFormDrawer],
      providers: [provideHttpClient(), { provide: APP_ENVIRONMENT, useValue: { apiBaseUrl: '' } }],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeFormDrawer);
    component = fixture.componentInstance;
    component.mode = 'create';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
