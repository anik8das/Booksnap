import { Component, inject } from '@angular/core';
import { Firestore, getFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import {
  collection,
  deleteDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';

@Component({
  selector: 'app-unsubscribe',
  templateUrl: './unsubscribe.component.html',
  styleUrls: ['./unsubscribe.component.css'],
})
export class UnsubscribeComponent {
  loading: boolean = false;
  firestore = inject(Firestore);
  db = getFirestore(this.firestore.app);
  constructor(public dialog: MatDialog) {
    this.db = getFirestore(this.firestore.app);
  }

  async unsubscribe(email: string): Promise<void> {
    this.loading = true;
    const subscriberCollection = collection(this.db, 'subscribers');
    const q = query(subscriberCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    let dialogRef = null;
    if (querySnapshot.size === 0) {
      dialogRef = this.dialog.open(EmailNotFoundModal);
    } else {
      querySnapshot.forEach((doc) => {
        deleteDoc(doc.ref);
      });
      dialogRef = this.dialog.open(UnsubscribeConfirmationModal);
    }
    this.loading = false;
    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }
}

@Component({
  selector: 'unsubscribe-modal',
  templateUrl: '../modals/modal.html',
})
export class UnsubscribeConfirmationModal {
  headerText = `Wishing you the best`;
  bodyText = `You've been unsubscribed, we'll miss you!`;
}

@Component({
  selector: 'email-not-found-modal',
  templateUrl: '../modals/modal.html',
})
export class EmailNotFoundModal {
  headerText = `Oops`;
  bodyText = `We couldn't find your email in our database, could you please verify and try again?`;
}
