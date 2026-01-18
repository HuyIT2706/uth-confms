<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
=======
import { useState, useEffect } from 'react';
>>>>>>> cf16a6cc6c98b98d1da4aaaf8714e5eb945ece37
import AuthorDashboard from './AuthorDashboard';
import ChairDashboard from './ChairDashboard';
import AdminDashboard from './AdminDashboard';
import { tokenUtils } from '../../utils/token';

type UserRole = 'AUTHOR' | 'CHAIR' | 'REVIEWER' | 'ADMIN';

const HomePage = () => {
    const [currentRole, setCurrentRole] = useState<UserRole>('AUTHOR');
<<<<<<< HEAD
    const { user } = useAuth();

    useEffect(() => {
        if (!user) return;
        const rolesInput: unknown = user.roles;
        let roles: string[] = [];
        if (Array.isArray(rolesInput)) {
            roles = rolesInput.map((r) => (typeof r === 'string' ? r : r?.name ?? r?.role ?? r?.value)).filter(Boolean).map((s) => s!.toString().toUpperCase());
        } else if (typeof rolesInput === 'string') {
            roles = [rolesInput.toUpperCase()];
        }

        if (roles.includes('ADMIN')) setCurrentRole('ADMIN');
        else if (roles.includes('CHAIR')) setCurrentRole('CHAIR');
        else if (roles.includes('REVIEWER')) setCurrentRole('REVIEWER');
        else setCurrentRole('AUTHOR');
    }, [user]);
=======
    const [isTestMode, setIsTestMode] = useState(false);

    // Lấy role từ JWT token khi component mount
    useEffect(() => {
        const roleFromToken = tokenUtils.getUserRole();
        if (roleFromToken) {
            // Có token thực, sử dụng role từ token
            setCurrentRole(roleFromToken as UserRole);
            setIsTestMode(false);
        } else {
            // Không có token, bật test mode
            setIsTestMode(true);
        }
    }, []);
>>>>>>> cf16a6cc6c98b98d1da4aaaf8714e5eb945ece37

    const renderDashboard = () => {
        switch (currentRole) {
            case 'AUTHOR':
                return <AuthorDashboard />;
            case 'CHAIR':
                return <ChairDashboard currentRole={currentRole} />;
            case 'REVIEWER':
                // TODO: Create ReviewerDashboard
                return <AuthorDashboard />;
            case 'ADMIN':
                return <AdminDashboard />;
            default:
                return <AuthorDashboard />;
        }
    };

    return (
        <div>
<<<<<<< HEAD
=======
            {/* Temporary Role Switcher - Only show in test mode */}
            {isTestMode && (
                <div className="bg-yellow-50 border-b border-yellow-200 py-3 px-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-yellow-800">
                                🔧 Testing Mode - Role Switcher:
                            </span>
                            <select
                                value={currentRole}
                                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                                className="px-4 py-2 border border-yellow-300 rounded-lg bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#008689]"
                            >
                                <option value="AUTHOR">Author</option>
                                <option value="CHAIR">Chair</option>
                                <option value="REVIEWER">Reviewer</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <span className="text-xs text-yellow-700">
                            This will be removed when authentication is enabled
                        </span>
                    </div>
                </div>
            )}

>>>>>>> cf16a6cc6c98b98d1da4aaaf8714e5eb945ece37
            {/* Render appropriate dashboard */}
            {renderDashboard()}
        </div>
    );
};

export default HomePage;
