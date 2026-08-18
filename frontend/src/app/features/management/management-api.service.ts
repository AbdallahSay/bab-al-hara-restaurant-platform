import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { CustomerApiService } from '../customer-ordering/customer-api.service';
import {
  CategoryManagementDto,
  CreateCategoryRequest,
  CreateMenuItemRequest,
  MenuItemManagementDto,
  OperationsCommandCenterResponse,
  RestaurantControlDto,
  ToggleActiveRequest,
  ToggleMenuItemAvailabilityRequest,
  UpdateCategoryRequest,
  UpdateMenuItemRequest,
  UpdateRestaurantControlRequest,
} from './management.models';

@Injectable({ providedIn: 'root' })
export class ManagementApiService {
  private readonly http = inject(HttpClient);
  private readonly customerApi = inject(CustomerApiService);
  private readonly apiBaseUrl = inject(APP_ENVIRONMENT).apiBaseUrl;

  getRestaurantControlStatus(): Observable<RestaurantControlDto> {
    return this.http.get<RestaurantControlDto>(`${this.apiBaseUrl}/management/restaurant/status`, {
      withCredentials: true,
    });
  }

  updateRestaurantControlStatus(
    request: UpdateRestaurantControlRequest,
  ): Observable<RestaurantControlDto> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.put<RestaurantControlDto>(
          `${this.apiBaseUrl}/management/restaurant/status`,
          request,
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
    );
  }

  getCategories(): Observable<readonly CategoryManagementDto[]> {
    return this.http.get<readonly CategoryManagementDto[]>(
      `${this.apiBaseUrl}/management/categories`,
      { withCredentials: true },
    );
  }

  getCategory(id: string): Observable<CategoryManagementDto> {
    return this.http.get<CategoryManagementDto>(
      `${this.apiBaseUrl}/management/categories/${encodeURIComponent(id)}`,
      { withCredentials: true },
    );
  }

  createCategory(request: CreateCategoryRequest): Observable<CategoryManagementDto> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<CategoryManagementDto>(`${this.apiBaseUrl}/management/categories`, request, {
          headers: { 'X-XSRF-TOKEN': token },
          withCredentials: true,
        }),
      ),
    );
  }

  updateCategory(id: string, request: UpdateCategoryRequest): Observable<CategoryManagementDto> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.put<CategoryManagementDto>(
          `${this.apiBaseUrl}/management/categories/${encodeURIComponent(id)}`,
          request,
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
    );
  }

  toggleCategoryStatus(
    id: string,
    request: ToggleActiveRequest,
  ): Observable<CategoryManagementDto> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.patch<CategoryManagementDto>(
          `${this.apiBaseUrl}/management/categories/${encodeURIComponent(id)}/status`,
          request,
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
    );
  }

  getMenuItems(categoryId?: string): Observable<readonly MenuItemManagementDto[]> {
    let params = new HttpParams();
    if (categoryId) {
      params = params.set('categoryId', categoryId);
    }
    return this.http.get<readonly MenuItemManagementDto[]>(
      `${this.apiBaseUrl}/management/menu-items`,
      {
        params,
        withCredentials: true,
      },
    );
  }

  getMenuItem(id: string): Observable<MenuItemManagementDto> {
    return this.http.get<MenuItemManagementDto>(
      `${this.apiBaseUrl}/management/menu-items/${encodeURIComponent(id)}`,
      { withCredentials: true },
    );
  }

  createMenuItem(request: CreateMenuItemRequest): Observable<MenuItemManagementDto> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<MenuItemManagementDto>(`${this.apiBaseUrl}/management/menu-items`, request, {
          headers: { 'X-XSRF-TOKEN': token },
          withCredentials: true,
        }),
      ),
    );
  }

  updateMenuItem(id: string, request: UpdateMenuItemRequest): Observable<MenuItemManagementDto> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.put<MenuItemManagementDto>(
          `${this.apiBaseUrl}/management/menu-items/${encodeURIComponent(id)}`,
          request,
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
    );
  }

  toggleMenuItemAvailability(
    id: string,
    request: ToggleMenuItemAvailabilityRequest,
  ): Observable<MenuItemManagementDto> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.patch<MenuItemManagementDto>(
          `${this.apiBaseUrl}/management/menu-items/${encodeURIComponent(id)}/availability`,
          request,
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
    );
  }

  toggleMenuItemStatus(
    id: string,
    request: ToggleActiveRequest,
  ): Observable<MenuItemManagementDto> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.patch<MenuItemManagementDto>(
          `${this.apiBaseUrl}/management/menu-items/${encodeURIComponent(id)}/status`,
          request,
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
    );
  }

  getOperationsSnapshot(): Observable<OperationsCommandCenterResponse> {
    return this.http.get<OperationsCommandCenterResponse>(
      `${this.apiBaseUrl}/management/operations`,
      { withCredentials: true },
    );
  }
}
