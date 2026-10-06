import { Routes } from '@angular/router';
import { Main } from './layout/main/main';
import { Login } from './public/login/login';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'dashboard',
        component: Main
    }
];
