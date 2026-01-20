import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowBack, CheckCircle, Info, Add, Close, Edit, School } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { useGetInvitationsQuery, useUpdateInvitationTopicsMutation } from '../../redux/api/invitationsApi';
import { showToast } from '../../utils/toast';

// Danh sách lĩnh vực phổ biến
const COMMON_TOPICS = [
  'AI',
  'Machine Learning',
  'Deep Learning',
  'Computer Vision',
  'Natural Language Processing',
  'Data Science',
  'Big Data',
  'Cloud Computing',
  'Cybersecurity',
  'Blockchain',
  'Internet of Things',
  'Software Engineering',
  'Database Systems',
  'Distributed Systems',
  'Human-Computer Interaction',
  'Information Retrieval',
  'Knowledge Management',
  'Mobile Computing',
  'Network Security',
  'Robotics',
  'Web Technologies',
  'Algorithms',
  'Data Mining',
  'Information Systems',
];

export default function InvitationTopicsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetInvitationsQuery();
  const [updateTopics] = useUpdateInvitationTopicsMutation();

  const invitation = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return list.find((x: any) => String(x?.id ?? x?.uuid ?? '') === String(id ?? ''));
  }, [data, id]);

  // Topics từ conference
  const conferenceTopics: string[] = useMemo(() => {
    const rawTopics =
      invitation?.topics ??
      invitation?.conference?.topics ??
      invitation?.raw?.conference?.topics ??
      [];
    return Array.isArray(rawTopics) ? rawTopics.map((t: any) => String(t).trim()).filter(Boolean) : [];
  }, [invitation]);

  // Tất cả topics có sẵn (conference + common topics, loại bỏ trùng)
  const availableTopics: string[] = useMemo(() => {
    const all = [...new Set([...conferenceTopics, ...COMMON_TOPICS])];
    return all.sort();
  }, [conferenceTopics]);

  const initialSelected = useMemo(() => {
    const rt = invitation?.reviewerTopics;
    return Array.isArray(rt) ? rt.map((t: any) => String(t).trim()).filter(Boolean) : [];
  }, [invitation]);

  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [submitting, setSubmitting] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherInput, setOtherInput] = useState('');
  const [customTopics, setCustomTopics] = useState<string[]>([]);

  // Khởi tạo custom topics từ initialSelected (những topics không có trong availableTopics)
  useEffect(() => {
    const custom = initialSelected.filter((t) => !availableTopics.includes(t));
    setCustomTopics(custom);
    // Nếu có custom topics và chưa được chọn, thêm vào selected
    if (custom.length > 0) {
      setSelected((prev) => {
        const combined = [...new Set([...prev, ...custom])];
        return combined;
      });
    }
  }, [initialSelected, availableTopics]);

  const toggle = (topic: string, checked: boolean) => {
    setSelected((prev) => {
      if (checked) return Array.from(new Set([...prev, topic]));
      return prev.filter((t) => t !== topic);
    });
  };
  const addCustomTopic = () => {
    const trimmed = otherInput.trim();
    
    // Validation
    if (!trimmed) {
      showToast.warning('Vui lòng nhập tên chuyên đề');
      return;
    }

    if (trimmed.length < 2) {
      showToast.warning('Tên chuyên đề phải có ít nhất 2 ký tự');
      return;
    }

    if (trimmed.length > 100) {
      showToast.warning('Tên chuyên đề không được vượt quá 100 ký tự');
      return;
    }

    // Kiểm tra trùng với topics có sẵn
    if (availableTopics.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      showToast.warning('Chuyên đề này đã có trong danh sách');
      return;
    }

    // Kiểm tra trùng với custom topics đã thêm
    if (customTopics.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      showToast.warning('Chuyên đề này đã được thêm');
      return;
    }

    // Thêm vào custom topics và selected
    const newCustom = [...customTopics, trimmed];
    setCustomTopics(newCustom);
    setSelected((prev) => Array.from(new Set([...prev, trimmed])));
    setOtherInput('');
    setShowOtherInput(false);
    showToast.success('Đã thêm chuyên đề');
  };

  const removeCustomTopic = (topic: string) => {
    setCustomTopics((prev) => prev.filter((t) => t !== topic));
    setSelected((prev) => prev.filter((t) => t !== topic));
  };

  const onSubmit = async () => {
    if (!id) return;
    
    const finalTopics = selected.filter(Boolean);
    
    // Khai báo chuyên môn là optional - có thể không chọn hoặc chọn đều được
    setSubmitting(true);
    try {
      await updateTopics({ invitationId: id, topics: finalTopics }).unwrap();
      if (finalTopics.length === 0) {
        showToast.success('Đã lưu (không khai báo chuyên môn)');
      } else {
        showToast.success('Đã lưu chuyên môn thành công');
      }
      // Navigate về tab "accepted" sau khi lưu thành công
      navigate('/reviewer/invitations?tab=accepted');
    } catch (e) {
      console.error(e);
      showToast.error('Không thể lưu chuyên môn. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#008689] via-[#007a7d] to-[#006666] shadow-lg">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate(-1)}
            className="text-white/90 hover:text-white flex items-center gap-2 mb-6 transition-colors group"
          >
            <ArrowBack className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Quay lại</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <School className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Khai báo chuyên môn</h1>
              <p className="text-white/90 text-sm">
                Chọn các lĩnh vực bạn có thể đánh giá cho hội nghị này (tùy chọn)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-xl p-16 flex justify-center items-center">
            <CircularProgress />
          </div>
        ) : !invitation ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-start gap-4 text-gray-700">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-lg mb-1">Không tìm thấy lời mời</p>
                <p className="text-sm text-gray-600">
                  Vui lòng quay lại danh sách lời mời và chọn đúng hội nghị.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Conference Info Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-[#008689]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#008689]/10 rounded-lg">
                  <Info className="w-5 h-5 text-[#008689]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Hội nghị</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {invitation?.conferenceName ?? invitation?.conference?.name ?? 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Topics Selection Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              {/* Available Topics */}
              {availableTopics.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#008689] to-[#006666] rounded-full"></div>
                    <h2 className="text-lg font-bold text-gray-900">Chọn từ danh sách</h2>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {availableTopics.length} lĩnh vực
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto p-2">
                    {availableTopics.map((topic) => {
                      const isSelected = selected.includes(topic);
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => toggle(topic, !isSelected)}
                          className={`group relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#008689] to-[#006666] text-white shadow-md shadow-[#008689]/30 scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                          }`}
                        >
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 absolute -top-1 -right-1 bg-white text-[#008689] rounded-full" />
                          )}
                          <span>{topic}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Topics */}
              {customTopics.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                    <h2 className="text-lg font-bold text-gray-900">Chuyên đề tự nhập</h2>
                    <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                      {customTopics.length} chuyên đề
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {customTopics.map((topic) => {
                      const isSelected = selected.includes(topic);
                      return (
                        <div
                          key={topic}
                          className={`group relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/30'
                              : 'bg-purple-50 text-purple-700 border-2 border-purple-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggle(topic, !isSelected)}
                              className="flex items-center gap-2"
                            >
                              {isSelected && (
                                <CheckCircle className="w-4 h-4 text-white" />
                              )}
                              <span>{topic}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCustomTopic(topic)}
                              className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                              title="Xóa"
                            >
                              <Close className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add Custom Topic */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full"></div>
                  <h2 className="text-lg font-bold text-gray-900">Thêm chuyên đề khác</h2>
                </div>
                
                {!showOtherInput ? (
                  <button
                    type="button"
                    onClick={() => setShowOtherInput(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#008689] hover:bg-[#008689]/5 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-2 bg-[#008689]/10 rounded-lg group-hover:bg-[#008689]/20 transition-colors">
                        <Add className="w-5 h-5 text-[#008689]" />
                      </div>
                      <span className="text-gray-600 font-medium group-hover:text-[#008689]">
                        Nhấn để thêm chuyên đề mới
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <Edit className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={otherInput}
                          onChange={(e) => setOtherInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomTopic();
                            }
                          }}
                          placeholder="Nhập tên chuyên đề..."
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-[#008689] transition-all"
                          maxLength={100}
                          autoFocus
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addCustomTopic}
                        className="px-6 py-3 bg-gradient-to-r from-[#008689] to-[#006666] text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold flex items-center gap-2"
                      >
                        <Add className="w-5 h-5" />
                        Thêm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowOtherInput(false);
                          setOtherInput('');
                        }}
                        className="px-4 py-3 border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 px-1">
                      Nhấn Enter để thêm nhanh • Tối đa 100 ký tự
                    </p>
                  </div>
                )}
              </div>

              {/* Empty State */}
              {availableTopics.length === 0 && customTopics.length === 0 && !showOtherInput && (
                <div className="bg-blue-50 border-l-4 border-blue-400 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-blue-900 font-medium text-sm">
                        Hội nghị này chưa cấu hình chuyên đề.
                      </p>
                      <p className="text-blue-700 text-xs mt-1">
                        Bạn có thể nhập chuyên đề của mình bằng cách nhấn nút "Thêm chuyên đề khác" ở trên.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky bottom-0 border-t-2 border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-xl font-semibold ${
                    selected.length > 0
                      ? 'bg-gradient-to-r from-[#008689] to-[#006666] text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {selected.length}
                  </div>
                  <span className="text-gray-600 font-medium">
                    {selected.length === 0 
                      ? 'Chưa chọn chuyên đề (tùy chọn)' 
                      : selected.length === 1 
                        ? 'chuyên đề đã chọn' 
                        : 'chuyên đề đã chọn'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={submitting}
                  className="px-8 py-3 bg-gradient-to-r from-[#008689] to-[#006666] text-white rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Lưu chuyên môn</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

