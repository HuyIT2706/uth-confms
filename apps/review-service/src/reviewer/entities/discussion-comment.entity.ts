import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Submission } from './submission.entity';

@Entity({ name: 'discussion_comments' })
@Index(['submission_id', 'created_at'])
@Index(['reviewer_id', 'submission_id'])
export class DiscussionComment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Bài nộp đang thảo luận
  @Column({ type: 'int' })
  submission_id!: number;

  @ManyToOne(() => Submission)
  @JoinColumn({ name: 'submission_id', referencedColumnName: 'id' })
  submission!: Submission;

  // Reviewer tham gia thảo luận
  @Column({ type: 'int' })
  reviewer_id!: number;

  // Nội dung bình luận
  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
