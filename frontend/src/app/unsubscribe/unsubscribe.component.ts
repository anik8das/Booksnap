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
  firestore = inject(Firestore);
  db = getFirestore(this.firestore.app);
  constructor(public dialog: MatDialog) {
    this.db = getFirestore(this.firestore.app);
  }

  async unsubscribe(email: string): Promise<void> {
    console.log(email);
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
    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }
}

@Component({
  selector: 'signout-modal',
  templateUrl: '../modals/signoutConfirmation.html',
})
export class UnsubscribeConfirmationModal {}

@Component({
  selector: 'signout-modal',
  templateUrl: '../modals/emailNotFound.html',
})
export class EmailNotFoundModal {}
