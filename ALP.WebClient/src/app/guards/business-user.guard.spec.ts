import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { businessUserGuard } from './business-user.guard';

describe('businessUserGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => businessUserGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
