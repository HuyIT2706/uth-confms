import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { ReviewerAssignment } from './reviewer-assignment.entity';
import { ReviewHistory } from './review-history.entity';

@Entity({ name: 'reviews' })
export class Review {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // Link to the assignment (which contains reviewerId and submissionId)
    @Column({ type: 'varchar' })
    conferenceAssignmentId!: string;

    // FK relation for easier joins if needed, logic primarily uses conferenceAssignmentId
    @OneToOne(() => ReviewerAssignment)
    @JoinColumn({ name: 'conferenceAssignmentId', referencedColumnName: 'conferenceAssignmentId' })
    assignment!: ReviewerAssignment;

    // Score 0-10
    @Column({ type: 'int' })
    score!: number;

    // Nhận xét cho tác giả (public to author)
    @Column({ type: 'text' })
    content!: string;

    // Nhận xét nội bộ (internal discussion)
    @Column({ type: 'text', nullable: true })
    internalContent?: string;

    @Column({ type: 'boolean', default: true })
    isFinal!: boolean; // Flag to indicate if this is a submitted review or draft (future proofing)

    @OneToMany(() => ReviewHistory, (history) => history.review)
    history!: ReviewHistory[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
}
