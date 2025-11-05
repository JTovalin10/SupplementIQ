// Layout for user-related pages

import { ReactNode } from "react";

interface UserLayoutProps {
  children: ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <div>
      <main>{children}</main>
    </div>
  );
}
