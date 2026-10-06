import { Module } from "@nestjs/common";
import { IfuService } from "./ifu.service.js";

@Module({
  providers: [IfuService],
  exports: [IfuService],
})
export class IfuModule {}
