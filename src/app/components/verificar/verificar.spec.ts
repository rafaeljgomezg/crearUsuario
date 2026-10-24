// Pruebas de la pantalla de verificación y del comportamiento ante la falta de token.
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { Verificar } from './verificar';

describe('Verificar', () => {
  let component: Verificar;
  let fixture: ComponentFixture<Verificar>;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    router = { navigate: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [Verificar],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Verificar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows an error when the verification token is missing', () => {
    expect(component.cargando).toBe(false);
    expect(component.error).toBe(true);
    expect(component.mensajeError).toBe('No se encontró un token de verificación válido.');
  });
});
