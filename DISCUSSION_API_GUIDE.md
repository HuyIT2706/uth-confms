# Discussion API Documentation

## Overview
Reviewers cùng được phân công cho một bài nộp có thể tham gia thảo luận nội bộ với nhau.

## Prerequisites
- Reviewer phải **accept** assignment
- Reviewer phải **submit** review (với submission_id)
- Có thể thảo luận về các reviews khác (internal comments)

---

## API Endpoints

### 1. POST `/api/reviewer/assignments/{id}/discussion`
**Thêm bình luận vào thảo luận nội bộ**

Reviewers có thể thêm comment để thảo luận về bài nộp cụ thể với reviewers khác cùng phân công.

**Request:**
```json
{
  "content": "Tôi đồng ý với đánh giá này, phần methodology cần cải thiện"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "reviewerId": "You",
  "content": "Tôi đồng ý với đánh giá này, phần methodology cần cải thiện",
  "createdAt": "2026-01-21T14:20:00.000Z",
  "updatedAt": "2026-01-21T14:20:00.000Z"
}
```

---

### 2. GET `/api/reviewer/assignments/{id}/discussion/comments`
**Lấy tất cả comments của thảo luận nội bộ**

Lấy danh sách tất cả bình luận từ các reviewers khác cho cùng submission, reviewers ẩn danh.

**Response (200):**
```json
[
  {
    "id": "uuid1",
    "reviewerId": "You",
    "content": "Nội dung bình luận của tôi",
    "createdAt": "2026-01-21T14:20:00.000Z",
    "updatedAt": "2026-01-21T14:20:00.000Z"
  },
  {
    "id": "uuid2",
    "reviewerId": "Reviewer #2",
    "content": "Nội dung bình luận từ reviewer khác",
    "createdAt": "2026-01-21T14:21:00.000Z",
    "updatedAt": "2026-01-21T14:21:00.000Z"
  }
]
```

---

### 3. GET `/api/reviewer/assignments/{id}/discussion`
**Lấy thảo luận nội bộ (reviews khác)**

Lấy danh sách các reviews từ reviewers khác cùng submission (ẩn tên reviewer).

**Response (200):**
```json
[
  {
    "reviewerId": "Reviewer #2",
    "score": 7,
    "content": "Bài báo tốt nhưng...",
    "internalContent": "Recommend để accept với minor revisions",
    "updatedAt": "2026-01-21T14:19:00.000Z"
  },
  {
    "reviewerId": "Reviewer #3",
    "score": 8,
    "content": "Excellent work...",
    "internalContent": "Strong accept",
    "updatedAt": "2026-01-21T14:18:00.000Z"
  }
]
```

---

## Database Schema

### discussion_comments Table
```sql
CREATE TABLE discussion_comments (
  id UUID PRIMARY KEY,
  submission_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (submission_id) REFERENCES submissions(id)
);

CREATE INDEX idx_discussion_submission_created 
  ON discussion_comments(submission_id, created_at);
CREATE INDEX idx_discussion_reviewer_submission 
  ON discussion_comments(reviewer_id, submission_id);
```

---

## Use Cases

### Case 1: Reviewer thêm comment
```bash
curl -X POST http://localhost:3004/api/reviewer/assignments/{id}/discussion \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Tôi đồng ý với điểm này, paper cần cải thiện methodology"
  }'
```

### Case 2: Reviewer xem comments khác
```bash
curl http://localhost:3004/api/reviewer/assignments/{id}/discussion/comments \
  -H "Authorization: Bearer {token}"
```

### Case 3: Reviewer xem internal reviews khác
```bash
curl http://localhost:3004/api/reviewer/assignments/{id}/discussion \
  -H "Authorization: Bearer {token}"
```

---

## Error Handling

| Error | Status | Message |
|-------|--------|---------|
| Not assigned | 403 | "You are not assigned to this paper" |
| Not accepted | 403 | "You must accept the assignment to participate in discussion" |
| No review | 400 | "You must submit a review before participating in discussion" |
| Unauthorized | 401 | Invalid/missing token |

