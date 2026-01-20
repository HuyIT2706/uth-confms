import { useNavigate } from 'react-router-dom';
import { ArrowBack, AssignmentInd } from '@mui/icons-material';
import { useGetMyReviewerAssignmentsQuery } from '../../redux/api/assignmentsApi';
import { useGetInvitationsQuery } from '../../redux/api/invitationsApi';
import { CircularProgress } from '@mui/material';

const SubmissionsOverviewPage = () => {
    const navigate = useNavigate();
    const { data: assignmentsData, isLoading: assignmentsLoading } = useGetMyReviewerAssignmentsQuery();
    const { data: invitationsData, isLoading: invitationsLoading } = useGetInvitationsQuery();

    // Parse invitations to get conference info
    const invitationsMap: Record<string, { conferenceName: string; acronym?: string }> = {};
    if (Array.isArray(invitationsData)) {
        invitationsData.forEach((item: any) => {
            const confId = item.conferenceId || item.conference?.id || '';
            if (confId && !invitationsMap[confId]) {
                invitationsMap[confId] = {
                    conferenceName: item.conferenceName || item.conference?.name || 'Unknown Conference',
                    acronym: item.acronym || item.conference?.acronym,
                };
            }
        });
    }

    // Get accepted assignments
    const acceptedAssignments = Array.isArray(assignmentsData)
        ? assignmentsData.filter((item: any) => (item.status || 'PENDING').toUpperCase() === 'ACCEPTED')
        : [];

    // Get unique conferences from accepted assignments
    const uniqueConferences = Array.from(
        new Map(
            acceptedAssignments.map((assignment: any) => {
                const confId = assignment.conferenceId || '';
                const confInfo = invitationsMap[confId] || {};
                return [
                    confId,
                    {
                        id: confId,
                        name: confInfo.conferenceName || 'Unknown Conference',
                        acronym: confInfo.acronym,
                    },
                ];
            })
        ).values()
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-[#008689] to-[#006666] py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate('/reviewer/dashboard')}
                        className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowBack className="w-5 h-5" />
                        Quay lại
                    </button>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Danh sách bài được giao
                    </h1>
                    <p className="text-white/90">
                        Chọn một hội nghị để xem danh sách bài nộp
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    {assignmentsLoading || invitationsLoading ? (
                        <div className="bg-white rounded-xl shadow-md p-12 flex justify-center items-center min-h-96">
                            <CircularProgress />
                        </div>
                    ) : uniqueConferences.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-md p-12 text-center">
                            <AssignmentInd className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Chưa có hội nghị nào
                            </h3>
                            <p className="text-gray-600">
                                Bạn cần chấp nhận lời mời phân công trước tiên
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {uniqueConferences.map((conference: any) => (
                                <button
                                    key={conference.id}
                                    onClick={() => navigate(`/reviewer/submissions/${conference.id}`)}
                                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-[#008689] cursor-pointer group overflow-hidden text-left"
                                >
                                    {/* Header */}
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-3 bg-[#008689]/10 rounded-lg group-hover:bg-[#008689]/20 transition-colors">
                                                <AssignmentInd className="w-6 h-6 text-[#008689]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#008689] transition-colors truncate">
                                                    {conference.name}
                                                </h3>
                                                {conference.acronym && (
                                                    <p className="text-sm text-gray-600">
                                                        {conference.acronym}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {acceptedAssignments.filter((a: any) => a.conferenceId === conference.id).length} bài báo được giao
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 group-hover:bg-[#008689]/5 transition-colors">
                                        <span className="text-[#008689] font-semibold text-sm">
                                            Xem danh sách bài →
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubmissionsOverviewPage;
