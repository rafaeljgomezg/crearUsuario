// Mapa de rutas de la aplicación; carga cada pantalla bajo demanda y define el fallback 404.
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

    {
        path: 'registrado',
        loadComponent: () => import('./components/registrado/registrado').then(m => m.Registrado),
    },

    {
        path: 'verificar',
        loadComponent: () => import('./components/verificar/verificar').then(m => m.Verificar),
    },

    {
        path: 'preferencias',
        loadComponent: () => import('./components/preferencias/preferencias').then(m => m.Preferencias),
    },

    {
        path: 'checkout',
        loadComponent: () => import('./components/checkout/checkout').then(m => m.Checkout),
    },

    {
        path: '**',
        loadComponent: () => import('./components/no-existe/no-existe').then(m => m.NoExiste),
    }
];
