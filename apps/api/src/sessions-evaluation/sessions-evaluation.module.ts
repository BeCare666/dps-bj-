import { Module } from "@nestjs/common";
import { SessionsEvaluationService } from "./sessions-evaluation.service.js";
import { SessionsEvaluationController } from "./sessions-evaluation.controller.js";

@Module({
  controllers: [SessionsEvaluationController],
  providers: [SessionsEvaluationService],
})
export class SessionsEvaluationModule {}
