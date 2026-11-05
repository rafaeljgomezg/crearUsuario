// Gestiona la selección de plan y el envío de la solicitud de pago, incluidos sus estados.
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { timeout } from 'rxjs';

type Plan = 'CORPORATE';
type Periodo = 'mensual' | 'semestral' | 'anual';
type Metodo = 'Binance Pay' | 'Zinli';

interface CheckoutPayload {
  UserID: string;
  nombre: string;
  plan: Plan;
  periodo: Periodo;
  metodo: Metodo;
}

const PLAN_PRICES: Record<Plan, Record<Periodo, number>> = {
  CORPORATE: {
    mensual: 10,
    semestral: 42,
    anual: 60,
  },
};

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
  private readonly webhookUrl ='https://198-46-233-201.sslip.io/webhook/pago-exitoso';

  // Configuración de Supabase para consultar el nombre del usuario cuando no viene por query parameter
  private readonly supabaseUrl = 'https://vwcmgzmlfeowxmnphzdm.supabase.co';
  private readonly supabaseAnonKey = 'sb_publishable_y3h4LsnTqIclad_E6_7apQ_i2OE6v2x';

  readonly copyrightYear = new Date().getFullYear();
  readonly headerImageUrl =
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1920&h=520&q=80';
  readonly paymentEmail = 'rafaeljgomezg@gmail.com';

  userId = '';
  nombre = '';
  selectedPlan: Plan = 'CORPORATE';
  selectedPeriodo: Periodo | '' = '';
  selectedMetodo: Metodo | '' = '';
  isLoading = false;
  isSubmitted = false;
  isSubmissionUnconfirmed = false;
  errorMessage = '';

  get selectedPrice(): number | null {
    if (!this.selectedPlan || !this.selectedPeriodo) {
      return null;
    }

    return PLAN_PRICES[this.selectedPlan][this.selectedPeriodo];
  }

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    this.userId =
      queryParams.get('userId')?.trim() ?? queryParams.get('id')?.trim() ?? '';
    this.nombre = queryParams.get('nombre')?.trim() ?? '';

    // Si no viene el nombre por query parameter, consultarlo desde Supabase
    if (this.userId && !this.nombre) {
      this.obtenerNombreDesdeSupabase(this.userId);
    }

    // Solo existe un plan (CORPORATE) con acceso completo.
    this.selectedPlan = 'CORPORATE';
  }

  /**
   * Consulta el nombre del usuario en Supabase usando su ID.
   * Si falla, se deja nombre vacío y el campo mostrará el userId como respaldo.
   */
  private obtenerNombreDesdeSupabase(userId: string): void {
    const url = `${this.supabaseUrl}/rest/v1/usuarios?id=eq.${userId}&select=nombre`;

    this.http
      .get<{ nombre: string }[]>(url, {
        headers: {
          apikey: this.supabaseAnonKey,
          Authorization: `Bearer ${this.supabaseAnonKey}`,
        },
      })
      .subscribe({
        next: (response) => {
          if (response.length > 0 && response[0].nombre) {
            this.nombre = response[0].nombre.trim();
            this.changeDetector.markForCheck();
          }
        },
        error: () => {
          // Si falla la consulta, nombre queda vacío y se mostrará el userId como respaldo
          console.warn('No se pudo obtener el nombre desde Supabase.');
        },
      });
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
      nombre: this.nombre,
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
