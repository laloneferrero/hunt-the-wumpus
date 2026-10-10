import { Routes } from '@angular/router';
import { PlayComponent } from './features/play/play.component';
import { SetupComponent } from './features/setup/setup.component';

export const routes: Routes = [
  { path: '', component: SetupComponent },
  { path: 'jugar', component: PlayComponent },
];
