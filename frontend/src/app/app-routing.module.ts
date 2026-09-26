import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { TempComponent } from './main/temp/temp.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { AuthGuard } from './helper/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: SignInComponent,
  },
  {
    path: 'main',
    component: MainComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'temp',
    component: TempComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
