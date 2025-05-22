// Test file to verify DialogContent accessibility fix
import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from './components/ui/dialog';

export function TestDialog() {
  return (
    <Dialog>
      <DialogTrigger>Open Dialog</DialogTrigger>
      <DialogContent>
        {/* This DialogContent now has both hidden Title and Description for accessibility */}
        <p>This dialog should not show the accessibility warning anymore.</p>
      </DialogContent>
    </Dialog>
  );
}