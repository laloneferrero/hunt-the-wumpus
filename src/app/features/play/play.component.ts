import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { GameSessionService } from '../../core/game-session.service';
import { Command } from '../../core/models/game.models';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html',
  styleUrl: './play.component.css',
})
export class PlayComponent {
  readonly session = inject(GameSessionService);
  private readonly router = inject(Router);
  private readonly logBox = viewChild<ElementRef<HTMLTextAreaElement>>('logBox');

  constructor() {
    if (!this.session.active()) {
      void this.router.navigateByUrl('/');
    }
  }

  act(command: Command): void {
    if (!this.session.playing()) {
      return;
    }
    this.session.command(command);
    queueMicrotask(() => {
      const element = this.logBox()?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }

  newGame(): void {
    this.session.clear();
    void this.router.navigateByUrl('/');
  }
}
