import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { SubmissionFile } from './submission-file.entity';

@Entity({ name: 'submissions' })
@Index(['conference_id'])
@Index(['conference_id', 'status'])
export class Submission {
  @PrimaryColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar' })
  conference_id!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  abstract?: string;

  @Column({ type: 'varchar' })
  topic!: string;

  @Column({ type: 'varchar', default: 'SUBMITTED' })
  status!: string; // SUBMITTED, ACCEPTED, REJECTED, etc.

  @Column({ type: 'int', nullable: true })
  created_by?: number; // Author ID

  @OneToMany(() => SubmissionFile, (file) => file.submission, {
    cascade: true,
    eager: true,
  })
  files!: SubmissionFile[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
