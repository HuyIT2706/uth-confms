import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ReviewerAssignmentStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity({ name: 'reviewer_assignments' })
@Index(['conferenceId', 'reviewerId'])
@Index(['submissionId', 'reviewerId'])
export class ReviewerAssignment {
  // ID của assignment từ conference-service (primary key)
  @PrimaryColumn({ type: 'varchar' })
  conferenceAssignmentId!: string;

  // ID của hội nghị (UUID từ conference-service)
  @Column({ type: 'varchar' })
  conferenceId!: string;

  // ID của bài báo được phân công (từ submission-service)
  @Column({ type: 'varchar', nullable: true })
  submissionId?: string;

  // ID của reviewer (user ID từ identity-service)
  @Column({ type: 'int' })
  reviewerId!: number;

  // Trạng thái phân công: pending, accepted, rejected
  @Column({ type: 'enum', enum: ReviewerAssignmentStatus, default: ReviewerAssignmentStatus.PENDING })
  status!: ReviewerAssignmentStatus;

  // Topic mà bài báo thuộc về (để không tiết lộ tên tác giả)
  @Column({ type: 'varchar', nullable: true })
  topic?: string;

  // Thông tin bài báo (không bao gồm tác giả)
  @Column({ type: 'jsonb', nullable: true })
  submissionInfo?: {
    title?: string;
    abstract?: string;
    keywords?: string[];
  };

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
