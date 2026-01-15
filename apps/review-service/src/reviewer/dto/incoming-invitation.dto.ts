export class IncomingInvitationDto {
  // id hội nghị
  conferenceId!: string;

  // id lời mời từ bên conference-service (invitationId)
  externalInvitationId?: string;

  // các trường chi tiết hội nghị để lưu vào bảng và hiển thị
  conferenceName?: string;
  acronym?: string;
  conferenceDescription?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  topics?: string[];  // ví dụ ["AI"]
  deadlines?: any;    // object deadlines

  // reviewer/chair
  reviewerId!: number;
  chairId?: number;

  message?: string;
  raw?: any;
}
