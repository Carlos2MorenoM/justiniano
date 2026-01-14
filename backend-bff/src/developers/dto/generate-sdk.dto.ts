import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSdkDto {
  @ApiProperty({
    description: 'Target programming language for the generated SDK',
    example: 'python',
    enum: ['python', 'node'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['python', 'node', 'go', 'java', 'php'])
  language: 'python' | 'node' | 'go' | 'java' | 'php';
}
