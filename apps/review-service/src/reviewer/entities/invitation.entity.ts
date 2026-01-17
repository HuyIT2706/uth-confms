import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type InvitationStatus = 'pending' | 'accepted' | 'rejected';

@Entity({ name: 'invitations' })
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // id của conference (UUID)
  @Column({ type: 'varchar' })
  conferenceId!: string;

  // id lời mời từ conference-service (nếu có)
  @Column({ type: 'varchar', nullable: true })
  externalInvitationId?: string;

  // Thông tin hội nghị để hiển thị cho reviewer
  @Column({ type: 'varchar', nullable: true })
  conferenceName?: string;

  @Column({ type: 'varchar', nullable: true })
  acronym?: string;

  @Column({ type: 'text', nullable: true })
  conferenceDescription?: string;

  @Column({ type: 'date', nullable: true })
  startDate?: string;

  @Column({ type: 'date', nullable: true })
  endDate?: string;

  @Column({ type: 'jsonb', nullable: true })
  topics?: string[]; // Topics của hội nghị (từ conference-service)

  @Column({ type: 'jsonb', nullable: true })
  reviewerTopics?: string[]; // Chuyên môn của reviewer (reviewer tự khai báo)

  @Column({ type: 'jsonb', nullable: true })
  deadlines?: any;

  @Column({ type: 'int', nullable: true })
  chairId?: number;

  @Column({ type: 'int' })
  reviewerId!: number;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: InvitationStatus;

  @Column({ type: 'jsonb', nullable: true })
  raw?: any;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}