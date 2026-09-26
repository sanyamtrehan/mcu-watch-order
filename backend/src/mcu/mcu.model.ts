import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'catalog_items' })
export class Mcu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'release_date', type: 'date' })
  releaseDate: Date;
}
