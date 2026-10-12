import { Component, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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

interface Usuario {
  nombre: string;
  email: string;
  paisTelefono: CountryCode;
  telefono: string;
}

interface PhoneCountryOption {
  code: CountryCode;
  name: string;
  callingCode: string;
}

@Component({
  imports: [FormField],
  selector: 'app-cargausuario-form',
  styleUrl: './cargausuario-form.scss',
  templateUrl: './cargausuario-form.html',
})
export class CargausuarioForm {

  constructor() {}

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  
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

  onSubmit() {
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

    const payload = {
      nombre: formValue.nombre.trim(),
      email: formValue.email.trim(),
      codigoPais: `+${getCountryCallingCode(formValue.paisTelefono)}`,
      telefono: phoneNumber.number, // Formato internacional limpio validado
    };

    // Reemplaza con la Production URL de tu nodo Webhook en n8n
    const webhookUrl = 'http://198.46.233.201:5678/webhook-test/38f259d1-00de-483e-b8c4-c1ca404b68fd';

    this.http.post(webhookUrl, payload).subscribe({
      next: (response) => {
        // Redirige a tu página de éxito o agradecimiento
        this.router.navigate(['/gracias']);
      },
      error: (error) => {
        console.error('Error al registrar usuario:', error);
        alert('Hubo un error al procesar el registro. Por favor, intenta de nuevo.');
      }
    });

  }

  getPhoneCallingCode(country: CountryCode): string {
    return getCountryCallingCode(country);
  }

  private createImageUrl(width: number, height: number): string {
    return `https://images.unsplash.com/photo-${this.selectedImageId}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
  }

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
