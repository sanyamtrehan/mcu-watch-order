import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieTokenService } from '../services/cookie-token.service';
import { Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(
    private cookieTokenService: CookieTokenService,
    private router: Router
  ) {}
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const isAuthRequest = /(^|\/)api\/v1\/auth\/(login|register)$/.test(request.url);

    if (this.cookieTokenService.tokenExist() && !isAuthRequest) {
      const requestToken = this.cookieTokenService.getToken();
      // add token in modified request
      const modifiedReq = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${requestToken}`),
      });
      return next.handle(modifiedReq).pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 401 || err.status === 403) {
            // auto logout if 401 response returned from api
            this.cookieTokenService.deleteToken();
            this.router.navigate(['']);
          }
          return throwError(err);
        })
      );
    }

    return next.handle(request);
  }
}
