export interface Book {
  id: string;
  qrPayload: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  shelf: string;
  status: 'Available' | 'Borrowed' | 'Maintenance';
  coverUrl: string;
  publishedYear: number;
  description: string;
  addedDate: string;
}

export interface Member {
  id: string;
  qrPayload: string;
  name: string;
  email: string;
  role: 'Student' | 'Faculty' | 'Researcher' | 'Staff';
  department: string;
  avatar: string;
  status: 'Active' | 'Suspended';
  joinDate: string;
}

export interface Loan {
  id: string;
  bookId: string;
  memberId: string;
  issuedDate: string;
  dueDate: string;
  returnedDate: string | null;
  status: 'Active' | 'Returned' | 'Overdue';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  details: string;
  badge: 'info' | 'success' | 'warning' | 'error';
}
