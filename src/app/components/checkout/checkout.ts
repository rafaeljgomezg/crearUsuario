import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { timeout } from 'rxjs';

type Plan = 'STANDARD' | 'CORPORATE';
type Periodo = 'mensual' | 'trimestral' | 'semestral' | 'anual';
type Metodo = 'Binance Pay' | 'Zinli';

interface CheckoutPayload {
  UserID: string;
  plan: Plan;
  periodo: Periodo;
  metodo: Metodo;
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
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly webhookUrl =
    'https://somewhat-jones-marion-guru.trycloudflare.com/webhook/pago-exitoso';

  readonly copyrightYear = new Date().getFullYear();
  readonly headerImageUrl =
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1920&h=520&q=80';

  userId = '';
  selectedPlan: Plan | '' = '';
  selectedPeriodo: Periodo | '' = '';
  selectedMetodo: Metodo | '' = '';
  isLoading = false;
  isSubmitted = false;
  isSubmissionUnconfirmed = false;
  errorMessage = '';

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParamMap.get('userId')?.trim() ?? '';
  }

  onSubmit(form: NgForm): void {
    if (this.isLoading) {
      return;
    }

    if (
      !this.userId ||
      form.invalid ||
      !this.selectedPlan ||
      !this.selectedPeriodo ||
      !this.selectedMetodo
    ) {
      form.control.markAllAsTouched();
      return;
    }

    const payload: CheckoutPayload = {
      UserID: this.userId,
      plan: this.selectedPlan,
      periodo: this.selectedPeriodo,
      metodo: this.selectedMetodo,
    };

    this.isLoading = true;
    this.isSubmitted = false;
    this.isSubmissionUnconfirmed = false;
    this.errorMessage = '';

    this.http
      .post(this.webhookUrl, payload, { responseType: 'text' })
      .pipe(timeout({ first: 30_000 }))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          const errorMessage = this.getResponseErrorMessage(response);
          if (errorMessage) {
            this.errorMessage = errorMessage;
          } else {
            this.isSubmitted = true;
          }
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          console.error('Error al enviar la selección del checkout:', error);
          this.isLoading = false;
          this.isSubmissionUnconfirmed = true;
          this.changeDetector.markForCheck();
        },
      });
  }

  private getResponseErrorMessage(response: string): string | null {
    if (!response.trim()) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(response);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'status' in parsed &&
        parsed.status === 'error'
      ) {
        return 'message' in parsed && typeof parsed.message === 'string'
          ? parsed.message
          : 'No se pudo procesar la selección.';
      }
    } catch {
      // El webhook puede responder con texto plano; solo se interpretan como error los JSON de error.
    }

    return null;
  }
}
