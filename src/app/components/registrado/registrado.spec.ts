// Pruebas del aviso de cuenta existente con y sin correo en los parámetros de ruta.
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Registrado } from './registrado';

describe('Registrado', () => {
  let component: Registrado;
  let fixture: ComponentFixture<Registrado>;

  async function createComponent(email: string | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [Registrado],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(email ? { email } : {}) },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Registrado);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('displays the already registered message and email from the query parameter', async () => {
    await createComponent('persona@example.com');

    expect(fixture.nativeElement.textContent).toContain('El usuario ya está registrado');
    expect(fixture.nativeElement.textContent).toContain('persona@example.com');
    expect(component.email).toBe('persona@example.com');
  });

  it('displays a general message when the email parameter is missing', async () => {
    await createComponent(null);

    expect(fixture.nativeElement.textContent).toContain('El usuario ya está registrado');
    expect(fixture.nativeElement.textContent).toContain(
      'Este usuario ya tiene una cuenta registrada.',
    );
  });
});
