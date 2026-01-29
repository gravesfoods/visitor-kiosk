import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'visitor_logs' })
export class VisitorLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  first_name!: string;

  @Column({ type: 'text' })
  last_name!: string;

  @Column({ type: 'text' })
  full_name!: string;

  @Column({ type: 'text' })
  reason_for_visit!: string;

  @Column({ type: 'text', nullable: true })
  host_name!: string | null;

  @Column({ type: 'text', nullable: true })
  host_email!: string | null;

  // base64 for now (same as current app); can switch to object storage later
  @Column({ type: 'text', nullable: true })
  photo_url!: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  check_in_time!: Date;

  @Column({ type: 'boolean', default: false })
  badge_printed!: boolean;

  @Column({ type: 'boolean', default: false })
  notification_sent!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @Column({ type: 'text', name: 'badge_code', unique: true, nullable: true })
  badge_code!: string | null;

  @Column({ type: 'timestamptz', name: 'check_out_time', nullable: true })
  check_out_time!: Date | null;

}
