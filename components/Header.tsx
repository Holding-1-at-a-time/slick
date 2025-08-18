import React from 'react';
import { User } from '../types';
import { UserButton } from '@clerk/clerk-react';

interface HeaderProps {
    currentUser: User | null;
}

const Header: React.FC<HeaderProps> = ({ currentUser }) => {
    if (!currentUser) {
        return <header className="bg-gray-800 h-16 flex items-center justify-end px-8"></header>;
    }

    return (
        <header className="bg-gray-800 border-b border-gray-700 h-16 flex items-center justify-between px-6 flex-shrink-0">
             <div>
                {/* Future space for breadcrumbs or page titles */}
            </div>
            <div className="flex items-center space-x-4">
                <div className="text-right">
                    <span className="text-white font-semibold text-sm">{currentUser.name}</span>
                    <span className="text-xs text-gray-400 block capitalize">{currentUser.role}</span>
                </div>
                <UserButton afterSignOutUrl="/" />
            </div>
        </header>
    );
};

export default Header;