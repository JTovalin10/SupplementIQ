import { ReactNode } from 'react';

interface ProductDescriptionLayoutProps {
  children: ReactNode;
}

export default function ProductDescriptionLayout({ children }: ProductDescriptionLayoutProps) {
  return (
    <div className="product-description-layout">
      {children}
    </div>
  );
}

