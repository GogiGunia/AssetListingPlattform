import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { BroadcastService } from '../../../core-services/broadcast.service';
import { TokenService } from '../../../core-services/token/token.service';

@Component({
  selector: 'app-auth',
  imports: [],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  private subs = new Subscription();

  public state?: "internalAuth" | "logout";
  constructor(private tokenService: TokenService,
    private broadcastService: BroadcastService) {

  }

  public ngOnInit(): void {
    if (this.tokenService.manualLogout) {
      this.state = "logout";
      this.broadcastService.logoutChannel.postMessage(true);
    }
    else
      this.goToLogin();
  }

  public ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private goToLogin(): void {
    this.state = "internalAuth";
  }

  public backToLogin(): void {
    this.goToLogin();
  }
}
