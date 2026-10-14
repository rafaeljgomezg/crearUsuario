import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  imports: [],
  selector: 'app-verificar',
  styleUrl: './verificar.scss',
  templateUrl: './verificar.html',
})
export class Verificar implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  cargando = true;
  exito = false;
  error = false;
  mensajeError = '';

ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (!token) {
        this.cargando = false;
        this.error = true;
        this.mensajeError = 'No se encontró un token de verificación válido.';
        return;
      }

      this.verificarTokenEnN8n(token);
    });
  }


verificarTokenEnN8n(token: string) {
    const webhookUrl = `https://somewhat-jones-marion-guru.trycloudflare.com/webhook/verificar?token=${token}`;

    this.http.get(webhookUrl).subscribe({
      next: (response: any) => {
        this.cargando = false;
        this.exito = true;
        // Espera 1.5 segundos y redirige a la selección de sectores pasando el token
        setTimeout(() => {
          this.router.navigate(['/preferencias'], { queryParams: { token: response.access_token } });
        }, 1500);
      },
      error: (err) => {
        this.cargando = false;
        this.error = true;
        this.mensajeError = 'El enlace ha expirado o ya fue utilizado.';
      }
    });
}
}
