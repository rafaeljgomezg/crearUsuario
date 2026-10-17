import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Checkout } from './checkout';

describe('Checkout', () => {
  let component: Checkout;
  let fixture: ComponentFixture<Checkout>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ userId: 'user-123' }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Checkout);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => httpTestingController.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sends the selected checkout data and user ID as JSON', () => {
    const form = {
      invalid: false,
      control: { markAllAsTouched: vi.fn() },
    } as never;
    component.plan = 'CORPORATE';
    component.periodo = 'trimestral';
    component.metodo = 'Zinli';

    component.onSubmit(form);

    const request = httpTestingController.expectOne(
      'https://somewhat-jones-marion-guru.trycloudflare.com/webhook/pago-exitoso',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      UserID: 'user-123',
      plan: 'CORPORATE',
      periodo: 'trimestral',
      metodo: 'Zinli',
    });

    request.flush({});
    expect(component.enviado).toBe(true);
    expect(component.enviando).toBe(false);
  });

  it('does not submit if a checkout option is missing', () => {
    const markAllAsTouched = vi.fn();
    const form = {
      invalid: true,
      control: { markAllAsTouched },
    } as never;

    component.onSubmit(form);

    expect(markAllAsTouched).toHaveBeenCalled();
    httpTestingController.expectNone(
      'https://somewhat-jones-marion-guru.trycloudflare.com/webhook/pago-exitoso',
    );
  });
});
