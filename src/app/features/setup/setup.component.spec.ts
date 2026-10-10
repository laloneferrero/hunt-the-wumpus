import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { GameSessionService } from '../../core/game-session.service';
import { SetupComponent } from './setup.component';

describe('SetupComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetupComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('starts a game with the default parameters', () => {
    const fixture = TestBed.createComponent(SetupComponent);
    const router = TestBed.inject(Router);
    const session = TestBed.inject(GameSessionService);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(session.active()).toBeTrue();
    expect(session.arrows()).toBe(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/jugar');
    expect(fixture.componentInstance.error()).toBeNull();
  });

  it('shows a validation error and does not start', () => {
    const fixture = TestBed.createComponent(SetupComponent);
    const router = TestBed.inject(Router);
    const session = TestBed.inject(GameSessionService);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges();

    fixture.componentInstance.form.controls.size.setValue(2);
    fixture.componentInstance.form.controls.pits.setValue(7);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('tamaño');
    expect(session.active()).toBeFalse();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('rejects a board that cannot hold the pits', () => {
    const fixture = TestBed.createComponent(SetupComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.controls.size.setValue(3);
    fixture.componentInstance.form.controls.pits.setValue(7);
    fixture.componentInstance.start();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('No caben');
  });
});
