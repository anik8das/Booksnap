import { Component, inject } from '@angular/core';
import { Firestore, getFirestore } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import {
  addDoc,
  collection,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

@Component({
  selector: 'app-subscribe',
  templateUrl: './subscribe.component.html',
  styleUrls: ['./subscribe.component.css'],
})
export class SubscribeComponent {
  firestore = inject(Firestore);
  db = getFirestore(this.firestore.app);
  loading: boolean = false;
  category: string = 'random';
  constructor(public dialog: MatDialog) {
    this.db = getFirestore(this.firestore.app);
  }

  async subscribe(email: string): Promise<void> {
    if (!this.isValidEmail(email)) {
      alert('Please enter a valid email address');
      return;
    }
    this.loading = true;
    const subscriberCollection = collection(this.db, 'subscribers');
    const q = query(subscriberCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    let dialogRef = null;
    if (querySnapshot.size > 0) {
      // user is already subscribed, checked for category
      querySnapshot.forEach(async (doc) => {
        if (doc.data()['category'] !== this.category) {
          await updateDoc(doc.ref, { category: this.category });
          dialogRef = this.dialog.open(CategoryUpdatedModal);
        } else {
          dialogRef = this.dialog.open(AlreadySubscribedModal);
        }
      });
    } else {
      await addDoc(subscriberCollection, { email, category: this.category });
      dialogRef = this.dialog.open(SignupConfirmationModal);
    }
    this.loading = false;
    if (dialogRef) {
      dialogRef.afterClosed().subscribe((result) => {
        console.log('The dialog was closed');
      });
    }
  }

  isValidEmail(email: string) {
    // Regular expression for validating email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  selectCategory(category: string): void {
    this.category = category;
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
  templateUrl: '../modals/modal.html',
})
export class SignupConfirmationModal {
  headerText = `Thank you!`;
  bodyText = `You've been subscribed, wishing you productive mornings!`;
}

@Component({
  selector: 'already-subscribed-modal',
  templateUrl: '../modals/modal.html',
})
export class AlreadySubscribedModal {
  headerText = `Looks like you've already joined the party!`;
  bodyText = `If you couldn't find our original emails, please check your junk or spam folders`;
}

@Component({
  selector: 'category-updated-modal',
  templateUrl: '../modals/modal.html',
})
export class CategoryUpdatedModal {
  headerText = `Genre Updated`;
  bodyText = `You were already subscribed, and your preferred category has been updated!`;
}
