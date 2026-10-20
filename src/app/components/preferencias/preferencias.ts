import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

interface PreferenciasResponse {
  usuario: {
    nombre: string;
    sectoresGuardados?: string[];
  };
  esStandard: boolean;
  sectoresDisponibles?: string[];
}

@Component({
  imports: [FormsModule],
  selector: 'app-preferencias',
  styleUrl: './preferencias.scss',
  templateUrl: './preferencias.html',
})
export class Preferencias implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://198-46-233-201.sslip.io//webhook';

  //private readonly baseUrl = '/api';

  token = '';
  cargando = true;
  guardando = false;
  error = false;
  mensajeError = '';
  mensajeGuardadoError = '';
  exitoGuardado = false;

  usuarioNombre = '';
  esStandard = false;
  sectoresDisponibles: string[] = [];
  sectoresSeleccionados = new Set<string>();

  ngOnInit(): void {
    // El token identifica la sesión y habilita la consulta de preferencias.
    console.log('1. OnInit ejecutándose');
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    console.log('2. Token obtenido:', this.token);

    if (!this.token) {
      console.log('3. Token vacío, bloqueando acceso');
      this.cargando = false;
      this.error = true;
      this.mensajeError = 'Acceso no válido. No se proporcionó un token de identificación.';
      return;
    }

    console.log('4. Llamando a cargarPreferencias');
    this.cargarPreferencias();
  }

  /** Recupera el perfil, el límite del plan y los sectores disponibles. */
  cargarPreferencias(): void {
    console.log('5. Iniciando petición HTTP GET a:', `${this.baseUrl}/preferencias`);
    this.http
      .get<PreferenciasResponse>(`${this.baseUrl}/preferencias`, {
        params: { token: this.token },
      })
      .subscribe({
        next: (data) => {
          this.usuarioNombre = data.usuario.nombre;
          this.esStandard = data.esStandard;
          this.sectoresDisponibles = data.sectoresDisponibles ?? [];
          this.sectoresSeleccionados = new Set(data.usuario.sectoresGuardados ?? []);
          this.cargando = false;
        },
        error: (err) => {
          console.error('6. Error en la petición HTTP GET:', err);
          this.cargando = false;
          this.error = true;
          this.mensajeError = 'No se pudo verificar el usuario o el enlace ha expirado.';
        },
      });
  }

  /** Actualiza la selección y aplica el máximo de dos sectores del plan estándar. */
  onSectorChange(sector: string, seleccionado: boolean): void {
    this.mensajeGuardadoError = '';
    this.exitoGuardado = false;

    if (seleccionado && this.esStandard && this.sectoresSeleccionados.size >= 2) {
      return;
    }

    const seleccionActualizada = new Set(this.sectoresSeleccionados);
    if (seleccionado) {
      seleccionActualizada.add(sector);
    } else {
      seleccionActualizada.delete(sector);
    }
    this.sectoresSeleccionados = seleccionActualizada;
  }

  /** Deshabilita opciones adicionales cuando el plan estándar llega a su límite. */
  estaSectorDeshabilitado(sector: string): boolean {
    return (
      this.esStandard &&
      this.sectoresSeleccionados.size >= 2 &&
      !this.sectoresSeleccionados.has(sector)
    );
  }

  /** Envía al servicio las preferencias seleccionadas para el token actual. */
  guardarPreferencias(): void {
    if (this.guardando) {
      return;
    }

    this.guardando = true;
    this.exitoGuardado = false;
    this.mensajeGuardadoError = '';

    this.http
      .post(`${this.baseUrl}/preferencias-salvar`, {
        token: this.token,
        sectores: [...this.sectoresSeleccionados],
      })
      .subscribe({
        next: () => {
          this.guardando = false;
          this.exitoGuardado = true;
          setTimeout(() => (this.exitoGuardado = false), 4000);
        },
        error: () => {
          this.guardando = false;
          this.mensajeGuardadoError = 'Ocurrió un error al intentar guardar tus preferencias.';
        },
      });
  }
}
