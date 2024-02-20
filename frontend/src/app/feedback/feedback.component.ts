import { Component, inject } from '@angular/core';
import { Firestore, getFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { addDoc, collection } from 'firebase/firestore';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css'],
})
export class FeedbackComponent {
  loading: boolean = false;
  firestore = inject(Firestore);
  db = getFirestore(this.firestore.app);
  constructor(public dialog: MatDialog) {
    this.db = getFirestore(this.firestore.app);
  }

  async sendFeedback(feedback: string): Promise<void> {
    this.loading = true;
    const feedbackCollection = collection(this.db, 'feedback');
    let dialogRef = null;
    await addDoc(feedbackCollection, { feedback });
    dialogRef = this.dialog.open(FeedbackConfirmationModal);
    this.loading = false;
    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result) => {
        console.log('The dialog was closed');
      });
    }
  }
}

@Component({
  selector: 'feedback-modal',
  templateUrl: '../modals/modal.html',
})
export class FeedbackConfirmationModal {
  headerText = `Thank you!`;
  bodyText = `We've received your feedback! You have our promise that we'll do our best to improve :)`;
}
