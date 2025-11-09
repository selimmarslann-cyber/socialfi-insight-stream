import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
}

export const Container = ({ children }: ContainerProps) => {
  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-[1280px]">
      {children}
    </div>
  );
};
