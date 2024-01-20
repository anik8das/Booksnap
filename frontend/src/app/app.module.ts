import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {
  AlreadySubscribedModal,
  SignupConfirmationModal,
  SubscribeComponent,
} from './subscribe/subscribe.component';
import {
  EmailNotFoundModal,
  UnsubscribeComponent,
  UnsubscribeConfirmationModal,
} from './unsubscribe/unsubscribe.component';

@NgModule({
  declarations: [
    AppComponent,
    SignupConfirmationModal,
    AlreadySubscribedModal,
    SubscribeComponent,
    UnsubscribeComponent,
    UnsubscribeConfirmationModal,
    EmailNotFoundModal,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatDialogModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    AppRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
