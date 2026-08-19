export type EmployeeRole = 'Kitchen' | 'Cashier' | 'Driver' | 'Manager' | 'Admin';

export interface EmployeeManagementDto {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
  readonly role: EmployeeRole;
  readonly isActive: boolean;
  readonly isCurrentUser: boolean;
  readonly concurrencyToken: string;
}

export interface CreateEmployeeRequest {
  displayName: string;
  email: string;
  role: EmployeeRole;
  temporaryPassword: string;
}

export interface UpdateEmployeeRequest {
  displayName: string;
  role: EmployeeRole;
  concurrencyToken: string;
}

export interface SetEmployeeStatusRequest {
  isActive: boolean;
  concurrencyToken: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
  concurrencyToken: string;
}
