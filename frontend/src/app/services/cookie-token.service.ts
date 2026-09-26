import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class CookieTokenService {
  constructor(private cookieService: CookieService) {}

  /**
   * sets token Id
   * @param token
   */
  setToken(token: string, expiresIn: string) {
    const now = new Date();
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000,
    };
    const expiryDate = match
      ? new Date(now.getTime() + Number(match[1]) * multipliers[match[2]])
      : new Date(now.getTime() + 3600000);

    this.cookieService.set('token', token, expiryDate, '/', '');
    this.cookieService.set('expiresIn', expiryDate.toISOString(), expiryDate, '/', '');
  }

  setTokenOnly(token: string) {
    this.cookieService.set('token', token, 100000, '/', '');
  }

  /**
   * gets token Id
   */
  getToken(): string {
    return this.cookieService.get('token');
  }

  /**
   * checks if token exist
   */
  tokenExist(): boolean {
    const token = this.cookieService.get('token');
    const tokenExpiry = this.cookieService.get('expiresIn');
    const expiryDate = new Date(tokenExpiry);

    if (!token || !tokenExpiry || Number.isNaN(expiryDate.getTime()) || new Date() >= expiryDate) {
      this.deleteToken();
      return false;
    }

    return true;
  }

  /***
   * delete token
   */
  deleteToken(): void {
    this.cookieService.delete('token', '/');
    this.cookieService.delete('expiresIn', '/');
  }

  /**
   * delete cookie
   * @param id
   */
  delete(id: string) {
    this.cookieService.delete(id, '/');
  }

  /**
   * sets cookie
   * @param cookieId
   * @param value
   */
  setCookie(cookieId: string, value: any) {
    // parsing value into string to ensure the value is'nt number or json object
    this.cookieService.set(cookieId, String(value), 100000, '/', '');
  }
}
