import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Preferencias } from './preferencias';

describe('Preferencias', () => {
  let component: Preferencias;
  let fixture: ComponentFixture<Preferencias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Preferencias],
    }).compileComponents();

    fixture = TestBed.createComponent(Preferencias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
