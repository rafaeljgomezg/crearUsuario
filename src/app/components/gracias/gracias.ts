import { Component } from '@angular/core';

// Pantalla independiente mostrada después de que el registro termina correctamente.
@Component({
  selector: 'app-gracias',
  styleUrl: 'gracias.scss',
  templateUrl: './gracias.html',
})
export class Gracias {
  // Valores de presentación usados por la plantilla de confirmación.
  readonly copyrightYear = new Date().getFullYear();
  readonly headerImageUrl =
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1920&h=520&q=80';
}
