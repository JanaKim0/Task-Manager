import { Module } from '@nestjs/common';
import { DeadlinesService } from './deadlines.service';

// No controller: nothing here is an endpoint of its own. The workspace and
// project lists ask it a question while building their own responses.
@Module({
  providers: [DeadlinesService],
  exports: [DeadlinesService],
})
export class DeadlinesModule {}
