import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ManagementApiService } from '../management-api.service';
import { RestaurantControlDto } from '../management.models';
import { RestaurantStatusCardComponent } from './restaurant-status-card.component';

const MOCK_STATUS: RestaurantControlDto = {
  acceptingOrders: true,
  pauseMessageAr: 'مغلق مؤقتاً',
  pauseMessageEn: 'Temporarily closed',
  updatedAtUtc: '2026-08-17T12:00:00Z',
  updatedByStaffDisplayName: 'Manager 1',
  rowVersion: 'AAAAAAAAB98=',
};

describe('RestaurantStatusCardComponent', () => {
  let component: RestaurantStatusCardComponent;
  let fixture: ComponentFixture<RestaurantStatusCardComponent>;
  let apiMock: {
    getRestaurantControlStatus: ReturnType<typeof vi.fn>;
    updateRestaurantControlStatus: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    apiMock = {
      getRestaurantControlStatus: vi.fn().mockReturnValue(of(MOCK_STATUS)),
      updateRestaurantControlStatus: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RestaurantStatusCardComponent],
      providers: [{ provide: ManagementApiService, useValue: apiMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(RestaurantStatusCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load and render current operational status', () => {
    expect(apiMock.getRestaurantControlStatus).toHaveBeenCalled();
    expect(component['currentStatus']()).toEqual(MOCK_STATUS);
    expect(component['form'].controls.acceptingOrders.value).toBe(true);
    expect(component['form'].controls.pauseMessageAr.value).toBe('مغلق مؤقتاً');
  });

  it('should update operational status successfully', () => {
    const updatedStatus: RestaurantControlDto = {
      ...MOCK_STATUS,
      acceptingOrders: false,
      rowVersion: 'AAAAAAAAB99=',
    };
    apiMock.updateRestaurantControlStatus.mockReturnValue(of(updatedStatus));

    component['form'].patchValue({
      acceptingOrders: false,
      pauseMessageAr: 'نعتذر عن عدم استقبال طلبات',
    });

    component.save();

    expect(apiMock.updateRestaurantControlStatus).toHaveBeenCalledWith({
      acceptingOrders: false,
      pauseMessageAr: 'نعتذر عن عدم استقبال طلبات',
      pauseMessageEn: 'Temporarily closed',
      rowVersion: 'AAAAAAAAB98=',
    });
    expect(component['currentStatus']()?.rowVersion).toBe('AAAAAAAAB99=');
    expect(component['successMessage']()).toBeTruthy();
  });

  it('should handle concurrency conflict error (409)', () => {
    apiMock.updateRestaurantControlStatus.mockReturnValue(throwError(() => ({ status: 409 })));

    component.save();

    expect(component['error']()).toBeTruthy();
    expect(component['saving']()).toBe(false);
  });
});
