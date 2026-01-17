import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Review } from './review.entity';

@Entity({ name: 'review_history' })
export class ReviewHistory {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    reviewId!: string;

    @ManyToOne(() => Review, (review) => review.history)
    @JoinColumn({ name: 'reviewId' })
    review!: Review;

    @Column({ type: 'int' })
    score!: number;

    @Column({ type: 'text' })
    content!: string;

    @Column({ type: 'text', nullable: true })
    internalContent?: string;

    @CreateDateColumn({ type: 'timestamptz' })
    changedAt!: Date;
}
