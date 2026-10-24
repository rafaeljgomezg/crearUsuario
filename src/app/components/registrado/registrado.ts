// Recupera el correo de la ruta para contextualizar el aviso de usuario ya registrado.
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-registrado',
  templateUrl: './registrado.html',
})
export class Registrado implements OnInit {
  private readonly route = inject(ActivatedRoute);

  readonly copyrightYear = new Date().getFullYear();
  email = '';

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email')?.trim() ?? '';
  }
}
