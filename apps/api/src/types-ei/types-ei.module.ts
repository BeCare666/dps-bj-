import { Module } from "@nestjs/common";
import { TypesEiService } from "./types-ei.service.js";
import { TypesEiController } from "./types-ei.controller.js";

@Module({
  controllers: [TypesEiController],
  providers: [TypesEiService],
  exports: [TypesEiService],
})
export class TypesEiModule {}
