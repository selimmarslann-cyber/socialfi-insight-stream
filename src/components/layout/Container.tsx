import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
}

export const Container = ({ children }: ContainerProps) => {
  return <div className="mx-auto w-full max-w-6xl px-4 md:px-6">{children}</div>;
};
