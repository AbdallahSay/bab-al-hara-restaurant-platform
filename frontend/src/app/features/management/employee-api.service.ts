import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';

import { APP_ENVIRONMENT } from '../../core/config/app-environment';
import { CustomerApiService } from '../customer-ordering/customer-api.service';
import {
  CreateEmployeeRequest,
  EmployeeManagementDto,
  ResetPasswordRequest,
  SetEmployeeStatusRequest,
  UpdateEmployeeRequest,
} from './employee.models';

@Injectable({ providedIn: 'root' })
export class EmployeeApiService {
  private readonly http = inject(HttpClient);
  private readonly customerApi = inject(CustomerApiService);
  private readonly apiBaseUrl = inject(APP_ENVIRONMENT).apiBaseUrl;

  getEmployees(): Observable<EmployeeManagementDto[]> {
    return this.http.get<EmployeeManagementDto[]>(
      `${this.apiBaseUrl}/management/employees`,
      {
        withCredentials: true,
      },
    );
  }

  getEmployee(id: string): Observable<EmployeeManagementDto> {
    return this.http.get<EmployeeManagementDto>(
      `${this.apiBaseUrl}/management/employees/${encodeURIComponent(id)}`,
      {
        withCredentials: true,
      },
    );
  }

  createEmployee(request: CreateEmployeeRequest): Observable<EmployeeManagementDto> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<EmployeeManagementDto>(`${this.apiBaseUrl}/management/employees`, request, {
          headers: { 'X-XSRF-TOKEN': token },
          withCredentials: true,
        }),
      ),
    );
  }

  updateEmployee(id: string, request: UpdateEmployeeRequest): Observable<EmployeeManagementDto> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.put<EmployeeManagementDto>(
          `${this.apiBaseUrl}/management/employees/${encodeURIComponent(id)}`,
          request,
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
    );
  }

  setStatus(id: string, request: SetEmployeeStatusRequest): Observable<void> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.patch<void>(
          `${this.apiBaseUrl}/management/employees/${encodeURIComponent(id)}/status`,
          request,
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
    );
  }

  resetPassword(id: string, request: ResetPasswordRequest): Observable<void> {
    return this.customerApi.antiforgeryToken().pipe(
      switchMap((token) =>
        this.http.post<void>(
          `${this.apiBaseUrl}/management/employees/${encodeURIComponent(id)}/reset-password`,
          request,
          {
            headers: { 'X-XSRF-TOKEN': token },
            withCredentials: true,
          },
        ),
      ),
    );
  }
}
