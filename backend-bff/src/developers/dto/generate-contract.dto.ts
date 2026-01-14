import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateContractDto {
    @ApiProperty({
        description: 'Target programming language for the generated Pact test',
        example: 'node',
        enum: ['python', 'node', 'go', 'java', 'php'],
    })
    @IsString()
    @IsNotEmpty()
    @IsIn(['python', 'node', 'go', 'java', 'php'])
    language: 'python' | 'node' | 'go' | 'java' | 'php';
}
