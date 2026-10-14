import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component,  OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-preferencias',
  styleUrl: './preferencias.scss',
  templateUrl: './preferencias.html',
})
export class Preferencias implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  private readonly baseUrl = 'https://somewhat-jones-marion-guru.trycloudflare.com/webhook';

  token: string = '';
  cargando = true;
  guardando = false;
  error = false;
  mensajeError = '';
  exitoGuardado = false;

  usuarioNombre = '';
  usuarioEmail = '';
  esStandard = false;
  
  sectoresDisponibles: string[] = [];
  sectoresSeleccionadosMap: { [key: string]: boolean } = {};

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.cargando = false;
        this.error = true;
        this.mensajeError = 'Acceso no válido. No se proporcionó un token de identificación.';
        return;
      }

      this.cargarPreferencias();
    });
  }

  cargarPreferencias() {
    const url = `${this.baseUrl}/preferencias?token=${this.token}`;

    this.http.get<any>(url).subscribe({
      next: (data) => {
        this.usuarioNombre = data.usuario.nombre;
        this.usuarioEmail = data.usuario.email;
        this.esStandard = data.esStandard;
        this.sectoresDisponibles = data.sectoresDisponibles || [];

        const guardadosSet = new Set(data.usuario.sectoresGuardados || []);
        this.sectoresDisponibles.forEach(sector => {
          this.sectoresSeleccionadosMap[sector] = guardadosSet.has(sector);
        });

        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = true;
        this.mensajeError = 'No se pudo verificar el usuario o el enlace ha expirado.';
      }
    });
  }

  // Valida el límite de 2 sectores si el usuario es Plan Standard
  onSectorChange(sector: string) {
    if (this.esStandard) {
      const seleccionados = Object.keys(this.sectoresSeleccionadosMap)
        .filter(s => this.sectoresSeleccionadosMap[s]);
      
      if (seleccionados.length > 2) {
        this.sectoresSeleccionadosMap[sector] = false;
        alert('Plan Estándar: Puedes seleccionar un máximo de 2 sectores.');
      }
    }
  }

  guardarPreferencias() {
    this.guardando = true;
    this.exitoGuardado = false;

    const sectoresSeleccionados = Object.keys(this.sectoresSeleccionadosMap)
      .filter(sector => this.sectoresSeleccionadosMap[sector]);

    const payload = {
      token: this.token,
      sectores: sectoresSeleccionados
    };

    this.http.post(`${this.baseUrl}/preferencias-salvar`, payload).subscribe({
      next: (res: any) => {
        this.guardando = false;
        this.exitoGuardado = true;
        setTimeout(() => this.exitoGuardado = false, 4000);
      },
      error: (err) => {
        this.guardando = false;
        alert('Ocurrió un error al intentar guardar tus preferencias.');
      }
    });
  }
}
