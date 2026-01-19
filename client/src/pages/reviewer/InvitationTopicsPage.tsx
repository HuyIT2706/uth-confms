import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowBack, CheckCircle, Info, Add, Close } from '@mui/icons-material';
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

  const handleOtherToggle = (checked: boolean) => {
    setShowOtherInput(checked);
    if (!checked) {
      setOtherInput('');
    }
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
    
    if (finalTopics.length === 0) {
      showToast.warning('Vui lòng chọn ít nhất một chuyên đề');
      return;
    }

    setSubmitting(true);
    try {
      await updateTopics({ invitationId: id, topics: finalTopics }).unwrap();
      showToast.success('Đã lưu chuyên môn thành công');
      navigate('/reviewer/invitations');
    } catch (e) {
      console.error(e);
      showToast.error('Không thể lưu chuyên môn. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-[#008689] to-[#006666] py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="text-white/90 hover:text-white flex items-center gap-2 mb-6"
          >
            <ArrowBack className="w-5 h-5" />
            Quay lại
          </button>

          <h1 className="text-3xl font-bold text-white">Khai báo chuyên môn</h1>
          <p className="text-white/90 mt-2">
            Chọn chuyên đề bạn có thể đánh giá cho hội nghị này.
          </p>
        </div>
      </div>

      <div className="py-8 px-6">
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-md p-12 flex justify-center items-center">
              <CircularProgress />
            </div>
          ) : !invitation ? (
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-start gap-3 text-gray-700">
                <Info className="w-5 h-5 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-semibold">Không tìm thấy lời mời</p>
                  <p className="text-sm text-gray-600">
                    Vui lòng quay lại danh sách lời mời và chọn đúng hội nghị.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="mb-6">
                <p className="text-sm text-gray-600">Hội nghị</p>
                <p className="text-xl font-bold text-gray-900">
                  {invitation?.conferenceName ?? invitation?.conference?.name ?? 'N/A'}
                </p>
              </div>

              {/* Danh sách topics có sẵn */}
              {availableTopics.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Chọn từ danh sách:</p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableTopics.map((topic) => (
                      <label
                        key={topic}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(topic)}
                          onChange={(e) => toggle(topic, e.target.checked)}
                          className="w-5 h-5 rounded accent-[#008689]"
                        />
                        <span className="font-medium text-gray-900 flex-1">{topic}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom topics đã thêm */}
              {customTopics.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Chuyên đề tự nhập:</p>
                  <div className="space-y-2">
                    {customTopics.map((topic) => (
                      <div
                        key={topic}
                        className="flex items-center gap-3 p-3 bg-[#008689]/10 border border-[#008689]/30 rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(topic)}
                          onChange={(e) => toggle(topic, e.target.checked)}
                          className="w-5 h-5 rounded accent-[#008689]"
                        />
                        <span className="font-medium text-gray-900 flex-1">{topic}</span>
                        <button
                          onClick={() => removeCustomTopic(topic)}
                          className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                          title="Xóa chuyên đề này"
                        >
                          <Close className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ô "Khác" để nhập tự do */}
              <div className="mb-6">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={showOtherInput}
                    onChange={(e) => handleOtherToggle(e.target.checked)}
                    className="w-5 h-5 rounded accent-[#008689]"
                  />
                  <span className="font-medium text-gray-900">Khác</span>
                </label>

                {showOtherInput && (
                  <div className="mt-3 ml-8 flex gap-2">
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
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008689] focus:border-transparent"
                      maxLength={100}
                    />
                    <button
                      onClick={addCustomTopic}
                      className="px-4 py-2 bg-[#008689] text-white rounded-lg hover:bg-[#006666] transition-colors font-semibold flex items-center gap-2"
                    >
                      <Add className="w-5 h-5" />
                      Thêm
                    </button>
                  </div>
                )}
              </div>

              {/* Thông báo nếu không có topics nào */}
              {availableTopics.length === 0 && customTopics.length === 0 && !showOtherInput && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <Info className="w-5 h-5 text-blue-600 inline mr-2" />
                  <span className="text-blue-900">
                    Hội nghị này chưa cấu hình chuyên đề. Bạn có thể nhập chuyên đề của mình bằng cách chọn "Khác".
                  </span>
                </div>
              )}

              {/* Footer với số lượng đã chọn và nút lưu */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Đã chọn: <span className="font-semibold text-[#008689]">{selected.length}</span> chuyên đề
                </div>

                <button
                  onClick={onSubmit}
                  disabled={submitting || selected.length === 0}
                  className="px-6 py-2 bg-[#008689] text-white rounded-lg hover:bg-[#006666] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Lưu chuyên môn
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

