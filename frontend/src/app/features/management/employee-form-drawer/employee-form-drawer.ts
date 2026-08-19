import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-employee-form-drawer',
  standalone: true,
  imports: [],
  templateUrl: './employee-form-drawer.html',
  styleUrl: './employee-form-drawer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeFormDrawer {}
