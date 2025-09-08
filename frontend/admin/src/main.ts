import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

import { Buffer } from 'buffer'; // Import the Buffer polyfill

// Polyfill global Buffer and other Node.js globals
(window as any).global = window;
(window as any).Buffer = Buffer;
(window as any).process = { env: { DEBUG: undefined } }; // Polyfill process if needed

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
