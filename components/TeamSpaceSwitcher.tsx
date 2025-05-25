"use client"

import React, { useState } from 'react';
import { ChevronDown, Plus, Users, User, Settings, Crown, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamSpace {
  id: string;
  name: string;
  avatar_url?: string;
  color_theme: string;
  member_count?: number;
  role: 'owner' | 'admin' | 'member';
  unread_count?: number;
  is_personal?: boolean;
}

interface TeamSpaceSwitcherProps {
  currentSpace: TeamSpace;
  teamSpaces: TeamSpace[];
  onSpaceChange: (space: TeamSpace) => void;
  onCreateTeam: () => void;
  onManageTeam: () => void;
}

export default function TeamSpaceSwitcher({
  currentSpace,
  teamSpaces,
  onSpaceChange,
  onCreateTeam,
  onManageTeam
}: TeamSpaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getColorTheme = (theme: string) => {
    const themes = {
      blue: 'bg-blue-500 border-blue-600',
      purple: 'bg-purple-500 border-purple-600',
      green: 'bg-green-500 border-green-600',
      orange: 'bg-orange-500 border-orange-600',
      pink: 'bg-pink-500 border-pink-600',
      indigo: 'bg-indigo-500 border-indigo-600',
    };
    return themes[theme] || themes.blue;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={12} className="text-yellow-500" />;
      case 'admin':
        return <Shield size={12} className="text-blue-500" />;
      default:
        return null;
    }
  };

  const SpaceAvatar = ({ space, size = 'md' }) => {
    const sizeClasses = {
      sm: 'w-6 h-6 text-xs',
      md: 'w-8 h-8 text-sm',
      lg: 'w-10 h-10 text-base'
    };

    const colorTheme = getColorTheme(space.color_theme);

    return (
      <div className={`${sizeClasses[size]} ${colorTheme} rounded-lg flex items-center justify-center text-white font-semibold border shadow-sm relative`}>
        {space.avatar_url ? (
          <img 
            src={space.avatar_url} 
            alt={space.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <span className="uppercase">
            {space.name.substring(0, 2)}
          </span>
        )}
        
        {space.is_personal && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full border border-gray-200 flex items-center justify-center">
            <User size={8} className="text-gray-600" />
          </div>
        )}
        
        {!space.is_personal && space.member_count && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full border border-gray-200 flex items-center justify-center">
            <Users size={8} className="text-gray-600" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-xs">
      {/* Current Team Space Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <SpaceAvatar space={currentSpace} size="md" />
        
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 text-sm truncate max-w-[140px]">
              {currentSpace.name}
            </span>
            {getRoleIcon(currentSpace.role)}
            {currentSpace.unread_count > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {currentSpace.unread_count > 99 ? '99+' : currentSpace.unread_count}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {currentSpace.is_personal ? 'Personal Space' : `${currentSpace.member_count} members`}
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} className="text-gray-400" />
        </motion.div>
      </button>

      {/* Team Space Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">Switch Team Space</h3>
              <p className="text-xs text-gray-500 mt-1">Choose your working environment</p>
            </div>

            {/* Team Space List */}
            <div className="max-h-80 overflow-y-auto">
              {/* Personal Space */}
              <div className="px-2 py-2">
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Personal
                </div>
                {teamSpaces
                  .filter(s => s.is_personal)
                  .map((space) => (
                    <motion.button
                      key={space.id}
                      onClick={() => {
                        onSpaceChange(space);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left ${
                        space.id === currentSpace.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <SpaceAvatar space={space} size="sm" />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 text-sm truncate">
                            {space.name}
                          </span>
                          {space.unread_count > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                              {space.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {space.id === currentSpace.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </motion.button>
                  ))}
              </div>

              {/* Team Spaces */}
              <div className="px-2 py-2 border-t border-gray-100">
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Team Spaces
                </div>
                {teamSpaces
                  .filter(s => !s.is_personal)
                  .map((space) => (
                    <motion.button
                      key={space.id}
                      onClick={() => {
                        onSpaceChange(space);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left ${
                        space.id === currentSpace.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <SpaceAvatar space={space} size="sm" />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 text-sm truncate">
                            {space.name}
                          </span>
                          {getRoleIcon(space.role)}
                          {space.unread_count > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                              {space.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {space.member_count} members
                        </div>
                      </div>
                      
                      {space.id === currentSpace.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </motion.button>
                  ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={() => {
                  onCreateTeam();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 text-left"
              >
                <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Plus size={14} className="text-gray-500" />
                </div>
                <span className="font-medium text-gray-700 text-sm">Create New Team</span>
              </button>
              
              <button
                onClick={() => {
                  onManageTeam();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 text-left"
              >
                <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Settings size={14} className="text-gray-500" />
                </div>
                <span className="font-medium text-gray-700 text-sm">Manage Teams</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}