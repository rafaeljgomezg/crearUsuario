import { Routes } from '@angular/router';

// Las pantallas se cargan bajo demanda para separar sus recursos del paquete inicial.
export const routes: Routes = [
     {
        path:"cargausuario-form", loadComponent: ()=> import('./components/cargausuario-form/cargausuario-form').then(m => m.CargausuarioForm)
    },
    // El formulario navega aquí cuando el webhook confirma la creación del usuario.
    {
        path: 'gracias',
        loadComponent: () => import('./components/gracias/gracias').then(m => m.Gracias),
    },
];
