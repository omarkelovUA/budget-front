import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAngularSvgIcon } from 'angular-svg-icon';
import { AccountRepository } from './features/accounts/data/account-repository';
import { MockAccountRepository } from './features/accounts/data/mock-account-repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAngularSvgIcon(),
    { provide: AccountRepository, useClass: MockAccountRepository },
  ],
};
