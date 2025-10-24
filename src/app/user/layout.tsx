// Layout for user-related pages
// TODO: Implement user layout with profile navigation

import { ReactNode } from 'react';

interface UserLayoutProps {
  children: ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <div>
      <nav>
        <h2>User Navigation</h2>
      </nav>
      <main>{children}</main>
    </div>
  );
}
