
export enum UserRole {
  STUDENT = 'STUDENT',
  CLUB_ADMIN = 'CLUB_ADMIN',
  COLLEGE_ADMIN = 'COLLEGE_ADMIN',
  VENUE_MANAGER = 'VENUE_MANAGER'
}

export enum EventStatus {
  PENDING = 'PENDING',
  VENUE_APPROVED = 'VENUE_APPROVED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

export enum VolunteerStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  clubId?: string; // If club admin
  venueId?: string; // If venue manager
  managedVenueId?: string;
  bio?: string;
  joinDate?: string;
  joinedClubIds?: string[];
  year?: string;
  branch?: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  logo: string;
  banner: string;
  adminId: string;
  memberCount: number;
}

export interface Announcement {
  id: string;
  clubId: string;
  content: string;
  date: string;
}

export interface Venue {
  id: string;
  name: string;
  capacity: number;
  features: string[];
}

export interface Winner {
  rank: number;
  name: string;
  photo: string; // Base64 or URL
}

export enum EventCategory {
  ACADEMIC = 'Academic',
  CULTURAL = 'Cultural',
  SPORTS = 'Sports',
  WORKSHOP = 'Workshop',
  SEMINAR = 'Seminar',
  OTHER = 'Other'
}

export interface Event {
  id: string;
  title: string;
  description: string;
  organizer: string;
  clubId: string;
  date: string;
  time: string;
  venueId: string;
  status: EventStatus;
  capacity: number;
  registeredCount: number;
  image?: string;
  tags: string[];
  price: number; // 0 for free
  category?: EventCategory;
  feedback?: Feedback[];
  volunteersNeeded?: boolean;
  certificatesIssued?: boolean;
  certificateTemplate?: string;
  winners?: Winner[];
  rejectionReason?: string;
}

export interface Feedback {
  userId: string;
  rating: number;
  comment: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface Post {
  id: string;
  clubId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  likedBy: string[]; // Array of user IDs
  comments: Comment[];
}

export interface MediaPost {
  id: string;
  clubId: string;
  eventId: string;
  imageUrls: string[]; 
  imageUrl?: string; // Backward compatibility
  caption: string;
  likedBy: string[]; // Array of user IDs
  comments: Comment[];
  timestamp: string; 
}

export interface Proposal {
  title: string;
  description: string;
  date: string;
  time: string;
  venueId: string;
  capacity: number;
  budget: number;
}

export interface VolunteerApplication {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  status: VolunteerStatus;
  appliedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'system' | 'event' | 'club' | 'success' | 'error' | 'info' | 'warning';
}
