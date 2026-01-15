import { IsArray, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTopicsDto {
  @ApiProperty({ 
    description: 'Chuyên môn của reviewer (mảng các chuỗi)',
    example: ['AI', 'Machine Learning', 'Deep Learning'],
    type: [String],
    isArray: true
  })
  @IsArray({ message: 'Topics must be an array' })
  @ArrayMinSize(0, { message: 'Topics must be an array' })
  @IsString({ each: true, message: 'Each topic must be a string' })
  topics!: string[]; // Chuyên môn của reviewer
}
