import { Component } from '@angular/core';

@Component({
  selector: 'app-gracias',
  templateUrl: './gracias.html',
})
export class Gracias {
  readonly copyrightYear = new Date().getFullYear();
  readonly headerImageUrl =
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1920&h=520&q=80';
}
