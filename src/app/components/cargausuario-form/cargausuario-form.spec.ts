import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CargausuarioForm } from './cargausuario-form';

describe('CargausuarioForm', () => {
  let component: CargausuarioForm;
  let fixture: ComponentFixture<CargausuarioForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargausuarioForm],
    }).compileComponents();

    fixture = TestBed.createComponent(CargausuarioForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

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
});
