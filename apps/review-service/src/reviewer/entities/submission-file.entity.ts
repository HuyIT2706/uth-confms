import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Submission } from './submission.entity';

@Entity({ name: 'submission_files' })
export class SubmissionFile {
  @PrimaryColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'int' })
  submission_id!: number;

  @Column({ type: 'varchar' })
  file_path!: string;

  @Column({ type: 'int' })
  version!: number;

  @ManyToOne(() => Submission, (submission) => submission.files)
  @JoinColumn({ name: 'submission_id', referencedColumnName: 'id' })
  submission!: Submission;

  @CreateDateColumn({ type: 'timestamptz' })
  uploaded_at!: Date;
}
