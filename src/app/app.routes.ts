import { Routes } from '@angular/router';

export const routes: Routes = [
     {
        path:"cargausuario-form", loadComponent: ()=> import('./components/cargausuario-form/cargausuario-form').then(m => m.CargausuarioForm)
    },
    {
        path: 'gracias',
        loadComponent: () => import('./components/gracias/gracias').then(m => m.Gracias),
    },
];
