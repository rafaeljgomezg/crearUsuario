import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { EMPTY } from 'rxjs';
import { Preferencias } from './preferencias';

describe('Preferencias', () => {
  let component: Preferencias;
  let fixture: ComponentFixture<Preferencias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Preferencias],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
        {
          provide: HttpClient,
          useValue: { get: () => EMPTY, post: () => EMPTY },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Preferencias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not allow a standard-plan user to select more than two sectors', () => {
    component.esStandard = true;
    component.sectoresSeleccionados = new Set(['Construcción', 'Servicios']);

    component.onSectorChange('Tecnología', true);

    expect([...component.sectoresSeleccionados]).toEqual(['Construcción', 'Servicios']);
    expect(component.estaSectorDeshabilitado('Tecnología')).toBe(true);
  });

  it('allows an additional selection after deselecting a sector', () => {
    component.esStandard = true;
    component.sectoresSeleccionados = new Set(['Construcción', 'Servicios']);

    component.onSectorChange('Construcción', false);
    component.onSectorChange('Tecnología', true);

    expect([...component.sectoresSeleccionados]).toEqual(['Servicios', 'Tecnología']);
    expect(component.estaSectorDeshabilitado('Construcción')).toBe(true);
  });
});
