# Hướng dẫn tích hợp với Conference-Service

## 1. Xóa Invitation

Khi chair xóa invitation ở conference-service, cần notify review-service để xóa invitation tương ứng.

### Cách thêm vào conference-service:

Trong file `apps/conference-service/src/invitations/invitations.service.ts`, sửa method `removeInvitation`:

```typescript
async removeInvitation(invitationId: string, chairId: number) {
  const invitation = await this.invitationRepo.findOne({
    where: { id: invitationId },
    relations: ['conference'],
  });
  if (!invitation) throw new NotFoundException('Invitation not found');
  if (invitation.conference.chairId !== chairId) throw new ForbiddenException('Only chair can remove');

  await this.invitationRepo.remove(invitation);
  await this.auditService.log('REMOVE_INVITATION', chairId, 'Invitation', invitationId);

  // Notify review-service về việc xóa invitation
  try {
    const reviewBase = process.env.REVIEW_SERVICE_URL || 'http://review-service:3000/api';
    const notifyUrl = `${reviewBase}/reviewer/invitations/external/${invitationId}`;
    
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const serviceSecret = process.env.REVIEWER_SERVICE_SECRET;
    if (serviceSecret) {
      headers['x-service-secret'] = serviceSecret;
    }

    // fire-and-forget, don't block chair action on notify failure
    firstValueFrom(this.httpService.delete(notifyUrl, { headers })).catch(err => {
      this.logger.warn(`Failed to notify review-service about invitation deletion ${invitationId}: ${err.message}`);
    });
  } catch (err) {
    this.logger.warn(`Exception notifying review-service about deletion: ${err.message}`);
  }

  return { message: 'Invitation removed' };
}
```

**Lưu ý:** Đảm bảo đã import `HttpService` và `firstValueFrom` trong file này.

## 2. Topics của Reviewer

Review-service đã có API để reviewer khai báo topics (chuyên môn) của mình:
- `PUT /api/reviewer/invitations/:id/topics` - Reviewer khai báo chuyên môn

Khi reviewer update topics, review-service sẽ tự động notify conference-service để cập nhật topics trong invitation của conference-service.

## Endpoints Review-Service cung cấp:

1. **POST /api/reviewer/invitations** - Conference-service gửi invitation tới reviewer
2. **DELETE /api/reviewer/invitations/external/:externalInvitationId** - Conference-service xóa invitation
3. **PUT /api/reviewer/invitations/:id/topics** - Reviewer khai báo chuyên môn (tự động notify conference-service)

## Environment Variables cần thiết:

- `REVIEW_SERVICE_URL` - URL của review-service (mặc định: `http://review-service:3000/api`)
- `REVIEWER_SERVICE_SECRET` - Secret để bảo mật service-to-service calls (optional)
