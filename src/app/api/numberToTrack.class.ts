export class NumberToTrack {
  readonly CSS_DEFAULT = 'badge badge-light';
  readonly CSS_FLASH_UNCHANGED = 'badge badge-light';
  readonly CSS_FLASH_CHANGED = 'badge badge-primary';
  readonly CSS_FLASH_UP = 'badge badge-success';
  readonly CSS_FLASH_DOWN = 'badge badge-danger';

  readonly type: string;
  private value: number;
  private previousValue: number;
  private cssClass: string;
  private lastUpdate: string;
  private intervalId: any;

  constructor(type: string = 'price') {
    this.type = type;
    this.value = 0;
    this.previousValue = 0;
    this.cssClass = this.CSS_DEFAULT;
    this.lastUpdate = '';
    this.intervalId = 0;
  }

  setValue(value: number, lastUpdate: string) {
    this.previousValue = this.value;
    this.value = value;
    this.lastUpdate = lastUpdate;
    this.flash();
  }

  getValue() {
    return this.value;
  }

  getCssClass() {
    return this.cssClass;
  }

  getLastUpdateTime() {
    return this.lastUpdate;
  }

  private flash() {
    const sign = Math.sign(this.value - this.previousValue);
    if (this.type === 'spread') {
      this.setCssClassSpread(sign);
    } else {
      this.setCssClassPrice(sign);
    }

    clearInterval(this.intervalId);
    this.intervalId = setInterval(
      () => {
        this.cssClass = this.CSS_DEFAULT;
        clearInterval(this.intervalId);
      },
      1000,
    );
  }

  private setCssClassSpread(sign: number) {
    if (sign === 0) {
      this.cssClass = this.CSS_FLASH_UNCHANGED;
    } else {
      this.cssClass = this.CSS_FLASH_CHANGED;
    }
  }

  private setCssClassPrice(sign: number) {
    if (sign > 0) {
      this.cssClass = this.CSS_FLASH_UP;
    } else if (sign < 0) {
      this.cssClass = this.CSS_FLASH_DOWN;
    } else {
      this.cssClass = this.CSS_FLASH_UNCHANGED;
    }
  }
}
