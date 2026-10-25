// Pruebas del formulario de alta, sus validaciones y el selector internacional de teléfono.
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { CargausuarioForm } from './cargausuario-form';

describe('CargausuarioForm', () => {
  let component: CargausuarioForm;
  let fixture: ComponentFixture<CargausuarioForm>;
  let httpTestingController: HttpTestingController;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    router = { navigate: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [CargausuarioForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CargausuarioForm);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => httpTestingController.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('defaults the phone country to Venezuela and requires every field', () => {
    expect(component.usuarioModel().paisTelefono).toBe('VE');
    expect(component.getPhoneCallingCode(component.usuarioModel().paisTelefono)).toBe('58');
    expect(component.phonePlaceholder()).toContain('412');
    expect(component.usuarioForm().invalid()).toBe(true);
  });

  it('updates the phone placeholder when the selected country changes', () => {
    component.usuarioModel.update((usuario) => ({ ...usuario, paisTelefono: 'US' }));

    expect(component.phonePlaceholder()).toContain('201');
    expect(component.phonePlaceholder()).not.toBe('Ej. 412 123 4567');
  });

  it('accepts valid phone numbers for the selected country', () => {
    component.usuarioModel.set({
      nombre: 'María Pérez',
      email: 'maria@example.com',
      paisTelefono: 'US',
      telefono: '2025550123',
    });

    expect(component.usuarioForm().valid()).toBe(true);
  });

  it('rejects an invalid phone number for the selected country', () => {
    component.usuarioModel.set({
      nombre: 'María Pérez',
      email: 'maria@example.com',
      paisTelefono: 'VE',
      telefono: '123',
    });

    expect(component.usuarioForm.telefono().invalid()).toBe(true);
  });

  it('requires a Turnstile token before sending the registration', () => {
    component.usuarioModel.set({
      nombre: 'María Pérez',
      email: 'maria@example.com',
      paisTelefono: 'VE',
      telefono: '4121234567',
    });

    component.onSubmit();

    expect(component.turnstileError).toContain('Completa la verificación');
    httpTestingController.expectNone('https://198-46-233-201.sslip.io/webhook/crear-usuario');
  });

  it('sends the Turnstile token with the registration', () => {
    component.usuarioModel.set({
      nombre: 'María Pérez',
      email: 'maria@example.com',
      paisTelefono: 'VE',
      telefono: '4121234567',
    });
    component.onTurnstileResolved('turnstile-test-token');

    component.onSubmit();

    const request = httpTestingController.expectOne(
      'https://198-46-233-201.sslip.io/webhook/crear-usuario',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombre: 'María Pérez',
      email: 'maria@example.com',
      codigoPais: '+58',
      telefono: '+584121234567',
      turnstileToken: 'turnstile-test-token',
    });

    request.flush({ status: 'success' });
    expect(router.navigate).toHaveBeenCalledWith(['/gracias']);
  });

  it('navigates to the registered page when n8n returns an existing-user status', () => {
    component.usuarioModel.set({
      nombre: 'María Pérez',
      email: 'maria@example.com',
      paisTelefono: 'VE',
      telefono: '4121234567',
    });
    component.onTurnstileResolved('turnstile-test-token');

    component.onSubmit();

    const request = httpTestingController.expectOne(
      'https://198-46-233-201.sslip.io/webhook/crear-usuario',
    );
    request.flush({ status: 'exists' });

    expect(router.navigate).toHaveBeenCalledWith(['/registrado'], {
      queryParams: { email: 'maria@example.com' },
    });
  });

  it('navigates to the registered page when n8n returns HTTP 409', () => {
    component.usuarioModel.set({
      nombre: 'María Pérez',
      email: 'maria@example.com',
      paisTelefono: 'VE',
      telefono: '4121234567',
    });
    component.onTurnstileResolved('turnstile-test-token');

    component.onSubmit();

    const request = httpTestingController.expectOne(
      'https://198-46-233-201.sslip.io/webhook/crear-usuario',
    );
    request.flush(
      { status: 'error', code: 'USER_ALREADY_EXISTS' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(router.navigate).toHaveBeenCalledWith(['/registrado'], {
      queryParams: { email: 'maria@example.com' },
    });
  });

  it('displays the error message returned by n8n for a rejected Turnstile token', () => {
    component.usuarioModel.set({
      nombre: 'María Pérez',
      email: 'maria@example.com',
      paisTelefono: 'VE',
      telefono: '4121234567',
    });
    component.onTurnstileResolved('turnstile-test-token');

    component.onSubmit();

    const request = httpTestingController.expectOne(
      'https://198-46-233-201.sslip.io/webhook/crear-usuario',
    );
    request.flush(
      {
        status: 'error',
        code: 'TURNSTILE_REJECTED',
        message: 'No pudimos validar la verificación de seguridad.',
      },
      { status: 403, statusText: 'Forbidden' },
    );

    fixture.detectChanges();
    expect(component.submitError).toBe('No pudimos validar la verificación de seguridad.');
    expect(fixture.nativeElement.textContent).toContain(
      'No pudimos validar la verificación de seguridad.',
    );
    expect(component.isSubmitting).toBe(false);
  });

  it('shows a generic message when the server error has no message', () => {
    component.usuarioModel.set({
      nombre: 'María Pérez',
      email: 'maria@example.com',
      paisTelefono: 'VE',
      telefono: '4121234567',
    });
    component.onTurnstileResolved('turnstile-test-token');

    component.onSubmit();

    const request = httpTestingController.expectOne(
      'https://198-46-233-201.sslip.io/webhook/crear-usuario',
    );
    request.flush(
      { status: 'error' },
      { status: 403, statusText: 'Forbidden' },
    );

    expect(component.submitError).toBe(
      'Hubo un error al procesar el registro. Por favor, intenta nuevamente.',
    );
  });
});
