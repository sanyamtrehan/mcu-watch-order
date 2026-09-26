import { Component, OnInit } from '@angular/core';
import { CookieTokenService } from './services/cookie-token.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'frontend';
  constructor(public readonly cookieTokenService: CookieTokenService) {}
}
