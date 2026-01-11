
import { UserRole, EventStatus, Event, Venue, User, Club, Post, Announcement, MediaPost } from './types';

export const MOCK_VENUES: Venue[] = [
  { id: 'v1', name: 'Main Auditorium', capacity: 1000, features: ['Stage', 'Sound System', 'AC'] },
  { id: 'v2', name: 'Seminar Hall A', capacity: 200, features: ['Projector', 'Whiteboard'] },
  { id: 'v3', name: 'Open Air Theatre', capacity: 2000, features: ['Outdoor', 'Lighting'] },
  { id: 'v4', name: 'Computer Lab 3', capacity: 60, features: ['Computers', 'High-speed Internet'] },
];

export const MOCK_CLUBS: Club[] = [
  { 
    id: 'c1', 
    name: 'Coding Club', 
    description: 'Building the future, one line of code at a time.', 
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=coding',
    banner: 'https://picsum.photos/800/200?random=20',
    adminId: 'u2',
    memberCount: 450
  },
  { 
    id: 'c2', 
    name: 'Music Society', 
    description: 'Orchestrating harmony on campus.', 
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=music',
    banner: 'https://picsum.photos/800/200?random=21',
    adminId: 'u4',
    memberCount: 230
  },
  { 
    id: 'c3', 
    name: 'Debating Society', 
    description: 'Voices that matter. Arguments that win.', 
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=debate',
    banner: 'https://picsum.photos/800/200?random=22',
    adminId: 'u5',
    memberCount: 120
  },
  { 
    id: 'c4', 
    name: 'Robotics Club', 
    description: 'Automating the world.', 
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=robot',
    banner: 'https://picsum.photos/800/200?random=23',
    adminId: 'u6',
    memberCount: 180
  },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    clubId: 'c1',
    content: 'General Body Meeting this Friday at 5 PM in the Main Auditorium. Attendance is mandatory for core members.',
    date: '2024-05-10'
  },
  {
    id: 'a2',
    clubId: 'c2',
    content: 'Practice sessions for the upcoming fest have been rescheduled to 6 PM.',
    date: '2024-05-12'
  }
];

export const MOCK_MEDIA: MediaPost[] = [
  {
    id: 'm1',
    clubId: 'c1',
    eventId: 'e1',
    imageUrl: 'https://picsum.photos/800/600?random=50',
    caption: 'Winners of Hackathon 2023! 🏆',
    likedBy: ['u1', 'u3'],
    comments: [{ id: 'cm1', userId: 'u1', userName: 'Alex', text: 'Great event!', timestamp: '2023-05-16' }]
  },
  {
    id: 'm2',
    clubId: 'c2',
    eventId: 'e2',
    imageUrl: 'https://picsum.photos/800/600?random=51',
    caption: 'Jamming session at the OAT 🎸',
    likedBy: ['u1', 'u2', 'u5'],
    comments: []
  }
];

export const MOCK_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Alex Student', 
    email: 'alex@college.edu',
    role: UserRole.STUDENT, 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    bio: 'CS Major. Coffee enthusiast. Always looking for the next hackathon.',
    joinDate: '2023-08-15',
    joinedClubIds: ['c1'],
    year: '3rd Year',
    branch: 'CSE'
  },
  { 
    id: 'u2', 
    name: 'Coding Club Admin', 
    email: 'coding@college.edu',
    role: UserRole.CLUB_ADMIN, 
    clubId: 'c1', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    bio: 'Leading the tech revolution on campus.',
    joinDate: '2022-05-10',
    joinedClubIds: ['c1'],
    year: '4th Year',
    branch: 'CSE'
  },
  { 
    id: 'u3', 
    name: 'Dean of Affairs', 
    email: 'dean@college.edu',
    role: UserRole.COLLEGE_ADMIN, 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dean',
    bio: 'Overseeing campus activities and student welfare.',
    joinDate: '2020-01-01',
    joinedClubIds: []
  },
];

export const INITIAL_EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'Hackathon 2024',
    description: 'A 24-hour coding marathon to solve real-world problems.',
    organizer: 'Coding Club',
    clubId: 'c1',
    date: '2024-05-15',
    time: '09:00',
    venueId: 'v1',
    status: EventStatus.APPROVED,
    capacity: 200,
    registeredCount: 150,
    image: 'https://picsum.photos/800/400?random=10',
    tags: ['Tech', 'Coding', 'Competition'],
    price: 0,
    volunteersNeeded: true
  },
  {
    id: 'e2',
    title: 'Music Fest',
    description: 'An evening of classical and modern music performances.',
    organizer: 'Music Society',
    clubId: 'c2',
    date: '2024-05-20',
    time: '18:00',
    venueId: 'v3',
    status: EventStatus.APPROVED,
    capacity: 1000,
    registeredCount: 850,
    image: 'https://picsum.photos/800/400?random=11',
    tags: ['Music', 'Art', 'Fun'],
    price: 150,
    volunteersNeeded: true
  },
  {
    id: 'e3',
    title: 'AI Workshop',
    description: 'Introduction to Generative AI and LLMs.',
    organizer: 'Coding Club',
    clubId: 'c1',
    date: '2024-06-01',
    time: '14:00',
    venueId: 'v2',
    status: EventStatus.PENDING, // Pending Approval
    capacity: 50,
    registeredCount: 0,
    image: 'https://picsum.photos/800/400?random=12',
    tags: ['Workshop', 'AI', 'Learning'],
    price: 50,
    volunteersNeeded: false
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    clubId: 'c1',
    userId: 'u2',
    userName: 'Coding Club Admin',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    content: 'Welcome to the new semester! We have some great workshops planned. What topics are you interested in?',
    timestamp: '2 hours ago',
    likedBy: ['u1', 'u3', 'u4', 'u5', 'u6'],
    comments: [
        { id: 'c1', userId: 'u1', userName: 'Alex', text: 'React Native please!', timestamp: '1 hour ago' }
    ]
  },
  {
    id: 'p2',
    clubId: 'c1',
    userId: 'u1',
    userName: 'Alex Student',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    content: 'I would love a session on React and Tailwind CSS!',
    timestamp: '1 hour ago',
    likedBy: ['u2'],
    comments: []
  },
  {
    id: 'p3',
    clubId: 'c2',
    userId: 'u4',
    userName: 'Music Society Admin',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=music',
    content: 'Auditions for the annual fest will begin next week. Get your instruments ready!',
    timestamp: '5 hours ago',
    likedBy: ['u1', 'u5'],
    comments: []
  }
];
