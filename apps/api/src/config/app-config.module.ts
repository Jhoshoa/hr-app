import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { configuration } from "./configuration";
import { validateEnv } from "./env.schema";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env", "../../.env.example"],
      load: [configuration],
      validate: validateEnv
    })
  ]
})
export class AppConfigModule {}
