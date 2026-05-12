import { Global, Module } from "@nestjs/common";
import { EVENT_BUS } from "./event-bus.port";
import { InMemoryEventBusAdapter } from "./in-memory-event-bus.adapter";

@Global()
@Module({
  providers: [
    {
      provide: EVENT_BUS,
      useClass: InMemoryEventBusAdapter
    }
  ],
  exports: [EVENT_BUS]
})
export class InMemoryEventBusModule {}
