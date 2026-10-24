// Prueba que la pantalla 404 informa del error y enlaza con el inicio.
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoExiste } from './no-existe';

describe('NoExiste', () => {
  let fixture: ComponentFixture<NoExiste>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoExiste],
    }).compileComponents();

    fixture = TestBed.createComponent(NoExiste);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('shows a not found message and a link to the start page', () => {
    expect(fixture.nativeElement.textContent).toContain('Esta página no existe');
    expect(fixture.nativeElement.textContent).toContain('Error 404');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/cargausuario-form');
  });
});
