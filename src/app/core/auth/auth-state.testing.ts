import { Provider } from '@angular/core';
import { FamilyRepository } from '../../features/family/data/family-repository';
import { AuthRepository } from './data/auth-repository';

// What AuthState needs to exist, for specs whose component only reads its signals
// (e.g. familyFrozen). Specs that start a session provide working repositories instead.
export const AUTH_STATE_DEPENDENCIES: Provider[] = [
  { provide: AuthRepository, useValue: {} },
  { provide: FamilyRepository, useValue: {} },
];
