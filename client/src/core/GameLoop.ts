export class GameLoop {
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedStep = 1 / 60;
  private rafId = 0;

  constructor(
    private onFixedUpdate: (dt: number) => void,
    private onRender: (alpha: number) => void
  ) {}

  public start(): void {
    this.lastTime = performance.now();
    const tick = (now: number) => {
      const frameTime = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;
      this.accumulator += frameTime;

      while (this.accumulator >= this.fixedStep) {
        this.onFixedUpdate(this.fixedStep);
        this.accumulator -= this.fixedStep;
      }

      this.onRender(this.accumulator / this.fixedStep);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public stop(): void {
    cancelAnimationFrame(this.rafId);
  }
}
