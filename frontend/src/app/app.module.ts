import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  FeedbackComponent,
  FeedbackConfirmationModal,
} from './feedback/feedback.component';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {
  AlreadySubscribedModal,
  CategoryUpdatedModal,
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
    CategoryUpdatedModal,
    SubscribeComponent,
    UnsubscribeComponent,
    UnsubscribeConfirmationModal,
    EmailNotFoundModal,
    FeedbackComponent,
    FeedbackConfirmationModal,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    AppRoutingModule,
    CommonModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
