import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
}

export const Container = ({ children }: ContainerProps) => {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6">{children}</div>
  );
};
