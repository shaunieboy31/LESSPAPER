export { default as Unauthorized } from './errorPages/unauthorized/unauthorized';
export { default as Missing } from './errorPages/missing';

export { default as Login } from './auth';

export { default as SelfServicePortal } from './self-service-portal';
export { default as Dashboard } from './private/dashboard';

export { default as Outgoing } from './private/documents/Outgoing';
export { default as Incoming } from './private/documents/Incoming';
export { default as Pending } from './private/documents/Pending';
export { default as Saved } from './private/documents/Saved';
export { default as Lapsed } from './private/documents/Lapsed';
export { default as Onhold } from './private/documents/Onhold';
export { default as Signed } from './private/documents/Signed';
export { default as Uploaded } from './private/documents/Uploaded';

export { default as Routing } from './private/documents/Routing';
export { default as Signature } from './private/documents/Signature';
export { default as RoutedIn } from './private/documents/RoutedIn';
export { default as RoutedOut } from './private/documents/RoutedOut';

// Secretary pages
export { default as Release } from './private/documents/Release';

// SDS Additional pages
export { default as IncomingTOMemo } from './private/documents/Incoming/Incoming-TO-Memo';
export { default as SignatureTOMemo } from './private/documents/Signature/Signature-TO-Memo';

export { default as DocTypes } from './private/admin/DocTypes';
export { default as Units } from './private/admin/Units';
export { default as Offices } from './private/admin/Offices';
export { default as Users } from './private/admin/Users';
export { default as AllDocuments } from './private/admin/AllDocuments';

export { default as FeedbackCriterias } from './private/admin/Feedback/Criterias';
export { default as Feedbacks } from './private/admin/Feedback/Feedbacks';
export { default as Divisions } from './private/admin/Divisions';
export { default as Systems } from './private/admin/Feedback/Systems';

export { default as Profile } from './private/profile';

// Feedback pages
export { default as FeedbackForm } from './feedback-form';
