import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('conversations')
@Index(['participant1Id', 'participant2Id'], { unique: true })
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'participant1_id' })
  participant1Id: number;

  @Column({ name: 'participant2_id' })
  participant2Id: number;

  @Column({ name: 'last_message_at', nullable: true })
  lastMessageAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant1_id' })
  participant1: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant2_id' })
  participant2: User;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
}


