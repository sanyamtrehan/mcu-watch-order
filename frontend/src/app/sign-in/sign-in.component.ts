import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CookieTokenService } from '../services/cookie-token.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit {
  isSignIn: boolean = true;
  registerForm!: FormGroup;
  signInForm!: FormGroup;
  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly cookieService: CookieTokenService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    const formData = {
      username: [null, [Validators.required]],
      password: [null, [Validators.required]],
    };
    this.registerForm = this.fb.group({
      ...formData,
      email: [
        null,
        [
          Validators.required,
          Validators.pattern(
            /^[a-zA-Z0-9.&'_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,12}$/
          ),
        ],
      ],
    });
    this.signInForm = this.fb.group(formData);
  }

  login() {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    this.authService.login(this.signInForm.value).subscribe(
      (res) => {
        alert(res.message);
        const { accessToken, expiresIn } = res.data.token;
        this.cookieService.setToken(accessToken, expiresIn);
        this.router.navigate(['/main']);
      },
      (err) => {
        alert(err);
      }
    );
  }

  register() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.authService.register(this.registerForm.value).subscribe(
      (res) => {
        alert(res.message);
      },
      (err) => {
        alert(err);
      }
    );
  }
}
