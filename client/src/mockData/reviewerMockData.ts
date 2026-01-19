/**
 * Mock Data for Reviewer Pages
 * Dữ liệu mẫu cho các trang reviewer service
 */

// ============================================================================
// ASSIGNMENTS - Các bài báo cần review
// ============================================================================
export const mockAssignments = [
    {
        id: 'assign-001',
        uuid: 'uuid-assign-001',
        submissionId: 'sub-001',
        submissionTitle: 'Deep Learning for Natural Language Processing: A Comprehensive Survey',
        submission: {
            id: 'sub-001',
            title: 'Deep Learning for Natural Language Processing: A Comprehensive Survey',
            abstract: 'This paper provides a comprehensive survey of deep learning techniques applied to natural language processing tasks. We review recent advances in neural architectures including transformers, attention mechanisms, and pre-trained language models. The survey covers applications in machine translation, sentiment analysis, question answering, and named entity recognition. We discuss challenges and future directions in the field.',
            authors: 'John Smith, Jane Doe, Robert Johnson, Emily Chen',
            keywords: 'Natural Language Processing, Deep Learning, Transformers, Neural Networks, BERT, GPT',
        },
        conferenceId: 'conf-001',
        conferenceName: 'International Conference on Machine Learning (ICML 2026)',
        conference: {
            id: 'conf-001',
            name: 'International Conference on Machine Learning (ICML 2026)',
            acronym: 'ICML',
        },
        status: 'PENDING',
        deadline: '2026-02-15T23:59:59Z',
    },
    {
        id: 'assign-002',
        uuid: 'uuid-assign-002',
        submissionId: 'sub-002',
        submissionTitle: 'Efficient Attention Mechanisms for Vision Transformers',
        submission: {
            id: 'sub-002',
            title: 'Efficient Attention Mechanisms for Vision Transformers',
            abstract: 'Vision Transformers have shown remarkable performance in computer vision tasks, but their computational complexity remains a challenge. This work proposes novel efficient attention mechanisms that reduce computational cost while maintaining model performance. We evaluate our approach on image classification, object detection, and semantic segmentation tasks.',
            authors: 'Maria Garcia, Carlos Rodriguez, Sofia Martinez',
            keywords: 'Vision Transformers, Attention Mechanisms, Computer Vision, Efficient Deep Learning',
        },
        conferenceId: 'conf-002',
        conferenceName: 'IEEE/CVF Computer Vision and Pattern Recognition (CVPR 2026)',
        conference: {
            id: 'conf-002',
            name: 'IEEE/CVF Computer Vision and Pattern Recognition (CVPR 2026)',
            acronym: 'CVPR',
        },
        status: 'ACCEPTED',
        deadline: '2026-02-20T23:59:59Z',
    },
    {
        id: 'assign-003',
        uuid: 'uuid-assign-003',
        submissionId: 'sub-003',
        submissionTitle: 'Federated Learning for Privacy-Preserving Machine Learning',
        submission: {
            id: 'sub-003',
            title: 'Federated Learning for Privacy-Preserving Machine Learning',
            abstract: 'Federated learning enables training machine learning models on decentralized data without centralizing sensitive information. We present a novel federated learning framework with differential privacy guarantees. Our approach is evaluated on real-world datasets from healthcare and financial domains.',
            authors: 'Alex Wang, Lisa Park, Michael Zhang, Rachel White',
            keywords: 'Federated Learning, Privacy, Machine Learning, Distributed Systems, Differential Privacy',
        },
        conferenceId: 'conf-003',
        conferenceName: 'Neural Information Processing Systems (NeurIPS 2026)',
        conference: {
            id: 'conf-003',
            name: 'Neural Information Processing Systems (NeurIPS 2026)',
            acronym: 'NeurIPS',
        },
        status: 'PENDING',
        deadline: '2026-02-10T23:59:59Z',
    },
    {
        id: 'assign-004',
        uuid: 'uuid-assign-004',
        submissionId: 'sub-004',
        submissionTitle: 'Graph Neural Networks for Knowledge Graph Completion',
        submission: {
            id: 'sub-004',
            title: 'Graph Neural Networks for Knowledge Graph Completion',
            abstract: 'Knowledge graphs are fundamental in many AI applications, but they are often incomplete. We propose a novel graph neural network approach for knowledge graph completion that leverages relational structure and entity attributes. Experimental results on standard benchmarks demonstrate state-of-the-art performance.',
            authors: 'Nguyen Tuan Anh, Pham Thi Minh, Tran Van Hoang',
            keywords: 'Graph Neural Networks, Knowledge Graphs, Link Prediction, Semantic Web',
        },
        conferenceId: 'conf-004',
        conferenceName: 'International Conference on Learning Representations (ICLR 2026)',
        conference: {
            id: 'conf-004',
            name: 'International Conference on Learning Representations (ICLR 2026)',
            acronym: 'ICLR',
        },
        status: 'ACCEPTED',
        deadline: '2026-03-01T23:59:59Z',
    },
    {
        id: 'assign-005',
        uuid: 'uuid-assign-005',
        submissionId: 'sub-005',
        submissionTitle: 'Multimodal Learning: Fusion of Vision and Language Models',
        submission: {
            id: 'sub-005',
            title: 'Multimodal Learning: Fusion of Vision and Language Models',
            abstract: 'Combining vision and language models has shown great promise for various multimodal tasks. We introduce a novel fusion mechanism that effectively integrates visual and textual information. Our approach is evaluated on image captioning, visual question answering, and scene understanding tasks.',
            authors: 'Lisa Anderson, David Brown, Jennifer Davis, Thomas Anderson',
            keywords: 'Multimodal Learning, Vision-Language Models, Image-Text Understanding, Fusion',
        },
        conferenceId: 'conf-001',
        conferenceName: 'International Conference on Machine Learning (ICML 2026)',
        conference: {
            id: 'conf-001',
            name: 'International Conference on Machine Learning (ICML 2026)',
            acronym: 'ICML',
        },
        status: 'PENDING',
        deadline: '2026-02-25T23:59:59Z',
    },
    {
        id: 'assign-006',
        uuid: 'uuid-assign-006',
        submissionId: 'sub-006',
        submissionTitle: 'Self-Supervised Learning in Computer Vision: A Review',
        submission: {
            id: 'sub-006',
            title: 'Self-Supervised Learning in Computer Vision: A Review',
            abstract: 'Self-supervised learning has become a powerful paradigm for learning representations from unlabeled data. This review surveys recent advances in self-supervised learning methods for computer vision, including contrastive learning, masked image modeling, and clustering-based approaches.',
            authors: 'James Wilson, Patricia Taylor, Christopher Lee',
            keywords: 'Self-Supervised Learning, Computer Vision, Representation Learning, Contrastive Learning',
        },
        conferenceId: 'conf-002',
        conferenceName: 'IEEE/CVF Computer Vision and Pattern Recognition (CVPR 2026)',
        conference: {
            id: 'conf-002',
            name: 'IEEE/CVF Computer Vision and Pattern Recognition (CVPR 2026)',
            acronym: 'CVPR',
        },
        status: 'ACCEPTED',
        deadline: '2026-02-18T23:59:59Z',
    },
];

// ============================================================================
// INVITATIONS - Lời mời từ các hội nghị
// ============================================================================
export const mockInvitations = [
    {
        id: 'inv-001',
        uuid: 'uuid-inv-001',
        conferenceId: 'conf-001',
        conferenceName: 'International Conference on Machine Learning (ICML 2026)',
        conference: {
            id: 'conf-001',
            name: 'International Conference on Machine Learning (ICML 2026)',
            acronym: 'ICML',
            startDate: '2026-07-01',
            endDate: '2026-07-09',
        },
        status: 'PENDING',
        invitationDate: '2026-01-05T10:30:00Z',
        responseDate: null,
        topics: [
            { id: 'topic-001', name: 'Deep Learning' },
            { id: 'topic-002', name: 'Natural Language Processing' },
            { id: 'topic-003', name: 'Computer Vision' },
            { id: 'topic-004', name: 'Reinforcement Learning' },
            { id: 'topic-005', name: 'Generative Models' },
        ],
        selectedTopics: [],
    },
    {
        id: 'inv-002',
        uuid: 'uuid-inv-002',
        conferenceId: 'conf-002',
        conferenceName: 'IEEE/CVF Computer Vision and Pattern Recognition (CVPR 2026)',
        conference: {
            id: 'conf-002',
            name: 'IEEE/CVF Computer Vision and Pattern Recognition (CVPR 2026)',
            acronym: 'CVPR',
            startDate: '2026-06-17',
            endDate: '2026-06-24',
        },
        status: 'ACCEPTED',
        invitationDate: '2025-12-20T14:15:00Z',
        responseDate: '2026-01-08T09:45:00Z',
        topics: [
            { id: 'topic-101', name: 'Image Classification' },
            { id: 'topic-102', name: 'Object Detection' },
            { id: 'topic-103', name: 'Semantic Segmentation' },
            { id: 'topic-104', name: 'Vision Transformers' },
        ],
        selectedTopics: ['topic-101', 'topic-103', 'topic-104'],
    },
    {
        id: 'inv-003',
        uuid: 'uuid-inv-003',
        conferenceId: 'conf-003',
        conferenceName: 'Neural Information Processing Systems (NeurIPS 2026)',
        conference: {
            id: 'conf-003',
            name: 'Neural Information Processing Systems (NeurIPS 2026)',
            acronym: 'NeurIPS',
            startDate: '2026-12-05',
            endDate: '2026-12-10',
        },
        status: 'PENDING',
        invitationDate: '2026-01-12T11:20:00Z',
        responseDate: null,
        topics: [
            { id: 'topic-201', name: 'Generative Models' },
            { id: 'topic-202', name: 'Federated Learning' },
            { id: 'topic-203', name: 'Privacy-Preserving ML' },
            { id: 'topic-204', name: 'Causal Inference' },
            { id: 'topic-205', name: 'Meta-Learning' },
        ],
        selectedTopics: [],
    },
    {
        id: 'inv-004',
        uuid: 'uuid-inv-004',
        conferenceId: 'conf-004',
        conferenceName: 'International Conference on Learning Representations (ICLR 2026)',
        conference: {
            id: 'conf-004',
            name: 'International Conference on Learning Representations (ICLR 2026)',
            acronym: 'ICLR',
            startDate: '2026-04-24',
            endDate: '2026-04-28',
        },
        status: 'ACCEPTED',
        invitationDate: '2025-11-15T08:00:00Z',
        responseDate: '2025-12-10T16:30:00Z',
        topics: [
            { id: 'topic-301', name: 'Representation Learning' },
            { id: 'topic-302', name: 'Graph Neural Networks' },
            { id: 'topic-303', name: 'Self-Supervised Learning' },
        ],
        selectedTopics: ['topic-301', 'topic-303'],
    },
    {
        id: 'inv-005',
        uuid: 'uuid-inv-005',
        conferenceId: 'conf-005',
        conferenceName: 'European Conference on Machine Learning (ECML 2026)',
        conference: {
            id: 'conf-005',
            name: 'European Conference on Machine Learning (ECML 2026)',
            acronym: 'ECML',
            startDate: '2026-09-14',
            endDate: '2026-09-18',
        },
        status: 'REJECTED',
        invitationDate: '2025-10-01T13:45:00Z',
        responseDate: '2025-10-15T10:20:00Z',
        topics: [
            { id: 'topic-401', name: 'Machine Learning' },
            { id: 'topic-402', name: 'Data Mining' },
            { id: 'topic-403', name: 'Neural Networks' },
        ],
        selectedTopics: [],
    },
];

// ============================================================================
// SUBMITTED REVIEWS - Các đánh giá đã gửi
// ============================================================================
export const mockSubmittedReviews = [
    {
        id: 'review-001',
        assignmentId: 'assign-001',
        submissionTitle: 'Deep Learning for Natural Language Processing: A Comprehensive Survey',
        conferenceName: 'ICML 2026',
        score: 8.5,
        recommendation: 'ACCEPT',
        strengths: 'Comprehensive survey covering recent advances in deep learning for NLP. Well-structured paper with clear explanations of transformer architectures and attention mechanisms. Excellent coverage of practical applications.',
        weaknesses: 'Limited discussion of computational efficiency and scalability issues. Could benefit from more recent developments in prompt-based learning and few-shot adaptation.',
        comments: 'This is a well-written survey that provides a thorough overview of deep learning techniques in NLP. The paper effectively synthesizes recent advances and provides clear insights into the field. The discussion on transformer models and their variants is particularly valuable. However, the paper would benefit from more discussion on the environmental impact of training large models and strategies for efficient deployment.',
        confidentialRemarks: 'Author appears to be from leading NLP lab. Recommend acceptance.',
        paperAuthors: 'John Smith, Jane Doe, Robert Johnson, Emily Chen',
        submittedDate: '2026-01-15T14:30:00Z',
    },
    {
        id: 'review-002',
        assignmentId: 'assign-002',
        submissionTitle: 'Efficient Attention Mechanisms for Vision Transformers',
        conferenceName: 'CVPR 2026',
        score: 7.0,
        recommendation: 'MINOR_REVISION',
        strengths: 'Novel approach to reducing computational complexity of vision transformers. Comprehensive experimental evaluation across multiple tasks. Good comparison with existing methods.',
        weaknesses: 'Limited theoretical justification for the proposed attention mechanism. Some experimental details are missing. Need more analysis on memory consumption.',
        comments: 'The paper proposes an interesting approach to addressing the computational efficiency of vision transformers. The experimental results are promising, showing improvements on image classification, object detection, and semantic segmentation tasks. However, the theoretical foundations of the method need strengthening, and some implementation details should be clarified. The authors should also provide more detailed analysis of memory consumption and computational costs.',
        confidentialRemarks: 'Good technical work but needs revision. Could be a solid contribution after addressing comments.',
        paperAuthors: 'Maria Garcia, Carlos Rodriguez, Sofia Martinez',
        submittedDate: '2026-01-10T09:15:00Z',
    },
    {
        id: 'review-003',
        assignmentId: 'assign-003',
        submissionTitle: 'Federated Learning for Privacy-Preserving Machine Learning',
        conferenceName: 'NeurIPS 2026',
        score: 8.0,
        recommendation: 'ACCEPT',
        strengths: 'Important topic addressing privacy concerns in ML. Novel framework combining federated learning with differential privacy. Real-world evaluation on healthcare and financial datasets demonstrates practical applicability.',
        weaknesses: 'Communication cost analysis could be more thorough. Limited comparison with other privacy-preserving approaches. Scalability to very large networks needs discussion.',
        comments: 'This paper addresses an important challenge in machine learning: training models on sensitive data while preserving privacy. The proposed federated learning framework with differential privacy guarantees is well-designed and the evaluation on real-world datasets is convincing. The work makes solid contributions to both federated learning and privacy-preserving machine learning communities.',
        confidentialRemarks: 'Well-executed research. Clear accept.',
        paperAuthors: 'Alex Wang, Lisa Park, Michael Zhang, Rachel White',
        submittedDate: '2026-01-08T11:45:00Z',
    },
    {
        id: 'review-004',
        assignmentId: 'assign-004',
        submissionTitle: 'Graph Neural Networks for Knowledge Graph Completion',
        conferenceName: 'ICLR 2026',
        score: 6.5,
        recommendation: 'MAJOR_REVISION',
        strengths: 'Addresses important problem of incomplete knowledge graphs. Leverages both structure and entity attributes. Strong experimental results on standard benchmarks.',
        weaknesses: 'Limited novelty over existing GNN approaches. Insufficient analysis of why the method works. Scalability to large knowledge graphs not demonstrated. Writing clarity could be improved.',
        comments: 'While the paper tackles an important problem and shows good experimental results, the technical novelty is somewhat limited. The proposed GNN approach for knowledge graph completion builds on existing ideas without sufficient innovation. The paper would benefit from deeper analysis of the method, including ablation studies and failure case analysis. Scalability demonstrations on larger knowledge graphs would strengthen the contribution.',
        confidentialRemarks: 'Needs significant revision. Consider desk rejection if authors cannot address major concerns.',
        paperAuthors: 'Nguyen Tuan Anh, Pham Thi Minh, Tran Van Hoang',
        submittedDate: '2026-01-05T16:20:00Z',
    },
    {
        id: 'review-005',
        assignmentId: 'assign-005',
        submissionTitle: 'Multimodal Learning: Fusion of Vision and Language Models',
        conferenceName: 'ICML 2026',
        score: 7.5,
        recommendation: 'ACCEPT',
        strengths: 'Timely work on multimodal fusion strategies. Novel approach to integrating vision and language information. Good experimental validation on multiple benchmarks.',
        weaknesses: 'Some design choices not well justified. Computational efficiency not thoroughly analyzed. Limited discussion on failure cases.',
        comments: 'This paper addresses the important problem of effectively fusing vision and language models for multimodal understanding tasks. The proposed fusion mechanism is interesting and shows good performance on image captioning, VQA, and scene understanding tasks. The work contributes to the growing field of multimodal learning and demonstrates practical benefits.',
        confidentialRemarks: 'Solid work deserving publication.',
        paperAuthors: 'Lisa Anderson, David Brown, Jennifer Davis, Thomas Anderson',
        submittedDate: '2026-01-12T13:00:00Z',
    },
    {
        id: 'review-006',
        assignmentId: 'assign-006',
        submissionTitle: 'Self-Supervised Learning in Computer Vision: A Review',
        conferenceName: 'CVPR 2026',
        score: 8.2,
        recommendation: 'ACCEPT',
        strengths: 'Comprehensive survey of self-supervised learning methods. Excellent organization and presentation. Covers recent advances including contrastive learning and masked image modeling. Valuable insights for practitioners.',
        weaknesses: 'Limited discussion of theoretical foundations. Could include more comparison of computational costs across methods.',
        comments: 'This is a well-executed survey of self-supervised learning in computer vision. The paper provides comprehensive coverage of recent methods, from contrastive learning approaches like SimCLR and MoCo, to masked image modeling with MAE. The organization is clear and the paper would be valuable for researchers seeking to understand the landscape of self-supervised learning.',
        confidentialRemarks: 'Good survey paper. Recommend acceptance.',
        paperAuthors: 'James Wilson, Patricia Taylor, Christopher Lee',
        submittedDate: '2026-01-18T10:30:00Z',
    },
];

// ============================================================================
// REVIEWER DASHBOARD STATS
// ============================================================================
export const mockDashboardStats = {
    totalAssignments: 6,
    completedReviews: 4,
    pendingReviews: 2,
    acceptedInvitations: 2,
    totalInvitations: 5,
    rejectedInvitations: 1,
};

// ============================================================================
// REVIEWER PROFILE
// ============================================================================
export const mockReviewerProfile = {
    id: 'reviewer-001',
    userId: 12345,
    fullName: 'Dr. Alexander Johnson',
    email: 'alexander.johnson@university.edu',
    institution: 'University of Technology',
    department: 'Computer Science',
    bio: 'Machine learning researcher with expertise in deep learning, computer vision, and natural language processing. Published over 50 papers in top-tier conferences.',
    profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alexander',
    expertiseAreas: [
        'Deep Learning',
        'Natural Language Processing',
        'Computer Vision',
        'Transformers',
        'Attention Mechanisms',
        'Generative Models',
        'Self-Supervised Learning',
        'Multimodal Learning',
        'Federated Learning',
        'Graph Neural Networks',
        'Reinforcement Learning',
        'Efficient Neural Networks',
        'Neural Architecture Search',
        'Knowledge Graphs',
        'Semantic Web',
    ],
    researchInterests: 'Deep Learning, Neural Architecture Design, Efficient ML',
    h_index: 28,
    citationCount: 3500,
    yearsActive: 15,
};

// ============================================================================
// EXPORT ALL MOCK DATA
// ============================================================================
export const mockReviewerData = {
    assignments: mockAssignments,
    invitations: mockInvitations,
    submittedReviews: mockSubmittedReviews,
    dashboardStats: mockDashboardStats,
    reviewerProfile: mockReviewerProfile,
};

export default mockReviewerData;
