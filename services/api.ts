
import { User, Event, Club, Post, Venue, UserRole, VolunteerApplication, VolunteerStatus, Announcement, MediaPost, Feedback, Comment, Winner } from '../types';
import { supabase } from './supabaseClient';

// Helper to map DB response to types if needed (Supabase returns null for missing JSONB, we might need [] default)
const handleResponse = async <T>(promise: Promise<any>): Promise<T> => {
    const { data, error } = await promise;
    if (error) {
        console.error("Supabase Error:", error);
        throw new Error(error.message);
    }
    return data as T;
};

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      // In a real app, use supabase.auth.signInWithPassword
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error || !data) throw new Error('Invalid credentials');
      if (data.password !== password) throw new Error('Invalid credentials');
      
      return data as User;
    },
    signup: async (user: User): Promise<User> => {
      const { error } = await supabase.from('users').insert(user);
      if (error) throw new Error(error.message);
      return user;
    },
    loginAsRole: async (role: UserRole): Promise<User> => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', role)
        .limit(1)
        .single();
        
      if (error || !data) throw new Error(`No user found with role ${role}`);
      return data as User;
    },
    updateProfile: async (user: User): Promise<User> => {
        const { error } = await supabase
            .from('users')
            .update(user)
            .eq('id', user.id);
        if (error) throw new Error(error.message);
        return user;
    },
    getRegistrations: async (userId: string): Promise<string[]> => {
        const { data, error } = await supabase
            .from('registrations')
            .select('eventId')
            .eq('userId', userId);
        if (error) return [];
        return data.map((r: any) => r.eventId);
    }
  },
  admin: {
      createClub: async (club: Club): Promise<Club> => {
          const { error } = await supabase.from('clubs').insert(club);
          if (error) throw new Error(error.message);
          return club;
      },
      updateClub: async (club: Club): Promise<Club> => {
          const { error } = await supabase.from('clubs').update(club).eq('id', club.id);
          if (error) throw new Error(error.message);
          return club;
      },
      createUser: async (user: User): Promise<User> => {
          const { error } = await supabase.from('users').insert(user);
          if (error) throw new Error(error.message);
          return user;
      },
      updateUser: async (user: Partial<User>): Promise<void> => {
          const { error } = await supabase.from('users').update(user).eq('id', user.id);
          if (error) throw new Error(error.message);
      }
  },
  events: {
    list: async (clubId?: string): Promise<Event[]> => {
      let query = supabase.from('events').select('*');
      if (clubId) {
          query = query.eq('clubId', clubId);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    },
    create: async (event: Event): Promise<Event> => {
      const { error } = await supabase.from('events').insert(event);
      if (error) throw new Error(error.message);
      return event;
    },
    update: async (event: Event): Promise<Event> => {
        const { error } = await supabase
            .from('events')
            .update(event)
            .eq('id', event.id);
        if (error) throw new Error(error.message);
        return event;
    },
    updateStatus: async (eventId: string, status: any, reason?: string): Promise<Event> => {
       const updateData: any = { status };
       if (reason) updateData.rejectionReason = reason;
       if (status === 'PENDING') updateData.rejectionReason = null; // Clear reason

       const { data, error } = await supabase
         .from('events')
         .update(updateData)
         .eq('id', eventId)
         .select()
         .single();
         
       if (error) throw new Error(error.message);
       return data;
    },
    register: async (eventId: string, userId: string): Promise<void> => {
        const { error: regError } = await supabase
            .from('registrations')
            .insert({ eventId, userId });
        
        if (regError) {
            if (regError.code !== '23505') throw new Error(regError.message);
        }

        const { data: event } = await supabase.from('events').select('registeredCount').eq('id', eventId).single();
        if (event) {
             await supabase.from('events').update({ registeredCount: (event.registeredCount || 0) + 1 }).eq('id', eventId);
        }
    },
    getRegisteredUsers: async (eventId: string): Promise<User[]> => {
        const { data: regs, error: regError } = await supabase
            .from('registrations')
            .select('userId')
            .eq('eventId', eventId);
        
        if (regError) throw new Error(regError.message);
        if (!regs || regs.length === 0) return [];

        const userIds = regs.map((r: any) => r.userId);

        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .in('id', userIds);
            
        if (userError) throw new Error(userError.message);
        return users || [];
    },
    addFeedback: async (eventId: string, feedback: Feedback): Promise<void> => {
        const { data: event } = await supabase.from('events').select('feedback').eq('id', eventId).single();
        const currentFeedback = event?.feedback || [];
        
        await supabase
            .from('events')
            .update({ feedback: [...currentFeedback, feedback] })
            .eq('id', eventId);
    },
    issueCertificates: async (eventId: string): Promise<void> => {
        await supabase.from('events').update({ certificatesIssued: true }).eq('id', eventId);
    },
    saveWinners: async (eventId: string, winners: Winner[]): Promise<void> => {
        await supabase.from('events').update({ winners }).eq('id', eventId);
    }
  },
  clubs: {
    list: async (): Promise<Club[]> => {
      const { data, error } = await supabase.from('clubs').select('*');
      if (error) return [];
      return data;
    },
    join: async (clubId: string, userId: string): Promise<User> => {
        const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
        if (!user) throw new Error("User not found");

        const joinedClubIds = user.joinedClubIds || [];
        if (!joinedClubIds.includes(clubId)) {
            const newJoined = [...joinedClubIds, clubId];
            
            await supabase.from('users').update({ joinedClubIds: newJoined }).eq('id', userId);
            
            const { data: club } = await supabase.from('clubs').select('memberCount').eq('id', clubId).single();
            if (club) {
                await supabase.from('clubs').update({ memberCount: (club.memberCount || 0) + 1 }).eq('id', clubId);
            }
            
            return { ...user, joinedClubIds: newJoined };
        }
        return user;
    },
    leave: async (clubId: string, userId: string): Promise<User> => {
        const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
        if (!user) throw new Error("User not found");

        const joinedClubIds = user.joinedClubIds || [];
        const newJoined = joinedClubIds.filter((id: string) => id !== clubId);
        
        await supabase.from('users').update({ joinedClubIds: newJoined }).eq('id', userId);

        const { data: club } = await supabase.from('clubs').select('memberCount').eq('id', clubId).single();
        if (club) {
            await supabase.from('clubs').update({ memberCount: Math.max(0, (club.memberCount || 0) - 1) }).eq('id', clubId);
        }

        return { ...user, joinedClubIds: newJoined };
    },
    getMembers: async (clubId: string): Promise<User[]> => {
        // Fix for filtering JSON array or Text array in supabase
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .contains('joinedClubIds', [clubId]);
        
        if (error) {
            console.error("Error fetching members:", error);
            return [];
        }
        return data as User[];
    }
  },
  posts: {
    list: async (clubId: string): Promise<Post[]> => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('clubId', clubId)
        .order('timestamp', { ascending: false });
      
      if (error) return [];
      return data || [];
    },
    create: async (post: Post): Promise<Post> => {
      const { error } = await supabase.from('posts').insert(post);
      if (error) throw new Error(error.message);
      return post;
    },
    like: async (postId: string, userId: string): Promise<void> => {
        const { data: post } = await supabase.from('posts').select('likedBy').eq('id', postId).single();
        if (post) {
            const likedBy = post.likedBy || [];
            const newLikedBy = likedBy.includes(userId) 
                ? likedBy.filter((id: string) => id !== userId)
                : [...likedBy, userId];
            
            await supabase.from('posts').update({ likedBy: newLikedBy }).eq('id', postId);
        }
    },
    comment: async (postId: string, comment: Comment): Promise<void> => {
        const { data: post } = await supabase.from('posts').select('comments').eq('id', postId).single();
        if (post) {
            const comments = post.comments || [];
            await supabase.from('posts').update({ comments: [...comments, comment] }).eq('id', postId);
        }
    }
  },
  venues: {
      list: async (): Promise<Venue[]> => {
          const { data } = await supabase.from('venues').select('*');
          return data || [];
      }
  },
  volunteers: {
    apply: async (application: VolunteerApplication): Promise<VolunteerApplication> => {
        const { data } = await supabase.from('volunteers')
            .select('*')
            .eq('eventId', application.eventId)
            .eq('userId', application.userId);
            
        if (data && data.length > 0) throw new Error("Already applied");

        const { error } = await supabase.from('volunteers').insert(application);
        if (error) throw new Error(error.message);
        return application;
    },
    listByEvent: async (eventId: string): Promise<VolunteerApplication[]> => {
        const { data } = await supabase.from('volunteers').select('*').eq('eventId', eventId);
        return data || [];
    },
    listByUser: async (userId: string): Promise<VolunteerApplication[]> => {
        const { data } = await supabase.from('volunteers').select('*').eq('userId', userId);
        return data || [];
    },
    updateStatus: async (appId: string, status: VolunteerStatus): Promise<void> => {
        await supabase.from('volunteers').update({ status }).eq('id', appId);
    }
  },
  announcements: {
      list: async (clubId: string): Promise<Announcement[]> => {
          const { data } = await supabase.from('announcements')
            .select('*')
            .eq('clubId', clubId)
            .order('date', { ascending: false });
          return data || [];
      },
      create: async (announcement: Announcement): Promise<Announcement> => {
          await supabase.from('announcements').insert(announcement);
          return announcement;
      }
  },
  media: {
      list: async (clubId?: string): Promise<MediaPost[]> => {
          let query = supabase.from('media').select('*');
          if (clubId) {
              query = query.eq('clubId', clubId);
          }
          const { data } = await query;
          return data || [];
      },
      create: async (media: MediaPost): Promise<MediaPost> => {
          await supabase.from('media').insert(media);
          return media;
      },
      like: async (mediaId: string, userId: string): Promise<void> => {
          const { data: m } = await supabase.from('media').select('likedBy').eq('id', mediaId).single();
          if (m) {
              const likedBy = m.likedBy || [];
              const newLikedBy = likedBy.includes(userId) 
                  ? likedBy.filter((id: string) => id !== userId)
                  : [...likedBy, userId];
              
              await supabase.from('media').update({ likedBy: newLikedBy }).eq('id', mediaId);
          }
      },
      comment: async (mediaId: string, comment: Comment): Promise<void> => {
          const { data: m } = await supabase.from('media').select('comments').eq('id', mediaId).single();
          if (m) {
              const comments = m.comments || [];
              await supabase.from('media').update({ comments: [...comments, comment] }).eq('id', mediaId);
          }
      }
  }
};
