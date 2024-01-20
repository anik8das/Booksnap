import { Component, inject } from '@angular/core';
import { Firestore, getFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';

@Component({
  selector: 'app-subscribe',
  templateUrl: './subscribe.component.html',
  styleUrls: ['./subscribe.component.css'],
})
export class SubscribeComponent {
  firestore = inject(Firestore);
  db = getFirestore(this.firestore.app);
  loading: boolean = false;
  constructor(public dialog: MatDialog) {
    this.db = getFirestore(this.firestore.app);
  }

  async subscribe(email: string): Promise<void> {
    this.loading = true;
    const subscriberCollection = collection(this.db, 'subscribers');
    const q = query(subscriberCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    let dialogRef = null;
    if (querySnapshot.size > 0) {
      dialogRef = this.dialog.open(AlreadySubscribedModal);
    } else {
      await addDoc(subscriberCollection, { email });
      dialogRef = this.dialog.open(SignupConfirmationModal);
    }
    this.loading = false;
    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(SignupConfirmationModal);
    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }
}

@Component({
  selector: 'signup-modal',
  templateUrl: '../modals/signupConfirmation.html',
})
export class SignupConfirmationModal {}

@Component({
  selector: 'already-subscribed-modal',
  templateUrl: '../modals/alreadySubscribed.html',
})
export class AlreadySubscribedModal {}
