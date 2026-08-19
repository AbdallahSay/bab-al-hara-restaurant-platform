import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmployeesPage } from './employees-page';
import { provideHttpClient } from '@angular/common/http';
import { APP_ENVIRONMENT } from '../../../core/config/app-environment';
import { provideRouter } from '@angular/router';

describe('EmployeesPage', () => {
  let component: EmployeesPage;
  let fixture: ComponentFixture<EmployeesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeesPage],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: APP_ENVIRONMENT, useValue: { apiBaseUrl: '' } }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(EmployeesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
