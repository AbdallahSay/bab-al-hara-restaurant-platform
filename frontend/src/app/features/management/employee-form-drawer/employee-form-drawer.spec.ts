import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmployeeFormDrawer } from './employee-form-drawer';

describe('EmployeeFormDrawer', () => {
  let component: EmployeeFormDrawer;
  let fixture: ComponentFixture<EmployeeFormDrawer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeFormDrawer]
    }).compileComponents();
    
    fixture = TestBed.createComponent(EmployeeFormDrawer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
