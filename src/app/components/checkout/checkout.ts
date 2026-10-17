import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

type Plan = 'STANDARD' | 'CORPORATE';
type Periodo = 'mensual' | 'trimestral' | 'semestral' | 'anual';
type Metodo = 'Binance Pay' | 'Zinli';

interface CheckoutPayload {
  UserID: string;
  plan: Plan;
  periodo: Periodo;
  metodo: Metodo;
}

interface CheckoutResponse {
  status?: string;
  message?: string;
}

@Component({
  imports: [FormsModule],
  selector: 'app-checkout',
  styleUrl: './checkout.scss',
  templateUrl: './checkout.html',
})
export class Checkout implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly webhookUrl =
    'https://somewhat-jones-marion-guru.trycloudflare.com/webhook/pago-exitoso';

  readonly copyrightYear = new Date().getFullYear();
  readonly headerImageUrl =
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1920&h=520&q=80';

  userId = '';
  plan: Plan | '' = '';
  periodo: Periodo | '' = '';
  metodo: Metodo | '' = '';
  enviando = false;
  enviado = false;
  mensajeError = '';

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParamMap.get('userId')?.trim() ?? '';
  }

  onSubmit(form: NgForm): void {
    if (this.enviando) {
      return;
    }

    if (!this.userId || form.invalid || !this.plan || !this.periodo || !this.metodo) {
      form.control.markAllAsTouched();
      return;
    }

    const payload: CheckoutPayload = {
      UserID: this.userId,
      plan: this.plan,
      periodo: this.periodo,
      metodo: this.metodo,
    };

    this.enviando = true;
    this.enviado = false;
    this.mensajeError = '';

    this.http.post<CheckoutResponse>(this.webhookUrl, payload).subscribe({
      next: (response) => {
        this.enviando = false;
        if (response?.status === 'error') {
          this.mensajeError = response.message || 'No se pudo procesar la selección.';
          return;
        }
        this.enviado = true;
      },
      error: (error: unknown) => {
        console.error('Error al enviar la selección del checkout:', error);
        this.enviando = false;
        this.mensajeError = 'Ocurrió un error al procesar tu selección. Inténtalo nuevamente.';
      },
    });
  }
}
