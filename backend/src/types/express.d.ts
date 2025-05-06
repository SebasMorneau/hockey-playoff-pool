import 'express';

declare global {
  namespace Express {
    // Use RequestUser type to ensure consistency
    interface User {
      userId: number;
      email: string;
      isAdmin: boolean;
    }
    
    interface Request {
      user?: User;
      requestId?: string;
    }
  }
}

export {};
