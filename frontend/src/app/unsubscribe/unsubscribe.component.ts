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
    const q = query(
      collection(this.db, 'subscribers'),
      where('email', '==', email)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      deleteDoc(doc.ref);
    });
    console.log('removed from the mailing list!');
    this.openDialog();
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(UnsubscribeConfirmationModal);
    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }
}

@Component({
  selector: 'signout-modal',
  templateUrl: './signoutModal.html',
})
export class UnsubscribeConfirmationModal {}
