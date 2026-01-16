import { useState, useEffect } from 'react';
import AuthorDashboard from './AuthorDashboard';
import ChairDashboard from './ChairDashboard';
import AdminDashboard from './AdminDashboard';
import { tokenUtils } from '../../utils/token';

type UserRole = 'AUTHOR' | 'CHAIR' | 'REVIEWER' | 'ADMIN';

const HomePage = () => {
    const [currentRole, setCurrentRole] = useState<UserRole>('AUTHOR');
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

    // Render dashboard based on role
    const renderDashboard = () => {
        switch (currentRole) {
            case 'AUTHOR':
                return <AuthorDashboard />;
            case 'CHAIR':
                return <ChairDashboard />;
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

            {/* Render appropriate dashboard */}
            {renderDashboard()}
        </div>
    );
};

export default HomePage;
