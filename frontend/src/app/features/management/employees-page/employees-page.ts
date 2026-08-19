import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-employees-page',
  standalone: true,
  imports: [],
  templateUrl: './employees-page.html',
  styleUrl: './employees-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeesPage {}
