import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  AccountCircle,
  Notifications,
  Settings,
  MailOutline,
} from '@mui/icons-material';
import iconUth from '../assets/icon_uth.svg';
import { useAuth } from '../hooks/useAuth';
import { useGetInvitationsQuery } from '../redux/api/invitationsApi';

const Header = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, logout } = useAuth();
  const isLoggedIn = !!isAuthenticated;
  const userName = user?.fullName || user?.email || 'Người dùng';
  const userRole = user?.roles?.[0];
  const isReviewer = userRole === 'REVIEWER';
  let isAdmin = false;

  // Fetch invitations for reviewers
  const { data: invitationsData } = useGetInvitationsQuery(undefined, {
    skip: !isLoggedIn || !isReviewer,
  });

  const invitations = Array.isArray(invitationsData) ? invitationsData : [];
  const pendingInvitations = invitations.filter(
    (inv: any) => (inv.status || 'pending').toLowerCase() === 'pending'
  );
  const notificationCount = pendingInvitations.length;

  // Debug: Log để kiểm tra
  useEffect(() => {
    console.log('Header Debug:', {
      isLoggedIn,
      isReviewer,
      userRole,
      notificationCount,
      invitationsCount: invitations.length,
    });
  }, [isLoggedIn, isReviewer, userRole, notificationCount, invitations.length]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed', err);
      navigate('/login');
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationMenuOpen(false);
      }
    };

    if (userMenuOpen || notificationMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen, notificationMenuOpen]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Hôm nay';
      if (diffDays === 1) return 'Hôm qua';
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 flex-shrink-0">
            <img src={iconUth} alt="UTH Logo" className="h-10 w-auto" />
          </Link>

          {/* Spacer where nav used to be (kept empty on purpose) */}
          <div className="flex-1"></div>

          {/* Right Side - Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                {/* Notifications - Show bell for all, but dropdown only for reviewers */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => {
                      if (isReviewer) {
                        setNotificationMenuOpen(!notificationMenuOpen);
                      } else {
                        // For non-reviewers, navigate to a general notifications page or do nothing
                        navigate('/reviewer/invitations');
                      }
                    }}
                    className="p-2 text-gray-600 hover:text-[#008689] hover:bg-gray-100 rounded-full transition-colors duration-200 relative"
                  >
                    <Notifications className="w-6 h-6" />
                    {isReviewer && notificationCount > 0 && (
                      <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown - Only show for reviewers */}
                  {isReviewer && notificationMenuOpen && (
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-[#008689] to-[#006666]">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-bold text-lg">Thông báo</h3>
                          {notificationCount > 0 && (
                            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                              {notificationCount} mới
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="overflow-y-auto flex-1">
                        {pendingInvitations.length === 0 ? (
                          <div className="p-8 text-center">
                            <MailOutline className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Không có thông báo mới</p>
                            <p className="text-gray-400 text-sm mt-1">
                              Tất cả lời mời đã được xử lý
                            </p>
                          </div>
                        ) : (
                          <div className="py-2">
                            {pendingInvitations.slice(0, 5).map((invitation: any) => {
                              const invId = invitation.id || invitation.uuid || '';
                              const confName =
                                invitation.conferenceName ||
                                invitation.conference?.name ||
                                'Hội nghị';
                              const invDate = invitation.createdAt || invitation.invitationDate;

                              return (
                                <div
                                  key={invId}
                                  className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer transition-colors"
                                  onClick={() => {
                                    setNotificationMenuOpen(false);
                                    navigate('/reviewer/invitations');
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-[#008689]/10 rounded-lg flex-shrink-0">
                                      <MailOutline className="w-5 h-5 text-[#008689]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-gray-900 text-sm line-clamp-1">
                                        Lời mời tham gia: {confName}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(invDate)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      {pendingInvitations.length > 0 && (
                        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                          <button
                            onClick={() => {
                              setNotificationMenuOpen(false);
                              navigate('/reviewer/invitations');
                            }}
                            className="w-full text-center text-[#008689] font-semibold hover:text-[#006666] text-sm transition-colors"
                          >
                            Xem tất cả lời mời ({invitations.length})
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <AccountCircle className="w-8 h-8 text-[#008689]" />
                    <span className="text-gray-700 font-medium">
                      {userName}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-200 z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <AccountCircle className="w-5 h-5 inline mr-2" />
                        Xem thông tin tài khoản
                      </Link>
                      <Link
                        to="/change-password"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-5 h-5 inline mr-2" />
                        Đổi mật khẩu
                      </Link>

                      {isAdmin && (
                        <>
                          <hr className="my-2" />
                          <Link
                            to="/admin/users"
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            Quản lý người dùng
                          </Link>
                        </>
                      )}

                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-6 py-2 text-[#008689] font-semibold hover:text-[#006666] transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-[#008689] text-white font-semibold rounded-lg hover:bg-[#006666] transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-[#008689] hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            {mobileMenuOpen ? (
              <CloseIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <nav className="px-4 py-4 space-y-2">
            {isLoggedIn ? (
              <>
                {/* Mobile Notifications */}
                {isReviewer && (
                  <Link
                    to="/reviewer/invitations"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 relative"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Notifications className="w-5 h-5 inline mr-2" />
                    Lời mời{notificationCount > 0 && ` (${notificationCount})`}
                    {notificationCount > 0 && (
                      <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <AccountCircle className="w-5 h-5 inline mr-2" />
                  Xem thông tin tài khoản
                </Link>
                <Link
                  to="/change-password"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="w-5 h-5 inline mr-2" />
                  Đổi mật khẩu
                </Link>

                {isAdmin && (
                  <>
                    <hr className="my-2" />
                    <Link
                      to="/admin/users"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Quản lý người dùng
                    </Link>
                  </>
                )}

                <hr className="my-2" />
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <hr className="my-2" />
                <Link
                  to="/login"
                  className="block px-4 py-2 text-center text-[#008689] font-semibold hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 text-center bg-[#008689] text-white font-semibold rounded-lg hover:bg-[#006666] transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
