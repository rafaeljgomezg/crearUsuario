import { Component } from '@angular/core';

@Component({
  selector: 'app-no-existe',
  templateUrl: './no-existe.html',
})
export class NoExiste {
  readonly copyrightYear = new Date().getFullYear();
}
