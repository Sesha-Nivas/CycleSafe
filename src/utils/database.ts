// Simulated database using localStorage

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  profilePhoto?: string;
  totalRides: number;
  totalDistance: number; // km
  totalDuration: number; // minutes
  totalCalories: number;
  avgSpeed: number;
  badges: number;
  safetyScore: number;
  achievements: {
    centuryRider: number;
    weekWarrior: number;
    speedDemon: number;
    distanceMaster: number;
  };
  createdAt: string;
}

export interface Ride {
  id: string;
  userId: string;
  distance: number;
  duration: number;
  avgSpeed: number;
  calories: number;
  safetyScore: number;
  route: {
    start: { lat: number; lng: number; address: string };
    end: { lat: number; lng: number; address: string };
    estimatedTime: number;
    elevation: number;
    safetyRating: string;
    totalDistance?: number;
  };
  timestamp: string;
}

class Database {
  private getUsersKey = 'cyclesafe_users';
  private getRidesKey = 'cyclesafe_rides';
  private getCurrentUserKey = 'cyclesafe_current_user';

  // User operations
  getAllUsers(): User[] {
    const users = localStorage.getItem(this.getUsersKey);
    return users ? JSON.parse(users) : [];
  }

  saveUsers(users: User[]) {
    localStorage.setItem(this.getUsersKey, JSON.stringify(users));
  }

  getUserByEmail(email: string): User | null {
    const users = this.getAllUsers();
    return users.find(u => u.email === email) || null;
  }

  getUserById(id: string): User | null {
    const users = this.getAllUsers();
    return users.find(u => u.id === id) || null;
  }

  createUser(email: string, password: string, name: string): User {
    const users = this.getAllUsers();
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      password,
      totalRides: 0,
      totalDistance: 0,
      totalDuration: 0,
      totalCalories: 0,
      avgSpeed: 0,
      badges: 0,
      safetyScore: 100,
      achievements: {
        centuryRider: 0,
        weekWarrior: 0,
        speedDemon: 0,
        distanceMaster: 0,
      },
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  updateUser(userId: string, updates: Partial<User>) {
    const users = this.getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      this.saveUsers(users);
      
      // Keep currentUser cache in sync if this is the logged-in user
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        this.setCurrentUser(users[index]);
      }
      
      // Notify components that user data has been updated
      window.dispatchEvent(new Event('userDataUpdated'));
      
      return users[index];
    }
    return null;
  }

  // Current user operations
  setCurrentUser(user: User) {
    localStorage.setItem(this.getCurrentUserKey, JSON.stringify(user));
    // Notify components of the change
    window.dispatchEvent(new Event('userDataUpdated'));
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem(this.getCurrentUserKey);
    return user ? JSON.parse(user) : null;
  }

  clearCurrentUser() {
    localStorage.removeItem(this.getCurrentUserKey);
  }

  // Ride operations
  getAllRides(): Ride[] {
    const rides = localStorage.getItem(this.getRidesKey);
    return rides ? JSON.parse(rides) : [];
  }

  saveRides(rides: Ride[]) {
    localStorage.setItem(this.getRidesKey, JSON.stringify(rides));
    // Notify components that ride data has been updated
    window.dispatchEvent(new Event('userDataUpdated'));
  }

  getUserRides(userId: string): Ride[] {
    const rides = this.getAllRides();
    return rides.filter(r => r.userId === userId);
  }

  addRide(ride: Omit<Ride, 'id' | 'timestamp'>): Ride {
    const rides = this.getAllRides();
    const newRide: Ride = {
      ...ride,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    rides.push(newRide);
    this.saveRides(rides);

    // Update user stats
    this.updateUserAfterRide(ride.userId, newRide);

    return newRide;
  }

  private updateUserAfterRide(userId: string, ride: Ride) {
    const user = this.getUserById(userId);
    if (!user) return;

    const userRides = this.getUserRides(userId);
    const totalRides = userRides.length;
    const totalDistance = userRides.reduce((sum, r) => sum + r.distance, 0);
    const totalDuration = userRides.reduce((sum, r) => sum + r.duration, 0);
    const totalCalories = userRides.reduce((sum, r) => sum + r.calories, 0);
    const avgSpeed = userRides.length > 0
      ? userRides.reduce((sum, r) => sum + r.avgSpeed, 0) / userRides.length
      : 0;

    // Calculate safety score (average of all rides)
    const safetyScore = userRides.length > 0
      ? Math.round(userRides.reduce((sum, r) => sum + r.safetyScore, 0) / userRides.length)
      : 100;

    // Calculate badges based on achievements
    let badges = user.badges;

    // Calculate achievements
    const centuryRider = Math.min(100, Math.round((totalDistance / 100) * 100));
    const weekWarrior = this.calculateWeekWarrior(userRides);
    const speedDemon = Math.min(100, Math.round((avgSpeed / 30) * 100));
    const distanceMaster = this.calculateDistanceMaster(userRides);

    // Award badges for completed achievements
    if (centuryRider === 100 && user.achievements.centuryRider < 100) badges++;
    if (weekWarrior === 100 && user.achievements.weekWarrior < 100) badges++;
    if (speedDemon === 100 && user.achievements.speedDemon < 100) badges++;
    if (distanceMaster === 100 && user.achievements.distanceMaster < 100) badges++;

    this.updateUser(userId, {
      totalRides,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalDuration,
      totalCalories,
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      badges,
      safetyScore,
      achievements: {
        centuryRider,
        weekWarrior,
        speedDemon,
        distanceMaster,
      },
    });
  }

  private calculateWeekWarrior(rides: Ride[]): number {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const ridesThisWeek = rides.filter(r => new Date(r.timestamp) > weekAgo);
    return Math.min(100, Math.round((ridesThisWeek.length / 5) * 100));
  }

  private calculateDistanceMaster(rides: Ride[]): number {
    const maxDistance = Math.max(...rides.map(r => r.distance), 0);
    return Math.min(100, Math.round((maxDistance / 50) * 100));
  }

  // Leaderboard
  getLeaderboard(): Array<{ user: User; rank: number }> {
    const users = this.getAllUsers();
    const sorted = users
      .filter(u => u.totalRides > 0)
      .sort((a, b) => b.safetyScore - a.safetyScore || b.totalDistance - a.totalDistance);

    return sorted.map((user, index) => ({
      user,
      rank: index + 1,
    }));
  }
}

export const db = new Database();