import { Book, Member, Loan, ActivityLog } from '../types';

export const INITIAL_BOOKS: Book[] = [
  {
    id: 'BK-101',
    qrPayload: 'LIB-BOOK-101',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    isbn: '978-1491903078',
    category: 'Computer Science',
    shelf: 'Aisle 3 - Shelf A4',
    status: 'Available',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    publishedYear: 2017,
    description: 'The definitive guide to the modern data architecture landscape.',
    addedDate: '2026-01-10'
  },
  {
    id: 'BK-102',
    qrPayload: 'LIB-BOOK-102',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    category: 'Software Engineering',
    shelf: 'Aisle 3 - Shelf B1',
    status: 'Borrowed',
    coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80',
    publishedYear: 2008,
    description: 'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees.',
    addedDate: '2026-01-12'
  },
  {
    id: 'BK-103',
    qrPayload: 'LIB-BOOK-103',
    title: 'Structure and Interpretation of Computer Programs',
    author: 'Harold Abelson, Gerald Jay Sussman',
    isbn: '978-0262510875',
    category: 'Computer Science',
    shelf: 'Aisle 3 - Shelf C2',
    status: 'Available',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=80',
    publishedYear: 1996,
    description: 'A classic introduction to computer science, programming paradigms, and abstraction.',
    addedDate: '2026-02-01'
  },
  {
    id: 'BK-104',
    qrPayload: 'LIB-BOOK-104',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    isbn: '978-0062316097',
    category: 'History',
    shelf: 'Aisle 1 - Shelf D5',
    status: 'Available',
    coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80',
    publishedYear: 2015,
    description: '100,000 years ago, at least six human species inhabited the earth. Today there is just one: Homo sapiens.',
    addedDate: '2026-02-14'
  },
  {
    id: 'BK-105',
    qrPayload: 'LIB-BOOK-105',
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '978-0735211292',
    category: 'Self Improvement',
    shelf: 'Aisle 2 - Shelf E1',
    status: 'Borrowed',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80',
    publishedYear: 2018,
    description: 'An easy & proven way to build good habits & break bad ones.',
    addedDate: '2026-03-01'
  },
  {
    id: 'BK-106',
    qrPayload: 'LIB-BOOK-106',
    title: 'Astrophysics for People in a Hurry',
    author: 'Neil deGrasse Tyson',
    isbn: '978-0393609394',
    category: 'Science',
    shelf: 'Aisle 4 - Shelf A2',
    status: 'Available',
    coverUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
    publishedYear: 2017,
    description: 'The essential guide to the cosmos for busy minds looking to comprehend space and quantum physics.',
    addedDate: '2026-03-15'
  },
  {
    id: 'BK-107',
    qrPayload: 'LIB-BOOK-107',
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell, Peter Norvig',
    isbn: '978-0134610993',
    category: 'Computer Science',
    shelf: 'Aisle 3 - Shelf A1',
    status: 'Available',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    publishedYear: 2020,
    description: 'The standard textbook in Artificial Intelligence covering machine learning, robotics, and multi-agent systems.',
    addedDate: '2026-04-02'
  },
  {
    id: 'BK-108',
    qrPayload: 'LIB-BOOK-108',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '978-0743273565',
    category: 'Fiction',
    shelf: 'Aisle 5 - Shelf F3',
    status: 'Available',
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=400&q=80',
    publishedYear: 1925,
    description: 'The tragic story of Jay Gatsby and his unrequited love for Daisy Buchanan in Jazz Age Long Island.',
    addedDate: '2026-04-10'
  }
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'MEM-201',
    qrPayload: 'LIB-MEM-201',
    name: 'Elena Rostova',
    email: 'elena.r@university.edu',
    role: 'Student',
    department: 'Computer Science',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    status: 'Active',
    joinDate: '2025-09-01'
  },
  {
    id: 'MEM-202',
    qrPayload: 'LIB-MEM-202',
    name: 'Dr. Marcus Vance',
    email: 'm.vance@university.edu',
    role: 'Faculty',
    department: 'Physics & Astronomy',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    status: 'Active',
    joinDate: '2024-01-15'
  },
  {
    id: 'MEM-203',
    qrPayload: 'LIB-MEM-203',
    name: 'Sophia Patel',
    email: 'sophia.p@university.edu',
    role: 'Researcher',
    department: 'Data Science',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    status: 'Active',
    joinDate: '2025-11-10'
  },
  {
    id: 'MEM-204',
    qrPayload: 'LIB-MEM-204',
    name: 'Julian Chen',
    email: 'j.chen@university.edu',
    role: 'Student',
    department: 'History & Humanities',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    status: 'Active',
    joinDate: '2026-01-20'
  }
];

export const INITIAL_LOANS: Loan[] = [
  {
    id: 'LN-501',
    bookId: 'BK-102',
    memberId: 'MEM-201',
    issuedDate: '2026-08-20',
    dueDate: '2026-09-03',
    returnedDate: null,
    status: 'Active'
  },
  {
    id: 'LN-502',
    bookId: 'BK-105',
    memberId: 'MEM-203',
    issuedDate: '2026-08-15',
    dueDate: '2026-08-29',
    returnedDate: null,
    status: 'Overdue'
  }
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'LOG-901',
    timestamp: '2026-09-02 15:30',
    type: 'SCAN',
    title: 'Book QR Scanned',
    details: 'BK-101 (Designing Data-Intensive Applications) scanned at Front Desk',
    badge: 'info'
  },
  {
    id: 'LOG-902',
    timestamp: '2026-08-20 11:15',
    type: 'ISSUE',
    title: 'Book Issued',
    details: 'Clean Code (BK-102) issued to Elena Rostova (MEM-201)',
    badge: 'success'
  },
  {
    id: 'LOG-903',
    timestamp: '2026-08-15 09:45',
    type: 'ISSUE',
    title: 'Book Issued',
    details: 'Atomic Habits (BK-105) issued to Sophia Patel (MEM-203)',
    badge: 'warning'
  }
];
