import { TestBed } from '@angular/core/testing';
import { CartToastService } from './cart-toast.service';
import Swal from 'sweetalert2';

describe('CartToastService', () => {
  let service: CartToastService;

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(CartToastService);
    // spy on fire
    vi.spyOn(Swal, 'fire').mockResolvedValue({} as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call showAddedToast with correct title for new item in English', () => {
    service.showAddedToast('Burger', false, 'en');
    expect(Swal.fire).toHaveBeenCalled();
    const args = vi.mocked(Swal.fire).mock.calls[0]![0] as any;
    expect(args.title).toBe('Added to cart');
    expect(args.text).toBe('Burger was added successfully');
  });

  it('should call showAddedToast with correct title for updated item in Arabic', () => {
    service.showAddedToast('Burger', true, 'ar');
    expect(Swal.fire).toHaveBeenCalled();
    const args = vi.mocked(Swal.fire).mock.calls[0]![0] as any;
    expect(args.title).toBe('تم تحديث الكمية في السلة');
    expect(args.text).toBeUndefined();
  });

  it('should set rtl based on document dir', () => {
    document.documentElement.dir = 'rtl';
    service.showAddedToast('Burger', false, 'ar');
    expect(Swal.fire).toHaveBeenCalled();
    const args = vi.mocked(Swal.fire).mock.calls[0]![0] as any;

    // Simulate didOpen
    const popup = document.createElement('div');
    args.didOpen(popup);
    expect(popup.getAttribute('dir')).toBe('rtl');

    document.documentElement.dir = 'ltr';
    service.showAddedToast('Burger', false, 'en');
    const args2 = vi.mocked(Swal.fire).mock.calls[1]![0] as any;
    args2.didOpen(popup);
    expect(popup.getAttribute('dir')).toBe('ltr');
  });
});
