import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { validateConfig } from '../../core/game/board';
import { GameSessionService } from '../../core/game-session.service';
import {
  DEFAULT_ARROWS,
  DEFAULT_PITS,
  DEFAULT_SIZE,
  GameConfig,
} from '../../core/models/game.models';

@Component({
  selector: 'app-setup',
  imports: [ReactiveFormsModule],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.css',
})
export class SetupComponent {
  private readonly session = inject(GameSessionService);
  private readonly router = inject(Router);

  readonly error = signal<string | null>(null);
  readonly form = new FormGroup({
    size: new FormControl(DEFAULT_SIZE, { nonNullable: true }),
    pits: new FormControl(DEFAULT_PITS, { nonNullable: true }),
    arrows: new FormControl(DEFAULT_ARROWS, { nonNullable: true }),
  });

  start(): void {
    const config = this.readConfig();
    const message = validateConfig(config);
    if (message) {
      this.error.set(message);
      return;
    }
    this.error.set(null);
    this.session.start(config);
    void this.router.navigateByUrl('/jugar');
  }

  private readConfig(): GameConfig {
    const raw = this.form.getRawValue();
    return {
      size: Number(raw.size),
      pits: Number(raw.pits),
      arrows: Number(raw.arrows),
    };
  }
}
