import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WalletService } from './services/wallet.service';
import { DataService } from './services/data.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  
  title = 'web';

  #walletService = inject(WalletService);
  #dataService = inject(DataService);

}
