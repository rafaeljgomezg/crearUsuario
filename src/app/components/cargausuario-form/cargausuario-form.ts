// Lógica del alta de usuarios: valida datos y teléfono antes de enviarlos al servicio de registro.
import { Component, computed, signal, inject, ViewChild } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgxTurnstileComponent } from 'ngx-turnstile';
import {
  email,
  form,
  FormField,
  maxLength,
  minLength,
  pattern,
  required,
  validate,
} from '@angular/forms/signals';
import {
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';
import phoneExamples from 'libphonenumber-js/examples.mobile.json';

// Modelo que mantiene los datos del formulario y el país usado para validar el teléfono.
interface Usuario {
  nombre: string;
  email: string;
  paisTelefono: CountryCode;
  telefono: string;
}

// Datos de presentación para cada opción del selector internacional de país.
interface PhoneCountryOption {
  code: CountryCode;
  name: string;
  callingCode: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Component({
  imports: [FormField, NgxTurnstileComponent],
  selector: 'app-cargausuario-form',
  styleUrl: './cargausuario-form.scss',
  templateUrl: './cargausuario-form.html',
})
export class CargausuarioForm {
  // Servicios inyectados para enviar el registro y navegar tras una respuesta exitosa.
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  @ViewChild(NgxTurnstileComponent) private turnstileWidget?: NgxTurnstileComponent;

  readonly turnstileSiteKey = '0x4AAAAAAFlfGOnqI4kYPFnP';
  turnstileToken: string | null = null;
  turnstileError = '';
  submitError = '';
  isSubmitting = false;
  
  // Variantes de imagen de oficina seleccionadas aleatoriamente para el encabezado.
  private readonly businessImageIds = [
    '1497366754035-f200968a6e72',
    '1497366216548-37526070297c',
    '1524758631624-e2822e304c36',
  ];
  private readonly selectedImageId =
    this.businessImageIds[Math.floor(Math.random() * this.businessImageIds.length)];
  readonly headerImageUrl = this.createImageUrl(1920, 520);
  readonly mobileHeaderImageUrl = this.createImageUrl(900, 600);
  readonly copyrightYear = new Date().getFullYear();
  // La librería proporciona países, prefijos y ejemplos telefónicos localizados.
  readonly phoneCountries = this.createPhoneCountryOptions();
  readonly phonePlaceholder = computed(() => {
    const example = getExampleNumber(this.usuarioModel().paisTelefono, phoneExamples);
    return example ? `Ej. ${example.formatNational()}` : 'Ingresa el número telefónico';
  });

  usuarioModel = signal<Usuario>({
    nombre: '',
    email: '',
    paisTelefono: 'VE',
    telefono: '',
  });

  // Reglas compartidas por la vista y la validación previa al envío.
  usuarioForm = form(this.usuarioModel, (path) => {
    required(path.nombre, { message: 'El nombre es obligatorio.' });
    minLength(path.nombre, 2, { message: 'El nombre debe tener al menos 2 caracteres.' });
    maxLength(path.nombre, 100, { message: 'El nombre no puede superar los 100 caracteres.' });
    pattern(path.nombre, /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u, {
      message: 'Ingresa un nombre válido; solo se permiten letras, espacios, apóstrofes y guiones.',
    });

    required(path.email, { message: 'El correo electrónico es obligatorio.' });
    email(path.email, { message: 'Ingresa un correo electrónico válido.' });
    maxLength(path.email, 254, { message: 'El correo no puede superar los 254 caracteres.' });

    required(path.telefono, { message: 'El teléfono es obligatorio.' });
    maxLength(path.telefono, 25, { message: 'El teléfono es demasiado largo.' });
    validate(path.telefono, ({ value, valueOf }) => {
      if (!value().trim()) {
        return;
      }

      const country = valueOf(path.paisTelefono);
      return isValidPhoneNumber(value(), country)
        ? undefined
        : { kind: 'phone', message: 'Ingresa un teléfono válido para el país seleccionado.' };
    });
  });

  onTurnstileResolved(token: string | null): void {
    this.turnstileToken = token;
    if (token) {
      this.turnstileError = '';
    }
  }

  // Valida y normaliza los datos antes de enviarlos al webhook de registro.
  onSubmit() {
    if (this.isSubmitting) {
      return;
    }

    const formState = this.usuarioForm();
    if (formState.invalid()) {
      formState.markAsTouched();
      return;
    }

    const formValue = this.usuarioModel();
    const phoneNumber = parsePhoneNumberFromString(formValue.telefono, formValue.paisTelefono);
    if (!phoneNumber?.isValid()) {
      formState.markAsTouched();
      return;
    }

    const turnstileToken = this.turnstileToken;
    if (!turnstileToken) {
      this.turnstileError = 'Completa la verificación de seguridad antes de continuar.';
      return;
    }

    const payload = {
      nombre: formValue.nombre.trim(),
      email: formValue.email.trim(),
      codigoPais: `+${getCountryCallingCode(formValue.paisTelefono)}`,
      telefono: phoneNumber.number, // Formato internacional limpio validado
      turnstileToken,
    };

    // Reemplaza con la Production URL de tu nodo Webhook en n8n
    const webhookUrl = 'https://198-46-233-201.sslip.io/webhook/crear-usuario';

    this.isSubmitting = true;
    this.submitError = '';
    this.http.post<unknown>(webhookUrl, payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (this.isAlreadyRegisteredResponse(response)) {
          this.navigateToRegistered();
          return;
        }

        if (isRecord(response) && response['status'] === 'error') {
          this.resetTurnstile();
          this.submitError = this.getResponseMessage(response);
          return;
        }
        // Si el registro es exitoso, navega a tu página de agradecimiento
        this.router.navigate(['/gracias']);
      },
      error: (error: unknown) => {
        if (
          error instanceof HttpErrorResponse &&
          (error.status === 409 || this.isAlreadyRegisteredResponse(error.error))
        ) {
          this.isSubmitting = false;
          this.navigateToRegistered();
          return;
        }

        console.error('Error de conexión:', error);
        this.isSubmitting = false;
        this.resetTurnstile();
        this.submitError = this.getResponseMessage(
          error instanceof HttpErrorResponse ? error.error : null,
          'Hubo un error al procesar el registro. Por favor, intenta nuevamente.',
        );
      }
    });

  }

  private isAlreadyRegisteredResponse(response: unknown): boolean {
    if (!isRecord(response)) {
      return false;
    }

    return (
      response['status'] === 'exists' ||
      response['status'] === 'already_registered' ||
      response['code'] === 'USER_ALREADY_EXISTS'
    );
  }

  private getResponseMessage(
    response: unknown,
    fallback = 'No se pudo procesar el registro.',
  ): string {
    if (isRecord(response) && typeof response['message'] === 'string') {
      const message = response['message'].trim();
      if (message) {
        return message;
      }
    }

    return fallback;
  }

  private navigateToRegistered(): void {
    this.resetTurnstile();
    void this.router.navigate(['/registrado'], {
      queryParams: { email: this.usuarioModel().email.trim() },
    });
  }

  private resetTurnstile(): void {
    this.turnstileToken = null;
    this.turnstileWidget?.reset();
  }

  getPhoneCallingCode(country: CountryCode): string {
    return getCountryCallingCode(country);
  }

  // Construye una URL de Unsplash reutilizando la imagen elegida para ambos tamaños.
  private createImageUrl(width: number, height: number): string {
    return `https://images.unsplash.com/photo-${this.selectedImageId}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
  }

  // Genera las opciones del selector con nombres en español y su prefijo telefónico.
  private createPhoneCountryOptions(): PhoneCountryOption[] {
    const countryNames = new Intl.DisplayNames(['es'], { type: 'region' });
    return getCountries()
      .map((code) => ({
        code,
        name: countryNames.of(code) ?? code,
        callingCode: `+${getCountryCallingCode(code)}`,
      }))
      .sort((first, second) => first.name.localeCompare(second.name, 'es'));
  }

}
