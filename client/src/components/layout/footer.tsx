import React from 'react';

export function Footer() {
  return (
    <footer className="py-4 px-6 text-center border-t border-border mt-auto">
      <p className="text-sm text-muted-foreground">
        Copyright &copy; {new Date().getFullYear()} - Made by Ajay Farenziya
      </p>
    </footer>
  );
}