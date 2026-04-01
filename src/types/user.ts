export type Role = 'admin' | 'approver' | 'adminuser';

export interface User {
  id: string; // usually username since it's unique
  username: string;
  password?: string; // used internally, rarely sent to client
  role: Role;
}
