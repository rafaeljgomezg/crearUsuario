// Resolver que carga los datos del checkout antes de activar la ruta.
// Si el nombre no viene por query parameter, lo consulta desde Supabase.
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

export const checkoutResolver: ResolveFn<{ userId: string; nombre: string }> = (route) => {
  const http = inject(HttpClient);
  const queryParams = route.queryParamMap;

  const userId =
    queryParams.get('userId')?.trim() ?? queryParams.get('id')?.trim() ?? '';
  const nombreFromQuery = queryParams.get('nombre')?.trim() ?? '';

  // Si ya viene el nombre por query parameter, no necesitamos consultar a Supabase
  if (nombreFromQuery) {
    return { userId, nombre: nombreFromQuery };
  }

  // Si no hay userId, no hay nada que consultar
  if (!userId) {
    return { userId: '', nombre: '' };
  }

  // Consultar el nombre desde Supabase
  const supabaseUrl = 'https://vwcmgzmlfeowxmnphzdm.supabase.co';
  const supabaseAnonKey = 'sb_publishable_y3h4LsnTqIclad_E6_7apQ_i2OE6v2x';
  const url = `${supabaseUrl}/rest/v1/usuarios?id=eq.${userId}&select=nombre`;

  return http.get<{ nombre: string }[]>(url, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  }).pipe(
    map((response) => {
      const nombre = response.length > 0 && response[0].nombre
        ? response[0].nombre.trim()
        : '';
      return { userId, nombre };
    })
  );
};
