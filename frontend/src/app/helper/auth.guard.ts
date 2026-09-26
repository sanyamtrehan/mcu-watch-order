import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { CookieTokenService } from '../services/cookie-token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly cookieTokenService: CookieTokenService,
    private readonly router: Router
  ) {}

  canActivate(
    _route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    if (this.cookieTokenService.tokenExist()) {
      return true;
    }

    return this.router.createUrlTree(['/'], {
      queryParams: { returnUrl: state.url },
    });
  }
}
