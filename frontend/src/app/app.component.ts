import { Component, inject } from '@angular/core';
import { Firestore, getFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { addDoc, collection } from 'firebase/firestore';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'frontend';
  firestore = inject(Firestore);
  db = getFirestore(this.firestore.app);
  constructor(public dialog: MatDialog) {
    this.db = getFirestore(this.firestore.app);
  }

  async subscribe(email: string): Promise<void> {
    console.log(email);
    const subscriberCollection = collection(this.db, 'subscribers');
    await addDoc(subscriberCollection, { email });
    this.openDialog();
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogOverviewExampleDialog);
    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }
}

@Component({
  selector: 'modal',
  templateUrl: 'modal.html',
})
export class DialogOverviewExampleDialog {}
