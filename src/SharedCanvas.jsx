import React from 'react';
import { SharedWhiteboard } from './components/SharedWhiteboard';

export const SharedCanvas = ({ 
  strokes = [], 
  notes = [], 
  currentUser,
  sessionId,
  onAddStroke, 
  onAddNote, 
  onClearCanvas,
  onUndo,
  onRedo,
  isReadOnly = false,
  participants = []
}) => {
  return (
    <SharedWhiteboard
      strokes={strokes}
      notes={notes}
      currentUser={currentUser}
      onAddStroke={onAddStroke}
      onAddNote={onAddNote}
      onClearCanvas={onClearCanvas}
      onUndo={onUndo}
      onRedo={onRedo}
      isReadOnly={isReadOnly}
      className="w-full h-full"
      height={500}
    />
  );
};